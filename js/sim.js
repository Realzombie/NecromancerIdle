// Pure battle simulation: no DOM, so it can be tested in node.
import {
  UNITS, TUNING, GATE_X, NECRO_X, FIELD_W, LANE_TOP, LANE_BOTTOM, LANE_MIN_Y, LANE_MAX_Y,
  PLAYER_UNITS, legionOwned, legionReady, legionCost, STATS, SPECIALS, SPECIAL_KEYS, TIER, owned, level, statCost, statMods, hasSpecial, specialReady, lookOf, zoneById,
  LEGION_MULT, playerRating, PERKS, PACT_ORDER, worldMul, zoneRebirth, unitRebirthOk, statNeeds, perkLock, perk, perkCost, soulMul, raiseMul, spellCooldownFor, spellCountFor, spellUnlocked, essenceGain, canRebirth,
  gateMet, bestiaryBonus, BOSS_ABILITIES, hazardsFor,
  WAVES, BOSS_WAVE, ENDLESS_ID, composeWave, waveCurve, waveMul, waveSouls, threat, BOSS_BASE,
  ARMY_SLOTS, armyCap, armyUsed, armyRoster, tidyArmy, musterCap, musterCost,
} from './data.js';
import { gearMods, rollDrops, equipIfBetter } from './gear.js';

let nextId = 1;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const ATTACK_TIME = 0.32;   // length of the attack animation
const SWING_DELAY = 0.13;          // the hit lands this far into the animation
const SURGES = 4;                  // a wave arrives in this many groups
const SURGE_WAIT = 17;             // seconds before the next group comes anyway

export class Battle {
  constructor(save, zoneId = 1, wave = 1, rng = Math.random) {
    this.save = save;
    this.rng = rng;
    this.zone = zoneById(zoneId);
    this.zoneId = zoneId;
    this.startWave = this.zone.endless ? 1 : clamp(wave, 1, BOSS_WAVE);
    this.wave = this.startWave;
    this.bossWave = !this.zone.endless && this.wave >= BOSS_WAVE;
    this.bossSpawned = false;
    this.replay = !this.zone.endless && this.wave <= ((save.progress || {})[zoneId] || 0);
    this.units = [];
    this.projectiles = [];
    this.floaters = [];
    this.fx = [];              // slashes and sparks (visual only)
    this.events = [];          // sound cues, drained by the UI
    this.time = 0;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.surges = [];
    this.surgeWait = 0;
    this.surge = 0;
    this.pause = 2;
    this.cast = 0;             // >0 while the necromancer is casting (visual)
    this.result = null;        // 'fail' | 'clear'
    this.kills = 0;
    this.earned = 0;           // souls collected before the end-of-wave share
    this.payout = 0;
    this.champDrop = 0;
    this.spellCds = {};        // Raise Dead cooldown left for each summon type (seconds)
    this.gm = gearMods(save);
    this.bb = bestiaryBonus(save);
    this.newFinds = [];        // enemy kinds defeated for the first time this attempt
    save.seen = save.seen || {};
    this.mines = [];           // field hazards laid by the enemy (see layMines)
    this.timers = [];          // delayed effects such as boss attack wind-ups
    this.corpses = [];         // dying units, kept briefly so the renderer can show them fall
    this.shake = 0;            // screen shake strength (visual only)
    this.deepest = FIELD_W;    // how far left any enemy got (for the attempt log)
    this.peakHorde = 0;
    this.lost = 0;             // summons that died

    this.roster = armyRoster(save);     // what the necromancer keeps on the field
    this.next = null;                   // the summon being raised to replace a loss
    this.raising = 0;
    for (const [type, n] of Object.entries(this.roster)) {
      const [lo, hi] = UNITS[type].rally;
      for (let i = 0; i < n; i++) this.spawn(type, this.rand(lo - 150, hi - 150));
      this.spellCds[type] = 8;
    }
    this.planWave();
  }

  // Work out this wave's enemies, how strong they are and what each is worth, and split them into surges.
  planWave() {
    const list = composeWave(this.zone, this.wave);
    this.curve = waveCurve(this.zone, this.wave);
    if (this.bossWave) list.length = Math.ceil(list.length * 0.6);     // the boss brings a smaller escort
    this.mul = waveMul(this.zone, this.wave, list);
    const souls = waveSouls(this.zone, this.wave);
    this.soulsPerThreat = (souls * (this.bossWave ? 0.5 : 1)) / list.reduce((a, t) => a + threat(UNITS[t]), 0);
    this.bossBounty = souls * 0.5;
    const mixed = list.sort(() => this.rng() - 0.5);
    const groups = this.bossWave ? 2 : SURGES;
    this.surges = Array.from({ length: groups }, (_, i) => mixed.slice(Math.floor((i * mixed.length) / groups), Math.floor(((i + 1) * mixed.length) / groups)));
    this.surge = 0;
    this.surgeWait = 0;
    this.layMines();
  }

  get totalWaves() { return this.zone.endless ? Infinity : WAVES; }
  get wavesDone() { return this.surge >= this.surges.length && !this.spawnQueue.length && (!this.bossWave || this.bossSpawned); }

  later(delay, fn) { this.timers.push({ t: delay, fn }); }

  // Boss special attacks, each on its own cooldown.
  bossAbilities(u, dt) {
    if (!u.def.abil) return;
    if (!u.abCd) u.abCd = u.def.abil.map((k, i) => BOSS_ABILITIES[k].every * (0.5 + 0.15 * i));
    if (u.guard > 0) u.guard -= dt;
    u.def.abil.forEach((k, i) => {
      u.abCd[i] -= dt;
      if (u.abCd[i] > 0) return;
      const targets = this.units.filter((o) => o.team === 'player' && !o.def.static && o.hp > 0);
      if (!targets.length) { u.abCd[i] = 1; return; }
      const A = BOSS_ABILITIES[k];
      u.abCd[i] = A.every * (u.enraged ? 0.75 : 1);
      this.floaters.push({ x: u.x, y: u.y - 70 - i * 16, text: A.name, t: 0 });
      this.castBoss(u, k, A, targets);
    });
  }

