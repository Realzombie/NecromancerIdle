// Summon art: chunky, flat-coloured cartoon pixel art, painted from simple shapes on a small grid and drawn at scale 4.
// A light shading pass gives each shape a bright top-left edge and a dark lower-right edge (the renderer adds the dark
// outline). Units face right. hs / ds = finished HP / damage tiers (0-3), flags = ability looks.

const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const toHex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mix = (c, d, t) => { const a = hex(c), b = hex(d); return toHex(a.map((v, i) => v + (b[i] - v) * t)); };
const lighter = (c) => mix(c, '#fff6e0', 0.26);
const darker = (c) => mix(c, '#1a1028', 0.3);

class Pix {
  constructor(w, h, pad = 0) { this.pad = pad; this.w = w; this.h = h + pad; this.c = new Array(this.w * this.h).fill(null); this.l = new Array(this.w * this.h).fill(0); this.layer = 0; this.flat = new Set(); }
  px(x, y, c, flat) {
    x = Math.round(x); y = Math.round(y) + this.pad;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this;
    const i = y * this.w + x;
    this.c[i] = c; this.l[i] = this.layer;
    if (flat) this.flat.add(i); else this.flat.delete(i);
    return this;
  }
  R(x, y, w, h, c, flat) { this.layer++; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c, flat); return this; }
  E(cx, cy, rx, ry, c, flat) {
    this.layer++;
    for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++) for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) {
      const dx = (i - cx) / (rx + 0.3), dy = (j - cy) / (ry + 0.3);
      if (dx * dx + dy * dy <= 1) this.px(i, j, c, flat);
    }
    return this;
  }
  L(x0, y0, x1, y1, c, flat) {
    this.layer++;
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) this.px(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c, flat);
    return this;
  }
  P(pts, c, flat) {
    this.layer++;
    let y0 = Infinity, y1 = -Infinity;
    for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= y + 0.5 && by > y + 0.5) || (by <= y + 0.5 && ay > y + 0.5)) xs.push(ax + ((y + 0.5 - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.px(x, y, c, flat);
    }
    return this;
  }
  finish() {
    const { w, h } = this, base = this.c.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, c = base[i];
      if (!c || this.flat.has(i)) continue;
      const me = this.l[i];
      const ul = x > 0 && y > 0 && base[i - w - 1] ? this.l[i - w - 1] : -1;
      const dr = x < w - 1 && y < h - 1 && base[i + w + 1] ? this.l[i + w + 1] : -1;
      if (ul < me) this.c[i] = lighter(c); else if (dr > me || dr === -1) this.c[i] = darker(c);
    }
    return this;
  }
  toCanvas(scale = 4) {
    const cv = document.createElement('canvas');
    cv.width = this.w * scale; cv.height = this.h * scale;
    const g = cv.getContext('2d');
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const c = this.c[y * this.w + x];
      if (c) { g.fillStyle = c; g.fillRect(x * scale, y * scale, scale, scale); }
    }
    return cv;
  }
}

const BONE = '#e8e0c4', DARK = '#2a1c30', GLOW = '#9dff7a';

