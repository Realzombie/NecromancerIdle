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
  { id: 2, name: 'Burned Farmstead', blurb: 'The militia has taken up spears.', waves: 8, scale: 1.15, rating: 100, boss: 'captain',
    compose: (n) => [...rep('peasant', 3 + n), ...rep('militia', 2 + Math.floor(n / 2))] },
  { id: 3, name: 'Chapel Hill', blurb: 'Slingers pelt your horde from the pews.', waves: 10, scale: 1.16, rating: 200, boss: 'priest',
    compose: (n) => [...rep('peasant', 2 + Math.floor(n / 2)), ...rep('militia', 2 + Math.floor(n / 2)), ...rep('slinger', 2 + Math.floor(n / 3))] },
  { id: 4, name: 'Castle Gatehouse', blurb: 'Armoured knights hold the gate.', waves: 10, scale: 1.17, rating: 285, boss: 'commander',
    compose: (n) => [...rep('militia', 3 + Math.floor(n / 2)), ...rep('slinger', 2 + Math.floor(n / 2)), ...rep('knight', 1 + Math.floor(n / 3))] },
];

// ---- Skill tree ----
// Each unit line has: an unlock node (champion souls) and three stat nodes (souls).
// HP and damage are chains of tiers. Each tier has TIER.levels levels. Finishing a tier unlocks the next,
// more expensive one and changes how the unit looks. The save stores one total level per chain.
export const TIER = {
  levels: 5,                 // levels per tier
  count: 3,                  // tiers per chain
  per: [0.2, 0.3, 0.45],     // bonus per level in each tier
  jump: 1.6,                 // extra cost multiplier per tier
};

export const STATS = {
  hp:   { name: 'Toughness', icon: 'hp',    base: 30, growth: 1.3, max: TIER.levels * TIER.count },
  dmg:  { name: 'Ferocity',  icon: 'dmg',   base: 30, growth: 1.3, max: TIER.levels * TIER.count },
  rise: { name: 'Rise Faster', icon: 'raise', base: 25, growth: 1.5, max: 8 },
};

// Names for each tier node, and for the look you get once that tier is finished (index = finished tiers).
export const TIER_NAMES = {
  zombie:   { hp: ['Rotten Flesh', 'Stitched Flesh', 'Iron Plating'],   dmg: ['Ragged Claws', 'Sharpened Claws', 'Razor Claws'],
              hpLook: ['Rotten', 'Stitched', 'Armoured', 'Warplated'],  dmgLook: ['Ragged', 'Clawed', 'Razor-clawed', 'Bone-bladed'] },
  archer:   { hp: ['Leather Cap', 'Chain Coif', 'Plate Helm'],          dmg: ['Reinforced Bow', 'Nocked Arrows', 'Fire-Tipped Arrows'],
              hpLook: ['Bare', 'Capped', 'Coifed', 'Helmed'],           dmgLook: ['Plain bow', 'Reinforced', 'Armed', 'Fire-tipped'] },
  skeleton: { hp: ['Iron Shield', 'Steel Helm', 'Gilded Shield'],       dmg: ['Keen Blade', 'Runed Blade', 'Flaming Blade'],
              hpLook: ['Wooden', 'Iron', 'Helmed', 'Gilded'],           dmgLook: ['Plain blade', 'Keen', 'Runed', 'Flaming'] },
  hound:    { hp: ['Thick Hide', 'Spiked Collar', 'Bone Armour'],       dmg: ['Sharp Fangs', 'Rending Fangs', 'Bone Fangs'],
              hpLook: ['Mangy', 'Hardy', 'Spiked', 'Bone-armoured'],    dmgLook: ['Snarling', 'Fanged', 'Rending', 'Savage'] },
};

