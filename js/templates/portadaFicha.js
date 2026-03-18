import { drawCoverPanZoom, textStrokeFill, fitText } from "../draw.js";
import { formatKm, upper, cleanSpaces } from "../utils.js";
import { rr, WHITE, BLACK } from "./_shared.js";

const W = 1080;
const H = 1080;

const PINK       = "#ff008c";
const PINK_DARK  = "#b5006a";
const PINK_GLOW  = "rgba(255,0,140,0.50)";
const VIOLET     = "#1a0028";
const VIOLET_MID = "#0d0018";

// ── main draw ─────────────────────────────────────────────────────────────────

export function drawPortadaFicha(ctx, img, data, transform = { zoom:1, panX:0, panY:0 }, logoImg) {

  const FOOTER_H = 96;
  const footerY  = H - FOOTER_H;
  const cx       = W / 2;

  // ── 1. Foto full-bleed ───────────────────────────────────────────────────
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, W, H);

  if (img) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, footerY); ctx.clip();
    drawCoverPanZoom(ctx, img, 0, 0, W, footerY, transform);
    ctx.restore();
  }

  // ── 2. Overlay blanco en zona inferior (legibilidad specs) ───────────────
  ctx.save();
  const infoY = 400;
  const vbot  = ctx.createLinearGradient(0, infoY, 0, footerY);
  vbot.addColorStop(0,    "rgba(255,255,255,0)");
  vbot.addColorStop(0.22, "rgba(255,255,255,0.50)");
  vbot.addColorStop(0.60, "rgba(255,255,255,0.68)");
  vbot.addColorStop(1,    "rgba(255,255,255,0.78)");
  ctx.fillStyle = vbot;
  ctx.fillRect(0, infoY, W, footerY - infoY);
  ctx.restore();

  // Vignette oscura superior para que el texto de marca se lea bien
  ctx.save();
  const vtop = ctx.createLinearGradient(0, 0, 0, 280);
  vtop.addColorStop(0,   "rgba(0,0,0,0.55)");
  vtop.addColorStop(0.8, "rgba(0,0,0,0.10)");
  vtop.addColorStop(1,   "rgba(0,0,0,0)");
  ctx.fillStyle = vtop;
  ctx.fillRect(0, 0, W, 280);
  ctx.restore();

  // ── 3. Extraer datos ─────────────────────────────────────────────────────
  const brand   = cleanSpaces(upper(data.brand   || ""));
  const model   = cleanSpaces(upper(data.model   || ""));
  const version = cleanSpaces(upper(data.version || ""));
  const kmTxt   = formatKm(data.km);
  const kmLine  = (data.kmHidden || kmTxt === "") ? "0KM" : `${kmTxt} KM`;
  const gearbox = cleanSpaces(upper(data.gearbox || ""));
  const year    = String(data.year || "").trim();
  const extra1  = cleanSpaces(data.extra1 || "");
  const extra2  = cleanSpaces(data.extra2 || "");

  let ty = 38;

  // ── 4. Brand – blanco con stroke fino rosa/cyan ──────────────────────────
  if (brand) {
    const fs = Math.min(100, fitText(ctx, brand, 920, 100, 38, "system-ui, sans-serif", "900"));
    textStrokeFill(ctx, brand, cx, ty + fs * 0.84, {
      font: `900 ${fs}px system-ui, sans-serif`,
      stroke: "#00d4ff",
      fill: WHITE,
      lineWidth: Math.max(5, Math.round(fs * 0.075)),
      shadowColor: "rgba(0,0,0,0.70)", shadowBlur: 20, shadowOffsetY: 5,
      align: "center", baseline: "alphabetic",
    });
    ty += fs + 2;
  }

  // ── 5. Model – mismo estilo, más grande ──────────────────────────────────
  if (model) {
    const fs = fitText(ctx, model, 1020, 152, 54, "system-ui, sans-serif", "900");
    textStrokeFill(ctx, model, cx, ty + fs * 0.84, {
      font: `900 ${fs}px system-ui, sans-serif`,
      stroke: "#00d4ff",
      fill: WHITE,
      lineWidth: Math.max(6, Math.round(fs * 0.075)),
      shadowColor: "rgba(0,0,0,0.70)", shadowBlur: 26, shadowOffsetY: 6,
      align: "center", baseline: "alphabetic",
    });
    ty += fs + 22;
  }

  // ── 6. Badge versión – violeta sólido con borde rosa ────────────────────
  if (version) {
    const vFS = Math.min(38, fitText(ctx, version, 740, 38, 18, "system-ui, sans-serif", "800"));
    ctx.font = `800 ${vFS}px system-ui, sans-serif`;
    const tw   = ctx.measureText(version).width;
    const padH = 38, padV = 15;
    const bW   = Math.min(760, tw + padH * 2);
    const bH   = vFS + padV * 2;
    const bX   = cx - bW / 2;
    const br   = 7;

    // fondo violeta sólido
    ctx.save();
    rr(ctx, bX, ty, bW, bH, br);
    const bg = ctx.createLinearGradient(bX, ty, bX + bW, ty + bH);
    bg.addColorStop(0, "#28003c");
    bg.addColorStop(1, VIOLET);
    ctx.fillStyle = bg;
    ctx.shadowColor = PINK_GLOW; ctx.shadowBlur = 16; ctx.shadowOffsetY = 3;
    ctx.fill();
    ctx.restore();

    // borde rosa
    ctx.save();
    rr(ctx, bX, ty, bW, bH, br);
    ctx.strokeStyle = "rgba(255,0,140,0.70)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();

    // brillo top
    ctx.save();
    rr(ctx, bX + 2, ty + 2, bW - 4, bH * 0.42, br);
    ctx.fillStyle = "rgba(255,255,255,0.09)"; ctx.fill();
    ctx.restore();

    // texto blanco
    ctx.save();
    ctx.font = `800 ${vFS}px system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = WHITE;
    ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 6;
    ctx.fillText(version, cx, ty + bH / 2);
    ctx.restore();

    ty += bH + 20;
  }

  // ── 7. KM – grande y bold ────────────────────────────────────────────────
  {
    const kmFS = 80;
    ctx.save();
    ctx.font = `900 ${kmFS}px system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#111111";
    ctx.shadowColor = "rgba(255,255,255,0.6)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 0;
    ctx.fillText(kmLine, cx, ty + kmFS * 0.84);
    ctx.restore();
    ty += kmFS + 16;
  }

  // ── 8. Spec lines – texto simple, legible, sobre el overlay blanco ───────
  const specLines = [];
  if (gearbox) specLines.push(`Caja: ${gearbox}`);
  if (year)    specLines.push(`Año: ${year}`);
  if (extra1)  specLines.push(extra1);
  if (extra2)  specLines.push(extra2);

  ctx.save();
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  for (const line of specLines) {
    const lineFS = Math.min(46, fitText(ctx, line, 820, 46, 24, "system-ui, sans-serif", "600"));
    ctx.font = `600 ${lineFS}px system-ui, sans-serif`;
    ctx.fillStyle = "#111111";
    ctx.shadowColor = "rgba(255,255,255,0.55)"; ctx.shadowBlur = 5; ctx.shadowOffsetY = 1;
    ctx.fillText(line, cx, ty + lineFS * 0.84);
    ty += lineFS + 14;
  }
  ctx.restore();

  // ── 9. Footer violeta/negro sólido ───────────────────────────────────────
  ctx.save();
  const fg = ctx.createLinearGradient(0, footerY, 0, H);
  fg.addColorStop(0, "#1c0030");
  fg.addColorStop(1, "#0a0012");
  ctx.fillStyle = fg;
  ctx.fillRect(0, footerY, W, FOOTER_H);

  // línea rosa superior footer
  const fl = ctx.createLinearGradient(0, 0, W, 0);
  fl.addColorStop(0,    "rgba(255,0,140,0.20)");
  fl.addColorStop(0.15, PINK);
  fl.addColorStop(0.85, PINK);
  fl.addColorStop(1,    "rgba(255,0,140,0.20)");
  ctx.fillStyle = fl;
  ctx.fillRect(0, footerY, W, 3);
  ctx.restore();

  // Contenido footer – tres columnas
  const PHONE   = "2494587046";
  const COMPANY = "Jesus Diaz Automotores";
  const colW    = W / 3;
  const midY    = footerY + FOOTER_H / 2 + 5;

  // divisores
  ctx.save();
  ctx.strokeStyle = "rgba(255,0,140,0.25)"; ctx.lineWidth = 1.2;
  [colW, colW * 2].forEach(x => {
    ctx.beginPath(); ctx.moveTo(x, footerY + 18); ctx.lineTo(x, H - 18); ctx.stroke();
  });
  ctx.restore();

  // empresa izq y der
  const leftFS = Math.min(27, fitText(ctx, COMPANY, colW - 24, 27, 13, "system-ui, sans-serif", "400"));
  ctx.save();
  ctx.textBaseline = "middle"; ctx.textAlign = "center";
  ctx.font = `400 ${leftFS}px system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.80)";
  ctx.fillText(COMPANY, colW / 2, midY);
  ctx.fillText(COMPANY, colW * 2 + colW / 2, midY);
  ctx.restore();

  // teléfono centro – rosa
  const phoneFS = Math.min(34, fitText(ctx, PHONE, colW - 20, 34, 16, "system-ui, sans-serif", "800"));
  ctx.save();
  ctx.textBaseline = "middle"; ctx.textAlign = "center";
  ctx.font = `800 ${phoneFS}px system-ui, sans-serif`;
  ctx.fillStyle = PINK;
  ctx.shadowColor = PINK_GLOW; ctx.shadowBlur = 14;
  ctx.fillText(PHONE, W / 2, midY);
  ctx.restore();

  // ── 10. Logo top-right sobre la foto ────────────────────────────────────
  if (logoImg) {
    const lH = 56;
    const lW = lH * (801 / 253);
    ctx.save();
    ctx.globalAlpha = 0.88;
    ctx.drawImage(logoImg, W - lW - 18, 16, lW, lH);
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
