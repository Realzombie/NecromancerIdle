import {
  UNITS, STATS, SPECIALS, SPECIAL_KEYS, ZONES, TUNING, NECRO_TIERS, PLAYER_UNITS, necroTier, owned, level, statCost,
  playerRating, zoneById, hasSpecial, specialReady, REGIONS,
  bossAbilityNames, syncBestiary, PERKS, PERK_KEYS, perk, perkCost, essenceGain, worldMul, canRebirth, REBIRTH_MIN_ZONE, offlineCapHours, spellCooldownFor, spellUnlocked, lookOf, rebirthsOf, statNeeds, perkLock, milestones, zoneRebirth,
} from './data.js';
import { Battle, zoneUnlocked, buyPerk, rebirth } from './sim.js';
import { createWeb } from './web.js';
import { createWorldMap } from './worldmap.js';
import { draw, drawIdle, drawVictory, iconCanvas, lookCanvas, FIELD_H, artStyleOn, setArtStyle } from './render.js';
import { FIELD_W } from './data.js';
import { loadSave, writeSave, resetSave } from './save.js';
import { unlock, play, isMuted, setMuted, isMusicOn, setMusic, setMusicTheme } from './audio.js';
import { createArmoury } from './armoury.js';
import { checkAchievements, rewardText, reportBattle, bountyText } from './records.js';
import { RARITIES, rarityIndex } from './gear.js';

const $ = (id) => document.getElementById(id);
const app = $('app');
const canvas = $('field');
const g = canvas.getContext('2d');
g.imageSmoothingEnabled = false;

const save = loadSave();
let battle = null;
let victory = null;   // celebration state while a cleared zone plays its animation
let speed = 1;
try { const sv = Number(localStorage.getItem('necro_speed')); if ([1, 2, 4].includes(sv)) speed = sv; } catch (e) { /* ignore */ }
const spellBar = $('spell-bar');
let spellBtns = [];
let idleTime = 0;
let homeNote = '';
let lastFirstClear = false;
let lastZone = 1;
let autoOn = false;
let autoTimer = null;
let paused = false;

canvas.width = FIELD_W; canvas.height = FIELD_H;
app.style.setProperty('--aspect', FIELD_W / FIELD_H);
function fitUi() { app.style.setProperty('--u', app.clientHeight / 540 + 'px'); }
window.addEventListener('resize', fitUi);
fitUi();

const SCREENS = ['screen-home', 'screen-map', 'screen-tree', 'screen-armoury', 'screen-rebirth', 'screen-result'];
let worldMap = null;
function show(id) {
  if (worldMap && id !== 'screen-map') worldMap.stop();
  for (const s of SCREENS) $(s).classList.toggle('hidden', s !== id);
  $('hud').classList.toggle('hidden', id !== null);
  setMusicTheme(id === null && battle ? 'z' + battle.zone.id : 'home');   // each zone has its own music
  spellBar.classList.toggle('hidden', id !== null || !spellBtns.length);
}

// ---- Offline souls: based on the highest zone cleared, capped. Never advances zones. ----
function claimOffline() {
  if (battle || save.bestZone < 1) return;
  const away = (Date.now() - save.lastSeen) / 1000, capS = offlineCapHours(save) * 3600;
  const secs = Math.min(away, capS);
  if (secs < TUNING.offlineMinSeconds) return;
  const gained = Math.floor((secs / 60) * TUNING.offlineSoulsPerMin * Math.pow(save.bestZone, TUNING.offlineExp) * (1 + 0.25 * perk(save, 'restless')));
  save.souls += gained;
  writeSave(save);
  const fmt = (s) => { const h = Math.floor(s / 3600), mnt = Math.floor((s % 3600) / 60); return (h ? h + 'h ' : '') + mnt + 'm'; };
  const perHour = Math.round(gained / (secs / 3600));
  let note = 'Welcome back! You were away ' + fmt(away) + '.\nYour horde gathered ' + gained.toLocaleString() + ' souls (about ' + perHour.toLocaleString() + ' an hour, from your best zone, ' + save.bestZone + ').';
  const capped = away > capS;
  if (capped) note += '\nThe ' + offlineCapHours(save) + 'h cap was reached, so ' + fmt(away - capS) + ' of your time away earned nothing.';
  if ((capped || save.rebirths) && perk(save, 'restless') < PERKS.restless.max) note += '\nThe rebirth perk Restless Dead raises both the cap and the rate.';
  showWelcome(note.replace(/^Welcome back! /, ''));
}

// The welcome-back report pops up over the home screen and goes away when tapped.
function showWelcome(text) {
  $('welcome-text').textContent = text;
  $('welcome').classList.remove('hidden');
}
$('welcome-ok').onclick = () => { $('welcome').classList.add('hidden'); play('click'); };
$('welcome').addEventListener('click', (e) => { if (e.target === $('welcome')) $('welcome').classList.add('hidden'); });

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
      if (l < STATS[s].max && save.souls >= statCost(s, u, l, save) && rebirthsOf(save) >= statNeeds(s, l)) n++;
    }
  }
  for (const k of SPECIAL_KEYS) if (!hasSpecial(save, k) && specialReady(save, k) && save.souls >= SPECIALS[k].cost) n++;
  return n;
}

