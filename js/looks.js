// How player units look at each upgrade stage. Pure data: the renderer composes these into sprites.
// hs = finished HP tiers (0-3), ds = finished damage tiers (0-3). Stage i of `hp`/`dmg` is applied once
// that many tiers are done, on top of the earlier ones. Rects are [col, row, colour, width = 1, height = 1].
// tintable damage rects turn green when the unit has poison.

const ZOMBIE_GRID = [
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
];
const ZOMBIE_ROTTEN = [
  '..gGg...',
  '.gGGGGg.',
  '.GEGgEG.',
  '.GGRRGG.',
  '...gGg..',
  '.BB.BB..',
  'GB.BBBB.',
  '.BBB.B..',
  '.BB.DB..',
  '.G...G..',
  '.D..DD..',
];

// Classic flyers. The drake is drawn front-on (wings spread, skull on top, ribs and a tail) so it reads clearly at this size.
export const BAT_GRID = ['W..........W', 'WW...PP...WW', 'WWW.PPPP.WWW', '.WWWPEPEWWW.', '..WWPPPPWW..', '...WWPFPW...', '....W..W....'];
export const DRAKE_GRID = (() => {
  const g = Array.from({ length: 13 }, () => Array(19).fill('.'));
  const set = (x, y, c) => { g[y][x] = c; g[y][18 - x] = c; };
  const wing = [[0, 2], [0, 4], [0, 5], [1, 6], [2, 7], [4, 7], [6, 6]];            // [from x, to x] per row, mirrored
  wing.forEach(([a, b], i) => { for (let x = a; x <= b; x++) set(x, i + 1, 'W'); });
  for (const [x, y] of [[0, 1], [2, 3], [4, 5], [5, 6]]) set(x, y, 'B');            // wing bones
  g[0][7] = 'B'; g[0][11] = 'B'; g[1][8] = 'B'; g[1][10] = 'B';                       // horns
  for (let x = 7; x <= 11; x++) { g[1][x] = g[1][x] === '.' ? 'B' : g[1][x]; g[2][x] = 'B'; }
  g[2][8] = 'E'; g[2][10] = 'E';                                                      // glowing eyes
  for (let x = 8; x <= 10; x++) g[3][x] = 'B';
  g[4][8] = 'D'; g[4][9] = 'B'; g[4][10] = 'D';                                       // a short jaw
  g[5][9] = 'B';
  for (let y = 6; y <= 9; y++) for (let x = 6; x <= 12; x++) g[y][x] = (y % 2 === 0) ? 'B' : (x % 2 === 0 ? 'B' : 'D');   // ribcage
  g[10][8] = 'B'; g[10][9] = 'B'; g[10][10] = 'B'; g[11][9] = 'B'; g[12][8] = 'B'; g[12][9] = 'B'; g[12][10] = 'B';   // tail
  return g.map((r) => r.join(''));
})();

