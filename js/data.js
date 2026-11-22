// All tunable game numbers live here.
export const GATE_X = 78;          // enemies reaching this x end the attempt
export const NECRO_X = 44;         // where the necromancer stands
export const FIELD_W = 960;        // logical battlefield size
export const FIELD_H = 540;
export const LANE_TOP = 330;       // units are spread vertically between these
export const LANE_BOTTOM = 440;
export const LANE_MIN_Y = 322;     // hard clamp for unit y
export const LANE_MAX_Y = 462;

// raise = base seconds between raises of this unit (before upgrades). unlockZone = zone you must have cleared.
export const UNITS = {
  zombie:   { name: 'Zombie',           hp: 40,  dmg: 5,  atk: 1.0, speed: 40, range: 22,  radius: 9,  raise: 10, unlockZone: 0, rally: [230, 470], sprite: 'zombie',   team: 'player' },
  archer:   { name: 'Skeleton Archer',  hp: 15,  dmg: 6,  atk: 1.2, speed: 35, range: 150, radius: 8,  raise: 18, unlockZone: 1, rally: [140, 330], sprite: 'archer',   team: 'player' },
  peasant:  { name: 'Peasant',          hp: 20,  dmg: 3,  atk: 1.2, speed: 35, range: 22,  radius: 9,  drop: 4,   sprite: 'peasant',  team: 'enemy' },
  champion: { name: 'Peasant Champion', hp: 400, dmg: 12, atk: 1.0, speed: 30, range: 28,  radius: 16, drop: 100, sprite: 'champion', team: 'enemy' },
};

export const TUNING = {
  startZombies: 3,
  failPayout: 0.5,         // share of earned souls banked on a failed attempt
  raiseCooldownFactor: 0.88, // each Raise upgrade level multiplies the cooldown by this
  upgradeStatPerLevel: 0.2,
  waveScale: 1.08,         // enemy hp/dmg multiplier per wave
  wavePause: 3,
  spawnGap: 0.35,
  aggroRange: 260,         // player units only engage enemies this close; otherwise they mill about
  separation: 0.95,        // units may overlap by this fraction of their combined radius
  offlineSoulsPerMin: 2,   // x (highest zone cleared)^offlineExp
  offlineExp: 1.3,
  offlineCapHours: 8,
  offlineMinSeconds: 60,
};

export const UPGRADES = {
  raise: { name: 'Rise Faster',    base: 25, growth: 1.5, icon: 'raise', desc: 'Your dead rise sooner',
           effect: (l) => `Zombie cooldown ${(UNITS.zombie.raise * Math.pow(TUNING.raiseCooldownFactor, l)).toFixed(1)}s` },
  hp:    { name: 'Tougher Dead',   base: 30, growth: 1.4, icon: 'hp',    desc: 'Minions survive longer',
           effect: (l) => `Minion HP +${Math.round(TUNING.upgradeStatPerLevel * l * 100)}%` },
  dmg:   { name: 'Sharper Claws',  base: 30, growth: 1.4, icon: 'dmg',   desc: 'Minions hit harder',
           effect: (l) => `Minion damage +${Math.round(TUNING.upgradeStatPerLevel * l * 100)}%` },
};

export const ZONES = {
  1: { name: 'Graveyard Fields', waves: 8, waveCount: (n) => 2 + n },
};

// The necromancer's look follows total upgrade levels (gear will add to this later).
export const NECRO_TIERS = [
  { min: 0,  name: 'Grave Robber' },
  { min: 3,  name: 'Hexer' },
  { min: 7,  name: 'Bone Lord' },
  { min: 12, name: 'Lich' },
];

export function power(save) {
  return Object.values(save.upgrades).reduce((a, b) => a + b, 0);
}

export function necroTier(save) {
  const p = power(save);
  let tier = 0;
  NECRO_TIERS.forEach((t, i) => { if (p >= t.min) tier = i; });
  return tier;
}

export function upgradeCost(key, level) {
  const u = UPGRADES[key];
  return Math.ceil(u.base * Math.pow(u.growth, level));
}
