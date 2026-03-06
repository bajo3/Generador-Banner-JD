import { drawCoverPanZoom, fitText, textStrokeFill } from "../draw.js";
import { upper, cleanSpaces } from "../utils.js";

const W = 1080;
const H = 1080;
const PINK  = "#ff008c";
const BLACK = "#000000";
const WHITE = "#ffffff";

function rr(ctx, x, y, w, h, r) {
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

function pinkLine(ctx, y) {
  const lg = ctx.createLinearGradient(0, 0, W, 0);
  lg.addColorStop(0,    "rgba(255,0,140,0.30)");
  lg.addColorStop(0.12, PINK);
  lg.addColorStop(0.88, PINK);
  lg.addColorStop(1,    "rgba(255,0,140,0.30)");
  ctx.fillStyle = lg;
  ctx.fillRect(0, y, W, 5);
  const gg = ctx.createLinearGradient(0, y + 5, 0, y + 38);
  gg.addColorStop(0, "rgba(255,0,140,0.16)");
  gg.addColorStop(1, "rgba(255,0,140,0)");
  ctx.fillStyle = gg;
  ctx.fillRect(0, y + 5, W, 33);
}

function drawHeader(ctx) {
  const h = 168;
  const cx = W / 2;
  ctx.save();
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, W, h);

  ctx.font = "300 56px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = WHITE;
  ctx.fillText("Jesús ", cx, 84);

  ctx.font = "900 64px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = PINK;
  ctx.fillText("DIAZ", cx, 84);

  const dw = ctx.measureText("DIAZ").width;
  ctx.fillStyle = PINK;
  ctx.fillRect(cx, 90, dw, 4);

  ctx.font = "500 19px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillText("A U T O M O T O R E S", cx, 126);

  ctx.font = "700 13px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,0,140,0.70)";
  ctx.fillText("· TU MEJOR ELECCIÓN ·", cx, 150);

  pinkLine(ctx, h - 5);
  ctx.restore();
  return h;
}

