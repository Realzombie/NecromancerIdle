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
- **Playtest round 1 (Nov 22):** the gate is now the necromancer, who changes look with total upgrade levels (Grave Robber, Hexer, Bone Lord, Lich, thresholds in `NECRO_TIERS`). Raising is a pure per-unit-type cooldown (zombie 10s, archer 18s, each Rise Faster level x0.88), no longer paid for with souls, so future unit types never compete for kills. Kills now only bank souls for upgrades. Units collide softly, wander slightly, have a dark outline and a team-coloured shadow. Player units only engage enemies within 260px and otherwise mill around a rally zone mid-field, so fights happen on screen. Home screen is now a card-style upgrade panel with pixel icons beside the visible necromancer. The battlefield has a castle, trees, graves, bats and fog.
- **Playtest round 2 (Nov 22):**
  - **Zones:** four zones in the first region (Graveyard Fields, Burned Farmstead, Chapel Hill, Castle Gatehouse) on a zone map screen. Each unlocks after the previous is cleared, shows a rating against your power, and ends in a boss. Enemy types: peasant, militia spearman, slinger (ranged), knight, plus a boss per zone (Peasant Champion, Militia Captain, Mad Priest, Knight Commander). Zone data lives in `ZONES` in `js/data.js`.
  - **Champion souls:** the first boss kill of each zone guarantees one, repeat kills have a 25% chance. They are spent in the skill tree to unlock units.
  - **Skill tree:** one column per unit line. Zombie is owned. Skeleton Archer and Skeleton Warrior cost 1 champion soul, Zombie Hound costs 2. Each owned unit has three soul-bought nodes (Tougher, Sharper, Rise Faster). Defined in `STATS` and `UNITS` in `js/data.js`. Old saves are migrated in `js/save.js`.
  - **Combat feel:** attacks have a wind-up, lunge and lean with slash arcs, hit sparks, and arrows. Damage lands partway through the swing. Reach is measured edge to edge, so melee units can always hit big bosses. Units that are fighting and bosses barely move when pushed, so crowds cannot shove a boss back. Personal space is 1.25x combined radius. Idle units rally mid-field.
  - **Balance (from `node tools/simtest.mjs`):** a simple bot clears each zone in about 3 attempts (zone 4 in 5). Late zone attempts run 5-7 minutes, which is longer than the 2-4 minute goal. Revisit.
- **Sound and difficulty (Nov 22):** `js/audio.js` synthesises every sound effect with Web Audio (no asset files): swings, hits, arrows, deaths, raising, wave and boss horns, win and lose stings, button clicks and buys. The sim emits cues into `battle.events` and `main.js` plays them, rate-limited so big fights stay readable. Audio unlocks on the first tap, with a mute button (bottom right, remembered in local storage). Difficulty was raised: enemy wave scaling per zone is now 1.09 / 1.15 / 1.16 / 1.17, peasants drop 3 souls, zombie cooldown is 12s, and zone ratings are 35 / 95 / 180 / 245. The simtest bot now needs about 5-7 attempts per zone. No music yet.
- **Skill web and unit evolution (Nov 22):**
  - **Web UI (`js/web.js`):** the skill tree is now a pannable, zoomable web (drag, pinch or wheel). Tap the necromancer hub to open the four unit branches, tap an owned unit to open its upgrades, tap any node to read it and buy from the panel at the bottom. Layout and node logic are in `build()` and `describe()`.
  - **Tiered stats (`TIER`, `STATS`, `TIER_NAMES` in `js/data.js`):** HP and damage are chains of 3 tiers of 5 levels each (bonus per level 20% / 30% / 45%, cost x1.6 per tier). The save still stores one total level per chain. Finishing a tier unlocks the next and changes the unit's look. Rise Faster stays a single 8-level node.
  - **Looks (`js/looks.js`):** sprites are composed from a base body plus rects added per finished tier. Zombies go from rotten, to stitched, to armoured, to warplated (HP), and from stubs to claws to razor claws to bone blades (damage). Archers, skeletons and hounds get caps and helms, shields, blades, bows, fangs and bone armour.
  - **Unique abilities (`SPECIALS`):** Toxic Bite (zombie, poison over time), Spore Burst (zombie, damages nearby enemies on death), Fire Arrows (archer, burning), Shield Wall (skeleton, -25% damage taken), Pack Hunter (hound, +10% damage per other hound up to 5). Each unlocks after finishing the first tier of the matching chain and is bought with souls.
  - **Balance:** simtest bot still needs about 5-6 attempts per zone. Zone ratings now 35 / 100 / 200 / 285.
