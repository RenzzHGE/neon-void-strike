// NEON VOID STRIKE — entry point. Owns the canvas, the state machine
// (title -> playing -> paused / victory / gameover) and the wave flow.
// All gameplay systems live in their own modules; this file wires them.
import { makeRng, clamp, range } from './rng.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createParticles } from './particles.js';
import { createPlayer, updatePlayer, drawPlayer } from './player.js';
import {
  createBullets,
  firePlayerBullet,
  fireEnemyBullet,
  updateBullets,
  drawBullets,
  collidePlayerBullets,
  collideEnemyBullets,
  collideEnemiesWithPlayer,
} from './bullets.js';
import { createEnemies, startWave, updateEnemies, drawEnemies } from './enemies.js';
import { createBoss, startBoss, updateBoss, drawBoss, drawBossBar } from './boss.js';
import { createPowerups, maybeDrop, updatePowerups, drawPowerups, applyPowerup } from './powerups.js';
import { drawHud, drawTitle, drawPaused, drawGameOver, drawVictory, drawWaveBanner } from './hud.js';
import { buildShotScene } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const shotScene = params.get('shot');
const shotSeed = Number(params.get('seed') || '1') || 1;

const game = {
  w: 0,
  h: 0,
  state: 'title', // title | playing | paused | victory | gameover
  prevState: 'title',
  score: 0,
  highScore: 0,
  wave: 1,
  time: 0,
  banner: '',
  bannerTimer: 0,
  shake: 0,
  bombQueued: false,
  bossSpawned: false,
  rng: makeRng((Date.now() % 100000) + 7),
  player: null,
  enemies: createEnemies(),
  bullets: createBullets(),
  boss: createBoss(),
  powerups: createPowerups(),
  particles: null,
  audio: createAudio(),
  input: null,
};

try {
  game.highScore = Number(window.localStorage.getItem('neon-void-strike-best') || '0') || 0;
} catch {
  game.highScore = 0;
}

