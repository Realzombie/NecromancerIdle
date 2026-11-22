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

export const LOOKS = {
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
