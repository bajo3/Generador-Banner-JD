import { drawCoverPanZoom, textStrokeFill, fitText, avgLuminance } from "../draw.js";
import { formatKm, upper, cleanSpaces } from "../utils.js";
import { rr, pinkLine, drawLogoImg, PINK, BLACK, WHITE } from "./_shared.js";

const W = 1080;
const H = 1080;
const PINK_DARK  = "#c4006a";
const PINK_GLOW  = "rgba(255,0,140,0.55)";

// ── helpers ────────────────────────────────────────────────────────────────────

function drawPinkGlowLine(ctx, y, width = W) {
  // thick glow behind the line
  const halo = ctx.createLinearGradient(0, y - 10, 0, y + 18);
  halo.addColorStop(0, "rgba(255,0,140,0)");
  halo.addColorStop(0.45, "rgba(255,0,140,0.18)");
  halo.addColorStop(1,  "rgba(255,0,140,0)");
  ctx.fillStyle = halo; ctx.fillRect(0, y - 10, width, 28);
  // solid line
  const lg = ctx.createLinearGradient(0, 0, width, 0);
  lg.addColorStop(0,    "rgba(255,0,140,0.15)");
  lg.addColorStop(0.10, PINK);
  lg.addColorStop(0.90, PINK);
  lg.addColorStop(1,    "rgba(255,0,140,0.15)");
  ctx.fillStyle = lg; ctx.fillRect(0, y, width, 4);
}

