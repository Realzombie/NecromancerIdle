// Enemy and boss art in the same chunky cartoon style as the summons (see art.js). Every enemy is built from one
// parametric person: size (bulk), skin, cloth, headgear, weapon, shield and a few extras, so each looks different.
// They are drawn facing right like everything else; the renderer flips enemies to face left.
import { Pix, mix, BONE, DARK } from './art.js';

const METAL = '#9aa0b0', IRON = '#7a8090', GOLD = '#d8b050', WOOD = '#8a5a2a', RED = '#c03030';

// ---- headgear ----
const HEAD = {
  straw: (p, cx, hy) => { p.E(cx, hy - 2, 5.4, 1.3, '#d8b860'); p.R(cx - 2, hy - 5, 5, 3, '#e0c470'); p.R(cx - 2, hy - 3, 5, 1, '#8a6a30', true); },
  cap: (p, cx, hy, o) => { p.E(cx, hy - 2, 3.6, 2.2, o.hc || METAL); p.R(cx - 3, hy - 1, 7, 1, mix(o.hc || METAL, '#000000', 0.25)); },
  helm: (p, cx, hy, o) => { p.E(cx, hy - 2, 4, 2.8, o.hc || METAL); p.R(cx + 1, hy - 2, 1, 5, o.hc || METAL); p.R(cx - 3, hy - 1, 8, 1, mix(o.hc || METAL, '#000000', 0.25)); },
  plume: (p, cx, hy, o) => { HEAD.helm(p, cx, hy, o); p.P([[cx - 1, hy - 4], [cx - 5, hy - 8], [cx - 1, hy - 7], [cx + 2, hy - 8], [cx + 2, hy - 4]], o.plume || RED, true); },
  greathelm: (p, cx, hy, o) => {
    p.R(cx - 4, hy - 4, 9, 8, o.hc || IRON); p.R(cx - 4, hy - 4, 9, 1, mix(o.hc || IRON, '#ffffff', 0.25), true);
    p.R(cx - 3, hy - 1, 7, 1, '#0a0610', true); p.px(cx, hy - 1, o.eye || '#ff5a3a', true); p.px(cx + 3, hy - 1, o.eye || '#ff5a3a', true);
    p.R(cx + 3, hy + 1, 2, 2, mix(o.hc || IRON, '#000000', 0.2), true);
    if (o.crest) p.P([[cx - 1, hy - 4], [cx, hy - 8], [cx + 2, hy - 4]], o.crest, true);
  },
  hood: (p, cx, hy, o) => { p.P([[cx - 4, hy + 3], [cx - 3, hy - 4], [cx + 1, hy - 5], [cx + 4, hy - 2], [cx + 4, hy + 3]], o.hc || '#4a4a3a'); p.R(cx, hy - 2, 5, 5, o.skin || '#e0b890', true); },
  mask: (p, cx, hy, o) => { HEAD.hood(p, cx, hy, o); p.R(cx - 1, hy - 1, 6, 2, '#0a0610', true); p.px(cx + 1, hy - 1, '#ff4a4a', true); p.px(cx + 3, hy - 1, '#ff4a4a', true); },
  mitre: (p, cx, hy, o) => { p.P([[cx - 3, hy - 2], [cx, hy - 9], [cx + 3, hy - 2]], o.hc || '#f0e8d0'); p.R(cx - 3, hy - 3, 7, 1, GOLD, true); p.R(cx, hy - 7, 1, 3, GOLD, true); },
  crown: (p, cx, hy) => { p.R(cx - 3, hy - 3, 7, 2, GOLD); for (const x of [-3, -1, 1, 3]) p.px(cx + x, hy - 4, GOLD); p.px(cx + 1, hy - 3, '#e84a4a', true); },
  horns: (p, cx, hy, o) => { HEAD.helm(p, cx, hy, o); p.P([[cx - 3, hy - 2], [cx - 6, hy - 6], [cx - 2, hy - 3]], BONE); p.P([[cx + 3, hy - 2], [cx + 6, hy - 6], [cx + 2, hy - 3]], BONE); },
  hair: (p, cx, hy, o) => { p.E(cx - 0.5, hy - 1.5, 3.8, 2.6, o.hc || '#e8e8f0'); p.R(cx - 4, hy - 1, 3, 5, o.hc || '#e8e8f0'); },
  wide: (p, cx, hy, o) => { p.E(cx, hy - 2, 6, 1.2, o.hc || '#1a1218'); p.R(cx - 3, hy - 6, 6, 4, o.hc || '#1a1218'); p.R(cx - 3, hy - 3, 6, 1, o.band || '#c03030', true); },
  pointy: (p, cx, hy, o) => { p.E(cx, hy - 2, 5, 1.2, o.hc || '#3a50a0'); p.P([[cx - 3, hy - 2], [cx + 1, hy - 10], [cx + 4, hy - 2]], o.hc || '#3a50a0'); p.px(cx, hy - 5, '#ffe060', true); p.px(cx + 2, hy - 7, '#ffe060', true); },
  winged: (p, cx, hy, o) => { HEAD.helm(p, cx, hy, o); p.P([[cx - 3, hy - 2], [cx - 7, hy - 6], [cx - 6, hy - 1]], '#fff6d0'); p.P([[cx + 3, hy - 2], [cx + 7, hy - 6], [cx + 6, hy - 1]], '#fff6d0'); },
  bucket: (p, cx, hy, o) => { p.R(cx - 3, hy - 5, 7, 7, o.hc || '#9a9aa8'); p.R(cx - 3, hy - 5, 7, 1, '#c8c8d8', true); p.R(cx - 2, hy - 1, 5, 1, '#0a0610', true); p.R(cx - 4, hy - 5, 1, 7, mix('#9a9aa8', '#000000', 0.2)); },
  spiky: (p, cx, hy, o) => { p.E(cx - 0.5, hy - 1.5, 3.8, 2.4, o.hc || '#e8d070'); for (const x of [-3, -1, 1, 3]) p.P([[cx + x - 1, hy - 3], [cx + x, hy - 7], [cx + x + 1, hy - 3]], o.hc || '#e8d070'); },
};

