// The boss: a Void Cruiser that appears every third wave, strafes across
// the top of the screen and fires aimed bursts and radial rings.
import { range } from './rng.js';

export function createBoss() {
  return {
    active: false,
    x: 0,
    y: -120,
    hp: 0,
    maxHp: 1,
    radius: 52,
    phase: 0,
    age: 0,
    shootTimer: 2,
    ringTimer: 5,
    direction: 1,
    entering: false,
    name: 'VOID CRUISER',
  };
}

export function startBoss(boss, wave, w, rng) {
  boss.active = true;
  boss.entering = true;
  boss.x = w / 2;
  boss.y = -90;
  boss.maxHp = 40 + wave * 12;
  boss.hp = boss.maxHp;
  boss.phase = 0;
  boss.age = 0;
  boss.shootTimer = 2;
  boss.ringTimer = 5;
  boss.direction = rng() > 0.5 ? 1 : -1;
  boss.name = wave >= 9 ? 'VOID EMPEROR' : wave >= 6 ? 'VOID DESTROYER' : 'VOID CRUISER';
}

export function updateBoss(boss, dt, w, player, bullets, fireEnemyBullet, rng) {
  if (!boss.active) return;
  boss.age += dt;
  if (boss.entering) {
    boss.y += 120 * dt;
    if (boss.y >= 110) {
      boss.y = 110;
      boss.entering = false;
    }
    return;
  }
  // Strafe and bob.
  boss.x += boss.direction * (70 + boss.phase * 25) * dt;
  if (boss.x < 90) {
    boss.x = 90;
    boss.direction = 1;
  } else if (boss.x > w - 90) {
    boss.x = w - 90;
    boss.direction = -1;
  }
  boss.y = 110 + Math.sin(boss.age * 1.4) * 18;
  // Phase 2 (below half health): faster and angrier.
  boss.phase = boss.hp < boss.maxHp / 2 ? 1 : 0;
  boss.shootTimer -= dt;
  if (boss.shootTimer <= 0 && player && player.alive) {
    boss.shootTimer = boss.phase === 1 ? 0.9 : 1.5;
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const len = Math.hypot(dx, dy) || 1;
    const speed = 260;
    fireEnemyBullet(bullets, boss.x - 30, boss.y + 30, (dx / len) * speed - 30, (dy / len) * speed);
    fireEnemyBullet(bullets, boss.x + 30, boss.y + 30, (dx / len) * speed + 30, (dy / len) * speed);
    fireEnemyBullet(bullets, boss.x, boss.y + 40, (dx / len) * speed, (dy / len) * speed);
  }
  boss.ringTimer -= dt;
  if (boss.ringTimer <= 0) {
    boss.ringTimer = boss.phase === 1 ? 4 : 6;
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 + range(rng, 0, 0.3);
      fireEnemyBullet(bullets, boss.x, boss.y + 20, Math.cos(a) * 150, Math.sin(a) * 150 + 60);
    }
  }
}

export function drawBoss(ctx, boss, time) {
  if (!boss.active) return;
  ctx.save();
  ctx.translate(boss.x, boss.y);
  ctx.lineWidth = 3;
  ctx.strokeStyle = boss.phase === 1 ? '#ff2d55' : '#b967ff';
  ctx.shadowColor = ctx.strokeStyle;
  ctx.shadowBlur = 18;
  ctx.fillStyle = 'rgba(30,0,50,0.95)';
  // A wide cruiser hull with twin prongs and a glowing core.
  ctx.beginPath();
  ctx.moveTo(-52, -18);
  ctx.lineTo(52, -18);
  ctx.lineTo(44, 22);
  ctx.lineTo(18, 34);
  ctx.lineTo(8, 14);
  ctx.lineTo(-8, 14);
  ctx.lineTo(-18, 34);
  ctx.lineTo(-44, 22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  const pulse = 0.6 + 0.4 * Math.sin(time * 6);
  ctx.fillStyle = boss.phase === 1 ? '#ff2d55' : '#ff5df2';
  ctx.globalAlpha = pulse;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawBossBar(ctx, boss, w) {
  if (!boss.active) return;
  const barW = Math.min(420, w * 0.5);
  const x = (w - barW) / 2;
  const y = 56;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 13px "Courier New", monospace';
  ctx.fillStyle = '#ff9ff3';
  ctx.fillText(boss.name, w / 2, y - 6);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(x, y, barW, 10);
  ctx.fillStyle = boss.phase === 1 ? '#ff2d55' : '#b967ff';
  ctx.fillRect(x, y, barW * Math.max(0, boss.hp / boss.maxHp), 10);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, barW, 10);
  ctx.restore();
}
