import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { SpotlightEffect } from "@/components/ui/SpotlightEffect";
import { FlowFieldBackground } from "@/components/ui/FlowFieldWrapper";
import { ClickBurst } from "@/components/ui/ClickBurst";
import { NeonCursor } from "@/components/ui/NeonCursor";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CodeSonar - AI Code Analysis",
  description: "Deep AI-powered analysis of code repositories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className} suppressHydrationWarning>
        {/* Fixed full-screen flow field background */}
        <FlowFieldBackground />

        {/* Global ambient glow orbs — same on every page */}
        <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
          <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-violet-600/7 rounded-full blur-[140px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[450px] h-[450px] bg-fuchsia-600/7 rounded-full blur-[120px]" />
          <div className="absolute top-3/4 left-1/4 w-[350px] h-[350px] bg-indigo-600/5 rounded-full blur-[110px]" />
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <Header />
        <SpotlightEffect />
        <ClickBurst />
        <NeonCursor />
        <main className="relative z-10 min-h-screen text-foreground selection:bg-primary/20 selection:text-primary">
          {children}
        </main>
      </body>
    </html>
  );
}


