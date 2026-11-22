const KEY = 'necro_save_v1';

export function defaultSave() {
  return { souls: 0, champSouls: 0, nodes: {}, cleared: {}, bestZone: 0, lastSeen: Date.now() };
}

// Older saves had flat upgrades and archers unlocked by clearing zone 1.
function migrate(s) {
  if (s.upgrades) {
    s.nodes = s.nodes || {};
    for (const [k, v] of Object.entries(s.upgrades)) s.nodes[(k === 'raise' ? 'rise' : k) + '_zombie'] = v;
    delete s.upgrades;
  }
  if (s.bestZone >= 1) {
    s.cleared = s.cleared || {};
    for (let z = 1; z <= s.bestZone; z++) s.cleared[z] = true;
    if (!s.nodes.unit_archer) s.nodes.unit_archer = 1;
  }
  return s;
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(Object.assign(defaultSave(), JSON.parse(raw)));
  } catch (e) { /* ignore */ }
  return defaultSave();
}

export function writeSave(save) {
  try {
    save.lastSeen = Date.now();
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch (e) { /* ignore */ }
}
