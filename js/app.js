import { readFileAsDataURL, loadImage, getFileBaseName, cleanSpaces, slugify, pad2 } from "./utils.js";
import { drawRuleOfThirds } from "./draw.js";
import {
  drawPortadaFicha,
  drawVenta,
  drawVendido,
  drawHistoria,
  drawFelicitaciones,
  renderPortadaFicha,
  renderVenta,
  renderVendido,
  renderHistoria,
  renderFelicitaciones,
  historiaBlockFromY,
} from "./templates/index.js";

const imagesInput = document.getElementById("images");
const generateBtn = document.getElementById("generateBtn");
const downloadZipBtn = document.getElementById("downloadZipBtn");
const previewsContainer = document.getElementById("previews");
const statusText = document.getElementById("statusText");

const templateTabs = document.getElementById("templateTabs");
const exportFormatSelect = document.getElementById("exportFormat");
const jpgQualityRange = document.getElementById("jpgQuality");
const showGuidesChk = document.getElementById("showGuides");

const expPortada = document.getElementById("exp_portada");
const expVenta = document.getElementById("exp_venta");
const expVendido = document.getElementById("exp_vendido");
const expHistoria = document.getElementById("exp_historia");
const expFelicitaciones = document.getElementById("exp_felicitaciones");

const clientNameInput = document.getElementById("clientName");
const soldTextInput = document.getElementById("soldText");

const kmInput = document.getElementById("km");
const kmHiddenChk = document.getElementById("kmHidden");

const progressBar = document.getElementById("progressBar");
const progressMeta = document.getElementById("progressMeta");

const MAX_ZOOM = 1.5;
const LOAD_CONCURRENCY = 4;
const EXPORT_CONCURRENCY = 3;

let state = {
  activeTemplate: "portada",
  // Loaded images (always kept in memory once generated)
  images: [], // { file, img, baseName, index }
  // Preview items for non-historia templates
  items: [], // { file, img, baseName, transform, canvas, zoomInput, nameEl, index }
  // Historia state
  story: null,
  storyItem: null,
  hasPreviews: false,
};

function setStatus(text) {
  statusText.textContent = text;
}

function setProgress(done, total, label = "") {
  const pct = total ? Math.round((done / total) * 100) : 0;
  progressBar.style.width = `${pct}%`;
  progressMeta.textContent = label ? `${label} (${done}/${total})` : `${done}/${total}`;
}

function setActiveTemplate(template) {
  state.activeTemplate = template;
  [...templateTabs.querySelectorAll(".tab")].forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.template === template);
  });
  toggleFields();
  rebuildPreviewsForActiveTemplate();
}

function toggleFields() {
  const t = state.activeTemplate;
  const setHidden = (selector, hidden) => {
    document.querySelectorAll(selector).forEach((el) => {
      if (hidden) el.classList.add("is-hidden");
      else el.classList.remove("is-hidden");
    });
  };
  setHidden(".only-felicitaciones", t !== "felicitaciones");
  setHidden(".only-vendido", t !== "vendido");
  setHidden(".only-venta", !(t === "venta" || t === "vendido"));
  setHidden(".only-portada", t !== "portada");
  setHidden(".only-historia", t !== "historia");
  setHidden(".only-gearbox", !(t === "portada" || t === "historia"));
  setHidden(".only-jpg", exportFormatSelect.value !== "jpg");
}

templateTabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  const t = btn.dataset.template;
  if (!t) return;
  setActiveTemplate(t);
});

exportFormatSelect.addEventListener("change", () => {
  toggleFields();
  // Update preview names (extension may change)
  updateAllPreviewNames();
});

showGuidesChk.addEventListener("change", () => rerenderAll());

// KM: allow hiding mileage explicitly
kmHiddenChk?.addEventListener("change", () => {
  if (!kmInput) return;
  if (kmHiddenChk.checked) {
    kmInput.value = "";
    kmInput.disabled = true;
  } else {
    kmInput.disabled = false;
  }
  rerenderAll();
});

kmInput?.addEventListener("input", () => {
  // If user starts typing, ensure it's not hidden.
  if (kmHiddenChk && kmHiddenChk.checked) {
    kmHiddenChk.checked = false;
    kmInput.disabled = false;
  }
  rerenderAll();
});

