const KEY = 'necro_save_v1';

export function defaultSave() {
  return { souls: 0, upgrades: { raise: 0, hp: 0, dmg: 0 }, bestZone: 0, lastSeen: Date.now() };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return Object.assign(defaultSave(), JSON.parse(raw));
  } catch (e) { /* ignore */ }
  return defaultSave();
}

export function writeSave(save) {
  try {
    save.lastSeen = Date.now();
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch (e) { /* ignore */ }
}
