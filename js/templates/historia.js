import { drawCoverPanZoom, fitText, textStrokeFill } from "../draw.js";
import { cleanSpaces, formatKm, upper } from "../utils.js";

const W = 1080;
const H = 1920;

const PINK     = "#ff008c";
const TEXT     = "#ffffff";
const TEXT_MID = "rgba(255,255,255,0.85)";

// Layout: fotos más cortas, bloque de datos más alto para respirar
// Bloques 1, 2, 4 → 390px c/u  |  Bloque 3 (datos) → 750px
const PHOTO_H = 390;
const DATA_H  = H - PHOTO_H * 3;   // 1920 - 1170 = 750px

function blockRect(blockNo) {
  if (blockNo === 1) return { x: 0, y: 0,                          w: W, h: PHOTO_H };
  if (blockNo === 2) return { x: 0, y: PHOTO_H,                    w: W, h: PHOTO_H };
  if (blockNo === 3) return { x: 0, y: PHOTO_H * 2,                w: W, h: DATA_H  };
  if (blockNo === 4) return { x: 0, y: PHOTO_H * 2 + DATA_H,       w: W, h: PHOTO_H };
  return { x: 0, y: 0, w: W, h: PHOTO_H };
}

// Posición base de cada separador (borde superior del bloque siguiente)
const SEP_BASE = {
  s1: PHOTO_H,            // entre bloque 1 y 2
  s2: PHOTO_H * 2,        // entre bloque 2 y 3 (datos)
  s3: PHOTO_H * 2 + DATA_H, // entre bloque 3 y 4
};

function getSepY(story, key) {
  const offRaw = story?.separators?.[key];
  const off = Number.isFinite(Number(offRaw)) ? Number(offRaw) : 0;
  const maxOff = 48;
  return SEP_BASE[key] + Math.max(-maxOff, Math.min(maxOff, off));
}

// ─── Utility: rounded rect path ──────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Separator: gradient glow + solid line + accent diamonds ─────────────────
function drawSeparator(ctx, y) {
  ctx.save();

  // Glow halo
  const glowH = 40;
  const grd = ctx.createLinearGradient(0, y - glowH, 0, y + glowH);
  grd.addColorStop(0,   "rgba(255,0,140,0)");
  grd.addColorStop(0.45,"rgba(255,0,140,0.18)");
  grd.addColorStop(0.5, "rgba(255,0,140,0.28)");
  grd.addColorStop(0.55,"rgba(255,0,140,0.18)");
  grd.addColorStop(1,   "rgba(255,0,140,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, y - glowH, W, glowH * 2);

  // Main line with horizontal gradient (brighter center)
  const lineGrd = ctx.createLinearGradient(0, 0, W, 0);
  lineGrd.addColorStop(0,    "rgba(255,0,140,0.4)");
  lineGrd.addColorStop(0.15, PINK);
  lineGrd.addColorStop(0.85, PINK);
  lineGrd.addColorStop(1,    "rgba(255,0,140,0.4)");
  ctx.fillStyle = lineGrd;
  ctx.fillRect(0, y - 3, W, 6);

  // Diamond accent at center
  const dSize = 12;
  ctx.save();
  ctx.translate(W / 2, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = "#fff";
  ctx.fillRect(-dSize / 2, -dSize / 2, dSize, dSize);
  ctx.restore();

  // Small dot accents near edges
  const dotR = 5;
  [[54, y], [W - 54, y]].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(dx, dy, dotR, 0, Math.PI * 2);
    ctx.fillStyle = PINK;
    ctx.fill();
  });

  ctx.restore();
}

