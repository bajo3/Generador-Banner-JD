import { drawCoverPanZoom, fitText } from "../draw.js";
import { upper, cleanSpaces } from "../utils.js";

const W = 1080;
const H = 1080;

const MAGENTA = "#ff008c";
const BLACK = "#000000";

export function drawFelicitaciones(ctx, img, data, transform = { zoom: 1, panX: 0, panY: 0 }) {
const headerH = 180;
  const footerH = 280;
  const lineH = 6;

  ctx.fillStyle = "#111114";
  ctx.fillRect(0, 0, W, H);

  // header
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, W, headerH);
  ctx.fillStyle = MAGENTA;
  ctx.fillRect(0, headerH - lineH, W, lineH);

  // Header text
  ctx.save();
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.font = "900 78px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("Jesús DIAZ", W/2, 95);
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

  // image
  const contentY = headerH;
  const contentH = footerY - headerH;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, contentY, W, contentH);
  ctx.clip();
  drawCoverPanZoom(ctx, img, 0, contentY, W, contentH, transform);
  ctx.restore();

  // Footer texts
  const title = "FELICITACIONES!!";
  const name = upper(data.clientName) || "";

  // title styled
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "rgba(255,0,140,0.30)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;

  ctx.font = "900 74px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(title, W/2, footerY + 110);
  ctx.restore();

  // name spaced
  ctx.save();
  const nameClean = cleanSpaces(name);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 6;

  const maxW = 980;
  let size = fitText(ctx, nameClean || " ", maxW, 48, 26, "system-ui, -apple-system, Segoe UI, sans-serif", "800");
  ctx.font = `800 ${size}px system-ui, -apple-system, Segoe UI, sans-serif`;

  ctx.fillText(nameClean || " ", W/2, footerY + 200);
  ctx.restore();
}

export async function renderFelicitaciones({ img, data, transform = { zoom: 1, panX: 0, panY: 0 } }) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  drawFelicitaciones(ctx, img, data, transform);

  const format = data?.__exportFormat || "jpg";
  const quality = Number(data?.__exportQuality ?? 0.92);
  const mime = format === "png" ? "image/png" : "image/jpeg";

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, mime, mime === "image/jpeg" ? quality : undefined)
  );
  const dataURL = canvas.toDataURL(mime, mime === "image/jpeg" ? quality : undefined);

  return { blob, dataURL };
}