function getFormData() {
  return {
    brand: document.getElementById("brand")?.value || "",
    model: document.getElementById("model")?.value || "",
    year: document.getElementById("year")?.value || "",
    version: document.getElementById("version")?.value || "",
    engine: document.getElementById("engine")?.value || "",
    gearbox: document.getElementById("gearbox")?.value || "",
    motorTraction: document.getElementById("motorTraction")?.value || "",
    kmHidden: Boolean(kmHiddenChk?.checked),
    km: (kmHiddenChk?.checked ? "" : (kmInput?.value || "")),
    extra1: document.getElementById("extra1")?.value || "",
    extra2: document.getElementById("extra2")?.value || "",
    clientName: clientNameInput?.value || "",
    soldText: soldTextInput?.value || "VENDIDO",
  };
}

function getSelectedTemplates() {
  const arr = [];
  if (expPortada?.checked) arr.push("portada");
  if (expVenta?.checked) arr.push("venta");
  if (expVendido?.checked) arr.push("vendido");
  if (expHistoria?.checked) arr.push("historia");
  if (expFelicitaciones?.checked) arr.push("felicitaciones");
  return arr;
}

function getDrawer(template) {
  if (template === "portada") return drawPortadaFicha;
  if (template === "venta") return drawVenta;
  if (template === "vendido") return drawVendido;
  if (template === "historia") return drawHistoria;
  if (template === "felicitaciones") return drawFelicitaciones;
  return drawPortadaFicha;
}

function getRenderer(template) {
  if (template === "portada") return renderPortadaFicha;
  if (template === "venta") return renderVenta;
  if (template === "vendido") return renderVendido;
  if (template === "historia") return renderHistoria;
  if (template === "felicitaciones") return renderFelicitaciones;
  return renderPortadaFicha;
}

function templatePrefix(template) {
  if (template === "portada") return "PORTADA";
  if (template === "venta") return "VENTA";
  if (template === "vendido") return "VENDIDO";
  if (template === "historia") return "HISTORIA";
  if (template === "felicitaciones") return "FELICITACIONES";
  return "BANNER";
}

function folderName(template) {
  if (template === "portada") return "portada";
  if (template === "venta") return "venta";
  if (template === "vendido") return "vendido";
  if (template === "historia") return "historia";
  if (template === "felicitaciones") return "felicitaciones";
  return "banners";
}

function getOutputName({ template, data, index, ext }) {
  const prefix = templatePrefix(template);
  const year = slugify(data.year);
  const model = slugify(data.model);
  const brand = slugify(data.brand);
  const client = slugify(data.clientName || "cliente");
  const n = pad2(index + 1);

  let parts = [];
  if (template === "portada") {
    parts = [prefix, brand, model, year, n];
  } else if (template === "historia") {
    parts = [prefix, model, year, "01"];
  } else if (template === "felicitaciones") {
    parts = [prefix, model, year, client, n];
  } else {
    parts = [prefix, model, year, n];
  }

  const name = parts.filter(Boolean).join("-") || `${prefix}-${n}`;
  return `${name}.${ext}`;
}

function renderPreview(item) {
  if (state.activeTemplate === "historia") {
    renderStoryPreview();
    return;
  }
  const data = getFormData();
  const drawer = getDrawer(state.activeTemplate);
  const ctx = item.canvas.getContext("2d");
  drawer(ctx, item.img, data, item.transform);
  if (showGuidesChk.checked) {
    drawRuleOfThirds(ctx, item.canvas.width, item.canvas.height, 0.25);
  }
}

function updatePreviewName(item) {
  const data = getFormData();
  const ext = exportFormatSelect.value === "png" ? "png" : "jpg";
  const name = getOutputName({ template: state.activeTemplate, data, index: item.index, ext });
  item.nameEl.textContent = name;
}

function updateAllPreviewNames() {
  state.items.forEach(updatePreviewName);
}

let rerenderTimer = null;
function rerenderAll() {
  if (!state.hasPreviews) return;
  if (rerenderTimer) cancelAnimationFrame(rerenderTimer);
  rerenderTimer = requestAnimationFrame(() => {
    if (state.activeTemplate === "historia") {
      updateStoryPreviewName();
      renderStoryPreview();
      return;
    }

    state.items.forEach((item) => {
      updatePreviewName(item);
      renderPreview(item);
    });
  });
}