function zombie({ hs = 0, ds = 0, flags = [] }) {
  const p = new Pix(13, 16), skin = hs === 0 ? '#8ea07e' : '#7fae68';
  const shirt = hs >= 2 ? '#7a5230' : hs === 1 ? '#6a5a82' : '#5e5070';
  p.R(4, 11, 2, 4, '#4a3f5c'); p.R(7, 11, 2, 4, '#4a3f5c'); p.R(3, 15, 3, 1, skin); p.R(7, 15, 3, 1, skin);
  p.R(3, 6, 7, 6, shirt); p.R(3, 11, 7, 1, mix(shirt, '#000000', 0.25)); p.px(4, 12, null); p.px(8, 12, null);        // ragged hem
  p.R(4, 8, 2, 1, '#cfc6a8', true); p.px(7, 10, '#a04040', true);                                                // a rib and a wound
  p.E(6, 3, 3.2, 2.8, skin);
  p.R(5, 2, 2, 2, '#f0f0b0', true); p.px(6, 3, DARK, true); p.R(8, 2, 2, 2, '#f0f0b0', true); p.px(9, 3, DARK, true);
  p.R(6, 5, 4, 1, DARK, true); p.px(7, 5, '#f0e8c8', true); p.px(9, 5, '#f0e8c8', true);
  p.L(4, 0, 6, 0, mix(skin, '#102010', 0.4), true);
  p.R(8, 7, 4, 2, skin); p.R(11, 7, 2, 2, skin); p.R(7, 6, 3, 1, mix(skin, '#000000', 0.15));                       // arms out in front
  if (hs >= 1) { p.R(3, 6, 3, 2, '#c8b080'); p.px(4, 7, DARK, true); p.R(8, 1, 2, 2, '#c8b080'); p.px(9, 2, DARK, true); }
  if (hs >= 2) { p.R(3, 6, 7, 5, '#8a6038'); p.R(3, 9, 7, 1, '#3a2418', true); p.px(6, 9, '#d8b050', true); p.R(9, 6, 2, 2, '#9aa4b8'); }
  if (hs >= 3) {
    p.R(3, 1, 7, 2, '#8a94aa'); p.R(4, 0, 5, 1, '#a8b0c4'); p.R(5, 3, 5, 1, '#2a2a3a', true); p.px(6, 3, '#b8ff90', true); p.px(9, 3, '#b8ff90', true);
    p.R(2, 5, 3, 2, '#aab2c6'); p.R(3, 6, 7, 5, '#8a94aa'); p.R(5, 6, 3, 5, '#d8b050'); p.px(2, 4, '#d8d8e8', true);
  }
  const claw = flags.includes('poison') ? '#9dff7a' : '#f0eadc';
  if (ds >= 1) { p.px(13, 7, claw, true); p.px(13, 9, claw, true); }
  if (ds >= 2) { p.R(13, 7, 2, 1, claw, true); p.R(13, 9, 2, 1, claw, true); p.px(11, 10, claw, true); }
  if (ds >= 3) { p.R(12, 6, 4, 1, claw, true); p.R(12, 8, 5, 1, claw, true); p.R(12, 10, 4, 1, claw, true); p.px(16, 8, '#c8ffa8', true); }
  if (flags.includes('poison')) { p.px(2, 3, GLOW, true); p.px(11, 3, GLOW, true); p.px(1, 8, GLOW, true); }
  return p.finish();
}

