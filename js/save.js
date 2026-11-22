const KEY = 'necro_save_v1';

export function defaultSave() {
  return { souls: 0, champSouls: 0, nodes: {}, cleared: {}, bestZone: 0, essence: 0, rebirths: 0, perks: {}, bestEver: 0, lastSeen: Date.now(),
    gear: [], equipped: {}, dust: 0, pity: 0, gearSeq: 0, stats: {}, ach: {}, seenGear: 0, seenAch: 0 };
}

// Older saves had flat upgrades and archers unlocked by clearing zone 1.
function migrate(s, raw) {
  if (s.upgrades) {
    s.nodes = s.nodes || {};
    for (const [k, v] of Object.entries(s.upgrades)) s.nodes[(k === 'raise' ? 'rise' : k) + '_zombie'] = v;
    delete s.upgrades;
  }
  // Only saves from before zones were tracked individually (no cleared map) need this.
  if (s.bestZone >= 1 && !raw.cleared) {
    s.cleared = s.cleared || {};
    for (let z = 1; z <= s.bestZone; z++) s.cleared[z] = true;
    if (!s.nodes.unit_archer) s.nodes.unit_archer = 1;
  }
  return s;
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const parsed = JSON.parse(raw); return migrate(Object.assign(defaultSave(), parsed), parsed); }
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
