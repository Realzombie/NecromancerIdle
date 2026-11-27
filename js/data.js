// All tunable game numbers live here.
import { gearMods, gearScore } from './gear.js';
import { ZONES, REGIONS, NEW_ENEMIES, WAVES, BOSS_WAVE, ENDLESS_ID, LAST_ZONE, composeWave, waveSize } from './zones.js';
export { ZONES, REGIONS, WAVES, BOSS_WAVE, ENDLESS_ID, LAST_ZONE, composeWave, waveSize };
export const GATE_X = 78;          // enemies reaching this x end the attempt
export const NECRO_X = 44;         // where the necromancer stands
// Logical battlefield size. Tall phones (about 20:9) get a wider field so the game fills the screen.
const _q = typeof location !== 'undefined' ? Number(new URLSearchParams(location.search).get('wide')) : 0;   // ?wide=2.22 previews a tall phone
const _wide = _q > 1 ? _q : typeof screen !== 'undefined' && typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches ? Math.max(screen.width, screen.height) / Math.min(screen.width, screen.height) : 16 / 9;
export const FIELD_W = Math.round(Math.max(960, Math.min(1280, 540 * _wide)) / 8) * 8;
export const FIELD_H = 540;
export const LANE_TOP = 374;       // units are spread vertically between these
export const LANE_BOTTOM = 458;
export const LANE_MIN_Y = 368;     // hard clamp for unit y
export const LANE_MAX_Y = 474;

