// Particles, the parallax starfield and floating score text.
// Everything here is pure canvas drawing: no image assets.
import { range } from './rng.js';

export function createParticles(rng) {
  const particles = {
    stars: [],
    bursts: [],
    texts: [],
  };

  for (let layer = 0; layer < 3; layer++) {
    const count = layer === 0 ? 60 : layer === 1 ? 40 : 25;
    for (let i = 0; i < count; i++) {
      particles.stars.push({
        x: rng(),
        y: rng(),
        layer,
        size: layer === 0 ? 1 : layer === 1 ? 1.6 : 2.4,
        twinkle: range(rng, 0, Math.PI * 2),
      });
    }
  }

  particles.explosion = (x, y, color, count, speed) => {
    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2;
      const v = range(rng, speed * 0.3, speed);
      particles.bursts.push({
        x,
        y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        life: range(rng, 0.3, 0.8),
        maxLife: 0.8,
        size: range(rng, 1.5, 3.5),
        color,
      });
    }
  };

  particles.text = (x, y, message, color) => {
    particles.texts.push({ x, y, message, color: color || '#ffffff', life: 1.0 });
  };

  particles.update = (dt) => {
    for (const star of particles.stars) {
      star.y += dt * (0.02 + star.layer * 0.03);
      if (star.y > 1) {
        star.y = 0;
        star.x = rng();
      }
      star.twinkle += dt * 3;
    }
    for (let i = particles.bursts.length - 1; i >= 0; i--) {
      const p = particles.bursts[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      if (p.life <= 0) particles.bursts.splice(i, 1);
    }
    for (let i = particles.texts.length - 1; i >= 0; i--) {
      const t = particles.texts[i];
      t.life -= dt * 0.9;
      t.y -= 30 * dt;
      if (t.life <= 0) particles.texts.splice(i, 1);
    }
  };

  particles.drawBackground = (ctx, w, h, time) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#05010f');
    gradient.addColorStop(0.55, '#0d0221');
    gradient.addColorStop(1, '#160233');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    // A faint nebula: two big soft radial glows, drawn once per frame.
    const nebula = (x, y, r, color) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };
    nebula(w * 0.2, h * 0.25, w * 0.45, 'rgba(120,40,220,0.14)');
    nebula(w * 0.85, h * 0.7, w * 0.4, 'rgba(0,180,255,0.10)');
    for (const star of particles.stars) {
      const alpha = 0.4 + 0.6 * Math.abs(Math.sin(star.twinkle + time));
      ctx.globalAlpha = alpha * (0.5 + star.layer * 0.25);
      ctx.fillStyle = star.layer === 2 ? '#aef' : '#fff';
      ctx.fillRect(star.x * w, star.y * h, star.size, star.size);
    }
    ctx.globalAlpha = 1;
  };

  particles.drawForeground = (ctx) => {
    for (const p of particles.bursts) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px "Courier New", monospace';
    for (const t of particles.texts) {
      ctx.globalAlpha = Math.max(0, t.life);
      ctx.fillStyle = t.color;
      ctx.fillText(t.message, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  };

  return particles;
}
