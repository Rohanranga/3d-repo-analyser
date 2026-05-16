'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Lighter neon palette — softer glow, more translucent
const PALETTES = [
  ['#a78bfa', '#60a5fa', '#34d399'],        // purple / blue / green
  ['#f472b6', '#fb923c', '#facc15'],        // pink / orange / yellow
  ['#38bdf8', '#818cf8', '#e879f9'],        // sky / indigo / fuchsia
  ['#4ade80', '#2dd4bf', '#60a5fa'],        // green / teal / blue
];

interface Tube {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  speed: number;
  alpha: number;
  length: number;
  t: number;
  phase: number;
}

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function createTube(W: number, H: number, colors: string[]): Tube {
  const color = colors[Math.floor(Math.random() * colors.length)];
  const startX = randomBetween(0, W);
  const startY = randomBetween(0, H);
  const length = Math.floor(randomBetween(60, 140));
  const points: { x: number; y: number }[] = [{ x: startX, y: startY }];

  let cx = startX;
  let cy = startY;
  for (let i = 1; i < length; i++) {
    cx += randomBetween(-18, 18);
    cy += randomBetween(-18, 18);
    points.push({ x: cx, y: cy });
  }

  return {
    points,
    color,
    width: randomBetween(1.5, 3.5),
    speed: randomBetween(0.003, 0.009),
    alpha: randomBetween(0.25, 0.55),   // lighter — more translucent
    length,
    t: Math.random(),
    phase: randomBetween(0, Math.PI * 2),
  };
}

interface TubesBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  enableClickInteraction?: boolean;
  tubeCount?: number;
}

export function TubesBackground({
  children,
  className,
  enableClickInteraction = true,
  tubeCount = 18,
}: TubesBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tubesRef = useRef<Tube[]>([]);
  const rafRef = useRef<number>(0);
  const paletteRef = useRef(0);
  const [ready, setReady] = useState(false);

  const buildTubes = useCallback((W: number, H: number, colors: string[]) => {
    tubesRef.current = Array.from({ length: tubeCount }, () => createTube(W, H, colors));
  }, [tubeCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
      buildTubes(canvas.width, canvas.height, PALETTES[paletteRef.current]);
    };

    resize();
    setReady(true);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;

      // Slight trail fade
      ctx.fillStyle = 'rgba(0,0,0,0.04)';
      ctx.fillRect(0, 0, W, H);

      for (const tube of tubesRef.current) {
        tube.t += tube.speed;
        if (tube.t > 1) tube.t = 0;

        const head = Math.floor(tube.t * tube.length);
        const tail = Math.max(0, head - 40);

        if (head <= tail) continue;

        const { r, g, b } = hexToRgb(tube.color);

        // Draw each segment of the visible window
        for (let i = tail; i < Math.min(head, tube.length - 1); i++) {
          const progress = (i - tail) / (head - tail);   // 0 at tail → 1 at head
          const alpha = tube.alpha * progress;
          const pulseAlpha = alpha * (0.7 + 0.3 * Math.sin(tube.phase + tube.t * Math.PI * 6));

          ctx.beginPath();
          ctx.moveTo(tube.points[i].x, tube.points[i].y);
          ctx.lineTo(tube.points[i + 1].x, tube.points[i + 1].y);

          // Glow — lighter, two-layer
          ctx.shadowColor = `rgba(${r},${g},${b},${pulseAlpha * 0.6})`;
          ctx.shadowBlur = 10;
          ctx.strokeStyle = `rgba(${r},${g},${b},${pulseAlpha})`;
          ctx.lineWidth = tube.width * progress;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // Bright head dot
        if (head < tube.length) {
          const p = tube.points[head];
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, tube.width * 3);
          grd.addColorStop(0, `rgba(${r},${g},${b},${tube.alpha * 0.9})`);
          grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, tube.width * 3, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.shadowBlur = 0;
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [buildTubes]);

  const handleClick = () => {
    if (!enableClickInteraction || !canvasRef.current) return;
    paletteRef.current = (paletteRef.current + 1) % PALETTES.length;
    buildTubes(canvasRef.current.width, canvasRef.current.height, PALETTES[paletteRef.current]);
  };

  return (
    <div
      className={cn('relative w-full h-full overflow-hidden bg-black', className)}
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{ touchAction: 'none' }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_40%,rgba(0,0,0,0.55)_100%)]" />

      {/* Fade-in overlay */}
      <motion.div
        className="absolute inset-0 bg-black pointer-events-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: ready ? 0 : 1 }}
        transition={{ duration: 1.2 }}
      />

      {/* Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}

export default TubesBackground;
