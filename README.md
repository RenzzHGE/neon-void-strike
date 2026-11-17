# NEON VOID STRIKE

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/RenzzHGE/neon-void-strike/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/RenzzHGE/neon-void-strike/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

A neon arcade space shooter. Nine waves, three bosses, one void to survive.

NEON VOID STRIKE is a complete arcade space shooter that runs offline in a
desktop browser from static files. Blast through 9 waves of enemies that get
faster and tougher, face a boss on waves 3, 6 and 9 — the Void Cruiser, the
Destroyer, the Emperor — and beat the wave-9 boss to win.

Built for [make.fun's "Make the best game" bounty](https://make.fun/bounty/best-game-01) ($1,000 in USDC).

## Play

Open `game/index.html` in a desktop browser (or serve `game/` with any
static file server). No network requests, no build step.

- **Move**: WASD or arrow keys (mouse also steers)
- **Fire**: Space or mouse click (hold to keep firing)
- **Pause**: P — **Mute**: M — **Start / restart**: Enter

## The game

- 9 waves with ramping difficulty; bosses on waves 3/6/9
- 4 enemy kinds: drifters, weavers, spinners, brutes
- 5 power-ups: spread shot (S), rapid fire (R), shield (H), bomb (B), 1UP life
- 3 lives; HUD with score, best score, wave, lives and weapon
- Title screen, pause, game-over and victory screens with restart
- WebAudio synthesised sound effects and a bass music loop
- High score kept in the browser (localStorage)
- All art drawn in code on canvas; no image files

## Layout

- `game/index.html` — the page
- `game/src/main.js` — game loop, state machine, scoring
- `game/src/world.js` — waves, enemies, bosses
- `game/src/input.js` — keyboard and mouse input
- `game/src/render.js` — all drawing: ships, shots, HUD, screens
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=`)
- `game/src/config.js` — tuning numbers and palettes
- `game/src/random.js` — seeded RNG
- `main.ts` — the make.fun entry program (copies game/ + screenshots/,
  writes dossier.json)

Screenshots in `screenshots/` are real renders of the game, taken in
headless Chromium.

## License

MIT — see LICENSE.