function skeleton({ hs = 0, ds = 0 }) {
  const p = new Pix(14, 17);
  p.R(4, 11, 1, 5, BONE); p.R(8, 11, 1, 5, BONE); p.R(3, 16, 3, 1, BONE); p.R(7, 16, 3, 1, BONE); p.R(4, 13, 1, 1, DARK, true); p.R(8, 13, 1, 1, DARK, true);
  p.R(3, 10, 7, 2, '#b8b098');
  for (let i = 0; i < 3; i++) { p.R(3, 6 + i * 2, 7, 1, BONE); p.R(4, 7 + i * 2, 5, 1, DARK, true); }
  p.R(6, 5, 1, 6, '#b8b098');
  p.E(6, 3, 3.2, 2.9, BONE); p.R(4, 5, 5, 1, BONE);
  p.R(4, 2, 2, 2, DARK, true); p.R(8, 2, 2, 2, DARK, true); p.px(5, 3, GLOW, true); p.px(9, 3, GLOW, true); p.R(5, 5, 1, 1, DARK, true); p.R(7, 5, 1, 1, DARK, true);
  p.R(2, 7, 1, 4, BONE); p.R(1, 11, 2, 2, BONE);                                                     // far arm
  const sh = ['#8a5a2a', '#9aa4b8', '#8a94aa', '#d8b050'][hs];
  p.R(9, 6, 1, 3, BONE);
  p.E(10.5, 10, 2.4, 3.4, sh); p.E(10.5, 10, 1.2, 2.2, mix(sh, '#000000', 0.2)); if (hs >= 1) p.R(10, 7, 1, 7, mix(sh, '#ffffff', 0.3));
  if (hs >= 2) { p.R(3, 0, 7, 3, '#8a94aa'); p.R(4, 3, 1, 2, '#8a94aa'); p.R(8, 3, 1, 2, '#8a94aa'); p.R(5, 2, 4, 1, DARK, true); p.px(5, 3, GLOW, true); p.px(8, 3, GLOW, true); }
  if (hs >= 3) { p.R(5, -1, 3, 2, '#d8b050'); p.R(10, 9, 1, 2, '#c8d0e0', true); }
  const bl = ['#d0d0d8', '#e8ecf8', '#c8e0ff', '#ffd890'][ds];
  p.R(1, 9, 1, 4, '#6a4a2a'); p.R(0, 8, 3, 1, '#d8b050', true);
  p.R(1, 2 - ds, 1, 6 + ds, bl); p.px(1, 1 - ds, '#ffffff', true);
  if (ds >= 2) { p.R(2, 3, 1, 1, ds === 3 ? '#ff9a30' : '#9bd0ff', true); p.R(2, 5, 1, 1, ds === 3 ? '#ff9a30' : '#9bd0ff', true); }
  if (ds >= 3) { p.R(0, -1, 3, 2, '#ff7a20', true); p.px(1, -2, '#ffd060', true); }
  return p.finish();
}

function archer({ hs = 0, ds = 0, flags = [] }) {
  const p = new Pix(16, 17, 1);
  p.R(4, 11, 1, 5, BONE); p.R(8, 11, 1, 5, BONE); p.R(3, 16, 3, 1, BONE); p.R(7, 16, 3, 1, BONE);
  p.R(3, 7, 7, 5, hs >= 1 ? '#4a6a38' : '#5a4a6a'); p.R(3, 11, 7, 1, '#3a2a20', true); p.R(5, 8, 3, 2, '#d4ccb0', true);
  p.P([[2, 4], [6, -1], [11, 4], [10, 7], [3, 7]], hs >= 1 ? '#3a5a30' : '#4a3a5a');
  p.R(4, 3, 6, 3, '#0a0610', true); p.R(4, 4, 2, 2, GLOW, true); p.R(8, 4, 2, 2, GLOW, true);
  p.R(5, 6, 4, 1, BONE);
  if (hs >= 2) { p.R(3, 6, 8, 1, '#8a94aa'); p.R(6, -1, 2, 2, '#d8b050'); }
  p.R(1, 6, 2, 5, '#6a4a2a'); p.R(1, 5, 2, 1, '#d8b050', true); p.px(1, 3, '#d0d0d8', true); p.px(2, 4, '#c85050', true);   // quiver
  const wood = ['#8a5a2a', '#5a3a1c', '#d8c890', '#d8c890'][ds], h = ds >= 2 ? 6 : 5;
  p.layer++;
  for (let a = -1.35; a <= 1.35; a += 0.12) p.px(10 + Math.cos(a) * 3.2, 8 + Math.sin(a) * h, wood);
  p.L(11.5, 8 - h, 10, 8, '#f0e8d0', true); p.L(11.5, 8 + h, 10, 8, '#f0e8d0', true);
  p.L(6, 8, 14, 8, '#c8a878', true); p.px(15, 8, ds >= 3 ? '#ffb040' : '#d0d0d8', true); p.px(5, 7, '#c85050', true);
  p.R(7, 7, 3, 2, BONE);
  if (ds >= 3 || flags.includes('fire')) { p.E(14, 8, 1.2, 1.2, '#ff9a30', true); p.px(14, 6, '#ffd060', true); p.px(15, 10, '#ff7a20', true); }
  return p.finish();
}

