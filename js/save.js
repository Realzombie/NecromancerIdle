const KEY = 'necro_save_v2';        // v2: the long game rebuild starts everyone afresh

export function defaultSave() {
  return { souls: 0, champSouls: 0, nodes: {}, cleared: {}, bestZone: 0, essence: 0, rebirths: 0, perks: {}, bestEver: 0, lastSeen: Date.now(),
    gear: [], equipped: {}, dust: 0, pity: 0, gearSeq: 0, stats: {}, ach: {}, seenGear: 0, seenAch: 0, seen: {}, bounties: [], bountyDone: 0, log: [], rlog: [], progress: {}, army: {}, skipped: 0 };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const parsed = JSON.parse(raw); return Object.assign(defaultSave(), parsed); }
  } catch (e) { /* ignore */ }
  return defaultSave();
}

// Wipe progress in place (other modules hold a reference to the same object).
export function resetSave(save) {
  for (const k of Object.keys(save)) delete save[k];
  Object.assign(save, defaultSave());
  try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
}

export function writeSave(save) {
  try {
    save.lastSeen = Date.now();
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch (e) { /* ignore */ }
}
