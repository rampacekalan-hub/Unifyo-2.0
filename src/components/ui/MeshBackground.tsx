"use client";

import { useEffect, useRef } from "react";

export type MeshState = "idle" | "thinking" | "glow";
export type MeshModule = "dashboard" | "crm" | "calendar" | "email" | "analytics" | "calls" | "automationBuilder";

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

interface Props {
  state?: MeshState;
  module?: MeshModule;
}

const BASE_COLS = ["139,92,246", "139,92,246", "56,189,248", "52,211,153", "139,92,246"];
const MODULE_COLS: Record<MeshModule, string[]> = {
  dashboard:        ["139,92,246", "56,189,248", "52,211,153"],
  crm:              ["99,102,241", "139,92,246", "165,180,252"],
  calendar:         ["139,92,246", "167,139,250", "196,181,253"],
  email:            ["34,197,94",  "52,211,153",  "139,92,246"],
  analytics:        ["251,191,36", "245,158,11",  "139,92,246"],
  calls:            ["249,115,22", "251,146,60",  "139,92,246"],
  automationBuilder:["236,72,153", "244,114,182", "139,92,246"],
};

const N = 80;
const SPEED = 0.3;
const LINK_DIST = 200;
const MAX_PULSES = 28;
const BASE_OPACITY = 0.45;

export default function MeshBackground({ state = "idle", module: mod = "dashboard" }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rafRef     = useRef<number>(0);
  const stateRef   = useRef<MeshState>("idle");
  const glowRef    = useRef(0);
  const thinkRef   = useRef(0);
  const modRef     = useRef<MeshModule>("dashboard");

  useEffect(() => {
    stateRef.current = state;
    if (state === "glow") glowRef.current = 1;
  }, [state]);

  useEffect(() => {
    modRef.current = mod;
  }, [mod]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0;
    let particles: Particle[] = [];
    let pulses: Pulse[] = [];
    let frame = 0;

    const getCols = () => MODULE_COLS[modRef.current] ?? BASE_COLS;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      init();
    };

    const init = () => {
      const cols = getCols();
      particles = Array.from({ length: N }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
        r: 2 + Math.random() * 2.5,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.012 + Math.random() * 0.01,
        col: cols[Math.floor(Math.random() * cols.length)],
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
      const cols = getCols();
      pulses.push({
        from: f, to: t, t: 0,
        speed: 0.006 + Math.random() * 0.007,
        col: cols[Math.floor(Math.random() * cols.length)],
      });
    };

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      const s = stateRef.current;

      // Decay glow burst
      if (glowRef.current > 0) glowRef.current = Math.max(0, glowRef.current - 0.011);
      // Thinking oscillator
      if (s === "thinking") {
        thinkRef.current = 0.5 + 0.5 * Math.sin(frame * 0.06);
      } else {
        thinkRef.current *= 0.90;
      }

      const g = glowRef.current;
      const tk = thinkRef.current;
      const glowI = 0.25 + g * 0.6 + tk * 0.25;
      const speedMul = 1 + g * 1.6 + tk * 0.5;
      const pulseFreq = s === "thinking" ? 12 : 35;

      // Update particles
      for (const p of particles) {
        p.x += p.vx * speedMul;
        p.y += p.vy * speedMul;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        p.pulse += p.pulseSpeed * (1 + tk * 0.8);
      }

      if (frame % pulseFreq === 0) spawnPulse();
      // Extra pulses on glow burst
      if (g > 0.5 && frame % 4 === 0) spawnPulse();

      // Links with gradient
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK_DIST) {
            const a = (1 - d / LINK_DIST) * 0.28 * (glowI / 0.25);
            const pi = particles[i], pj = particles[j];
            const grad = ctx.createLinearGradient(pi.x, pi.y, pj.x, pj.y);
            grad.addColorStop(0,   `rgba(${pi.col},0)`);
            grad.addColorStop(0.5, `rgba(${pi.col},${Math.min(a, 0.9).toFixed(3)})`);
            grad.addColorStop(1,   `rgba(${pj.col},0)`);
            ctx.beginPath();
            ctx.moveTo(pi.x, pi.y);
            ctx.lineTo(pj.x, pj.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.8 + g * 0.6;
            ctx.stroke();
          }
        }
      }

      // Traveling pulses
      pulses = pulses.filter(p => p.t <= 1);
      for (const p of pulses) {
        p.t += p.speed * (1 + g * 1.5);
        const a = particles[p.from], b = particles[p.to];
        const px = a.x + (b.x - a.x) * p.t;
        const py = a.y + (b.y - a.y) * p.t;
        const grd = ctx.createRadialGradient(px, py, 0, px, py, 8 + g * 4);
        grd.addColorStop(0,   `rgba(${p.col},0.9)`);
        grd.addColorStop(0.4, `rgba(${p.col},0.3)`);
        grd.addColorStop(1,   `rgba(${p.col},0)`);
        ctx.beginPath();
        ctx.arc(px, py, 8 + g * 4, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.col},1)`;
        ctx.fill();
      }

      // Particles with halo
      for (const p of particles) {
        const bright = (0.3 + Math.sin(p.pulse) * 0.2) * (glowI / 0.25);
        const haloR = p.r * 5 + g * 8;
        const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, haloR);
        halo.addColorStop(0, `rgba(${p.col},${(bright * 0.25).toFixed(3)})`);
        halo.addColorStop(1, `rgba(${p.col},0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + g * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.col},${Math.min(bright, 1).toFixed(3)})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    const handleVisibility = () => {
      if (document.hidden) cancelAnimationFrame(rafRef.current);
      else rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibility);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        display: "block",
        opacity: BASE_OPACITY,
      }}
    />
  );
}