function ensureStoryDefaults() {
  if (state.story && state.story.blocks) {
    if (!state.story.separators) state.story.separators = { s1: 0, s2: 0, s3: 0 };
    return;
  }
  const total = state.images.length;
  const pick = (fallback) => (total ? Math.min(total - 1, Math.max(0, fallback)) : 0);
  state.story = {
    activeBlock: 1,
    // Visual-only separator offsets (px). Blocks remain fixed equal height.
    separators: { s1: 0, s2: 0, s3: 0 },
    blocks: {
      // Historia: 3 photos distributed in blocks 1, 2 and 4.
      // Block 3 is DATA ONLY (no photo).
      1: { imgIndex: pick(0), transform: { zoom: 1, panX: 0, panY: 0 } },
      2: { imgIndex: pick(1), transform: { zoom: 1, panX: 0, panY: 0 } },
      4: { imgIndex: pick(2), transform: { zoom: 1, panX: 0, panY: 0 } },
    },
  };
}

function updateStoryPreviewName() {
  if (!state.storyItem) return;
  const data = getFormData();
  const ext = exportFormatSelect.value === "png" ? "png" : "jpg";
  const name = getOutputName({ template: "historia", data, index: 0, ext });
  state.storyItem.nameEl.textContent = name;
}

function renderStoryPreview() {
  if (!state.storyItem || !state.storyItem.canvas) return;
  ensureStoryDefaults();
  const data = getFormData();
  const ctx = state.storyItem.canvas.getContext("2d");
  drawHistoria(ctx, state.images, data, state.story);
  if (showGuidesChk.checked) {
    drawRuleOfThirds(ctx, state.storyItem.canvas.width, state.storyItem.canvas.height, 0.25);
  }
}

function rebuildPreviewsForActiveTemplate() {
  if (!state.hasPreviews) return;
  previewsContainer.innerHTML = "";
  state.items.forEach((it) => {
    it.canvas = null;
    it.zoomInput = null;
    it.nameEl = null;
  });
  state.storyItem = null;

  if (state.activeTemplate === "historia") {
    ensureStoryDefaults();
    const node = makeStoryPreviewItem();
    previewsContainer.appendChild(node);
    updateStoryPreviewName();
    renderStoryPreview();
    return;
  }

  // Non-historia: one preview per image
  state.items.forEach((item) => {
    const node = makePreviewItem(item);
    previewsContainer.appendChild(node);
    renderPreview(item);
  });
}

// If user edits any input, update previews
document.addEventListener("input", (e) => {
  const el = e.target;
  if (!(el instanceof HTMLElement)) return;
  const relevant = [
    "brand",
    "model",
    "year",
    "version",
    "engine",
    "gearbox",
    "motorTraction",
    "km",
    "extra1",
    "extra2",
    "clientName",
    "soldText",
  ];
  if (relevant.includes(el.id)) rerenderAll();
});

