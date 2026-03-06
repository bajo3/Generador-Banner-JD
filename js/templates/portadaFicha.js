import { drawCoverPanZoom, textStrokeFill, fitText, avgLuminance } from "../draw.js";
import { formatKm, upper, cleanSpaces } from "../utils.js";

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

function drawHeader(ctx) {
  const h = 168;
  ctx.save();
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, W, h);

  const cx = W / 2;

  // "Jesús" light + "DIAZ" bold pink — split text
  ctx.font = "300 56px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = WHITE;
  ctx.fillText("Jesús ", cx, 84);

  ctx.font = "900 64px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = PINK;
  ctx.fillText("DIAZ", cx, 84);

  // Underline under DIAZ
  const dw = ctx.measureText("DIAZ").width;
  ctx.fillStyle = PINK;
  ctx.fillRect(cx, 90, dw, 4);

  // AUTOMOTORES
  ctx.font = "500 19px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillText("A U T O M O T O R E S", cx, 126);

  // Tagline
  ctx.font = "700 13px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,0,140,0.70)";
  ctx.fillText("· TU MEJOR ELECCIÓN ·", cx, 150);

  // Bottom separator line + glow
  const ly = h - 5;
  const lg = ctx.createLinearGradient(0, 0, W, 0);
  lg.addColorStop(0,    "rgba(255,0,140,0.3)");
  lg.addColorStop(0.15, PINK);
  lg.addColorStop(0.85, PINK);
  lg.addColorStop(1,    "rgba(255,0,140,0.3)");
  ctx.fillStyle = lg;
  ctx.fillRect(0, ly, W, 5);
  // Glow
  const gg = ctx.createLinearGradient(0, ly + 5, 0, ly + 36);
  gg.addColorStop(0, "rgba(255,0,140,0.18)");
  gg.addColorStop(1, "rgba(255,0,140,0)");
  ctx.fillStyle = gg;
  ctx.fillRect(0, ly + 5, W, 31);

  ctx.restore();
  return h;
}

function drawBottomBar(ctx, footerY) {
  const barH = H - footerY;
  ctx.save();

  ctx.fillStyle = BLACK;
  ctx.fillRect(0, footerY, W, barH);

  // Top line
  const lg = ctx.createLinearGradient(0, 0, W, 0);
  lg.addColorStop(0,    "rgba(255,0,140,0.3)");
  lg.addColorStop(0.12, PINK);
  lg.addColorStop(0.88, PINK);
  lg.addColorStop(1,    "rgba(255,0,140,0.3)");
  ctx.fillStyle = lg;
  ctx.fillRect(0, footerY, W, 5);

  // Glow
  const gg = ctx.createLinearGradient(0, footerY + 5, 0, footerY + 38);
  gg.addColorStop(0, "rgba(255,0,140,0.16)");
  gg.addColorStop(1, "rgba(255,0,140,0)");
  ctx.fillStyle = gg;
  ctx.fillRect(0, footerY + 5, W, 33);

  ctx.restore();
}

