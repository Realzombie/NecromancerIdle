// Gear: random drops with rarity, rolled stats and special effects. Pure logic, no DOM, no imports from data.js
// (data.js imports this file to fold gear into the game's multipliers).

export const RARITIES = [
  { id: 'common',    name: 'Common',    color: '#b8b0c8', mult: 1,   extras: 0, dust: 2,  weight: 60 },
  { id: 'magic',     name: 'Magic',     color: '#5aa8ff', mult: 1.3, extras: 1, dust: 5,  weight: 27 },
  { id: 'rare',      name: 'Rare',      color: '#f0d050', mult: 1.7, extras: 2, dust: 12, weight: 10 },
  { id: 'epic',      name: 'Epic',      color: '#c070f0', mult: 2.2, extras: 3, dust: 30, weight: 2.6 },
  { id: 'legendary', name: 'Legendary', color: '#ff9030', mult: 2.8, extras: 3, dust: 80, weight: 0.4 },
];

export const SLOTS = ['weapon', 'armour', 'charm'];
export const SLOT_NAMES = { weapon: 'Weapon', armour: 'Armour', charm: 'Charm' };

// Stat keys. Values are fractions (0.1 = +10%) before rarity, item level and upgrades are applied.
export const STAT_DEFS = {
  dmg:       { name: 'Damage',            base: 0.05, fmt: (v) => '+' + pct(v) + ' damage' },
  hp:        { name: 'Health',            base: 0.05, fmt: (v) => '+' + pct(v) + ' health' },
  souls:     { name: 'Souls',             base: 0.04, fmt: (v) => '+' + pct(v) + ' souls' },
  rise:      { name: 'Raise speed',       base: 0.03, fmt: (v) => '-' + pct(v) + ' raise cooldowns' },
  spell:     { name: 'Spell recharge',    base: 0.04, fmt: (v) => '-' + pct(v) + ' Raise Dead cooldown' },
  crit:      { name: 'Critical hits',     base: 0.04, fmt: (v) => pct(v) + ' chance to hit for double' },
  lifesteal: { name: 'Lifesteal',         base: 0.02, fmt: (v) => 'Heal ' + pct(v) + ' of damage dealt' },
  thorns:    { name: 'Thorns',            base: 0.04, fmt: (v) => 'Attackers take ' + pct(v) + ' of the damage back' },
};
const pct = (v) => Math.round(v * 1000) / 10 + '%';

// Main stat each slot always rolls, and the pool its extra rolls come from.
export const SLOT_MAIN = { weapon: 'dmg', armour: 'hp', charm: 'souls' };
const EXTRA_POOL = { weapon: ['crit', 'lifesteal', 'rise', 'spell', 'hp'], armour: ['thorns', 'rise', 'souls', 'dmg', 'spell'], charm: ['rise', 'spell', 'dmg', 'hp', 'crit', 'lifesteal', 'thorns'] };

// Special effects on Epic (sometimes) and Legendary (always) items.
export const GEAR_FX = {
  martyr: { name: 'Martyr',   desc: 'Your dying minions explode, hurting nearby enemies.' },
  frenzy: { name: 'Frenzy',   desc: 'Minions below half health attack 30% faster.' },
  reaper: { name: 'Reaper',   desc: 'Kills have a 12% chance to raise a free zombie.' },
  bulwark:{ name: 'Bulwark',  desc: 'Bone walls have double health.' },
};
const FX_KEYS = Object.keys(GEAR_FX);

const BASES = {
  weapon: ['Rusty Shiv', 'Grave Scythe', 'Soulreaper', 'Lich Staff'],
  armour: ['Tattered Shroud', 'Bone Plate', 'Wraith Mantle', 'Void Plate'],
  charm:  ['Bone Charm', 'Skull Amulet', 'Soul Phylactery', 'Death Sigil'],
};
const PREFIX = {
  common: [''],
  magic: ['Sturdy', 'Keen', 'Gilded', 'Sombre'],
  rare: ['Cursed', 'Blighted', 'Grim', 'Hallowed'],
  epic: ['Dread', 'Ancient', 'Abyssal', 'Wailing'],
  legendary: ["Death's", "The Lich King's", 'Eternal', 'Worldending'],
};
export const MAX_UP = 10;
export const MAX_ITEMS = 60;
export const PITY_AT = 7;          // drops without a Rare before one is guaranteed