// Player units. raise = base seconds between raises. rally = x range where they gather when idle.
// unlockCost = champion souls to unlock in the skill tree (0 = owned from the start).
export const UNITS = {
  zombie:   { name: 'Zombie',          hp: 40, dmg: 5, atk: 1.0, speed: 40, range: 22,  radius: 10, raise: 12, rally: [400, 600], sprite: 'zombie',   team: 'player', unlockCost: 0, costMul: 1,   blurb: 'Slow, sturdy front line.' },
  archer:   { name: 'Skeleton Archer', hp: 36, dmg: 14, atk: 1.2, speed: 35, range: 150, radius: 9,  raise: 18, rally: [260, 400], sprite: 'archer',   team: 'player', unlockCost: 1, costMul: 1.6, blurb: 'Shoots from behind the line.' },
  skeleton: { name: 'Skeleton Warrior',hp: 108, dmg: 13, atk: 1.1, speed: 38, range: 24,  radius: 10, raise: 14, rally: [380, 570], sprite: 'skeleton', team: 'player', unlockCost: 1, costMul: 2,   blurb: 'Sword and shield. Tough and steady.' },
  hound:    { name: 'Zombie Hound',    hp: 36, dmg: 6, atk: 0.6, speed: 85, range: 20,  radius: 8,  raise: 9,  rally: [420, 640], sprite: 'hound',    team: 'player', unlockCost: 1, costMul: 2.5, blurb: 'Fast and fierce, but fragile.' },
  mage:     { name: 'Bone Mage',       hp: 36, dmg: 29, atk: 1.8, speed: 32, range: 170, radius: 9,  raise: 24, rally: [200, 340], sprite: 'mage',     team: 'player', unlockCost: 2, costMul: 2.2, splash: 45, blurb: 'Hurls bolts that burst on impact.' },
  ghost:    { name: 'Ghost',           hp: 57, dmg: 11, atk: 0.9, speed: 60, range: 22,  radius: 9,  raise: 16, rally: [420, 640], sprite: 'ghost',    team: 'player', unlockCost: 2, costMul: 2.4, dodge: 0.3, ghostly: true, blurb: 'Drifts through blows. Dodges 30% of hits.' },
  abomination: { name: 'Abomination',  hp: 339, dmg: 23, atk: 1.6, speed: 22, range: 30,  radius: 17, raise: 40, rally: [380, 520], sprite: 'abomination', team: 'player', unlockCost: 2, costMul: 3.5, heavy: true, cleave: 38, blurb: 'A towering stitched horror that hits everything near it.' },
  deathknight:  { name: 'Death Knight',   hp: 198, dmg: 25, atk: 1.1, speed: 70, range: 26,  radius: 12, raise: 28, rally: [380, 560], sprite: 'deathknight', team: 'player', unlockCost: 3, costMul: 3,   blurb: 'A heavily armoured knight who charges into the enemy line.' },
  plaguebearer: { name: 'Plague Bearer',  hp: 89,  dmg: 4,  atk: 1.2, speed: 30, range: 24,  radius: 11, raise: 26, rally: [400, 580], sprite: 'plaguebearer', team: 'player', unlockCost: 3, costMul: 2.6, aura: { r: 62, dps: 1.9 }, blurb: 'Wreathed in a toxic cloud that poisons every enemy nearby.' },
  gravepriest:  { name: 'Grave Priest',   hp: 78,  dmg: 5,  atk: 1.4, speed: 32, range: 120, radius: 9,  raise: 30, rally: [220, 360], sprite: 'gravepriest', team: 'player', unlockCost: 3, costMul: 2.4, heal: { amt: 17, every: 3, range: 170 }, blurb: 'Mends the wounded among your horde.' },
  bat:          { name: 'Vampire Bat',    hp: 24,  dmg: 6,  atk: 0.7, speed: 95, range: 22, radius: 8,  raise: 10, rally: [420, 660], sprite: 'bat', team: 'player', unlockCost: 2, costMul: 2.2, fly: true, alt: [100, 140], lifesteal: 0.3, blurb: 'Flies over the lines and bites from above. Ground melee cannot touch it, and every bite heals it.' },
  drake:        { name: 'Bone Drake',     hp: 179, dmg: 27, atk: 1.6, speed: 42, range: 170, radius: 15, raise: 38, rally: [260, 420], sprite: 'drake', team: 'player', unlockCost: 5, costMul: 3.6, fly: true, alt: [120, 160], splash: 42, blurb: 'A skeletal dragon that circles overhead and burns the ranks below with bone fire.' },
  gargoyle:     { name: 'Gargoyle',       hp: 327, dmg: 20,  atk: 1.3, speed: 34, range: 24,  radius: 12, raise: 34, rally: [420, 600], sprite: 'gargoyle', team: 'player', unlockCost: 4, costMul: 3.2, armor: 0.2, blurb: 'Living stone. Shrugs off a fifth of every blow.' },

  wight:        { name: 'Barrow Wight',   hp: 145,  dmg: 17, atk: 1.0, speed: 44, range: 26, radius: 11, raise: 24, rally: [400, 580], sprite: 'wight', team: 'player', unlockCost: 3, costMul: 2.8, lifesteal: 0.25, blurb: 'An ancient barrow lord who drinks the life from what it strikes.' },
  mummy:        { name: 'Mummy',          hp: 264, dmg: 9,  atk: 1.4, speed: 26, range: 24, radius: 11, raise: 28, rally: [420, 600], sprite: 'mummy', team: 'player', unlockCost: 3, costMul: 2.8, armor: 0.1, blurb: 'Wrapped, dried and very hard to put down.' },
  spider:       { name: 'Grave Spider',   hp: 95,  dmg: 17,  atk: 0.8, speed: 72, range: 22, radius: 10, raise: 14, rally: [420, 660], sprite: 'spider', team: 'player', unlockCost: 3, costMul: 2.5, blurb: 'Quick and venomous. Its webs can slow whatever it bites.' },
  banshee:      { name: 'Banshee',        hp: 106,  dmg: 27, atk: 2.0, speed: 46, range: 150, radius: 9, raise: 30, rally: [240, 400], sprite: 'banshee', team: 'player', unlockCost: 4, costMul: 3, fly: true, alt: [105, 145], splash: 55, blurb: 'Floats above the fight and wails, hurting everything bunched together.' },
  bonegolem:    { name: 'Bone Golem',     hp: 707, dmg: 33, atk: 2.1, speed: 20, range: 32, radius: 18, raise: 48, rally: [400, 540], sprite: 'bonegolem', team: 'player', unlockCost: 5, costMul: 4, armor: 0.25, heavy: true, cleave: 46, blurb: 'A walking ossuary. The finest wall the dead can build.' },
  reaper:       { name: 'Soul Reaper',    hp: 168, dmg: 34, atk: 1.5, speed: 48, range: 34, radius: 13, raise: 44, rally: [380, 540], sprite: 'reaper', team: 'player', unlockCost: 6, costMul: 4.2, cleave: 48, ghostly: true, dodge: 0.2, blurb: 'Death itself, on loan. Its scythe sweeps through whole ranks.' },

  // Enemies. How strong they are in a wave comes from the difficulty curve below.
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

  // Area attackers. shot picks the look of their splash; noBackfill keeps them undiscovered in older saves.
  firebrand: { name: 'Firebrand',         hp: 24,  dmg: 6,  atk: 2.4, speed: 31, range: 140, radius: 9,  drop: 8,   sprite: 'firebrand', team: 'enemy', splash: 40, shot: 'fire', noBackfill: true },
  flagellant:{ name: 'Flagellant',        hp: 130, dmg: 11, atk: 1.7, speed: 34, range: 28,  radius: 11, drop: 24,  sprite: 'flagellant', team: 'enemy', cleave: 44, noBackfill: true },
  bombard:   { name: 'Bombard Crew',      hp: 230, dmg: 30, atk: 3.4, speed: 20, range: 235, radius: 15, drop: 60,  sprite: 'bombard',   team: 'enemy', splash: 66, shot: 'bomb', heavy: true, noBackfill: true },

  // Region 2: the Crusader Reach.
  griffin:  { name: 'Griffin',            hp: 115, dmg: 14, atk: 1.1, speed: 62, range: 26,  radius: 12, drop: 28,  sprite: 'griffin',  team: 'enemy', fly: true, alt: [95, 135] },
  gryphonlord: { name: 'Gryphon Lord',     hp: 650, dmg: 30, atk: 1.1, speed: 55, range: 30,  radius: 17, drop: 150, sprite: 'gryphonlord', team: 'enemy', fly: true, alt: [105, 135] },
  crusader: { name: 'Crusader',           hp: 150, dmg: 12, atk: 1.2, speed: 30, range: 28,  radius: 12, drop: 22,  sprite: 'crusader', team: 'enemy' },
  crossbow: { name: 'Crossbowman',        hp: 45,  dmg: 15, atk: 1.8, speed: 30, range: 190, radius: 9,  drop: 20,  sprite: 'crossbow', team: 'enemy' },
  cleric:   { name: 'Cleric',             hp: 70,  dmg: 4,  atk: 2.0, speed: 30, range: 140, radius: 9,  drop: 24,  sprite: 'cleric',   team: 'enemy', heal: { amt: 18, every: 2.2, range: 160 } },
  paladin:  { name: 'Paladin',            hp: 420, dmg: 24, atk: 1.4, speed: 26, range: 30,  radius: 14, drop: 55,  sprite: 'paladin',  team: 'enemy' },
  inquisitor:{ name: 'The Inquisitor',    hp: 3200, dmg: 40, atk: 1.1, speed: 28, range: 34, radius: 17, drop: 700,  sprite: 'inquisitor', team: 'enemy', boss: true, abil: ['curse'], summon: { type: 'crusader', n: 1, every: 18 } },
  templar:  { name: 'Templar Lord',       hp: 5000, dmg: 55, atk: 1.2, speed: 26, range: 36, radius: 18, drop: 1000, sprite: 'templar',  team: 'enemy', boss: true, abil: ['slam','guard'], summon: { type: 'crusader', n: 2, every: 18 } },
  archbishop:{ name: 'The Archbishop',    hp: 6500, dmg: 65, atk: 1.3, speed: 26, range: 150, radius: 17, drop: 1500, sprite: 'archbishop', team: 'enemy', boss: true, abil: ['smite','curse'], heal: { amt: 120, every: 4, range: 220 } },
  // Region 3: the Heroes' Reach.
  wyvern:   { name: 'Frost Wyvern',       hp: 210, dmg: 38, atk: 1.8, speed: 40, range: 170, radius: 14, drop: 95,  sprite: 'wyvern',   team: 'enemy', fly: true, alt: [115, 155], splash: 40 },
  frostwyrm: { name: 'Frost Wyrm',        hp: 1000, dmg: 62, atk: 2.0, speed: 36, range: 190, radius: 19, drop: 320, sprite: 'frostwyrm', team: 'enemy', fly: true, alt: [120, 160], splash: 55 },
  berserker:{ name: 'Berserker',          hp: 260, dmg: 28, atk: 0.8, speed: 52, range: 26,  radius: 11, drop: 70,  sprite: 'berserker', team: 'enemy' },
  archmage: { name: 'Archmage',           hp: 120, dmg: 36, atk: 2.0, speed: 30, range: 190, radius: 9,  drop: 80,  sprite: 'archmage', team: 'enemy', splash: 55 },
  assassin: { name: 'Assassin',           hp: 150, dmg: 40, atk: 0.7, speed: 70, range: 22,  radius: 9,  drop: 75,  sprite: 'assassin', team: 'enemy', dodge: 0.35 },
  sentinel: { name: 'Sentinel',           hp: 900, dmg: 48, atk: 1.5, speed: 24, range: 32,  radius: 15, drop: 160, sprite: 'sentinel', team: 'enemy' },
  herodawn: { name: 'Hero of the Dawn',   hp: 14000, dmg: 110, atk: 1.1, speed: 32, range: 38, radius: 18, drop: 4000, sprite: 'herodawn', team: 'enemy', boss: true, abil: ['leap','slam'] },
  supreme:  { name: 'Archmage Supreme',   hp: 10000, dmg: 120, atk: 2.0, speed: 26, range: 200, radius: 17, drop: 5200, sprite: 'supreme', team: 'enemy', boss: true, abil: ['volley','smite'], splash: 70 },
  slayer:   { name: 'The Dragonslayer',   hp: 20000, dmg: 160, atk: 1.2, speed: 28, range: 40, radius: 20, drop: 7000, sprite: 'slayer', team: 'enemy', boss: true, abil: ['slam','leap','volley'] },
  herokind: { name: 'The Hero King',      hp: 40000, dmg: 200, atk: 1.2, speed: 28, range: 42, radius: 21, drop: 10000, sprite: 'herokind', team: 'enemy', boss: true, abil: ['smite','guard'], summon: { type: 'berserker', n: 1, every: 16 }, heal: { amt: 300, every: 5, range: 240 } },
  avenger:  { name: 'The Holy Avenger',   hp: 9500, dmg: 90, atk: 1.2, speed: 28, range: 38, radius: 19, drop: 2400, sprite: 'avenger',  team: 'enemy', boss: true, fly: true, alt: [95, 125], abil: ['leap','guard'] },
  ...NEW_ENEMIES,
};

