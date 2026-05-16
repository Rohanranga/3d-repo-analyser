"use client";

import { useEffect, useRef, useState } from "react";

type CursorState = "default" | "hover" | "click" | "text";

// Don't render on touch-only devices (phones/tablets have no mouse)
function isTouchOnly() {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(pointer: coarse)").matches;
}

/* ─── visual config per state ───────────────────────────────── */
const CFG: Record<CursorState, {
    dotW: number; dotH: number; dotR: number;
    dotBg: string; dotShadow: string;
    ringW: number; ringH: number;
    ringBorder: string; ringShadow: string;
    haloSize: number; haloOpacity: number;
}> = {
    default: {
        dotW: 8, dotH: 8, dotR: 50,
        dotBg: "#a78bfa",
        dotShadow: "0 0 8px 3px #a78bfacc, 0 0 20px 6px #a78bfa44",
        ringW: 34, ringH: 34,
        ringBorder: "1.5px solid #a78bfa88",
        ringShadow: "0 0 10px 2px #a78bfa33",
        haloSize: 70, haloOpacity: 0.18,
    },
    hover: {
        dotW: 12, dotH: 12, dotR: 50,
        dotBg: "#e879f9",
        dotShadow: "0 0 12px 5px #e879f9cc, 0 0 28px 10px #e879f944",
        ringW: 52, ringH: 52,
        ringBorder: "1.5px solid #e879f9aa",
        ringShadow: "0 0 16px 4px #e879f944",
        haloSize: 90, haloOpacity: 0.25,
    },
    click: {
        dotW: 5, dotH: 5, dotR: 50,
        dotBg: "#f472b6",
        dotShadow: "0 0 6px 2px #f472b6cc",
        ringW: 22, ringH: 22,
        ringBorder: "1.5px solid #f472b6bb",
        ringShadow: "0 0 8px 2px #f472b633",
        haloSize: 50, haloOpacity: 0.30,
    },
    text: {
        dotW: 2, dotH: 18, dotR: 2,
        dotBg: "#60a5fa",
        dotShadow: "0 0 6px 2px #60a5facc",
        ringW: 30, ringH: 30,
        ringBorder: "1.5px solid #60a5fa55",
        ringShadow: "0 0 8px 2px #60a5fa22",
        haloSize: 55, haloOpacity: 0.10,
    },
};

const TRANSITION = "width 0.12s ease, height 0.12s ease, border-radius 0.12s ease, background 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease";

