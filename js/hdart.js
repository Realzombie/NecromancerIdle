// HD pixel art for the summons. Each unit is painted from shapes (ellipses, rectangles, lines, polygons) onto a pixel
// grid, then a shading pass adds highlights and shadows and an outline pass draws the dark edge, so every unit gets the
// same crisp, lit look. Units face right. Sizes are in art pixels; the renderer draws them at scale 2.
// Each painter takes the unit's look: hs / ds = finished HP / damage tiers (0-3) and flags for abilities.

const OUT = '#120a18';

const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const toHex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mix = (c, d, t) => { const a = hex(c), b = hex(d); return toHex(a.map((v, i) => v + (b[i] - v) * t)); };
const lighter = (c) => mix(c, '#fff4e0', 0.28);
const darker = (c) => mix(c, '#140820', 0.38);

class Pix {
  constructor(w, h, pad = 0) { this.pad = pad; this.w = w; this.h = h + pad; this.c = new Array(w * (h + pad)).fill(null); this.l = new Array(w * (h + pad)).fill(0); this.layer = 0; this.noShade = new Set(); }
  px(x, y, c, noShade) {
    x = Math.round(x); y = Math.round(y) + this.pad;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.c[y * this.w + x] = c; this.l[y * this.w + x] = this.layer;
    if (noShade) this.noShade.add(y * this.w + x); else this.noShade.delete(y * this.w + x);
  }
  next() { this.layer++; return this; }
  R(x, y, w, h, c, ns) { this.next(); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c, ns); return this; }
  E(cx, cy, rx, ry, c, ns) {
    this.next();
    for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++) for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) {
      const dx = (i - cx) / (rx + 0.35), dy = (j - cy) / (ry + 0.35);
      if (dx * dx + dy * dy <= 1) this.px(i, j, c, ns);
    }
    return this;
  }
  L(x0, y0, x1, y1, c, t = 1, ns) {
    this.next();
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
      for (let a = 0; a < t; a++) for (let b = 0; b < t; b++) this.px(x - (t - 1) / 2 + a, y - (t - 1) / 2 + b, c, ns);
    }
    return this;
  }
  P(pts, c, ns) {
    this.next();
    let y0 = Infinity, y1 = -Infinity;
    for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= y + 0.5 && by > y + 0.5) || (by <= y + 0.5 && ay > y + 0.5)) xs.push(ax + ((y + 0.5 - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.px(x, y, c, ns);
    }
    return this;
  }
  get(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? null : this.c[y * this.w + x]; }
  lay(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? -1 : this.l[y * this.w + x]; }

  // Highlights where light would catch the upper-left edge of a shape, shadows on the lower-right, then the outline.
  finish(outline = OUT) {
    const { w, h } = this, base = this.c.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, c = base[i];
      if (!c || this.noShade.has(i)) continue;
      const me = this.l[i];
      const ul = base[(y - 1) * w + (x - 1)] && x > 0 && y > 0 ? this.l[(y - 1) * w + (x - 1)] : -1;
      const dr = x < w - 1 && y < h - 1 && base[(y + 1) * w + (x + 1)] ? this.l[(y + 1) * w + (x + 1)] : -1;
      if (ul < me) this.c[i] = lighter(c);
      else if (dr > me || dr === -1) this.c[i] = darker(c);
    }
    const out = this.c.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (base[y * w + x]) continue;
      if (base[y * w + x - 1] && x > 0 || base[y * w + x + 1] && x < w - 1 || base[(y - 1) * w + x] && y > 0 || base[(y + 1) * w + x] && y < h - 1) out[y * w + x] = outline;
    }
    this.c = out;
    return this;
  }
  toCanvas(scale = 2, alpha = 1) {
    const cv = document.createElement('canvas');
    cv.width = this.w * scale; cv.height = this.h * scale;
    const g = cv.getContext('2d');
    g.globalAlpha = alpha;
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const c = this.c[y * this.w + x];
      if (!c) continue;
      g.fillStyle = c; g.fillRect(x * scale, y * scale, scale, scale);
    }
    return cv;
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Shared body parts. All of them draw facing right with the feet on the bottom row.

function legs(p, x, y, len, c, w = 3, gap = 3, boot) {
  p.R(x, y, w, len, c); p.R(x + w + gap, y, w, len, c);
  if (boot) { p.R(x - 1, y + len - 2, w + 2, 2, boot); p.R(x + w + gap - 1, y + len - 2, w + 2, 2, boot); }
}
function skull(p, x, y, bone = '#e6dfc6', eye = '#9dff7a', jaw = true) {
  p.E(x, y, 4.2, 4.4, bone);
  if (jaw) p.R(x - 2, y + 3, 5, 3, mix(bone, '#7a7060', 0.25));
  p.R(x - 1, y + 1, 2, 2, '#1a1020', true); p.R(x + 2, y + 1, 2, 2, '#1a1020', true);   // sockets
  p.px(x - 1, y + 1, eye, true); p.px(x + 3, y + 1, eye, true);                         // glowing pupils
  p.px(x + 1, y + 3, '#1a1020', true); p.R(x - 1, y + 4, 1, 2, '#1a1020', true); p.R(x + 1, y + 4, 1, 2, '#1a1020', true); p.R(x + 3, y + 4, 1, 2, '#1a1020', true);   // teeth gaps
}
function ribs(p, x, y, w, rows, bone = '#e0d8bc', gapc = '#2a1c30') {
  for (let i = 0; i < rows; i++) { p.R(x, y + i * 3, w, 2, bone); p.R(x + 1, y + i * 3 + 2, w - 2, 1, gapc, true); }
  p.R(x + Math.floor(w / 2) - 1, y - 1, 2, rows * 3, mix(bone, '#8a8068', 0.3));   // spine
}