- **Big content update (Nov 22, built while Will was at lunch, creative freedom):**
  - **New summons:** Bone Mage (ranged, splash bolts), Ghost (30% dodge, hovers, translucent), Abomination (huge, slow, cleaves everything near it, hard to push). Each has 3-tier HP and damage chains with evolving looks (`js/looks.js`) and a unique ability: Frost Bolt (slows), Soul Drain (heals the ghost), Regeneration (3% max HP per second). Zombie Hound now costs 1 champion soul. The web has 7 units around the hub and only one unit's branches open at a time.
  - **Regions:** zones are now grouped into regions with tabs on the map and their own battlefield theme (`REGIONS`, `THEMES`). Region 2 "The Crusader Reach" (zones 5-8, dawn sky): crusaders, crossbowmen, clerics (heal allies), paladins and four bosses ending in the Holy Avenger. Region 3 "The Heroes' Reach" (zones 9-12, snowy night): berserkers, archmages (splash), assassins (35% dodge), sentinels and four bosses ending in the Hero King (heals). Enemies can now use splash, dodge and heals too.
  - **Rebirth (`rebirth()` in `js/sim.js`, perks in `PERKS` in `js/data.js`):** unlocks after clearing zone 3. It wipes souls, champion souls, the skill tree and cleared zones, and pays Essence (3 x zone^1.35 per cleared zone, plus 1 per 12 upgrade levels). Essence buys permanent perks: Larger Vanguard (start zombies), Soul Siphon (+15% souls), Quickening (-4% raise cooldowns), Prepared Dead (units start at a minimum HP/damage level), Eternal Pact (keep unit unlocks), Conquered Lands (zones start cleared), Restless Dead (offline cap and rate), Champion's Echo (repeat boss soul chance), Dark Ritual (stronger, quicker Raise Dead). Each rebirth also adds 5% souls and counts towards the necromancer's rank.
  - **Raise Dead spell:** a button bottom-left in battle that instantly raises 3 minions (45s cooldown, improved by Dark Ritual).
  - **Tools:** `node tools/rebirthsim.mjs [runs]` plays several rebirth cycles with a greedy bot to check the speed-up. `node tools/rebirthtest.mjs` checks the rebirth rules.
- **Zone clear celebration:** clearing a zone now plays a ~4 second animation before the result screen (`drawVictory` in `js/render.js`, hooked in `frame()` in `js/main.js`): the battlefield dims, golden rays spin, a "ZONE CLEARED" banner pops in with a gold burst, the horde hops, the rewards (boss, souls, champion soul) appear line by line and green souls drift up. Tap after a beat to skip.
- **Armoury, gear, defences, records and endless mode (Nov 22, built during a second creative-freedom stretch):**
  - **Gear (`js/gear.js`, pure logic):** random drops in three slots (weapon: damage, armour: health, charm: souls) across five rarities (Common to Legendary). Higher rarities roll more extra stats (crit, lifesteal, raise speed, spell recharge, thorns and more) and Epic/Legendary pieces can carry a special effect (Martyr: dying minions explode, Frenzy: wounded minions attack faster, Reaper: kills can raise a free zombie, Bulwark: double wall health). Item level follows the zone. Drops come at the end of every attempt (more on a clear, a small chance on a fail), the first clear of a zone guarantees a Rare or better, and a pity counter forces a Rare after 7 drops without one. Better pieces are auto-equipped. Salvage gives bone dust, which upgrades items (+10 max, +6% stats each) and rerolls extra stats. The collection survives rebirth. Equipped rarity shows as a coloured glow on your units (`topRarity` in `js/render.js`).
  - **Defences (`DEFENCES` in `js/data.js`, `setupDefences` in `js/sim.js`):** Bone Walls (static units that soak damage, zone 1 unlocks), Spike Traps (spring when enemies walk over them, flat plus percent-of-max-HP damage, bosses take a quarter of the percent, zone 2) and Graveyard Towers (static archers, zone 3). Bought with souls, reset by rebirth unless the new Fortified Start perk is owned.
  - **Armoury screen (`js/armoury.js`):** tabs for Gear (equipped slots, bag, inspect, equip, upgrade, reroll, salvage), Defences and Records. Home shows a badge for new gear.
  - **Records (`js/records.js`):** 21 achievements that pay bone dust, champion souls or essence once, with a toast when earned and a chip on the result screen. Lifetime stats live in `save.stats`.
  - **Endless Crypt (zone 13, region 4):** unlocks after zone 12. Waves never end and scale 1.1x each. New record waves pay essence (1 per 2 waves), a champion soul every 10 waves and gear. `node tools/endlesstest.mjs [rebirths] [upgradeFraction]` checks how far a maxed horde gets (about 28-36 waves, 17-24 minutes).
  - **Quality of life:** an Auto toggle in battle (fights the same zone again 3s after each result until you return home), a Fight Again button, ambient synthesised music with its own toggle, the boss name in the "approaches" banner, and sounds for traps, drops and achievements.
  - **Balance:** gear plus defences made the bot clear zones in about 1-3 attempts, so gear strength was trimmed (rarity multipliers 1/1.3/1.7/2.2/2.8, item level +10% per zone, extras at 60%, caps on rise, spell, crit, lifesteal and thorns). World scaling per rebirth is now geometric (enemy HP x1.7, damage x1.3, displayed rating x1.5 per rebirth). `node tools/simtest.mjs` now also buys defences (`NODEF=1` leaves them out).
