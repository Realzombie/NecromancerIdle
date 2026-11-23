// The world map: a scrolling painted map of all four regions. Zones you have conquered burn and fall to ruin under an
// undead banner, the next zone pulses, and unreached lands lie under fog. Tap a zone for details and to fight.
import { ZONES, REGIONS, UNITS, worldMul, playerRating, bossAbilityNames } from './data.js';
import { zoneUnlocked } from './sim.js';
import { iconCanvas } from './render.js';

const H = 360, WW = 3400;                 // logical map size (the view shows a window of it)
const NODES = {
  1: [140, 250], 2: [390, 160], 3: [650, 255], 4: [900, 160], 5: [1150, 255], 6: [1400, 160], 7: [1660, 255], 8: [1910, 160],
  9: [2160, 255], 10: [2410, 160], 11: [2670, 255], 12: [2920, 160], 13: [3220, 230],
};
for (const id of Object.keys(NODES)) NODES[id][1] -= 34;   // leave room for the info panel at the bottom
const REGION_X = [0, 1030, 2040, 3040, WW];
const THEME = [
  { base: '#3e5a38', a: '#46663f', b: '#34502f', wall: '#8a7a68', wall2: '#6e604e', roof: '#a04838', road: '#8a6a42', peak: '#2a3c34' },
  { base: '#8a7a3a', a: '#9a8a46', b: '#76682e', wall: '#d8d0c0', wall2: '#b0a898', roof: '#4a6aa8', road: '#a8905a', peak: '#6a5a8a' },
  { base: '#c4d6e8', a: '#d6e4f0', b: '#a8bed4', wall: '#8890a0', wall2: '#6a7288', roof: '#e8f0f8', road: '#9aa0ac', peak: '#8aa0c0' },
  { base: '#2a1f3a', a: '#33264a', b: '#201830', wall: '#4a4058', wall2: '#383044', roof: '#2a2038', road: '#4a3a5a', peak: '#1a1228' },
];
const regionOf = (x) => { for (let i = 3; i >= 0; i--) if (x >= REGION_X[i]) return i; return 0; };

// What each zone looks like: buildings as [dx, dy, width, height, options], standing at the zone's node.
const ARCH = {
  1: [[-30, 4, 22, 15], [0, -4, 26, 19, { chimney: 1 }], [30, 6, 20, 13]],
  2: [[-12, 0, 36, 22, { roofH: 16 }], [24, 2, 12, 32, { roofH: 8 }], [-40, 8, 16, 11]],
  3: [[0, -2, 26, 20, { roofH: 14 }], [18, -10, 10, 38, { spire: 1 }]],
  4: [[-30, 0, 16, 42, { top: 1 }], [30, 0, 16, 42, { top: 1 }], [0, 0, 44, 24]],
  5: [[-26, 4, 22, 15], [2, 2, 22, 16, { chimney: 1 }], [30, -4, 10, 26, { spire: 1 }]],
  6: [[0, 0, 56, 32, { roofH: 20 }], [-34, 0, 12, 52, { spire: 1 }], [34, 0, 12, 52, { spire: 1 }], [0, -24, 18, 34, { spire: 1 }]],
  7: [[-30, 2, 8, 28, { spire: 1 }], [30, 2, 8, 28, { spire: 1 }], [0, 0, 26, 20, { roofH: 12 }]],
  8: [[-44, 0, 18, 56, { top: 1 }], [44, 0, 18, 56, { top: 1 }], [0, 0, 70, 32], [0, -18, 28, 64, { top: 1 }]],
  9: [[-6, 0, 18, 50, { top: 1 }], [22, 6, 22, 14], [-30, 8, 16, 12]],
  10: [[0, 0, 22, 84, { top: 1, orb: 1 }], [-28, 8, 18, 14]],
  11: [[0, 0, 44, 28, { cave: 1 }]],
  12: [[0, 0, 70, 36, { roofH: 18 }], [-34, 0, 14, 60, { top: 1 }], [34, 0, 14, 60, { top: 1 }], [0, -30, 16, 44, { spire: 1 }]],
  13: [[0, 0, 50, 36, { crypt: 1 }]],
};