// Decorative sparkle stars
function drawSparkles(ctx, cx, cy, count, radius, alpha) {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const dist  = radius * (0.6 + 0.4 * Math.random());
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;
    const size = 3 + Math.random() * 5;
    ctx.globalAlpha = alpha * (0.5 + Math.random() * 0.5);
    ctx.fillStyle = PINK;
    // Star shape (4-point)
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    for (let p = 0; p < 4; p++) {
      const a = (p / 4) * Math.PI * 2;
      const r = p % 2 === 0 ? size : size * 0.35;
      p === 0
        ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
        : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawFelicitaciones(ctx, img, data, transform = { zoom: 1, panX: 0, panY: 0 }) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  const headerH = 168;
  const footerH = 290;
  const footerY = H - footerH;
  const photoY  = headerH;
  const photoH  = footerY - headerH;
  const cx = W / 2;

  // ── Photo ────────────────────────────────────────────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, photoY, W, photoH);
  ctx.clip();
  if (img) drawCoverPanZoom(ctx, img, 0, photoY, W, photoH, transform);
  // Warm slight overlay (celebratory)
  ctx.fillStyle = "rgba(255,0,80,0.04)";
  ctx.fillRect(0, photoY, W, photoH);
  const vt = ctx.createLinearGradient(0, photoY, 0, photoY + 60);
  vt.addColorStop(0, "rgba(0,0,0,0.28)");
  vt.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = vt;
  ctx.fillRect(0, photoY, W, 60);
  const vb = ctx.createLinearGradient(0, footerY - 80, 0, footerY);
  vb.addColorStop(0, "rgba(0,0,0,0)");
  vb.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = vb;
  ctx.fillRect(0, footerY - 80, W, 80);
  ctx.restore();

  // ── Header ───────────────────────────────────────────────────────────────
  drawHeader(ctx);

  // ── Footer ───────────────────────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, footerY, W, footerH);
  pinkLine(ctx, footerY);

  // Subtle pink radial glow in footer background
  const fg = ctx.createRadialGradient(cx, footerY + footerH * 0.5, 0, cx, footerY + footerH * 0.5, footerH * 1.2);
  fg.addColorStop(0, "rgba(255,0,140,0.10)");
  fg.addColorStop(1, "rgba(255,0,140,0)");
  ctx.fillStyle = fg;
  ctx.fillRect(0, footerY, W, footerH);
  ctx.restore();

  // ── FELICITACIONES title ──────────────────────────────────────────────────
  // Decorative divider above text
  const titleY = footerY + 68;
  const divW = 160;
  ctx.save();
  const dg = ctx.createLinearGradient(cx - divW / 2, 0, cx + divW / 2, 0);
  dg.addColorStop(0, "transparent");
  dg.addColorStop(0.5, "rgba(255,0,140,0.55)");
  dg.addColorStop(1, "transparent");
  ctx.fillStyle = dg;
  ctx.fillRect(cx - divW / 2, titleY - 20, divW, 2);
  ctx.restore();

  // Main title with pink glow
  const title = "¡FELICITACIONES!";
  const titleS = fitText(ctx, title, 960, 76, 40, "system-ui, sans-serif", "900");
  ctx.save();
  ctx.font = `900 ${titleS}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Pink glow pass
  ctx.shadowColor = "rgba(255,0,140,0.55)";
  ctx.shadowBlur  = 28;
  ctx.fillStyle = PINK;
  ctx.fillText(title, cx, titleY);

  // White fill pass
  ctx.shadowBlur = 0;
  ctx.fillStyle = WHITE;
  ctx.fillText(title, cx, titleY);
  ctx.restore();

  // Sparkles around title
  drawSparkles(ctx, cx, titleY - titleS * 0.4, 16, 260, 0.55);

  // ── "Por la compra de tu:" label ─────────────────────────────────────────
  ctx.save();
  ctx.font = "500 20px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(255,255,255,0.52)";
  ctx.fillText("Por la compra de tu", cx, titleY + 38);
  ctx.restore();

  // ── Cliente name ──────────────────────────────────────────────────────────
  const name = cleanSpaces(upper(data.clientName || ""));
  if (name) {
    const nS = fitText(ctx, name, 960, 66, 30, "system-ui, sans-serif", "900");
    ctx.save();
    ctx.font = `900 ${nS}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.shadowColor = "rgba(0,0,0,0.50)";
    ctx.shadowBlur  = 14;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = WHITE;
    ctx.fillText(name, cx, titleY + 38 + nS + 22);
    ctx.restore();

    // Underline in pink
    ctx.save();
    ctx.font = `900 ${nS}px system-ui, sans-serif`;
    const mW = Math.min(W - 120, ctx.measureText(name).width + 20);
    const ulGrd = ctx.createLinearGradient(cx - mW / 2, 0, cx + mW / 2, 0);
    ulGrd.addColorStop(0, "transparent");
    ulGrd.addColorStop(0.5, PINK);
    ulGrd.addColorStop(1, "transparent");
    ctx.fillStyle = ulGrd;
    ctx.fillRect(cx - mW / 2, titleY + 38 + nS + 28, mW, 3);
    ctx.restore();
  }

  // ── Bottom tagline ────────────────────────────────────────────────────────
  ctx.save();
  ctx.font = "600 17px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(255,0,140,0.65)";
  ctx.fillText("· TU MEJOR ELECCIÓN ·", cx, footerY + footerH - 22);
  ctx.restore();
}

export async function renderFelicitaciones({ img, data, transform = { zoom: 1, panX: 0, panY: 0 } }) {
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  drawFelicitaciones(ctx, img, data, transform);
  const format  = data?.__exportFormat || "jpg";
  const quality = Number(data?.__exportQuality ?? 0.92);
  const mime    = format === "png" ? "image/png" : "image/jpeg";
  const blob    = await new Promise(r => canvas.toBlob(r, mime, mime === "image/jpeg" ? quality : undefined));
  const dataURL = canvas.toDataURL(mime, mime === "image/jpeg" ? quality : undefined);
  return { blob, dataURL };
}
