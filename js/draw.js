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
    lineWidth = 10,
    shadowColor = "rgba(0,0,0,0.25)",
    shadowBlur = 10,
    shadowOffsetY = 4,
    align = "center",
    baseline = "alphabetic",
  } = options;

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

  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
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
