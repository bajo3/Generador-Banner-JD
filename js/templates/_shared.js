// ── Shared design system para todos los templates ────────────────────────────
export const W = 1080;
export const H = 1080;

export const PINK    = "#ff008c";
export const PINK2   = "#ff3da8";
export const BLACK   = "#000000";
export const WHITE   = "#ffffff";
export const DARK    = "#0a0a10";

// Rounded rect helper
export function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

// Header compartido: negro con "Jesús DIAZ / AUTOMOTORES"
// Retorna la altura usada
export function drawHeader(ctx, h = 170) {
  // Fondo negro puro
  ctx.save();
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, W, h);

  // Línea inferior rosa con glow
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

  // "Jesús" en blanco, "DIAZ" en rosa — tamaño grande
  ctx.font = "300 52px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = WHITE;
  ctx.fillText("Jesús ", cx - 2, 82);

  ctx.font = "900 62px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = PINK;
  ctx.fillText("DIAZ", cx + 2, 82);

  // Subrayado bajo DIAZ
  ctx.font = "900 62px system-ui, sans-serif";
  const diazW = ctx.measureText("DIAZ").width;
  ctx.fillStyle = PINK;
  ctx.fillRect(cx + 2, 88, diazW, 4);

  // AUTOMOTORES — espaciado de letras
  ctx.save();
  ctx.font = "600 21px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(255,255,255,0.70)";
  ctx.letterSpacing = "0.30em";
  // Fallback manual spacing
  const aut = "A U T O M O T O R E S";
  ctx.fillText(aut, cx, 128);
  ctx.restore();

  // Tagline "TU MEJOR ELECCIÓN" en rosa pequeño
  ctx.font = "700 14px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,0,140,0.75)";
  ctx.fillText("· TU MEJOR ELECCIÓN ·", cx, 152);

  ctx.restore();
  return h;
}

// Footer compartido con fondo negro y datos
export function drawFooter(ctx, lines, h, footerH = 180) {
  const fy = h - footerH;
  ctx.save();

  // Fondo negro
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, fy, W, footerH);

  // Línea superior rosa con glow
  const lineGrd = ctx.createLinearGradient(0, 0, W, 0);
  lineGrd.addColorStop(0,    "rgba(255,0,140,0.3)");
  lineGrd.addColorStop(0.15, PINK);
  lineGrd.addColorStop(0.85, PINK);
  lineGrd.addColorStop(1,    "rgba(255,0,140,0.3)");
  ctx.fillStyle = lineGrd;
  ctx.fillRect(0, fy, W, 5);

  // Glow bajo la línea
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
