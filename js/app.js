import {
  readFileAsDataURL, loadImage, getFileBaseName,
  cleanSpaces, slugify, pad2, formatNumInput, formatPriceInput, stripFormat,
} from "./utils.js";
import { drawRuleOfThirds } from "./draw.js";
import {
  drawPortadaFicha, drawVenta, drawVendido, drawHistoria, drawHistoriaV2, drawFelicitaciones,
  renderPortadaFicha, renderVenta, renderVendido, renderHistoria, renderHistoriaV2, renderFelicitaciones,
  historiaBlockFromY, loadLogoOnce,
} from "./templates/index.js";

// ── Logo pre-load ─────────────────────────────────────────────────────────────
let _appLogo = null;
loadLogoOnce().then(img => { _appLogo = img; });

// ── DOM refs ──────────────────────────────────────────────────────────────────
const imagesInput       = document.getElementById("images");
const generateBtn       = document.getElementById("generateBtn");
const downloadZipBtn    = document.getElementById("downloadZipBtn");
const clearFormBtn      = document.getElementById("clearFormBtn");
const previewsContainer = document.getElementById("previews");
const statusText        = document.getElementById("statusText");
const emptyState        = document.getElementById("emptyState");

const templateTabs      = document.getElementById("templateTabs");
const exportFormatSelect= document.getElementById("exportFormat");
const jpgQualityRange   = document.getElementById("jpgQuality");
const showGuidesChk     = document.getElementById("showGuides");

const expPortada        = document.getElementById("exp_portada");
const expVenta          = document.getElementById("exp_venta");
const expVendido        = document.getElementById("exp_vendido");
const expHistoria       = document.getElementById("exp_historia");
const expHistoriaV2     = document.getElementById("exp_historiaV2");
const expFelicitaciones = document.getElementById("exp_felicitaciones");

const clientNameInput   = document.getElementById("clientName");
const soldTextInput     = document.getElementById("soldText");
const kmInput           = document.getElementById("km");
const kmHiddenChk       = document.getElementById("kmHidden");
const progressBar       = document.getElementById("progressBar");
const progressMeta      = document.getElementById("progressMeta");

const MAX_ZOOM = 1.5;
const LOAD_CONCURRENCY = 4;
const EXPORT_CONCURRENCY = 3;
const LS_KEY = "jd_form_v1";

// ── State ─────────────────────────────────────────────────────────────────────
let state = {
  activeTemplate: "portada",
  images: [],
  items: [],
  story: null,
  storyItem: null,
  hasPreviews: false,
};

// ── localStorage persistence ──────────────────────────────────────────────────
const FORM_IDS = [
  "brand","model","year","version","engine","gearbox","motorTraction",
  "km","extra1","extra2","clientName","soldText","price","priceCredit",
];

function saveForm() {
  const obj = {};
  FORM_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) obj[id] = el.value;
  });
  obj.__kmHidden = kmHiddenChk?.checked;
  try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch {}
}

function restoreForm() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const obj = JSON.parse(raw);
    FORM_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && obj[id] !== undefined) el.value = obj[id];
    });
    if (kmHiddenChk && obj.__kmHidden) {
      kmHiddenChk.checked = true;
      if (kmInput) { kmInput.value = ""; kmInput.disabled = true; }
    }
  } catch {}
}

// ── Live input formatting ─────────────────────────────────────────────────────
function setupLiveFormat(id, formatter) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", () => {
    const pos  = el.selectionStart;
    const prev = el.value;
    const formatted = formatter(prev);
    if (formatted !== prev) {
      el.value = formatted;
      // Restore cursor approximately
      const diff = formatted.length - prev.length;
      try { el.setSelectionRange(pos + diff, pos + diff); } catch {}
    }
    saveForm();
    rerenderAll();
  });
}

// ── Status & progress ─────────────────────────────────────────────────────────
function setStatus(text) { statusText.textContent = text; }

function setProgress(done, total, label = "") {
  const pct = total ? Math.round((done / total) * 100) : 0;
  progressBar.style.width = `${pct}%`;
  progressMeta.textContent = label
    ? `${label} — ${done} de ${total}`
    : `${done} / ${total}`;
}

// ── Template switching ────────────────────────────────────────────────────────
function setActiveTemplate(template) {
  state.activeTemplate = template;
  [...templateTabs.querySelectorAll(".tab")].forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.template === template);
  });
  toggleFields();
  rebuildPreviewsForActiveTemplate();
}

