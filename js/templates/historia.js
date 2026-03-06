import { drawCoverPanZoom, fitText, textStrokeFill } from "../draw.js";
import { cleanSpaces, formatKm, upper } from "../utils.js";
import { loadLogoOnce } from "./portadaFicha.js";

const LOGO_RATIO = 801 / 253;

const W = 1080;
const H = 1920;

const PINK     = "#ff008c";
const PINK_DIM = "rgba(255,0,140,0.55)";
const TEXT     = "#ffffff";
const TEXT_MID = "rgba(255,255,255,0.80)";

// ── 4 bloques perfectamente iguales ──────────────────────────────────────────
const BLOCK_H = H / 4; // 480px exactos cada uno

function blockRect(n) {
  return { x: 0, y: (n - 1) * BLOCK_H, w: W, h: BLOCK_H };
}

const SEP_BASE = { s1: BLOCK_H, s2: BLOCK_H * 2, s3: BLOCK_H * 3 };

function getSepY(story, key) {
  const off = Number(story?.separators?.[key]) || 0;
  return SEP_BASE[key] + Math.max(-48, Math.min(48, off));
}

// ── Rounded rect path ────────────────────────────────────────────────────────
function rr(ctx, x, y, w, h, r) {
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

// ── Separator ────────────────────────────────────────────────────────────────
function drawSeparator(ctx, y) {
  ctx.save();

  // Glow aura
  const g = ctx.createLinearGradient(0, y - 44, 0, y + 44);
  g.addColorStop(0,    "rgba(255,0,140,0)");
  g.addColorStop(0.42, "rgba(255,0,140,0.16)");
  g.addColorStop(0.5,  "rgba(255,0,140,0.30)");
  g.addColorStop(0.58, "rgba(255,0,140,0.16)");
  g.addColorStop(1,    "rgba(255,0,140,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, y - 44, W, 88);

  // Line — brighter at center
  const lg = ctx.createLinearGradient(0, 0, W, 0);
  lg.addColorStop(0,    "rgba(255,0,140,0.30)");
  lg.addColorStop(0.12, PINK);
  lg.addColorStop(0.88, PINK);
  lg.addColorStop(1,    "rgba(255,0,140,0.30)");
  ctx.fillStyle = lg;
  ctx.fillRect(0, y - 3, W, 6);

  // Centre diamond
  ctx.save();
  ctx.translate(W / 2, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = "#fff";
  ctx.fillRect(-6, -6, 12, 12);
  ctx.restore();

  // Edge dots
  [44, W - 44].forEach(dx => {
    ctx.beginPath();
    ctx.arc(dx, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = PINK;
    ctx.fill();
  });

  ctx.restore();
}

// ── Photo block ──────────────────────────────────────────────────────────────
function drawPhotoBlock(ctx, img, rect, transform, isActive) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();

  ctx.fillStyle = "#06060f";
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  if (img) {
    drawCoverPanZoom(ctx, img, rect.x, rect.y, rect.w, rect.h, transform);
    // Edge fade top
    const t = ctx.createLinearGradient(0, rect.y, 0, rect.y + 72);
    t.addColorStop(0, "rgba(0,0,0,0.42)");
    t.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = t;
    ctx.fillRect(rect.x, rect.y, rect.w, 72);
    // Edge fade bottom
    const b = ctx.createLinearGradient(0, rect.y + rect.h - 72, 0, rect.y + rect.h);
    b.addColorStop(0, "rgba(0,0,0,0)");
    b.addColorStop(1, "rgba(0,0,0,0.42)");
    ctx.fillStyle = b;
    ctx.fillRect(rect.x, rect.y + rect.h - 72, rect.w, 72);
  } else {
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let gx = rect.x; gx <= rect.x + rect.w; gx += 60) {
      ctx.beginPath(); ctx.moveTo(gx, rect.y); ctx.lineTo(gx, rect.y + rect.h); ctx.stroke();
    }
    for (let gy = rect.y; gy <= rect.y + rect.h; gy += 60) {
      ctx.beginPath(); ctx.moveTo(rect.x, gy); ctx.lineTo(rect.x + rect.w, gy); ctx.stroke();
    }
    ctx.font = "700 28px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SIN FOTO", rect.x + rect.w / 2, rect.y + rect.h / 2);
  }

  // Active overlay (preview only)
  if (isActive) {
    const vg = ctx.createRadialGradient(
      rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w * 0.25,
      rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w * 0.88
    );
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = vg;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    ctx.strokeStyle = PINK;
    ctx.lineWidth = 6;
    ctx.strokeRect(rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6);

    // Corner brackets
    const bl = 44, bt = 7;
    ctx.fillStyle = PINK;
    [
      [rect.x + 3,          rect.y + 3,          1,  1 ],
      [rect.x + rect.w - 3, rect.y + 3,          -1, 1 ],
      [rect.x + 3,          rect.y + rect.h - 3, 1,  -1],
      [rect.x + rect.w - 3, rect.y + rect.h - 3, -1, -1],
    ].forEach(([bx, by, sx, sy]) => {
      ctx.fillRect(bx, by - (bt / 2) * sy, sx * bl, bt);
      ctx.fillRect(bx - (bt / 2) * sx, by, bt, sy * bl);
    });

    // Badge
    const bh = 40, bp = 26;
    const btxt = "✎  EDITAR RECORTE";
    ctx.font = "700 18px system-ui, sans-serif";
    const bw = ctx.measureText(btxt).width + bp * 2;
    const bx2 = rect.x + (rect.w - bw) / 2;
    const by2 = rect.y + rect.h - bh - 16;
    rr(ctx, bx2, by2, bw, bh, bh / 2);
    ctx.fillStyle = "rgba(255,0,140,0.88)";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(btxt, rect.x + rect.w / 2, by2 + bh / 2);
  }

  ctx.restore();
}

// ── Data pill ─────────────────────────────────────────────────────────────────
// pillH ajustable para que quepa todo en 480px
function drawPill(ctx, label, value, cx, y, pillW, pillH) {
  if (!value) return;
  const r = Math.round(pillH * 0.28);
  const x = cx - pillW / 2;

  ctx.save();

  rr(ctx, x, y, pillW, pillH, r);
  const bg = ctx.createLinearGradient(x, y, x + pillW, y);
  bg.addColorStop(0,   "rgba(255,0,140,0.14)");
  bg.addColorStop(0.5, "rgba(255,0,140,0.07)");
  bg.addColorStop(1,   "rgba(255,0,140,0.13)");
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,0,140,0.32)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Accent bar left
  rr(ctx, x, y, 5, pillH, 2.5);
  ctx.fillStyle = PINK;
  ctx.fill();

  const fs  = Math.round(pillH * 0.37);
  const mid = y + pillH / 2;

  // Label
  ctx.font = `700 ${fs}px system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,0,140,0.92)";
  ctx.textAlign = "left";
  ctx.fillText(label.toUpperCase(), x + 22, mid);

  // Divider
  const lw = ctx.measureText(label.toUpperCase()).width;
  const dx = x + 22 + lw + 16;
  ctx.strokeStyle = "rgba(255,0,140,0.22)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(dx, y + pillH * 0.22);
  ctx.lineTo(dx, y + pillH * 0.78);
  ctx.stroke();

  // Value
  ctx.font = `800 ${Math.round(fs * 1.08)}px system-ui, sans-serif`;
  ctx.fillStyle = TEXT;
  ctx.textAlign = "right";
  ctx.fillText(value, x + pillW - 22, mid);

  ctx.restore();
}

// ── Data block ────────────────────────────────────────────────────────────────
function drawDataBlock(ctx, rect, data, logoImg) {
  ctx.save();

  // Background
  ctx.fillStyle = "#000";
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const bg = ctx.createRadialGradient(
    rect.x + rect.w/2, rect.y + rect.h/2, 10,
    rect.x + rect.w/2, rect.y + rect.h/2, rect.w * 0.70
  );
  bg.addColorStop(0, "#101020"); bg.addColorStop(1, "#000");
  ctx.fillStyle = bg;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  // Edge bleeds
  const eg1 = ctx.createLinearGradient(0, rect.y, 0, rect.y+70);
  eg1.addColorStop(0, "rgba(255,0,140,0.13)"); eg1.addColorStop(1, "rgba(255,0,140,0)");
  ctx.fillStyle = eg1; ctx.fillRect(rect.x, rect.y, rect.w, 70);
  const eg2 = ctx.createLinearGradient(0, rect.y+rect.h-70, 0, rect.y+rect.h);
  eg2.addColorStop(0, "rgba(255,0,140,0)"); eg2.addColorStop(1, "rgba(255,0,140,0.13)");
  ctx.fillStyle = eg2; ctx.fillRect(rect.x, rect.y+rect.h-70, rect.w, 70);

  const cx   = rect.x + rect.w / 2;
  const padX = 56;
  const maxW = rect.w - padX * 2;

  // Gather data
  const year     = String(data.year || "").trim();
  const km       = !data?.kmHidden ? formatKm(data.km) : "";
  const kmLine   = km ? `${km} KM` : "";
  const motorRaw = cleanSpaces(String(data.motorTraction || data.engine || "").trim());
  const gbRaw    = cleanSpaces(String(data.gearbox || "").trim());
  const gearbox  = gbRaw ? gbRaw.charAt(0).toUpperCase() + gbRaw.slice(1).toLowerCase() : "";
  const model    = cleanSpaces(upper(data.model || ""));
  const version  = cleanSpaces(upper(data.version || ""));

  const pills = [
    year     ? ["Año",   year]     : null,
    kmLine   ? ["KM",    kmLine]   : null,
    motorRaw ? ["Motor", motorRaw] : null,
    gearbox  ? ["Caja",  gearbox]  : null,
  ].filter(Boolean);
  const pillCount = pills.length;

  // Fixed zones
  // Logo zone at bottom: 44px logo + 8 margin + 2 line + 8 gap = 62
  const logoZone  = 62;
  const topPad    = 14;
  const innerH    = BLOCK_H - topPad - logoZone; // ~404px

  // Pills compactas — max 46px cada una
  const pillH     = pillCount > 0 ? Math.min(46, Math.max(36, Math.floor((innerH * 0.42) / Math.max(1, pillCount)))) : 0;
  const pillGap   = 7;
  const pillsTotal = pillCount * pillH + Math.max(0, pillCount-1) * pillGap;

  // Divider: 18px
  const divH = 18;
  // Version: fixed small
  const verZone = version ? 34 : 0;
  // Model: toda la zona restante → letra MÁS GRANDE
  const modelZone = innerH - pillsTotal - divH - verZone;

  const tmp = document.createElement("canvas").getContext("2d");
  // sModelMax ampliado: sin límite artificial, usa toda la zona
  const sModelMax = Math.max(52, Math.round(modelZone * 0.88));
  const sModel = model ? fitText(tmp, model, maxW, sModelMax, 52, "system-ui, sans-serif", "900") : 0;
  const sVer   = version ? fitText(tmp, version, maxW, 32, 18, "system-ui, sans-serif", "600") : 0;

  let curY = rect.y + topPad;

  // Model (huge)
  if (model) {
    textStrokeFill(ctx, model, cx, curY + sModel * 0.84, {
      font: `900 ${sModel}px system-ui, -apple-system, Segoe UI, sans-serif`,
      stroke: "rgba(0,0,0,0.94)",
      fill: TEXT,
      lineWidth: Math.max(8, Math.round(sModel * 0.12)),
      shadowColor: "rgba(255,0,140,0.35)",
      shadowBlur: 28,
      shadowOffsetY: 10,
      align: "center",
      baseline: "alphabetic",
    });
    curY += sModel + 8;
  }

  // Version
  if (version) {
    ctx.font = `500 ${sVer}px system-ui, sans-serif`;
    ctx.fillStyle = TEXT_MID;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(version, cx, curY + sVer);
    curY += sVer + 6;
  }

  // Divider
  const divW = 180;
  const dg = ctx.createLinearGradient(cx-divW/2,0,cx+divW/2,0);
  dg.addColorStop(0,"transparent"); dg.addColorStop(0.5,PINK); dg.addColorStop(1,"transparent");
  ctx.fillStyle = dg;
  ctx.fillRect(cx-divW/2, curY, divW, 2.5);
  ctx.save();
  ctx.translate(cx, curY+1.25); ctx.rotate(Math.PI/4);
  ctx.fillStyle = PINK; ctx.fillRect(-4,-4,8,8);
  ctx.restore();
  curY += divH;

  // Pills
  for (const [label, value] of pills) {
    drawPill(ctx, label, value, cx, curY, maxW, pillH);
    curY += pillH + pillGap;
  }

  // Logo anchored at bottom
  const logoH = 44;
  const logoY = rect.y + BLOCK_H - logoH - 10;
  const sg = ctx.createLinearGradient(cx-220,0,cx+220,0);
  sg.addColorStop(0,"transparent"); sg.addColorStop(0.5,"rgba(255,0,140,0.28)"); sg.addColorStop(1,"transparent");
  ctx.fillStyle = sg;
  ctx.fillRect(cx-220, logoY-8, 440, 1.5);

  if (logoImg) {
    const lw = Math.min(maxW * 0.82, logoH * LOGO_RATIO);
    const lh = lw / LOGO_RATIO;
    ctx.drawImage(logoImg, cx-lw/2, logoY+(logoH-lh)/2, lw, lh);
  }

  ctx.restore();
}

// ── Main draw
// ── Main draw ─────────────────────────────────────────────────────────────────
export function drawHistoria(ctx, images, data, story, logoImg) {
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

  const active = story?.activeBlock ?? null;

  drawPhotoBlock(ctx, images?.[b1?.imgIndex]?.img, r1, b1?.transform, active === 1);
  drawPhotoBlock(ctx, images?.[b2?.imgIndex]?.img, r2, b2?.transform, active === 2);
  drawDataBlock(ctx, r3, data, logoImg);
  drawPhotoBlock(ctx, images?.[b4?.imgIndex]?.img, r4, b4?.transform, active === 4);

  drawSeparator(ctx, getSepY(story, "s1"));
  drawSeparator(ctx, getSepY(story, "s2"));
  drawSeparator(ctx, getSepY(story, "s3"));
}

export async function renderHistoria({ images, data, story }) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const logoImg = await loadLogoOnce();
  drawHistoria(ctx, images, data, story ? { ...story, activeBlock: null } : story, logoImg);

  const format  = data?.__exportFormat || "jpg";
  const quality = Number(data?.__exportQuality ?? 0.92);
  const mime    = format === "png" ? "image/png" : "image/jpeg";

  const blob = await new Promise(r => canvas.toBlob(r, mime, mime === "image/jpeg" ? quality : undefined));
  const dataURL = canvas.toDataURL(mime, mime === "image/jpeg" ? quality : undefined);
  return { blob, dataURL };
}

export function historiaBlockFromY(y) {
  return Math.min(4, Math.max(1, Math.floor(y / BLOCK_H) + 1));
}