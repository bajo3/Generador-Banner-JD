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

// ── Celda de la grilla: label arriba + valor grande abajo ─────────────────────
function drawCell(ctx, label, value, x, y, w, h) {
  if (!value) return;

  ctx.save();

  // Fondo de la celda
  rr(ctx, x, y, w, h, 14);
  const bg = ctx.createLinearGradient(x, y, x, y + h);
  bg.addColorStop(0, "rgba(255,0,140,0.13)");
  bg.addColorStop(1, "rgba(255,0,140,0.05)");
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,0,140,0.30)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Línea de acento superior
  rr(ctx, x, y, w, 4, 2);
  ctx.fillStyle = PINK;
  ctx.fill();

  const padX = 14;
  const cx = x + w / 2;

  // Label — chico, rosa, arriba
  const labelFS = Math.round(h * 0.20);
  ctx.font = `700 ${labelFS}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(255,0,140,0.85)";
  ctx.fillText(label.toUpperCase(), cx, y + 10);

  // Value — grande, blanco, centrado verticalmente en la zona inferior
  const maxValW = w - padX * 2;
  const valFS = fitText(ctx, value, maxValW, Math.round(h * 0.42), Math.round(h * 0.22), "system-ui, sans-serif", "800");
  ctx.font = `800 ${valFS}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = TEXT;
  ctx.shadowColor = "rgba(0,0,0,0.40)";
  ctx.shadowBlur = 6;
  ctx.fillText(value, cx, y + h * 0.62);
  ctx.shadowBlur = 0;

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
    rect.x + rect.w/2, rect.y + rect.h/2, rect.w * 0.72
  );
  bg.addColorStop(0, "#101020"); bg.addColorStop(1, "#000");
  ctx.fillStyle = bg;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  // Edge bleeds rosados
  const eg1 = ctx.createLinearGradient(0, rect.y, 0, rect.y+60);
  eg1.addColorStop(0, "rgba(255,0,140,0.13)"); eg1.addColorStop(1, "rgba(255,0,140,0)");
  ctx.fillStyle = eg1; ctx.fillRect(rect.x, rect.y, rect.w, 60);
  const eg2 = ctx.createLinearGradient(0, rect.y+rect.h-60, 0, rect.y+rect.h);
  eg2.addColorStop(0, "rgba(255,0,140,0)"); eg2.addColorStop(1, "rgba(255,0,140,0.13)");
  ctx.fillStyle = eg2; ctx.fillRect(rect.x, rect.y+rect.h-60, rect.w, 60);

  const cx   = rect.x + rect.w / 2;
  const padX = 44;
  const maxW = rect.w - padX * 2;

  // ── Datos ──────────────────────────────────────────────────────────────────
  const year     = String(data.year || "").trim();
  const km       = !data?.kmHidden ? formatKm(data.km) : "";
  const kmLine   = km ? `${km} KM` : "";
  const motorRaw = cleanSpaces(String(data.motorTraction || data.engine || "").trim());
  const gbRaw    = cleanSpaces(String(data.gearbox || "").trim());
  const gearbox  = gbRaw ? gbRaw.charAt(0).toUpperCase() + gbRaw.slice(1).toLowerCase() : "";
  const model    = cleanSpaces(upper(data.model || ""));
  const version  = cleanSpaces(upper(data.version || ""));

  // Celdas disponibles — hasta 4 items en grilla 2×2
  const cellItems = [
    year     ? ["AÑO",    year]     : null,
    kmLine   ? ["KM",     kmLine]   : null,
    motorRaw ? ["MOTOR",  motorRaw] : null,
    gearbox  ? ["CAJA",   gearbox]  : null,
  ].filter(Boolean);

  // ── Layout vertical ────────────────────────────────────────────────────────
  // Zona logo: 52px abajo
  // Zona encabezado (modelo + versión): arriba
  // Zona grilla: resto

  const logoZoneH = 52;
  const topPad    = 10;
  const botPad    = logoZoneH + 6;
  const totalInner = BLOCK_H - topPad - botPad;  // ~410px

  // Modelo grande arriba
  const tmp = document.createElement("canvas").getContext("2d");
  const sModelMax = Math.min(108, Math.max(48, Math.round(totalInner * 0.28)));
  const sModel = model ? fitText(tmp, model, maxW, sModelMax, 48, "system-ui, sans-serif", "900") : 0;

  // Versión en pill ancha debajo del modelo
  const vPillH = version ? Math.round(totalInner * 0.13) : 0;  // ~13% = ~53px
  const sVer   = version ? fitText(tmp, version, maxW - 60, vPillH * 0.55, 16, "system-ui, sans-serif", "700") : 0;

  // Espacio entre modelo y grilla
  const gapAfterHeader = 10;
  const headerH = sModel + (version ? vPillH + 8 : 0) + gapAfterHeader;

  // Grilla ocupa el resto
  const gridH = totalInner - headerH;
  const rows  = cellItems.length <= 2 ? 1 : 2;
  const cols  = cellItems.length === 1 ? 1 : 2;
  const gap   = 8;
  const cellW = Math.floor((maxW - gap * (cols - 1)) / cols);
  const cellH = Math.floor((gridH - gap * (rows - 1)) / rows);

  let curY = rect.y + topPad;

  // ── Modelo ─────────────────────────────────────────────────────────────────
  if (model) {
    textStrokeFill(ctx, model, cx, curY + sModel * 0.84, {
      font: `900 ${sModel}px system-ui, -apple-system, Segoe UI, sans-serif`,
      stroke: "rgba(0,0,0,0.94)",
      fill: TEXT,
      lineWidth: Math.max(7, Math.round(sModel * 0.11)),
      shadowColor: "rgba(255,0,140,0.30)",
      shadowBlur: 22,
      shadowOffsetY: 8,
      align: "center",
      baseline: "alphabetic",
    });
    curY += sModel + 6;
  }

  // ── Versión (pill ancha) ────────────────────────────────────────────────────
  if (version && vPillH > 0) {
    const pW = Math.min(maxW, ctx.measureText ? (() => {
      ctx.font = `700 ${sVer}px system-ui, sans-serif`;
      return ctx.measureText(version).width + 60;
    })() : maxW);
    const px = cx - pW / 2;
    rr(ctx, px, curY, pW, vPillH, vPillH / 2);
    const pg = ctx.createLinearGradient(px, curY, px + pW, curY);
    pg.addColorStop(0, "rgba(255,0,140,0.18)");
    pg.addColorStop(0.5, "rgba(255,0,140,0.09)");
    pg.addColorStop(1, "rgba(255,0,140,0.18)");
    ctx.fillStyle = pg; ctx.fill();
    ctx.strokeStyle = "rgba(255,0,140,0.35)"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.font = `700 ${sVer}px system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = TEXT_MID;
    ctx.fillText(version, cx, curY + vPillH / 2);
    curY += vPillH + 8;
  }

  curY += gapAfterHeader - 4;

  // ── Grilla de celdas ────────────────────────────────────────────────────────
  cellItems.forEach(([label, value], i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx2 = rect.x + padX + col * (cellW + gap);
    const cy2 = curY + row * (cellH + gap);
    drawCell(ctx, label, value, cx2, cy2, cellW, cellH);
  });

  // ── Logo al fondo ───────────────────────────────────────────────────────────
  const logoH = 40;
  const logoY = rect.y + BLOCK_H - logoH - 8;

  // Separador fino
  const sg = ctx.createLinearGradient(cx-200,0,cx+200,0);
  sg.addColorStop(0,"transparent"); sg.addColorStop(0.5,"rgba(255,0,140,0.25)"); sg.addColorStop(1,"transparent");
  ctx.fillStyle = sg;
  ctx.fillRect(cx-200, logoY-6, 400, 1.5);

  if (logoImg) {
    const lw = Math.min(maxW * 0.78, logoH * LOGO_RATIO);
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