"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { parseCodeToGraph, type CodeGraph } from "@/lib/code-graph-parser";
import { motion } from "framer-motion";
import { ArrowLeft, Box, Loader2 } from "lucide-react";
import Link from "next/link";

const CodeExplorer3D = dynamic(
    () => import("@/components/explorer3d/CodeExplorer3D"),
    { ssr: false }
);

export default function ExplorePage() {
    const router = useRouter();
    const [graph, setGraph] = useState<CodeGraph | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const stored = sessionStorage.getItem("codesonar_analysis");
            if (!stored) {
                setError("No analysis data found. Please analyze a repository first.");
                setLoading(false);
                return;
            }

            const analysis = JSON.parse(stored);
            const files = (analysis.fileAnalysis || [])
                .filter((f: any) => {
                    const p = (f.path || "").toLowerCase();
                    return !p.endsWith(".json") && !p.endsWith(".css") && !p.endsWith(".md") && !p.endsWith(".lock");
                })
                .map((f: any) => ({
                    path: f.path,
                    content: f.content || f.preview || "",
                }));

            if (files.length === 0) {
                setError("No source files available for 3D visualization.");
                setLoading(false);
                return;
            }

            const codeGraph = parseCodeToGraph(
                files,
                analysis.errors || [],
                analysis.warnings || [],
                analysis.fileAnalysis || []
            );

            if (codeGraph.nodes.length === 0) {
                setError("Could not parse any code structures. Try analyzing a larger repository.");
                setLoading(false);
                return;
            }

            setGraph(codeGraph);
            setLoading(false);
        } catch (err) {
            console.error("Failed to build code graph:", err);
            setError("Failed to parse code structure for 3D view.");
            setLoading(false);
        }
    }, []);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-[#050510] flex items-center justify-center z-[200]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    <p className="text-white/60 text-sm">Building 3D code graph...</p>
                </motion.div>
            </div>
        );
    }

    if (error || !graph) {
        return (
            <div className="fixed inset-0 bg-[#050510] flex items-center justify-center z-[200]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-md px-6"
                >
                    <Box className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">No Data Available</h2>
                    <p className="text-white/40 mb-6">{error}</p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go to Analyzer
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] overflow-hidden bg-[#050510]">
            <CodeExplorer3D
                graph={graph}
                onGoBack={() => router.push("/")}
            />
        </div>
    );
}
