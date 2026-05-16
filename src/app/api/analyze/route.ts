import { NextRequest, NextResponse } from "next/server";
import { fetchRepoContent } from "@/lib/github";
import { analyzeCodebase } from "@/lib/ai";

export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { type, value } = await req.json();

        if (!type || !value) {
            return NextResponse.json({ error: "Missing type or value" }, { status: 400 });
        }

        let files: { path: string; content: string }[] = [];

        if (type === "url") {
            // Parse GitHub URL
            // Format: https://github.com/owner/repo
            const match = value.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            if (!match) {
                return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 });
            }
            const [, owner, repo] = match;

            try {
                files = await fetchRepoContent(owner, repo);
            } catch (error) {
                console.error("GitHub fetch error:", error);
                return NextResponse.json({ error: "Failed to fetch repository" }, { status: 500 });
            }
        } else if (type === "file") {
            try {
                // Check if value is a JSON string containing name and content
                let fileData;
                try {
                    fileData = JSON.parse(value);
                } catch {
                    fileData = { name: "uploaded_file.code", content: value };
                }

                if (fileData.name && fileData.content) {
                    files = [{
                        path: fileData.name,
                        content: fileData.content
                    }];
                } else {
                    // Fallback for raw text
                    files = [{
                        path: "uploaded_code.txt",
                        content: value
                    }];
                }
            } catch (error) {
                console.error("File processing error:", error);
                return NextResponse.json({ error: "Failed to process file" }, { status: 400 });
            }
        }

        if (files.length === 0) {
            return NextResponse.json({ error: "No files found to analyze" }, { status: 404 });
        }

        // Trigger Genkit Analysis
        console.log("Starting analysis for files:", files.length);
        const analysis = await analyzeCodebase(files);
        console.log("Analysis complete");

        return NextResponse.json(analysis);

    } catch (error) {
        console.error("Analysis error details:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
