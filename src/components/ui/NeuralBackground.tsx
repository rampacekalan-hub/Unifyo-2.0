"use client";

import { useEffect, useRef } from "react";

interface NNode {
  x: number; y: number;
  ox: number; oy: number; // orbit center
  angle: number; angleSpeed: number; orbitR: number;
  r: number;
  pulse: number; pulseSpeed: number;
  isCyan: boolean;
}

interface Signal {
  fromIdx: number; toIdx: number;
  t: number; speed: number;
  color: string;
}

const NODE_COUNT = 90;
const CONNECT_DIST = 200;
const MAX_SIGNALS = 18;

function brainPos(i: number, total: number, W: number, H: number): [number, number] {
  // Brain silhouette: two lobes offset
  const t = (i / total) * Math.PI * 2;
  const lobe = i < total * 0.55 ? 1 : -1;
  const rx = W * 0.22 + Math.random() * W * 0.1;
  const ry = H * 0.28 + Math.random() * H * 0.06;
  const cx = W * 0.5 + lobe * W * 0.09;
  const cy = H * 0.42;
  const jitter = 0.55 + Math.random() * 0.9;
  return [
    cx + Math.cos(t) * rx * jitter,
    cy + Math.sin(t) * ry * jitter,
  ];
}

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

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = Math.max(window.innerHeight, document.body.scrollHeight);
      initNodes();
    };

    const initNodes = () => {
      nodes = Array.from({ length: NODE_COUNT }, (_, i) => {
        const [bx, by] = brainPos(i, NODE_COUNT, W, H);
        return {
          x: bx, y: by,
          ox: bx, oy: by,
          angle: Math.random() * Math.PI * 2,
          angleSpeed: (Math.random() - 0.5) * 0.004,
          orbitR: 4 + Math.random() * 18,
          r: 1.0 + Math.random() * 2.2,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.007 + Math.random() * 0.009,
          isCyan: Math.random() < 0.18,
        };
      });
    };

    resize();
    window.addEventListener("resize", resize);

    // Spawn signals periodically
    const spawnSignal = () => {
      if (signals.length >= MAX_SIGNALS) return;
      const candidates: [number, number, number][] = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          if (Math.sqrt(dx * dx + dy * dy) < CONNECT_DIST) {
            candidates.push([i, j, Math.sqrt(dx * dx + dy * dy)]);
          }
        }
      }
      if (!candidates.length) return;
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      signals.push({
        fromIdx: pick[0], toIdx: pick[1],
        t: 0,
        speed: 0.004 + Math.random() * 0.005,
        color: Math.random() < 0.4 ? "cyan" : "violet",
      });
    };

    let frame = 0;
    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // Update node orbits
      nodes.forEach((n) => {
        n.angle += n.angleSpeed;
        n.x = n.ox + Math.cos(n.angle) * n.orbitR;
        n.y = n.oy + Math.sin(n.angle) * n.orbitR;
        n.pulse += n.pulseSpeed;
      });

      // Spawn signal every ~90 frames
      if (frame % 90 === 0) spawnSignal();

      // Build edge list for drawing
      const edges: [number, number, number][] = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) edges.push([i, j, dist]);
        }
      }

      // Draw edges
      edges.forEach(([i, j, dist]) => {
        const alpha = (1 - dist / CONNECT_DIST) * 0.10;
        const ni = nodes[i], nj = nodes[j];
        const grad = ctx.createLinearGradient(ni.x, ni.y, nj.x, nj.y);
        const col = ni.isCyan || nj.isCyan ? "6,182,212" : "139,92,246";
        grad.addColorStop(0, `rgba(${col},0)`);
        grad.addColorStop(0.5, `rgba(${col},${alpha})`);
        grad.addColorStop(1, `rgba(${col},0)`);
        ctx.beginPath();
        ctx.moveTo(ni.x, ni.y);
        ctx.lineTo(nj.x, nj.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      });

      // Draw signal pulses traveling along edges
      signals = signals.filter(s => s.t <= 1);
      signals.forEach((s) => {
        s.t += s.speed;
        const a = nodes[s.fromIdx], b = nodes[s.toIdx];
        const px = a.x + (b.x - a.x) * s.t;
        const py = a.y + (b.y - a.y) * s.t;
        const col = s.color === "cyan" ? "6,182,212" : "167,139,250";
        const grd = ctx.createRadialGradient(px, py, 0, px, py, 6);
        grd.addColorStop(0, `rgba(${col},0.9)`);
        grd.addColorStop(0.4, `rgba(${col},0.3)`);
        grd.addColorStop(1, `rgba(${col},0)`);
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Bright core
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col},1)`;
        ctx.fill();
      });

      // Draw nodes
      nodes.forEach((n) => {
        const brightness = 0.3 + Math.sin(n.pulse) * 0.2;
        const col = n.isCyan ? "6,182,212" : "167,139,250";

        // Outer halo
        const halo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4);
        halo.addColorStop(0, `rgba(${col},${brightness * 0.3})`);
        halo.addColorStop(1, `rgba(${col},0)`);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col},${brightness})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ opacity: 0.7 }}
      aria-hidden="true"
    />
  );
}