// ---- weapons (the hand is at hx, hy) ----
const WEAP = {
  pitchfork: (p, hx, hy) => { p.R(hx, hy - 9, 1, 14, WOOD); p.R(hx - 1, hy - 11, 1, 3, '#b8b8c0', true); p.R(hx, hy - 12, 1, 4, '#b8b8c0', true); p.R(hx + 1, hy - 11, 1, 3, '#b8b8c0', true); p.R(hx - 1, hy - 8, 3, 1, '#b8b8c0', true); },
  spear: (p, hx, hy) => { p.R(hx, hy - 9, 1, 16, WOOD); p.P([[hx - 1, hy - 9], [hx, hy - 14], [hx + 2, hy - 9]], '#d8d8e8', true); },
  halberd: (p, hx, hy) => { p.R(hx, hy - 10, 2, 18, '#5a4a3a'); p.P([[hx - 3, hy - 9], [hx, hy - 14], [hx + 2, hy - 9]], '#d8dce8', true); p.P([[hx + 2, hy - 8], [hx + 6, hy - 6], [hx + 2, hy - 3]], '#c8ccd8', true); },
  sword: (p, hx, hy, o) => { p.R(hx, hy - 9, 2, 10, o.blade || '#d8dce8', true); p.px(hx, hy - 10, '#ffffff', true); p.R(hx - 2, hy, 6, 1, GOLD, true); p.R(hx, hy + 1, 2, 2, '#5a3a20', true); },
  greatsword: (p, hx, hy, o) => { p.R(hx, hy - 14, 3, 15, o.blade || '#d0d4e0', true); p.R(hx + 1, hy - 14, 1, 14, '#f4f6ff', true); p.P([[hx, hy - 14], [hx + 1, hy - 17], [hx + 3, hy - 14]], o.blade || '#d0d4e0', true); p.R(hx - 3, hy, 9, 1, GOLD, true); p.R(hx, hy + 1, 3, 3, '#5a3a20', true); },
  club: (p, hx, hy) => { p.R(hx, hy - 4, 2, 9, '#6a4a2a'); p.E(hx + 1, hy - 7, 3, 4, '#8a5a2a'); p.px(hx, hy - 8, '#5a3a1a', true); p.px(hx + 2, hy - 6, '#5a3a1a', true); },
  mace: (p, hx, hy) => { p.R(hx, hy - 4, 2, 9, '#6a4a2a'); p.E(hx + 1, hy - 7, 2.6, 2.6, '#c8a040'); for (const [x, y] of [[-3, -7], [5, -7], [1, -11], [1, -3]]) p.px(hx + x, hy + y, '#e8d070', true); },
  axe: (p, hx, hy) => { p.R(hx, hy - 8, 1, 13, WOOD); p.P([[hx, hy - 9], [hx + 5, hy - 10], [hx + 5, hy - 3], [hx, hy - 4]], '#c8ccd8', true); p.R(hx + 4, hy - 9, 1, 5, '#f0f2fa', true); },
  staff: (p, hx, hy, o) => { p.R(hx, hy - 10, 1, 16, WOOD); p.E(hx, hy - 12, 2, 2, o.orb || '#80c0ff', true); p.px(hx - 1, hy - 13, '#ffffff', true); },
  crossbow: (p, hx, hy) => { p.R(hx - 4, hy - 1, 9, 2, '#6a4a2a'); p.R(hx + 2, hy - 5, 1, 10, '#4a3a2a'); p.L(hx + 3, hy - 5, hx + 1, hy, '#e8e0c8', true); p.L(hx + 3, hy + 5, hx + 1, hy, '#e8e0c8', true); p.R(hx - 2, hy - 2, 7, 1, '#b8b8c0', true); p.px(hx + 5, hy - 2, '#d8d8e8', true); },
  sling: (p, hx, hy) => { p.L(hx, hy, hx + 3, hy - 6, '#c8b890', true); p.E(hx + 4, hy - 8, 1.2, 1.2, '#9a9aa0', true); p.px(hx - 1, hy - 9, '#c8b890', true); p.px(hx + 7, hy - 7, '#c8b890', true); },
  dagger2: (p, hx, hy) => { p.R(hx, hy - 4, 1, 5, '#e0e4f0', true); p.R(hx - 1, hy + 1, 3, 1, '#4a3a2a', true); p.R(hx + 3, hy - 3, 1, 4, '#e0e4f0', true); },
  torch: (p, hx, hy) => { p.R(hx, hy - 4, 2, 8, '#5a3a20'); p.P([[hx - 2, hy - 4], [hx + 1, hy - 11], [hx + 4, hy - 4]], '#ff7a20', true); p.P([[hx - 1, hy - 4], [hx + 1, hy - 9], [hx + 3, hy - 4]], '#ffd060', true); },
  scourge: (p, hx, hy) => { p.R(hx, hy - 3, 2, 6, '#3a2a20'); p.L(hx + 1, hy - 3, hx + 6, hy - 9, '#9a9aa8', true); p.L(hx + 6, hy - 9, hx + 9, hy - 5, '#9a9aa8', true); p.px(hx + 9, hy - 4, '#d8d8e8', true); },
  holysword: (p, hx, hy) => { p.R(hx - 1, hy - 13, 4, 14, '#ffb050', true); p.R(hx, hy - 13, 2, 13, '#fff0a0', true); p.P([[hx - 1, hy - 14], [hx + 1, hy - 20], [hx + 3, hy - 14]], '#ff8a30', true); p.R(hx - 3, hy, 8, 1, GOLD, true); p.R(hx, hy + 1, 2, 3, '#7a5a20', true); },
};

