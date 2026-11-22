// Canvas drawing. Sprites are generated from pixel grids (see SPRITES) and cached.
import { FIELD_W, FIELD_H, NECRO_X, GATE_X, REGIONS, UNITS } from './data.js';
import { ATTACK_TIME } from './sim.js';
import { LOOKS } from './looks.js';
import { RARITIES, SLOTS, rarityIndex } from './gear.js';

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

const BIG_GRID = [
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
];

const SPRITES = {
  necro0: { scale: 6, grid: NECRO_GRID, palette: { ...NECRO_BASE, H: '#4a4048', h: '#5a5058', R: '#3a3238', r: '#4a424a', E: '#c8c070', T: '#7a5a30', O: '#9a9a70' } },
  necro1: { scale: 6, grid: NECRO_GRID, palette: { ...NECRO_BASE, H: '#3a2a5a', h: '#5a4a8a', R: '#2a2040', r: '#4a3a6a', E: '#8fd16a', T: '#7a5a30', O: '#8fd16a' } },
  necro2: { scale: 6, grid: NECRO_GRID, palette: { ...NECRO_BASE, H: '#2a1a4a', h: '#7a5ab8', R: '#241a3c', r: '#5a3a8a', E: '#8fd16a', T: '#c8a040', O: '#b8f090' } },
  necro3: { scale: 6, grid: NECRO_GRID, palette: { ...NECRO_BASE, S: '#e8e8d8', H: '#101010', h: '#303030', R: '#0a0a10', r: '#1a2a1a', E: '#b8f090', T: '#d8d0b0', O: '#b8f090' } },
  wall: { scale: 4, palette: { B: '#e8e0c8', b: '#b8b09a', d: '#7a7260' },
    grid: ['..B.B.B..', '.BBBBBBB.', '.BbBBbBB.', '.BBBBBBB.', '.BbBBBbB.', '.BBBBBBB.', '.bBBbBBb.', '.BBBBBBd.', 'dBBBBBBdd'] },
  tower: { scale: 4, palette: { S: '#8a8498', s: '#6a6478', E: '#8fd16a', G: '#4a8a52' },
    grid: ['.G.GG.G.', '.GGGGGG.', '..SSSS..', '..SEES..', '..SSSS..', '.SSSSSS.', '..SssS..', '..SSSS..', '..SssS..', '..SSSS..', '.SSSSSS.', '.SSssSS.', 'SSSSSSSS', 'SssSSssS'] },
  icon_wall: { scale: 4, palette: { B: '#e8e0c8', b: '#b8b09a', d: '#7a7260' },
    grid: ['..B.B.B..', '.BBBBBBB.', '.BbBBbBB.', '.BBBBBBB.', '.BbBBBbB.', '.BBBBBBB.', '.bBBbBBb.', 'dBBBBBBdd'] },
  icon_trap: { scale: 4, palette: { B: '#e8e0c8', S: '#6a6478', s: '#4a4458' },
    grid: ['..B..B..B.', '..B..B..B.', '.BB.BB.BB.', '.BB.BB.BB.', 'SSSSSSSSSS', 'SsSsSsSsSs'] },
  icon_tower: { scale: 4, palette: { S: '#8a8498', s: '#6a6478', E: '#8fd16a', G: '#4a8a52' },
    grid: ['.G.GG.G.', '.GGGGGG.', '..SSSS..', '..SEES..', '..SSSS..', '.SSSSSS.', '..SssS..', '.SSSSSS.', 'SSSSSSSS'] },
  gear_weapon: { scale: 4, palette: { B: '#e8e0f0', W: '#9a6a30', G: '#c8a040' },
    grid: ['........BB', '.......BBB', '......BBB.', '.....BBB..', '.B..BBB...', '.GBBBB....', '..GGB.....', '.WWG......', 'WW........'] },
  gear_armour: { scale: 4, palette: { A: '#b0a8c8', a: '#8a82a8', G: '#c8a040' },
    grid: ['.AA....AA.', 'AAAA..AAAA', 'AAAAAAAAAA', '.AAAAAAAA.', '.AAAGGAAA.', '.AAAGGAAA.', '.aAAAAAAa.', '..aAAAAa..'] },
  gear_charm: { scale: 4, palette: { C: '#b0a8c8', G: '#8fd16a', H: '#e0ffd0' },
    grid: ['.C......C.', '..C....C..', '...C..C...', '....CC....', '...GGGG...', '..GGHHGG..', '..GGHGGG..', '...GGGG...'] },
  icon_dust: { scale: 4, palette: { D: '#e8e0c8', d: '#b8b09a' },
    grid: ['....D.....', '...DDD....', '..DDdDD...', '.DDDDDDD..', 'DdDDdDDdD.'] },
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
  champion: { scale: 6, grid: BIG_GRID, palette: { S: '#e0b890', H: '#b8b8c8', h: '#80808f', T: '#a84040', P: '#4a3a3a', E: '#202020', W: '#d0d0d8', M: '#6a4a2a' } },
  captain:  { scale: 6, grid: BIG_GRID, palette: { S: '#d8a880', H: '#5a6a9a', h: '#3a4a7a', T: '#3a5a9a', P: '#2a2a3a', E: '#202020', W: '#e0e0e8', M: '#8a5a2a' } },
  priest:   { scale: 6, grid: BIG_GRID, palette: { S: '#e8c8a0', H: '#e8e0b0', h: '#c8a040', T: '#e8e0d0', P: '#c8b890', E: '#a02020', W: '#f0d060', M: '#c8a040' } },
  commander:{ scale: 7, grid: BIG_GRID, palette: { S: '#c8a080', H: '#8a8a9a', h: '#50505f', T: '#2a2a3a', P: '#1a1a24', E: '#d03030', W: '#c0c0d0', M: '#50505f' } },
  knight:   { scale: 5, grid: BIG_GRID, palette: { S: '#d0a888', H: '#a8a8b8', h: '#70707f', T: '#7a7a8a', P: '#3a3a48', E: '#202020', W: '#d0d0d8', M: '#6a4a2a' } },
  crusader: { scale: 5, grid: BIG_GRID, palette: { S: '#d0a888', H: '#c8c8d8', h: '#8a8a9a', T: '#ece6e6', P: '#6a2a2a', E: '#202020', W: '#d0d0d8', M: '#a02828' } },
  paladin:  { scale: 6, grid: BIG_GRID, palette: { S: '#e0b890', H: '#e8d070', h: '#b09a40', T: '#d8d8e8', P: '#8a7a30', E: '#202020', W: '#fff0a0', M: '#e8d070' } },
  inquisitor: { scale: 7, grid: BIG_GRID, palette: { S: '#d8b890', H: '#2a1a1a', h: '#4a2a2a', T: '#6a1a1a', P: '#2a1010', E: '#ffd040', W: '#d0d0d8', M: '#4a3a2a' } },
  templar:  { scale: 7, grid: BIG_GRID, palette: { S: '#d0a888', H: '#c8c8d8', h: '#7a7a8a', T: '#d8d8e8', P: '#5a1a1a', E: '#202020', W: '#e8e8f0', M: '#a02828' } },
  archbishop: { scale: 7, grid: BIG_GRID, palette: { S: '#e8c8a0', H: '#f0e8c0', h: '#c8a040', T: '#f0f0f8', P: '#c8a040', E: '#4060c0', W: '#ffe080', M: '#c8a040' } },
  avenger:  { scale: 8, grid: BIG_GRID, palette: { S: '#f0d8b8', H: '#fff0a0', h: '#e0c050', T: '#fff8e0', P: '#d0b040', E: '#ffffff', W: '#ffffff', M: '#ffe060' } },
  berserker: { scale: 5, grid: BIG_GRID, palette: { S: '#d8a070', H: '#6a3a1a', h: '#8a4a2a', T: '#b04020', P: '#3a2a1a', E: '#202020', W: '#d0d0d8', M: '#6a4a2a' } },
  sentinel: { scale: 7, grid: BIG_GRID, palette: { S: '#d0b090', H: '#9ab0c8', h: '#6a8098', T: '#7a90b0', P: '#3a4a60', E: '#202020', W: '#e0f0ff', M: '#4a5a78' } },
  herodawn: { scale: 8, grid: BIG_GRID, palette: { S: '#f0d0b0', H: '#e8c040', h: '#b08a20', T: '#f0f0ff', P: '#a07020', E: '#2060c0', W: '#ffffff', M: '#e8c040' } },
  slayer:   { scale: 8, grid: BIG_GRID, palette: { S: '#c8a080', H: '#5a6a7a', h: '#3a4a5a', T: '#4a5a6a', P: '#2a3040', E: '#ff6020', W: '#c8e0ff', M: '#3a4a5a' } },
  herokind: { scale: 9, grid: BIG_GRID, palette: { S: '#f0d0b0', H: '#ffd040', h: '#d09020', T: '#c02030', P: '#7a1020', E: '#2040c0', W: '#fff0c0', M: '#ffd040' } },
  archmage: {
    scale: 5,
    palette: { K: '#e0b890', H: '#3a50a0', T: '#4a60c0', P: '#2a3a80', E: '#202020', O: '#80c0ff' },
    grid: ['..HHHH.O', '.HHHHHHO', '..KKKK.O', '.KEKKEK.', '..KKKK..', '.TTTTTT.', 'KTTTTTT.', '.TTTTTT.', '.TTTTTT.', '.PP..PP.'],
  },
  supreme: {
    scale: 8,
    palette: { K: '#e0b890', H: '#201060', T: '#5030a0', P: '#301870', E: '#ffe040', O: '#c080ff' },
    grid: ['..HHHH.O', '.HHHHHHO', '..KKKK.O', '.KEKKEK.', '..KKKK..', '.TTTTTT.', 'KTTTTTT.', '.TTTTTT.', '.TTTTTT.', '.PP..PP.'],
  },
  assassin: {
    scale: 4,
    palette: { S: '#d8b890', H: '#202030', T: '#303045', P: '#202030', E: '#ff4040' },
    grid: ['..HHHH..', '.HHHHHH.', '..SSSS..', '.SESSES.', '..SSSS..', '.TTTTTT.', 'STTTTTTS', '.TTTTTT.', '.PP..PP.', '.PP..PP.'],
  },
  crossbow: {
    scale: 4,
    palette: { K: '#e0b890', H: '#6a6a78', T: '#4a5a7a', P: '#3a3a48', E: '#202020', O: '#9a8a6a' },
    grid: ['..HHHH..', '.HHHHHH.', '..KKKK..', '.KEKKEK.', '..KKKK..', '.TTTTTT.', 'KTTTTTTO', '.TTTTTTO', '.PP..PP.', '.PP..PP.'],
  },
  cleric: {
    scale: 4,
    palette: { K: '#e8c8a0', H: '#f0e8d0', T: '#f0e8d8', P: '#c8b890', E: '#202020', O: '#f0d060' },
    grid: ['..HHHH.O', '.HHHHHHO', '..KKKK.O', '.KEKKEK.', '..KKKK..', '.TTTTTT.', 'KTTTTTT.', '.TTTTTT.', '.TTTTTT.', '.PP..PP.'],
  },
  militia: {
    scale: 4,
    palette: { K: '#e0b890', A: '#8a8a98', T: '#6a7a4a', P: '#4a3a3a', E: '#202020', W: '#8a5a2a', Y: '#d8d8e8' },
    grid: [
      '..AAAA..Y',
      '.AAAAAA.W',
      '..KKKK..W',
      '.KEKKEK.W',
      '..KKKK..W',
      '.TTTTTTKW',
      'KTTTTTT.W',
      '.TTTTTT.W',
      '.PP..PP.W',
      '.PP..PP..',
    ],
  },
  slinger: {
    scale: 4,
    palette: { K: '#e0b890', H: '#6a5a3a', T: '#8a7a5a', P: '#4a3a3a', E: '#202020', O: '#c8c0a0' },
    grid: [
      '..HHHH..',
      '.HHHHHH.',
      '..KKKK..',
      '.KEKKEK.',
      '..KKKK..',
      '.TTTTTT.',
      'KTTTTTTO',
      '.TTTTTT.',
      '.PP..PP.',
      '.PP..PP.',
    ],
  },
  skeleton: {
    scale: 4,
    palette: { B: '#e8e0c8', E: '#2a2030', D: '#8a5a2a', Y: '#d8d8e8', G: '#c8a040' },
    grid: [
      '..BBBB...',
      '.BBBBBB.Y',
      '.BEBBEB.Y',
      '..BBBB..Y',
      'DDBBBBB.Y',
      'DDDBBBBGG',
      'DDDBBB...',
      '.DD.BB...',
      '...B.B...',
      '...B.B...',
    ],
  },
  hound: {
    scale: 4,
    palette: { G: '#7fa86a', g: '#5f8a52', E: '#e8e0a0', D: '#3a2f48', R: '#a04848' },
    grid: [
      '.......GG.',
      '.GGGGGGGGE',
      'GGGGGGGGGR',
      '.gGGGGGGg.',
      '.G.G..G.G.',
      '.D.D..D.D.',
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
  icon_frost: {
    scale: 5,
    palette: { I: '#a0e0ff' },
    grid: ['....I....', '.I..I..I.', '..I.I.I..', '...III...', 'IIIIIIIII', '...III...', '..I.I.I..', '.I..I..I.', '....I....'],
  },
  icon_drain: {
    scale: 5,
    palette: { R: '#d6596b', r: '#f4b0b8' },
    grid: ['....R....', '...RRR...', '..RRRRR..', '..RRrRR..', '.RRRrRRR.', '.RRRRRRR.', '..RRRRR..', '...RRR...', '....R....'],
  },
  icon_regen: {
    scale: 5,
    palette: { G: '#8fd16a' },
    grid: ['...GGG...', '...GGG...', '...GGG...', 'GGGGGGGGG', 'GGGGGGGGG', 'GGGGGGGGG', '...GGG...', '...GGG...', '...GGG...'],
  },
  icon_poison: {
    scale: 5,
    palette: { G: '#8fd16a', g: '#c8ff9a' },
    grid: ['....G....', '...GG....', '...GGG...', '..GGGGG..', '.GGgGGGG.', '.GGGGGGG.', '.GGGGGgG.', '..GGGGG..', '...GGG...'],
  },
  icon_burst: {
    scale: 5,
    palette: { P: '#a050c0', p: '#d090f0', S: '#d8d0b0' },
    grid: ['..PPPPP..', '.PPpPPPP.', 'PPPPPpPPP', 'PPPPPPPPP', '.........', '...SSS...', '...SSS...', '...SSS...', '..SSSSS..'],
  },
  icon_fire: {
    scale: 5,
    palette: { O: '#e06020', Y: '#ffd060' },
    grid: ['....O....', '...OO....', '...OOO...', '..OOYOO..', '.OOOYYOO.', '.OOYYYOO.', '.OOYYYOO.', '..OOYOO..', '...OOO...'],
  },
  icon_shield: {
    scale: 5,
    palette: { S: '#c8c8d8', G: '#6a6a88' },
    grid: ['.SSSSSSS.', 'SGGGGGGGS', 'SGSSSSSGS', 'SGSSSSSGS', 'SGSSSSSGS', '.SGSSSGS.', '.SGSSSGS.', '..SGSGS..', '...SSS...'],
  },
  icon_pack: {
    scale: 5,
    palette: { P: '#e0a050' },
    grid: ['..P...P..', '.PPP.PPP.', '..P...P..', '....P....', '..PPPPP..', '.PPPPPPP.', '.PPPPPPP.', '..PP.PP..', '.........'],
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

const LANE_TOP_DRAW = 334, LANE_BOTTOM_DRAW = 446;
const topRarity = (save) => {
  let best = -1;
  for (const slot of SLOTS) { const it = (save.gear || []).find((x) => x.id === (save.equipped || {})[slot]); if (it) best = Math.max(best, rarityIndex(it.rarity)); }
  return best;
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
  if (!SPRITES[name] && LOOKS[name]) return lookSprite(name, { hs: 0, ds: 0, flags: [] });
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
  return (cache[name] = makeSprite(c, c.width / 2));
}

function makeSprite(c, ax) {
  return {
    img: c, w: c.width, h: c.height, ax,
    flash: silhouette(c, '#ffffff'), dark: silhouette(c, '#0a0710'),
    poison: silhouette(c, '#9dff7a'), burn: silhouette(c, '#ff9030'),
  };
}

// Player units are composed from layers: a base body plus rects added by each finished HP/damage tier and ability.
// look = { hs, ds, flags } from data.lookOf().
function lookSprite(unit, look) {
  const key = `${unit}:${look.hs}:${look.ds}:${look.flags.join(',')}`;
  if (cache[key]) return cache[key];
  const L = LOOKS[unit];
  const grid = L.gridFor ? L.gridFor(look.hs) : L.grid;
  const pal = { ...L.palette, ...(look.hs === 0 && L.rottenPalette ? L.rottenPalette : {}) };
  const rects = [];
  const poison = look.flags.includes('poison');
  for (let i = 0; i < look.hs; i++) { Object.assign(pal, L.hp[i].palette || {}); rects.push(...(L.hp[i].rects || [])); }
  for (let i = 0; i < look.ds; i++) {
    const st = L.dmg[i];
    Object.assign(pal, st.palette || {});
    for (const r of st.rects || []) rects.push(poison && st.tintable ? [r[0], r[1], '#9dff7a', r[3], r[4]] : r);
  }
  for (const f of look.flags) rects.push(...((L.flags && L.flags[f]) || []));
  const gw = Math.max(...grid.map((r) => r.length));
  const c = document.createElement('canvas');
  c.width = (gw + L.pad) * L.scale; c.height = grid.length * L.scale;
  const g = c.getContext('2d');
  grid.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.') return;
    g.fillStyle = pal[ch];
    g.fillRect(x * L.scale, y * L.scale, L.scale, L.scale);
  }));
  for (const [x, y, color, w = 1, h = 1] of rects) { g.fillStyle = color; g.fillRect(x * L.scale, y * L.scale, w * L.scale, h * L.scale); }
  return (cache[key] = makeSprite(c, (gw * L.scale) / 2));
}

function unitSprite(u) {
  return u.look && LOOKS[u.type] ? lookSprite(u.type, u.look) : sprite(u.def.sprite);
}

// A fresh canvas of a unit as it looks with the given look, for the skill web.
export function lookCanvas(unit, look) {
  const s = lookSprite(unit, look);
  const c = document.createElement('canvas');
  c.width = s.w; c.height = s.h;
  c.getContext('2d').drawImage(s.img, 0, 0);
  return c;
}

// A fresh canvas holding an icon sprite, for use in the HTML UI.
export function iconCanvas(name) {
  const s = sprite(name);
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
const peakPts = Array.from({ length: 41 }, (_, i) => ({ x: i * 24, y: 232 + rnd() * 52 + Math.sin(i * 0.5) * 14 }));
const clouds = Array.from({ length: 6 }, (_, i) => ({ x: i * 190 + rnd() * 60, y: 30 + rnd() * 150, w: 80 + rnd() * 120, sp: 3 + rnd() * 5 }));
const flakes = Array.from({ length: 110 }, () => ({ x: rnd() * FIELD_W, y: rnd() * FIELD_H, sp: 28 + rnd() * 50, ph: rnd() * 6.28, r: 1 + Math.floor(rnd() * 2) }));
const motes = Array.from({ length: 36 }, () => ({ x: rnd() * FIELD_W, y: 120 + rnd() * 400, sp: 5 + rnd() * 12, ph: rnd() * 6.28, r: 1 + rnd() * 1.6 }));
const lamps = [300, 540, 780].map((x, i) => ({ x, y: 356 + (i % 2) * 6 }));
const blades = Array.from({ length: 80 }, (_, i) => ({ x: i * 12 + rnd() * 8, h: 9 + rnd() * 9, ph: rnd() * 6.28 }));
const bats = [0, 1, 2].map((i) => ({ off: i * 400, y: 50 + i * 38, speed: 38 + i * 12, ph: i }));

function drawTree(g, t) {
  g.fillStyle = TH.tree;
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
  g.fillStyle = TH.castle;
  g.fillRect(830, 262, 130, 70);
  for (const [x, w, h] of [[820, 26, 110], [884, 22, 130], [930, 30, 96]]) {
    g.fillRect(x, 332 - h, w, h);
    for (let i = 0; i < w; i += 8) g.fillRect(x + i, 332 - h - 7, 5, 7);
    g.beginPath(); g.moveTo(x - 3, 332 - h - 7); g.lineTo(x + w / 2, 332 - h - 34); g.lineTo(x + w + 3, 332 - h - 7); g.fill();
  }
  g.fillStyle = TH.windows;
  [[830, 290], [892, 262], [940, 280], [860, 305], [905, 300]].forEach(([x, y], i) => {
    g.globalAlpha = 0.55 + 0.45 * Math.sin(t * 3 + i * 1.7);
    g.fillRect(x, y, 4, 7);
  });
  g.globalAlpha = 1;
}

const theme = (regionId) => (REGIONS.find((r) => r.id === regionId) || REGIONS[0]).theme;

// Look of each region's battlefield.
const THEMES = {
  graveyard: { skyTop: '#1a1030', skyBot: '#46305f', stars: true, orb: '#d8d0b0', orbCut: '#2a1c42', hills: '#1d1430', castle: '#150e20', windows: '#e8c860', tree: '#17101f',
    groundA: '#2c3a2a', groundB: '#243021', groundC: '#26331f', path: 'rgba(70,58,48,0.35)', tuft: '#3a5236', fog: 'rgba(200,190,230,0.05)', bats: true,
    peaks: '#171028', cloud: 'rgba(90,70,120,0.35)', weather: 'wisps', mote: '#9dff7a', lamp: '#ffb040', lightning: true, halo: 'rgba(216,208,176,0.22)' },
  frost: { skyTop: '#0e1a38', skyBot: '#8ab0d8', stars: true, orb: '#e8f0ff', orbCut: '#1a2a52', hills: '#6a80a8', castle: '#2a3858', windows: '#a0d0ff', tree: '#1c2a40',
    groundA: '#c8d8e8', groundB: '#a8bcd0', groundC: '#b8cadc', path: 'rgba(120,150,185,0.35)', tuft: '#e8f0f8', fog: 'rgba(220,235,255,0.1)', bats: false,
    peaks: '#4a608a', cloud: 'rgba(200,220,255,0.18)', weather: 'snow', mote: '#ffffff', lamp: '#a0d8ff', aurora: true, halo: 'rgba(232,240,255,0.2)' },
  holy: { skyTop: '#27367a', skyBot: '#f3b07c', stars: false, orb: '#fff0b0', orbCut: null, hills: '#6a5a8a', castle: '#3a3052', windows: '#fff0a0', tree: '#2a3020',
    groundA: '#5a7248', groundB: '#4a6238', groundC: '#52693f', path: 'rgba(210,200,176,0.4)', tuft: '#7a9c5a', fog: 'rgba(255,232,205,0.08)', bats: false,
    peaks: '#5a4a7a', cloud: 'rgba(255,225,200,0.5)', weather: 'motes', mote: '#ffe890', lamp: '#ffe090', halo: 'rgba(255,240,180,0.0)' },
};
let TH = THEMES.graveyard;

function drawBackground(g, t) {
  const sky = g.createLinearGradient(0, 0, 0, 330);
  sky.addColorStop(0, TH.skyTop); sky.addColorStop(1, TH.skyBot);
  g.fillStyle = sky; g.fillRect(0, 0, FIELD_W, 330);
  if (TH.stars) {
    g.fillStyle = '#e8e0f0';
    for (const s of stars) { g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2 + s.x); g.fillRect(s.x, s.y, s.r, s.r); }
    g.globalAlpha = 1;
  }
  if (TH.aurora) {
    g.save(); g.globalCompositeOperation = 'lighter';
    ['#40ffb0', '#6080ff', '#c060ff'].forEach((c, band) => {
      g.fillStyle = c;
      for (let x = 0; x < FIELD_W; x += 10) {
        g.globalAlpha = 0.07 + 0.05 * Math.sin(x * 0.02 + t * 0.8 + band);
        const y = 60 + band * 26 + Math.sin(x * 0.011 + t * 0.35 + band * 2) * 28;
        g.fillRect(x, y, 10, 46);
      }
    });
    g.restore();
  }
  if (TH.halo) {
    const hg = g.createRadialGradient(640, 90, 20, 640, 90, 150);
    hg.addColorStop(0, TH.halo); hg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = hg; g.fillRect(470, 0, 340, 260);
  }
  if (TH.orbCut) {
    // A crescent: the moon disc with a circle cut out of it (clipped, so the sky shows through).
    g.save();
    g.beginPath(); g.arc(640, 90, 34, 0, Math.PI * 2); g.clip();
    g.fillStyle = TH.orb; g.beginPath(); g.rect(600, 50, 80, 80); g.arc(626, 80, 30, 0, Math.PI * 2); g.fill('evenodd');
    g.restore();
  } else {
    const glow = g.createRadialGradient(640, 100, 10, 640, 100, 120);
    glow.addColorStop(0, 'rgba(255,240,180,0.55)'); glow.addColorStop(1, 'rgba(255,240,180,0)');
    g.fillStyle = glow; g.fillRect(500, 0, 280, 240);
    g.fillStyle = TH.orb; g.beginPath(); g.arc(640, 100, 40, 0, Math.PI * 2); g.fill();
  }
  // Drifting clouds
  g.fillStyle = TH.cloud;
  for (const c of clouds) {
    const x = ((c.x + t * c.sp) % (FIELD_W + 320)) - 160;
    g.beginPath(); g.ellipse(x, c.y, c.w * 0.5, 12, 0, 0, Math.PI * 2); g.ellipse(x - c.w * 0.25, c.y + 5, c.w * 0.32, 9, 0, 0, Math.PI * 2); g.ellipse(x + c.w * 0.28, c.y + 4, c.w * 0.3, 10, 0, 0, Math.PI * 2); g.fill();
  }
  // Distant jagged peaks behind the hills
  g.fillStyle = TH.peaks;
  g.beginPath(); g.moveTo(0, 330);
  for (const p of peakPts) g.lineTo(p.x, p.y);
  g.lineTo(FIELD_W, 330); g.fill();
  if (TH.lightning) {
    const f = (t + 9) % 17;
    if (f < 0.3) { g.fillStyle = 'rgba(200,210,255,' + (0.28 * (1 - f / 0.3) * (f > 0.12 && f < 0.18 ? 0.3 : 1)) + ')'; g.fillRect(0, 0, FIELD_W, 330); }
  }
  // Far hills
  g.fillStyle = TH.hills;
  g.beginPath(); g.moveTo(0, 330);
  for (let x = 0; x <= FIELD_W; x += 40) g.lineTo(x, 300 + Math.sin(x * 0.012) * 18 + Math.sin(x * 0.05) * 6);
  g.lineTo(FIELD_W, 330); g.fill();
  drawCastle(g, t);
  for (const tr of trees) drawTree(g, tr);
  // Bats
  g.fillStyle = '#0c0814';
  for (const b of TH.bats ? bats : []) {
    const x = ((t * b.speed + b.off) % (FIELD_W + 120)) - 60, y = b.y + Math.sin(t * 1.5 + b.ph) * 14;
    const flap = Math.sin(t * 14 + b.ph) > 0 ? 5 : -1;
    g.fillRect(x - 2, y, 5, 3);
    g.fillRect(x - 10, y + flap - 2, 8, 2); g.fillRect(x + 4, y + flap - 2, 8, 2);
  }
  // Ground
  g.fillStyle = TH.groundA; g.fillRect(0, 330, FIELD_W, FIELD_H - 330);
  g.fillStyle = TH.groundB; g.fillRect(0, 330, FIELD_W, 6);
  g.fillStyle = TH.groundC;
  for (let i = 0; i < 60; i++) g.fillRect((i * 97) % FIELD_W, 340 + ((i * 53) % 190), 6, 2);
  // Ground fades darker towards the viewer
  const gd = g.createLinearGradient(0, 330, 0, FIELD_H);
  gd.addColorStop(0, 'rgba(0,0,0,0)'); gd.addColorStop(1, 'rgba(0,0,0,0.38)');
  g.fillStyle = gd; g.fillRect(0, 330, FIELD_W, FIELD_H - 330);
  // Worn path along the lane, with flagstones
  g.fillStyle = TH.path; g.fillRect(0, 385, FIELD_W, 55);
  g.fillStyle = 'rgba(0,0,0,0.12)';
  for (let i = 0; i < 24; i++) g.fillRect((i * 83) % FIELD_W, 392 + ((i * 37) % 40), 22, 7);
  // Grass tufts, graves, bones
  g.fillStyle = TH.tuft;
  for (const f of tufts) { g.fillRect(f.x, f.y - f.h, 1, f.h); g.fillRect(f.x + 2, f.y - f.h + 1, 1, f.h - 1); g.fillRect(f.x - 2, f.y - f.h + 1, 1, f.h - 1); }
  for (const o of [...graves].sort((a, b) => a.y - b.y)) drawGrave(g, o);
  // Lamp posts: a small flame and a soft pool of light
  for (const l of lamps) {
    g.fillStyle = '#0c0814'; g.fillRect(l.x - 2, l.y - 40, 4, 40); g.fillRect(l.x - 6, l.y - 48, 12, 9);
    const fl = 0.75 + 0.25 * Math.sin(t * 9 + l.x) * Math.sin(t * 5.3 + l.x * 0.3);
    g.fillStyle = TH.lamp; g.fillRect(l.x - 3, l.y - 46, 6, 5);
    g.save(); g.globalCompositeOperation = 'lighter';
    const lg = g.createRadialGradient(l.x, l.y - 44, 2, l.x, l.y - 44, 70);
    lg.addColorStop(0, TH.lamp); lg.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.22 * fl; g.fillStyle = lg; g.fillRect(l.x - 70, l.y - 114, 140, 140);
    g.restore();
  }
  g.fillStyle = '#c8c0a8';
  for (const b of bones) { g.fillRect(b.x, b.y, 8, 2); g.fillRect(b.x - 1, b.y - 1, 2, 4); g.fillRect(b.x + 7, b.y - 1, 2, 4); }
}

function drawFog(g, t) {
  g.fillStyle = TH.fog;
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
  // Rune circle on the platform
  g.save(); g.translate(x, base); g.scale(1, 0.26);
  g.strokeStyle = 'rgba(143,209,106,' + (0.28 + cast * 0.6) + ')'; g.lineWidth = 3;
  g.beginPath(); g.arc(0, 0, 52 + cast * 16, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(0, 0, 36, 0, Math.PI * 2); g.stroke();
  g.rotate(t * (0.4 + cast * 3)); g.fillStyle = g.strokeStyle;
  for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); g.fillRect(40, -2, 10, 4); }
  g.restore();
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
      g.fillStyle = { zombie: '#8fd16a', archer: '#e8e0c8', skeleton: '#a8b0e0', hound: '#e0a050' }[type] || '#ffffff';
      g.fillRect(bx, by, bw * battle.raiseProgress(type), 5);
    });
  }
}