function makePreviewItem(item) {
  const wrap = document.createElement("div");
  wrap.className = "preview-item";

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  canvas.className = "preview-canvas";
  item.canvas = canvas;

  const controls = document.createElement("div");
  controls.className = "preview-controls";

  const zoomLabel = document.createElement("div");
  zoomLabel.className = "preview-control-label";
  zoomLabel.textContent = "Zoom";

  const zoom = document.createElement("input");
  zoom.type = "range";
  zoom.min = "1";
  zoom.max = String(MAX_ZOOM);
  zoom.step = "0.01";
  zoom.value = String(item.transform.zoom);
  zoom.className = "preview-zoom";
  item.zoomInput = zoom;

  const applyAll = document.createElement("button");
  applyAll.type = "button";
  applyAll.className = "btn-secondary btn-apply-all";
  applyAll.textContent = "Aplicar a todas";

  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "btn-secondary btn-reset";
  reset.textContent = "Reset";

  const name = document.createElement("div");
  name.className = "preview-name";
  item.nameEl = name;
  updatePreviewName(item);

  controls.appendChild(zoomLabel);
  controls.appendChild(zoom);
  controls.appendChild(applyAll);
  controls.appendChild(reset);

  wrap.appendChild(canvas);
  wrap.appendChild(controls);
  wrap.appendChild(name);

  // Dragging
  let dragging = false;
  let dragMode = null; // 'pan' | 'sep'
  let dragSepKey = null; // 's1'|'s2'|'s3'
  let lastX = 0;
  let lastY = 0;

  const getScale = () => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / Math.max(1, rect.width);
    const sy = canvas.height / Math.max(1, rect.height);
    return { sx, sy };
  };

  const onDown = (e) => {
    dragging = true;
    canvas.classList.add("is-dragging");
    lastX = e.clientX;
    lastY = e.clientY;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
  };

  const onMove = (e) => {
    if (!dragging) return;
    const { sx, sy } = getScale();
    const dx = (e.clientX - lastX) * sx;
    const dy = (e.clientY - lastY) * sy;
    lastX = e.clientX;
    lastY = e.clientY;

    item.transform.panX += dx;
    item.transform.panY += dy;
    renderPreview(item);
  };

  const onUp = () => {
    dragging = false;
    dragMode = null;
    dragSepKey = null;
    canvas.classList.remove("is-dragging");
  };

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("pointerleave", onUp);

  // Wheel zoom
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const delta = Math.sign(e.deltaY);
      const step = 0.03;
      const next = item.transform.zoom + (delta < 0 ? step : -step);
      item.transform.zoom = Math.max(1, Math.min(MAX_ZOOM, next));
      zoom.value = String(item.transform.zoom);
      renderPreview(item);
    },
    { passive: false }
  );

  zoom.addEventListener("input", () => {
    item.transform.zoom = Math.max(1, Math.min(MAX_ZOOM, Number(zoom.value) || 1));
    renderPreview(item);
  });

  reset.addEventListener("click", () => {
    item.transform.zoom = 1;
    item.transform.panX = 0;
    item.transform.panY = 0;
    zoom.value = "1";
    renderPreview(item);
  });

  applyAll.addEventListener("click", () => {
    const { zoom: z, panX, panY } = item.transform;
    state.items.forEach((it) => {
      it.transform.zoom = z;
      it.transform.panX = panX;
      it.transform.panY = panY;
      if (it.zoomInput) it.zoomInput.value = String(z);
      renderPreview(it);
    });
  });

  return wrap;
}