// Boss abilities. Each boss lists some in its `abil`. Slam, leap and smite show a red warning first so they can be seen coming.
export const BOSS_ABILITIES = {
  slam:   { name: 'Ground Slam',  every: 14, windup: 0.9, radius: 72, dmgMul: 1.3 },
  leap:   { name: 'Leap',         every: 17, windup: 0.6, radius: 58, dmgMul: 1.1 },
  smite:  { name: 'Smite',        every: 13, windup: 1.0, targets: 2, radius: 30, dmgMul: 1.4 },
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
  mightPerRebirth: 1.09,     // permanent health and damage growth, compounding each rebirth
  startArmy: 8,              // army space before any upgrades
  reinforceBase: 6,          // seconds for the necromancer to replace a one-slot summon
  replayPay: 0.5,            // share of the souls paid for a wave you have already beaten
  firstWinBonus: 0.6,        // extra share paid the first time a wave falls
  failPayout: 0.5,           // share of earned souls banked on a failed attempt
  soulScale: 0.8,            // every soul drop is multiplied by this (rebirths and perks bring the real rate back up)
  costScale: 1.15,           // every soul upgrade cost is multiplied by this (rebirths and Thrift bring it back down)
  raiseCooldownFactor: 0.94, // each Rise level multiplies that unit's cooldown by this
  statPerLevel: 0.2,         // HP and damage bonus per level
  wavePause: 3,
  spawnGap: 0.35,
  aggroRange: 800,           // once enemies are on the field, every unit within this range charges them; with none, the horde mills about mid-field
  separation: 1.25,          // personal space as a fraction of combined radius (below 1 they overlap)
  repeatSoulChance: 0.07,    // chance of a champion soul from a boss you have already beaten
  offlineWavesPerMin: 0.05,  // offline souls a minute, as a share of what a wave in your best zone is worth
  offlineCapHours: 8,
  offlineMinSeconds: 60,
};