// ─── Photo block ─────────────────────────────────────────────────────────────
function drawPhotoBlock(ctx, img, rect, transform, isActive) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();

  ctx.fillStyle = "#080810";
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  if (img) {
    drawCoverPanZoom(ctx, img, rect.x, rect.y, rect.w, rect.h, transform);
    // Subtle inner shadow at top/bottom edges for depth
    const edgeGrd1 = ctx.createLinearGradient(0, rect.y, 0, rect.y + 60);
    edgeGrd1.addColorStop(0, "rgba(0,0,0,0.35)");
    edgeGrd1.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = edgeGrd1;
    ctx.fillRect(rect.x, rect.y, rect.w, 60);

    const edgeGrd2 = ctx.createLinearGradient(0, rect.y + rect.h - 60, 0, rect.y + rect.h);
    edgeGrd2.addColorStop(0, "rgba(0,0,0,0)");
    edgeGrd2.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = edgeGrd2;
    ctx.fillRect(rect.x, rect.y + rect.h - 60, rect.w, 60);
  } else {
    // Placeholder grid
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let gx = rect.x; gx <= rect.x + rect.w; gx += 60) {
      ctx.beginPath(); ctx.moveTo(gx, rect.y); ctx.lineTo(gx, rect.y + rect.h); ctx.stroke();
    }
    for (let gy = rect.y; gy <= rect.y + rect.h; gy += 60) {
      ctx.beginPath(); ctx.moveTo(rect.x, gy); ctx.lineTo(rect.x + rect.w, gy); ctx.stroke();
    }
    ctx.font = "700 30px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.13)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SIN FOTO", rect.x + rect.w / 2, rect.y + rect.h / 2);
  }

  // Active block overlay (preview only)
  if (isActive) {
    const vigGrd = ctx.createRadialGradient(
      rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w * 0.28,
      rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w * 0.85
    );
    vigGrd.addColorStop(0, "rgba(0,0,0,0)");
    vigGrd.addColorStop(1, "rgba(0,0,0,0.38)");
    ctx.fillStyle = vigGrd;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    ctx.strokeStyle = PINK;
    ctx.lineWidth = 7;
    ctx.strokeRect(rect.x + 3.5, rect.y + 3.5, rect.w - 7, rect.h - 7);

    const bLen = 50, bT = 8;
    ctx.fillStyle = PINK;
    const corners = [
      { bx: rect.x + 4,          by: rect.y + 4,          sx: 1,  sy: 1  },
      { bx: rect.x + rect.w - 4, by: rect.y + 4,          sx: -1, sy: 1  },
      { bx: rect.x + 4,          by: rect.y + rect.h - 4, sx: 1,  sy: -1 },
      { bx: rect.x + rect.w - 4, by: rect.y + rect.h - 4, sx: -1, sy: -1 },
    ];
    for (const { bx, by, sx, sy } of corners) {
      ctx.fillRect(bx, by - (bT / 2) * sy, sx * bLen, bT);
      ctx.fillRect(bx - (bT / 2) * sx, by, bT, sy * bLen);
    }

    const bH = 44, bPad = 28;
    const bTxt = "✎  EDITAR RECORTE";
    ctx.font = "700 20px system-ui, sans-serif";
    const bW = ctx.measureText(bTxt).width + bPad * 2;
    const bX = rect.x + (rect.w - bW) / 2;
    const bY = rect.y + rect.h - bH - 18;
    roundRect(ctx, bX, bY, bW, bH, bH / 2);
    ctx.fillStyle = "rgba(255,0,140,0.85)";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(bTxt, rect.x + rect.w / 2, bY + bH / 2);
  }

  ctx.restore();
}

// ─── Data pill ────────────────────────────────────────────────────────────────
function drawPill(ctx, label, value, cx, y, pillW, pillH) {
  if (!value) return;

  const r  = 16;
  const x  = cx - pillW / 2;

  ctx.save();

  // Pill background
  roundRect(ctx, x, y, pillW, pillH, r);
  const bgGrd = ctx.createLinearGradient(x, y, x + pillW, y);
  bgGrd.addColorStop(0,   "rgba(255,0,140,0.16)");
  bgGrd.addColorStop(0.5, "rgba(255,0,140,0.09)");
  bgGrd.addColorStop(1,   "rgba(255,0,140,0.14)");
  ctx.fillStyle = bgGrd;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,0,140,0.38)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Left accent bar
  roundRect(ctx, x, y, 6, pillH, 3);
  ctx.fillStyle = PINK;
  ctx.fill();

  const fontSize = Math.round(pillH * 0.38);
  const mid = y + pillH / 2;

  // Label
  ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,0,140,0.95)";
  ctx.textAlign = "left";
  ctx.fillText(label.toUpperCase(), x + 28, mid);

  // Vertical divider
  const labelW = ctx.measureText(label.toUpperCase()).width;
  const divX   = x + 28 + labelW + 20;
  ctx.strokeStyle = "rgba(255,0,140,0.25)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(divX, y + pillH * 0.20);
  ctx.lineTo(divX, y + pillH * 0.80);
  ctx.stroke();

  // Value
  ctx.font = `800 ${Math.round(fontSize * 1.08)}px system-ui, sans-serif`;
  ctx.fillStyle = TEXT;
  ctx.textAlign = "right";
  ctx.fillText(value, x + pillW - 26, mid);

  ctx.restore();
}