// ---------------------------------------------------------------------------------------------------------------
// The summons

function zombie({ hs = 0, ds = 0, flags = [] }) {
  const p = new Pix(28, 36), skin = hs === 0 ? '#8ea07e' : '#7fae68', dark = mix(skin, '#1a2a18', 0.35);
  const pants = '#4a3f5c', shirt = hs >= 2 ? '#6a4a30' : hs === 1 ? '#6a5a82' : '#5e5070';
  legs(p, 9, 25, 10, pants, 4, 2, hs >= 2 ? '#3a2a20' : null);
  p.R(8, 33, 5, 2, skin); p.R(15, 33, 5, 2, skin);                          // bare feet
  // hunched torso leaning forward
  p.P([[8, 15], [19, 14], [21, 21], [19, 27], [8, 27]], shirt);
  p.R(9, 25, 11, 2, mix(shirt, '#000', 0.25));
  p.px(10, 27, null); p.px(13, 27, null); p.px(17, 27, null); p.px(18, 28, shirt);   // torn hem
  p.R(10, 17, 4, 3, '#c9bfa0'); p.R(10, 21, 4, 1, '#c9bfa0'); p.R(11, 18, 2, 1, '#2a1c30', true);   // a rib poking through the rags
  p.R(16, 22, 2, 2, '#a04040', true);
  // head, thrust forward, with a slack jaw
  p.E(17, 9, 5.2, 5, skin); p.R(13, 12, 8, 4, skin);
  p.R(14, 14, 6, 3, '#2a1018', true); for (const x of [14, 16, 18]) p.R(x, 14, 1, 2, '#f0e8c8', true);   // mouth with ragged teeth
  p.R(18, 7, 3, 3, '#e8e8a8', true); p.px(19, 8, '#1a1020', true);          // glowing eye
  p.R(14, 6, 2, 2, '#e8e8a8', true); p.px(14, 7, '#1a1020', true);
  p.L(12, 5, 17, 3, dark, 1); p.L(13, 4, 15, 2, dark, 1);                   // a few stringy hairs
  if (hs >= 1) {                                                           // stitched patches
    p.R(9, 17, 5, 4, mix(skin, '#c8b080', 0.45)); p.L(9, 19, 13, 19, '#2a1c30', 1, true); for (const x of [10, 12]) p.R(x, 18, 1, 3, '#2a1c30', true);
    p.R(19, 8, 3, 5, mix(skin, '#b8a070', 0.4)); p.L(19, 10, 21, 10, '#2a1c30', 1, true);
  }
  if (hs >= 2) {                                                           // leather vest with a belt and chainmail sleeve
    p.P([[8, 15], [19, 14], [20, 22], [8, 26]], '#7a5230'); p.R(8, 22, 12, 2, '#3a2418'); p.R(13, 22, 2, 2, '#c8a040', true);
    p.R(9, 15, 3, 7, '#8a6038'); p.R(16, 15, 3, 7, '#8a6038');
    for (let y = 15; y < 22; y += 2) for (let x = 20; x < 25; x += 2) p.px(x, y, '#9aa4b8', true);
  }
  if (hs >= 3) {                                                           // full plate: helm, pauldrons, breastplate
    p.E(17, 6, 5.4, 4.2, '#8a94aa'); p.R(12, 6, 11, 3, '#8a94aa'); p.R(14, 8, 8, 2, '#10101a', true); p.px(17, 8, '#b8ff90', true); p.px(20, 8, '#b8ff90', true);
    p.R(16, 1, 3, 3, '#c8a040'); p.E(10, 15, 3.4, 2.6, '#9aa4b8'); p.P([[7, 13], [9, 10], [11, 13]], '#c8c8d8'); p.E(19, 15, 3.2, 2.6, '#9aa4b8');
    p.R(10, 17, 9, 8, '#8a94aa'); p.R(13, 17, 3, 8, '#c8a040'); p.R(10, 24, 9, 2, '#c8a040');
  }
  // arms reaching forward (the near arm in front)
  p.L(12, 17, 21, 20, skin, 3); p.R(19, 19, 4, 4, skin);
  p.L(16, 18, 25, 22, mix(skin, '#000', 0.12), 3); p.R(23, 21, 4, 4, mix(skin, '#000', 0.12));
  if (ds >= 1) for (const [x, y] of [[26, 21], [26, 23], [24, 25]]) p.L(x, y, x + (ds >= 2 ? 3 : 2), y + 1, '#e8e0c8', 1, true);
  if (ds >= 2) for (const [x, y] of [[22, 19], [23, 22]]) p.L(x, y, x + 3, y + 2, '#e8e0c8', 1, true);
  if (ds >= 3) {
    for (const [x, y, len] of [[24, 20, 9], [24, 23, 8]]) { p.L(x, y, x + len - 6, y + 1, '#f0f0e0', 2); p.L(x + len - 6, y + 1, Math.min(27, x + len - 2), y + 2, '#fffff0', 1, true); }
    p.px(23, 24, '#b8ff90', true); p.px(21, 19, '#b8ff90', true);
  }
  if (flags.includes('poison')) { for (const [x, y] of [[8, 9], [4, 14], [26, 15], [3, 22], [24, 30]]) { p.px(x, y, '#9dff7a', true); p.px(x, y - 1, '#c8ffa8', true); } }
  return p.finish();
}

