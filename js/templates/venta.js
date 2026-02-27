import { drawCoverPanZoom, fitText } from "../draw.js";
import { formatKm, upper, cleanSpaces } from "../utils.js";

const W = 1080;
const H = 1080;

const MAGENTA = "#ff008c";
const BLACK = "#000000";

export function drawVenta(ctx, img, data, transform = { zoom: 1, panX: 0, panY: 0 }) {
// Layout like your classic "Ventas" banner
  const headerH = 180;
  const footerH = 210;
  const lineH = 6;

  // background
  ctx.fillStyle = "#111114";
  ctx.fillRect(0, 0, W, H);

  // header black
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, W, headerH);
  // magenta line under header
  ctx.fillStyle = MAGENTA;
  ctx.fillRect(0, headerH - lineH, W, lineH);

  // Header text: Jesús DIAZ / AUTOMOTORES
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
  // underline magenta
  const underlineW = 360;
  ctx.fillStyle = MAGENTA;
  ctx.fillRect((W-underlineW)/2, 108, underlineW, 6);

  ctx.fillStyle = "#fff";
  ctx.font = "700 34px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("AUTOMOTORES", W/2, 150);
  ctx.restore();

  // footer black
  const footerY = H - footerH;
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, footerY, W, footerH);
  // magenta line above footer
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

  // footer text: MODELO/AÑO/VERSIÓN/MOTOR/KM
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

export async function renderVenta({ img, data, transform = { zoom: 1, panX: 0, panY: 0 } }) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  drawVenta(ctx, img, data, transform);

  const format = data?.__exportFormat || "jpg";
  const quality = Number(data?.__exportQuality ?? 0.92);
  const mime = format === "png" ? "image/png" : "image/jpeg";

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, mime, mime === "image/jpeg" ? quality : undefined)
  );
  const dataURL = canvas.toDataURL(mime, mime === "image/jpeg" ? quality : undefined);

  return { blob, dataURL };
}
