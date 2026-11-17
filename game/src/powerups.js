// Power-ups: drops that fall from destroyed enemies and grant a timed
// weapon or a shield, a bomb or an extra life. Five kinds, one job each.
import { pick, range } from './rng.js';

export const POWERUP_TYPES = {
  spread: { label: 'S', color: '#00f0ff', name: 'SPREAD SHOT' },
  rapid: { label: 'R', color: '#ffb02e', name: 'RAPID FIRE' },
  shield: { label: 'H', color: '#7df9ff', name: 'SHIELD' },
  bomb: { label: 'B', color: '#ff2d55', name: 'NOVA BOMB' },
  life: { label: '1UP', color: '#7dff6a', name: 'EXTRA LIFE' },
};

export function createPowerups() {
  return { list: [] };
}

export function maybeDrop(powerups, x, y, rng) {
  if (rng() > 0.16) return;
  const roll = rng();
  let kind = 'spread';
  if (roll < 0.3) kind = 'spread';
  else if (roll < 0.55) kind = 'rapid';
  else if (roll < 0.78) kind = 'shield';
  else if (roll < 0.93) kind = 'bomb';
  else kind = 'life';
  powerups.list.push({ kind, x, y, vy: 90, radius: 14, age: 0 });
}

export function updatePowerups(powerups, dt, h) {
  for (let i = powerups.list.length - 1; i >= 0; i--) {
    const p = powerups.list[i];
    p.age += dt;
    p.y += p.vy * dt;
    if (p.y > h + 30) powerups.list.splice(i, 1);
  }
}

export function drawPowerups(ctx, powerups, time) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const p of powerups.list) {
    const def = POWERUP_TYPES[p.kind];
    const bob = Math.sin(p.age * 4) * 3;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.shadowColor = def.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(10,10,40,0.9)';
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = def.color;
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillText(def.label, 0, 1);
    ctx.restore();
  }
  ctx.restore();
}

export function applyPowerup(player, kind, state) {
  const def = POWERUP_TYPES[kind];
  if (kind === 'spread') {
    player.weapon = Math.min(3, player.weapon + 1);
  } else if (kind === 'rapid') {
    player.rapidTimer = 8;
  } else if (kind === 'shield') {
    player.shield = 8;
  } else if (kind === 'life') {
    player.lives = Math.min(5, player.lives + 1);
  } else if (kind === 'bomb') {
    state.bombQueued = true;
  }
  return def.name;
}
