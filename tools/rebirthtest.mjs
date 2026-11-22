// Quick check of the rebirth rules: node tools/rebirthtest.mjs
import { rebirth, buyPerk, Battle } from '../js/sim.js';
import { defaultSave } from '../js/save.js';
import { essenceGain, canRebirth, perk, owned, level } from '../js/data.js';

const s = defaultSave();
console.log('can rebirth fresh:', canRebirth(s));
Object.assign(s, { souls: 500, champSouls: 3, bestZone: 4, cleared: { 1: true, 2: true, 3: true, 4: true }, nodes: { unit_archer: 1, unit_skeleton: 1, hp_zombie: 8, dmg_zombie: 6 } });
console.log('gain preview:', essenceGain(s));
const gain = rebirth(s);
console.log('gain', gain, 'essence', s.essence, 'rebirths', s.rebirths, 'souls', s.souls, 'nodes', JSON.stringify(s.nodes), 'cleared', JSON.stringify(s.cleared), 'bestZone', s.bestZone, 'bestEver', s.bestEver);
for (const k of ['horde', 'pact', 'conquest', 'head']) while (buyPerk(s, k)) { /* spend */ }
console.log('perks', JSON.stringify(s.perks), 'essence left', s.essence);
Object.assign(s, { souls: 0, bestZone: 4, cleared: { 1: true, 2: true, 3: true, 4: true }, nodes: { unit_archer: 1, unit_skeleton: 1 } });
const g2 = rebirth(s);
console.log('second gain', g2, 'kept nodes', JSON.stringify(s.nodes), 'cleared', JSON.stringify(s.cleared), 'bestZone', s.bestZone);
console.log('zombie hp level floor', level(s, 'hp', 'zombie'));
const b = new Battle(s, 1);
console.log('starting zombies', b.alive('player', 'zombie'), 'spell ready', b.spellReady());
b.spellCd = 0; console.log('cast', b.castSpell(), 'horde', b.alive('player'));