function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };

// Is a point close to a road or a zone? Used to keep scenery off the paths.
function nearPath(x, y) {
  const ids = Object.keys(NODES).map(Number);
  for (const id of ids) { const [nx, ny] = NODES[id]; if (Math.hypot(x - nx, (y - ny) * 1.3) < 80) return true; }
  for (let i = 1; i < ids.length; i++) {
    const [ax, ay] = NODES[ids[i - 1]], [bx, by] = NODES[ids[i]];
    const dx = bx - ax, dy = by - ay, k = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
    if (Math.hypot(x - (ax + dx * k), y - (ay + dy * k)) < 46) return true;
  }
  return false;
}

// ---- Terrain: drawn once into a big offscreen canvas and redrawn only when the conquered zones change ----
function deadTree(g, x, y, s = 1) {
  g.fillStyle = '#0a0710'; g.fillRect(x - 2 * s, y - 22 * s, 4 * s, 22 * s);
  g.fillRect(x - 9 * s, y - 18 * s, 8 * s, 2 * s); g.fillRect(x + 1 * s, y - 14 * s, 8 * s, 2 * s); g.fillRect(x - 8 * s, y - 22 * s, 2 * s, 5 * s); g.fillRect(x + 7 * s, y - 18 * s, 2 * s, 5 * s);
}

