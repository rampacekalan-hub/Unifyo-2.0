// src/lib/avatar.ts
// Local-first avatar: store downscaled dataURL in localStorage. Good enough
// for single-device polish; replace with S3/R2 upload when we ship billing.

const KEY = "unifyo.avatar.v1";

export function getAvatar(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function clearAvatar(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(KEY); emit(); } catch { /* noop */ }
}

// Downscale + re-encode to keep localStorage small (<25KB typical).
export async function setAvatarFromFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Nepovolený typ súboru");
  if (file.size > 5 * 1024 * 1024) throw new Error("Obrázok je príliš veľký (max 5 MB)");
  const dataUrl = await fileToDataUrl(file);
  const resized = await resize(dataUrl, 256, 256);
  try {
    localStorage.setItem(KEY, resized);
  } catch {
    throw new Error("Úložisko je plné — uvoľni miesto");
  }
  emit();
  return resized;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error("Čítanie zlyhalo"));
    fr.readAsDataURL(file);
  });
}

function resize(src: string, targetW: number, targetH: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas unavailable")); return; }
      // Cover crop — center-square so tall/wide images don't distort.
      const scale = Math.max(targetW / img.width, targetH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const dx = (targetW - drawW) / 2;
      const dy = (targetH - drawH) / 2;
      ctx.drawImage(img, dx, dy, drawW, drawH);
      // JPEG at 0.85 is a good balance; PNG bloats too much for photos.
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error("Nepodarilo sa načítať obrázok"));
    img.src = src;
  });
}

// Tiny pub/sub so sidebar + settings stay in sync when avatar changes.
const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
export function subscribeAvatar(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => { if (e.key === KEY) emit(); });
}