// ─── Data block (block 3) ─────────────────────────────────────────────────────
function drawDataBlock(ctx, rect, data) {
  ctx.save();

  // --- Background layers ---
  // Base dark
  ctx.fillStyle = "#000";
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  // Radial centre lift
  const bgGrd = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h * 0.42, 40,
    rect.x + rect.w / 2, rect.y + rect.h / 2,    rect.w * 0.78
  );
  bgGrd.addColorStop(0, "#121220");
  bgGrd.addColorStop(1, "#000000");
  ctx.fillStyle = bgGrd;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  // Top pink glow bleed (matches separator above)
  const topGrd = ctx.createLinearGradient(0, rect.y, 0, rect.y + 120);
  topGrd.addColorStop(0, "rgba(255,0,140,0.10)");
  topGrd.addColorStop(1, "rgba(255,0,140,0)");
  ctx.fillStyle = topGrd;
  ctx.fillRect(rect.x, rect.y, rect.w, 120);

  // Bottom pink glow bleed (matches separator below)
  const botGrd = ctx.createLinearGradient(0, rect.y + rect.h - 120, 0, rect.y + rect.h);
  botGrd.addColorStop(0, "rgba(255,0,140,0)");
  botGrd.addColorStop(1, "rgba(255,0,140,0.10)");
  ctx.fillStyle = botGrd;
  ctx.fillRect(rect.x, rect.y + rect.h - 120, rect.w, 120);

  const cx   = rect.x + rect.w / 2;
  const padX = 72;
  const maxW = rect.w - padX * 2;

  // Vertical center of content area (minus top/bottom padding)
  const contentPad = 70;  // breathing room top and bottom
  const contentTop = rect.y + contentPad;

  let curY = contentTop;

  // ── Brand pill ──────────────────────────────────────────────────────────────
  const brand = cleanSpaces(upper(data.brand || ""));
  if (brand) {
    const bH = 46;
    ctx.font = `800 22px system-ui, sans-serif`;
    const bW = ctx.measureText(brand).width + 56;
    const bX = cx - bW / 2;
    roundRect(ctx, bX, curY, bW, bH, bH / 2);
    ctx.fillStyle = PINK;
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(brand, cx, curY + bH / 2);
    curY += bH + 20;
  }

  // ── Model ───────────────────────────────────────────────────────────────────
  const model = cleanSpaces(upper(data.model || ""));
  if (model) {
    const sModel = fitText(ctx, model, maxW, 130, 60, "system-ui, sans-serif", "900");
    textStrokeFill(ctx, model, cx, curY + sModel * 0.86, {
      font: `900 ${sModel}px system-ui, -apple-system, Segoe UI, sans-serif`,
      stroke: "rgba(0,0,0,0.93)",
      fill: TEXT,
      lineWidth: Math.max(8, Math.round(sModel * 0.12)),
      shadowColor: "rgba(255,0,140,0.25)",
      shadowBlur: 32,
      shadowOffsetY: 10,
      align: "center",
      baseline: "alphabetic",
    });
    curY += sModel + 8;
  }

  // ── Version ─────────────────────────────────────────────────────────────────
  const version = cleanSpaces(upper(data.version || ""));
  if (version) {
    const sVer = fitText(ctx, version, maxW, 54, 28, "system-ui, sans-serif", "600");
    ctx.font = `600 ${sVer}px system-ui, sans-serif`;
    ctx.fillStyle = TEXT_MID;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(version, cx, curY + sVer);
    curY += sVer + 30;
  } else {
    curY += 20;
  }

  // ── Decorative divider ──────────────────────────────────────────────────────
  const divW = 220;
  const divGrd = ctx.createLinearGradient(cx - divW / 2, 0, cx + divW / 2, 0);
  divGrd.addColorStop(0,   "transparent");
  divGrd.addColorStop(0.5, PINK);
  divGrd.addColorStop(1,   "transparent");
  ctx.fillStyle = divGrd;
  ctx.fillRect(cx - divW / 2, curY, divW, 3);
  // Small diamond at center of divider
  ctx.save();
  ctx.translate(cx, curY + 1.5);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = PINK;
  ctx.fillRect(-5, -5, 10, 10);
  ctx.restore();
  curY += 32;

  // ── Data pills ──────────────────────────────────────────────────────────────
  const year     = String(data.year || "").trim();
  const km       = !data?.kmHidden ? formatKm(data.km) : "";
  const kmLine   = km ? `${km} KM` : "";
  const motorRaw = cleanSpaces(String(data.motorTraction || data.engine || "").trim());
  const gbRaw    = cleanSpaces(String(data.gearbox || "").trim());
  const gearbox  = gbRaw ? gbRaw.charAt(0).toUpperCase() + gbRaw.slice(1).toLowerCase() : "";

  const pills = [
    year     ? ["Año",   year]     : null,
    kmLine   ? ["KM",    kmLine]   : null,
    motorRaw ? ["Motor", motorRaw] : null,
    gearbox  ? ["Caja",  gearbox]  : null,
  ].filter(Boolean);

  const pillH   = 68;
  const pillGap = 14;
  const pillW   = maxW;

  for (const [label, value] of pills) {
    drawPill(ctx, label, value, cx, curY, pillW, pillH);
    curY += pillH + pillGap;
  }

  // ── Footer branding ─────────────────────────────────────────────────────────
  // Anchored to bottom of the block with breathing room
  const footerY = rect.y + rect.h - contentPad;

  // Divider line
  const fDivW = 340;
  const fGrd = ctx.createLinearGradient(cx - fDivW / 2, 0, cx + fDivW / 2, 0);
  fGrd.addColorStop(0,   "transparent");
  fGrd.addColorStop(0.5, "rgba(255,0,140,0.45)");
  fGrd.addColorStop(1,   "transparent");
  ctx.fillStyle = fGrd;
  ctx.fillRect(cx - fDivW / 2, footerY - 26, fDivW, 1.5);

  ctx.font = "700 26px system-ui, sans-serif";
  ctx.fillStyle = PINK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Jesús Díaz Automotores", cx, footerY - 2);

  ctx.restore();
}