function toggleFields() {
  const t = state.activeTemplate;
  const setHidden = (selector, hidden) => {
    document.querySelectorAll(selector).forEach(el => {
      if (hidden) el.classList.add("is-hidden");
      else el.classList.remove("is-hidden");
    });
  };
  setHidden(".only-felicitaciones", t !== "felicitaciones");
  setHidden(".no-felicitaciones",   t === "felicitaciones");
  setHidden(".only-vendido",    t !== "vendido");
  setHidden(".only-venta",      !(t === "venta" || t === "vendido"));
  setHidden(".only-portada",    t !== "portada");
  setHidden(".only-historiaV2", t !== "historiaV2");
  setHidden(".only-historia",   t !== "historia");
  setHidden(".only-motor",      !(t === "historia" || t === "historiaV2"));
  setHidden(".only-gearbox",    !(t === "portada" || t === "historia" || t === "historiaV2"));
  setHidden(".only-jpg",        exportFormatSelect.value !== "jpg");
}

templateTabs.addEventListener("click", e => {
  const btn = e.target.closest(".tab");
  if (!btn || !btn.dataset.template) return;
  setActiveTemplate(btn.dataset.template);
});

exportFormatSelect.addEventListener("change", () => {
  toggleFields();
  updateAllPreviewNames();
});

showGuidesChk.addEventListener("change", () => rerenderAll());

kmHiddenChk?.addEventListener("change", () => {
  if (!kmInput) return;
  if (kmHiddenChk.checked) { kmInput.value = ""; kmInput.disabled = true; }
  else kmInput.disabled = false;
  saveForm(); rerenderAll();
});

// ── Form data ─────────────────────────────────────────────────────────────────
function getFormData() {
  return {
    brand:        document.getElementById("brand")?.value || "",
    model:        document.getElementById("model")?.value || "",
    year:         document.getElementById("year")?.value || "",
    version:      document.getElementById("version")?.value || "",
    engine:       document.getElementById("engine")?.value || "",
    gearbox:      document.getElementById("gearbox")?.value || "",
    motorTraction:document.getElementById("motorTraction")?.value || "",
    kmHidden:     Boolean(kmHiddenChk?.checked),
    // Strip dots so formatKm receives a plain number
    km:           stripFormat(kmHiddenChk?.checked ? "" : (kmInput?.value || "")),
    extra1:       document.getElementById("extra1")?.value || "",
    extra2:       document.getElementById("extra2")?.value || "",
    clientName:   clientNameInput?.value || "",
    soldText:     soldTextInput?.value || "VENDIDO",
    price:        document.getElementById("price")?.value || "",
    priceCredit:  document.getElementById("priceCredit")?.value || "",
  };
}

function getSelectedTemplates() {
  const arr = [];
  if (expPortada?.checked)        arr.push("portada");
  if (expVenta?.checked)          arr.push("venta");
  if (expVendido?.checked)        arr.push("vendido");
  if (expHistoria?.checked)       arr.push("historia");
  if (expHistoriaV2?.checked)     arr.push("historiaV2");
  if (expFelicitaciones?.checked) arr.push("felicitaciones");
  return arr;
}

function getDrawer(template) {
  if (template === "portada")       return drawPortadaFicha;
  if (template === "venta")         return drawVenta;
  if (template === "vendido")       return drawVendido;
  if (template === "historia")      return drawHistoria;
  if (template === "historiaV2")    return (ctx, img, data, transform) => drawHistoriaV2(ctx, img, data, transform);
  if (template === "felicitaciones")return drawFelicitaciones;
  return drawPortadaFicha;
}

function getRenderer(template) {
  if (template === "portada")       return renderPortadaFicha;
  if (template === "venta")         return renderVenta;
  if (template === "vendido")       return renderVendido;
  if (template === "historia")      return renderHistoria;
  if (template === "historiaV2")    return renderHistoriaV2;
  if (template === "felicitaciones")return renderFelicitaciones;
  return renderPortadaFicha;
}

function templatePrefix(template) {
  const MAP = { portada:"PORTADA", venta:"VENTA", vendido:"VENDIDO",
    historia:"HISTORIA", historiaV2:"HISTORIA-V2", felicitaciones:"FELICITACIONES" };
  return MAP[template] || "BANNER";
}

function folderName(template) {
  const MAP = { portada:"portada", venta:"venta", vendido:"vendido",
    historia:"historia", historiaV2:"historia-v2", felicitaciones:"felicitaciones" };
  return MAP[template] || "banners";
}

