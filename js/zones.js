// The world: ten regions of four zones, the enemies and bosses of the newer regions, and what marches in each wave.
// New enemies carry an `art` description which both art styles draw from (see enemyart.js for HD, foeart.js for Normal).
// Only the relative stats of an enemy matter here: how strong a wave is comes from the difficulty curve in data.js.

export const WAVES = 5;          // ordinary waves in a zone
export const BOSS_WAVE = 6;      // then the boss

const foe = (name, hp, dmg, atk, speed, range, extra, art) => ({ name, hp, dmg, atk, speed, range, radius: 10, drop: 1, team: 'enemy', noBackfill: true, art, ...extra });
const boss = (name, abil, extra, art) => ({ name, hp: 600, dmg: 18, atk: 1.2, speed: 29, range: 34, radius: 17, drop: 1, team: 'enemy', boss: true, noBackfill: true, abil, art: { bulk: 2, ...art }, ...extra });

export const NEW_ENEMIES = {
  // ---- Region 4: the Drowned Mire ----
  bogstalker: foe('Bog Stalker', 55, 9, 1.0, 48, 24, {}, { head: 'hood', hc: '#3a5a3a', cloth: '#4a6a4a', legs: '#2a3a24', skin: '#b8a878', weapon: 'dagger2' }),
  harpooner: foe('Harpooner', 42, 13, 1.8, 30, 170, { radius: 9 }, { head: 'straw', cloth: '#5a6a5a', legs: '#3a3a2a', weapon: 'spear' }),
  hexwife: foe('Hex Wife', 40, 10, 2.2, 28, 160, { radius: 9, splash: 46, shot: 'venom' }, { robe: true, head: 'pointy', hc: '#2a4a2a', cloth: '#3a5a34', trim: '#a0d060', weapon: 'staff', orb: '#a0ff60', skin: '#c0c890' }),
  mirebrute: foe('Mire Brute', 220, 16, 1.7, 26, 30, { radius: 13, cleave: 40 }, { bulk: 1, head: 'hair', hc: '#3a4a2a', cloth: '#5a5a34', chestBare: true, skin: '#a8a070', weapon: 'club', angry: true }),
  eelking: boss('The Eel King', ['leap', 'curse'], {}, { head: 'crown', cloth: '#2a5a4a', skin: '#a0b880', weapon: 'spear', cape: '#14302a', eye: '#d0ff60' }),
  mirewitch: boss('Mother Mire', ['volley', 'curse'], { summon: { type: 'bogstalker', n: 2, every: 15 }, splash: 55, shot: 'venom', range: 170 }, { robe: true, head: 'pointy', hc: '#1a3a1a', cloth: '#2a4a24', trim: '#c0e060', weapon: 'staff', orb: '#c0ff40', skin: '#b0c080' }),
  bogtroll: boss('The Bog Tyrant', ['slam', 'guard'], { hp: 800 }, { bulk: 3, head: 'horns', hc: '#4a5a2a', cloth: '#3a4a20', chestBare: true, skin: '#8a9a5a', weapon: 'club', angry: true }),
  drowned: boss('The Ferryman', ['smite', 'leap'], {}, { robe: true, head: 'hood', hc: '#18282a', cloth: '#223a3c', trim: '#80c0b0', weapon: 'halberd', skin: '#90a898', eye: '#80ffe0' }),

  // ---- Region 5: the Sunscorched Wastes ----
  dunerider: foe('Dune Raider', 60, 11, 0.8, 70, 24, {}, { head: 'mask', hc: '#c8a860', cloth: '#d8c080', legs: '#8a6a3a', weapon: 'sword' }),
  javelin: foe('Javelineer', 48, 14, 1.7, 34, 180, { radius: 9 }, { head: 'cap', hc: '#d0a040', cloth: '#e0d0a0', legs: '#8a6a3a', skin: '#b88860', weapon: 'spear' }),
  sunpriest: foe('Sun Priest', 70, 5, 2.0, 28, 140, { radius: 9, heal: { amt: 18, every: 2.4, range: 160 } }, { robe: true, head: 'mitre', hc: '#f0c040', cloth: '#f0e0b0', trim: '#e09020', weapon: 'staff', orb: '#ffd040', skin: '#b88860' }),
  guardian: foe('Tomb Warden', 260, 18, 1.5, 26, 30, { radius: 13, armor: 0.2 }, { bulk: 1, head: 'winged', hc: '#e0b040', cloth: '#b88a30', armor: 'plate', skin: '#b88860', weapon: 'halberd', shield: 'gold' }),
  scorpion: boss('The Scorpion Prince', ['leap', 'slam'], {}, { head: 'plume', hc: '#e0b040', plume: '#202020', cloth: '#6a3a1a', skin: '#b88860', weapon: 'spear', cape: '#3a1a08', shield: 'round', sh: '#d0a030' }),
  sunqueen: boss('The Sun Queen', ['smite', 'curse'], { heal: { amt: 90, every: 4, range: 220 }, range: 160 }, { robe: true, head: 'crown', cloth: '#f0c040', trim: '#fff0a0', weapon: 'staff', orb: '#ffb020', skin: '#c89870', eye: '#ff8020' }),
  sandking: boss('The Sand Colossus', ['slam', 'guard'], { hp: 850 }, { bulk: 3, head: 'greathelm', hc: '#c8a860', eye: '#ffd040', cloth: '#b89858', armor: 'plate', legs: '#8a7040', weapon: 'club' }),
  pharaoh: boss('The Last Pharaoh', ['volley', 'curse', 'smite'], { summon: { type: 'guardian', n: 1, every: 20 } }, { head: 'winged', hc: '#f0d040', cloth: '#2060a0', trim: '#f0d040', armor: 'plate', cape: '#f0c030', skin: '#c89870', weapon: 'holysword' }),

  // ---- Region 6: the Deep Holds ----
  axedwarf: foe('Dwarf Axeman', 170, 17, 1.2, 28, 26, { armor: 0.15 }, { head: 'horns', hc: '#9a9aa8', cloth: '#7a5030', armor: 'chain', beard: '#d07020', weapon: 'axe' }),
  rifleman: foe('Rifleman', 60, 22, 2.4, 26, 220, { radius: 9, shot: 'fire' }, { head: 'cap', hc: '#7a6a4a', cloth: '#4a4a5a', beard: '#8a5a30', weapon: 'crossbow' }),
  runepriest: foe('Rune Priest', 90, 6, 2.0, 26, 140, { radius: 9, heal: { amt: 22, every: 2.4, range: 160 } }, { robe: true, head: 'hood', hc: '#3a4a7a', cloth: '#4a5a8a', trim: '#80d0ff', beard: '#e0e0e8', weapon: 'staff', orb: '#80d0ff' }),
  steamguard: foe('Steam Guard', 320, 20, 1.6, 22, 30, { radius: 14, armor: 0.25, cleave: 40, heavy: true }, { bulk: 2, head: 'greathelm', hc: '#8a7a5a', eye: '#ff9030', cloth: '#9a7a4a', armor: 'plate', weapon: 'mace', shield: 'tower', sh: '#7a5a30' }),
  thane: boss('The Iron Thane', ['slam', 'guard'], { summon: { type: 'axedwarf', n: 2, every: 18 } }, { head: 'crown', cloth: '#7a2a20', armor: 'chain', beard: '#e08020', weapon: 'axe', weapon2: 'axe', cape: '#4a1008' }),
  forgemaster: boss('The Forge Master', ['volley', 'slam'], {}, { head: 'cap', hc: '#5a4a3a', cloth: '#3a2a20', armor: 'chain', beard: '#202020', weapon: 'mace', eye: '#ff7020', angry: true }),
  engine: boss('The War Engine', ['slam', 'volley', 'guard'], { hp: 900, splash: 60, shot: 'bomb', range: 190, speed: 20 }, { bulk: 3, head: 'greathelm', hc: '#6a6a74', eye: '#ffb020', cloth: '#5a5a66', armor: 'plate', legs: '#3a3a44', weapon: 'cannon' }),
  kingunder: boss('The King Under Stone', ['leap', 'smite', 'guard'], { summon: { type: 'steamguard', n: 1, every: 22 } }, { bulk: 3, head: 'crown', cloth: '#2a4a7a', armor: 'plate', beard: '#f0f0f8', weapon: 'greatsword', blade: '#a0e0ff', cape: '#10203a' }),

  // ---- Region 7: the Verdant Court ----
  bladedancer: foe('Blade Dancer', 90, 20, 0.7, 64, 24, { radius: 9, dodge: 0.3 }, { head: 'hair', hc: '#f0e090', cloth: '#3a7a4a', legs: '#24402a', weapon: 'dagger2' }),
  elfranger: foe('Elf Ranger', 55, 19, 1.5, 32, 240, { radius: 9 }, { head: 'hood', hc: '#2a5a30', cloth: '#3a6a34', legs: '#3a2a18', weapon: 'crossbow' }),
  druid: foe('Druid', 80, 14, 2.2, 28, 160, { radius: 9, splash: 50, shot: 'venom', heal: { amt: 14, every: 3, range: 150 } }, { robe: true, head: 'hood', hc: '#5a6a2a', cloth: '#6a7a3a', beard: '#c0c0a0', weapon: 'staff', orb: '#80ff80' }),
  treant: foe('Treant', 520, 28, 2.2, 18, 34, { radius: 16, cleave: 52, heavy: true }, { bulk: 2, head: 'horns', hc: '#6a4a2a', cloth: '#5a3a20', legs: '#4a3018', skin: '#7a5a34', eye: '#b0ff60', weapon: 'club' }),
  thornlady: boss('The Thorn Lady', ['curse', 'smite'], { dodge: 0.2 }, { head: 'hair', hc: '#e04060', cloth: '#2a6a3a', cape: '#7a1a3a', weapon: 'scourge', eye: '#60ff80' }),
  stag: boss('The Antlered Knight', ['leap', 'slam'], { speed: 40 }, { head: 'horns', hc: '#8a6a3a', cloth: '#4a6a2a', armor: 'plate', cape: '#24401a', weapon: 'halberd', shield: 'kite', sh: '#3a6a2a' }),
  oldroot: boss('Old Root', ['slam', 'guard', 'curse'], { hp: 900, summon: { type: 'treant', n: 1, every: 24 } }, { bulk: 3, head: 'horns', hc: '#5a4020', cloth: '#4a3018', skin: '#6a4a28', eye: '#d0ff40', weapon: 'club' }),
  elfqueen: boss('The Evergreen Queen', ['volley', 'smite', 'curse'], { heal: { amt: 120, every: 4, range: 220 }, range: 190 }, { robe: true, head: 'crown', cloth: '#e0f0d0', trim: '#60c060', weapon: 'staff', orb: '#a0ffa0', cape: '#2a7a4a', eye: '#20a060' }),

  // ---- Region 8: the Iron Empire ----
  legionary: foe('Legionary', 240, 18, 1.2, 30, 28, { armor: 0.2 }, { head: 'plume', hc: '#b0b4c0', plume: '#c02020', cloth: '#a02828', armor: 'plate', weapon: 'sword', shield: 'tower', sh: '#a02828' }),
  pyromancer: foe('Pyromancer', 80, 24, 2.3, 28, 180, { radius: 9, splash: 58, shot: 'fire' }, { robe: true, head: 'hood', hc: '#8a1a10', cloth: '#a02818', trim: '#ffb040', weapon: 'firepot' }),
  lancer: foe('Imperial Lancer', 190, 24, 1.3, 58, 34, { radius: 12 }, { bulk: 1, head: 'helm', hc: '#c0c4d0', cloth: '#6a1a20', armor: 'chain', cape: '#c02828', weapon: 'halberd' }),
  wargolem: foe('War Golem', 600, 34, 2.0, 18, 32, { radius: 16, armor: 0.25, cleave: 48, heavy: true }, { bulk: 2, head: 'greathelm', hc: '#5a5a66', eye: '#ff3030', cloth: '#4a4a56', armor: 'plate', weapon: 'mace' }),
  centurion: boss('The Centurion', ['leap', 'guard'], { summon: { type: 'legionary', n: 2, every: 18 } }, { head: 'plume', hc: '#e0c040', plume: '#c02020', cloth: '#8a1a1a', armor: 'plate', cape: '#c02020', weapon: 'sword', shield: 'tower', sh: '#c0a030' }),
  artificer: boss('The Grand Artificer', ['volley', 'curse'], { splash: 60, shot: 'bomb', range: 190, summon: { type: 'wargolem', n: 1, every: 24 } }, { robe: true, head: 'wide', hc: '#2a2a34', band: '#e0b040', cloth: '#4a3a6a', trim: '#e0b040', weapon: 'staff', orb: '#ff9040', beard: '#a0a0a8' }),
  general: boss('The Iron General', ['slam', 'leap', 'guard'], { hp: 800 }, { bulk: 3, head: 'greathelm', hc: '#3a3a46', eye: '#ffd040', crest: '#e02020', cloth: '#2a2a36', armor: 'plate', cape: '#8a1010', weapon: 'greatsword' }),
  emperor: boss('The Emperor', ['smite', 'volley', 'guard'], { summon: { type: 'lancer', n: 1, every: 16 } }, { bulk: 3, head: 'crown', cloth: '#7a1a6a', armor: 'plate', cape: '#c02080', weapon: 'holysword', trim: '#ffd040', beard: '#c0c0c8' }),

  // ---- Region 9: the Dragon Isles ----
  dragonguard: foe('Dragon Guard', 300, 26, 1.3, 32, 30, { radius: 12, armor: 0.15 }, { bulk: 1, head: 'horns', hc: '#a03020', cloth: '#7a2018', armor: 'plate', weapon: 'halberd' }),
  flamecaller: foe('Flame Caller', 100, 30, 2.4, 28, 190, { radius: 9, splash: 62, shot: 'fire' }, { robe: true, head: 'crown', cloth: '#c04010', trim: '#ffd060', weapon: 'staff', orb: '#ff7020' }),
  wyrmling: foe('Wyrmling', 140, 22, 1.2, 70, 26, { fly: true, alt: [95, 135], sprite: 'griffin' }, null),
  skyrider: foe('Sky Rider', 220, 36, 2.0, 44, 180, { radius: 14, fly: true, alt: [115, 155], splash: 46, shot: 'fire', sprite: 'wyvern' }, null),
  corsair: boss('The Corsair Admiral', ['leap', 'volley'], { dodge: 0.2 }, { head: 'wide', hc: '#14141c', band: '#e0c040', cloth: '#1a3a6a', trim: '#e0c040', cape: '#0a1a34', weapon: 'sword', weapon2: 'dagger2', beard: '#202020' }),
  dragonsage: boss('The Dragon Sage', ['smite', 'volley', 'curse'], { range: 180, splash: 60, shot: 'fire' }, { robe: true, head: 'horns', hc: '#e04020', cloth: '#a02010', trim: '#ffd060', weapon: 'staff', orb: '#ff5010', beard: '#f0f0f8' }),
  skytyrant: boss('The Sky Tyrant', ['leap', 'smite'], { fly: true, alt: [95, 125] }, { head: 'winged', hc: '#e05030', cloth: '#8a2a18', armor: 'plate', wings: '#a03820', weapon: 'halberd' }),
  dragonlord: boss('The Dragon Lord', ['slam', 'leap', 'volley'], { hp: 850, summon: { type: 'wyrmling', n: 2, every: 17 } }, { bulk: 3, head: 'horns', hc: '#c02818', cloth: '#5a0c08', armor: 'plate', cape: '#e04010', weapon: 'greatsword', blade: '#ffb060', eye: '#ffe040' }),

  // ---- Region 10: the Celestial Gate ----
  zealot: foe('Radiant Zealot', 260, 30, 0.9, 54, 26, { dodge: 0.2 }, { head: 'hair', hc: '#fff0a0', cloth: '#f8f0d0', chestBare: true, weapon: 'holysword', angry: true }),
  angel: foe('Angel', 240, 32, 1.2, 60, 28, { fly: true, alt: [95, 135], radius: 11 }, { head: 'winged', hc: '#fff6c0', cloth: '#ffffff', trim: '#e0b840', wings: '#f4f4ff', weapon: 'sword', blade: '#fff0a0' }),
  seraph: foe('Seraph', 180, 40, 2.2, 36, 200, { radius: 11, fly: true, alt: [120, 160], splash: 58 }, { robe: true, head: 'hair', hc: '#ffe060', cloth: '#fff8e8', trim: '#ffd040', wings: '#ffe8a0', weapon: 'staff', orb: '#ffffff' }),
  archon: foe('Archon', 700, 44, 1.8, 22, 34, { radius: 15, armor: 0.2, cleave: 52, heavy: true }, { bulk: 2, head: 'winged', hc: '#ffe080', cloth: '#e8e8ff', armor: 'plate', weapon: 'greatsword', blade: '#fff8c0', shield: 'gold' }),
  gatekeeper: boss('The Gatekeeper', ['slam', 'guard', 'curse'], { hp: 850 }, { bulk: 3, head: 'greathelm', hc: '#f0e0a0', eye: '#60c0ff', cloth: '#d8d0a0', armor: 'plate', weapon: 'halberd', shield: 'gold' }),
  choir: boss('The Choirmaster', ['smite', 'volley'], { heal: { amt: 160, every: 4, range: 240 }, range: 190, summon: { type: 'seraph', n: 1, every: 20 } }, { robe: true, head: 'mitre', hc: '#ffffff', cloth: '#f0f0ff', trim: '#80a0ff', wings: '#d0e0ff', weapon: 'staff', orb: '#a0c0ff' }),
  warangel: boss('The War Angel', ['leap', 'slam', 'smite'], { fly: true, alt: [95, 125] }, { head: 'winged', hc: '#ffd040', cloth: '#c8a030', armor: 'plate', wings: '#ffffff', weapon: 'holysword', angry: true }),
  highlight: boss('The First Light', ['smite', 'volley', 'guard', 'curse'], { hp: 1000, summon: { type: 'angel', n: 2, every: 18 }, heal: { amt: 200, every: 5, range: 260 } }, { bulk: 3, robe: true, head: 'crown', cloth: '#fffef0', trim: '#ffe060', wings: '#fff0b0', weapon: 'holysword', eye: '#ffb000', skin: '#fff0d8' }),
};
for (const [k, d] of Object.entries(NEW_ENEMIES)) {
  if (!d.sprite) d.sprite = k;
  if (d.art) { if (d.boss) d.size = d.art.bulk >= 3 ? 8 : 7; else d.size = d.art.bulk >= 2 ? 6 : d.art.bulk === 1 ? 5 : 4; }
}

