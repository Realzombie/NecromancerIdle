import {
  UNITS, STATS, SPECIALS, SPECIAL_KEYS, ZONES, TUNING, NECRO_TIERS, PLAYER_UNITS, necroTier, owned, level, statCost,
  playerRating, zoneById, hasSpecial, specialReady, REGIONS,
  PERKS, PERK_KEYS, perk, perkCost, essenceGain, worldMul, canRebirth, REBIRTH_MIN_ZONE, offlineCapHours, spellCooldown,
} from './data.js';
import { Battle, zoneUnlocked, buyPerk, rebirth } from './sim.js';
import { createWeb } from './web.js';
import { draw, drawIdle, drawVictory, iconCanvas } from './render.js';
import { loadSave, writeSave, resetSave } from './save.js';
import { unlock, play, isMuted, setMuted, isMusicOn, setMusic } from './audio.js';
import { createArmoury } from './armoury.js';
import { checkAchievements, rewardText } from './records.js';
import { RARITIES, rarityIndex, rollDrops, equipIfBetter } from './gear.js';

const $ = (id) => document.getElementById(id);
const app = $('app');
const canvas = $('field');
const g = canvas.getContext('2d');
g.imageSmoothingEnabled = false;

const save = loadSave();
let battle = null;
let victory = null;   // celebration state while a cleared zone plays its animation
let speed = 1;
let idleTime = 0;
let homeNote = '';
let lastFirstClear = false;
let lastZone = 1;
let autoOn = false;
let autoTimer = null;
let paused = false;

function fitUi() { app.style.setProperty('--u', app.clientHeight / 540 + 'px'); }
window.addEventListener('resize', fitUi);
fitUi();

const SCREENS = ['screen-home', 'screen-map', 'screen-tree', 'screen-armoury', 'screen-rebirth', 'screen-result'];
function show(id) {
  for (const s of SCREENS) $(s).classList.toggle('hidden', s !== id);
  $('hud').classList.toggle('hidden', id !== null);
  $('btn-spell').classList.toggle('hidden', id !== null);
}

// ---- Offline souls: based on the highest zone cleared, capped. Never advances zones. ----
function claimOffline() {
  if (battle || save.bestZone < 1) return;
  const secs = Math.min((Date.now() - save.lastSeen) / 1000, offlineCapHours(save) * 3600);
  if (secs < TUNING.offlineMinSeconds) return;
  const gained = Math.floor((secs / 60) * TUNING.offlineSoulsPerMin * Math.pow(save.bestZone, TUNING.offlineExp) * (1 + 0.25 * perk(save, 'restless')));
  save.souls += gained;
  let found = 0;
  if (secs >= 1800) {
    // Long absences also turn up some gear (up to three pieces).
    const drops = rollDrops(save, Math.random, Math.max(1, save.bestZone), { cleared: false, count: Math.min(3, Math.floor(secs / 3600) || 1) });
    for (const it of drops) equipIfBetter(save, it);
    found = drops.length;
  }
  writeSave(save);
  const h = Math.floor(secs / 3600), mnt = Math.floor((secs % 3600) / 60);
  homeNote = `Welcome back! Your horde gathered ${gained} souls in ${h ? h + 'h ' : ''}${mnt}m away.` + (found ? ` They also dragged back ${found} piece${found > 1 ? 's' : ''} of gear.` : '');
}

function setBanks() {
  $('home-souls').textContent = Math.floor(save.souls);
  $('home-champ').textContent = save.champSouls;
  for (const el of document.querySelectorAll('.b-souls')) el.textContent = Math.floor(save.souls);
  for (const el of document.querySelectorAll('.b-champ')) el.textContent = save.champSouls;
  for (const el of document.querySelectorAll('.b-ess')) el.textContent = save.essence || 0;
}

// Is there anything worth buying in the tree right now?
function treeAvailable() {
  let n = 0;
  for (const u of PLAYER_UNITS) {
    if (!owned(save, u)) { if (save.champSouls >= UNITS[u].unlockCost) n++; continue; }
    for (const s of Object.keys(STATS)) {
      const l = level(save, s, u);
      if (l < STATS[s].max && save.souls >= statCost(s, u, l)) n++;
    }
  }
  for (const k of SPECIAL_KEYS) if (!hasSpecial(save, k) && specialReady(save, k) && save.souls >= SPECIALS[k].cost) n++;
  return n;
}