- **Graphics pass (Nov 22):** all in `js/render.js` plus a few visual-only fields in `js/sim.js` (`corpses`, `shake`, `u.age`, `soul` fx).
  - **Backdrops:** drifting clouds, jagged far peaks behind the hills, a moon halo, a proper clipped crescent, graveyard lightning flashes, frost aurora, ground that darkens towards the viewer, flagstones on the path, and flickering lamp posts with additive light pools. Each theme has its own weather: green wisps (graveyard), snow (frost), golden motes (holy).
  - **Foreground and finish:** swaying grass in front of the units and a cached vignette over everything.
  - **Units:** they rise out of the ground when raised, breathe while idle, and topple over, sink and fade when killed (corpses live 0.7s). Enemy kills release a drifting soul wisp.
  - **Effects:** glowing magic bolts with trails (frost blue, enemy red, mage purple), fire arrows with an ember trail, screen shake on boss hits, traps, boss deaths and Raise Dead, and a rotating rune circle under the necromancer that flares when casting.
- **Extras round (Nov 22):**
  - **Elites:** from wave 3, 5% of ordinary enemies spawn as elites (2.2x HP, 1.3x damage, drawn bigger with a gold glow, triple souls). Each elite killed in an attempt has a 40% chance (up to 4) of an extra gear drop.
  - **Boss mechanics:** every boss enrages below 30% HP (+35% damage, attacks 20% faster, red tint, shake). The Militia Captain, Mad Priest, Inquisitor, Templar Lord and Hero King also call reinforcements on a timer (`summon` in `UNITS`); adds spawn at base strength.
  - **Pause button** in battle, phone vibration on boss, win and lose.
  - **Export and import save** as a text code (home screen), so progress can be backed up or moved between devices.
  - Fixed ghosts and rising units losing their transparency when a rarity glow was drawn.
- **Boss abilities and tidy-ups (Nov 22):** offline gear removed again (gear is a reward for active play). Every boss now has special attacks from `BOSS_ABILITIES` in `js/data.js`, listed per boss in `abil`: Ground Slam, Leap (jumps onto your units), Smite (lightning on random units), Volley (arcane bolts), Guard Stance (takes 70% less damage for 3.5s) and Binding Chains (slows the whole horde). Slam, leap and smite show a red warning circle first. Enraged bosses use them 25% more often. The zone map lists each boss's abilities. The moon now draws as a clean clipped crescent.
- **Bounties and gear handling (Nov 22):** three rotating bounties (kill N enemies, fight N battles, clear zones, slay elites, find gear, survive Endless waves) sit at the top of the Records tab. They only advance by playing, pay bone dust scaled to your best zone (every fifth one also pays a champion soul), and refill with a new one when finished (`reportBattle` in `js/records.js`, called from `endBattle`). Gear can now be locked (safe from salvage and the bag auto-trim), and bag tiles show an arrow when a piece beats what you are wearing.
- **Bestiary and four new summons (Nov 22):**
  - **New summons** (champion soul cost 3, 3, 3 and 4; each with 3-tier HP and damage chains, evolving looks in `js/looks.js` and one unique ability): the **Death Knight** (fast armoured rider, Reckless Charge: the first blow of every fight lands for 2.5x), the **Plague Bearer** (built-in poison aura around it, Virulent Cloud makes it wider and twice as deadly), the **Grave Priest** (ranged healer that mends allies, scaling with its damage level; Mass Mend heals everyone in range) and the **Gargoyle** (takes 20% less damage from everything, Granite Heart halves damage below 30% HP). The skill web ring now places 11 units; Eternal Pact keeps them in the order in `PACT_ORDER`.
  - **Bestiary (Armoury tab):** Allies and Enemies pages with silhouettes for unmet kinds. Enemies are listed once met, and their stats and abilities appear after the first kill. Progress is `save.seen`, survives rebirth, and is back-filled for older saves by `syncBestiary` (owned summons, cleared zones).
  - **Bonuses (tiny, in `bestiaryBonus`):** each enemy kind defeated gives +0.15% souls (+0.4% for bosses), and each summon ever unlocked gives +0.4% health and damage. First kills show as a Bestiary chip on the result screen. Two new achievements: Naturalist (10 kinds) and Zoologist (all kinds).