// ---- Difficulty ----
// One smooth curve sets how strong every wave is, so there are no sudden walls. An enemy's own numbers only set its
// shape (tough or sharp, near or far): the whole wave is scaled so its average member matches the curve.
// The strength of each zone, fitted to how strong a player really is when they get there (measured with
// tools/pacing.mjs). [zone, strength]; zones in between are filled in smoothly.
export const CURVE = { anchors: [[1, 1], [3, 1.42], [4, 1.85], [5, 2.75], [6, 4.4], [8, 9.8], [10, 16], [13, 40], [16, 76], [18, 117], [24, 320], [28, 470], [32, 780], [40, 1700]], wave: 1.07, boss: 1.1, scale: 1 };
export function zoneStrength(id) {
  const A = CURVE.anchors;
  let i = 0;
  while (i < A.length - 2 && id > A[i + 1][0]) i++;
  const [z0, s0] = A[i], [z1, s1] = A[i + 1];
  const v = s0 * Math.pow(s1 / s0, (id - z0) / (z1 - z0));
  return id <= 3 ? v : v * CURVE.scale;
}
export const waveCurve = (zone, wave) => {
  if (zone.endless) return zoneStrength(20) * Math.pow(1.075, wave - 1);
  return zoneStrength(zone.id) * Math.pow(CURVE.wave, Math.min(WAVES, wave) - 1) * (wave >= BOSS_WAVE ? CURVE.boss : 1);
};
// A rough size of a fighter: health against damage per second, with a little extra for reach and area attacks.
export function threat(def) {
  const dps = (def.dmg / def.atk) * (def.range > 40 ? 1.25 : 1) * (def.splash || def.cleave ? 1.35 : 1);
  const hp = def.hp / (1 - (def.armor || 0)) / (1 - (def.dodge || 0) * 0.7);
  return Math.sqrt(hp * Math.max(0.5, dps));
}
const BASE_THREAT = threat({ hp: 20, dmg: 3, atk: 1.2, range: 22 });       // a zone 1 peasant
// The multiplier for every ordinary enemy in a wave. Later zones also allow tougher kinds to be a little tougher.
export function waveMul(zone, wave, list) {
  const avg = list.reduce((a, t) => a + threat(UNITS[t]), 0) / Math.max(1, list.length);
  const flavour = Math.pow(avg / BASE_THREAT, 0.18);      // a wave of knights stays a bit harder than a wave of peasants
  return waveCurve(zone, wave) * (BASE_THREAT / avg) * flavour;
}
export const BOSS_BASE = { hp: 300, dmg: 9 };
// Souls a whole wave is worth if every enemy falls (before the soul bonuses).
export const waveSouls = (zone, wave) => 34 * (zone.endless ? Math.pow(1.13, 24) * Math.pow(1.05, wave - 1) : Math.pow(1.13, zone.id - 1) * (1 + 0.14 * (wave - 1))) * (wave >= BOSS_WAVE && !zone.endless ? 1.3 : 1);

// Souls a minute while away (before the offline perk).
export const offlineRate = (save) => TUNING.offlineWavesPerMin * waveSouls(ZONES[Math.max(0, Math.min(LAST_ZONE, save.bestZone) - 1)], 3) * soulMul(save);

