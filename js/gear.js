// Gear: random drops with rarity, rolled stats and special effects. Pure logic, no DOM, no imports from data.js
// (data.js imports this file to fold gear into the game's multipliers).

export const RARITIES = [
  { id: 'common',    name: 'Common',    color: '#b8b0c8', mult: 1,   extras: 0, dust: 2,  weight: 60 },
  { id: 'magic',     name: 'Magic',     color: '#5aa8ff', mult: 1.25, extras: 1, dust: 5,  weight: 27 },
  { id: 'rare',      name: 'Rare',      color: '#f0d050', mult: 1.55, extras: 2, dust: 12, weight: 10 },
  { id: 'epic',      name: 'Epic',      color: '#c070f0', mult: 1.95, extras: 3, dust: 30, weight: 2.6 },
  { id: 'legendary', name: 'Legendary', color: '#ff9030', mult: 2.5, extras: 3, dust: 80, weight: 0.4 },
];

// Necromancer's gear: a staff, robes, a tome and a familiar (a crawling hand). Slot keys stay as they were in older saves.
export const SLOTS = ['weapon', 'armour', 'charm', 'familiar'];
export const SLOT_NAMES = { weapon: 'Staff', armour: 'Robes', charm: 'Tome', familiar: 'Familiar' };

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
export const SLOT_MAIN = { weapon: 'dmg', armour: 'hp', charm: 'souls', familiar: 'rise' };
const EXTRA_POOL = { weapon: ['crit', 'lifesteal', 'rise', 'spell', 'hp'], armour: ['thorns', 'rise', 'souls', 'dmg', 'spell'], charm: ['rise', 'spell', 'dmg', 'hp', 'crit', 'lifesteal', 'thorns'], familiar: ['spell', 'crit', 'lifesteal', 'thorns', 'souls', 'dmg', 'hp'] };

// Special effects on Epic (sometimes) and Legendary (always) items.
export const GEAR_FX = {
  martyr: { name: 'Martyr',   desc: 'Your dying minions explode, hurting nearby enemies.' },
  frenzy: { name: 'Frenzy',   desc: 'Minions below half health attack 30% faster.' },
  reaper: { name: 'Reaper',   desc: 'Kills have a 12% chance to raise a free zombie.' },
  bulwark:{ name: 'Bulwark',  desc: 'Your summons take 10% less damage.' },
};
const FX_KEYS = Object.keys(GEAR_FX);

const BASES = {
  weapon:   ['Gnarled Stick', 'Bone Staff', 'Soul Staff', 'Lich Scepter'],
  armour:   ['Tattered Shroud', 'Grave Robes', 'Wraith Mantle', 'Void Vestments'],
  charm:    ['Mouldy Journal', 'Book of Bones', 'Grimoire of Souls', 'The Necronomicon'],
  familiar: ['Severed Hand', 'Skeletal Hand', 'Crawling Claw', 'Ghostly Hand'],
};
// Gear is meant to feel earned: the best rarity a zone can drop climbs slowly, and the power stays with your summons.
export const rarityCap = (zone) => (zone <= 4 ? 0 : zone <= 10 ? 1 : zone <= 18 ? 2 : zone <= 28 ? 3 : 4);
const CAP_ODDS = [[100], [72, 28], [58, 30, 12], [46, 30, 17, 7], [40, 30, 20, 8, 2]];
const GEAR_POWER = 0.75;
const PREFIX = {
  common: [''],
  magic: ['Sturdy', 'Keen', 'Gilded', 'Sombre'],
  rare: ['Cursed', 'Blighted', 'Grim', 'Hallowed'],
  epic: ['Dread', 'Ancient', 'Abyssal', 'Wailing'],
  legendary: ["Death's", "The Lich King's", 'Eternal', 'Worldending'],
};
export const MAX_UP = 10;
export const MAX_ITEMS = 60;
export const PITY_AT = 10;         // drops below the zone's best rarity before one is guaranteed

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
  const push = 1 + 0.025 * zone + (boss ? 0.8 : 0);
  const w = RARITIES.map((r, i) => (i < minIndex ? 0 : r.weight * (i === 0 ? 1 : Math.pow(push, i))));
  let t = rng() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) { t -= w[i]; if (t <= 0) return i; }
  return minIndex;
}