function getOutputName({ template, data, index, ext }) {
  const prefix = templatePrefix(template);
  const year   = slugify(data.year);
  const model  = slugify(data.model);
  const brand  = slugify(data.brand);
  const client = slugify(data.clientName || "cliente");
  const n      = pad2(index + 1);

  let parts = [];
  if (template === "portada")         parts = [prefix, brand, model, year, n];
  else if (template === "historia")   parts = [prefix, model, year, "01"];
  else if (template === "historiaV2") parts = [prefix, model, year, n];
  else if (template === "felicitaciones") parts = [prefix, model, year, client, n];
  else                                parts = [prefix, model, year, n];

  const name = parts.filter(Boolean).join("-") || `${prefix}-${n}`;
  return `${name}.${ext}`;
}

// ── Render helpers ────────────────────────────────────────────────────────────
function renderPreview(item) {
  if (state.activeTemplate === "historia") { renderStoryPreview(); return; }
  const data = getFormData();
  const drawer = getDrawer(state.activeTemplate);
  const ctx = item.canvas.getContext("2d");
  if (state.activeTemplate === "historiaV2") {
    drawer(ctx, item.img, data, item.transform);
  } else {
    drawer(ctx, item.img, data, item.transform, _appLogo);
  }
  if (showGuidesChk.checked) drawRuleOfThirds(ctx, item.canvas.width, item.canvas.height, 0.25);
}

function updatePreviewName(item) {
  const data = getFormData();
  const ext = exportFormatSelect.value === "png" ? "png" : "jpg";
  const name = getOutputName({ template: state.activeTemplate, data, index: item.index, ext });
  item.nameEl.textContent = name;
}

function updateAllPreviewNames() { state.items.forEach(updatePreviewName); }

let rerenderTimer = null;
function rerenderAll() {
  if (!state.hasPreviews) return;
  if (rerenderTimer) cancelAnimationFrame(rerenderTimer);
  rerenderTimer = requestAnimationFrame(() => {
    if (state.activeTemplate === "historia") {
      updateStoryPreviewName(); renderStoryPreview(); return;
    }
    state.items.forEach(item => { updatePreviewName(item); renderPreview(item); });
  });
}

// ── Historia helpers ──────────────────────────────────────────────────────────
function ensureStoryDefaults() {
  if (state.story?.blocks) {
    if (!state.story.separators) state.story.separators = { s1:0, s2:0, s3:0 };
    return;
  }
  const total = state.images.length;
  const pick = (f) => (total ? Math.min(total - 1, Math.max(0, f)) : 0);
  state.story = {
    activeBlock: 1,
    separators: { s1:0, s2:0, s3:0 },
    blocks: {
      1: { imgIndex: pick(0), transform: { zoom:1, panX:0, panY:0 } },
      2: { imgIndex: pick(1), transform: { zoom:1, panX:0, panY:0 } },
      4: { imgIndex: pick(2), transform: { zoom:1, panX:0, panY:0 } },
    },
  };
}

function updateStoryPreviewName() {
  if (!state.storyItem) return;
  const data = getFormData();
  const ext = exportFormatSelect.value === "png" ? "png" : "jpg";
  state.storyItem.nameEl.textContent = getOutputName({ template:"historia", data, index:0, ext });
}

function renderStoryPreview() {
  if (!state.storyItem?.canvas) return;
  ensureStoryDefaults();
  const data = getFormData();
  const ctx = state.storyItem.canvas.getContext("2d");
  drawHistoria(ctx, state.images, data, state.story, _appLogo);
  if (showGuidesChk.checked) drawRuleOfThirds(ctx, state.storyItem.canvas.width, state.storyItem.canvas.height, 0.25);
}

function rebuildPreviewsForActiveTemplate() {
  if (!state.hasPreviews) return;
  previewsContainer.innerHTML = "";
  state.items.forEach(it => { it.canvas = null; it.zoomInput = null; it.nameEl = null; });
  state.storyItem = null;
  showEmptyState(false);

  if (state.activeTemplate === "historia") {
    ensureStoryDefaults();
    previewsContainer.appendChild(makeStoryPreviewItem());
    updateStoryPreviewName(); renderStoryPreview(); return;
  }
  if (state.activeTemplate === "felicitaciones") {
    const single = state.items[0] || { file:null, img:null, baseName:"", index:0, transform:{zoom:1,panX:0,panY:0}, canvas:null, zoomInput:null, nameEl:null };
    previewsContainer.appendChild(makePreviewItem(single));
    renderPreview(single); return;
  }
  state.items.forEach(item => {
    previewsContainer.appendChild(makePreviewItem(item));
    renderPreview(item);
  });
}