export const LOOKS = {
  bat: {
    scale: 4, pad: 0, grid: BAT_GRID,
    palette: { P: '#5a3a7a', W: '#3a2a5a', E: '#ff4040', F: '#f0f0e0' },
    hp: [
      { rects: [[4, 4, '#8a5a30', 4, 1]] },
      { rects: [[0, 0, '#ecece0'], [11, 0, '#ecece0'], [1, 2, '#ecece0'], [10, 2, '#ecece0']] },
      { rects: [[4, 0, '#d8b050', 4, 1], [4, -1, '#d8b050'], [7, -1, '#d8b050']] },
    ],
    dmg: [
      { rects: [[7, 5, '#f0f0e0']] },
      { rects: [[4, 3, '#ffb0b0'], [6, 3, '#ffb0b0']] },
      { rects: [[5, 6, '#e8283a'], [7, 6, '#e8283a'], [6, 6, '#c01828']] },
    ],
  },
  drake: {
    scale: 4, pad: 5, grid: DRAKE_GRID,
    palette: { B: '#e8e0c8', W: '#5a3a7a', E: '#9dff7a', D: '#2a1c30' },
    hp: [
      { rects: [[7, 7, '#d8b050', 5, 1], [7, 9, '#d8b050', 5, 1]] },
      { rects: [[7, 0, '#d8b050', 5, 1], [8, -1, '#d8b050'], [10, -1, '#d8b050']] },
      { rects: [[6, 6, '#8a94aa', 7, 2], [6, 6, '#c8d0e0', 7, 1]] },
    ],
    dmg: [
      { rects: [[12, 3, '#9a9aa8'], [13, 2, '#9a9aa8']] },
      { rects: [[12, 3, '#ff9a30', 2, 1], [13, 2, '#e8401a'], [12, 4, '#e8401a']] },
      { rects: [[12, 2, '#e8401a', 4, 3], [12, 3, '#ff9a30', 4, 1], [13, 3, '#ffe880', 2, 1], [16, 3, '#e8401a']] },
    ],
  },

  zombie: {
    scale: 4, pad: 3,
    gridFor: (hs) => (hs === 0 ? ZOMBIE_ROTTEN : ZOMBIE_GRID),
    palette: { G: '#7fa86a', g: '#5f8a52', E: '#e8e0a0', B: '#5a4a6a', D: '#3a2f48', R: '#a04848' },
    rottenPalette: { G: '#8a9a7a', g: '#6a7a5c', B: '#4a4050', D: '#2f2838', R: '#6a2a2a' },
    hp: [
      { palette: { B: '#6a5a7a' }, rects: [[3, 5, '#2a2030'], [4, 6, '#2a2030'], [3, 7, '#2a2030'], [6, 1, '#2a2030'], [1, 3, '#2a2030']] },
      { rects: [[2, 0, '#a8a8b8', 4], [1, 1, '#a8a8b8'], [6, 1, '#a8a8b8'], [3, 1, '#c8c8d8', 2], [2, 5, '#8a8a9a', 4, 2], [3, 5, '#c8c8d8', 2], [0, 5, '#8a8a9a'], [7, 5, '#8a8a9a']] },
      { palette: { E: '#b8ff90', B: '#7a3040' }, rects: [[2, 0, '#c8a040', 4], [3, 5, '#c8a040', 2], [2, 8, '#c8a040', 4]] },
    ],
    dmg: [
      { tintable: true, rects: [[8, 6, '#d8d0b0']] },
      { tintable: true, rects: [[8, 5, '#e0e0d0', 2], [8, 7, '#e0e0d0', 2]] },
      { tintable: true, rects: [[8, 4, '#f0f8e0', 3], [8, 6, '#f0f8e0', 3], [8, 8, '#f0f8e0', 3], [10, 4, '#b8ff90'], [10, 6, '#b8ff90'], [10, 8, '#b8ff90']] },
    ],
    flags: {
      poison: [[3, 3, '#9dff7a'], [5, 3, '#9dff7a'], [4, 4, '#b8ff7a'], [4, 5, '#9dff7a']],
    },
  },

  archer: {
    scale: 4, pad: 2,
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
    palette: { B: '#e8e0c8', b: '#b8b09a', E: '#2a2030', W: '#8a5a2a', S: '#d8d0b0' },
    hp: [
      { rects: [[2, 0, '#8a5a2a', 4], [1, 1, '#8a5a2a'], [6, 1, '#8a5a2a']] },
      { rects: [[2, 0, '#a8a8b8', 4], [1, 1, '#a8a8b8', 1, 2], [6, 1, '#a8a8b8', 1, 2]] },
      { rects: [[2, 0, '#c8c8d8', 4], [1, 1, '#c8c8d8', 6], [3, 0, '#c8a040', 2], [2, 5, '#a8a8b8', 4, 2]] },
    ],
    dmg: [
      { palette: { W: '#c8a040' }, rects: [] },
      { rects: [[6, 6, '#d8d0b0', 3]] },
      { palette: { W: '#c04020' }, rects: [[8, 6, '#ff8030'], [9, 5, '#ffc060'], [9, 6, '#ff8030']] },
    ],
    flags: { fire: [[8, 3, '#ff8030'], [8, 2, '#ffc060']] },
  },

  skeleton: {
    scale: 4, pad: 2,
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
    palette: { B: '#e8e0c8', E: '#2a2030', D: '#8a5a2a', Y: '#d8d8e8', G: '#c8a040' },
    hp: [
      { palette: { D: '#9a9aa8' }, rects: [[0, 4, '#c8c8d8', 1, 4]] },
      { palette: { D: '#aaaab8' }, rects: [[2, 0, '#a8a8b8', 4], [1, 1, '#a8a8b8'], [6, 1, '#a8a8b8']] },
      { palette: { D: '#c8a040' }, rects: [[0, 4, '#ffe080', 1, 4], [2, 0, '#c8a040', 4]] },
    ],
    dmg: [
      { palette: { Y: '#f4f4ff' }, rects: [[8, 0, '#f4f4ff']] },
      { palette: { Y: '#8ad0ff' }, rects: [[8, 0, '#8ad0ff']] },
      { palette: { Y: '#ffb040' }, rects: [[8, 0, '#ffe080'], [9, 1, '#ff6020'], [9, 3, '#ff6020']] },
    ],
    flags: {},
  },

  hound: {
    scale: 4, pad: 1,
    grid: [
      '.......GG.',
      '.GGGGGGGGE',
      'GGGGGGGGGR',
      '.gGGGGGGg.',
      '.G.G..G.G.',
      '.D.D..D.D.',
    ],
    palette: { G: '#7fa86a', g: '#5f8a52', E: '#e8e0a0', D: '#3a2f48', R: '#a04848' },
    hp: [
      { rects: [[7, 1, '#8a8a98', 1, 2]] },
      { rects: [[2, 0, '#c8c8d8'], [4, 0, '#c8c8d8'], [6, 0, '#c8c8d8']] },
      { rects: [[2, 1, '#e8e0c8', 5], [3, 2, '#e8e0c8', 3]] },
    ],
    dmg: [
      { rects: [[9, 3, '#ffffff']] },
      { rects: [[1, 5, '#e8e0c8'], [3, 5, '#e8e0c8'], [6, 5, '#e8e0c8'], [8, 5, '#e8e0c8']] },
      { palette: { E: '#ff4040', R: '#ff2020' }, rects: [[8, 3, '#ffffff'], [9, 3, '#ffffff']] },
    ],
    flags: {},
  },

  mage: {
    scale: 4, pad: 2,
    grid: [
      '..HHHH...',
      '.HHHHHH.O',
      '.HBEBEH.T',
      '.HBBBBH.T',
      '..HHHH..T',
      '.HHRRHH.T',
      'HHRRRRH.T',
      '.HRRRRH.T',
      '.HRRRRH..',
      '.HHRRHH..',
    ],
    palette: { H: '#3a2a5a', B: '#e8e0c8', E: '#8fd16a', R: '#4a3a7a', T: '#7a5a30', O: '#b070d0' },
    hp: [
      { rects: [[2, 0, '#c8a040', 4], [1, 5, '#c8a040', 1, 4], [7, 5, '#c8a040', 1, 4]] },
      { palette: { R: '#5a4a9a' }, rects: [[0, 5, '#8a7ab8', 2, 1], [6, 5, '#8a7ab8', 2, 1]] },
      { palette: { H: '#201040' }, rects: [[2, 0, '#e8e0c8', 1], [3, 0, '#c8a040', 2], [5, 0, '#e8e0c8', 1]] },
    ],
    dmg: [
      { palette: { O: '#d090f0' }, rects: [] },
      { palette: { O: '#ff80c0' }, rects: [[8, 0, '#ffd0e8']] },
      { palette: { O: '#80ffff' }, rects: [[7, 0, '#c0ffff'], [9, 1, '#80ffff'], [7, 2, '#80ffff']] },
    ],
    flags: { frost: [[7, 1, '#a0e0ff'], [9, 0, '#c0f0ff']] },
  },

  ghost: {
    scale: 4, pad: 1,
    grid: [
      '..WWWW..',
      '.WWWWWW.',
      '.WEWWEW.',
      '.WWWWWW.',
      '.WWEEWW.',
      '.WWWWWW.',
      '.WWWWWW.',
      'WWWWWWWW',
      'W.WW.WW.',
      '..W..W..',
    ],
    palette: { W: '#b8d8e8', E: '#203050' },
    hp: [
      { palette: { W: '#d0e8f4' }, rects: [] },
      { rects: [[0, 6, '#8a8a98', 1, 2], [7, 6, '#8a8a98', 1, 2], [1, 7, '#8a8a98', 6, 1]] },
      { rects: [[2, 0, '#c8a040', 4], [1, 1, '#c8a040'], [6, 1, '#c8a040']] },
    ],
    dmg: [
      { rects: [[8, 6, '#e0f0ff']] },
      { rects: [[8, 5, '#e0f0ff', 1], [8, 7, '#e0f0ff', 1]] },
      { palette: { E: '#ff5050' }, rects: [[8, 4, '#ffffff'], [8, 6, '#ffffff'], [8, 8, '#ffffff']] },
    ],
    flags: { drain: [[4, 5, '#ff8080'], [3, 5, '#ff8080']] },
  },

  deathknight: {
    scale: 4, pad: 2,
    grid: [
      '..HHHH..L',
      '.HHVVHH.L',
      '.HHEEHH.L',
      '..HHHH..L',
      '.AAAAAAAL',
      'AAAAAAAAL',
      '.AAAAAA.L',
      '.AAKKAA..',
      '.AA..AA..',
      '.DD..DD..',
    ],
    palette: { H: '#3a3a4a', V: '#101018', E: '#ff4040', A: '#5a5a72', K: '#8a8a9a', L: '#c8c8d8', D: '#2a2a38' },
    hp: [
      { rects: [[0, 4, '#8a8a9a', 1, 2], [7, 4, '#8a8a9a']] },
      { rects: [[2, 0, '#d02030', 4]] },
      { palette: { A: '#6a6a88' }, rects: [[2, 4, '#c8a040', 5], [3, 7, '#c8a040', 2], [2, 0, '#c8a040', 4]] },
    ],
    dmg: [
      { rects: [[8, 0, '#e8e8f0']] },
      { rects: [[8, 0, '#8ad0ff'], [8, 1, '#8ad0ff']] },
      { palette: { L: '#ffb040' }, rects: [[8, 0, '#ffe080'], [7, 0, '#ff6020']] },
    ],
    flags: { charge: [[0, 6, '#ff4040', 1, 2]] },
  },

  plaguebearer: {
    scale: 4, pad: 2,
    grid: [
      '..HHHH..',
      '.HHHHHH.',
      '.HSEESH.',
      '.HSSSSH.',
      '..RRRR.C',
      '.RRRRRRC',
      'RRRrrRRC',
      '.RRrrRR.',
      '.RRRRRR.',
      '.RR..RR.',
    ],
    palette: { H: '#4a5a3a', S: '#b8c890', E: '#e0ff80', R: '#5a6a3a', r: '#7a8a4a', C: '#8a8a70' },
    hp: [
      { rects: [[2, 3, '#e8e0c8', 4], [0, 6, '#e8e0c8', 1, 2], [6, 8, '#e8e0c8']] },
      { rects: [[3, 3, '#c8c0a8', 2], [4, 4, '#c8c0a8', 2]] },
      { palette: { R: '#4a3a5a', r: '#6a5a7a', H: '#3a3a2a' }, rects: [] },
    ],
    dmg: [
      { rects: [[7, 7, '#6a9a4a']] },
      { rects: [[7, 7, '#9dff7a'], [7, 8, '#6a9a4a']] },
      { rects: [[6, 7, '#b8ff7a', 2, 2], [8, 6, '#9dff7a']] },
    ],
    flags: { blight: [[0, 3, '#9dff7a'], [7, 2, '#9dff7a'], [0, 8, '#9dff7a']] },
  },

  gravepriest: {
    scale: 4, pad: 2,
    grid: [
      '..HHHH..O',
      '.HHHHHH.T',
      '.HBEBEH.T',
      '.HBBBBH.T',
      '..HHHH..T',
      '.WWRRWW.T',
      'WWRRRRWWT',
      '.WRRRRW.T',
      '.WRRRRW..',
      '.WWRRWW..',
    ],
    palette: { H: '#c8c0a8', B: '#e8e0c8', E: '#202020', W: '#d8d0b8', R: '#8a2a3a', T: '#7a5a30', O: '#e8e0a0' },
    hp: [
      { rects: [[2, 5, '#c8a040', 4, 1]] },
      { rects: [[3, 0, '#e8e0a0', 2, 1], [2, 1, '#e8e0a0', 4, 1]] },
      { rects: [[1, 0, '#ffe080'], [6, 0, '#ffe080'], [2, 0, '#ffe080', 4]] },
    ],
    dmg: [
      { palette: { O: '#ffe8a0' }, rects: [] },
      { rects: [[8, 0, '#ffffff']] },
      { palette: { O: '#a0ffff' }, rects: [[7, 0, '#c0ffff']] },
    ],
    flags: { mend: [[0, 6, '#ffe080'], [7, 6, '#ffe080']] },
  },

  gargoyle: {
    scale: 5, pad: 0,
    grid: [
      '.W.GGGG.W.',
      'WWGGGGGGWW',
      'WWGEGGEGWW',
      '.WGGRRGGW.',
      '..GGGGGG..',
      '.GGSSSSGG.',
      'GGSSSSSSGG',
      '.GSSSSSSG.',
      '..SS..SS..',
      '..DD..DD..',
    ],
    palette: { G: '#8a8a98', W: '#6a6a7a', E: '#ff8030', R: '#4a4a58', S: '#7a7a8a', D: '#3a3a48' },
    hp: [
      { rects: [[3, 6, '#5a5a68'], [5, 7, '#5a5a68'], [2, 3, '#5a5a68']] },
      { palette: { S: '#9a9aaa' }, rects: [[3, 5, '#b0b0c0', 4, 1]] },
      { palette: { G: '#3a3a4a', S: '#4a4a5a' }, rects: [[4, 6, '#ff8030', 2, 1]] },
    ],
    dmg: [
      { rects: [[1, 8, '#d8d0b0'], [8, 8, '#d8d0b0']] },
      { rects: [[0, 7, '#d8d0b0', 1, 2], [9, 7, '#d8d0b0', 1, 2]] },
      { palette: { E: '#ff4040' }, rects: [[0, 7, '#ff8030', 1, 2], [9, 7, '#ff8030', 1, 2]] },
    ],
    flags: { granite: [[4, 4, '#ffb040', 2, 1]] },
  },

  abomination: {
    scale: 5, pad: 0,
    grid: [
      '...GGGG...',
      '..GGGGGG..',
      '..GEGGEG..',
      '..GGRRGG..',
      '.GGGGGGGG.',
      'GGBBBBBBGG',
      'GGBTBBTBGG',
      'GGBBBBBBGG',
      '.GBBDDBBG.',
      '..GG..GG..',
      '..DD..DD..',
    ],
    palette: { G: '#7a9a6a', E: '#e8e0a0', R: '#a04848', B: '#6a5a7a', T: '#2a2030', D: '#3a2f48' },
    hp: [
      { rects: [[4, 5, '#2a2030'], [5, 7, '#2a2030'], [3, 1, '#2a2030'], [7, 4, '#2a2030']] },
      { rects: [[0, 4, '#d8d0b0', 2, 1], [8, 4, '#d8d0b0', 2, 1], [3, 5, '#d8d0b0', 4, 1]] },
      { palette: { B: '#8a8a9a' }, rects: [[1, 3, '#c8c8d8'], [8, 3, '#c8c8d8'], [3, 0, '#c8c8d8'], [6, 0, '#c8c8d8']] },
    ],
    dmg: [
      { rects: [[0, 8, '#6a8a5a', 2, 1], [8, 8, '#6a8a5a', 2, 1]] },
      { rects: [[0, 7, '#d8d0b0', 2, 1], [8, 7, '#d8d0b0', 2, 1]] },
      { rects: [[0, 7, '#c8c8d8', 2, 2], [8, 7, '#c8c8d8', 2, 2], [0, 6, '#ff8030'], [9, 6, '#ff8030']] },
    ],
    flags: { regen: [[4, 8, '#8fd16a', 2, 1]] },
  },
};