export function drawPortadaFicha(ctx, img, data, transform = { zoom: 1, panX: 0, panY: 0 }) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  const headerH = 168;
  const footerH = 220;
  const footerY = H - footerH;
  const photoY  = headerH;
  const photoH  = footerY - headerH;

  // ── Photo ────────────────────────────────────────────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, photoY, W, photoH);
  ctx.clip();
  if (img) drawCoverPanZoom(ctx, img, 0, photoY, W, photoH, transform);
  // Subtle top/bottom vignette
  const vt = ctx.createLinearGradient(0, photoY, 0, photoY + 80);
  vt.addColorStop(0, "rgba(0,0,0,0.35)");
  vt.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = vt;
  ctx.fillRect(0, photoY, W, 80);
  const vb = ctx.createLinearGradient(0, footerY - 80, 0, footerY);
  vb.addColorStop(0, "rgba(0,0,0,0)");
  vb.addColorStop(1, "rgba(0,0,0,0.40)");
  ctx.fillStyle = vb;
  ctx.fillRect(0, footerY - 80, W, 80);
  ctx.restore();

  // ── Header ───────────────────────────────────────────────────────────────
  drawHeader(ctx);

  // ── Bottom bar ───────────────────────────────────────────────────────────
  drawBottomBar(ctx, footerY);

  // ── Photo overlay: brand + model ─────────────────────────────────────────
  const cx = W / 2;
  const brand  = cleanSpaces(upper(data.brand || ""));
  const model  = cleanSpaces(upper(data.model || ""));

  // Measure background brightness for adaptive contrast
  const lum = img ? avgLuminance(ctx, W * 0.1, photoY + photoH * 0.08, W * 0.8, photoH * 0.32) : 0.3;
  const strokeBoost = lum > 0.60 ? 1.3 : 1.0;
  const shadowA     = lum > 0.60 ? 0.55 : 0.30;

  let ty = photoY + 64;

  if (brand) {
    const s = fitText(ctx, brand, 980, 72, 40, "system-ui, sans-serif", "900");
    textStrokeFill(ctx, brand, cx, ty, {
      font: `900 ${s}px system-ui, -apple-system, Segoe UI, sans-serif`,
      stroke: "rgba(0,0,0,0.88)",
      fill: WHITE,
      lineWidth: Math.max(5, Math.round(s * 0.11 * strokeBoost)),
      shadowColor: `rgba(0,0,0,${shadowA})`,
      shadowBlur: 18,
      shadowOffsetY: 6,
      align: "center",
      baseline: "alphabetic",
    });
    ty += s + 6;
  }

  if (model) {
    const s = fitText(ctx, model, 980, 96, 48, "system-ui, sans-serif", "900");
    textStrokeFill(ctx, model, cx, ty, {
      font: `900 ${s}px system-ui, -apple-system, Segoe UI, sans-serif`,
      stroke: "rgba(0,0,0,0.88)",
      fill: WHITE,
      lineWidth: Math.max(6, Math.round(s * 0.12 * strokeBoost)),
      shadowColor: `rgba(0,0,0,${shadowA})`,
      shadowBlur: 20,
      shadowOffsetY: 7,
      align: "center",
      baseline: "alphabetic",
    });
    ty += s + 10;
  }

  // ── Version pill ─────────────────────────────────────────────────────────
  const version = cleanSpaces(upper(data.version || ""));
  if (version) {
    const pH  = 72;
    ctx.font = `800 44px system-ui, sans-serif`;
    const pW = Math.min(W - 120, ctx.measureText(version).width + 72);
    const px = cx - pW / 2;
    const py = ty + 14;
    rr(ctx, px, py, pW, pH, pH / 2);
    // Gradient fill
    const pg = ctx.createLinearGradient(px, py, px + pW, py + pH);
    pg.addColorStop(0, "rgba(255,0,140,0.90)");
    pg.addColorStop(1, "rgba(200,0,100,0.90)");
    ctx.fillStyle = pg;
    ctx.fill();
    // Highlight top edge
    rr(ctx, px, py, pW, pH, pH / 2);
    ctx.strokeStyle = "rgba(255,255,255,0.20)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = WHITE;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.30)";
    ctx.shadowBlur = 8;
    ctx.fillText(version, cx, py + pH / 2);
    ctx.shadowBlur = 0;
    ty = py + pH + 18;
  } else {
    ty += 18;
  }

  // ── Detail rows in photo area ─────────────────────────────────────────────
  const kmTxt = formatKm(data.km);
  const kmLine = (data.kmHidden || !kmTxt) ? "" : `${kmTxt} KM`;
  const gearbox = cleanSpaces(upper(data.gearbox || ""));
  const year    = String(data.year || "").trim();
  const extra1  = cleanSpaces(data.extra1 || "");
  const extra2  = cleanSpaces(data.extra2 || "");

  const lumD = img ? avgLuminance(ctx, W * 0.12, ty, W * 0.76, 300) : 0.3;
  const dSA  = lumD > 0.60 ? 0.60 : 0.38;
  const dSB  = lumD > 0.60 ? 20  : 12;

  if (kmLine) {
    const s = fitText(ctx, kmLine, 960, 82, 44, "system-ui, sans-serif", "900");
    textStrokeFill(ctx, kmLine, cx, ty, {
      font: `900 ${s}px system-ui, -apple-system, Segoe UI, sans-serif`,
      stroke: `rgba(0,0,0,${dSA})`,
      fill: WHITE,
      lineWidth: Math.max(5, Math.round(s * 0.11 * strokeBoost)),
      shadowColor: `rgba(0,0,0,${dSA})`,
      shadowBlur: dSB,
      shadowOffsetY: 5,
      align: "center",
      baseline: "alphabetic",
    });
    ty += s + 10;
  }

  // Secondary info as smaller pills
  const secondaryItems = [
    gearbox ? `Caja: ${gearbox}` : "",
    year    ? `Año: ${year}`     : "",
    extra1,
    extra2,
  ].filter(Boolean);

  for (const item of secondaryItems) {
    const s = fitText(ctx, item, 900, 48, 26, "system-ui, sans-serif", "700");
    textStrokeFill(ctx, item, cx, ty, {
      font: `700 ${s}px system-ui, -apple-system, Segoe UI, sans-serif`,
      stroke: `rgba(0,0,0,${Math.min(0.85, dSA + 0.1)})`,
      fill: WHITE,
      lineWidth: Math.max(4, Math.round(s * 0.11 * strokeBoost)),
      shadowColor: `rgba(0,0,0,${dSA})`,
      shadowBlur: Math.round(dSB * 0.85),
      shadowOffsetY: 4,
      align: "center",
      baseline: "alphabetic",
    });
    ty += s + 8;
  }

  // ── Footer content ───────────────────────────────────────────────────────
  ctx.save();
  ctx.font = "500 20px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.50)";
  ctx.fillText("A U T O M O T O R E S", cx, footerY + 28);

  ctx.font = "900 56px system-ui, sans-serif";
  ctx.fillStyle = WHITE;
  ctx.shadowColor = "rgba(0,0,0,0.40)";
  ctx.shadowBlur = 10;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Jesús ", cx - 4, footerY + 108);
  ctx.shadowBlur = 0;

  // Measure "Jesús " to offset DIAZ correctly
  ctx.font = "300 56px system-ui, sans-serif";
  const jesusW = ctx.measureText("Jesús ").width;
  ctx.font = "900 56px system-ui, sans-serif";
  ctx.fillStyle = WHITE;
  ctx.textAlign = "right";
  ctx.fillText("Jesús ", cx, footerY + 108);

  ctx.textAlign = "left";
  ctx.fillStyle = PINK;
  ctx.fillText("DIAZ", cx, footerY + 108);

  ctx.font = "600 20px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.60)";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("TU MEJOR ELECCIÓN  ·  2494 587046", cx, footerY + 144);

  ctx.restore();
}

export async function renderPortadaFicha({ img, data, transform = { zoom: 1, panX: 0, panY: 0 } }) {
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  drawPortadaFicha(ctx, img, data, transform);
  const format  = data?.__exportFormat || "jpg";
  const quality = Number(data?.__exportQuality ?? 0.92);
  const mime    = format === "png" ? "image/png" : "image/jpeg";
  const blob    = await new Promise(r => canvas.toBlob(r, mime, mime === "image/jpeg" ? quality : undefined));
  const dataURL = canvas.toDataURL(mime, mime === "image/jpeg" ? quality : undefined);
  return { blob, dataURL };
}
