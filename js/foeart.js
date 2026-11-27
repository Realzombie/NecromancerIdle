// Normal (chunky pixel) art for the newer enemies and bosses, assembled on a small grid from the same `art`
// description the HD painter uses: headgear, clothes, weapon, shield, wings, cape and beard. Facing right.
const METAL = '#b8bcc8', WOOD = '#8a5a2a', GOLD = '#d8b050', DARK = '#202020';

const mixHex = (a, b, t) => {
  const p = (c) => { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const x = p(a), y = p(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
};

// The grid is 16 x 14 with the figure standing in columns 4-11; rows 0-2 are room for hats and raised weapons.
const W = 16, H = 14;

export function foeCanvas(o, scale) {
  const cells = Array.from({ length: H }, () => Array(W).fill(null));
  const R = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (cells[y + j] && x + i >= 0 && x + i < W) cells[y + j][x + i] = c; };
  const P = (x, y, c) => R(x, y, 1, 1, c);
  const skin = o.skin || '#e0b890', cloth = o.cloth || '#8a6a4a', legs = o.legs || '#4a3a30', hc = o.hc || METAL;
  const dark = mixHex(cloth, '#000000', 0.3), big = (o.bulk || 0) >= 1;

  if (o.wings) { R(1, 5, 4, 2, o.wings); R(0, 4, 2, 2, o.wings); R(2, 7, 3, 2, o.wings); R(0, 3, 1, 1, '#ffffff'); }
  if (o.cape) { R(4, 7, 2, 5, o.cape); R(3, 9, 2, 4, o.cape); }
  // body
  if (o.robe) { R(5, 7, 6, 4, cloth); R(4, 11, 8, 3, cloth); R(4, 13, 8, 1, dark); }
  else { R(5, 7, 6, 4, cloth); R(5, 11, 2, 3, legs); R(9, 11, 2, 3, legs); R(5, 10, 6, 1, dark); }
  if (o.chestBare) { R(6, 7, 4, 2, skin); P(8, 8, '#a03030'); }
  if (o.trim) { R(7, 7, 1, o.robe ? 6 : 3, o.trim); R(5, 7, 6, 1, o.trim); }
  if (o.armor === 'plate') { R(6, 8, 4, 1, mixHex(cloth, '#ffffff', 0.3)); R(8, 8, 1, 2, dark); }
  if (o.armor === 'chain') for (let y = 8; y < 10; y++) for (let x = 6 + (y % 2); x < 10; x += 2) P(x, y, mixHex(cloth, '#ffffff', 0.35));
  if (big) { R(4, 7, 2, 2, o.armor === 'plate' ? mixHex(cloth, '#ffffff', 0.2) : dark); R(10, 7, 2, 2, o.armor === 'plate' ? mixHex(cloth, '#ffffff', 0.2) : dark); }
  P(4, 9, skin); P(11, 8, skin);       // hands
  // head
  R(5, 3, 6, 4, skin);
  P(6, 4, o.eye || DARK); P(9, 4, o.eye || DARK);
  P(7, 6, mixHex(skin, '#6a2a2a', 0.45)); P(8, 6, mixHex(skin, '#6a2a2a', 0.45));
  if (o.angry) { P(6, 3, DARK); P(9, 3, DARK); }
  if (o.beard) { R(5, 6, 6, 1, o.beard); R(6, 7, 4, 2, o.beard); }
  switch (o.head) {
    case 'straw': R(4, 2, 8, 1, '#d8b860'); R(6, 1, 4, 1, '#d8b860'); break;
    case 'cap': R(5, 2, 6, 2, hc); R(4, 3, 8, 1, mixHex(hc, '#000000', 0.25)); break;
    case 'helm': R(5, 2, 6, 2, hc); P(4, 3, hc); P(4, 4, hc); P(11, 3, hc); R(8, 3, 1, 3, hc); break;
    case 'plume': R(5, 2, 6, 2, hc); P(4, 3, hc); P(11, 3, hc); R(6, 0, 4, 2, o.plume || '#c02020'); P(5, 1, o.plume || '#c02020'); break;
    case 'greathelm': R(5, 2, 6, 5, hc); R(6, 4, 4, 1, DARK); P(6, 4, o.eye || '#ff5a3a'); P(9, 4, o.eye || '#ff5a3a'); R(7, 5, 2, 2, mixHex(hc, '#000000', 0.25)); if (o.crest) R(7, 0, 2, 2, o.crest); break;
    case 'hood': R(5, 2, 6, 1, hc); R(4, 3, 2, 4, hc); R(10, 3, 1, 1, hc); R(11, 3, 1, 4, hc); R(6, 1, 4, 1, hc); break;
    case 'mask': R(5, 2, 6, 2, hc); R(4, 3, 1, 4, hc); R(5, 5, 6, 2, hc); P(6, 4, o.eye || '#ff4a4a'); P(9, 4, o.eye || '#ff4a4a'); break;
    case 'mitre': R(6, 1, 4, 2, hc); R(7, 0, 2, 1, hc); R(5, 2, 6, 1, GOLD); P(7, 1, GOLD); break;
    case 'crown': R(5, 2, 6, 1, GOLD); P(5, 1, GOLD); P(7, 1, GOLD); P(8, 1, GOLD); P(10, 1, GOLD); P(7, 2, '#e84a4a'); break;
    case 'horns': R(5, 2, 6, 1, hc); P(4, 2, '#e8e0c8'); P(3, 1, '#e8e0c8'); P(11, 2, '#e8e0c8'); P(12, 1, '#e8e0c8'); P(3, 0, '#e8e0c8'); P(12, 0, '#e8e0c8'); break;
    case 'winged': R(5, 2, 6, 2, hc); P(4, 2, '#fff6d0'); P(3, 1, '#fff6d0'); P(11, 2, '#fff6d0'); P(12, 1, '#fff6d0'); break;
    case 'wide': R(3, 2, 10, 1, hc); R(5, 0, 6, 2, hc); R(5, 1, 6, 1, o.band || '#c03030'); break;
    case 'pointy': R(4, 2, 8, 1, hc); R(6, 1, 4, 1, hc); R(7, 0, 2, 1, hc); break;
    default: R(5, 2, 6, 1, hc); R(4, 3, 1, 3, hc); break;        // hair
  }
  // weapons: held in the front hand at column 12
  const weapon = (w, x) => {
    const blade = o.blade || METAL;
    switch (w) {
      case 'spear': R(x, 3, 1, 10, WOOD); R(x, 1, 1, 2, '#e8eef8'); break;
      case 'sword': R(x, 3, 1, 5, blade); R(x - 1, 8, 3, 1, GOLD); P(x, 9, WOOD); break;
      case 'greatsword': R(x, 1, 2, 7, blade); P(x, 0, blade); R(x - 1, 8, 4, 1, GOLD); R(x, 9, 1, 2, WOOD); break;
      case 'holysword': R(x, 1, 2, 7, '#fff0a0'); P(x, 0, '#ff8a30'); P(x + 2, 3, '#ff8a30'); R(x - 1, 8, 4, 1, GOLD); P(x, 9, WOOD); break;
      case 'halberd': R(x, 2, 1, 11, WOOD); R(x + 1, 2, 2, 3, blade); P(x, 1, blade); P(x, 0, blade); break;
      case 'axe': R(x, 3, 1, 8, WOOD); R(x + 1, 3, 2, 3, blade); break;
      case 'club': R(x, 6, 1, 5, WOOD); R(x, 2, 2, 4, '#6a4a2a'); break;
      case 'mace': R(x, 5, 1, 6, WOOD); R(x - 1, 2, 3, 3, GOLD); break;
      case 'staff': R(x, 3, 1, 10, WOOD); R(x - 1, 1, 3, 2, o.orb || '#80c0ff'); P(x, 0, '#ffffff'); break;
      case 'dagger2': R(x, 5, 1, 3, blade); P(x, 8, WOOD); R(3, 6, 1, 3, blade); break;
      case 'crossbow': R(x - 1, 8, 4, 1, WOOD); R(x + 1, 6, 1, 5, WOOD); P(x + 2, 8, blade); break;
      case 'scourge': P(x, 9, WOOD); P(x, 7, '#9a9aa8'); P(x + 1, 6, '#9a9aa8'); P(x + 2, 5, '#9a9aa8'); R(x + 2, 3, 2, 2, '#d0d0d8'); break;
      case 'firepot': R(x, 7, 3, 3, '#4a4250'); R(x, 4, 2, 3, '#ff7a20'); P(x + 1, 3, '#ffe070'); break;
      case 'cannon': R(x - 3, 7, 7, 3, '#4a4a58'); R(x - 3, 7, 7, 1, '#8a8a9a'); P(x + 3, 8, '#ffb040'); R(x - 2, 10, 3, 3, WOOD); P(x - 1, 11, DARK); break;
      default: break;
    }
  };
  if (o.shield) {
    const sc = o.sh || (o.shield === 'gold' ? GOLD : WOOD);
    if (o.shield === 'tower') { R(11, 7, 3, 6, sc); R(12, 8, 1, 4, '#f0f0f8'); }
    else { R(11, 8, 3, 3, sc); P(12, 9, '#f0f0f8'); }
  }
  if (o.weapon) weapon(o.weapon, o.shield ? 13 : 12);
  if (o.weapon2) weapon(o.weapon2, 2);

  const c = document.createElement('canvas');
  c.width = W * scale; c.height = H * scale;
  const g = c.getContext('2d');
  cells.forEach((row, y) => row.forEach((col, x) => { if (col) { g.fillStyle = col; g.fillRect(x * scale, y * scale, scale, scale); } }));
  return { img: c, ax: 8 * scale };
}
