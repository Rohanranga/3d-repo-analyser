"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GraphNode, CodeGraph } from "@/lib/code-graph-parser";
import {
    X, Eye, Route, Zap, AlertTriangle, Box, Layers, GitBranch,
    ZoomIn, ZoomOut, RotateCcw, ChevronUp, ChevronDown,
    ChevronLeft, ChevronRight, ArrowUp, ArrowDown,
    Smartphone, Bug, ChevronRight as ChevRight,
} from "lucide-react";

export type MoveDir = "forward" | "backward" | "left" | "right" | "up" | "down";

// ─── Errors Panel ─────────────────────────────────────────────
interface ErrorsPanelProps { graph: CodeGraph; onFocusNode: (id: string) => void; }

export function ErrorsPanel({ graph, onFocusNode }: ErrorsPanelProps) {
    const [expanded, setExpanded] = useState(false);
    const errorNodes   = graph.nodes.filter(n => n.status === "error");
    const warningNodes = graph.nodes.filter(n => n.status === "warning");
    const unusedNodes  = graph.nodes.filter(n => n.status === "unused");
    if (errorNodes.length + warningNodes.length + unusedNodes.length === 0) return null;
    return (
        <div className="pointer-events-auto absolute bottom-20 left-4 z-50">
            {!expanded ? (
                <button onClick={() => setExpanded(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 hover:bg-black/70">
                    <Bug className="w-4 h-4 text-red-400" />
                    {errorNodes.length > 0   && <span className="text-xs font-bold text-red-400">{errorNodes.length} errors</span>}
                    {warningNodes.length > 0 && <span className="text-xs font-bold text-amber-400">{warningNodes.length} warn</span>}
                    {unusedNodes.length > 0  && <span className="text-xs text-gray-400">{unusedNodes.length} unused</span>}
                    <ChevRight className="w-3 h-3 text-white/30" />
                </button>
            ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-72 max-h-80 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b border-white/10">
                        <div className="flex items-center gap-2"><Bug className="w-4 h-4 text-red-400" /><span className="text-sm font-bold text-white">Issues</span></div>
                        <button onClick={() => setExpanded(false)} className="p-1 rounded-lg hover:bg-white/10"><X className="w-3.5 h-3.5 text-white/40" /></button>
                    </div>
                    <div className="overflow-y-auto max-h-64 p-2 space-y-1">
                        {errorNodes.map(n => (
                            <button key={n.id} onClick={() => { onFocusNode(n.id); setExpanded(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-left">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0"><div className="text-xs font-medium text-white truncate">{n.label}</div><div className="text-[10px] text-red-400/60">{n.filePath}:{n.lineStart}</div></div>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">ERR</span>
                            </button>
                        ))}
                        {warningNodes.map(n => (
                            <button key={n.id} onClick={() => { onFocusNode(n.id); setExpanded(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-amber-500/10 text-left">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0"><div className="text-xs font-medium text-white truncate">{n.label}</div><div className="text-[10px] text-amber-400/60">{n.filePath}:{n.lineStart}</div></div>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">WARN</span>
                            </button>
                        ))}
                        {unusedNodes.map(n => (
                            <button key={n.id} onClick={() => { onFocusNode(n.id); setExpanded(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-500/10 text-left">
                                <Box className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0"><div className="text-xs font-medium text-white/60 truncate">{n.label}</div><div className="text-[10px] text-gray-500">{n.filePath}:{n.lineStart}</div></div>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400">UNUSED</span>
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}

// ─── Node Info Panel ──────────────────────────────────────────
interface NodeInfoPanelProps {
    node: GraphNode; graph: CodeGraph; onClose: () => void;
    onTraceFrom: (id: string) => void; onFocusNode: (id: string) => void; onIsolateNode: (id: string) => void;
}
const TYPE_ICONS: Record<string, any> = { module: Layers, class: Box, function: Zap, variable: GitBranch, interface: Layers, enum: Layers };
const STATUS_BADGES: Record<string, { color: string; label: string }> = {
    healthy: { color: "text-emerald-400 bg-emerald-500/20", label: "Healthy" },
    warning: { color: "text-amber-400 bg-amber-500/20",   label: "Warning" },
    error:   { color: "text-red-400 bg-red-500/20",       label: "Error"   },
    unused:  { color: "text-gray-400 bg-gray-500/20",     label: "Unused"  },
};

export function NodeInfoPanel({ node, graph, onClose, onTraceFrom, onFocusNode, onIsolateNode }: NodeInfoPanelProps) {
    if (!node) return null;
    const Icon  = TYPE_ICONS[node.type] || Box;
    const badge = STATUS_BADGES[node.status] || STATUS_BADGES.healthy;
    const incoming = graph.edges.filter(e => e.target === node.id);
    const outgoing = graph.edges.filter(e => e.source === node.id);
    const connected = new Map<string, { node: GraphNode; direction: string; type: string }>();
    incoming.forEach(e => { const n = graph.nodes.find(n => n.id === e.source); if (n) connected.set(n.id, { node: n, direction: "in", type: e.type }); });
    outgoing.forEach(e => { const n = graph.nodes.find(n => n.id === e.target); if (n) connected.set(n.id, { node: n, direction: "out", type: e.type }); });
    return (
        <AnimatePresence>
            <motion.div key={node.id} initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="pointer-events-auto absolute top-4 right-4 w-72 sm:w-80 max-h-[calc(100vh-2rem)] overflow-y-auto z-50 rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl">
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-indigo-500/20"><Icon className="w-4 h-4 text-indigo-400" /></div><span className="text-xs uppercase tracking-wider text-white/40">{node.type}</span></div>
                        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10"><X className="w-4 h-4 text-white/40" /></button>
                    </div>
                    <h3 className="text-lg font-bold text-white">{node.label}</h3>
                    <p className="text-sm text-white/50 mt-1">{node.description}</p>
                </div>
                <div className="p-4 border-b border-white/10 space-y-3">
                    <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                        {node.status === "error" && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white/5 rounded-lg p-2 text-center"><div className="text-xs text-white/40">Lines</div><div className="text-sm font-bold text-white">{node.lineEnd - node.lineStart + 1}</div></div>
                        <div className="bg-white/5 rounded-lg p-2 text-center"><div className="text-xs text-white/40">Complexity</div><div className={`text-sm font-bold ${node.complexity > 10 ? "text-red-400" : node.complexity > 5 ? "text-amber-400" : "text-emerald-400"}`}>{node.complexity}</div></div>
                        <div className="bg-white/5 rounded-lg p-2 text-center"><div className="text-xs text-white/40">Links</div><div className="text-sm font-bold text-white">{incoming.length + outgoing.length}</div></div>
                    </div>
                    <div className="text-xs text-white/30">{node.filePath}:{node.lineStart}</div>
                </div>
                <div className="p-4 border-b border-white/10">
                    <h4 className="text-xs uppercase tracking-wider text-white/40 mb-2">Code Preview</h4>
                    <pre className="text-xs text-emerald-300/80 bg-black/40 rounded-lg p-3 overflow-x-auto max-h-32 font-mono">{node.code}</pre>
                </div>
                {connected.size > 0 && (
                    <div className="p-4 border-b border-white/10">
                        <h4 className="text-xs uppercase tracking-wider text-white/40 mb-2">Connections ({connected.size})</h4>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {Array.from(connected.values()).map(({ node: cn, direction, type }) => (
                                <button key={cn.id} onClick={() => onFocusNode(cn.id)} className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-lg hover:bg-white/5">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${direction === "in" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}`}>{direction === "in" ? "IN" : "OUT"}</span>
                                    <span className="text-xs text-white/60 hover:text-white truncate flex-1">{cn.label}</span>
                                    <span className="text-[10px] text-white/30">{type}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <div className="p-4 space-y-2">
                    <button onClick={() => onIsolateNode(node.id)} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm font-medium transition-colors">
                        <Eye className="w-4 h-4" /> Isolate Node
                    </button>
                    <button onClick={() => onTraceFrom(node.id)} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-sm transition-colors">
                        <Route className="w-4 h-4" /> Trace Execution Path
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// ─── 6-Button Move Pad ────────────────────────────────────────
interface MovePadProps { onMoveStart: (dir: MoveDir) => void; onMoveEnd: (dir: MoveDir) => void; }

function PadBtn({ dir, onStart, onEnd, children }: { dir: MoveDir; onStart: (d: MoveDir) => void; onEnd: (d: MoveDir) => void; children: React.ReactNode }) {
    return (
        <button
            onPointerDown={e => { e.preventDefault(); onStart(dir); }}
            onPointerUp={() => onEnd(dir)}
            onPointerLeave={() => onEnd(dir)}
            onContextMenu={e => e.preventDefault()}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.07] border border-white/[0.12] text-white/60
                       hover:bg-indigo-500/20 hover:border-indigo-500/40 hover:text-indigo-300
                       active:bg-indigo-500/40 active:scale-95 transition-all select-none touch-none backdrop-blur-md shadow-lg"
        >
            {children}
        </button>
    );
}

export function MovePad({ onMoveStart, onMoveEnd }: MovePadProps) {
    return (
        <div className="pointer-events-auto flex flex-col items-center gap-1">
            {/* Row 1: Up */}
            <div className="flex justify-center">
                <PadBtn dir="up" onStart={onMoveStart} onEnd={onMoveEnd}><ArrowUp className="w-4 h-4" /></PadBtn>
            </div>
            {/* Row 2: Forward */}
            <div className="flex justify-center">
                <PadBtn dir="forward" onStart={onMoveStart} onEnd={onMoveEnd}><ChevronUp className="w-4 h-4" /></PadBtn>
            </div>
            {/* Row 3: Left / Back / Right */}
            <div className="flex gap-1">
                <PadBtn dir="left" onStart={onMoveStart} onEnd={onMoveEnd}><ChevronLeft className="w-4 h-4" /></PadBtn>
                <PadBtn dir="backward" onStart={onMoveStart} onEnd={onMoveEnd}><ChevronDown className="w-4 h-4" /></PadBtn>
                <PadBtn dir="right" onStart={onMoveStart} onEnd={onMoveEnd}><ChevronRight className="w-4 h-4" /></PadBtn>
            </div>
            {/* Row 4: Down */}
            <div className="flex justify-center">
                <PadBtn dir="down" onStart={onMoveStart} onEnd={onMoveEnd}><ArrowDown className="w-4 h-4" /></PadBtn>
            </div>
        </div>
    );
}

// ─── Legend Panel ─────────────────────────────────────────────
const LEGEND_ITEMS = [
    { color: "#6366f1", label: "Module" },
    { color: "#f59e0b", label: "Class" },
    { color: "#10b981", label: "Function" },
    { color: "#f97316", label: "Variable" },   // vivid orange
    { color: "#8b5cf6", label: "Interface" },
    { color: "#ec4899", label: "Enum" },
];

// Complexity ring legend
const COMPLEXITY_ITEMS = [
    { color: "#22c55e", label: "Low  (1–4)" },
    { color: "#f59e0b", label: "Med  (5–8)" },
    { color: "#f97316", label: "High (9–13)" },
    { color: "#ef4444", label: "Crit (14+)" },
];

function LegendPanel() {
    return (
        <div className="pointer-events-auto absolute bottom-20 left-4 z-40
                        rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-xl px-3 py-2.5 space-y-1.5">
            {/* Node types */}
            <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Legend</div>
            {LEGEND_ITEMS.map(item => (
                <div key={item.label} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                    <span className="text-[11px] text-white/60">{item.label}</span>
                </div>
            ))}
            {/* Complexity rings */}
            <div className="pt-2 border-t border-white/10">
                <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Complexity Ring</div>
                {COMPLEXITY_ITEMS.map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full border-2 flex-shrink-0"
                            style={{ borderColor: item.color, boxShadow: `0 0 5px ${item.color}` }} />
                        <span className="text-[11px] text-white/60">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Controls Panel ───────────────────────────────────────────
function ControlsPanel() {
    return (
        <div className="pointer-events-auto absolute bottom-20 right-4 z-40
                        rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-xl px-3 py-2.5 space-y-1">
            <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Controls</div>
            {[
                ["Click", "Select node"],
                ["Scroll", "Zoom"],
                ["Drag", "Rotate"],
                ["Right-drag", "Pan"],
                ["ESC", "Deselect"],
            ].map(([key, action]) => (
                <div key={key} className="flex items-center gap-2">
                    <span className="text-[10px] text-indigo-400 font-mono">{key}</span>
                    <span className="text-[10px] text-white/40">— {action}</span>
                </div>
            ))}
        </div>
    );
}

// ─── HUD Overlay ─────────────────────────────────────────────
interface HUDOverlayProps {
    graph: CodeGraph;
    viewMode: "orbit" | "fly";
    onViewModeChange: (m: "orbit" | "fly") => void;
    filterType: string | null;
    onFilterChange: (t: string | null) => void;
    isTracing: boolean;
    onToggleTrace: () => void;
    showLabels: boolean;
    onToggleLabels: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetView: () => void;
    gyroEnabled: boolean;
    onToggleGyro: () => void;
    isMobile: boolean;
    onMoveStart: (dir: MoveDir) => void;
    onMoveEnd: (dir: MoveDir) => void;
    discoveryProgress: number;
    isIsolated: boolean;
    onExitIsolation: () => void;
}

export function HUDOverlay({
    graph, viewMode, onViewModeChange, filterType, onFilterChange,
    isTracing, onToggleTrace, showLabels, onToggleLabels,
    onZoomIn, onZoomOut, onResetView, gyroEnabled, onToggleGyro,
    isMobile, onMoveStart, onMoveEnd, discoveryProgress,
    isIsolated, onExitIsolation,
}: HUDOverlayProps) {
    const typeCounts = graph.nodes.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <>
            {/* ── Legend bottom-left ── */}
            <LegendPanel />

            {/* ── Controls bottom-right ── */}
            <ControlsPanel />

            {/* ── Zoom/camera right-center ── */}
            <div className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                <button onClick={onZoomIn} className="p-2 rounded-xl bg-black/50 backdrop-blur-xl border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/10 transition-all"><ZoomIn className="w-4 h-4" /></button>
                <button onClick={onZoomOut} className="p-2 rounded-xl bg-black/50 backdrop-blur-xl border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/10 transition-all"><ZoomOut className="w-4 h-4" /></button>
                <button onClick={onResetView} className="p-2 rounded-xl bg-black/50 backdrop-blur-xl border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/10 transition-all"><RotateCcw className="w-4 h-4" /></button>
                {isMobile && (
                    <button onClick={onToggleGyro} className={`p-2 rounded-xl backdrop-blur-xl border transition-all ${gyroEnabled ? "bg-indigo-500/30 border-indigo-500/40 text-indigo-300" : "bg-black/50 border-white/[0.08] text-white/50 hover:text-white"}`}><Smartphone className="w-4 h-4" /></button>
                )}
            </div>

            {/* ── Move pad (fly mode only) — bottom-center-left ── */}
            {viewMode === "fly" && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40">
                    <MovePad onMoveStart={onMoveStart} onMoveEnd={onMoveEnd} />
                </div>
            )}

            {/* ── Isolation banner ── */}
            {isIsolated && (
                <div className="pointer-events-auto absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30 backdrop-blur-xl shadow-xl">
                    <span className="text-sm text-amber-300 font-medium">Isolated View</span>
                    <button onClick={onExitIsolation} className="text-xs px-3 py-1 rounded-full bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 transition-colors">Exit</button>
                </div>
            )}

            {/* ── Discovery progress ── */}
            <div className="pointer-events-auto absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-xl border border-white/10">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">Discovered</span>
                <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${discoveryProgress}%` }} />
                </div>
                <span className="text-[10px] text-indigo-300 font-mono">{discoveryProgress}%</span>
            </div>

            {/* ── Bottom toolbar ── */}
            <div className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 z-40
                            flex items-center gap-1.5 px-3 py-2 rounded-2xl
                            bg-black/60 backdrop-blur-xl border border-white/10 shadow-xl
                            max-w-[calc(100vw-2rem)] overflow-x-auto">

                {(["orbit", "fly", "AR", "VR"] as const).map(mode => (
                    <button
                        key={mode}
                        onClick={() => (mode === "orbit" || mode === "fly") ? onViewModeChange(mode) : undefined}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all whitespace-nowrap
                            ${(viewMode === mode || (mode === "AR" && false) || (mode === "VR" && false))
                                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                                : "text-white/40 hover:text-white hover:bg-white/10"}`}
                    >
                        {mode.toUpperCase()}
                    </button>
                ))}

                <div className="w-px h-5 bg-white/10 mx-1 flex-shrink-0" />

                {Object.entries(typeCounts).map(([type, count]) => (
                    <button
                        key={type}
                        onClick={() => onFilterChange(filterType === type ? null : type)}
                        className={`px-2 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 whitespace-nowrap
                            ${filterType === type ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/30" : "text-white/30 hover:text-white/60 hover:bg-white/5"}`}
                    >
                        {type} <span className="text-[10px] opacity-60">{count}</span>
                    </button>
                ))}

                <div className="w-px h-5 bg-white/10 mx-1 flex-shrink-0" />

                <button
                    onClick={onToggleTrace}
                    className={`px-2.5 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-1
                        ${isTracing ? "bg-emerald-500/30 text-emerald-300" : "text-white/40 hover:text-white/60"}`}
                >
                    <Route className="w-3.5 h-3.5 inline" /> Trace
                </button>

                <button
                    onClick={onToggleLabels}
                    className={`px-2.5 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap
                        ${showLabels ? "bg-purple-500/30 text-purple-300" : "text-white/40 hover:text-white/60"}`}
                >
                    Labels
                </button>
            </div>
        </>
    );
}
