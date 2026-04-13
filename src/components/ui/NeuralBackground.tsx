"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  pulse: number; pulseSpeed: number;
  col: string;
}

interface Pulse {
  from: number; to: number;
  t: number; speed: number;
  col: string;
}

const COLS = ["139,92,246", "139,92,246", "139,92,246", "56,189,248", "52,211,153"];
const N = 120;
const LINK_DIST = 200;
const MAX_PULSES = 28;

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = 0, H = 0;
    let particles: Particle[] = [];
    let pulses: Pulse[] = [];
    let frame = 0;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = Math.max(window.innerHeight, document.body.scrollHeight);
      init();
    };

    const init = () => {
      particles = Array.from({ length: N }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 2 + Math.random() * 2.5,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.012 + Math.random() * 0.01,
        col: COLS[Math.floor(Math.random() * COLS.length)],
      }));
    };

    const spawnPulse = () => {
      if (pulses.length >= MAX_PULSES) return;
      const links: [number, number][] = [];
      for (let i = 0; i < particles.length; i++)
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          if (dx * dx + dy * dy < LINK_DIST * LINK_DIST) links.push([i, j]);
        }
      if (!links.length) return;
      const [f, t] = links[Math.floor(Math.random() * links.length)];
      pulses.push({
        from: f, to: t, t: 0,
        speed: 0.006 + Math.random() * 0.007,
        col: COLS[Math.floor(Math.random() * COLS.length)],
      });
    };

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // Move particles, bounce off edges
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        p.pulse += p.pulseSpeed;
      }

      if (frame % 35 === 0) spawnPulse();

      // Build live links
      const links: [number, number, number][] = [];
      for (let i = 0; i < particles.length; i++)
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK_DIST) links.push([i, j, d]);
        }

      // Draw links
      for (const [i, j, d] of links) {
        const a = (1 - d / LINK_DIST) * 0.28;
        const pi = particles[i], pj = particles[j];
        const g = ctx.createLinearGradient(pi.x, pi.y, pj.x, pj.y);
        g.addColorStop(0,   `rgba(${pi.col},0)`);
        g.addColorStop(0.5, `rgba(${pi.col},${a})`);
        g.addColorStop(1,   `rgba(${pj.col},0)`);
        ctx.beginPath();
        ctx.moveTo(pi.x, pi.y);
        ctx.lineTo(pj.x, pj.y);
        ctx.strokeStyle = g;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Draw pulses traveling along links
      pulses = pulses.filter(p => p.t <= 1);
      for (const p of pulses) {
        p.t += p.speed;
        const a = particles[p.from], b = particles[p.to];
        const px = a.x + (b.x - a.x) * p.t;
        const py = a.y + (b.y - a.y) * p.t;
        const grd = ctx.createRadialGradient(px, py, 0, px, py, 8);
        grd.addColorStop(0,    `rgba(${p.col},0.9)`);
        grd.addColorStop(0.4,  `rgba(${p.col},0.3)`);
        grd.addColorStop(1,    `rgba(${p.col},0)`);
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.col},1)`;
        ctx.fill();
      }

      // Draw particles
      for (const p of particles) {
        const bright = 0.3 + Math.sin(p.pulse) * 0.2;
        // Soft halo
        const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        halo.addColorStop(0, `rgba(${p.col},${bright * 0.25})`);
        halo.addColorStop(1, `rgba(${p.col},0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();
        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.col},${bright})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
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
        opacity: 0.9,
      }}
    />
  );
}