function hound({ hs = 0, ds = 0 }) {
  const p = new Pix(21, 11, 2), skin = hs === 0 ? '#7a8e72' : '#6f9468';
  for (const [x, far] of [[3, 1], [5, 0], [11, 1], [13, 0]]) p.R(x, 6, 1, 4, far ? mix(skin, '#5a7a5a', 0.1) : skin);
  p.E(8, 5, 5.6, 2.6, skin);
  for (const x of [6, 8, 10]) p.R(x, 4, 1, 3, BONE, true);
  p.L(3, 4, 0, 1, skin); p.px(0, 0, skin);                                              // tail
  p.E(14.5, 3.5, 2.6, 2.4, skin); p.R(15, 4, 5, 2, skin); p.P([[13, 1], [14, -2], [15, 1]], mix(skin, '#9ab08a', 0.1)); p.P([[15, 1], [17, -1], [17, 2]], skin);
  p.R(14, 3, 2, 2, '#ff6a3a', true); p.px(15, 3, '#fff0a0', true); p.px(19, 4, DARK, true);
  p.R(16, 6, 4, 1, DARK, true); p.px(17, 6, '#f4ecd0', true); p.px(19, 6, '#f4ecd0', true); p.px(17, 7, '#f4ecd0', true);
  p.R(6, 3, 2, 1, '#c8b080'); p.R(11, 5, 1, 2, '#cfc6a8', true);
  if (hs >= 1) { p.R(12, 3, 3, 1, '#4a3a2a'); p.px(12, 2, '#d0d0e0', true); p.px(14, 2, '#d0d0e0', true); }
  if (hs >= 2) { p.R(5, 2, 6, 1, '#8a94aa'); p.px(6, 1, '#b8c0d0', true); p.px(9, 1, '#b8c0d0', true); }
  if (hs >= 3) { p.R(5, 4, 6, 2, '#d8b050'); p.R(13, 1, 3, 1, '#9aa4b8'); }
  if (ds >= 1) for (const x of [3, 5, 11, 13]) p.px(x + 1, 10, BONE, true);
  if (ds >= 2) { p.px(17, 7, '#ffffff', true); p.px(19, 7, '#ffffff', true); }
  if (ds >= 3) for (const x of [6, 8, 10]) p.P([[x, 2], [x + 1, 0], [x + 2, 2]], '#f4f0e0', true);
  return p.finish();
}

function mage({ hs = 0, ds = 0 }) {
  const p = new Pix(14, 18, 1), robe = ['#3a2a5a', '#4a2a6a', '#2a3a6a', '#5a1a6a'][hs], trim = hs >= 2 ? '#d8b050' : '#8a6ab0';
  p.P([[3, 7], [8, 7], [11, 17], [0, 17]], robe); p.R(5, 8, 1, 9, trim); p.R(2, 12, 7, 1, '#6a4a2a'); p.px(5, 12, '#d8b050', true);
  p.px(2, 17, null); p.px(6, 17, null);
  p.E(5.5, 3, 3.6, 3.4, mix(robe, '#000000', 0.2)); p.R(2, 3, 7, 5, mix(robe, '#000000', 0.2));
  p.E(5.5, 4, 2, 2, '#d8d0b8'); p.R(4, 3, 1, 2, DARK, true); p.R(7, 3, 1, 2, DARK, true); p.px(4, 4, hs >= 3 ? '#ff7aff' : '#b890ff', true); p.px(7, 4, hs >= 3 ? '#ff7aff' : '#b890ff', true);
  if (hs >= 2) { p.R(2, 7, 7, 1, trim); p.R(4, -1, 3, 1, trim); p.px(5, -1, '#ff5a8a', true); }
  p.R(12, 3, 1, 14, '#5a3a20'); p.R(11, 2, 3, 2, '#5a5a70');
  const orb = ['#b890ff', '#80d0ff', '#ff8aff', '#ffd0ff'][ds];
  p.E(12, 0, ds >= 2 ? 1.6 : 1.1, ds >= 2 ? 1.6 : 1.1, orb, true); p.px(11, -1, '#ffffff', true);
  if (ds >= 1) { p.px(9, -1, orb, true); p.px(14, 1, orb, true); }
  if (ds >= 3) { p.E(12, 0, 2.6, 2.6, mix(orb, '#000000', 0.5), true); p.E(12, 0, 1.6, 1.6, orb, true); p.px(9, 1, '#ffe0ff', true); p.px(15, -1, '#ffe0ff', true); }
  p.R(8, 7, 4, 1, '#d8d0b8'); p.R(10, 6, 2, 2, '#d8d0b8');
  return p.finish();
}

