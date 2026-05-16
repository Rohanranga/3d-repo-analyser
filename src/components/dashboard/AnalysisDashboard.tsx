"use client";

import { AnalysisResult } from "@/types/analysis";
import { SummaryCard } from "../analysis/SummaryCard";
import { ArchitectureView } from "../analysis/ArchitectureView";
import { DetailedAnalysis } from "../analysis/DetailedAnalysis";
import { DownloadPDF } from "../analysis/DownloadPDF";
import { ProjectSummary } from "../analysis/ProjectSummary";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Box } from "lucide-react";

interface AnalysisDashboardProps {
    data: AnalysisResult | null;
    isLoading: boolean;
    error: string | null;
}

const loadingStages = [
    { label: "Fetching repository files", icon: "📦", color: "blue" },
    { label: "Identifying tech stack & languages", icon: "🔍", color: "cyan" },
    { label: "Running AI bug detection", icon: "🐛", color: "red" },
    { label: "Analyzing code quality", icon: "✅", color: "green" },
    { label: "Generating architecture diagram", icon: "🏗️", color: "purple" },
    { label: "Writing code explanations", icon: "🤖", color: "indigo" },
    { label: "Compiling final report", icon: "📊", color: "amber" },
];

const codeSnippets = [
    "const analyze = async (repo) => {",
    "  const files = await fetchAll(repo);",
    "  const ast = parser.parse(files);",
    "  return ai.evaluate(ast);",
    "function detectBugs(node) {",
    "  if (!node.type) return null;",
    "  return linter.check(node);",
    "export class Analyzer {",
    "  constructor(private ai: AI) {}",
    "  async run() { ... }",
    "const score = complexity.calc();",
    "return { errors, warnings, score };",
];

