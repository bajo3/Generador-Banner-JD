import { drawCoverPanZoom, fitText } from "../draw.js";
import { upper, cleanSpaces } from "../utils.js";
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

// Estrellas decorativas
function drawSparkles(ctx, cx, cy, count, radius) {
  ctx.save();
  const rand = (n) => Math.sin(n * 9301 + 49297) * 0.5 + 0.5; // pseudo-random deterministic
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + 0.3;
    const dist  = radius * (0.55 + rand(i) * 0.45);
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;
    const size = 4 + rand(i + 100) * 6;
    ctx.globalAlpha = 0.35 + rand(i + 200) * 0.45;
    ctx.fillStyle = PINK;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle * 1.3);
    ctx.beginPath();
    for (let p = 0; p < 8; p++) {
      const a = (p / 8) * Math.PI * 2;
      const r = p % 2 === 0 ? size : size * 0.38;
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

export function drawFelicitaciones(ctx, img, data, transform = { zoom:1, panX:0, panY:0 }, logoImg) {
  ctx.fillStyle = BLACK;
  ctx.fillRect(0,0,W,H);

  const headerH = 162;
  const footerH = 306;   // más alto para acomodar todo el texto
  const footerY = H - footerH;
  const photoY  = headerH;
  const photoH  = footerY - headerH;
  const cx = W / 2;

  // ── Photo ──────────────────────────────────────────────────────────────
  ctx.save();
  ctx.beginPath(); ctx.rect(0,photoY,W,photoH); ctx.clip();
  if (img) drawCoverPanZoom(ctx, img, 0, photoY, W, photoH, transform);
  ctx.fillStyle = "rgba(255,0,80,0.03)";
  ctx.fillRect(0,photoY,W,photoH);
  const vt = ctx.createLinearGradient(0,photoY,0,photoY+60);
  vt.addColorStop(0,"rgba(0,0,0,0.28)"); vt.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=vt; ctx.fillRect(0,photoY,W,60);
  const vb = ctx.createLinearGradient(0,footerY-80,0,footerY);
  vb.addColorStop(0,"rgba(0,0,0,0)"); vb.addColorStop(1,"rgba(0,0,0,0.42)");
  ctx.fillStyle=vb; ctx.fillRect(0,footerY-80,W,80);
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
  // Glow rosado sutil de fondo
  const fg = ctx.createRadialGradient(cx, footerY+footerH*0.45, 0, cx, footerY+footerH*0.45, footerH*1.1);
  fg.addColorStop(0,"rgba(255,0,140,0.09)"); fg.addColorStop(1,"rgba(255,0,140,0)");
  ctx.fillStyle=fg; ctx.fillRect(0,footerY,W,footerH);
  ctx.restore();

  // ── Layout del footer ───────────────────────────────────────────────────
  // Estructura fija:
  //  [18px pad]
  //  ¡FELICITACIONES!   ~74px
  //  [10px gap]
  //  "Nombre del cliente"  ~60px (o más chico si es largo)
  //  [8px gap]
  //  línea decorativa  ~14px
  //  [10px gap]
  //  logo  ~80px
  //  [10px gap]
  //  "Gracias por elegirnos"  ~20px
  //  [12px pad]

  const name = cleanSpaces(upper(data.clientName || ""));

  // FELICITACIONES — título grande con glow
  const titleText = "¡FELICITACIONES!";
  const titleS = fitText(ctx, titleText, 960, 76, 38, "system-ui, sans-serif", "900");
  const titleY = footerY + 22 + titleS;

  ctx.save();
  ctx.font = `900 ${titleS}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  // Glow rosa
  ctx.shadowColor = "rgba(255,0,140,0.55)";
  ctx.shadowBlur  = 30;
  ctx.fillStyle   = PINK;
  ctx.fillText(titleText, cx, titleY);
  // White fill encima
  ctx.shadowBlur  = 0;
  ctx.fillStyle   = WHITE;
  ctx.fillText(titleText, cx, titleY);
  ctx.restore();

  // Estrellas alrededor del título
  drawSparkles(ctx, cx, titleY - titleS * 0.4, 18, 280);

  // Nombre del cliente
  let nameBottomY = titleY + 14;
  if (name) {
    const nS = fitText(ctx, name, 960, 62, 28, "system-ui, sans-serif", "900");
    nameBottomY = titleY + 14 + nS;
    ctx.save();
    ctx.font = `900 ${nS}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.shadowColor = "rgba(0,0,0,0.50)";
    ctx.shadowBlur  = 14;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = WHITE;
    ctx.fillText(name, cx, nameBottomY);
    ctx.restore();

    // Subrayado degradado rosa bajo el nombre
    ctx.save();
    ctx.font = `900 ${nS}px system-ui, sans-serif`;
    const nW = Math.min(W-100, ctx.measureText(name).width + 40);
    const ulGrd = ctx.createLinearGradient(cx-nW/2, 0, cx+nW/2, 0);
    ulGrd.addColorStop(0,"transparent");
    ulGrd.addColorStop(0.5, PINK);
    ulGrd.addColorStop(1,"transparent");
    ctx.fillStyle = ulGrd;
    ctx.fillRect(cx-nW/2, nameBottomY + 6, nW, 3);
    ctx.restore();
  }

  // Logo en el footer (más pequeño, centrado)
  const logoAreaY = nameBottomY + 18;
  const logoAreaH = 74;
  ctx.save();
  ctx.fillStyle = BLACK; // base negra bajo el logo
  drawLogo(ctx, logoImg, 0, logoAreaY, W, logoAreaH);
  ctx.restore();

  // "Gracias por elegirnos" — tagline chiquito
  const tagY = logoAreaY + logoAreaH + 10;
  ctx.save();
  ctx.font = "500 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.fillText("Gracias por elegirnos", cx, tagY + 18);
  ctx.restore();
}

export async function renderFelicitaciones({ img, data, transform = { zoom:1, panX:0, panY:0 } }) {
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const logoImg = await loadLogoOnce();
  drawFelicitaciones(ctx, img, data, transform, logoImg);
  const format  = data?.__exportFormat || "jpg";
  const quality = Number(data?.__exportQuality ?? 0.92);
  const mime    = format === "png" ? "image/png" : "image/jpeg";
  const blob    = await new Promise(r => canvas.toBlob(r, mime, mime==="image/jpeg"?quality:undefined));
  const dataURL = canvas.toDataURL(mime, mime==="image/jpeg"?quality:undefined);
  return { blob, dataURL };
}
