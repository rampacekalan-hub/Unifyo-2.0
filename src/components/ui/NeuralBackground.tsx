"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  pulse: number;
  pulseSpeed: number;
}

const NODE_COUNT = 52;
const CONNECTION_DIST = 160;
const SPEED = 0.18;

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let nodes: Node[] = [];
    let W = 0, H = 0;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Init nodes — clustered toward center like a brain shape
    nodes = Array.from({ length: NODE_COUNT }, (_, i) => {
      const angle = (i / NODE_COUNT) * Math.PI * 2;
      const spread = 0.28 + Math.random() * 0.22;
      const cx = W / 2 + Math.cos(angle) * W * spread * (0.5 + Math.random() * 0.5);
      const cy = H / 2 + Math.sin(angle) * H * spread * 0.55 * (0.5 + Math.random() * 0.5);
      return {
        x: cx,
        y: cy,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
        r: 1.2 + Math.random() * 1.4,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.006 + Math.random() * 0.008,
      };
    });

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Update positions — soft boundary wrap
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += n.pulseSpeed;
        if (n.x < -60) n.x = W + 60;
        if (n.x > W + 60) n.x = -60;
        if (n.y < -60) n.y = H + 60;
        if (n.y > H + 60) n.y = -60;
      });

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.13;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(139,92,246,${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach((n) => {
        const glow = 0.25 + Math.sin(n.pulse) * 0.15;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167,139,250,${glow})`;
        ctx.fill();

        // Occasional cyan accent nodes
        if (n.r > 2.2) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 1.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(6,182,212,${glow * 0.15})`;
          ctx.fill();
        }
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
      style={{ opacity: 0.55 }}
      aria-hidden="true"
    />
  );
}
