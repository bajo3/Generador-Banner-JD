import { drawCoverPanZoom, textStrokeFill, fitText } from "../draw.js";
import { formatKm, upper, cleanSpaces } from "../utils.js";
import { rr, WHITE, BLACK } from "./_shared.js";

const W = 1080;
const H = 1080;

const BLUE      = "#1a50c8";
const BLUE_DARK = "#0e3490";
const CYAN      = "#00d4ff";

export function drawPortadaFicha(ctx, img, data, transform = { zoom:1, panX:0, panY:0 }, logoImg) {

  const FOOTER_H = 96;
  const footerY  = H - FOOTER_H;
  const cx       = W / 2;

  // ── 1. Fondo negro base ───────────────────────────────────────────────────
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  // ── 2. Foto full-bleed ────────────────────────────────────────────────────
  if (img) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, footerY); ctx.clip();
    drawCoverPanZoom(ctx, img, 0, 0, W, footerY, transform);
    ctx.restore();
  }

  // ── 3. Tinte negro uniforme — resalta el blanco ───────────────────────────
  ctx.fillStyle = "rgba(0,0,0,0.42)";
  ctx.fillRect(0, 0, W, footerY);

  // ── 4. Datos ──────────────────────────────────────────────────────────────
  const brand   = cleanSpaces(upper(data.brand   || ""));
  const model   = cleanSpaces(upper(data.model   || ""));
  const version = cleanSpaces(upper(data.version || ""));
  const kmTxt   = formatKm(data.km);
  const kmLine  = (data.kmHidden || kmTxt === "") ? "0KM" : `${kmTxt} KM`;
  const gearbox = cleanSpaces(data.gearbox || "");
  const year    = String(data.year || "").trim();
  const extra1  = cleanSpaces(data.extra1 || "");
  const extra2  = cleanSpaces(data.extra2 || "");

  let ty = 32;

  // ── 5. Marca – blanco grueso con stroke cyan ──────────────────────────────
  if (brand) {
    const fs = Math.min(108, fitText(ctx, brand, 960, 108, 40, "system-ui, sans-serif", "900"));
    textStrokeFill(ctx, brand, cx, ty + fs * 0.84, {
      font: `900 ${fs}px system-ui, sans-serif`,
      stroke: CYAN,
      fill: WHITE,
      lineWidth: Math.max(5, Math.round(fs * 0.065)),
      shadowColor: "rgba(0,0,0,0.80)", shadowBlur: 18, shadowOffsetY: 4,
      align: "center", baseline: "alphabetic",
    });
    ty += fs + 4;
  }

  // ── 6. Modelo – blanco grueso con stroke cyan ─────────────────────────────
  if (model) {
    const fs = fitText(ctx, model, 1020, 155, 56, "system-ui, sans-serif", "900");
    textStrokeFill(ctx, model, cx, ty + fs * 0.84, {
      font: `900 ${fs}px system-ui, sans-serif`,
      stroke: CYAN,
      fill: WHITE,
      lineWidth: Math.max(6, Math.round(fs * 0.065)),
      shadowColor: "rgba(0,0,0,0.80)", shadowBlur: 24, shadowOffsetY: 5,
      align: "center", baseline: "alphabetic",
    });
    ty += fs + 22;
  }

  // ── 7. Badge versión – texto blanco, fondo azul sólido ───────────────────
  if (version) {
    const vFS = Math.min(40, fitText(ctx, version, 740, 40, 18, "system-ui, sans-serif", "800"));
    ctx.font = `800 ${vFS}px system-ui, sans-serif`;
    const tw   = ctx.measureText(version).width;
    const padH = 40, padV = 16;
    const bW   = Math.min(760, tw + padH * 2);
    const bH   = vFS + padV * 2;
    const bX   = cx - bW / 2;
    const br   = 6;

    ctx.save();
    rr(ctx, bX, ty, bW, bH, br);
    const bg = ctx.createLinearGradient(bX, ty, bX + bW, ty + bH);
    bg.addColorStop(0, "#2060e0");
    bg.addColorStop(1, BLUE_DARK);
    ctx.fillStyle = bg;
    ctx.shadowColor = "rgba(0,0,0,0.50)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
    ctx.fill();
    ctx.restore();

    ctx.save();
    rr(ctx, bX + 2, ty + 2, bW - 4, bH * 0.42, br);
    ctx.fillStyle = "rgba(255,255,255,0.10)"; ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.font = `800 ${vFS}px system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = WHITE;
    ctx.shadowColor = "rgba(0,0,0,0.50)"; ctx.shadowBlur = 6;
    ctx.fillText(version, cx, ty + bH / 2);
    ctx.restore();

    ty += bH + 22;
  }

  // ── Helper: dibuja línea de texto blanco ──────────────────────────────────
  function specLine(text, fontSize, weight = "600") {
    const fs = Math.min(fontSize, fitText(ctx, text, 860, fontSize, 20, "system-ui, sans-serif", weight));
    ctx.save();
    ctx.font = `${weight} ${fs}px system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = WHITE;
    ctx.shadowColor = "rgba(0,0,0,0.80)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 3;
    ctx.fillText(text, cx, ty + fs * 0.84);
    ctx.restore();
    return fs;
  }

  // ── 8. KM – blanco, el más grande ────────────────────────────────────────
  {
    const fs = specLine(kmLine, 84, "900");
    ty += fs + 16;
  }

  // ── 9. Specs – todos blancos ──────────────────────────────────────────────
  const specLines = [];
  if (gearbox) specLines.push(`Caja: ${gearbox}`);
  if (year)    specLines.push(`Año: ${year}`);
  if (extra1)  specLines.push(extra1);
  if (extra2)  specLines.push(extra2);

  for (const line of specLines) {
    const fs = specLine(line, 46, "600");
    ty += fs + 14;
  }

  // ── 10. Footer – fondo azul, texto blanco ─────────────────────────────────
  ctx.save();
  const fg = ctx.createLinearGradient(0, footerY, 0, H);
  fg.addColorStop(0, BLUE);
  fg.addColorStop(1, BLUE_DARK);
  ctx.fillStyle = fg;
  ctx.fillRect(0, footerY, W, FOOTER_H);
  ctx.restore();

  const colW  = W / 3;
  const midY  = footerY + FOOTER_H / 2 + 5;
  const PHONE   = "2494587046";
  const COMPANY = "Jesus Diaz Automotores";

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1.5;
  [colW, colW * 2].forEach(x => {
    ctx.beginPath(); ctx.moveTo(x, footerY + 16); ctx.lineTo(x, H - 16); ctx.stroke();
  });
  ctx.restore();

  const leftFS = Math.min(27, fitText(ctx, COMPANY, colW - 24, 27, 13, "system-ui, sans-serif", "400"));
  ctx.save();
  ctx.textBaseline = "middle"; ctx.textAlign = "center";
  ctx.font = `400 ${leftFS}px system-ui, sans-serif`;
  ctx.fillStyle = WHITE;
  ctx.fillText(COMPANY, colW / 2, midY);
  ctx.fillText(COMPANY, colW * 2 + colW / 2, midY);
  ctx.restore();

  const phoneFS = Math.min(34, fitText(ctx, PHONE, colW - 20, 34, 16, "system-ui, sans-serif", "800"));
  ctx.save();
  ctx.textBaseline = "middle"; ctx.textAlign = "center";
  ctx.font = `800 ${phoneFS}px system-ui, sans-serif`;
  ctx.fillStyle = WHITE;
  ctx.fillText(PHONE, W / 2, midY);
  ctx.restore();

  // ── 11. Logo arriba a la derecha ──────────────────────────────────────────
  if (logoImg) {
    const lH = 56;
    const lW = lH * (801 / 253);
    ctx.save();
    ctx.globalAlpha = 0.88;
    ctx.drawImage(logoImg, W - lW - 18, 16, lW, lH);
    ctx.restore();
  }
}

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
