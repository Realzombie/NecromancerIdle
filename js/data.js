// All tunable game numbers live here.
import { gearMods, gearScore } from './gear.js';
export const GATE_X = 78;          // enemies reaching this x end the attempt
export const NECRO_X = 44;         // where the necromancer stands
// Logical battlefield size. Tall phones (about 20:9) get a wider field so the game fills the screen.
const _q = typeof location !== 'undefined' ? Number(new URLSearchParams(location.search).get('wide')) : 0;   // ?wide=2.22 previews a tall phone
const _wide = _q > 1 ? _q : typeof screen !== 'undefined' && typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches ? Math.max(screen.width, screen.height) / Math.min(screen.width, screen.height) : 16 / 9;
export const FIELD_W = Math.round(Math.max(960, Math.min(1280, 540 * _wide)) / 8) * 8;
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
  hound:    { name: 'Zombie Hound',    hp: 25, dmg: 4, atk: 0.6, speed: 85, range: 20,  radius: 8,  raise: 9,  rally: [420, 640], sprite: 'hound',    team: 'player', unlockCost: 1, costMul: 2.5, blurb: 'Fast and fierce, but fragile.' },
  mage:     { name: 'Bone Mage',       hp: 14, dmg: 11, atk: 1.8, speed: 32, range: 170, radius: 9,  raise: 24, rally: [200, 340], sprite: 'mage',     team: 'player', unlockCost: 2, costMul: 2.2, splash: 45, blurb: 'Hurls bolts that burst on impact.' },
  ghost:    { name: 'Ghost',           hp: 42, dmg: 8, atk: 0.9, speed: 60, range: 22,  radius: 9,  raise: 16, rally: [420, 640], sprite: 'ghost',    team: 'player', unlockCost: 2, costMul: 2.4, dodge: 0.3, ghostly: true, blurb: 'Drifts through blows. Dodges 30% of hits.' },
  abomination: { name: 'Abomination',  hp: 260, dmg: 18, atk: 1.6, speed: 22, range: 30,  radius: 17, raise: 40, rally: [380, 520], sprite: 'abomination', team: 'player', unlockCost: 2, costMul: 3.5, heavy: true, cleave: 38, blurb: 'A towering stitched horror that hits everything near it.' },
  deathknight:  { name: 'Death Knight',   hp: 110, dmg: 14, atk: 1.1, speed: 70, range: 26,  radius: 12, raise: 28, rally: [380, 560], sprite: 'deathknight', team: 'player', unlockCost: 3, costMul: 3,   blurb: 'A fast armoured rider that crashes into the enemy line.' },
  plaguebearer: { name: 'Plague Bearer',  hp: 70,  dmg: 3,  atk: 1.2, speed: 30, range: 24,  radius: 11, raise: 26, rally: [400, 580], sprite: 'plaguebearer', team: 'player', unlockCost: 3, costMul: 2.6, aura: { r: 62, dps: 1.9 }, blurb: 'Wreathed in a toxic cloud that poisons every enemy nearby.' },
  gravepriest:  { name: 'Grave Priest',   hp: 45,  dmg: 3,  atk: 1.4, speed: 32, range: 120, radius: 9,  raise: 30, rally: [220, 360], sprite: 'gravepriest', team: 'player', unlockCost: 3, costMul: 2.4, heal: { amt: 10, every: 3, range: 170 }, blurb: 'Mends the wounded among your horde.' },
  gargoyle:     { name: 'Gargoyle',       hp: 150, dmg: 9,  atk: 1.3, speed: 34, range: 24,  radius: 12, raise: 34, rally: [420, 600], sprite: 'gargoyle', team: 'player', unlockCost: 4, costMul: 3.2, armor: 0.2, blurb: 'Living stone. Shrugs off a fifth of every blow.' },


  // Enemies. drop = souls banked per kill.
  // The War Banner is a field hazard: a standing banner that buffs the enemies around it (see hazardsFor).
  warbanner:{ name: 'War Banner', hp: 150, dmg: 0, atk: 9, speed: 0, range: 0, radius: 10, drop: 0, sprite: 'banner', team: 'enemy', static: true, wall: true, banner: { r: 210, dmg: 1.35 } },
  peasant:  { name: 'Peasant',            hp: 20,  dmg: 3,  atk: 1.2, speed: 35, range: 22,  radius: 10, drop: 3,   sprite: 'peasant',  team: 'enemy' },
  militia:  { name: 'Militia Spearman',   hp: 38,  dmg: 5,  atk: 1.1, speed: 36, range: 28,  radius: 10, drop: 6,   sprite: 'militia',  team: 'enemy' },
  slinger:  { name: 'Slinger',            hp: 16,  dmg: 5,  atk: 1.4, speed: 32, range: 150, radius: 9,  drop: 6,   sprite: 'slinger',  team: 'enemy' },
  knight:   { name: 'Knight',             hp: 110, dmg: 10, atk: 1.2, speed: 30, range: 26,  radius: 12, drop: 14,  sprite: 'knight',   team: 'enemy' },
  champion: { name: 'Peasant Champion',   hp: 400, dmg: 12, atk: 1.0, speed: 30, range: 30,  radius: 16, drop: 100, sprite: 'champion', team: 'enemy', boss: true, abil: ['slam'] },
  captain:  { name: 'Militia Captain',    hp: 800, dmg: 16, atk: 1.0, speed: 32, range: 32,  radius: 16, drop: 160, sprite: 'captain',  team: 'enemy', boss: true, abil: ['leap'], summon: { type: 'militia', n: 2, every: 16 } },
  priest:   { name: 'Mad Priest',         hp: 1400,dmg: 20, atk: 1.1, speed: 28, range: 32,  radius: 16, drop: 260, sprite: 'priest',   team: 'enemy', boss: true, abil: ['smite'], summon: { type: 'peasant', n: 3, every: 14 } },
  commander:{ name: 'Knight Commander',   hp: 2600,dmg: 30, atk: 1.1, speed: 28, range: 34,  radius: 18, drop: 420, sprite: 'commander',team: 'enemy', boss: true, abil: ['guard','slam'] },

  // Region 2: the Crusader Reach.
  crusader: { name: 'Crusader',           hp: 150, dmg: 12, atk: 1.2, speed: 30, range: 28,  radius: 12, drop: 22,  sprite: 'crusader', team: 'enemy' },
  crossbow: { name: 'Crossbowman',        hp: 45,  dmg: 15, atk: 1.8, speed: 30, range: 190, radius: 9,  drop: 20,  sprite: 'crossbow', team: 'enemy' },
  cleric:   { name: 'Cleric',             hp: 70,  dmg: 4,  atk: 2.0, speed: 30, range: 140, radius: 9,  drop: 24,  sprite: 'cleric',   team: 'enemy', heal: { amt: 18, every: 2.2, range: 160 } },
  paladin:  { name: 'Paladin',            hp: 420, dmg: 24, atk: 1.4, speed: 26, range: 30,  radius: 14, drop: 55,  sprite: 'paladin',  team: 'enemy' },
  inquisitor:{ name: 'The Inquisitor',    hp: 3200, dmg: 40, atk: 1.1, speed: 28, range: 34, radius: 17, drop: 700,  sprite: 'inquisitor', team: 'enemy', boss: true, abil: ['curse'], summon: { type: 'crusader', n: 1, every: 18 } },
  templar:  { name: 'Templar Lord',       hp: 5000, dmg: 55, atk: 1.2, speed: 26, range: 36, radius: 18, drop: 1000, sprite: 'templar',  team: 'enemy', boss: true, abil: ['slam','guard'], summon: { type: 'crusader', n: 2, every: 18 } },
  archbishop:{ name: 'The Archbishop',    hp: 6500, dmg: 65, atk: 1.3, speed: 26, range: 150, radius: 17, drop: 1500, sprite: 'archbishop', team: 'enemy', boss: true, abil: ['smite','curse'], heal: { amt: 120, every: 4, range: 220 } },
  // Region 3: the Heroes' Reach.
  berserker:{ name: 'Berserker',          hp: 260, dmg: 28, atk: 0.8, speed: 52, range: 26,  radius: 11, drop: 70,  sprite: 'berserker', team: 'enemy' },
  archmage: { name: 'Archmage',           hp: 120, dmg: 36, atk: 2.0, speed: 30, range: 190, radius: 9,  drop: 80,  sprite: 'archmage', team: 'enemy', splash: 55 },
  assassin: { name: 'Assassin',           hp: 150, dmg: 40, atk: 0.7, speed: 70, range: 22,  radius: 9,  drop: 75,  sprite: 'assassin', team: 'enemy', dodge: 0.35 },
  sentinel: { name: 'Sentinel',           hp: 900, dmg: 48, atk: 1.5, speed: 24, range: 32,  radius: 15, drop: 160, sprite: 'sentinel', team: 'enemy' },
  herodawn: { name: 'Hero of the Dawn',   hp: 14000, dmg: 110, atk: 1.1, speed: 32, range: 38, radius: 18, drop: 4000, sprite: 'herodawn', team: 'enemy', boss: true, abil: ['leap','slam'] },
  supreme:  { name: 'Archmage Supreme',   hp: 10000, dmg: 120, atk: 2.0, speed: 26, range: 200, radius: 17, drop: 5200, sprite: 'supreme', team: 'enemy', boss: true, abil: ['volley','smite'], splash: 70 },
  slayer:   { name: 'The Dragonslayer',   hp: 20000, dmg: 160, atk: 1.2, speed: 28, range: 40, radius: 20, drop: 7000, sprite: 'slayer', team: 'enemy', boss: true, abil: ['slam','leap','volley'] },
  herokind: { name: 'The Hero King',      hp: 40000, dmg: 200, atk: 1.2, speed: 28, range: 42, radius: 21, drop: 10000, sprite: 'herokind', team: 'enemy', boss: true, abil: ['smite','guard'], summon: { type: 'berserker', n: 1, every: 16 }, heal: { amt: 300, every: 5, range: 240 } },
  avenger:  { name: 'The Holy Avenger',   hp: 9500, dmg: 90, atk: 1.2, speed: 28, range: 38, radius: 19, drop: 2400, sprite: 'avenger',  team: 'enemy', boss: true, abil: ['leap','guard'] },
};