function buildTerrain(save) {
  const c = document.createElement('canvas');
  c.width = WW; c.height = H;
  const g = c.getContext('2d');
  const R = rng(5);
  // Regions, blending softly into one another.
  g.fillStyle = THEME[0].base; g.fillRect(0, 0, WW, H);
  for (let i = 1; i < 4; i++) {
    const x0 = REGION_X[i];
    const gr = g.createLinearGradient(x0 - 110, 0, x0 + 110, 0);
    gr.addColorStop(0, rgba(THEME[i].base, 0)); gr.addColorStop(1, rgba(THEME[i].base, 1));
    g.fillStyle = gr; g.fillRect(x0 - 110, 0, WW - x0 + 110, H);
  }
  // Ground texture
  for (let i = 0; i < 2600; i++) {
    const x = R() * WW, y = R() * H, th = THEME[regionOf(x)];
    g.fillStyle = R() < 0.5 ? th.a : th.b;
    g.fillRect(x, y, 4 + R() * 8, 2 + R() * 2);
  }
  // Mountain ridge along the top edge
  for (let r = 0; r < 4; r++) {
    const x0 = REGION_X[r] - 40, x1 = REGION_X[r + 1] + 40, th = THEME[r];
    g.fillStyle = th.peak;
    g.beginPath(); g.moveTo(x0, 0);
    for (let x = x0; x <= x1; x += 26) g.lineTo(x, 24 + R() * 38 + (r === 2 ? 10 : 0));
    g.lineTo(x1, 0); g.fill();
    if (r === 2) {   // snow caps
      g.fillStyle = '#ffffff';
      for (let x = x0 + 20; x < x1; x += 60) { const h = 18 + R() * 24; g.beginPath(); g.moveTo(x - 12, h + 8); g.lineTo(x, h - 6); g.lineTo(x + 12, h + 8); g.fill(); }
    }
  }
  // Scenery that suits each region
  for (let i = 0; i < 900; i++) {
    const x = R() * WW, y = 70 + R() * (H - 78), r = regionOf(x);
    if (nearPath(x, y)) continue;
    if (r === 0) {
      if (R() < 0.6) { g.fillStyle = '#0a0710'; g.fillRect(x - 1, y - 6, 3, 8); g.fillStyle = THEME[0].peak; g.beginPath(); g.ellipse(x, y - 11, 9, 8, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#3a6a3a'; g.fillRect(x - 4, y - 15, 5, 3); }
      else { g.fillStyle = '#5a586c'; g.fillRect(x - 3, y - 9, 6, 9); g.fillRect(x - 6, y - 6, 12, 3); }
    } else if (r === 1) {
      if (R() < 0.5) { g.fillStyle = '#c8aa50'; for (let k = 0; k < 4; k++) g.fillRect(x + k * 4, y, 2, 12); g.fillStyle = '#e0c868'; for (let k = 0; k < 4; k++) g.fillRect(x + k * 4, y, 2, 3); }
      else { g.fillStyle = '#0a0710'; g.fillRect(x - 1, y - 5, 3, 7); g.fillStyle = '#6a7a30'; g.beginPath(); g.ellipse(x, y - 10, 8, 7, 0, 0, Math.PI * 2); g.fill(); }
    } else if (r === 2) {
      if (R() < 0.6) { g.fillStyle = '#0a0710'; g.fillRect(x - 1, y - 4, 3, 6); g.fillStyle = '#2a4a58'; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(x - 9 + k * 2, y - 2 - k * 8); g.lineTo(x, y - 14 - k * 8); g.lineTo(x + 9 - k * 2, y - 2 - k * 8); g.fill(); } g.fillStyle = '#ffffff'; g.fillRect(x - 3, y - 26, 6, 3); }
      else { g.fillStyle = '#8a98aa'; g.beginPath(); g.ellipse(x, y - 3, 8, 5, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#ffffff'; g.fillRect(x - 4, y - 6, 8, 2); }
    } else {
      if (R() < 0.5) deadTree(g, x, y, 0.9);
      else { g.fillStyle = '#d8d0b0'; g.fillRect(x - 5, y - 2, 10, 3); g.fillRect(x - 6, y - 4, 3, 5); g.fillRect(x + 3, y - 4, 3, 5); }
    }
  }
  // Roads between consecutive zones; the road beyond a conquered zone is scorched.
  const ids = Object.keys(NODES).map(Number);
  const Rr = rng(9);
  for (let i = 1; i < ids.length; i++) {
    const a = NODES[ids[i - 1]], b = NODES[ids[i]];
    const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2 + (i % 2 ? -26 : 26);
    const burnt = !!save.cleared[ids[i]];
    const path = () => { g.beginPath(); g.moveTo(a[0], a[1] + 8); g.quadraticCurveTo(cx, cy + 8, b[0], b[1] + 8); };
    g.lineCap = 'round';
    g.strokeStyle = burnt ? '#0e0810' : '#2a1c10'; g.lineWidth = 16; path(); g.stroke();
    g.strokeStyle = burnt ? '#33262e' : THEME[regionOf(a[0])].road; g.lineWidth = 11; path(); g.stroke();
    g.strokeStyle = burnt ? 'rgba(160,80,200,0.25)' : 'rgba(255,255,255,0.14)'; g.lineWidth = 2; g.setLineDash([6, 9]); path(); g.stroke(); g.setLineDash([]);
    if (burnt) for (let k = 0; k < 14; k++) {
      const u = Rr(), px = (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * cx + u * u * b[0], py = (1 - u) * (1 - u) * (a[1] + 8) + 2 * (1 - u) * u * (cy + 8) + u * u * (b[1] + 8);
      g.fillStyle = Rr() < 0.5 ? '#ff7a30' : '#9a5ad8'; g.fillRect(px + (Rr() - 0.5) * 8, py + (Rr() - 0.5) * 5, 2, 2);
    }
  }
  // Conquered lands: scorched earth, ash and dead trees
  for (const id of ids) {
    if (!save.cleared[id]) continue;
    const [x, y] = NODES[id], Rs = rng(id * 31);
    g.fillStyle = 'rgba(14,8,18,0.72)'; g.beginPath(); g.ellipse(x, y + 8, 88, 40, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(110,60,160,0.22)'; g.beginPath(); g.ellipse(x, y + 8, 64, 28, 0, 0, Math.PI * 2); g.fill();
    for (let k = 0; k < 26; k++) { g.fillStyle = Rs() < 0.5 ? '#3a2e44' : '#5a3a70'; g.fillRect(x + (Rs() - 0.5) * 150, y + (Rs() - 0.3) * 60, 3, 2); }
    deadTree(g, x - 70, y + 20); deadTree(g, x + 66, y + 28, 1.1); deadTree(g, x + 20, y + 40, 0.8);
  }
  // Region signposts
  g.textAlign = 'center';
  REGIONS.forEach((reg, i) => {
    const x = REGION_X[i] + 120, y = 74;
    g.fillStyle = '#0a0710'; g.fillRect(x - 78, y - 14, 156, 26); g.fillRect(x - 2, y + 12, 4, 20);
    g.fillStyle = '#6a4a2a'; g.fillRect(x - 76, y - 12, 152, 22); g.fillRect(x - 1, y + 12, 2, 20);
    g.fillStyle = '#f0e0b8'; g.font = 'bold 12px system-ui, sans-serif'; g.fillText(reg.name, x, y + 4);
  });
  return c;
}

// ---- Settlements ----
function flame(g, x, y, t, seed) {
  const f = 0.7 + 0.5 * Math.sin(t * 11 + seed) * Math.sin(t * 7.3 + seed * 2);
  g.fillStyle = '#ff5a20'; g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x, y - 9 * f - 3); g.lineTo(x + 4, y); g.fill();
  g.fillStyle = '#ffc040'; g.beginPath(); g.moveTo(x - 2, y); g.lineTo(x, y - 5 * f - 1); g.lineTo(x + 2, y); g.fill();
}
function smoke(g, x, y, t, col, seed) {
  for (let i = 0; i < 4; i++) {
    const u = ((t * 0.5 + i * 0.25 + seed) % 1);
    g.globalAlpha = (1 - u) * 0.5; g.fillStyle = col;
    g.beginPath(); g.arc(x + Math.sin(u * 5 + seed) * 5, y - u * 34, 3 + u * 5, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
}

function building(g, x, y, w, h, o, ruin, t, pal) {
  const seed = Math.floor(x * 7 + y * 13);
  const l = x - w / 2;
  if (o.cave) {                      // a cave mouth under a dragon skull
    g.fillStyle = '#0a0710'; g.beginPath(); g.ellipse(x, y, w / 2 + 2, h + 2, 0, Math.PI, 0); g.fill();
    g.fillStyle = ruin ? '#4a4256' : '#6a6070'; g.beginPath(); g.ellipse(x, y, w / 2, h, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#05030a'; g.beginPath(); g.ellipse(x, y, w / 3, h * 0.7, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#e8e0c8'; g.fillRect(x - 9, y - h - 8, 18, 8); g.fillRect(x - 6, y - h, 12, 4);
    g.fillStyle = '#0a0710'; g.fillRect(x - 6, y - h - 6, 4, 4); g.fillRect(x + 2, y - h - 6, 4, 4);
    if (ruin) smoke(g, x, y - h - 6, t, 'rgba(120,100,140,1)', seed % 7);
    else { g.fillStyle = 'rgba(255,200,80,' + (0.5 + 0.3 * Math.sin(t * 3)) + ')'; g.fillRect(x - 6, y - 8, 12, 4); }
    return;
  }
  if (o.crypt) {                     // the Endless Crypt: a stone arch and a green glow
    g.fillStyle = '#0a0710'; g.fillRect(l - 2, y - h - 2, w + 4, h + 2);
    g.fillStyle = '#4a4058'; g.fillRect(l, y - h, w, h);
    g.fillStyle = '#383044'; for (let i = 0; i < w; i += 8) g.fillRect(l + i, y - h, 3, 4);
    g.fillStyle = '#05030a'; g.beginPath(); g.ellipse(x, y, 13, 22, 0, Math.PI, 0); g.fill();
    g.fillStyle = 'rgba(120,255,150,' + (0.45 + 0.25 * Math.sin(t * 2)) + ')'; g.beginPath(); g.ellipse(x, y, 9, 15, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#e8e8d8'; g.fillRect(x - 5, y - h - 8, 10, 8); g.fillStyle = '#0a0710'; g.fillRect(x - 3, y - h - 6, 2, 3); g.fillRect(x + 1, y - h - 6, 2, 3);
    smoke(g, x - 16, y - h, t, 'rgba(120,255,160,1)', 0.2); smoke(g, x + 16, y - h, t, 'rgba(120,255,160,1)', 0.6);
    return;
  }
  const hh = ruin ? Math.max(9, h * (0.45 + 0.22 * hash(seed))) : h;
  if (ruin) {                        // broken walls: columns of uneven height
    for (let cx = 0; cx < w; cx += 4) {
      const ch = hh * (0.55 + 0.45 * hash(seed + cx * 3));
      g.fillStyle = '#0a0710'; g.fillRect(l + cx - 1, y - ch - 1, 6, ch + 1);
      g.fillStyle = hash(seed + cx) < 0.5 ? '#3e3648' : '#352e40'; g.fillRect(l + cx, y - ch, 4, ch);
    }
  } else {
    g.fillStyle = '#0a0710'; g.fillRect(l - 1, y - hh - 1, w + 2, hh + 2);
    g.fillStyle = pal.wall; g.fillRect(l, y - hh, w, hh);
    g.fillStyle = pal.wall2; g.fillRect(l, y - hh * 0.5, w, 2); g.fillRect(l + w * 0.25, y - hh, 2, hh * 0.5); g.fillRect(l + w * 0.65, y - hh * 0.5, 2, hh * 0.5);
    if (o.top) { g.fillStyle = '#0a0710'; for (let i = 0; i < w; i += 6) g.fillRect(l + i - 1, y - hh - 6, 5, 7); g.fillStyle = pal.wall; for (let i = 0; i < w; i += 6) g.fillRect(l + i, y - hh - 5, 3, 5); }
    else if (o.spire) { g.fillStyle = '#0a0710'; g.beginPath(); g.moveTo(l - 2, y - hh); g.lineTo(x, y - hh - w * 1.6 - 2); g.lineTo(l + w + 2, y - hh); g.fill(); g.fillStyle = pal.roof; g.beginPath(); g.moveTo(l, y - hh); g.lineTo(x, y - hh - w * 1.6); g.lineTo(l + w, y - hh); g.fill(); }
    else if (w >= 14) { const rh = o.roofH || w * 0.45; g.fillStyle = '#0a0710'; g.beginPath(); g.moveTo(l - 4, y - hh); g.lineTo(x, y - hh - rh - 2); g.lineTo(l + w + 4, y - hh); g.fill(); g.fillStyle = pal.roof; g.beginPath(); g.moveTo(l - 3, y - hh); g.lineTo(x, y - hh - rh); g.lineTo(l + w + 3, y - hh); g.fill(); }
  }
  // windows
  const n = Math.max(1, Math.floor(w / 12));
  for (let k = 0; k < n; k++) {
    const wx = l + (w / (n + 1)) * (k + 1) - 1.5, wy = y - hh * 0.62;
    if (ruin) { if (k % 2 === 0) { g.fillStyle = 'rgba(125,255,154,' + (0.35 + 0.3 * Math.sin(t * 3 + k + seed)) + ')'; g.fillRect(wx, wy, 3, 5); } }
    else { g.fillStyle = 'rgba(255,216,112,' + (0.7 + 0.3 * Math.sin(t * 2 + k + seed)) + ')'; g.fillRect(wx, wy, 3, 5); }
  }
  if (!ruin && w >= 20 && !o.top) { g.fillStyle = '#2a1c10'; g.fillRect(x - 2, y - 7, 4, 7); }
  if (ruin) {
    flame(g, l + w * 0.25, y - hh * 0.9, t, seed); if (w > 24) flame(g, l + w * 0.75, y - hh * 0.8, t, seed + 4);
    smoke(g, l + w * 0.3, y - hh - 3, t, 'rgba(70,60,84,1)', (seed % 10) / 10);
  } else if (o.chimney) smoke(g, x + w * 0.25, y - hh - 8, t, 'rgba(200,196,210,1)', (seed % 10) / 10);
  if (o.orb) { g.fillStyle = 'rgba(140,200,255,' + (0.5 + 0.3 * Math.sin(t * 3)) + ')'; g.beginPath(); g.arc(x, y - hh - 12, 7 + Math.sin(t * 3), 0, Math.PI * 2); g.fill(); g.fillStyle = '#ffffff'; g.fillRect(x - 2, y - hh - 14, 4, 4); }
}

// A waving flag: red and white banners for the living, a tattered purple one with a skull for the dead.
function flag(g, x, y, t, ruin) {
  g.fillStyle = '#0a0710'; g.fillRect(x - 1, y - 20, 3, 22);
  const w = Math.sin(t * 5 + x) * 2;
  if (ruin) {
    g.fillStyle = '#5a2a8a'; g.beginPath(); g.moveTo(x + 2, y - 20); g.lineTo(x + 16 + w, y - 17); g.lineTo(x + 11, y - 13); g.lineTo(x + 16 + w, y - 9); g.lineTo(x + 2, y - 8); g.fill();
    g.fillStyle = '#b8f0a0'; g.fillRect(x + 5, y - 17, 5, 5); g.fillStyle = '#0a0710'; g.fillRect(x + 6, y - 16, 1, 1); g.fillRect(x + 8, y - 16, 1, 1);
  } else {
    g.fillStyle = '#d03030'; g.fillRect(x + 2, y - 20, 14 + w, 8); g.fillStyle = '#f0f0f0'; g.fillRect(x + 2, y - 16, 14 + w, 2);
  }
}

function drawNode(g, id, t, state, pal) {
  const [x, y] = NODES[id];
  const ruin = state === 'cleared';
  const list = ARCH[id];
  // soft ground under the buildings
  g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.ellipse(x, y + 8, 62, 22, 0, 0, Math.PI * 2); g.fill();
  const order = [...list].sort((a, b) => a[1] - b[1]);
  let top = 0;
  for (const [dx, dy, w, h, o = {}] of order) { building(g, x + dx, y + dy, w, h, o, ruin, t, pal); top = Math.max(top, h + (o.spire ? w * 1.6 : o.roofH || 0) - dy); }
  const boss = ZONES.find((z) => z.id === id);
  if (boss && !boss.endless && id % 4 === 0) flag(g, x, y - top * (ruin ? 0.62 : 1) - 4, t, ruin);
  else if (ruin) flag(g, x + 40, y - 6, t, true);
}

// ---- The map controller ----
export function createWorldMap({ save, startBattle, play }) {
  const view = document.getElementById('map-view');
  const canvas = document.getElementById('map-canvas');
  const panel = document.getElementById('map-panel');
  const g = canvas.getContext('2d');
  let W = 640, scrollX = 0, targetX = 0, selected = null;
  let terrain = null, terrainKey = '';
  let running = false, raf = 0, t0 = 0;
  const token = () => iconCanvas('necro0');

  function size() {
    const r = view.getBoundingClientRect();
    if (!r.width || !r.height) return;
    W = Math.max(320, Math.round((r.width / r.height) * H));
    canvas.width = W; canvas.height = H;
    g.imageSmoothingEnabled = false;
    clampScroll();
  }
  const clampScroll = () => { scrollX = Math.max(0, Math.min(WW - W, scrollX)); targetX = Math.max(0, Math.min(WW - W, targetX)); };

  const frontier = () => {
    for (const z of ZONES) if (!save.cleared[z.id] && zoneUnlocked(save, z.id)) return z.id;
    return 1;
  };
  const stateOf = (id) => (save.cleared[id] ? 'cleared' : zoneUnlocked(save, id) ? 'open' : 'locked');
  const firstLocked = () => { for (const z of ZONES) if (!zoneUnlocked(save, z.id)) return z.id; return 99; };

  function centerOn(id, instant) {
    targetX = NODES[id][0] - W / 2;
    clampScroll();
    if (instant) scrollX = targetX;
  }

  function frame(now) {
    if (!running) return;
    const t = (now - t0) / 1000;
    const key = ZONES.map((z) => (save.cleared[z.id] ? 1 : 0)).join('');
    if (!terrain || key !== terrainKey) { terrain = buildTerrain(save); terrainKey = key; }
    scrollX += (targetX - scrollX) * 0.12;
    const sx = Math.round(scrollX);
    g.clearRect(0, 0, W, H);
    g.drawImage(terrain, sx, 0, W, H, 0, 0, W, H);
    g.save(); g.translate(-sx, 0);
    const ids = ZONES.map((z) => z.id).sort((a, b) => NODES[a][1] - NODES[b][1]);
    for (const id of ids) {
      const x = NODES[id][0];
      if (x < sx - 120 || x > sx + W + 120) continue;
      const st = stateOf(id), pal = THEME[regionOf(x)];
      if (id === selected) { g.strokeStyle = 'rgba(255,255,255,' + (0.6 + 0.3 * Math.sin(t * 6)) + ')'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, NODES[id][1] + 8, 72, 28, 0, 0, Math.PI * 2); g.stroke(); }
      drawNode(g, id, t, st, pal);
    }
    // Fog over the lands you have not reached
    const fl = firstLocked();
    if (fl !== 99) {
      const fx = NODES[fl][0] - 120;
      const gr = g.createLinearGradient(fx - 160, 0, fx + 60, 0);
      gr.addColorStop(0, 'rgba(18,13,28,0)'); gr.addColorStop(1, 'rgba(18,13,28,0.93)');
      g.fillStyle = gr; g.fillRect(fx - 160, 0, WW - fx + 160, H);
      g.fillStyle = 'rgba(160,140,200,0.10)';
      for (let i = 0; i < 6; i++) { const mx = fx - 40 + Math.sin(t * 0.3 + i) * 40 + i * 6; g.beginPath(); g.ellipse(mx, 70 + i * 48, 110, 24, 0, 0, Math.PI * 2); g.fill(); }
    }
    // Labels, the pulsing frontier marker and the necromancer
    const fr = frontier();
    g.textAlign = 'center'; g.font = 'bold 12px system-ui, sans-serif';
    for (const z of ZONES) {
      const [x, y] = NODES[z.id];
      if (x < sx - 100 || x > sx + W + 100) continue;
      const st = stateOf(z.id);
      if (st === 'locked' && z.id !== firstLocked()) continue;
      const label = st === 'locked' ? '???' : z.name;
      g.fillStyle = '#0a0710'; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.fillText(label, x + dx, y + 36 + dy);
      g.fillStyle = st === 'cleared' ? '#c8a0ff' : st === 'locked' ? '#8a7aa8' : '#fff0c0'; g.fillText(label, x, y + 36);
      if (st !== 'locked') { g.fillStyle = st === 'cleared' ? '#9a60d8' : '#c8a040'; g.beginPath(); g.arc(x - g.measureText(label).width / 2 - 9, y + 32, 6, 0, Math.PI * 2); g.fill(); g.fillStyle = '#0a0710'; g.font = 'bold 9px system-ui, sans-serif'; g.fillText(st === 'cleared' ? '✓' : z.endless ? '∞' : z.id, x - g.measureText(label).width / 2 - 9, y + 35); g.font = 'bold 12px system-ui, sans-serif'; }
    }
    {
      const [x, y] = NODES[fr];
      const b = Math.abs(Math.sin(t * 3)) * 6;
      g.fillStyle = '#ffd060'; g.beginPath(); g.moveTo(x - 7, y - 104 - b); g.lineTo(x + 7, y - 104 - b); g.lineTo(x, y - 94 - b); g.fill();
      g.strokeStyle = 'rgba(255,208,96,' + (0.4 + 0.3 * Math.sin(t * 4)) + ')'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y + 8, 80, 31, 0, 0, Math.PI * 2); g.stroke();
      const tk = token();
      g.drawImage(tk, x - 70, y + 6 - tk.height * 0.55 - Math.abs(Math.sin(t * 2)) * 2, tk.width * 0.55, tk.height * 0.55);
    }
    g.restore();
    raf = requestAnimationFrame(frame);
  }

  // ---- Panel ----
  function renderPanel() {
    if (selected === null) { panel.classList.add('hidden'); return; }
    const z = ZONES.find((q) => q.id === selected);
    const st = stateOf(z.id);
    const wm = worldMul(save), mine = playerRating(save), need = Math.round(z.rating * wm.rating);
    const diff = mine >= need ? 'ok' : mine >= need * 0.7 ? 'hard' : 'wall';
    panel.classList.remove('hidden');
    const boss = z.boss && UNITS[z.boss];
    const lines = [];
    lines.push('<div class="wline">' + (st === 'locked' ? 'Locked: conquer the zone before it.' : z.blurb) + '</div>');
    if (z.endless) lines.push('<div class="wline">Best: wave ' + (save.bestEndless || 0) + '. No boss, no end. New record waves pay essence, gear and a champion soul every 10 waves.</div>');
    else {
      if (st !== 'locked') lines.push('<div class="wline zrate ' + diff + '">Rating ' + need + ' (you ' + mine + ')</div>');
      lines.push('<div class="wline">Boss: <b>' + boss.name + '</b> <small class="zabil">' + bossAbilityNames(boss).join(' &middot; ') + '</small></div>');
    }
    panel.innerHTML = '<div class="wtext"><div class="wtitle">' + z.name + (st === 'cleared' ? ' (conquered, in ruins)' : '') + '</div>' + lines.join('') + '</div>';
    const b = document.createElement('button');
    b.className = 'big wbuy';
    b.textContent = z.endless ? 'Enter' : st === 'cleared' ? 'Replay' : 'Fight';
    b.disabled = st === 'locked';
    b.onclick = () => startBattle(z.id);
    panel.appendChild(b);
  }

  // ---- Input: drag to pan, tap a zone to select it ----
  let down = null, moved = false;
  view.addEventListener('pointerdown', (e) => { down = { x: e.clientX, id: e.pointerId, sx: scrollX }; moved = false; });
  window.addEventListener('pointermove', (e) => {
    if (!down || e.pointerId !== down.id) return;
    const r = view.getBoundingClientRect();
    const dx = e.clientX - down.x;
    if (Math.abs(dx) > 8) moved = true;
    if (moved) { scrollX = down.sx - (dx * W) / r.width; targetX = scrollX; clampScroll(); }
  });
  window.addEventListener('pointerup', (e) => {
    if (!down || e.pointerId !== down.id) return;
    const wasTap = !moved;
    const r = view.getBoundingClientRect();
    const wx = ((e.clientX - r.left) / r.width) * W + scrollX, wy = ((e.clientY - r.top) / r.height) * H;
    down = null;
    if (!wasTap || !e.target.closest || !e.target.closest('#map-view') || e.target.closest('#map-panel')) return;
    let best = null, bd = 70;
    for (const z of ZONES) { const d = Math.hypot(wx - NODES[z.id][0], (wy - NODES[z.id][1]) * 1.2); if (d < bd) { bd = d; best = z.id; } }
    if (best !== null) { play('click'); selected = best; renderPanel(); centerOn(best); }
  });
  view.addEventListener('wheel', (e) => { e.preventDefault(); targetX += e.deltaY + e.deltaX; scrollX = targetX; clampScroll(); }, { passive: false });
  window.addEventListener('resize', size);

  return {
    show() {
      running = true; t0 = performance.now(); terrain = null;
      size();
      selected = frontier();
      centerOn(selected, true);
      renderPanel();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    },
    stop() { running = false; cancelAnimationFrame(raf); },
  };
}
