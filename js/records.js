// Achievements: milestones that pay a reward once. Progress is read from save.stats and the rest of the save.
import { PLAYER_UNITS, DEFENCE_KEYS, owned, defLevel } from './data.js';

const st = (s, k) => (s.stats && s.stats[k]) || 0;

// Each has an id, a name, a goal text, a progress function giving [now, goal], and a reward { dust | champ | essence }.
export const ACHIEVEMENTS = [
  { id: 'blood',    name: 'First Blood',      desc: 'Kill an enemy',                  prog: (s) => [st(s, 'kills'), 1],        reward: { dust: 5 } },
  { id: 'dead100',  name: 'Gravedigger',      desc: 'Kill 100 enemies',               prog: (s) => [st(s, 'kills'), 100],      reward: { dust: 15 } },
  { id: 'dead1k',   name: 'Massacre',         desc: 'Kill 1,000 enemies',             prog: (s) => [st(s, 'kills'), 1000],     reward: { champ: 1 } },
  { id: 'dead10k',  name: 'Plague of Death',  desc: 'Kill 10,000 enemies',            prog: (s) => [st(s, 'kills'), 10000],    reward: { essence: 5 } },
  { id: 'win1',     name: 'First Victory',    desc: 'Clear a zone',                   prog: (s) => [st(s, 'clears'), 1],       reward: { dust: 5 } },
  { id: 'win25',    name: 'Relentless',       desc: 'Clear zones 25 times',           prog: (s) => [st(s, 'clears'), 25],      reward: { dust: 30 } },
  { id: 'try25',    name: 'Never Give Up',    desc: 'Make 25 attempts',               prog: (s) => [st(s, 'attempts'), 25],    reward: { dust: 20 } },
  { id: 'try100',   name: 'Stubborn Dead',    desc: 'Make 100 attempts',              prog: (s) => [st(s, 'attempts'), 100],   reward: { champ: 1 } },
  { id: 'zone4',    name: 'Gatekeeper',       desc: 'Conquer the Greenmarch (zone 4)', prog: (s) => [Math.max(s.bestZone, s.bestEver || 0), 4],  reward: { dust: 25 } },
  { id: 'zone8',    name: 'Crusade Crusher',  desc: 'Conquer the Crusader Reach (zone 8)', prog: (s) => [Math.max(s.bestZone, s.bestEver || 0), 8],  reward: { champ: 1 } },
  { id: 'zone12',   name: 'Hero Slayer',      desc: "Conquer the Heroes' Reach (zone 12)", prog: (s) => [Math.max(s.bestZone, s.bestEver || 0), 12], reward: { essence: 10 } },
  { id: 'gear10',   name: 'Scavenger',        desc: 'Find 10 pieces of gear',         prog: (s) => [st(s, 'gearFound'), 10],   reward: { dust: 15 } },
  { id: 'gear50',   name: 'Hoarder',          desc: 'Find 50 pieces of gear',         prog: (s) => [st(s, 'gearFound'), 50],   reward: { dust: 60 } },
  { id: 'epic',     name: 'Purple Haze',      desc: 'Find an Epic item',              prog: (s) => [st(s, 'epics'), 1],        reward: { dust: 40 } },
  { id: 'legend',   name: 'Legend Hunter',    desc: 'Find a Legendary item',          prog: (s) => [st(s, 'legendaries'), 1],  reward: { champ: 1 } },
  { id: 'upgrade5', name: 'Reforged',         desc: 'Upgrade an item to +5',          prog: (s) => [Math.max(0, ...(s.gear || []).map((g) => g.up)), 5],  reward: { dust: 30 } },
  { id: 'fort',     name: 'Fortress',         desc: 'Own a wall, a trap and a tower', prog: (s) => [DEFENCE_KEYS.filter((k) => defLevel(s, k) > 0).length, 3], reward: { dust: 25 } },
  { id: 'roster',   name: 'Full Roster',      desc: 'Own all seven summons',          prog: (s) => [PLAYER_UNITS.filter((u) => owned(s, u)).length, PLAYER_UNITS.length], reward: { champ: 1 } },
  { id: 'reborn1',  name: 'Born Again',       desc: 'Rebirth once',                   prog: (s) => [s.rebirths || 0, 1],       reward: { champ: 1 } },
  { id: 'reborn5',  name: 'Cycle of Death',   desc: 'Rebirth five times',             prog: (s) => [s.rebirths || 0, 5],       reward: { essence: 15 } },
  { id: 'rich',     name: 'Soul Merchant',    desc: 'Bank 10,000 souls in total',     prog: (s) => [st(s, 'soulsEarned'), 10000], reward: { dust: 40 } },
];

export function rewardText(r) {
  const out = [];
  if (r.dust) out.push(r.dust + ' bone dust');
  if (r.champ) out.push(r.champ + ' champion soul' + (r.champ > 1 ? 's' : ''));
  if (r.essence) out.push(r.essence + ' essence');
  return out.join(', ');
}

export const isDone = (save, a) => !!(save.ach && save.ach[a.id]);

// Award anything newly earned. Returns the list of achievements unlocked just now.
export function checkAchievements(save) {
  save.ach = save.ach || {};
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (save.ach[a.id]) continue;
    const [now, goal] = a.prog(save);
    if (now < goal) continue;
    save.ach[a.id] = true;
    if (a.reward.dust) save.dust = (save.dust || 0) + a.reward.dust;
    if (a.reward.champ) save.champSouls += a.reward.champ;
    if (a.reward.essence) save.essence = (save.essence || 0) + a.reward.essence;
    fresh.push(a);
  }
  return fresh;
}
