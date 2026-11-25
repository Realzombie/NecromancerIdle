// The necromancer in the Normal (chunky pixel) style: a hooded figure with a skull face, a robe that is ragged at the hem,
// a belt with a hanging skull, a free hand and a hand gripping the staff shaft. The staff HEAD, tome, familiar and orbiting
// skulls are drawn live in render.js so they can follow the gear he wears. Each rank (0-4) has its own palette and extra
// pieces. Facing right.

const CELL = 4, PAD = 2;

// H hood, h hood edge, D face hollow, E eyes, K bone, W pale skull, R robe, r robe fold, L trim, B belt, G gold, N hand, T staff
const GRID = [
  '.....HHHHHH.......',
  '....HHhhhhHH......',
  '...HHhhHHhhHH.....',
  '..HHhHHHHHHhHH..T.',
  '..HhHDDDDDDHhH..T.',
  '..HhDDEDDDEDhH..T.',
  '..HHDDDDDDDDHH..T.',
  '..HHDDDDDDDDHH..T.',
  '...HHDDDDDDDHH..T.',
  '...HRRRRRRRRRH..T.',
  '..RRrRRRRRRRRrR.T.',
  '.RRrRRRLLRRRrRRRT.',
  '.RRrRRRLLRRRrRNNT.',
  '.RRrRRRLLRRRrRNNT.',
  '.NRrBBBGGBBBRrRRT.',
  '.NRrRRRKKRRRRrRRT.',
  '..RrRRRLLRRRRrRRT.',
  '..RrRRRLLRRRRrRRT.',
  '.RRrRRRLLRRRRrRRT.',
  '.RRrRRRLLRRRRrRRT.',
  'RRRrRRRLLRRRRrRRT.',
  'RRRrRRRLLRRRRrRRT.',
  'RrRrRRRLLRRRRrRrT.',
  'RRrRrRRRRRRrRRrRT.',
  'R.RRR.RRRRR.RRR.T.',
  '..R.R...R..R.R..T.',
];

// per rank: palette and extra rects [x, y, letter, w?, h?]
const RANKS = [
  { // Grave Robber: a patched grey-brown cloak and a rope belt
    pal: { H: '#4a4048', h: '#625a62', D: '#120c14', E: '#d8c870', K: '#cfc6a8', W: '#e0d8c0', R: '#3c343c', r: '#4e464e', L: '#4a4048', B: '#7a5a30', G: '#a89050', N: '#cfc6a8', T: '#6a4a28' },
    over: [[4, 12, 'r', 2, 2], [10, 17, 'r', 2, 2]],
  },
  { // Hexer: purple robes with a light collar
    pal: { H: '#3a2a5a', h: '#6a56a0', D: '#0c0818', E: '#8fe66a', K: '#e0d8c0', W: '#e8e0d0', R: '#2e2250', r: '#4a3a7a', L: '#6a56a0', B: '#5a3a20', G: '#d8b050', N: '#d8d0b8', T: '#6a4a28' },
    over: [[4, 9, 'h', 9, 1], [3, 10, 'h', 2, 1], [11, 10, 'h', 2, 1]],
  },
  { // Bone Lord: bone pauldrons and collar, a spiked bone circlet on the brow, gold trim
    pal: { H: '#2a1a4a', h: '#7a5ab8', D: '#0a0614', E: '#b8f090', K: '#e8e0c8', W: '#f0e8d8', R: '#241a3c', r: '#5a3a8a', L: '#c8a040', B: '#4a2a18', G: '#e8c050', N: '#e0d8c0', T: '#8a6a30' },
    over: [[4, 9, 'K', 9, 1], [1, 9, 'K', 3, 2], [13, 9, 'K', 3, 2], [1, 11, 'K', 2, 1], [14, 11, 'K', 1, 1], [6, 3, 'K', 5, 1], [6, 2, 'K'], [10, 2, 'K']],     // the bone circlet sits on the brow, a row clear of the eyes
  },
  { // Lich: black robes with green trim and a gold circlet (the face always stays hidden in the hood)
    pal: { H: '#101014', h: '#2a2a38', D: '#04040a', E: '#b8f090', K: '#e8e8d8', W: '#f0f0e0', R: '#0c0c12', r: '#1a2a20', L: '#4aa860', B: '#101010', G: '#d8c060', N: '#e8e8d8', T: '#d8d0b0' },
    over: [[6, 3, 'G', 5, 1], [8, 3, 'E'], [4, 9, 'L', 9, 1], [1, 9, 'h', 2, 2], [14, 9, 'h', 2, 2]],     // the gold circlet is worn on the brow, in the shade of the hood
  },
  { // Crimson (epic robes): red and gold with curved bone horns
    pal: { H: '#4a1020', h: '#9a2c44', D: '#0c0408', E: '#ffd060', K: '#e8dcc0', W: '#f0e4d0', R: '#3a0c18', r: '#7a2038', L: '#e8b848', B: '#2a0c10', G: '#ffd060', N: '#e0d0b8', T: '#8a5a30' },
    over: [[3, 1, 'K'], [2, 0, 'K'], [1, 0, 'K'], [14, 1, 'K'], [15, 0, 'K'], [16, 0, 'K'], [4, 9, 'G', 9, 1], [1, 9, 'G', 2, 1], [13, 9, 'G', 3, 1]],
  },
];

export function necroGridCanvas(rank) {
  const R = RANKS[rank] || RANKS[0], w = GRID[0].length, h = GRID.length;
  const cells = GRID.map((row) => [...row]);
  for (const [x, y, c, cw = 1, ch = 1] of R.over) for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) if (cells[y + j] && cells[y + j][x + i] !== undefined) cells[y + j][x + i] = c;
  const body = document.createElement('canvas');
  body.width = w * CELL + PAD * 2; body.height = h * CELL + PAD * 2;
  const bg = body.getContext('2d');
  cells.forEach((row, y) => row.forEach((ch, x) => {
    if (ch === '.') return;
    bg.fillStyle = R.pal[ch]; bg.fillRect(PAD + x * CELL, PAD + y * CELL, CELL, CELL);
  }));
  // a soft light edge down the left of the robe and a darker lower edge give it some volume
  bg.globalAlpha = 0.18; bg.fillStyle = '#ffffff';
  cells.forEach((row, y) => row.forEach((ch, x) => { if ('RrHh'.includes(ch) && (x === 0 || cells[y][x - 1] === '.')) bg.fillRect(PAD + x * CELL, PAD + y * CELL, 1, CELL); }));
  bg.globalAlpha = 1;
  // dark outline
  const sil = document.createElement('canvas'); sil.width = body.width; sil.height = body.height;
  const sg = sil.getContext('2d'); sg.drawImage(body, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#0a0710'; sg.fillRect(0, 0, sil.width, sil.height);
  const out = document.createElement('canvas'); out.width = body.width; out.height = body.height;
  const og = out.getContext('2d');
  for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-2, -2], [2, -2], [-2, 2], [2, 2]]) og.drawImage(sil, dx, dy);
  og.drawImage(body, 0, 0);
  out.orb = [PAD + 16 * CELL + CELL / 2, PAD + 3 * CELL - 2];     // top of the staff shaft: the staff head is drawn here
  out.hand = [PAD + 15.5 * CELL, PAD + 12.5 * CELL];
  return out;
}
