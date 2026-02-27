import { drawCoverPanZoom, fitText, textStrokeFill } from "../draw.js";
import { cleanSpaces, formatKm, upper } from "../utils.js";

const W = 1080;
const H = 1920;

// Match the reference: BLACK band + magenta separators
const BG = "#000000";
const PINK = "#ff008c";
const TEXT = "#ffffff";

// Historia base layout: 4 equal blocks (fixed). Separators can be moved visually,
// but blocks (and crops) remain fixed so the violet rectangles always fill correctly.
const BLOCK_H = Math.round(H / 4);

// Visual separator dragging limits (px)
const SEP_BAND = 120;     // how far each line can move from its default position
const SEP_MIN_GAP = 180;  // safety gap between separators

function defaultSeparators() {
  return { s1: BLOCK_H, s2: BLOCK_H * 2, s3: BLOCK_H * 3 };
}

function clampSep(value, base) {
  return Math.max(base - SEP_BAND, Math.min(base + SEP_BAND, value));
}

function getSeparators(story) {
  const base = defaultSeparators();
  const s = story?.separators || story?.splits; // backward compat if older state exists
  const s1 = Number(s?.s1);
  const s2 = Number(s?.s2);
  const s3 = Number(s?.s3);

  let out = {
    s1: Number.isFinite(s1) ? clampSep(s1, base.s1) : base.s1,
    s2: Number.isFinite(s2) ? clampSep(s2, base.s2) : base.s2,
    s3: Number.isFinite(s3) ? clampSep(s3, base.s3) : base.s3,
  };

  // Ensure ordering and minimum gap (just in case)
  out.s1 = Math.min(out.s1, out.s2 - SEP_MIN_GAP);
  out.s2 = Math.min(out.s2, out.s3 - SEP_MIN_GAP);
  out.s3 = Math.min(out.s3, H - 40);

  out.s1 = Math.max(40, out.s1);
  out.s2 = Math.max(out.s1 + SEP_MIN_GAP, out.s2);
  out.s3 = Math.max(out.s2 + SEP_MIN_GAP, out.s3);

  return out;
}

function blockRect(blockNo) {
  const y0 = 0;
  const y1 = BLOCK_H;
  const y2 = BLOCK_H * 2;
  const y3 = BLOCK_H * 3;
  const y4 = H;
  if (blockNo === 1) return { x: 0, y: y0, w: W, h: y1 - y0 };
  if (blockNo === 2) return { x: 0, y: y1, w: W, h: y2 - y1 };
  if (blockNo === 3) return { x: 0, y: y2, w: W, h: y3 - y2 };
  return { x: 0, y: y3, w: W, h: y4 - y3 };
}

function drawSeparator(ctx, y) {
  ctx.save();
  ctx.fillStyle = PINK;
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

  // Clip to the violet rectangle area so text never spills into other blocks.
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();

  const cx = rect.x + rect.w / 2;
  const padX = 80;

  const model = cleanSpaces(upper(data.model || ""));
  const year = String(data.year || "").trim();
  const km = data?.kmHidden ? "" : formatKm(data.km);
  const kmLine = km ? `${km}KM` : "";

  const engine = cleanSpaces(String(data.engine || "").trim());
  const motorTraction = cleanSpaces(String(data.motorTraction || "").trim());

  const gearboxRaw = cleanSpaces(String(data.gearbox || "").trim());
  const gearbox = gearboxRaw
    ? gearboxRaw.charAt(0).toUpperCase() + gearboxRaw.slice(1).toLowerCase()
    : "";

  const maxW = rect.w - padX * 2;

  // Vertical layout within fixed block height (480)
  const yTop = rect.y;
  const yModel = yTop + 135;
  const yLine2 = yTop + 245;
  const yLine3 = yTop + 330;
  const yLine4 = yTop + 405;

  // 1) Model (big)
  const sizeModel = fitText(ctx, model || " ", maxW, 120, 68, "system-ui, sans-serif", "900");
  textStrokeFill(ctx, model, cx, yModel, {
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

  // 2) "KM  AÑO" (if any)
  const kmYearLine = cleanSpaces([kmLine, year].filter(Boolean).join(" "));
  if (kmYearLine) {
    const size = fitText(ctx, kmYearLine, maxW, 74, 42, "system-ui, sans-serif", "900");
    textStrokeFill(ctx, kmYearLine, cx, yLine2, {
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

  // 3) Motor / Tracción (optional)
  const motorLine = cleanSpaces(
    [engine ? `Motor: ${engine}` : "", motorTraction ? motorTraction : ""].filter(Boolean).join(" · ")
  );
  if (motorLine) {
    const size = fitText(ctx, motorLine, maxW, 62, 34, "system-ui, sans-serif", "800");
    textStrokeFill(ctx, motorLine, cx, yLine3, {
      font: `800 ${size}px system-ui, -apple-system, Segoe UI, sans-serif`,
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

  // 4) Caja (optional)
  if (gearbox) {
    const line = `Caja: ${gearbox}`;
    const size = fitText(ctx, line, maxW, 58, 32, "system-ui, sans-serif", "750");
    textStrokeFill(ctx, line, cx, yLine4, {
      font: `750 ${size}px system-ui, -apple-system, Segoe UI, sans-serif`,
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
 *  blocks: { 1,2,4 with imgIndex + transform },
 *  separators: { s1, s2, s3 }  // OPTIONAL visual separator positions
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

  const b1 = story?.blocks?.[1];
  const b2 = story?.blocks?.[2];
  const b4 = story?.blocks?.[4];

  const img1 = images?.[b1?.imgIndex]?.img;
  const img2 = images?.[b2?.imgIndex]?.img;
  const img4 = images?.[b4?.imgIndex]?.img;

  // Draw blocks first
  drawPhotoBlock(ctx, img1, r1, b1?.transform);
  drawPhotoBlock(ctx, img2, r2, b2?.transform);
  drawDataBlock(ctx, r3, data);
  drawPhotoBlock(ctx, img4, r4, b4?.transform);

  // Draw separators LAST so they always sit above photos.
  const seps = getSeparators(story);
  drawSeparator(ctx, seps.s1);
  drawSeparator(ctx, seps.s2);
  drawSeparator(ctx, seps.s3);
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

// Block detection stays FIXED (4 equal blocks) so crop rectangles are always stable.
export function historiaBlockFromY(y) {
  const yy = Number(y) || 0;
  if (yy < BLOCK_H) return 1;
  if (yy < BLOCK_H * 2) return 2;
  if (yy < BLOCK_H * 3) return 3;
  return 4;
}

// Export these constants for the editor logic (optional)
export const HISTORIA_BLOCK_H = BLOCK_H;
export const HISTORIA_SEP_BAND = SEP_BAND;