function ghost({ hs = 0, ds = 0 }) {
  const p = new Pix(14, 17, 1), body = '#a8c4e8';
  p.P([[2, 5], [9, 5], [11, 13], [10, 16], [8, 14], [6, 16], [4, 14], [2, 16], [0, 13]], body);
  p.E(5.5, 4, 4.2, 3.8, mix(body, '#ffffff', 0.15));
  p.E(3.5, 4, 0.8, 1.5, '#0a1020', true); p.E(7.5, 4, 0.8, 1.5, '#0a1020', true); p.px(3, 3, '#c8f4ff', true); p.px(7, 3, '#c8f4ff', true);
  p.E(5.5, 8, 0.9, 1.1, '#0a1020', true);
  p.R(9, 7, 4, 1, body); p.R(12, 8, 1, 2, body); p.R(0, 8, 2, 3, body);
  if (hs >= 1) { p.R(1, 11, 8, 1, '#5a6a8a', true); for (const x of [1, 4, 7]) p.R(x, 12, 1, 2, '#7a8aaa', true); }
  if (hs >= 2) p.R(2, 0, 7, 1, '#d0d8f0');
  if (hs >= 3) { p.R(2, -1, 7, 2, '#d8b050'); for (const x of [2, 5, 8]) p.px(x, -2, '#d8b050', true); }
  if (ds >= 1) { p.px(13, 8, '#e8f8ff', true); p.px(13, 6, '#e8f8ff', true); }
  if (ds >= 2) { p.R(12, 5, 3, 1, '#e8f8ff', true); p.R(13, 9, 3, 1, '#e8f8ff', true); }
  if (ds >= 3) p.E(14, 8, 1.4, 1.4, '#ffffff', true);
  return p.finish();
}

function abomination({ hs = 0, ds = 0 }) {
  const p = new Pix(24, 22, 1), skin = hs === 0 ? '#9a8a78' : '#8f9a74', skin2 = '#a8a07a', skin3 = '#7a8a8a';
  p.R(5, 15, 4, 6, skin); p.R(11, 15, 4, 6, skin2); p.R(4, 20, 6, 2, '#4a3a30'); p.R(10, 20, 6, 2, '#4a3a30');
  p.E(10, 11, 7, 6, skin); p.E(14, 10, 4, 5, skin2); p.E(6, 12, 3, 4, skin3);
  p.R(10, 6, 1, 10, DARK, true); for (const y of [7, 9, 11, 13]) p.R(9, y, 3, 1, DARK, true);           // stitched seam
  p.P([[6, 11], [14, 11], [15, 20], [5, 20]], '#b8a888'); p.R(5, 14, 11, 1, '#6a4a2a'); p.R(7, 16, 2, 3, '#8a3a2a', true); p.R(12, 17, 2, 3, '#8a3a2a', true);   // apron
  p.E(11, 4, 3.4, 3, skin); p.R(8, 5, 7, 2, skin); p.R(8, 6, 7, 1, DARK, true);
  for (const x of [9, 11, 13]) p.px(x, 6, '#f0e8c8', true);
  p.R(9, 2, 2, 2, '#ffe890', true); p.px(10, 3, DARK, true); p.R(13, 2, 2, 2, '#ffe890', true); p.px(14, 3, DARK, true); p.R(9, 1, 6, 1, '#3a2a30', true);
  p.E(18, 10, 2.4, 4, skin2); p.R(17, 13, 4, 4, skin2); p.E(19, 18, 2.4, 1.8, skin2);              // big arm
  p.E(3, 10, 1.6, 3, skin3); p.R(2, 12, 3, 4, skin3);                                                // small arm
  if (hs >= 1) { p.R(8, 0, 2, 2, '#8a94aa'); p.R(7, 7, 3, 2, '#8a94aa'); }
  if (hs >= 2) { p.R(5, 7, 6, 3, '#7a8498'); p.R(16, 6, 4, 3, '#7a8498'); p.px(6, 8, '#c8c8d8', true); p.px(18, 7, '#c8c8d8', true); }
  if (hs >= 3) { p.R(6, 11, 10, 4, '#8a94aa'); p.R(10, 11, 2, 4, '#d8b050'); p.R(8, 0, 7, 3, '#8a94aa'); p.R(8, 2, 7, 1, '#10101a', true); p.px(10, 2, '#ffb040', true); p.px(13, 2, '#ffb040', true); }
  p.R(21, 6, 1, 12, '#5a3a20'); p.P([[20, 5], [24, 3], [24, 12], [21, 11]], ds === 0 ? '#9aa0ae' : '#d0d4e0');
  if (ds >= 1) for (const y of [4, 7, 10]) p.px(24, y, '#e8ecf4', true);
  if (ds >= 2) p.E(22, 14, 1.8, 1.4, '#6a6a7a');
  if (ds >= 3) { p.P([[20, 3], [22, 0], [24, 3]], '#ff9a30', true); p.R(22, 4, 1, 5, '#ffd060', true); }
  return p.finish();
}