  // Damage everything of the player's within a radius of a point (walls and towers included).
  areaHit(x, y, r, dmg, from) {
    this.fx.push({ k: 'ring', x, y: y - 6, t: 0, life: 0.35, color: '#ff8060' });
    this.shake = Math.max(this.shake, 0.5);
    this.emit('hit', 'player');
    for (const o of this.units) {
      if (o.team !== 'player' || o.hp <= 0) continue;
      if (Math.hypot(o.x - x, (o.y - y) * 1.6) <= r + o.def.radius) { o.hp -= dmg; o.flash = 0.15; for (let i = 0; i < 3; i++) this.spark(o.x, o.y - 12, '#ffb090'); }
    }
  }

  castBoss(u, k, A, targets) {
    const pick = () => targets[Math.floor(this.rng() * targets.length)];
    if (k === 'slam') {
      const x = u.x - 46, y = u.y;
      this.fx.push({ k: 'tele', x, y, r: A.radius, t: 0, life: A.windup });
      this.later(A.windup, () => { if (u.hp > 0) this.areaHit(x, y, A.radius, u.dmg * A.dmgMul, u); });
    } else if (k === 'leap') {
      const t = pick(), x = t.x + 24, y = t.y;
      this.fx.push({ k: 'tele', x, y, r: A.radius, t: 0, life: A.windup });
      this.later(A.windup, () => {
        if (u.hp <= 0) return;
        u.x = Math.min(FIELD_W - 30, x); u.y = clamp(y, LANE_MIN_Y, LANE_MAX_Y);
        this.areaHit(u.x, u.y, A.radius, u.dmg * A.dmgMul, u);
      });
    } else if (k === 'smite') {
      for (let i = 0; i < A.targets; i++) {
        const t = pick(), x = t.x, y = t.y;
        this.fx.push({ k: 'tele', x, y, r: A.radius, t: 0, life: A.windup });
        this.later(A.windup, () => {
          if (u.hp <= 0) return;
          this.fx.push({ k: 'bolt', x, y, t: 0, life: 0.3, seed: x });
          this.areaHit(x, y, A.radius, u.dmg * A.dmgMul, u);
        });
      }
    } else if (k === 'volley') {
      for (let i = 0; i < A.count; i++) {
        this.later(i * 0.12, () => {
          if (u.hp <= 0) return;
          const live = this.units.filter((o) => o.team === 'player' && !o.def.static && o.hp > 0);
          if (!live.length) return;
          this.projectiles.push({ x: u.x - 10, y: u.y - 34, target: live[Math.floor(this.rng() * live.length)], dmg: u.dmg * A.dmgMul, speed: 320, src: u, splash: 0, magic: true });
          this.emit('shoot', 'enemy');
        });
      }
    } else if (k === 'guard') {
      u.guard = A.duration;
      this.fx.push({ k: 'ring', x: u.x, y: u.y - 10, t: 0, life: 0.5, color: '#a0d0ff' });
    } else if (k === 'curse') {
      for (const o of targets) o.status.slow = { t: A.duration };
      this.fx.push({ k: 'ring', x: u.x, y: u.y - 10, t: 0, life: 0.7, color: '#b080e0' });
      this.shake = Math.max(this.shake, 0.3);
    }
  }

  // ---- Field hazards ----
  // Mines are laid between the lines as each wave starts and blow up under the horde. War banners rally the
  // enemy: every enemy near one hits harder, moves faster and attacks faster until the banner is cut down.
  layMines() {
    const H = hazardsFor(this.zone, this.wave);
    for (let i = 0; i < H.mines; i++) {
      if (this.mines.length >= 16) break;
      this.mines.push({ x: this.rand(430, 800), y: this.rand(LANE_TOP + 6, LANE_BOTTOM - 6), arm: 3 + i * 0.1, pulse: this.rand(0, 3), flat: 4 * H.mineK, pct: H.minePct, boom: 0 });
    }
    for (let i = 0; i < H.banners; i++) {
      const u = this.spawn('warbanner', FIELD_W - 110 - i * 70, LANE_TOP + (LANE_BOTTOM - LANE_TOP) * (H.banners === 1 ? 0.5 : (i + 0.5) / H.banners), true);
      this.fx.push({ k: 'ring', x: u.x, y: u.y - 10, t: 0, life: 0.6, color: '#e05060' });
    }
    if (H.banners) this.floaters.push({ x: FIELD_W - 150, y: 380, text: 'war banner!', t: 0 });
  }

  updateHazards(dt) {
    const banners = this.units.filter((u) => u.def.banner && u.hp > 0);
    for (const u of this.units) {
      u.buffed = 0;
      if (u.team !== 'enemy' || u.def.static) continue;
      for (const b of banners) if (Math.abs(b.x - u.x) < b.def.banner.r && Math.abs(b.y - u.y) < 90) { u.buffed = b.def.banner.dmg; break; }
    }
    for (const m of this.mines) {
      m.arm -= dt; m.pulse += dt;
      if (m.boom > 0 || m.arm > 0) continue;
      for (const u of this.units) {
        if (u.team !== 'player' || u.def.static || u.def.ghostly || u.def.fly || u.hp <= 0) continue;
        if (Math.hypot(u.x - m.x, (u.y - m.y) * 1.6) <= 18 + u.def.radius * 0.6) { m.boom = 1; break; }
      }
    }
    for (const m of this.mines) {
      if (m.boom !== 1) continue;
      m.boom = 2;
      this.fx.push({ k: 'ring', x: m.x, y: m.y - 4, t: 0, life: 0.45, color: '#ffb040' });
      this.fx.push({ k: 'ring', x: m.x, y: m.y - 4, t: 0, life: 0.25, color: '#fff0c0' });
      this.shake = Math.max(this.shake, 0.4);
      this.emit('trap');
      for (let i = 0; i < 10; i++) this.spark(m.x, m.y - 6, i % 2 ? '#ffb040' : '#ff6030');
      for (const o of this.units) {
        if (o.team !== 'player' || o.def.static || o.def.ghostly || o.def.fly || o.hp <= 0) continue;
        if (Math.hypot(o.x - m.x, (o.y - m.y) * 1.6) > 52 + o.def.radius) continue;
        const soft = o.def.heavy ? 0.4 : 1;
        const d = (m.flat + m.pct * o.maxHp) * soft;
        o.hp -= d; o.flash = 0.2;
        this.floaters.push({ x: o.x, y: o.y - 30, text: '-' + Math.round(d), t: 0 });
      }
    }
    this.mines = this.mines.filter((m) => m.boom !== 2);
  }