function skeleton({ hs = 0, ds = 0, flags = [] }) {
  const p = new Pix(28, 36), bone = '#e6dfc6';
  legs(p, 10, 25, 10, bone, 2, 4, null); p.R(9, 33, 4, 2, bone); p.R(17, 33, 4, 2, bone);
  p.R(9, 28, 3, 1, '#2a1c30', true); p.R(17, 28, 3, 1, '#2a1c30', true);          // knees
  p.R(10, 23, 11, 3, mix(bone, '#8a8068', 0.3));                                    // pelvis
  ribs(p, 10, 13, 11, 3);
  skull(p, 15, 7, bone, '#9dff7a');
  p.L(11, 14, 8, 21, bone, 2); p.R(6, 21, 3, 3, bone);                              // far arm
  // shield on the near arm: wood, then iron, then helmed with a gilded rim
  const sh = hs === 0 ? '#8a5a2a' : hs === 1 ? '#9aa4b8' : hs === 2 ? '#8a94aa' : '#b8bccc';
  p.L(20, 14, 21, 21, bone, 2);
  p.E(22, 20, 5, 7, sh); p.E(22, 20, 3, 5, mix(sh, '#000', 0.2));
  if (hs >= 1) { p.R(21, 14, 2, 12, mix(sh, '#fff', 0.2)); p.R(17, 19, 10, 2, mix(sh, '#fff', 0.2)); }
  if (hs >= 2) { p.E(15, 5, 5.2, 3.6, '#8a94aa'); p.R(10, 5, 11, 2, '#8a94aa'); p.R(14, 7, 4, 4, '#8a94aa'); p.R(14, 8, 4, 1, '#10101a', true); p.px(15, 8, '#9dff7a', true); }
  if (hs >= 3) { p.E(22, 20, 5, 7, '#d8b050'); p.E(22, 20, 3.6, 5.6, '#b8bccc'); p.px(22, 19, '#d8b050', true); p.R(21, 18, 2, 4, '#d8b050', true); p.R(14, 0, 3, 4, '#c8a040'); p.R(13, 2, 5, 2, '#c8a040'); }
  // sword
  const bl = ds === 0 ? '#c8c8d0' : ds === 1 ? '#e0e4f0' : ds === 2 ? '#d8e0ff' : '#ffd890';
  p.L(8, 22, 6, 11, '#5a3a20', 2); p.L(5, 20, 11, 20, '#c8a040', 1, true);   // grip and guard (held up behind)
  p.L(8, 19, 3, 3 - ds, bl, ds >= 1 ? 3 : 2);
  p.px(3, 3 - ds, '#ffffff', true);
  if (ds >= 2) for (let i = 0; i < 4; i++) p.px(7 - i, 15 - i * 3, ds === 3 ? '#ff9a30' : '#9bd0ff', true);   // runes along the blade, flames at the top tier
  if (ds >= 3) { p.L(2, 1, 4, 0, '#ff7a20', 2, true); p.px(5, -1, '#ffd060', true); }
  return p.finish();
}

function archer({ hs = 0, ds = 0, flags = [] }) {
  const p = new Pix(30, 36), bone = '#e6dfc6';
  legs(p, 10, 25, 10, bone, 2, 4); p.R(9, 33, 4, 2, bone); p.R(17, 33, 4, 2, bone);
  p.R(10, 23, 10, 3, mix(bone, '#8a8068', 0.3));
  p.P([[10, 13], [20, 13], [21, 24], [9, 24]], hs >= 1 ? '#4a6a38' : '#5a4a6a');   // tattered tunic
  p.R(9, 22, 12, 2, '#3a2a20'); ribs(p, 12, 14, 7, 2, '#cfc7ac');
  skull(p, 15, 7, bone, '#9dff7a');
  p.P([[9, 5], [15, 1], [22, 5], [20, 9], [10, 9]], hs >= 1 ? '#3a5a30' : '#4a3a5a');   // hood
  p.R(11, 5, 10, 4, '#0a0610', true); p.R(12, 7, 2, 2, '#9dff7a', true); p.R(17, 7, 2, 2, '#9dff7a', true);
  if (hs >= 2) { p.R(10, 9, 11, 2, '#8a94aa'); p.R(14, 0, 3, 3, '#c8a040'); }
  p.R(7, 13, 3, 9, '#6a4a2a'); p.R(7, 12, 3, 2, '#c8a040', true); for (let i = 0; i < 3; i++) p.L(8, 11, 6 - i, 7, '#c8c8d0', 1, true);   // quiver on the back
  // the bow: a deep curve with a nocked arrow
  const wood = ds === 0 ? '#8a5a2a' : ds === 1 ? '#5a3a1c' : '#c8b88a';
  const big = ds >= 2 ? 11 : 9;
  p.next();
  for (let a = -1.25; a <= 1.25; a += 0.04) { const x = 20 + Math.cos(a) * 5.5 - 4, y = 17 + Math.sin(a) * big; p.px(x + 4, y, wood); p.px(x + 5, y, wood); }
  p.L(23, 17 - big, 21, 17, '#ece4cc', 1, true); p.L(23, 17 + big, 21, 17, '#ece4cc', 1, true);   // string
  p.L(15, 17, 28, 17, '#c8a878', 1, true); p.P([[28, 15], [30, 17], [28, 19]], ds >= 3 ? '#ffb040' : '#d0d0d8'); p.L(14, 15, 16, 17, '#c85050', 1, true);
  p.L(12, 15, 17, 17, bone, 2); p.R(16, 16, 3, 3, bone);                     // drawing hand
  p.L(19, 15, 23, 17, bone, 2);
  if (ds >= 3 || flags.includes('fire')) { p.E(29, 17, 2, 2, '#ff9a30', true); p.px(31, 16, '#ffd060', true); for (const [x, y] of [[26, 13], [28, 21]]) p.px(x, y, '#ff7a20', true); }
  return p.finish();
}

