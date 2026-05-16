import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const { type, value, geminiKey, githubKey } = await req.json();

        if (!geminiKey?.trim()) {
            return NextResponse.json({ error: "Gemini API key is required." }, { status: 400 });
        }
        if (!type || !value) {
            return NextResponse.json({ error: "Missing type or value." }, { status: 400 });
        }

        let files: { path: string; content: string }[] = [];

        // ── Fetch from GitHub ──────────────────────────────────
        if (type === "url") {
            const match = value.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            if (!match) {
                return NextResponse.json({ error: "Invalid GitHub URL." }, { status: 400 });
            }
            const [, owner, repo] = match;

            // Dynamically import Octokit to use user-supplied token
            const { Octokit } = await import("octokit");
            const octokit = new Octokit({ auth: githubKey?.trim() || undefined });

            try {
                const { data: repoData } = await octokit.request("GET /repos/{owner}/{repo}", { owner, repo });
                const defaultBranch = repoData.default_branch;

                const { data: treeData } = await octokit.request(
                    "GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1",
                    { owner, repo, tree_sha: defaultBranch }
                );

                const relevantFiles = treeData.tree
                    .filter((item: any) => {
                        if (item.type !== "blob") return false;
                        const p = item.path?.toLowerCase() || "";
                        if (
                            p.includes("node_modules") ||
                            p.includes("dist/") ||
                            p.includes("build/") ||
                            p.includes(".git/") ||
                            p.endsWith(".lock") ||
                            p.endsWith(".png") ||
                            p.endsWith(".jpg") ||
                            p.endsWith(".jpeg") ||
                            p.endsWith(".gif") ||
                            p.endsWith(".svg") ||
                            p.endsWith(".ico")
                        )
                            return false;
                        return (
                            p.endsWith(".ts") || p.endsWith(".tsx") || p.endsWith(".js") ||
                            p.endsWith(".jsx") || p.endsWith(".py") || p.endsWith(".go") ||
                            p.endsWith(".java") || p.endsWith(".rs") || p.endsWith(".cpp") ||
                            p.endsWith(".c") || p.endsWith(".css") || p.endsWith(".html") ||
                            p.endsWith(".json") || p.endsWith(".yaml") || p.endsWith(".yml") ||
                            p.endsWith(".md")
                        );
                    })
                    .slice(0, 60);

                const BATCH = 10;
                for (let i = 0; i < relevantFiles.length; i += BATCH) {
                    const batch = relevantFiles.slice(i, i + BATCH);
                    await Promise.all(
                        batch.map(async (file: any) => {
                            if (!file.path) return;
                            try {
                                const { data } = await octokit.request(
                                    "GET /repos/{owner}/{repo}/contents/{path}",
                                    { owner, repo, path: file.path }
                                );
                                if (Array.isArray(data) || data.type !== "file" || !data.content) return;
                                const content = Buffer.from(data.content, "base64").toString("utf-8");
                                files.push({ path: file.path, content });
                            } catch { /* skip unreadable files */ }
                        })
                    );
                }
            } catch (error: any) {
                return NextResponse.json(
                    { error: error?.message || "Failed to fetch repository. Check your GitHub token and URL." },
                    { status: 500 }
                );
            }
        }

        // ── Uploaded file ──────────────────────────────────────
        else if (type === "file") {
            try {
                let fileData: any;
                try {
                    fileData = JSON.parse(value);
                } catch {
                    fileData = { name: "uploaded_file.code", content: value };
                }
                files = [{ path: fileData.name || "file.code", content: fileData.content || value }];
            } catch {
                return NextResponse.json({ error: "Failed to process uploaded file." }, { status: 400 });
            }
        }

        if (files.length === 0) {
            return NextResponse.json({ error: "No files found to analyze." }, { status: 404 });
        }

        // ── AI Analysis with user's Gemini key ────────────────
        try {
            const { analyzeCodebase } = await import("@/lib/ai");
            const analysis = await analyzeCodebase(files, geminiKey.trim());
            return NextResponse.json(analysis);
        } catch (analysisError) {
            console.error("Analysis failed:", analysisError);
            return NextResponse.json(
                { error: "Analysis failed", details: analysisError instanceof Error ? analysisError.message : String(analysisError) },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error("Private analysis error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
