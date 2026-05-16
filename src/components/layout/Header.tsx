"use client";

import Link from "next/link";
import { Code2, Github, Zap, Fingerprint, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

export function Header() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    if (pathname === "/explore") return null;

    const navLinks = [
        { href: "#features", label: "Features" },
        { href: "#dashboard", label: "Dashboard" },
    ];

    return (
        <header className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-xl border-b border-white/5">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setOpen(false)}>
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all border border-white/10">
                        <Code2 className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        CodeSonar
                    </span>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-3">
                    {navLinks.map(l => (
                        <Link key={l.href} href={l.href} className="text-sm text-white/40 hover:text-white/80 transition-colors px-3">
                            {l.label}
                        </Link>
                    ))}

                    <Link
                        href="https://github.com/Rohanranga/CODESONAR"
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-sm text-white/60 hover:text-white"
                    >
                        <Github className="w-4 h-4" />
                        <span>Star on GitHub</span>
                    </Link>

                    <Link
                        href="/"
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 border border-blue-500/25 hover:border-blue-400/50 transition-all text-sm text-blue-300 hover:text-blue-200 font-medium"
                    >
                        <Search className="w-4 h-4" />
                        <span>Analyse Now</span>
                    </Link>

                    <Link
                        href="/private"
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 hover:from-violet-600/30 hover:to-fuchsia-600/30 border border-violet-500/30 hover:border-violet-400/50 transition-all text-sm text-violet-300 hover:text-violet-200 font-medium"
                    >
                        <Fingerprint className="w-4 h-4" />
                        <span>Private Analysis</span>
                    </Link>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-xs text-green-400 font-medium">
                        <Zap className="w-3 h-3" />
                        Live
                    </div>
                </nav>

                {/* Mobile hamburger */}
                <button
                    className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors"
                    onClick={() => setOpen(o => !o)}
                    aria-label="Toggle menu"
                >
                    {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile dropdown */}
            {open && (
                <div className="md:hidden absolute top-16 left-0 right-0 bg-black/95 backdrop-blur-2xl border-b border-white/10 px-4 py-4 flex flex-col gap-2 z-50">
                    {navLinks.map(l => (
                        <Link
                            key={l.href}
                            href={l.href}
                            className="px-4 py-3 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all"
                            onClick={() => setOpen(false)}
                        >
                            {l.label}
                        </Link>
                    ))}

                    <Link
                        href="https://github.com/Rohanranga/CODESONAR"
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white transition-all"
                        onClick={() => setOpen(false)}
                    >
                        <Github className="w-4 h-4" /> Star on GitHub
                    </Link>

                    <Link
                        href="/"
                        className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300 font-medium transition-all"
                        onClick={() => setOpen(false)}
                    >
                        <Search className="w-4 h-4" /> Analyse Now
                    </Link>

                    <Link
                        href="/private"
                        className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-sm text-violet-300 font-medium transition-all"
                        onClick={() => setOpen(false)}
                    >
                        <Fingerprint className="w-4 h-4" /> Private Analysis
                    </Link>

                    <div className="flex items-center gap-2 px-4 py-2 text-xs text-green-400">
                        <Zap className="w-3 h-3" /> Live
                    </div>
                </div>
            )}
        </header>
    );
}