function hound({ hs = 0, ds = 0, flags = [] }) {
  const p = new Pix(40, 26, 0), skin = hs === 0 ? '#7a8e72' : '#6f9468', bone = '#e0d8bc';
  // lean body with visible ribs, long legs, whip tail
  p.E(16, 12, 11, 6, skin);
  p.P([[5, 8], [10, 6], [14, 7], [10, 12]], mix(skin, '#9ab08a', 0.15));
  for (let i = 0; i < 4; i++) p.L(11 + i * 3, 9, 12 + i * 3, 14, bone, 1, true);          // ribs
  p.L(5, 10, 1, 5, skin, 2); p.L(1, 5, 0, 2, skin, 1);                                    // tail
  for (const [x, dy] of [[8, 0], [12, 3], [21, 0], [25, 3]]) { const far = dy ? 0 : 0; p.R(x, 15, 3, 9 - far, dy ? mix(skin, '#5a7a5a', 0.1) : skin); p.R(x - 1, 23, 5, 2, mix(skin, '#000', 0.1)); for (const cx of [x - 1, x + 1, x + 3]) p.px(cx, 25, '#e8e0c8', true); }
  p.P([[20, 7], [28, 4], [31, 8], [27, 13], [20, 12]], skin);                              // shoulders and neck
  p.E(31, 9, 5, 4.2, skin);                                                               // head
  p.P([[33, 8], [40, 9], [40, 12], [33, 13]], skin);                                      // long snout
  p.R(34, 12, 6, 3, '#2a1018', true); for (const x of [35, 37, 39]) p.R(x, 12, 1, 2, '#f0e8c8', true); for (const x of [36, 38]) p.R(x, 14, 1, 2, '#f0e8c8', true);   // open jaw and fangs
  p.P([[27, 5], [29, 0], [31, 5]], mix(skin, '#9ab08a', 0.1)); p.P([[31, 5], [34, 1], [35, 6]], skin);   // pointed ears
  p.R(32, 7, 3, 2, '#ff6a3a', true); p.px(33, 7, '#fff0a0', true);                        // glowing eye
  p.R(38, 9, 2, 2, '#1a1020', true);
  p.R(13, 6, 4, 3, mix(skin, '#c8b080', 0.4)); p.L(13, 7, 16, 7, '#2a1c30', 1, true);     // a stitched patch
  p.R(22, 11, 3, 3, bone, true);                                                          // exposed bone
  if (hs >= 1) { p.R(26, 7, 6, 3, '#4a3a2a'); for (const x of [27, 29, 31]) p.P([[x, 7], [x + 1, 4], [x + 2, 7]], '#c8c8d8'); }   // spiked collar
  if (hs >= 2) { p.R(12, 4, 12, 3, '#8a94aa'); p.R(13, 2, 3, 2, '#9aa4b8'); p.R(18, 2, 3, 2, '#9aa4b8'); }
  if (hs >= 3) { p.R(10, 10, 13, 3, '#b8a060'); p.E(33, 5, 3, 2, '#8a94aa'); }
  if (ds >= 1) for (const x of [8, 12, 21, 25]) p.L(x + 2, 24, x + 4, 25, bone, 1, true);
  if (ds >= 2) { p.P([[34, 12], [36, 16], [37, 12]], '#f4f0e0', true); p.P([[38, 12], [39, 16], [40, 12]], '#f4f0e0', true); }
  if (ds >= 3) { p.L(14, 4, 26, 3, '#f0f0e0', 1, true); for (let x = 15; x < 26; x += 3) p.P([[x, 4], [x + 1, 0], [x + 2, 4]], '#f0f0e0', true); }
  return p.finish();
}

