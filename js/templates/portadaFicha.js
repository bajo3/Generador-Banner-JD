import { drawCoverPanZoom, textStrokeFill, fitText, avgLuminance } from "../draw.js";
import { formatKm, upper, cleanSpaces } from "../utils.js";

const W = 1080;
const H = 1080;
const PINK        = "#ff008c";
const PINK_DARK   = "#c4006a";
const BLACK       = "#000000";
const WHITE       = "#ffffff";
const LOGO_RATIO  = 801 / 253;

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

function drawLogo(ctx, logoImg, x, y, w, h) {
  if (!logoImg) return;
  const padX = w*0.08, padY = h*0.10;
  const maxW = w-padX*2, maxH = h-padY*2;
  let lw = maxW, lh = lw/LOGO_RATIO;
  if (lh > maxH) { lh = maxH; lw = lh*LOGO_RATIO; }
  ctx.drawImage(logoImg, x+(w-lw)/2, y+(h-lh)/2, lw, lh);
}

// Línea rosa con glow
function pinkLine(ctx, y, width = W) {
  const lg = ctx.createLinearGradient(0,0,width,0);
  lg.addColorStop(0,"rgba(255,0,140,0.25)"); lg.addColorStop(0.12,PINK);
  lg.addColorStop(0.88,PINK); lg.addColorStop(1,"rgba(255,0,140,0.25)");
  ctx.fillStyle = lg; ctx.fillRect(0,y,width,5);
  const gg = ctx.createLinearGradient(0,y+5,0,y+30);
  gg.addColorStop(0,"rgba(255,0,140,0.18)"); gg.addColorStop(1,"rgba(255,0,140,0)");
  ctx.fillStyle = gg; ctx.fillRect(0,y+5,width,25);
}

