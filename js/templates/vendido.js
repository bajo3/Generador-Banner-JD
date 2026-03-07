import { drawCoverPanZoom, fitText } from "../draw.js";
import { formatKm, upper, cleanSpaces } from "../utils.js";
import { rr, pinkLine, drawLogoImg, PINK, BLACK, WHITE } from "./_shared.js";
import { loadLogoOnce } from "./portadaFicha.js";

const W = 1080;
const H = 1080;

export function drawVendido(ctx, img, data, transform = { zoom:1, panX:0, panY:0 }, logoImg) {
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, W, H);

  const headerH = 162;
  const footerH = 186;
  const footerY = H - footerH;
  const photoY  = headerH;
  const photoH  = footerY - headerH;
  const cx = W / 2;

  ctx.save();
  ctx.beginPath(); ctx.rect(0, photoY, W, photoH); ctx.clip();
  if (img) drawCoverPanZoom(ctx, img, 0, photoY, W, photoH, transform);
  ctx.fillStyle = "rgba(0,0,0,0.20)";
  ctx.fillRect(0, photoY, W, photoH);
  const vt = ctx.createLinearGradient(0, photoY, 0, photoY + 60);
  vt.addColorStop(0, "rgba(0,0,0,0.32)"); vt.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = vt; ctx.fillRect(0, photoY, W, 60);
  const vb = ctx.createLinearGradient(0, footerY - 60, 0, footerY);
  vb.addColorStop(0, "rgba(0,0,0,0)"); vb.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = vb; ctx.fillRect(0, footerY - 60, W, 60);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = BLACK; ctx.fillRect(0, 0, W, headerH);
  drawLogoImg(ctx, logoImg, 0, 0, W, headerH);
  pinkLine(ctx, headerH - 5);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = BLACK; ctx.fillRect(0, footerY, W, footerH);
  pinkLine(ctx, footerY);
  ctx.restore();

  const soldText = String(data.soldText || "VENDIDO").trim().toUpperCase();
  const photoMidY = photoY + photoH / 2;

  ctx.save();
  ctx.translate(cx, photoMidY);
  ctx.rotate(-Math.PI / 10);
  const bandW = 1020;
  const bandH = 158;
  ctx.shadowColor = "rgba(0,0,0,0.60)";
  ctx.shadowBlur  = 32;
  ctx.shadowOffsetY = 10;
  rr(ctx, -bandW / 2, -bandH / 2, bandW, bandH, 14);
  const bandGrd = ctx.createLinearGradient(-bandW / 2, -bandH / 2, bandW / 2, bandH / 2);
  bandGrd.addColorStop(0,   "#b5005e");
  bandGrd.addColorStop(0.4, PINK);
  bandGrd.addColorStop(1,   "#ff3da8");
  ctx.fillStyle = bandGrd;
  ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  rr(ctx, -bandW / 2, -bandH / 2, bandW, 3, 2);
  ctx.fillStyle = "rgba(255,255,255,0.24)";
  ctx.fill();
  rr(ctx, -bandW / 2, -bandH / 2, bandW, bandH, 14);
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 2;
  ctx.stroke();
  let soldSize = 104;
  ctx.font = `900 ${soldSize}px system-ui, sans-serif`;
  while (ctx.measureText(soldText).width > bandW - 120 && soldSize > 40) soldSize -= 4;
  ctx.font = `900 ${soldSize}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur  = 12;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = WHITE;
  ctx.fillText(soldText, 0, 2);
  ctx.restore();

  const model   = cleanSpaces(upper(data.model   || ""));
  const year    = String(data.year || "").trim();
  const version = cleanSpaces(upper(data.version || ""));
  const engine  = cleanSpaces(upper(data.engine  || ""));
  const kmTxt   = data.kmHidden ? "" : formatKm(data.km);
  const kmPart  = kmTxt ? `${kmTxt} KM` : "";
  const top = [model, year, version].filter(Boolean).join("  ·  ");
  const bot = [engine, kmPart].filter(Boolean).join("  ·  ");
  const maxW = 980;
  ctx.save();
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 8;
  if (top && bot) {
    const s1 = fitText(ctx, top, maxW, 48, 22, "system-ui, sans-serif", "900");
    ctx.font = `900 ${s1}px system-ui, sans-serif`; ctx.fillStyle = WHITE;
    ctx.fillText(top, cx, footerY + 60);
    const s2 = fitText(ctx, bot, maxW, 42, 20, "system-ui, sans-serif", "700");
    ctx.font = `700 ${s2}px system-ui, sans-serif`; ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.fillText(bot, cx, footerY + 134);
  } else {
    const single = top || bot;
    if (single) {
      const s = fitText(ctx, single, maxW, 54, 24, "system-ui, sans-serif", "900");
      ctx.font = `900 ${s}px system-ui, sans-serif`; ctx.fillStyle = WHITE;
      ctx.fillText(single, cx, footerY + footerH / 2 + 8);
    }
  }
  ctx.restore();
}

export async function renderVendido({ img, data, transform = { zoom:1, panX:0, panY:0 } }) {
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const logoImg = await loadLogoOnce();
  drawVendido(ctx, img, data, transform, logoImg);
  const format  = data?.__exportFormat || "jpg";
  const quality = Number(data?.__exportQuality ?? 0.92);
  const mime    = format === "png" ? "image/png" : "image/jpeg";
  const blob    = await new Promise(r => canvas.toBlob(r, mime, mime === "image/jpeg" ? quality : undefined));
  const dataURL = canvas.toDataURL(mime, mime === "image/jpeg" ? quality : undefined);
  return { blob, dataURL };
}