// Boss abilities. Each boss lists some in its `abil`. Slam, leap and smite show a red warning first so they can be seen coming.
export const BOSS_ABILITIES = {
  slam:   { name: 'Ground Slam',  every: 14, windup: 0.9, radius: 72, dmgMul: 1.3 },
  leap:   { name: 'Leap',         every: 17, windup: 0.6, radius: 58, dmgMul: 1.1 },
  smite:  { name: 'Smite',        every: 13, windup: 1.0, targets: 2, radius: 34, dmgMul: 2.2 },
  volley: { name: 'Volley',       every: 12, count: 6, dmgMul: 0.7 },
  guard:  { name: 'Guard Stance', every: 22, duration: 3.5, reduce: 0.7 },
  curse:  { name: 'Binding Chains', every: 19, duration: 4 },
};
// Everything a boss can do, for the zone map.
export function bossAbilityNames(def) {
  const out = ['Enrages'];
  if (def.summon) out.push('Reinforcements');
  if (def.heal) out.push('Heals allies');
  if (def.splash) out.push('Splash bolts');
  for (const k of def.abil || []) out.push(BOSS_ABILITIES[k].name);
  return out;
}

export const TUNING = {
  startZombies: 4,
  failPayout: 0.5,           // share of earned souls banked on a failed attempt
  raiseCooldownFactor: 0.88, // each Rise level multiplies that unit's cooldown by this
  statPerLevel: 0.2,         // HP and damage bonus per level
  wavePause: 3,
  spawnGap: 0.35,
  aggroRange: 800,           // once enemies are on the field, every unit within this range charges them; with none, the horde mills about mid-field
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
  { id: 1, region: 1, name: 'Graveyard Fields', blurb: 'Peasants stumble in from the village.', waves: 8, scale: 1.06, rating: 38, boss: 'champion',
    compose: (n) => rep('peasant', 2 + n) },
  { id: 2, region: 1, name: 'Burned Farmstead', blurb: 'The militia has taken up spears.', waves: 8, scale: 1.13, rating: 105, boss: 'captain',
    compose: (n) => [...rep('peasant', 3 + n), ...rep('militia', 2 + Math.floor(n / 2))] },
  { id: 3, region: 1, name: 'Chapel Hill', blurb: 'Slingers pelt your horde from the pews.', waves: 10, scale: 1.15, rating: 200, boss: 'priest',
    compose: (n) => [...rep('peasant', 2 + Math.floor(n / 2)), ...rep('militia', 2 + Math.floor(n / 2)), ...rep('slinger', 2 + Math.floor(n / 3))] },
  { id: 4, region: 1, name: 'Castle Gatehouse', blurb: 'Armoured knights hold the gate.', waves: 10, scale: 1.15, rating: 340, boss: 'commander',
    compose: (n) => [...rep('militia', 3 + Math.floor(n / 2)), ...rep('slinger', 2 + Math.floor(n / 2)), ...rep('knight', 1 + Math.floor(n / 3))] },

  // Region 2
  { id: 5, region: 2, name: 'Pilgrim Road', blurb: 'Crusaders and crossbowmen march to purge you.', waves: 8, scale: 1.26, rating: 370, boss: 'inquisitor',
    compose: (n) => [...rep('militia', 3 + Math.floor(n / 2)), ...rep('crusader', 1 + Math.floor(n / 3)), ...rep('crossbow', 1 + Math.floor(n / 3))] },
  { id: 6, region: 2, name: 'Cathedral Steps', blurb: 'Clerics mend the wounded faster than you can cut them down.', waves: 8, scale: 1.33, rating: 470, boss: 'templar',
    compose: (n) => [...rep('crusader', 2 + Math.floor(n / 3)), ...rep('crossbow', 1 + Math.floor(n / 3)), ...rep('cleric', 1 + Math.floor(n / 4)), ...rep('militia', 2)] },
  { id: 7, region: 2, name: 'Hallowed Ground', blurb: 'Paladins in blessed plate hold the line.', waves: 10, scale: 1.25, rating: 580, boss: 'archbishop',
    compose: (n) => [...rep('crusader', 2 + Math.floor(n / 3)), ...rep('crossbow', 2 + Math.floor(n / 4)), ...rep('cleric', 1 + Math.floor(n / 4)), ...rep('paladin', Math.floor(n / 5))] },
  { id: 8, region: 2, name: 'The Holy Citadel', blurb: 'The last bastion of the faithful.', waves: 10, scale: 1.3, rating: 770, boss: 'avenger',
    compose: (n) => [...rep('crusader', 3 + Math.floor(n / 3)), ...rep('crossbow', 2 + Math.floor(n / 3)), ...rep('cleric', 2 + Math.floor(n / 4)), ...rep('paladin', 1 + Math.floor(n / 3))] },

  // Region 3
  { id: 9, region: 3, name: 'Frostbitten Pass', blurb: 'Berserkers charge out of the blizzard.', waves: 7, scale: 1.6, rating: 810, boss: 'herodawn',
    compose: (n) => [...rep('crusader', 2 + Math.floor(n / 3)), ...rep('berserker', 1 + Math.floor(n / 3)), ...rep('crossbow', 2), ...rep('cleric', 1)] },
  { id: 10, region: 3, name: "Wizard's Tower", blurb: 'Archmages rain ruin from the battlements.', waves: 7, scale: 1.55, rating: 1000, boss: 'supreme',
    compose: (n) => [...rep('berserker', 1 + Math.floor(n / 3)), ...rep('archmage', 1 + Math.floor(n / 3)), ...rep('crusader', 2), ...rep('cleric', 1 + Math.floor(n / 4))] },
  { id: 11, region: 3, name: "Dragon's Rest", blurb: 'Assassins slip through the dark, and sentinels bar the way.', waves: 8, scale: 1.45, rating: 1100, boss: 'slayer',
    compose: (n) => [...rep('assassin', 1 + Math.floor(n / 3)), ...rep('sentinel', Math.floor(n / 5)), ...rep('berserker', 1 + Math.floor(n / 4)), ...rep('archmage', 1 + Math.floor(n / 4)), ...rep('cleric', 1)] },
  { id: 12, region: 3, name: "The Hero's Throne", blurb: 'Every hero in the land has gathered to end you.', waves: 8, scale: 1.45, rating: 1350, boss: 'herokind',
    compose: (n) => [...rep('assassin', 1 + Math.floor(n / 3)), ...rep('sentinel', 1 + Math.floor(n / 4)), ...rep('berserker', 1 + Math.floor(n / 3)), ...rep('archmage', 1 + Math.floor(n / 3)), ...rep('cleric', 1 + Math.floor(n / 4))] },

  // The Endless Crypt: waves never stop and get steadily worse. Unlocks after zone 12. No boss; fail is the only ending.
  { id: 13, region: 4, name: 'The Endless Crypt', blurb: 'The living pour in forever. How long can you hold?', waves: Infinity, scale: 1.1, rating: 0, boss: null, endless: true,
    compose: (n) => [...rep('assassin', 1 + Math.floor(n / 5)), ...rep('sentinel', Math.floor(n / 6)), ...rep('berserker', 1 + Math.floor(n / 5)), ...rep('archmage', 1 + Math.floor(n / 5)), ...rep('cleric', 1 + Math.floor(n / 8)), ...rep('crusader', Math.min(8, 2 + Math.floor(n / 4)))] },
];