function mage({ hs = 0, ds = 0, flags = [] }) {
  const p = new Pix(28, 38), robe = hs === 0 ? '#3a2a5a' : hs === 1 ? '#4a2a6a' : hs === 2 ? '#2a3a6a' : '#5a1a6a', trim = hs >= 2 ? '#c8a040' : '#8a6ab0';
  p.P([[9, 14], [19, 14], [24, 36], [3, 36]], robe);                                // flowing robe
  p.P([[9, 14], [11, 14], [10, 36], [3, 36]], mix(robe, '#fff', 0.1)); p.R(13, 15, 2, 21, trim);
  p.px(7, 36, null); p.px(12, 36, null); p.px(18, 36, null); p.px(22, 36, null);   // ragged hem
  p.R(8, 24, 14, 2, '#6a4a2a'); p.R(14, 24, 3, 2, '#c8a040', true);
  p.E(14, 13, 6, 3, mix(robe, '#fff', 0.14));                                      // shoulders
  p.P([[8, 6], [14, 0], [21, 6], [20, 13], [8, 13]], mix(robe, '#000', 0.2));      // deep hood
  skull(p, 14, 8, '#d8d0b8', hs >= 3 ? '#ff7aff' : '#b890ff', false);
  p.R(9, 5, 12, 2, mix(robe, '#000', 0.2)); p.R(9, 6, 3, 8, mix(robe, '#000', 0.2)); p.R(19, 6, 3, 8, mix(robe, '#000', 0.2));
  if (hs >= 2) { p.R(8, 13, 14, 2, trim); p.E(14, 3, 3, 2, trim); p.px(14, 2, '#ff5a8a', true); }
  // staff topped with a glowing crystal, growing with damage tiers
  p.L(24, 8, 23, 36, '#5a3a20', 2);
  const orb = ds === 0 ? '#b890ff' : ds === 1 ? '#80d0ff' : ds === 2 ? '#ff8aff' : '#ffd0ff';
  p.P([[21, 6], [23, 0], [26, 6], [23, 11]], '#4a4a60');
  p.E(23, 5, 2 + (ds >= 2 ? 1 : 0), 2 + (ds >= 2 ? 1 : 0), orb, true);
  p.px(22, 4, '#ffffff', true);
  if (ds >= 1) for (const [x, y] of [[19, 3], [27, 2], [26, 9]]) p.px(x, y, orb, true);
  if (ds >= 3) { p.E(23, 5, 5, 5, mix(orb, '#000000', 0.4), true); p.E(23, 5, 3, 3, orb, true); p.px(23, 5, '#ffffff', true); for (const [x, y] of [[17, 1], [29, 4], [18, 11], [28, 12]]) p.px(x, y, '#ffe0ff', true); }
  p.L(17, 17, 22, 14, '#d8d0b8', 2); p.R(21, 12, 3, 3, '#d8d0b8');                    // hand on the staff
  return p.finish();
}

function ghost({ hs = 0, ds = 0, flags = [] }) {
  const p = new Pix(28, 38, 3), body = '#9ab8e0';
  p.P([[8, 12], [20, 12], [24, 30], [20, 35], [16, 31], [12, 36], [8, 31], [4, 34], [4, 22]], body);
  p.E(14, 9, 7, 7.4, mix(body, '#fff', 0.1));
  p.E(14, 7, 5, 4, mix(body, '#fff', 0.35));
  p.E(11, 9, 2.4, 3.2, '#0a1020', true); p.E(17, 9, 2.4, 3.2, '#0a1020', true); p.R(10, 8, 2, 2, '#b8f4ff', true); p.R(16, 8, 2, 2, '#b8f4ff', true);   // hollow eyes with a cold glow
  p.E(14, 15, 2.2, 2.6, '#10182a', true);                                                // wailing mouth
  p.L(20, 17, 26, 21, body, 3); p.L(26, 21, 28, 25, body, 2);                            // reaching arm
  p.L(8, 18, 3, 24, mix(body, '#fff', 0.1), 3);
  if (hs >= 1) { p.R(5, 25, 16, 2, '#5a6a8a'); for (let x = 5; x < 21; x += 3) p.R(x, 27, 2, 3, '#7a8aaa'); }               // trailing chains
  if (hs >= 2) { p.E(14, 3, 7, 2, '#c8d0e8'); }
  if (hs >= 3) { p.R(8, 0, 12, 3, '#d8b050'); for (const x of [8, 12, 16, 19]) p.P([[x, 0], [x + 1, -2], [x + 2, 0]], '#d8b050'); }
  if (ds >= 1) for (const [x, y] of [[26, 22], [27, 19]]) p.px(x, y, '#e8f8ff', true);
  if (ds >= 2) { p.L(23, 18, 30, 12, '#e8f8ff', 2, true); p.L(25, 22, 31, 25, '#e8f8ff', 2, true); }
  if (ds >= 3) { p.E(28, 20, 3, 3, '#ffffff', true); }
  const g = p.finish('#1a2a4a');
  return g;
}

