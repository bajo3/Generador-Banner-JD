/**
 * Historia V2 — Story 1080×1920
 * Foto full-bleed + overlay degradado + header Jesús DIAZ +
 * specs grid 2×2 + bloque precio + footer WhatsApp / ubicación
 */

import { drawCoverPanZoom, fitText } from "../draw.js";
import { cleanSpaces, formatKm, upper } from "../utils.js";
import { loadLogoOnce } from "./portadaFicha.js";

const W = 1080;
const H = 1920;

const PINK      = "#ff008c";
const PINK_DIM  = "rgba(255,0,140,0.28)";
const PINK_BG   = "rgba(255,0,140,0.10)";
const WHITE     = "#ffffff";
const WHITE_MID = "rgba(255,255,255,0.55)";
const WHITE_DIM = "rgba(255,255,255,0.35)";

// ── helpers ───────────────────────────────────────────────────────────────────

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

function pinkAccentBar(ctx, y, barH = 7) {
  const lg = ctx.createLinearGradient(0, 0, W, 0);
  lg.addColorStop(0,    "rgba(255,0,140,0.4)");
  lg.addColorStop(0.12, PINK);
  lg.addColorStop(0.88, PINK);
  lg.addColorStop(1,    "rgba(255,0,140,0.4)");
  ctx.fillStyle = lg;
  ctx.fillRect(0, y, W, barH);
  // glow below
  const gg = ctx.createLinearGradient(0, y + barH, 0, y + barH + 28);
  gg.addColorStop(0, "rgba(255,0,140,0.18)");
  gg.addColorStop(1, "rgba(255,0,140,0)");
  ctx.fillStyle = gg;
  ctx.fillRect(0, y + barH, W, 28);
}

// ── Photo (full bleed) ────────────────────────────────────────────────────────

function drawPhoto(ctx, img, transform) {
  if (!img) {
    ctx.fillStyle = "#06060f";
    ctx.fillRect(0, 0, W, H);
    ctx.font = "700 36px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SIN FOTO", W / 2, H / 2);
    return;
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();
  drawCoverPanZoom(ctx, img, 0, 0, W, H, transform);
  ctx.restore();
}

// ── Overlays ──────────────────────────────────────────────────────────────────

