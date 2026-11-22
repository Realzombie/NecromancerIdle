// All tunable game numbers live here.
export const GATE_X = 78;          // enemies reaching this x end the attempt
export const NECRO_X = 44;         // where the necromancer stands
export const FIELD_W = 960;        // logical battlefield size
export const FIELD_H = 540;
export const LANE_TOP = 330;       // units are spread vertically between these
export const LANE_BOTTOM = 440;
export const LANE_MIN_Y = 322;     // hard clamp for unit y
export const LANE_MAX_Y = 462;

// Player units. raise = base seconds between raises. rally = x range where they gather when idle.
// unlockCost = champion souls to unlock in the skill tree (0 = owned from the start).
export const UNITS = {
  zombie:   { name: 'Zombie',          hp: 40, dmg: 5, atk: 1.0, speed: 40, range: 22,  radius: 10, raise: 12, rally: [400, 600], sprite: 'zombie',   team: 'player', unlockCost: 0, costMul: 1,   blurb: 'Slow, sturdy front line.' },
  archer:   { name: 'Skeleton Archer', hp: 15, dmg: 6, atk: 1.2, speed: 35, range: 150, radius: 9,  raise: 18, rally: [260, 400], sprite: 'archer',   team: 'player', unlockCost: 1, costMul: 1.6, blurb: 'Shoots from behind the line.' },
  skeleton: { name: 'Skeleton Warrior',hp: 60, dmg: 7, atk: 1.1, speed: 38, range: 24,  radius: 10, raise: 14, rally: [380, 570], sprite: 'skeleton', team: 'player', unlockCost: 1, costMul: 2,   blurb: 'Sword and shield. Tough and steady.' },
  hound:    { name: 'Zombie Hound',    hp: 25, dmg: 4, atk: 0.6, speed: 85, range: 20,  radius: 8,  raise: 9,  rally: [420, 640], sprite: 'hound',    team: 'player', unlockCost: 2, costMul: 2.5, blurb: 'Fast and fierce, but fragile.' },

  // Enemies. drop = souls banked per kill.
  peasant:  { name: 'Peasant',            hp: 20,  dmg: 3,  atk: 1.2, speed: 35, range: 22,  radius: 10, drop: 3,   sprite: 'peasant',  team: 'enemy' },
  militia:  { name: 'Militia Spearman',   hp: 38,  dmg: 5,  atk: 1.1, speed: 36, range: 28,  radius: 10, drop: 6,   sprite: 'militia',  team: 'enemy' },
  slinger:  { name: 'Slinger',            hp: 16,  dmg: 5,  atk: 1.4, speed: 32, range: 150, radius: 9,  drop: 6,   sprite: 'slinger',  team: 'enemy' },
  knight:   { name: 'Knight',             hp: 110, dmg: 10, atk: 1.2, speed: 30, range: 26,  radius: 12, drop: 14,  sprite: 'knight',   team: 'enemy' },
  champion: { name: 'Peasant Champion',   hp: 400, dmg: 12, atk: 1.0, speed: 30, range: 30,  radius: 16, drop: 100, sprite: 'champion', team: 'enemy', boss: true },
  captain:  { name: 'Militia Captain',    hp: 800, dmg: 16, atk: 1.0, speed: 32, range: 32,  radius: 16, drop: 160, sprite: 'captain',  team: 'enemy', boss: true },
  priest:   { name: 'Mad Priest',         hp: 1400,dmg: 20, atk: 1.1, speed: 28, range: 32,  radius: 16, drop: 260, sprite: 'priest',   team: 'enemy', boss: true },
  commander:{ name: 'Knight Commander',   hp: 2600,dmg: 30, atk: 1.1, speed: 28, range: 34,  radius: 18, drop: 420, sprite: 'commander',team: 'enemy', boss: true },
};

export const TUNING = {
  startZombies: 3,
  failPayout: 0.5,           // share of earned souls banked on a failed attempt
  raiseCooldownFactor: 0.88, // each Rise level multiplies that unit's cooldown by this
  statPerLevel: 0.2,         // HP and damage bonus per level
  wavePause: 3,
  spawnGap: 0.35,
  aggroRange: 260,           // player units only engage enemies this close; otherwise they mill about
  separation: 1.25,          // personal space as a fraction of combined radius (below 1 they overlap)
  repeatSoulChance: 0.25,    // chance of a champion soul from a boss you have already beaten
  offlineSoulsPerMin: 2,     // x (highest zone cleared)^offlineExp
  offlineExp: 1.3,
  offlineCapHours: 8,
  offlineMinSeconds: 60,
};

