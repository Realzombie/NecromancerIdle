# Necromancer Incremental – Design Doc

Nov 21, 2026 · @Will

## Vision and pillars

A phone-first pixel-art necromancer incremental: a tiny, scrappy horde grows into a screen-filling army and conquers a world map, one zone at a time.

- **Scrappy start:** each run begins with a handful of weak, countable units, and growth from a few to a swarm is the main payoff.
- **Visible progression:** every meaningful purchase changes what is on screen (new sprite, unit, wall or armour tier). Pure number bumps come later.
- **Structural prestige:** resets change how a run starts (more units, upgraded starts, earlier unlocks), not just flat percentages.
- **Gear that shows:** random drops change both power and the look of your units.
- **Built for short sessions:** 5-10 minutes at a time with roughly hour-long gaps, so it must reward check-ins without demanding constant play.

## Core loop and battlefield

Your horde marches from the left, enemy waves arrive from the right, and kills drop souls that you spend on more units and upgrades.

1. Your necromancer's gate on the left raises minions automatically.
2. Minions advance and fight each wave; ranged units stand behind the front line.
3. Kills drop souls, and sometimes gear.
4. Spend souls on more units, faster raising, new unit types and defences.
5. Clear the zone's waves and boss to take it and unlock the next.

The game plays itself. Optional taps and a cooldown spell (for example a "Raise Dead" burst) speed things up but are never required.

To keep big armies readable on a phone, the real unit count is capped on screen. Larger numbers are shown as bigger or more densely packed sprites, so a swarm of 80 sprites can stand for thousands of units.

## Units and visual progression

Units are drawn from small pixel grids built from layers (body, helmet, armour, weapon) with palette swaps, so tiers are cheap to produce and easy to extend. Higher tiers use bigger grids, so a behemoth visibly dwarfs a starting zombie.

| Line | Tier ladder (early → late) |
| --- | --- |
| Zombies | Tiny ragged zombie → leather → chainmail → plate → bloated brute → stitched abomination → bone-and-flesh behemoth |
| Skeleton archers | Bone archer → crossbow → longbow with fire arrows → ghost sniper |
| Casters | Acolyte → hexer → bone mage → lich (small bolt up to a screen-wide curse) |

Every unit line has equipment slots that change its sprite when upgraded or geared (see Gear). Palette variants (bone, rusted, ghostly, fire) give extra variety from one base shape.

## World map

Progress is a node map of regions, each split into zones, and you take territory one zone at a time, with some zones deliberately much harder than their neighbours.

- **Power rating:** every zone shows a rating to compare against your own. Some zones are walls meant to wait until after a prestige.
- **Bosses:** each region ends in a boss, with a guaranteed first-kill gear drop.
- **Territory rewards:** a conquered zone gives a permanent passive reward (a souls trickle, starting-unit bonus or extra gear drop table), and it turns undead-coloured on the map.
- **Counter-attacks (later):** enemies can raid zones you hold, which gives defences a purpose.
- **Two ways past a wall:** push for gear, or wait while souls accrue (see Session pacing).

## Defences

Defences slow enemies so your ranged units get more shots, and unlock gradually (the first at around 5 zombies).

- **Bone walls:** block and slow the enemy front line.
- **Spike traps:** damage enemies as they advance.
- **Graveyard towers:** spawn extra skeletons or buff nearby units.
- **Obelisks:** project an aura (speed, damage or lifesteal).

A later upgrade rebuilds destroyed walls for free, and a prestige unlock starts runs with defences already standing.

## Gear

Gear is random, comes from zones and bosses, raises your power rating, and changes how your units look.

- **Rarity tiers:** Common → Magic → Rare → Epic → Legendary. Higher tiers have more stat rolls and sometimes a special effect (for example, zombies that explode on death).
- **Random rolls:** each piece rolls its stats within its tier.
- **Zone drop tables:** each zone has a fixed pool of items, so you know what you are chasing. Harder zones and bosses weight the odds towards higher rarities.
- **Bad luck protection:** a pity counter guarantees a Rare after a run of low drops.
- **Salvage:** spare gear breaks down into a currency for upgrading and rerolling kept items.
- **Visible on sprites:** equipped gear changes the look of every unit of that type.
- **Survives prestige:** the collection is kept when you Ascend.

## Prestige (Ascend to Lich)

Ascending resets the run but changes how every future run begins, through structural unlocks rather than flat percentage boosts.

- **More starting units:** begin with 3, then 6, then 12 zombies already raised.
- **Pre-upgraded starts:** your first units begin with leather, then chain armour.
- **Earlier unlocks:** archers appear in the first minute instead of after ten.
- **Skipped zones:** the earliest regions are auto-conquered.
- **Pre-built defences:** runs start with walls already standing.
- **New mechanics:** a second lane, a summoning circle, a champion slot.

## Session pacing