function drawOverlays(ctx) {
  // Top fade (for header readability)
  const top = ctx.createLinearGradient(0, 0, 0, 340);
  top.addColorStop(0,   "rgba(10,10,10,1)");
  top.addColorStop(0.6, "rgba(10,10,10,0.72)");
  top.addColorStop(1,   "rgba(10,10,10,0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, 340);

  // Bottom fade (for info panel readability)
  const bot = ctx.createLinearGradient(0, H - 860, 0, H);
  bot.addColorStop(0,    "rgba(10,10,10,0)");
  bot.addColorStop(0.22, "rgba(10,10,10,0.82)");
  bot.addColorStop(0.45, "rgba(10,10,10,0.97)");
  bot.addColorStop(1,    "rgba(10,10,10,1)");
  ctx.fillStyle = bot;
  ctx.fillRect(0, H - 860, W, 860);
}

// ── Header ────────────────────────────────────────────────────────────────────

function drawHeader(ctx) {
  const cx = W / 2;

  // "Jesús" blanco light + "DIAZ" rosa bold
  ctx.save();

  // --- Jesús ---
  ctx.font = "300 62px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = WHITE;
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 12;
  ctx.fillText("Jesús", cx - 6, 120);

  // --- DIAZ ---
  ctx.font = "900 72px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = PINK;
  ctx.fillText("DIAZ", cx + 6, 120);

  // Underline DIAZ
  ctx.shadowBlur = 0;
  ctx.font = "900 72px system-ui, sans-serif";
  const diazW = ctx.measureText("DIAZ").width;
  ctx.fillStyle = PINK;
  ctx.fillRect(cx + 6, 128, diazW, 4);

  // AUTOMOTORES
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 8;
  ctx.fillText("A U T O M O T O R E S", cx, 170);

  // Tagline
  ctx.font = "700 18px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,0,140,0.80)";
  ctx.shadowBlur = 0;
  ctx.fillText("· TU MEJOR ELECCIÓN ·", cx, 200);

  ctx.restore();

  // Pink line below header
  pinkAccentBar(ctx, 218, 5);
}

// ── Info panel ────────────────────────────────────────────────────────────────

function drawInfoPanel(ctx, data) {
  const padX   = 70;
  const maxW   = W - padX * 2;
  const cx     = W / 2;

  // ── Car brand ─────────────────────────────────────────────────────────────
  const PANEL_TOP = H - 830;
  let curY = PANEL_TOP;

  const brand = upper(cleanSpaces(data.brand || ""));
  if (brand) {
    ctx.save();
    ctx.font = "300 30px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = PINK;
    ctx.letterSpacing = "0.3em";
    ctx.fillText(brand, padX, curY);
    ctx.restore();
    curY += 42;
  }

  // ── Model (big) ───────────────────────────────────────────────────────────
  const model = upper(cleanSpaces(data.model || ""));
  if (model) {
    const tmp = document.createElement("canvas").getContext("2d");
    const fs  = fitText(tmp, model, maxW, 170, 60, "system-ui, sans-serif", "900");
    ctx.save();
    ctx.font = `900 ${fs}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = WHITE;
    ctx.shadowColor = "rgba(255,0,140,0.20)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 6;
    ctx.fillText(model, padX, curY + fs * 0.82);
    ctx.restore();
    curY += fs + 14;
  }

  // ── Version pill ──────────────────────────────────────────────────────────
  const version = upper(cleanSpaces(data.version || ""));
  if (version) {
    const tmp2 = document.createElement("canvas").getContext("2d");
    const vfs = fitText(tmp2, version, maxW - 60, 34, 18, "system-ui, sans-serif", "600");
    ctx.save();
    ctx.font = `600 ${vfs}px system-ui, sans-serif`;
    const vW = Math.min(maxW, ctx.measureText(version).width + 60);
    const vH = vfs + 22;
    rr(ctx, padX, curY, vW, vH, vH / 2);
    const pg = ctx.createLinearGradient(padX, curY, padX + vW, curY);
    pg.addColorStop(0, "rgba(255,0,140,0.20)");
    pg.addColorStop(0.5, "rgba(255,0,140,0.09)");
    pg.addColorStop(1, "rgba(255,0,140,0.20)");
    ctx.fillStyle = pg; ctx.fill();
    ctx.strokeStyle = PINK_DIM; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = WHITE_MID;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(version, padX + 24, curY + vH / 2);
    ctx.restore();
    curY += vH + 36;
  } else {
    curY += 20;
  }

  // ── Pink divider ──────────────────────────────────────────────────────────
  ctx.fillStyle = PINK;
  ctx.fillRect(padX, curY, 80, 3);
  curY += 40;

  // ── Specs grid 2×2 ───────────────────────────────────────────────────────
  const year    = String(data.year || "").trim();
  const km      = !data.kmHidden ? formatKm(data.km) : "";
  const kmLine  = km ? `${km} km` : "";
  const motor   = cleanSpaces(String(data.motorTraction || data.engine || "").trim());
  const gbRaw   = cleanSpaces(String(data.gearbox || "").trim());
  const gearbox = gbRaw ? gbRaw.charAt(0).toUpperCase() + gbRaw.slice(1).toLowerCase() : "";

  const cells = [
    year    ? ["Año",    year]    : null,
    kmLine  ? ["KM",     kmLine]  : null,
    motor   ? ["Motor",  motor]   : null,
    gearbox ? ["Caja",   gearbox] : null,
  ].filter(Boolean);

  if (cells.length > 0) {
    const cols   = cells.length <= 2 ? cells.length : 2;
    const rows   = Math.ceil(cells.length / cols);
    const gap    = 12;
    const cellW  = Math.floor((maxW - gap * (cols - 1)) / cols);
    const cellH  = 110;

    cells.forEach(([lbl, val], i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx2 = padX + col * (cellW + gap);
      const cy2 = curY + row * (cellH + gap);

      // Cell background
      rr(ctx, cx2, cy2, cellW, cellH, 12);
      const cbg = ctx.createLinearGradient(cx2, cy2, cx2, cy2 + cellH);
      cbg.addColorStop(0, "rgba(255,0,140,0.13)");
      cbg.addColorStop(1, "rgba(255,0,140,0.05)");
      ctx.fillStyle = cbg; ctx.fill();
      ctx.strokeStyle = PINK_DIM; ctx.lineWidth = 1.5; ctx.stroke();

      // Pink top accent
      rr(ctx, cx2, cy2, cellW, 4, 2);
      ctx.fillStyle = PINK; ctx.fill();

      // Label
      ctx.font = "700 16px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(255,0,140,0.85)";
      ctx.fillText(lbl.toUpperCase(), cx2 + 16, cy2 + 12);

      // Value
      const tmp3 = document.createElement("canvas").getContext("2d");
      const vfs2 = fitText(tmp3, val, cellW - 32, 38, 20, "system-ui, sans-serif", "800");
      ctx.font = `800 ${vfs2}px system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = WHITE;
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 5;
      ctx.fillText(val, cx2 + 16, cy2 + cellH * 0.66);
      ctx.shadowBlur = 0;
    });

    curY += rows * cellH + (rows - 1) * gap + 36;
  }

  // ── Price block ───────────────────────────────────────────────────────────
  const precio = cleanSpaces(String(data.price || "").trim());
  const credito = cleanSpaces(String(data.priceCredit || "").trim());

  if (precio) {
    const blockH = credito ? 180 : 150;
    rr(ctx, padX, curY, maxW, blockH, 14);
    const pbg = ctx.createLinearGradient(padX, curY, padX, curY + blockH);
    pbg.addColorStop(0, "rgba(255,0,140,0.13)");
    pbg.addColorStop(1, "rgba(255,0,140,0.05)");
    ctx.fillStyle = pbg; ctx.fill();
    ctx.strokeStyle = PINK_DIM; ctx.lineWidth = 1.5; ctx.stroke();

    // Pink badge "PRECIO CONTADO"
    const badgeW = 260; const badgeH = 34;
    rr(ctx, padX + 20, curY + 16, badgeW, badgeH, badgeH / 2);
    ctx.fillStyle = "rgba(255,0,140,0.85)"; ctx.fill();
    ctx.font = "700 15px system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = WHITE;
    ctx.fillText("PRECIO CONTADO", padX + 20 + badgeW / 2, curY + 16 + badgeH / 2);

    // Price number
    const tmp4 = document.createElement("canvas").getContext("2d");
    const pfs = fitText(tmp4, precio, maxW - 40, 100, 52, "system-ui, sans-serif", "900");
    ctx.font = `900 ${pfs}px system-ui, sans-serif`;
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = WHITE;
    ctx.shadowColor = "rgba(255,0,140,0.18)";
    ctx.shadowBlur = 16;
    ctx.fillText(precio, padX + 20, curY + 70 + pfs * 0.72);
    ctx.shadowBlur = 0;

    // Credit price
    if (credito) {
      ctx.font = "300 26px system-ui, sans-serif";
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.fillStyle = WHITE_MID;
      ctx.fillText(`Con crédito: ${credito}`, padX + 20, curY + blockH - 18);
    }

    curY += blockH + 28;
  }

  // ── Footer: WhatsApp + ubicación ──────────────────────────────────────────
  const FOOTER_Y = H - 100;

  // Thin separator
  const sg = ctx.createLinearGradient(0, 0, W, 0);
  sg.addColorStop(0,   "transparent");
  sg.addColorStop(0.2, "rgba(255,0,140,0.25)");
  sg.addColorStop(0.8, "rgba(255,0,140,0.25)");
  sg.addColorStop(1,   "transparent");
  ctx.fillStyle = sg;
  ctx.fillRect(padX, FOOTER_Y - 20, maxW, 1.5);

  // WhatsApp icon + number
  _drawWAIcon(ctx, padX, FOOTER_Y + 6, 38);
  ctx.font = "300 28px system-ui, sans-serif";
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillStyle = WHITE_MID;
  ctx.fillText("2494-587046", padX + 52, FOOTER_Y + 6 + 19);

  // Location pin + city
  _drawPinIcon(ctx, W - padX - 200, FOOTER_Y + 6, 38);
  ctx.font = "300 28px system-ui, sans-serif";
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillStyle = WHITE_MID;
  ctx.fillText("Tandil, Bs As", W - padX - 200 + 46, FOOTER_Y + 6 + 19);
}

