import { drawCoverPanZoom, fitText, textStrokeFill } from "../draw.js";
import { cleanSpaces, formatKm, upper } from "../utils.js";

const W = 1080;
const H = 1920;

// Match the reference: BLACK band + magenta separators
const BG = "#000000";
const PINK = "#ff008c";
const TEXT = "#ffffff";

// 4 equal blocks
const BLOCK_H = Math.round(H / 4);

function blockRect(blockNo) {
  const i = blockNo - 1;
  return { x: 0, y: i * BLOCK_H, w: W, h: BLOCK_H };
}

function drawSeparator(ctx, y) {
  ctx.save();
  ctx.fillStyle = PINK;
  // Full-width separator aligned to the block boundary
  const th = 8;
  ctx.fillRect(0, y - th / 2, W, th);
  ctx.restore();
}

function drawPhotoBlock(ctx, img, rect, transform) {
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  if (img) drawCoverPanZoom(ctx, img, rect.x, rect.y, rect.w, rect.h, transform);
  ctx.restore();
}

function drawDataBlock(ctx, rect, data) {
  ctx.save();
  ctx.fillStyle = BG;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  // === Reference-style layout (same visual language as the classic banner) ===
  const cx = rect.x + rect.w / 2;
  const padX = 80;

  const model = cleanSpaces(upper(data.model || ""));
  const year = String(data.year || "").trim();
  const km = formatKm(data.km);
  const kmLine = km ? `${km}KM` : "";
  // Historia: bloque 3 debe ser simple y 100% legible (como la referencia):
  // 1) Modelo
  // 2) "KM  AÑO" en la misma línea
  // 3) "Caja: Manual" (capitalización normal)
  const gearboxRaw = cleanSpaces(String(data.gearbox || "").trim());
  const gearbox = gearboxRaw
    ? gearboxRaw.charAt(0).toUpperCase() + gearboxRaw.slice(1).toLowerCase()
    : "";

  // 1) Model (big)
  let y = rect.y + 135;
  const modelMaxW = rect.w - padX * 2;
  const sizeModel = fitText(ctx, model || " ", modelMaxW, 120, 72, "system-ui, sans-serif", "900");
  textStrokeFill(ctx, model, cx, y, {
    font: `900 ${sizeModel}px system-ui, -apple-system, Segoe UI, sans-serif`,
    stroke: "rgba(0,0,0,0.85)",
    fill: TEXT,
    lineWidth: Math.max(6, Math.round(sizeModel * 0.11)),
    shadowColor: "rgba(0,0,0,0.35)",
    shadowBlur: 16,
    shadowOffsetY: 6,
    align: "center",
    baseline: "alphabetic",
  });

  // 2) "KM  AÑO" (centrado, misma línea)
  y = rect.y + 255;
  const kmYearLine = cleanSpaces([kmLine, year].filter(Boolean).join(" "));
  if (kmYearLine) {
    const maxW = rect.w - padX * 2;
    const size = fitText(ctx, kmYearLine, maxW, 80, 44, "system-ui, sans-serif", "900");
    textStrokeFill(ctx, kmYearLine, cx, y, {
      font: `900 ${size}px system-ui, -apple-system, Segoe UI, sans-serif`,
      stroke: "rgba(0,0,0,0.80)",
      fill: TEXT,
      lineWidth: Math.max(5, Math.round(size * 0.10)),
      shadowColor: "rgba(0,0,0,0.30)",
      shadowBlur: 12,
      shadowOffsetY: 5,
      align: "center",
      baseline: "middle",
    });
  }

  // 3) Caja: Manual (centrado)
  y = rect.y + 360;
  if (gearbox) {
    const line = `Caja: ${gearbox}`;
    const maxW = rect.w - padX * 2;
    const size = fitText(ctx, line, maxW, 80, 40, "system-ui, sans-serif", "700");
    textStrokeFill(ctx, line, cx, y, {
      font: `700 ${size}px system-ui, -apple-system, Segoe UI, sans-serif`,
      stroke: "rgba(0,0,0,0.78)",
      fill: TEXT,
      lineWidth: Math.max(4, Math.round(size * 0.11)),
      shadowColor: "rgba(0,0,0,0.25)",
      shadowBlur: 10,
      shadowOffsetY: 4,
      align: "center",
      baseline: "middle",
    });
  }
  ctx.restore();
}

/**
 * story = {
 *  blocks: {
 *    1: { imgIndex: number, transform: {zoom,panX,panY} },
 *    3: { ... },
 *    4: { ... }
 *  }
 * }
 */
export function drawHistoria(ctx, images, data, story) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  const r1 = blockRect(1);
  const r2 = blockRect(2);
  const r3 = blockRect(3);
  const r4 = blockRect(4);

  // Photo blocks are 1, 2 and 4. Block 3 is the ONLY data/text block.
  const b1 = story?.blocks?.[1];
  const b2 = story?.blocks?.[2];
  const b4 = story?.blocks?.[4];

  const img1 = images?.[b1?.imgIndex]?.img;
  const img2 = images?.[b2?.imgIndex]?.img;
  const img4 = images?.[b4?.imgIndex]?.img;

  // Layout:
  // 1) Photo
  // 2) Photo
  // 3) Data (ONLY text)
  // 4) Photo
  drawPhotoBlock(ctx, img1, r1, b1?.transform);
  drawSeparator(ctx, r2.y);
  drawPhotoBlock(ctx, img2, r2, b2?.transform);
  drawSeparator(ctx, r3.y);
  drawDataBlock(ctx, r3, data);
  drawSeparator(ctx, r4.y);
  drawPhotoBlock(ctx, img4, r4, b4?.transform);
}

export async function renderHistoria({ images, data, story }) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  drawHistoria(ctx, images, data, story);

  const format = data?.__exportFormat || "jpg";
  const quality = Number(data?.__exportQuality ?? 0.92);
  const mime = format === "png" ? "image/png" : "image/jpeg";

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, mime, mime === "image/jpeg" ? quality : undefined)
  );
  const dataURL = canvas.toDataURL(mime, mime === "image/jpeg" ? quality : undefined);
  return { blob, dataURL };
}

export function historiaBlockFromY(y) {
  // returns 1..4
  const b = Math.min(4, Math.max(1, Math.floor(y / BLOCK_H) + 1));
  return b;
}