- **Feedback round 3 (Nov 23):**
  - **PWA install fix:** the manifest now uses `standalone` display (fullscreen was unreliable), has an `id`, separate `any` and `maskable` icons and no hard orientation lock; the service worker never returns an empty response; a "turn your phone sideways" overlay shows in portrait. Landscape is requested via the Screen Orientation API on first tap.
  - **Speed saved:** the 1x/2x/4x choice is remembered in local storage.
  - **Aggro:** `aggroRange` is now 800, so once enemies are on the field every unit charges them (ranged units stop at their range); with no enemies the horde still mills mid-field.
  - **Raise Dead is an unlock** (300 souls, a node under the necromancer in the skill web) and gives **one button per summon you own**, each with its own cooldown (40s, heavy summons 1.6x and raise only 1) shown in a bar at the bottom left of the battle (`spellCooldownFor`, `spellCountFor`, `castSpell(type)`).
  - **Skill web is now an upgrade tree** (`UNIT_TREE` in `js/data.js`): two roots, zombie and skeleton, lead up to the summons they unlock. Zombie to Hound (8 levels) to Abomination (30) to Gargoyle (55), and Zombie to Plague Bearer (20); Skeleton to Archer (8) to Mage (30) to Ghost (45) to Grave Priest (50), and Skeleton to Death Knight (20). Each still costs champion souls and needs the listed upgrade levels spent on the summons leading to it (`gateProgress`). Only the next step is shown (greyed), and upgrade chains reveal their next tier once the one before has a point in it.
  - **Gear rework:** slots are now a **Staff, Robes, Tome and Familiar** (a crawling hand, main stat raise speed), all shown on the necromancer: robes recolour his body, the staff changes the orb colour and gains a skull, the tome floats beside him and glows, the familiar scuttles about, and any Legendary adds orbiting skulls. His rank (Grave Robber to Lich) comes from the gear he wears (`gearScore`), not from upgrade levels. Drops are rare (40% of clears, 5% of defeats, a guaranteed first-clear piece) and capped by zone (`rarityCap`): Common in zones 1-2, up to Magic in 3-4, Rare in 5-6, Epic in 7-9 and Legendary from zone 10. Gear stats were cut by 25% so the power stays with the summons.
  - **World map (`js/worldmap.js`):** a scrolling painted map of all four regions replaces the zone cards. Drag to pan, tap a zone for its panel and a Fight button. Conquered zones burn: scorched earth, flames, smoke, dead trees, broken walls under a tattered undead banner, and the roads leading to them are scorched too. The frontier pulses with the necromancer waiting beside it and unreached lands lie under fog.
- **Hazards, no defences, world map overhaul (Nov 23):**
  - **Defences removed for now** (Will will add them back later): the Defences tab, `DEFENCES`, walls, towers, traps, the Fortified Start perk and the Fortress achievement are gone. Old saves keep a harmless `def_` node. The Bulwark gear effect is now "your summons take 10% less damage".
  - **Field hazards (`hazardsFor` in `js/data.js`, `layMines` and `updateHazards` in `js/sim.js`):** from zone 2, mines are laid between the lines as each wave starts (1-9 per wave, more in later zones). They arm after about a second, then blow up under the first non-ghost summon that walks close, hurting everything near for a flat amount plus a share of max HP (heavy units take 40%). From zone 3, every third wave raises one or more War Banners (a static enemy `warbanner`): every enemy near one hits 35% harder, moves 15% faster and attacks 20% faster until the banner is cut down; banners retreat when the wave is dead. Endless gets both, scaling with the wave. Mines and banners are drawn in `render.js` (`drawMine`, banner sprite and aura) and listed on the world map panel (`hazardText`).
  - **World map rewrite (`js/worldmap.js`):** the ground is generated once from layered noise with hill shading and region blends (meadow, wheat, snow, ash). On top: mountain ranges with snow caps and fissures, rivers with bridges, a frozen lake and an ichor pool, forests and orchards (dead near conquered zones), wheat fields, gravestones, windmills and a camp, ribbon banners per region. Settlements have shaded stone, timber and roofs with shingles. Conquered zones get scorched ground with glowing ley cracks, skulls on spikes along the burnt roads, craters, flames, smoke, circling crows, rising embers and marching undead on the road. Also drifting cloud shadows, river shimmer, a swirling gate under the next zone, name plates, a progress plate, a compass, a vignette and drag momentum.
  - **Balance pass:** start with 4 zombies. Zone wave scaling is now 1.06 / 1.13 / 1.15 / 1.15, 1.26 / 1.33 / 1.25 / 1.30, 1.6 / 1.55 / 1.45 / 1.45, zone ratings 38 / 105 / 200 / 340 / 370 / 470 / 580 / 770 / 810 / 1000 / 1100 / 1350. The simtest bot (no defences, hazards on) needs about 5-8 attempts for most zones and about 20 for zone 12 (a deliberate wall). Summon tuning from the new `node tools/unitbench.mjs` (raw value per raise-second and a 10 v 6 duel): Bone Mage damage 14 to 11, Ghost HP 35 to 42, Plague Bearer aura 1.4 to 1.9, Grave Priest heals 10 every 3s (was 14 every 2.4s, which made a healer wall that never died).
  - **Phone pass:** checked every screen at 760x350 landscape; added a short-height rule so the map info panel is smaller, enlarged mines.