// ── Empty state ───────────────────────────────────────────────────────────────
function showEmptyState(show) {
  if (emptyState) emptyState.style.display = show ? "flex" : "none";
}

// ── Live input → rerender ─────────────────────────────────────────────────────
document.addEventListener("input", e => {
  const el = e.target;
  if (!(el instanceof HTMLElement)) return;
  const relevant = ["brand","model","year","version","engine","gearbox","motorTraction",
    "extra1","extra2","clientName","soldText"];
  if (relevant.includes(el.id)) { saveForm(); rerenderAll(); }
});

// ── Individual image download ─────────────────────────────────────────────────
async function downloadSingleImage(item) {
  const data = getFormData();
  const format  = exportFormatSelect.value === "png" ? "png" : "jpg";
  const quality = Number(jpgQualityRange.value || 0.92);
  data.__exportFormat = format;
  data.__exportQuality = quality;

  const renderer = getRenderer(state.activeTemplate);
  const { blob } = await renderer({ img: item.img, data, transform: item.transform });

  const name = getOutputName({ template: state.activeTemplate, data, index: item.index, ext: format });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// ── Preview item builder ──────────────────────────────────────────────────────
function makePreviewItem(item) {
  const wrap = document.createElement("div");
  wrap.className = "preview-item";

  const canvas = document.createElement("canvas");
  canvas.width  = 1080;
  canvas.height = state.activeTemplate === "historiaV2" ? 1920 : 1080;
  canvas.className = "preview-canvas";
  item.canvas = canvas;

  const controls = document.createElement("div");
  controls.className = "preview-controls";

  const zoomLabel = document.createElement("div");
  zoomLabel.className = "preview-control-label";
  zoomLabel.textContent = "Zoom";

  const zoom = document.createElement("input");
  zoom.type = "range"; zoom.min = "1"; zoom.max = String(MAX_ZOOM);
  zoom.step = "0.01"; zoom.value = String(item.transform.zoom);
  zoom.className = "preview-zoom";
  item.zoomInput = zoom;

  const applyAll = document.createElement("button");
  applyAll.type = "button"; applyAll.className = "btn-secondary btn-apply-all";
  applyAll.textContent = "Aplicar a todas";

  const reset = document.createElement("button");
  reset.type = "button"; reset.className = "btn-secondary btn-reset";
  reset.textContent = "Reset";

  // ── Download button ───────────────────────────────────────────────────────
  const dlBtn = document.createElement("button");
  dlBtn.type = "button"; dlBtn.className = "btn-secondary btn-dl-single";
  dlBtn.title = "Descargar esta imagen";
  dlBtn.innerHTML = "⬇ Descargar";

  const name = document.createElement("div");
  name.className = "preview-name";
  item.nameEl = name;
  updatePreviewName(item);

  controls.appendChild(zoomLabel);
  controls.appendChild(zoom);
  controls.appendChild(applyAll);
  controls.appendChild(reset);
  controls.appendChild(dlBtn);

  wrap.appendChild(canvas);
  wrap.appendChild(controls);
  wrap.appendChild(name);

  // ── Drag ──────────────────────────────────────────────────────────────────
  let dragging = false, lastX = 0, lastY = 0;
  const getScale = () => {
    const r = canvas.getBoundingClientRect();
    return { sx: canvas.width / Math.max(1, r.width), sy: canvas.height / Math.max(1, r.height) };
  };
  canvas.addEventListener("pointerdown", e => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    canvas.classList.add("is-dragging");
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  });
  canvas.addEventListener("pointermove", e => {
    if (!dragging) return;
    const { sx, sy } = getScale();
    item.transform.panX += (e.clientX - lastX) * sx;
    item.transform.panY += (e.clientY - lastY) * sy;
    lastX = e.clientX; lastY = e.clientY;
    renderPreview(item);
  });
  const onUp = () => { dragging = false; canvas.classList.remove("is-dragging"); };
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("pointerleave", onUp);
  canvas.addEventListener("wheel", e => {
    e.preventDefault();
    const next = item.transform.zoom + (Math.sign(e.deltaY) < 0 ? 0.03 : -0.03);
    item.transform.zoom = Math.max(1, Math.min(MAX_ZOOM, next));
    zoom.value = String(item.transform.zoom);
    renderPreview(item);
  }, { passive: false });

  zoom.addEventListener("input", () => {
    item.transform.zoom = Math.max(1, Math.min(MAX_ZOOM, Number(zoom.value) || 1));
    renderPreview(item);
  });
  reset.addEventListener("click", () => {
    item.transform = { zoom:1, panX:0, panY:0 };
    zoom.value = "1"; renderPreview(item);
  });
  applyAll.addEventListener("click", () => {
    const { zoom: z, panX, panY } = item.transform;
    state.items.forEach(it => {
      it.transform.zoom = z; it.transform.panX = panX; it.transform.panY = panY;
      if (it.zoomInput) it.zoomInput.value = String(z);
      renderPreview(it);
    });
  });
  dlBtn.addEventListener("click", () => {
    if (!item.img) return;
    dlBtn.disabled = true; dlBtn.textContent = "…";
    downloadSingleImage(item).finally(() => { dlBtn.disabled = false; dlBtn.innerHTML = "⬇ Descargar"; });
  });

  return wrap;
}

