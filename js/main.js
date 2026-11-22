import {
  UNITS, STATS, ZONES, TUNING, NECRO_TIERS, PLAYER_UNITS, necroTier, owned, level, statCost, playerRating, zoneById,
} from './data.js';
import { Battle, buyUnit, buyStat, zoneUnlocked } from './sim.js';
import { draw, drawIdle, iconCanvas } from './render.js';
import { loadSave, writeSave } from './save.js';

const $ = (id) => document.getElementById(id);
const app = $('app');
const canvas = $('field');
const g = canvas.getContext('2d');
g.imageSmoothingEnabled = false;

const save = loadSave();
let battle = null;
let speed = 1;
let idleTime = 0;
let homeNote = '';
let lastFirstClear = false;

function fitUi() { app.style.setProperty('--u', app.clientHeight / 540 + 'px'); }
window.addEventListener('resize', fitUi);
fitUi();

const SCREENS = ['screen-home', 'screen-map', 'screen-tree', 'screen-result'];
function show(id) {
  for (const s of SCREENS) $(s).classList.toggle('hidden', s !== id);
  $('hud').classList.toggle('hidden', id !== null);
}

// ---- Offline souls: based on the highest zone cleared, capped. Never advances zones. ----
function claimOffline() {
  if (battle || save.bestZone < 1) return;
  const secs = Math.min((Date.now() - save.lastSeen) / 1000, TUNING.offlineCapHours * 3600);
  if (secs < TUNING.offlineMinSeconds) return;
  const gained = Math.floor((secs / 60) * TUNING.offlineSoulsPerMin * Math.pow(save.bestZone, TUNING.offlineExp));
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
  return n;
}

// ---- Home ----
function renderHome() {
  setBanks();
  $('home-rank').textContent = NECRO_TIERS[necroTier(save)].name;
  $('home-power').textContent = playerRating(save);
  $('home-note').textContent = homeNote;
  const n = treeAvailable();
  $('tree-badge').textContent = n;
  $('tree-badge').classList.toggle('hidden', n === 0);
  const next = ZONES.find((z) => !save.cleared[z.id]);
  $('home-hint').textContent = next ? `Next target: ${next.name}` : 'Every zone in the Greenmarch is yours. More to come.';
}

function goHome() {
  battle = null;
  renderHome();
  show('screen-home');
}

// ---- Zone map ----
function renderMap() {
  setBanks();
  const box = $('zones');
  box.innerHTML = '';
  const mine = playerRating(save);
  for (const z of ZONES) {
    const unlocked = zoneUnlocked(save, z.id);
    const cleared = !!save.cleared[z.id];
    const boss = UNITS[z.boss];
    const diff = mine >= z.rating ? 'ok' : mine >= z.rating * 0.7 ? 'hard' : 'wall';
    const el = document.createElement('div');
    el.className = 'zone' + (cleared ? ' cleared' : '') + (unlocked ? '' : ' locked');
    el.innerHTML =
      `<div class="znum">${cleared ? '&#10003;' : z.id}</div>` +
      `<div class="zname">${z.name}</div>` +
      `<div class="zblurb">${unlocked ? z.blurb : 'Locked: clear the previous zone'}</div>` +
      `<div class="zrate ${unlocked ? diff : ''}">Rating ${z.rating} <small>(you ${mine})</small></div>` +
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

// ---- Skill tree ----
function renderTree(flash) {
  setBanks();
  const box = $('tree');
  box.innerHTML = '';
  for (const unit of PLAYER_UNITS) {
    const def = UNITS[unit];
    const have = owned(save, unit);
    const col = document.createElement('div');
    col.className = 'col' + (have ? '' : ' locked');

    const head = document.createElement('div');
    head.className = 'node unit' + (have ? ' owned' : '');
    head.appendChild(iconCanvas(def.sprite));
    head.insertAdjacentHTML('beforeend', `<div class="nname">${def.name}</div><div class="nblurb">${def.blurb}</div>`);
    if (have) {
      head.insertAdjacentHTML('beforeend', '<div class="nstate">Unlocked</div>');
    } else {
      const can = save.champSouls >= def.unlockCost;
      const b = document.createElement('button');
      b.className = 'buy' + (can ? ' can' : '');
      b.disabled = !can;
      b.innerHTML = `Unlock <span class="ico2">&#9819;</span> ${def.unlockCost}`;
      b.onclick = () => { if (buyUnit(save, unit)) { writeSave(save); renderTree(unit); } };
      head.appendChild(b);
    }
    col.appendChild(head);

    for (const stat of Object.keys(STATS)) {
      const S = STATS[stat];
      const l = level(save, stat, unit);
      const maxed = l >= S.max;
      const cost = statCost(stat, unit, l);
      const can = have && !maxed && save.souls >= cost;
      const n = document.createElement('button');
      n.className = 'node stat' + (can ? ' can' : '') + (maxed ? ' maxed' : '') + (flash === unit + stat ? ' bought' : '');
      n.disabled = !can;
      n.appendChild(iconCanvas('icon_' + S.icon));
      n.insertAdjacentHTML('beforeend',
        `<div class="ntext"><div class="nname">${S.name} <span class="lvl">${l}/${S.max}</span></div>` +
        `<div class="neff">${S.effect(l, unit)}</div></div>` +
        `<div class="cost">${maxed ? 'MAX' : `<span class="ico">&#9760;</span> ${cost}`}</div>`);
      n.onclick = () => { if (buyStat(save, stat, unit)) { writeSave(save); renderTree(unit + stat); } };
      col.appendChild(n);
    }
    box.appendChild(col);
  }
}

// ---- Battle ----
function startBattle(zoneId) {
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
    text = `The living breached the gate. +${battle.payout} souls banked from ${battle.kills} kills.`;
  }
  $('result-text').textContent = text;
  show('screen-result');
}

// ---- Wiring ----
$('btn-map').onclick = () => { renderMap(); show('screen-map'); };
$('btn-tree').onclick = () => { renderTree(); show('screen-tree'); };
for (const b of document.querySelectorAll('[data-back]')) b.onclick = goHome;
$('btn-home').onclick = goHome;
$('btn-speed').onclick = () => {
  speed = speed === 1 ? 2 : speed === 2 ? 4 : 1;
  $('btn-speed').textContent = speed + 'x';
};

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const tier = necroTier(save);
  if (battle) {
    if (!battle.result) {
      const steps = speed * 2;
      for (let i = 0; i < steps; i++) battle.update(dt / 2);
      if (battle.result) endBattle();
    }
    draw(g, battle, tier);
    $('hud-souls').textContent = Math.floor(battle.earned);
    $('hud-wave').textContent = battle.bossSpawned ? 'BOSS' : `Wave ${battle.wave}/${battle.totalWaves}`;
    $('hud-horde').textContent = `Horde ${battle.alive('player')}`;
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