// ---- The army ----
// Each wave starts with the army you have set. Bigger summons take more space.
export const ARMY_SLOTS = {
  zombie: 1, skeleton: 2, archer: 2, hound: 1, mage: 3, ghost: 2, abomination: 6, deathknight: 4, plaguebearer: 3, gravepriest: 3, gargoyle: 4, bat: 1, drake: 7,
  wight: 3, mummy: 3, spider: 2, banshee: 4, bonegolem: 8, reaper: 7,
};
export const MUSTER_MAX = 24;
export const musterCap = (save) => Math.min(MUSTER_MAX, 4 + 2 * (save.rebirths || 0));
export const musterCost = (save) => Math.ceil(45 * Math.pow(1.3, save.nodes.muster || 0) * costMul(save));
export const armyCap = (save) => TUNING.startArmy + (save.nodes.muster || 0) + 2 * perk(save, 'horde') + Math.floor((save.rebirths || 0) / 2);
export const armyUsed = (save) => Object.entries(save.army || {}).reduce((a, [t, n]) => a + n * ARMY_SLOTS[t], 0);
// Drop anything no longer owned and trim to the space there is. An empty army is filled with zombies.
export function tidyArmy(save) {
  const a = (save.army = save.army || {});
  for (const t of Object.keys(a)) if (!ARMY_SLOTS[t] || !owned(save, t) || a[t] <= 0) delete a[t];
  const keys = Object.keys(a).sort((x, y) => ARMY_SLOTS[y] - ARMY_SLOTS[x]);
  let over = armyUsed(save) - armyCap(save);
  for (const t of keys) while (over > 0 && a[t] > 0) { a[t]--; over -= ARMY_SLOTS[t]; if (!a[t]) delete a[t]; }
  if (!Object.keys(a).length) a.zombie = armyCap(save);
  return a;
}
// Put any spare space into zombies.
export function fillArmy(save) {
  const a = tidyArmy(save);
  const spare = armyCap(save) - armyUsed(save);
  if (spare > 0) a.zombie = (a.zombie || 0) + spare;
  return a;
}
// What actually takes the field: a learned Legion stands in for every ten of its summon.
export function armyRoster(save) {
  const out = {};
  for (const [t, n] of Object.entries(tidyArmy(save))) {
    const legions = legionOwned(save, t) ? Math.floor(n / 10) : 0;
    if (legions) out['legion_' + t] = legions;
    if (n - legions * 10 > 0) out[t] = n - legions * 10;
  }
  return out;
}

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
  zombie:   { hp: ['Rotten Flesh', 'Stitched Flesh', 'Iron Plating'],   dmg: ['Wooden Club', 'Battered Pitchfork', 'Iron Spear'],
              hpLook: ['Rotten', 'Stitched', 'Armoured', 'Warplated'],  dmgLook: ['Bare-handed', 'Club', 'Pitchfork', 'Spear'] },
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
  bat:      { hp: ['Leather Straps', 'Bone Plating', 'Bloodsteel Crown'],     dmg: ['Sharp Fangs', 'Razor Wings', 'Blood Frenzy'],
              hpLook: ['Scrawny', 'Strapped', 'Plated', 'Crowned'],            dmgLook: ['Nibbling', 'Fanged', 'Razor-winged', 'Frenzied'] },
  drake:    { hp: ['Iron Ribs', 'Gilded Skull', 'Bone Armour'],                dmg: ['Hot Breath', 'Bone Fire', 'Dragonfire'],
              hpLook: ['Bare bone', 'Ribbed', 'Gilded', 'Armoured'],            dmgLook: ['Smoking', 'Burning', 'Roaring', 'Dragonfire'] },
  gargoyle: { hp: ['Hardened Stone', 'Granite Plating', 'Obsidian Heart'],      dmg: ['Sharp Talons', 'Stone Fists', 'Obsidian Claws'],
              hpLook: ['Cracked', 'Hardened', 'Plated', 'Obsidian'],           dmgLook: ['Dull claws', 'Talons', 'Fists', 'Obsidian claws'] },
  wight:     { hp: ['Barrow Mail', 'Grave Helm', 'Kingly Plate'],       dmg: ['Barrow Blade', 'Cold Iron', 'Soul Edge'],        hpLook: ['Rotted', 'Mailed', 'Helmed', 'Kingly'], dmgLook: ['Old blade', 'Barrow blade', 'Cold iron', 'Soul edge'] },
  mummy:     { hp: ['Fresh Wrappings', 'Funeral Mask', 'Golden Collar'], dmg: ['Heavy Hands', 'Cursed Rings', 'Scarab Fists'],     hpLook: ['Tattered', 'Wrapped', 'Masked', 'Royal'], dmgLook: ['Bare hands', 'Heavy', 'Cursed', 'Scarab'] },
  spider:    { hp: ['Hard Shell', 'Bone Spines', 'Grave Carapace'],       dmg: ['Sharp Fangs', 'Venom Sacs', 'Death Fangs'],       hpLook: ['Soft', 'Shelled', 'Spined', 'Armoured'], dmgLook: ['Biting', 'Fanged', 'Venomous', 'Deadly'] },
  banshee:   { hp: ['Pale Veil', 'Mourning Crown', 'Spectral Chains'],    dmg: ['Keening', 'Shrill Wail', 'Death Cry'],            hpLook: ['Faint', 'Veiled', 'Crowned', 'Chained'], dmgLook: ['Sighing', 'Keening', 'Wailing', 'Screaming'] },
  bonegolem: { hp: ['Rib Plating', 'Skull Pauldrons', 'Ossuary Heart'],   dmg: ['Femur Clubs', 'Spiked Fists', 'Titan Fists'],     hpLook: ['Loose', 'Plated', 'Skulled', 'Hearted'], dmgLook: ['Fists', 'Clubbed', 'Spiked', 'Titan'] },
  reaper:    { hp: ['Deeper Hood', 'Bone Mantle', "Death's Crown"],       dmg: ['Whetted Scythe', 'Soul Scythe', 'World Scythe'],  hpLook: ['Hooded', 'Shadowed', 'Mantled', 'Crowned'], dmgLook: ['Scythe', 'Whetted', 'Soul', 'World'] },
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
  feast:  { unit: 'bat',      name: 'Blood Feast',  icon: 'drain',  cost: 400, needs: { stat: 'dmg', tiers: 1 },
            desc: 'Heals the bat for half the damage it deals, on top of its own life steal.' },
  inferno:{ unit: 'drake',    name: 'Inferno',      icon: 'fire',   cost: 600, needs: { stat: 'dmg', tiers: 1 },
            desc: 'Bone fire sets enemies alight, burning them over time.' },
  chill:    { unit: 'wight',     effect: 'frost',   name: 'Barrow Chill', icon: 'frost',  cost: 600, needs: { stat: 'dmg', tiers: 1 }, desc: 'Its blade chills enemies, slowing them.' },
  rot:      { unit: 'mummy',     effect: 'regen',   name: 'Ancient Curse', icon: 'regen', cost: 600, needs: { stat: 'hp', tiers: 1 },  desc: 'The curse knits it back together: 3% of its max HP every second.' },
  venom:    { unit: 'spider',    effect: 'poison',  name: 'Venom', icon: 'poison',        cost: 550, needs: { stat: 'dmg', tiers: 1 }, desc: 'Bites poison enemies, dealing damage over time.' },
  keen:     { unit: 'banshee',   effect: 'frost',   name: 'Chilling Wail', icon: 'frost', cost: 700, needs: { stat: 'dmg', tiers: 1 }, desc: 'The wail slows everything it strikes.' },
  marrow:   { unit: 'bonegolem', effect: 'shield',  name: 'Packed Bone', icon: 'shield',  cost: 800, needs: { stat: 'hp', tiers: 1 },  desc: 'Takes 25% less damage from every hit.' },
  harvest:  { unit: 'reaper',    effect: 'drain',   name: 'Soul Harvest', icon: 'drain',  cost: 900, needs: { stat: 'dmg', tiers: 1 }, desc: 'Heals the Reaper for half the damage it deals.' },
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