// Regions group zones on the map and set the look of the battlefield (see THEMES in render.js).
export const REGIONS = [
  { id: 1, name: 'The Greenmarch', theme: 'graveyard', zones: [1, 2, 3, 4] },
  { id: 2, name: 'The Crusader Reach', theme: 'holy', zones: [5, 6, 7, 8] },
  { id: 3, name: "The Heroes' Reach", theme: 'frost', zones: [9, 10, 11, 12] },
  { id: 4, name: 'The Endless Crypt', theme: 'graveyard', zones: [13] },
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
  mage:     { hp: ['Warded Robes', 'Pauldrons', 'Lich Crown'],          dmg: ['Brighter Orb', 'Arcane Focus', 'Void Orb'],
              hpLook: ['Threadbare', 'Warded', 'Pauldroned', 'Crowned'],  dmgLook: ['Dim orb', 'Bright orb', 'Arcane orb', 'Void orb'] },
  ghost:    { hp: ['Solid Shroud', 'Spectral Chains', 'Wraith Crown'],  dmg: ['Cold Touch', 'Grave Claws', 'Soul Reaper'],
              hpLook: ['Wisp', 'Shrouded', 'Chained', 'Wraith-crowned'],  dmgLook: ['Wisp hands', 'Cold touch', 'Grave claws', 'Reaping claws'] },
  deathknight: { hp: ['Plate Pauldrons', 'Crimson Plume', 'Gilded Barding'], dmg: ['Sharpened Lance', 'Runed Lance', 'Soulfire Lance'],
              hpLook: ['Dented', 'Pauldroned', 'Plumed', 'Gilded'],            dmgLook: ['Plain lance', 'Sharp', 'Runed', 'Soulfire'] },
  plaguebearer: { hp: ['Bandaged', 'Beaked Mask', 'Tainted Robes'],            dmg: ['Bubbling Censer', 'Noxious Fumes', 'Plague Heart'],
              hpLook: ['Ragged', 'Bandaged', 'Masked', 'Tainted'],             dmgLook: ['Dim censer', 'Bubbling', 'Noxious', 'Plague-heart'] },
  gravepriest: { hp: ['Gilded Trim', 'Mitre', 'Halo of Bone'],                  dmg: ['Brighter Light', 'Holy Focus', 'Wailing Skull'],
              hpLook: ['Plain', 'Trimmed', 'Mitred', 'Haloed'],                dmgLook: ['Dim', 'Bright', 'Holy', 'Wailing'] },
  gargoyle: { hp: ['Hardened Stone', 'Granite Plating', 'Obsidian Heart'],      dmg: ['Sharp Talons', 'Stone Fists', 'Obsidian Claws'],
              hpLook: ['Cracked', 'Hardened', 'Plated', 'Obsidian'],           dmgLook: ['Dull claws', 'Talons', 'Fists', 'Obsidian claws'] },
  abomination: { hp: ['Heavy Stitching', 'Bone Plates', 'Iron Spikes'], dmg: ['Meaty Fists', 'Bone Knuckles', 'Wrecking Fists'],
              hpLook: ['Patchwork', 'Stitched', 'Plated', 'Spiked'],         dmgLook: ['Fists', 'Heavy fists', 'Knuckled', 'Wrecking'] },
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
  frost:  { unit: 'mage',     name: 'Frost Bolt',   icon: 'frost',  cost: 450, needs: { stat: 'dmg', tiers: 1 },
            desc: 'Bolts chill enemies, slowing them for a few seconds.' },
  drain:  { unit: 'ghost',    name: 'Soul Drain',   icon: 'drain',  cost: 450, needs: { stat: 'dmg', tiers: 1 },
            desc: 'Heals the ghost for half the damage it deals.' },
  regen:  { unit: 'abomination', name: 'Regeneration', icon: 'regen', cost: 500, needs: { stat: 'hp', tiers: 1 },
            desc: 'Slowly regrows 3% of its max HP every second.' },
  charge: { unit: 'deathknight', name: 'Reckless Charge', icon: 'charge', cost: 500, needs: { stat: 'dmg', tiers: 1 },
            desc: 'The first blow of every fight lands for 2.5 times damage.' },
  blight: { unit: 'plaguebearer', name: 'Virulent Cloud', icon: 'blight', cost: 500, needs: { stat: 'dmg', tiers: 1 },
            desc: 'The poison cloud is wider and twice as deadly.' },
  mend:   { unit: 'gravepriest', name: 'Mass Mend',     icon: 'mend',   cost: 500, needs: { stat: 'dmg', tiers: 1 },
            desc: 'Heals every wounded ally in range, not just one.' },
  granite:{ unit: 'gargoyle',    name: 'Granite Heart', icon: 'granite', cost: 550, needs: { stat: 'hp', tiers: 1 },
            desc: 'Below 30% health, takes half damage.' },
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

export const PLAYER_UNITS = Object.keys(UNITS).filter((k) => UNITS[k].team === 'player' && !UNITS[k].static);

// ---- Field hazards ----
// Mines are laid between the lines at the start of each wave and blow up under your horde (zone 2 onwards).
// War banners appear from zone 3 on every third wave and buff the enemies near them until cut down.
export function hazardsFor(zone, wave) {
  const id = zone.id;
  if (zone.endless) {
    return { mines: Math.min(12, 3 + Math.floor(wave / 4)), mineFlat: 10 + wave * 2, minePct: 0.2, banners: wave % 2 === 0 ? Math.min(3, 1 + Math.floor(wave / 12)) : 0 };
  }
  const mines = id < 2 ? 0 : wave < 2 ? 0 : Math.min(9, 1 + Math.floor((id - 1) / 1.5) + (wave > 4 ? 1 : 0));
  const banners = id < 3 || wave < 3 || wave % 3 !== 0 ? 0 : 1 + (id >= 7 ? 1 : 0) + (id >= 11 ? 1 : 0);
  return { mines, mineFlat: 4 + 3 * id, minePct: Math.min(0.3, 0.1 + 0.015 * id), banners };
}
export function hazardText(zone) {
  const parts = [];
  const h = hazardsFor(zone, 8);
  if (h.mines) parts.push('Mines');
  if (zone.endless || zone.id >= 3) parts.push('War banners');
  return parts;
}

export function owned(save, unit) {
  return UNITS[unit].unlockCost === 0 || (save.nodes['unit_' + unit] || 0) > 0;
}
// Prepared Dead (a rebirth perk) lifts every owned unit's HP and damage chains to a minimum level.
export function level(save, stat, unit) {
  const base = save.nodes[stat + '_' + unit] || 0;
  if ((stat === 'hp' || stat === 'dmg') && owned(save, unit)) return Math.max(base, perk(save, 'head'));
  return base;
}
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
  let n = 0;
  for (const [k, v] of Object.entries(save.nodes)) if (!k.startsWith('def_') && !k.startsWith('unlock_')) n += v;
  return n;
}

