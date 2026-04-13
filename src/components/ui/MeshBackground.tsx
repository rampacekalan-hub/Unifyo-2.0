"use client";

import { useEffect, useRef } from "react";

export default function MeshBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let mouse = { x: 0.5, y: 0.0 };
    let target = { x: 0.5, y: 0.0 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      target.x = e.clientX / window.innerWidth;
      target.y = e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMouseMove);

    let t = 0;
    const draw = () => {
      t += 0.004;
      mouse.x += (target.x - mouse.x) * 0.05;
      mouse.y += (target.y - mouse.y) * 0.05;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ── Light mode: subtle violet orb follows mouse ──
      const orbX = canvas.width * (0.3 + mouse.x * 0.4);
      const orbY = canvas.height * (0.1 + mouse.y * 0.3);
      const orbGrad = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, canvas.width * 0.4);
      orbGrad.addColorStop(0, `rgba(124,58,237,${0.05 + Math.sin(t) * 0.01})`);
      orbGrad.addColorStop(0.5, "rgba(139,92,246,0.02)");
      orbGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = orbGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // ── Second static orb top-right ──
      const orb2Grad = ctx.createRadialGradient(
        canvas.width * 0.85, canvas.height * 0.15, 0,
        canvas.width * 0.85, canvas.height * 0.15, canvas.width * 0.3
      );
      orb2Grad.addColorStop(0, "rgba(139,92,246,0.04)");
      orb2Grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = orb2Grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-20"
    />
  );
}
