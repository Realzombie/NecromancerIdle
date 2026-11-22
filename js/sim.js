// Pure battle simulation: no DOM, so it can be tested in node.
import {
  UNITS, TUNING, GATE_X, NECRO_X, FIELD_W, LANE_TOP, LANE_BOTTOM, LANE_MIN_Y, LANE_MAX_Y,
  PLAYER_UNITS, STATS, SPECIALS, SPECIAL_KEYS, TIER, owned, level, statCost, statMods, hasSpecial, specialReady, lookOf, zoneById,
  PERKS, PACT_ORDER, worldMul, perk, perkCost, soulMul, raiseMul, spellCooldown, spellCount, essenceGain, canRebirth,
  BOSS_ABILITIES, DEFENCES, defLevel, defCost, defUnlocked, wallHp, wallCount, trapFlat, trapPct, trapCount, towerDmg, towerHp, towerCount,
} from './data.js';
import { gearMods, rollDrops, equipIfBetter } from './gear.js';

let nextId = 1;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const ATTACK_TIME = 0.32;   // length of the attack animation
const SWING_DELAY = 0.13;          // the hit lands this far into the animation

export class Battle {
  constructor(save, zoneId = 1, rng = Math.random) {
    this.save = save;
    this.rng = rng;
    this.zone = zoneById(zoneId);
    this.zoneId = zoneId;
    this.bossSpawned = false;
    this.units = [];
    this.projectiles = [];
    this.floaters = [];
    this.fx = [];              // slashes and sparks (visual only)
    this.events = [];          // sound cues, drained by the UI
    this.time = 0;
    this.wave = 0;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.pause = 2;
    this.cast = 0;             // >0 while the necromancer is casting (visual)
    this.raiseTimers = {};     // seconds since each unit type was last raised
    this.result = null;        // 'fail' | 'clear'
    this.kills = 0;
    this.earned = 0;           // souls banked when the attempt ends
    this.payout = 0;
    this.champDrop = 0;        // champion souls gained from the boss
    this.spellCd = 10;         // Raise Dead spell cooldown (seconds left)
    this.gm = gearMods(save);
    this.traps = [];
    this.timers = [];          // delayed effects such as boss attack wind-ups
    this.corpses = [];         // dying units, kept briefly so the renderer can show them fall
    this.shake = 0;            // screen shake strength (visual only)
    this.setupDefences();
    const startZombies = TUNING.startZombies + perk(save, 'horde');
    for (let i = 0; i < startZombies; i++) this.spawn('zombie', 260 + (i % 8) * 36);
    for (const t of this.raiseTypes()) this.raiseTimers[t] = this.raiseInterval(t) * 0.5;
  }

  get totalWaves() { return this.zone.waves; }

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

  // Walls, towers and traps stand ready before the first wave.
  setupDefences() {
    const lane = (i, n) => LANE_TOP + 8 + (n === 1 ? 0.5 : i / (n - 1)) * (LANE_BOTTOM - LANE_TOP - 16);
    const wl = defLevel(this.save, 'wall');
    for (let i = 0, n = wallCount(wl); i < n; i++) {
      const u = this.spawn('wall', 350, lane(i, n));
      u.hp = u.maxHp = wallHp(wl) * (this.gm.fx.bulwark ? 2 : 1);
    }
    const tl = defLevel(this.save, 'tower');
    for (let i = 0, n = towerCount(tl); i < n; i++) {
      const u = this.spawn('tower', 190, lane(i, n));
      u.hp = u.maxHp = towerHp(tl);
      u.dmg = towerDmg(tl);
    }
    const pl = defLevel(this.save, 'trap');
    for (let i = 0, n = trapCount(pl); i < n; i++) this.traps.push({ x: 500 + i * 90, cd: 0, pop: 0, flat: trapFlat(pl), pct: trapPct(pl) });
  }

  emit(n, team) { if (this.events.length < 120) this.events.push({ n, team }); }

  rand(a, b) { return a + this.rng() * (b - a); }