// Draw a pill-shaped badge with gradient fill and glow
function drawBadge(ctx, text, cx, y, maxW, fs, {
  fillA = PINK_DARK, fillB = PINK, textColor = WHITE,
  glowAlpha = 0.5, borderRadius
} = {}) {
  ctx.font = `800 ${fs}px system-ui, sans-serif`;
  const tw = ctx.measureText(text).width;
  const padH = Math.round(fs * 0.55);
  const padV = Math.round(fs * 0.30);
  const bW   = Math.min(maxW, tw + padH * 2);
  const bH   = fs + padV * 2;
  const br   = borderRadius !== undefined ? borderRadius : bH / 2;
  const bX   = cx - bW / 2;

  // outer glow
  ctx.save();
  ctx.shadowColor  = PINK_GLOW;
  ctx.shadowBlur   = 28;
  ctx.shadowOffsetY = 0;
  rr(ctx, bX, y, bW, bH, br);
  const vg = ctx.createLinearGradient(bX, y, bX + bW, y + bH);
  vg.addColorStop(0, fillA); vg.addColorStop(1, fillB);
  ctx.fillStyle = vg; ctx.fill();
  ctx.restore();

  // top-shine strip
  ctx.save();
  rr(ctx, bX + 2, y + 2, bW - 4, bH * 0.42, br - 1);
  ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fill();
  ctx.restore();

  // border
  ctx.save();
  rr(ctx, bX, y, bW, bH, br);
  ctx.strokeStyle = `rgba(255,255,255,${glowAlpha * 0.35})`; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();

  // text
  ctx.save();
  ctx.font = `800 ${fs}px system-ui, sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = textColor;
  ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 6;
  ctx.fillText(text, cx, y + bH / 2);
  ctx.restore();

  return bH;
}

// ── main draw ──────────────────────────────────────────────────────────────────

export function drawPortadaFicha(ctx, img, data, transform = { zoom:1, panX:0, panY:0 }, logoImg) {
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, W, H);

  const headerH = 148;
  const footerH = 310;
  const footerY = H - footerH;
  const photoY  = headerH;
  const photoH  = footerY - headerH;
  const cx      = W / 2;

  // ── Photo zone ──────────────────────────────────────────────────────────────
  ctx.save();
  ctx.beginPath(); ctx.rect(0, photoY, W, photoH); ctx.clip();
  if (img) {
    drawCoverPanZoom(ctx, img, 0, photoY, W, photoH, transform);
  } else {
    // placeholder gradient
    const pg = ctx.createLinearGradient(0, photoY, 0, footerY);
    pg.addColorStop(0, "#0d0d20"); pg.addColorStop(1, "#1a0010");
    ctx.fillStyle = pg; ctx.fillRect(0, photoY, W, photoH);
  }

  // top vignette
  const vtop = ctx.createLinearGradient(0, photoY, 0, photoY + 110);
  vtop.addColorStop(0, "rgba(0,0,0,0.62)"); vtop.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = vtop; ctx.fillRect(0, photoY, W, 110);

  // bottom vignette – deeper, reaches into the title area
  const vbot = ctx.createLinearGradient(0, footerY - 200, 0, footerY);
  vbot.addColorStop(0, "rgba(0,0,0,0)"); vbot.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = vbot; ctx.fillRect(0, footerY - 200, W, 200);

  // subtle pink tint on lower-left corner accent
  const accent = ctx.createRadialGradient(0, footerY, 0, 0, footerY, 340);
  accent.addColorStop(0, "rgba(255,0,140,0.10)"); accent.addColorStop(1, "rgba(255,0,140,0)");
  ctx.fillStyle = accent; ctx.fillRect(0, photoY, W, photoH);

  ctx.restore();

  // ── Header ─────────────────────────────────────────────────────────────────
  ctx.save();
  // gradient header so it blends slightly into photo
  const hg = ctx.createLinearGradient(0, 0, 0, headerH);
  hg.addColorStop(0, "#000000"); hg.addColorStop(1, "#0a0008");
  ctx.fillStyle = hg; ctx.fillRect(0, 0, W, headerH);
  drawLogoImg(ctx, logoImg, 0, 0, W, headerH);
  drawPinkGlowLine(ctx, headerH - 4);
  ctx.restore();

  // ── Footer base ─────────────────────────────────────────────────────────────
  ctx.save();
  const fg = ctx.createLinearGradient(0, footerY, 0, H);
  fg.addColorStop(0, "#060006"); fg.addColorStop(1, "#0a000a");
  ctx.fillStyle = fg; ctx.fillRect(0, footerY, W, footerH);

  // subtle top-center radial glow on footer
  const topGlow = ctx.createRadialGradient(cx, footerY, 0, cx, footerY, 520);
  topGlow.addColorStop(0, "rgba(255,0,140,0.11)"); topGlow.addColorStop(1, "rgba(255,0,140,0)");
  ctx.fillStyle = topGlow; ctx.fillRect(0, footerY, W, footerH);
  drawPinkGlowLine(ctx, footerY);
  ctx.restore();

  // ── Texts data ───────────────────────────────────────────────────────────────
  const brand   = cleanSpaces(upper(data.brand   || ""));
  const model   = cleanSpaces(upper(data.model   || ""));
  const version = cleanSpaces(upper(data.version || ""));
  const kmTxt   = formatKm(data.km);
  const kmLine  = (data.kmHidden || kmTxt === "") ? "" : `${kmTxt} KM`;
  const gearbox = cleanSpaces(upper(data.gearbox || ""));
  const year    = String(data.year || "").trim();
  const extra1  = cleanSpaces(data.extra1 || "");
  const extra2  = cleanSpaces(data.extra2 || "");

  // luminance for adaptive stroke thickness
  const lum = img ? avgLuminance(ctx, W * 0.1, photoY + 10, W * 0.8, 110) : 0.3;
  const sb  = lum > 0.55 ? 1.45 : 1.0;
  const sa  = lum > 0.55 ? 0.75 : 0.35;

  // ── Brand + Model over photo ────────────────────────────────────────────────
  let ty = photoY + 18;

  if (brand) {
    // thin label with letter-spacing feel — drawn smaller, with pink accent line below
    const s = Math.min(38, fitText(ctx, brand, 860, 38, 20, "system-ui, sans-serif", "600"));
    ctx.save();
    ctx.font = `600 ${s}px system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.strokeStyle = `rgba(0,0,0,${0.78 * sb})`;
    ctx.lineWidth = Math.max(3, Math.round(s * 0.09 * sb));
    ctx.lineJoin = "round";
    ctx.strokeText(brand, cx, ty + s * 0.84);
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.fillText(brand, cx, ty + s * 0.84);
    ctx.restore();
    ty += s + 5;

    // thin accent line under brand
    const bw = (() => { ctx.font = `600 ${s}px system-ui, sans-serif`; return ctx.measureText(brand).width; })();
    const lineW = Math.round(bw * 0.55);
    const lg = ctx.createLinearGradient(cx - lineW / 2, 0, cx + lineW / 2, 0);
    lg.addColorStop(0, "rgba(255,0,140,0)"); lg.addColorStop(0.5, PINK); lg.addColorStop(1, "rgba(255,0,140,0)");
    ctx.fillStyle = lg; ctx.fillRect(cx - lineW / 2, ty, lineW, 2);
    ty += 10;
  }

  if (model) {
    const s = fitText(ctx, model, 1000, 118, 52, "system-ui, sans-serif", "900");
    // glow halo behind model text
    ctx.save();
    ctx.shadowColor = "rgba(255,0,140,0.20)";
    ctx.shadowBlur  = 38;
    ctx.font = `900 ${s}px system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(255,255,255,0.0)";
    ctx.fillText(model, cx, ty + s * 0.84);
    ctx.restore();
    textStrokeFill(ctx, model, cx, ty + s * 0.84, {
      font: `900 ${s}px system-ui, -apple-system, Segoe UI, sans-serif`,
      stroke: `rgba(0,0,0,${0.94})`,
      fill: WHITE,
      lineWidth: Math.max(7, Math.round(s * 0.115 * sb)),
      shadowColor: `rgba(0,0,0,${sa})`, shadowBlur: 24, shadowOffsetY: 7,
      align: "center", baseline: "alphabetic",
    });
  }

  // ── Footer content ──────────────────────────────────────────────────────────
  let fy = footerY + 18;
  const padX = 48;
  const maxW = W - padX * 2;

  // VERSION badge
  if (version) {
    const vFS = fitText(ctx, version, maxW - 60, 34, 17, "system-ui, sans-serif", "800");
    const bH  = drawBadge(ctx, version, cx, fy, maxW, vFS);
    fy += bH + 16;
  }

  // ── Divider line with diamond ───────────────────────────────────────────────
  {
    const dW = 380;
    const dg = ctx.createLinearGradient(cx - dW / 2, 0, cx + dW / 2, 0);
    dg.addColorStop(0, "rgba(255,0,140,0)");
    dg.addColorStop(0.4, "rgba(255,0,140,0.55)");
    dg.addColorStop(0.6, "rgba(255,0,140,0.55)");
    dg.addColorStop(1, "rgba(255,0,140,0)");
    ctx.fillStyle = dg; ctx.fillRect(cx - dW / 2, fy + 1, dW, 1.5);

    // diamond dot
    ctx.save();
    ctx.shadowColor = PINK_GLOW; ctx.shadowBlur = 10;
    ctx.translate(cx, fy + 2); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = PINK; ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
    fy += 16;
  }

  // ── Spec grid ────────────────────────────────────────────────────────────────
  const gridItems = [
    year    ? ["AÑO",  year]    : null,
    gearbox ? ["CAJA", gearbox] : null,
    kmLine !== "" ? ["KM",   kmLine === "" ? (data.kmHidden ? "" : "0 KM") : kmLine]  : null,
    extra1  ? ["",     extra1]  : null,
  ].filter(Boolean);

  if (gridItems.length > 0) {
    const cols    = gridItems.length === 1 ? 1 : 2;
    const rows    = Math.ceil(gridItems.length / cols);
    const gap     = 10;
    const cW      = Math.floor((maxW - gap * (cols - 1)) / cols);
    const remainH = footerH - (fy - footerY) - (extra2 ? 40 : 0) - 14;
    const cH      = Math.min(96, Math.max(58, Math.floor((remainH - gap * (rows - 1)) / rows)));
    const br      = 14;

    gridItems.forEach(([label, value], i) => {
      if (!value) return;
      const col  = i % cols;
      const row  = Math.floor(i / cols);
      const cx2  = padX + col * (cW + gap);
      const cy2  = fy + row * (cH + gap);
      const cellCX = cx2 + cW / 2;

      ctx.save();

      // card background with subtle glass look
      rr(ctx, cx2, cy2, cW, cH, br);
      const cbg = ctx.createLinearGradient(cx2, cy2, cx2, cy2 + cH);
      cbg.addColorStop(0, "rgba(255,255,255,0.08)");
      cbg.addColorStop(1, "rgba(255,255,255,0.02)");
      ctx.fillStyle = cbg; ctx.fill();

      // pink border with glow
      ctx.save();
      ctx.shadowColor = "rgba(255,0,140,0.30)"; ctx.shadowBlur = 8;
      rr(ctx, cx2, cy2, cW, cH, br);
      ctx.strokeStyle = "rgba(255,0,140,0.40)"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();

      // left-side pink accent bar
      rr(ctx, cx2, cy2 + br, 3, cH - br * 2, 1.5);
      const barG = ctx.createLinearGradient(0, cy2, 0, cy2 + cH);
      barG.addColorStop(0, "rgba(255,0,140,0.4)");
      barG.addColorStop(0.5, PINK);
      barG.addColorStop(1, "rgba(255,0,140,0.4)");
      ctx.fillStyle = barG; ctx.fill();

      // label
      if (label) {
        const labelFS = Math.round(cH * 0.195);
        ctx.font = `700 ${labelFS}px system-ui, sans-serif`;
        ctx.textAlign = "left"; ctx.textBaseline = "top";
        ctx.fillStyle = "rgba(255,0,140,0.85)";
        ctx.fillText(label, cx2 + 18, cy2 + 9);
      }

      // value
      const maxValW = cW - 28;
      const valFS   = fitText(ctx, value, maxValW, Math.round(cH * 0.43), Math.round(cH * 0.24), "system-ui, sans-serif", "800");
      ctx.font = `800 ${valFS}px system-ui, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = WHITE;
      ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 6;
      ctx.fillText(value, cellCX, cy2 + cH * (label ? 0.64 : 0.52));
      ctx.shadowBlur = 0;

      ctx.restore();
    });

    fy += rows * cH + (rows - 1) * gap + 12;
  }

  // extra2 — subtle sub-line
  if (extra2) {
    ctx.font = "600 21px system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.52)";
    ctx.fillText(extra2, cx, fy + 14);
  }
}

export async function renderPortadaFicha({ img, data, transform = { zoom:1, panX:0, panY:0 } }) {
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const logoImg = await loadLogoOnce();
  drawPortadaFicha(ctx, img, data, transform, logoImg);
  const format  = data?.__exportFormat || "jpg";
  const quality = Number(data?.__exportQuality ?? 0.92);
  const mime    = format === "png" ? "image/png" : "image/jpeg";
  const blob    = await new Promise(r => canvas.toBlob(r, mime, mime === "image/jpeg" ? quality : undefined));
  const dataURL = canvas.toDataURL(mime, mime === "image/jpeg" ? quality : undefined);
  return { blob, dataURL };
}

let _logoCache = null;
export async function loadLogoOnce() {
  if (_logoCache) return _logoCache;
  return new Promise((res) => {
    const img = new Image();
    img.onload  = () => { _logoCache = img; res(img); };
    img.onerror = () => res(null);
    img.src = "./logo.png";
  });
}
