"use client";

import { AnalysisResult } from "@/types/analysis";
import { motion } from "framer-motion";
import {
    FileCode,
    Bug,
    AlertTriangle,
    Package,
    Cpu,
    Layers,
    Code2,
    TrendingUp,
    Shield,
    CheckCircle,
    ScrollText,
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ProjectSummaryProps {
    data: AnalysisResult;
}

function StatCard({
    icon: Icon,
    label,
    value,
    color,
    delay,
}: {
    icon: any;
    label: string;
    value: string | number;
    color: string;
    delay: number;
}) {
    const colorMap: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
        blue: { bg: "from-blue-500/10 to-blue-600/5", border: "border-blue-500/20", text: "text-blue-400", iconBg: "bg-blue-500/15" },
        red: { bg: "from-red-500/10 to-red-600/5", border: "border-red-500/20", text: "text-red-400", iconBg: "bg-red-500/15" },
        yellow: { bg: "from-yellow-500/10 to-yellow-600/5", border: "border-yellow-500/20", text: "text-yellow-400", iconBg: "bg-yellow-500/15" },
        green: { bg: "from-green-500/10 to-green-600/5", border: "border-green-500/20", text: "text-green-400", iconBg: "bg-green-500/15" },
        purple: { bg: "from-purple-500/10 to-purple-600/5", border: "border-purple-500/20", text: "text-purple-400", iconBg: "bg-purple-500/15" },
        indigo: { bg: "from-indigo-500/10 to-indigo-600/5", border: "border-indigo-500/20", text: "text-indigo-400", iconBg: "bg-indigo-500/15" },
        orange: { bg: "from-orange-500/10 to-orange-600/5", border: "border-orange-500/20", text: "text-orange-400", iconBg: "bg-orange-500/15" },
        cyan: { bg: "from-cyan-500/10 to-cyan-600/5", border: "border-cyan-500/20", text: "text-cyan-400", iconBg: "bg-cyan-500/15" },
    };
    const c = colorMap[color] || colorMap.blue;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className={`relative p-4 rounded-xl bg-gradient-to-br ${c.bg} border ${c.border} hover:shadow-lg transition-all cursor-default overflow-hidden`}
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${c.iconBg}`}>
                    <Icon className={`w-4 h-4 ${c.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/40 truncate">{label}</p>
                    <p className={`text-lg font-bold ${c.text}`}>{value}</p>
                </div>
            </div>
        </motion.div>
    );
}

