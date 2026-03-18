import { drawCoverPanZoom, textStrokeFill, fitText } from "../draw.js";
import { formatKm, upper, cleanSpaces } from "../utils.js";
import { rr, WHITE, BLACK } from "./_shared.js";

const W = 1080;
const H = 1080;

// ── Brand colors ────────────────────────────────────────────────────────────
const BLUE        = "#1a3fa0";   // footer & badge fill
const BLUE_DARK   = "#0e2870";   // footer gradient end
const BLUE_LIGHT  = "#2563eb";   // badge highlight
const CYAN_STROKE = "#00c8ff";   // outline on brand/model text

// ── main draw ────────────────────────────────────────────────────────────────

export function drawPortadaFicha(ctx, img, data, transform = { zoom:1, panX:0, panY:0 }, logoImg) {

  const FOOTER_H = 96;
  const footerY  = H - FOOTER_H;
  const cx       = W / 2;

  // ── 1. Full-bleed photo ──────────────────────────────────────────────────
  ctx.fillStyle = "#e8eaf0";
  ctx.fillRect(0, 0, W, H);

  if (img) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, footerY); ctx.clip();
    drawCoverPanZoom(ctx, img, 0, 0, W, footerY, transform);
    ctx.restore();
  }

  // ── 2. Top vignette (dark) – makes brand/model text legible ─────────────
  ctx.save();
  const vtop = ctx.createLinearGradient(0, 0, 0, 320);
  vtop.addColorStop(0,   "rgba(0,0,0,0.68)");
  vtop.addColorStop(0.7, "rgba(0,0,0,0.30)");
  vtop.addColorStop(1,   "rgba(0,0,0,0)");
  ctx.fillStyle = vtop;
  ctx.fillRect(0, 0, W, 320);
  ctx.restore();

  // ── 3. Lower info-zone white overlay ────────────────────────────────────
  ctx.save();
  const infoY = 420;
  const vbot  = ctx.createLinearGradient(0, infoY, 0, footerY);
  vbot.addColorStop(0,    "rgba(255,255,255,0)");
  vbot.addColorStop(0.18, "rgba(255,255,255,0.52)");
  vbot.addColorStop(0.55, "rgba(255,255,255,0.68)");
  vbot.addColorStop(1,    "rgba(255,255,255,0.78)");
  ctx.fillStyle = vbot;
  ctx.fillRect(0, infoY, W, footerY - infoY);
  ctx.restore();

  // ── Extract & normalize data ─────────────────────────────────────────────
  const brand   = cleanSpaces(upper(data.brand   || ""));
  const model   = cleanSpaces(upper(data.model   || ""));
  const version = cleanSpaces(upper(data.version || ""));
  const kmTxt   = formatKm(data.km);
  const kmLine  = (data.kmHidden || kmTxt === "") ? "0KM" : `${kmTxt} KM`;
  const gearbox = cleanSpaces(data.gearbox || "");
  const year    = String(data.year || "").trim();
  const extra1  = cleanSpaces(data.extra1 || "");
  const extra2  = cleanSpaces(data.extra2 || "");

  let ty = 48;

  // ── 4. Brand text ────────────────────────────────────────────────────────
  if (brand) {
    const fs = Math.min(92, fitText(ctx, brand, 900, 92, 36, "system-ui, sans-serif", "900"));
    textStrokeFill(ctx, brand, cx, ty + fs * 0.84, {
      font: `900 ${fs}px system-ui, sans-serif`,
      stroke: CYAN_STROKE,
      fill: WHITE,
      lineWidth: Math.max(6, Math.round(fs * 0.11)),
      shadowColor: "rgba(0,0,0,0.55)", shadowBlur: 18, shadowOffsetY: 5,
      align: "center", baseline: "alphabetic",
    });
    ty += fs + 4;
  }

  // ── 5. Model text ────────────────────────────────────────────────────────
  if (model) {
    const fs = fitText(ctx, model, 1020, 148, 52, "system-ui, sans-serif", "900");
    textStrokeFill(ctx, model, cx, ty + fs * 0.84, {
      font: `900 ${fs}px system-ui, sans-serif`,
      stroke: CYAN_STROKE,
      fill: WHITE,
      lineWidth: Math.max(8, Math.round(fs * 0.105)),
      shadowColor: "rgba(0,0,0,0.55)", shadowBlur: 28, shadowOffsetY: 7,
      align: "center", baseline: "alphabetic",
    });
    ty += fs + 22;
  }

  // ── 6. Version badge – solid blue rectangle ──────────────────────────────
  if (version) {
    const vFS = Math.min(40, fitText(ctx, version, 700, 40, 20, "system-ui, sans-serif", "800"));
    const padH = 38, padV = 16;
    ctx.font = `800 ${vFS}px system-ui, sans-serif`;
    const tw = ctx.measureText(version).width;
    const bW = Math.min(740, tw + padH * 2);
    const bH = vFS + padV * 2;
    const bX = cx - bW / 2;
    const br = 6;

    // badge fill
    const bg = ctx.createLinearGradient(bX, ty, bX + bW, ty + bH);
    bg.addColorStop(0, BLUE_LIGHT);
    bg.addColorStop(1, BLUE);
    ctx.save();
    rr(ctx, bX, ty, bW, bH, br);
    ctx.fillStyle = bg;
    ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
    ctx.fill();
    ctx.restore();

    // top-shine
    ctx.save();
    rr(ctx, bX + 2, ty + 2, bW - 4, bH * 0.4, br);
    ctx.fillStyle = "rgba(255,255,255,0.14)"; ctx.fill();
    ctx.restore();

    // text
    ctx.save();
    ctx.font = `800 ${vFS}px system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = WHITE;
    ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 6;
    ctx.fillText(version, cx, ty + bH / 2);
    ctx.restore();

    ty += bH + 22;
  }

  // ── 7. KM text ───────────────────────────────────────────────────────────
  {
    const kmFS = 78;
    ctx.save();
    ctx.font = `900 ${kmFS}px system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#111111";
    ctx.shadowColor = "rgba(255,255,255,0.5)"; ctx.shadowBlur = 8;
    ctx.fillText(kmLine, cx, ty + kmFS * 0.84);
    ctx.restore();
    ty += kmFS + 18;
  }

  // ── 8. Spec lines (Caja, Año, extras) ───────────────────────────────────
  const specLines = [];
  if (gearbox) specLines.push(`Caja: ${gearbox}`);
  if (year)    specLines.push(`Año: ${year}`);
  if (extra1)  specLines.push(extra1);
  if (extra2)  specLines.push(extra2);

  ctx.save();
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  for (const line of specLines) {
    const lineFS = Math.min(44, fitText(ctx, line, 800, 44, 24, "system-ui, sans-serif", "600"));
    ctx.font = `600 ${lineFS}px system-ui, sans-serif`;
    ctx.fillStyle = "#1a1a1a";
    ctx.shadowColor = "rgba(255,255,255,0.5)"; ctx.shadowBlur = 6;
    ctx.fillText(line, cx, ty + lineFS * 0.84);
    ty += lineFS + 14;
  }
  ctx.restore();

  // ── 9. Footer – solid blue bar ────────────────────────────────────────────
  ctx.save();
  const fg = ctx.createLinearGradient(0, footerY, 0, H);
  fg.addColorStop(0, BLUE);
  fg.addColorStop(1, BLUE_DARK);
  ctx.fillStyle = fg;
  ctx.fillRect(0, footerY, W, FOOTER_H);
  ctx.restore();

  // Footer content
  const FOOTER_PHONE   = "2494587046";
  const FOOTER_COMPANY = "Jesus Diaz Automotores";
  const colW = W / 3;
  const footerMidY = footerY + FOOTER_H / 2;

  // Dividers
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.30)";
  ctx.lineWidth = 1.5;
  [colW, colW * 2].forEach(x => {
    ctx.beginPath(); ctx.moveTo(x, footerY + 16); ctx.lineTo(x, H - 16); ctx.stroke();
  });
  ctx.restore();

  // Left – company name
  ctx.save();
  ctx.textBaseline = "middle"; ctx.textAlign = "center"; ctx.fillStyle = WHITE;
  const leftFS = Math.min(28, fitText(ctx, FOOTER_COMPANY, colW - 28, 28, 14, "system-ui, sans-serif", "700"));
  ctx.font = `700 ${leftFS}px system-ui, sans-serif`;
  ctx.fillText(FOOTER_COMPANY, colW / 2, footerMidY);
  ctx.restore();

  // Center – phone
  ctx.save();
  ctx.textBaseline = "middle"; ctx.textAlign = "center"; ctx.fillStyle = WHITE;
  const phoneFS = Math.min(34, fitText(ctx, FOOTER_PHONE, colW - 24, 34, 16, "system-ui, sans-serif", "800"));
  ctx.font = `800 ${phoneFS}px system-ui, sans-serif`;
  ctx.fillText(FOOTER_PHONE, W / 2, footerMidY);
  ctx.restore();

  // Right – company name
  ctx.save();
  ctx.textBaseline = "middle"; ctx.textAlign = "center"; ctx.fillStyle = WHITE;
  ctx.font = `700 ${leftFS}px system-ui, sans-serif`;
  ctx.fillText(FOOTER_COMPANY, colW * 2 + colW / 2, footerMidY);
  ctx.restore();

  // ── 10. Logo (top-right) ─────────────────────────────────────────────────
  if (logoImg) {
    const lH = 58;
    const lW = lH * (801 / 253);
    ctx.save();
    ctx.globalAlpha = 0.90;
    ctx.drawImage(logoImg, W - lW - 20, 20, lW, lH);
    ctx.restore();
  }
}

// ── render (public API) ───────────────────────────────────────────────────────

export async function renderPortadaFicha({ img, data, transform = { zoom:1, panX:0, panY:0 } }) {
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const logoImg = await loadLogoOnce();
  drawPortadaFicha(ctx, img, data, transform, logoImg);
  const format  = data?.__exportFormat || "jpg";
  const quality = Number(data?.__exportQuality ?? 0.92);
  const mime    = format === "png" ? "image/png" : "image/jpeg";
  const blob    = await new Promise(r => canvas.toBlob(r, mime, mime === "image/jpeg" ? quality : undefined));
  const dataURL = canvas.toDataURL(mime, mime === "image/jpeg" ? quality : undefined);
  return { blob, dataURL };
}

let _logoCache = null;
export async function loadLogoOnce() {
  if (_logoCache) return _logoCache;
  return new Promise((res) => {
    const img = new Image();
    img.onload  = () => { _logoCache = img; res(img); };
    img.onerror = () => res(null);
    img.src = "./logo.png";
  });
}
