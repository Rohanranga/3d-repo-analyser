"use client";

import { AnalysisResult } from "@/types/analysis";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, Package, FileCode, CheckCircle, Check, Copy } from "lucide-react";
import { PotentialChanges } from "./PotentialChanges";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from "@/components/ui/CodeBlock";

/* ── Copy button for the Source Code panel ── */
function CopyCodeButton({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        if (!code) return;
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { }
    };
    return (
        <button
            onClick={copy}
            title={copied ? "Copied!" : "Copy code"}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all duration-200 ${copied
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-white/5 border-white/10 text-gray-400 hover:bg-indigo-500/20 hover:border-indigo-500/40 hover:text-indigo-300"
                }`}
        >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied!" : "Copy"}
        </button>
    );
}


interface DetailedAnalysisProps {
    data: AnalysisResult;
}

const sectionVariants = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export function DetailedAnalysis({ data }: DetailedAnalysisProps) {
    return (
        <div className="space-y-6">

            {/* Errors & Warnings */}
            {((data.errors?.length ?? 0) > 0 || (data.warnings?.length ?? 0) > 0) && (
                <motion.div
                    variants={sectionVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                    className="glass-card p-6 rounded-xl"
                >
                    <h3 className="text-xl font-semibold flex items-center gap-2 mb-4">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        Errors & Warnings ({(data.errors?.length ?? 0) + (data.warnings?.length ?? 0)})
                    </h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {(data.errors || []).map((error, i) => (
                            <motion.div
                                key={`error-${i}`}
                                initial={{ opacity: 0, x: -12 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.06 }}
                                className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg space-y-3"
                            >
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-red-400">{error.message}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {error.file} {error.line > 0 && `(Line ${error.line})`}
                                        </p>
                                    </div>
                                    <span className="px-2 py-0.5 bg-red-500/20 rounded text-xs text-red-300 uppercase font-bold">
                                        {error.severity}
                                    </span>
                                </div>
                                {error.suggestion && (
                                    <div className="text-sm bg-black/20 p-3 rounded text-gray-300 border-l-2 border-yellow-500">
                                        <span className="text-yellow-400 font-semibold">💡 Suggestion: </span>
                                        {error.suggestion}
                                    </div>
                                )}
                                {error.fixCode && (
                                    <div className="text-xs bg-black/40 p-3 rounded border border-green-500/20">
                                        <div className="text-green-400 font-semibold mb-2">✅ How to Fix:</div>
                                        <pre className="text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">{error.fixCode}</pre>
                                    </div>
                                )}
                            </motion.div>
                        ))}

                        {(data.warnings || []).map((warning, i) => (
                            <motion.div
                                key={`warning-${i}`}
                                initial={{ opacity: 0, x: -12 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.06 }}
                                className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg space-y-3"
                            >
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-yellow-400">{warning.message}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {warning.file} {warning.line > 0 && `(Line ${warning.line})`}
                                        </p>
                                    </div>
                                    <span className="px-2 py-0.5 bg-yellow-500/20 rounded text-xs text-yellow-300 uppercase font-bold">
                                        {warning.severity}
                                    </span>
                                </div>
                                {warning.suggestion && (
                                    <div className="text-sm bg-black/20 p-3 rounded text-gray-300 border-l-2 border-blue-500">
                                        <span className="text-blue-400 font-semibold">💡 Suggestion: </span>
                                        {warning.suggestion}
                                    </div>
                                )}
                                {warning.fixCode && (
                                    <div className="text-xs bg-black/40 p-3 rounded border border-green-500/20">
                                        <div className="text-green-400 font-semibold mb-2">✅ How to Fix:</div>
                                        <pre className="text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">{warning.fixCode}</pre>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Package Analysis */}
            <motion.div
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                className="glass-card p-4 sm:p-6 rounded-xl"
            >
                <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2 mb-4">
                    <Package className="w-5 h-5 text-primary flex-shrink-0" />
                    Tech Stack & Languages ({data.packages?.total ?? 0})
                </h3>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full text-sm text-left min-w-[360px]">
                        <thead className="text-xs text-muted-foreground uppercase bg-white/5">
                            <tr>
                                <th className="px-3 sm:px-4 py-3 rounded-tl-lg">Technology</th>
                                <th className="px-3 sm:px-4 py-3">Version/Type</th>
                                <th className="px-3 sm:px-4 py-3 rounded-tr-lg">Latest</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data.packages.all || [])
                                .sort((a, b) => (a.status === 'outdated' ? -1 : 1))
                                .map((pkg, i) => (
                                    <motion.tr
                                        key={i}
                                        initial={{ opacity: 0, x: -8 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.03 }}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                    >
                                        <td className="px-3 sm:px-4 py-3 font-mono text-primary text-xs sm:text-sm">{pkg.name}</td>
                                        <td className="px-3 sm:px-4 py-3">
                                            <span className="px-2 py-1 bg-white/5 rounded text-xs opacity-70">{pkg.current}</span>
                                        </td>
                                        <td className="px-3 sm:px-4 py-3 opacity-50 text-xs">{pkg.latest !== '-' ? pkg.latest : ''}</td>
                                    </motion.tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Quality Recommendations */}
            <motion.div
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                className="glass-card p-4 sm:p-6 rounded-xl"
            >
                <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    Quality Recommendations ({data.qualityAnalysis?.length ?? 0})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {(data.qualityAnalysis || []).map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ y: -2, transition: { duration: 0.15 } }}
                            className={`p-4 rounded-lg border-l-4 ${item.priority === 'critical' ? 'bg-red-500/10 border-red-500' :
                                item.priority === 'high' ? 'bg-orange-500/10 border-orange-500' :
                                    item.priority === 'medium' ? 'bg-yellow-500/10 border-yellow-500' :
                                        'bg-green-500/10 border-green-500'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-sm">{item.category}</h4>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.priority === 'critical' ? 'bg-red-500/20 text-red-300' :
                                    item.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                                        item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                            'bg-green-500/20 text-green-300'
                                    }`}>
                                    {item.priority.toUpperCase()}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2"><strong>Issue:</strong> {item.issue}</p>
                            <p className="text-xs"><strong>Fix:</strong> {item.recommendation}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Potential Changes */}
            {data.improvements && data.improvements.length > 0 && (
                <PotentialChanges improvements={data.improvements} />
            )}

            {/* Code Explorer */}
            <CodeExplorer files={data.fileAnalysis || []} />
        </div>
    );
}

function CodeExplorer({ files }: { files: AnalysisResult['fileAnalysis'] }) {
    const [selectedFile, setSelectedFile] = useState<typeof files[0] | null>(files[0] || null);
    const [currentExplanation, setCurrentExplanation] = useState<string>('');

    useEffect(() => {
        if (selectedFile) {
            import('@/lib/line-by-line-explainer').then(({ generateLineByLineExplanation }) => {
                setCurrentExplanation(generateLineByLineExplanation({
                    path: selectedFile.path,
                    content: selectedFile.content || selectedFile.preview || ''
                }));
            });
        }
    }, [selectedFile]);

    return (
        <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="glass-card flex flex-col rounded-xl bg-gradient-to-br from-indigo-500/5 to-transparent border border-indigo-500/20"
        >
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-purple-500/10 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/10 shadow-lg">
                        <FileCode className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                    </div>
                    <h3 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Code Explorer</h3>
                </div>
                <span className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-xs sm:text-sm font-semibold text-indigo-300 border border-indigo-500/30">
                    {files.length} files analyzed
                </span>
            </div>

            <div className="flex flex-col lg:flex-row" style={{ minHeight: '500px', maxHeight: '800px' }}>
                {/* File list */}
                <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-white/10 overflow-y-auto bg-gradient-to-b from-black/40 to-black/20 max-h-48 lg:max-h-none">
                    {files.map((file, i) => (
                        <motion.button
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => setSelectedFile(file)}
                            className={`w-full text-left p-3 sm:p-4 text-xs sm:text-sm hover:bg-gradient-to-r hover:from-indigo-500/10 hover:to-purple-500/10 transition-all duration-200 flex items-center justify-between group border-b border-white/5 ${selectedFile?.path === file.path
                                ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-l-4 border-indigo-400'
                                : 'border-l-4 border-transparent hover:border-indigo-500/50'
                                }`}
                        >
                            <span className="truncate font-mono text-gray-300 group-hover:text-indigo-300 transition-colors mr-2">{file.path}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium flex-shrink-0 ${selectedFile?.path === file.path
                                ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                                : 'bg-white/5 text-gray-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300'
                                }`}>{file.language}</span>
                        </motion.button>
                    ))}
                </div>

                {/* Content area */}
                <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d0d] min-h-0">
                    {selectedFile ? (
                        <>
                            <div className="p-3 sm:p-4 border-b border-white/10 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 flex justify-between items-center flex-wrap gap-2">
                                <span className="text-xs sm:text-sm font-mono text-indigo-300 font-semibold truncate max-w-[60%]">{selectedFile.path}</span>
                                <div className="flex gap-1.5 sm:gap-2 text-xs flex-shrink-0">
                                    <span className="px-2 py-1 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30 font-medium">{selectedFile.lines} lines</span>
                                    <span className="px-2 py-1 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 font-medium">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto grid grid-rows-2" style={{ minHeight: 0 }}>
                                <div className="border-b border-white/10 overflow-auto bg-[#0a0a0a] relative">
                                    <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                                        <CopyCodeButton code={selectedFile.content || selectedFile.preview || ""} />
                                        <div className="px-2 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg text-xs font-semibold text-green-300 pointer-events-none">
                                            📄 Source Code
                                        </div>
                                    </div>
                                    <pre className="p-4 sm:p-6 pt-10 text-xs font-mono leading-relaxed text-gray-300 overflow-x-auto">
                                        <code>{selectedFile.content || selectedFile.preview || "// Content not available"}</code>
                                    </pre>
                                </div>
                                <div className="overflow-auto bg-gradient-to-b from-[#111111] to-[#0a0a0a] p-4 sm:p-6">
                                    <div className="mb-3 sm:mb-4 flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                                            <span className="text-lg">🤖</span>
                                        </div>
                                        <span className="text-xs sm:text-sm uppercase tracking-wider font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">AI Explanation</span>
                                        <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/50 to-transparent" />
                                    </div>
                                    <div className="prose prose-invert prose-sm max-w-none prose-p:text-gray-400 prose-headings:text-indigo-300 prose-strong:text-white prose-code:text-indigo-200">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                code: ({ className, children, ...props }: any) => (
                                                    <CodeBlock inline={!className} className={className} {...props}>
                                                        {children}
                                                    </CodeBlock>
                                                )
                                            }}
                                        >
                                            {currentExplanation || selectedFile.explanation || 'Generating explanation...'}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground p-8 text-sm">
                            Select a file to view content
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
