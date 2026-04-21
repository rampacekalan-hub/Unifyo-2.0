// src/lib/avatar.ts
// Server-backed avatar: POST to /api/user/avatar, read from the /me
// payload. A small in-memory cache avoids re-fetching across listeners;
// subscribers get called whenever setAvatar/clearAvatar run.
//
// History: originally we stashed the dataURL in localStorage. That
// "worked" but leaked across account switches on shared browsers —
// user A's photo showed up for user B after logout/login. Moving
// storage to the User row fixes the leak at its root.

let current: string | null = null;
let hydrated = false;

export function getAvatar(): string | null {
  return current;
}

export function primeAvatar(v: string | null): void {
  current = v;
  hydrated = true;
  emit();
}

export async function ensureHydrated(): Promise<void> {
  if (hydrated || typeof window === "undefined") return;
  try {
    const res = await fetch("/api/user/me", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      current = data?.user?.avatarDataUrl ?? null;
    }
  } catch {
    // Offline — current stays null.
  } finally {
    hydrated = true;
    emit();
  }
}

export async function clearAvatar(): Promise<void> {
  try {
    await fetch("/api/user/avatar", { method: "DELETE" });
  } catch {
    // If offline, still clear locally so UI reflects intent.
  }
  current = null;
  emit();
}

// Downscale + re-encode, then push to server. Keeping thumbnails small
// makes the User row light — full images belong in filesystem storage.
export async function setAvatarFromFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Nepovolený typ súboru");
  if (file.size > 5 * 1024 * 1024) throw new Error("Obrázok je príliš veľký (max 5 MB)");
  const dataUrl = await fileToDataUrl(file);
  const resized = await resize(dataUrl, 256, 256);

  const res = await fetch("/api/user/avatar", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl: resized }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Uloženie zlyhalo");
  }
  current = resized;
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
      // JPEG at 0.82 hits ~25KB for typical photos — comfortably under
      // the 60KB DB cap we enforce server-side.
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => reject(new Error("Nepodarilo sa načítať obrázok"));
    img.src = src;
  });
}

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
export function subscribeAvatar(fn: () => void): () => void {
  listeners.add(fn);
  // Auto-hydrate on first subscribe so consumers don't need to call it.
  if (!hydrated) ensureHydrated();
  return () => { listeners.delete(fn); };
}
