/**
 * Historia V2 — Story 1080×1920
 */

import { drawCoverPanZoom, fitText } from "../draw.js";
import { cleanSpaces, upper } from "../utils.js";

const W = 1080;
const H = 1920;

const PINK     = "#ff008c";
const WHITE    = "#ffffff";
const WHITE70  = "rgba(255,255,255,0.70)";
const WHITE55  = "rgba(255,255,255,0.55)";
const PINK_DIM = "rgba(255,0,140,0.30)";

// ── Format numbers with dots as thousands separator ───────────────────────────
function formatNum(raw) {
  if (!raw) return "";
  const s = String(raw).trim().replace(/\./g, "").replace(/,/g, "");
  const num = parseFloat(s.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return raw.trim();
  const prefix = s.match(/^[^0-9]*/)?.[0] || "";
  const suffix = s.match(/[^0-9]*$/)?.[0] || "";
  const formatted = Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (prefix + formatted + suffix).trim();
}

function formatKmV2(raw) {
  if (!raw) return "";
  const num = parseInt(String(raw).replace(/\D/g, ""), 10);
  if (isNaN(num)) return raw.toString().trim();
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatPrice(raw) {
  if (!raw) return "";
  const s = String(raw).trim();
  const hasDollar = s.includes("$");
  const hasUSD    = /usd/i.test(s);
  const num = parseInt(s.replace(/[^0-9]/g, ""), 10);
  if (isNaN(num)) return s;
  const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (hasUSD)    return `USD ${formatted}`;
  if (hasDollar) return `$${formatted}`;
  return formatted;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function rr(ctx, x, y, w, h, r) {
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

function pinkBar(ctx, y, h) {
  const lg = ctx.createLinearGradient(0, 0, W, 0);
  lg.addColorStop(0,    "rgba(255,0,140,0.40)");
  lg.addColorStop(0.12, PINK);
  lg.addColorStop(0.88, PINK);
  lg.addColorStop(1,    "rgba(255,0,140,0.40)");
  ctx.fillStyle = lg;
  ctx.fillRect(0, y, W, h);
  const gg = ctx.createLinearGradient(0, y + h, 0, y + h + 26);
  gg.addColorStop(0, "rgba(255,0,140,0.18)");
  gg.addColorStop(1, "rgba(255,0,140,0)");
  ctx.fillStyle = gg;
  ctx.fillRect(0, y + h, W, 26);
}

// ── 1. Photo ──────────────────────────────────────────────────────────────────

function drawPhoto(ctx, img, transform) {
  ctx.fillStyle = "#06060f";
  ctx.fillRect(0, 0, W, H);
  if (!img) {
    ctx.font = "700 36px system-ui";
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SIN FOTO", W / 2, H * 0.38);
    return;
  }
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  drawCoverPanZoom(ctx, img, 0, 0, W, H, transform);
  ctx.restore();
}

// ── 2. Gradient overlays ──────────────────────────────────────────────────────

function drawOverlays(ctx) {
  const top = ctx.createLinearGradient(0, 0, 0, 360);
  top.addColorStop(0,    "rgba(10,10,10,1)");
  top.addColorStop(0.55, "rgba(10,10,10,0.75)");
  top.addColorStop(1,    "rgba(10,10,10,0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, 360);

  const bot = ctx.createLinearGradient(0, H - 900, 0, H);
  bot.addColorStop(0,    "rgba(10,10,10,0)");
  bot.addColorStop(0.18, "rgba(10,10,10,0.80)");
  bot.addColorStop(0.40, "rgba(10,10,10,0.97)");
  bot.addColorStop(1,    "rgba(10,10,10,1)");
  ctx.fillStyle = bot;
  ctx.fillRect(0, H - 900, W, 900);
}

// ── 3. Header ─────────────────────────────────────────────────────────────────

function drawHeader(ctx) {
  const cx = W / 2;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.75)";
  ctx.shadowBlur  = 14;

  ctx.font = "300 60px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = WHITE;
  ctx.fillText("Jesús", cx - 4, 118);

  ctx.font = "900 72px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = PINK;
  ctx.fillText("DIAZ", cx + 4, 118);

  ctx.shadowBlur = 0;
  ctx.font = "900 72px system-ui, sans-serif";
  const diazW = ctx.measureText("DIAZ").width;
  ctx.fillStyle = PINK;
  ctx.fillRect(cx + 4, 126, diazW, 4);

  ctx.font = "600 22px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 8;
  ctx.fillText("A U T O M O T O R E S", cx, 168);

  ctx.font = "700 18px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,0,140,0.80)";
  ctx.shadowBlur = 0;
  ctx.fillText("· TU MEJOR ELECCIÓN ·", cx, 196);
  ctx.restore();

  pinkBar(ctx, 214, 5);
}

// ── 4. Info panel ─────────────────────────────────────────────────────────────

function drawInfoPanel(ctx, data) {
  const PAD   = 70;
  const MAX_W = W - PAD * 2;

  let y = H - 840;

  // ── Brand — brighter, with glow ───────────────────────────────────────────
  const brand = upper(cleanSpaces(data.brand || ""));
  if (brand) {
    ctx.save();
    ctx.font = "400 30px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#ff4db8";            // más brillante que el PINK base
    ctx.shadowColor = "rgba(255,0,140,0.55)";
    ctx.shadowBlur = 18;
    ctx.letterSpacing = "0.35em";
    ctx.fillText(brand, PAD, y);
    ctx.restore();
    y += 46;
  }

  // ── Model ─────────────────────────────────────────────────────────────────
  const model = upper(cleanSpaces(data.model || ""));
  if (model) {
    const tmp = document.createElement("canvas").getContext("2d");
    const fs  = fitText(tmp, model, MAX_W, 175, 60, "system-ui, sans-serif", "900");
    ctx.save();
    ctx.font = `900 ${fs}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = WHITE;
    ctx.shadowColor = "rgba(255,0,140,0.18)";
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 6;
    ctx.fillText(model, PAD, y + fs * 0.82);
    ctx.restore();
    y += fs + 12;
  }

  // ── Version ───────────────────────────────────────────────────────────────
  const version = upper(cleanSpaces(data.version || ""));
  if (version) {
    const tmp2 = document.createElement("canvas").getContext("2d");
    const vfs  = fitText(tmp2, version, MAX_W, 34, 18, "system-ui, sans-serif", "300");
    ctx.save();
    ctx.font = `300 ${vfs}px system-ui, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = WHITE55;
    ctx.letterSpacing = "0.12em";
    ctx.fillText(version, PAD, y);
    ctx.restore();
    y += vfs + 28;
  } else {
    y += 16;
  }

  // ── Divider ───────────────────────────────────────────────────────────────
  ctx.fillStyle = PINK;
  ctx.fillRect(PAD, y, 80, 3);
  y += 38;

  // ── Specs row ─────────────────────────────────────────────────────────────
  const year    = String(data.year || "").trim();
  const rawKm   = !data.kmHidden ? String(data.km || "").trim() : "";
  const kmLine  = rawKm ? `${formatKmV2(rawKm)} km` : "";
  const motor   = cleanSpaces(String(data.motorTraction || data.engine || "").trim());
  const gbRaw   = cleanSpaces(String(data.gearbox || "").trim());
  const gearbox = gbRaw ? gbRaw.charAt(0).toUpperCase() + gbRaw.slice(1).toLowerCase() : "";

  const specs = [
    year    ? { label: "AÑO",        value: year    } : null,
    kmLine  ? { label: "KILÓMETROS", value: kmLine  } : null,
    motor   ? { label: "MOTOR",      value: motor   } : null,
    gearbox ? { label: "CAJA",       value: gearbox } : null,
  ].filter(Boolean);

  if (specs.length > 0) {
    const cols  = specs.length;
    const colW  = Math.floor(MAX_W / cols);
    const ROW_H = 80;

    specs.forEach((s, i) => {
      const x     = PAD + i * colW;
      const textX = i === 0 ? x : x + 18;

      // Separator
      if (i > 0) {
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(x, y + 4, 1.5, ROW_H - 10);
      }

      // Label — brighter
      ctx.save();
      ctx.font = "300 15px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(255,255,255,0.60)";   // was 0.38
      ctx.letterSpacing = "0.22em";
      ctx.fillText(s.label, textX, y + 6);
      ctx.restore();

      // Value — brighter with subtle glow
      const tmp3 = document.createElement("canvas").getContext("2d");
      const vfs  = fitText(tmp3, s.value, colW - (i === 0 ? 8 : 28), 32, 18, "system-ui, sans-serif", "700");
      ctx.save();
      ctx.font = `700 ${vfs}px system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = WHITE;
      ctx.shadowColor = "rgba(255,255,255,0.25)";
      ctx.shadowBlur = 8;
      ctx.fillText(s.value, textX, y + ROW_H - 10);
      ctx.restore();
    });

    y += ROW_H + 30;
  }

  // ── Price block ───────────────────────────────────────────────────────────
  const precio  = formatPrice(String(data.price || "").trim());
  const credito = formatPrice(String(data.priceCredit || "").trim());

  if (precio) {
    const BLOCK_H = credito ? 192 : 160;

    // Block bg
    rr(ctx, PAD, y, MAX_W, BLOCK_H, 12);
    const pbg = ctx.createLinearGradient(PAD, y, PAD, y + BLOCK_H);
    pbg.addColorStop(0, "rgba(255,0,140,0.12)");
    pbg.addColorStop(1, "rgba(255,0,140,0.04)");
    ctx.fillStyle = pbg;
    ctx.fill();
    ctx.strokeStyle = PINK_DIM;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // "PRECIO CONTADO" label — brighter
    ctx.save();
    ctx.font = "300 15px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(255,255,255,0.60)";   // was 0.38
    ctx.letterSpacing = "0.30em";
    ctx.fillText("PRECIO CONTADO", PAD + 24, y + 18);
    ctx.restore();

    // Price number — full width, no button
    const tmp4 = document.createElement("canvas").getContext("2d");
    const pfs  = fitText(tmp4, precio, MAX_W - 48, 110, 50, "system-ui, sans-serif", "900");
    ctx.save();
    ctx.font = `900 ${pfs}px system-ui, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = WHITE;
    ctx.shadowColor = "rgba(255,255,255,0.20)";
    ctx.shadowBlur = 16;
    ctx.fillText(precio, PAD + 24, y + 52 + pfs * 0.72);
    ctx.restore();

    // "Anticipo de:" credit line
    if (credito) {
      ctx.save();
      ctx.font = "300 26px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = WHITE70;
      ctx.fillText(`Anticipo de: ${credito}`, PAD + 24, y + BLOCK_H - 16);
      ctx.restore();
    }

    y += BLOCK_H + 28;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const FOOTER_Y = H - 96;
  const MID_Y    = FOOTER_Y + 16;

  // Separator
  const sg = ctx.createLinearGradient(0, 0, W, 0);
  sg.addColorStop(0,    "transparent");
  sg.addColorStop(0.15, "rgba(255,255,255,0.10)");
  sg.addColorStop(0.85, "rgba(255,255,255,0.10)");
  sg.addColorStop(1,    "transparent");
  ctx.fillStyle = sg;
  ctx.fillRect(PAD, FOOTER_Y - 22, MAX_W, 1);

  const ICO = 40;

  // WA
  ctx.save();
  ctx.beginPath();
  ctx.arc(PAD + ICO / 2, MID_Y, ICO / 2, 0, Math.PI * 2);
  ctx.fillStyle = "#25D366";
  ctx.fill();
  ctx.font = "900 15px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = WHITE;
  ctx.fillText("WA", PAD + ICO / 2, MID_Y);
  ctx.restore();

  ctx.save();
  ctx.font = "300 28px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = WHITE55;
  ctx.fillText("2494-587046", PAD + ICO + 14, MID_Y);
  ctx.restore();

  // Pin
  const PX = W - PAD - 238;
  ctx.save();
  ctx.beginPath();
  ctx.arc(PX + 11, MID_Y - 6, 11, 0, Math.PI * 2);
  ctx.fillStyle = PINK;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(PX + 4,  MID_Y + 4);
  ctx.lineTo(PX + 11, MID_Y + 20);
  ctx.lineTo(PX + 18, MID_Y + 4);
  ctx.fillStyle = PINK;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(PX + 11, MID_Y - 6, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#0a0a0a";
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.font = "300 28px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = WHITE55;
  ctx.fillText("Tandil, Bs As", PX + 28, MID_Y);
  ctx.restore();
}

// ── Main draw ─────────────────────────────────────────────────────────────────

export function drawHistoriaV2(ctx, img, data, transform) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);

  drawPhoto(ctx, img, transform || {});
  drawOverlays(ctx);
  pinkBar(ctx, 0, 7);        // top bar only
  drawHeader(ctx);
  drawInfoPanel(ctx, data);
}

export async function renderHistoriaV2({ img, data, transform }) {
  const canvas  = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx     = canvas.getContext("2d");
  drawHistoriaV2(ctx, img, data, transform || {});

  const format  = data?.__exportFormat || "jpg";
  const quality = Number(data?.__exportQuality ?? 0.92);
  const mime    = format === "png" ? "image/png" : "image/jpeg";

  const blob    = await new Promise(r =>
    canvas.toBlob(r, mime, mime === "image/jpeg" ? quality : undefined)
  );
  const dataURL = canvas.toDataURL(mime, mime === "image/jpeg" ? quality : undefined);
  return { blob, dataURL };
}