// ---- Home ----
function renderHome() {
  syncBestiary(save);
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

// ---- Rebirth ----
let rebirthArmed = null;
function disarmRebirth() { clearTimeout(rebirthArmed); rebirthArmed = null; renderRebirth(); }
function milestoneHtml() {
  const ms = milestones(), r = save.rebirths || 0;
  const next = Object.keys(ms).map(Number).filter((k) => k > r).sort((a, b) => a - b)[0];
  if (next === undefined) return '<div class="msnote">Everything is unlocked. Push the Endless Crypt!</div>';
  return '<div class="msnote">Rebirth ' + next + ' unlocks: ' + ms[next].join(", ") + '</div>';
}
function renderRebirth() {
  setBanks();
  const ok = canRebirth(save);
  const gain = essenceGain(save);
  $('rb-text').innerHTML =
    '<div>Rebirths so far: <b>' + (save.rebirths || 0) + '</b></div>' + milestoneHtml() +
    (ok
      ? '<div>Rebirthing now pays <b>&#9672; ' + gain + '</b> essence.</div><div>You lose your souls, champion souls, skill tree and cleared zones, and keep your perks and essence.</div>'
      : '<div>Clear zone ' + REBIRTH_MIN_ZONE + ' to unlock Rebirth.</div><div>Essence is earned from the zones you have cleared and the upgrades you hold.</div>');
  const go = $('btn-rebirth-go');
  go.disabled = !ok;
  go.classList.toggle('armed', !!rebirthArmed);
  go.textContent = rebirthArmed ? 'Tap again to rebirth' : 'Rebirth';
  const box = $('perks');
  const scrolled = box.scrollTop;   // buying a perk redraws the list: keep the place
  box.innerHTML = '';
  for (const key of PERK_KEYS) {
    const P = PERKS[key];
    const lvl = perk(save, key);
    const maxed = lvl >= P.max;
    const cost = perkCost(key, lvl);
    const lock = perkLock(save, key);
    const can = !maxed && !lock && (save.essence || 0) >= cost;
    const el = document.createElement('button');
    el.className = 'perk' + (can ? ' can' : '') + (maxed ? ' maxed' : '') + (lock ? ' locked' : '');
    el.disabled = !can;
    el.appendChild(iconCanvas(P.icon));
    el.insertAdjacentHTML('beforeend',
      '<div class="pname">' + P.name + '</div><div class="plvl">' + lvl + '/' + P.max + '</div>' +
      '<div class="peff">' + P.effect(lvl) + (maxed ? '' : lock ? '<br>Needs: ' + lock : '<br>Next: ' + P.effect(lvl + 1)) + '</div>' +
      '<div class="pcost">' + (maxed ? 'MAX' : '<span class="ico3">&#9672;</span> ' + cost) + '</div>');
    el.onclick = () => { if (buyPerk(save, key)) { play('buy'); writeSave(save); renderRebirth(); } };
    box.appendChild(el);
  }
  box.scrollTop = scrolled;
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
  $('btn-speed').textContent = speed + 'x';
  $('hud-zone').textContent = zoneById(zoneId).name;
  buildSpellBar();
  show(null);
}

let liveFresh = [], liveTimer = 0;
function endBattle() {
  const fresh = checkAchievements(save);
  const bounties = reportBattle(save, battle);
  writeSave(save);
  const won = battle.result === 'clear';
  const E = battle.endless;
  $('result-title').textContent = E ? 'The Crypt claims you' : won ? 'Zone Cleared!' : 'Your horde has fallen';
  let text;
  if (won) {
    text = `${UNITS[battle.zone.boss].name} is dead and ${battle.zone.name} is yours. ${Math.floor(battle.earned)} souls collected, all banked.`;
    if (battle.champDrop) text += ' The boss dropped a champion soul. Spend it in the skill tree!';
  } else {
    text = `The living chased you off. ${Math.floor(battle.earned)} souls collected from ${battle.kills} kills, but only half (${battle.payout}) are banked on a defeat.`;
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
  for (const a of fresh) toast('Achievement: ' + a.name + ' (' + rewardText(a.reward) + ')');
  for (const a of [...liveFresh, ...fresh]) extra.insertAdjacentHTML('beforeend', '<div class="rchip achv">&#9733; ' + a.name + ' &middot; ' + rewardText(a.reward) + '</div>');
  for (const b of bounties) extra.insertAdjacentHTML('beforeend', '<div class="rchip achv">&#9873; Bounty: ' + bountyText(b) + ' &middot; +' + b.dust + ' dust' + (b.champ ? ' +1 champion soul' : '') + '</div>');
  for (const t of battle.newFinds || []) extra.insertAdjacentHTML('beforeend', '<div class="rchip achv">&#128214; Bestiary: ' + UNITS[t].name + ' (+' + (UNITS[t].boss ? '0.4' : '0.15') + '% souls)</div>');
  if (best >= 2) play('drop');
  if (fresh.length || bounties.length || (battle.newFinds || []).length) setTimeout(() => play('ach'), 400);
  liveFresh = [];
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
  syncBestiary(save);
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
// On phones, go fullscreen on the first tap (and again after anything drops us out of it), then lock landscape
const touchDevice = window.matchMedia('(pointer: coarse)').matches;
window.addEventListener('pointerdown', () => {
  if (!touchDevice) return;
  const el = document.documentElement;
  try {
    if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen({ navigationUI: 'hide' }).then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* ignore */ } }).catch(() => {});
    else screen.orientation.lock('landscape').catch(() => {});
  } catch (e) { /* ignore */ }
});
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
worldMap = createWorldMap({ save, startBattle: (id) => startBattle(id), play });
const armoury = createArmoury({ save, play, onChange: afterChange });