function makeStoryPreviewItem() {
  const wrap = document.createElement("div");
  wrap.className = "preview-item";

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  canvas.className = "preview-canvas preview-canvas-story";

  const controls = document.createElement("div");
  controls.className = "preview-controls";

  const hint = document.createElement("div");
  hint.className = "preview-control-label";
  hint.textContent = "Historia: hacé click en un bloque de FOTO (1/2/4) y luego arrastrá/zoomeá";

  const makeSelect = (labelText, blockNo) => {
    const row = document.createElement("div");
    row.className = "story-row";

    const label = document.createElement("div");
    label.className = "preview-control-label";
    label.textContent = labelText;

    const sel = document.createElement("select");
    sel.className = "story-select";

    state.images.forEach((im, idx) => {
      const opt = document.createElement("option");
      opt.value = String(idx);
      opt.textContent = `${idx + 1} · ${im.baseName || "foto"}`;
      sel.appendChild(opt);
    });
    sel.value = String(state.story.blocks[blockNo].imgIndex ?? 0);

    sel.addEventListener("change", () => {
      state.story.blocks[blockNo].imgIndex = Number(sel.value) || 0;
      renderStoryPreview();
    });

    row.appendChild(label);
    row.appendChild(sel);
    return row;
  };

  const row1 = makeSelect("Foto Bloque 1", 1);
  const row2 = makeSelect("Foto Bloque 2", 2);
  const row4 = makeSelect("Foto Bloque 4", 4);

  const zoomLabel = document.createElement("div");
  zoomLabel.className = "preview-control-label";
  zoomLabel.textContent = "Zoom (bloque activo)";

  const zoom = document.createElement("input");
  zoom.type = "range";
  zoom.min = "1";
  zoom.max = String(MAX_ZOOM);
  zoom.step = "0.01";
  zoom.className = "preview-zoom";

  const applyAll = document.createElement("button");
  applyAll.type = "button";
  applyAll.className = "btn-secondary btn-apply-all";
  applyAll.textContent = "Aplicar a los 3 bloques";

  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "btn-secondary btn-reset";
  reset.textContent = "Reset (bloque activo)";

  const name = document.createElement("div");
  name.className = "preview-name";

  state.storyItem = {
    canvas,
    nameEl: name,
    zoomInput: zoom,
  };

  const getActive = () => state.story.blocks[state.story.activeBlock];
  const syncZoom = () => {
    const b = getActive();
    zoom.value = String(b?.transform?.zoom ?? 1);
  };
  syncZoom();


  // Dragging affects active block
  let dragging = false;
  let dragMode = null; // 'pan' | 'sep'
  let dragSepKey = null; // 's1'|'s2'|'s3'
  let lastX = 0;
  let lastY = 0;

  const getScale = () => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / Math.max(1, rect.width);
    const sy = canvas.height / Math.max(1, rect.height);
    return { sx, sy };
  };

  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * canvas.width;
    const y = ((e.clientY - rect.top) / Math.max(1, rect.height)) * canvas.height;

    // Separator drag (visual only)
    const base = { s1: 480, s2: 960, s3: 1440 };
    const maxOff = 48;
    const hitPx = 18;
    const seps = state.story.separators || (state.story.separators = { s1: 0, s2: 0, s3: 0 });

    const sepKey =
      Math.abs(y - (base.s1 + seps.s1)) <= hitPx ? "s1" :
      Math.abs(y - (base.s2 + seps.s2)) <= hitPx ? "s2" :
      Math.abs(y - (base.s3 + seps.s3)) <= hitPx ? "s3" :
      null;

    if (sepKey) {
      dragging = true;
      dragMode = "sep";
      dragSepKey = sepKey;
      canvas.classList.add("is-dragging");
      lastX = e.clientX;
      lastY = e.clientY;
      try { canvas.setPointerCapture(e.pointerId); } catch {}
      return;
    }

    // Otherwise: select block + pan/zoom
    const b = historiaBlockFromY(y);
    if (b === 1 || b === 2 || b === 4) {
      state.story.activeBlock = b;
      syncZoom();
    }

    dragging = true;
    dragMode = "pan";
    canvas.classList.add("is-dragging");
    lastX = e.clientX;
    lastY = e.clientY;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  });


  canvas.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const y = ((e.clientY - rect.top) / Math.max(1, rect.height)) * canvas.height;

    // Hover feedback (when not dragging)
    if (!dragging) {
      const base = { s1: 480, s2: 960, s3: 1440 };
      const seps = state.story?.separators || { s1: 0, s2: 0, s3: 0 };
      const hitPx = 18;
      const near =
        Math.abs(y - (base.s1 + seps.s1)) <= hitPx ||
        Math.abs(y - (base.s2 + seps.s2)) <= hitPx ||
        Math.abs(y - (base.s3 + seps.s3)) <= hitPx;
      canvas.style.cursor = near ? "row-resize" : "grab";
      return;
    }

    const { sx, sy } = getScale();
    const dx = (e.clientX - lastX) * sx;
    const dy = (e.clientY - lastY) * sy;
    lastX = e.clientX;
    lastY = e.clientY;

    if (dragMode === "sep" && dragSepKey) {
      const maxOff = 48;
      const seps = state.story.separators || (state.story.separators = { s1: 0, s2: 0, s3: 0 });
      const next = (seps[dragSepKey] || 0) + dy;
      seps[dragSepKey] = Math.max(-maxOff, Math.min(maxOff, next));
      renderStoryPreview();
      return;
    }

    // Default: pan photo in active block
    const activeBlock = state.story.activeBlock;
    if (!(activeBlock === 1 || activeBlock === 2 || activeBlock === 4)) return;
    const t = state.story.blocks[activeBlock].transform;
    t.panX += dx;
    t.panY += dy;
    renderStoryPreview();
  });


  const onUp = () => {
    dragging = false;
    dragMode = null;
    dragSepKey = null;
    canvas.classList.remove("is-dragging");
  };
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("pointerleave", onUp);

  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const activeBlock = state.story.activeBlock;
      if (!(activeBlock === 1 || activeBlock === 2 || activeBlock === 4)) return;
      const delta = Math.sign(e.deltaY);
      const step = 0.03;
      const t = state.story.blocks[activeBlock].transform;
      const next = t.zoom + (delta < 0 ? step : -step);
      t.zoom = Math.max(1, Math.min(MAX_ZOOM, next));
      syncZoom();
      renderStoryPreview();
    },
    { passive: false }
  );

  zoom.addEventListener("input", () => {
    const activeBlock = state.story.activeBlock;
    if (!(activeBlock === 1 || activeBlock === 2 || activeBlock === 4)) return;
    const t = state.story.blocks[activeBlock].transform;
    t.zoom = Math.max(1, Math.min(MAX_ZOOM, Number(zoom.value) || 1));
    renderStoryPreview();
  });

  reset.addEventListener("click", () => {
    const activeBlock = state.story.activeBlock;
    if (!(activeBlock === 1 || activeBlock === 2 || activeBlock === 4)) return;
    const t = state.story.blocks[activeBlock].transform;
    t.zoom = 1;
    t.panX = 0;
    t.panY = 0;
    syncZoom();
    renderStoryPreview();
  });

  applyAll.addEventListener("click", () => {
    const activeBlock = state.story.activeBlock;
    if (!(activeBlock === 1 || activeBlock === 2 || activeBlock === 4)) return;
    const src = state.story.blocks[activeBlock].transform;
    [1, 2, 4].forEach((b) => {
      state.story.blocks[b].transform.zoom = src.zoom;
      state.story.blocks[b].transform.panX = src.panX;
      state.story.blocks[b].transform.panY = src.panY;
    });
    syncZoom();
    renderStoryPreview();
  });

  controls.appendChild(hint);
  controls.appendChild(row1);
  controls.appendChild(row2);
  controls.appendChild(row4);
  controls.appendChild(zoomLabel);
  controls.appendChild(zoom);
  controls.appendChild(applyAll);
  controls.appendChild(reset);

  wrap.appendChild(canvas);
  wrap.appendChild(controls);
  wrap.appendChild(name);

  return wrap;
}

