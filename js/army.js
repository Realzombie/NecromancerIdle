// The Army screen: choose which summons fill your army space. Every wave starts with exactly this army.
import { UNITS, PLAYER_UNITS, ARMY_SLOTS, LEGION_MULT, owned, lookOf, armyCap, armyUsed, tidyArmy, fillArmy, musterCap, musterCost, legionOwned, playerRating, statMods } from './data.js';
import { addToArmy, buyMuster } from './sim.js';
import { lookCanvas } from './render.js';

export function createArmy({ save, play, onChange }) {
  const body = document.getElementById('army-body');

  function render() {
    const army = tidyArmy(save);
    const cap = armyCap(save), used = armyUsed(save);
    const lvl = save.nodes.muster || 0, max = musterCap(save), cost = musterCost(save);
    const scroll = body.querySelector('.army-list');
    const top = scroll ? scroll.scrollTop : 0;
    body.innerHTML =
      '<div class="army-bar"><div class="army-space"><b>' + used + ' / ' + cap + '</b> army space<br><small>Power <b>' + playerRating(save).toLocaleString() + '</b></small></div>' +
      '<button class="abtn go" id="army-muster">' + (lvl >= max ? (max >= 24 ? 'Space maxed' : 'More space after a rebirth') : '+1 space &#9760; ' + cost.toLocaleString()) + '</button>' +
      '<button class="abtn" id="army-fill">Fill with zombies</button><button class="abtn" id="army-clear">Clear</button></div>' +
      '<div class="army-list"></div>' +
      '<div class="army-note">Every wave starts with this army. The necromancer slowly replaces the fallen, and never goes above it.</div>';
    const list = body.querySelector('.army-list');
    for (const t of PLAYER_UNITS) {
      if (!owned(save, t)) continue;
      const n = army[t] || 0, slots = ARMY_SLOTS[t];
      const el = document.createElement('div');
      el.className = 'ucard' + (n ? ' in' : '');
      el.appendChild(lookCanvas(t, lookOf(save, t)));
      const legions = legionOwned(save, t) ? Math.floor(n / 10) : 0;
      el.insertAdjacentHTML('beforeend',
        '<div class="uname">' + UNITS[t].name + '</div>' +
        '<div class="uinfo">Takes ' + slots + ' space' + (UNITS[t].range > 40 ? ' &middot; ranged' : ' &middot; melee') + (UNITS[t].fly ? ' &middot; flies' : '') +
        (legions ? '<br><i>' + legions + ' Legion' + (legions > 1 ? 's' : '') + ' (worth ' + LEGION_MULT + ' each)</i>' : '') + '</div>' +
        '<div class="ustep"><button data-d="-1" aria-label="Fewer">&minus;</button><b>' + n + '</b><button data-d="1" aria-label="More">+</button><button data-d="5" class="five">+5</button></div>');
      for (const b of el.querySelectorAll('.ustep button')) {
        const d = Number(b.dataset.d);
        const room = Math.floor((cap - used) / slots);
        b.disabled = d < 0 ? n === 0 : room < 1;
        b.onclick = () => {
          const step = d > 0 ? Math.min(d, room) : d;
          if (addToArmy(save, t, step)) { play('click'); onChange(); render(); }
        };
      }
      list.appendChild(el);
    }
    list.scrollTop = top;
    const m = body.querySelector('#army-muster');
    m.disabled = lvl >= max || save.souls < cost;
    m.onclick = () => { if (buyMuster(save)) { play('buy'); onChange(); render(); } };
    body.querySelector('#army-fill').onclick = () => { fillArmy(save); play('click'); onChange(); render(); };
    // clearing leaves one zombie so the army is never empty
    body.querySelector('#army-clear').onclick = () => { save.army = { zombie: 1 }; play('click'); onChange(); render(); };
  }
  return { render };
}
