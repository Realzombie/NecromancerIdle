// All tunable game numbers live here.
export const GATE_X = 56;          // enemies reaching this x end the attempt
export const FIELD_W = 960;        // logical battlefield size
export const FIELD_H = 540;
export const LANE_TOP = 330;       // units are spread vertically between these
export const LANE_BOTTOM = 440;

export const UNITS = {
  zombie:   { name: 'Zombie',           hp: 40,  dmg: 5,  atk: 1.0, speed: 40, range: 16,  cost: 10, growth: 1.12, sprite: 'zombie',   team: 'player' },
  archer:   { name: 'Skeleton Archer',  hp: 15,  dmg: 6,  atk: 1.2, speed: 35, range: 150, cost: 50, growth: 1.18, sprite: 'archer',   team: 'player' },
  peasant:  { name: 'Peasant',          hp: 20,  dmg: 3,  atk: 1.2, speed: 35, range: 16,  drop: 4,   sprite: 'peasant',  team: 'enemy' },
  champion: { name: 'Peasant Champion', hp: 400, dmg: 12, atk: 1.0, speed: 30, range: 22,  drop: 100, sprite: 'champion', team: 'enemy' },
};

export const TUNING = {
  startZombies: 3,
  runStartSouls: 30,       // souls available to raise units at the start of an attempt
  failPayout: 0.5,         // share of earned souls banked on a failed attempt
  raiseInterval: 4,        // seconds between gate raises at level 0
  raiseSpeedPerLevel: 0.2, // interval = base / (1 + this * level)
  upgradeStatPerLevel: 0.2,
  waveScale: 1.08,         // enemy hp/dmg multiplier per wave
  wavePause: 3,
  spawnGap: 0.35,
};

export const UPGRADES = {
  raise: { name: 'Raise Speed',   base: 25, growth: 1.5, desc: 'Gate raises minions faster' },
  hp:    { name: 'Tougher Dead',  base: 30, growth: 1.4, desc: 'Minions +20% HP per level' },
  dmg:   { name: 'Sharper Claws', base: 30, growth: 1.4, desc: 'Minions +20% damage per level' },
};

export const ZONES = {
  1: { name: 'Graveyard Fields', waves: 8, waveCount: (n) => 2 + n },
};

export function upgradeCost(key, level) {
  const u = UPGRADES[key];
  return Math.ceil(u.base * Math.pow(u.growth, level));
}