// A rough comparable "power rating", shown against each zone's rating.
export function playerRating(save) {
  const units = PLAYER_UNITS.filter((u) => owned(save, u)).length;
  const specials = SPECIAL_KEYS.filter((k) => hasSpecial(save, k)).length;
  const gm = gearMods(save);
  const gear = (gm.dmg + gm.hp) * 50 + (gm.rise + gm.souls + gm.crit + gm.lifesteal + gm.thorns + gm.spell) * 30 + Object.keys(gm.fx).length * 10;
  return Math.round(10 + totalLevels(save) * 4 + (units - 1) * 10 + specials * 15 + gear);
}

// The necromancer's rank and look come from the gear he wears (see gearScore).
export const NECRO_TIERS = [
  { min: 0,  name: 'Grave Robber' },
  { min: 3,  name: 'Hexer' },
  { min: 8,  name: 'Bone Lord' },
  { min: 13, name: 'Lich' },
];

export function necroTier(save) {
  const p = gearScore(save);
  let tier = 0;
  NECRO_TIERS.forEach((t, i) => { if (p >= t.min) tier = i; });
  return tier;
}

export function zoneById(id) { return ZONES.find((z) => z.id === id); }

// ---- Rebirth ----
// Ascending wipes the run (souls, upgrades, cleared zones) and pays out Essence, spent on permanent perks
// that change how every future run starts.
export const REBIRTH_MIN_ZONE = 3;       // best zone you must have cleared this run
export const PERKS = {
  horde:    { name: 'Larger Vanguard', icon: 'zombie', base: 6,  growth: 1.5, max: 6,  effect: (l) => 'Start with ' + (TUNING.startZombies + l) + ' zombies' },
  souls:    { name: 'Soul Siphon',     icon: 'icon_poison', base: 8, growth: 1.55, max: 8, effect: (l) => '+' + l * 15 + '% souls from kills' },
  quick:    { name: 'Quickening',      icon: 'icon_raise', base: 10, growth: 1.6, max: 8, effect: (l) => '-' + l * 4 + '% raise cooldowns' },
  head:     { name: 'Prepared Dead',   icon: 'icon_hp',  base: 12, growth: 1.8, max: 5,  effect: (l) => 'Units start with +' + l + ' level of HP and damage' },
  pact:     { name: 'Eternal Pact',    icon: 'skeleton', base: 15, growth: 1.9, max: 6,  effect: (l) => 'Keep ' + l + ' unit unlock' + (l === 1 ? '' : 's') },
  conquest: { name: 'Conquered Lands', icon: 'icon_shield', base: 20, growth: 2.0, max: 7, effect: (l) => l ? 'Zones 1-' + l + ' start conquered' : 'No zones conquered' },
  restless: { name: 'Restless Dead',   icon: 'icon_pack', base: 12, growth: 1.7, max: 4,  effect: (l) => 'Offline cap ' + (TUNING.offlineCapHours + 4 * l) + 'h, +' + l * 25 + '% offline souls' },
  echo:     { name: "Champion's Echo", icon: 'icon_fire', base: 15, growth: 1.7, max: 5,  effect: (l) => '+' + l * 10 + '% champion soul chance on replays' },
  ritual:   { name: 'Dark Ritual',     icon: 'icon_burst', base: 10, growth: 1.6, max: 6, effect: (l) => 'Raise Dead brings ' + (3 + l) + ' minions, ' + Math.round(45 * Math.pow(0.9, l)) + 's cooldown' },
};
export const PERK_KEYS = Object.keys(PERKS);
// Unit unlocks that Eternal Pact keeps, in the order they are kept.
export const PACT_ORDER = ['archer', 'skeleton', 'hound', 'mage', 'ghost', 'abomination', 'deathknight', 'plaguebearer', 'gravepriest', 'gargoyle'];