function drawUnit(g, u, t, rar) {
  const s = unitSprite(u);
  const bob = u.def.ghostly ? 4 + Math.sin(t * 3 + u.id) * 3 : u.moving ? Math.abs(Math.sin(t * 9 + u.id)) * 3 : 0;
  // Attack animation: wind up (lean back), strike (lunge and lean forward), then recover.
  let lunge = 0, lean = 0, squash = 1;
  if (u.attackAnim > 0) {
    const p = 1 - u.attackAnim / ATTACK_TIME;
    const ranged = u.def.range > 40;
    if (p < 0.4) { const k = p / 0.4; lunge = -(ranged ? 7 : 5) * k; lean = -0.28 * k; squash = 1 + 0.08 * k; }
    else if (p < 0.6) { const k = (p - 0.4) / 0.2; lunge = ranged ? -7 + 3 * k : -5 + 17 * k; lean = ranged ? -0.28 + 0.2 * k : -0.28 + 0.8 * k; squash = 1.08 - 0.16 * k; }
    else { const k = (p - 0.6) / 0.4; lunge = ranged ? -4 * (1 - k) : 12 * (1 - k); lean = (ranged ? -0.08 : 0.52) * (1 - k); squash = 0.92 + 0.08 * k; }
  }
  if (!u.attackAnim && !u.moving) squash = 1 + 0.025 * Math.sin(t * 3 + u.id * 1.3);
  const rise = u.age < 0.45 ? u.age / 0.45 : 1;
  const dir = u.team === 'player' ? 1 : -1;
  const px = Math.round(u.x + lunge * dir), py = Math.round(u.y - bob + (1 - rise) * 16);
  g.fillStyle = u.team === 'player' ? 'rgba(143,209,106,0.28)' : 'rgba(214,89,107,0.28)';
  g.beginPath(); g.ellipse(u.x, u.y, s.w * 0.45, 5, 0, 0, Math.PI * 2); g.fill();
  g.save();
  g.globalAlpha = (u.def.ghostly ? 0.75 : 1) * rise;
  g.translate(px, py);
  if (u.team === 'enemy') g.scale(-1, 1);
  g.rotate(lean);
  g.scale(1 / squash, squash);
  if (u.elite) g.scale(1.22, 1.22);
  const baseAlpha = g.globalAlpha;
  const x0 = -s.ax, y0 = -s.h;
  if (u.elite) {
    s.rar = s.rar || {};
    const gold = s.rar['#ffd060'] || (s.rar['#ffd060'] = silhouette(s.img, '#ffd060'));
    g.globalAlpha = baseAlpha * (0.6 + 0.3 * Math.sin(t * 6 + u.id));
    for (const [dx, dy] of [[-3, 0], [3, 0], [0, -3], [0, 3]]) g.drawImage(gold, x0 + dx, y0 + dy);
    g.globalAlpha = baseAlpha;
  }
  // Thin dark outline so overlapping units stay readable.
  if (rar >= 1 && u.team === 'player' && !u.def.static) {
    const col = RARITIES[rar].color;
    s.rar = s.rar || {};
    const sil = s.rar[col] || (s.rar[col] = silhouette(s.img, col));
    g.globalAlpha = baseAlpha * (rar === 4 ? 0.65 + 0.3 * Math.sin(t * 5 + u.id) : 0.75);
    for (const [dx, dy] of [[-3, 0], [3, 0], [0, -3], [0, 3]]) g.drawImage(sil, x0 + dx, y0 + dy);
    g.globalAlpha = baseAlpha;
  }
  for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) g.drawImage(s.dark, x0 + dx, y0 + dy);
  g.drawImage(u.flash > 0 ? s.flash : s.img, x0, y0);
  // Status tints: poisoned units glow green, burning units orange.
  const sick = u.enraged ? s.burn : u.status && (u.status.poison ? s.poison : u.status.burn ? s.burn : null);
  if (sick) { g.globalAlpha = 0.35 + 0.15 * Math.sin(t * 10 + u.id); g.drawImage(sick, x0, y0); g.globalAlpha = 1; }
  g.restore();
  g.globalAlpha = 1;
  if (u.guard > 0) {
    g.strokeStyle = '#a0d8ff'; g.lineWidth = 3; g.globalAlpha = 0.55 + 0.25 * Math.sin(t * 12);
    g.beginPath(); g.ellipse(px, py - s.h * 0.5, s.w * 0.65, s.h * 0.62, 0, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(160,216,255,0.15)'; g.fill(); g.globalAlpha = 1;
  }
  if (u.hp < u.maxHp) {
    const w = Math.max(18, s.w * 0.8);
    g.fillStyle = '#000'; g.fillRect(px - w / 2, py - s.h - 8, w, 4);
    g.fillStyle = u.team === 'player' ? '#8fd16a' : '#d6596b';
    g.fillRect(px - w / 2, py - s.h - 8, w * Math.max(0, u.hp / u.maxHp), 4);
  }
}

