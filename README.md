# Necromancer Idle

A phone-first, pixel-art necromancer incremental. Raise a scrappy horde, send it into battle, and conquer the land one zone at a time.

Play it: https://realzombie.github.io/NecromancerIdle/ (installable as a PWA, landscape).

## What is in it

- Real-time auto-battles with a growing horde of summons: zombies, skeleton archers and warriors, zombie hounds, bone mages, ghosts, abominations, death knights, plague bearers, grave priests and gargoyles.
- Twelve zones across three regions, each ending in a boss that drops a champion soul.
- A skill web: unlock new summons with champion souls, then evolve each one through tiers of HP and damage that change how it looks, and learn unique abilities.
- Rebirth: wipe the run for essence and permanent perks that change how every run starts.
- An Armoury: random gear drops with rarities and special effects, salvage and upgrades, plus bone walls, spike traps and towers.
- A bestiary of every ally and enemy with tiny permanent bonuses for finding them.
- Achievements, an Endless Crypt after the last zone, auto-battle, a Raise Dead spell, synthesised sound and music, offline progress and an installable PWA.

## Developing

No build step. Serve the folder and open it:

```
node tools/serve.mjs
```

Balance checks (headless):

```
node tools/simtest.mjs        # a bot plays zone by zone
node tools/rebirthsim.mjs 4   # a bot plays several rebirth cycles
node tools/rebirthtest.mjs    # checks the rebirth rules
node tools/endlesstest.mjs   # how far a maxed horde gets in the Endless Crypt
```

`CLAUDE.md` holds the design doc and the build log.

All rights reserved, see `LICENSE`.
