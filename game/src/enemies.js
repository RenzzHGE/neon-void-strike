// Enemy ships: four kinds, wave spawning and movement patterns.
// A wave is a queue of spawn events; the spawner drips them in over time.
import { range, pick } from './rng.js';

export const ENEMY_TYPES = {
  drifter: { hp: 1, speed: 90, radius: 16, score: 100, color: '#ff5d8f', shoots: false },
  weaver: { hp: 2, speed: 130, radius: 15, score: 150, color: '#ffb02e', shoots: false },
  spinner: { hp: 3, speed: 80, radius: 17, score: 250, color: '#b967ff', shoots: true },
  brute: { hp: 6, speed: 55, radius: 24, score: 400, color: '#ff3b30', shoots: true },
};

export function createEnemies() {
  return { list: [], spawnQueue: [], spawnTimer: 0, active: false };
}

export function startWave(enemies, wave, w, rng) {
  enemies.list = [];
  enemies.spawnQueue = [];
  enemies.spawnTimer = 0;
  enemies.active = true;
  const count = 6 + wave * 3;
  const kinds = ['drifter', 'drifter', 'weaver'];
  if (wave >= 2) kinds.push('weaver', 'spinner');
  if (wave >= 3) kinds.push('spinner');
  if (wave >= 4) kinds.push('brute');
  if (wave >= 5) kinds.push('brute', 'spinner');
  for (let i = 0; i < count; i++) {
    const kind = pick(rng, kinds);
    enemies.spawnQueue.push({
      kind,
      x: range(rng, 40, w - 40),
      delay: 0.4 + i * Math.max(0.25, 0.9 - wave * 0.06),
      phase: rng() * Math.PI * 2,
    });
  }
}

function spawnEnemy(enemies, spec, rng) {
  const def = ENEMY_TYPES[spec.kind];
  enemies.list.push({
    kind: spec.kind,
    x: spec.x,
    y: -30,
    hp: def.hp,
    maxHp: def.hp,
    radius: def.radius,
    speed: def.speed * range(rng, 0.9, 1.15),
    score: def.score,
    color: def.color,
    shoots: def.shoots,
    phase: spec.phase,
    age: 0,
    shootTimer: range(rng, 1.2, 2.4),
    baseX: spec.x,
  });
}

export function updateEnemies(enemies, dt, w, h, rng, bullets, fireEnemyBullet, player) {
  if (enemies.spawnQueue.length > 0) {
    enemies.spawnTimer += dt;
    while (enemies.spawnQueue.length > 0 && enemies.spawnTimer >= enemies.spawnQueue[0].delay) {
      const spec = enemies.spawnQueue.shift();
      spawnEnemy(enemies, spec, rng);
      enemies.spawnTimer = 0;
    }
  }
  for (let i = enemies.list.length - 1; i >= 0; i--) {
    const e = enemies.list[i];
    e.age += dt;
    const def = ENEMY_TYPES[e.kind];
    if (e.kind === 'drifter') {
      e.y += e.speed * dt;
      e.x = e.baseX + Math.sin(e.age * 1.6 + e.phase) * 50;
    } else if (e.kind === 'weaver') {
      e.y += e.speed * dt;
      e.x = e.baseX + Math.sin(e.age * 3.2 + e.phase) * 90;
    } else if (e.kind === 'spinner') {
      e.y += e.speed * dt;
      e.x = e.baseX + Math.sin(e.age * 2 + e.phase) * 40;
      e.shootTimer -= dt;
      if (e.shootTimer <= 0 && e.y > 0 && e.y < h * 0.6 && player && player.alive) {
        e.shootTimer = 2.2;
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const len = Math.hypot(dx, dy) || 1;
        fireEnemyBullet(bullets, e.x, e.y + 14, (dx / len) * 220, (dy / len) * 220);
      }
    } else if (e.kind === 'brute') {
      e.y += e.speed * dt;
      if (e.y > h * 0.3) e.y = h * 0.3 + Math.sin(e.age * 1.2) * 20;
      e.shootTimer -= dt;
      if (e.shootTimer <= 0 && e.y > 0 && player && player.alive) {
        e.shootTimer = 2.8;
        fireEnemyBullet(bullets, e.x - 14, e.y + 18, -40, 260);
        fireEnemyBullet(bullets, e.x + 14, e.y + 18, 40, 260);
      }
    }
    e.x = Math.max(20, Math.min(w - 20, e.x));
    if (e.y > h + 40) enemies.list.splice(i, 1);
  }
  if (enemies.list.length === 0 && enemies.spawnQueue.length === 0) enemies.active = false;
}

export function drawEnemies(ctx, enemies, time) {
  ctx.save();
  for (const e of enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.lineWidth = 2;
    ctx.strokeStyle = e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(20,0,30,0.9)';
    if (e.kind === 'drifter') {
      ctx.rotate(Math.sin(e.age * 2) * 0.2);
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.lineTo(14, -10);
      ctx.lineTo(0, -4);
      ctx.lineTo(-14, -10);
      ctx.closePath();
    } else if (e.kind === 'weaver') {
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(12, 0);
      ctx.lineTo(0, 16);
      ctx.lineTo(-12, 0);
      ctx.closePath();
    } else if (e.kind === 'spinner') {
      ctx.rotate(e.age * 2.5);
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        ctx.lineTo(Math.cos(a) * 16, Math.sin(a) * 16);
      }
      ctx.closePath();
    } else {
      ctx.beginPath();
      ctx.moveTo(-20, -12);
      ctx.lineTo(20, -12);
      ctx.lineTo(14, 14);
      ctx.lineTo(-14, 14);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    // Damage cracks: a brute flashes its wounds.
    if (e.hp < e.maxHp) {
      ctx.fillStyle = e.color;
      const p = 1 - e.hp / e.maxHp;
      ctx.fillRect(-10, -14, 20 * p, 3);
    }
    ctx.restore();
  }
  ctx.restore();
}