const SHIELD = {
  round: (p, x, y, o) => { p.E(x, y, 3.4, 3.4, o.sh || WOOD); p.E(x, y, 1.2, 1.2, '#c8c8d0', true); },
  kite: (p, x, y, o) => { p.P([[x - 3, y - 4], [x + 3, y - 4], [x + 3, y + 1], [x, y + 6], [x - 3, y + 1]], o.sh || '#3a5aa8'); p.R(x - 1, y - 3, 2, 8, o.shTrim || '#f0f0f8', true); p.R(x - 3, y - 1, 6, 2, o.shTrim || '#f0f0f8', true); },
  tower: (p, x, y, o) => { p.R(x - 3, y - 6, 7, 13, o.sh || '#c03030'); p.R(x - 3, y - 6, 7, 1, '#e8e8f0', true); p.R(x, y - 5, 1, 11, '#f0f0f8', true); p.R(x - 2, y - 1, 5, 1, '#f0f0f8', true); p.R(x - 3, y + 6, 7, 1, '#e8e8f0', true); },
  gold: (p, x, y, o) => { p.E(x, y, 4, 5, GOLD); p.E(x, y, 2.4, 3.4, '#fff0a0', true); p.R(x, y - 3, 1, 6, '#fff8d0', true); },
};

function person(o) {
  const b = o.bulk || 0, H = 18 + 4 * b, tw = 7 + 2 * b, cx = 9 + b, W = cx + 12 + 3 * b, pad = 9 + 3 * b;
  const p = new Pix(W, H, pad);
  const skin = o.skin || '#e0b890', cloth = o.cloth || '#8a6a4a', legc = o.legs || '#5a4a3a';
  const tx = cx - Math.floor(tw / 2), legTop = H - 5 - b, top = H - 12 - 2 * b, hy = top - 3 - Math.floor(b / 2), r = 3.1 + 0.35 * b;
  if (o.wings) { p.P([[tx + 1, top], [tx - 6 - b, top - 5 - b], [tx - 8 - b, top + 4], [tx - 2, top + 8]], o.wings); p.P([[tx + 1, top], [tx - 4 - b, top - 3], [tx - 5 - b, top + 3], [tx, top + 6]], '#ffffff', true); }
  if (o.cape) { p.P([[tx + 1, top], [tx - 2 - b, top + 3], [tx - 4 - b, H - 2], [tx + 2, H - 4]], o.cape); p.P([[tx + 1, top + 1], [tx - 1, top + 4], [tx - 2, H - 4], [tx + 2, H - 5]], mix(o.cape, '#ffffff', 0.14), true); }
  const lw = 2 + (b > 0 ? 1 : 0);
  if (!o.robe) { p.R(cx - 1 - lw, legTop, lw, H - legTop, legc); p.R(cx + 1, legTop, lw, H - legTop, legc); p.R(cx - 2 - lw, H - 1, lw + 2, 1, o.boots || '#2a1c18'); p.R(cx + 1, H - 1, lw + 2, 1, o.boots || '#2a1c18'); }
  // torso (or a long robe)
  if (o.robe) { p.P([[tx, top], [tx + tw, top], [tx + tw + 2 + b, H - 1], [tx - 2 - b, H - 1]], cloth); if (o.hover) p.R(tx - 2, H - 1, tw + 6, 1, 'rgba(0,0,0,0)'); }
  else p.R(tx, top, tw, legTop - top + 1, cloth);
  if (o.trim) { p.R(tx, top, tw, 1, o.trim, true); if (!o.robe) p.R(tx, legTop - 1, tw, 1, o.belt || '#3a2a20', true); else p.R(tx + Math.floor(tw / 2), top + 1, 1, H - top - 2, o.trim, true); }
  if (o.armor === 'chain') for (let y = top + 1; y < legTop - 1; y += 2) for (let x = tx + 1 + (y % 4 ? 1 : 0); x < tx + tw - 1; x += 2) p.px(x, y, mix(cloth, '#ffffff', 0.3), true);
  if (o.armor === 'plate') { p.R(tx + 1, top + 1, tw - 2, 3, mix(cloth, '#ffffff', 0.18), true); p.R(tx + Math.floor(tw / 2), top + 1, 1, legTop - top - 2, mix(cloth, '#000000', 0.2), true); }
  if (o.cross) { const mx = tx + Math.floor(tw / 2); p.R(mx, top + 1, 1, legTop - top - 2, o.cross, true); p.R(mx - 1, top + 3, 3, 1, o.cross, true); }
  if (o.chestBare) { p.R(tx + 1, top, tw - 2, 4, skin, true); p.R(tx + 1, top + 1, tw - 2, 1, '#c03030', true); }
  if (o.pauldrons) { p.E(tx, top + 1, 2.2 + b * 0.5, 1.8 + b * 0.3, o.pauldrons); p.E(tx + tw, top + 1, 2.2 + b * 0.5, 1.8 + b * 0.3, o.pauldrons); if (b >= 2) { p.px(tx - 1, top - 2, '#e8e8f0', true); p.px(tx + tw + 1, top - 2, '#e8e8f0', true); } }
  // head
  p.E(cx, hy, r, r - 0.2, skin);
  if (o.head) { const f = HEAD[o.head]; if (f) f(p, cx, hy, { ...o, skin }); }
  if (o.head !== 'greathelm' && o.head !== 'mask' && o.head !== 'bucket') {
    p.R(cx + 1, hy - 1, 1, 2, DARK, true); p.R(cx + 3, hy - 1, 1, 2, DARK, true);
    if (o.angry) { p.R(cx, hy - 2, 5, 1, DARK, true); }
    p.px(cx + 2, hy + 2, mix(skin, '#6a2a2a', 0.5), true);
    if (o.eye) { p.px(cx + 1, hy, o.eye, true); p.px(cx + 3, hy, o.eye, true); }
    if (o.beard) { p.R(cx - 1, hy + 2, 5, 3 + b, o.beard); p.R(cx, hy + 5 + b, 3, 2, o.beard); }
  }
  // arms: one behind, one reaching forward holding the weapon
  const hx = tx + tw + 2, hh = top + 3;
  p.R(tx - 2, top + 1, 3, 4 + b, mix(o.sleeve || (o.chestBare ? skin : cloth), '#000000', 0.15));
  p.R(tx + tw - 1, top + 1, 4, 3, o.sleeve || (o.chestBare ? skin : cloth)); p.R(tx + tw + 2, top + 1, 2, 3, skin);
  if (o.shield) SHIELD[o.shield](p, tx + tw + 3 + (o.shield === 'tower' ? 1 : 0), top + 6, o);
  if (o.weapon) WEAP[o.weapon](p, hx + (o.shield ? -1 : 1), hh, o);
  if (o.weapon2) WEAP[o.weapon2](p, tx - 3, top + 4, o);
  if (o.after) o.after(p, { cx, hy, top, tx, tw, H, b, legTop });
  p.finish();
  p.ax = (cx + 0.5) * 4;
  return p;
}

