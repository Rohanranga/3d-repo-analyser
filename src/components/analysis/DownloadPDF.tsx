"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, FileDown } from "lucide-react";
import { AnalysisResult } from "@/types/analysis";

interface DownloadPDFProps {
    data: AnalysisResult;
}

export function DownloadPDF({ data }: DownloadPDFProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            const { jsPDF } = await import("jspdf");
            const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 16;
            const contentWidth = pageWidth - margin * 2;
            let y = margin;

            const colors = {
                primary: [99, 102, 241] as [number, number, number],
                purple: [168, 85, 247] as [number, number, number],
                green: [34, 197, 94] as [number, number, number],
                red: [239, 68, 68] as [number, number, number],
                yellow: [234, 179, 8] as [number, number, number],
                orange: [249, 115, 22] as [number, number, number],
                dark: [17, 17, 17] as [number, number, number],
                darkCard: [30, 30, 30] as [number, number, number],
                text: [229, 229, 229] as [number, number, number],
                muted: [156, 163, 175] as [number, number, number],
                white: [255, 255, 255] as [number, number, number],
            };

            const addPageBackground = () => {
                doc.setFillColor(...colors.dark);
                doc.rect(0, 0, pageWidth, pageHeight, "F");
            };

            const checkPage = (needed: number) => {
                if (y + needed > pageHeight - margin) {
                    doc.addPage();
                    addPageBackground();
                    y = margin;
                }
            };

            const drawSectionHeader = (title: string, color: [number, number, number]) => {
                checkPage(16);
                doc.setFillColor(...color);
                doc.roundedRect(margin, y, contentWidth, 10, 2, 2, "F");
                doc.setFont("helvetica", "bold");
                doc.setFontSize(13);
                doc.setTextColor(...colors.white);
                doc.text(title, margin + 4, y + 7);
                y += 14;
            };

            const drawText = (
                text: string,
                fontSize: number = 9,
                color: [number, number, number] = colors.text,
                style: string = "normal"
            ) => {
                doc.setFont("helvetica", style);
                doc.setFontSize(fontSize);
                doc.setTextColor(...color);
                const lines = doc.splitTextToSize(text, contentWidth - 8);
                const lineHeight = fontSize * 0.45;
                checkPage(lines.length * lineHeight + 2);
                doc.text(lines, margin + 4, y);
                y += lines.length * lineHeight + 2;
            };

            // ── Cover / Title ──
            addPageBackground();

            // Title bar
            doc.setFillColor(...colors.primary);
            doc.roundedRect(margin, y, contentWidth, 28, 3, 3, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.setTextColor(...colors.white);
            doc.text("CodeSonar Analysis Report", margin + 6, y + 12);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`, margin + 6, y + 22);
            y += 36;

            // ── Project Summary ──
            drawSectionHeader("Project Summary", colors.primary);
            doc.setFillColor(...colors.darkCard);
            const summaryLines = doc.splitTextToSize(data.summary, contentWidth - 12);
            const summaryHeight = summaryLines.length * 4.5 + 8;
            checkPage(summaryHeight);
            doc.roundedRect(margin, y, contentWidth, summaryHeight, 2, 2, "F");
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(...colors.text);
            doc.text(summaryLines, margin + 6, y + 6);
            y += summaryHeight + 6;

            // ── Tech Stack ──
            drawSectionHeader("Tech Stack", colors.purple);

            const stackSections = [
                { label: "Languages", items: data.techStack.languages, color: colors.primary },
                { label: "Frameworks", items: data.techStack.frameworks, color: colors.purple },
                { label: "Tools", items: data.techStack.tools, color: colors.green },
            ];

            for (const section of stackSections) {
                if (section.items.length === 0) continue;
                checkPage(12);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                doc.setTextColor(...section.color);
                doc.text(section.label + ":", margin + 4, y);
                y += 5;

                let xPos = margin + 4;
                for (const item of section.items) {
                    const textW = doc.getTextWidth(item) + 6;
                    if (xPos + textW > pageWidth - margin) {
                        xPos = margin + 4;
                        y += 7;
                        checkPage(8);
                    }
                    doc.setFillColor(section.color[0], section.color[1], section.color[2]);
                    doc.setGState(doc.GState({ opacity: 0.15 }));
                    doc.roundedRect(xPos, y - 4, textW, 6, 1.5, 1.5, "F");
                    doc.setGState(doc.GState({ opacity: 1 }));
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(8);
                    doc.setTextColor(...section.color);
                    doc.text(item, xPos + 3, y);
                    xPos += textW + 3;
                }
                y += 8;
            }

            // ── Architecture Diagram ──
            const diagramEl = document.querySelector('svg[id^="mermaid-"]')?.closest('.glass-card') as HTMLElement | null;
            if (diagramEl) {
                try {
                    const { toPng } = await import("html-to-image");
                    const diagramDataUrl = await toPng(diagramEl, {
                        backgroundColor: "#111111",
                        pixelRatio: 2,
                    });

                    drawSectionHeader("Visual Architecture", colors.green);

                    // Calculate image dimensions to fit within PDF
                    const img = new Image();
                    await new Promise<void>((resolve, reject) => {
                        img.onload = () => resolve();
                        img.onerror = reject;
                        img.src = diagramDataUrl;
                    });

                    const imgAspect = img.width / img.height;
                    const imgWidth = Math.min(contentWidth, 170);
                    const imgHeight = imgWidth / imgAspect;
                    const maxImgHeight = 120; // cap max height
                    const finalHeight = Math.min(imgHeight, maxImgHeight);
                    const finalWidth = finalHeight === maxImgHeight ? maxImgHeight * imgAspect : imgWidth;

                    checkPage(finalHeight + 6);
                    doc.setFillColor(...colors.darkCard);
                    doc.roundedRect(margin, y, contentWidth, finalHeight + 8, 2, 2, "F");
                    const imgX = margin + (contentWidth - finalWidth) / 2;
                    doc.addImage(diagramDataUrl, "PNG", imgX, y + 4, finalWidth, finalHeight);
                    y += finalHeight + 14;
                } catch (err) {
                    console.warn("Could not capture architecture diagram:", err);
                    // Fallback: just note it in the PDF
                    drawSectionHeader("Visual Architecture", colors.green);
                    drawText("Architecture diagram available in the web report.", 8, colors.muted, "italic");
                    y += 4;
                }
            }

            // ── Complexity Analysis ──
            drawSectionHeader("Complexity Analysis", colors.orange);
            checkPage(30);
            doc.setFillColor(...colors.darkCard);
            doc.roundedRect(margin, y, contentWidth, 26, 2, 2, "F");

            // Score badge
            const scoreColor: [number, number, number] = data.complexity.score > 7 ? colors.red : data.complexity.score > 4 ? colors.yellow : colors.green;
            doc.setFillColor(...scoreColor);
            doc.setGState(doc.GState({ opacity: 0.2 }));
            doc.roundedRect(margin + 4, y + 3, 30, 8, 2, 2, "F");
            doc.setGState(doc.GState({ opacity: 1 }));
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(...scoreColor);
            doc.text(`Score: ${data.complexity.score}/10`, margin + 7, y + 9);

            // Score bar
            const barX = margin + 40;
            const barW = contentWidth - 48;
            doc.setFillColor(50, 50, 50);
            doc.roundedRect(barX, y + 5, barW, 4, 1, 1, "F");
            doc.setFillColor(...scoreColor);
            doc.roundedRect(barX, y + 5, barW * (data.complexity.score / 10), 4, 1, 1, "F");

            // Metrics row
            const metrics = [
                { label: "Total Files", value: data.complexity.metrics.totalFiles },
                { label: "Total Lines", value: data.complexity.metrics.totalLines },
                { label: "Avg Lines/File", value: data.complexity.metrics.avgLinesPerFile },
            ];
            const metricW = (contentWidth - 16) / 3;
            metrics.forEach((m, i) => {
                const mx = margin + 4 + i * (metricW + 4);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(7);
                doc.setTextColor(...colors.muted);
                doc.text(m.label, mx, y + 18);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.setTextColor(...colors.white);
                doc.text(String(m.value.toLocaleString()), mx, y + 23);
            });
            y += 30;

            // Complexity analysis text
            if (data.complexity.analysis) {
                drawText(data.complexity.analysis, 8, colors.muted);
                y += 4;
            }

            // ── Errors & Warnings ──
            if (data.errors.length > 0 || data.warnings.length > 0) {
                drawSectionHeader(`Errors & Warnings (${data.errors.length + data.warnings.length})`, colors.red);

                for (const error of data.errors) {
                    checkPage(20);
                    doc.setFillColor(239, 68, 68);
                    doc.setGState(doc.GState({ opacity: 0.08 }));
                    const errLines = doc.splitTextToSize(error.message, contentWidth - 20);
                    const errH = errLines.length * 4 + (error.suggestion ? 12 : 8);
                    doc.roundedRect(margin, y, contentWidth, errH, 2, 2, "F");
                    doc.setGState(doc.GState({ opacity: 1 }));

                    // Severity badge
                    doc.setFillColor(...colors.red);
                    doc.setGState(doc.GState({ opacity: 0.2 }));
                    doc.roundedRect(pageWidth - margin - 20, y + 2, 18, 5, 1, 1, "F");
                    doc.setGState(doc.GState({ opacity: 1 }));
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(6);
                    doc.setTextColor(...colors.red);
                    doc.text(error.severity.toUpperCase(), pageWidth - margin - 18, y + 5.5);

                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(8);
                    doc.setTextColor(...colors.red);
                    doc.text(errLines, margin + 4, y + 6);
                    y += errLines.length * 4 + 2;

                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(7);
                    doc.setTextColor(...colors.muted);
                    doc.text(`${error.file}${error.line > 0 ? ` (Line ${error.line})` : ""}`, margin + 4, y);
                    y += 4;

                    if (error.suggestion) {
                        doc.setFont("helvetica", "italic");
                        doc.setFontSize(7);
                        doc.setTextColor(...colors.yellow);
                        const sugLines = doc.splitTextToSize(`Suggestion: ${error.suggestion}`, contentWidth - 12);
                        checkPage(sugLines.length * 3.5);
                        doc.text(sugLines, margin + 4, y);
                        y += sugLines.length * 3.5 + 2;
                    }
                    y += 3;
                }

                for (const warning of data.warnings) {
                    checkPage(20);
                    doc.setFillColor(234, 179, 8);
                    doc.setGState(doc.GState({ opacity: 0.08 }));
                    const warnLines = doc.splitTextToSize(warning.message, contentWidth - 20);
                    const warnH = warnLines.length * 4 + (warning.suggestion ? 12 : 8);
                    doc.roundedRect(margin, y, contentWidth, warnH, 2, 2, "F");
                    doc.setGState(doc.GState({ opacity: 1 }));

                    doc.setFillColor(...colors.yellow);
                    doc.setGState(doc.GState({ opacity: 0.2 }));
                    doc.roundedRect(pageWidth - margin - 20, y + 2, 18, 5, 1, 1, "F");
                    doc.setGState(doc.GState({ opacity: 1 }));
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(6);
                    doc.setTextColor(...colors.yellow);
                    doc.text(warning.severity.toUpperCase(), pageWidth - margin - 18, y + 5.5);

                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(8);
                    doc.setTextColor(...colors.yellow);
                    doc.text(warnLines, margin + 4, y + 6);
                    y += warnLines.length * 4 + 2;

                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(7);
                    doc.setTextColor(...colors.muted);
                    doc.text(`${warning.file}${warning.line > 0 ? ` (Line ${warning.line})` : ""}`, margin + 4, y);
                    y += 4;

                    if (warning.suggestion) {
                        doc.setFont("helvetica", "italic");
                        doc.setFontSize(7);
                        doc.setTextColor(...colors.yellow);
                        const sugLines = doc.splitTextToSize(`Suggestion: ${warning.suggestion}`, contentWidth - 12);
                        checkPage(sugLines.length * 3.5);
                        doc.text(sugLines, margin + 4, y);
                        y += sugLines.length * 3.5 + 2;
                    }
                    y += 3;
                }
            }

            // ── Quality Recommendations ──
            if (data.qualityAnalysis.length > 0) {
                drawSectionHeader(`Quality Recommendations (${data.qualityAnalysis.length})`, colors.green);
                for (const item of data.qualityAnalysis) {
                    checkPage(22);
                    const prioColor: [number, number, number] =
                        item.priority === "critical" ? colors.red :
                        item.priority === "high" ? colors.orange :
                        item.priority === "medium" ? colors.yellow : colors.green;

                    doc.setFillColor(...colors.darkCard);
                    const issueLines = doc.splitTextToSize(`Issue: ${item.issue}`, contentWidth - 12);
                    const recLines = doc.splitTextToSize(`Fix: ${item.recommendation}`, contentWidth - 12);
                    const cardH = (issueLines.length + recLines.length) * 3.5 + 14;
                    doc.roundedRect(margin, y, contentWidth, cardH, 2, 2, "F");

                    // Left border accent
                    doc.setFillColor(...prioColor);
                    doc.rect(margin, y, 2, cardH, "F");

                    // Category + priority
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(9);
                    doc.setTextColor(...colors.white);
                    doc.text(item.category, margin + 6, y + 6);

                    doc.setFillColor(...prioColor);
                    doc.setGState(doc.GState({ opacity: 0.2 }));
                    const prioText = item.priority.toUpperCase();
                    const prioW = doc.getTextWidth(prioText) + 6;
                    doc.roundedRect(pageWidth - margin - prioW - 4, y + 2, prioW, 5.5, 1, 1, "F");
                    doc.setGState(doc.GState({ opacity: 1 }));
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(7);
                    doc.setTextColor(...prioColor);
                    doc.text(prioText, pageWidth - margin - prioW - 1, y + 6);

                    y += 10;
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(7.5);
                    doc.setTextColor(...colors.muted);
                    doc.text(issueLines, margin + 6, y);
                    y += issueLines.length * 3.5 + 1;

                    doc.setTextColor(...colors.text);
                    doc.text(recLines, margin + 6, y);
                    y += recLines.length * 3.5 + 5;
                }
            }

            // ── Potential Changes / Improvements ──
            if (data.improvements && data.improvements.length > 0) {
                drawSectionHeader(`Potential Improvements (${data.improvements.length})`, colors.purple);
                for (const imp of data.improvements) {
                    checkPage(24);
                    const prioColor: [number, number, number] =
                        imp.priority === "high" ? colors.red :
                        imp.priority === "medium" ? colors.yellow : colors.primary;

                    doc.setFillColor(...colors.darkCard);
                    const descLines = doc.splitTextToSize(imp.description, contentWidth - 14);
                    const impactLines = doc.splitTextToSize(`Impact: ${imp.impact}`, contentWidth - 14);
                    const cardH = (descLines.length + impactLines.length) * 3.5 + 16;
                    doc.roundedRect(margin, y, contentWidth, cardH, 2, 2, "F");

                    doc.setFillColor(...prioColor);
                    doc.rect(margin, y, 2, cardH, "F");

                    // Title
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(9);
                    doc.setTextColor(...colors.white);
                    doc.text(imp.title, margin + 6, y + 6);

                    // Priority + effort badges
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(6);
                    doc.setTextColor(...prioColor);
                    doc.text(`${imp.priority.toUpperCase()} | Effort: ${imp.effort}`, pageWidth - margin - 40, y + 6);

                    y += 10;
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(7.5);
                    doc.setTextColor(...colors.muted);
                    doc.text(descLines, margin + 6, y);
                    y += descLines.length * 3.5 + 1;

                    // File reference
                    doc.setFontSize(7);
                    doc.setTextColor(100, 100, 100);
                    doc.text(`File: ${imp.file}${imp.line ? ` (Line ${imp.line})` : ""}`, margin + 6, y);
                    y += 4;

                    // Impact
                    doc.setTextColor(...colors.green);
                    doc.text(impactLines, margin + 6, y);
                    y += impactLines.length * 3.5 + 5;
                }
            }

            // ── Packages / Tech Stack Table ──
            if (data.packages.all && data.packages.all.length > 0) {
                drawSectionHeader(`Packages & Dependencies (${data.packages.total})`, colors.primary);

                // Table header
                checkPage(10);
                doc.setFillColor(40, 40, 40);
                doc.roundedRect(margin, y, contentWidth, 7, 1, 1, "F");
                doc.setFont("helvetica", "bold");
                doc.setFontSize(7);
                doc.setTextColor(...colors.muted);
                doc.text("Package", margin + 4, y + 5);
                doc.text("Current", margin + contentWidth * 0.5, y + 5);
                doc.text("Latest", margin + contentWidth * 0.75, y + 5);
                y += 9;

                for (const pkg of data.packages.all) {
                    checkPage(7);
                    doc.setFillColor(...colors.darkCard);
                    doc.rect(margin, y, contentWidth, 6, "F");
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(7);
                    doc.setTextColor(...colors.primary);
                    doc.text(pkg.name, margin + 4, y + 4);
                    doc.setTextColor(...colors.muted);
                    doc.text(pkg.current, margin + contentWidth * 0.5, y + 4);
                    doc.setTextColor(...colors.text);
                    doc.text(pkg.latest !== "-" ? pkg.latest : "", margin + contentWidth * 0.75, y + 4);
                    y += 6.5;
                }
                y += 4;
            }

            // ── File Analysis Summary ──
            if (data.fileAnalysis.length > 0) {
                drawSectionHeader(`Files Analyzed (${data.fileAnalysis.length})`, colors.primary);

                for (const file of data.fileAnalysis) {
                    checkPage(16);
                    doc.setFillColor(...colors.darkCard);
                    const purposeLines = doc.splitTextToSize(file.purpose || "", contentWidth - 14);
                    const fCardH = purposeLines.length * 3.5 + 12;
                    doc.roundedRect(margin, y, contentWidth, fCardH, 2, 2, "F");

                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(8);
                    doc.setTextColor(...colors.primary);
                    doc.text(file.path, margin + 4, y + 5);

                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(7);
                    doc.setTextColor(...colors.muted);
                    doc.text(`${file.language} | ${file.lines} lines | ${(file.size / 1024).toFixed(1)} KB`, margin + 4, y + 10);

                    if (file.purpose) {
                        y += 12;
                        doc.setFontSize(7);
                        doc.setTextColor(...colors.text);
                        doc.text(purposeLines, margin + 6, y);
                        y += purposeLines.length * 3.5 + 4;
                    } else {
                        y += fCardH + 3;
                    }
                }
            }

            // ── Footer on every page ──
            const totalPages = doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(7);
                doc.setTextColor(80, 80, 80);
                doc.text(`CodeSonar Report  |  Page ${i} of ${totalPages}`, margin, pageHeight - 8);
                doc.text("Generated by CodeSonar AI Analysis", pageWidth - margin - 50, pageHeight - 8);
            }

            doc.save("CodeSonar-Analysis-Report.pdf");
        } catch (err) {
            console.error("PDF generation failed:", err);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
        >
            <motion.button
                onClick={generatePDF}
                disabled={isGenerating}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full group relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 hover:from-indigo-500/20 hover:via-purple-500/20 hover:to-pink-500/20 hover:border-indigo-500/50 transition-all duration-300 p-5 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {/* Shimmer effect */}
                <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                        background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.08), transparent)",
                    }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />

                {isGenerating ? (
                    <>
                        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                        <span className="text-sm font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Generating PDF Report...
                        </span>
                    </>
                ) : (
                    <>
                        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 group-hover:from-indigo-500/30 group-hover:to-purple-500/30 transition-colors">
                            <FileDown className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="text-left">
                            <span className="text-sm font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent block">
                                Download Analysis as PDF
                            </span>
                            <span className="text-xs text-white/30">
                                Full report with all findings, recommendations \u0026 code analysis
                            </span>
                        </div>
                        <Download className="w-4 h-4 text-indigo-400/50 ml-auto group-hover:text-indigo-400 transition-colors" />
                    </>
                )}
            </motion.button>
        </motion.div>
    );
}