// ---- Legions ----
// Once a summon is fully upgraded you can pay a huge sum to teach the necromancer to raise its Legion: one big unit
// with its own look that is worth about eleven of them, raised in the time eight would take, and raised INSTEAD of the single summon. Legions share the upgrades of
// the summon they come from. They are generated from the base definitions so every summon gets one.
export const LEGION_MULT = 11;      // health and damage compared with a single summon
export const LEGION_RAISE = 8;      // raise cooldown compared with a single summon
for (const u of PLAYER_UNITS) {
  const d = UNITS[u];
  UNITS['legion_' + u] = {
    ...d, name: d.name + ' Legion', legion: u, heavy: true,
    hp: d.hp * LEGION_MULT, dmg: d.dmg * LEGION_MULT, radius: Math.round(d.radius * 1.8), raise: d.raise * LEGION_RAISE,
    range: d.range > 40 ? d.range * 1.15 : d.range + 14, unlockCost: 0,
    ...(d.heal ? { heal: { ...d.heal, amt: d.heal.amt * LEGION_MULT * 0.6 } } : {}),
    ...(d.aura ? { aura: { r: d.aura.r * 1.6, dps: d.aura.dps * 6 } } : {}),
    ...(d.range > 40 ? { splash: d.splash ? d.splash * 1.4 : 36 } : { cleave: d.cleave ? d.cleave * 1.4 : 34 }),   // a crowd hits several at once
    blurb: 'A whole horde of them fighting as one. Worth about eleven.',
  };
}
export const LEGION_KEYS = PLAYER_UNITS.map((u) => 'legion_' + u);