// ---- Home ----
function renderHome() {
  setBanks();
  $('home-rank').textContent = NECRO_TIERS[necroTier(save)].name + (save.rebirths ? ' (Reborn x' + save.rebirths + ')' : '');
  const gain = essenceGain(save);
  $('rebirth-badge').textContent = '+' + gain;
  $('rebirth-badge').classList.toggle('hidden', !canRebirth(save));
  $('home-power').textContent = playerRating(save);
  $('home-note').textContent = homeNote;
  const n = treeAvailable();
  $('tree-badge').textContent = n;
  $('tree-badge').classList.toggle('hidden', n === 0);
  const fresh = (save.gear || []).filter((g) => g.isNew).length;
  $('arm-badge').textContent = fresh;
  $('arm-badge').classList.toggle('hidden', fresh === 0);
  const next = ZONES.find((z) => !save.cleared[z.id] && !z.endless);
  $('home-hint').textContent = next ? `Next target: ${next.name}` : `Every zone is yours. Push your record in the Endless Crypt (best wave ${save.bestEndless || 0}) or rebirth to grow stronger.`;
}

function goHome() {
  clearTimeout(autoTimer);
  setAuto(false);
  battle = null;
  renderHome();
  show('screen-home');
}

// ---- Zone map ----
let mapRegion = 1;
function renderMap() {
  setBanks();
  // Region tabs: a region opens once the zone before it is cleared.
  const tabs = $('region-tabs');
  tabs.innerHTML = '';
  for (const r of REGIONS) {
    const isOpen = zoneUnlocked(save, r.zones[0]);
    const t = document.createElement('button');
    t.className = 'tab' + (r.id === mapRegion ? ' on' : '') + (isOpen ? '' : ' locked');
    t.textContent = isOpen ? r.name : r.name + ' (locked)';
    t.disabled = !isOpen;
    t.onclick = () => { mapRegion = r.id; renderMap(); };
    tabs.appendChild(t);
  }
  const region = REGIONS.find((r) => r.id === mapRegion);
  $('map-title').textContent = region.name;
  const box = $('zones');
  box.innerHTML = '';
  const mine = playerRating(save);
  const wm = worldMul(save);
  for (const zid of region.zones) {
    const z = zoneById(zid);
    const unlocked = zoneUnlocked(save, z.id);
    const cleared = !!save.cleared[z.id];
    const boss = z.boss && UNITS[z.boss];
    const need = Math.round(z.rating * wm.rating);
    const diff = mine >= need ? 'ok' : mine >= need * 0.7 ? 'hard' : 'wall';
    const el = document.createElement('div');
    el.className = 'zone' + (cleared ? ' cleared' : '') + (unlocked ? '' : ' locked');
    el.innerHTML =
      `<div class="znum">${cleared ? '&#10003;' : z.id}</div>` +
      `<div class="zname">${z.name}</div>` +
      `<div class="zblurb">${unlocked ? z.blurb : 'Locked: clear the previous zone'}</div>` +
      (z.endless
        ? `<div class="zrate ok">Best: wave ${save.bestEndless || 0}</div><div class="zboss">No boss, no end. New record waves pay essence, gear and a champion soul every 10 waves.</div>`
        : `<div class="zrate ${unlocked ? diff : ''}">Rating ${need} <small>(you ${mine})</small></div>` +
          `<div class="zboss">Boss: ${boss.name}<br><span class="ico2">&#9819;</span> ${cleared ? 'Champion soul (25% chance)' : 'Champion soul'}</div>`);
    const b = document.createElement('button');
    b.className = 'big';
    b.textContent = z.endless ? 'Enter' : cleared ? 'Replay' : 'Fight';
    b.disabled = !unlocked;
    b.onclick = () => startBattle(z.id);
    el.appendChild(b);
    box.appendChild(el);
  }
}

