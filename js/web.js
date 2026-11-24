// The skill web: a pannable, zoomable map. Every owned summon shows all its upgrades; tap any node to read it and buy it.
import {
  UNITS, STATS, TIER, TIER_NAMES, SPECIALS, SPECIAL_KEYS, PLAYER_UNITS, NECRO_TIERS,
  owned, level, statCost, statEffect, tiersDone, hasSpecial, specialReady, lookOf, necroTier, playerRating,
  UNIT_TREE, gateProgress, gateMet, unitVisible, spellUnlocked, SPELL_UNLOCK_COST, UNIT_REBIRTH, LEGION_MULT, unitRebirthOk, statNeeds, rebirthsOf, legionReady, legionOwned, legionCost,
} from './data.js';
import { buyUnit, buyStat, buySpecial, buyLegion } from './sim.js';
import { iconCanvas, lookCanvas } from './render.js';


export function createWeb({ save, play, onChange }) {
  const root = document.getElementById('web');
  const world = document.getElementById('web-world');
  const panel = document.getElementById('web-panel');
    let selected = null;
  let view = { x: 0, y: 0, s: 0.75 };
  let centered = false;
  let dragged = false;

  const applyView = () => { world.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.s})`; };
  function recenter() {
    view.s = 0.3;
    view.x = root.clientWidth / 2;
    view.y = root.clientHeight * 0.66;
    applyView();
  }
  function zoom(f, cx = root.clientWidth / 2, cy = root.clientHeight / 2) {
    const s = Math.max(0.2, Math.min(1.6, view.s * f));
    view.x = cx - ((cx - view.x) * s) / view.s;
    view.y = cy - ((cy - view.y) * s) / view.s;
    view.s = s;
    applyView();
  }

  // ---- Layout ----
  // Every owned summon shows all of its upgrades at once, in its own pod, so nothing overlaps:
  //   the summon at the top, then a row of [HP | Rise Faster | Damage], with each chain running straight down its column
  //   and the special abilities in the middle column below. Summons chain outwards from the necromancer (left for the
  //   zombie line, right for the skeleton line); Plague Bearer and Death Knight hang above their parents.
  const COL = 180, ROW = 150;
  // Fixed positions (they never move when you buy things). Pods of owned summons hang down from their summon, or grow
  // upwards for the ones marked up, so the web spreads out in every direction without lines crossing a pod.
  const LAYOUT = {
    zombie: { from: 'hub', x: -340, y: 0 }, skeleton: { from: 'hub', x: 340, y: 0 },
    hound: { from: 'zombie', x: -870, y: 0 }, archer: { from: 'skeleton', x: 870, y: 0 },
    plaguebearer: { from: 'zombie', x: -340, y: -330, up: true }, deathknight: { from: 'skeleton', x: 340, y: -330, up: true },
    abomination: { from: 'hound', x: -870, y: -330, up: true }, mage: { from: 'archer', x: 870, y: -330, up: true },
    gargoyle: { from: 'abomination', x: -1400, y: -330, up: true }, ghost: { from: 'mage', x: 1400, y: -330, up: true },
    gravepriest: { from: 'ghost', x: 1930, y: -330, up: true },
  };
  function build() {
    const nodes = [], links = [];
    const add = (n) => { nodes.push(n); return n; };
    const hub = add({ id: 'hub', x: 0, y: 0, kind: 'hub' });
    links.push([hub, add({ id: 'unlock:spell', x: 0, y: 150, kind: 'unlock' })]);
    const un = { hub };
    for (const u of Object.keys(LAYOUT)) {
      if (!PLAYER_UNITS.includes(u) || !unitVisible(save, u)) continue;
      const L = LAYOUT[u], p = un[L.from];
      if (!p) continue;
      un[u] = add({ id: 'unit:' + u, x: L.x, y: L.y, kind: 'unit', unit: u });
      links.push([p, un[u]]);
    }
    for (const u of Object.keys(un)) {
      if (u === 'hub' || !owned(save, u)) continue;
      const { x, y } = un[u], sg = LAYOUT[u].up ? -1 : 1;
      links.push([un[u], add({ id: 'rise:' + u, x, y: y + sg * ROW, kind: 'stat', stat: 'rise', unit: u, tier: 0 })]);
      const first = {};
      for (const [stat, dir] of [['hp', -1], ['dmg', 1]]) {
        const L = level(save, stat, u);
        let prev = un[u];
        for (let k = 0; k < TIER.count; k++) {
          if (k > 0 && L < (k - 1) * TIER.levels + 1) break;   // the next step appears once the one before has a point in it
          const n = add({ id: stat + ':' + u + ':' + k, x: x + dir * COL, y: y + sg * ROW * (k + 1), kind: 'stat', stat, unit: u, tier: k });
          links.push([prev, n]);
          if (k === 0) first[stat] = n;
          prev = n;
        }
      }
      if (legionReady(save, u)) links.push([nodes.find((q) => q.id === 'rise:' + u), add({ id: 'legion:' + u, x, y: y + sg * ROW * 2, kind: 'legion', unit: u })]);   // the slot below Rise Faster is kept free for it
      let slot = 0;
      for (const stat of ['hp', 'dmg']) {
        if (level(save, stat, u) < 1) continue;
        for (const key of SPECIAL_KEYS) {
          const sp = SPECIALS[key];
          if (sp.unit !== u || sp.needs.stat !== stat) continue;
          links.push([first[stat], add({ id: 'sp:' + key, x, y: y + sg * ROW * (3 + slot++), kind: 'special', key, unit: u })]);
        }
      }
    }
    return { nodes, links };
  }

  // ---- Per-node description ----
  // Returns what to draw and what the detail panel should say.
  function describe(n) {
    if (n.kind === 'hub') {
      const tier = necroTier(save);
      return { icon: iconCanvas('necro' + tier), label: NECRO_TIERS[tier].name, badge: `Power ${playerRating(save)}`, state: 'hub',
        title: NECRO_TIERS[tier].name, lines: [`Power ${playerRating(save)}. Your rank and look grow with the gear you wear.`] };
    }
    if (n.kind === 'unlock') {
      const have = spellUnlocked(save), can = !have && save.souls >= SPELL_UNLOCK_COST;
      return {
        icon: iconCanvas('icon_raise'), label: 'Raise Dead', badge: have ? 'owned' : '☠ ' + SPELL_UNLOCK_COST, state: have ? 'maxed' : can ? 'avail' : 'ready',
        title: 'Raise Dead', lines: ['A button for every summon you own: tap it in battle to raise a free burst of that summon, then wait for it to recharge.', have ? 'Unlocked.' : 'Teach the necromancer to call the dead on demand.'],
        buy: have ? null : { label: 'Unlock ☠ ' + SPELL_UNLOCK_COST, enabled: can, fn: () => { if (save.souls < SPELL_UNLOCK_COST) return false; save.souls -= SPELL_UNLOCK_COST; save.nodes.unlock_spell = 1; return true; } },
      };
    }
    if (n.kind === 'unit') {
      const def = UNITS[n.unit];
      const have = owned(save, n.unit);
      const gate = gateProgress(save, n.unit), gated = !have && !gateMet(save, n.unit);
      const rbLocked = !have && !unitRebirthOk(save, n.unit), canBuy = !have && !gated && !rbLocked && save.champSouls >= def.unlockCost;
      return {
        icon: have ? lookCanvas(n.unit, lookOf(save, n.unit)) : iconCanvas(def.sprite), label: def.name,
        badge: have ? 'owned' : rbLocked ? `Rebirth ${UNIT_REBIRTH[n.unit]}` : gated ? `${gate.have}/${gate.need} lvls` : `♛ ${def.unlockCost}`, state: have ? 'owned' : (canBuy ? 'avail' : gated || rbLocked ? 'locked' : 'ready'),
        title: def.name, lines: [def.blurb, have ? 'Its upgrades are shown around it.' : rbLocked ? `Rebirth ${UNIT_REBIRTH[n.unit]} times to unlock this summon (you have ${rebirthsOf(save)}).` : gated ? `Spend ${gate.need - gate.have} more upgrade level${gate.need - gate.have > 1 ? 's' : ''} on ${UNIT_TREE[n.unit].gate.units.map((u) => UNITS[u].name + 's').join(' and ')} to unlock it.` : `Unlock with ${def.unlockCost} champion soul${def.unlockCost > 1 ? 's' : ''}.`],
        buy: have || gated || rbLocked ? null : { label: `Unlock ♛ ${def.unlockCost}`, enabled: canBuy, fn: () => buyUnit(save, n.unit) },
      };
    }
    if (n.kind === 'legion') {
      const have = legionOwned(save, n.unit), cost = legionCost(save, n.unit), can = !have && save.souls >= cost, def = UNITS['legion_' + n.unit];
      return {
        icon: lookCanvas('legion_' + n.unit, lookOf(save, n.unit)), label: def.name, badge: have ? 'owned' : '☠ ' + cost.toLocaleString(),
        state: have ? 'maxed' : can ? 'avail' : 'ready',
        title: def.name, lines: [`One huge unit worth about ${LEGION_MULT} ${UNITS[n.unit].name}s, with all your upgrades. It is raised on a much longer cooldown (${Math.round(def.raise)}s) and gets its own Raise Dead button.`, have ? 'Unlocked.' : 'The reward for fully upgrading this summon.'],
        buy: have ? null : { label: `Raise the Legion ☠ ${cost.toLocaleString()}`, enabled: can, fn: () => buyLegion(save, n.unit) },
      };
    }
    if (n.kind === 'special') {
      const sp = SPECIALS[n.key];
      const have = hasSpecial(save, n.key), ready = specialReady(save, n.key);
      const need = `Finish ${TIER_NAMES[sp.unit][sp.needs.stat][sp.needs.tiers - 1]} first.`;
      const can = !have && ready && save.souls >= sp.cost;
      return {
        icon: iconCanvas('icon_' + sp.icon), label: sp.name, badge: have ? 'owned' : `☠ ${sp.cost}`,
        state: have ? 'maxed' : (!ready ? 'locked' : can ? 'avail' : 'ready'),
        title: sp.name, lines: [sp.desc, have ? 'Unlocked.' : ready ? 'Ability for ' + UNITS[sp.unit].name + 's.' : need],
        buy: have ? null : { label: `Learn ☠ ${sp.cost}`, enabled: can, fn: () => buySpecial(save, n.key) },
      };
    }
    // Stat nodes: rise (single node) or a tier of the HP/damage chain.
    const { stat, unit, tier } = n;
    const S = STATS[stat];
    const L = level(save, stat, unit);
    if (stat === 'rise') {
      const maxed = L >= S.max, cost = statCost(stat, unit, L, save), need = statNeeds('rise', L), rbLock = !maxed && rebirthsOf(save) < need, can = !maxed && !rbLock && save.souls >= cost;
      return {
        icon: iconCanvas('icon_raise'), label: S.name, badge: maxed ? 'MAX' : `${L}/${S.max}`, state: maxed ? 'maxed' : rbLock ? 'locked' : can ? 'avail' : 'ready',
        title: `${S.name} (${UNITS[unit].name})`, lines: [`Now: ${statEffect('rise', L, unit)}`, maxed ? 'Fully upgraded.' : rbLock ? `The next level needs ${need} rebirths (you have ${rebirthsOf(save)}).` : `Next: ${statEffect('rise', L + 1, unit)}`],
        buy: maxed || rbLock ? null : { label: `Upgrade ☠ ${cost}`, enabled: can, fn: () => buyStat(save, 'rise', unit) },
      };
    }
    const names = TIER_NAMES[unit];
    const done = L >= (tier + 1) * TIER.levels;
    const needR = statNeeds(stat, tier * TIER.levels), rbLock = rebirthsOf(save) < needR, locked = L < tier * TIER.levels;
    const p = Math.max(0, Math.min(TIER.levels, L - tier * TIER.levels));
    const cost = statCost(stat, unit, L, save);
    const can = !locked && !rbLock && !done && save.souls >= cost;
    const cur = lookOf(save, unit);
    const after = { ...cur, [stat === 'hp' ? 'hs' : 'ds']: tier + 1 };
    const lookName = (stat === 'hp' ? names.hpLook : names.dmgLook)[tier + 1];
    const lines = [];
    if (rbLock) lines.push(`Needs ${needR} rebirth${needR > 1 ? 's' : ''} (you have ${rebirthsOf(save)}).`);
    else if (locked) lines.push(`Finish ${names[stat][tier - 1]} first.`);
    else if (done) lines.push('Tier complete.');
    else lines.push(`Now: ${statEffect(stat, L, unit)}`, `Next: ${statEffect(stat, L + 1, unit)}`);
    lines.push(`Finishing it evolves the look: ${lookName}.`);
    return {
      icon: iconCanvas('icon_' + S.icon), label: names[stat][tier], badge: done ? 'done' : rbLock ? `Rebirth ${needR}` : `${p}/${TIER.levels}`,
      state: done ? 'maxed' : locked || rbLock ? 'locked' : can ? 'avail' : 'ready',
      title: `${names[stat][tier]} (${UNITS[unit].name})`, lines,
      preview: done ? null : lookCanvas(unit, after),
      buy: locked || rbLock || done ? null : { label: `Upgrade ☠ ${cost}`, enabled: can, fn: () => buyStat(save, stat, unit) },
    };
  }

  // ---- Rendering ----
  function render() {
    const { nodes, links } = build();
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const infos = Object.fromEntries(nodes.map((n) => [n.id, describe(n)]));
    if (selected && !byId[selected]) selected = null;
    world.innerHTML = '';
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'web-lines');
    for (const [a, b] of links) {
      const l = document.createElementNS(ns, 'line');
      l.setAttribute('x1', a.x); l.setAttribute('y1', a.y); l.setAttribute('x2', b.x); l.setAttribute('y2', b.y);
      const st = infos[b.id].state;
      l.setAttribute('class', st === 'locked' ? 'dim' : 'on');
      svg.appendChild(l);
    }
    world.appendChild(svg);
    for (const n of nodes) {
      const info = infos[n.id];
      const el = document.createElement('button');
      el.className = `wnode ${n.kind} ${info.state}` + (selected === n.id ? ' sel' : '');
      el.style.left = n.x + 'px'; el.style.top = n.y + 'px';
      const ring = document.createElement('div');
      ring.className = 'wring';
      ring.appendChild(info.icon);
      el.appendChild(ring);
      el.insertAdjacentHTML('beforeend', `<div class="wlabel">${info.label}</div><div class="wbadge">${info.badge}</div>`);
      el.onclick = () => { if (!dragged) pick(n); };
      world.appendChild(el);
    }
    renderPanel(selected ? infos[selected] : null);
    if (!centered) { recenter(); centered = true; }
  }

  function pick(n) {
    play('click');
    selected = n.id;
    render();
  }

  function renderPanel(info) {
    panel.classList.toggle('hidden', !info);
    if (!info) return;
    panel.innerHTML = '';
    if (info.preview) { info.preview.className = 'wpreview'; panel.appendChild(info.preview); }
    const text = document.createElement('div');
    text.className = 'wtext';
    text.innerHTML = `<div class="wtitle">${info.title}</div>` + info.lines.map((l) => `<div class="wline">${l}</div>`).join('');
    panel.appendChild(text);
    if (info.buy) {
      const b = document.createElement('button');
      b.className = 'big wbuy';
      b.textContent = info.buy.label;
      b.disabled = !info.buy.enabled;
      b.onclick = () => {
        if (info.buy.fn()) { play('buy'); onChange(); render(); }
      };
      panel.appendChild(b);
    }
  }

  // ---- Pan and zoom (one finger or mouse drags, two fingers pinch, wheel zooms) ----
  const pointers = new Map();
  let startDist = 0, startScale = 1, downAt = null;
  root.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    downAt = { x: e.clientX, y: e.clientY };
    dragged = false;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      startDist = Math.hypot(a.x - b.x, a.y - b.y); startScale = view.s;
    }
  });
  window.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    if (pointers.size === 2) {
      p.x = e.clientX; p.y = e.clientY;
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (startDist > 0) { zoom((startScale * d) / startDist / view.s, (a.x + b.x) / 2 - root.getBoundingClientRect().left, (a.y + b.y) / 2 - root.getBoundingClientRect().top); dragged = true; }
      return;
    }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 8) dragged = true;
    if (dragged) { view.x += dx; view.y += dy; applyView(); }
  });
  const up = (e) => { pointers.delete(e.pointerId); setTimeout(() => { dragged = false; }, 0); };
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  root.addEventListener('wheel', (e) => {
    e.preventDefault();
    const r = root.getBoundingClientRect();
    zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });
  document.getElementById('web-zin').onclick = () => zoom(1.2);
  document.getElementById('web-zout').onclick = () => zoom(1 / 1.2);
  document.getElementById('web-center').onclick = recenter;

  return { render, recenter: () => { centered = false; } };
}