// ---- Wiring ----
$('btn-map').onclick = () => { setBanks(); show('screen-map'); worldMap.show(); };
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
  try { localStorage.setItem('necro_speed', String(speed)); } catch (e) { /* ignore */ }
};

// Raise Dead: one button per summon, only once the unlock is bought in the skill web.
function buildSpellBar() {
  spellBar.innerHTML = '';
  spellBtns = [];
  if (!spellUnlocked(save)) return;
  for (const type of battle.raiseTypes()) {
    const b = document.createElement('button');
    b.className = 'spellbtn';
    b.title = 'Raise ' + UNITS[type].name + 's';
    b.appendChild(lookCanvas(type, lookOf(save, type)));
    const cd = document.createElement('i');
    b.appendChild(cd);
    b.onclick = () => { if (battle && battle.castSpell(type)) play('raise'); };
    spellBar.appendChild(b);
    spellBtns.push({ type, b, cd });
  }
}
function paintSpells() {
  for (const s of spellBtns) {
    const ready = battle.spellReady(s.type);
    s.b.classList.toggle('ready', ready);
    s.cd.style.height = ready ? '0' : (100 * (battle.spellCds[s.type] || 0)) / spellCooldownFor(save, s.type) + '%';
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const tier = necroTier(save);
  if (battle) {
    if (!battle.result && !paused) {
      liveTimer += dt;
      if (liveTimer > 1.5) {            // milestones can pop up in the middle of a fight
        liveTimer = 0;
        const got = checkAchievements(save, { kills: battle.kills, souls: Math.floor(battle.earned * (TUNING.failPayout || 0.5)) });
        for (const a of got) { toast('Achievement: ' + a.name + ' (' + rewardText(a.reward) + ')'); play('ach'); liveFresh.push(a); }
      }
      const steps = speed * 2;
      for (let i = 0; i < steps; i++) battle.update(dt / 2);
      drainSounds(battle);
      if (battle.result === 'clear') {
        victory = { t: 0, parts: [] };
        spellBar.classList.add('hidden');
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
    paintSpells();
  } else {
    idleTime += dt;
    drawIdle(g, idleTime, tier, save);
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
window.__game = { claimOffline, renderHome, setPaused, save, get battle() { return battle; }, startBattle, endBattle, afterChange, toast, armoury };

// Fullscreen button: shown on touch devices while not fullscreen (a reliable fallback if the install did not go fullscreen by itself)
{
  const fb = $('btn-full');
  const paintFull = () => fb.classList.toggle('hidden', !touchDevice || !!document.fullscreenElement);
  fb.onclick = () => { try { document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {}); } catch (e) { /* ignore */ } };
  document.addEventListener('fullscreenchange', paintFull);
  paintFull();
}

// Keep the phone screen awake while the game is open (the lock is released whenever the page is hidden, so ask again on return)
{
  let lock = null;
  const keepAwake = async () => {
    try {
      if (!('wakeLock' in navigator) || document.visibilityState !== 'visible' || (lock && !lock.released)) return;
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => { lock = null; });
    } catch (e) { /* not allowed right now (battery saver, no gesture yet): try again later */ }
  };
  document.addEventListener('visibilitychange', keepAwake);
  window.addEventListener('pointerdown', keepAwake);
  keepAwake();
}

// Settings gear: toggles the little menu; tapping anywhere else closes it
{
  const gear = document.getElementById('btn-menu');
  gear.onclick = (e) => { e.stopPropagation(); app.classList.toggle('menu-open'); };
  window.addEventListener('pointerdown', (e) => { if (!e.target.closest || !e.target.closest('.mute')) app.classList.remove('menu-open'); });
}

// Unit art switch in the settings menu: the newer painted summons or the original pixel art
{
  const ab = document.getElementById('btn-art');
  const paintArt = () => { ab.textContent = artStyleOn() ? 'HD' : 'NORM'; ab.title = 'Unit art: ' + (artStyleOn() ? 'HD' : 'Normal'); };
  ab.onclick = () => { setArtStyle(!artStyleOn()); paintArt(); if (battle && !battle.result) buildSpellBar(); toast('Unit art: ' + (artStyleOn() ? 'HD' : 'Normal')); };
  paintArt();
}