function abomination({ hs = 0, ds = 0, flags = [] }) {
  const p = new Pix(50, 50), skin = hs === 0 ? '#9a8a78' : '#8f9a74', skin2 = '#a8a07a', skin3 = '#7a8a8a';
  // two thick legs of mismatched flesh
  p.R(13, 34, 9, 14, skin); p.R(27, 34, 10, 14, skin2); p.R(11, 46, 12, 3, '#4a3a30'); p.R(26, 46, 13, 3, '#4a3a30');
  p.R(15, 38, 5, 1, '#2a1c30', true); p.R(29, 40, 6, 1, '#2a1c30', true);
  // a vast sagging body, patchwork of three skin tones and a stitched seam
  p.E(25, 26, 14, 13, skin); p.E(33, 25, 8, 10, skin2); p.E(17, 28, 7, 8, skin3);
  p.R(24, 15, 2, 22, '#2a1c30', true); for (let y = 16; y < 36; y += 3) p.R(21, y, 8, 1, '#2a1c30', true);   // the big stitched seam
  p.L(14, 22, 20, 25, '#c0a888', 1, true);
  // a tattered butcher's apron and rope belt (no bare chest)
  p.P([[16, 24], [34, 24], [37, 44], [13, 44]], '#b8a888'); p.R(13, 30, 25, 2, '#6a4a2a'); p.R(16, 34, 3, 8, '#8a3a2a', true); p.R(27, 36, 4, 6, '#8a3a2a', true);
  p.px(17, 44, null); p.px(22, 44, null); p.px(30, 44, null);
  p.R(14, 24, 23, 2, '#6a4a2a');
  // small head sunk between the shoulders, big underbite
  p.E(28, 11, 7, 6, skin); p.R(21, 13, 15, 3, skin); p.R(22, 15, 13, 3, '#2a1018', true);
  for (const x of [23, 26, 29, 32]) p.P([[x, 15], [x + 1, 11], [x + 2, 15]], '#f0e8c8', true);
  p.R(24, 8, 3, 3, '#ffe890', true); p.px(25, 9, '#1a1020', true); p.R(30, 7, 3, 3, '#ffe890', true); p.px(31, 8, '#1a1020', true);
  p.L(23, 5, 34, 3, '#3a2a30', 2);                                                        // heavy brow
  // arms: a huge slab arm and a shrivelled one
  p.E(40, 24, 5, 9, skin2); p.R(38, 30, 9, 10, skin2); p.E(43, 41, 5, 4, skin2);
  p.E(9, 24, 3, 6, skin3); p.R(6, 28, 6, 8, skin3); p.E(8, 37, 3, 3, skin3);
  p.R(36, 38, 4, 2, '#2a1c30', true);
  if (hs >= 1) { p.R(18, 4, 4, 4, '#8a94aa'); p.L(14, 15, 21, 18, '#8a94aa', 2); }              // bolted-on plates
  if (hs >= 2) { p.R(12, 16, 12, 7, '#7a8498'); p.R(35, 14, 9, 8, '#7a8498'); for (const [x, y] of [[14, 18], [22, 18], [38, 16], [42, 16]]) p.px(x, y, '#c8c8d8', true); }
  if (hs >= 3) { p.R(14, 24, 22, 8, '#8a94aa'); p.R(23, 24, 4, 8, '#c8a040'); p.E(28, 6, 8, 4, '#8a94aa'); p.R(22, 7, 14, 3, '#10101a', true); p.px(25, 8, '#ffb040', true); p.px(31, 8, '#ffb040', true); }
  // a cleaver in the big hand, growing a spiked iron head with damage
  p.L(45, 38, 47, 20, '#5a3a20', 3);
  const cl = ds === 0 ? '#9aa0ae' : '#c8ccd8';
  p.P([[43, 18], [49, 14], [49, 30], [44, 28]], cl); p.R(44, 20, 4, 1, mix(cl, '#fff', 0.4), true);
  if (ds >= 1) for (const y of [16, 20, 24, 28]) p.P([[49, y], [52, y + 1], [49, y + 3]], '#d8dce8', true);
  if (ds >= 2) p.E(46, 30, 4, 3, '#6a6a7a');
  if (ds >= 3) { p.P([[44, 14], [48, 8], [51, 14]], '#ff9a30', true); p.R(46, 16, 2, 10, '#ffd060', true); }
  return p.finish();
}

function deathknight({ hs = 0, ds = 0, flags = [] }) {
  const p = new Pix(46, 44, 3), bone = '#d8d0b4';
  // skeletal warhorse galloping, with a ghostly flame mane
  p.E(20, 28, 13, 6, '#2a2438'); p.P([[8, 24], [12, 20], [30, 22], [31, 30], [10, 33]], '#2a2438');
  ribs(p, 16, 22, 10, 2, bone);
  for (const [x, dy] of [[9, 0], [13, 2], [28, 0], [31, 2]]) { p.L(x, 31, x - 2 + dy, 41, bone, 2); p.R(x - 4 + dy, 41, 4, 2, '#5a4a3a'); }
  p.P([[30, 24], [38, 17], [41, 21], [36, 30], [31, 31]], '#2a2438');
  p.E(40, 22, 4, 3.6, bone); p.R(40, 23, 6, 3, bone); p.R(41, 20, 2, 2, '#ff6a3a', true); p.px(45, 24, '#1a1020', true);   // skull head
  p.P([[36, 16], [37, 11], [40, 17]], '#2a2438');
  for (let i = 0; i < 6; i++) { const f = i % 2; p.P([[29 + i * 1.2, 20 + i * 1.4], [28 + i * 1.2 - f, 14 + i], [31 + i * 1.2, 19 + i * 1.4]], ['#7a3aff', '#c08aff'][f], true); }   // flaming mane
  for (let i = 0; i < 5; i++) p.P([[8 - i, 24 + i], [3 - i, 26 + i * 2], [9 - i, 29 + i]], ['#7a3aff', '#c08aff'][i % 2], true);   // flaming tail
  // the rider: jagged black plate with purple edges and a horned helm, a torn cape streaming behind
  p.P([[17, 12], [8, 18], [4, 30], [12, 26], [20, 22]], '#3a1a52');                      // cape
  p.P([[17, 12], [11, 17], [8, 25], [14, 23], [19, 19]], '#5a2a7a', true);
  const plate = hs === 0 ? '#2a2a3a' : hs === 1 ? '#34344a' : hs === 2 ? '#3e3a5a' : '#4a3a6a', edge = hs >= 2 ? '#a070ff' : '#7a58b0';
  p.R(17, 13, 9, 11, plate); p.R(17, 13, 9, 2, edge); p.R(21, 15, 1, 9, edge, true); p.R(17, 22, 9, 2, edge);
  p.P([[16, 12], [13, 8], [19, 11]], plate); p.P([[26, 12], [29, 8], [24, 11]], plate);  // spiked pauldrons
  p.E(22, 8, 5, 5, plate); p.R(18, 8, 8, 4, plate);
  p.R(19, 8, 7, 2, '#05030a', true); p.px(20, 9, '#ff5a3a', true); p.px(24, 9, '#ff5a3a', true);   // glowing visor slits
  p.P([[18, 5], [14, -1], [20, 3]], '#d8d0b4'); p.P([[26, 5], [30, -1], [24, 3]], '#d8d0b4');       // horns
  if (hs >= 1) p.R(21, 3, 2, 3, edge, true);
  if (hs >= 3) { p.L(19, 2, 25, 2, '#c8a040', 1, true); p.R(21, -1, 2, 3, '#c8a040', true); }
  p.L(22, 24, 26, 30, plate, 3);                                                          // leg in the stirrup
  // couched lance with a pennon, longer and brighter with damage tiers
  const len = 12 + ds * 3;
  p.L(25, 18, 44, 14, '#5a3a20', 2);
  p.P([[43, 12], [46 + ds, 14], [43, 16]], ds === 0 ? '#aab0be' : ds === 1 ? '#d0d6e4' : ds === 2 ? '#d8c8ff' : '#ff9a60', true);
  p.P([[33, 14], [38, 16], [33, 18]], '#8a1c2a', true);
  p.L(26, 19, 31, 17, plate, 3);
  return p.finish();
}

