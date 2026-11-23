// The world map: a scrolling painted map of all four regions. The ground is generated from layered noise (hills,
// meadows, snow, ash), with rivers, bridges, forests, mountain ranges and landmarks on top. Zones you have conquered
// burn and fall to ruin under an undead banner with glowing cracks, crows and marching dead; the next zone pulses and
// unreached lands lie under drifting fog. Tap a zone for details and to fight.
import { ZONES, REGIONS, UNITS, worldMul, playerRating, bossAbilityNames, hazardText } from './data.js';
import { zoneUnlocked } from './sim.js';
import { iconCanvas } from './render.js';

const H = 360, WW = 3400;                 // logical map size (the view shows a window of it)
const NODES = {
  1: [140, 250], 2: [390, 160], 3: [650, 255], 4: [900, 160], 5: [1150, 255], 6: [1400, 160], 7: [1660, 255], 8: [1910, 160],
  9: [2160, 255], 10: [2410, 160], 11: [2670, 255], 12: [2920, 160], 13: [3220, 230],
};
for (const id of Object.keys(NODES)) NODES[id][1] -= 34;   // leave room for the info panel at the bottom
const IDS = Object.keys(NODES).map(Number);
const REGION_X = [0, 1030, 2040, 3040, WW];
const THEME = [
  { lo: '#2b4a2a', hi: '#5a8442', wall: '#8a7a68', wall2: '#6e604e', house: '#7a5a3a', roof: '#a04838', road: '#9a7a4c', peak: '#4a5c58', water: '#2a5a7a' },
  { lo: '#7a6a30', hi: '#b2a050', wall: '#d8d0c0', wall2: '#b0a898', house: '#a08a60', roof: '#4a6aa8', road: '#b8a068', peak: "#8a7a78", water: '#3a6a8c' },
  { lo: '#a4b8d0', hi: '#eef4fb', wall: '#8890a0', wall2: '#6a7288', house: '#6a5a50', roof: '#e8f0f8', road: '#a8aeba', peak: '#8aa0c0', water: '#7fb4d8' },
  { lo: '#1a1226', hi: '#3a2a58', wall: '#4a4058', wall2: '#383044', house: '#3a3048', roof: '#2a2038', road: '#5a4a6a', peak: '#241a38', water: '#3a1a5a' },
];
const regionOf = (x) => { for (let i = 3; i >= 0; i--) if (x >= REGION_X[i]) return i; return 0; };

// What each zone looks like: buildings as [dx, dy, width, height, options], standing at the zone's node.
const ARCH = {
  1: [[-34, 6, 20, 14, { wood: 1 }], [0, -4, 26, 19, { chimney: 1, wood: 1 }], [32, 8, 18, 12, { wood: 1 }], [-14, 16, 14, 10, { wood: 1 }]],
  2: [[-12, 0, 36, 22, { roofH: 16 }], [24, 2, 12, 32, { roofH: 8 }], [-42, 10, 16, 11, { wood: 1 }], [40, 14, 14, 10, { wood: 1 }]],
  3: [[0, -2, 28, 20, { roofH: 14 }], [20, -10, 10, 38, { spire: 1 }], [-30, 10, 14, 10]],
  4: [[-32, 0, 16, 42, { top: 1 }], [32, 0, 16, 42, { top: 1 }], [0, 0, 48, 26, { gate: 1 }]],
  5: [[-28, 6, 22, 15, { wood: 1 }], [2, 2, 22, 16, { chimney: 1, wood: 1 }], [32, -4, 10, 26, { spire: 1 }], [-6, 16, 16, 10]],
  6: [[0, 0, 56, 32, { roofH: 20 }], [-36, 0, 12, 52, { spire: 1 }], [36, 0, 12, 52, { spire: 1 }], [0, -24, 18, 34, { spire: 1 }]],
  7: [[-32, 2, 8, 28, { spire: 1 }], [32, 2, 8, 28, { spire: 1 }], [0, 0, 28, 20, { roofH: 12 }], [-14, 12, 14, 10]],
  8: [[-46, 0, 18, 56, { top: 1 }], [46, 0, 18, 56, { top: 1 }], [0, 0, 72, 32, { gate: 1 }], [0, -18, 28, 64, { top: 1 }]],
  9: [[-6, 0, 18, 50, { top: 1 }], [24, 6, 22, 14, { wood: 1 }], [-32, 10, 16, 12, { wood: 1 }]],
  10: [[0, 0, 22, 84, { top: 1, orb: 1 }], [-30, 8, 18, 14], [30, 10, 14, 12]],
  11: [[0, 0, 46, 28, { cave: 1 }]],
  12: [[0, 0, 72, 36, { roofH: 18, gate: 1 }], [-36, 0, 14, 60, { top: 1 }], [36, 0, 14, 60, { top: 1 }], [0, -30, 16, 44, { spire: 1 }]],
  13: [[0, 0, 50, 36, { crypt: 1 }]],
};

// ---- Small helpers ----
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
const hash2 = (x, y, s) => { let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1274126177)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(hash2(xi, yi, s), hash2(xi + 1, yi, s), u), lerp(hash2(xi, yi + 1, s), hash2(xi + 1, yi + 1, s), u), v);
}
function fbm(x, y, s, oct = 3) { let a = 0.5, f = 1, sum = 0, norm = 0; for (let i = 0; i < oct; i++) { sum += vnoise(x * f, y * f, s + i * 7) * a; norm += a; a *= 0.5; f *= 2; } return sum / norm; }
const hexRgb = (c) => { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const rgba = (hex, a) => { const [r, g, b] = hexRgb(hex); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; };
const shadeCache = {};
function shade(hex, f) {
  const k = hex + f; if (shadeCache[k]) return shadeCache[k];
  const [r, g, b] = hexRgb(hex).map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
  return (shadeCache[k] = 'rgb(' + r + ',' + g + ',' + b + ')');
}
const PAL = THEME.map((t) => ({ lo: hexRgb(t.lo), hi: hexRgb(t.hi) }));

// ---- Rivers, lakes and roads ----
const RIVERS = [
  { pts: [[500, 88], [480, 128], [535, 175], [495, 235], [540, 295], [515, 372]], r: 0 },
  { pts: [[1300, 88], [1270, 128], [1315, 185], [1275, 250], [1310, 372]], r: 1 },
];
const LAKES = [{ x: 2330, y: 238, rx: 74, ry: 26, kind: 'ice' }, { x: 3110, y: 240, rx: 60, ry: 22, kind: 'ichor' }];
const ROADS = IDS.slice(1).map((id, i) => {
  const a = NODES[IDS[i]], b = NODES[id];
  return { to: id, ax: a[0], ay: a[1] + 8, bx: b[0], by: b[1] + 8, cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2 + 8 + ((i + 1) % 2 ? -26 : 26) };
});
const roadPt = (r, u) => ({ x: (1 - u) * (1 - u) * r.ax + 2 * (1 - u) * u * r.cx + u * u * r.bx, y: (1 - u) * (1 - u) * r.ay + 2 * (1 - u) * u * r.cy + u * u * r.by });
function riverSamples(rv) {          // dense points along a river's smoothed centre line
  if (rv.samples) return rv.samples;
  const out = [], p = rv.pts;
  for (let i = 0; i < p.length - 1; i++) for (let k = 0; k < 12; k++) {
    const u = k / 12;
    const sm = u * u * (3 - 2 * u);
    out.push([lerp(p[i][0], p[i + 1][0], u), lerp(p[i][1], p[i + 1][1], sm)]);
  }
  out.push(p[p.length - 1]);
  return (rv.samples = out);
}
const nearRiver = (x, y, d) => RIVERS.some((rv) => riverSamples(rv).some(([rx, ry]) => Math.hypot(rx - x, ry - y) < d));
const inLake = (x, y, k = 1) => LAKES.some((l) => ((x - l.x) / (l.rx * k)) ** 2 + ((y - l.y) / (l.ry * k)) ** 2 < 1);

const nearLandmark = (x, y, d) => LANDMARKS.some((l) => Math.hypot(l.x - x, (l.y - 14 - y) * 1.4) < d);
function nearPath(x, y, pad = 0) {
  for (const id of IDS) { const [nx, ny] = NODES[id]; if (Math.hypot(x - nx, (y - ny) * 1.3) < 84 + pad) return true; }
  for (const r of ROADS) for (let k = 0; k <= 16; k++) { const p = roadPt(r, k / 16); if (Math.hypot(x - p.x, y - p.y) < 30 + pad) return true; }
  return false;
}

// ---- Ground: generated once from noise (never changes) ----
let groundCache = null;
function buildGround() {
  if (groundCache) return groundCache;
  const c = document.createElement('canvas');
  c.width = WW; c.height = H;
  const g = c.getContext('2d');
  const CS = 2, cols = WW / CS + 2, rows = H / CS + 2;
  const hm = new Float32Array(cols * rows);
  for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) hm[cy * cols + cx] = fbm(cx * CS * 0.011, cy * CS * 0.02, 3, 3);
  for (let cy = 0; cy < rows - 1; cy++) {
    for (let cx = 0; cx < cols - 1; cx++) {
      const x = cx * CS, y = cy * CS;
      const wx = x + (fbm(x * 0.004, y * 0.006, 11, 2) - 0.5) * 150;
      let r = PAL[0].lo, h2 = PAL[0].hi;
      for (let i = 1; i < 4; i++) {
        const t = smooth(REGION_X[i] - 100, REGION_X[i] + 100, wx);
        if (t > 0) { r = r.map((v, k) => lerp(v, PAL[i].lo[k], t)); h2 = h2.map((v, k) => lerp(v, PAL[i].hi[k], t)); }
      }
      const h = hm[cy * cols + cx];
      const slope = (h - hm[Math.max(0, cy - 1) * cols + Math.max(0, cx - 1)]) * 70;
      const tone = Math.max(0, Math.min(1, h * 1.25 - 0.1));
      const grain = (hash2(cx, cy, 5) - 0.5) * 9;
      const dark = 1 - smooth(110, 40, y) * 0.35;        // the foot of the mountains is shadowed
      const R = (lerp(r[0], h2[0], tone) + slope + grain) * dark, G = (lerp(r[1], h2[1], tone) + slope + grain) * dark, B = (lerp(r[2], h2[2], tone) + slope + grain) * dark;
      g.fillStyle = 'rgb(' + (R < 0 ? 0 : R > 255 ? 255 : R | 0) + ',' + (G < 0 ? 0 : G > 255 ? 255 : G | 0) + ',' + (B < 0 ? 0 : B > 255 ? 255 : B | 0) + ')';
      g.fillRect(x, y, CS, CS);
    }
  }
  groundCache = c;
  return c;
}