async function mapWithConcurrency(items, limit, worker, onProgress) {
  const queue = [...items];
  let done = 0;
  const results = [];

  const runners = Array.from({ length: Math.max(1, limit) }, async () => {
    while (queue.length) {
      const it = queue.shift();
      const res = await worker(it);
      results.push(res);
      done += 1;
      if (onProgress) onProgress(done, items.length);
    }
  });

  await Promise.all(runners);
  return results;
}

async function generatePreviews() {
  const files = Array.from(imagesInput.files || []);
  if (!files.length) {
    alert("Seleccioná al menos una imagen.");
    return;
  }

  generateBtn.disabled = true;
  downloadZipBtn.disabled = true;
  previewsContainer.innerHTML = "";
  state.images = [];
  state.items = [];
  state.story = null;
  state.storyItem = null;
  state.hasPreviews = false;

  const t0 = performance.now();
  setStatus("Cargando imágenes…");
  setProgress(0, files.length, "Cargando");

  const indexed = files.map((file, index) => ({ file, index }));

  const loaded = [];
  await mapWithConcurrency(
    indexed,
    LOAD_CONCURRENCY,
    async ({ file, index }) => {
      const dataURL = await readFileAsDataURL(file);
      const img = await loadImage(dataURL);
      loaded.push({ file, img, index });
      return true;
    },
    (done, total) => {
      const elapsed = (performance.now() - t0) / 1000;
      const avg = elapsed / Math.max(1, done);
      const remaining = Math.max(0, Math.round(avg * (total - done)));
      setStatus(`Cargando ${done}/${total}…`);
      setProgress(done, total, remaining ? `Cargando · ~${remaining}s` : "Cargando");
    }
  );

  // Keep original order
  loaded.sort((a, b) => a.index - b.index);
  state.images = loaded.map(({ file, img, index }) => ({
    file,
    img,
    index,
    baseName: getFileBaseName(file),
  }));

  // initialize per-image transforms for non-historia templates
  state.items = state.images.map(({ file, img, baseName, index }) => ({
    file,
    img,
    baseName,
    index,
    transform: { zoom: 1, panX: 0, panY: 0 },
    canvas: null,
    zoomInput: null,
    nameEl: null,
  }));

  state.hasPreviews = true;
  downloadZipBtn.disabled = false;
  generateBtn.disabled = false;
  setProgress(files.length, files.length, "Listo");
  setStatus(`✅ Previews listas: ${files.length}. Arrastrá para reencuadrar (zoom 1.5) y descargá el ZIP.`);

  // render according to the active template
  rebuildPreviewsForActiveTemplate();
}