export function perk(save, key) { return (save.perks && save.perks[key]) || 0; }
export function perkCost(key, lvl) { return Math.ceil(PERKS[key].base * Math.pow(PERKS[key].growth, lvl)); }

// ---- Bestiary ----
// Finding things pays tiny permanent bonuses: each enemy kind defeated adds a little to souls (bosses more), and each
// summon ever unlocked adds a little health and damage. Progress lives in save.seen and survives rebirth.
export const ENEMY_KEYS = Object.keys(UNITS).filter((k) => UNITS[k].team === 'enemy' && !UNITS[k].static);
export const BESTIARY_ENEMY = 0.0015, BESTIARY_BOSS = 0.004, BESTIARY_ALLY = 0.004;

// Make sure everything you already own or cleared is recorded (covers older saves too).
export function syncBestiary(save) {
  save.seen = save.seen || {};
  const mark = (t) => { const e = save.seen[t] || (save.seen[t] = {}); e.seen = true; e.kills = e.kills || 1; };
  for (const u of PLAYER_UNITS) if (owned(save, u)) (save.seen[u] || (save.seen[u] = {})).owned = true;
  for (const z of ZONES) {
    if (z.endless || !save.cleared[z.id]) continue;
    for (let n = 1; n <= z.waves; n++) for (const t of z.compose(n)) mark(t);
    mark(z.boss);
  }
}
export function bestiaryBonus(save) {
  const seen = save.seen || {};
  let souls = 0, allies = 0;
  for (const k of ENEMY_KEYS) if (seen[k] && seen[k].kills > 0) souls += UNITS[k].boss ? BESTIARY_BOSS : BESTIARY_ENEMY;
  for (const k of PLAYER_UNITS) if (seen[k] && seen[k].owned) allies++;
  return { souls, hp: allies * BESTIARY_ALLY, dmg: allies * BESTIARY_ALLY, allies };
}
// The first zone an enemy type appears in.
export function firstZoneOf(type) {
  for (const z of ZONES) {
    if (z.endless) continue;
    if (z.boss === type) return z.id;
    for (let n = 1; n <= z.waves; n++) if (z.compose(n).includes(type)) return z.id;
  }
  return 13;
}

