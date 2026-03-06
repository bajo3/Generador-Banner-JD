import { drawCoverPanZoom, fitText, textStrokeFill } from "../draw.js";
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

export function drawVenta(ctx, img, data, transform = { zoom: 1, panX: 0, panY: 0 }) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  const headerH = 168;
  const footerH = 200;
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
  // Vignette
  const vt = ctx.createLinearGradient(0, photoY, 0, photoY + 60);
  vt.addColorStop(0, "rgba(0,0,0,0.30)");
  vt.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = vt;
  ctx.fillRect(0, photoY, W, 60);
  const vb = ctx.createLinearGradient(0, footerY - 60, 0, footerY);
  vb.addColorStop(0, "rgba(0,0,0,0)");
  vb.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = vb;
  ctx.fillRect(0, footerY - 60, W, 60);
  ctx.restore();

  // ── Header ───────────────────────────────────────────────────────────────
  drawHeader(ctx);

  // ── Footer ───────────────────────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, footerY, W, footerH);
  pinkLine(ctx, footerY);
  ctx.restore();

  // ── Footer content ───────────────────────────────────────────────────────
  const model   = cleanSpaces(upper(data.model  || ""));
  const year    = String(data.year  || "").trim();
  const version = cleanSpaces(upper(data.version || ""));
  const engine  = cleanSpaces(upper(data.engine  || ""));
  const kmTxt   = (data.kmHidden ? "" : formatKm(data.km));
  const kmPart  = kmTxt ? `${kmTxt} KM` : "";

  // Line 1: MODELO · AÑO · VERSIÓN
  const topParts = [model, year, version].filter(Boolean);
  const line1 = topParts.join("  ·  ");
  // Line 2: MOTOR  |  KM
  const botParts = [engine, kmPart].filter(Boolean);
  const line2 = botParts.join("  ·  ");

  ctx.save();
  const maxW = 980;

  if (line1) {
    const s1 = fitText(ctx, line1, maxW, 50, 24, "system-ui, sans-serif", "900");
    ctx.font = `900 ${s1}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = WHITE;
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 8;
    ctx.fillText(line1, cx, footerY + (line2 ? 64 : 100));
    ctx.shadowBlur = 0;
  }

  if (line2) {
    const s2 = fitText(ctx, line2, maxW, 44, 22, "system-ui, sans-serif", "800");
    ctx.font = `800 ${s2}px system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.80)";
    ctx.shadowColor = "rgba(0,0,0,0.40)";
    ctx.shadowBlur = 6;
    ctx.fillText(line2, cx, footerY + (line1 ? 136 : 100));
    ctx.shadowBlur = 0;
  }

  // If only single combined line (original behaviour fallback)
  if (!line1 && !line2) {
    const all = cleanSpaces([model, year, version, engine, kmPart].filter(Boolean).join(" / "));
    const s = fitText(ctx, all, maxW, 54, 24, "system-ui, sans-serif", "900");
    ctx.font = `900 ${s}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = WHITE;
    ctx.fillText(all, cx, footerY + footerH / 2 + 10);
  }

  ctx.restore();

  // Small pink accent dots flanking footer text
  ctx.save();
  ctx.fillStyle = PINK;
  const dotY = footerY + (line1 && line2 ? 64 : 100);
  ctx.beginPath(); ctx.arc(54, dotY, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W - 54, dotY, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export async function renderVenta({ img, data, transform = { zoom: 1, panX: 0, panY: 0 } }) {
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  drawVenta(ctx, img, data, transform);
  const format  = data?.__exportFormat || "jpg";
  const quality = Number(data?.__exportQuality ?? 0.92);
  const mime    = format === "png" ? "image/png" : "image/jpeg";
  const blob    = await new Promise(r => canvas.toBlob(r, mime, mime === "image/jpeg" ? quality : undefined));
  const dataURL = canvas.toDataURL(mime, mime === "image/jpeg" ? quality : undefined);
  return { blob, dataURL };
}