// ---- Field hazards ----
// Traps (the code calls them mines) are laid between the lines at the start of each wave and spring under your horde (zone 2 onwards).
// War banners appear from zone 3 on every third wave and buff the enemies near them until cut down.
export function hazardsFor(zone, wave) {
  const id = zone.id;
  if (zone.endless) {
    return { mines: Math.min(10, 3 + Math.floor(wave / 4)), mineK: waveCurve(zone, wave), minePct: 0.2, banners: wave % 2 === 0 ? Math.min(3, 1 + Math.floor(wave / 12)) : 0 };
  }
  const mines = id < 3 || wave < 2 ? 0 : Math.min(7, 1 + Math.floor(id / 8) + (wave >= 4 ? 1 : 0));
  const banners = id < 4 || ![3, 5, BOSS_WAVE].includes(wave) ? 0 : 1 + (id >= 17 && wave === 5 ? 1 : 0) + (id >= 33 && wave === 5 ? 1 : 0);
  return { mines, mineK: waveCurve(zone, wave), minePct: Math.min(0.28, 0.08 + 0.006 * id), banners };
}
export function hazardText(zone) {
  const parts = [];
  if (zone.endless || zone.id >= 3) parts.push('Traps');
  if (zone.endless || zone.id >= 4) parts.push('War banners');
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
// Each rebirth makes upgrades 7% cheaper (down to 40%), and Thrift takes another 4% a level off.
export function costMul(save) {
  if (!save) return TUNING.costScale;
  return TUNING.costScale * Math.max(0.4, Math.pow(0.93, save.rebirths || 0)) * (1 - 0.04 * perk(save, 'thrift'));
}
export function statCost(stat, unit, lvl, save) {
  const tierJump = stat === 'rise' ? 1 : Math.pow(TIER.jump, Math.floor(lvl / TIER.levels));
  return Math.ceil(STATS[stat].base * UNITS[unit].costMul * Math.pow(STATS[stat].growth, lvl) * tierJump * costMul(save));
}

// ---- The long game: what each rebirth opens up ----
// Zones, summons and upgrade tiers are gated behind how many times you have been reborn, so a single run only goes so far.
export const zoneRebirth = (id) => (id === ENDLESS_ID ? 8 : Math.max(0, id - 3));      // roughly one new zone each rebirth
export const UNIT_REBIRTH = { zombie: 0, skeleton: 0, archer: 0, hound: 1, bat: 2, plaguebearer: 3, deathknight: 4, mage: 5, wight: 6, abomination: 7, ghost: 8, spider: 9,
  gravepriest: 11, mummy: 13, gargoyle: 15, banshee: 18, drake: 21, bonegolem: 25, reaper: 30 };
export const TIER_REBIRTH = [0, 3, 9];                 // the second and third tier of HP and damage upgrades
// Rebirths needed before the next level of this stat can be bought (0 = no lock).
export function statNeeds(stat, lvl) {
  if (stat === 'rise') return lvl >= 6 ? 8 : lvl >= 4 ? 3 : 0;
  return TIER_REBIRTH[Math.floor(lvl / TIER.levels)] || 0;
}
export const rebirthsOf = (save) => (save && save.rebirths) || 0;
export function unitRebirthOk(save, unit) { return rebirthsOf(save) >= (UNIT_REBIRTH[unit] || 0); }
// What each rebirth unlocks, for the Rebirth screen.
export function milestones() {
  const out = {};
  const add = (r, t) => { (out[r] = out[r] || []).push(t); };
  for (const z of ZONES) if (zoneRebirth(z.id) > 0) add(zoneRebirth(z.id), 'Zone: ' + z.name);
  for (const u of Object.keys(UNIT_REBIRTH)) if (UNIT_REBIRTH[u] > 0) add(UNIT_REBIRTH[u], 'Summon: ' + UNITS[u].name);
  add(3, 'Second tier of HP and damage upgrades, Rise Faster past level 4');
  add(8, 'Rise Faster past level 6');
  add(9, 'Third tier of HP and damage upgrades');
  return out;
}

// Legions: shown once the summon is fully upgraded, and very expensive.
export function legionReady(save, unit) {
  return owned(save, unit) && ['hp', 'dmg', 'rise'].every((s) => level(save, s, unit) >= STATS[s].max);
}
export const legionOwned = (save, unit) => (save.nodes['legion_' + unit] || 0) > 0;
export function legionCost(save, unit) { return Math.ceil(9000 * UNITS[unit].costMul * costMul(save)); }
export function hasSpecial(save, key) { return (save.nodes['sp_' + key] || 0) > 0; }
export function specialReady(save, key) {
  const sp = SPECIALS[key];
  return owned(save, sp.unit) && tiersDone(level(save, sp.needs.stat, sp.unit)) >= sp.needs.tiers;
}

// Rebirths make your whole horde a little tougher for good (5% each), and the Might perk adds more.
export function mightMul(save) { return Math.pow(TUNING.mightPerRebirth, save.rebirths || 0) * (1 + 0.05 * perk(save, 'might')); }
export function statMods(save, unit) {
  return {
    hp: (1 + statBonus(level(save, 'hp', unit))) * mightMul(save),
    dmg: (1 + statBonus(level(save, 'dmg', unit))) * mightMul(save),
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

// Power: your army measured the same way as the enemy waves are, so the two can be compared.
export function playerRating(save) {
  const gm = gearMods(save);
  const specials = {};
  for (const k of SPECIAL_KEYS) if (hasSpecial(save, k)) specials[SPECIALS[k].unit] = 1;
  let p = 0;
  for (const [t, n] of Object.entries(armyRoster(save))) {
    const base = UNITS[t].legion || t, m = statMods(save, base);
    p += n * threat(UNITS[t]) * Math.sqrt(m.hp * (1 + gm.hp) * m.dmg * (1 + gm.dmg)) * (specials[base] ? 1.15 : 1);
  }
  return Math.round(p * (1 + gm.crit + gm.lifesteal));
}
// The power that usually beats a zone, as measured with tools/pacing.mjs. Shown beside your own power.
const RATING_ANCHORS = [[1, 110], [3, 300], [4, 500], [5, 780], [6, 1350], [8, 2700], [10, 4900], [13, 13000], [16, 22000], [18, 32000], [24, 82000], [30, 180000], [40, 540000]];
export function waveRating(zone, wave) {
  const A = RATING_ANCHORS, id = zone.endless ? 24 : zone.id;
  let i = 0;
  while (i < A.length - 2 && id > A[i + 1][0]) i++;
  const [z0, s0] = A[i], [z1, s1] = A[i + 1];
  return Math.round(s0 * Math.pow(s1 / s0, (id - z0) / (z1 - z0)) * (0.7 + 0.06 * Math.min(6, wave)));
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
export const REBIRTH_MIN_ZONE = 2;       // best zone you must have cleared this run
export const PERKS = {
  horde:    { name: 'Larger Vanguard', icon: 'zombie', base: 5,  growth: 1.45, max: 10, needs: {},  effect: (l) => '+' + 2 * l + ' army space' },
  souls:    { name: 'Soul Siphon',     icon: 'icon_poison', base: 8, growth: 1.45, max: 15, needs: {}, effect: (l) => '+' + l * 15 + '% souls from kills' },
  quick:    { name: 'Quickening',      icon: 'icon_raise', base: 10, growth: 1.6, max: 8, needs: { horde: 2 }, effect: (l) => '-' + l * 4 + '% raise cooldowns' },
  head:     { name: 'Prepared Dead',   icon: 'icon_hp',  base: 12, growth: 1.8, max: 5, needs: { horde: 3 },  effect: (l) => 'Units start with +' + l + ' level of HP and damage' },
  pact:     { name: 'Eternal Pact',    icon: 'skeleton', base: 15, growth: 1.9, max: 6, needs: { head: 2 },  effect: (l) => 'Keep ' + l + ' unit unlock' + (l === 1 ? '' : 's') },
  conquest: { name: 'Conquered Lands', icon: 'icon_shield', base: 20, growth: 1.35, max: 25, needs: { pact: 2, souls: 3 }, effect: (l) => l ? 'Zones 1-' + l + ' start conquered' : 'No zones conquered' },
  restless: { name: 'Restless Dead',   icon: 'icon_pack', base: 12, growth: 1.7, max: 4, needs: { thrift: 2 },  effect: (l) => 'Offline cap ' + (TUNING.offlineCapHours + 4 * l) + 'h, +' + l * 25 + '% offline souls' },
  echo:     { name: "Champion's Echo", icon: 'icon_fire', base: 15, growth: 1.7, max: 5, needs: { ritual: 1 },  effect: (l) => '+' + l * 10 + '% champion soul chance on replays' },
  thrift:   { name: 'Thrift',          icon: 'icon_shield', base: 8, growth: 1.6, max: 8, needs: { souls: 2 }, effect: (l) => '-' + l * 4 + '% upgrade costs' },
  might:    { name: 'Necrotic Might',  icon: 'icon_fire', base: 14, growth: 1.7, max: 30, needs: { head: 1 }, effect: (l) => '+' + l * 5 + '% health and damage' },
  ritual:   { name: 'Dark Ritual',     icon: 'icon_burst', base: 10, growth: 1.6, max: 6, needs: { quick: 2 }, effect: (l) => 'Raise Dead brings ' + (3 + l) + ' minions, ' + Math.round(45 * Math.pow(0.9, l)) + 's cooldown' },
};
export const PERK_KEYS = Object.keys(PERKS);
// Unit unlocks that Eternal Pact keeps, in the order they are kept.
export const PACT_ORDER = ['archer', 'skeleton', 'hound', 'bat', 'plaguebearer', 'deathknight', 'mage', 'wight', 'abomination', 'ghost', 'spider', 'gravepriest', 'mummy', 'gargoyle', 'banshee', 'drake', 'bonegolem', 'reaper'];

export function perk(save, key) { return (save.perks && save.perks[key]) || 0; }
export function perkCost(key, lvl) { return Math.ceil(PERKS[key].base * Math.pow(PERKS[key].growth, lvl)); }
// The perks (and levels) you still need before this one opens, as text, or '' when it is open.
export function perkLock(save, key) {
  const miss = Object.entries(PERKS[key].needs || {}).filter(([k, l]) => perk(save, k) < l);
  return miss.map(([k, l]) => PERKS[k].name + ' ' + l).join(', ');
}

// ---- Bestiary ----
// Finding things pays tiny permanent bonuses: each enemy kind defeated adds a little to souls (bosses more), and each
// summon ever unlocked adds a little health and damage. Progress lives in save.seen and survives rebirth.
export const ENEMY_KEYS = Object.keys(UNITS).filter((k) => UNITS[k].team === 'enemy' && !UNITS[k].static);
export const BESTIARY_ENEMY = 0.0015, BESTIARY_BOSS = 0.004, BESTIARY_ALLY = 0.004;

// Make sure everything you already own or cleared is recorded (covers older saves too).
export function syncBestiary(save) {
  save.seen = save.seen || {};
  const mark = (t) => { if (UNITS[t].noBackfill) return; const e = save.seen[t] || (save.seen[t] = {}); e.seen = true; e.kills = e.kills || 1; };
  for (const u of PLAYER_UNITS) if (owned(save, u)) (save.seen[u] || (save.seen[u] = {})).owned = true;
  for (const z of ZONES) {
    if (z.endless || !save.cleared[z.id]) continue;
    for (let n = 1; n <= z.waves; n++) for (const t of composeWave(z, n)) mark(t);
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
    for (let n = 1; n <= z.waves; n++) if (composeWave(z, n).includes(type)) return z.id;
  }
  return ENDLESS_ID;
}

export function soulMul(save) { return TUNING.soulScale * (1 + 0.15 * perk(save, 'souls')) * (1 + 0.1 * (save.rebirths || 0)) * (1 + gearMods(save).souls) * (1 + bestiaryBonus(save).souls); }
export function raiseMul(save) { return Math.max(0.2, 1 - 0.04 * perk(save, 'quick') - gearMods(save).rise); }
export function offlineCapHours(save) { return TUNING.offlineCapHours + 4 * perk(save, 'restless'); }
// Raise Dead: an unlock bought in the skill web. Once unlocked, every summon you own gets its own button.
export const SPELL_UNLOCK_COST = 300;
export function spellUnlocked(save) { return (save.nodes.unlock_spell || 0) > 0; }
export function spellCooldownFor(save, type) { return 40 * (UNITS[type].legion ? 3.5 : UNITS[type].heavy ? 1.6 : 1) * Math.pow(0.9, perk(save, 'ritual')) * (1 - gearMods(save).spell); }
export function spellCountFor(save, type) { return UNITS[type].legion ? 1 : UNITS[type].heavy ? 1 + Math.floor(perk(save, 'ritual') / 3) : 3 + perk(save, 'ritual'); }

// Essence you would earn by rebirthing now.
export function essenceGain(save) {
  let e = 0;
  for (const [id, w] of Object.entries(save.progress || {})) if (Number(id) > (save.skipped || 0)) e += w * (0.8 + 0.22 * Number(id));
  return Math.floor((e + totalLevels(save) / 20) * (1 + 0.06 * (save.rebirths || 0)));
}
export function canRebirth(save) { return save.bestZone >= REBIRTH_MIN_ZONE; }

// Each rebirth makes the world fight back harder, so a stronger necromancer still has a challenge.
export function worldMul() {      // the world no longer toughens with rebirths: each zone has its own strength
  return { hp: 1, dmg: 1, rating: 1 };
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
  bat:          { parent: 'hound',        pos: [-1000, -500], gate: { units: ['zombie', 'hound'], levels: 24 } },
  drake:        { parent: 'gravepriest',  pos: [1000, -1160], gate: { units: ['mage', 'ghost', 'gravepriest'], levels: 60 } },
  wight:        { parent: 'deathknight',  pos: [0, 0], gate: { units: ['skeleton', 'deathknight'], levels: 30 } },
  mummy:        { parent: 'plaguebearer', pos: [0, 0], gate: { units: ['zombie', 'plaguebearer'], levels: 35 } },
  spider:       { parent: 'bat',          pos: [0, 0], gate: { units: ['hound', 'bat'], levels: 30 } },
  banshee:      { parent: 'wight',        pos: [0, 0], gate: { units: ['deathknight', 'wight'], levels: 40 } },
  bonegolem:    { parent: 'mummy',        pos: [0, 0], gate: { units: ['plaguebearer', 'mummy'], levels: 40 } },
  reaper:       { parent: 'banshee',      pos: [0, 0], gate: { units: ['wight', 'banshee'], levels: 45 } },
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