function plaguebearer({ hs = 0, ds = 0, flags = [] }) {
  const p = new Pix(32, 38, 2), coat = hs === 0 ? '#3a3238' : hs === 1 ? '#3a3a2a' : hs === 2 ? '#2a3a2a' : '#243a30';
  legs(p, 11, 28, 9, '#241c24', 4, 2); p.R(10, 35, 6, 2, '#1a1418'); p.R(17, 35, 6, 2, '#1a1418');
  p.P([[9, 14], [21, 14], [26, 33], [5, 33]], coat); p.P([[9, 14], [13, 14], [10, 33], [5, 33]], mix(coat, '#fff', 0.1));
  p.R(8, 24, 15, 2, '#5a3a20'); p.R(14, 24, 3, 2, '#9a9aa8', true);
  for (const [x, y] of [[12, 19], [18, 20], [14, 28]]) p.R(x, y, 3, 3, '#6a7a38', true);             // plague stains
  p.E(15, 14, 7, 3, mix(coat, '#fff', 0.14));
  // plague doctor mask: wide-brimmed hat, bird-like beak, round glass eyes
  p.E(15, 4, 9, 2, '#1a1418'); p.R(11, 1, 8, 4, '#241c24'); p.R(13, 1, 4, 1, '#c8a040', true);
  p.E(15, 8, 5, 4.6, '#cfc7a8'); p.P([[17, 8], [28, 13], [17, 14]], '#cfc7a8');
  p.E(15, 7, 2.4, 2.4, '#1a1418', true); p.px(15, 6, '#ffe890', true); p.E(19, 7, 2, 2, '#1a1418', true); p.px(19, 6, '#ffe890', true);
  p.L(18, 12, 26, 13, '#a8a08a', 1, true);
  if (hs >= 1) p.R(10, 11, 10, 2, '#3a4a28');
  if (hs >= 2) { p.E(8, 14, 3, 2, '#5a6a50'); p.E(22, 14, 3, 2, '#5a6a50'); }
  if (hs >= 3) { p.R(9, 15, 13, 8, '#3a4a30', true); for (const x of [11, 15, 19]) p.R(x, 16, 1, 6, '#9aa86a', true); }
  // swinging censer on a chain, trailing green smoke; bigger with damage
  p.L(22, 17, 28, 21, '#6a6a78', 1, true);
  p.L(20, 16, 24, 22, '#d8d0b4', 2);
  p.E(28 + ds * 0.5, 25, 3 + ds * 0.6, 3 + ds * 0.6, '#5a5a68'); p.R(26, 23, 5, 1, '#9a9aa8', true); p.px(28, 25, '#7aff6a', true);
  const sm = ds >= 2 ? 3 : 2;
  for (let i = 0; i < 4 + ds; i++) { const x = 25 + (i % 3) * 2 + (i > 3 ? 2 : 0), y = 20 - i * 3; p.E(x, y, sm, sm - 0.5, i % 2 ? '#8aff6a' : '#6ad04a', true); }
  p.L(10, 17, 6, 25, '#d8d0b4', 2);
  return p.finish();
}