// ── Story preview builder ─────────────────────────────────────────────────────
function makeStoryPreviewItem() {
  const wrap = document.createElement("div");
  wrap.className = "preview-item story-preview-wrap";

  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1920;
  canvas.className = "preview-canvas preview-canvas-story";

  const controls = document.createElement("div");
  controls.className = "story-controls";

  const secBlocks = document.createElement("div");
  secBlocks.className = "story-section";
  const secBlocksTitle = document.createElement("div");
  secBlocksTitle.className = "story-section-title";
  secBlocksTitle.textContent = "Bloque activo";
  const blockTabs = document.createElement("div");
  blockTabs.className = "story-block-tabs";
  const blockBtns = {};
  const updateBlockTabs = () => {
    const active = state.story?.activeBlock ?? 1;
    [1, 2, 4].forEach(b => blockBtns[b]?.classList.toggle("is-active", b === active));
  };
  [1, 2, 4].forEach(b => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "story-block-btn" + (b === (state.story?.activeBlock ?? 1) ? " is-active" : "");
    btn.textContent = `Bloque ${b}`;
    btn.addEventListener("click", () => { state.story.activeBlock = b; updateBlockTabs(); syncZoom(); renderStoryPreview(); });
    blockBtns[b] = btn; blockTabs.appendChild(btn);
  });
  secBlocks.appendChild(secBlocksTitle); secBlocks.appendChild(blockTabs);

  const secPhotos = document.createElement("div");
  secPhotos.className = "story-section";
  const secPhotosTitle = document.createElement("div");
  secPhotosTitle.className = "story-section-title";
  secPhotosTitle.textContent = "Fotos";
  const makeSelect = (labelText, blockNo) => {
    const row = document.createElement("div"); row.className = "story-row";
    const label = document.createElement("div");
    label.className = "story-row-label"; label.textContent = labelText;
    const sel = document.createElement("select"); sel.className = "story-select";
    state.images.forEach((im, idx) => {
      const opt = document.createElement("option");
      opt.value = String(idx); opt.textContent = `${idx + 1} · ${im.baseName || "foto"}`;
      sel.appendChild(opt);
    });
    sel.value = String(state.story.blocks[blockNo].imgIndex ?? 0);
    sel.addEventListener("change", () => { state.story.blocks[blockNo].imgIndex = Number(sel.value) || 0; renderStoryPreview(); });
    row.appendChild(label); row.appendChild(sel); return row;
  };
  secPhotos.appendChild(secPhotosTitle);
  secPhotos.appendChild(makeSelect("Bloque 1", 1));
  secPhotos.appendChild(makeSelect("Bloque 2", 2));
  secPhotos.appendChild(makeSelect("Bloque 4", 4));

  const secZoom = document.createElement("div"); secZoom.className = "story-section";
  const secZoomTitle = document.createElement("div");
  secZoomTitle.className = "story-section-title"; secZoomTitle.textContent = "Recorte (bloque activo)";
  const zoomRow = document.createElement("div"); zoomRow.className = "story-zoom-row";
  const zoomIcon = document.createElement("span"); zoomIcon.className = "story-zoom-icon"; zoomIcon.textContent = "🔍";
  const zoom = document.createElement("input");
  zoom.type = "range"; zoom.min = "1"; zoom.max = String(MAX_ZOOM); zoom.step = "0.01";
  zoom.className = "preview-zoom story-zoom-range";
  const zoomVal = document.createElement("span"); zoomVal.className = "story-zoom-val"; zoomVal.textContent = "1.00×";
  zoomRow.appendChild(zoomIcon); zoomRow.appendChild(zoom); zoomRow.appendChild(zoomVal);
  const btnRow = document.createElement("div"); btnRow.className = "story-btn-row";
  const reset = document.createElement("button"); reset.type = "button"; reset.className = "btn-secondary story-btn"; reset.innerHTML = "↺ Reset";
  const applyAll = document.createElement("button"); applyAll.type = "button"; applyAll.className = "btn-secondary story-btn"; applyAll.innerHTML = "⬡ Aplicar a los 3";
  btnRow.appendChild(reset); btnRow.appendChild(applyAll);
  const hint = document.createElement("div"); hint.className = "story-hint";
  hint.innerHTML = "💡 Tocá un bloque de foto en la preview para seleccionarlo, luego arrastrá para encuadrar o usá el scroll para hacer zoom.";
  secZoom.appendChild(secZoomTitle); secZoom.appendChild(zoomRow); secZoom.appendChild(btnRow);

  controls.appendChild(secBlocks); controls.appendChild(secPhotos);
  controls.appendChild(secZoom); controls.appendChild(hint);

  const name = document.createElement("div"); name.className = "preview-name";
  state.storyItem = { canvas, nameEl: name, zoomInput: zoom };

  const getActive = () => state.story.blocks[state.story.activeBlock];
  const syncZoom = () => {
    const z = getActive()?.transform?.zoom ?? 1;
    zoom.value = String(z); zoomVal.textContent = z.toFixed(2) + "×";
  };
  syncZoom();

  let dragging = false, dragMode = null, dragSepKey = null, lastX = 0, lastY = 0;
  const getScale = () => {
    const r = canvas.getBoundingClientRect();
    return { sx: canvas.width / Math.max(1, r.width), sy: canvas.height / Math.max(1, r.height) };
  };

  canvas.addEventListener("pointerdown", e => {
    const rect = canvas.getBoundingClientRect();
    const y = ((e.clientY - rect.top) / Math.max(1, rect.height)) * canvas.height;
    const base = { s1:480, s2:960, s3:1440 };
    const seps = state.story.separators || (state.story.separators = { s1:0, s2:0, s3:0 });
    const hitPx = 22;
    const sepKey = Math.abs(y - (base.s1 + seps.s1)) <= hitPx ? "s1" :
                   Math.abs(y - (base.s2 + seps.s2)) <= hitPx ? "s2" :
                   Math.abs(y - (base.s3 + seps.s3)) <= hitPx ? "s3" : null;
    if (sepKey) {
      dragging = true; dragMode = "sep"; dragSepKey = sepKey;
      canvas.classList.add("is-dragging"); lastX = e.clientX; lastY = e.clientY;
      try { canvas.setPointerCapture(e.pointerId); } catch {} return;
    }
    const b = historiaBlockFromY(y);
    if (b === 1 || b === 2 || b === 4) { state.story.activeBlock = b; updateBlockTabs(); syncZoom(); renderStoryPreview(); }
    dragging = true; dragMode = "pan"; canvas.classList.add("is-dragging");
    lastX = e.clientX; lastY = e.clientY;
    try { canvas.setPointerCapture(e.pointerId); } catch {};
  });

  canvas.addEventListener("pointermove", e => {
    const rect = canvas.getBoundingClientRect();
    const y = ((e.clientY - rect.top) / Math.max(1, rect.height)) * canvas.height;
    if (!dragging) {
      const base = { s1:480, s2:960, s3:1440 };
      const seps = state.story?.separators || { s1:0, s2:0, s3:0 };
      const near = Math.abs(y - (base.s1 + seps.s1)) <= 22 || Math.abs(y - (base.s2 + seps.s2)) <= 22 || Math.abs(y - (base.s3 + seps.s3)) <= 22;
      canvas.style.cursor = near ? "row-resize" : "grab"; return;
    }
    const { sx, sy } = getScale();
    const dx = (e.clientX - lastX) * sx, dy = (e.clientY - lastY) * sy;
    lastX = e.clientX; lastY = e.clientY;
    if (dragMode === "sep" && dragSepKey) {
      const seps = state.story.separators || (state.story.separators = { s1:0, s2:0, s3:0 });
      seps[dragSepKey] = Math.max(-48, Math.min(48, (seps[dragSepKey] || 0) + dy));
      renderStoryPreview(); return;
    }
    const ab = state.story.activeBlock;
    if (!(ab === 1 || ab === 2 || ab === 4)) return;
    const t = state.story.blocks[ab].transform;
    t.panX += dx; t.panY += dy; renderStoryPreview();
  });

  const onUp = () => { dragging = false; dragMode = null; dragSepKey = null; canvas.classList.remove("is-dragging"); };
  canvas.addEventListener("pointerup", onUp); canvas.addEventListener("pointercancel", onUp); canvas.addEventListener("pointerleave", onUp);

  canvas.addEventListener("wheel", e => {
    e.preventDefault();
    const ab = state.story.activeBlock;
    if (!(ab === 1 || ab === 2 || ab === 4)) return;
    const t = state.story.blocks[ab].transform;
    t.zoom = Math.max(1, Math.min(MAX_ZOOM, t.zoom + (Math.sign(e.deltaY) < 0 ? 0.03 : -0.03)));
    syncZoom(); renderStoryPreview();
  }, { passive: false });

  zoom.addEventListener("input", () => {
    const ab = state.story.activeBlock;
    if (!(ab === 1 || ab === 2 || ab === 4)) return;
    const t = state.story.blocks[ab].transform;
    t.zoom = Math.max(1, Math.min(MAX_ZOOM, Number(zoom.value) || 1));
    zoomVal.textContent = t.zoom.toFixed(2) + "×"; renderStoryPreview();
  });
  reset.addEventListener("click", () => {
    const ab = state.story.activeBlock;
    if (!(ab === 1 || ab === 2 || ab === 4)) return;
    const t = state.story.blocks[ab].transform;
    t.zoom = 1; t.panX = 0; t.panY = 0; syncZoom(); renderStoryPreview();
  });
  applyAll.addEventListener("click", () => {
    const ab = state.story.activeBlock;
    if (!(ab === 1 || ab === 2 || ab === 4)) return;
    const src = state.story.blocks[ab].transform;
    [1, 2, 4].forEach(b => {
      state.story.blocks[b].transform.zoom = src.zoom;
      state.story.blocks[b].transform.panX = src.panX;
      state.story.blocks[b].transform.panY = src.panY;
    });
    syncZoom(); renderStoryPreview();
  });

  wrap.appendChild(canvas); wrap.appendChild(controls); wrap.appendChild(name);
  return wrap;
}