function deathknight({ hs = 0, ds = 0 }) {
  const p = new Pix(24, 19, 2), plate = ['#3a3a52', '#444466', '#50507a', '#5e4a8a'][hs], edge = hs >= 2 ? '#a070ff' : '#7a58b0';
  p.P([[4, 6], [0, 9], [-0, 14], [4, 12], [7, 10]], '#4a2468');                                       // cape
  p.R(4, 10, 13, 5, '#4a4262'); p.R(14, 8, 4, 5, '#4a4262');             // the warhorse, body and neck
  p.E(19, 9, 2, 2, BONE); p.R(19, 10, 4, 2, BONE); p.px(20, 8, '#ff6a3a', true); p.px(23, 11, DARK, true); p.P([[16, 7], [17, 5], [18, 8]], '#2a2438');
  for (const x of [5, 7, 13, 15]) p.R(x, 15, 1, 3, BONE); for (const x of [5, 7, 13, 15]) p.R(x - 1, 18, 2, 1, '#5a4a3a');
  for (let i = 0; i < 4; i++) p.px(15 - i, 7 + i % 2, i % 2 ? '#c08aff' : '#7a3aff', true);              // flame mane
  for (let i = 0; i < 3; i++) p.px(3 - i, 10 + i, i % 2 ? '#c08aff' : '#7a3aff', true);               // flame tail
  p.R(8, 3, 5, 7, plate); p.R(8, 3, 5, 1, edge, true); p.R(10, 4, 1, 6, edge, true);                   // the knight
  p.E(10, 1, 2.6, 2.4, plate); p.R(8, 1, 5, 2, plate); p.R(9, 1, 4, 1, '#05030a', true); p.px(10, 1, '#ff5a3a', true); p.px(12, 1, '#ff5a3a', true);
  p.P([[8, 0], [6, -2], [9, -1]], BONE); p.P([[13, 0], [15, -2], [12, -1]], BONE);                     // horns
  p.P([[7, 3], [5, 1], [9, 3]], plate); p.P([[13, 3], [15, 1], [11, 3]], plate);
  if (hs >= 3) p.R(10, -2, 1, 2, '#d8b050', true);
  p.R(11, 9, 2, 3, plate);
  p.R(12, 4, 11 + ds, 1, '#5a3a20'); p.P([[22 + ds, 3], [25 + ds, 4], [22 + ds, 6]], ['#aab0be', '#d0d6e4', '#d8c8ff', '#ff9a60'][ds], true); p.P([[16, 3], [19, 4], [16, 6]], '#8a1c2a', true);
  return p.finish();
}

