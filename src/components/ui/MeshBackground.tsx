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

      // ── Beam of light from top ──
      const beamX = canvas.width * (0.5 + (mouse.x - 0.5) * 0.15);
      const beamWidth = canvas.width * 0.28;

      const beam = ctx.createRadialGradient(
        beamX, -80, 0,
        beamX, canvas.height * 0.55, canvas.width * 0.6
      );
      beam.addColorStop(0, "rgba(139,92,246,0.18)");
      beam.addColorStop(0.3, "rgba(139,92,246,0.07)");
      beam.addColorStop(0.6, "rgba(109,40,217,0.03)");
      beam.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = beam;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // ── Sharp top beam cone ──
      const coneGrad = ctx.createLinearGradient(beamX, 0, beamX, canvas.height * 0.7);
      coneGrad.addColorStop(0, "rgba(167,139,250,0.12)");
      coneGrad.addColorStop(0.4, "rgba(139,92,246,0.04)");
      coneGrad.addColorStop(1, "rgba(0,0,0,0)");

      ctx.beginPath();
      ctx.moveTo(beamX, -10);
      ctx.lineTo(beamX - beamWidth / 2, canvas.height * 0.7);
      ctx.lineTo(beamX + beamWidth / 2, canvas.height * 0.7);
      ctx.closePath();
      ctx.fillStyle = coneGrad;
      ctx.fill();

      // ── Subtle bottom glow ──
      const bottomGlow = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height, 0,
        canvas.width * 0.5, canvas.height, canvas.width * 0.5
      );
      bottomGlow.addColorStop(0, `rgba(109,40,217,${0.04 + Math.sin(t) * 0.01})`);
      bottomGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bottomGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // ── Mouse-reactive side orb ──
      const orbX = canvas.width * (mouse.x * 0.6 + 0.2);
      const orbY = canvas.height * (mouse.y * 0.5 + 0.1);
      const orbGrad = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, canvas.width * 0.25);
      orbGrad.addColorStop(0, "rgba(139,92,246,0.06)");
      orbGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = orbGrad;
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
