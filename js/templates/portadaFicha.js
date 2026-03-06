import { drawCoverPanZoom, textStrokeFill, fitText, avgLuminance } from "../draw.js";
import { formatKm, upper, cleanSpaces } from "../utils.js";

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
  const gg = ctx.createLinearGradient(0,y+5,0,y+34);
  gg.addColorStop(0,"rgba(255,0,140,0.16)"); gg.addColorStop(1,"rgba(255,0,140,0)");
  ctx.fillStyle = gg; ctx.fillRect(0,y+5,W,29);
}

function drawLogo(ctx, logoImg, x, y, w, h) {
  if (!logoImg) return;
  const padX = w*0.08, padY = h*0.10;
  const maxW = w-padX*2, maxH = h-padY*2;
  let lw = maxW, lh = lw/LOGO_RATIO;
  if (lh > maxH) { lh = maxH; lw = lh*LOGO_RATIO; }
  ctx.drawImage(logoImg, x+(w-lw)/2, y+(h-lh)/2, lw, lh);
}

export function drawPortadaFicha(ctx, img, data, transform = { zoom:1, panX:0, panY:0 }, logoImg) {
  ctx.fillStyle = BLACK;
  ctx.fillRect(0,0,W,H);

  const headerH = 162;
  const footerH = 158;
  const footerY = H - footerH;
  const photoY  = headerH;
  const photoH  = footerY - headerH;  // 760px
  const cx = W / 2;

  // ── Photo ──────────────────────────────────────────────────────────────
  ctx.save();
  ctx.beginPath(); ctx.rect(0,photoY,W,photoH); ctx.clip();
  if (img) drawCoverPanZoom(ctx, img, 0, photoY, W, photoH, transform);
  const vt = ctx.createLinearGradient(0,photoY,0,photoY+100);
  vt.addColorStop(0,"rgba(0,0,0,0.40)"); vt.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=vt; ctx.fillRect(0,photoY,W,100);
  const vb = ctx.createLinearGradient(0,footerY-100,0,footerY);
  vb.addColorStop(0,"rgba(0,0,0,0)"); vb.addColorStop(1,"rgba(0,0,0,0.44)");
  ctx.fillStyle=vb; ctx.fillRect(0,footerY-100,W,100);
  ctx.restore();

  // ── Header con logo ─────────────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = BLACK; ctx.fillRect(0,0,W,headerH);
  drawLogo(ctx, logoImg, 0, 0, W, headerH);
  pinkLine(ctx, headerH-5);
  ctx.restore();

  // ── Footer con logo ─────────────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = BLACK; ctx.fillRect(0,footerY,W,footerH);
  pinkLine(ctx, footerY);
  drawLogo(ctx, logoImg, 0, footerY, W, footerH);
  ctx.restore();

  // ── Datos del vehículo sobre la foto ────────────────────────────────────
  const brand   = cleanSpaces(upper(data.brand   || ""));
  const model   = cleanSpaces(upper(data.model   || ""));
  const version = cleanSpaces(upper(data.version || ""));
  const kmTxt   = formatKm(data.km);
  const kmLine  = (data.kmHidden || !kmTxt) ? "" : `${kmTxt} KM`;
  const gearbox = cleanSpaces(upper(data.gearbox || ""));
  const year    = String(data.year || "").trim();
  const extra1  = cleanSpaces(data.extra1 || "");
  const extra2  = cleanSpaces(data.extra2 || "");

  const lum = img ? avgLuminance(ctx, W*0.1, photoY+20, W*0.8, 180) : 0.3;
  const sb  = lum > 0.60 ? 1.30 : 1.0;
  const sa  = lum > 0.60 ? 0.65 : 0.30;

  const topPadPhoto = 44;
  const botPadPhoto = 36;

  // Medir tamaños — brand más chico, model más grande, separados con espacio
  const sBrand = brand   ? fitText(ctx, brand,   940, 56, 28, "system-ui, sans-serif", "900") : 0;
  const sModel = model   ? fitText(ctx, model,   960, 96, 44, "system-ui, sans-serif", "900") : 0;
  const sVer   = version ? fitText(ctx, version, 860, 40, 20, "system-ui, sans-serif", "800") : 0;
  const sKM    = kmLine  ? fitText(ctx, kmLine,  940, 78, 36, "system-ui, sans-serif", "900") : 0;

  // Calcular altura total del bloque superior para no pisar nada
  let topH = 0;
  if (sBrand)  topH += sBrand + 8;
  if (sModel)  topH += sModel + 10;
  if (sVer)    topH += (sVer + 28) + 18;  // pill height
  if (sKM)     topH += sKM + 10;

  // Si no entra, scale down uniforme
  const maxTopH = photoH * 0.55;
  const scale = topH > maxTopH ? maxTopH / topH : 1.0;
  const sBrandF = Math.max(0, Math.round(sBrand * scale));
  const sModelF = Math.max(0, Math.round(sModel * scale));
  const sVerF   = Math.max(0, Math.round(sVer   * scale));
  const sKMF    = Math.max(0, Math.round(sKM    * scale));

  function strokeText(text, size, alpha) {
    textStrokeFill(ctx, text, cx, ty + size * 0.84, {
      font: `900 ${size}px system-ui, -apple-system, Segoe UI, sans-serif`,
      stroke: "rgba(0,0,0,0.90)", fill: WHITE,
      lineWidth: Math.max(5, Math.round(size * 0.11 * sb)),
      shadowColor: `rgba(0,0,0,${alpha})`,
      shadowBlur: 16, shadowOffsetY: 5,
      align: "center", baseline: "alphabetic",
    });
  }

  let ty = photoY + topPadPhoto;

  if (brand && sBrandF >= 20)  { strokeText(brand,  sBrandF, sa); ty += sBrandF + 8;  }
  if (model && sModelF >= 24)  { strokeText(model,  sModelF, sa); ty += sModelF + 10; }

  // Version pill — separado limpiamente del modelo
  if (version && sVerF >= 16) {
    ctx.font = `800 ${sVerF}px system-ui, sans-serif`;
    const pH = sVerF + 26;
    const pW = Math.min(W-120, ctx.measureText(version).width + 64);
    const px = cx - pW/2;
    rr(ctx, px, ty+6, pW, pH, pH/2);
    const pg = ctx.createLinearGradient(px,ty,px+pW,ty+pH);
    pg.addColorStop(0,"#d0006a"); pg.addColorStop(1,PINK);
    ctx.fillStyle=pg; ctx.fill();
    rr(ctx, px, ty+6, pW, pH, pH/2);
    ctx.strokeStyle="rgba(255,255,255,0.18)"; ctx.lineWidth=1.5; ctx.stroke();
    ctx.fillStyle=WHITE; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.shadowColor="rgba(0,0,0,0.25)"; ctx.shadowBlur=8;
    ctx.fillText(version, cx, ty+6+pH/2);
    ctx.shadowBlur=0;
    ty += pH + 20;
  }

  // KM — en su propia línea clara, separado de versión
  if (kmLine && sKMF >= 20) {
    const lumKM = img ? avgLuminance(ctx, W*0.12, ty, W*0.76, sKMF+20) : 0.3;
    const ksa = lumKM > 0.60 ? 0.70 : 0.42;
    textStrokeFill(ctx, kmLine, cx, ty + sKMF * 0.84, {
      font: `900 ${sKMF}px system-ui, sans-serif`,
      stroke: `rgba(0,0,0,${ksa})`, fill: WHITE,
      lineWidth: Math.max(5, Math.round(sKMF * 0.11 * sb)),
      shadowColor: `rgba(0,0,0,${ksa})`,
      shadowBlur: 14, shadowOffsetY: 5,
      align: "center", baseline: "alphabetic",
    });
    ty += sKMF + 8;
  }

  // Detalles secundarios — anclados al fondo de la foto
  const detailItems = [
    gearbox ? `Caja: ${gearbox}` : "",
    year    ? `Año: ${year}`     : "",
    extra1,
    extra2,
  ].filter(Boolean).slice(0, 3);

  if (detailItems.length > 0) {
    const dFS  = 40;
    const dGap = 52;
    let dy = footerY - botPadPhoto - detailItems.length * dGap;

    const lumD = img ? avgLuminance(ctx, W*0.1, dy, W*0.8, detailItems.length * dGap + 40) : 0.3;
    const dSA  = lumD > 0.60 ? 0.72 : 0.42;

    for (const item of detailItems) {
      const s = fitText(ctx, item, 920, dFS, 20, "system-ui, sans-serif", "700");
      textStrokeFill(ctx, item, cx, dy + s * 0.84, {
        font: `700 ${s}px system-ui, sans-serif`,
        stroke: `rgba(0,0,0,${Math.min(0.90,dSA+0.1)})`, fill: WHITE,
        lineWidth: Math.max(4, Math.round(s * 0.11 * sb)),
        shadowColor: `rgba(0,0,0,${dSA})`, shadowBlur: 11, shadowOffsetY: 4,
        align: "center", baseline: "alphabetic",
      });
      dy += dGap;
    }
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