export function soulMul(save) { return (1 + 0.15 * perk(save, 'souls')) * (1 + 0.05 * (save.rebirths || 0)) * (1 + gearMods(save).souls) * (1 + bestiaryBonus(save).souls); }
export function raiseMul(save) { return Math.max(0.2, 1 - 0.04 * perk(save, 'quick') - gearMods(save).rise); }
export function offlineCapHours(save) { return TUNING.offlineCapHours + 4 * perk(save, 'restless'); }
// Raise Dead: an unlock bought in the skill web. Once unlocked, every summon you own gets its own button.
export const SPELL_UNLOCK_COST = 300;
export function spellUnlocked(save) { return (save.nodes.unlock_spell || 0) > 0; }
export function spellCooldownFor(save, type) { return 40 * (UNITS[type].heavy ? 1.6 : 1) * Math.pow(0.9, perk(save, 'ritual')) * (1 - gearMods(save).spell); }
export function spellCountFor(save, type) { return UNITS[type].heavy ? 1 + Math.floor(perk(save, 'ritual') / 3) : 3 + perk(save, 'ritual'); }

// Essence you would earn by rebirthing now.
export function essenceGain(save) {
  let e = 0;
  for (const id of Object.keys(save.cleared)) if (save.cleared[id]) e += 3 * Math.pow(Number(id), 1.35);
  return Math.floor((Math.floor(e) + Math.floor(totalLevels(save) / 12)) * (1 + 0.2 * (save.rebirths || 0)));
}
export function canRebirth(save) { return save.bestZone >= REBIRTH_MIN_ZONE; }