// Falling corpse: topples over, sinks and fades.
function drawCorpse(g, c) {
  const u = c.u, s = unitSprite(u), p = c.t / 0.7;
  const fall = Math.min(1, p * 2.4), ease = 1 - Math.pow(1 - fall, 3);
  g.save();
  g.globalAlpha = Math.max(0, 1 - p * p) * (u.def.ghostly ? 0.7 : 1);
  g.translate(Math.round(c.x), Math.round(c.y + p * 5));
  if (u.team === 'enemy') g.scale(-1, 1);
  g.rotate(-ease * (u.def.static ? 0.05 : 1.45));
  const x0 = -s.ax, y0 = -s.h;
  g.drawImage(s.dark, x0 + 1, y0); g.drawImage(s.dark, x0 - 1, y0);
  g.drawImage(p < 0.12 ? s.flash : s.img, x0, y0);
  g.restore();
}

function drawProjectiles(g, battle, t) {
  for (const p of battle.projectiles) {
    const a = p.angle || 0, ca = Math.cos(a), sa = Math.sin(a);
    if (p.magic) {
      const col = p.src && p.src.sp && p.src.sp.frost ? '#9fd8ff' : p.src && p.src.team === 'enemy' ? '#ff7a60' : '#c080e0';
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 5; i >= 1; i--) {
        g.globalAlpha = 0.14 * (6 - i); g.fillStyle = col;
        g.beginPath(); g.arc(p.x - ca * i * 5, p.y - sa * i * 5, 5 - i * 0.6, 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = 0.5 + 0.2 * Math.sin(t * 20); g.beginPath(); g.arc(p.x, p.y, 9, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(p.x, p.y, 3.5, 0, Math.PI * 2); g.fill();
      g.restore();
      continue;
    }
    const fire = p.src && p.src.sp && p.src.sp.fire;
    if (fire) {
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 4; i >= 1; i--) { g.globalAlpha = 0.18 * (5 - i); g.fillStyle = '#ff8020'; g.beginPath(); g.arc(p.x - ca * i * 4, p.y - sa * i * 4, 4, 0, Math.PI * 2); g.fill(); }
      g.restore();
    }
    g.strokeStyle = '#2a1c10'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(p.x - ca * 12, p.y - sa * 12); g.lineTo(p.x + ca * 3, p.y + sa * 3); g.stroke();
    g.strokeStyle = fire ? '#ffd890' : '#e8e0c8'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(p.x - ca * 12, p.y - sa * 12); g.lineTo(p.x + ca * 3, p.y + sa * 3); g.stroke();
    g.fillStyle = fire ? '#ffb040' : '#ffffff'; g.fillRect(p.x + ca * 3 - 2, p.y + sa * 3 - 2, 4, 4);
  }
}

// Foreground grass sways in front of the units, snow and motes drift over everything.
function drawForeground(g, t) {
  g.fillStyle = TH.tuft;
  for (const b of blades) {
    const sw = Math.sin(t * 1.6 + b.ph) * 2.5, y = FIELD_H - 2;
    g.fillRect(b.x, y - b.h * 0.5, 2, b.h * 0.5 + 2);
    g.fillRect(b.x + sw * 0.5, y - b.h * 0.8, 2, b.h * 0.3);
    g.fillRect(b.x + sw, y - b.h, 2, b.h * 0.2);
  }
}
function drawAmbient(g, t) {
  if (TH.weather === 'snow') {
    g.fillStyle = TH.mote;
    for (const f of flakes) {
      const y = (f.y + t * f.sp) % FIELD_H, x = (f.x + Math.sin(t * 0.8 + f.ph) * 14 + t * 9) % FIELD_W;
      g.globalAlpha = 0.55 + 0.3 * Math.sin(f.ph + t); g.fillRect(x, y, f.r, f.r);
    }
  } else {
    g.fillStyle = TH.mote;
    for (const m of motes) {
      const y = ((m.y - t * m.sp) % 420 + 420) % 420 + 100, x = (m.x + Math.sin(t * 0.7 + m.ph) * 20 + FIELD_W) % FIELD_W;
      const a = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 2 + m.ph));
      g.globalAlpha = a * 0.5; g.beginPath(); g.arc(x, y, m.r * 3, 0, Math.PI * 2); g.fill();
      g.globalAlpha = a; g.fillRect(x - m.r / 2, y - m.r / 2, m.r, m.r);
    }
  }
  g.globalAlpha = 1;
}