// ---- Rebirth ----
let rebirthArmed = null;
function disarmRebirth() { clearTimeout(rebirthArmed); rebirthArmed = null; renderRebirth(); }
function renderRebirth() {
  setBanks();
  const ok = canRebirth(save);
  const gain = essenceGain(save);
  $('rb-text').innerHTML =
    '<div>Rebirths so far: <b>' + (save.rebirths || 0) + '</b></div>' +
    (ok
      ? '<div>Rebirthing now pays <b>&#9672; ' + gain + '</b> essence.</div><div>You lose your souls, champion souls, skill tree and cleared zones, and keep your perks and essence.</div>'
      : '<div>Clear zone ' + REBIRTH_MIN_ZONE + ' to unlock Rebirth.</div><div>Essence is earned from the zones you have cleared and the upgrades you hold.</div>');
  const go = $('btn-rebirth-go');
  go.disabled = !ok;
  go.classList.toggle('armed', !!rebirthArmed);
  go.textContent = rebirthArmed ? 'Tap again to rebirth' : 'Rebirth';
  const box = $('perks');
  box.innerHTML = '';
  for (const key of PERK_KEYS) {
    const P = PERKS[key];
    const lvl = perk(save, key);
    const maxed = lvl >= P.max;
    const cost = perkCost(key, lvl);
    const can = !maxed && (save.essence || 0) >= cost;
    const el = document.createElement('button');
    el.className = 'perk' + (can ? ' can' : '') + (maxed ? ' maxed' : '');
    el.disabled = !can;
    el.appendChild(iconCanvas(P.icon));
    el.insertAdjacentHTML('beforeend',
      '<div class="pname">' + P.name + '</div><div class="plvl">' + lvl + '/' + P.max + '</div>' +
      '<div class="peff">' + P.effect(lvl) + (maxed ? '' : '<br>Next: ' + P.effect(lvl + 1)) + '</div>' +
      '<div class="pcost">' + (maxed ? 'MAX' : '<span class="ico3">&#9672;</span> ' + cost) + '</div>');
    el.onclick = () => { if (buyPerk(save, key)) { play('buy'); writeSave(save); renderRebirth(); } };
    box.appendChild(el);
  }
}
$('btn-rebirth-go').onclick = () => {
  if (!canRebirth(save)) return;
  if (!rebirthArmed) { rebirthArmed = setTimeout(disarmRebirth, 4000); renderRebirth(); return; }
  clearTimeout(rebirthArmed); rebirthArmed = null;
  const gain = rebirth(save);
  writeSave(save);
  play('win');
  homeNote = 'You rise again, reborn. +' + gain + ' essence.';
  goHome();
};
$('btn-rebirth').onclick = () => { rebirthArmed = null; renderRebirth(); show('screen-rebirth'); };

// ---- Battle ----
function setPaused(p) {
  paused = p;
  $('btn-pause').textContent = p ? 'Resume' : 'Pause';
  $('btn-pause').classList.toggle('on', p);
}
function startBattle(zoneId) {
  setPaused(false);
  clearTimeout(autoTimer);
  lastZone = zoneId;
  victory = null;
  battle = new Battle(save, zoneId);
  lastFirstClear = false;
  speed = 1;
  $('btn-speed').textContent = '1x';
  $('hud-zone').textContent = zoneById(zoneId).name;
  show(null);
}

function endBattle() {
  const fresh = checkAchievements(save);
  writeSave(save);
  const won = battle.result === 'clear';
  const E = battle.endless;
  $('result-title').textContent = E ? 'The Crypt claims you' : won ? 'Zone Cleared!' : 'Your horde has fallen';
  let text;
  if (won) {
    text = `${UNITS[battle.zone.boss].name} is dead and ${battle.zone.name} is yours. +${battle.payout} souls banked.`;
    if (battle.champDrop) text += ' The boss dropped a champion soul. Spend it in the skill tree!';
  } else {
    text = `The living chased you off. +${battle.payout} souls banked from ${battle.kills} kills.`;
  }
  if (E) {
    text = `You survived ${E.waves} wave${E.waves === 1 ? '' : 's'}` + (E.record ? ` (a new record, was ${E.prev})` : ` (best ${E.prev})`) + `. +${battle.payout} souls banked.`;
    if (E.essence) text += ` +${E.essence} essence.`;
    if (E.champ) text += ` +${E.champ} champion soul${E.champ > 1 ? 's' : ''}.`;
  }
  $('result-text').textContent = text;
  const extra = $('result-extra');
  extra.innerHTML = '';
  let best = -1;
  for (const it of battle.drops || []) {
    best = Math.max(best, rarityIndex(it.rarity));
    const chip = document.createElement('div');
    chip.className = 'rchip';
    chip.style.setProperty('--rc', RARITIES[rarityIndex(it.rarity)].color);
    chip.appendChild(iconCanvas('gear_' + it.slot));
    chip.insertAdjacentHTML('beforeend', '<span>' + it.name + '</span>');
    extra.appendChild(chip);
  }
  for (const a of fresh) extra.insertAdjacentHTML('beforeend', '<div class="rchip achv">&#9733; ' + a.name + ' &middot; ' + rewardText(a.reward) + '</div>');
  if (best >= 2) play('drop');
  if (fresh.length) setTimeout(() => play('ach'), 400);
  show('screen-result');
  if (autoOn) {
    $('result-text').textContent += ' Fighting again in 3 seconds... (Return Home to stop)';
    autoTimer = setTimeout(() => { if (autoOn && battle) startBattle(lastZone); }, 3000);
  }
}

