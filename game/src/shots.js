// Deterministic screenshot scenes: ?shot=title|play|boss|victory&seed=N.
// Each scene builds a real game state with the game's own spawn and update
// code, advances it a fixed number of 1/60 s steps, and leaves the frame
// ready to render. The caller renders once and sets window.__shotReady.
import { makeRng, range } from './rng.js';
import { startWave, ENEMY_TYPES } from './enemies.js';
import { startBoss } from './boss.js';
import { firePlayerBullet } from './bullets.js';

const STEP = 1 / 60;

function simulate(game, seconds, fireHeld) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i++) {
    // Fire at the real cadence (one volley per fireRate), never a wall of
    // bullets: the scene must look like live play, and the boss must live.
    if (fireHeld && game.player.fireCooldown <= 0) {
      firePlayerBullet(game.bullets, game.player, null);
      game.player.fireCooldown = game.player.fireRate;
    }
    game.updatePlaying(STEP, true);
  }
}

export function buildShotScene(game, scene, seed) {
  const rng = makeRng(seed);
  game.rng = rng;
  game.state = 'playing';
  game.score = 0;
  game.wave = 1;
  game.player.lives = 3;
  game.player.weapon = 1;
  game.player.x = game.w / 2;
  game.player.y = game.h - 120;
  game.player.alive = true;
  game.bullets.player = [];
  game.bullets.enemy = [];
  game.enemies.list = [];
  game.enemies.spawnQueue = [];
  game.powerups.list = [];
  game.boss.active = false;

  if (scene === 'title') {
    game.state = 'title';
    game.score = 0;
    startWave(game.enemies, 1, game.w, rng);
    // A few decorative enemies already on screen behind the title panel.
    simulate(game, 2.5, false);
    game.enemies.spawnQueue = [];
    return;
  }

  if (scene === 'play') {
    game.wave = 2;
    game.player.weapon = 2;
    game.score = 2450;
    startWave(game.enemies, 2, game.w, rng);
    simulate(game, 2.8, true);
    // Stage three more enemies at fixed spots so the frame reads as a
    // busy wave: real enemy objects, built from the same type table.
    const stage = (kind, fx, fy) => {
      const def = ENEMY_TYPES[kind];
      game.enemies.list.push({
        kind, x: game.w * fx, y: game.h * fy, hp: def.hp, maxHp: def.hp,
        radius: def.radius, speed: def.speed, score: def.score, color: def.color,
        shoots: def.shoots, phase: rng() * Math.PI * 2, age: 1.2,
        shootTimer: 2, baseX: game.w * fx,
      });
    };
    stage('weaver', 0.24, 0.3);
    stage('spinner', 0.76, 0.24);
    stage('drifter', 0.62, 0.44);
    return;
  }

  if (scene === 'boss') {
    game.wave = 3;
    game.player.weapon = 3;
    game.score = 5800;
    startBoss(game.boss, 3, game.w, rng);
    game.boss.y = 110;
    game.boss.entering = false;
    game.boss.hp = Math.floor(game.boss.maxHp * 0.7);
    // A couple of escort drifters for depth.
    startWave(game.enemies, 1, game.w, rng);
    simulate(game, 1.6, true);
    game.enemies.spawnQueue = [];
    return;
  }

  if (scene === 'victory') {
    game.state = 'victory';
    game.wave = 9;
    game.score = 24850;
    game.highScore = Math.max(game.highScore, game.score);
    game.particles.explosion(game.w * 0.3, game.h * 0.3, '#00f0ff', 24, 220);
    game.particles.explosion(game.w * 0.7, game.h * 0.25, '#ff9ff3', 24, 220);
    return;
  }

  // 'over' — game over screen with a final score.
  game.state = 'gameover';
  game.wave = 4;
  game.score = 7300;
  game.player.alive = false;
  game.particles.explosion(game.w / 2, game.h - 120, '#ff2d55', 40, 300);
}