The game is tuned for 5-10 minute sessions with gaps of about an hour, and every session should have a clear goal: try a zone, spend banked souls, or equip a drop.

- **Offline progress:** souls accrue while you are away, capped at 8 hours to start, with unlocks that raise the cap in steps up to 24 hours, so overnight and workday absences still pay out.
- **Zone attempts:** about 2-4 minutes each, so one session is two or three attempts plus upgrading between them.
- **Push route (active):** fight zones above your comfort level to earn gear drops, which raise your power rating. Faster per minute but riskier.
- **Wait route (idle):** let souls accrue and spend them on units and upgrades until the rating is high enough. Slower but safe.
- **Failed attempts still pay:** a few souls and a small chance of gear, so no attempt is wasted.
- **On return:** show what was earned while away.

## Tech approach and first prototype

Build a single-file HTML5 canvas game, installable on the phone as a PWA, with saves in local storage. Sprites are generated from pixel grids in code. The game is built with AI doing the coding, so the focus is on quick iteration and reloadable test builds.

First prototype scope:

- One lane, with zombies and skeleton archers.
- Peasant waves and one boss.
- Souls, the raise and upgrade loop, and a tiny starting horde.
- Offline progress with a simple cap.

Later passes add the world map, gear, defences and prestige.

## Decisions (Nov 21, 2026)

- **Working style:** Will is the manager and does not code. Claude owns all implementation and tech choices, checks in after each working increment, and commits and pushes as it goes.
- **Stack:** HTML5 canvas with plain ES modules (no build step), split into small files (`sim`, `render`, `ui`, `save`, `data`) so it can grow. Installable as a PWA and hosted on GitHub Pages so Will can open it on his phone. Chosen over Godot because Claude can run and check it directly in a browser. Godot sideloading stays a fallback.
- **Orientation:** landscape.
- **Combat:** real-time simulation with HP, damage and attack speed, visible on the battlefield. The on-screen sprite cap is on hold until numbers show it is needed. If it is, add group sprites (one sprite stands for 10, another for 100) rather than capping.
- **Failure:** a failure screen with a button back to the home page. The horde does not raise units mid-fight at first. Mid-fight resurrection is a later upgrade.
- **Prototype boss:** a tanky peasant champion.
- **Offline:** never advances zones. Souls accrue at a rate based on the highest zone cleared, capped at 8 hours.
- **Unlocks:** deliberately slower than the original doc. New unit types unlock after winning a round or two.

## Starting numbers (prototype, all tunable)

Put these in one `data` file so they are easy to change.

| Thing | HP | Damage | Attack interval | Speed | Range | Base cost | Cost growth |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Zombie | 30 | 4 | 1.0s | 40 | melee | 10 souls | x1.15 per owned |
| Skeleton archer | 15 | 6 | 1.2s | 35 | 150 | 50 souls | x1.18 per owned |
| Peasant | 20 | 3 | 1.2s | 35 | melee | drops 2 souls | n/a |
| Peasant champion (boss) | 400 | 12 | 1.0s | 30 | melee | drops 100 souls | n/a |

- **Start:** 3 zombies, 0 souls.
- **Gate:** raises one purchased unit at a time, every 4s by default. Upgrade the raise speed (base 25 souls, x1.5 per level).
- **Zone 1:** 8 waves then the boss. Wave n has 3 + 2n peasants, with HP and damage scaled by 1.12^n.
- **Unit upgrades:** HP and damage, base 30 souls, x1.4 per level.
- **Unlock:** skeleton archers unlock after clearing zone 1.
- **Offline souls:** 20 per minute x (highest zone cleared)^1.3, capped at 8 hours.

## Build log

- **Souls model:** kills fund raising units during an attempt (run souls). When the attempt ends, the banked payout (all on a win, half on a loss) funds upgrades. Starting run souls 30.
- **Boss:** after wave 8 the Peasant Champion (400 HP, 12 damage, unscaled) spawns alone. Killing it clears the zone. The first clear unlocks skeleton archers, which the gate raises at about half the zombie count.
- **Offline souls:** 2 per minute x (highest zone cleared)^1.3, capped at 8 hours, shown as a "Welcome back" note on the home screen. The 20 per minute in the original numbers was far too rich against upgrade costs. Only saved while the page is visible, so the away time is real.
- **Tuning changes from the starting numbers:** zombie 40 HP and 5 damage, zombie cost growth 1.12, peasant drops 4 souls, waves have 2+n peasants, wave scaling 1.08.
- **Tools:** `node tools/simtest.mjs` runs a headless balance check, `node tools/serve.mjs` serves the game locally. Live at https://realzombie.github.io/NecromancerIdle/.
- **PWA:** manifest (landscape, fullscreen), generated icons (`node tools/makeicons.mjs`) and a network-first service worker `sw.js`. Bump `CACHE` in `sw.js` and add new files to `SHELL` when files are added. Offline saves never depended on it (they use local storage).