  emit(n, team) { if (this.events.length < 120) this.events.push({ n, team }); }

  rand(a, b) { return a + this.rng() * (b - a); }

  spawn(type, x, y, flat) {
    const def = UNITS[type];
    let hpMul = 1, dmgMul = 1;
    const base = def.legion || type;   // a Legion shares the upgrades of its summon
    if (def.team === 'player') { const m = statMods(this.save, base); hpMul = m.hp * (1 + this.gm.hp) * (1 + this.bb.hp); dmgMul = m.dmg * (1 + this.gm.dmg) * (1 + this.bb.dmg); }
    else if (def.boss) {
      const heft = def.hp >= 850 ? 1.25 : 1;
      hpMul = (BOSS_BASE.hp * this.curve * heft) / def.hp; dmgMul = (BOSS_BASE.dmg * this.curve) / def.dmg;
    } else if (def.static) { hpMul = this.curve * 0.8; dmgMul = 1; }
    else { hpMul = dmgMul = this.mul || 1; }
    const u = {
      id: nextId++, type, def, team: def.team, hpK: hpMul,
      x, y: y !== undefined ? y : this.rand(LANE_TOP, LANE_BOTTOM),
      hp: def.hp * hpMul, maxHp: def.hp * hpMul, dmg: def.dmg * dmgMul,
      cd: this.rng() * def.atk, flash: 0, attackAnim: 0, moving: false, engaged: false, swing: null,
      facing: def.team === 'player' ? 1 : -1,
      speedMul: this.rand(0.85, 1.15),   // so the horde does not march in lockstep
      bias: this.rand(-16, 16),          // aims a little above or below its target
      wt: 0, wx: 0, wy: 0,               // wandering drift
      ht: this.rand(1, 4),
      age: 0, fresh: true,
    };
    if (def.fly) { u.alt = this.rand(def.alt[0], def.alt[1]); u.altNow = u.alt; u.flap = this.rand(0, 6); this.emit(def.team === 'enemy' ? 'screech' : 'squeak', def.team); }
    if (def.team === 'enemy') { const e = this.save.seen[type] || (this.save.seen[type] = {}); e.seen = true; }
    u.status = {};
    // Elites: a rare, bigger and meaner enemy that drops triple souls and may carry gear.
    if (def.team === 'enemy' && !def.boss && !flat && (this.wave >= 3 || this.zoneId > 2) && this.rng() < 0.04) {
      u.elite = true; u.hp = u.maxHp = u.maxHp * 2.2; u.dmg *= 1.3;
    }
    if (def.summon) u.sumCd = def.summon.every * 0.7;
    if (def.team === 'enemy' && !def.static) u.bounty = def.boss ? this.bossBounty : threat(def) * (this.soulsPerThreat || 0) * (flat ? 0.2 : 1);
    if (def.team === 'player' && !def.static) {
      u.look = lookOf(this.save, base);
      u.sp = {};
      for (const k of SPECIAL_KEYS) if (SPECIALS[k].unit === base && hasSpecial(this.save, k)) { u.sp[k] = true; if (SPECIALS[k].effect) u.sp[SPECIALS[k].effect] = true; }
    }
    if (def.rally) this.pickHome(u, true);
    this.units.push(u);
    return u;
  }

  // Player units drift towards a spot in their rally zone when nothing is close.
  pickHome(u, fresh) {
    const [lo, hi] = u.def.rally;
    if (fresh || u.homeX === undefined) {
      u.homeX = this.rand(lo, hi);
      u.homeY = this.rand(LANE_TOP, LANE_BOTTOM);
    } else {
      u.homeX = clamp(u.homeX + this.rand(-45, 45), lo, hi);
      u.homeY = clamp(u.homeY + this.rand(-30, 30), LANE_TOP, LANE_BOTTOM);
    }
  }

  alive(team, type) {
    let n = 0;
    for (const u of this.units) if (u.team === team && !u.def.static && (!type || u.type === type)) n++;
    return n;
  }

  // The summons in this army (legions standing in where learned). Each has a Raise Dead button.
  raiseTypes() { return Object.keys(this.roster); }

  // How many hounds hunt together (a hound Legion is a whole pack).
  packSize() {
    let n = 0;
    for (const u of this.units) if (u.team === 'player' && (u.def.legion || u.type) === 'hound') n += u.def.legion ? LEGION_MULT : 1;
    return n;
  }

  // Seconds to replace one fallen summon: bigger ones take longer. A Legion takes as long as eight of its summon.
  raiseInterval(type) {
    const base = UNITS[type].legion || type;
    return TUNING.reinforceBase * Math.pow(ARMY_SLOTS[base], 0.8) * (UNITS[type].legion ? 8 : 1) * statMods(this.save, base).cooldown * raiseMul(this.save);
  }

  // The necromancer raises one replacement at a time and never takes the army above what you set.
  reinforce(dt) {
    const alive = {};
    for (const u of this.units) if (u.team === 'player') alive[u.type] = (alive[u.type] || 0) + 1;
    const short = (t) => this.roster[t] - (alive[t] || 0);
    if (!this.next || short(this.next) <= 0) {
      this.next = null; this.raising = 0;
      let best = 0;
      for (const t of Object.keys(this.roster)) { const share = short(t) / this.roster[t]; if (share > best) { best = share; this.next = t; } }
      if (!this.next) return;
    }
    this.raising += dt;
    if (this.raising >= this.raiseInterval(this.next)) {
      this.spawn(this.next, NECRO_X + 55);
      this.next = null; this.raising = 0;
      this.cast = 0.5;
      this.emit('raise');
    }
  }

  // Raise Dead: a free burst of one summon type on a long cooldown (needs the unlock from the skill web).
  spellReady(type) { return !this.result && spellUnlocked(this.save) && (this.spellCds[type] ?? 10) <= 0; }
  castSpell(type) {
    if (!this.spellReady(type)) return false;
    this.spellCds[type] = spellCooldownFor(this.save, type);
    for (let i = 0; i < spellCountFor(this.save, type); i++) this.spawn(type, NECRO_X + 60 + i * 10);
    this.cast = 0.8;
    this.shake = Math.max(this.shake, 0.35);
    this.fx.push({ k: 'ring', x: NECRO_X + 20, y: 420, t: 0, life: 0.6, color: '#8fd16a' });
    this.emit('raise');
    return true;
  }

