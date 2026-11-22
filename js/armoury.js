// The Armoury screen: gear, defences and records (achievements). Builds HTML into #arm-body.
import { DEFENCES, DEFENCE_KEYS, defLevel, defCost, defUnlocked, UNITS } from './data.js';
import { buyDefence } from './sim.js';
import {
  RARITIES, SLOTS, SLOT_NAMES, STAT_DEFS, GEAR_FX, MAX_UP, MAX_ITEMS, rarityIndex, rarityOf, statValue, itemPower,
  upgradeCost, rerollCost, salvageValue, equip, unequip, salvage, salvageBelow, upgradeItem, rerollItem,
} from './gear.js';
import { ACHIEVEMENTS, rewardText, isDone } from './records.js';
import { iconCanvas } from './render.js';

const $ = (id) => document.getElementById(id);

export function createArmoury({ save, play, onChange }) {
  let tab = 'gear';
  let selected = null;     // selected item id
  let filter = 'all';      // inventory slot filter

  const items = () => save.gear || [];
  const byId = (id) => items().find((g) => g.id === id);
  const isEquipped = (it) => save.equipped && save.equipped[it.slot] === it.id;

  function statLines(it) {
    return it.stats.map((st, i) => `<div class="gl ${i ? 'extra' : 'main'}">${STAT_DEFS[st.k].fmt(statValue(it, st))}</div>`).join('') +
      (it.fx ? `<div class="gl fx">${GEAR_FX[it.fx].name}: ${GEAR_FX[it.fx].desc}</div>` : '');
  }

  function tile(it) {
    const R = rarityOf(it);
    const el = document.createElement('button');
    el.className = 'gtile' + (selected === it.id ? ' sel' : '') + (isEquipped(it) ? ' worn' : '');
    el.style.setProperty('--rc', R.color);
    el.appendChild(iconCanvas('gear_' + it.slot));
    el.insertAdjacentHTML('beforeend', `<span class="gt-name">${it.name}${it.up ? ' +' + it.up : ''}</span>` + (it.isNew ? '<i class="gt-new">NEW</i>' : '') + (isEquipped(it) ? '<i class="gt-eq">E</i>' : ''));
    el.onclick = () => { selected = it.id; delete it.isNew; render(); };
    return el;
  }

  function renderGear(root) {
    const sel = byId(selected);
    // ---- Left: selected item ----
    const left = document.createElement('div');
    left.className = 'arm-detail';
    if (!sel) {
      left.innerHTML = '<div class="gd-empty">Gear drops from zones. Clear zones, and even failed attempts can drop something.<br><br>Tap an item to inspect it. Better gear is equipped automatically.</div>';
    } else {
      const R = rarityOf(sel);
      left.style.setProperty('--rc', R.color);
      const cur = byId(save.equipped && save.equipped[sel.slot]);
      const cmp = cur && cur.id !== sel.id ? `<div class="gd-cmp">Equipped: power ${itemPower(cur)} &middot; this: power ${itemPower(sel)}</div>` : '';
      left.innerHTML =
        `<div class="gd-head"><div class="gd-icon"></div><div><div class="gd-name">${sel.name}${sel.up ? ' +' + sel.up : ''}</div><div class="gd-sub">${R.name} ${SLOT_NAMES[sel.slot]} &middot; zone ${sel.zone}</div></div></div>` +
        `<div class="gd-stats">${statLines(sel)}</div>${cmp}<div class="gd-btns"></div>`;
      left.querySelector('.gd-icon').appendChild(iconCanvas('gear_' + sel.slot));
      const btns = left.querySelector('.gd-btns');
      const add = (label, cls, fn, enabled = true) => {
        const b = document.createElement('button');
        b.className = 'abtn ' + cls; b.innerHTML = label; b.disabled = !enabled;
        b.onclick = fn; btns.appendChild(b);
      };
      if (isEquipped(sel)) add('Unequip', 'plain', () => { unequip(save, sel.slot); done(); });
      else add('Equip', 'go', () => { equip(save, sel.id); play('buy'); done(); });
      const uc = upgradeCost(sel);
      add(sel.up >= MAX_UP ? 'Maxed' : `Upgrade <span class="dust">&#10022; ${uc}</span>`, 'plain',
        () => { if (upgradeItem(save, sel.id)) { play('buy'); done(); } }, sel.up < MAX_UP && (save.dust || 0) >= uc);
      if (sel.stats.length > 1) {
        const rc = rerollCost(sel);
        add(`Reroll extras <span class="dust">&#10022; ${rc}</span>`, 'plain', () => { if (rerollItem(save, sel.id)) { play('buy'); done(); } }, (save.dust || 0) >= rc);
      }
      if (!isEquipped(sel)) add(`Salvage <span class="dust">+${salvageValue(sel)}</span>`, 'warn', () => { salvage(save, sel.id); selected = null; play('click'); done(); });
    }
    // ---- Right: equipped slots and the bag ----
    const right = document.createElement('div');
    right.className = 'arm-bag';
    const slots = document.createElement('div');
    slots.className = 'arm-slots';
    for (const slot of SLOTS) {
      const it = byId(save.equipped && save.equipped[slot]);
      const box = document.createElement('div');
      box.className = 'aslot' + (it ? '' : ' empty');
      if (it) {
        box.style.setProperty('--rc', rarityOf(it).color);
        box.appendChild(iconCanvas('gear_' + slot));
        box.insertAdjacentHTML('beforeend', `<div class="as-text"><div class="as-name">${it.name}${it.up ? ' +' + it.up : ''}</div><div class="as-stat">${STAT_DEFS[it.stats[0].k].fmt(statValue(it, it.stats[0]))}</div></div>`);
        box.onclick = () => { selected = it.id; render(); };
      } else {
        box.appendChild(iconCanvas('gear_' + slot));
        box.insertAdjacentHTML('beforeend', `<div class="as-text"><div class="as-name">${SLOT_NAMES[slot]}</div><div class="as-stat">empty</div></div>`);
      }
      slots.appendChild(box);
    }
    right.appendChild(slots);
    const bar = document.createElement('div');
    bar.className = 'arm-bar';
    bar.innerHTML = `<span>Bag ${items().length}/${MAX_ITEMS}</span>`;
    for (const f of ['all', ...SLOTS]) {
      const b = document.createElement('button');
      b.className = 'chip' + (filter === f ? ' on' : '');
      b.textContent = f === 'all' ? 'All' : SLOT_NAMES[f];
      b.onclick = () => { filter = f; render(); };
      bar.appendChild(b);
    }
    const sal = document.createElement('button');
    sal.className = 'chip warn';
    sal.textContent = 'Salvage Common + Magic';
    sal.onclick = () => { const n = salvageBelow(save, 1); if (n) { play('click'); if (selected && !byId(selected)) selected = null; done(); } };
    bar.appendChild(sal);
    right.appendChild(bar);
    const grid = document.createElement('div');
    grid.className = 'arm-grid';
    const list = items().filter((it) => filter === 'all' || it.slot === filter)
      .sort((a, b) => rarityIndex(b.rarity) - rarityIndex(a.rarity) || itemPower(b) - itemPower(a));
    if (!list.length) grid.innerHTML = '<div class="gd-empty">Nothing here yet.</div>';
    for (const it of list) grid.appendChild(tile(it));
    right.appendChild(grid);
    root.append(left, right);
    root.className = 'arm-body gear';
  }

  function renderDefences(root) {
    root.className = 'arm-body defs';
    for (const key of DEFENCE_KEYS) {
      const D = DEFENCES[key];
      const lvl = defLevel(save, key);
      const unlocked = defUnlocked(save, key);
      const maxed = lvl >= D.max;
      const cost = defCost(key, lvl);
      const can = unlocked && !maxed && save.souls >= cost;
      const el = document.createElement('button');
      el.className = 'dcard' + (can ? ' can' : '') + (maxed ? ' maxed' : '') + (unlocked ? '' : ' locked');
      el.disabled = !can;
      el.appendChild(iconCanvas('icon_' + key));
      el.insertAdjacentHTML('beforeend',
        `<div class="dname">${D.name}</div><div class="dlvl">${unlocked ? 'Level ' + lvl + '/' + D.max : 'Locked'}</div>` +
        `<div class="deff">${unlocked ? D.effect(lvl) : 'Clear zone ' + D.needs + ' to unlock.'}${unlocked && !maxed && lvl ? '<br><i>Next: ' + D.effect(lvl + 1) + '</i>' : ''}</div>` +
        `<div class="dcost">${!unlocked ? '' : maxed ? 'MAX' : '<span class="ico">&#9760;</span> ' + cost}</div>`);
      el.onclick = () => { if (buyDefence(save, key)) { play('buy'); done(); } };
      root.appendChild(el);
    }
    const note = document.createElement('div');
    note.className = 'dnote';
    note.textContent = 'Defences stand ready at the start of every attempt. Walls soak damage, traps hurt whatever marches over them, and towers shoot from the back. Rebirth resets them unless you have Fortified Start.';
    root.appendChild(note);
  }

  function renderRecords(root) {
    root.className = 'arm-body recs';
    const s = save.stats || {};
    const top = document.createElement('div');
    top.className = 'rec-stats';
    const n = (v) => Math.floor(v || 0).toLocaleString();
    top.innerHTML = [['Kills', n(s.kills)], ['Attempts', n(s.attempts)], ['Zones cleared', n(s.clears)], ['Defeats', n(s.fails)], ['Gear found', n(s.gearFound)], ['Rebirths', n(save.rebirths)]]
      .map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join('');
    root.appendChild(top);
    const list = document.createElement('div');
    list.className = 'rec-list';
    const sorted = [...ACHIEVEMENTS].sort((a, b) => Number(isDone(save, a)) - Number(isDone(save, b)));
    for (const a of sorted) {
      const done = isDone(save, a);
      const [now, goal] = a.prog(save);
      const p = Math.min(1, now / goal);
      const el = document.createElement('div');
      el.className = 'ach' + (done ? ' done' : '');
      el.innerHTML = `<div class="ach-top"><b>${a.name}</b><span>${done ? '&#10003;' : Math.floor(now).toLocaleString() + '/' + goal.toLocaleString()}</span></div>` +
        `<div class="ach-desc">${a.desc}</div><div class="ach-bar"><i style="width:${p * 100}%"></i></div><div class="ach-rw">${rewardText(a.reward)}</div>`;
      list.appendChild(el);
    }
    root.appendChild(list);
  }

  function done() { onChange(); render(); }

  function render() {
    $('arm-dust').textContent = Math.floor(save.dust || 0);
    for (const t of document.querySelectorAll('#arm-tabs .tab')) t.classList.toggle('on', t.dataset.tab === tab);
    const root = $('arm-body');
    root.innerHTML = '';
    if (tab === 'gear') renderGear(root);
    else if (tab === 'defences') renderDefences(root);
    else renderRecords(root);
  }

  for (const t of document.querySelectorAll('#arm-tabs .tab')) t.onclick = () => { tab = t.dataset.tab; render(); };

  return { render, setTab: (t) => { tab = t; } };
}
