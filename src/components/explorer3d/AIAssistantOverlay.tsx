"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, X, Terminal, Code, Cpu } from "lucide-react";
import type { GraphNode } from "@/lib/code-graph-parser";

interface AIAssistantOverlayProps {
    node: GraphNode | null;
    onClose: () => void;
}

export function AIAssistantOverlay({ node, onClose }: AIAssistantOverlayProps) {
    const [explanation, setExplanation] = useState<string>("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!node) {
            setExplanation("");
            return;
        }

        const fetchExplanation = async () => {
            setLoading(true);
            try {
                // In a real app, this would call an API route that uses Gemini
                // For this demo, we'll simulate a very "AI-like" response
                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: `Explain the architectural role of this ${node.type} named "${node.label}" in the context of a 3D puzzle environment.`,
                        context: `Node Path: ${node.id}\nType: ${node.type}\nStatus: ${node.status}\nComplexity: ${node.complexity}`
                    })
                });
                const data = await res.json();
                setExplanation(data.response || "No explanation available.");
            } catch (e) {
                setExplanation("Error connecting to the AI architect.");
            } finally {
                setLoading(false);
            }
        };

        fetchExplanation();
    }, [node]);

    return (
        <AnimatePresence>
            {node && (
                <motion.div
                    initial={{ x: 400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 400, opacity: 0 }}
                    className="absolute top-24 right-4 w-80 pointer-events-auto"
                >
                    <div className="relative overflow-hidden rounded-2xl bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 shadow-2xl">
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-indigo-500/20">
                                    <Bot className="w-4 h-4 text-indigo-400" />
                                </div>
                                <span className="text-sm font-bold text-white/90">AI Architect</span>
                            </div>
                            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-md transition-colors">
                                <X className="w-4 h-4 text-white/40" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 p-1.5 rounded-full bg-emerald-500/20">
                                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Analysis Target</div>
                                    <div className="text-sm font-semibold text-white/80">{node.label}</div>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-[11px] leading-relaxed text-white/60 min-h-[120px]">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-24 gap-2">
                                        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="animate-pulse">Analyzing structures...</span>
                                    </div>
                                ) : (
                                    explanation
                                )}
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex items-center gap-2">
                                    <Code className="w-3 h-3 text-indigo-400" />
                                    <div className="text-[10px] text-white/50">{node.type}</div>
                                </div>
                                <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex items-center gap-2">
                                    <Cpu className="w-3 h-3 text-amber-400" />
                                    <div className="text-[10px] text-white/50">Complex: {node.complexity}</div>
                                </div>
                            </div>
                        </div>

                        {/* Footer decorative bar */}
                        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