export const rarityIndex = (id) => RARITIES.findIndex((r) => r.id === id);
export const rarityOf = (item) => RARITIES[rarityIndex(item.rarity)];

// Value of a stat on an item, after item level, rarity and upgrades.
export function statValue(item, st) {
  return st.v * (1 + 0.06 * item.up);
}

export function itemName(item) {
  return item.name;
}

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

// Roll a rarity for a drop in the given zone. Harder zones and bosses push the odds towards better gear.
export function rollRarity(rng, zone, boss, minIndex = 0) {
  const push = 1 + 0.08 * zone + (boss ? 0.8 : 0);
  const w = RARITIES.map((r, i) => (i < minIndex ? 0 : r.weight * (i === 0 ? 1 : Math.pow(push, i))));
  let t = rng() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) { t -= w[i]; if (t <= 0) return i; }
  return minIndex;
}

export function makeItem(save, rng, zone, rarityIdx, slot) {
  const R = RARITIES[rarityIdx];
  slot = slot || pick(rng, SLOTS);
  const scale = 1 + 0.1 * (zone - 1);
  const roll = () => 0.8 + rng() * 0.4;
  const stats = [{ k: SLOT_MAIN[slot], v: STAT_DEFS[SLOT_MAIN[slot]].base * R.mult * scale * roll() }];
  const pool = EXTRA_POOL[slot].filter((k) => k !== SLOT_MAIN[slot]);
  for (let i = 0; i < R.extras && pool.length; i++) {
    const k = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    stats.push({ k, v: STAT_DEFS[k].base * R.mult * scale * roll() * 0.6 });
  }
  let fx = null;
  if (rarityIdx === 4 || (rarityIdx === 3 && rng() < 0.4)) fx = pick(rng, FX_KEYS);
  const tier = Math.min(3, Math.floor((zone - 1) / 3));
  const pre = pick(rng, PREFIX[R.id]);
  save.gearSeq = (save.gearSeq || 0) + 1;
  return {
    id: save.gearSeq, slot, rarity: R.id, zone, up: 0, stats, fx,
    name: (pre ? pre + ' ' : '') + BASES[slot][tier],
  };
}

// Re-roll the extra stats (not the main one) of an item.
export function rerollExtras(item, rng) {
  const R = rarityOf(item);
  const main = item.stats[0];
  const scale = 1 + 0.1 * (item.zone - 1);
  const pool = EXTRA_POOL[item.slot].filter((k) => k !== main.k);
  item.stats = [main];
  for (let i = 0; i < R.extras && pool.length; i++) {
    const k = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    item.stats.push({ k, v: STAT_DEFS[k].base * R.mult * scale * (0.8 + rng() * 0.4) * 0.6 });
  }
}

// Total gear bonuses from the equipped items.
export function gearMods(save) {
  const m = { dmg: 0, hp: 0, souls: 0, rise: 0, spell: 0, crit: 0, lifesteal: 0, thorns: 0, fx: {} };
  const eq = save.equipped;
  if (!eq || !save.gear) return m;
  for (const slot of SLOTS) {
    const it = save.gear.find((g) => g.id === eq[slot]);
    if (!it) continue;
    for (const st of it.stats) m[st.k] += statValue(it, st);
    if (it.fx) m.fx[it.fx] = true;
  }
  m.rise = Math.min(0.25, m.rise);
  m.spell = Math.min(0.4, m.spell);
  m.crit = Math.min(0.35, m.crit);
  m.lifesteal = Math.min(0.25, m.lifesteal);
  m.thorns = Math.min(0.5, m.thorns);
  return m;
}

export function itemPower(item) {
  return Math.round(item.stats.reduce((a, st) => a + statValue(item, st) * 100, 0) + (item.fx ? 10 : 0));
}

export function upgradeCost(item) { return Math.ceil(4 * Math.pow(1.55, item.up) * (1 + rarityIndex(item.rarity) * 0.6)); }
export function rerollCost(item) { return 12 + rarityIndex(item.rarity) * 14; }
export function salvageValue(item) { return Math.round(rarityOf(item).dust * (1 + 0.6 * item.up) * (1 + 0.05 * item.zone)); }

