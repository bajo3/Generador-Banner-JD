import { drawCoverPanZoom, textStrokeFill, fitText, avgLuminance } from "../draw.js";
import { formatKm, upper, cleanSpaces } from "../utils.js";

const W = 1080;
const H = 1080;

const BLUE = "rgba(0, 92, 255, 0.90)";
const BLUE_PILL = "rgba(0, 92, 255, 0.86)";
const FOOTER_TEXT = "#ffffff";

const BRAND_LEFT = "Jesus Diaz Automotores";
const BRAND_RIGHT = "Jesus Diaz Automotores";
const PHONE = "2494 587046";

export function drawPortadaFicha(ctx, img, data, transform = { zoom: 1, panX: 0, panY: 0 }) {
// Photo full
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  drawCoverPanZoom(ctx, img, 0, 0, W, H, transform);

  // subtle vignette for readability (very soft)
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "rgba(0,0,0,0.15)");
  grad.addColorStop(0.55, "rgba(0,0,0,0.06)");
  grad.addColorStop(1, "rgba(0,0,0,0.25)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Auto-contrast sampling (0..1): if background is bright, increase stroke + shadow.
  const lumTitle = avgLuminance(ctx, W * 0.12, 120, W * 0.76, 270);
  const titleShadowBlur = lumTitle > 0.65 ? 20 : 14;
  const titleShadowAlpha = lumTitle > 0.65 ? 0.35 : 0.22;
  const titleStrokeBoost = lumTitle > 0.65 ? 1.25 : 1.0;

  // Title (Marca / Modelo)
  const brand = upper(data.brand);
  const model = upper(data.model);
  const title1 = cleanSpaces(brand);
  const title2 = cleanSpaces(model);

  ctx.save();
  const titleMaxWidth = 1000;
  let size1 = fitText(ctx, title1 || " ", titleMaxWidth, 92, 56, "system-ui, sans-serif", "900");
  let size2 = fitText(ctx, title2 || " ", titleMaxWidth, 92, 56, "system-ui, sans-serif", "900");

  textStrokeFill(ctx, title1, W/2, 230, {
    font: `900 ${size1}px system-ui, -apple-system, Segoe UI, sans-serif`,
    stroke: "#000",
    fill: "#fff",
    lineWidth: Math.max(6, Math.round(size1 * 0.12 * titleStrokeBoost)),
    shadowColor: `rgba(0,0,0,${titleShadowAlpha})`,
    shadowBlur: titleShadowBlur,
    shadowOffsetY: 6,
    align: "center",
    baseline: "alphabetic",
  });

  textStrokeFill(ctx, title2, W/2, 330, {
    font: `900 ${size2}px system-ui, -apple-system, Segoe UI, sans-serif`,
    stroke: "#000",
    fill: "#fff",
    lineWidth: Math.max(6, Math.round(size2 * 0.12 * titleStrokeBoost)),
    shadowColor: `rgba(0,0,0,${titleShadowAlpha})`,
    shadowBlur: titleShadowBlur,
    shadowOffsetY: 6,
    align: "center",
    baseline: "alphabetic",
  });

  ctx.restore();

  // Blue pill (VERSION) centered in the middle
  const version = upper(data.version) || "";
  const pillText = cleanSpaces(version);
  const pillY = Math.round(H * 0.50);
  const pillPadX = 40;
  const pillPadY = 18;

  ctx.save();
  ctx.font = "900 54px system-ui, -apple-system, Segoe UI, sans-serif";
  const pillTextWidth = ctx.measureText(pillText || " ").width;
  const pillW = Math.min(W - 160, pillTextWidth + pillPadX * 2);
  const pillH = 84;
  const pillX = (W - pillW) / 2;
  const pillYTop = pillY - pillH/2;

  // rounded rect
  roundRect(ctx, pillX, pillYTop, pillW, pillH, 18);
  ctx.fillStyle = BLUE_PILL;
  ctx.fill();

  // pill text
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(pillText, W/2, pillY);
  ctx.restore();

  // Details below pill
  const kmTxt = formatKm(data.km);
  const kmLine = kmTxt ? `${kmTxt}KM` : "";
  const gearbox = upper(data.gearbox);
  const year = String(data.year || "").trim();
  const extra1 = cleanSpaces(data.extra1);
  const extra2 = cleanSpaces(data.extra2);

  let y = pillY + 110;

  // Auto-contrast for details zone
  const lumDetails = avgLuminance(ctx, W * 0.18, pillY + 40, W * 0.64, 320);
  const detailShadowAlpha = lumDetails > 0.65 ? 0.55 : 0.35;
  const detailShadowBlur = lumDetails > 0.65 ? 18 : 12;

  // big KM
  if (kmLine) {
    ctx.save();
    ctx.font = "900 74px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = `rgba(0,0,0,${detailShadowAlpha})`;
    ctx.shadowBlur = detailShadowBlur;
    ctx.shadowOffsetY = 6;
    ctx.fillText(kmLine, W/2, y);
    ctx.restore();
    y += 90;
  }

  // Caja / Año / Extras
  const lines = [];
  if (gearbox) lines.push(`Caja: ${gearbox}`);
  if (year) lines.push(`Año: ${year}`);
  if (extra1) lines.push(extra1);
  if (extra2) lines.push(extra2);

  ctx.save();
  ctx.font = "700 44px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = `rgba(0,0,0,${detailShadowAlpha})`;
  ctx.shadowBlur = Math.max(10, Math.round(detailShadowBlur * 0.85));
  ctx.shadowOffsetY = 5;

  for (const line of lines) {
    ctx.fillText(line, W/2, y);
    y += 58;
  }
  ctx.restore();

  // Bottom blue bar (fixed)
  const barH = 70;
  const barY = H - barH;

  ctx.save();
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, barY, W, barH);

  ctx.fillStyle = FOOTER_TEXT;
  ctx.font = "700 26px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.textBaseline = "middle";

  // left
  ctx.textAlign = "left";
  ctx.fillText(BRAND_LEFT, 24, barY + barH/2);

  // center phone
  ctx.textAlign = "center";
  ctx.fillText(PHONE, W/2, barY + barH/2);

  // right
  ctx.textAlign = "right";
  ctx.fillText(BRAND_RIGHT, W - 24, barY + barH/2);
  ctx.restore();
}

export async function renderPortadaFicha({ img, data, transform = { zoom: 1, panX: 0, panY: 0 } }) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  drawPortadaFicha(ctx, img, data, transform);

  const format = data?.__exportFormat || "jpg";
  const quality = Number(data?.__exportQuality ?? 0.92);
  const mime = format === "png" ? "image/png" : "image/jpeg";

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, mime, mime === "image/jpeg" ? quality : undefined)
  );
  const dataURL = canvas.toDataURL(mime, mime === "image/jpeg" ? quality : undefined);

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
