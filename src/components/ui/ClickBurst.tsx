"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/* Symbols that burst out on click — code-flavoured */
const SYMBOLS = ["</>", "{}", "//", "=>", "fn", "&&", "··", "[]", "::"];

interface Particle {
    id: number;
    x: number;
    y: number;
    symbol: string;
    angle: number;      // radians
    speed: number;      // px per frame
    color: string;
    scale: number;
    rotationDir: 1 | -1;
}

const COLORS = [
    "#a78bfa", // violet-400
    "#c084fc", // purple-400
    "#e879f9", // fuchsia-400
    "#60a5fa", // blue-400
    "#34d399", // emerald-400
    "#f472b6", // pink-400
];

let nextId = 0;

export function ClickBurst() {
    const [particles, setParticles] = useState<Particle[]>([]);
    const rafRef = useRef<number | null>(null);
    const particlesRef = useRef<Particle[]>([]);

    /* Internal mutable state for animation loop */
    interface Live {
        id: number;
        x: number;
        y: number;
        vx: number;
        vy: number;
        life: number;      // 0 → 1
        decay: number;
        symbol: string;
        color: string;
        scale: number;
        rotation: number;
        rotSpeed: number;
    }

    const liveRef = useRef<Live[]>([]);
    const domRef = useRef<Map<number, HTMLSpanElement>>(new Map());
    const containerRef = useRef<HTMLDivElement>(null);

    const spawnBurst = useCallback((cx: number, cy: number) => {
        const count = 5 + Math.floor(Math.random() * 3); // 5-7 particles
        const newLive: Live[] = Array.from({ length: count }, (_, i) => {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
            const speed = 3.5 + Math.random() * 3.5;
            return {
                id: nextId++,
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2.5, // upward bias
                life: 1,
                decay: 0.012 + Math.random() * 0.008,  // slower = visible longer
                symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                scale: 1.0 + Math.random() * 0.6,       // bigger symbols
                rotation: 0,
                rotSpeed: (Math.random() - 0.5) * 10,
            };
        });
        liveRef.current.push(...newLive);
    }, []);

    /* Animation loop — directly mutates DOM for performance */
    useEffect(() => {
        const loop = () => {
            liveRef.current = liveRef.current.filter(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.12;       // gravity
                p.vx *= 0.97;       // drag
                p.rotation += p.rotSpeed;
                p.life -= p.decay;

                const el = domRef.current.get(p.id);
                if (el) {
                    if (p.life <= 0) {
                        el.remove();
                        domRef.current.delete(p.id);
                        return false;
                    }
                    el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg) scale(${p.scale * p.life})`;
                    el.style.opacity = String(Math.min(1, p.life * 2));
                } else if (p.life > 0 && containerRef.current) {
                    // First frame — create DOM node
                    const span = document.createElement("span");
                    span.textContent = p.symbol;
                    span.style.cssText = `
            position: absolute;
            top: 0; left: 0;
            font-family: 'Courier New', monospace;
            font-size: 15px;
            font-weight: 800;
            color: ${p.color};
            pointer-events: none;
            user-select: none;
            text-shadow: 0 0 12px ${p.color}cc, 0 0 24px ${p.color}44;
            will-change: transform, opacity;
            transform: translate(${p.x}px, ${p.y}px) scale(${p.scale});
          `;
                    containerRef.current.appendChild(span);
                    domRef.current.set(p.id, span);
                }
                return p.life > 0;
            });

            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    /* Click listener */
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            // Only trigger on primary (left) button, ignore inputs/buttons that have their own feedback
            if (e.button !== 0) return;
            const target = e.target as HTMLElement;
            const tag = target.tagName.toLowerCase();
            // Don't burst on text inputs, textareas, selects
            if (tag === "input" || tag === "textarea" || tag === "select") return;
            spawnBurst(e.clientX, e.clientY);
        };

        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, [spawnBurst]);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
            aria-hidden="true"
        />
    );
}
