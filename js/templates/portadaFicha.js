import { drawCoverPanZoom, textStrokeFill, fitText } from "../draw.js";
import { formatKm, upper, cleanSpaces } from "../utils.js";
import { rr, WHITE, BLACK } from "./_shared.js";

const W = 1080;
const H = 1080;

// ── Paleta premium violeta/negro ────────────────────────────────────────────
const PINK        = "#ff008c";
const PINK_DEEP   = "#b5006a";
const PINK_GLOW   = "rgba(255,0,140,0.45)";
const VIOLET      = "#1a0020";   // fondo footer / header
const VIOLET_MID  = "#0d0015";

// ── Helpers ──────────────────────────────────────────────────────────────────

function drawText(ctx, text, x, y, font, color = WHITE, shadow = true) {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  if (shadow) {
    ctx.shadowColor  = "rgba(0,0,0,0.80)";
    ctx.shadowBlur   = 22;
    ctx.shadowOffsetY = 6;
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function pinkAccentLine(ctx, cx, y, lineW = 280, thickness = 3) {
  const lg = ctx.createLinearGradient(cx - lineW / 2, 0, cx + lineW / 2, 0);
  lg.addColorStop(0,   "rgba(255,0,140,0)");
  lg.addColorStop(0.3, PINK);
  lg.addColorStop(0.7, PINK);
  lg.addColorStop(1,   "rgba(255,0,140,0)");
  ctx.fillStyle = lg;
  ctx.fillRect(cx - lineW / 2, y, lineW, thickness);
  // glow
  const gg = ctx.createLinearGradient(0, y + thickness, 0, y + thickness + 18);
  gg.addColorStop(0, "rgba(255,0,140,0.20)");
  gg.addColorStop(1, "rgba(255,0,140,0)");
  ctx.fillStyle = gg;
  ctx.fillRect(cx - lineW / 2 - 20, y + thickness, lineW + 40, 18);
}

// ── main draw ────────────────────────────────────────────────────────────────

export function drawPortadaFicha(ctx, img, data, transform = { zoom:1, panX:0, panY:0 }, logoImg) {

  const HEADER_H = 130;
  const FOOTER_H = 100;
  const footerY  = H - FOOTER_H;
  const photoY   = HEADER_H;
  const photoH   = footerY - HEADER_H;
  const cx       = W / 2;

  // ── 1. Base negro ────────────────────────────────────────────────────────
  ctx.fillStyle = VIOLET_MID;
  ctx.fillRect(0, 0, W, H);

  // ── 2. Foto ──────────────────────────────────────────────────────────────
  if (img) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, photoY, W, photoH); ctx.clip();
    drawCoverPanZoom(ctx, img, 0, photoY, W, photoH, transform);
    ctx.restore();
  }

  // Vignette superior sobre foto
  ctx.save();
  const vtop = ctx.createLinearGradient(0, photoY, 0, photoY + 160);
  vtop.addColorStop(0,   "rgba(0,0,0,0.55)");
  vtop.addColorStop(1,   "rgba(0,0,0,0)");
  ctx.fillStyle = vtop;
  ctx.fillRect(0, photoY, W, 160);
  ctx.restore();

  // Vignette inferior – zona de info
  ctx.save();
  const vbot = ctx.createLinearGradient(0, footerY - 260, 0, footerY);
  vbot.addColorStop(0,   "rgba(0,0,0,0)");
  vbot.addColorStop(0.5, "rgba(0,0,4,0.55)");
  vbot.addColorStop(1,   "rgba(0,0,8,0.85)");
  ctx.fillStyle = vbot;
  ctx.fillRect(0, footerY - 260, W, 260);
  ctx.restore();

  // Acento violeta lateral izquierdo
  const sideGlow = ctx.createLinearGradient(0, photoY, 180, photoY);
  sideGlow.addColorStop(0, "rgba(180,0,100,0.13)");
  sideGlow.addColorStop(1, "rgba(180,0,100,0)");
  ctx.fillStyle = sideGlow;
  ctx.fillRect(0, photoY, 180, photoH);

  // ── 3. Header negro premium ──────────────────────────────────────────────
  ctx.save();
  const hg = ctx.createLinearGradient(0, 0, 0, HEADER_H);
  hg.addColorStop(0, "#000000");
  hg.addColorStop(1, VIOLET);
  ctx.fillStyle = hg;
  ctx.fillRect(0, 0, W, HEADER_H);
  ctx.restore();

  // Línea inferior del header
  pinkAccentLine(ctx, cx, HEADER_H - 3, W, 3);

  // Logo centrado en header
  if (logoImg) {
    const lH = 62;
    const lW = lH * (801 / 253);
    ctx.save();
    ctx.globalAlpha = 0.94;
    ctx.drawImage(logoImg, cx - lW / 2, (HEADER_H - lH) / 2, lW, lH);
    ctx.restore();
  }

  // ── 4. Brand & Model (sobre la foto, zona superior) ─────────────────────
  const brand   = cleanSpaces(upper(data.brand   || ""));
  const model   = cleanSpaces(upper(data.model   || ""));
  const version = cleanSpaces(upper(data.version || ""));
  const kmTxt   = formatKm(data.km);
  const kmLine  = (data.kmHidden || kmTxt === "") ? "0KM" : `${kmTxt} KM`;
  const gearbox = cleanSpaces(data.gearbox || "");
  const year    = String(data.year || "").trim();
  const extra1  = cleanSpaces(data.extra1 || "");
  const extra2  = cleanSpaces(data.extra2 || "");

  // Brand — pequeño, elegante, sobre la foto
  let ty = photoY + 22;

  if (brand) {
    const fs = Math.min(52, fitText(ctx, brand, 860, 52, 22, "system-ui, sans-serif", "300"));
    // letra espaciada, fina, premium
    ctx.save();
    ctx.font = `300 ${fs}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.letterSpacing = "0.18em";
    ctx.shadowColor  = "rgba(0,0,0,0.90)";
    ctx.shadowBlur   = 14;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.fillText(brand, cx, ty + fs * 0.82);
    ctx.restore();
    ty += fs + 10;

    // línea divisora debajo de brand
    pinkAccentLine(ctx, cx, ty, 160, 2);
    ty += 14;
  }

  if (model) {
    const fs = fitText(ctx, model, 980, 148, 52, "system-ui, sans-serif", "800");
    ctx.save();
    ctx.font = `800 ${fs}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.shadowColor  = "rgba(0,0,0,0.92)";
    ctx.shadowBlur   = 28;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = WHITE;
    ctx.fillText(model, cx, ty + fs * 0.84);
    ctx.restore();
    ty += fs + 18;
  }

  // ── 5. Version badge – pill violeta oscuro con borde rosa ────────────────
  if (version) {
    const vFS = Math.min(36, fitText(ctx, version, 680, 36, 18, "system-ui, sans-serif", "700"));
    ctx.font = `700 ${vFS}px system-ui, sans-serif`;
    const tw  = ctx.measureText(version).width;
    const padH = 34, padV = 14;
    const bW  = Math.min(720, tw + padH * 2);
    const bH  = vFS + padV * 2;
    const bX  = cx - bW / 2;
    const br  = bH / 2;  // pill

    ctx.save();
    ctx.shadowColor = PINK_GLOW; ctx.shadowBlur = 20;
    rr(ctx, bX, ty, bW, bH, br);
    const bg = ctx.createLinearGradient(bX, ty, bX + bW, ty + bH);
    bg.addColorStop(0, "#1e0028");
    bg.addColorStop(1, "#2a003a");
    ctx.fillStyle = bg; ctx.fill();
    ctx.restore();

    // borde rosa
    ctx.save();
    rr(ctx, bX, ty, bW, bH, br);
    ctx.strokeStyle = "rgba(255,0,140,0.55)"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();

    // brillo superior
    ctx.save();
    rr(ctx, bX + 2, ty + 2, bW - 4, bH * 0.44, br);
    ctx.fillStyle = "rgba(255,255,255,0.07)"; ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.font = `700 ${vFS}px system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.90)";
    ctx.shadowColor = "rgba(255,0,140,0.40)"; ctx.shadowBlur = 8;
    ctx.fillText(version, cx, ty + bH / 2);
    ctx.restore();

    ty += bH + 20;
  }

  // ── 6. Zona inferior datos (sobre gradiente oscuro) ──────────────────────

  // KM — grande, bold, rosa
  {
    const kmFS = 80;
    ctx.save();
    ctx.font = `900 ${kmFS}px system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.shadowColor  = PINK_GLOW;
    ctx.shadowBlur   = 28;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = WHITE;
    ctx.fillText(kmLine, cx, ty + kmFS * 0.84);
    ctx.restore();
    ty += kmFS + 18;
  }

  // Spec lines
  const specLines = [];
  if (gearbox) specLines.push(`Caja: ${gearbox}`);
  if (year)    specLines.push(`Año: ${year}`);
  if (extra1)  specLines.push(extra1);
  if (extra2)  specLines.push(extra2);

  for (const line of specLines) {
    const lineFS = Math.min(42, fitText(ctx, line, 800, 42, 22, "system-ui, sans-serif", "400"));
    ctx.save();
    ctx.font = `400 ${lineFS}px system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.shadowColor = "rgba(0,0,0,0.70)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
    ctx.fillText(line, cx, ty + lineFS * 0.84);
    ctx.restore();
    ty += lineFS + 13;
  }

  // ── 7. Footer – premium negro/violeta ────────────────────────────────────
  ctx.save();
  const fg = ctx.createLinearGradient(0, footerY, 0, H);
  fg.addColorStop(0, "#08000f");
  fg.addColorStop(1, "#000000");
  ctx.fillStyle = fg;
  ctx.fillRect(0, footerY, W, FOOTER_H);
  ctx.restore();

  // línea superior footer
  pinkAccentLine(ctx, cx, footerY, W, 2);

  // Tres columnas
  const FOOTER_PHONE   = "2494587046";
  const FOOTER_COMPANY = "Jesus Diaz Automotores";
  const colW = W / 3;
  const footerMidY = footerY + FOOTER_H / 2 + 6;

  // dividers
  ctx.save();
  ctx.strokeStyle = "rgba(255,0,140,0.18)";
  ctx.lineWidth = 1;
  [colW, colW * 2].forEach(x => {
    ctx.beginPath(); ctx.moveTo(x, footerY + 20); ctx.lineTo(x, H - 20); ctx.stroke();
  });
  ctx.restore();

  const leftFS = Math.min(26, fitText(ctx, FOOTER_COMPANY, colW - 24, 26, 13, "system-ui, sans-serif", "400"));
  ctx.save();
  ctx.textBaseline = "middle"; ctx.textAlign = "center";
  ctx.font = `300 ${leftFS}px system-ui, sans-serif`;
  ctx.letterSpacing = "0.05em";
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.fillText(FOOTER_COMPANY, colW / 2, footerMidY);
  ctx.fillText(FOOTER_COMPANY, colW * 2 + colW / 2, footerMidY);
  ctx.restore();

  // Teléfono centro – rosa, más grande
  const phoneFS = Math.min(34, fitText(ctx, FOOTER_PHONE, colW - 20, 34, 16, "system-ui, sans-serif", "700"));
  ctx.save();
  ctx.textBaseline = "middle"; ctx.textAlign = "center";
  ctx.font = `700 ${phoneFS}px system-ui, sans-serif`;
  ctx.fillStyle = PINK;
  ctx.shadowColor = PINK_GLOW; ctx.shadowBlur = 12;
  ctx.fillText(FOOTER_PHONE, W / 2, footerMidY);
  ctx.restore();
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