// ---- Toasts and achievements ----
const toastQueue = [];
let toastBusy = false;
function toast(msg) { toastQueue.push(msg); if (!toastBusy) nextToast(); }
function nextToast() {
  const m = toastQueue.shift();
  const el = $('toast');
  if (!m) { toastBusy = false; el.classList.add('hidden'); return; }
  toastBusy = true;
  el.textContent = m;
  el.classList.remove('hidden');
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  setTimeout(nextToast, 3400);
}
// Called after anything the player buys or changes: awards milestones and saves.
function afterChange() {
  const fresh = checkAchievements(save);
  for (const a of fresh) toast('Achievement: ' + a.name + ' (' + rewardText(a.reward) + ')');
  if (fresh.length) play('ach');
  writeSave(save);
  setBanks();
}

function setAuto(on) {
  autoOn = on;
  $('btn-auto').textContent = 'Auto: ' + (on ? 'on' : 'off');
  $('btn-auto').classList.toggle('on', on);
}

// ---- Sound ----
// Browsers only allow audio after a tap, so the first touch unlocks it.
window.addEventListener('pointerdown', unlock);
window.addEventListener('keydown', unlock);
// A click blip for ordinary buttons (tree nodes play their own buy sound).
document.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b && !b.closest('.node') && b.id !== 'btn-mute') play('click');
});
const muteBtn = $('btn-mute');
function paintMute() { muteBtn.textContent = isMuted() ? '\u{1F507}' : '\u{1F50A}'; }
muteBtn.onclick = () => { unlock(); setMuted(!isMuted()); paintMute(); play('click'); };
paintMute();

function drainSounds(b) {
  for (const e of b.events) {
    play(e.n, e);
    if (navigator.vibrate && (e.n === 'boss' || e.n === 'win' || e.n === 'lose')) { try { navigator.vibrate(e.n === 'boss' ? 150 : [80, 60, 160]); } catch (err) { /* ignore */ } }
  }
  b.events.length = 0;
}

// ---- Reset save: two taps so it cannot happen by accident ----
const resetBtn = $('btn-reset');
let resetTimer = null;
function disarmReset() { clearTimeout(resetTimer); resetTimer = null; resetBtn.textContent = 'Reset save'; resetBtn.classList.remove('armed'); }
resetBtn.onclick = () => {
  if (!resetTimer) {
    resetBtn.textContent = 'Tap again to erase everything';
    resetBtn.classList.add('armed');
    resetTimer = setTimeout(disarmReset, 4000);
    return;
  }
  disarmReset();
  resetSave(save);
  writeSave(save);
  homeNote = 'Save reset. A fresh necromancer rises.';
  goHome();
};

const web = createWeb({ save, play, onChange: afterChange });
const armoury = createArmoury({ save, play, onChange: afterChange });

