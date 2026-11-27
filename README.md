# Necromancer Idle

A phone-first, pixel-art necromancer incremental. Raise a scrappy horde, send it into battle, and conquer the land one zone at a time.

Play it: https://realzombie.github.io/NecromancerIdle/ (installable as a PWA, landscape).

## What is in it

- Real-time auto-battles with a growing horde of summons: zombies, skeleton archers and warriors, zombie hounds, bone mages, ghosts, abominations, death knights, plague bearers, grave priests, gargoyles, and flying vampire bats and bone drakes. Fully upgraded summons can be raised as Legions.
- Twelve zones across three regions, each with its own battlefield and ending in a boss that drops a champion soul, plus traps, war banners and flying enemies.
- A skill web: unlock new summons with champion souls, then evolve each one through tiers of HP and damage that change how it looks, and learn unique abilities.
- Rebirth: wipe the run for essence and permanent perks that change how every run starts. Rebirths also unlock later zones, summons and upgrade tiers.
- An Armoury: random gear drops with rarities and special effects, salvage and upgrades.
- A bestiary of every ally and enemy with tiny permanent bonuses for finding them.
- Two art styles you can switch between, achievements, an Endless Crypt after the last zone, auto-battle, a Raise Dead spell, synthesised sound and music, offline progress and an installable PWA.

## Developing

No build step. Serve the folder and open it:

```
node tools/serve.mjs
```

Balance checks (headless):

```
node tools/wavetest.mjs       # checks the wave, army, replay and rebirth rules
node tools/pacing.mjs 40      # a bot plays the long game, one line per rebirth
node tools/rebirthtest.mjs    # checks the rebirth rules
node tools/endlesstest.mjs   # how far a maxed horde gets in the Endless Crypt
node tools/unitbench.mjs      # compares the summons head to head
```

Art preview pages (open after serving): `tools/oldsheet.html`, `tools/enemysheet.html`, `tools/iconsheet.html`, `tools/necrosheet.html`.

`CLAUDE.md` holds the design doc, the build log and a current-state summary.

All rights reserved, see `LICENSE`.
