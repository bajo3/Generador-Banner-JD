export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function getFileBaseName(file) {
  const name = file?.name || "imagen";
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex === -1) return name;
  return name.substring(0, dotIndex);
}

export function formatKm(km) {
  // Avoid Number("") => 0 (would render 0KM).
  if (km === null || km === undefined) return "";
  const raw = String(km).trim();
  if (!raw) return "";
  const n = Number(raw);
  // Only format if it's a valid positive number.
  if (!Number.isFinite(n) || n <= 0) return "";
  return n.toLocaleString("es-AR");
}

export function upper(s) {
  return String(s || "").trim().toUpperCase();
}

export function cleanSpaces(s) {
  return String(s || "").trim().replace(/\s+/g, " ");
}

export function slugify(s) {
  return cleanSpaces(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function pad2(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "00";
  return String(Math.trunc(x)).padStart(2, "0");
}
