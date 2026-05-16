"use client";

import { useState, useEffect } from "react";
import { Hero } from "@/components/home/Hero";
import { AnalysisDashboard } from "@/components/dashboard/AnalysisDashboard";
import { AnalysisResult } from "@/types/analysis";
import { QRCode } from "@/components/ui/QRCode";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatContext, setChatContext] = useState("");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("codesonar_analysis");
      if (stored) {
        const data = JSON.parse(stored);
        setAnalysisData(data);

        const contextStr = `
          Summary: ${data.summary || 'No summary available'}
          Tech Stack:
          - Languages: ${(data.techStack?.languages || []).join(", ")}
          - Frameworks: ${(data.techStack?.frameworks || []).join(", ")}
          - Tools: ${(data.techStack?.tools || []).join(", ")}
          Complexity: Score ${data.complexity?.score || 0}/10
          ${data.complexity?.analysis || ''}
          Metrics: ${data.complexity?.metrics?.totalFiles || 0} files, ${data.complexity?.metrics?.totalLines || 0} lines
          Errors: ${(data.errors || []).length} critical issues
          Warnings: ${(data.warnings || []).length} warnings
          Packages: ${data.packages?.total || 0} total (${(data.packages?.outdated || []).length} potentially outdated)
          Quality Issues:
          ${(data.qualityAnalysis || []).map((q: any) => `- ${q.category}: ${q.issue} (${q.priority})`).join("\n")}
          Files Analyzed: ${(data.fileAnalysis || []).length} files with detailed breakdown
        `;
        setChatContext(contextStr);
      }
    } catch {}
  }, []);

  const handleAnalyze = async (type: "url" | "file", value: string) => {
    setIsLoading(true);
    setError(null);
    setAnalysisData(null);
    setChatContext("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, value }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      console.log("Analysis Data Received:", data);
      setAnalysisData(data);

      // Store in sessionStorage for the 3D explorer — trim content if too large
      try {
        sessionStorage.setItem("codesonar_analysis", JSON.stringify(data));
      } catch {
        try {
          const trimmed = {
            ...data,
            fileAnalysis: data.fileAnalysis.map((f: any) => ({
              ...f,
              content: f.content?.slice(0, 5000) || f.preview || "",
            })),
          };
          sessionStorage.setItem("codesonar_analysis", JSON.stringify(trimmed));
        } catch {
          console.warn("Could not store analysis in sessionStorage");
        }
      }

      // Construct a comprehensive context string from the analysis result
      const contextStr = `
        Summary: ${data.summary || 'No summary available'}

        Tech Stack:
        - Languages: ${(data.techStack?.languages || []).join(", ")}
        - Frameworks: ${(data.techStack?.frameworks || []).join(", ")}
        - Tools: ${(data.techStack?.tools || []).join(", ")}

        Complexity: Score ${data.complexity?.score || 0}/10
        ${data.complexity?.analysis || ''}
        Metrics: ${data.complexity?.metrics?.totalFiles || 0} files, ${data.complexity?.metrics?.totalLines || 0} lines

        Errors: ${(data.errors || []).length} critical issues
        Warnings: ${(data.warnings || []).length} warnings

        Packages: ${data.packages?.total || 0} total (${(data.packages?.outdated || []).length} potentially outdated)

        Quality Issues:
        ${(data.qualityAnalysis || []).map((q: any) => `- ${q.category}: ${q.issue} (${q.priority})`).join("\n")}

        Files Analyzed: ${(data.fileAnalysis || []).length} files with detailed breakdown
      `;
      setChatContext(contextStr);

      // Scroll to dashboard
      setTimeout(() => {
        document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" });
      }, 100);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Hero onAnalyze={handleAnalyze} isLoading={isLoading} />

      <div id="dashboard">
        {(isLoading || analysisData || error) && (
          <AnalysisDashboard
            data={analysisData}
            isLoading={isLoading}
            error={error}
          />
        )}
      </div>

      {analysisData && (
        <ChatInterface context={chatContext} />
      )}

      {!analysisData && !isLoading && !error && (
        <section id="features" className="py-20 bg-secondary/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why CodeSonar?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Leveraging the power of Google Gemini to provide deep, actionable insights into your codebase.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Footer with QR Code */}
      <footer className="relative py-16 mt-auto border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-6">
            <div className="relative p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm shadow-xl shadow-indigo-500/5">
              <QRCode
                size={180}
                fgColor="#e0e7ff"
                bgColor="#0a0a1a"
              />
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-indigo-500/20 via-transparent to-purple-500/20 pointer-events-none" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-white/60">
                Scan to chat with <span className="text-indigo-400">CodeSonar AI Assistant</span>
              </p>
              <p className="text-xs text-white/30">
                Get project details, architecture insights & more via our Custom GPT
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/20 pt-4">
              <span>CodeSonar</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
