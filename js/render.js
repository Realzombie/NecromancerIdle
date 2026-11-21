// Canvas drawing. Sprites are generated from pixel grids (see SPRITES) and cached.
import { FIELD_W, FIELD_H, GATE_X } from './data.js';

// Palette letters: . = transparent
const SPRITES = {
  zombie: {
    scale: 4,
    palette: { G: '#7fa86a', g: '#5f8a52', E: '#e8e0a0', B: '#5a4a6a', D: '#3a2f48', R: '#a04848' },
    grid: [
      '..gGGGg.',
      '.gGGGGGg',
      '.GEGGEGG',
      '.GGGRGG.',
      '..GGGG..',
      'GBBBBBB.',
      'GBBBBBBG',
      '.BBBBBB.',
      '.BBDDBB.',
      '.GG..GG.',
      '.DD..DD.',
    ],
  },
  peasant: {
    scale: 4,
    palette: { S: '#e0b890', H: '#a07840', T: '#8a6a4a', P: '#5a4a3a', E: '#202020' },
    grid: [
      '..HHHH..',
      '.HHHHHH.',
      '..SSSS..',
      '.SESSES.',
      '..SSSS..',
      '.TTTTTT.',
      'STTTTTTS',
      '.TTTTTT.',
      '.PP..PP.',
      '.PP..PP.',
    ],
  },
  champion: {
    scale: 6,
    palette: { S: '#e0b890', H: '#b8b8c8', h: '#80808f', T: '#a84040', P: '#4a3a3a', E: '#202020', W: '#d0d0d8', M: '#6a4a2a' },
    grid: [
      '..HHHH..',
      '.HHhhHH.',
      '.HSSSSH.',
      '.SESSES.',
      '..SSSS..',
      'HTTTTTTHW',
      'STTTTTTSW',
      '.TTTTTT.M',
      '.TTTTTT.M',
      '.PP..PP..',
      '.PP..PP..',
    ],
  },
};

const cache = {};
function sprite(name) {
  if (cache[name]) return cache[name];
  const s = SPRITES[name];
  const w = Math.max(...s.grid.map((r) => r.length));
  const c = document.createElement('canvas');
  c.width = w * s.scale; c.height = s.grid.length * s.scale;
  const g = c.getContext('2d');
  s.grid.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.') return;
    g.fillStyle = s.palette[ch];
    g.fillRect(x * s.scale, y * s.scale, s.scale, s.scale);
  }));
  // White silhouette for hit flashes.
  const f = document.createElement('canvas');
  f.width = c.width; f.height = c.height;
  const fg = f.getContext('2d');
  fg.drawImage(c, 0, 0);
  fg.globalCompositeOperation = 'source-in';
  fg.fillStyle = '#ffffff';
  fg.fillRect(0, 0, f.width, f.height);
  return (cache[name] = { img: c, flash: f, w: c.width, h: c.height });
}

const stars = Array.from({ length: 40 }, (_, i) => ({ x: (i * 197) % FIELD_W, y: (i * 61) % 240, r: i % 5 === 0 ? 2 : 1 }));

function drawBackground(g, t) {
  const sky = g.createLinearGradient(0, 0, 0, 330);
  sky.addColorStop(0, '#1a1030'); sky.addColorStop(1, '#3a2850');
  g.fillStyle = sky; g.fillRect(0, 0, FIELD_W, 330);
  g.fillStyle = '#e8e0f0';
  for (const s of stars) { g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2 + s.x); g.fillRect(s.x, s.y, s.r, s.r); }
  g.globalAlpha = 1;
  g.fillStyle = '#d8d0b0'; g.beginPath(); g.arc(820, 90, 34, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#1a1030'; g.beginPath(); g.arc(808, 82, 30, 0, Math.PI * 2); g.fill();
  // Distant tombstones
  g.fillStyle = '#2a2040';
  for (let x = 100; x < FIELD_W; x += 130) { g.fillRect(x, 292, 14, 38); g.fillRect(x - 3, 296, 20, 5); }
  // Ground
  g.fillStyle = '#2c3a2a'; g.fillRect(0, 330, FIELD_W, FIELD_H - 330);
  g.fillStyle = '#243021'; g.fillRect(0, 330, FIELD_W, 6);
  g.fillStyle = '#26331f';
  for (let i = 0; i < 60; i++) g.fillRect((i * 97) % FIELD_W, 340 + ((i * 53) % 190), 6, 2);
}

function drawGate(g) {
  g.fillStyle = '#1a1424'; g.fillRect(8, 300, 44, 150);
  g.fillStyle = '#0a0710'; g.fillRect(18, 330, 24, 120);
  g.fillStyle = '#4a3a66'; g.fillRect(4, 292, 52, 10);
  g.fillStyle = '#8fd16a'; g.globalAlpha = 0.5; g.fillRect(20, 340, 20, 6); g.globalAlpha = 1;
}

function drawUnit(g, u, t) {
  const s = sprite(u.def.sprite);
  const bob = u.moving ? Math.abs(Math.sin(t * 9 + u.id)) * 3 : 0;
  const lunge = u.attackAnim > 0 ? (u.team === 'player' ? 1 : -1) * 4 * (u.attackAnim / 0.2) : 0;
  const px = Math.round(u.x + lunge), py = Math.round(u.y - bob);
  g.fillStyle = 'rgba(0,0,0,0.3)';
  g.beginPath(); g.ellipse(u.x, u.y, s.w * 0.4, 4, 0, 0, Math.PI * 2); g.fill();
  g.save();
  g.translate(px, py);
  if (u.team === 'enemy') g.scale(-1, 1);
  g.drawImage(u.flash > 0 ? s.flash : s.img, -s.w / 2, -s.h);
  g.restore();
  if (u.hp < u.maxHp) {
    const w = Math.max(18, s.w * 0.8);
    g.fillStyle = '#000'; g.fillRect(px - w / 2, py - s.h - 8, w, 4);
    g.fillStyle = u.team === 'player' ? '#8fd16a' : '#d6596b';
    g.fillRect(px - w / 2, py - s.h - 8, w * Math.max(0, u.hp / u.maxHp), 4);
  }
}

export function draw(g, battle) {
  const t = battle.time;
  drawBackground(g, t);
  drawGate(g);
  const sorted = [...battle.units].sort((a, b) => a.y - b.y);
  for (const u of sorted) drawUnit(g, u, t);
  g.strokeStyle = '#d8d0b0'; g.lineWidth = 2;
  for (const p of battle.projectiles) {
    const a = p.angle || 0;
    g.beginPath(); g.moveTo(p.x - Math.cos(a) * 8, p.y - Math.sin(a) * 8); g.lineTo(p.x, p.y); g.stroke();
  }
  g.font = 'bold 16px system-ui, sans-serif'; g.textAlign = 'center';
  for (const f of battle.floaters) {
    g.globalAlpha = 1 - f.t;
    g.fillStyle = '#b8f090';
    g.fillText(f.text, f.x, f.y - f.t * 24);
  }
  g.globalAlpha = 1;
  // Wave banner
  if (battle.spawnQueue.length === 0 && battle.alive('enemy') === 0 && !battle.result) {
    g.font = 'bold 28px system-ui, sans-serif'; g.fillStyle = '#e8e0f0';
    g.fillText(battle.wave >= battle.totalWaves ? 'Zone cleared!' : 'Next wave incoming...', FIELD_W / 2, 200);
  }
}

export function drawIdle(g, t) {
  drawBackground(g, t);
  drawGate(g);
}
