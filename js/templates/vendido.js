import { drawCoverPanZoom, fitText } from "../draw.js";
import { formatKm, upper, cleanSpaces } from "../utils.js";

const W = 1080;
const H = 1080;

const MAGENTA = "#ff008c";
const BLACK = "#000000";

export function drawVendido(ctx, img, data, transform = { zoom: 1, panX: 0, panY: 0 }) {
// Base = Venta style
  const headerH = 180;
  const footerH = 210;
  const lineH = 6;

  ctx.fillStyle = "#111114";
  ctx.fillRect(0, 0, W, H);

  // header
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, W, headerH);
  ctx.fillStyle = MAGENTA;
  ctx.fillRect(0, headerH - lineH, W, lineH);

  ctx.save();
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  ctx.font = "900 78px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("Jesús DIAZ", W/2, 95);

  ctx.shadowBlur = 0;
  const underlineW = 360;
  ctx.fillStyle = MAGENTA;
  ctx.fillRect((W-underlineW)/2, 108, underlineW, 6);

  ctx.fillStyle = "#fff";
  ctx.font = "700 34px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("AUTOMOTORES", W/2, 150);
  ctx.restore();

  // footer
  const footerY = H - footerH;
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, footerY, W, footerH);
  ctx.fillStyle = MAGENTA;
  ctx.fillRect(0, footerY, W, lineH);

  // image area
  const contentY = headerH;
  const contentH = footerY - headerH;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, contentY, W, contentH);
  ctx.clip();
  drawCoverPanZoom(ctx, img, 0, contentY, W, contentH, transform);
  ctx.restore();

  // diagonal sold overlay
  const soldText = String(data.soldText || "VENDIDO").trim().toUpperCase() || "VENDIDO";

  ctx.save();
  ctx.translate(W/2, contentY + contentH/2);
  ctx.rotate(-Math.PI / 9); // ~ -20deg
  const bandW = 980;
  const bandH = 160;

  ctx.fillStyle = "rgba(255, 0, 0, 0.55)";
  roundRect(ctx, -bandW/2, -bandH/2, bandW, bandH, 18);
  ctx.fill();

  ctx.font = "900 96px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 6;
  ctx.fillText(soldText, 0, 6);
  ctx.restore();

  // footer line: MODELO/AÑO/VERSIÓN/MOTOR/KM
  const model = upper(data.model);
  const year = String(data.year || "").trim();
  const version = upper(data.version);
  const engine = upper(data.engine);
  const kmTxt = formatKm(data.km);
  const kmPart = kmTxt ? `${kmTxt}KM` : "";

  const mid = cleanSpaces([model, year, version, engine].filter(Boolean).join("/"));
  const line = cleanSpaces([mid, kmPart].filter(Boolean).join("/"));

  ctx.save();
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 6;

  const maxW = 980;
  let size = fitText(ctx, line || " ", maxW, 54, 26, "system-ui, -apple-system, Segoe UI, sans-serif", "900");
  ctx.font = `900 ${size}px system-ui, -apple-system, Segoe UI, sans-serif`;
  ctx.fillText(line || " ", W/2, footerY + footerH/2 + 8);
  ctx.restore();
}

export async function renderVendido({ img, data, transform = { zoom: 1, panX: 0, panY: 0 } }) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  drawVendido(ctx, img, data, transform);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92)
  );
  const dataURL = canvas.toDataURL("image/jpeg", 0.92);

  return { blob, dataURL };
}
function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