// ── Concurrency ───────────────────────────────────────────────────────────────
async function mapWithConcurrency(items, limit, worker, onProgress) {
  const queue = [...items];
  let done = 0;
  const results = [];
  const runners = Array.from({ length: Math.max(1, limit) }, async () => {
    while (queue.length) {
      const it = queue.shift();
      results.push(await worker(it));
      done += 1;
      if (onProgress) onProgress(done, items.length);
    }
  });
  await Promise.all(runners);
  return results;
}

// ── Generate (auto on file select + button) ───────────────────────────────────
async function generatePreviews() {
  const files = Array.from(imagesInput.files || []);
  if (!files.length) { alert("Seleccioná al menos una imagen."); return; }

  generateBtn.disabled = true;
  downloadZipBtn.disabled = true;
  previewsContainer.innerHTML = "";
  showEmptyState(false);
  state.images = []; state.items = []; state.story = null; state.storyItem = null; state.hasPreviews = false;

  const t0 = performance.now();
  setStatus("Cargando imágenes…");
  setProgress(0, files.length, "Cargando");

  const loaded = [];
  await mapWithConcurrency(
    files.map((file, index) => ({ file, index })),
    LOAD_CONCURRENCY,
    async ({ file, index }) => {
      const dataURL = await readFileAsDataURL(file);
      const img = await loadImage(dataURL);
      loaded.push({ file, img, index }); return true;
    },
    (done, total) => {
      const elapsed = (performance.now() - t0) / 1000;
      const rem = Math.max(0, Math.round((elapsed / Math.max(1, done)) * (total - done)));
      setStatus(`Cargando ${done}/${total}…`);
      setProgress(done, total, rem ? `Cargando · ~${rem}s` : "Cargando");
    }
  );

  loaded.sort((a, b) => a.index - b.index);
  state.images = loaded.map(({ file, img, index }) => ({
    file, img, index, baseName: getFileBaseName(file),
  }));
  state.items = state.images.map(({ file, img, baseName, index }) => ({
    file, img, baseName, index,
    transform: { zoom:1, panX:0, panY:0 },
    canvas: null, zoomInput: null, nameEl: null,
  }));

  state.hasPreviews = true;
  downloadZipBtn.disabled = false;
  generateBtn.disabled = false;
  setProgress(files.length, files.length, "Listo");
  setStatus(`✅ ${files.length} foto${files.length !== 1 ? "s" : ""} cargada${files.length !== 1 ? "s" : ""}. Arrastrá para reencuadrar, scroll para zoom.`);
  rebuildPreviewsForActiveTemplate();
}