function saveHighScore() {
  if (game.score > game.highScore) {
    game.highScore = game.score;
    try {
      window.localStorage.setItem('neon-void-strike-best', String(game.highScore));
    } catch {
      // Storage unavailable (private mode): the score still shows this run.
    }
  }
}

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  game.w = window.innerWidth;
  game.h = window.innerHeight;
  canvas.width = Math.floor(game.w * dpr);
  canvas.height = Math.floor(game.h * dpr);
  canvas.style.width = `${game.w}px`;
  canvas.style.height = `${game.h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

game.input = createInput(canvas);
game.player = createPlayer(game.w, game.h);
game.particles = createParticles(game.rng);

function isBossWave(wave) {
  return wave % 3 === 0;
}

function startRun() {
  game.score = 0;
  game.wave = 1;
  game.player = createPlayer(game.w, game.h);
  game.player.invulnerable = 2;
  game.bullets = createBullets();
  game.enemies = createEnemies();
  game.boss = createBoss();
  game.powerups = createPowerups();
  game.bombQueued = false;
  game.bossSpawned = false;
  game.state = 'playing';
  startWave(game.enemies, 1, game.w, game.rng);
  setBanner('WAVE 1');
  game.audio.ensure();
  game.audio.startMusic();
}

function setBanner(text) {
  game.banner = text;
  game.bannerTimer = 2.2;
}

function nextWave() {
  game.wave += 1;
  game.bossSpawned = false;
  game.boss = createBoss();
  const bonus = 500 * game.wave;
  game.score += bonus;
  game.particles.text(game.w / 2, game.h * 0.5, `WAVE BONUS +${bonus}`, '#7dff6a');
  game.audio.waveClear();
  startWave(game.enemies, game.wave, game.w, game.rng);
  setBanner(isBossWave(game.wave) ? `WAVE ${game.wave} — WARNING` : `WAVE ${game.wave}`);
}

function detonateBomb() {
  game.bombQueued = false;
  let killed = 0;
  for (const e of game.enemies.list) {
    game.particles.explosion(e.x, e.y, '#ff9ff3', 18, 260);
    game.score += e.score;
    killed += 1;
  }
  game.enemies.list = [];
  game.enemies.spawnQueue = [];
  game.bullets.enemy = [];
  if (game.boss.active) {
    game.boss.hp -= 25;
    game.particles.explosion(game.boss.x, game.boss.y, '#ff9ff3', 30, 300);
    if (game.boss.hp <= 0) killBoss();
  }
  if (killed > 0) game.particles.text(game.w / 2, game.h * 0.5, `NOVA BOMB +${killed} SHIPS`, '#ff9ff3');
  game.shake = Math.max(game.shake, 10);
  game.audio.explosion(true);
}

function killBoss() {
  const boss = game.boss;
  game.particles.explosion(boss.x, boss.y, '#b967ff', 50, 320);
  game.particles.explosion(boss.x, boss.y, '#ff9ff3', 30, 200);
  game.score += 2000;
  game.particles.text(boss.x, boss.y, '+2000 BOSS DOWN', '#ff9ff3');
  game.shake = 14;
  game.audio.explosion(true);
  game.boss.active = false;
  if (game.wave >= 9) {
    saveHighScore();
    game.state = 'victory';
    game.audio.stopMusic();
    game.audio.victory();
  }
}

function killPlayer() {
  const player = game.player;
  game.particles.explosion(player.x, player.y, '#00f0ff', 45, 300);
  game.particles.explosion(player.x, player.y, '#ff2d95', 25, 200);
  game.shake = 14;
  game.audio.playerHit();
  player.alive = false;
  player.lives -= 1;
  if (player.lives > 0) {
    // Respawn in place after a beat, with protection.
    setTimeout(() => {
      if (game.state !== 'playing') return;
      game.player = createPlayer(game.w, game.h);
      game.player.lives = player.lives;
      game.player.weapon = Math.max(1, player.weapon - 1);
      game.player.invulnerable = 2.5;
      game.bullets.enemy = [];
    }, 900);
  } else {
    saveHighScore();
    game.state = 'gameover';
    game.audio.stopMusic();
    game.audio.gameOver();
  }
}

// One fixed update step of live play. `silent` skips audio (used by shots).
game.updatePlaying = (dt, silent) => {
  const audio = silent ? null : game.audio;
  updatePlayer(game.player, game.input, dt, game.w, game.h, (p) =>
    firePlayerBullet(game.bullets, p, audio),
  );
  updateEnemies(game.enemies, dt, game.w, game.h, game.rng, game.bullets, (x, y, vx, vy) =>
    fireEnemyBullet(game.bullets, x, y, vx, vy, audio), game.player);
  updateBoss(game.boss, dt, game.w, game.player, game.bullets, (x, y, vx, vy) =>
    fireEnemyBullet(game.bullets, x, y, vx, vy, audio), game.rng);
  updateBullets(game.bullets, dt, game.w, game.h);
  updatePowerups(game.powerups, dt, game.h);
  game.particles.update(dt);

  if (game.bombQueued) detonateBomb();

  // Player bullets vs enemies and the boss.
  game.score += collidePlayerBullets(
    game.bullets,
    game.enemies.list,
    game.boss,
    (enemy) => {
      game.particles.explosion(enemy.x, enemy.y, enemy.color, 16, 220);
      game.particles.text(enemy.x, enemy.y, `+${enemy.score}`, '#ffffff');
      maybeDrop(game.powerups, enemy.x, enemy.y, game.rng);
      if (!silent) game.audio.explosion(false);
      return enemy.score;
    },
    () => {
      game.particles.explosion(game.boss.x + range(game.rng, -30, 30), game.boss.y + 20, '#b967ff', 6, 120);
      if (!silent) game.audio.bossHit();
      if (game.boss.hp <= 0) killBoss();
    },
  );

  // Enemy bullets vs the player.
  if (collideEnemyBullets(game.bullets, game.player)) {
    if (game.player.shield > 0) {
      game.player.shield = 0;
      game.particles.text(game.player.x, game.player.y - 30, 'SHIELD DOWN', '#7df9ff');
    } else {
      killPlayer();
    }
  }
  // Ramming.
  const rammed = collideEnemiesWithPlayer(game.enemies.list, game.boss, game.player);
  if (rammed) {
    if (game.player.shield > 0) {
      game.player.shield = 0;
      game.enemies.list = game.enemies.list.filter((e) => e !== rammed);
      game.particles.explosion(rammed.x, rammed.y, rammed.color || '#ff2d55', 16, 220);
    } else {
      game.enemies.list = game.enemies.list.filter((e) => e !== rammed);
      game.particles.explosion(rammed.x, rammed.y, rammed.color || '#ff2d55', 16, 220);
      killPlayer();
    }
  }
  // Power-up pickups.
  for (let i = game.powerups.list.length - 1; i >= 0; i--) {
    const p = game.powerups.list[i];
    const dx = p.x - game.player.x;
    const dy = p.y - game.player.y;
    if (game.player.alive && dx * dx + dy * dy < (p.radius + game.player.radius) ** 2) {
      game.powerups.list.splice(i, 1);
      const name = applyPowerup(game.player, p.kind, game);
      game.particles.text(game.player.x, game.player.y - 30, name, '#7dff6a');
      if (!silent) game.audio.powerup();
    }
  }

  // Wave flow: enemies cleared -> boss (on boss waves) or next wave.
  if (game.state === 'playing' && !game.enemies.active && game.enemies.list.length === 0) {
    if (isBossWave(game.wave) && !game.bossSpawned && !game.boss.active) {
      game.bossSpawned = true;
      startBoss(game.boss, game.wave, game.w, game.rng);
      setBanner(`${game.boss.name} INCOMING`);
    } else if (!game.boss.active) {
      nextWave();
    }
  }
  if (game.bannerTimer > 0) game.bannerTimer -= dt;
  if (game.shake > 0) game.shake = Math.max(0, game.shake - dt * 22);
};

function render() {
  ctx.save();
  if (game.shake > 0) {
    ctx.translate(range(game.rng, -game.shake, game.shake) * 0.4, range(game.rng, -game.shake, game.shake) * 0.4);
  }
  game.particles.drawBackground(ctx, game.w, game.h, game.time);
  if (game.state === 'title') {
    // A living backdrop behind the title: drifting enemies and the ship.
    drawEnemies(ctx, game.enemies.list, game.time);
    drawPlayer(ctx, game.player, game.time);
    game.particles.drawForeground(ctx);
    drawTitle(ctx, game, game.w, game.h, game.time);
  } else {
    drawPowerups(ctx, game.powerups, game.time);
    drawEnemies(ctx, game.enemies.list, game.time);
    drawBoss(ctx, game.boss, game.time);
    drawBullets(ctx, game.bullets);
    drawPlayer(ctx, game.player, game.time);
    game.particles.drawForeground(ctx);
    drawHud(ctx, game, game.w, game.h);
    drawBossBar(ctx, game.boss, game.w);
    const alpha = game.bannerTimer > 0 ? Math.min(1, game.bannerTimer) : 0;
    drawWaveBanner(ctx, game.w, game.h, game.banner, alpha);
    if (game.state === 'paused') drawPaused(ctx, game.w, game.h);
    if (game.state === 'gameover') drawGameOver(ctx, game, game.w, game.h);
    if (game.state === 'victory') drawVictory(ctx, game, game.w, game.h);
  }
  ctx.restore();
}

function update(dt) {
  game.time += dt;
  if (game.state === 'title') {
    // Idle drift behind the title screen.
    updateEnemies(game.enemies, dt, game.w, game.h, game.rng, game.bullets, () => {}, game.player);
    game.particles.update(dt);
    if (game.input.wasPressed('Enter') || game.input.mouseDown) {
      game.input.consumePressed();
      startRun();
    }
    return;
  }
  if (game.state === 'playing') {
    if (game.input.wasPressed('p') || game.input.wasPressed('Escape')) {
      game.input.consumePressed();
      game.state = 'paused';
      game.audio.stopMusic();
      return;
    }
    if (game.input.wasPressed('m')) {
      game.input.consumePressed();
      game.audio.setMuted(!game.audio.muted);
    }
    if (game.input.wasPressed('b')) {
      game.input.consumePressed();
      game.bombQueued = true;
    }
    game.updatePlaying(dt, false);
    return;
  }
  if (game.state === 'paused') {
    if (game.input.wasPressed('p') || game.input.wasPressed('Escape') || game.input.wasPressed('Enter')) {
      game.input.consumePressed();
      game.state = 'playing';
      game.audio.ensure();
      game.audio.startMusic();
    }
    return;
  }
  // victory / gameover: Enter or click restarts.
  if (game.input.wasPressed('Enter') || game.input.mouseDown) {
    game.input.consumePressed();
    startRun();
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  game.input.consumePressed();
  requestAnimationFrame(frame);
}

if (shotScene) {
  // Deterministic screenshot mode: build the scene, render once, flag ready.
  buildShotScene(game, shotScene, shotSeed);
  game.particles.update(0.1);
  render();
  window.__shotReady = true;
} else {
  // A quiet title backdrop: one early wave drifting behind the menu.
  startWave(game.enemies, 1, game.w, game.rng);
  requestAnimationFrame(frame);
}

// Debug/testing handle: lets automated play-tests read the live state.
window.__game = game;
