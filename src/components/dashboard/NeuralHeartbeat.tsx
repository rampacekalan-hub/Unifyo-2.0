"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface NeuralHeartbeatProps {
  memoryCount: number;     // drives pulse speed
  className?: string;
}

// Speed: 0 mem = 3s cycle, 100+ mem = 0.6s cycle
function calcPulseSpeed(count: number): number {
  return Math.max(0.6, 3 - count * 0.024);
}

export default function NeuralHeartbeat({ memoryCount, className = "" }: NeuralHeartbeatProps) {
  const speed = calcPulseSpeed(memoryCount);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const tRef = useRef<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cycleFrames = speed * 60; // frames per full pulse

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      // Draw ECG-like waveform
      ctx.beginPath();
      ctx.strokeStyle = "rgba(34,211,238,0.7)";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "#22d3ee";
      ctx.shadowBlur = 6;

      const t = tRef.current;
      const points = W;
      const midY = H / 2;

      for (let x = 0; x < points; x++) {
        const phase = ((x + t) % cycleFrames) / cycleFrames; // 0–1
        let y = midY;

        if (phase < 0.05) {
          // flat
          y = midY;
        } else if (phase < 0.12) {
          // P wave (small bump)
          y = midY - Math.sin(((phase - 0.05) / 0.07) * Math.PI) * 4;
        } else if (phase < 0.22) {
          // flat
          y = midY;
        } else if (phase < 0.26) {
          // Q dip
          y = midY + ((phase - 0.22) / 0.04) * 6;
        } else if (phase < 0.30) {
          // R spike up
          y = midY + 6 - ((phase - 0.26) / 0.04) * (H * 0.72 + 6);
        } else if (phase < 0.34) {
          // R spike down
          y = midY - H * 0.72 + ((phase - 0.30) / 0.04) * (H * 0.72 + 10);
        } else if (phase < 0.38) {
          // S return
          y = midY + 10 - ((phase - 0.34) / 0.04) * 10;
        } else if (phase < 0.55) {
          // T wave
          y = midY - Math.sin(((phase - 0.38) / 0.17) * Math.PI) * 7;
        } else {
          y = midY;
        }

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Trailing glow dot at current position
      const dotPhase = (t % cycleFrames) / cycleFrames;
      const dotX = (1 - dotPhase) * W;
      let dotY = midY;
      if (dotPhase > 0.28 && dotPhase < 0.34) {
        dotY = midY - H * 0.4;
      }
      ctx.beginPath();
      ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#22d3ee";
      ctx.shadowBlur = 12;
      ctx.fill();

      tRef.current += 1;
      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [mounted, speed]);

  if (!mounted) return null;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* ECG canvas */}
      <canvas
        ref={canvasRef}
        width={120}
        height={28}
        style={{ display: "block", opacity: 0.85 }}
      />

      {/* Pulsing glow ring */}
      <motion.div
        animate={{
          scale: [1, 1.35, 1],
          opacity: [0.7, 0.3, 0.7],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{
          background: "#22d3ee",
          boxShadow: `0 0 ${8 + Math.min(memoryCount * 0.15, 16)}px #22d3ee`,
        }}
      />

      <span className="text-[0.6rem] font-bold tracking-widest uppercase tabular-nums"
        style={{ color: "#22d3ee" }}>
        {memoryCount} mem
      </span>
    </div>
  );
}
