// Pure battle simulation: no DOM, so it can be tested in node.
import { UNITS, TUNING, ZONES, GATE_X, FIELD_W, LANE_TOP, LANE_BOTTOM, upgradeCost } from './data.js';

let nextId = 1;

export class Battle {
  constructor(save, zone = 1, rng = Math.random) {
    this.save = save;
    this.rng = rng;
    this.zone = ZONES[zone];
    this.units = [];
    this.projectiles = [];
    this.floaters = [];
    this.time = 0;
    this.wave = 0;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.pause = 2;
    this.raiseTimer = 0;
    this.result = null; // 'fail' | 'clear'
    this.kills = 0;
    this.runSouls = TUNING.runStartSouls; // spent on raising units this attempt
    this.earned = 0;                      // banked when the attempt ends
    this.payout = 0;
    for (let i = 0; i < TUNING.startZombies; i++) this.spawn('zombie', GATE_X + 24 + i * 14);
  }

  get totalWaves() { return this.zone.waves; }

  mods() {
    const u = this.save.upgrades;
    return { hp: 1 + TUNING.upgradeStatPerLevel * u.hp, dmg: 1 + TUNING.upgradeStatPerLevel * u.dmg };
  }

  spawn(type, x) {
    const def = UNITS[type];
    let hpMul = 1, dmgMul = 1;
    if (def.team === 'player') { const m = this.mods(); hpMul = m.hp; dmgMul = m.dmg; }
    else { const s = Math.pow(TUNING.waveScale, Math.max(0, this.wave - 1)); hpMul = s; dmgMul = s; }
    const u = {
      id: nextId++, type, def, team: def.team,
      x, y: LANE_TOP + this.rng() * (LANE_BOTTOM - LANE_TOP),
      hp: def.hp * hpMul, maxHp: def.hp * hpMul, dmg: def.dmg * dmgMul,
      cd: this.rng() * def.atk, flash: 0, attackAnim: 0, moving: false,
    };
    this.units.push(u);
    return u;
  }

  alive(team, type) {
    let n = 0;
    for (const u of this.units) if (u.team === team && (!type || u.type === type)) n++;
    return n;
  }

  cost(type) {
    const d = UNITS[type];
    return Math.ceil(d.cost * Math.pow(d.growth, this.alive('player', type)));
  }

  raiseInterval() {
    return TUNING.raiseInterval / (1 + TUNING.raiseSpeedPerLevel * this.save.upgrades.raise);
  }

  update(dt) {
    if (this.result) return;
    this.time += dt;

    // Gate raises zombies automatically when affordable.
    this.raiseTimer = Math.min(this.raiseTimer + dt, this.raiseInterval());
    if (this.raiseTimer >= this.raiseInterval()) {
      const c = this.cost('zombie');
      if (this.runSouls >= c) {
        this.runSouls -= c;
        this.spawn('zombie', GATE_X + 20);
        this.raiseTimer = 0;
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
        if (this.wave >= this.totalWaves) { this.finish('clear'); return; }
        this.wave++;
        const n = this.zone.waveCount(this.wave);
        this.spawnQueue = Array(n).fill('peasant');
        this.spawnTimer = 0;
        this.pause = TUNING.wavePause;
      }
    }

    // Units
    for (const u of this.units) {
      u.flash = Math.max(0, u.flash - dt);
      u.attackAnim = Math.max(0, u.attackAnim - dt);
      let target = null, best = Infinity;
      for (const o of this.units) {
        if (o.team === u.team) continue;
        const d = Math.hypot(o.x - u.x, (o.y - u.y) * 1.5);
        if (d < best) { best = d; target = o; }
      }
      u.moving = false;
      u.cd -= dt;
      if (target && best <= u.def.range) {
        if (u.cd <= 0) {
          u.cd = u.def.atk;
          u.attackAnim = 0.2;
          if (u.def.range > 40) {
            this.projectiles.push({ x: u.x, y: u.y - 14, target, dmg: u.dmg, speed: 320 });
          } else {
            this.hit(target, u.dmg);
          }
        }
      } else {
        const dir = u.team === 'player' ? 1 : -1;
        if (target) {
          const dx = target.x - u.x;
          u.x += Math.sign(dx || dir) * Math.min(Math.abs(dx), u.def.speed * dt);
          const dy = target.y - u.y;
          u.y += Math.sign(dy) * Math.min(Math.abs(dy), u.def.speed * 0.5 * dt);
        } else {
          u.x += dir * u.def.speed * dt;
        }
        u.moving = true;
      }
    }

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
        this.runSouls += u.def.drop;
        this.earned += u.def.drop;
        this.kills++;
        this.floaters.push({ x: u.x, y: u.y - 30, text: '+' + u.def.drop, t: 0 });
      }
    }
    this.units = this.units.filter((u) => u.hp > 0);

    for (const f of this.floaters) f.t += dt;
    this.floaters = this.floaters.filter((f) => f.t < 1);

    // Failure: an enemy reached the gate.
    for (const u of this.units) if (u.team === 'enemy' && u.x <= GATE_X) { this.finish('fail'); return; }
  }

  finish(result) {
    this.result = result;
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