// ---- What marches in each wave ----
// A roster entry is [type, weight, first wave it appears in]. Weights say how common it is.
const Z = (id, region, name, blurb, boss, roster, specials = {}) => ({ id, region, name, blurb, waves: WAVES, boss, roster, specials });

export const ZONES = [
  Z(1, 1, 'Graveyard Fields', 'Peasants stumble in from the village.', 'champion', [['peasant', 1, 1]]),
  Z(2, 1, 'Burned Farmstead', 'The militia has taken up spears.', 'captain', [['peasant', 5, 1], ['militia', 3, 1], ['firebrand', 1, 4]]),
  Z(3, 1, 'Chapel Hill', 'Slingers and firebrands pelt your horde.', 'priest', [['peasant', 3, 1], ['militia', 3, 1], ['slinger', 2, 1], ['firebrand', 1, 2]]),
  Z(4, 1, 'Castle Gatehouse', 'Armoured knights hold the gate.', 'commander', [['militia', 4, 1], ['slinger', 2, 1], ['knight', 2, 1], ['firebrand', 1, 2], ['flagellant', 1, 4]]),

  Z(5, 2, 'Pilgrim Road', 'Crusaders and crossbowmen march to purge you.', 'inquisitor', [['militia', 3, 1], ['crusader', 3, 1], ['crossbow', 2, 1], ['flagellant', 1, 3], ['firebrand', 1, 2]]),
  Z(6, 2, 'Cathedral Steps', 'Clerics mend the wounded, and griffins circle.', 'templar', [['crusader', 4, 1], ['crossbow', 2, 1], ['cleric', 1, 2], ['griffin', 1, 3], ['flagellant', 1, 2]], { 4: 'gryphonlord' }),
  Z(7, 2, 'Hallowed Ground', 'Paladins in blessed plate hold the line.', 'archbishop', [['crusader', 4, 1], ['crossbow', 2, 1], ['cleric', 1, 1], ['paladin', 1, 3], ['griffin', 1, 2], ['flagellant', 1, 2]], { 3: 'bombard', 5: 'gryphonlord' }),
  Z(8, 2, 'The Holy Citadel', 'The last bastion of the faithful.', 'avenger', [['crusader', 3, 1], ['crossbow', 2, 1], ['cleric', 1, 1], ['paladin', 2, 2], ['griffin', 2, 2], ['flagellant', 1, 1]], { 3: 'bombard', 5: 'gryphonlord' }),

  Z(9, 3, 'Frostbitten Pass', 'Berserkers charge out of the blizzard.', 'herodawn', [['berserker', 4, 1], ['crossbow', 2, 1], ['crusader', 2, 1], ['cleric', 1, 2], ['flagellant', 1, 3]], { 4: 'bombard' }),
  Z(10, 3, "Wizard's Tower", 'Archmages rain ruin from the battlements.', 'supreme', [['berserker', 3, 1], ['archmage', 2, 1], ['crusader', 2, 1], ['cleric', 1, 2], ['wyvern', 1, 3]], { 3: 'bombard', 5: 'frostwyrm' }),
  Z(11, 3, "Dragon's Rest", 'Assassins slip through the dark, and sentinels bar the way.', 'slayer', [['assassin', 3, 1], ['sentinel', 1, 2], ['berserker', 2, 1], ['archmage', 2, 1], ['wyvern', 1, 2]], { 4: 'frostwyrm', 5: 'bombard' }),
  Z(12, 3, "The Hero's Throne", 'Every hero in the land has gathered to end you.', 'herokind', [['assassin', 2, 1], ['sentinel', 2, 1], ['berserker', 3, 1], ['archmage', 2, 1], ['cleric', 1, 1], ['wyvern', 1, 2]], { 3: 'bombard', 5: 'frostwyrm' }),

  Z(13, 4, 'Reedwater', 'Things with knives wait in the reeds.', 'eelking', [['bogstalker', 4, 1], ['harpooner', 2, 1], ['militia', 2, 1], ['mirebrute', 1, 3]]),
  Z(14, 4, 'The Sinking Village', 'Hex wives brew something foul.', 'mirewitch', [['bogstalker', 3, 1], ['harpooner', 2, 1], ['hexwife', 2, 2], ['mirebrute', 1, 2]]),
  Z(15, 4, 'Trollmire', 'The brutes of the deep bog.', 'bogtroll', [['mirebrute', 3, 1], ['bogstalker', 3, 1], ['hexwife', 1, 1], ['harpooner', 2, 1], ['cleric', 1, 3]]),
  Z(16, 4, 'The Black Ferry', 'No one crosses without paying.', 'drowned', [['bogstalker', 3, 1], ['mirebrute', 2, 1], ['hexwife', 2, 1], ['harpooner', 2, 1], ['assassin', 1, 3]], { 4: 'bombard' }),

  Z(17, 5, 'Glass Dunes', 'Raiders ride out of the heat haze.', 'scorpion', [['dunerider', 4, 1], ['javelin', 3, 1], ['sunpriest', 1, 3]]),
  Z(18, 5, 'Oasis of Dawn', 'The sun priests keep their warriors standing.', 'sunqueen', [['dunerider', 3, 1], ['javelin', 2, 1], ['sunpriest', 2, 1], ['guardian', 1, 3]]),
  Z(19, 5, 'The Buried City', 'Wardens wake among the ruins.', 'sandking', [['guardian', 3, 1], ['dunerider', 3, 1], ['javelin', 2, 1], ['sunpriest', 1, 1], ['hexwife', 1, 3]]),
  Z(20, 5, 'Valley of Kings', 'The living guard their dead jealously.', 'pharaoh', [['guardian', 3, 1], ['dunerider', 2, 1], ['javelin', 2, 1], ['sunpriest', 2, 1], ['pyromancer', 1, 3]], { 4: 'bombard' }),

  Z(21, 6, 'Foothill Mines', 'Short, stubborn and heavily armed.', 'thane', [['axedwarf', 4, 1], ['rifleman', 2, 1], ['runepriest', 1, 3]]),
  Z(22, 6, 'The Great Forge', 'The furnaces never cool.', 'forgemaster', [['axedwarf', 3, 1], ['rifleman', 2, 1], ['runepriest', 1, 2], ['steamguard', 1, 3]], { 4: 'bombard' }),
  Z(23, 6, 'Engine Yards', 'Iron and steam march to war.', 'engine', [['steamguard', 2, 1], ['axedwarf', 3, 1], ['rifleman', 3, 1], ['runepriest', 1, 1]], { 3: 'bombard', 5: 'bombard' }),
  Z(24, 6, 'Hall Under Stone', 'The mountain king will not yield.', 'kingunder', [['steamguard', 2, 1], ['axedwarf', 4, 1], ['rifleman', 3, 1], ['runepriest', 2, 1], ['flagellant', 1, 2]], { 3: 'bombard', 5: 'bombard' }),

  Z(25, 7, 'Whispering Wood', 'You will not see the blades until too late.', 'thornlady', [['bladedancer', 3, 1], ['elfranger', 3, 1], ['druid', 1, 3]]),
  Z(26, 7, 'The Hunting Grounds', 'Rangers and griffins hunt your dead.', 'stag', [['bladedancer', 3, 1], ['elfranger', 3, 1], ['druid', 1, 1], ['griffin', 2, 2]], { 4: 'gryphonlord' }),
  Z(27, 7, 'The Elder Grove', 'The trees themselves march.', 'oldroot', [['treant', 2, 1], ['druid', 2, 1], ['bladedancer', 3, 1], ['elfranger', 2, 1]]),
  Z(28, 7, 'The Evergreen Throne', 'The queen of the wood awaits.', 'elfqueen', [['treant', 2, 1], ['druid', 2, 1], ['bladedancer', 3, 1], ['elfranger', 3, 1], ['griffin', 1, 2]], { 4: 'gryphonlord' }),

  Z(29, 8, 'The Border Forts', 'Shields locked, the Empire advances.', 'centurion', [['legionary', 4, 1], ['rifleman', 2, 1], ['pyromancer', 1, 2], ['lancer', 1, 3]]),
  Z(30, 8, 'The Foundry City', 'War golems roll off the line.', 'artificer', [['legionary', 3, 1], ['pyromancer', 2, 1], ['wargolem', 1, 2], ['runepriest', 1, 1], ['rifleman', 2, 1]], { 4: 'bombard' }),
  Z(31, 8, 'The Iron Road', 'Lancers charge without end.', 'general', [['lancer', 4, 1], ['legionary', 3, 1], ['pyromancer', 2, 1], ['sunpriest', 1, 2], ['wargolem', 1, 3]], { 3: 'bombard' }),
  Z(32, 8, 'The Imperial Palace', 'The whole army stands between you and the throne.', 'emperor', [['legionary', 3, 1], ['lancer', 3, 1], ['pyromancer', 2, 1], ['wargolem', 2, 1], ['runepriest', 1, 1]], { 3: 'bombard', 5: 'bombard' }),

  Z(33, 9, "Smugglers' Cove", 'Fire and steel on the black sand.', 'corsair', [['dragonguard', 3, 1], ['assassin', 2, 1], ['flamecaller', 1, 2], ['wyrmling', 2, 2]]),
  Z(34, 9, 'The Ember Temple', 'The flame callers chant day and night.', 'dragonsage', [['dragonguard', 3, 1], ['flamecaller', 3, 1], ['sunpriest', 1, 1], ['wyrmling', 2, 1], ['skyrider', 1, 3]]),
  Z(35, 9, 'The Roost', 'The sky is full of wings.', 'skytyrant', [['wyrmling', 3, 1], ['skyrider', 2, 1], ['dragonguard', 3, 1], ['flamecaller', 2, 1]], { 4: 'frostwyrm' }),
  Z(36, 9, 'Mount Cinder', 'The Dragon Lord holds the last isle.', 'dragonlord', [['dragonguard', 4, 1], ['flamecaller', 2, 1], ['skyrider', 2, 1], ['wyrmling', 2, 1], ['wargolem', 1, 2]], { 3: 'bombard', 5: 'frostwyrm' }),

  Z(37, 10, 'The Shining Stair', 'The faithful climb to meet you.', 'gatekeeper', [['zealot', 4, 1], ['angel', 2, 1], ['cleric', 1, 1], ['archon', 1, 3]]),
  Z(38, 10, 'Hall of Hymns', 'Their song mends every wound.', 'choir', [['zealot', 3, 1], ['seraph', 2, 1], ['angel', 2, 1], ['sunpriest', 2, 1], ['archon', 1, 2]]),
  Z(39, 10, 'The Armoury of Heaven', 'The host takes up its weapons.', 'warangel', [['archon', 2, 1], ['angel', 3, 1], ['seraph', 2, 1], ['zealot', 3, 1]], { 3: 'bombard', 5: 'gryphonlord' }),
  Z(40, 10, 'The Celestial Gate', 'Beyond this gate there is nothing left to conquer.', 'highlight', [['archon', 3, 1], ['angel', 3, 1], ['seraph', 3, 1], ['zealot', 3, 1], ['runepriest', 1, 1]], { 3: 'bombard', 5: 'frostwyrm' }),

  { id: 41, region: 11, name: 'The Endless Crypt', blurb: 'The living pour in forever. How long can you hold?', waves: Infinity, boss: null, endless: true,
    roster: [['crusader', 4, 1], ['assassin', 2, 1], ['berserker', 2, 1], ['archmage', 1, 3], ['cleric', 1, 4], ['sentinel', 1, 5], ['flagellant', 1, 6], ['wyvern', 1, 8], ['griffin', 1, 5], ['bombard', 1, 10], ['legionary', 2, 14], ['treant', 1, 18], ['angel', 2, 24]], specials: {} },
];
export const ENDLESS_ID = 41;
export const LAST_ZONE = 40;