// ── ZIP export ────────────────────────────────────────────────────────────────
async function buildZipAndDownload() {
  if (!state.items.length) return;
  const selectedTemplates = getSelectedTemplates();
  if (!selectedTemplates.length) { alert("Seleccioná al menos una plantilla para exportar."); return; }

  downloadZipBtn.disabled = true;
  generateBtn.disabled = true;

  const exportFormat = exportFormatSelect.value === "png" ? "png" : "jpg";
  const jpgQuality   = Number(jpgQualityRange.value || 0.92);
  const data = getFormData();
  data.__exportFormat  = exportFormat;
  data.__exportQuality = jpgQuality;

  const zip = new JSZip();
  const folders = {};
  selectedTemplates.forEach(t => { folders[t] = zip.folder(folderName(t)); });

  ensureStoryDefaults();
  const perImageTemplates = selectedTemplates.filter(t => t !== "historia");
  const total = state.items.length * perImageTemplates.length + (selectedTemplates.includes("historia") ? 1 : 0);
  let done = 0;
  const t0 = performance.now();
  setStatus("Exportando…"); setProgress(0, total, "Exportando");

  const jobs = [];
  if (selectedTemplates.includes("historia")) jobs.push({ template:"historia", item:null });
  for (const template of perImageTemplates)
    for (const item of state.items) jobs.push({ template, item });

  await mapWithConcurrency(jobs, EXPORT_CONCURRENCY, async ({ template, item }) => {
    if (template === "historia") {
      const { blob } = await renderHistoria({ images: state.images, data, story: state.story });
      folders[template].file(getOutputName({ template:"historia", data, index:0, ext:exportFormat }), blob);
      return true;
    }
    const { blob } = await getRenderer(template)({ img: item.img, data, transform: item.transform });
    folders[template].file(getOutputName({ template, data, index: item.index, ext: exportFormat }), blob);
    return true;
  }, (d, tot) => {
    done = d;
    const elapsed = (performance.now() - t0) / 1000;
    const rem = Math.max(0, Math.round((elapsed / Math.max(1, done)) * (tot - done)));
    setStatus(`Exportando ${done}/${tot}…`);
    setProgress(done, tot, rem ? `Exportando · ~${rem}s` : "Exportando");
  });

  setStatus("Creando ZIP…"); setProgress(total, total, "Creando ZIP");
  const zipBlob = await zip.generateAsync({ type:"blob" });
  const modelName = slugify(cleanSpaces(data.model) || "vehiculo");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(zipBlob);
  a.download = `banners-${modelName || "vehiculo"}.zip`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(a.href);

  setStatus(`✅ ZIP listo: ${total} archivo(s) en ${selectedTemplates.length} carpeta(s).`);
  downloadZipBtn.disabled = false;
  generateBtn.disabled = false;
}