export function makeItem(save, rng, zone, rarityIdx, slot) {
  const R = RARITIES[rarityIdx];
  slot = slot || pick(rng, SLOTS);
  const scale = 1 + 0.025 * (zone - 1);
  const roll = () => 0.8 + rng() * 0.4;
  const stats = [{ k: SLOT_MAIN[slot], v: STAT_DEFS[SLOT_MAIN[slot]].base * R.mult * scale * roll() * GEAR_POWER }];
  const pool = EXTRA_POOL[slot].filter((k) => k !== SLOT_MAIN[slot]);
  for (let i = 0; i < R.extras && pool.length; i++) {
    const k = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    stats.push({ k, v: STAT_DEFS[k].base * R.mult * scale * roll() * 0.6 * GEAR_POWER });
  }
  let fx = null;
  if (rarityIdx === 4 || (rarityIdx === 3 && rng() < 0.4)) fx = pick(rng, FX_KEYS);
  const tier = Math.min(3, Math.floor((zone - 1) / 10));
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
  const scale = 1 + 0.025 * (item.zone - 1);
  const pool = EXTRA_POOL[item.slot].filter((k) => k !== main.k);
  item.stats = [main];
  for (let i = 0; i < R.extras && pool.length; i++) {
    const k = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    item.stats.push({ k, v: STAT_DEFS[k].base * R.mult * scale * (0.8 + rng() * 0.4) * 0.6 * GEAR_POWER });
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

export function wornItem(save, slot) {
  return (save.gear || []).find((g) => g.id === (save.equipped || {})[slot]) || null;
}
// Sum of (rarity + 1) over the worn pieces: drives the necromancer's rank.
export function gearScore(save) {
  let n = 0;
  for (const slot of SLOTS) { const it = wornItem(save, slot); if (it) n += rarityIndex(it.rarity) + 1; }
  return n;
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
    if (eq.includes(it.id) || it.locked) continue;
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
  if (it.locked) return 0;
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
// Drops are rare: a clear has a 40% chance of one piece, a defeat 5%, and the first clear of a zone always drops one at the
// best rarity that zone allows. What can drop is capped by the zone (see rarityCap).
function rollIdx(rng, cap) {
  let t = rng() * 100;
  const odds = CAP_ODDS[cap];
  for (let i = 0; i < odds.length; i++) { t -= odds[i]; if (t <= 0) return i; }
  return 0;
}
export function rollDrops(save, rng, zone, { cleared, first, count: forced }) {
  const out = [];
  const cap = rarityCap(zone);
  const top = Math.min(cap, 3);        // pity never forces a Legendary
  save.pity = save.pity || 0;
  let count = cleared ? (rng() < 0.4 ? 1 : 0) : (rng() < 0.05 ? 1 : 0);
  if (forced !== undefined) count = forced;
  for (let i = 0; i < count; i++) {
    let idx = rollIdx(rng, cap);
    if (!cleared && forced === undefined) idx = Math.min(idx, 1);
    if (cap >= 1 && save.pity >= PITY_AT) idx = Math.max(idx, top);
    save.pity = cap >= 1 && idx >= top ? 0 : save.pity + 1;
    out.push(makeItem(save, rng, zone, idx));
  }
  if (cleared && first) {
    const idx = cap === 4 ? (zone >= 36 ? 4 : 3) : cap;
    save.pity = 0;
    out.push(makeItem(save, rng, zone, idx));
  }
  for (const it of out) addItem(save, it);
  return out;
}
