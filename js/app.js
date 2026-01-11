import { readFileAsDataURL, loadImage, getFileBaseName, cleanSpaces, slugify, pad2 } from "./utils.js";
import { drawRuleOfThirds } from "./draw.js";
import {
  drawPortadaFicha,
  drawVenta,
  drawVendido,
  drawFelicitaciones,
  renderPortadaFicha,
  renderVenta,
  renderVendido,
  renderFelicitaciones,
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
const expFelicitaciones = document.getElementById("exp_felicitaciones");

const clientNameInput = document.getElementById("clientName");
const soldTextInput = document.getElementById("soldText");

const progressBar = document.getElementById("progressBar");
const progressMeta = document.getElementById("progressMeta");

const MAX_ZOOM = 1.5;
const LOAD_CONCURRENCY = 4;
const EXPORT_CONCURRENCY = 3;

let state = {
  activeTemplate: "portada",
  items: [], // { file, img, baseName, transform, canvas, zoomInput, nameEl }
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
  rerenderAll();
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

function getFormData() {
  return {
    brand: document.getElementById("brand")?.value || "",
    model: document.getElementById("model")?.value || "",
    year: document.getElementById("year")?.value || "",
    version: document.getElementById("version")?.value || "",
    engine: document.getElementById("engine")?.value || "",
    gearbox: document.getElementById("gearbox")?.value || "",
    km: document.getElementById("km")?.value || "",
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
  if (expFelicitaciones?.checked) arr.push("felicitaciones");
  return arr;
}

function getDrawer(template) {
  if (template === "portada") return drawPortadaFicha;
  if (template === "venta") return drawVenta;
  if (template === "vendido") return drawVendido;
  if (template === "felicitaciones") return drawFelicitaciones;
  return drawPortadaFicha;
}

function getRenderer(template) {
  if (template === "portada") return renderPortadaFicha;
  if (template === "venta") return renderVenta;
  if (template === "vendido") return renderVendido;
  if (template === "felicitaciones") return renderFelicitaciones;
  return renderPortadaFicha;
}

function templatePrefix(template) {
  if (template === "portada") return "PORTADA";
  if (template === "venta") return "VENTA";
  if (template === "vendido") return "VENDIDO";
  if (template === "felicitaciones") return "FELICITACIONES";
  return "BANNER";
}

function folderName(template) {
  if (template === "portada") return "portada";
  if (template === "venta") return "venta";
  if (template === "vendido") return "vendido";
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
  } else if (template === "felicitaciones") {
    parts = [prefix, model, year, client, n];
  } else {
    parts = [prefix, model, year, n];
  }

  const name = parts.filter(Boolean).join("-") || `${prefix}-${n}`;
  return `${name}.${ext}`;
}

function renderPreview(item) {
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
    state.items.forEach((item) => {
      updatePreviewName(item);
      renderPreview(item);
    });
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
  state.items = [];
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
  loaded.forEach(({ file, img, index }) => {
    const baseName = getFileBaseName(file);
    const item = {
      file,
      img,
      baseName,
      index,
      transform: { zoom: 1, panX: 0, panY: 0 },
      canvas: null,
      zoomInput: null,
      nameEl: null,
    };
    const node = makePreviewItem(item);
    previewsContainer.appendChild(node);
    state.items.push(item);
    renderPreview(item);
  });

  state.hasPreviews = true;
  downloadZipBtn.disabled = false;
  generateBtn.disabled = false;
  setProgress(files.length, files.length, "Listo");
  setStatus(`✅ Previews listas: ${files.length}. Arrastrá para reencuadrar (zoom 1.5) y descargá el ZIP.`);
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

  const total = state.items.length * selectedTemplates.length;
  let done = 0;
  const t0 = performance.now();

  setStatus("Exportando…");
  setProgress(0, total, "Exportando");

  const jobs = [];
  for (const template of selectedTemplates) {
    for (const item of state.items) {
      jobs.push({ template, item });
    }
  }

  await mapWithConcurrency(
    jobs,
    EXPORT_CONCURRENCY,
    async ({ template, item }) => {
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
