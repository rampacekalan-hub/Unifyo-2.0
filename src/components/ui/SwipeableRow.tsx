"use client";
// src/components/ui/SwipeableRow.tsx
// Swipe-left to reveal a destructive action. Touch only (pointer-coarse)
// to avoid interfering with desktop drag/select. Pass children as the row
// content; we wrap them and overlay an action button that slides in.
//
// No external gesture libs — plain touchstart/move/end for predictable
// behaviour on iOS Safari + Android Chrome.

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Trash2 } from "lucide-react";

interface Props {
  onAction: () => void;
  actionLabel?: string;
  children: ReactNode;
  threshold?: number;
  maxReveal?: number;
  className?: string;
}

export default function SwipeableRow({
  onAction,
  actionLabel = "Zmazať",
  children,
  threshold = 60,
  maxReveal = 88,
  className = "",
}: Props) {
  const [dx, setDx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const dragging = useRef(false);

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    startX.current = t.clientX;
    startY.current = t.clientY;
    dragging.current = false;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (startX.current == null || startY.current == null) return;
    const t = e.touches[0];
    const deltaX = t.clientX - startX.current;
    const deltaY = t.clientY - startY.current;
    // Only engage horizontal drag once it clearly beats vertical scroll.
    if (!dragging.current) {
      if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        dragging.current = true;
      } else if (Math.abs(deltaY) > 10) {
        // It's a vertical scroll — stop tracking.
        startX.current = null;
        startY.current = null;
        return;
      }
    }
    if (dragging.current) {
      // Allow left swipe (negative dx) freely; snap back quickly on right.
      const next = revealed ? Math.min(0, -maxReveal + deltaX) : Math.min(0, deltaX);
      setDx(Math.max(-maxReveal, next));
    }
  }
  function onTouchEnd() {
    if (dragging.current) {
      setRevealed(dx <= -threshold);
      setDx(dx <= -threshold ? -maxReveal : 0);
    }
    startX.current = null;
    startY.current = null;
    dragging.current = false;
  }

  const rowStyle: CSSProperties = {
    transform: `translateX(${dx}px)`,
    transition: startX.current == null ? "transform 160ms ease-out" : "none",
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Action layer */}
      <div
        className="absolute inset-y-0 right-0 flex items-center"
        style={{ width: maxReveal }}
      >
        <button
          onClick={() => { setRevealed(false); setDx(0); onAction(); }}
          className="h-full w-full flex flex-col items-center justify-center gap-0.5 text-white"
          style={{
            background: "linear-gradient(135deg,#ef4444,#dc2626)",
            fontSize: 10,
            fontWeight: 600,
          }}
          aria-label={actionLabel}
        >
          <Trash2 className="w-4 h-4" />
          {actionLabel}
        </button>
      </div>
      {/* Row */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={rowStyle}
      >
        {children}
      </div>
    </div>
  );
}
