"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import {
    Fingerprint, Eye, EyeOff, Info, X, Github, Key, Cpu,
    ArrowLeft, Search, Upload, FileCode, CheckCircle,
    Loader2, ExternalLink, Zap, Crown, Sparkles, Shield,
    Star, ChevronRight, Lock, Check, RotateCcw,
} from "lucide-react";
import { AnalysisDashboard } from "@/components/dashboard/AnalysisDashboard";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { AnalysisResult } from "@/types/analysis";

/* ──────────────────────────────────────────────────────────────
   Logo — animated Fingerprint with orbit rings
   ────────────────────────────────────────────────────────────── */
function PrivateLogo() {
    return (
        <div className="relative flex items-center justify-center w-28 h-28 mx-auto mb-6">
            {/* Outer orbit ring */}
            <motion.div
                className="absolute inset-0 rounded-full border border-violet-500/20"
                animate={{ rotate: 360, scale: [1, 1.04, 1] }}
                transition={{ rotate: { duration: 12, repeat: Infinity, ease: "linear" }, scale: { duration: 3, repeat: Infinity } }}
            />
            {/* Middle orbit ring */}
            <motion.div
                className="absolute inset-3 rounded-full border border-fuchsia-500/25"
                animate={{ rotate: -360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
                {/* Orbit dot */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-fuchsia-400 shadow-lg shadow-fuchsia-400/60" />
            </motion.div>
            {/* Glow background */}
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-violet-600/30 to-fuchsia-600/20 blur-md" />
            {/* Icon box */}
            <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-900/80 to-fuchsia-900/60 border border-violet-400/30 flex items-center justify-center shadow-2xl shadow-violet-500/20 backdrop-blur-xl">
                <Fingerprint className="w-8 h-8 text-violet-300" strokeWidth={1.5} />
            </div>
            {/* Active badge */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-black shadow-lg shadow-emerald-400/50"
            />
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────
   Info Tooltip — click-outside via document mousedown listener
   (avoids backdrop-filter stacking-context bug)
   ────────────────────────────────────────────────────────────── */
function InfoTooltip({ content }: { content: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        // slight delay so the opening click doesn't immediately close
        const id = setTimeout(() => document.addEventListener("mousedown", handler), 10);
        return () => { clearTimeout(id); document.removeEventListener("mousedown", handler); };
    }, [open]);

    return (
        <div className="relative inline-block" ref={wrapperRef}>
            <button
                type="button"
                onClick={() => setOpen(p => !p)}
                className="w-5 h-5 rounded-full bg-white/8 hover:bg-violet-500/20 border border-white/10 hover:border-violet-400/40 flex items-center justify-center text-white/35 hover:text-violet-400 transition-all"
            >
                <Info className="w-3 h-3" />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-[100] w-72 bg-[#130f23] border border-violet-500/20 rounded-2xl p-4 shadow-2xl shadow-violet-900/40 text-sm"
                    >
                        <button onClick={() => setOpen(false)} className="absolute top-2 right-2 text-white/25 hover:text-white/60 transition-colors">
                            <X className="w-3.5 h-3.5" />
                        </button>
                        {content}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────
   Subscription Plans
   ────────────────────────────────────────────────────────────── */
const PLANS = [
    {
        id: "starter",
        name: "Starter",
        price: "Free",
        period: "7-day trial",
        icon: Zap,
        color: "from-blue-500/15 to-cyan-500/10",
        border: "border-blue-500/25 hover:border-blue-400/50",
        accent: "text-blue-400",
        badge: null,
        features: ["5 analyses / month", "GitHub public repos", "Basic AI insights", "Architecture diagram"],
        glow: "hover:shadow-blue-500/10",
    },
    {
        id: "pro",
        name: "Pro",
        price: "$12",
        period: "per month",
        icon: Crown,
        color: "from-violet-500/20 to-fuchsia-500/15",
        border: "border-violet-400/40 hover:border-violet-400/70",
        accent: "text-violet-300",
        badge: "Most Popular",
        features: ["Unlimited analyses", "Private repos support", "Deep AI bug detection", "Chat with codebase", "Priority processing"],
        glow: "hover:shadow-violet-500/15",
    },
    {
        id: "enterprise",
        name: "Enterprise",
        price: "$49",
        period: "per month",
        icon: Shield,
        color: "from-rose-500/15 to-orange-500/10",
        border: "border-rose-500/25 hover:border-rose-400/50",
        accent: "text-rose-400",
        badge: "Best Value",
        features: ["Everything in Pro", "Team collaboration", "Custom AI prompts", "API access", "Dedicated support", "SLA guarantee"],
        glow: "hover:shadow-rose-500/10",
    },
];

/* ──────────────────────────────────────────────────────────────
   Plan Card
   ────────────────────────────────────────────────────────────── */
function PlanCard({
    plan,
    selected,
    onSelect,
    index,
}: {
    plan: (typeof PLANS)[0];
    selected: boolean;
    onSelect: () => void;
    index: number;
}) {
    const Icon = plan.icon;
    return (
        <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
            onClick={onSelect}
            className={`relative flex flex-col gap-4 p-5 rounded-2xl cursor-pointer border bg-white/[0.025] backdrop-blur-sm transition-all duration-300 ${plan.border} ${plan.glow} hover:shadow-xl hover:bg-white/[0.04] ${selected ? "ring-2 ring-violet-500/50 bg-violet-500/10" : ""
                }`}
        >
            {/* Popular badge */}
            {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
                        {plan.badge}
                    </span>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} border border-white/10 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${plan.accent}`} />
                </div>
                {selected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                    </motion.div>
                )}
            </div>

            <div>
                <p className="text-sm font-bold text-white">{plan.name}</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                    <span className={`text-2xl font-extrabold ${plan.accent}`}>{plan.price}</span>
                    <span className="text-xs text-white/35">{plan.period}</span>
                </div>
            </div>

            <ul className="space-y-1.5">
                {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-white/55">
                        <Check className={`w-3.5 h-3.5 flex-shrink-0 ${plan.accent}`} />
                        {f}
                    </li>
                ))}
            </ul>
        </motion.div>
    );
}

/* ──────────────────────────────────────────────────────────────
   Language helper
   ────────────────────────────────────────────────────────────── */
function getLanguage(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    const map: Record<string, string> = {
        ts: "TypeScript", tsx: "TypeScript (React)", js: "JavaScript", jsx: "JavaScript (React)",
        py: "Python", java: "Java", go: "Go", rs: "Rust", cpp: "C++", c: "C",
        cs: "C#", rb: "Ruby", php: "PHP", css: "CSS", html: "HTML",
        json: "JSON", md: "Markdown", yaml: "YAML", yml: "YAML",
    };
    return map[ext] ?? (ext.toUpperCase() || "Unknown");
}

/* ──────────────────────────────────────────────────────────────
   Main Page
   ────────────────────────────────────────────────────────────── */
type Step = "subscribe" | "analyze";

export default function PrivateAnalysisPage() {
    const [step, setStep] = useState<"subscribe" | "analyze" | "loading" | "results">("subscribe");
    const [selectedPlan, setSelectedPlan] = useState<string>("pro");

    // Form state
    const [geminiKey, setGeminiKey] = useState("");
    const [githubKey, setGithubKey] = useState("");
    const [showGemini, setShowGemini] = useState(false);
    const [showGithub, setShowGithub] = useState(false);
    const [inputMode, setInputMode] = useState<"url" | "file">("url");
    const [repoUrl, setRepoUrl] = useState("");

    interface StagedFile { name: string; size: number; lines: number; language: string; content: string; }
    const [staged, setStaged] = useState<StagedFile | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [chatContext, setChatContext] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const content = ev.target?.result as string;
            setStaged({ name: file.name, size: file.size, lines: content.split("\n").length, language: getLanguage(file.name), content });
        };
        reader.readAsText(file);
    };

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!geminiKey.trim()) { setError("Please enter your Gemini API key."); return; }
        if (!githubKey.trim() && inputMode === "url") { setError("Please enter your GitHub token for URL analysis."); return; }
        if (inputMode === "url" && !repoUrl.trim()) { setError("Please enter a GitHub repository URL."); return; }
        if (inputMode === "file" && !staged) { setError("Please upload a source file."); return; }

        // Immediately show the full premium loading screen
        setError(null); setResult(null);
        setIsLoading(true);
        setStep("loading");

        try {
            const body = inputMode === "url"
                ? { type: "url", value: repoUrl, geminiKey, githubKey }
                : { type: "file", value: JSON.stringify({ name: staged!.name, content: staged!.content }), geminiKey, githubKey };

            const res = await fetch("/api/private-analyze", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Analysis failed");
            setResult(data);

            // Store in sessionStorage for the 3D explorer
            try {
                sessionStorage.setItem("codesonar_analysis", JSON.stringify(data));
            } catch {
                try {
                    const trimmed = {
                        ...data,
                        fileAnalysis: (data.fileAnalysis || []).map((f: any) => ({
                            ...f,
                            content: f.content?.slice(0, 5000) || f.preview || "",
                        })),
                    };
                    sessionStorage.setItem("codesonar_analysis", JSON.stringify(trimmed));
                } catch {
                    console.warn("Could not store analysis in sessionStorage");
                }
            }

            // Build compact context string for the chatbot
            const ctx = `
              Summary: ${data.summary || 'No summary available'}

              Tech Stack:
              - Languages: ${(data.techStack?.languages || []).join(", ")}
              - Frameworks: ${(data.techStack?.frameworks || []).join(", ")}
              - Tools: ${(data.techStack?.tools || []).join(", ")}

              Complexity: Score ${data.complexity?.score || 0}/10
              ${data.complexity?.analysis || ''}
              Metrics: ${data.complexity?.metrics?.totalFiles || 0} files, ${data.complexity?.metrics?.totalLines || 0} lines

              Errors: ${(data.errors?.length || 0)} critical issues
              Warnings: ${(data.warnings?.length || 0)} warnings

              Packages: ${data.packages?.total || 0} total (${data.packages?.outdated?.length ?? 0} potentially outdated)

              Quality Issues:
              ${(data.qualityAnalysis || []).map((q: any) => `- ${q.category}: ${q.issue} (${q.priority})`).join("\n")}

              Files Analyzed: ${(data.fileAnalysis?.length || 0)} files with detailed breakdown
            `;
            setChatContext(ctx);
            setStep("results");
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
            setStep("analyze"); // go back to form on error
        } finally {
            setIsLoading(false);
        }
    };

    /* ── Tooltip content ── */
    const geminiTooltip = (
        <div className="space-y-2 text-white/65 leading-relaxed">
            <p className="font-bold text-sm text-violet-300 flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> Get a Gemini API Key</p>
            <ol className="list-decimal list-inside space-y-1.5 text-xs">
                <li>Visit <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline inline-flex items-center gap-1">Google AI Studio <ExternalLink className="w-2.5 h-2.5" /></a></li>
                <li>Sign in with your Google account</li>
                <li>Click <strong className="text-white">"Create API key"</strong></li>
                <li>Copy and paste the key here</li>
            </ol>
            <p className="text-xs text-white/35 border-t border-white/10 pt-2 mt-2">✅ Free tier available · Key never stored</p>
        </div>
    );

    const githubTooltip = (
        <div className="space-y-2 text-white/65 leading-relaxed">
            <p className="font-bold text-sm text-blue-300 flex items-center gap-1.5"><Github className="w-3.5 h-3.5" /> Get a GitHub Token</p>
            <ol className="list-decimal list-inside space-y-1.5 text-xs">
                <li>Go to <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline inline-flex items-center gap-1">GitHub Token Settings <ExternalLink className="w-2.5 h-2.5" /></a></li>
                <li>Name it <em className="text-white/60">&quot;CodeSonar&quot;</em></li>
                <li>Check the <code className="bg-white/10 px-1 py-0.5 rounded text-blue-300">repo</code> scope</li>
                <li>Generate and copy the token</li>
            </ol>
            <p className="text-xs text-white/35 border-t border-white/10 pt-2 mt-2">⚠️ Only needed for private repos · Optional for public</p>
        </div>
    );


    const repoTooltip = (
        <div className="space-y-2 text-white/65 leading-relaxed">
            <p className="font-bold text-sm text-emerald-300 flex items-center gap-1.5"><Search className="w-3.5 h-3.5" /> Supported Formats</p>
            <div className="text-xs space-y-2">
                <div>
                    <p className="text-blue-400 font-semibold mb-0.5">GitHub URL</p>
                    <p className="font-mono bg-white/5 px-2 py-1 rounded text-white/50">https://github.com/owner/repo</p>
                </div>
                <div>
                    <p className="text-green-400 font-semibold mb-0.5">File Upload</p>
                    <p className="text-white/45">JS, TS, PY, GO, RS, Java, C++, and more</p>
                </div>
            </div>
        </div>
    );

    const plan = PLANS.find(p => p.id === selectedPlan)!;

    return (
        <div className="min-h-screen relative overflow-x-hidden">
            {/* Content */}
            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Back */}
                <div className="pt-20 px-6 sm:px-10">
                    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
                        {step === "results" ? (
                            <button
                                onClick={() => { setStep("subscribe"); setResult(null); }}
                                className="inline-flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors group"
                            >
                                <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-45 transition-transform" />
                                New Analysis
                            </button>
                        ) : (
                            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors group">
                                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                                Back to home
                            </Link>
                        )}
                    </motion.div>
                </div>

                {/* ── STEP 1: Subscription ── */}
                <AnimatePresence mode="wait">
                    {step === "subscribe" && (
                        <motion.div
                            key="subscribe"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, x: -60 }}
                            transition={{ duration: 0.4 }}
                            className="flex-1 flex flex-col items-center justify-center py-12 px-4"
                        >
                            {/* Logo */}
                            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                                <PrivateLogo />
                            </motion.div>

                            {/* Heading */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                                className="text-center mb-12"
                            >
                                {/* Badge */}
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border border-violet-500/25 bg-violet-500/8 backdrop-blur-sm">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                                    </span>
                                    <span className="text-xs font-medium text-violet-300 tracking-wide">Private & Secure Analysis</span>
                                </div>

                                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-4">
                                    <span className="text-white">Analyze with your</span>
                                    <br />
                                    <span
                                        style={{
                                            background: "linear-gradient(135deg, #a78bfa 0%, #c084fc 40%, #e879f9 75%, #f472b6 100%)",
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent",
                                            backgroundClip: "text",
                                        }}
                                    >
                                        own API keys.
                                    </span>
                                </h1>
                                <p className="text-white/35 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
                                    Choose a plan to unlock private repository analysis. Use your own Gemini & GitHub keys — your data stays yours.
                                </p>
                            </motion.div>

                            {/* Plans */}
                            <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                                {PLANS.map((plan, i) => (
                                    <PlanCard
                                        key={plan.id}
                                        plan={plan}
                                        selected={selectedPlan === plan.id}
                                        onSelect={() => setSelectedPlan(plan.id)}
                                        index={i}
                                    />
                                ))}
                            </div>

                            {/* CTA */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.35 }}
                                className="flex flex-col items-center gap-3"
                            >
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setStep("analyze")}
                                    className="relative flex items-center gap-2.5 px-8 py-4 rounded-2xl text-white font-semibold text-sm overflow-hidden shadow-2xl shadow-violet-500/25"
                                    style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7, #c026d3)" }}
                                >
                                    {/* shimmer */}
                                    <span
                                        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
                                        style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)" }}
                                    />
                                    <span className="relative flex items-center gap-2.5">
                                        <Sparkles className="w-4 h-4" />
                                        Continue with {PLANS.find(p => p.id === selectedPlan)?.name} Plan
                                        <ChevronRight className="w-4 h-4" />
                                    </span>
                                </motion.button>

                                <p className="text-xs text-white/25">
                                    No charges yet — this is a demo. Start your 7-day trial free.
                                </p>

                                {/* Trust row */}
                                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-2">
                                    {[
                                        { icon: Shield, label: "End-to-end encrypted" },
                                        { icon: Lock, label: "Keys never stored" },
                                        { icon: Star, label: "Cancel anytime" },
                                    ].map(({ icon: Icon, label }) => (
                                        <div key={label} className="flex items-center gap-1.5 text-xs text-white/25">
                                            <Icon className="w-3 h-3" />
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* ── STEP 2: Analysis Form ── */}
                    {step === "analyze" && (
                        <motion.div
                            key="analyze"
                            initial={{ opacity: 0, x: 60 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                            className="flex-1 flex flex-col items-center justify-center py-10 px-4"
                        >
                            <div className="w-full max-w-lg">
                                {/* Plan badge */}
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center justify-between mb-6"
                                >
                                    <button
                                        onClick={() => setStep("subscribe")}
                                        className="flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors group"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                                        Change plan
                                    </button>
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border bg-white/5 ${plan.accent} ${plan.border}`}>
                                        <plan.icon className="w-3.5 h-3.5" />
                                        {plan.name} Plan
                                    </div>
                                </motion.div>

                                {/* Logo small */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center mb-8"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-900/80 to-fuchsia-900/60 border border-violet-400/30 flex items-center justify-center shadow-xl shadow-violet-500/15 mb-3">
                                        <Fingerprint className="w-7 h-7 text-violet-300" strokeWidth={1.5} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Private Analysis</h2>
                                    <p className="text-white/35 text-sm mt-1">Your keys · Your data · Your control</p>
                                </motion.div>

                                {/* Form card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    className="bg-white/[0.025] backdrop-blur-2xl border border-white/[0.07] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50"
                                    style={{ boxShadow: "0 0 0 1px rgba(139,92,246,0.08) inset, 0 32px 64px -16px rgba(0,0,0,0.6)" }}
                                >
                                    <form onSubmit={handleAnalyze} className="space-y-6">

                                        {/* ── 1. Gemini Key ── */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <label className="text-sm font-semibold text-white/80 flex items-center gap-2">
                                                    <Cpu className="w-3.5 h-3.5 text-violet-400" />
                                                    Gemini API Key
                                                </label>
                                                <InfoTooltip content={geminiTooltip} />
                                            </div>
                                            <div className="relative">
                                                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                                                <input
                                                    type={showGemini ? "text" : "password"}
                                                    value={geminiKey}
                                                    onChange={e => setGeminiKey(e.target.value)}
                                                    placeholder="AIzaSy…"
                                                    autoComplete="off"
                                                    className="w-full bg-black/30 border border-white/8 focus:border-violet-500/50 focus:ring-0 focus:outline-none rounded-xl pl-10 pr-11 py-3.5 text-sm text-white placeholder:text-white/18 transition-all"
                                                    style={{ boxShadow: geminiKey ? "0 0 0 1px rgba(139,92,246,0.2) inset" : undefined }}
                                                />
                                                <button type="button" onClick={() => setShowGemini(p => !p)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-violet-400 transition-colors">
                                                    {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <div className="mt-2 ml-1 space-y-1">
                                                {geminiKey && (
                                                    <p className="text-xs text-violet-400/60 flex items-center gap-1">
                                                        <Check className="w-3 h-3" /> Key entered
                                                    </p>
                                                )}
                                                <p className="text-xs text-amber-400/60 flex items-start gap-1.5">
                                                    <span className="mt-px flex-shrink-0">⚠️</span>
                                                    <span>
                                                        Each analysis sends a <strong className="text-amber-300/80">very large amount of code</strong> to Gemini.
                                                        One key can typically handle only <strong className="text-amber-300/80">1–2 analyses</strong> before hitting token limits — use it on your real repo, not tests.
                                                    </span>
                                                </p>

                                                {/* Tips box */}
                                                <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 px-3.5 py-3">
                                                    <p className="text-[11px] font-semibold text-amber-300/70 uppercase tracking-wider mb-2">💡 Tips to get more out of your key</p>
                                                    <ul className="space-y-1.5">
                                                        {[
                                                            "Create a separate Gemini API key for each repo you want to analyse",
                                                            "Use smaller / focused repos — fewer files = more headroom",
                                                            "Don't re-run the same repo; results are heavy and eat quota fast",
                                                        ].map((tip, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-xs text-amber-200/45">
                                                                <span className="mt-0.5 text-amber-400/60 font-bold flex-shrink-0">{i + 1}.</span>
                                                                {tip}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── 2. GitHub Token ── */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <label className="text-sm font-semibold text-white/80 flex items-center gap-2">
                                                    <Github className="w-3.5 h-3.5 text-blue-400" />
                                                    GitHub Token
                                                </label>
                                                <InfoTooltip content={githubTooltip} />
                                            </div>
                                            <div className="relative">
                                                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                                                <input
                                                    type={showGithub ? "text" : "password"}
                                                    value={githubKey}
                                                    onChange={e => setGithubKey(e.target.value)}
                                                    placeholder="ghp_…"
                                                    autoComplete="off"
                                                    className="w-full bg-black/30 border border-white/8 focus:border-blue-500/50 focus:ring-0 focus:outline-none rounded-xl pl-10 pr-11 py-3.5 text-sm text-white placeholder:text-white/18 transition-all"
                                                    style={{ boxShadow: githubKey ? "0 0 0 1px rgba(59,130,246,0.2) inset" : undefined }}
                                                />
                                                <button type="button" onClick={() => setShowGithub(p => !p)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-blue-400 transition-colors">
                                                    {showGithub ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <p className="text-xs text-white/22 mt-1.5 ml-1">Optional for public repos · Required for private</p>
                                        </div>

                                        {/* ── 3. Repo or File ── */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <label className="text-sm font-semibold text-white/80 flex items-center gap-2">
                                                    <Search className="w-3.5 h-3.5 text-emerald-400" />
                                                    Repository or File
                                                </label>
                                                <InfoTooltip content={repoTooltip} />
                                            </div>

                                            {/* Mode tabs */}
                                            <div className="flex gap-2 mb-3">
                                                {(["url", "file"] as const).map(mode => (
                                                    <button key={mode} type="button"
                                                        onClick={() => { setInputMode(mode); setStaged(null); setRepoUrl(""); }}
                                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${inputMode === mode
                                                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                                                            : "bg-white/5 text-white/35 border border-white/8 hover:text-white/55 hover:bg-white/8"
                                                            }`}
                                                    >
                                                        {mode === "url" ? <Github className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                                                        {mode === "url" ? "GitHub URL" : "Upload File"}
                                                    </button>
                                                ))}
                                            </div>

                                            <AnimatePresence mode="wait">
                                                {inputMode === "url" ? (
                                                    <motion.div key="url" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
                                                        <div className="relative">
                                                            <Github className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                                                            <input
                                                                type="url" value={repoUrl} onChange={e => setRepoUrl(e.target.value)}
                                                                placeholder="https://github.com/username/repo"
                                                                className="w-full bg-black/30 border border-white/8 focus:border-emerald-500/50 focus:ring-0 focus:outline-none rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder:text-white/18 transition-all"
                                                            />
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div key="file" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
                                                        <AnimatePresence mode="wait">
                                                            {!staged ? (
                                                                <motion.div key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative group">
                                                                    <input ref={fileInputRef} type="file" onChange={handleFileChange}
                                                                        accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.h,.css,.html,.json,.md,.go,.rs,.rb,.php,.yaml,.yml"
                                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                    />
                                                                    <div className="border-2 border-dashed border-white/8 rounded-xl p-7 text-center hover:border-emerald-500/35 transition-colors group-hover:bg-white/[0.015] cursor-pointer">
                                                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                                                            <FileCode className="w-5 h-5 text-white/25 group-hover:text-emerald-400 transition-colors" />
                                                                        </div>
                                                                        <p className="text-sm font-medium text-white/50 mb-1">Drop your file here</p>
                                                                        <p className="text-xs text-white/22">Click to select · JS, TS, PY, GO, RS and more</p>
                                                                    </div>
                                                                </motion.div>
                                                            ) : (
                                                                <motion.div key="staged" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                                    className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden"
                                                                >
                                                                    <div className="flex items-center gap-3 px-4 py-3">
                                                                        <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                                                                            <FileCode className="w-4 h-4 text-emerald-400" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-semibold text-white truncate">{staged.name}</p>
                                                                            <p className="text-xs text-white/40">{staged.language} · {(staged.size / 1024).toFixed(1)} KB · {staged.lines.toLocaleString()} lines</p>
                                                                        </div>
                                                                        <button type="button" onClick={() => { setStaged(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                                                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-colors">
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* ── Error ── */}
                                        <AnimatePresence>
                                            {error && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                                    className="flex items-start gap-2 p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-xs overflow-hidden"
                                                >
                                                    <X className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* ── Submit ── */}
                                        <motion.button
                                            type="submit"
                                            whileHover={{ scale: 1.015, boxShadow: "0 0 40px rgba(139,92,246,0.4)" }}
                                            whileTap={{ scale: 0.985 }}
                                            className="w-full py-4 rounded-xl font-bold text-sm text-white transition-all relative overflow-hidden"
                                            style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7,#c026d3)", boxShadow: "0 0 24px rgba(139,92,246,0.25)" }}
                                        >
                                            <span
                                                className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-600"
                                                style={{ background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.12) 50%, transparent 65%)" }}
                                            />
                                            <span className="relative flex items-center justify-center gap-2">
                                                <Fingerprint className="w-4 h-4" />Start Private Analysis
                                            </span>
                                        </motion.button>

                                        <p className="text-center text-xs text-white/18 leading-relaxed">
                                            🔒 Keys are transmitted securely and never stored or logged.
                                        </p>
                                    </form>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP 3: Full Results ── */}
                    {step === "results" && result && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="flex-1 px-4 sm:px-6 lg:px-8 py-6"
                        >
                            {/* Private badge above dashboard */}
                            <div className="flex items-center justify-between mb-4 max-w-7xl mx-auto">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 font-medium">
                                    <Fingerprint className="w-3.5 h-3.5" />
                                    Private Analysis Results
                                </div>
                                <button
                                    onClick={() => { setStep("subscribe"); setResult(null); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-violet-500/10 hover:border-violet-500/20 text-xs text-white/40 hover:text-violet-300 transition-all"
                                >
                                    <RotateCcw className="w-3 h-3" /> New Analysis
                                </button>
                            </div>
                            <AnalysisDashboard data={result} isLoading={false} error={null} />
                        </motion.div>
                    )}

                    {/* ── Chat: shown once results are ready ── */}
                    {step === "results" && result && (
                        <ChatInterface context={chatContext} />
                    )}

                    {/* ── STEP: Loading (same as normal analysis) ── */}
                    {step === "loading" && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex-1 px-4 sm:px-6"
                        >
                            {/* Private badge */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 font-medium w-fit mx-auto mt-6 mb-2">
                                <Fingerprint className="w-3.5 h-3.5" />
                                Private Analysis · Secure
                            </div>
                            <AnalysisDashboard data={null} isLoading={true} error={null} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
