import { drawCoverPanZoom, fitText, textStrokeFill } from "../draw.js";
import { cleanSpaces, formatKm, upper } from "../utils.js";

const W = 1080;
const H = 1920;

const BG       = "#000000";
const PINK     = "#ff008c";
const TEXT     = "#ffffff";
const TEXT_MID = "rgba(255,255,255,0.88)";

// 4 equal blocks: 480px each
const BLOCK_H = Math.round(H / 4);

function blockRect(blockNo) {
  const i = blockNo - 1;
  return { x: 0, y: i * BLOCK_H, w: W, h: BLOCK_H };
}

function getSepY(story, baseY, key) {
  const offRaw = story?.separators?.[key];
  const off = Number.isFinite(Number(offRaw)) ? Number(offRaw) : 0;
  const maxOff = 48;
  return baseY + Math.max(-maxOff, Math.min(maxOff, off));
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

// ─── Separator: gradient glow + solid line + accent dots ─────────────────────
function drawSeparator(ctx, y) {
  ctx.save();

  // Glow halo
  const glowH = 36;
  const grd = ctx.createLinearGradient(0, y - glowH, 0, y + glowH);
  grd.addColorStop(0,   "rgba(255,0,140,0)");
  grd.addColorStop(0.5, "rgba(255,0,140,0.20)");
  grd.addColorStop(1,   "rgba(255,0,140,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, y - glowH, W, glowH * 2);

  // Main line
  const th = 6;
  ctx.fillStyle = PINK;
  ctx.fillRect(0, y - th / 2, W, th);

  // Accent dots at both ends
  const dotR = 7;
  [[dotR * 2.5, y], [W - dotR * 2.5, y]].forEach(([dx, dy]) => {
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
  } else {
    // Placeholder
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let gx = rect.x; gx <= rect.x + rect.w; gx += 60) {
      ctx.beginPath(); ctx.moveTo(gx, rect.y); ctx.lineTo(gx, rect.y + rect.h); ctx.stroke();
    }
    for (let gy = rect.y; gy <= rect.y + rect.h; gy += 60) {
      ctx.beginPath(); ctx.moveTo(rect.x, gy); ctx.lineTo(rect.x + rect.w, gy); ctx.stroke();
    }
    ctx.font = "700 32px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SIN FOTO", rect.x + rect.w / 2, rect.y + rect.h / 2);
  }

  // Active block overlay (only during preview, not export)
  if (isActive) {
    // Semi-transparent dark vignette at corners
    const vigGrd = ctx.createRadialGradient(
      rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w * 0.3,
      rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w * 0.9
    );
    vigGrd.addColorStop(0, "rgba(0,0,0,0)");
    vigGrd.addColorStop(1, "rgba(0,0,0,0.40)");
    ctx.fillStyle = vigGrd;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    // Border
    ctx.strokeStyle = PINK;
    ctx.lineWidth = 7;
    ctx.strokeRect(rect.x + 3.5, rect.y + 3.5, rect.w - 7, rect.h - 7);

    // Corner brackets (L-shaped)
    const bLen = 50, bThick = 8;
    ctx.fillStyle = PINK;
    const corners = [
      { cx: rect.x + 4,           cy: rect.y + 4,           sx: 1,  sy: 1  },
      { cx: rect.x + rect.w - 4,  cy: rect.y + 4,           sx: -1, sy: 1  },
      { cx: rect.x + 4,           cy: rect.y + rect.h - 4,  sx: 1,  sy: -1 },
      { cx: rect.x + rect.w - 4,  cy: rect.y + rect.h - 4,  sx: -1, sy: -1 },
    ];
    for (const { cx: bx, cy: by, sx, sy } of corners) {
      ctx.fillRect(bx, by - bThick / 2 * sy, sx * bLen, bThick);
      ctx.fillRect(bx - bThick / 2 * sx, by, bThick, sy * bLen);
    }

    // "EDITAR" badge at bottom-center
    const badgeH  = 44, badgePad = 24;
    const badgeTxt = "✎  EDITAR RECORTE";
    ctx.font = `700 20px system-ui, sans-serif`;
    const badgeW = ctx.measureText(badgeTxt).width + badgePad * 2;
    const bX2 = rect.x + (rect.w - badgeW) / 2;
    const bY2 = rect.y + rect.h - badgeH - 18;
    roundRect(ctx, bX2, bY2, badgeW, badgeH, badgeH / 2);
    ctx.fillStyle = "rgba(255,0,140,0.82)";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badgeTxt, rect.x + rect.w / 2, bY2 + badgeH / 2);
  }

  ctx.restore();
}

// ─── Data pill (label + value row) ───────────────────────────────────────────
function drawPill(ctx, label, value, cx, y, pillW, pillH) {
  if (!value) return;

  const r = 14;
  const x = cx - pillW / 2;

  ctx.save();

  // Background
  roundRect(ctx, x, y, pillW, pillH, r);
  const bgGrd = ctx.createLinearGradient(x, y, x + pillW, y + pillH);
  bgGrd.addColorStop(0, "rgba(255,0,140,0.13)");
  bgGrd.addColorStop(1, "rgba(255,0,140,0.05)");
  ctx.fillStyle = bgGrd;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,0,140,0.35)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const fontSize = Math.round(pillH * 0.40);
  const padH = pillH / 2;

  // Label
  ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,0,140,0.90)";
  ctx.textAlign = "left";
  ctx.fillText(label.toUpperCase(), x + 24, y + padH);

  // Divider
  const labelW = ctx.measureText(label.toUpperCase()).width;
  const divX   = x + 24 + labelW + 16;
  ctx.strokeStyle = "rgba(255,0,140,0.28)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(divX, y + pillH * 0.22);
  ctx.lineTo(divX, y + pillH * 0.78);
  ctx.stroke();

  // Value
  ctx.font = `800 ${Math.round(fontSize * 1.05)}px system-ui, sans-serif`;
  ctx.fillStyle = TEXT;
  ctx.textAlign = "right";
  ctx.fillText(value, x + pillW - 24, y + padH);

  ctx.restore();
}