function plaguebearer({ hs = 0, ds = 0 }) {
  const p = new Pix(16, 18, 2), coat = ['#3a3238', '#3a3a2a', '#2a3a2a', '#243a30'][hs];
  p.R(4, 13, 2, 4, '#241c24'); p.R(7, 13, 2, 4, '#241c24'); p.R(3, 17, 3, 1, '#1a1418'); p.R(7, 17, 3, 1, '#1a1418');
  p.P([[3, 6], [9, 6], [11, 15], [1, 15]], coat); p.R(2, 11, 8, 1, '#5a3a20'); p.R(5, 11, 2, 1, '#9a9aa8', true);
  p.R(4, 8, 2, 2, '#6a7a38', true); p.R(7, 9, 2, 2, '#6a7a38', true);
  p.E(6, 2, 4.4, 1, '#1a1418'); p.R(4, 0, 4, 2, '#241c24'); p.R(5, 0, 2, 1, '#d8b050', true);       // wide hat
  p.E(6, 4, 2.6, 2.4, '#d4ccae'); p.P([[7, 4], [13, 7], [7, 7]], '#d4ccae');                           // beaked mask
  p.R(5, 3, 2, 2, '#1a1418', true); p.px(5, 3, '#ffe890', true); p.R(8, 3, 2, 2, '#1a1418', true); p.px(8, 3, '#ffe890', true);
  if (hs >= 1) p.R(3, 6, 6, 1, '#3a4a28');
  if (hs >= 2) { p.E(3, 7, 1.6, 1, '#5a6a50'); p.E(9, 7, 1.6, 1, '#5a6a50'); }
  if (hs >= 3) { p.R(3, 8, 7, 4, '#3a4a30', true); for (const x of [4, 6, 8]) p.R(x, 8, 1, 3, '#9aa86a', true); }
  p.R(10, 8, 1, 3, '#d8d0b4'); p.R(11, 10, 3, 1, '#6a6a78', true);
  p.E(14, 12, 1.8 + ds * 0.3, 1.8 + ds * 0.3, '#5a5a68'); p.px(14, 12, '#7aff6a', true);
  for (let i = 0; i < 3 + ds; i++) p.E(13 + (i % 2) * 2, 9 - i * 2, 1.4 + (ds >= 2 ? 0.4 : 0), 1.1, i % 2 ? '#8aff6a' : '#6ad04a', true);
  p.R(2, 8, 1, 4, '#d8d0b4');
  return p.finish();
}

function gravepriest({ hs = 0, ds = 0 }) {
  const p = new Pix(15, 19, 4), robe = ['#d8d0b8', '#e0d8c0', '#e8e0c8', '#e8e0c8'][hs], trim = hs >= 2 ? '#d8b050' : '#6a4a8a';
  p.P([[3, 6], [9, 6], [11, 18], [1, 18]], robe); p.R(5, 6, 2, 12, trim); for (const y of [9, 12, 15]) p.R(4, y, 4, 1, trim, true);
  p.R(2, 12, 8, 1, '#4a3a2a'); p.R(3, 6, 6, 1, trim);
  p.E(6, 3, 3.6, 3.2, mix(robe, '#000000', 0.18)); p.R(3, 3, 7, 4, mix(robe, '#000000', 0.18));
  p.R(4, 3, 4, 3, '#0a0610', true); p.px(4, 4, '#ffe890', true); p.px(7, 4, '#ffe890', true);
  if (hs >= 1) p.R(4, 0, 4, 1, trim);
  if (hs >= 3) { p.R(4, -1, 5, 1, '#d8b050'); for (const x of [4, 6, 8]) p.px(x, -2, '#d8b050', true); }
  p.R(12, 2, 1, 16, '#5a3a20'); p.E(12, 1, 1.8, 1.6, BONE); p.px(11, 1, DARK, true); p.px(13, 1, DARK, true);
  p.R(12, -2, 1, 2, '#f4ecd8', true); p.px(12, -3, '#ffb040', true);
  const book = ds >= 2 ? '#8aff9a' : '#c8a878';
  p.R(0, 8, 4, 3, '#5a2a2a'); p.R(1, 8, 2, 2, book, true);
  if (ds >= 1) { p.px(1, 6, '#9dff7a', true); p.px(3, 5, '#9dff7a', true); }
  if (ds >= 3) { p.E(2, 9, 3, 2.6, '#8aff9a', true); p.E(2, 9, 1.6, 1.4, '#d8ffe0', true); }
  p.R(9, 8, 1, 1, '#d8d0b8'); p.R(10, 6, 2, 1, '#d8d0b8');
  return p.finish();
}