// Unique abilities. Each belongs to a unit and unlocks once a tier of a chain is finished.
export const SPECIALS = {
  poison: { unit: 'zombie',   name: 'Toxic Bite',   icon: 'poison', cost: 250, needs: { stat: 'dmg', tiers: 1 },
            desc: 'Bites poison enemies, dealing damage over time.' },
  burst:  { unit: 'zombie',   name: 'Spore Burst',  icon: 'burst',  cost: 400, needs: { stat: 'hp', tiers: 1 },
            desc: 'Dying zombies burst into spores that hurt nearby enemies.' },
  fire:   { unit: 'archer',   name: 'Fire Arrows',  icon: 'fire',   cost: 400, needs: { stat: 'dmg', tiers: 1 },
            desc: 'Arrows set enemies alight, burning them over time.' },
  shield: { unit: 'skeleton', name: 'Shield Wall',  icon: 'shield', cost: 300, needs: { stat: 'hp', tiers: 1 },
            desc: 'Takes 25% less damage from every hit.' },
  pack:   { unit: 'hound',    name: 'Pack Hunter',  icon: 'pack',   cost: 350, needs: { stat: 'dmg', tiers: 1 },
            desc: 'Each other living hound adds 10% damage (up to 5).' },
};
export const SPECIAL_KEYS = Object.keys(SPECIALS);

export function statBonus(lvl) {
  let b = 0;
  for (let i = 0; i < lvl; i++) b += TIER.per[Math.min(TIER.count - 1, Math.floor(i / TIER.levels))];
  return b;
}
// Number of completely finished tiers in a chain (0..TIER.count). Also the look stage.
export function tiersDone(lvl) { return Math.min(TIER.count, Math.floor(lvl / TIER.levels)); }

export function statEffect(stat, lvl, unit) {
  if (stat === 'rise') return `Cooldown ${(UNITS[unit].raise * Math.pow(TUNING.raiseCooldownFactor, lvl)).toFixed(1)}s`;
  return `${stat === 'hp' ? '+' + Math.round(statBonus(lvl) * 100) + '% HP' : '+' + Math.round(statBonus(lvl) * 100) + '% damage'}`;
}

export const PLAYER_UNITS = Object.keys(UNITS).filter((k) => UNITS[k].team === 'player');

export function owned(save, unit) {
  return UNITS[unit].unlockCost === 0 || (save.nodes['unit_' + unit] || 0) > 0;
}
export function level(save, stat, unit) { return save.nodes[stat + '_' + unit] || 0; }
export function statCost(stat, unit, lvl) {
  const tierJump = stat === 'rise' ? 1 : Math.pow(TIER.jump, Math.floor(lvl / TIER.levels));
  return Math.ceil(STATS[stat].base * UNITS[unit].costMul * Math.pow(STATS[stat].growth, lvl) * tierJump);
}

export function hasSpecial(save, key) { return (save.nodes['sp_' + key] || 0) > 0; }
export function specialReady(save, key) {
  const sp = SPECIALS[key];
  return owned(save, sp.unit) && tiersDone(level(save, sp.needs.stat, sp.unit)) >= sp.needs.tiers;
}

export function statMods(save, unit) {
  return {
    hp: 1 + statBonus(level(save, 'hp', unit)),
    dmg: 1 + statBonus(level(save, 'dmg', unit)),
    cooldown: Math.pow(TUNING.raiseCooldownFactor, level(save, 'rise', unit)),
  };
}

// What a unit looks like right now: finished HP tiers, finished damage tiers, and visual ability flags.
export function lookOf(save, unit) {
  const flags = [];
  for (const k of SPECIAL_KEYS) if (SPECIALS[k].unit === unit && hasSpecial(save, k)) flags.push(k);
  return { hs: tiersDone(level(save, 'hp', unit)), ds: tiersDone(level(save, 'dmg', unit)), flags };
}

export function totalLevels(save) {
  return Object.values(save.nodes).reduce((a, b) => a + b, 0);
}

// A rough comparable "power rating", shown against each zone's rating.
export function playerRating(save) {
  const units = PLAYER_UNITS.filter((u) => owned(save, u)).length;
  const specials = SPECIAL_KEYS.filter((k) => hasSpecial(save, k)).length;
  return Math.round(10 + totalLevels(save) * 4 + (units - 1) * 10 + specials * 15);
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