// ---- Wiring ----
$('btn-map').onclick = () => { renderMap(); show('screen-map'); };
$('btn-tree').onclick = () => { setBanks(); show('screen-tree'); web.render(); };
$('btn-arm').onclick = () => { setBanks(); armoury.render(); show('screen-armoury'); };
$('btn-retry').onclick = () => { clearTimeout(autoTimer); startBattle(lastZone); };
$('btn-auto').onclick = () => setAuto(!autoOn);
$('btn-pause').onclick = () => setPaused(!paused);
// Export and import: a text code holding the whole save, so progress can be backed up or moved between devices.
$('btn-export').onclick = async () => {
  const code = btoa(unescape(encodeURIComponent(JSON.stringify(save))));
  try { await navigator.clipboard.writeText(code); homeNote = 'Save code copied to the clipboard. Paste it somewhere safe.'; }
  catch (e) { window.prompt('Copy this save code:', code); homeNote = 'Save code shown. Keep a copy somewhere safe.'; }
  renderHome();
};
$('btn-import').onclick = () => {
  const code = window.prompt('Paste a save code to load it. This replaces your current save.');
  if (!code) return;
  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    if (!data || typeof data.nodes !== 'object' || typeof data.souls !== 'number') throw new Error('bad');
    resetSave(save);
    Object.assign(save, data);
    save.lastSeen = Date.now();
    writeSave(save);
    homeNote = 'Save loaded.';
  } catch (e) { homeNote = 'That save code did not work. Nothing was changed.'; }
  goHome();
};
const musicBtn = $('btn-music');
function paintMusic() { musicBtn.textContent = isMusicOn() ? '\u266B' : '\u2715'; musicBtn.style.opacity = isMusicOn() ? 1 : 0.55; }
musicBtn.onclick = () => { unlock(); setMusic(!isMusicOn()); paintMusic(); play('click'); };
paintMusic();
for (const b of document.querySelectorAll('[data-back]')) b.onclick = goHome;
$('btn-home').onclick = goHome;
// Tap to skip the clear celebration (after a short beat so it is seen).
canvas.addEventListener('pointerdown', () => { if (victory && victory.t > 1.2) { victory = null; endBattle(); } });
$('btn-speed').onclick = () => {
  speed = speed === 1 ? 2 : speed === 2 ? 4 : 1;
  $('btn-speed').textContent = speed + 'x';
};

const spellBtn = $('btn-spell');
spellBtn.onclick = () => { if (battle && battle.castSpell()) play('raise'); };
function paintSpell() {
  const ready = battle.spellReady();
  spellBtn.classList.toggle('ready', ready);
  $('spell-cd').style.width = ready ? '0' : (100 * (1 - battle.spellCd / spellCooldown(save))) + '%';
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const tier = necroTier(save);
  if (battle) {
    if (!battle.result && !paused) {
      const steps = speed * 2;
      for (let i = 0; i < steps; i++) battle.update(dt / 2);
      drainSounds(battle);
      if (battle.result === 'clear') {
        victory = { t: 0, parts: [] };
        $('btn-spell').classList.add('hidden');
      } else if (battle.result) endBattle();
    }
    if (victory) battle.time += dt;
    draw(g, battle, tier);
    if (victory) {
      // The horde cheers: everyone hops on the spot.
      for (const u of battle.units) if (u.team === 'player') u.moving = true;
      drawVictory(g, victory, dt, { zone: battle.zone.name, boss: UNITS[battle.zone.boss].name, payout: battle.payout, champ: battle.champDrop });
      if (victory.t > 4.2) { victory = null; endBattle(); }
    }
    $('hud-souls').textContent = Math.floor(battle.earned);
    $('hud-wave').textContent = battle.bossSpawned ? 'BOSS' : battle.zone.endless ? `Wave ${battle.wave}` : `Wave ${battle.wave}/${battle.totalWaves}`;
    $('hud-horde').textContent = `Horde ${battle.alive('player')}`;
    paintSpell();
  } else {
    idleTime += dt;
    drawIdle(g, idleTime, tier);
  }
  requestAnimationFrame(frame);
}

// Only save while visible so lastSeen marks when the player actually left.
setInterval(() => { if (document.visibilityState === 'visible') writeSave(save); }, 5000);
claimOffline();
goHome();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') { writeSave(save); return; }
  if (!battle) { claimOffline(); renderHome(); }
});
requestAnimationFrame(frame);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline install is optional */ });
}

// Test hook (used by automated checks).
window.__game = { setPaused, save, get battle() { return battle; }, startBattle, endBattle, afterChange, toast, armoury };