function gargoyle({ hs = 0, ds = 0 }) {
  const p = new Pix(20, 17, 2), stone = ['#8a8a9a', '#7a8498', '#707a90', '#68708a'][hs];
  p.P([[5, 3], [1, 0], [0, 7], [3, 11], [7, 10]], mix(stone, '#000000', 0.2)); p.P([[9, 3], [14, 0], [18, 5], [14, 11], [10, 10]], mix(stone, '#000000', 0.25));
  p.E(8, 11, 4.4, 4.2, stone); p.E(10, 8, 3.4, 3.4, stone);
  p.R(4, 14, 2, 3, stone); p.R(9, 14, 2, 3, stone); p.R(3, 16, 4, 1, mix(stone, '#000000', 0.2)); p.R(8, 16, 4, 1, mix(stone, '#000000', 0.2));
  p.L(4, 14, 0, 16, stone); p.px(0, 15, stone);
  p.L(11, 10, 15, 13, stone); p.R(14, 12, 3, 2, stone); for (const x of [14, 16]) p.px(x, 14, BONE, true);
  p.E(11, 5, 3, 2.8, stone); p.R(12, 6, 4, 2, stone);
  p.P([[9, 3], [7, -1], [10, 2]], '#d8d0b8'); p.P([[13, 3], [16, -1], [14, 2]], '#d8d0b8');
  p.R(12, 4, 2, 1, '#ff4a3a', true); p.R(15, 4, 2, 1, '#ff4a3a', true);
  p.R(13, 7, 4, 1, DARK, true); p.px(13, 8, '#f0e8d0', true); p.px(15, 8, '#f0e8d0', true);
  p.px(7, 10, '#4a4a5a', true); p.px(8, 11, '#4a4a5a', true); p.px(10, 13, '#4a4a5a', true);
  if (hs >= 1) { p.px(6, 9, '#4a7a4a', true); p.px(9, 6, '#4a7a4a', true); }
  if (hs >= 2) { p.R(6, 9, 6, 2, '#9aa4b8'); p.R(7, 8, 2, 1, '#aab2c6'); }
  if (hs >= 3) { p.R(5, 8, 7, 5, '#7a8aa8'); p.R(7, 8, 2, 5, '#d8b050'); p.R(11, 3, 4, 1, '#d8b050', true); }
  if (ds >= 1) p.px(0, 13, '#d8d0b8', true);
  if (ds >= 2) for (const x of [4, 6]) p.px(x, 3, '#d8d0b8', true);
  if (ds >= 3) { p.R(16, 13, 3, 1, '#ffb040', true); p.px(18, 12, '#ffd060', true); }
  return p.finish();
}

export const ART = { zombie, skeleton, archer, hound, mage, ghost, abomination, deathknight, plaguebearer, gravepriest, gargoyle };
export const ART_SCALE = 4;
// Returns a canvas for the unit, or null when it has no painted art.
export function artCanvas(unit, look) {
  const f = ART[unit];
  if (!f) return null;
  return f(look || { hs: 0, ds: 0, flags: [] }).toCanvas(ART_SCALE);
}