export function drawPortadaFicha(ctx, img, data, transform = { zoom:1, panX:0, panY:0 }, logoImg) {
  ctx.fillStyle = BLACK;
  ctx.fillRect(0,0,W,H);

  // ── Layout ────────────────────────────────────────────────────────────────
  // Header logo: 152px
  // Foto: ~614px (resto hasta footer)
  // Footer con datos: 314px

  const headerH = 152;
  const footerH = 314;
  const footerY = H - footerH;
  const photoY  = headerH;
  const photoH  = footerY - headerH;   // ~614px
  const cx = W / 2;

  // ── FOTO full-bleed ────────────────────────────────────────────────────────
  ctx.save();
  ctx.beginPath(); ctx.rect(0, photoY, W, photoH); ctx.clip();
  if (img) {
    drawCoverPanZoom(ctx, img, 0, photoY, W, photoH, transform);
  } else {
    ctx.fillStyle = "#0d0d18";
    ctx.fillRect(0, photoY, W, photoH);
  }
  // Vignette: más fuerte en la zona inferior para que los textos respiren
  const vtop = ctx.createLinearGradient(0, photoY, 0, photoY+80);
  vtop.addColorStop(0,"rgba(0,0,0,0.50)"); vtop.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle = vtop; ctx.fillRect(0, photoY, W, 80);

  const vbot = ctx.createLinearGradient(0, footerY-140, 0, footerY);
  vbot.addColorStop(0,"rgba(0,0,0,0)"); vbot.addColorStop(1,"rgba(0,0,0,0.55)");
  ctx.fillStyle = vbot; ctx.fillRect(0, footerY-140, W, 140);
  ctx.restore();

  // ── HEADER logo ────────────────────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = BLACK; ctx.fillRect(0, 0, W, headerH);
  drawLogo(ctx, logoImg, 0, 0, W, headerH);
  pinkLine(ctx, headerH - 5);
  ctx.restore();

  // ── FOOTER ─────────────────────────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = BLACK; ctx.fillRect(0, footerY, W, footerH);

  // Línea superior del footer
  pinkLine(ctx, footerY);

  // Subtle radial glow en el fondo del footer
  const fglow = ctx.createRadialGradient(cx, footerY + footerH * 0.3, 0, cx, footerY + footerH * 0.3, 500);
  fglow.addColorStop(0, "rgba(255,0,140,0.07)"); fglow.addColorStop(1, "rgba(255,0,140,0)");
  ctx.fillStyle = fglow; ctx.fillRect(0, footerY, W, footerH);
  ctx.restore();

  // ── Recoger datos ──────────────────────────────────────────────────────────
  const brand   = cleanSpaces(upper(data.brand   || ""));
  const model   = cleanSpaces(upper(data.model   || ""));
  const version = cleanSpaces(upper(data.version || ""));
  const kmTxt   = formatKm(data.km);
  const kmLine  = (data.kmHidden || !kmTxt) ? "" : `${kmTxt} KM`;
  const gearbox = cleanSpaces(upper(data.gearbox || ""));
  const year    = String(data.year || "").trim();
  const extra1  = cleanSpaces(data.extra1 || "");
  const extra2  = cleanSpaces(data.extra2 || "");

  const lum = img ? avgLuminance(ctx, W*0.1, photoY+10, W*0.8, 120) : 0.3;
  const sb  = lum > 0.55 ? 1.35 : 1.0;
  const sa  = lum > 0.55 ? 0.70 : 0.32;

  // ── Nombre sobre la foto (brand + model) ───────────────────────────────────
  // Flotando en la parte superior de la foto, debajo del header
  let ty = photoY + 22;

  if (brand) {
    const s = fitText(ctx, brand, 960, 52, 26, "system-ui, sans-serif", "700");
    textStrokeFill(ctx, brand, cx, ty + s * 0.84, {
      font: `700 ${s}px system-ui, sans-serif`,
      stroke: `rgba(0,0,0,0.88)`, fill: "rgba(255,255,255,0.90)",
      lineWidth: Math.max(4, Math.round(s * 0.10 * sb)),
      shadowColor: `rgba(0,0,0,${sa})`, shadowBlur: 12, shadowOffsetY: 4,
      align: "center", baseline: "alphabetic",
    });
    ty += s + 4;
  }

  if (model) {
    const s = fitText(ctx, model, 980, 104, 48, "system-ui, sans-serif", "900");
    textStrokeFill(ctx, model, cx, ty + s * 0.84, {
      font: `900 ${s}px system-ui, -apple-system, Segoe UI, sans-serif`,
      stroke: `rgba(0,0,0,0.92)`, fill: WHITE,
      lineWidth: Math.max(6, Math.round(s * 0.11 * sb)),
      shadowColor: `rgba(0,0,0,${sa})`, shadowBlur: 20, shadowOffsetY: 6,
      align: "center", baseline: "alphabetic",
    });
  }

  // ── FOOTER CONTENT ─────────────────────────────────────────────────────────
  // Layout del footer (314px):
  //  [16px]
  //  Versión pill ancha         ~52px
  //  [12px]
  //  Línea divisoria rosa       ~10px
  //  [10px]
  //  Grilla de datos 2×2        ~140px
  //  [14px]
  //  KM grande centrado         ~52px  (solo si existe)
  //  [14px]
  //  Extras pequeños            ~26px c/u
  //  Flexible hasta fondo

  let fy = footerY + 16;
  const padX = 52;
  const maxW = W - padX * 2;

  // ── Versión — pill rosa grande ─────────────────────────────────────────────
  if (version) {
    const vFS = fitText(ctx, version, maxW - 80, 36, 18, "system-ui, sans-serif", "800");
    const vH  = vFS + 28;
    const vW  = Math.min(maxW, (() => {
      ctx.font = `800 ${vFS}px system-ui, sans-serif`;
      return ctx.measureText(version).width + 72;
    })());
    const vX  = cx - vW / 2;

    rr(ctx, vX, fy, vW, vH, vH/2);
    const vg = ctx.createLinearGradient(vX, fy, vX+vW, fy);
    vg.addColorStop(0, PINK_DARK); vg.addColorStop(1, PINK);
    ctx.fillStyle = vg; ctx.fill();
    // Highlight top
    rr(ctx, vX, fy, vW, 3, 1.5);
    ctx.fillStyle = "rgba(255,255,255,0.22)"; ctx.fill();

    ctx.font = `800 ${vFS}px system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = WHITE;
    ctx.shadowColor = "rgba(0,0,0,0.30)"; ctx.shadowBlur = 8;
    ctx.fillText(version, cx, fy + vH/2);
    ctx.shadowBlur = 0;
    fy += vH + 14;
  }

  // ── Divisor con diamante ───────────────────────────────────────────────────
  const divGrd = ctx.createLinearGradient(cx-240,0,cx+240,0);
  divGrd.addColorStop(0,"transparent"); divGrd.addColorStop(0.5,PINK); divGrd.addColorStop(1,"transparent");
  ctx.fillStyle = divGrd; ctx.fillRect(cx-240, fy, 480, 2);
  ctx.save(); ctx.translate(cx, fy+1); ctx.rotate(Math.PI/4);
  ctx.fillStyle = PINK; ctx.fillRect(-4,-4,8,8);
  ctx.restore();
  fy += 14;

  // ── Grilla 2×2 con celdas de datos ────────────────────────────────────────
  const gridItems = [
    year    ? ["AÑO",     year]                   : null,
    gearbox ? ["CAJA",    gearbox]                 : null,
    kmLine  ? ["KM",      kmLine]                  : null,
    extra1  ? ["",        extra1]                  : null,
  ].filter(Boolean);

  if (gridItems.length > 0) {
    const cols   = gridItems.length === 1 ? 1 : 2;
    const rows   = Math.ceil(gridItems.length / cols);
    const gap    = 8;
    const cW     = Math.floor((maxW - gap*(cols-1)) / cols);
    // Altura de celda: distribuir el espacio disponible hasta el fondo con margen
    const remainH = footerH - (fy - footerY) - (extra2 ? 38 : 0) - 16;
    const cH     = Math.min(100, Math.max(60, Math.floor((remainH - gap*(rows-1)) / rows)));

    gridItems.forEach(([label, value], i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx2 = padX + col * (cW + gap);
      const cy2 = fy + row * (cH + gap);

      ctx.save();
      // Fondo celda
      rr(ctx, cx2, cy2, cW, cH, 12);
      const cbg = ctx.createLinearGradient(cx2, cy2, cx2, cy2+cH);
      cbg.addColorStop(0, "rgba(255,255,255,0.07)");
      cbg.addColorStop(1, "rgba(255,255,255,0.03)");
      ctx.fillStyle = cbg; ctx.fill();
      ctx.strokeStyle = "rgba(255,0,140,0.25)"; ctx.lineWidth = 1.5; ctx.stroke();
      // Barra superior rosa
      rr(ctx, cx2, cy2, cW, 4, 2);
      ctx.fillStyle = PINK; ctx.fill();

      const cellCX = cx2 + cW/2;
      // Label
      if (label) {
        ctx.font = `700 ${Math.round(cH*0.18)}px system-ui, sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillStyle = "rgba(255,0,140,0.82)";
        ctx.fillText(label, cellCX, cy2 + 8);
      }
      // Value
      const valFS = fitText(ctx, value, cW-24, Math.round(cH*0.40), Math.round(cH*0.22), "system-ui, sans-serif", "800");
      ctx.font = `800 ${valFS}px system-ui, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = WHITE;
      ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 5;
      ctx.fillText(value, cellCX, cy2 + cH*(label ? 0.65 : 0.52));
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    fy += rows * cH + (rows-1) * gap + 12;
  }

  // ── Extra 2 si existe (tagline, financiación, etc.) ────────────────────────
  if (extra2) {
    ctx.font = "600 22px system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.58)";
    ctx.fillText(extra2, cx, fy + 14);
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
  const blob    = await new Promise(r => canvas.toBlob(r, mime, mime==="image/jpeg"?quality:undefined));
  const dataURL = canvas.toDataURL(mime, mime==="image/jpeg"?quality:undefined);
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