// Each rebirth makes the world fight back harder, so a stronger necromancer still has a challenge.
export function worldMul(save) {
  const r = save.rebirths || 0;
  return { hp: Math.pow(2.2, r), dmg: Math.pow(1.5, r), rating: Math.pow(1.8, r) };
}

// ---- Unit tree ----
// Summons lead on from one another. Each is unlocked with champion souls AND once enough upgrade levels have been
// spent on the summons that lead to it (gate). pos is where it sits in the skill web, with the necromancer at 0,0.
export const UNIT_TREE = {
  zombie:       { parent: null,           pos: [-330, -170], gate: null },
  skeleton:     { parent: null,           pos: [330, -170],  gate: null },
  hound:        { parent: 'zombie',       pos: [-640, -500], gate: { units: ['zombie'], levels: 8 } },
  plaguebearer: { parent: 'zombie',       pos: [-220, -500], gate: { units: ['zombie'], levels: 20 } },
  abomination:  { parent: 'hound',        pos: [-640, -830], gate: { units: ['zombie', 'hound'], levels: 30 } },
  gargoyle:     { parent: 'abomination',  pos: [-220, -830], gate: { units: ['zombie', 'hound', 'abomination'], levels: 55 } },
  archer:       { parent: 'skeleton',     pos: [640, -500],  gate: { units: ['skeleton'], levels: 8 } },
  deathknight:  { parent: 'skeleton',     pos: [220, -500],  gate: { units: ['skeleton'], levels: 20 } },
  mage:         { parent: 'archer',       pos: [640, -830],  gate: { units: ['skeleton', 'archer'], levels: 30 } },
  ghost:        { parent: 'mage',         pos: [220, -830],  gate: { units: ['skeleton', 'archer', 'mage'], levels: 45 } },
  gravepriest:  { parent: 'ghost',        pos: [220, -1160], gate: { units: ['archer', 'mage', 'ghost'], levels: 50 } },
};
export function unitLevels(save, unit) { return level(save, 'hp', unit) + level(save, 'dmg', unit) + level(save, 'rise', unit); }
// { have, need } levels spent on the summons leading to this one (need 0 = no gate).
export function gateProgress(save, unit) {
  const g = UNIT_TREE[unit].gate;
  if (!g) return { have: 0, need: 0 };
  return { have: g.units.reduce((a, u) => a + (owned(save, u) ? unitLevels(save, u) : 0), 0), need: g.levels };
}
export function gateMet(save, unit) { const p = gateProgress(save, unit); return p.have >= p.need; }
// A summon is shown in the web when it is owned or the one leading to it is.
export function unitVisible(save, unit) {
  const p = UNIT_TREE[unit].parent;
  return owned(save, unit) || !p || owned(save, p);
}
