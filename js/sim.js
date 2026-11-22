// Pure battle simulation: no DOM, so it can be tested in node.
import {
  UNITS, TUNING, ZONES, GATE_X, NECRO_X, FIELD_W, LANE_TOP, LANE_BOTTOM, LANE_MIN_Y, LANE_MAX_Y, upgradeCost,
} from './data.js';

let nextId = 1;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export class Battle {
  constructor(save, zone = 1, rng = Math.random) {
    this.save = save;
    this.rng = rng;
    this.zoneId = zone;
    this.zone = ZONES[zone];
    this.bossSpawned = false;
    this.units = [];
    this.projectiles = [];
    this.floaters = [];
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
    for (let i = 0; i < TUNING.startZombies; i++) this.spawn('zombie', 150 + i * 30);
    for (const t of this.raiseTypes()) this.raiseTimers[t] = this.raiseInterval(t) * 0.5;
  }

  get totalWaves() { return this.zone.waves; }

  mods() {
    const u = this.save.upgrades;
    return { hp: 1 + TUNING.upgradeStatPerLevel * u.hp, dmg: 1 + TUNING.upgradeStatPerLevel * u.dmg };
  }

  rand(a, b) { return a + this.rng() * (b - a); }

  spawn(type, x) {
    const def = UNITS[type];
    let hpMul = 1, dmgMul = 1;
    if (def.team === 'player') { const m = this.mods(); hpMul = m.hp; dmgMul = m.dmg; }
    else if (type !== 'champion') { const s = Math.pow(TUNING.waveScale, Math.max(0, this.wave - 1)); hpMul = s; dmgMul = s; }
    const u = {
      id: nextId++, type, def, team: def.team,
      x, y: this.rand(LANE_TOP, LANE_BOTTOM),
      hp: def.hp * hpMul, maxHp: def.hp * hpMul, dmg: def.dmg * dmgMul,
      cd: this.rng() * def.atk, flash: 0, attackAnim: 0, moving: false,
      speedMul: this.rand(0.85, 1.15),   // so the horde does not march in lockstep
      bias: this.rand(-16, 16),          // aims a little above or below its target
      wt: 0, wx: 0, wy: 0,               // wandering drift
      ht: this.rand(1, 4),
    };
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
    for (const u of this.units) if (u.team === team && (!type || u.type === type)) n++;
    return n;
  }

  raiseTypes() {
    return Object.keys(UNITS).filter((t) => UNITS[t].team === 'player' && this.save.bestZone >= UNITS[t].unlockZone);
  }

  raiseInterval(type) {
    return UNITS[type].raise * Math.pow(TUNING.raiseCooldownFactor, this.save.upgrades.raise);
  }

  raiseProgress(type) {
    return clamp((this.raiseTimers[type] || 0) / this.raiseInterval(type), 0, 1);
  }

  update(dt) {
    if (this.result) return;
    this.time += dt;
    this.cast = Math.max(0, this.cast - dt);

    // The necromancer raises each unit type on its own cooldown.
    for (const type of this.raiseTypes()) {
      const t = (this.raiseTimers[type] ?? 0) + dt;
      if (t >= this.raiseInterval(type)) {
        this.raiseTimers[type] = 0;
        this.spawn(type, NECRO_X + 55);
        this.cast = 0.5;
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
          this.spawn('champion', FIELD_W - 30);
          this.pause = TUNING.wavePause;
          return;
        }
        this.wave++;
        const n = this.zone.waveCount(this.wave);
        this.spawnQueue = Array(n).fill('peasant');
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
      if (d <= step) { this.hit(p.target, p.dmg); p.dead = true; }
      else { p.x += dx / d * step; p.y += dy / d * step; p.angle = Math.atan2(dy, dx); }
    }
    this.projectiles = this.projectiles.filter((p) => !p.dead);

    // Deaths
    for (const u of this.units) {
      if (u.hp > 0) continue;
      if (u.team === 'enemy') {
        this.earned += u.def.drop;
        this.kills++;
        this.floaters.push({ x: u.x, y: u.y - 30, text: '+' + u.def.drop, t: 0 });
      }
    }
    this.units = this.units.filter((u) => u.hp > 0);

    for (const f of this.floaters) f.t += dt;
    this.floaters = this.floaters.filter((f) => f.t < 1);

    // Failure: an enemy reached the necromancer.
    for (const u of this.units) if (u.team === 'enemy' && u.x <= GATE_X) { this.finish('fail'); return; }
  }

  updateUnit(u, dt) {
    u.flash = Math.max(0, u.flash - dt);
    u.attackAnim = Math.max(0, u.attackAnim - dt);
    u.cd -= dt;
    u.moving = false;

    let target = null, best = Infinity;
    for (const o of this.units) {
      if (o.team === u.team) continue;
      const d = Math.hypot(o.x - u.x, (o.y - u.y) * 1.5);
      if (d < best) { best = d; target = o; }
    }
    if (u.team === 'player' && best > TUNING.aggroRange) target = null;

    if (target && best <= u.def.range) {
      if (u.cd <= 0) {
        u.cd = u.def.atk;
        u.attackAnim = 0.2;
        if (u.def.range > 40) this.projectiles.push({ x: u.x, y: u.y - 14, target, dmg: u.dmg, speed: 320 });
        else this.hit(target, u.dmg);
      }
      return;
    }

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

    const sp = u.def.speed * u.speedMul;
    const dx = tx - u.x, dy = ty - u.y;
    u.x += Math.sign(dx) * Math.min(Math.abs(dx), sp * dt);
    u.y += Math.sign(dy) * Math.min(Math.abs(dy), sp * 0.6 * dt);
    if (wander) {
      u.wt -= dt;
      if (u.wt <= 0) { u.wt = this.rand(0.4, 1.4); u.wx = this.rand(-10, 10); u.wy = this.rand(-14, 14); }
      u.x += u.wx * dt; u.y += u.wy * dt;
    }
    u.moving = true;
  }

  // Soft collision: units push each other apart but may overlap a little.
  separate(dt) {
    const us = this.units;
    const k = Math.min(1, dt * 10);
    for (let i = 0; i < us.length; i++) {
      for (let j = i + 1; j < us.length; j++) {
        const a = us[i], b = us[j];
        const min = (a.def.radius + b.def.radius) * TUNING.separation;
        let dx = b.x - a.x, dy = (b.y - a.y) * 1.8;
        if (Math.abs(dx) > min || Math.abs(dy) > min) continue;
        let d = Math.hypot(dx, dy);
        if (d >= min) continue;
        if (d < 0.001) { dx = this.rand(-1, 1); dy = this.rand(-1, 1); d = Math.hypot(dx, dy) || 1; }
        const push = (min - d) * 0.5 * k;
        const nx = dx / d, ny = dy / d;
        a.x -= nx * push; b.x += nx * push;
        a.y -= ny * push / 1.8; b.y += ny * push / 1.8;
      }
    }
    for (const u of us) { u.y = clamp(u.y, LANE_MIN_Y, LANE_MAX_Y); u.x = Math.max(20, u.x); }
  }

  finish(result) {
    this.result = result;
    if (result === 'clear') this.save.bestZone = Math.max(this.save.bestZone, this.zoneId);
    this.payout = Math.floor(this.earned * (result === 'clear' ? 1 : TUNING.failPayout));
    this.save.souls += this.payout;
  }

  hit(target, dmg) {
    target.hp -= dmg;
    target.flash = 0.1;
  }
}

export function buyUpgrade(save, key) {
  const cost = upgradeCost(key, save.upgrades[key]);
  if (save.souls < cost) return false;
  save.souls -= cost;
  save.upgrades[key]++;
  return true;
}