function HealthBar({ score }: { score: number }) {
    const percentage = Math.min(score * 10, 100);
    const healthLabel = score <= 3 ? "Excellent" : score <= 5 ? "Good" : score <= 7 ? "Moderate" : "Complex";
    const healthColor = score <= 3 ? "from-green-500 to-emerald-400" : score <= 5 ? "from-blue-500 to-cyan-400" : score <= 7 ? "from-yellow-500 to-amber-400" : "from-red-500 to-rose-400";
    const healthText = score <= 3 ? "text-green-400" : score <= 5 ? "text-blue-400" : score <= 7 ? "text-yellow-400" : "text-red-400";

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Code Health</span>
                <span className={`text-xs font-bold ${healthText}`}>{healthLabel}</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${healthColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${100 - percentage}%` }}
                    transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
            </div>
        </div>
    );
}

export function ProjectSummary({ data }: ProjectSummaryProps) {
    const languages = data.techStack?.languages || [];
    const frameworks = data.techStack?.frameworks || [];
    const tools = data.techStack?.tools || [];
    const allTech = [...languages, ...frameworks, ...tools];
    const totalFiles = data.complexity?.metrics?.totalFiles || data.fileAnalysis?.length || 0;
    const totalLines = data.complexity?.metrics?.totalLines || 0;
    const errorCount = data.errors?.length || 0;
    const warningCount = data.warnings?.length || 0;
    const packageCount = data.packages?.total || 0;
    const qualityCount = data.qualityAnalysis?.length || 0;
    const complexityScore = data.complexity?.score || 5;
    const improvementCount = data.improvements?.length || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
        >
            <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
                {/* Header */}
                <div className="relative p-6 pb-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/8 to-pink-500/8 border-b border-white/5">
                    <motion.div
                        className="absolute inset-0 pointer-events-none"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 6, repeat: Infinity }}
                        style={{ background: "radial-gradient(ellipse 60% 80% at 30% 20%, rgba(99,102,241,0.08), transparent 60%)" }}
                    />

                    <div className="relative flex items-start justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <motion.div
                                className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30"
                                whileHover={{ rotate: 10, scale: 1.1 }}
                            >
                                <Cpu className="w-6 h-6 text-indigo-400" />
                            </motion.div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    Project Summary
                                </h2>
                                <p className="text-sm text-white/40 mt-0.5">
                                    AI-powered analysis overview
                                </p>
                            </div>
                        </div>

                        {/* Complexity badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                            className={`px-4 py-2 rounded-xl border font-bold text-sm flex items-center gap-2 ${
                                complexityScore <= 3
                                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                                    : complexityScore <= 5
                                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                                    : complexityScore <= 7
                                    ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                                    : "bg-red-500/10 border-red-500/30 text-red-400"
                            }`}
                        >
                            <Shield className="w-4 h-4" />
                            Complexity: {complexityScore}/10
                        </motion.div>
                    </div>

                    {/* Tech badges */}
                    {allTech.length > 0 && (
                        <div className="relative flex flex-wrap gap-2 mt-4">
                            {allTech.slice(0, 12).map((tech, i) => (
                                <motion.span
                                    key={tech}
                                    initial={{ opacity: 0, scale: 0.7 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.15 + i * 0.04, type: "spring", stiffness: 200 }}
                                    className="px-2.5 py-1 rounded-lg bg-white/5 text-xs font-medium text-white/60 border border-white/8 hover:bg-white/10 hover:text-white/80 transition-colors cursor-default"
                                >
                                    {tech}
                                </motion.span>
                            ))}
                            {allTech.length > 12 && (
                                <span className="px-2.5 py-1 rounded-lg bg-white/5 text-xs text-white/30 border border-white/8">
                                    +{allTech.length - 12} more
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Project Overview — what this project does */}
                {data.summary && (
                    <div className="px-6 pt-5 pb-2">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="p-2 rounded-lg bg-blue-500/15">
                                <ScrollText className="w-4 h-4 text-blue-400" />
                            </div>
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide">
                                About This Project
                            </h3>
                        </div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="overflow-y-auto max-h-[320px] rounded-xl bg-white/[0.02] border border-white/5 p-5 scrollbar-thin scrollbar-thumb-indigo-500/20 scrollbar-track-transparent"
                        >
                            <div className="prose prose-invert prose-sm max-w-none
                                           prose-headings:text-indigo-400 prose-headings:font-bold prose-headings:mb-2 prose-headings:mt-4 first:prose-headings:mt-0
                                           prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-3
                                           prose-strong:text-white prose-strong:font-bold
                                           prose-ul:list-disc prose-ul:pl-5 prose-li:mb-1.5
                                           prose-code:text-cyan-300 prose-code:bg-cyan-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {data.summary}
                                </ReactMarkdown>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Stats grid */}
                <div className="p-6 pt-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                        <StatCard icon={FileCode} label="Files Analyzed" value={totalFiles.toLocaleString()} color="blue" delay={0.1} />
                        <StatCard icon={Code2} label="Total Lines" value={totalLines.toLocaleString()} color="purple" delay={0.15} />
                        <StatCard icon={Bug} label="Errors Found" value={errorCount} color={errorCount > 0 ? "red" : "green"} delay={0.2} />
                        <StatCard icon={AlertTriangle} label="Warnings" value={warningCount} color={warningCount > 0 ? "yellow" : "green"} delay={0.25} />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                        <StatCard icon={Package} label="Packages" value={packageCount} color="cyan" delay={0.3} />
                        <StatCard icon={Layers} label="Tech Stack" value={allTech.length} color="indigo" delay={0.35} />
                        <StatCard icon={CheckCircle} label="Quality Issues" value={qualityCount} color="orange" delay={0.4} />
                        <StatCard icon={TrendingUp} label="Improvements" value={improvementCount} color="green" delay={0.45} />
                    </div>

                    {/* Health bar */}
                    <HealthBar score={complexityScore} />
                </div>
            </div>
        </motion.div>
    );
}