  raiseProgress(type) {
    return type === this.next ? clamp(this.raising / this.raiseInterval(type), 0, 1) : 0;
  }

  update(dt) {
    if (this.result) return;
    this.time += dt;
    this.cast = Math.max(0, this.cast - dt);
    for (const k of Object.keys(this.spellCds)) this.spellCds[k] = Math.max(0, this.spellCds[k] - dt);
    this.shake = Math.max(0, this.shake - dt * 1.6);
    for (const c of this.corpses) c.t += dt;
    for (const tm of this.timers) { tm.t -= dt; if (tm.t <= 0) tm.fn(); }
    this.timers = this.timers.filter((tm) => tm.t > 0);
    this.corpses = this.corpses.filter((c) => c.t < 0.7);

    this.reinforce(dt);

    // Surges: the next group arrives when the field is nearly clear, or after a while anyway.
    this.surgeWait -= dt;
    if (this.spawnQueue.length) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawn(this.spawnQueue.shift(), FIELD_W - 30);
        this.spawnTimer = TUNING.spawnGap;
      }
    } else if (this.surge < this.surges.length) {
      if ((this.surge === 0 && this.time >= 1.5) || (this.surge > 0 && (this.surgeWait <= 0 || this.alive('enemy') <= 2))) {
        this.spawnQueue = [...this.surges[this.surge]];
        this.surge++;
        this.surgeWait = SURGE_WAIT + this.spawnQueue.length * TUNING.spawnGap;
        this.spawnTimer = 0;
        this.emit('wave');
      }
    } else if (this.bossWave && !this.bossSpawned) {
      if (this.surgeWait <= 0 || this.alive('enemy') <= 2) {
        this.bossSpawned = true;
        this.emit('boss');
        this.spawn(this.zone.boss, FIELD_W - 30);
        this.pause = 0.8;
      }
    } else if (this.alive('enemy') === 0) {
      if (this.units.some((u) => u.def.banner)) { for (const u of this.units) if (u.def.banner) { u.hp = 0; u.retreat = true; } }
      this.pause -= dt;
      if (this.pause <= 0) {
        if (!this.zone.endless) { this.finish('clear'); return; }
        this.wave++;                 // the Endless Crypt never stops
        this.pause = 2;
        this.planWave();
      }
    }

    // A slow wing beat while anything is flying
    this.flapT = (this.flapT || 0) - dt;
    if (this.flapT <= 0) { this.flapT = 0.8; if (this.units.some((q) => q.def.fly)) this.emit('flap'); }

    // Units
    for (const u of this.units) this.updateUnit(u, dt);
    this.separate(dt);

    // Projectiles
    for (const p of this.projectiles) {
      if (p.target.hp <= 0) { p.dead = true; continue; }
      const dx = p.target.x - p.x, dy = (p.target.y - 14 - (p.target.altNow || 0)) - p.y;
      const d = Math.hypot(dx, dy);
      const step = p.speed * dt;
      if (d <= step) {
        this.hit(p.target, p.dmg, p.src);
        if (p.splash) {
          this.fx.push({ k: 'ring', x: p.target.x, y: p.target.y - 10, t: 0, life: 0.3, color: p.shot === 'fire' ? '#ff9030' : p.shot === 'bomb' ? '#ffd060' : '#c080e0' });
          if (p.shot) { for (let i = 0; i < 8; i++) this.spark(p.target.x, p.target.y - 10, i % 2 ? '#ffb040' : '#ff6030'); }
          if (p.shot === 'bomb') { this.shake = Math.max(this.shake, 0.35); this.emit('trap'); }
          for (const o of this.units) {
            if (o.team === p.target.team && o !== p.target && o.hp > 0 && Math.hypot(o.x - p.target.x, (o.y - p.target.y) * 1.5) <= p.splash) this.hit(o, p.dmg * 0.6, p.src, true);
          }
        }
        p.dead = true;
      }
      else { p.x += dx / d * step; p.y += dy / d * step; p.angle = Math.atan2(dy, dx); }
    }
    this.projectiles = this.projectiles.filter((p) => !p.dead);

    // Poison and burning tick over time.
    for (const u of this.units) {
      for (const k of ['poison', 'burn', 'slow']) {
        const st = u.status[k];
        if (!st) continue;
        st.t -= dt;
        if (st.dps) u.hp -= st.dps * dt;
        st.fx = (st.fx || 0) - dt;
        if (st.fx <= 0 && k !== 'slow') { st.fx = 0.25; this.spark(u.x + this.rand(-6, 6), u.y - 14, k === 'poison' ? '#9dff7a' : '#ff9030'); }
        if (st.t <= 0) delete u.status[k];
      }
    }

    this.updateHazards(dt);

    // For the attempt log: the biggest the horde got and how close the enemy came.
    let horde = 0;
    for (const u of this.units) {
      if (u.def.static) continue;
      if (u.team === 'player') horde++; else if (u.x < this.deepest) this.deepest = u.x;
    }
    if (horde > this.peakHorde) this.peakHorde = horde;

    // Deaths
    for (const u of this.units) {
      if (u.hp > 0) continue;
      if (u.team === 'player' && !u.def.static) this.lost++;
      for (let i = 0; i < 6; i++) this.spark(u.x, u.y - 14, u.team === 'player' ? '#8fd16a' : '#d6596b');
      this.emit('die', u.team);
      if (this.corpses.length < 50) this.corpses.push({ u, x: u.x, y: u.y, t: 0, alt: u.altNow || 0 });
      if (u.team === 'enemy' && this.fx.length < 260) this.fx.push({ k: 'soul', x: u.x, y: u.y - 20, t: 0, life: 1.1 });
      if (u.def.boss) this.shake = 1;
      if (u.sp && u.sp.burst) this.sporeBurst(u);
      else if (u.team === 'player' && !u.def.static && this.gm.fx.martyr) this.sporeBurst(u, 1.5);
      if (u.def.banner && !u.retreat) this.floaters.push({ x: u.x, y: u.y - 40, text: 'banner down', t: 0 });
      if (u.team === 'enemy' && !u.def.static) {
        const se = this.save.seen[u.type] || (this.save.seen[u.type] = {});
        se.kills = (se.kills || 0) + 1;
        if (se.kills === 1) this.newFinds.push(u.type);
        const drop = (u.bounty || 0) * soulMul(this.save) * (u.elite ? 3 : 1);
        this.earned += drop;
        this.kills++;
        if (u.elite) { this.eliteKills = (this.eliteKills || 0) + 1; this.fx.push({ k: 'ring', x: u.x, y: u.y - 8, t: 0, life: 0.5, color: '#ffd060' }); }
        this.floaters.push({ x: u.x, y: u.y - 30, text: '+' + Math.max(1, Math.round(drop)), t: 0 });
        if (this.gm.fx.reaper && !u.def.boss && this.rng() < 0.1 && this.alive('player') < armyCap(this.save) + 6) {
          const z = this.spawn('zombie', clamp(u.x, 120, FIELD_W - 80), u.y);
          this.fx.push({ k: 'ring', x: z.x, y: z.y - 6, t: 0, life: 0.4, color: '#8fd16a' });
        }
      }
    }
    this.units = this.units.filter((u) => u.hp > 0);

    for (const f of this.floaters) f.t += dt;
    this.floaters = this.floaters.filter((f) => f.t < 1);
    for (const f of this.fx) {
      f.t += dt;
      if (f.k === 'spark') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 260 * dt; }
    }
    this.fx = this.fx.filter((f) => f.t < f.life);

    // Failure: an enemy reached the necromancer.
    for (const u of this.units) if (u.team === 'enemy' && u.x <= GATE_X) { this.finish('fail'); return; }
  }

  spark(x, y, color) {
    if (this.fx.length > 240) return;
    const a = this.rand(0, Math.PI * 2), s = this.rand(40, 120);
    this.fx.push({ k: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 50, t: 0, life: this.rand(0.2, 0.4), color });
  }

  updateUnit(u, dt) {
    u.age += dt;
    u.flash = Math.max(0, u.flash - dt);
    u.attackAnim = Math.max(0, u.attackAnim - dt);
    if (u.def.wall) return;   // walls only stand there and soak damage
    const slowed = !!u.status.slow;
    const frenzy = this.gm.fx.frenzy && u.team === 'player' && u.hp < u.maxHp * 0.5 ? 1.3 : 1;
    u.cd -= dt * (slowed ? 0.6 : 1) * frenzy * (u.buffed ? 1.2 : 1);
    u.moving = false;

    // Bosses enrage when badly hurt and some call reinforcements.
    if (u.def.boss) {
      if (!u.enraged && u.hp < u.maxHp * 0.3) {
        u.enraged = true; u.dmg *= 1.35;
        this.shake = Math.max(this.shake, 0.7); this.emit('boss');
        this.fx.push({ k: 'ring', x: u.x, y: u.y - 10, t: 0, life: 0.6, color: '#ff5040' });
        this.floaters.push({ x: u.x, y: u.y - 60, text: 'ENRAGED', t: 0 });
      }
      if (!this.result) this.bossAbilities(u, dt);
      if (u.def.summon && this.alive('enemy') < 30) {
        u.sumCd -= dt;
        if (u.sumCd <= 0) {
          u.sumCd = u.def.summon.every;
          for (let i = 0; i < u.def.summon.n; i++) this.spawn(u.def.summon.type, u.x + 14 + i * 14, undefined, true);
          this.fx.push({ k: 'ring', x: u.x, y: u.y - 10, t: 0, life: 0.5, color: '#d6596b' });
          this.floaters.push({ x: u.x, y: u.y - 60, text: 'reinforcements!', t: 0 });
          this.emit('wave');
        }
      }
    }

    // Plague aura: poisons every enemy close by.
    if (u.def.aura) {
      const A = u.def.aura, big = u.sp && u.sp.blight;
      const r = A.r * (big ? 1.5 : 1), dps = A.dps * u.dmg * (big ? 2 : 1);
      for (const o of this.units) {
        if (o.team === u.team || o.hp <= 0 || o.def.fly || Math.hypot(o.x - u.x, (o.y - u.y) * 1.5) > r) continue;
        const st = o.status.poison;
        if (st) { st.t = Math.max(st.t, 0.5); st.dps = Math.max(st.dps, dps); } else o.status.poison = { t: 0.5, dps };
      }
    }

    // Regeneration and healing abilities.
    if (u.sp && u.sp.regen) u.hp = Math.min(u.maxHp, u.hp + 0.03 * u.maxHp * dt);
    if (u.def.heal) this.tryHeal(u, dt);

    // A swing in progress lands partway through the animation.
    if (u.swing) {
      u.swing.delay -= dt;
      if (u.swing.delay <= 0) {
        const t = u.swing.target;
        u.swing = null;
        if (t.hp > 0) {
          if (u.def.range > 40) {
            this.projectiles.push({ x: u.x + u.facing * 10, y: u.y - 16 - (u.altNow || 0), target: t, dmg: u.dmg, speed: u.def.splash ? 260 : 340, src: u, splash: u.def.splash || 0, magic: !!u.def.splash, shot: u.def.shot });
          } else if (Math.hypot(t.x - u.x, (t.y - u.y) * 1.5) <= (u.def.range + t.def.radius) * 1.4) {
            this.fx.push({ k: 'slash', x: u.x + u.facing * 16, y: u.y - 18, dir: u.facing, t: 0, life: 0.2, color: u.team === 'player' ? '#d8f0c0' : '#f0d0c0' });
            this.hit(t, u.dmg, u);
            if (u.def.cleave) {
              for (const o of this.units) {
                if (o.team === u.team || o === t || o.hp <= 0 || o.def.fly) continue;
                if (Math.hypot(o.x - t.x, (o.y - t.y) * 1.5) <= u.def.cleave) this.hit(o, u.dmg * 0.7, u);
              }
              this.fx.push({ k: 'ring', x: t.x, y: t.y - 6, t: 0, life: 0.3, color: '#d8c8a0' });
            }
          }
        }
      }
    }

    let target = null, best = Infinity;
    const reachesAir = u.def.fly || u.def.range > 40;   // only flyers and ranged units can hit something in the air
    for (const o of this.units) {
      if (o.team === u.team) continue;
      if (o.def.fly && !reachesAir && o.altNow > 40) continue;   // a swooping flyer is within reach of ground melee while it is down low
      const d = Math.hypot(o.x - u.x, (o.y - u.y) * 1.5);
      if (d < best) { best = d; target = o; }
    }
    if (u.team === 'player' && best > TUNING.aggroRange) target = null;

    u.engaged = !!(target && best <= u.def.range + target.def.radius);
    if (u.def.fly) {
      // Enemy flyers that fight from range dip low every few seconds, so a horde with no archers can still reach them.
      const dipping = u.team === 'enemy' && u.def.range > 40 && u.age % 10 > 6.5;
      const want = dipping || (u.engaged && u.def.range <= 40) ? 14 : u.alt;
      u.altNow += Math.sign(want - u.altNow) * Math.min(Math.abs(want - u.altNow), (u.engaged ? 260 : 90) * dt);
    }
    if (u.engaged) {
      u.facing = Math.sign(target.x - u.x) || u.facing;
      if (u.cd <= 0) {
        u.cd = u.def.atk * (u.enraged ? 0.8 : 1);
        u.attackAnim = ATTACK_TIME;
        u.swing = { delay: SWING_DELAY, target };
        this.emit(u.def.fly ? (u.def.range > 40 ? 'breath' : 'swoop') : u.def.range > 40 ? 'shoot' : 'swing', u.team);
      }
      return;
    }

    if (u.def.static) return;
    u.fresh = true;   // out of combat: the next blow is a fresh charge

    // Work out where to go.
    let tx, ty, wander = true;
    if (target) {
      tx = target.x; ty = clamp(target.y + u.bias, LANE_MIN_Y, LANE_MAX_Y);
    } else if (u.team === 'player') {
      tx = u.homeX; ty = u.homeY;
      if (Math.abs(tx - u.x) < 6 && Math.abs(ty - u.y) < 6) {
        // Arrived: stand around, then shuffle to a nearby spot now and then.
        u.ht -= dt;
        if (u.ht <= 0) { u.ht = this.rand(2, 5); this.pickHome(u, false); }
        return;
      }
      wander = false;
    } else {
      tx = -100; ty = u.y;
    }

    const sp = u.def.speed * u.speedMul * (slowed ? 0.6 : 1) * (u.buffed ? 1.15 : 1);
    const dx = tx - u.x, dy = ty - u.y;
    if (Math.abs(dx) > 1) u.facing = Math.sign(dx);
    u.x += Math.sign(dx) * Math.min(Math.abs(dx), sp * dt);
    u.y += Math.sign(dy) * Math.min(Math.abs(dy), sp * 0.6 * dt);
    if (wander) {
      u.wt -= dt;
      if (u.wt <= 0) { u.wt = this.rand(0.4, 1.4); u.wx = this.rand(-10, 10); u.wy = this.rand(-14, 14); }
      u.x += u.wx * dt; u.y += u.wy * dt;
    }
    u.moving = true;
  }

  // Soft collision. Units that are fighting and bosses barely move, so a crowd cannot shove them around.
  separate(dt) {
    const us = this.units;
    const k = Math.min(1, dt * 12);
    const mobility = (u) => (u.def.static ? 0 : (u.engaged ? 0.1 : 1) * (u.def.boss ? 0.04 : u.def.heavy ? 0.25 : 1));
    for (let i = 0; i < us.length; i++) {
      for (let j = i + 1; j < us.length; j++) {
        const a = us[i], b = us[j];
        if (!!a.def.fly !== !!b.def.fly) continue;
        const min = (a.def.radius + b.def.radius) * TUNING.separation;
        let dx = b.x - a.x, dy = (b.y - a.y) * 1.8;
        if (Math.abs(dx) > min || Math.abs(dy) > min) continue;
        let d = Math.hypot(dx, dy);
        if (d >= min) continue;
        if (d < 0.001) { dx = this.rand(-1, 1); dy = this.rand(-1, 1); d = Math.hypot(dx, dy) || 1; }
        const push = (min - d) * k;
        const nx = dx / d, ny = dy / d;
        const wa = mobility(a), wb = mobility(b), sum = wa + wb;
        if (sum <= 0) continue;
        a.x -= nx * push * wa / sum; b.x += nx * push * wb / sum;
        a.y -= ny * push * wa / sum / 1.8; b.y += ny * push * wb / sum / 1.8;
      }
    }
    for (const u of us) { u.y = clamp(u.y, LANE_MIN_Y, LANE_MAX_Y); u.x = Math.max(20, u.x); }
  }

  finish(result) {
    this.result = result;
    this.emit(result === 'clear' ? 'win' : 'lose');
    const s = this.save;
    s.progress = s.progress || {};
    const prev = s.progress[this.zoneId] || 0;
    this.firstWin = false;
    this.zoneTaken = false;
    this.firstClear = false;
    if (result === 'clear' && !this.zone.endless) {
      if (this.wave > prev) { s.progress[this.zoneId] = this.wave; this.firstWin = true; }
      if (this.bossWave) {
        this.zoneTaken = true;
        this.firstClear = !s.cleared[this.zoneId];
        s.cleared[this.zoneId] = true;
        s.bestZone = Math.max(s.bestZone, this.zoneId);
        if (this.firstClear || this.rng() < TUNING.repeatSoulChance + 0.05 * perk(s, 'echo')) { this.champDrop = 1; s.champSouls += 1; }
      }
    }
    const share = result !== 'clear' ? TUNING.failPayout * (this.replay ? TUNING.replayPay : 1) : this.replay ? TUNING.replayPay : this.firstWin ? 1 + TUNING.firstWinBonus : 1;
    this.payout = Math.floor(this.earned * (this.zone.endless ? 1 : share));
    s.souls += this.payout;
    const st = (s.stats = s.stats || {});
    const bump = (k, n = 1) => { st[k] = (st[k] || 0) + n; };
    bump('attempts'); bump('kills', this.kills); bump('soulsEarned', this.payout);
    bump(result === 'clear' ? 'clears' : 'fails');
    if (this.firstClear) bump('zones');
    if (result === 'clear') st.fastestClear = Math.min(st.fastestClear || 1e9, this.time);
    if (this.zone.endless) {
      // Endless: the score is the number of waves fully survived. New records pay essence, champion souls and gear.
      const waves = Math.max(0, this.wave - 1);
      const prev = s.bestEndless || 0;
      this.endless = { waves, record: waves > prev, prev, essence: 0, champ: 0 };
      if (waves > prev) {
        s.bestEndless = waves;
        this.endless.essence = Math.floor((waves - prev) / 2);
        for (let w = prev + 1; w <= waves; w++) if (w % 10 === 0) this.endless.champ++;
        s.essence = (s.essence || 0) + this.endless.essence;
        s.champSouls += this.endless.champ;
      }
      this.drops = rollDrops(s, this.rng, 12 + Math.floor(waves / 5), { cleared: false, count: Math.floor(waves / 8), first: false });
    } else if (this.bossWave) {
      this.drops = rollDrops(s, this.rng, this.zoneId, { cleared: result === 'clear', first: this.firstClear });
    } else {
      this.drops = result === 'clear' && this.rng() < (this.firstWin ? 0.16 : 0.05) ? rollDrops(s, this.rng, this.zoneId, { cleared: false, count: 1 }) : [];
    }
    // Each elite killed has a 12% chance to carry a piece of gear.
    const bonus = [];
    for (let i = 0; i < Math.min(2, this.eliteKills || 0); i++) if (this.rng() < 0.05) bonus.push(...rollDrops(s, this.rng, this.zoneId, { cleared: false, count: 1 }));
    this.drops.push(...bonus);
    for (const it of this.drops) equipIfBetter(s, it);
    this.logAttempt(result);
  }

  // A short history of recent attempts, carried in the save, so balance can be judged from real play.
  logAttempt(result) {
    const s = this.save;
    s.stats.playTime = Math.round((s.stats.playTime || 0) + this.time);
    const log = (s.log = s.log || []);
    log.push({
      at: Math.round(Date.now() / 1000), zone: this.zoneId, rebirths: s.rebirths || 0, won: result === 'clear' ? 1 : 0,
      wave: this.wave, replay: this.replay ? 1 : 0, army: { ...this.roster }, secs: Math.round(this.time), power: playerRating(s),
      kills: this.kills, souls: this.payout, peak: this.peakHorde, lost: this.lost,
      danger: Math.round(100 * clamp((FIELD_W - this.deepest) / (FIELD_W - GATE_X), 0, 1)),   // 100 = they reached the gate
    });
    if (log.length > 250) log.splice(0, log.length - 250);
  }

  // Dying zombies with Spore Burst hurt nearby enemies.
  sporeBurst(u, mul = 2.5) {
    this.fx.push({ k: 'ring', x: u.x, y: u.y - 8, t: 0, life: 0.4, color: '#b070d0' });
    for (let i = 0; i < 10; i++) this.spark(u.x, u.y - 10, '#c080e0');
    for (const o of this.units) {
      if (o.team === u.team || o.hp <= 0) continue;
      if (Math.hypot(o.x - u.x, (o.y - u.y) * 1.5) <= 75) { o.hp -= u.dmg * mul; o.flash = 0.12; }
    }
  }

  // Enemies with a heal ability mend the most wounded ally in range every few seconds.
  tryHeal(u, dt) {
    u.healCd = (u.healCd === undefined ? u.def.heal.every * 0.5 : u.healCd) - dt;
    if (u.healCd > 0) return;
    const amt = u.def.heal.amt * (u.team === 'player' && u.def.dmg ? u.dmg / u.def.dmg : u.hpK || 1);
    if (u.sp && u.sp.mend) {
      let any = false;
      for (const o of this.units) {
        if (o.team !== u.team || o === u || o.hp <= 0 || o.hp >= o.maxHp * 0.95) continue;
        if (Math.hypot(o.x - u.x, (o.y - u.y) * 1.5) > u.def.heal.range) continue;
        o.hp = Math.min(o.maxHp, o.hp + amt * 0.6); any = true;
        this.fx.push({ k: 'ring', x: o.x, y: o.y - 8, t: 0, life: 0.3, color: '#fff0a0' });
      }
      u.healCd = any ? u.def.heal.every : 0.5;
      return;
    }
    let pick = null, low = 0.95;
    for (const o of this.units) {
      if (o.team !== u.team || o === u || o.hp <= 0) continue;
      if (Math.hypot(o.x - u.x, (o.y - u.y) * 1.5) > u.def.heal.range) continue;
      const r = o.hp / o.maxHp;
      if (r < low) { low = r; pick = o; }
    }
    if (!pick) { u.healCd = 0.5; return; }
    u.healCd = u.def.heal.every;
    pick.hp = Math.min(pick.maxHp, pick.hp + amt);
    this.fx.push({ k: 'ring', x: pick.x, y: pick.y - 8, t: 0, life: 0.35, color: '#fff0a0' });
    for (let i = 0; i < 4; i++) this.spark(pick.x, pick.y - 14, '#fff0a0');
  }

  hit(target, dmg, src, quiet) {
    if (target.def.dodge && this.rng() < target.def.dodge) {
      this.floaters.push({ x: target.x, y: target.y - 34, text: 'miss', t: 0 });
      return;
    }
    if (src && src.sp) {
      if (src.sp.charge && src.fresh) { dmg *= 2.5; src.fresh = false; this.fx.push({ k: 'ring', x: target.x, y: target.y - 8, t: 0, life: 0.3, color: '#ff8040' }); }
      if (src.sp.pack) dmg *= 1 + 0.1 * Math.max(0, Math.min(5, this.packSize() - 1));
      if (src.sp.poison) target.status.poison = { t: 4, dps: 0.35 * src.dmg };
      if (src.sp.fire) target.status.burn = { t: 3, dps: 0.4 * src.dmg };
      if (src.sp.inferno) target.status.burn = { t: 4, dps: 0.55 * src.dmg };
      if (src.sp.frost) target.status.slow = { t: 3 };
    }
    if (src && src.buffed) dmg *= src.buffed;
    if (target.team === 'player' && this.gm.fx.bulwark) dmg *= 0.9;
    if (target.sp && target.sp.shield) dmg *= 0.75;
    if (target.guard > 0) dmg *= 0.3;
    if (target.def.armor) dmg *= 1 - target.def.armor;
    if (target.sp && target.sp.granite && target.hp < target.maxHp * 0.3) dmg *= 0.5;
    const gm = this.gm;
    if (src && src.team === 'player' && !src.def.static) {
      if (gm.crit && this.rng() < gm.crit) { dmg *= 2; this.floaters.push({ x: target.x, y: target.y - 38, text: 'crit!', t: 0 }); }
      if (gm.lifesteal && src.hp > 0) src.hp = Math.min(src.maxHp, src.hp + dmg * gm.lifesteal);
    }
    if (gm.thorns && target.team === 'player' && src && src.team === 'enemy' && src.def.range <= 40 && src.hp > 0) src.hp -= dmg * gm.thorns;
    target.hp -= dmg;
    if (src && src.def.boss) this.shake = Math.max(this.shake, 0.45);
    if (src && src.sp && (src.sp.drain || src.sp.feast) && src.hp > 0) src.hp = Math.min(src.maxHp, src.hp + dmg * 0.5);
    if (src && src.def.lifesteal && src.hp > 0) src.hp = Math.min(src.maxHp, src.hp + dmg * src.def.lifesteal);
    if (!quiet) this.emit('hit', target.team);
    target.flash = 0.12;
    for (let i = 0; i < 3; i++) this.spark(target.x, target.y - 16, '#ffffff');
  }
}

