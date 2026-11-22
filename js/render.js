// Canvas drawing. Sprites are generated from pixel grids (see SPRITES) and cached.
import { FIELD_W, FIELD_H, NECRO_X, GATE_X } from './data.js';

// Palette letters: . = transparent
const NECRO_GRID = [
  '.......OO.',
  '..HHHH.OO.',
  '.HHHHHH.T.',
  '.HSSSSH.T.',
  '.HSESEH.T.',
  '.HSSSSH.T.',
  '..RrrR..T.',
  '.RRrrRR.T.',
  'RRRrrRRRT.',
  '.RRrrRR.T.',
  '.RRrrRR.T.',
  '.RRRRRR.T.',
  'RRRRRRRR..',
];
const NECRO_BASE = { S: '#d8d0b8' };

const SPRITES = {
  necro0: { scale: 6, grid: NECRO_GRID, palette: { ...NECRO_BASE, H: '#4a4048', h: '#5a5058', R: '#3a3238', r: '#4a424a', E: '#c8c070', T: '#7a5a30', O: '#9a9a70' } },
  necro1: { scale: 6, grid: NECRO_GRID, palette: { ...NECRO_BASE, H: '#3a2a5a', h: '#5a4a8a', R: '#2a2040', r: '#4a3a6a', E: '#8fd16a', T: '#7a5a30', O: '#8fd16a' } },
  necro2: { scale: 6, grid: NECRO_GRID, palette: { ...NECRO_BASE, H: '#2a1a4a', h: '#7a5ab8', R: '#241a3c', r: '#5a3a8a', E: '#8fd16a', T: '#c8a040', O: '#b8f090' } },
  necro3: { scale: 6, grid: NECRO_GRID, palette: { ...NECRO_BASE, S: '#e8e8d8', H: '#101010', h: '#303030', R: '#0a0a10', r: '#1a2a1a', E: '#b8f090', T: '#d8d0b0', O: '#b8f090' } },
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
  archer: {
    scale: 4,
    palette: { B: '#e8e0c8', b: '#b8b09a', E: '#2a2030', W: '#8a5a2a', S: '#d8d0b0' },
    grid: [
      '..BBBB...',
      '.BBBBBB..',
      '.BEBBEB..',
      '..BBBB...',
      '..bBBb.WS',
      '.BBBBBBW.',
      '.b.BB.bWS',
      '..BBBB.W.',
      '..B..B.WS',
      '..B..B...',
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
  // Upgrade-card icons
  icon_raise: {
    scale: 5,
    palette: { F: '#7fa86a', f: '#5f8a52', D: '#3a2f48', d: '#54406e' },
    grid: [
      '..F.F.F..',
      '..F.F.F..',
      '.FFFFFFF.',
      '.FFFFFFF.',
      '..fFFFf..',
      '..fFFFf..',
      '.dDDDDDd.',
      'dDDDDDDDd',
      '.........',
    ],
  },
  icon_hp: {
    scale: 5,
    palette: { R: '#d6596b', r: '#9a3a4a', W: '#f4b0b8' },
    grid: [
      '.RR...RR.',
      'RRRR.RRRR',
      'RWRRRRRRR',
      'RRRRRRRRR',
      'RRRRRRRRr',
      '.RRRRRRr.',
      '..RRRRr..',
      '...RRr...',
      '....r....',
    ],
  },
  icon_dmg: {
    scale: 5,
    palette: { S: '#d8d8e8', s: '#9a9ab0', G: '#c8a040', B: '#6a4a2a' },
    grid: [
      '......sS.',
      '.....sSS.',
      '....sSS..',
      '...sSS...',
      '.G.sS....',
      '..GS.....',
      '..GG.....',
      '.BG.G....',
      'BB.......',
    ],
  },
};

const cache = {};
function silhouette(c, color) {
  const f = document.createElement('canvas');
  f.width = c.width; f.height = c.height;
  const fg = f.getContext('2d');
  fg.drawImage(c, 0, 0);
  fg.globalCompositeOperation = 'source-in';
  fg.fillStyle = color;
  fg.fillRect(0, 0, f.width, f.height);
  return f;
}

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
  return (cache[name] = { img: c, flash: silhouette(c, '#ffffff'), dark: silhouette(c, '#0a0710'), w: c.width, h: c.height });
}

// A fresh canvas holding an icon sprite, for use in the HTML UI.
export function iconCanvas(key) {
  const s = sprite('icon_' + key);
  const c = document.createElement('canvas');
  c.width = s.w; c.height = s.h;
  c.getContext('2d').drawImage(s.img, 0, 0);
  return c;
}

// ---- Scenery (deterministic, so nothing flickers) ----
function seeded(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const rnd = seeded(11);
const stars = Array.from({ length: 50 }, (_, i) => ({ x: (i * 197) % FIELD_W, y: (i * 61) % 240, r: i % 5 === 0 ? 2 : 1 }));
const trees = [60, 205, 395, 560, 700, 905].map((x) => ({ x: x + rnd() * 30, y: 332 + rnd() * 6, h: 70 + rnd() * 50, lean: rnd() - 0.5 }));
const graves = Array.from({ length: 26 }, () => ({ x: rnd() * FIELD_W, y: 340 + rnd() * 180, kind: Math.floor(rnd() * 3), s: 0.8 + rnd() * 0.6 }));
const tufts = Array.from({ length: 90 }, () => ({ x: rnd() * FIELD_W, y: 338 + rnd() * 195, h: 3 + Math.floor(rnd() * 4) }));
const bones = Array.from({ length: 12 }, () => ({ x: 120 + rnd() * 800, y: 460 + rnd() * 70 }));
const bats = [0, 1, 2].map((i) => ({ off: i * 400, y: 50 + i * 38, speed: 38 + i * 12, ph: i }));

function drawTree(g, t) {
  g.fillStyle = '#17101f';
  const x = t.x, y = t.y, h = t.h;
  g.fillRect(x - 3, y - h, 6, h);
  g.fillRect(x - 3 + t.lean * 12, y - h - 14, 5, 16);
  for (const [dx, dy, len, dir] of [[0, 0.55, 26, -1], [0, 0.4, 20, 1], [0, 0.75, 18, 1], [0, 0.25, 14, -1]]) {
    const by = y - h * dy;
    g.fillRect(dir > 0 ? x : x - len, by, len, 3);
    g.fillRect(dir > 0 ? x + len - 3 : x - len, by - 10, 3, 11);
  }
}

function drawGrave(g, o) {
  const s = o.s;
  g.fillStyle = 'rgba(0,0,0,0.25)';
  g.fillRect(o.x - 6 * s, o.y - 1, 16 * s, 3);
  g.fillStyle = o.kind === 1 ? '#5a5870' : '#4c4a60';
  if (o.kind === 0) { g.fillRect(o.x - 3 * s, o.y - 18 * s, 6 * s, 18 * s); g.fillRect(o.x - 8 * s, o.y - 13 * s, 16 * s, 5 * s); }
  else if (o.kind === 1) { g.fillRect(o.x - 6 * s, o.y - 14 * s, 12 * s, 14 * s); g.fillRect(o.x - 4 * s, o.y - 17 * s, 8 * s, 3 * s); }
  else { g.fillRect(o.x - 5 * s, o.y - 10 * s, 10 * s, 10 * s); g.fillStyle = '#3c3a50'; g.fillRect(o.x - 3 * s, o.y - 7 * s, 6 * s, 2 * s); }
}

function drawCastle(g, t) {
  g.fillStyle = '#150e20';
  g.fillRect(830, 262, 130, 70);
  for (const [x, w, h] of [[820, 26, 110], [884, 22, 130], [930, 30, 96]]) {
    g.fillRect(x, 332 - h, w, h);
    for (let i = 0; i < w; i += 8) g.fillRect(x + i, 332 - h - 7, 5, 7);
    g.beginPath(); g.moveTo(x - 3, 332 - h - 7); g.lineTo(x + w / 2, 332 - h - 34); g.lineTo(x + w + 3, 332 - h - 7); g.fill();
  }
  g.fillStyle = '#e8c860';
  [[830, 290], [892, 262], [940, 280], [860, 305], [905, 300]].forEach(([x, y], i) => {
    g.globalAlpha = 0.55 + 0.45 * Math.sin(t * 3 + i * 1.7);
    g.fillRect(x, y, 4, 7);
  });
  g.globalAlpha = 1;
}

function drawBackground(g, t) {
  const sky = g.createLinearGradient(0, 0, 0, 330);
  sky.addColorStop(0, '#1a1030'); sky.addColorStop(1, '#46305f');
  g.fillStyle = sky; g.fillRect(0, 0, FIELD_W, 330);
  g.fillStyle = '#e8e0f0';
  for (const s of stars) { g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2 + s.x); g.fillRect(s.x, s.y, s.r, s.r); }
  g.globalAlpha = 1;
  g.fillStyle = '#d8d0b0'; g.beginPath(); g.arc(640, 90, 34, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#2a1c42'; g.beginPath(); g.arc(628, 82, 30, 0, Math.PI * 2); g.fill();
  // Far hills
  g.fillStyle = '#1d1430';
  g.beginPath(); g.moveTo(0, 330);
  for (let x = 0; x <= FIELD_W; x += 40) g.lineTo(x, 300 + Math.sin(x * 0.012) * 18 + Math.sin(x * 0.05) * 6);
  g.lineTo(FIELD_W, 330); g.fill();
  drawCastle(g, t);
  for (const tr of trees) drawTree(g, tr);
  // Bats
  g.fillStyle = '#0c0814';
  for (const b of bats) {
    const x = ((t * b.speed + b.off) % (FIELD_W + 120)) - 60, y = b.y + Math.sin(t * 1.5 + b.ph) * 14;
    const flap = Math.sin(t * 14 + b.ph) > 0 ? 5 : -1;
    g.fillRect(x - 2, y, 5, 3);
    g.fillRect(x - 10, y + flap - 2, 8, 2); g.fillRect(x + 4, y + flap - 2, 8, 2);
  }
  // Ground
  g.fillStyle = '#2c3a2a'; g.fillRect(0, 330, FIELD_W, FIELD_H - 330);
  g.fillStyle = '#243021'; g.fillRect(0, 330, FIELD_W, 6);
  g.fillStyle = '#26331f';
  for (let i = 0; i < 60; i++) g.fillRect((i * 97) % FIELD_W, 340 + ((i * 53) % 190), 6, 2);
  // Worn path along the lane
  g.fillStyle = 'rgba(70,58,48,0.35)'; g.fillRect(0, 385, FIELD_W, 55);
  // Grass tufts, graves, bones
  g.fillStyle = '#3a5236';
  for (const f of tufts) { g.fillRect(f.x, f.y - f.h, 1, f.h); g.fillRect(f.x + 2, f.y - f.h + 1, 1, f.h - 1); g.fillRect(f.x - 2, f.y - f.h + 1, 1, f.h - 1); }
  for (const o of [...graves].sort((a, b) => a.y - b.y)) drawGrave(g, o);
  g.fillStyle = '#c8c0a8';
  for (const b of bones) { g.fillRect(b.x, b.y, 8, 2); g.fillRect(b.x - 1, b.y - 1, 2, 4); g.fillRect(b.x + 7, b.y - 1, 2, 4); }
}

function drawFog(g, t) {
  g.fillStyle = 'rgba(200,190,230,0.05)';
  for (let i = 0; i < 4; i++) {
    const x = ((t * (6 + i * 3) + i * 300) % (FIELD_W + 400)) - 200;
    g.beginPath(); g.ellipse(x, 400 + i * 28, 240, 26, 0, 0, Math.PI * 2); g.fill();
  }
}

// ---- The necromancer ----
function drawNecro(g, t, tier, battle) {
  const x = NECRO_X + 6, base = 432;
  // Stone platform
  g.fillStyle = '#1a1424'; g.beginPath(); g.ellipse(x, base + 2, 40, 11, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#2c2440'; g.beginPath(); g.ellipse(x, base, 38, 9, 0, 0, Math.PI * 2); g.fill();
  const cast = battle ? battle.cast : 0;
  // Aura grows with tier
  if (tier >= 1 || cast > 0) {
    const r = 55 + tier * 14 + cast * 60;
    const grad = g.createRadialGradient(x, base - 40, 4, x, base - 40, r);
    grad.addColorStop(0, `rgba(143,209,106,${0.28 + cast * 0.5})`); grad.addColorStop(1, 'rgba(143,209,106,0)');
    g.fillStyle = grad; g.fillRect(x - r, base - 40 - r, r * 2, r * 2);
  }
  const s = sprite('necro' + tier);
  const bob = Math.sin(t * 2) * 1.5;
  g.drawImage(s.img, Math.round(x - s.w / 2 - 4), Math.round(base - s.h + bob));
  // Staff orb pulse
  const ox = x - s.w / 2 - 4 + 8 * 6, oy = base - s.h + bob + 6;
  g.fillStyle = tier === 0 ? '#9a9a70' : '#b8f090';
  g.globalAlpha = 0.35 + 0.25 * Math.sin(t * 4) + cast;
  g.beginPath(); g.arc(ox, oy, 9 + cast * 10, 0, Math.PI * 2); g.fill();
  g.globalAlpha = 1;
  if (tier >= 2) { // bone crown
    g.fillStyle = '#e8e0c8';
    const cx = x - s.w / 2 - 4 + 12, cy = base - s.h + bob + 6;
    for (let i = 0; i < 4; i++) g.fillRect(cx + i * 9, cy - 8 - (i % 2) * 5, 4, 10);
  }
  if (tier >= 3) { // orbiting skulls
    for (let i = 0; i < 3; i++) {
      const a = t * 1.4 + (i * Math.PI * 2) / 3;
      const sx = x + Math.cos(a) * 34, sy = base - 44 + Math.sin(a) * 12;
      g.fillStyle = '#e8e8d8'; g.fillRect(sx - 4, sy - 4, 8, 7); g.fillRect(sx - 3, sy + 3, 6, 3);
      g.fillStyle = '#101010'; g.fillRect(sx - 3, sy - 2, 2, 2); g.fillRect(sx + 1, sy - 2, 2, 2);
    }
  }
  // Raise cooldown bars under the platform
  if (battle) {
    battle.raiseTypes().forEach((type, i) => {
      const bw = 70, bx = x - bw / 2, by = base + 18 + i * 9;
      g.fillStyle = 'rgba(0,0,0,0.65)'; g.fillRect(bx - 1, by - 1, bw + 2, 7);
      g.fillStyle = type === 'zombie' ? '#8fd16a' : '#e8e0c8';
      g.fillRect(bx, by, bw * battle.raiseProgress(type), 5);
    });
  }
}

function drawUnit(g, u, t) {
  const s = sprite(u.def.sprite);
  const bob = u.moving ? Math.abs(Math.sin(t * 9 + u.id)) * 3 : 0;
  const lunge = u.attackAnim > 0 ? (u.team === 'player' ? 1 : -1) * 4 * (u.attackAnim / 0.2) : 0;
  const px = Math.round(u.x + lunge), py = Math.round(u.y - bob);
  g.fillStyle = u.team === 'player' ? 'rgba(143,209,106,0.28)' : 'rgba(214,89,107,0.28)';
  g.beginPath(); g.ellipse(u.x, u.y, s.w * 0.45, 5, 0, 0, Math.PI * 2); g.fill();
  g.save();
  g.translate(px, py);
  if (u.team === 'enemy') g.scale(-1, 1);
  const x0 = -s.w / 2, y0 = -s.h;
  // Thin dark outline so overlapping units stay readable.
  for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) g.drawImage(s.dark, x0 + dx, y0 + dy);
  g.drawImage(u.flash > 0 ? s.flash : s.img, x0, y0);
  g.restore();
  if (u.hp < u.maxHp) {
    const w = Math.max(18, s.w * 0.8);
    g.fillStyle = '#000'; g.fillRect(px - w / 2, py - s.h - 8, w, 4);
    g.fillStyle = u.team === 'player' ? '#8fd16a' : '#d6596b';
    g.fillRect(px - w / 2, py - s.h - 8, w * Math.max(0, u.hp / u.maxHp), 4);
  }
}

export function draw(g, battle, tier = 0) {
  const t = battle.time;
  drawBackground(g, t);
  drawNecro(g, t, tier, battle);
  const sorted = [...battle.units].sort((a, b) => a.y - b.y);
  for (const u of sorted) drawUnit(g, u, t);
  drawFog(g, t);
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
  if (battle.spawnQueue.length === 0 && battle.alive('enemy') === 0 && !battle.result) {
    g.font = 'bold 28px system-ui, sans-serif'; g.fillStyle = '#e8e0f0';
    g.fillText(battle.wave >= battle.totalWaves && !battle.bossSpawned ? 'The Peasant Champion approaches!' : 'Next wave incoming...', FIELD_W / 2, 200);
  }
}

export function drawIdle(g, t, tier = 0) {
  drawBackground(g, t);
  drawNecro(g, t, tier, null);
  drawFog(g, t);
}

export { FIELD_H, GATE_X };
