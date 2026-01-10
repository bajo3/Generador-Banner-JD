
import { readFileAsDataURL, loadImage, getFileBaseName, cleanSpaces } from "./utils.js";
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
const templateSelect = document.getElementById("template");

const clientNameInput = document.getElementById("clientName");
const soldTextInput = document.getElementById("soldText");

const MAX_ZOOM = 1.5;

let session = {
  template: "portada",
  data: {},
  items: [], // { file, img, baseName, outputName, transform, canvas }
};

function toggleFields() {
  const t = templateSelect.value;

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
}

templateSelect.addEventListener("change", toggleFields);
toggleFields();

function getFormData() {
  const data = {
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
  return data;
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

function getOutputName({ baseName, template, data }) {
  const safeBase = cleanSpaces(baseName || "auto").replace(/[^a-zA-Z0-9_-]+/g, "-");
  if (template === "felicitaciones") {
    const n = cleanSpaces(data.clientName || "cliente").replace(/[^a-zA-Z0-9_-]+/g, "-");
    return `${safeBase}-felicitaciones-${n}.jpg`;
  }
  return `${safeBase}-${template}.jpg`;
}

function renderPreview(item) {
  const drawer = getDrawer(session.template);
  const ctx = item.canvas.getContext("2d");
  drawer(ctx, item.img, session.data, item.transform);
}

function setStatus(text) {
  statusText.textContent = text;
}

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

  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "btn-secondary btn-reset";
  reset.textContent = "Reset";

  const name = document.createElement("div");
  name.className = "preview-name";
  name.textContent = item.outputName;

  controls.appendChild(zoomLabel);
  controls.appendChild(zoom);
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
    try { canvas.setPointerCapture(e.pointerId); } catch {}
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

  zoom.addEventListener("input", () => {
    item.transform.zoom = Math.max(1, Math.min(MAX_ZOOM, Number(zoom.value) || 1));
    // Keep pan values; clamping happens in drawCoverPanZoom.
    renderPreview(item);
  });

  reset.addEventListener("click", () => {
    item.transform.zoom = 1;
    item.transform.panX = 0;
    item.transform.panY = 0;
    zoom.value = "1";
    renderPreview(item);
  });

  return wrap;
}

async function generatePreviews() {
  const files = Array.from(imagesInput.files || []);
  if (!files.length) {
    alert("Seleccioná al menos una imagen.");
    return;
  }

  const template = templateSelect.value;
  const data = getFormData();

  generateBtn.disabled = true;
  downloadZipBtn.disabled = true;
  previewsContainer.innerHTML = "";
  setStatus("Cargando imágenes…");

  session = { template, data, items: [] };

  let processed = 0;
  for (const file of files) {
    try {
      setStatus(`Cargando ${processed + 1} de ${files.length}…`);
      const dataURL = await readFileAsDataURL(file);
      const img = await loadImage(dataURL);

      const baseName = getFileBaseName(file);
      const outputName = getOutputName({ baseName, template, data });

      const item = {
        file,
        img,
        baseName,
        outputName,
        transform: { zoom: 1, panX: 0, panY: 0 },
        canvas: null,
      };

      const node = makePreviewItem(item);
      previewsContainer.appendChild(node);

      session.items.push(item);
      renderPreview(item);

      processed++;
    } catch (err) {
      console.error("Error procesando archivo:", file?.name, err);
    }
  }

  if (!processed) {
    setStatus("No se pudo generar ninguna preview. Revisá las imágenes.");
    generateBtn.disabled = false;
    return;
  }

  downloadZipBtn.disabled = false;
  setStatus(`✅ Previews listas: ${processed}. Arrastrá para reencuadrar y ajustá zoom. Luego descargá el ZIP.`);
  generateBtn.disabled = false;
}

async function buildZipAndDownload() {
  if (!session.items.length) return;

  downloadZipBtn.disabled = true;
  generateBtn.disabled = true;

  const zip = new JSZip();
  const renderer = getRenderer(session.template);

  let i = 0;
  for (const item of session.items) {
    try {
      setStatus(`Exportando ${i + 1} de ${session.items.length}…`);
      const { blob } = await renderer({ img: item.img, data: session.data, transform: item.transform });
      zip.file(item.outputName, blob);
      i++;
    } catch (err) {
      console.error("Error exportando:", item?.outputName, err);
    }
  }

  if (!i) {
    setStatus("No se pudo exportar. Probá de nuevo.");
    downloadZipBtn.disabled = false;
    generateBtn.disabled = false;
    return;
  }

  setStatus("Creando ZIP…");
  const zipBlob = await zip.generateAsync({ type: "blob" });

  const url = URL.createObjectURL(zipBlob);
  const model = (document.getElementById("model").value || "banners").trim();
  const a = document.createElement("a");
  a.href = url;
  a.download = `banners-${model || "vehiculo"}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  setStatus(`✅ ZIP listo: ${i} archivo(s).`);
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