// ---- Skill tree actions ----
export function zoneUnlocked(save, zoneId) {
  const before = zoneId === ENDLESS_ID ? !!save.cleared[12] : zoneId === 1 || !!save.cleared[zoneId - 1];
  return before && (save.rebirths || 0) >= zoneRebirth(zoneId);
}
// You may fight any wave up to the first one you have not beaten.
export const nextWave = (save, zoneId) => Math.min(BOSS_WAVE, ((save.progress || {})[zoneId] || 0) + 1);

export function addToArmy(save, type, n = 1) {
  const a = tidyArmy(save);
  if (n > 0) {
    if (!owned(save, type) || armyUsed(save) + n * ARMY_SLOTS[type] > armyCap(save)) return false;
    a[type] = (a[type] || 0) + n;
  } else {
    if (!a[type]) return false;
    a[type] = Math.max(0, a[type] + n);
    if (!a[type]) delete a[type];
  }
  return true;
}
// One more army space, bought with souls. It is filled with a zombie until you change it.
export function buyMuster(save) {
  const lvl = save.nodes.muster || 0, cost = musterCost(save);
  if (lvl >= musterCap(save) || save.souls < cost) return false;
  tidyArmy(save);
  save.souls -= cost;
  save.nodes.muster = lvl + 1;
  addToArmy(save, 'zombie', 1);
  return true;
}

