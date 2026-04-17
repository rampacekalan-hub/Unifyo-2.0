// src/lib/undoable.ts
// Deferred destructive action with undo toast. Caller removes the item from
// UI immediately (optimistic); if user clicks Späť within `delayMs`, we skip
// the real commit. Otherwise `commit()` runs.
//
// Pattern: UI deletes item → call confirmWithUndo(...) → on undo, caller
// restores via the returned `onUndo` callback, and no commit fires.

import { toast } from "sonner";

export interface UndoableOpts {
  message: string;
  commit: () => Promise<void> | void;
  onUndo?: () => void;
  undoLabel?: string;
  delayMs?: number;
}

export function confirmWithUndo(opts: UndoableOpts): void {
  const { message, commit, onUndo, undoLabel = "Späť", delayMs = 5000 } = opts;
  let cancelled = false;

  const timer = setTimeout(async () => {
    if (cancelled) return;
    try {
      await commit();
    } catch (e) {
      console.error("[confirmWithUndo] commit failed:", e);
      toast.error("Operácia zlyhala — skús znova");
      onUndo?.();
    }
  }, delayMs);

  toast(message, {
    duration: delayMs,
    action: {
      label: undoLabel,
      onClick: () => {
        cancelled = true;
        clearTimeout(timer);
        onUndo?.();
        toast.success("Obnovené");
      },
    },
  });
}