  spawn(type, x, y, flat) {
    const def = UNITS[type];
    let hpMul = 1, dmgMul = 1;
    if (def.team === 'player' && !def.static) { const m = statMods(this.save, type); hpMul = m.hp * (1 + this.gm.hp); dmgMul = m.dmg * (1 + this.gm.dmg); }
    else {
      const w = worldMul(this.save);
      const s = def.boss || flat ? 1 : Math.pow(this.zone.scale, Math.max(0, this.wave - 1));
      hpMul = s * w.hp; dmgMul = s * w.dmg;
    }
    const u = {
      id: nextId++, type, def, team: def.team,
      x, y: y !== undefined ? y : this.rand(LANE_TOP, LANE_BOTTOM),
      hp: def.hp * hpMul, maxHp: def.hp * hpMul, dmg: def.dmg * dmgMul,
      cd: this.rng() * def.atk, flash: 0, attackAnim: 0, moving: false, engaged: false, swing: null,
      facing: def.team === 'player' ? 1 : -1,
      speedMul: this.rand(0.85, 1.15),   // so the horde does not march in lockstep
      bias: this.rand(-16, 16),          // aims a little above or below its target
      wt: 0, wx: 0, wy: 0,               // wandering drift
      ht: this.rand(1, 4),
      age: 0,
    };
    u.status = {};
    // Elites: a rare, bigger and meaner enemy that drops triple souls and may carry gear.
    if (def.team === 'enemy' && !def.boss && !flat && this.wave >= 3 && this.rng() < 0.05) {
      u.elite = true; u.hp = u.maxHp = u.maxHp * 2.2; u.dmg *= 1.3;
    }
    if (def.summon) u.sumCd = def.summon.every * 0.7;
    if (def.team === 'player' && !def.static) {
      u.look = lookOf(this.save, type);
      u.sp = {};
      for (const k of SPECIAL_KEYS) if (SPECIALS[k].unit === type && hasSpecial(this.save, k)) u.sp[k] = true;
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

  raiseTypes() { return PLAYER_UNITS.filter((t) => owned(this.save, t)); }

  raiseInterval(type) { return UNITS[type].raise * statMods(this.save, type).cooldown * raiseMul(this.save); }

  // The Raise Dead spell: a free burst of minions on a long cooldown.
  spellReady() { return !this.result && this.spellCd <= 0; }
  castSpell() {
    if (!this.spellReady()) return false;
    this.spellCd = spellCooldown(this.save);
    const pool = this.raiseTypes().filter((t) => !UNITS[t].heavy);
    for (let i = 0; i < spellCount(this.save); i++) this.spawn(pool[Math.floor(this.rng() * pool.length)], NECRO_X + 60 + i * 10);
    this.cast = 0.8;
    this.shake = Math.max(this.shake, 0.35);
    this.fx.push({ k: 'ring', x: NECRO_X + 20, y: 420, t: 0, life: 0.6, color: '#8fd16a' });
    this.emit('raise');
    return true;
  }

  raiseProgress(type) {
    return clamp((this.raiseTimers[type] || 0) / this.raiseInterval(type), 0, 1);
  }

  update(dt) {
    if (this.result) return;
    this.time += dt;
    this.cast = Math.max(0, this.cast - dt);
    this.spellCd = Math.max(0, this.spellCd - dt);
    this.shake = Math.max(0, this.shake - dt * 1.6);
    for (const c of this.corpses) c.t += dt;
    for (const tm of this.timers) { tm.t -= dt; if (tm.t <= 0) tm.fn(); }
    this.timers = this.timers.filter((tm) => tm.t > 0);
    this.corpses = this.corpses.filter((c) => c.t < 0.7);

    // The necromancer raises each unit type on its own cooldown.
    for (const type of this.raiseTypes()) {
      const t = (this.raiseTimers[type] ?? 0) + dt;
      if (t >= this.raiseInterval(type)) {
        this.raiseTimers[type] = 0;
        this.spawn(type, NECRO_X + 55);
        this.cast = 0.5;
        this.emit('raise');
      } else {
        this.raiseTimers[type] = t;
      }
    }

    // Waves
    if (this.spawnQueue.length) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawn(this.spawnQueue.shift(), FIELD_W - 30);
        this.spawnTimer = TUNING.spawnGap;
      }
    } else if (this.alive('enemy') === 0) {
      this.pause -= dt;
      if (this.pause <= 0) {
        if (this.wave >= this.totalWaves) {
          if (this.bossSpawned) { this.finish('clear'); return; }
          this.bossSpawned = true;
          this.emit('boss');
          this.spawn(this.zone.boss, FIELD_W - 30);
          this.pause = TUNING.wavePause;
          return;
        }
        this.wave++;
        this.emit('wave');
        // Shuffle so mixed waves arrive in a random order.
        this.spawnQueue = this.zone.compose(this.wave).sort(() => this.rng() - 0.5);
        this.spawnTimer = 0;
        this.pause = TUNING.wavePause;
      }
    }

    // Units
    for (const u of this.units) this.updateUnit(u, dt);
    this.separate(dt);

    // Projectiles
    for (const p of this.projectiles) {
      if (p.target.hp <= 0) { p.dead = true; continue; }
      const dx = p.target.x - p.x, dy = (p.target.y - 14) - p.y;
      const d = Math.hypot(dx, dy);
      const step = p.speed * dt;
      if (d <= step) {
        this.hit(p.target, p.dmg, p.src);
        if (p.splash) {
          this.fx.push({ k: 'ring', x: p.target.x, y: p.target.y - 10, t: 0, life: 0.3, color: '#c080e0' });
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

    // Spike traps spring when an enemy walks over them.
    for (const tr of this.traps) {
      tr.cd -= dt; tr.pop = Math.max(0, tr.pop - dt);
      if (tr.cd > 0) continue;
      let hot = false;
      for (const o of this.units) if (o.team === 'enemy' && o.hp > 0 && Math.abs(o.x - tr.x) < 34 + o.def.radius * 0.5) { hot = true; break; }
      if (!hot) continue;
      tr.cd = 1.4; tr.pop = 0.35;
      this.shake = Math.max(this.shake, 0.25);
      this.emit('trap');
      for (const o of this.units) {
        if (o.team !== 'enemy' || o.hp <= 0 || Math.abs(o.x - tr.x) > 44 + o.def.radius * 0.5) continue;
        o.hp -= tr.flat + tr.pct * o.maxHp * (o.def.boss ? 0.25 : 1);
        o.flash = 0.12;
        for (let i = 0; i < 4; i++) this.spark(o.x, o.y - 6, '#d8d0c0');
      }
    }

    // Deaths
    for (const u of this.units) {
      if (u.hp > 0) continue;
      for (let i = 0; i < 6; i++) this.spark(u.x, u.y - 14, u.team === 'player' ? '#8fd16a' : '#d6596b');
      this.emit('die', u.team);
      if (this.corpses.length < 50) this.corpses.push({ u, x: u.x, y: u.y, t: 0 });
      if (u.team === 'enemy' && this.fx.length < 260) this.fx.push({ k: 'soul', x: u.x, y: u.y - 20, t: 0, life: 1.1 });
      if (u.def.boss) this.shake = 1;
      if (u.sp && u.sp.burst) this.sporeBurst(u);
      else if (u.team === 'player' && !u.def.static && this.gm.fx.martyr) this.sporeBurst(u, 1.5);
      if (u.team === 'enemy') {
        const drop = u.def.drop * soulMul(this.save) * (u.elite ? 3 : 1);
        this.earned += drop;
        this.kills++;
        if (u.elite) { this.eliteKills = (this.eliteKills || 0) + 1; this.fx.push({ k: 'ring', x: u.x, y: u.y - 8, t: 0, life: 0.5, color: '#ffd060' }); }
        this.floaters.push({ x: u.x, y: u.y - 30, text: '+' + Math.round(drop), t: 0 });
        if (this.gm.fx.reaper && !u.def.boss && this.rng() < 0.12 && this.alive('player') < 90) {
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
    u.cd -= dt * (slowed ? 0.6 : 1) * frenzy;
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
            this.projectiles.push({ x: u.x + u.facing * 10, y: u.y - 16, target: t, dmg: u.dmg, speed: u.def.splash ? 260 : 340, src: u, splash: u.def.splash || 0, magic: !!u.def.splash });
          } else if (Math.hypot(t.x - u.x, (t.y - u.y) * 1.5) <= (u.def.range + t.def.radius) * 1.4) {
            this.fx.push({ k: 'slash', x: u.x + u.facing * 16, y: u.y - 18, dir: u.facing, t: 0, life: 0.2, color: u.team === 'player' ? '#d8f0c0' : '#f0d0c0' });
            this.hit(t, u.dmg, u);
            if (u.def.cleave) {
              for (const o of this.units) {
                if (o.team === u.team || o === t || o.hp <= 0) continue;
                if (Math.hypot(o.x - t.x, (o.y - t.y) * 1.5) <= u.def.cleave) this.hit(o, u.dmg * 0.7, u);
              }
              this.fx.push({ k: 'ring', x: t.x, y: t.y - 6, t: 0, life: 0.3, color: '#d8c8a0' });
            }
          }
        }
      }
    }

    let target = null, best = Infinity;
    for (const o of this.units) {
      if (o.team === u.team) continue;
      const d = Math.hypot(o.x - u.x, (o.y - u.y) * 1.5);
      if (d < best) { best = d; target = o; }
    }
    if (u.team === 'player' && best > TUNING.aggroRange) target = null;

    u.engaged = !!(target && best <= u.def.range + target.def.radius);
    if (u.engaged) {
      u.facing = Math.sign(target.x - u.x) || u.facing;
      if (u.cd <= 0) {
        u.cd = u.def.atk * (u.enraged ? 0.8 : 1);
        u.attackAnim = ATTACK_TIME;
        u.swing = { delay: SWING_DELAY, target };
        this.emit(u.def.range > 40 ? 'shoot' : 'swing', u.team);
      }
      return;
    }

    if (u.def.static) return;

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

    const sp = u.def.speed * u.speedMul * (slowed ? 0.6 : 1);
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
    if (result === 'clear') {
      const first = !s.cleared[this.zoneId];
      s.cleared[this.zoneId] = true;
      s.bestZone = Math.max(s.bestZone, this.zoneId);
      if (first || this.rng() < TUNING.repeatSoulChance + 0.1 * perk(this.save, 'echo')) { this.champDrop = 1; s.champSouls += 1; }
      this.firstClear = first;
    }
    this.payout = Math.floor(this.earned * (result === 'clear' ? 1 : TUNING.failPayout));
    s.souls += this.payout;
    const st = (s.stats = s.stats || {});
    const bump = (k, n = 1) => { st[k] = (st[k] || 0) + n; };
    bump('attempts'); bump('kills', this.kills); bump('soulsEarned', this.payout);
    bump(result === 'clear' ? 'clears' : 'fails');
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
      this.drops = rollDrops(s, this.rng, 12 + Math.floor(waves / 5), { cleared: false, count: Math.floor(waves / 4), first: false });
    } else {
      this.drops = rollDrops(s, this.rng, this.zoneId, { cleared: result === 'clear', first: !!this.firstClear });
    }
    // Each elite killed has a 40% chance to carry a piece of gear.
    const bonus = [];
    for (let i = 0; i < Math.min(4, this.eliteKills || 0); i++) if (this.rng() < 0.4) bonus.push(...rollDrops(s, this.rng, this.zoneId, { cleared: false, count: 1 }));
    this.drops.push(...bonus);
    for (const it of this.drops) equipIfBetter(s, it);
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
    let pick = null, low = 0.95;
    for (const o of this.units) {
      if (o.team !== u.team || o === u || o.hp <= 0) continue;
      if (Math.hypot(o.x - u.x, (o.y - u.y) * 1.5) > u.def.heal.range) continue;
      const r = o.hp / o.maxHp;
      if (r < low) { low = r; pick = o; }
    }
    if (!pick) { u.healCd = 0.5; return; }
    u.healCd = u.def.heal.every;
    pick.hp = Math.min(pick.maxHp, pick.hp + u.def.heal.amt);
    this.fx.push({ k: 'ring', x: pick.x, y: pick.y - 8, t: 0, life: 0.35, color: '#fff0a0' });
    for (let i = 0; i < 4; i++) this.spark(pick.x, pick.y - 14, '#fff0a0');
  }

  hit(target, dmg, src, quiet) {
    if (target.def.dodge && this.rng() < target.def.dodge) {
      this.floaters.push({ x: target.x, y: target.y - 34, text: 'miss', t: 0 });
      return;
    }
    if (src && src.sp) {
      if (src.sp.pack) dmg *= 1 + 0.1 * Math.min(5, this.alive('player', 'hound') - 1);
      if (src.sp.poison) target.status.poison = { t: 4, dps: 0.35 * src.dmg };
      if (src.sp.fire) target.status.burn = { t: 3, dps: 0.4 * src.dmg };
      if (src.sp.frost) target.status.slow = { t: 3 };
    }
    if (target.sp && target.sp.shield) dmg *= 0.75;
    if (target.guard > 0) dmg *= 0.3;
    const gm = this.gm;
    if (src && src.team === 'player' && !src.def.static) {
      if (gm.crit && this.rng() < gm.crit) { dmg *= 2; this.floaters.push({ x: target.x, y: target.y - 38, text: 'crit!', t: 0 }); }
      if (gm.lifesteal && src.hp > 0) src.hp = Math.min(src.maxHp, src.hp + dmg * gm.lifesteal);
    }
    if (gm.thorns && target.team === 'player' && src && src.team === 'enemy' && src.def.range <= 40 && src.hp > 0) src.hp -= dmg * gm.thorns;
    target.hp -= dmg;
    if (src && src.def.boss) this.shake = Math.max(this.shake, 0.45);
    if (src && src.sp && src.sp.drain && src.hp > 0) src.hp = Math.min(src.maxHp, src.hp + dmg * 0.5);
    if (!quiet) this.emit('hit', target.team);
    target.flash = 0.12;
    for (let i = 0; i < 3; i++) this.spark(target.x, target.y - 16, '#ffffff');
  }
}

// ---- Skill tree actions ----
export function zoneUnlocked(save, zoneId) { return zoneId === 1 || !!save.cleared[zoneId - 1]; }

export function buyUnit(save, unit) {
  const def = UNITS[unit];
  if (owned(save, unit) || save.champSouls < def.unlockCost) return false;
  save.champSouls -= def.unlockCost;
  save.nodes['unit_' + unit] = 1;
  return true;
}

export function buySpecial(save, key) {
  const sp = SPECIALS[key];
  if (hasSpecial(save, key) || !specialReady(save, key) || save.souls < sp.cost) return false;
  save.souls -= sp.cost;
  save.nodes['sp_' + key] = 1;
  return true;
}

export function buyDefence(save, key) {
  const D = DEFENCES[key];
  const cur = defLevel(save, key);
  if (!defUnlocked(save, key) || cur >= D.max) return false;
  const cost = defCost(key, cur);
  if (save.souls < cost) return false;
  save.souls -= cost;
  save.nodes['def_' + key] = cur + 1;
  return true;
}

export function buyStat(save, stat, unit) {
  const lvl = level(save, stat, unit);
  if (!owned(save, unit) || lvl >= STATS[stat].max) return false;
  const cost = statCost(stat, unit, lvl);
  if (save.souls < cost) return false;
  save.souls -= cost;
  save.nodes[stat + '_' + unit] = lvl + 1;
  return true;
}

// ---- Rebirth ----
export function buyPerk(save, key) {
  const lvl = perk(save, key);
  if (lvl >= PERKS[key].max) return false;
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
  const kept = PACT_ORDER.slice(0, perk(save, 'pact')).filter((u) => (save.nodes['unit_' + u] || 0) > 0);
  save.essence += gain;
  save.rebirths = (save.rebirths || 0) + 1;
  save.bestEver = Math.max(save.bestEver || 0, save.bestZone);
  save.souls = 0;
  save.champSouls = 0;
  save.nodes = {};
  for (const u of kept) save.nodes['unit_' + u] = 1;
  save.cleared = {};
  const conquered = perk(save, 'conquest');
  for (let z = 1; z <= conquered; z++) save.cleared[z] = true;
  save.bestZone = conquered;
  return gain;
}