export const REGIONS = [
  { id: 1, name: 'The Greenmarch', theme: 'graveyard' },
  { id: 2, name: 'The Crusader Reach', theme: 'holy' },
  { id: 3, name: "The Heroes' Reach", theme: 'frost' },
  { id: 4, name: 'The Drowned Mire', theme: 'mire' },
  { id: 5, name: 'The Sunscorched Wastes', theme: 'desert' },
  { id: 6, name: 'The Deep Holds', theme: 'deep' },
  { id: 7, name: 'The Verdant Court', theme: 'forest' },
  { id: 8, name: 'The Iron Empire', theme: 'empire' },
  { id: 9, name: 'The Dragon Isles', theme: 'ember' },
  { id: 10, name: 'The Celestial Gate', theme: 'heaven' },
  { id: 11, name: 'The Endless Crypt', theme: 'graveyard' },
];
for (const r of REGIONS) r.zones = ZONES.filter((z) => z.region === r.id).map((z) => z.id);

// How many enemies march in a wave. Waves are long: they arrive in several surges.
export const waveSize = (zone, wave) => (zone.endless ? Math.min(60, 14 + wave * 2) : 12 + wave * 4 + Math.min(10, Math.floor(zone.id / 4)));

// The enemies of one wave, shared out by weight in a fixed way (the order is shuffled when they spawn).
export function composeWave(zone, wave) {
  if (!zone.endless && wave >= BOSS_WAVE) wave = 3;      // the boss comes with an escort like a middle wave
  const open = zone.roster.filter((r) => r[2] <= wave);
  const total = open.reduce((a, r) => a + r[1], 0);
  const n = waveSize(zone, wave), list = [];
  const credit = open.map(() => 0);
  for (let i = 0; i < n; i++) {
    let best = 0;
    for (let k = 0; k < open.length; k++) { credit[k] += open[k][1] / total; if (credit[k] > credit[best]) best = k; }
    credit[best] -= 1;
    list.push(open[best][0]);
  }
  const sp = zone.specials[wave];
  if (sp) list.push(sp);
  return list;
}