export function buyUnit(save, unit) {
  const def = UNITS[unit];
  if (owned(save, unit) || save.champSouls < def.unlockCost || !gateMet(save, unit) || !unitRebirthOk(save, unit)) return false;
  save.champSouls -= def.unlockCost;
  save.nodes['unit_' + unit] = 1;
  return true;
}

export function buyLegion(save, unit) {
  const cost = legionCost(save, unit);
  if (!legionReady(save, unit) || legionOwned(save, unit) || save.souls < cost) return false;
  save.souls -= cost;
  save.nodes['legion_' + unit] = 1;
  return true;
}

export function buySpecial(save, key) {
  const sp = SPECIALS[key];
  if (hasSpecial(save, key) || !specialReady(save, key) || save.souls < sp.cost) return false;
  save.souls -= sp.cost;
  save.nodes['sp_' + key] = 1;
  return true;
}

export function buyStat(save, stat, unit) {
  const lvl = level(save, stat, unit);
  if (!owned(save, unit) || lvl >= STATS[stat].max || (save.rebirths || 0) < statNeeds(stat, lvl)) return false;
  const cost = statCost(stat, unit, lvl, save);
  if (save.souls < cost) return false;
  save.souls -= cost;
  save.nodes[stat + '_' + unit] = lvl + 1;
  return true;
}