let vignette = null;
function drawVignette(g) {
  if (!vignette) {
    vignette = document.createElement('canvas'); vignette.width = FIELD_W; vignette.height = FIELD_H;
    const v = vignette.getContext('2d');
    const gr = v.createRadialGradient(FIELD_W / 2, FIELD_H / 2, FIELD_H * 0.45, FIELD_W / 2, FIELD_H / 2, FIELD_W * 0.62);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.5)');
    v.fillStyle = gr; v.fillRect(0, 0, FIELD_W, FIELD_H);
  }
  g.drawImage(vignette, 0, 0);
}

export function draw(g, battle, tier = 0) {
  const sh = battle.shake || 0;
  g.save();
  if (sh > 0) g.translate((Math.random() - 0.5) * sh * 7, (Math.random() - 0.5) * sh * 7);
  drawScene(g, battle, tier);
  g.restore();
  drawVignette(g);
}

function drawScene(g, battle, tier = 0) {
  const t = battle.time;
  TH = THEMES[theme(battle.zone.region)];
  drawBackground(g, t);
  drawNecro(g, t, tier, battle);
  const sorted = [...battle.units].sort((a, b) => a.y - b.y);
  // Spike traps lie across the lane; their spikes shoot up when sprung.
  for (const tr of battle.traps || []) {
    const k = tr.pop > 0 ? Math.sin((tr.pop / 0.35) * Math.PI) : 0;
    for (let y = LANE_TOP_DRAW; y <= LANE_BOTTOM_DRAW; y += 16) {
      g.fillStyle = '#0a0710'; g.fillRect(tr.x - 14, y, 28, 6);
      g.fillStyle = '#5a5268'; g.fillRect(tr.x - 13, y + 1, 26, 3);
      const h = 9 + 18 * k;
      g.fillStyle = k > 0.05 ? '#fff4d8' : '#d0c8b0';
      for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(tr.x + i * 5.5 - 3.5, y + 3); g.lineTo(tr.x + i * 5.5, y + 3 - h); g.lineTo(tr.x + i * 5.5 + 3.5, y + 3); g.fill(); }
    }
  }
  const rar = topRarity(battle.save);
  for (const c of battle.corpses || []) drawCorpse(g, c);
  for (const u of sorted) drawUnit(g, u, t, rar);
  drawForeground(g, t);
  drawFog(g, t);
  drawAmbient(g, t);
  drawProjectiles(g, battle, t);
  // Slashes and sparks
  for (const f of battle.fx) {
    const k = f.t / f.life;
    if (f.k === 'ring') {
      g.strokeStyle = f.color; g.lineWidth = 4 - 3 * k; g.globalAlpha = 1 - k;
      g.beginPath(); g.ellipse(f.x, f.y, 10 + k * 70, (10 + k * 70) * 0.6, 0, 0, Math.PI * 2); g.stroke();
    } else if (f.k === 'slash') {
      g.save();
      g.translate(f.x, f.y); g.scale(f.dir, 1);
      g.strokeStyle = f.color; g.lineWidth = 5 - 3 * k; g.globalAlpha = 1 - k; g.lineCap = 'round';
      g.beginPath(); g.arc(-6, 0, 18, -1.1 + k * 0.5, 1.1 + k * 0.5); g.stroke();
      g.restore();
    } else if (f.k === 'tele') {
      // Red warning on the ground: the inner disc fills as the strike gets closer.
      g.fillStyle = 'rgba(255,60,40,' + (0.1 + 0.12 * Math.sin(f.t * 18)) + ')';
      g.beginPath(); g.ellipse(f.x, f.y, f.r, f.r * 0.5, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,60,40,0.3)';
      g.beginPath(); g.ellipse(f.x, f.y, f.r * k, f.r * 0.5 * k, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#ff5040'; g.lineWidth = 2; g.globalAlpha = 0.9;
      g.beginPath(); g.ellipse(f.x, f.y, f.r, f.r * 0.5, 0, 0, Math.PI * 2); g.stroke();
    } else if (f.k === 'bolt') {
      g.strokeStyle = '#fff6c0'; g.lineWidth = 5 - 3 * k; g.globalAlpha = 1 - k; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(f.x, 0);
      for (let y = 30, i = 0; y < f.y; y += 30, i++) g.lineTo(f.x + Math.sin(f.seed + i * 12.9) * 14, y);
      g.lineTo(f.x, f.y); g.stroke();
      g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(f.x, f.y, 26 * (1 - k), 12 * (1 - k), 0, 0, Math.PI * 2); g.fill();
    } else if (f.k === 'soul') {
      const sx = f.x + Math.sin(f.t * 7) * 5, sy = f.y - f.t * 55;
      g.globalAlpha = (1 - k) * 0.35; g.fillStyle = '#b8f090'; g.beginPath(); g.arc(sx, sy, 7, 0, Math.PI * 2); g.fill();
      g.globalAlpha = (1 - k) * 0.95; g.beginPath(); g.arc(sx, sy, 3, 0, Math.PI * 2); g.fill();
      g.fillRect(sx - 1, sy + 3, 2, 5 * (1 - k));
    } else {
      g.globalAlpha = 1 - k; g.fillStyle = f.color;
      g.fillRect(f.x - 1.5, f.y - 1.5, 3, 3);
    }
  }
  g.globalAlpha = 1; g.lineCap = 'butt';
  g.font = 'bold 16px system-ui, sans-serif'; g.textAlign = 'center';
  for (const f of battle.floaters) {
    g.globalAlpha = 1 - f.t;
    g.fillStyle = '#b8f090';
    g.fillText(f.text, f.x, f.y - f.t * 24);
  }
  g.globalAlpha = 1;
  if (battle.spawnQueue.length === 0 && battle.alive('enemy') === 0 && !battle.result) {
    g.font = 'bold 28px system-ui, sans-serif'; g.fillStyle = '#e8e0f0';
    g.fillText(battle.wave >= battle.totalWaves && !battle.bossSpawned ? UNITS[battle.zone.boss].name + ' approaches!' : battle.zone.endless ? 'Wave ' + (battle.wave + 1) + ' incoming...' : 'Next wave incoming...', FIELD_W / 2, 200);
  }
}

