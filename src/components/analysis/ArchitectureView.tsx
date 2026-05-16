"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { motion } from "framer-motion";
import { Network, Download } from "lucide-react";
import { toJpeg } from 'html-to-image';

interface ArchitectureViewProps {
    diagram: string;
}

function sanitizeMermaid(diagram: string): string {
    return diagram
        .split('\n')
        .map(line => {
            // Fix edge labels: |anything with (parens) or [brackets]| → strip the bad chars
            line = line.replace(/\|([^|]+)\|/g, (_, label) => {
                const clean = label.replace(/[()[\]{}]/g, '').trim();
                return `|"${clean}"|`;
            });
            // Fix stadium/round nodes: NodeId(Label) → NodeId["Label"]
            // But only when it's a node definition, not part of an arrow
            line = line.replace(/\b([A-Za-z][A-Za-z0-9_]*)\(([^)]+)\)/g, (_, id, label) => {
                return `${id}["${label.replace(/"/g, '')}"]`;
            });
            return line;
        })
        .join('\n');
}

export function ArchitectureView({ diagram }: ArchitectureViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRendering, setIsRendering] = useState(true);

    const handleDownload = async () => {
        if (containerRef.current) {
            try {
                // JPG doesn't support transparency, so we use a dark background
                const dataUrl = await toJpeg(containerRef.current, { backgroundColor: '#111' });
                const link = document.createElement('a');
                link.download = 'architecture-diagram.jpg';
                link.href = dataUrl;
                link.click();
            } catch (err) {
                console.error("Failed to download diagram:", err);
            }
        }
    };

    useEffect(() => {
        const renderDiagram = async () => {
            if (!containerRef.current) return;

            setIsRendering(true);
            setError(null);

            // Always use a guaranteed working diagram
            const fallbackDiagram = `graph TD
    A["Application"] --> B["Components"]
    A --> C["Pages"]
    A --> D["API"]
    B --> E["UI Elements"]
    C --> B
    D --> B`;

            const diagramToRender = diagram && diagram.trim().length > 10
                ? sanitizeMermaid(diagram)
                : fallbackDiagram;

            try {
                // Initialize Mermaid
                mermaid.initialize({
                    startOnLoad: false,
                    theme: "dark",
                    securityLevel: "loose",
                    fontFamily: "inherit",
                    themeVariables: {
                        primaryColor: "#4f46e5",
                        primaryTextColor: "#fff",
                        primaryBorderColor: "#6366f1",
                        lineColor: "#8b5cf6",
                        secondaryColor: "#7c3aed",
                        tertiaryColor: "#a78bfa",
                    }
                });

                // Generate unique ID for this render
                const id = `mermaid-${Date.now()}`;

                // Render the diagram
                const { svg } = await mermaid.render(id, diagramToRender);

                if (containerRef.current) {
                    containerRef.current.innerHTML = svg;
                }
            } catch (err) {
                console.error("❌ Mermaid render error:", err);
                setError(err instanceof Error ? err.message : String(err));

                // Show text-based fallback
                if (containerRef.current) {
                    containerRef.current.innerHTML = `
                        <div class="text-center py-8">
                            <p class="text-yellow-400 mb-4">⚠️ Could not render visual diagram</p>
                            <div class="text-left bg-black/40 p-4 rounded text-sm text-gray-300 font-mono">
                                <div>Application Structure:</div>
                                <div class="ml-4 mt-2">
                                    <div>├── Components</div>
                                    <div>├── Pages</div>
                                    <div>└── API</div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            } finally {
                setIsRendering(false);
            }
        };

        renderDiagram();
    }, [diagram]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6 rounded-xl mb-8"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/10">
                    <Network className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold">Visual Architecture</h3>

                <div className="ml-auto flex gap-2">
                    {!isRendering && !error && (
                        <button
                            onClick={handleDownload}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                            title="Download Diagram (JPG)"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    )}
                    {isRendering && (
                        <span className="text-xs text-gray-400 self-center">Rendering...</span>
                    )}
                </div>
            </div>

            <div
                ref={containerRef}
                className="w-full overflow-x-auto flex justify-center p-4 sm:p-6 bg-black/20 rounded-lg min-h-[160px] sm:min-h-[200px] items-center"
            >
                <div className="text-gray-400 text-sm">Loading diagram...</div>
            </div>

            {error && (
                <div className="mt-4 text-xs text-red-400 bg-red-500/10 p-3 rounded">
                    Error: {error}
                </div>
            )}
        </motion.div>
    );
}
