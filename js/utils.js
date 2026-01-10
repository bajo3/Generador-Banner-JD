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
  const n = Number(km);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("es-AR");
}

export function upper(s) {
  return String(s || "").trim().toUpperCase();
}

export function cleanSpaces(s) {
  return String(s || "").trim().replace(/\s+/g, " ");
}
