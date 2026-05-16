"use client";

import { AnalysisResult } from "@/types/analysis";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Layers, Zap } from "lucide-react";
import { useEffect, useRef } from "react";

interface SummaryCardProps {
    data: AnalysisResult;
}

// Animated counter that counts up from 0 to target
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
    const motionVal = useMotionValue(0);
    const spring = useSpring(motionVal, { stiffness: 60, damping: 20 });
    const display = useTransform(spring, v => Math.round(v).toLocaleString());
    const ref = useRef(false);

    useEffect(() => {
        if (!ref.current) {
            ref.current = true;
            motionVal.set(value);
        }
    }, [value, motionVal]);

    return <motion.span className={className}>{display}</motion.span>;
}

export function SummaryCard({ data }: SummaryCardProps) {
    const score = data.complexity?.score ?? 5;
    const scoreColor = score > 7
        ? 'from-red-500 to-rose-500'
        : score > 4
        ? 'from-yellow-500 to-amber-500'
        : 'from-green-500 to-emerald-500';

    const scoreBadge = score > 7
        ? 'bg-red-500/20 text-red-300 border-red-500/40'
        : score > 4
        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
        : 'bg-green-500/20 text-green-300 border-green-500/40';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Tech Stack */}
            <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="glass-card p-6 rounded-xl bg-gradient-to-br from-purple-500/5 to-transparent border border-purple-500/20 hover:border-purple-500/40 transition-colors duration-300 hover:shadow-lg hover:shadow-purple-500/10"
            >
                <div className="flex items-center gap-3 mb-4">
                    <motion.div
                        className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10"
                        whileHover={{ rotate: -10, scale: 1.1, transition: { duration: 0.2 } }}
                    >
                        <Layers className="w-6 h-6 text-purple-400" />
                    </motion.div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Tech Stack
                    </h3>
                </div>
                <div className="space-y-3">
                    {(data.techStack?.languages?.length ?? 0) > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-blue-400 mb-2">Languages</p>
                            <div className="flex flex-wrap gap-2">
                                {(data.techStack?.languages || []).map((tech, i) => (
                                    <motion.span
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.7 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.2 + i * 0.05, type: 'spring', stiffness: 200 }}
                                        whileHover={{ scale: 1.1, y: -2, transition: { duration: 0.15 } }}
                                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-xs font-medium text-blue-300 border border-blue-500/30 cursor-default"
                                    >
                                        {tech}
                                    </motion.span>
                                ))}
                            </div>
                        </div>
                    )}
                    {(data.techStack?.frameworks?.length ?? 0) > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-purple-400 mb-2">Frameworks</p>
                            <div className="flex flex-wrap gap-2">
                                {(data.techStack?.frameworks || []).map((tech, i) => (
                                    <motion.span
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.7 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.3 + i * 0.05, type: 'spring', stiffness: 200 }}
                                        whileHover={{ scale: 1.1, y: -2, transition: { duration: 0.15 } }}
                                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-xs font-medium text-purple-300 border border-purple-500/30 cursor-default"
                                    >
                                        {tech}
                                    </motion.span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Complexity */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="glass-card p-6 rounded-xl md:col-span-2 bg-gradient-to-br from-orange-500/5 to-transparent border border-orange-500/20 hover:border-orange-500/40 transition-colors duration-300 hover:shadow-lg hover:shadow-orange-500/10"
            >
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <motion.div
                        className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-600/10 flex-shrink-0"
                        whileHover={{ rotate: 15, scale: 1.1, transition: { duration: 0.2 } }}
                    >
                        <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                    </motion.div>
                    <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                        Complexity Analysis
                    </h3>
                    <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                        className={`ml-auto px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold border flex-shrink-0 ${scoreBadge}`}
                    >
                        Score: {score}/10
                    </motion.span>
                </div>

                {/* Animated complexity bar */}
                <div className="w-full h-2 bg-white/5 rounded-full mb-4 overflow-hidden">
                    <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${scoreColor}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${score * 10}%` }}
                        transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    />
                </div>

                <p className="text-gray-300 text-sm leading-relaxed mb-5">{data.complexity?.analysis || 'Analysis not available.'}</p>

                {/* Animated metric counters */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-white/10">
                    {[
                        { label: 'Total Files', value: data.complexity?.metrics?.totalFiles ?? 0, color: 'from-blue-400 to-cyan-400', accent: 'text-blue-400' },
                        { label: 'Total Lines', value: data.complexity?.metrics?.totalLines ?? 0, color: 'from-purple-400 to-pink-400', accent: 'text-purple-400' },
                        { label: 'Avg / File', value: data.complexity?.metrics?.avgLinesPerFile ?? 0, color: 'from-orange-400 to-amber-400', accent: 'text-orange-400' },
                    ].map((m, i) => (
                        <motion.div
                            key={m.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 0.1 }}
                            whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
                            className="text-center p-2 sm:p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-default"
                        >
                            <p className={`text-xs font-semibold mb-1 ${m.accent}`}>{m.label}</p>
                            <AnimatedNumber
                                value={m.value}
                                className={`text-lg sm:text-2xl font-bold bg-gradient-to-r ${m.color} bg-clip-text text-transparent`}
                            />
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
