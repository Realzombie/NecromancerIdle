import {
  UNITS, STATS, SPECIALS, SPECIAL_KEYS, ZONES, TUNING, NECRO_TIERS, PLAYER_UNITS, necroTier, owned, level, statCost,
  playerRating, zoneById, hasSpecial, specialReady, REGIONS,
  PERKS, PERK_KEYS, perk, perkCost, essenceGain, worldMul, canRebirth, REBIRTH_MIN_ZONE, offlineCapHours, spellCooldown,
} from './data.js';
import { Battle, zoneUnlocked, buyPerk, rebirth } from './sim.js';
import { createWeb } from './web.js';
import { draw, drawIdle, drawVictory, iconCanvas } from './render.js';
import { loadSave, writeSave, resetSave } from './save.js';
import { unlock, play, isMuted, setMuted } from './audio.js';

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

function fitUi() { app.style.setProperty('--u', app.clientHeight / 540 + 'px'); }
window.addEventListener('resize', fitUi);
fitUi();

const SCREENS = ['screen-home', 'screen-map', 'screen-tree', 'screen-rebirth', 'screen-result'];
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
  writeSave(save);
  const h = Math.floor(secs / 3600), mnt = Math.floor((secs % 3600) / 60);
  homeNote = `Welcome back! Your horde gathered ${gained} souls in ${h ? h + 'h ' : ''}${mnt}m away.`;
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
  const next = ZONES.find((z) => !save.cleared[z.id]);
  $('home-hint').textContent = next ? `Next target: ${next.name}` : 'Every zone is yours. Rebirth to grow stronger.';
}

function goHome() {
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
    const boss = UNITS[z.boss];
    const need = Math.round(z.rating * wm.rating);
    const diff = mine >= need ? 'ok' : mine >= need * 0.7 ? 'hard' : 'wall';
    const el = document.createElement('div');
    el.className = 'zone' + (cleared ? ' cleared' : '') + (unlocked ? '' : ' locked');
    el.innerHTML =
      `<div class="znum">${cleared ? '&#10003;' : z.id}</div>` +
      `<div class="zname">${z.name}</div>` +
      `<div class="zblurb">${unlocked ? z.blurb : 'Locked: clear the previous zone'}</div>` +
      `<div class="zrate ${unlocked ? diff : ''}">Rating ${need} <small>(you ${mine})</small></div>` +
      `<div class="zboss">Boss: ${boss.name}<br><span class="ico2">&#9819;</span> ${cleared ? 'Champion soul (25% chance)' : 'Champion soul'}</div>`;
    const b = document.createElement('button');
    b.className = 'big';
    b.textContent = cleared ? 'Replay' : 'Fight';
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
function startBattle(zoneId) {
  victory = null;
  battle = new Battle(save, zoneId);
  lastFirstClear = false;
  speed = 1;
  $('btn-speed').textContent = '1x';
  $('hud-zone').textContent = zoneById(zoneId).name;
  show(null);
}

function endBattle() {
  writeSave(save);
  const won = battle.result === 'clear';
  $('result-title').textContent = won ? 'Zone Cleared!' : 'Your horde has fallen';
  let text;
  if (won) {
    text = `${UNITS[battle.zone.boss].name} is dead and ${battle.zone.name} is yours. +${battle.payout} souls banked.`;
    if (battle.champDrop) text += ' The boss dropped a champion soul. Spend it in the skill tree!';
  } else {
    text = `The living chased you off. +${battle.payout} souls banked from ${battle.kills} kills.`;
  }
  $('result-text').textContent = text;
  show('screen-result');
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
  for (const e of b.events) play(e.n, e);
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

const web = createWeb({ save, play, onChange: () => { writeSave(save); setBanks(); } });

// ---- Wiring ----
$('btn-map').onclick = () => { renderMap(); show('screen-map'); };
$('btn-tree').onclick = () => { setBanks(); show('screen-tree'); web.render(); };
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
    if (!battle.result) {
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
    $('hud-wave').textContent = battle.bossSpawned ? 'BOSS' : `Wave ${battle.wave}/${battle.totalWaves}`;
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
window.__game = { save, get battle() { return battle; }, startBattle };