// ─── Data block (block 3) ─────────────────────────────────────────────────────
function drawDataBlock(ctx, rect, data) {
  ctx.save();

  // Background: deep dark with subtle radial lift
  const bgGrd = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h * 0.45, 60,
    rect.x + rect.w / 2, rect.y + rect.h / 2,   rect.w * 0.80
  );
  bgGrd.addColorStop(0, "#101018");
  bgGrd.addColorStop(1, "#000000");
  ctx.fillStyle = bgGrd;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  // Subtle bottom-left corner glow
  const cGrd = ctx.createRadialGradient(rect.x, rect.y + rect.h, 0, rect.x, rect.y + rect.h, 400);
  cGrd.addColorStop(0, "rgba(255,0,140,0.06)");
  cGrd.addColorStop(1, "rgba(255,0,140,0)");
  ctx.fillStyle = cGrd;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  const cx   = rect.x + rect.w / 2;
  const padX = 64;
  const maxW = rect.w - padX * 2;

  let curY = rect.y + 50;

  // ── Brand pill ──────────────────────────────────────────────────────────────
  const brand = cleanSpaces(upper(data.brand || ""));
  if (brand) {
    const bH = 42, bFontSize = 22;
    ctx.font = `800 ${bFontSize}px system-ui, sans-serif`;
    const bW = ctx.measureText(brand).width + 52;
    const bX = cx - bW / 2;
    roundRect(ctx, bX, curY, bW, bH, bH / 2);
    ctx.fillStyle = PINK;
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(brand, cx, curY + bH / 2);
    curY += bH + 16;
  }

  // ── Model (large) ───────────────────────────────────────────────────────────
  const model = cleanSpaces(upper(data.model || ""));
  if (model) {
    const sModel = fitText(ctx, model, maxW, 120, 56, "system-ui, sans-serif", "900");
    textStrokeFill(ctx, model, cx, curY + sModel * 0.85, {
      font: `900 ${sModel}px system-ui, -apple-system, Segoe UI, sans-serif`,
      stroke: "rgba(0,0,0,0.92)",
      fill: TEXT,
      lineWidth: Math.max(8, Math.round(sModel * 0.12)),
      shadowColor: "rgba(255,0,140,0.22)",
      shadowBlur: 28,
      shadowOffsetY: 10,
      align: "center",
      baseline: "alphabetic",
    });
    curY += sModel + 6;
  }

  // ── Version ─────────────────────────────────────────────────────────────────
  const version = cleanSpaces(upper(data.version || ""));
  if (version) {
    const sVer = fitText(ctx, version, maxW, 50, 26, "system-ui, sans-serif", "600");
    ctx.font = `600 ${sVer}px system-ui, sans-serif`;
    ctx.fillStyle = TEXT_MID;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(version, cx, curY + sVer);
    curY += sVer + 26;
  } else {
    curY += 18;
  }

  // ── Decorative divider ──────────────────────────────────────────────────────
  const divW = 200;
  const divGrd = ctx.createLinearGradient(cx - divW / 2, 0, cx + divW / 2, 0);
  divGrd.addColorStop(0,   "transparent");
  divGrd.addColorStop(0.5, PINK);
  divGrd.addColorStop(1,   "transparent");
  ctx.fillStyle = divGrd;
  ctx.fillRect(cx - divW / 2, curY, divW, 3);
  curY += 22;

  // ── Data pills ──────────────────────────────────────────────────────────────
  const year     = String(data.year || "").trim();
  const km       = !data?.kmHidden ? formatKm(data.km) : "";
  const kmLine   = km ? `${km} KM` : "";
  const motorRaw = cleanSpaces(String(data.motorTraction || data.engine || "").trim());
  const gbRaw    = cleanSpaces(String(data.gearbox || "").trim());
  const gearbox  = gbRaw ? gbRaw.charAt(0).toUpperCase() + gbRaw.slice(1).toLowerCase() : "";

  const pills = [
    year     ? ["Año",    year]     : null,
    kmLine   ? ["KM",     kmLine]   : null,
    motorRaw ? ["Motor",  motorRaw] : null,
    gearbox  ? ["Caja",   gearbox]  : null,
  ].filter(Boolean);

  const pillH   = 62;
  const pillGap = 12;
  const pillW   = maxW;

  for (const [label, value] of pills) {
    drawPill(ctx, label, value, cx, curY, pillW, pillH);
    curY += pillH + pillGap;
  }

  // ── Footer branding ─────────────────────────────────────────────────────────
  const footerY = rect.y + rect.h - 52;
  // Thin divider
  ctx.fillStyle = "rgba(255,0,140,0.30)";
  ctx.fillRect(cx - 160, footerY - 12, 320, 1);

  ctx.font = "700 24px system-ui, sans-serif";
  ctx.fillStyle = PINK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Jesús Díaz Automotores", cx, footerY + 10);

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
  drawSeparator(ctx, getSepY(story, r2.y, "s1"));
  drawSeparator(ctx, getSepY(story, r3.y, "s2"));
  drawSeparator(ctx, getSepY(story, r4.y, "s3"));
}

export async function renderHistoria({ images, data, story }) {
  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Export without active-block overlay
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

export function historiaBlockFromY(y) {
  return Math.min(4, Math.max(1, Math.floor(y / BLOCK_H) + 1));
}
