import { UPGRADES, upgradeCost, ZONES, TUNING } from './data.js';
import { Battle, buyUpgrade } from './sim.js';
import { draw, drawIdle } from './render.js';
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

function renderHome() {
  $('home-souls').textContent = Math.floor(save.souls);
  const box = $('upgrades');
  box.innerHTML = '';
  for (const key of Object.keys(UPGRADES)) {
    const u = UPGRADES[key];
    const cost = upgradeCost(key, save.upgrades[key]);
    const b = document.createElement('button');
    b.className = 'upg';
    b.innerHTML = `<b>${u.name} (Lv ${save.upgrades[key]})</b><small>${u.desc}</small>${cost} souls`;
    b.disabled = save.souls < cost;
    b.onclick = () => { if (buyUpgrade(save, key)) { writeSave(save); renderHome(); } };
    box.appendChild(b);
  }
  $('btn-start').textContent = (save.bestZone >= 1 ? 'Replay: ' : 'Enter: ') + ZONES[1].name;
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
  if (battle) {
    if (!battle.result) {
      const steps = speed * 2;
      for (let i = 0; i < steps; i++) battle.update(dt / 2);
      if (battle.result) endBattle();
    }
    draw(g, battle);
    $('hud-souls').textContent = Math.floor(battle.runSouls);
    $('hud-wave').textContent = battle.bossSpawned ? 'BOSS' : `Wave ${battle.wave}/${battle.totalWaves}`;
    $('hud-horde').textContent = `Horde ${battle.alive('player')}`;
  } else {
    idleTime += dt;
    drawIdle(g, idleTime);
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

// Test hook (used by automated checks).
window.__game = { save, get battle() { return battle; } };
