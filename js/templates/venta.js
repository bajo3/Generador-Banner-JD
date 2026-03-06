import { drawCoverPanZoom, fitText, textStrokeFill } from "../draw.js";
import { formatKm, upper, cleanSpaces } from "../utils.js";
import { loadLogoOnce } from "./portadaFicha.js";

const W = 1080;
const H = 1080;
const PINK  = "#ff008c";
const BLACK = "#000000";
const WHITE = "#ffffff";
const LOGO_RATIO = 801 / 253;

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rad,y); ctx.lineTo(x+w-rad,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+rad);
  ctx.lineTo(x+w,y+h-rad);
  ctx.quadraticCurveTo(x+w,y+h,x+w-rad,y+h);
  ctx.lineTo(x+rad,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+rad);
  ctx.quadraticCurveTo(x,y,x+rad,y);
  ctx.closePath();
}

function pinkLine(ctx, y) {
  const lg = ctx.createLinearGradient(0,0,W,0);
  lg.addColorStop(0,"rgba(255,0,140,0.25)"); lg.addColorStop(0.12,PINK);
  lg.addColorStop(0.88,PINK); lg.addColorStop(1,"rgba(255,0,140,0.25)");
  ctx.fillStyle = lg; ctx.fillRect(0,y,W,5);
  const gg = ctx.createLinearGradient(0,y+5,0,y+32);
  gg.addColorStop(0,"rgba(255,0,140,0.15)"); gg.addColorStop(1,"rgba(255,0,140,0)");
  ctx.fillStyle = gg; ctx.fillRect(0,y+5,W,27);
}

function drawLogo(ctx, logoImg, x, y, w, h) {
  if (!logoImg) return;
  const padX = w*0.08, padY = h*0.10;
  const maxW = w-padX*2, maxH = h-padY*2;
  let lw = maxW, lh = lw/LOGO_RATIO;
  if (lh > maxH) { lh = maxH; lw = lh*LOGO_RATIO; }
  ctx.drawImage(logoImg, x+(w-lw)/2, y+(h-lh)/2, lw, lh);
}

export function drawVenta(ctx, img, data, transform = { zoom:1, panX:0, panY:0 }, logoImg) {
  ctx.fillStyle = BLACK;
  ctx.fillRect(0,0,W,H);

  const headerH = 162;
  const footerH = 186;
  const footerY = H - footerH;
  const photoY  = headerH;
  const photoH  = footerY - headerH;
  const cx = W / 2;

  // ── Photo ──────────────────────────────────────────────────────────────
  ctx.save();
  ctx.beginPath(); ctx.rect(0,photoY,W,photoH); ctx.clip();
  if (img) drawCoverPanZoom(ctx, img, 0, photoY, W, photoH, transform);
  const vt = ctx.createLinearGradient(0,photoY,0,photoY+60);
  vt.addColorStop(0,"rgba(0,0,0,0.30)"); vt.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=vt; ctx.fillRect(0,photoY,W,60);
  const vb = ctx.createLinearGradient(0,footerY-60,0,footerY);
  vb.addColorStop(0,"rgba(0,0,0,0)"); vb.addColorStop(1,"rgba(0,0,0,0.38)");
  ctx.fillStyle=vb; ctx.fillRect(0,footerY-60,W,60);
  ctx.restore();

  // ── Header con logo ─────────────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = BLACK; ctx.fillRect(0,0,W,headerH);
  drawLogo(ctx, logoImg, 0, 0, W, headerH);
  pinkLine(ctx, headerH-5);
  ctx.restore();

  // ── Footer negro ────────────────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = BLACK; ctx.fillRect(0,footerY,W,footerH);
  pinkLine(ctx, footerY);
  ctx.restore();

  // ── Footer content: dos líneas bien separadas ───────────────────────────
  const model   = cleanSpaces(upper(data.model   || ""));
  const year    = String(data.year || "").trim();
  const version = cleanSpaces(upper(data.version || ""));
  const engine  = cleanSpaces(upper(data.engine  || ""));
  const kmTxt   = data.kmHidden ? "" : formatKm(data.km);
  const kmPart  = kmTxt ? `${kmTxt} KM` : "";

  // Línea 1: MODELO  ·  AÑO  ·  VERSIÓN
  const top = [model, year, version].filter(Boolean).join("  ·  ");
  // Línea 2: MOTOR  ·  KM
  const bot = [engine, kmPart].filter(Boolean).join("  ·  ");

  const maxW = 980;
  ctx.save();
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 8;

  if (top && bot) {
    const s1 = fitText(ctx, top, maxW, 48, 22, "system-ui, sans-serif", "900");
    ctx.font = `900 ${s1}px system-ui, sans-serif`;
    ctx.fillStyle = WHITE;
    ctx.fillText(top, cx, footerY + 60);

    const s2 = fitText(ctx, bot, maxW, 42, 20, "system-ui, sans-serif", "700");
    ctx.font = `700 ${s2}px system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.fillText(bot, cx, footerY + 134);
  } else {
    const single = top || bot;
    if (single) {
      const s = fitText(ctx, single, maxW, 54, 24, "system-ui, sans-serif", "900");
      ctx.font = `900 ${s}px system-ui, sans-serif`;
      ctx.fillStyle = WHITE;
      ctx.fillText(single, cx, footerY + footerH/2 + 8);
    }
  }
  ctx.restore();

  // Puntos de acento rosa
  ctx.save();
  ctx.fillStyle = PINK;
  [44, W-44].forEach(dx => {
    ctx.beginPath(); ctx.arc(dx, footerY + (top && bot ? 60 : footerH/2 + 8), 4, 0, Math.PI*2); ctx.fill();
  });
  ctx.restore();
}

export async function renderVenta({ img, data, transform = { zoom:1, panX:0, panY:0 } }) {
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const logoImg = await loadLogoOnce();
  drawVenta(ctx, img, data, transform, logoImg);
  const format  = data?.__exportFormat || "jpg";
  const quality = Number(data?.__exportQuality ?? 0.92);
  const mime    = format === "png" ? "image/png" : "image/jpeg";
  const blob    = await new Promise(r => canvas.toBlob(r, mime, mime==="image/jpeg"?quality:undefined));
  const dataURL = canvas.toDataURL(mime, mime==="image/jpeg"?quality:undefined);
  return { blob, dataURL };
}
