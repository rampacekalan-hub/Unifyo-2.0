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
    let mouse = { x: 0.5, y: 0.5 };
    let target = { x: 0.5, y: 0.5 };

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

    const orbs = [
      { x: 0.2, y: 0.2, r: 0.55, color: "99,102,241", speed: 0.00018 },
      { x: 0.8, y: 0.3, r: 0.40, color: "139,92,246", speed: 0.00024 },
      { x: 0.5, y: 0.85, r: 0.45, color: "79,70,229", speed: 0.00020 },
      { x: 0.1, y: 0.7, r: 0.35, color: "124,58,237", speed: 0.00028 },
    ];

    let t = 0;
    const draw = () => {
      t++;
      mouse.x += (target.x - mouse.x) * 0.04;
      mouse.y += (target.y - mouse.y) * 0.04;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      orbs.forEach((orb, i) => {
        const ox = (orb.x + Math.sin(t * orb.speed * 1000 + i) * 0.18 + (mouse.x - 0.5) * 0.12) * canvas.width;
        const oy = (orb.y + Math.cos(t * orb.speed * 800 + i * 2) * 0.14 + (mouse.y - 0.5) * 0.1) * canvas.height;
        const radius = orb.r * Math.min(canvas.width, canvas.height);

        const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius);
        grad.addColorStop(0, `rgba(${orb.color},0.13)`);
        grad.addColorStop(0.5, `rgba(${orb.color},0.06)`);
        grad.addColorStop(1, `rgba(${orb.color},0)`);

        ctx.beginPath();
        ctx.fillStyle = grad;
        ctx.arc(ox, oy, radius, 0, Math.PI * 2);
        ctx.fill();
      });

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
      style={{ opacity: 1 }}
    />
  );
}
