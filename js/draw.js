export function drawCover(ctx, img, x, y, w, h) {
  // Draw image like CSS background-size: cover
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;

  let drawW, drawH, drawX, drawY;

  if (imgRatio > boxRatio) {
    // Image is wider, fit height
    drawH = h;
    drawW = h * imgRatio;
    drawX = x - (drawW - w) / 2;
    drawY = y;
  } else {
    // Image is taller, fit width
    drawW = w;
    drawH = w / imgRatio;
    drawX = x;
    drawY = y - (drawH - h) / 2;
  }

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
}


export function drawCoverPanZoom(ctx, img, x, y, w, h, transform = {}) {
  // Draw image like CSS background-size: cover, with pan/zoom.
  const rawZoom = Number(transform.zoom ?? 1);
  const zoom = Math.max(1, Math.min(isFinite(rawZoom) ? rawZoom : 1, 1.5));
  let panX = Number(transform.panX ?? 0);
  let panY = Number(transform.panY ?? 0);
  if (!isFinite(panX)) panX = 0;
  if (!isFinite(panY)) panY = 0;

  const imgRatio = img.width / img.height;
  const boxRatio = w / h;

  let baseW, baseH;

  if (imgRatio > boxRatio) {
    // Image is wider, fit height
    baseH = h;
    baseW = h * imgRatio;
  } else {
    // Image is taller, fit width
    baseW = w;
    baseH = w / imgRatio;
  }

  // Apply zoom around the center of the box
  const drawW = baseW * zoom;
  const drawH = baseH * zoom;

  const baseX = x - (drawW - w) / 2;
  const baseY = y - (drawH - h) / 2;

  // Clamp pan so the image always covers the box
  const maxPanX = Math.max(0, (drawW - w) / 2);
  const maxPanY = Math.max(0, (drawH - h) / 2);

  panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
  panY = Math.max(-maxPanY, Math.min(maxPanY, panY));

  ctx.drawImage(img, baseX + panX, baseY + panY, drawW, drawH);
}


export function textStrokeFill(ctx, text, x, y, options = {}) {
  const {
    font = "bold 84px system-ui, sans-serif",
    fill = "#ffffff",
    stroke = "#000000",
    lineWidth,
    shadowColor = "rgba(0,0,0,0.25)",
    shadowBlur = 10,
    shadowOffsetY = 4,
    align = "center",
    baseline = "alphabetic",
  } = options;

  // If lineWidth is not provided, derive a professional-looking stroke
  // from the font size (works well for big title texts).
  let lw = lineWidth;
  if (lw === undefined || lw === null) {
    const m = String(font).match(/\b(\d+(?:\.\d+)?)px\b/);
    const size = m ? Number(m[1]) : 84;
    lw = Math.max(6, Math.round(size * 0.12));
  }

  ctx.save();
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;

  ctx.lineJoin = "round";
  ctx.miterLimit = 2;

  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = shadowBlur;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = shadowOffsetY;

  ctx.lineWidth = lw;
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function avgLuminance(ctx, x, y, w, h) {
  // Returns 0..1 (0 = dark, 1 = bright)
  const ix = Math.max(0, Math.floor(x));
  const iy = Math.max(0, Math.floor(y));
  const iw = Math.max(1, Math.floor(Math.min(w, ctx.canvas.width - ix)));
  const ih = Math.max(1, Math.floor(Math.min(h, ctx.canvas.height - iy)));
  try {
    const img = ctx.getImageData(ix, iy, iw, ih).data;
    let sum = 0;
    const step = 4 * 10; // sample every 10 pixels-ish
    for (let i = 0; i < img.length; i += step) {
      const r = img[i] / 255;
      const g = img[i + 1] / 255;
      const b = img[i + 2] / 255;
      // relative luminance
      sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    const count = Math.max(1, Math.floor(img.length / step));
    return sum / count;
  } catch {
    return 0.5;
  }
}

export function drawRuleOfThirds(ctx, w, h, alpha = 0.35) {
  ctx.save();
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 10]);
  const x1 = w / 3;
  const x2 = (2 * w) / 3;
  const y1 = h / 3;
  const y2 = (2 * h) / 3;
  ctx.beginPath();
  ctx.moveTo(x1, 0);
  ctx.lineTo(x1, h);
  ctx.moveTo(x2, 0);
  ctx.lineTo(x2, h);
  ctx.moveTo(0, y1);
  ctx.lineTo(w, y1);
  ctx.moveTo(0, y2);
  ctx.lineTo(w, y2);
  ctx.stroke();
  ctx.restore();
}

export function fitText(ctx, text, maxWidth, startSize, minSize, fontFamily, weight="800") {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}
