"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import type { ThemeEngine } from "@/config/site-settings";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  pulse: number; pulseSpeed: number;
  col: string;
}

interface NeuralPulse {
  from: number; to: number;
  t: number; speed: number;
  col: string;
}

// Ripple: absorption effect when a data packet lands
interface Ripple {
  x: number; y: number;
  r: number; maxR: number;
  alpha: number; col: string;
}

const COLS = ["139,92,246", "139,92,246", "139,92,246", "56,189,248", "52,211,153"];
const LINK_DIST = 200;
const MAX_PULSES = 28;

export interface NeuralBackgroundHandle {
  /** Spawn an absorption ripple at absolute screen coordinates */
  ripple: (x: number, y: number, col?: string) => void;
  /** Flash the whole mesh with a color burst (e.g. on integration) */
  flash: (col?: string) => void;
}

interface NeuralBackgroundProps {
  themeEngine?: Partial<ThemeEngine>;
}

const NeuralBackground = forwardRef<NeuralBackgroundHandle, NeuralBackgroundProps>(
  function NeuralBackground({ themeEngine }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Live-mutable config refs — updated without restarting animation loop
    const cfgRef = useRef({
      N:      themeEngine?.particleDensity ?? 80,
      speed:  themeEngine?.particleSpeed   ?? 0.3,
      opacity: themeEngine?.particleOpacity ?? 0.45,
      glowI:  themeEngine?.glowIntensity   ?? 0.25,
    });
    // Update live config whenever props change
    useEffect(() => {
      cfgRef.current = {
        N:      themeEngine?.particleDensity ?? 80,
        speed:  themeEngine?.particleSpeed   ?? 0.3,
        opacity: themeEngine?.particleOpacity ?? 0.45,
        glowI:  themeEngine?.glowIntensity   ?? 0.25,
      };
      if (canvasRef.current) {
        canvasRef.current.style.opacity = String(cfgRef.current.opacity);
      }
      // Velocity rescale when speed changes
      if (particlesRef.current.length) {
        const ratio = cfgRef.current.speed / (prevSpeedRef.current || 0.3);
        prevSpeedRef.current = cfgRef.current.speed;
        for (const p of particlesRef.current) {
          p.vx *= ratio;
          p.vy *= ratio;
        }
      }
    }, [themeEngine?.particleDensity, themeEngine?.particleSpeed, themeEngine?.particleOpacity, themeEngine?.glowIntensity]);

    const particlesRef = useRef<Particle[]>([]);
    const ripplesRef   = useRef<Ripple[]>([]);
    const flashRef     = useRef<{ alpha: number; col: string } | null>(null);
    const prevSpeedRef = useRef(themeEngine?.particleSpeed ?? 0.3);

    // Expose imperative API
    useImperativeHandle(ref, () => ({
      ripple(x: number, y: number, col = "99,102,241") {
        ripplesRef.current.push({ x, y, r: 4, maxR: 120, alpha: 0.9, col });
        // Spawn a second slightly offset ring for depth
        setTimeout(() => {
          ripplesRef.current.push({ x: x + 6, y: y + 4, r: 2, maxR: 80, alpha: 0.55, col });
        }, 60);
      },
      flash(col = "99,102,241") {
        flashRef.current = { alpha: 0.18, col };
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let animId: number;
      let W = 0, H = 0;
      let pulses: NeuralPulse[] = [];
      let frame = 0;

      const resize = () => {
        W = canvas.width = window.innerWidth;
        H = canvas.height = Math.max(window.innerHeight, document.body.scrollHeight);
        init();
      };

      const init = () => {
        const { N, speed } = cfgRef.current;
        particlesRef.current = Array.from({ length: N }, () => ({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          r: 2 + Math.random() * 2.5,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.012 + Math.random() * 0.01,
          col: COLS[Math.floor(Math.random() * COLS.length)],
        }));
        prevSpeedRef.current = speed;
      };

      const spawnPulse = () => {
        if (pulses.length >= MAX_PULSES) return;
        const pts = particlesRef.current;
        const links: [number, number][] = [];
        for (let i = 0; i < pts.length; i++)
          for (let j = i + 1; j < pts.length; j++) {
            const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
            if (dx * dx + dy * dy < LINK_DIST * LINK_DIST) links.push([i, j]);
          }
        if (!links.length) return;
        const [f, t] = links[Math.floor(Math.random() * links.length)];
        pulses.push({ from: f, to: t, t: 0, speed: 0.006 + Math.random() * 0.007, col: COLS[Math.floor(Math.random() * COLS.length)] });
      };

      const draw = () => {
        frame++;
        const { glowI } = cfgRef.current;
        const pts = particlesRef.current;
        ctx.clearRect(0, 0, W, H);

        // Global flash overlay
        if (flashRef.current) {
          const f = flashRef.current;
          ctx.fillStyle = `rgba(${f.col},${f.alpha})`;
          ctx.fillRect(0, 0, W, H);
          f.alpha -= 0.008;
          if (f.alpha <= 0) flashRef.current = null;
        }

        for (const p of pts) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > W) p.vx *= -1;
          if (p.y < 0 || p.y > H) p.vy *= -1;
          p.pulse += p.pulseSpeed;
        }

        if (frame % 35 === 0) spawnPulse();

        // Links
        const links: [number, number, number][] = [];
        for (let i = 0; i < pts.length; i++)
          for (let j = i + 1; j < pts.length; j++) {
            const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < LINK_DIST) links.push([i, j, d]);
          }
        for (const [i, j, d] of links) {
          const a = (1 - d / LINK_DIST) * 0.28 * (glowI / 0.25);
          const pi = pts[i], pj = pts[j];
          const g = ctx.createLinearGradient(pi.x, pi.y, pj.x, pj.y);
          g.addColorStop(0,   `rgba(${pi.col},0)`);
          g.addColorStop(0.5, `rgba(${pi.col},${a})`);
          g.addColorStop(1,   `rgba(${pj.col},0)`);
          ctx.beginPath(); ctx.moveTo(pi.x, pi.y); ctx.lineTo(pj.x, pj.y);
          ctx.strokeStyle = g; ctx.lineWidth = 0.8; ctx.stroke();
        }

        // Neural pulses
        pulses = pulses.filter(p => p.t <= 1);
        for (const p of pulses) {
          p.t += p.speed;
          const a = pts[p.from], b = pts[p.to];
          const px = a.x + (b.x - a.x) * p.t, py = a.y + (b.y - a.y) * p.t;
          const grd = ctx.createRadialGradient(px, py, 0, px, py, 8);
          grd.addColorStop(0, `rgba(${p.col},0.9)`); grd.addColorStop(0.4, `rgba(${p.col},0.3)`); grd.addColorStop(1, `rgba(${p.col},0)`);
          ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();
          ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fillStyle = `rgba(${p.col},1)`; ctx.fill();
        }

        // Particles
        for (const p of pts) {
          const bright = (0.3 + Math.sin(p.pulse) * 0.2) * (glowI / 0.25);
          const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
          halo.addColorStop(0, `rgba(${p.col},${bright * 0.25})`); halo.addColorStop(1, `rgba(${p.col},0)`);
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2); ctx.fillStyle = halo; ctx.fill();
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(${p.col},${bright})`; ctx.fill();
        }

        // Absorption ripples — drawn last (on top of particles)
        ripplesRef.current = ripplesRef.current.filter(r => r.alpha > 0);
        for (const r of ripplesRef.current) {
          const progress = r.r / r.maxR;
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${r.col},${r.alpha * (1 - progress)})`;
          ctx.lineWidth = 2.5 * (1 - progress * 0.7);
          ctx.stroke();
          // Inner fill glow
          const grd = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, r.r);
          grd.addColorStop(0, `rgba(${r.col},${r.alpha * 0.25 * (1 - progress)})`);
          grd.addColorStop(1, `rgba(${r.col},0)`);
          ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();
          // Expand
          r.r += (r.maxR - r.r) * 0.055;
          r.alpha -= 0.022;
        }

        animId = requestAnimationFrame(draw);
      };

      resize();
      window.addEventListener("resize", resize);
      draw();
      return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
    }, []); // ← empty deps: loop starts once, reads live config from refs

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
          opacity: cfgRef.current.opacity,
        }}
      />
    );
  }
);

NeuralBackground.displayName = "NeuralBackground";
export default NeuralBackground;