function LoadingScreen() {
    const [activeStep, setActiveStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [codeLines, setCodeLines] = useState<string[]>([]);
    const [scanY, setScanY] = useState(0);

    useEffect(() => {
        // Advance steps every ~8s
        const stepInterval = setInterval(() => {
            setActiveStep(s => Math.min(s + 1, loadingStages.length - 1));
        }, 8000);

        // Smooth progress bar — fills to 90% over ~56s
        const start = Date.now();
        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - start;
            setProgress(Math.min(90, (elapsed / 56000) * 90));
        }, 200);

        // Rolling code stream
        let lineIdx = 0;
        const codeInterval = setInterval(() => {
            setCodeLines(prev => {
                const next = [...prev, codeSnippets[lineIdx % codeSnippets.length]];
                lineIdx++;
                return next.slice(-6); // keep last 6 lines
            });
        }, 900);

        // Scanning beam y position (0→100% loop)
        let frame: number;
        let startTime = Date.now();
        const animateScan = () => {
            const elapsed = (Date.now() - startTime) % 2400;
            setScanY((elapsed / 2400) * 100);
            frame = requestAnimationFrame(animateScan);
        };
        frame = requestAnimationFrame(animateScan);

        return () => {
            clearInterval(stepInterval);
            clearInterval(progressInterval);
            clearInterval(codeInterval);
            cancelAnimationFrame(frame);
        };
    }, []);

    const stage = loadingStages[activeStep];

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-3xl mx-auto mt-12 px-4 pb-16"
        >
            {/* ── Main card ── */}
            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-black/60 backdrop-blur-2xl shadow-2xl shadow-black/60">

                {/* Ambient background pulse */}
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    style={{
                        background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.12), transparent 70%)"
                    }}
                />

                {/* ── TOP: Orbital spinner + code stream ── */}
                <div className="flex flex-col sm:flex-row gap-6 p-6 sm:p-8 border-b border-white/8">

                    {/* Orbital animation */}
                    <div className="flex-shrink-0 flex items-center justify-center">
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32">
                            {/* Outer orbit */}
                            <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{ border: "1.5px solid rgba(99,102,241,0.3)" }}
                                animate={{ rotate: 360 }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            >
                                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-indigo-400 shadow-lg shadow-indigo-400/80" />
                            </motion.div>

                            {/* Middle orbit */}
                            <motion.div
                                className="absolute inset-5 rounded-full"
                                style={{ border: "1.5px solid rgba(168,85,247,0.4)" }}
                                animate={{ rotate: -360 }}
                                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                            >
                                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-purple-400 shadow-lg shadow-purple-400/80" />
                            </motion.div>

                            {/* Inner orbit */}
                            <motion.div
                                className="absolute inset-9 rounded-full"
                                style={{ border: "1px solid rgba(96,165,250,0.5)" }}
                                animate={{ rotate: 360 }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            >
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-400 shadow-lg shadow-blue-400/80" />
                            </motion.div>

                            {/* Center icon */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div
                                    animate={{ scale: [1, 1.15, 1] }}
                                    transition={{ duration: 2.5, repeat: Infinity }}
                                    className="text-2xl sm:text-3xl"
                                >
                                    {stage.icon}
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* Right: title + code stream */}
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                        <motion.h3
                            key={stage.label}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-lg sm:text-xl font-bold text-white mb-1"
                        >
                            Analyzing Codebase
                        </motion.h3>
                        <motion.p
                            key={activeStep}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-sm text-indigo-300 mb-4 font-medium"
                        >
                            {stage.label}…
                        </motion.p>

                        {/* Live code stream */}
                        <div className="relative rounded-xl bg-white/[0.03] border border-white/8 overflow-hidden font-mono text-xs leading-relaxed p-3" style={{ height: "96px" }}>
                            {/* Scanning laser */}
                            <div
                                className="absolute left-0 right-0 h-px pointer-events-none"
                                style={{
                                    top: `${scanY}%`,
                                    background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.6), rgba(168,85,247,0.6), transparent)",
                                    boxShadow: "0 0 8px 1px rgba(99,102,241,0.4)",
                                }}
                            />
                            {/* Fade top/bottom */}
                            <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10" />
                            <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-10" />

                            <div className="space-y-1 relative">
                                {codeLines.map((line, i) => (
                                    <motion.div
                                        key={`${line}-${i}`}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: i === codeLines.length - 1 ? 1 : 0.45, x: 0 }}
                                        className="text-emerald-300/80 truncate"
                                    >
                                        <span className="text-white/20 mr-2 select-none">{String(i + 1).padStart(2, " ")}</span>
                                        {line}
                                    </motion.div>
                                ))}
                                {/* Blinking cursor on last line */}
                                <motion.span
                                    animate={{ opacity: [1, 0, 1] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                    className="inline-block w-1.5 h-3.5 bg-indigo-400 align-text-bottom rounded-sm ml-1"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Progress bar ── */}
                <div className="px-6 sm:px-8 pt-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-white/40">Progress</span>
                        <span className="text-xs font-mono text-indigo-300">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full relative overflow-hidden"
                            style={{
                                width: `${progress}%`,
                                background: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899)",
                            }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                            {/* Shimmer on progress bar */}
                            <motion.div
                                className="absolute inset-0"
                                style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)" }}
                                animate={{ x: ["-100%", "200%"] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </motion.div>
                    </div>
                </div>

                {/* ── Step checklist ── */}
                <div className="p-6 sm:p-8 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {loadingStages.map((stage, i) => {
                        const isDone = i < activeStep;
                        const isActive = i === activeStep;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: isActive ? 1 : isDone ? 0.9 : 0.35, x: 0 }}
                                transition={{ delay: i * 0.08, duration: 0.4 }}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-500 ${isActive
                                        ? "bg-indigo-500/10 border-indigo-500/30"
                                        : isDone
                                            ? "bg-emerald-500/8 border-emerald-500/20"
                                            : "bg-white/[0.02] border-white/5"
                                    }`}
                            >
                                {/* Status dot / check */}
                                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                                    {isDone ? (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 300 }}
                                            className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center"
                                        >
                                            <span className="text-emerald-400 text-[10px] font-bold">✓</span>
                                        </motion.div>
                                    ) : isActive ? (
                                        <motion.div
                                            className="w-2 h-2 rounded-full bg-indigo-400"
                                            animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                        />
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-white/15" />
                                    )}
                                </div>

                                <span className="text-sm">{stage.icon}</span>
                                <span className={`text-xs flex-1 transition-colors duration-300 ${isActive ? "text-white font-medium"
                                        : isDone ? "text-emerald-400"
                                            : "text-white/30"
                                    }`}>
                                    {stage.label}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Bottom tip */}
                <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                    <p className="text-center text-xs text-white/25">
                        🤖 AI is deeply reading your code — this takes 1–3 minutes
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

export function AnalysisDashboard({ data, isLoading, error }: AnalysisDashboardProps) {
    return (
        <AnimatePresence mode="wait">
            {isLoading && <LoadingScreen key="loading" />}

            {error && !isLoading && (
                <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full max-w-2xl mx-auto mt-12 p-8 rounded-2xl bg-red-500/5 border border-red-500/20 text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="text-5xl mb-4"
                    >
                        ⚠️
                    </motion.div>
                    <p className="text-red-400 mb-2 font-semibold text-lg">Analysis Failed</p>
                    <p className="text-white/40 text-sm">{error}</p>
                </motion.div>
            )}

            {data && !isLoading && (
                <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-6xl mx-auto mt-8 sm:mt-12 px-3 sm:px-4 pb-16 sm:pb-20"
                >
                    {/* "Analysis complete" toast */}
                    <motion.div
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-2 mb-6 px-4 py-2.5 rounded-full bg-green-500/10 border border-green-500/20 w-fit"
                    >
                        <motion.span
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            ✅
                        </motion.span>
                        <span className="text-sm text-green-400 font-medium">Analysis complete</span>
                    </motion.div>

                    <ProjectSummary data={data} />
                    <SummaryCard data={data} />

                    {/* 3D Explorer launch button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-8"
                    >
                        <Link
                            href="/explore"
                            onClick={() => {
                                try {
                                    sessionStorage.setItem("codesonar_analysis", JSON.stringify(data));
                                } catch {
                                    try {
                                        const trimmed = {
                                            ...data,
                                            fileAnalysis: (data.fileAnalysis || []).map((f) => ({
                                                ...f,
                                                content: f.content?.slice(0, 5000) || f.preview || "",
                                            })),
                                        };
                                        sessionStorage.setItem("codesonar_analysis", JSON.stringify(trimmed));
                                    } catch {
                                        console.warn("Could not store analysis for 3D view");
                                    }
                                }
                            }}
                            className="group relative flex items-center gap-4 p-5 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 hover:from-indigo-500/20 hover:via-purple-500/20 hover:to-pink-500/20 transition-all duration-500 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30">
                                <Box className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                                    Explore in 3D / AR / VR
                                </h3>
                                <p className="text-sm text-white/40">
                                    Navigate your code as an immersive 3D puzzle. Classes become buildings, functions become rooms, dependencies become paths.
                                </p>
                            </div>
                            <div className="text-indigo-400 group-hover:translate-x-1 transition-transform">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </div>
                        </Link>
                    </motion.div>

                    <ArchitectureView diagram={data.architecture} />
                    <DetailedAnalysis data={data} />
                    <DownloadPDF data={data} />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