// ── SVG-based icons drawn on canvas ──────────────────────────────────────────

function _drawWAIcon(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  const s = size / 24;
  ctx.scale(s, s);
  ctx.fillStyle = "#25D366";
  // WhatsApp path (simplified)
  ctx.beginPath();
  ctx.arc(12, 12, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("WA", 12, 12);
  ctx.restore();
}

function _drawPinIcon(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x + size / 2, y);
  const s = size / 24;
  ctx.scale(s, s);
  ctx.fillStyle = PINK;
  ctx.beginPath();
  ctx.arc(0, -3, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-5, 2);
  ctx.lineTo(0, 16);
  ctx.lineTo(5, 2);
  ctx.fill();
  // white dot center
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(0, -3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Main draw function ────────────────────────────────────────────────────────

export function drawHistoriaV2(ctx, img, data, transform = {}) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);

  drawPhoto(ctx, img, transform);
  drawOverlays(ctx);
  drawHeader(ctx);
  pinkAccentBar(ctx, H - 7, 7); // bottom bar
  drawInfoPanel(ctx, data);
}

// ── Render to blob (for export) ───────────────────────────────────────────────

export async function renderHistoriaV2({ img, data, transform }) {
  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  drawHistoriaV2(ctx, img, data, transform || {});

  const format  = data?.__exportFormat || "jpg";
  const quality = Number(data?.__exportQuality ?? 0.92);
  const mime    = format === "png" ? "image/png" : "image/jpeg";

  const blob = await new Promise(r =>
    canvas.toBlob(r, mime, mime === "image/jpeg" ? quality : undefined)
  );
  const dataURL = canvas.toDataURL(mime, mime === "image/jpeg" ? quality : undefined);
  return { blob, dataURL };
}