- **Long game, legions and polish (Nov 24, after Will's playtest notes):**
  - **Rebirth gates (`zoneRebirth`, `UNIT_REBIRTH`, `TIER_REBIRTH`, `statNeeds` in `js/data.js`):** zones, summons and upgrade tiers are locked behind rebirth counts so one run only goes so far. Zones 5-6 need 1 rebirth, 7-8 need 2, 9-10 need 3, 11-12 need 4, the Endless Crypt needs 6. Plague Bearer and Death Knight need 1, Mage and Abomination 2, Ghost 3, Grave Priest 4, Gargoyle 5. The second HP/damage tier needs 1 rebirth, the third 3; Rise Faster past level 4 needs 1 and past 6 needs 3. The Rebirth screen lists the next milestone.
  - **Economy:** soul drops x0.8 (`TUNING.soulScale`), upgrade costs x1.15 (`costScale`). Each rebirth makes upgrades 7% cheaper (floor 40%) and kills pay 10% more, and gives +5% health and damage (`mightMul`). World scaling per rebirth was softened to HP x1.5, damage x1.2, rating x1.35. New perks Thrift (-4% costs a level) and Necrotic Might (+4% health and damage), and every perk can have prerequisites (`needs`, shown as "Needs: ..." and enforced by `perkLock`). `node tools/rebirthsim.mjs` now respects the gates and rebirths when stuck: about 170 bot-minutes for the first four zones, then about 5 hours a rebirth.
  - **Legions (`legionReady`, `buyLegion`, `LEGION_MULT` in `js/data.js` and `js/sim.js`):** once a summon has HP, damage and Rise Faster all maxed, a Legion node appears under its Rise Faster node (about 9000 x the unit's cost multiplier in souls). A Legion is one unit worth about 10 (10x health and damage, bigger, 7x raise cooldown) that shares the summon's upgrades, gets its own Raise Dead button (one per cast) and is drawn as a mob of that summon behind a standard (`legionSprite` in `js/render.js`), so each summon needs no extra art.
  - **Traps (was mines):** hazards are now jaw traps with a pressure plate and a red rune once armed. Units stay in the lower lane (`LANE_*` in `js/data.js`) so the top of the screen is free for flyers.
  - **Scenes (`SCENES` in `js/render.js`):** every zone has its own skyline (chapel, burnt farm, gate, village, cathedral, ruins, keep, mountain pass, wizard tower, dragon cave, crypt), sky, props, lamps and trees.
  - **Other:** live achievement toasts mid-battle (`checkAchievements(save, live)`), the result screen says souls collected versus banked, the skill web now has fixed positions that never shift (pods hang down or grow up), the spell bar anchors to the bottom, grass spans the wide field.
  - **Summon art (live, replaced the HD experiment):** Will preferred the chunky cartoon look, so `js/art.js` repaints all 11 summons on a slightly finer chunky grid (about 13x16, drawn at scale 4, so roughly 1.4x bigger) with flat colours and a light bevel shading pass; the renderer adds the outline. `lookSprite` uses it first and falls back to `looks.js`. `tools/oldsheet.html?s=3` shows every summon at tiers 0-3. Enemies and bosses are painted in `js/enemyart.js` from one parametric `person()` builder (bulk, headgear, weapon, shield, cape, wings), hooked into `sprite()`; the NEW/OLD setting switches them with the summons. `tools/enemysheet.html?s=3` shows them all.

