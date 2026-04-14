/**
 * In-process admin runtime store.
 * - Module toggles (override site-settings.ts defaults)
 * - Admin action log (last 200 entries)
 * - Broadcast message for SSE
 *
 * In production, replace with Redis or DB-backed store for multi-instance support.
 */
import { getSiteConfig } from "@/config/site-settings";

export interface AdminLogEntry {
  id: string;
  ts: string;
  action: string;
  adminEmail: string;
  detail: string;
}

export interface BroadcastMessage {
  id: string;
  text: string;
  ts: string;
  adminEmail: string;
  startsAt: string | null;   // ISO — null means immediate
  expiresAt: string | null;  // ISO — null means no expiry
}

/**
 * Returns the broadcast only if it is currently active
 * (within [startsAt, expiresAt] window).
 */
export function getActiveBroadcast(): BroadcastMessage | null {
  const msg = adminStore?.broadcast;
  if (!msg) return null;
  const now = Date.now();
  if (msg.startsAt && now < new Date(msg.startsAt).getTime()) return null;
  if (msg.expiresAt && now > new Date(msg.expiresAt).getTime()) return null;
  return msg;
}

interface AdminStore {
  toggles: Record<string, boolean>;
  log: AdminLogEntry[];
  broadcast: BroadcastMessage | null;
  sseClients: Set<(msg: string) => void>;
}

const globalStore = globalThis as unknown as { __adminStore?: AdminStore };

function buildDefaultToggles(): Record<string, boolean> {
  const config = getSiteConfig();
  return Object.fromEntries(
    Object.entries(config.modules).map(([key, mod]) => [key, mod.enabled])
  );
}

if (!globalStore.__adminStore) {
  globalStore.__adminStore = {
    toggles: buildDefaultToggles(),
    log: [],
    broadcast: null,
    sseClients: new Set(),
  };
}

export const adminStore = globalStore.__adminStore!;

export function logAdminAction(adminEmail: string, action: string, detail: string) {
  const entry: AdminLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: new Date().toISOString(),
    action,
    adminEmail,
    detail,
  };
  adminStore.log.unshift(entry);
  if (adminStore.log.length > 200) adminStore.log.length = 200;
  return entry;
}

export function publishSSE(event: string, data: unknown) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of adminStore.sseClients) {
    try { client(msg); } catch { adminStore.sseClients.delete(client); }
  }
}

// ── Auto-cleanup: check expired broadcasts every 60 seconds ──
const globalWithCleanup = globalThis as unknown as { __broadcastCleanup?: boolean };
if (!globalWithCleanup.__broadcastCleanup) {
  globalWithCleanup.__broadcastCleanup = true;
  setInterval(() => {
    const msg = adminStore.broadcast;
    if (!msg || !msg.expiresAt) return;
    if (Date.now() > new Date(msg.expiresAt).getTime()) {
      adminStore.broadcast = null;
      publishSSE("broadcast_clear", {});
      console.log(`[ADMIN_STORE] Broadcast expired and cleared: "${msg.text}"`);
    }
  }, 60_000);
}