// The first region. compose(n) lists the enemy types in wave n.
const rep = (type, n) => Array(Math.max(0, n)).fill(type);
export const ZONES = [
  { id: 1, name: 'Graveyard Fields', blurb: 'Peasants stumble in from the village.', waves: 8, scale: 1.09, rating: 35, boss: 'champion',
    compose: (n) => rep('peasant', 2 + n) },
  { id: 2, name: 'Burned Farmstead', blurb: 'The militia has taken up spears.', waves: 8, scale: 1.15, rating: 95, boss: 'captain',
    compose: (n) => [...rep('peasant', 3 + n), ...rep('militia', 2 + Math.floor(n / 2))] },
  { id: 3, name: 'Chapel Hill', blurb: 'Slingers pelt your horde from the pews.', waves: 10, scale: 1.16, rating: 180, boss: 'priest',
    compose: (n) => [...rep('peasant', 2 + Math.floor(n / 2)), ...rep('militia', 2 + Math.floor(n / 2)), ...rep('slinger', 2 + Math.floor(n / 3))] },
  { id: 4, name: 'Castle Gatehouse', blurb: 'Armoured knights hold the gate.', waves: 10, scale: 1.17, rating: 245, boss: 'commander',
    compose: (n) => [...rep('militia', 3 + Math.floor(n / 2)), ...rep('slinger', 2 + Math.floor(n / 2)), ...rep('knight', 1 + Math.floor(n / 3))] },
];

// ---- Skill tree ----
// Each unit line has: an unlock node (champion souls) and three stat nodes (souls).
export const STATS = {
  hp:   { name: 'Tougher',     icon: 'hp',    base: 30, growth: 1.4, max: 10, effect: (l) => `+${Math.round(TUNING.statPerLevel * l * 100)}% HP` },
  dmg:  { name: 'Sharper',     icon: 'dmg',   base: 30, growth: 1.4, max: 10, effect: (l) => `+${Math.round(TUNING.statPerLevel * l * 100)}% damage` },
  rise: { name: 'Rise Faster', icon: 'raise', base: 25, growth: 1.5, max: 8,  effect: (l, unit) => `Cooldown ${(UNITS[unit].raise * Math.pow(TUNING.raiseCooldownFactor, l)).toFixed(1)}s` },
};

export const PLAYER_UNITS = Object.keys(UNITS).filter((k) => UNITS[k].team === 'player');

export function owned(save, unit) {
  return UNITS[unit].unlockCost === 0 || (save.nodes['unit_' + unit] || 0) > 0;
}
export function level(save, stat, unit) { return save.nodes[stat + '_' + unit] || 0; }
export function statCost(stat, unit, lvl) {
  return Math.ceil(STATS[stat].base * UNITS[unit].costMul * Math.pow(STATS[stat].growth, lvl));
}

export function statMods(save, unit) {
  return {
    hp: 1 + TUNING.statPerLevel * level(save, 'hp', unit),
    dmg: 1 + TUNING.statPerLevel * level(save, 'dmg', unit),
    cooldown: Math.pow(TUNING.raiseCooldownFactor, level(save, 'rise', unit)),
  };
}

export function totalLevels(save) {
  return Object.values(save.nodes).reduce((a, b) => a + b, 0);
}

// A rough comparable "power rating", shown against each zone's rating.
export function playerRating(save) {
  const units = PLAYER_UNITS.filter((u) => owned(save, u)).length;
  return Math.round(10 + totalLevels(save) * 4 + (units - 1) * 10);
}

// The necromancer's look follows total levels (gear will add to this later).
export const NECRO_TIERS = [
  { min: 0,  name: 'Grave Robber' },
  { min: 4,  name: 'Hexer' },
  { min: 10, name: 'Bone Lord' },
  { min: 20, name: 'Lich' },
];

export function necroTier(save) {
  const p = totalLevels(save);
  let tier = 0;
  NECRO_TIERS.forEach((t, i) => { if (p >= t.min) tier = i; });
  return tier;
}

export function zoneById(id) { return ZONES.find((z) => z.id === id); }
