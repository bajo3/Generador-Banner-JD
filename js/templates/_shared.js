// ── Shared design system ──────────────────────────────────────────────────────
export const W = 1080;
export const H = 1080;

export const PINK    = "#ff008c";
export const PINK2   = "#ff3da8";
export const BLACK   = "#000000";
export const WHITE   = "#ffffff";
export const DARK    = "#0a0a10";
export const LOGO_RATIO = 801 / 253;

// ── Rounded rect ─────────────────────────────────────────────────────────────
export function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

// ── Pink line with glow (reusable across all templates) ──────────────────────
export function pinkLine(ctx, y, width = W) {
  const lg = ctx.createLinearGradient(0, 0, width, 0);
  lg.addColorStop(0,    "rgba(255,0,140,0.25)");
  lg.addColorStop(0.12, PINK);
  lg.addColorStop(0.88, PINK);
  lg.addColorStop(1,    "rgba(255,0,140,0.25)");
  ctx.fillStyle = lg;
  ctx.fillRect(0, y, width, 5);
  const gg = ctx.createLinearGradient(0, y + 5, 0, y + 32);
  gg.addColorStop(0, "rgba(255,0,140,0.15)");
  gg.addColorStop(1, "rgba(255,0,140,0)");
  ctx.fillStyle = gg;
  ctx.fillRect(0, y + 5, width, 27);
}

// ── Logo image draw (shared by portada, venta, vendido, felicitaciones) ──────
export function drawLogoImg(ctx, logoImg, x, y, w, h) {
  if (!logoImg) return;
  const padX = w * 0.08, padY = h * 0.10;
  const maxW = w - padX * 2, maxH = h - padY * 2;
  let lw = maxW, lh = lw / LOGO_RATIO;
  if (lh > maxH) { lh = maxH; lw = lh * LOGO_RATIO; }
  ctx.drawImage(logoImg, x + (w - lw) / 2, y + (h - lh) / 2, lw, lh);
}

// ── Historia header (for 9:16 templates) ─────────────────────────────────────
export function drawHeader(ctx, h = 170) {
  ctx.save();
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, W, h);

  const lineY = h - 5;
  const grd = ctx.createLinearGradient(0, lineY - 12, 0, lineY + 5);
  grd.addColorStop(0, "rgba(255,0,140,0)");
  grd.addColorStop(0.5, "rgba(255,0,140,0.25)");
  grd.addColorStop(1, "rgba(255,0,140,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, lineY - 12, W, 17);
  ctx.fillStyle = PINK;
  ctx.fillRect(0, lineY, W, 5);

  const cx = W / 2;
  ctx.font = "300 52px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = WHITE;
  ctx.fillText("Jesús ", cx - 2, 82);

  ctx.font = "900 62px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = PINK;
  ctx.fillText("DIAZ", cx + 2, 82);

  ctx.font = "900 62px system-ui, sans-serif";
  const diazW = ctx.measureText("DIAZ").width;
  ctx.fillStyle = PINK;
  ctx.fillRect(cx + 2, 88, diazW, 4);

  ctx.save();
  ctx.font = "600 21px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(255,255,255,0.70)";
  ctx.letterSpacing = "0.30em";
  ctx.fillText("A U T O M O T O R E S", cx, 128);
  ctx.restore();

  ctx.font = "700 14px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,0,140,0.75)";
  ctx.fillText("· TU MEJOR ELECCIÓN ·", cx, 152);

  ctx.restore();
  return h;
}

// ── Historia footer ───────────────────────────────────────────────────────────
export function drawFooter(ctx, lines, h, footerH = 180) {
  const fy = h - footerH;
  ctx.save();
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, fy, W, footerH);

  const lineGrd = ctx.createLinearGradient(0, 0, W, 0);
  lineGrd.addColorStop(0,    "rgba(255,0,140,0.3)");
  lineGrd.addColorStop(0.15, PINK);
  lineGrd.addColorStop(0.85, PINK);
  lineGrd.addColorStop(1,    "rgba(255,0,140,0.3)");
  ctx.fillStyle = lineGrd;
  ctx.fillRect(0, fy, W, 5);

  const glowGrd = ctx.createLinearGradient(0, fy + 5, 0, fy + 40);
  glowGrd.addColorStop(0, "rgba(255,0,140,0.15)");
  glowGrd.addColorStop(1, "rgba(255,0,140,0)");
  ctx.fillStyle = glowGrd;
  ctx.fillRect(0, fy + 5, W, 35);

  const cx = W / 2;
  const totalLines = lines.length;
  const spacing = Math.min(58, Math.floor((footerH - 30) / Math.max(1, totalLines)));
  const startY = fy + Math.round((footerH - spacing * (totalLines - 1) - 44) / 2) + 44;

  lines.forEach((line, i) => {
    if (!line.text) return;
    const y = startY + i * spacing;
    ctx.font = `${line.weight || 800} ${line.size || 44}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = line.color || WHITE;
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fillText(line.text, cx, y);
    ctx.shadowBlur = 0;
  });

  ctx.restore();
  return fy;
}