// ── Button events ─────────────────────────────────────────────────────────────
generateBtn.addEventListener("click", () => {
  generatePreviews().catch(err => {
    console.error(err);
    setStatus("Error al generar las previews.");
    generateBtn.disabled = false;
  });
});

// Auto-generate on file select
imagesInput.addEventListener("change", () => {
  if (imagesInput.files?.length) {
    generatePreviews().catch(err => { console.error(err); generateBtn.disabled = false; });
  }
});

downloadZipBtn.addEventListener("click", () => {
  buildZipAndDownload().catch(err => {
    console.error(err);
    setStatus("Error al exportar el ZIP.");
    downloadZipBtn.disabled = false; generateBtn.disabled = false;
  });
});

clearFormBtn?.addEventListener("click", () => {
  if (!confirm("¿Borrar todos los datos del formulario?")) return;
  FORM_IDS.forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
  if (kmHiddenChk) { kmHiddenChk.checked = false; if (kmInput) kmInput.disabled = false; }
  try { localStorage.removeItem(LS_KEY); } catch {}
  rerenderAll();
});

// ── Init ──────────────────────────────────────────────────────────────────────
restoreForm();
toggleFields();
setActiveTemplate("portada");
showEmptyState(true);

// Setup live formatting
setupLiveFormat("km",         formatNumInput);
setupLiveFormat("price",      formatPriceInput);
setupLiveFormat("priceCredit",formatPriceInput);

