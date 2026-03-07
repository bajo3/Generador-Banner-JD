import { drawCoverPanZoom, fitText } from "../draw.js";
import { upper, cleanSpaces } from "../utils.js";
import { rr, pinkLine, drawLogoImg, PINK, BLACK, WHITE } from "./_shared.js";
import { loadLogoOnce } from "./portadaFicha.js";

const W = 1080;
const H = 1080;
const LOGO_RATIO = 801 / 253;

function drawSparkles(ctx, cx, cy, count, radius) {
  ctx.save();
  const rand = (n) => Math.sin(n * 9301 + 49297) * 0.5 + 0.5;
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
      p === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawFelicitaciones(ctx, img, data, transform = { zoom:1, panX:0, panY:0 }, logoImg) {
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, W, H);

  const headerH = 162;
  const footerH = 306;
  const footerY = H - footerH;
  const photoY  = headerH;
  const photoH  = footerY - headerH;
  const cx = W / 2;

  ctx.save();
  ctx.beginPath(); ctx.rect(0, photoY, W, photoH); ctx.clip();
  if (img) drawCoverPanZoom(ctx, img, 0, photoY, W, photoH, transform);
  ctx.fillStyle = "rgba(255,0,80,0.03)";
  ctx.fillRect(0, photoY, W, photoH);
  const vt = ctx.createLinearGradient(0, photoY, 0, photoY + 60);
  vt.addColorStop(0, "rgba(0,0,0,0.28)"); vt.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = vt; ctx.fillRect(0, photoY, W, 60);
  const vb = ctx.createLinearGradient(0, footerY - 80, 0, footerY);
  vb.addColorStop(0, "rgba(0,0,0,0)"); vb.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = vb; ctx.fillRect(0, footerY - 80, W, 80);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = BLACK; ctx.fillRect(0, 0, W, headerH);
  drawLogoImg(ctx, logoImg, 0, 0, W, headerH);
  pinkLine(ctx, headerH - 5);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = BLACK; ctx.fillRect(0, footerY, W, footerH);
  pinkLine(ctx, footerY);
  const fg = ctx.createRadialGradient(cx, footerY + footerH * 0.45, 0, cx, footerY + footerH * 0.45, footerH * 1.1);
  fg.addColorStop(0, "rgba(255,0,140,0.09)"); fg.addColorStop(1, "rgba(255,0,140,0)");
  ctx.fillStyle = fg; ctx.fillRect(0, footerY, W, footerH);
  ctx.restore();

  const titleText = "¡FELICITACIONES!";
  const titleS = fitText(ctx, titleText, 960, 72, 36, "system-ui, sans-serif", "900");
  const titleY = footerY + 20 + titleS;

  ctx.save();
  ctx.font = `900 ${titleS}px system-ui, sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(255,0,140,0.55)"; ctx.shadowBlur = 28;
  ctx.fillStyle = PINK;
  ctx.fillText(titleText, cx, titleY);
  ctx.shadowBlur = 0;
  ctx.fillStyle = WHITE;
  ctx.fillText(titleText, cx, titleY);
  ctx.restore();

  drawSparkles(ctx, cx, titleY - titleS * 0.4, 18, 280);

  const namePretty = (data.clientName || "").trim()
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  let afterNameY = titleY + 12;
  if (namePretty) {
    const nS = fitText(ctx, namePretty, 960, 66, 28, "system-ui, sans-serif", "900");
    afterNameY = titleY + 14 + nS;
    ctx.save();
    ctx.font = `900 ${nS}px system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.shadowColor = "rgba(0,0,0,0.50)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5;
    ctx.fillStyle = WHITE;
    ctx.fillText(namePretty, cx, afterNameY);
    ctx.restore();

    ctx.save();
    ctx.font = `900 ${nS}px system-ui, sans-serif`;
    const nW = Math.min(W - 80, ctx.measureText(namePretty).width + 60);
    const ulGrd = ctx.createLinearGradient(cx - nW / 2, 0, cx + nW / 2, 0);
    ulGrd.addColorStop(0, "transparent"); ulGrd.addColorStop(0.5, PINK); ulGrd.addColorStop(1, "transparent");
    ctx.fillStyle = ulGrd;
    ctx.fillRect(cx - nW / 2, afterNameY + 7, nW, 3);
    ctx.restore();
  }

  const logoAreaY = afterNameY + 16;
  const logoAreaH = 72;
  drawLogoImg(ctx, logoImg, 0, logoAreaY, W, logoAreaH);

  ctx.save();
  ctx.font = "400 17px system-ui, sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(255,255,255,0.38)";
  ctx.fillText("Gracias por elegirnos", cx, logoAreaY + logoAreaH + 20);
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
  const blob    = await new Promise(r => canvas.toBlob(r, mime, mime === "image/jpeg" ? quality : undefined));
  const dataURL = canvas.toDataURL(mime, mime === "image/jpeg" ? quality : undefined);
  return { blob, dataURL };
}