function gravepriest({ hs = 0, ds = 0, flags = [] }) {
  const p = new Pix(30, 38, 5), robe = hs === 0 ? '#d8d0b8' : hs === 1 ? '#e0d8c0' : '#e8e0c8', trim = hs >= 2 ? '#c8a040' : '#6a4a8a';
  p.P([[9, 12], [19, 12], [23, 37], [5, 37]], robe); p.P([[9, 12], [12, 12], [9, 37], [5, 37]], mix(robe, '#000', 0.12));
  p.px(8, 37, null); p.px(14, 37, null); p.px(20, 37, null);
  p.R(14, 12, 3, 25, trim); for (let y = 16; y < 36; y += 5) p.R(13, y, 5, 2, trim, true);              // stole with sigils
  p.R(7, 24, 16, 2, '#4a3a2a');
  p.E(14, 12, 7, 3, mix(robe, '#000', 0.05)); p.R(7, 12, 16, 2, trim);
  p.P([[8, 7], [14, 0], [21, 7], [20, 12], [8, 12]], mix(robe, '#000', 0.18));                       // cowl
  p.R(10, 5, 10, 5, '#0a0610', true); p.R(11, 6, 2, 2, '#ffe890', true); p.R(16, 6, 2, 2, '#ffe890', true); p.R(12, 9, 6, 1, '#cfc7a8', true);
  if (hs >= 1) p.E(14, 2, 4, 2, trim);
  if (hs >= 3) { p.R(10, -1, 10, 2, '#c8a040'); for (const x of [11, 14, 17]) p.P([[x, -1], [x + 1, -3], [x + 2, -1]], '#c8a040'); }
  // staff topped with a skull holding a candle; the book glows when it heals
  p.L(25, 6, 25, 37, '#5a3a20', 2);
  p.E(25, 4, 3.2, 3, '#e6dfc6'); p.px(24, 4, '#1a1020', true); p.px(26, 4, '#1a1020', true); p.R(24, 6, 3, 2, '#e6dfc6');
  p.R(24, -1, 2, 3, '#f0e8d0', true); p.P([[24, -1], [25, -4], [26, -1]], '#ffb040', true);
  const book = ds >= 2 ? '#8aff9a' : '#c8a878';
  p.R(2, 17, 9, 7, '#5a2a2a'); p.R(3, 18, 7, 5, book, true); p.L(6, 18, 6, 22, '#5a2a2a', 1, true);
  if (ds >= 1) for (const [x, y] of [[4, 14], [8, 13], [6, 11]]) p.px(x, y, '#9dff7a', true);
  if (ds >= 3) { p.E(6, 19, 7, 6, '#8aff9a', true); p.E(6, 19, 4, 4, '#d8ffe0', true); }
  p.L(11, 17, 8, 21, '#d8d0b8', 2); p.L(20, 17, 24, 13, '#d8d0b8', 2);
  return p.finish();
}

function gargoyle({ hs = 0, ds = 0, flags = [] }) {
  const p = new Pix(40, 38, 4), stone = hs === 0 ? '#8a8a9a' : hs === 1 ? '#7a8498' : hs === 2 ? '#707a90' : '#68708a';
  // folded wings behind, a crouching hunched stone body, horns, a stone tail
  p.P([[12, 6], [4, 0], [2, 14], [8, 24], [16, 22]], mix(stone, '#000', 0.2)); p.P([[12, 6], [6, 3], [5, 14], [9, 22], [15, 20]], mix(stone, '#000', 0.05));
  p.P([[20, 6], [32, -1], [38, 10], [30, 22], [22, 20]], mix(stone, '#000', 0.25)); for (const y of [4, 9, 14]) p.L(22, y + 4, 34, y, mix(stone, '#fff', 0.15), 1, true);
  p.E(17, 24, 9, 9, stone); p.E(20, 18, 7, 7, stone);
  p.R(10, 30, 5, 7, stone); p.R(20, 30, 5, 7, stone); p.R(9, 35, 7, 2, mix(stone, '#000', 0.2)); p.R(19, 35, 7, 2, mix(stone, '#000', 0.2));
  for (const x of [9, 11, 13, 19, 21, 23]) p.px(x, 37, '#2a2a38', true);
  p.L(9, 30, 3, 34, stone, 3); p.L(3, 34, 1, 30, stone, 2); p.P([[0, 28], [2, 33], [3, 29]], stone);
  p.L(23, 21, 31, 27, stone, 4); p.R(29, 25, 5, 5, stone); for (const x of [30, 32, 34]) p.L(x, 29, x + 1, 33, '#d8d0b4', 1, true);
  p.E(23, 11, 6, 5.4, stone); p.R(24, 14, 8, 3, stone);
  p.P([[18, 7], [14, 0], [21, 5]], '#cfc7b0'); p.P([[26, 7], [32, 1], [28, 5]], '#cfc7b0');
  p.R(25, 10, 3, 2, '#ff4a3a', true); p.px(26, 10, '#ffd0a0', true); p.R(29, 9, 3, 2, '#ff4a3a', true);
  p.R(26, 15, 7, 2, '#1a1020', true); for (const x of [26, 29, 32]) p.P([[x, 15], [x + 1, 18], [x + 2, 15]], '#f0e8d0', true);
  for (const [x, y] of [[15, 22], [21, 27], [19, 15]]) p.L(x, y, x + 3, y + 3, '#4a4a5a', 1, true);   // cracks
  if (hs >= 1) for (const [x, y] of [[13, 20], [19, 12]]) p.E(x, y, 2, 1.6, '#4a7a4a', true);        // moss
  if (hs >= 2) { p.R(14, 20, 10, 3, '#9aa4b8'); p.E(15, 17, 3, 2.4, '#8a94aa'); }
  if (hs >= 3) { p.R(12, 18, 12, 10, '#7a8aa8'); p.R(16, 18, 4, 10, '#c8a040'); p.R(22, 6, 6, 2, '#c8a040', true); }
  if (ds >= 1) p.P([[2, 28], [0, 24], [4, 26]], '#cfc7b0');
  if (ds >= 2) for (const x of [7, 10, 13]) p.P([[x, 8], [x + 1, 4], [x + 2, 8]], '#cfc7b0');
  if (ds >= 3) { p.L(31, 28, 38, 34, '#ffb040', 2, true); p.E(33, 27, 2, 2, '#ffd060', true); }
  return p.finish();
}

export const HD = { zombie, skeleton, archer, hound, mage, ghost, abomination, deathknight, plaguebearer, gravepriest, gargoyle };
export const HD_SCALE = 2;
export function hdCanvas(unit, look) {
  const p = HD[unit](look || { hs: 0, ds: 0, flags: [] });
  return p.toCanvas(HD_SCALE, unit === 'ghost' ? 0.82 : 1);
}
