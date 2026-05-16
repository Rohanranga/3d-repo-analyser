"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Upload, Github, FileCode, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface RepoInputProps {
    onAnalyze: (type: "url" | "file", value: string) => void;
    isLoading: boolean;
}

interface StagedFile {
    name: string;
    size: number;
    lines: number;
    language: string;
    content: string;
}

function getLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    const map: Record<string, string> = {
        ts: 'TypeScript', tsx: 'TypeScript (React)', js: 'JavaScript', jsx: 'JavaScript (React)',
        py: 'Python', java: 'Java', go: 'Go', rs: 'Rust', cpp: 'C++', c: 'C',
        cs: 'C#', rb: 'Ruby', php: 'PHP', css: 'CSS', scss: 'SCSS',
        html: 'HTML', json: 'JSON', md: 'Markdown', yaml: 'YAML', yml: 'YAML',
    };
    return map[ext] ?? (ext.toUpperCase() || 'Unknown');
}

export function RepoInput({ onAnalyze, isLoading }: RepoInputProps) {
    const [activeTab, setActiveTab] = useState<"url" | "upload">("url");
    const [url, setUrl] = useState("");
    const [loadingText, setLoadingText] = useState("Analyzing...");
    const [staged, setStaged] = useState<StagedFile | null>(null);
    const [preparing, setPreparing] = useState(false);
    const [prepareStep, setPrepareStep] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const prepareSteps = staged ? [
        `Reading ${staged.name}...`,
        `Detecting language: ${staged.language}`,
        `Counting ${staged.lines.toLocaleString()} lines of code`,
        `Preparing AI analysis...`,
    ] : [];

    useEffect(() => {
        if (!isLoading) {
            setLoadingText("Analyzing...");
            return;
        }
        const steps = [
            "Reading source files...",
            "Identifying Tech Stack...",
            "Scanning for Bugs & Errors...",
            "Running security analysis...",
            "Generating Architecture Diagram...",
            "Analyzing Code Quality...",
            "Writing Code Explanations...",
            "Finalizing Report..."
        ];
        let i = 0;
        setLoadingText(steps[0]);
        const interval = setInterval(() => {
            i = (i + 1) % steps.length;
            setLoadingText(steps[i]);
        }, 5000);
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (activeTab === "url" && url) onAnalyze("url", url);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const lines = content.split('\n').length;
            setStaged({
                name: file.name,
                size: file.size,
                lines,
                language: getLanguage(file.name),
                content,
            });
        };
        reader.readAsText(file);
    };

    const handleAnalyzeFile = () => {
        if (!staged || preparing) return;
        setPreparing(true);
        setPrepareStep(0);

        // Walk through steps visually, then fire
        let step = 0;
        const interval = setInterval(() => {
            step++;
            setPrepareStep(step);
            if (step >= prepareSteps.length - 1) {
                clearInterval(interval);
                // Small final pause then submit
                setTimeout(() => {
                    setPreparing(false);
                    onAnalyze("file", JSON.stringify({ name: staged.name, content: staged.content }));
                }, 600);
            }
        }, 700);
    };

    const clearFile = () => {
        setStaged(null);
        setPreparing(false);
        setPrepareStep(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="w-full">
            {/* Tabs */}
            <div className="flex items-center gap-2 sm:gap-4 mb-5">
                <button
                    onClick={() => setActiveTab("url")}
                    className={cn(
                        "flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all",
                        activeTab === "url"
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                            : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                >
                    <Github className="w-4 h-4 flex-shrink-0" />
                    GitHub URL
                </button>
                <button
                    onClick={() => setActiveTab("upload")}
                    className={cn(
                        "flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all",
                        activeTab === "upload"
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                            : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                >
                    <Upload className="w-4 h-4 flex-shrink-0" />
                    Upload File
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="glass-card p-1.5 sm:p-2 rounded-2xl"
            >
                {activeTab === "url" ? (
                    <form onSubmit={handleSubmit} className="flex items-center gap-1.5 sm:gap-2">
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://github.com/username/repo"
                                className="w-full bg-transparent border-none focus:ring-0 pl-9 sm:pl-12 pr-2 py-3 sm:py-4 text-sm text-foreground placeholder:text-muted-foreground/50"
                                disabled={isLoading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !url}
                            className="flex-shrink-0 px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-medium transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            {isLoading ? (
                                <><span className="hidden sm:inline">{loadingText}</span><span className="sm:hidden">...</span></>
                            ) : "Analyze"}
                        </button>
                    </form>
                ) : (
                    <div className="p-2">
                        <AnimatePresence mode="wait">
                            {!staged ? (
                                /* Drop zone */
                                <motion.div
                                    key="dropzone"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="relative group"
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.h,.css,.html,.json,.md,.go,.rs,.rb,.php,.yaml,.yml"
                                        disabled={isLoading}
                                    />
                                    <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer group-hover:bg-white/5">
                                        <div className="w-14 h-14 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                            <FileCode className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <p className="text-base font-medium mb-1">Drop your source file here</p>
                                        <p className="text-sm text-muted-foreground">Click to select · JS, TS, PY, GO, RS and more</p>
                                    </div>
                                </motion.div>
                            ) : (
                                /* Staged file card */
                                <motion.div
                                    key="staged"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
                                >
                                    {/* File header */}
                                    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 bg-white/5">
                                        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                                            <FileCode className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">{staged.name}</p>
                                            <p className="text-xs text-muted-foreground">{staged.language} · {(staged.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                        {!isLoading && (
                                            <button onClick={clearFile} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Stats row */}
                                    <div className="grid grid-cols-3 divide-x divide-white/8 border-b border-white/8">
                                        {[
                                            { label: 'Lines', val: staged.lines.toLocaleString() },
                                            { label: 'Size', val: `${(staged.size / 1024).toFixed(1)} KB` },
                                            { label: 'Language', val: staged.language.split(' ')[0] },
                                        ].map((s) => (
                                            <div key={s.label} className="px-3 py-2.5 text-center">
                                                <p className="text-xs text-muted-foreground mb-0.5">{s.label}</p>
                                                <p className="text-sm font-semibold text-white truncate">{s.val}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Prepare steps (shown while preparing) */}
                                    <AnimatePresence>
                                        {(preparing || isLoading) && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="border-b border-white/8 overflow-hidden"
                                            >
                                                <div className="px-4 py-3 space-y-2">
                                                    {isLoading ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin flex-shrink-0" />
                                                            <span className="text-xs text-muted-foreground">{loadingText}</span>
                                                        </div>
                                                    ) : prepareSteps.map((step, i) => (
                                                        <motion.div
                                                            key={i}
                                                            initial={{ opacity: 0, x: -8 }}
                                                            animate={{ opacity: i <= prepareStep ? 1 : 0.3, x: 0 }}
                                                            className="flex items-center gap-2"
                                                        >
                                                            {i < prepareStep ? (
                                                                <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                                                            ) : i === prepareStep ? (
                                                                <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin flex-shrink-0" />
                                                            ) : (
                                                                <div className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0" />
                                                            )}
                                                            <span className="text-xs text-muted-foreground">{step}</span>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Analyze button */}
                                    <div className="p-3">
                                        <button
                                            onClick={handleAnalyzeFile}
                                            disabled={preparing || isLoading}
                                            className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {preparing || isLoading ? (
                                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>{isLoading ? loadingText : 'Preparing...'}</span></>
                                            ) : (
                                                <><FileCode className="w-4 h-4" /><span>Analyze {staged.name}</span></>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

