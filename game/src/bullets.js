// Bullets (player and enemy) and the collision checks between them,
// the player and the enemies. One module owns every moving projectile.
export function createBullets() {
  return { player: [], enemy: [] };
}

export function firePlayerBullet(bullets, player, audio) {
  const shots = [];
  if (player.weapon === 1) {
    shots.push({ x: player.x, y: player.y - 20, vx: 0, vy: -620 });
  } else if (player.weapon === 2) {
    shots.push({ x: player.x - 9, y: player.y - 12, vx: 0, vy: -620 });
    shots.push({ x: player.x + 9, y: player.y - 12, vx: 0, vy: -620 });
  } else {
    shots.push({ x: player.x, y: player.y - 20, vx: 0, vy: -640 });
    shots.push({ x: player.x - 9, y: player.y - 12, vx: -140, vy: -600 });
    shots.push({ x: player.x + 9, y: player.y - 12, vx: 140, vy: -600 });
  }
  for (const s of shots) bullets.player.push({ ...s, radius: 4 });
  if (audio) audio.shoot();
}

export function fireEnemyBullet(bullets, x, y, vx, vy, audio) {
  bullets.enemy.push({ x, y, vx, vy, radius: 5 });
  if (audio) audio.enemyShoot();
}

export function updateBullets(bullets, dt, w, h) {
  for (let i = bullets.player.length - 1; i >= 0; i--) {
    const b = bullets.player[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.y < -20 || b.x < -20 || b.x > w + 20) bullets.player.splice(i, 1);
  }
  for (let i = bullets.enemy.length - 1; i >= 0; i--) {
    const b = bullets.enemy[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.y > h + 20 || b.x < -20 || b.x > w + 20) bullets.enemy.splice(i, 1);
  }
}

export function drawBullets(ctx, bullets) {
  ctx.save();
  ctx.shadowBlur = 8;
  for (const b of bullets.player) {
    ctx.shadowColor = '#00f0ff';
    ctx.strokeStyle = '#bffaff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y + 8);
    ctx.lineTo(b.x, b.y - 8);
    ctx.stroke();
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const b of bullets.enemy) {
    ctx.shadowColor = '#ff2d55';
    ctx.fillStyle = '#ff2d55';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd2dd';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function hit(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const r = a.radius + b.radius;
  return dx * dx + dy * dy < r * r;
}

// Player bullets vs enemies and the boss. Returns the score earned.
export function collidePlayerBullets(bullets, enemies, boss, onEnemyKilled, onBossHit) {
  let score = 0;
  for (let i = bullets.player.length - 1; i >= 0; i--) {
    const b = bullets.player[i];
    let consumed = false;
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (hit(b, e)) {
        bullets.player.splice(i, 1);
        consumed = true;
        e.hp -= 1;
        if (e.hp <= 0) {
          enemies.splice(j, 1);
          score += onEnemyKilled(e);
        }
        break;
      }
    }
    if (consumed) continue;
    if (boss && boss.active && hit(b, boss)) {
      bullets.player.splice(i, 1);
      boss.hp -= 1;
      onBossHit();
    }
  }
  return score;
}

// Enemy bullets vs the player. Returns true when the player is hit.
export function collideEnemyBullets(bullets, player) {
  if (!player.alive || player.invulnerable > 0) return false;
  for (let i = bullets.enemy.length - 1; i >= 0; i--) {
    const b = bullets.enemy[i];
    if (hit(b, player)) {
      bullets.enemy.splice(i, 1);
      return true;
    }
  }
  return false;
}

// Enemies (and the boss) ramming the player. Returns the enemy hit, or null.
export function collideEnemiesWithPlayer(enemies, boss, player) {
  if (!player.alive || player.invulnerable > 0) return null;
  for (let j = enemies.length - 1; j >= 0; j--) {
    if (hit(enemies[j], player)) return enemies[j];
  }
  if (boss && boss.active && hit(boss, player)) return boss;
  return null;
}