async function buildZipAndDownload() {
  if (!state.items.length) return;

  const selectedTemplates = getSelectedTemplates();
  if (!selectedTemplates.length) {
    alert("Seleccioná al menos una plantilla para exportar.");
    return;
  }

  downloadZipBtn.disabled = true;
  generateBtn.disabled = true;

  const exportFormat = exportFormatSelect.value === "png" ? "png" : "jpg";
  const jpgQuality = Number(jpgQualityRange.value || 0.92);
  const data = getFormData();
  data.__exportFormat = exportFormat;
  data.__exportQuality = jpgQuality;

  const zip = new JSZip();
  const folders = {};
  selectedTemplates.forEach((t) => {
    folders[t] = zip.folder(folderName(t));
  });

  ensureStoryDefaults();
  const perImageTemplates = selectedTemplates.filter((t) => t !== "historia");
  const total = state.items.length * perImageTemplates.length + (selectedTemplates.includes("historia") ? 1 : 0);
  let done = 0;
  const t0 = performance.now();

  setStatus("Exportando…");
  setProgress(0, total, "Exportando");

  const jobs = [];
  // Historia exports a single image (not per-photo)
  if (selectedTemplates.includes("historia")) {
    jobs.push({ template: "historia", item: null });
  }
  for (const template of perImageTemplates) {
    for (const item of state.items) jobs.push({ template, item });
  }

  await mapWithConcurrency(
    jobs,
    EXPORT_CONCURRENCY,
    async ({ template, item }) => {
      if (template === "historia") {
        const { blob } = await renderHistoria({ images: state.images, data, story: state.story });
        const name = getOutputName({ template: "historia", data, index: 0, ext: exportFormat });
        folders[template].file(name, blob);
        return true;
      }

      const renderer = getRenderer(template);
      const { blob } = await renderer({ img: item.img, data, transform: item.transform });
      const name = getOutputName({ template, data, index: item.index, ext: exportFormat });
      folders[template].file(name, blob);
      return true;
    },
    (d, tot) => {
      done = d;
      const elapsed = (performance.now() - t0) / 1000;
      const avg = elapsed / Math.max(1, done);
      const remaining = Math.max(0, Math.round(avg * (tot - done)));
      setStatus(`Exportando ${done}/${tot}…`);
      setProgress(done, tot, remaining ? `Exportando · ~${remaining}s` : "Exportando");
    }
  );

  setStatus("Creando ZIP…");
  setProgress(total, total, "Creando ZIP");
  const zipBlob = await zip.generateAsync({ type: "blob" });

  const url = URL.createObjectURL(zipBlob);
  const modelName = slugify(cleanSpaces(data.model) || "vehiculo");
  const a = document.createElement("a");
  a.href = url;
  a.download = `banners-${modelName || "vehiculo"}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  setStatus(`✅ ZIP listo: ${total} archivo(s) en ${selectedTemplates.length} carpeta(s).`);
  downloadZipBtn.disabled = false;
  generateBtn.disabled = false;
}

generateBtn.addEventListener("click", () => {
  generatePreviews().catch((err) => {
    console.error(err);
    setStatus("Ocurrió un error al generar las previews.");
    generateBtn.disabled = false;
  });
});

downloadZipBtn.addEventListener("click", () => {
  buildZipAndDownload().catch((err) => {
    console.error(err);
    setStatus("Ocurrió un error al exportar el ZIP.");
    downloadZipBtn.disabled = false;
    generateBtn.disabled = false;
  });
});

// Init
toggleFields();
setActiveTemplate("portada");