export function NeonCursor() {
    // Don't render on touch-primary devices (phones/tablets)
    if (isTouchOnly()) return null;

    const dotRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);
    const haloRef = useRef<HTMLDivElement>(null);

    /* mutable positions — shared between event handler and rAF loop */
    const mouse = useRef({ x: -300, y: -300 });
    const ring = useRef({ x: -300, y: -300 });
    const halo = useRef({ x: -300, y: -300 });
    const rafId = useRef<number | null>(null);

    const stateRef = useRef<CursorState>("default");
    const [visible, setVisible] = useState(false);

    /* ── rAF animation loop — direct DOM, no React re-render ── */
    useEffect(() => {
        function loop() {
            const { x: mx, y: my } = mouse.current;

            /* dot — instant, pixel-perfect */
            if (dotRef.current) {
                dotRef.current.style.transform =
                    `translate(${mx}px,${my}px) translate(-50%,-50%)`;
            }

            /* ring — fast lerp (closes 35% of gap each frame ≈ 60fps) */
            ring.current.x += (mx - ring.current.x) * 0.35;
            ring.current.y += (my - ring.current.y) * 0.35;
            if (ringRef.current) {
                ringRef.current.style.transform =
                    `translate(${ring.current.x}px,${ring.current.y}px) translate(-50%,-50%)`;
            }

            /* halo — slower, dreamier (closes 16% each frame) */
            halo.current.x += (mx - halo.current.x) * 0.16;
            halo.current.y += (my - halo.current.y) * 0.16;
            if (haloRef.current) {
                haloRef.current.style.transform =
                    `translate(${halo.current.x}px,${halo.current.y}px) translate(-50%,-50%)`;
            }

            rafId.current = requestAnimationFrame(loop);
        }
        rafId.current = requestAnimationFrame(loop);
        return () => { if (rafId.current) cancelAnimationFrame(rafId.current); };
    }, []);

    /* ── apply visual config to DOM when state changes ── */
    function applyState(s: CursorState) {
        if (stateRef.current === s) return;
        stateRef.current = s;
        const c = CFG[s];

        if (dotRef.current) {
            const d = dotRef.current;
            d.style.width = `${c.dotW}px`;
            d.style.height = `${c.dotH}px`;
            d.style.borderRadius = `${c.dotR}%`;
            d.style.background = c.dotBg;
            d.style.boxShadow = c.dotShadow;
        }
        if (ringRef.current) {
            const r = ringRef.current;
            r.style.width = `${c.ringW}px`;
            r.style.height = `${c.ringH}px`;
            r.style.border = c.ringBorder;
            r.style.boxShadow = c.ringShadow;
            r.style.borderRadius = "50%";
        }
        if (haloRef.current) {
            const h = haloRef.current;
            h.style.width = `${c.haloSize}px`;
            h.style.height = `${c.haloSize}px`;
            h.style.opacity = String(c.haloOpacity);
        }
    }

    /* ── event listeners ── */
    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            mouse.current = { x: e.clientX, y: e.clientY };
            if (!visible) setVisible(true);

            const el = e.target as HTMLElement;
            const tag = el.tagName.toLowerCase();
            if (["input", "textarea", "select"].includes(tag)) {
                applyState("text");
            } else if (el.closest("a, button, [role='button'], label")) {
                applyState("hover");
            } else {
                if (stateRef.current !== "click") applyState("default");
            }
        };

        const onDown = () => applyState("click");
        const onUp = (e: MouseEvent) => {
            const el = e.target as HTMLElement;
            const tag = el.tagName.toLowerCase();
            if (["input", "textarea", "select"].includes(tag)) applyState("text");
            else if (el.closest("a, button, [role='button']")) applyState("hover");
            else applyState("default");
        };
        const onLeave = () => {
            if (dotRef.current) dotRef.current.style.opacity = "0";
            if (ringRef.current) ringRef.current.style.opacity = "0";
            if (haloRef.current) haloRef.current.style.opacity = "0";
        };
        const onEnter = () => {
            if (dotRef.current) dotRef.current.style.opacity = "1";
            if (ringRef.current) ringRef.current.style.opacity = "1";
            if (haloRef.current) haloRef.current.style.opacity = "1";
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mousedown", onDown);
        window.addEventListener("mouseup", onUp);
        document.addEventListener("mouseleave", onLeave);
        document.addEventListener("mouseenter", onEnter);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mousedown", onDown);
            window.removeEventListener("mouseup", onUp);
            document.removeEventListener("mouseleave", onLeave);
            document.removeEventListener("mouseenter", onEnter);
        };
    }, [visible]);

    /* ── static DOM elements, positions driven by rAF ── */
    const base: React.CSSProperties = {
        position: "fixed",
        top: 0, left: 0,
        pointerEvents: "none",
        userSelect: "none",
        willChange: "transform",
    };

    const c = CFG.default;

    return (
        <>
            {/* Outer halo — large diffuse glow blob */}
            <div
                ref={haloRef}
                style={{
                    ...base,
                    zIndex: 99990,
                    width: `${c.haloSize}px`,
                    height: `${c.haloSize}px`,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, #a78bfa55 0%, transparent 70%)",
                    opacity: visible ? c.haloOpacity : 0,
                    transition: `width ${TRANSITION}, height ${TRANSITION}, opacity 0.2s ease`,
                }}
            />

            {/* Trailing ring */}
            <div
                ref={ringRef}
                style={{
                    ...base,
                    zIndex: 99995,
                    width: `${c.ringW}px`,
                    height: `${c.ringH}px`,
                    borderRadius: "50%",
                    border: c.ringBorder,
                    boxShadow: c.ringShadow,
                    opacity: visible ? 1 : 0,
                    transition: TRANSITION,
                }}
            />

            {/* Inner dot — tracks pixel-perfect */}
            <div
                ref={dotRef}
                style={{
                    ...base,
                    zIndex: 99999,
                    width: `${c.dotW}px`,
                    height: `${c.dotH}px`,
                    borderRadius: `${c.dotR}%`,
                    background: c.dotBg,
                    boxShadow: c.dotShadow,
                    opacity: visible ? 1 : 0,
                    transition: TRANSITION,
                }}
            />
        </>
    );
}