export function drawIdle(g, t, tier = 0) {
  TH = THEMES.graveyard;
  drawBackground(g, t);
  drawNecro(g, t, tier, null);
  drawForeground(g, t);
  drawFog(g, t);
  drawAmbient(g, t);
  drawVignette(g);
}

export { FIELD_H, GATE_X };

// ---- Zone clear celebration ----
// v = { t, parts }. Draws on top of the frozen battlefield: dimming, golden rays, a banner that pops in,
// the rewards, and rising soul wisps with gold sparkles.
const easeOutBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };

export function drawVictory(g, v, dt, info) {
  v.t += dt;
  const t = v.t;
  // Particles: a gold burst when the banner lands, then green souls drifting up.
  if (!v.burst && t > 0.25) {
    v.burst = true;
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2, s = 120 + Math.random() * 280;
      v.parts.push({ x: FIELD_W / 2, y: 190, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: 0.9 + Math.random() * 0.8, t: 0, c: Math.random() < 0.5 ? '#ffd860' : '#fff4b0', g: 260 });
    }
  }
  if (t < 3) {
    for (let i = 0; i < 2; i++) v.parts.push({ x: Math.random() * FIELD_W, y: 470 + Math.random() * 40, vx: (Math.random() - 0.5) * 20, vy: -(50 + Math.random() * 70), life: 1.6 + Math.random(), t: 0, c: '#8fd16a', g: 0, sway: Math.random() * 6 });
  }
  for (const p of v.parts) {
    p.t += dt;
    p.x += p.vx * dt + (p.sway ? Math.sin(p.t * 3 + p.sway) * 0.6 : 0);
    p.y += p.vy * dt;
    p.vy += p.g * dt;
  }
  v.parts = v.parts.filter((p) => p.t < p.life);

  const fade = Math.min(1, t / 0.6);
  g.fillStyle = `rgba(10,6,20,${0.5 * fade})`;
  g.fillRect(0, 0, FIELD_W, FIELD_H);

  // Rotating golden rays behind the banner
  g.save();
  g.translate(FIELD_W / 2, 190);
  g.rotate(t * 0.35);
  g.globalAlpha = 0.16 * fade;
  g.fillStyle = '#ffe080';
  for (let i = 0; i < 12; i++) {
    g.rotate(Math.PI / 6);
    g.beginPath(); g.moveTo(0, 0); g.lineTo(-40, -520); g.lineTo(40, -520); g.closePath(); g.fill();
  }
  g.restore();
  g.globalAlpha = 1;

  for (const p of v.parts) {
    g.globalAlpha = Math.max(0, 1 - p.t / p.life);
    g.fillStyle = p.c;
    const s = p.g ? 4 : 5;
    g.fillRect(p.x - s / 2, p.y - s / 2, s, s);
  }
  g.globalAlpha = 1;

  // Banner
  const k = Math.min(1, Math.max(0, (t - 0.15) / 0.5));
  if (k > 0) {
    g.save();
    g.translate(FIELD_W / 2, 190);
    g.scale(easeOutBack(k), easeOutBack(k));
    g.textAlign = 'center';
    g.font = 'bold 78px system-ui, sans-serif';
    g.lineWidth = 10; g.strokeStyle = '#1a1030'; g.lineJoin = 'round';
    g.strokeText('ZONE CLEARED', 0, 0);
    const grad = g.createLinearGradient(0, -60, 0, 10);
    grad.addColorStop(0, '#fff4b0'); grad.addColorStop(1, '#e0a020');
    g.fillStyle = grad;
    g.fillText('ZONE CLEARED', 0, 0);
    g.font = 'bold 28px system-ui, sans-serif';
    g.lineWidth = 6;
    g.strokeText(info.zone, 0, 44);
    g.fillStyle = '#e8e0f0';
    g.fillText(info.zone, 0, 44);
    g.restore();
  }

  // Rewards, one line at a time
  const lines = [`${info.boss} is dead`, `+${info.payout} souls`];
  if (info.champ) lines.push('♛ A champion soul rises from the corpse');
  g.textAlign = 'center';
  g.font = 'bold 24px system-ui, sans-serif';
  lines.forEach((text, i) => {
    const a = Math.min(1, Math.max(0, (t - (0.9 + i * 0.5)) / 0.3));
    if (a <= 0) return;
    g.globalAlpha = a;
    const y = 270 + i * 34 - (1 - a) * 12;
    g.lineWidth = 6; g.strokeStyle = '#1a1030'; g.strokeText(text, FIELD_W / 2, y);
    g.fillStyle = i === 1 ? '#b8f090' : i === 2 ? '#ffd860' : '#e8e0f0';
    g.fillText(text, FIELD_W / 2, y);
  });
  g.globalAlpha = 1;
  if (t > 1.6) {
    g.globalAlpha = 0.5 + 0.4 * Math.sin(t * 4);
    g.font = '18px system-ui, sans-serif'; g.fillStyle = '#e8e0f0';
    g.fillText('tap to continue', FIELD_W / 2, 400);
    g.globalAlpha = 1;
  }
}
