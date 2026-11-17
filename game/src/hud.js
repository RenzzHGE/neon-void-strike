// The HUD and the full-screen menus: title, pause, game over and victory.
// Everything is drawn on the canvas so the screenshots show the whole loop.
export function drawHud(ctx, state, w, h) {
  const { score, highScore, wave } = state;
  ctx.save();
  ctx.textBaseline = 'top';
  // Score, top left.
  ctx.textAlign = 'left';
  ctx.font = 'bold 20px "Courier New", monospace';
  ctx.fillStyle = '#00f0ff';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 8;
  ctx.fillText(`SCORE ${String(score).padStart(6, '0')}`, 16, 14);
  ctx.font = '14px "Courier New", monospace';
  ctx.fillStyle = '#9be8ff';
  ctx.fillText(`BEST  ${String(Math.max(highScore, score)).padStart(6, '0')}`, 16, 40);
  // Wave, top center.
  ctx.textAlign = 'center';
  ctx.font = 'bold 18px "Courier New", monospace';
  ctx.fillStyle = '#ff9ff3';
  ctx.fillText(`WAVE ${wave} / 9`, w / 2, 16);
  // Lives, top right, as little ships.
  ctx.textAlign = 'right';
  ctx.font = 'bold 16px "Courier New", monospace';
  ctx.fillStyle = '#ff2d95';
  ctx.fillText('LIVES', w - 16, 14);
  for (let i = 0; i < state.player.lives; i++) {
    const x = w - 30 - i * 26;
    const y = 52;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(6, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // Weapon status, bottom left.
  ctx.textAlign = 'left';
  ctx.font = '13px "Courier New", monospace';
  ctx.fillStyle = '#c9c9ff';
  const weaponName = ['—', 'SINGLE', 'DOUBLE', 'SPREAD'][state.player.weapon];
  let status = `GUN ${weaponName}`;
  if (state.player.rapidTimer > 0) status += `  RAPID ${Math.ceil(state.player.rapidTimer)}s`;
  if (state.player.shield > 0) status += `  SHIELD ${Math.ceil(state.player.shield)}s`;
  ctx.fillText(status, 16, h - 24);
  ctx.fillText('P pause   M mute', 16, h - 44);
  ctx.restore();
}

function panel(ctx, w, h, title, titleColor, lines, prompt) {
  ctx.save();
  ctx.fillStyle = 'rgba(3,0,16,0.72)';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 52px "Courier New", monospace';
  ctx.fillStyle = titleColor;
  ctx.shadowColor = titleColor;
  ctx.shadowBlur = 24;
  ctx.fillText(title, w / 2, h * 0.32);
  ctx.shadowBlur = 0;
  ctx.font = '17px "Courier New", monospace';
  ctx.fillStyle = '#e8e8ff';
  lines.forEach((line, i) => {
    ctx.fillText(line, w / 2, h * 0.32 + 52 + i * 28);
  });
  if (prompt) {
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(prompt, w / 2, h * 0.32 + 52 + lines.length * 28 + 34);
  }
  ctx.restore();
}

export function drawTitle(ctx, state, w, h, time) {
  panel(
    ctx,
    w,
    h,
    'NEON VOID',
    '#00f0ff',
    [
      'STRIKE — a neon arcade space shooter',
      '',
      'WASD / arrows or mouse to fly  •  SPACE or click to fire',
      'Destroy the waves. A boss waits every 3rd wave.',
      'Beat the Void Emperor on wave 9 to win.',
      'Grab power-ups: S spread  •  R rapid  •  H shield  •  B bomb  •  1UP life',
    ],
    Math.floor(time * 1.5) % 2 === 0 ? 'PRESS ENTER OR CLICK TO START' : '',
  );
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '14px "Courier New", monospace';
  ctx.fillStyle = '#9be8ff';
  ctx.fillText(`BEST SCORE  ${String(state.highScore).padStart(6, '0')}`, w / 2, h - 40);
  ctx.restore();
}

export function drawPaused(ctx, w, h) {
  panel(ctx, w, h, 'PAUSED', '#ffb02e', ['Take a breath, pilot.', 'The void waits for no one — except now.'], 'PRESS P TO RESUME');
}

export function drawGameOver(ctx, state, w, h) {
  panel(
    ctx,
    w,
    h,
    'GAME OVER',
    '#ff2d55',
    [
      `Final score  ${String(state.score).padStart(6, '0')}   •   Wave reached  ${state.wave}`,
      state.score >= state.highScore && state.score > 0 ? 'NEW BEST SCORE!' : `Best score  ${String(state.highScore).padStart(6, '0')}`,
    ],
    'PRESS ENTER TO FLY AGAIN',
  );
}

export function drawVictory(ctx, state, w, h) {
  panel(
    ctx,
    w,
    h,
    'VICTORY!',
    '#7dff6a',
    [
      'The Void Emperor is scrap. The sector is yours, pilot.',
      `Final score  ${String(state.score).padStart(6, '0')}   •   All 9 waves cleared`,
      state.score >= state.highScore && state.score > 0 ? 'NEW BEST SCORE!' : `Best score  ${String(state.highScore).padStart(6, '0')}`,
    ],
    'PRESS ENTER TO PLAY AGAIN',
  );
}

export function drawWaveBanner(ctx, w, h, text, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 40px "Courier New", monospace';
  ctx.fillStyle = '#ff9ff3';
  ctx.shadowColor = '#ff9ff3';
  ctx.shadowBlur = 20;
  ctx.fillText(text, w / 2, h * 0.38);
  ctx.restore();
}
