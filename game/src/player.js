// The player ship: movement, firing, shield, lives and weapon upgrades.
import { clamp } from './rng.js';

export function createPlayer(w, h) {
  return {
    x: w / 2,
    y: h - 90,
    radius: 14,
    speed: 420,
    lives: 3,
    shield: 0, // seconds of shield left
    fireCooldown: 0,
    fireRate: 0.16, // seconds between shots
    weapon: 1, // 1 = single, 2 = double, 3 = spread
    rapidTimer: 0, // rapid-fire power-up time left
    invulnerable: 0, // seconds of spawn protection
    alive: true,
    tilt: 0,
  };
}

export function updatePlayer(player, input, dt, w, h, fireBullet) {
  if (!player.alive) return;
  const speed = player.speed * (player.rapidTimer > 0 ? 1.15 : 1);
  let dx = 0;
  let dy = 0;
  if (input.left()) dx -= 1;
  if (input.right()) dx += 1;
  if (input.up()) dy -= 1;
  if (input.down()) dy += 1;
  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    player.x += (dx / len) * speed * dt;
    player.y += (dy / len) * speed * dt;
  }
  // Mouse steering: the ship glides toward the pointer when it moved.
  if (input.mouseMoved && !input.isDown('Space')) {
    const tx = clamp(input.mouseX, 24, w - 24);
    const ty = clamp(input.mouseY, h * 0.35, h - 40);
    player.x += (tx - player.x) * Math.min(1, dt * 10);
    player.y += (ty - player.y) * Math.min(1, dt * 10);
  }
  player.x = clamp(player.x, 24, w - 24);
  player.y = clamp(player.y, h * 0.4, h - 40);
  player.tilt = clamp((dx || (input.mouseMoved ? (input.mouseX - player.x) * 0.01 : 0)) * 0.35, -0.4, 0.4);

  player.fireCooldown -= dt;
  if (player.rapidTimer > 0) player.rapidTimer -= dt;
  if (player.shield > 0) player.shield -= dt;
  if (player.invulnerable > 0) player.invulnerable -= dt;
  if (input.firing() && player.fireCooldown <= 0) {
    player.fireCooldown = player.rapidTimer > 0 ? player.fireRate * 0.55 : player.fireRate;
    fireBullet(player);
  }
}

export function drawPlayer(ctx, player, time) {
  if (!player.alive) return;
  if (player.invulnerable > 0 && Math.floor(time * 12) % 2 === 0) return; // blink while protected
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.tilt);
  // Engine glow.
  const flame = 10 + Math.sin(time * 30) * 4;
  const glow = ctx.createRadialGradient(0, 16, 0, 0, 16, flame + 8);
  glow.addColorStop(0, 'rgba(255,180,60,0.9)');
  glow.addColorStop(1, 'rgba(255,80,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 16, flame + 8, 0, Math.PI * 2);
  ctx.fill();
  // Hull: a neon arrow ship, drawn in strokes so it reads at any scale.
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#00f0ff';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 12;
  ctx.fillStyle = 'rgba(0,40,80,0.9)';
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(13, 12);
  ctx.lineTo(6, 7);
  ctx.lineTo(0, 12);
  ctx.lineTo(-6, 7);
  ctx.lineTo(-13, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ff2d95';
  ctx.beginPath();
  ctx.arc(0, -4, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Shield ring.
  if (player.shield > 0) {
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.2 * Math.sin(time * 8);
    ctx.strokeStyle = '#7df9ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#7df9ff';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