// ---- Inventory actions (all take the save) ----
export function addItem(save, item) {
  save.gear = save.gear || [];
  item.isNew = true;
  save.gear.push(item);
  save.stats = save.stats || {};
  save.stats.gearFound = (save.stats.gearFound || 0) + 1;
  if (item.rarity === 'epic') save.stats.epics = (save.stats.epics || 0) + 1;
  if (item.rarity === 'legendary') save.stats.legendaries = (save.stats.legendaries || 0) + 1;
  if (save.gear.length > MAX_ITEMS) autoTrim(save);
}

// When the bag is full, break down the weakest unequipped item.
function autoTrim(save) {
  const eq = Object.values(save.equipped || {});
  let worst = null;
  for (const it of save.gear) {
    if (eq.includes(it.id)) continue;
    if (!worst || rarityIndex(it.rarity) < rarityIndex(worst.rarity) || (it.rarity === worst.rarity && itemPower(it) < itemPower(worst))) worst = it;
  }
  if (worst) salvage(save, worst.id);
}

export function equip(save, id) {
  const it = (save.gear || []).find((g) => g.id === id);
  if (!it) return false;
  save.equipped = save.equipped || {};
  save.equipped[it.slot] = id;
  return true;
}
export function unequip(save, slot) { if (save.equipped) delete save.equipped[slot]; }

export function salvage(save, id) {
  const i = (save.gear || []).findIndex((g) => g.id === id);
  if (i < 0) return 0;
  const it = save.gear[i];
  if (save.equipped && save.equipped[it.slot] === id) return 0;
  const v = salvageValue(it);
  save.gear.splice(i, 1);
  save.dust = (save.dust || 0) + v;
  return v;
}

// Break down everything unequipped at or below a rarity index.
export function salvageBelow(save, maxIdx) {
  let total = 0;
  for (const it of [...(save.gear || [])]) if (rarityIndex(it.rarity) <= maxIdx) total += salvage(save, it.id);
  return total;
}

export function upgradeItem(save, id) {
  const it = (save.gear || []).find((g) => g.id === id);
  if (!it || it.up >= MAX_UP) return false;
  const c = upgradeCost(it);
  if ((save.dust || 0) < c) return false;
  save.dust -= c;
  it.up++;
  return true;
}

export function rerollItem(save, id, rng = Math.random) {
  const it = (save.gear || []).find((g) => g.id === id);
  if (!it || it.stats.length < 2) return false;
  const c = rerollCost(it);
  if ((save.dust || 0) < c) return false;
  save.dust -= c;
  rerollExtras(it, rng);
  return true;
}

// Auto-equip helper for the bot and for new drops into empty slots.
export function equipIfBetter(save, item) {
  save.equipped = save.equipped || {};
  const cur = (save.gear || []).find((g) => g.id === save.equipped[item.slot]);
  if (!cur || itemPower(item) > itemPower(cur)) { save.equipped[item.slot] = item.id; return true; }
  return false;
}

// Gear found at the end of an attempt. Returns the list of new items.
export function rollDrops(save, rng, zone, { cleared, boss, first, count: forced }) {
  const out = [];
  save.pity = save.pity || 0;
  let count = 0;
  if (cleared) count = 1 + (rng() < 0.35 ? 1 : 0) + (rng() < 0.12 ? 1 : 0);
  else if (rng() < 0.2) count = 1;
  if (forced !== undefined) count = forced;
  for (let i = 0; i < count; i++) {
    let idx = rollRarity(rng, zone, false, 0);
    if (!cleared && forced === undefined) idx = Math.min(idx, 1);
    if (save.pity >= PITY_AT && idx < 2) idx = 2;
    save.pity = idx >= 2 ? 0 : save.pity + 1;
    out.push(makeItem(save, rng, zone, idx));
  }
  // The first kill of a boss always drops something good.
  if (cleared && first) {
    const idx = Math.max(2, rollRarity(rng, zone, true, 2));
    save.pity = 0;
    out.push(makeItem(save, rng, zone, idx));
  }
  for (const it of out) addItem(save, it);
  return out;
}
