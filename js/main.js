import { UPGRADES, upgradeCost, ZONES } from './data.js';
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
  $('btn-start').textContent = `Enter: ${ZONES[1].name}`;
}

function goHome() {
  battle = null;
  renderHome();
  show('screen-home');
}

function startBattle() {
  battle = new Battle(save, 1);
  speed = 1;
  $('btn-speed').textContent = '1x';
  show(null);
}

function endBattle() {
  writeSave(save);
  const won = battle.result === 'clear';
  $('result-title').textContent = won ? 'Zone Cleared!' : 'Your horde has fallen';
  $('result-text').textContent = won
    ? `The graveyard is yours. +${battle.payout} souls banked.`
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
    $('hud-wave').textContent = `Wave ${battle.wave}/${battle.totalWaves}`;
    $('hud-horde').textContent = `Horde ${battle.alive('player')}`;
  } else {
    idleTime += dt;
    drawIdle(g, idleTime);
  }
  requestAnimationFrame(frame);
}

setInterval(() => writeSave(save), 5000);
goHome();
requestAnimationFrame(frame);

// Test hook (used by automated checks).
window.__game = { save, get battle() { return battle; } };
