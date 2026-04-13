"use client";

import { useEffect, useRef } from "react";

interface NNode {
  x: number; y: number;
  ox: number; oy: number;
  angle: number; speed: number; orbitR: number;
  r: number;
  pulse: number; pulseSpeed: number;
  type: "violet" | "cyan" | "green";
}

interface Signal {
  from: number; to: number;
  t: number; speed: number;
  type: "violet" | "cyan" | "green";
}

// Realistic brain silhouette: two lobes, denser in center, scattered axons
function brainPoint(i: number, total: number, W: number, H: number): [number, number] {
  const cx = W * 0.5;
  const cy = H * 0.38; // slightly above center — brain sits upper half
  const section = i / total;

  // Left lobe
  if (section < 0.48) {
    const t = (section / 0.48) * Math.PI * 2;
    const rx = W * 0.195;
    const ry = H * 0.21;
    const lx = cx - W * 0.07;
    const jitter = 0.35 + Math.random() * 0.75;
    return [lx + Math.cos(t) * rx * jitter, cy + Math.sin(t) * ry * jitter];
  }
  // Right lobe
  if (section < 0.92) {
    const t = ((section - 0.48) / 0.44) * Math.PI * 2;
    const rx = W * 0.175;
    const ry = H * 0.20;
    const rx2 = cx + W * 0.07;
    const jitter = 0.35 + Math.random() * 0.75;
    return [rx2 + Math.cos(t) * rx * jitter, cy + Math.sin(t) * ry * jitter];
  }
  // Corpus callosum — center bridge nodes
  const t = Math.random() * Math.PI * 2;
  return [cx + (Math.random() - 0.5) * W * 0.12, cy + (Math.random() - 0.5) * H * 0.08];
}

const NODE_COUNT = 110;
const CONNECT_DIST = 160;
const MAX_SIGNALS = 28;

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let nodes: NNode[] = [];
    let signals: Signal[] = [];
    let W = 0, H = 0;
    let frame = 0;

    const COLS: Record<string, string> = {
      violet: "139,92,246",
      cyan: "56,189,248",
      green: "52,211,153",
    };

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = Math.max(window.innerHeight, document.body.scrollHeight);
      init();
    };

    const init = () => {
      const types: Array<"violet" | "cyan" | "green"> = ["violet", "violet", "violet", "cyan", "cyan", "green"];
      nodes = Array.from({ length: NODE_COUNT }, (_, i) => {
        const [bx, by] = brainPoint(i, NODE_COUNT, W, H);
        return {
          x: bx, y: by, ox: bx, oy: by,
          angle: Math.random() * Math.PI * 2,
          speed: (Math.random() - 0.5) * 0.003,
          orbitR: 3 + Math.random() * 16,
          r: 1.2 + Math.random() * 2.0,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.008 + Math.random() * 0.01,
          type: types[Math.floor(Math.random() * types.length)],
        };
      });
    };

    resize();
    window.addEventListener("resize", resize);

    const spawnSignal = () => {
      if (signals.length >= MAX_SIGNALS) return;
      const pairs: [number, number][] = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          if (dx * dx + dy * dy < CONNECT_DIST * CONNECT_DIST) pairs.push([i, j]);
        }
      }
      if (!pairs.length) return;
      const [f, t] = pairs[Math.floor(Math.random() * pairs.length)];
      const types: Array<"violet" | "cyan" | "green"> = ["violet", "cyan", "violet", "green"];
      signals.push({ from: f, to: t, t: 0, speed: 0.005 + Math.random() * 0.006, type: types[Math.floor(Math.random() * types.length)] });
    };

    // Burst of signals — simulates "thinking"
    const spawnBurst = () => {
      const count = 3 + Math.floor(Math.random() * 5);
      for (let i = 0; i < count; i++) setTimeout(spawnSignal, i * 80);
    };

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // Animate nodes
      for (const n of nodes) {
        n.angle += n.speed;
        n.x = n.ox + Math.cos(n.angle) * n.orbitR;
        n.y = n.oy + Math.sin(n.angle) * n.orbitR;
        n.pulse += n.pulseSpeed;
      }

      // Burst every ~3s
      if (frame % 180 === 0) spawnBurst();
      // Trickle
      if (frame % 40 === 0) spawnSignal();

      // Precompute edges
      const edges: [number, number, number][] = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECT_DIST) edges.push([i, j, d]);
        }
      }

      // Draw soft central glow (brain aura)
      const cx = W * 0.5, cy = H * 0.38;
      const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.38);
      aura.addColorStop(0, "rgba(124,58,237,0.055)");
      aura.addColorStop(0.5, "rgba(56,189,248,0.025)");
      aura.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, W, H);

      // Edges
      for (const [i, j, d] of edges) {
        const ni = nodes[i], nj = nodes[j];
        const alpha = (1 - d / CONNECT_DIST) * 0.13;
        const col = (ni.type === "cyan" || nj.type === "cyan") ? COLS.cyan
          : (ni.type === "green" || nj.type === "green") ? COLS.green
          : COLS.violet;
        const g = ctx.createLinearGradient(ni.x, ni.y, nj.x, nj.y);
        g.addColorStop(0, `rgba(${col},0)`);
        g.addColorStop(0.5, `rgba(${col},${alpha})`);
        g.addColorStop(1, `rgba(${col},0)`);
        ctx.beginPath();
        ctx.moveTo(ni.x, ni.y);
        ctx.lineTo(nj.x, nj.y);
        ctx.strokeStyle = g;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }

      // Signals
      signals = signals.filter(s => s.t <= 1.02);
      for (const s of signals) {
        s.t += s.speed;
        const a = nodes[s.from], b = nodes[s.to];
        const px = a.x + (b.x - a.x) * s.t;
        const py = a.y + (b.y - a.y) * s.t;
        const col = COLS[s.type];
        // Glow
        const grd = ctx.createRadialGradient(px, py, 0, px, py, 9);
        grd.addColorStop(0, `rgba(${col},0.85)`);
        grd.addColorStop(0.35, `rgba(${col},0.25)`);
        grd.addColorStop(1, `rgba(${col},0)`);
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
        // Core
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col},1)`;
        ctx.fill();
      }

      // Nodes
      for (const n of nodes) {
        const b = 0.28 + Math.sin(n.pulse) * 0.22;
        const col = COLS[n.type];
        // Halo
        const h = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 5);
        h.addColorStop(0, `rgba(${col},${b * 0.35})`);
        h.addColorStop(1, `rgba(${col},0)`);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = h;
        ctx.fill();
        // Core
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col},${b})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.75,
      }}
    />
  );
}