// ─── Public draw ─────────────────────────────────────────────────────────────
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

  const active = story?.activeBlock ?? null;

  drawPhotoBlock(ctx, img1, r1, b1?.transform, active === 1);
  drawPhotoBlock(ctx, img2, r2, b2?.transform, active === 2);
  drawDataBlock(ctx, r3, data);
  drawPhotoBlock(ctx, img4, r4, b4?.transform, active === 4);

  // Separators always on top
  drawSeparator(ctx, getSepY(story, "s1"));
  drawSeparator(ctx, getSepY(story, "s2"));
  drawSeparator(ctx, getSepY(story, "s3"));
}

export async function renderHistoria({ images, data, story }) {
  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const exportStory = story ? { ...story, activeBlock: null } : story;
  drawHistoria(ctx, images, data, exportStory);

  const format  = data?.__exportFormat || "jpg";
  const quality = Number(data?.__exportQuality ?? 0.92);
  const mime    = format === "png" ? "image/png" : "image/jpeg";

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, mime, mime === "image/jpeg" ? quality : undefined)
  );
  const dataURL = canvas.toDataURL(mime, mime === "image/jpeg" ? quality : undefined);
  return { blob, dataURL };
}

// Block hit-test from Y coordinate (for pointer interaction)
export function historiaBlockFromY(y) {
  if (y < PHOTO_H)                      return 1;
  if (y < PHOTO_H * 2)                  return 2;
  if (y < PHOTO_H * 2 + DATA_H)         return 3;
  return 4;
}
