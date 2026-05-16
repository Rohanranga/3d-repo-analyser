"use client";

import { motion } from "framer-motion";
import { Lightbulb, TrendingUp, Shield, Zap, Code, RefreshCw } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Improvement {
    category: 'complexity' | 'performance' | 'duplication' | 'security' | 'best-practice' | 'refactoring';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    file: string;
    line?: number;
    currentCode?: string;
    suggestedCode?: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
}

interface PotentialChangesProps {
    improvements: Improvement[];
}

const categoryIcons: Record<string, any> = {
    complexity: Code,
    performance: Zap,
    duplication: RefreshCw,
    security: Shield,
    'best-practice': TrendingUp,
    refactoring: Code
};

const categoryColors: Record<string, string> = {
    complexity: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    performance: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    duplication: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    security: 'text-red-400 bg-red-500/10 border-red-500/20',
    'best-practice': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    refactoring: 'text-green-400 bg-green-500/10 border-green-500/20'
};

const priorityColors: Record<string, string> = {
    high: 'bg-red-500/20 text-red-300 border-red-500/30',
    medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
};

const effortColors: Record<string, string> = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-red-400'
};

export function PotentialChanges({ improvements }: PotentialChangesProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const filteredImprovements = selectedCategory === 'all'
        ? improvements
        : improvements.filter(imp => imp.category === selectedCategory);

    const categories = Array.from(new Set(improvements.map(imp => imp.category)));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6 rounded-xl mb-8"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/10">
                        <Lightbulb className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold">💡 Potential Changes ({improvements.length})</h3>
                </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedCategory === 'all'
                        ? 'bg-primary text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                >
                    All ({improvements.length})
                </button>
                {categories.map(category => {
                    const count = improvements.filter(imp => imp.category === category).length;
                    return (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${selectedCategory === category
                                ? 'bg-primary text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            {category.replace('-', ' ')} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Improvements List */}
            <div className="space-y-4 max-h-[400px] sm:max-h-[600px] overflow-y-auto pr-1 sm:pr-2">
                {filteredImprovements.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <p>No improvements found in this category</p>
                    </div>
                ) : (
                    filteredImprovements.map((improvement, index) => {
                        const cat = improvement.category in categoryIcons ? improvement.category : 'best-practice';
                        const Icon = categoryIcons[cat];
                        const pri = improvement.priority in priorityColors ? improvement.priority : 'medium';
                        const eff = improvement.effort in effortColors ? improvement.effort : 'medium';
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`p-4 rounded-lg border ${categoryColors[cat] || categoryColors['best-practice']}`}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start gap-3 flex-1">
                                        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-sm mb-1">{improvement.title}</h4>
                                            <div className="text-xs text-gray-300 mb-2 prose prose-invert prose-sm max-w-none prose-p:my-0">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {improvement.description}
                                                </ReactMarkdown>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <span>📁 {improvement.file}</span>
                                                {improvement.line && <span>Line {improvement.line}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${priorityColors[pri]}`}>
                                            {improvement.priority}
                                        </span>
                                        <span className={`text-xs ${effortColors[eff]}`}>
                                            Effort: {improvement.effort}
                                        </span>
                                    </div>
                                </div>

                                {/* Impact */}
                                <div className="mb-3 p-2 bg-black/20 rounded text-xs">
                                    <span className="text-green-400 font-semibold">✨ Impact: </span>
                                    <span className="text-gray-300">{improvement.impact}</span>
                                </div>

                                {/* Code Examples */}
                                {(improvement.currentCode || improvement.suggestedCode) && (
                                    <div className="space-y-2">
                                        {improvement.currentCode && (
                                            <div className="bg-black/40 p-3 rounded border border-red-500/20">
                                                <div className="text-xs text-red-400 font-semibold mb-2">❌ Current:</div>
                                                <pre className="text-xs text-gray-300 font-mono overflow-x-auto">
                                                    {improvement.currentCode}
                                                </pre>
                                            </div>
                                        )}
                                        {improvement.suggestedCode && (
                                            <div className="bg-black/40 p-3 rounded border border-green-500/20">
                                                <div className="text-xs text-green-400 font-semibold mb-2">✅ Suggested:</div>
                                                <pre className="text-xs text-gray-300 font-mono overflow-x-auto">
                                                    {improvement.suggestedCode}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Summary */}
            {improvements.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/10">
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                            <div className="text-red-400 font-bold text-lg">
                                {improvements.filter(i => i.priority === 'high').length}
                            </div>
                            <div className="text-gray-400 text-xs">High Priority</div>
                        </div>
                        <div>
                            <div className="text-yellow-400 font-bold text-lg">
                                {improvements.filter(i => i.priority === 'medium').length}
                            </div>
                            <div className="text-gray-400 text-xs">Medium Priority</div>
                        </div>
                        <div>
                            <div className="text-blue-400 font-bold text-lg">
                                {improvements.filter(i => i.priority === 'low').length}
                            </div>
                            <div className="text-gray-400 text-xs">Low Priority</div>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
