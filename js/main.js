import { UPGRADES, upgradeCost, ZONES, TUNING, NECRO_TIERS, necroTier } from './data.js';
import { Battle, buyUpgrade } from './sim.js';
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

function fitUi() { app.style.setProperty('--u', app.clientHeight / 540 + 'px'); }
window.addEventListener('resize', fitUi);
fitUi();

function show(id) {
  for (const s of ['screen-home', 'screen-result']) $(s).classList.toggle('hidden', s !== id);
  $('hud').classList.toggle('hidden', id !== null);
}

let homeNote = '';

// Souls earned while away: based on the highest zone cleared, capped. Never advances zones.
function claimOffline() {
  if (battle || save.bestZone < 1) { return; }
  const secs = Math.min((Date.now() - save.lastSeen) / 1000, TUNING.offlineCapHours * 3600);
  if (secs < TUNING.offlineMinSeconds) return;
  const gained = Math.floor((secs / 60) * TUNING.offlineSoulsPerMin * Math.pow(save.bestZone, TUNING.offlineExp));
  save.souls += gained;
  writeSave(save);
  const h = Math.floor(secs / 3600), mnt = Math.floor((secs % 3600) / 60);
  homeNote = `Welcome back! Your horde gathered ${gained} souls in ${h ? h + "h " : ""}${mnt}m away.`;
}

function renderHome(bought) {
  $('home-souls').textContent = Math.floor(save.souls);
  $('home-rank').textContent = NECRO_TIERS[necroTier(save)].name;
  const box = $('upgrades');
  box.innerHTML = '';
  for (const key of Object.keys(UPGRADES)) {
    const u = UPGRADES[key];
    const lvl = save.upgrades[key];
    const cost = upgradeCost(key, lvl);
    const can = save.souls >= cost;
    const b = document.createElement('button');
    b.className = 'card' + (can ? ' can' : '') + (bought === key ? ' bought' : '');
    b.disabled = !can;
    b.appendChild(iconCanvas(u.icon));
    b.insertAdjacentHTML('beforeend',
      `<div class="name">${u.name}</div><div class="lvl">LEVEL ${lvl}</div>` +
      `<div class="eff">${u.effect(lvl)}<br><i>Next: ${u.effect(lvl + 1)}</i></div>` +
      `<div class="buy"><span class="ico">&#9760;</span> ${cost}</div>`);
    b.onclick = () => { if (buyUpgrade(save, key)) { writeSave(save); renderHome(key); } };
    box.appendChild(b);
  }
  const z = ZONES[1];
  $('btn-start').textContent = (save.bestZone >= 1 ? 'Replay: ' : 'Enter: ') + z.name;
  $('zone-info').textContent = `${z.waves} waves of peasants, then a champion` + (save.bestZone >= 1 ? ' · cleared' : '');
  $('home-note').textContent = homeNote;
}

function goHome() {
  battle = null;
  renderHome();
  show('screen-home');
}

let firstClearBefore = false;
function startBattle() {
  firstClearBefore = save.bestZone >= 1;
  battle = new Battle(save, 1);
  speed = 1;
  $('btn-speed').textContent = '1x';
  show(null);
}

function endBattle() {
  writeSave(save);
  const won = battle.result === 'clear';
  const first = won && !firstClearBefore;
  $('result-title').textContent = won ? 'Zone Cleared!' : 'Your horde has fallen';
  $('result-text').textContent = won
    ? `The Peasant Champion is dead and the graveyard is yours. +${battle.payout} souls banked.${first ? " Skeleton archers now answer your call!" : ""}`
    : `The living breached the gate. +${battle.payout} souls banked from ${battle.kills} kills.`;
  show('screen-result');
}

$('btn-start').onclick = startBattle;
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
setInterval(() => { if (document.visibilityState === "visible") writeSave(save); }, 5000);
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
window.__game = { save, get battle() { return battle; } };