// ---- Static features, redrawn only when the set of conquered zones changes ----
function smoothLine(g, pts) {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); }
  g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
}

function deadTree(g, x, y, s = 1) {
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(x + 3 * s, y + 1, 8 * s, 3 * s, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#0a0710'; g.fillRect(x - 2 * s, y - 22 * s, 4 * s, 22 * s);
  g.fillRect(x - 9 * s, y - 18 * s, 8 * s, 2 * s); g.fillRect(x + 1 * s, y - 14 * s, 8 * s, 2 * s); g.fillRect(x - 8 * s, y - 22 * s, 2 * s, 5 * s); g.fillRect(x + 7 * s, y - 18 * s, 2 * s, 5 * s);
  g.fillStyle = '#2a2030'; g.fillRect(x - 1 * s, y - 21 * s, 1 * s, 20 * s);
}

function tree(g, x, y, kind, s, R) {
  g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.ellipse(x + 5 * s, y + 1, 10 * s, 3.5 * s, 0, 0, Math.PI * 2); g.fill();
  if (kind === 'oak') {
    g.fillStyle = '#1a1008'; g.fillRect(x - 2 * s, y - 8 * s, 4 * s, 9 * s);
    g.fillStyle = '#5a3c20'; g.fillRect(x - 1 * s, y - 8 * s, 2 * s, 8 * s);
    const blobs = [[0, -17, 9], [-6, -12, 7], [6, -12, 7], [0, -23, 6]];
    g.fillStyle = '#0c1a0c'; for (const [dx, dy, r] of blobs) { g.beginPath(); g.arc(x + dx * s, y + dy * s, (r + 1.5) * s, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#2f5a2c'; for (const [dx, dy, r] of blobs) { g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#44803c'; for (const [dx, dy, r] of blobs) { g.beginPath(); g.arc(x + (dx - 2) * s, y + (dy - 2) * s, r * 0.55 * s, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#6aa855'; g.fillRect(x - 5 * s, y - 24 * s, 3 * s, 2 * s);
  } else if (kind === 'orchard') {
    g.fillStyle = '#1a1008'; g.fillRect(x - 1.5 * s, y - 7 * s, 3 * s, 8 * s);
    g.fillStyle = '#0c1a0c'; g.beginPath(); g.ellipse(x, y - 13 * s, 10 * s, 8 * s, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#6a7e30'; g.beginPath(); g.ellipse(x, y - 13 * s, 8.5 * s, 6.5 * s, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#8c9e44'; g.beginPath(); g.ellipse(x - 2 * s, y - 15 * s, 5 * s, 3.5 * s, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#d04030'; for (let k = 0; k < 4; k++) g.fillRect(x + (R() - 0.5) * 12 * s, y - 13 * s + (R() - 0.5) * 8 * s, 2, 2);
  } else if (kind === 'pine') {
    g.fillStyle = '#1a1008'; g.fillRect(x - 1.5 * s, y - 5 * s, 3 * s, 6 * s);
    for (let k = 0; k < 3; k++) {
      const by = y - 4 * s - k * 8 * s, w = (11 - k * 2.6) * s, h = 12 * s;
      g.fillStyle = '#0a1820'; g.beginPath(); g.moveTo(x - w - 1.5, by); g.lineTo(x, by - h - 1.5); g.lineTo(x + w + 1.5, by); g.fill();
      g.fillStyle = '#25495a'; g.beginPath(); g.moveTo(x - w, by); g.lineTo(x, by - h); g.lineTo(x + w, by); g.fill();
      g.fillStyle = '#3a6478'; g.beginPath(); g.moveTo(x - w, by); g.lineTo(x, by - h); g.lineTo(x - 1, by); g.fill();
      g.fillStyle = '#f4f8ff'; g.beginPath(); g.moveTo(x - w * 0.62, by - h * 0.38); g.lineTo(x, by - h); g.lineTo(x + w * 0.62, by - h * 0.38); g.lineTo(x + w * 0.2, by - h * 0.5); g.lineTo(x - w * 0.2, by - h * 0.44); g.fill();
    }
  } else {
    deadTree(g, x, y, s);
  }
}

function peaks(g, r, R) {
  const th = THEME[r], x0 = REGION_X[r] - 80, x1 = REGION_X[r + 1] + 80;
  for (let row = 0; row < 2; row++) {
    const back = row === 0;
    for (let x = x0 - 30; x < x1; x += 34 + R() * 26) {
      const w = 38 + R() * 34, h = (back ? 40 : 28) + R() * 26, by = (back ? 72 : 82) + R() * 8;
      const base = shade(th.peak, back ? 0.82 : 1);
      g.fillStyle = '#0a0710'; g.beginPath(); g.moveTo(x - w / 2 - 1, by + 1); g.lineTo(x + (R() - 0.5) * 8, by - h - 1); g.lineTo(x + w / 2 + 1, by + 1); g.fill();
      g.fillStyle = base; g.beginPath(); g.moveTo(x - w / 2, by); g.lineTo(x, by - h); g.lineTo(x + w / 2, by); g.fill();
      g.fillStyle = shade(th.peak, back ? 0.55 : 0.68); g.beginPath(); g.moveTo(x, by - h); g.lineTo(x + w / 2, by); g.lineTo(x + w * 0.1, by); g.lineTo(x - w * 0.02, by - h * 0.45); g.fill();
      g.fillStyle = shade(th.peak, back ? 1.2 : 1.35); g.beginPath(); g.moveTo(x, by - h); g.lineTo(x - w * 0.28, by - h * 0.42); g.lineTo(x - w * 0.08, by - h * 0.55); g.fill();
      if (r === 2 || (r === 1 && h > 66) || (r === 0 && h > 78)) {   // snow caps
        g.fillStyle = r === 3 ? '#8a60c0' : '#f4f8ff';
        g.beginPath(); g.moveTo(x, by - h); g.lineTo(x - w * 0.2, by - h * 0.68); g.lineTo(x - w * 0.07, by - h * 0.74); g.lineTo(x + w * 0.04, by - h * 0.62); g.lineTo(x + w * 0.17, by - h * 0.7); g.fill();
      }
      if (r === 3) {   // glowing fissures
        g.strokeStyle = 'rgba(150,90,230,0.85)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 2, by - h * 0.55); g.lineTo(x + 3, by - h * 0.35); g.lineTo(x - 1, by - h * 0.18); g.stroke();
      }
    }
  }
}

function drawRivers(g, scorch) {
  for (const rv of RIVERS) {
    const th = THEME[rv.r];
    g.lineCap = 'round'; g.lineJoin = 'round';
    const p = rv.pts;
    g.strokeStyle = '#0a0710'; g.lineWidth = 24; smoothLine(g, p); g.stroke();
    g.strokeStyle = shade(th.water, 0.55); g.lineWidth = 21; smoothLine(g, p); g.stroke();
    g.strokeStyle = th.water; g.lineWidth = 16; smoothLine(g, p); g.stroke();
    g.strokeStyle = shade(th.water, 1.35); g.lineWidth = 6; g.globalAlpha = 0.45; smoothLine(g, p); g.stroke(); g.globalAlpha = 1;
    // pebbled banks
    const R = rng(rv.r + 40);
    for (const [x, y] of riverSamples(rv)) { if (R() < 0.5) { g.fillStyle = '#8a8478'; g.fillRect(x + (R() < 0.5 ? -13 : 12), y + (R() - 0.5) * 8, 2, 2); } }
  }
  for (const l of LAKES) {
    g.fillStyle = '#0a0710'; g.beginPath(); g.ellipse(l.x, l.y, l.rx + 4, l.ry + 4, 0, 0, Math.PI * 2); g.fill();
    if (l.kind === 'ice') {
      g.fillStyle = '#b8dcf0'; g.beginPath(); g.ellipse(l.x, l.y, l.rx, l.ry, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#e6f4fc'; g.beginPath(); g.ellipse(l.x - 10, l.y - 5, l.rx * 0.7, l.ry * 0.55, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(70,110,150,0.6)'; g.lineWidth = 1; const R = rng(77);
      for (let i = 0; i < 6; i++) { let x = l.x + (R() - 0.5) * l.rx, y = l.y + (R() - 0.5) * l.ry; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 3; k++) { x += (R() - 0.5) * 30; y += (R() - 0.5) * 10; g.lineTo(x, y); } g.stroke(); }
    } else {
      g.fillStyle = '#2a0e44'; g.beginPath(); g.ellipse(l.x, l.y, l.rx, l.ry, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#4a1e78'; g.beginPath(); g.ellipse(l.x - 6, l.y - 3, l.rx * 0.65, l.ry * 0.55, 0, 0, Math.PI * 2); g.fill();
    }
  }
}

function drawRoads(g, save) {
  const R = rng(9);
  g.lineCap = 'round';
  ROADS.forEach((r) => {
    const burnt = !!save.cleared[r.to];
    const th = THEME[regionOf(r.ax)];
    const path = () => { g.beginPath(); g.moveTo(r.ax, r.ay); g.quadraticCurveTo(r.cx, r.cy, r.bx, r.by); };
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 20; g.save(); g.translate(2, 3); path(); g.stroke(); g.restore();
    g.strokeStyle = burnt ? '#0e0810' : '#2a1c10'; g.lineWidth = 17; path(); g.stroke();
    g.strokeStyle = burnt ? '#2a2030' : shade(th.road, 0.82); g.lineWidth = 13; path(); g.stroke();
    g.strokeStyle = burnt ? '#3a2e44' : th.road; g.lineWidth = 8; path(); g.stroke();
    g.strokeStyle = burnt ? 'rgba(170,90,230,0.35)' : 'rgba(255,255,255,0.16)'; g.lineWidth = 1.5; g.setLineDash([5, 9]); path(); g.stroke(); g.setLineDash([]);
    for (let k = 0; k < 26; k++) {          // pebbles, ruts and (when burnt) embers
      const p = roadPt(r, R());
      g.fillStyle = burnt ? (R() < 0.5 ? '#ff7a30' : '#9a5ad8') : (R() < 0.5 ? shade(th.road, 1.25) : shade(th.road, 0.65));
      g.fillRect(p.x + (R() - 0.5) * 12, p.y + (R() - 0.5) * 6, 2, 2);
    }
    if (burnt) for (let k = 0; k < 4; k++) {   // skulls on spikes along the burnt road
      const p = roadPt(r, 0.15 + k * 0.22 + R() * 0.05), side = k % 2 ? 1 : -1;
      const sx = p.x, sy = p.y + side * 15;
      g.fillStyle = '#0a0710'; g.fillRect(sx - 1, sy - 11, 3, 12);
      g.fillStyle = '#e8e0c8'; g.fillRect(sx - 3, sy - 16, 7, 6); g.fillStyle = '#0a0710'; g.fillRect(sx - 2, sy - 14, 2, 2); g.fillRect(sx + 1, sy - 14, 2, 2);
    }
  });
  // bridges where a road crosses a river
  for (const rv of RIVERS) for (const r of ROADS) {
    let best = null, bd = 1e9;
    for (let k = 0; k <= 80; k++) {
      const p = roadPt(r, k / 80);
      for (const [rx, ry] of riverSamples(rv)) { const d = Math.hypot(rx - p.x, ry - p.y); if (d < bd) { bd = d; best = { p, u: k / 80 }; } }
    }
    if (bd > 14) continue;
    const a = roadPt(r, Math.max(0, best.u - 0.02)), b = roadPt(r, Math.min(1, best.u + 0.02));
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    g.save(); g.translate(best.p.x, best.p.y); g.rotate(ang);
    g.fillStyle = '#0a0710'; g.fillRect(-20, -11, 40, 22);
    g.fillStyle = '#7a5a34'; g.fillRect(-19, -10, 38, 20);
    g.fillStyle = '#5a4024'; for (let i = -18; i < 19; i += 5) g.fillRect(i, -10, 1, 20);
    g.fillStyle = '#3a2814'; g.fillRect(-19, -10, 38, 3); g.fillRect(-19, 7, 38, 3);
    g.fillStyle = '#a07c4c'; g.fillRect(-19, -10, 38, 1);
    g.restore();
  }
}

function wheatField(g, x, y, w, h, R) {
  g.fillStyle = '#6a5a24'; g.fillRect(x, y, w, h);
  for (let i = 0; i < w; i += 4) {
    g.fillStyle = R() < 0.5 ? '#d2b44c' : '#e6c860'; g.fillRect(x + i, y + 1, 3, h - 2);
    g.fillStyle = '#f4dc88'; g.fillRect(x + i, y + 1, 3, 2);
  }
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, y + h - 2, w, 2);
}

function gravestone(g, x, y, R) {
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(x + 3, y + 1, 6, 2.5, 0, 0, Math.PI * 2); g.fill();
  if (R() < 0.5) { g.fillStyle = '#0a0710'; g.fillRect(x - 4, y - 11, 8, 12); g.fillStyle = '#7a788c'; g.fillRect(x - 3, y - 10, 6, 10); g.fillStyle = '#a4a2b8'; g.fillRect(x - 3, y - 10, 2, 10); g.fillStyle = '#4a485a'; g.fillRect(x - 1, y - 7, 2, 1); }
  else { g.fillStyle = '#0a0710'; g.fillRect(x - 1, y - 14, 4, 15); g.fillRect(x - 5, y - 10, 12, 4); g.fillStyle = '#8a889c'; g.fillRect(x, y - 13, 2, 13); g.fillRect(x - 4, y - 9, 10, 2); }
}

function drawScorch(g, save) {
  // Conquered lands: scorched earth with a noisy edge, glowing ley cracks, ash and craters
  for (const id of IDS) {
    if (!save.cleared[id]) continue;
    const [x, y] = NODES[id], Rs = rng(id * 31);
    for (let layer = 0; layer < 3; layer++) {
      g.fillStyle = ['rgba(14,8,18,0.55)', 'rgba(14,8,18,0.7)', 'rgba(60,34,88,0.35)'][layer];
      g.beginPath();
      for (let a = 0; a <= 28; a++) {
        const ang = (a / 28) * Math.PI * 2, rr = [118, 96, 60][layer] * (0.82 + 0.3 * vnoise(Math.cos(ang) * 2 + id, Math.sin(ang) * 2, 9));
        const px = x + Math.cos(ang) * rr, py = y + 8 + Math.sin(ang) * rr * 0.46;
        if (a === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.fill();
    }
    g.lineCap = 'round';
    for (let k = 0; k < 9; k++) {            // glowing cracks radiating from the settlement
      const ang = Rs() * Math.PI * 2; let px = x + Math.cos(ang) * 30, py = y + 8 + Math.sin(ang) * 14;
      const pts = [[px, py]];
      for (let s = 0; s < 5; s++) { px += Math.cos(ang + (Rs() - 0.5) * 1.2) * (9 + Rs() * 9); py += Math.sin(ang + (Rs() - 0.5) * 1.2) * (5 + Rs() * 4); pts.push([px, py]); }
      g.strokeStyle = 'rgba(150,80,230,0.35)'; g.lineWidth = 4; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts) g.lineTo(p[0], p[1]); g.stroke();
      g.strokeStyle = 'rgba(200,150,255,0.85)'; g.lineWidth = 1; g.stroke();
    }
    for (let k = 0; k < 40; k++) { g.fillStyle = Rs() < 0.5 ? '#3a2e44' : '#5a3a70'; g.fillRect(x + (Rs() - 0.5) * 190, y + 8 + (Rs() - 0.5) * 70, 3, 2); }
    for (let k = 0; k < 4; k++) { const px = x + (Rs() - 0.5) * 150, py = y + 18 + Rs() * 24; g.fillStyle = '#0a0710'; g.beginPath(); g.ellipse(px, py, 9, 3.5, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#1e1426'; g.beginPath(); g.ellipse(px, py + 0.5, 7, 2.5, 0, 0, Math.PI * 2); g.fill(); }
  }
}

function buildTerrain(save) {
  const c = document.createElement('canvas');
  c.width = WW; c.height = H;
  const g = c.getContext('2d');
  g.drawImage(buildGround(), 0, 0);
  const R = rng(5);
  drawScorch(g, save);
  drawRivers(g);
  // Wheat fields and orchards along the Crusader Reach, gravestones in the Graveyard Fields
  for (let i = 0; i < 16; i++) {
    const x = REGION_X[1] + 30 + R() * 960, y = 120 + R() * 200;
    if (nearPath(x, y, 14) || nearRiver(x, y, 40) || nearLandmark(x, y, 70)) continue;
    if (IDS.some((id) => save.cleared[id] && Math.hypot(x + 30 - NODES[id][0], (y - NODES[id][1]) * 2.2) < 150)) continue;   // no crops on scorched earth
    wheatField(g, x, y, 30 + R() * 26, 14 + R() * 10, R);
  }
  for (let i = 0; i < 90; i++) {
    const x = R() * REGION_X[1], y = 110 + R() * 230;
    if (nearPath(x, y, 6) || nearRiver(x, y, 26)) continue;
    if (R() < 0.45) gravestone(g, x, y, R);
  }
  drawRoads(g, save);
  for (let r = 0; r < 4; r++) peaks(g, r, rng(30 + r));
  // Trees, drawn back to front so they overlap properly. Near a conquered zone they are dead.
  const list = [];
  for (let i = 0; i < 1500; i++) {
    const x = R() * WW, y = 78 + R() * (H - 70), r = regionOf(x);
    const dens = fbm(x * 0.012, y * 0.02, 77, 3);
    if (dens < 0.5 && R() > 0.05) continue;
    if (nearPath(x, y) || nearRiver(x, y, 24) || inLake(x, y, 1.25) || nearLandmark(x, y, 46)) continue;
    let dead = r === 3;
    for (const id of IDS) if (save.cleared[id] && Math.hypot(x - NODES[id][0], (y - NODES[id][1]) * 1.9) < 130) dead = true;
    const kind = dead ? 'dead' : r === 0 ? 'oak' : r === 1 ? 'orchard' : 'pine';
    list.push({ x, y, kind, s: 0.8 + R() * 0.5 });
  }
  list.sort((a, b) => a.y - b.y);
  for (const t of list) tree(g, t.x, t.y, t.kind, t.s, R);
  // Region banners: a ribbon hung between two posts at the start of every region
  g.textAlign = 'center';
  REGIONS.forEach((reg, i) => {
    const x = i === 0 ? 100 : REGION_X[i] + 40, y = 88;
    g.font = 'bold 12px Georgia, serif';
    const w = Math.max(118, g.measureText(reg.name).width + 34);
    g.fillStyle = '#0a0710'; g.fillRect(x - w / 2 - 3, y - 10, 5, 36); g.fillRect(x + w / 2 - 2, y - 10, 5, 36);
    g.fillStyle = '#5a3c20'; g.fillRect(x - w / 2 - 2, y - 9, 3, 34); g.fillRect(x + w / 2 - 1, y - 9, 3, 34);
    g.fillStyle = '#0a0710'; g.beginPath(); g.moveTo(x - w / 2, y - 6); g.lineTo(x + w / 2, y - 6); g.lineTo(x + w / 2 - 8, y + 9); g.lineTo(x + w / 2, y + 24); g.lineTo(x - w / 2, y + 24); g.lineTo(x - w / 2 + 8, y + 9); g.fill();
    g.fillStyle = ['#2e5a34', '#8a6a1c', '#2a4a78', '#4a2a78'][i]; g.beginPath(); g.moveTo(x - w / 2 + 2, y - 4); g.lineTo(x + w / 2 - 2, y - 4); g.lineTo(x + w / 2 - 9, y + 9); g.lineTo(x + w / 2 - 2, y + 22); g.lineTo(x - w / 2 + 2, y + 22); g.lineTo(x - w / 2 + 9, y + 9); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x - w / 2 + 3, y - 4, w - 6, 3);
    g.fillStyle = '#0a0710'; g.fillText(reg.name, x + 1, y + 13); g.fillStyle = '#f6e6b8'; g.fillText(reg.name, x, y + 12);
  });
  return c;
}

// ---- Settlements ----
function flame(g, x, y, t, seed) {
  const f = 0.7 + 0.5 * Math.sin(t * 11 + seed) * Math.sin(t * 7.3 + seed * 2);
  g.fillStyle = 'rgba(255,120,30,0.25)'; g.beginPath(); g.arc(x, y - 3, 8 + f * 2, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#e03a10'; g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x - 1, y - 6 * f - 2); g.lineTo(x, y - 11 * f - 3); g.lineTo(x + 2, y - 6 * f); g.lineTo(x + 4, y); g.fill();
  g.fillStyle = '#ff9a28'; g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x, y - 7 * f - 1); g.lineTo(x + 3, y); g.fill();
  g.fillStyle = '#ffe070'; g.beginPath(); g.moveTo(x - 1.5, y); g.lineTo(x, y - 3.5 * f); g.lineTo(x + 1.5, y); g.fill();
}
function smoke(g, x, y, t, col, seed) {
  for (let i = 0; i < 5; i++) {
    const u = ((t * 0.45 + i * 0.2 + seed) % 1);
    g.globalAlpha = (1 - u) * 0.5; g.fillStyle = col;
    g.beginPath(); g.arc(x + Math.sin(u * 5 + seed * 9) * 6 + u * 8, y - u * 40, 3 + u * 6, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
}

function building(g, x, y, w, h, o, ruin, t, pal) {
  const seed = Math.floor(x * 7 + y * 13);
  const l = x - w / 2;
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(x + h * 0.18 + 3, y + 2, w * 0.55 + h * 0.2, 4 + h * 0.06, 0, 0, Math.PI * 2); g.fill();
  if (o.cave) {                      // a cave mouth under a dragon skull
    g.fillStyle = '#0a0710'; g.beginPath(); g.ellipse(x, y, w / 2 + 2, h + 2, 0, Math.PI, 0); g.fill();
    g.fillStyle = ruin ? '#4a4256' : '#6a6070'; g.beginPath(); g.ellipse(x, y, w / 2, h, 0, Math.PI, 0); g.fill();
    g.fillStyle = ruin ? '#5e566c' : '#8a8294'; g.beginPath(); g.ellipse(x - 4, y, w / 2 - 6, h - 5, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#05030a'; g.beginPath(); g.ellipse(x, y, w / 3, h * 0.7, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#e8e0c8'; g.fillRect(x - 9, y - h - 8, 18, 8); g.fillRect(x - 6, y - h, 12, 4); g.fillRect(x - 14, y - h - 4, 5, 3); g.fillRect(x + 9, y - h - 4, 5, 3);
    g.fillStyle = '#0a0710'; g.fillRect(x - 6, y - h - 6, 4, 4); g.fillRect(x + 2, y - h - 6, 4, 4);
    if (ruin) smoke(g, x, y - h - 6, t, 'rgba(120,100,140,1)', (seed % 7) / 7);
    else { g.fillStyle = 'rgba(255,170,60,' + (0.55 + 0.3 * Math.sin(t * 3)) + ')'; g.beginPath(); g.ellipse(x, y - 4, w / 4, 5, 0, Math.PI, 0); g.fill(); }
    return;
  }
  if (o.crypt) {                     // the Endless Crypt: a stone arch and a green glow
    g.fillStyle = '#0a0710'; g.fillRect(l - 2, y - h - 2, w + 4, h + 2);
    g.fillStyle = '#4a4058'; g.fillRect(l, y - h, w, h);
    g.fillStyle = '#5e5470'; g.fillRect(l, y - h, 3, h); g.fillStyle = '#383044'; g.fillRect(l + w - 4, y - h, 4, h);
    g.fillStyle = '#383044'; for (let i = 0; i < w; i += 8) g.fillRect(l + i, y - h, 3, 4);
    g.fillStyle = '#05030a'; g.beginPath(); g.ellipse(x, y, 13, 22, 0, Math.PI, 0); g.fill();
    g.fillStyle = 'rgba(120,255,150,' + (0.45 + 0.25 * Math.sin(t * 2)) + ')'; g.beginPath(); g.ellipse(x, y, 9, 15, 0, Math.PI, 0); g.fill();
    g.fillStyle = 'rgba(120,255,150,0.12)'; g.beginPath(); g.ellipse(x, y + 2, 40, 14, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e8e8d8'; g.fillRect(x - 5, y - h - 8, 10, 8); g.fillStyle = '#0a0710'; g.fillRect(x - 3, y - h - 6, 2, 3); g.fillRect(x + 1, y - h - 6, 2, 3);
    smoke(g, x - 16, y - h, t, 'rgba(120,255,160,1)', 0.2); smoke(g, x + 16, y - h, t, 'rgba(120,255,160,1)', 0.6);
    return;
  }
  const hh = ruin ? Math.max(9, h * (0.45 + 0.22 * hash(seed))) : h;
  if (ruin) {                        // broken walls: columns of uneven height, charred and glowing
    for (let cx = 0; cx < w; cx += 4) {
      const ch = hh * (0.55 + 0.45 * hash(seed + cx * 3));
      g.fillStyle = '#0a0710'; g.fillRect(l + cx - 1, y - ch - 1, 6, ch + 1);
      g.fillStyle = hash(seed + cx) < 0.5 ? '#3e3648' : '#352e40'; g.fillRect(l + cx, y - ch, 4, ch);
      g.fillStyle = '#524860'; g.fillRect(l + cx, y - ch, 1, ch);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(l + cx, y - ch * 0.3, 4, ch * 0.3);
    }
    for (let k = 0; k < 5; k++) { g.fillStyle = k % 2 ? '#2a2234' : '#3e3648'; g.fillRect(l - 6 + hash(seed + k) * (w + 12), y - 2 - hash(seed + k * 3) * 3, 4, 3); }
  } else {
    g.fillStyle = '#0a0710'; g.fillRect(l - 1, y - hh - 1, w + 2, hh + 2);
    const stone = !o.wood;
    const body = stone ? pal.wall : pal.house;
    g.fillStyle = body; g.fillRect(l, y - hh, w, hh);
    if (stone) {
      g.fillStyle = pal.wall2;
      for (let r = 0; r < hh; r += 5) { g.fillRect(l, y - hh + r, w, 1); for (let k = ((r / 5) % 2) * 3; k < w; k += 6) g.fillRect(l + k, y - hh + r, 1, 5); }
    } else {
      g.fillStyle = shade(body, 0.72); for (let k = 3; k < w; k += 4) g.fillRect(l + k, y - hh, 1, hh);
      g.fillStyle = shade(body, 0.55); g.fillRect(l, y - hh * 0.5, w, 1); g.fillRect(l + w * 0.5 - 1, y - hh, 2, hh);
    }
    g.fillStyle = shade(body, 1.22); g.fillRect(l, y - hh, 3, hh);
    g.fillStyle = shade(body, 0.7); g.fillRect(l + w - 4, y - hh, 4, hh);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(l, y - 3, w, 3);
    if (o.top) {
      g.fillStyle = '#0a0710'; for (let i = 0; i < w; i += 6) g.fillRect(l + i - 1, y - hh - 6, 5, 7);
      g.fillStyle = pal.wall; for (let i = 0; i < w; i += 6) g.fillRect(l + i, y - hh - 5, 3, 5);
      g.fillStyle = shade(pal.wall, 1.2); for (let i = 0; i < w; i += 6) g.fillRect(l + i, y - hh - 5, 1, 5);
      g.fillStyle = '#05030a'; g.fillRect(x - 1, y - hh * 0.72, 3, 9);   // arrow slit
    } else if (o.spire) {
      g.fillStyle = '#0a0710'; g.beginPath(); g.moveTo(l - 2, y - hh); g.lineTo(x, y - hh - w * 1.6 - 2); g.lineTo(l + w + 2, y - hh); g.fill();
      g.fillStyle = pal.roof; g.beginPath(); g.moveTo(l, y - hh); g.lineTo(x, y - hh - w * 1.6); g.lineTo(l + w, y - hh); g.fill();
      g.fillStyle = shade(pal.roof, 1.25); g.beginPath(); g.moveTo(l, y - hh); g.lineTo(x, y - hh - w * 1.6); g.lineTo(x - 1, y - hh); g.fill();
      g.fillStyle = shade(pal.roof, 0.7); g.beginPath(); g.moveTo(x + 1, y - hh); g.lineTo(x, y - hh - w * 1.6); g.lineTo(l + w, y - hh); g.fill();
    } else if (w >= 14) {
      const rh = o.roofH || w * 0.45, hw = w / 2 + 4;
      g.fillStyle = '#0a0710'; g.beginPath(); g.moveTo(l - 5, y - hh); g.lineTo(x, y - hh - rh - 2); g.lineTo(l + w + 5, y - hh); g.fill();
      g.fillStyle = pal.roof; g.beginPath(); g.moveTo(l - 4, y - hh); g.lineTo(x, y - hh - rh); g.lineTo(l + w + 4, y - hh); g.fill();
      g.fillStyle = shade(pal.roof, 1.22); g.beginPath(); g.moveTo(l - 4, y - hh); g.lineTo(x, y - hh - rh); g.lineTo(x, y - hh); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.22)';
      for (let d = 4; d < rh; d += 4) { const wd = hw * (d / rh); g.fillRect(x - wd, y - hh - rh + d, wd * 2, 1); }
      g.fillStyle = shade(pal.roof, 1.5); g.fillRect(x - 1, y - hh - rh - 1, 2, 2);
    }
    if (o.gate) {                      // a portcullis gate
      g.fillStyle = '#05030a'; g.beginPath(); g.ellipse(x, y, 9, 13, 0, Math.PI, 0); g.fill();
      g.fillStyle = '#4a3a24'; for (let k = -6; k <= 6; k += 4) g.fillRect(x + k - 0.5, y - 12, 1, 12);
      g.fillRect(x - 8, y - 8, 16, 1);
    }
  }
  // windows
  const n = Math.max(1, Math.floor(w / 12));
  for (let k = 0; k < n; k++) {
    const wx = l + (w / (n + 1)) * (k + 1) - 1.5, wy = y - hh * 0.62;
    if (ruin) { if (k % 2 === 0) { g.fillStyle = 'rgba(125,255,154,' + (0.35 + 0.3 * Math.sin(t * 3 + k + seed)) + ')'; g.fillRect(wx, wy, 3, 5); } }
    else { g.fillStyle = '#05030a'; g.fillRect(wx - 1, wy - 1, 5, 7); g.fillStyle = 'rgba(255,208,100,' + (0.75 + 0.25 * Math.sin(t * 2 + k + seed)) + ')'; g.fillRect(wx, wy, 3, 5); g.fillStyle = '#05030a'; g.fillRect(wx + 1, wy, 1, 5); }
  }
  if (!ruin && w >= 20 && !o.top && !o.gate) { g.fillStyle = '#05030a'; g.fillRect(x - 3, y - 8, 6, 8); g.fillStyle = '#6a4a2a'; g.fillRect(x - 2, y - 7, 4, 7); }
  if (ruin) {
    flame(g, l + w * 0.25, y - hh * 0.9, t, seed); if (w > 24) flame(g, l + w * 0.75, y - hh * 0.8, t, seed + 4);
    smoke(g, l + w * 0.3, y - hh - 3, t, 'rgba(70,60,84,1)', (seed % 10) / 10);
  } else if (o.chimney) smoke(g, x + w * 0.25, y - hh - 8, t, 'rgba(210,206,220,1)', (seed % 10) / 10);
  if (o.orb) { g.fillStyle = 'rgba(140,200,255,' + (0.18 + 0.1 * Math.sin(t * 3)) + ')'; g.beginPath(); g.arc(x, y - hh - 12, 16 + Math.sin(t * 3) * 2, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(140,200,255,' + (0.6 + 0.3 * Math.sin(t * 3)) + ')'; g.beginPath(); g.arc(x, y - hh - 12, 7 + Math.sin(t * 3), 0, Math.PI * 2); g.fill(); g.fillStyle = '#ffffff'; g.fillRect(x - 2, y - hh - 14, 4, 4); }
}

// A waving flag: red and white banners for the living, a tattered purple one with a skull for the dead.
function flag(g, x, y, t, ruin) {
  g.fillStyle = '#0a0710'; g.fillRect(x - 1, y - 20, 3, 22);
  const w = Math.sin(t * 5 + x) * 2, w2 = Math.sin(t * 5 + x + 1.4) * 2;
  if (ruin) {
    g.fillStyle = '#5a2a8a'; g.beginPath(); g.moveTo(x + 2, y - 20); g.lineTo(x + 16 + w, y - 18); g.lineTo(x + 12, y - 14); g.lineTo(x + 17 + w2, y - 10); g.lineTo(x + 11, y - 8); g.lineTo(x + 2, y - 8); g.fill();
    g.fillStyle = '#7a44b0'; g.fillRect(x + 2, y - 20, 14, 2);
    g.fillStyle = '#b8f0a0'; g.fillRect(x + 5, y - 17, 5, 5); g.fillStyle = '#0a0710'; g.fillRect(x + 6, y - 16, 1, 1); g.fillRect(x + 8, y - 16, 1, 1);
  } else {
    g.fillStyle = '#d03030'; g.fillRect(x + 2, y - 20, 14 + w, 8); g.fillStyle = '#f0f0f0'; g.fillRect(x + 2, y - 16, 14 + w2, 2);
  }
}

function drawNode(g, id, t, state, pal) {
  const [x, y] = NODES[id];
  const ruin = state === 'cleared';
  const list = ARCH[id];
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(x, y + 8, 64, 22, 0, 0, Math.PI * 2); g.fill();
  if (!ruin && id !== 13) {      // a small wall of palisade stakes around the living settlements
    g.fillStyle = '#2a1c10';
    for (let a = 0.15; a < Math.PI - 0.15; a += 0.17) { const px = x + Math.cos(a) * 62, py = y + 10 + Math.sin(a) * 18; g.fillRect(px - 1, py - 5, 3, 6); }
  }
  const order = [...list].sort((a, b) => a[1] - b[1]);
  let top = 0;
  for (const [dx, dy, w, h, o = {}] of order) { building(g, x + dx, y + dy, w, h, o, ruin, t, pal); top = Math.max(top, h + (o.spire ? w * 1.6 : o.roofH || 0) - dy); }
  const boss = ZONES.find((z) => z.id === id);
  if (boss && !boss.endless && id % 4 === 0) flag(g, x, y - top * (ruin ? 0.62 : 1) - 4, t, ruin);
  else if (ruin) flag(g, x + 44, y - 6, t, true);
}

// ---- Landmarks that are not zones ----
function windmill(g, x, y, t) {
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(x + 8, y + 2, 20, 5, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#0a0710'; g.beginPath(); g.moveTo(x - 10, y + 1); g.lineTo(x - 6, y - 38); g.lineTo(x + 6, y - 38); g.lineTo(x + 10, y + 1); g.fill();
  g.fillStyle = '#c8b898'; g.beginPath(); g.moveTo(x - 9, y); g.lineTo(x - 5, y - 37); g.lineTo(x + 5, y - 37); g.lineTo(x + 9, y); g.fill();
  g.fillStyle = '#a49474'; g.beginPath(); g.moveTo(x + 2, y - 37); g.lineTo(x + 5, y - 37); g.lineTo(x + 9, y); g.lineTo(x + 3, y); g.fill();
  g.fillStyle = '#8a3a2a'; g.beginPath(); g.moveTo(x - 8, y - 36); g.lineTo(x, y - 48); g.lineTo(x + 8, y - 36); g.fill();
  g.fillStyle = '#05030a'; g.fillRect(x - 2, y - 8, 4, 8);
  g.save(); g.translate(x, y - 34); g.rotate(t * 0.8);
  for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.fillStyle = '#0a0710'; g.fillRect(-1, -29, 3, 29); g.fillStyle = '#6a4a2a'; g.fillRect(0, -28, 1, 27); g.fillStyle = '#e8dcc0'; g.fillRect(2, -28, 8, 14); g.fillStyle = '#b8a888'; g.fillRect(2, -21, 8, 1); }
  g.restore();
  g.fillStyle = '#0a0710'; g.beginPath(); g.arc(x, y - 34, 3, 0, Math.PI * 2); g.fill();
}
function camp(g, x, y, t) {
  for (const [dx, dy, s] of [[-26, 0, 1], [24, 4, 0.9]]) {
    const tx = x + dx, ty = y + dy;
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(tx + 4, ty + 1, 16 * s, 4, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#0a0710'; g.beginPath(); g.moveTo(tx - 15 * s, ty + 1); g.lineTo(tx, ty - 25 * s); g.lineTo(tx + 15 * s, ty + 1); g.fill();
    g.fillStyle = '#d8d0b8'; g.beginPath(); g.moveTo(tx - 14 * s, ty); g.lineTo(tx, ty - 24 * s); g.lineTo(tx + 14 * s, ty); g.fill();
    g.fillStyle = '#b0a688'; g.beginPath(); g.moveTo(tx, ty - 24 * s); g.lineTo(tx + 14 * s, ty); g.lineTo(tx + 2, ty); g.fill();
    g.fillStyle = '#2a4a98'; g.beginPath(); g.moveTo(tx - 2, ty); g.lineTo(tx, ty - 11 * s); g.lineTo(tx + 3, ty); g.fill();
    g.fillStyle = '#0a0710'; g.fillRect(tx, ty - 30 * s, 1, 6); g.fillStyle = '#d03030'; g.fillRect(tx + 1, ty - 30 * s, 6, 3);
  }
  g.fillStyle = '#2a1c10'; g.fillRect(x - 6, y + 3, 12, 3); g.fillRect(x - 5, y + 1, 10, 2);
  flame(g, x, y + 2, t, 3);
  g.fillStyle = 'rgba(255,170,60,0.12)'; g.beginPath(); g.ellipse(x, y + 4, 44, 16, 0, 0, Math.PI * 2); g.fill();
}

const sprites = {};
const spr = (n) => sprites[n] || (sprites[n] = iconCanvas(n));
const LANDMARKS = [
  { x: 1000, y: 262, draw: windmill }, { x: 1195, y: 292, draw: camp }, { x: 1560, y: 120, draw: windmill },
];

// ---- The map controller ----
export function createWorldMap({ save, startBattle, play }) {
  const view = document.getElementById('map-view');
  const canvas = document.getElementById('map-canvas');
  const panel = document.getElementById('map-panel');
  const g = canvas.getContext('2d');
  let W = 640, scrollX = 0, targetX = 0, selected = null, ripple = null;
  let terrain = null, terrainKey = '', vignette = null;
  let running = false, raf = 0, t0 = 0;

  function size() {
    const r = view.getBoundingClientRect();
    if (!r.width || !r.height) return;
    W = Math.max(320, Math.round((r.width / r.height) * H));
    canvas.width = W; canvas.height = H;
    g.imageSmoothingEnabled = false;
    vignette = null;
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

  function makeVignette() {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const v = c.getContext('2d');
    const gr = v.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
    gr.addColorStop(0, 'rgba(8,4,16,0)'); gr.addColorStop(1, 'rgba(8,4,16,0.62)');
    v.fillStyle = gr; v.fillRect(0, 0, W, H);
    const top = v.createLinearGradient(0, 0, 0, 40); top.addColorStop(0, 'rgba(8,4,16,0.5)'); top.addColorStop(1, 'rgba(8,4,16,0)');
    v.fillStyle = top; v.fillRect(0, 0, W, 40);
    return c;
  }

  function frame(now) {
    if (!running) return;
    const t = Math.max(0, now - t0) / 1000;
    const key = ZONES.map((z) => (save.cleared[z.id] ? 1 : 0)).join('');
    if (!terrain || key !== terrainKey) { terrain = buildTerrain(save); terrainKey = key; }
    scrollX += (targetX - scrollX) * 0.12;
    const sx = Math.round(scrollX);
    g.clearRect(0, 0, W, H);
    g.drawImage(terrain, sx, 0, W, H, 0, 0, W, H);
    g.save(); g.translate(-sx, 0);
    const vis = (x, pad = 140) => x > sx - pad && x < sx + W + pad;

    // River shimmer and a drifting mist over the water
    for (const rv of RIVERS) {
      const s = riverSamples(rv);
      if (!vis(s[0][0], 200)) continue;
      for (let i = 0; i < 14; i++) {
        const u = ((t * 0.07 + i / 14) % 1) * (s.length - 1), k = Math.floor(u), p = s[k], q = s[Math.min(s.length - 1, k + 1)];
        const px = lerp(p[0], q[0], u - k) + Math.sin(t * 2 + i) * 3, py = lerp(p[1], q[1], u - k);
        if (py < 96) continue;
        g.fillStyle = 'rgba(255,255,255,' + (0.18 + 0.12 * Math.sin(t * 3 + i * 2)) + ')'; g.fillRect(px - 3, py, 6, 1);
      }
    }
    for (const l of LAKES) if (vis(l.x, 200)) {
      for (let i = 0; i < 5; i++) { g.fillStyle = l.kind === 'ice' ? 'rgba(255,255,255,' + (0.3 + 0.2 * Math.sin(t * 2 + i)) + ')' : 'rgba(190,120,255,' + (0.3 + 0.3 * Math.sin(t * 2.4 + i * 1.3)) + ')'; g.fillRect(l.x - l.rx * 0.6 + i * l.rx * 0.28, l.y - 3 + Math.sin(t + i) * 5, 6, 1); }
    }
    // Landmarks, then settlements, back to front
    const objs = [];
    for (const lm of LANDMARKS) if (vis(lm.x)) objs.push({ y: lm.y, fn: () => lm.draw(g, lm.x, lm.y, t) });
    for (const id of IDS) {
      const x = NODES[id][0];
      if (!vis(x)) continue;
      const st = stateOf(id), pal = THEME[regionOf(x)];
      objs.push({ y: NODES[id][1], fn: () => {
        if (id === selected) { g.strokeStyle = 'rgba(255,255,255,' + (0.6 + 0.3 * Math.sin(t * 6)) + ')'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, NODES[id][1] + 8, 74, 29, 0, 0, Math.PI * 2); g.stroke(); }
        drawNode(g, id, t, st, pal);
      } });
    }
    objs.sort((a, b) => a.y - b.y);
    for (const o of objs) o.fn();

    // The dead march along the burnt roads, crows circle the ruins, embers drift up from the fires
    ROADS.forEach((r, i) => {
      if (!save.cleared[r.to] || !vis(r.cx)) return;
      for (let k = 0; k < 3; k++) {
        const u = (t * 0.035 + k / 3 + i * 0.17) % 1, p = roadPt(r, u), q = roadPt(r, Math.min(1, u + 0.02));
        const ic = spr(k === 1 ? 'skeleton' : 'zombie'), sc = 0.34, bob = Math.abs(Math.sin(t * 7 + k + i)) * 1.5;
        g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(p.x, p.y + 2, 5, 2, 0, 0, Math.PI * 2); g.fill();
        g.save(); g.translate(p.x, p.y - bob); if (q.x < p.x) g.scale(-1, 1); g.drawImage(ic, -ic.width * sc / 2, -ic.height * sc, ic.width * sc, ic.height * sc); g.restore();
      }
    });
    for (const id of IDS) {
      if (!save.cleared[id] || !vis(NODES[id][0])) continue;
      const [x, y] = NODES[id];
      for (let k = 0; k < 3; k++) {
        const a = t * (0.6 + k * 0.17) + id * 2 + k * 2.1, rr = 40 + k * 14;
        const cx = x + Math.cos(a) * rr, cy = y - 58 - k * 6 + Math.sin(a) * 12, fl = Math.sin(t * 9 + k) > 0;
        g.fillStyle = '#0a0710'; g.fillRect(cx - 3, cy + (fl ? -1 : 1), 2, 1); g.fillRect(cx + 1, cy + (fl ? -1 : 1), 2, 1); g.fillRect(cx - 1, cy, 2, 1);
      }
      for (let k = 0; k < 8; k++) {
        const u = (t * 0.3 + k * 0.125 + id * 0.37) % 1;
        g.fillStyle = k % 2 ? 'rgba(255,150,50,' + (1 - u) + ')' : 'rgba(180,110,255,' + (1 - u) + ')';
        g.fillRect(x + (hash(id * 9 + k) - 0.5) * 90 + Math.sin(u * 6 + k) * 5, y + 4 - u * 70, 2, 2);
      }
    }

    // Cloud shadows drifting over the land
    for (let i = 0; i < 7; i++) {
      const cx = ((t * 9 + i * 520) % (WW + 500)) - 250, cy = 90 + (i * 83) % 230;
      if (!vis(cx, 260)) continue;
      g.fillStyle = 'rgba(8,6,20,0.14)'; g.beginPath(); g.ellipse(cx, cy, 130, 34, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(cx + 60, cy + 12, 80, 22, 0, 0, Math.PI * 2); g.fill();
    }

    // Fog over the lands you have not reached
    const fl = firstLocked();
    if (fl !== 99) {
      const fx = NODES[fl][0] - 120;
      const gr = g.createLinearGradient(fx - 180, 0, fx + 60, 0);
      gr.addColorStop(0, 'rgba(18,13,28,0)'); gr.addColorStop(1, 'rgba(18,13,28,0.93)');
      g.fillStyle = gr; g.fillRect(fx - 180, 0, WW - fx + 180, H);
      for (let i = 0; i < 9; i++) {
        const mx = fx - 70 + Math.sin(t * 0.3 + i * 1.7) * 50 + (i % 3) * 14, my = 50 + i * 36;
        g.fillStyle = 'rgba(170,150,215,' + (0.07 + 0.04 * Math.sin(t * 0.7 + i)) + ')';
        g.beginPath(); g.ellipse(mx, my, 120, 22, 0, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.ellipse(mx + 70, my + 10, 70, 14, 0, 0, Math.PI * 2); g.fill();
      }
    }

    // Name plates, rating badges, the pulsing frontier marker and the necromancer
    const fr = frontier();
    g.textAlign = 'center';
    for (const z of ZONES) {
      const [x, y] = NODES[z.id];
      if (!vis(x, 100)) continue;
      const st = stateOf(z.id);
      if (st === 'locked' && z.id !== firstLocked()) continue;
      const label = st === 'locked' ? '???' : z.name;
      g.font = 'bold 12px system-ui, sans-serif';
      const tw = g.measureText(label).width, pw = tw + 34, py = y + 27;
      g.fillStyle = 'rgba(10,7,16,0.82)'; g.beginPath(); g.roundRect ? g.roundRect(x - pw / 2, py, pw, 18, 6) : g.rect(x - pw / 2, py, pw, 18); g.fill();
      g.strokeStyle = st === 'cleared' ? '#9a60d8' : st === 'locked' ? '#4a4060' : '#c8a040'; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = st === 'cleared' ? '#c8a0ff' : st === 'locked' ? '#8a7aa8' : '#fff0c0'; g.fillText(label, x + 8, py + 13);
      if (st !== 'locked') {
        g.fillStyle = st === 'cleared' ? '#9a60d8' : '#c8a040'; g.beginPath(); g.arc(x - pw / 2 + 11, py + 9, 6.5, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#0a0710'; g.font = 'bold 9px system-ui, sans-serif'; g.fillText(st === 'cleared' ? '✓' : z.endless ? '∞' : z.id, x - pw / 2 + 11, py + 12);
      }
    }
    {
      const [x, y] = NODES[fr];
      const b = Math.abs(Math.sin(t * 3)) * 6;
      // a swirling gate of light under the next zone
      for (let k = 0; k < 3; k++) {
        g.strokeStyle = 'rgba(255,208,96,' + (0.55 - k * 0.14 + 0.2 * Math.sin(t * 4 + k)) + ')'; g.lineWidth = 2 - k * 0.4;
        g.setLineDash([10, 8]); g.lineDashOffset = -t * (22 + k * 8) * (k % 2 ? -1 : 1);
        g.beginPath(); g.ellipse(x, y + 8, 78 + k * 7, 30 + k * 3, 0, 0, Math.PI * 2); g.stroke();
      }
      g.setLineDash([]);
      for (let k = 0; k < 6; k++) { const u = (t * 0.4 + k / 6) % 1; g.fillStyle = 'rgba(255,220,120,' + (1 - u) + ')'; g.fillRect(x + Math.cos(k * 1.9 + t) * 70, y + 8 - u * 46, 2, 2); }
      g.fillStyle = '#0a0710'; g.beginPath(); g.moveTo(x - 9, y - 107 - b); g.lineTo(x + 9, y - 107 - b); g.lineTo(x, y - 94 - b); g.fill();
      g.fillStyle = '#ffd060'; g.beginPath(); g.moveTo(x - 7, y - 106 - b); g.lineTo(x + 7, y - 106 - b); g.lineTo(x, y - 96 - b); g.fill();
      const tk = spr('necro0'), tsc = 0.55, ny = y + 6 - Math.abs(Math.sin(t * 2)) * 2;
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(x - 70 + tk.width * tsc / 2, y + 7, 14, 4, 0, 0, Math.PI * 2); g.fill();
      g.drawImage(tk, x - 70, ny - tk.height * tsc, tk.width * tsc, tk.height * tsc);
      g.fillStyle = 'rgba(143,209,106,' + (0.5 + 0.3 * Math.sin(t * 5)) + ')'; g.fillRect(x - 70 + tk.width * tsc * 0.18, ny - tk.height * tsc * 0.85, 3, 3);
    }
    if (ripple) {
      ripple.t += 0.04;
      g.strokeStyle = 'rgba(255,255,255,' + (1 - ripple.t) + ')'; g.lineWidth = 2; g.beginPath(); g.ellipse(ripple.x, ripple.y, 10 + ripple.t * 60, (10 + ripple.t * 60) * 0.4, 0, 0, Math.PI * 2); g.stroke();
      if (ripple.t >= 1) ripple = null;
    }
    g.restore();

    // Screen-space finish: vignette, progress plate and compass
    if (!vignette) vignette = makeVignette();
    g.drawImage(vignette, 0, 0);
    const total = ZONES.filter((z) => !z.endless).length, got = ZONES.filter((z) => !z.endless && save.cleared[z.id]).length;
    g.font = 'bold 11px system-ui, sans-serif';
    const txt = 'Conquered ' + got + ' / ' + total;
    g.fillStyle = 'rgba(10,7,16,0.78)'; g.fillRect(8, 8, g.measureText(txt).width + 34, 20);
    g.strokeStyle = '#9a60d8'; g.lineWidth = 1.5; g.strokeRect(8.5, 8.5, g.measureText(txt).width + 33, 19);
    g.fillStyle = '#e8e0c8'; g.textAlign = 'left'; g.fillText(txt, 34, 22);
    g.fillStyle = '#b8f0a0'; g.fillRect(14, 14, 10, 9); g.fillStyle = '#0a0710'; g.fillRect(16, 17, 2, 2); g.fillRect(20, 17, 2, 2); g.fillRect(16, 23, 6, 2);
    const cx = W - 34, cy = 40;
    g.fillStyle = 'rgba(10,7,16,0.6)'; g.beginPath(); g.arc(cx, cy, 20, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#c8a040'; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, 19, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#d6596b'; g.beginPath(); g.moveTo(cx, cy - 16); g.lineTo(cx + 4, cy); g.lineTo(cx - 4, cy); g.fill();
    g.fillStyle = '#e8e0c8'; g.beginPath(); g.moveTo(cx, cy + 16); g.lineTo(cx + 4, cy); g.lineTo(cx - 4, cy); g.fill();
    g.fillStyle = '#e8e0c8'; g.textAlign = 'center'; g.font = 'bold 9px system-ui, sans-serif'; g.fillText('N', cx, cy - 20 + 2);
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
    const hz = st === 'locked' ? [] : hazardText(z);
    if (hz.length) lines.push('<div class="wline zhaz">Hazards: ' + hz.join(' &middot; ') + '</div>');
    panel.innerHTML = '<div class="wtext"><div class="wtitle">' + z.name + (st === 'cleared' ? ' (conquered, in ruins)' : '') + '</div>' + lines.join('') + '</div>';
    const b = document.createElement('button');
    b.className = 'big wbuy';
    b.textContent = z.endless ? 'Enter' : st === 'cleared' ? 'Replay' : 'Fight';
    b.disabled = st === 'locked';
    b.onclick = () => startBattle(z.id);
    panel.appendChild(b);
  }

  // ---- Input: drag to pan (with a little momentum), tap a zone to select it ----
  let down = null, moved = false, vel = 0;
  view.addEventListener('pointerdown', (e) => { down = { x: e.clientX, id: e.pointerId, sx: scrollX, lx: e.clientX }; moved = false; vel = 0; });
  window.addEventListener('pointermove', (e) => {
    if (!down || e.pointerId !== down.id) return;
    const r = view.getBoundingClientRect();
    const dx = e.clientX - down.x;
    if (Math.abs(dx) > 8) moved = true;
    if (moved) { vel = -((e.clientX - down.lx) * W) / r.width; down.lx = e.clientX; scrollX = down.sx - (dx * W) / r.width; targetX = scrollX; clampScroll(); }
  });
  window.addEventListener('pointerup', (e) => {
    if (!down || e.pointerId !== down.id) return;
    const wasTap = !moved;
    const r = view.getBoundingClientRect();
    const wx = ((e.clientX - r.left) / r.width) * W + scrollX, wy = ((e.clientY - r.top) / r.height) * H;
    down = null;
    if (!wasTap) { targetX = scrollX + vel * 9; clampScroll(); return; }
    if (!e.target.closest || !e.target.closest('#map-view') || e.target.closest('#map-panel')) return;
    let best = null, bd = 70;
    for (const z of ZONES) { const d = Math.hypot(wx - NODES[z.id][0], (wy - NODES[z.id][1]) * 1.2); if (d < bd) { bd = d; best = z.id; } }
    if (best !== null) { play('click'); selected = best; ripple = { x: NODES[best][0], y: NODES[best][1] + 8, t: 0 }; renderPanel(); centerOn(best); }
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