// ---- Rebirth ----
export function buyPerk(save, key) {
  const lvl = perk(save, key);
  if (lvl >= PERKS[key].max || perkLock(save, key)) return false;
  const cost = perkCost(key, lvl);
  if (save.essence < cost) return false;
  save.essence -= cost;
  save.perks[key] = lvl + 1;
  return true;
}

// Wipe the run, pay out essence and set up the next run as the perks dictate.
export function rebirth(save) {
  if (!canRebirth(save)) return 0;
  const gain = essenceGain(save);
  const rlog = (save.rlog = save.rlog || []);
  rlog.push({ at: Math.round(Date.now() / 1000), rebirth: (save.rebirths || 0) + 1, bestZone: save.bestZone, essence: gain, power: playerRating(save), attempts: (save.stats && save.stats.attempts) || 0, playTime: (save.stats && save.stats.playTime) || 0 });
  const kept = PACT_ORDER.slice(0, perk(save, 'pact')).filter((u) => (save.nodes['unit_' + u] || 0) > 0);
  save.essence += gain;
  save.rebirths = (save.rebirths || 0) + 1;
  save.bestEver = Math.max(save.bestEver || 0, save.bestZone);
  save.souls = 0;
  save.champSouls = 0;
  save.nodes = {};
  for (const u of kept) save.nodes['unit_' + u] = 1;
  save.cleared = {};
  save.progress = {};
  save.army = {};
  // Conquered Lands can only skip zones you could reach anyway.
  const conquered = Math.min(perk(save, 'conquest'), save.bestEver);
  for (let z = 1; z <= conquered; z++) save.cleared[z] = true;
  save.skipped = conquered;
  save.bestZone = conquered;
  // Skipped zones still hand over their spoils: a champion soul each and most of the souls their waves would have paid.
  save.champSouls = conquered;
  for (let z = 1; z <= conquered; z++) for (let w = 1; w <= BOSS_WAVE; w++) save.souls += Math.floor(waveSouls(zoneById(z), w) * soulMul(save));
  return gain;
}