// ---------------------------------------------------------------------------------------------------------------
export const ENEMY = {
  peasant:  () => person({ head: 'straw', cloth: '#8a6a4a', legs: '#5a4a3a', weapon: 'pitchfork' }),
  militia:  () => person({ head: 'cap', hc: '#8a8a98', cloth: '#6a7a4a', legs: '#4a3a3a', weapon: 'spear', shield: 'round', sh: '#8a5a2a' }),
  slinger:  () => person({ head: 'hood', hc: '#6a5a3a', cloth: '#8a7a5a', legs: '#4a3a3a', weapon: 'sling' }),
  knight:   () => person({ bulk: 1, head: 'helm', hc: '#a8a8b8', cloth: '#8a8a9a', armor: 'chain', legs: '#4a4a58', weapon: 'sword', shield: 'kite', sh: '#3a5aa8', pauldrons: '#a8a8b8' }),
  champion: () => person({ bulk: 2, head: 'bucket', hc: '#8a8a98', chestBare: true, cloth: '#a84040', legs: '#6a4a3a', weapon: 'club', angry: true, skin: '#e0b890', sleeve: '#e0b890', trim: '#8a6a30' }),
  captain:  () => person({ bulk: 2, head: 'plume', hc: '#7a8ac0', plume: '#3a5aa8', cloth: '#3a5a9a', armor: 'chain', legs: '#2a2a3a', cape: '#2a3a7a', weapon: 'sword', pauldrons: '#9aa4c8', trim: GOLD, angry: true }),
  priest:   () => person({ bulk: 2, robe: true, head: 'hair', hc: '#f0f0f8', cloth: '#e8e0d0', trim: GOLD, weapon: 'staff', orb: '#ff5a5a', eye: '#ff3030', angry: true, skin: '#e8c8a0' }),
  commander:() => person({ bulk: 2, head: 'greathelm', hc: '#50505f', eye: '#ff3030', crest: '#a02828', cloth: '#2a2a3a', armor: 'plate', legs: '#1a1a24', cape: '#6a1a1a', weapon: 'greatsword', pauldrons: '#6a6a7a', trim: '#8a8a9a' }),

  crusader: () => person({ bulk: 1, head: 'helm', hc: '#c8c8d8', cloth: '#ece6e6', cross: RED, legs: '#6a2a2a', weapon: 'sword', shield: 'kite', sh: '#ece6e6', shTrim: RED, pauldrons: '#c8c8d8' }),
  crossbow: () => person({ head: 'cap', hc: '#6a6a78', cloth: '#4a5a7a', legs: '#3a3a48', weapon: 'crossbow' }),
  cleric:   () => person({ robe: true, head: 'hood', hc: '#f0e8d0', cloth: '#f0e8d8', trim: GOLD, weapon: 'staff', orb: '#ffe880', skin: '#e8c8a0' }),
  paladin:  () => person({ bulk: 1, head: 'winged', hc: '#e8d070', cloth: '#d8d8e8', armor: 'plate', legs: '#8a7a30', weapon: 'mace', shield: 'gold', pauldrons: '#e8d070', trim: GOLD }),
  inquisitor: () => person({ bulk: 2, head: 'wide', hc: '#1a1218', cloth: '#6a1a1a', legs: '#2a1010', cape: '#2a0a0a', weapon: 'torch', eye: '#ffd040', angry: true, trim: '#c8a040', belt: '#c8a040', weapon2: 'scourge' }),
  templar:  () => person({ bulk: 2, head: 'greathelm', hc: '#c8c8d8', eye: '#e84a4a', crest: '#a02828', cloth: '#e8e8f0', cross: RED, armor: 'plate', legs: '#8a8a9a', cape: '#a02828', weapon: 'greatsword', shield: 'tower', sh: '#e8e8f0', pauldrons: '#c8c8d8' }),
  archbishop: () => person({ bulk: 2, robe: true, head: 'mitre', hc: '#f4eedc', cloth: '#f4f4fa', trim: GOLD, weapon: 'staff', orb: '#ffe880', skin: '#e8c8a0', eye: '#4060c0', after: (p, c) => { p.E(c.cx, c.hy - 9, 5, 1.3, '#ffe880', true); } }),
  avenger:  () => person({ bulk: 2, head: 'winged', hc: '#fff0a0', cloth: '#f4e8b0', armor: 'plate', legs: '#d0b040', wings: '#e8e0c8', weapon: 'holysword', pauldrons: '#ffe060', trim: GOLD, angry: true, after: (p, c) => { p.E(c.cx, c.hy - 10, 5, 1.3, '#ffffff', true); } }),

  berserker: () => person({ bulk: 1, head: 'horns', hc: '#8a8a98', chestBare: true, cloth: '#b04020', legs: '#6a4a2a', skin: '#d8a070', sleeve: '#d8a070', beard: '#8a4a2a', weapon: 'axe', weapon2: 'axe', angry: true }),
  archmage: () => person({ robe: true, head: 'pointy', hc: '#3a50a0', cloth: '#4a60c0', trim: '#e8d070', beard: '#f0f0f8', weapon: 'staff', orb: '#80c0ff', skin: '#e0b890' }),
  assassin: () => person({ head: 'mask', hc: '#202030', cloth: '#303045', legs: '#202030', weapon: 'dagger2', after: (p, c) => { p.R(c.tx - 5, c.top + 1, 5, 2, '#c03030', true); p.R(c.tx - 7, c.top + 3, 4, 1, '#c03030', true); } }),
  sentinel: () => person({ bulk: 2, head: 'greathelm', hc: '#7a90b0', eye: '#80d0ff', crest: '#e8f0ff', cloth: '#7a90b0', armor: 'plate', legs: '#4a5a78', weapon: 'halberd', shield: 'tower', sh: '#5a70a0', pauldrons: '#9ab0c8' }),
  herodawn: () => person({ bulk: 2, head: 'spiky', hc: '#e8c040', cloth: '#f0f0ff', armor: 'plate', legs: '#a07020', cape: '#fff6d0', weapon: 'holysword', pauldrons: '#e8c040', trim: GOLD, eye: '#2060c0', after: (p, c) => { p.E(c.tx + 3, c.top + 5, 2, 2, '#ffd040', true); } }),
  supreme:  () => person({ bulk: 2, robe: true, head: 'crown', cloth: '#5030a0', trim: '#c080ff', weapon: 'staff', orb: '#c080ff', skin: '#e0b890', eye: '#ffe040', after: (p, c) => { for (const [x, y] of [[-9, 2], [11, -1], [-6, -9], [14, 8]]) { p.E(c.cx + x, c.top + y, 1.6, 1.6, '#c080ff', true); p.px(c.cx + x - 1, c.top + y - 1, '#ffffff', true); } } }),
  slayer:   () => person({ bulk: 2, head: 'horns', hc: '#5a6a7a', cloth: '#4a5a6a', armor: 'chain', legs: '#2a3040', cape: '#1a2a3a', weapon: 'greatsword', blade: '#c8e0ff', pauldrons: '#6a7a8a', eye: '#ff6020', angry: true }),
  herokind: () => person({ bulk: 3, head: 'crown', cloth: '#d09020', armor: 'plate', legs: '#7a1020', cape: '#c02030', weapon: 'greatsword', blade: '#fff0c0', pauldrons: '#ffd040', trim: GOLD, eye: '#2040c0', angry: true }),
};

export function enemyCanvas(name) {
  const f = ENEMY[name];
  if (!f) return null;
  const p = f();
  const c = p.toCanvas(4);
  c.axPx = p.ax;
  return c;
}
