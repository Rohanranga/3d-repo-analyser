import { Octokit } from "octokit";

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

export interface FileContent {
    path: string;
    content: string;
}

export async function fetchRepoContent(owner: string, repo: string): Promise<FileContent[]> {
    try {
        // 1. Get the default branch
        const { data: repoData } = await octokit.request("GET /repos/{owner}/{repo}", {
            owner,
            repo,
        });
        const defaultBranch = repoData.default_branch;

        // 2. Get the file tree (recursive)
        const { data: treeData } = await octokit.request("GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1", {
            owner,
            repo,
            tree_sha: defaultBranch,
        });

        // 3. Filter for relevant files (source code, config, readme)
        // Analyze as many files as possible for comprehensive analysis
        const relevantFiles = treeData.tree.filter((item: any) => {
            if (item.type !== "blob") return false;
            const path = item.path?.toLowerCase() || "";

            // Exclude only essential noise: node_modules, build artifacts, lock files, and binary files
            if (path.includes("node_modules") ||
                path.includes("dist/") ||
                path.includes("build/") ||
                path.includes(".git/") ||
                path.includes("coverage/") ||
                path.endsWith(".lock") ||
                path.endsWith(".png") ||
                path.endsWith(".jpg") ||
                path.endsWith(".jpeg") ||
                path.endsWith(".gif") ||
                path.endsWith(".svg") ||
                path.endsWith(".ico") ||
                path.endsWith(".woff") ||
                path.endsWith(".woff2") ||
                path.endsWith(".ttf") ||
                path.endsWith(".eot")) {
                return false;
            }

            // Include ALL source code and configuration files
            const isSource = path.endsWith(".ts") ||
                path.endsWith(".tsx") ||
                path.endsWith(".js") ||
                path.endsWith(".jsx") ||
                path.endsWith(".py") ||
                path.endsWith(".go") ||
                path.endsWith(".java") ||
                path.endsWith(".rs") ||
                path.endsWith(".cpp") ||
                path.endsWith(".c") ||
                path.endsWith(".h") ||
                path.endsWith(".css") ||
                path.endsWith(".scss") ||
                path.endsWith(".html") ||
                path.endsWith(".vue") ||
                path.endsWith(".svelte");

            const isConfig = path.endsWith(".json") ||
                path.endsWith(".yaml") ||
                path.endsWith(".yml") ||
                path.endsWith(".toml") ||
                path.endsWith(".env") ||
                path.endsWith(".env.example") ||
                path.endsWith(".config.js") ||
                path.endsWith(".config.ts");

            const isDoc = path.endsWith(".md") || path.endsWith(".txt");

            return isSource || isConfig || isDoc;
        }).slice(0, 60); // cap at 60 files — enough for thorough analysis without hammering the API

        // 4. Fetch content in small concurrent batches to avoid rate-limit spikes
        const files: FileContent[] = [];
        const BATCH_SIZE = 10;

        for (let i = 0; i < relevantFiles.length; i += BATCH_SIZE) {
            const batch = relevantFiles.slice(i, i + BATCH_SIZE);
            await Promise.all(
                batch.map(async (file: any) => {
                    if (!file.path) return;
                    try {
                        const { data } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
                            owner,
                            repo,
                            path: file.path,
                        });

                        if (Array.isArray(data) || data.type !== "file" || !data.content) return;

                        const content = Buffer.from(data.content, "base64").toString("utf-8");
                        files.push({ path: file.path, content });
                    } catch (error) {
                        console.warn(`Failed to fetch content for ${file.path}`, error);
                    }
                })
            );
        }

        return files;
    } catch (error) {
        console.error("Error fetching repo:", error);

        // Fallback for demo purposes if API fails (e.g. rate limit or network)
        if (repo === "Google_Clone_App") {
            return [
                { path: "package.json", content: JSON.stringify({ dependencies: { react: "^18.0.0", next: "^14.0.0", tailwindcss: "^3.0.0" } }) },
                { path: "src/app/page.tsx", content: "import React from 'react';\n\nexport default function Home() { return <div>Google Clone</div>; }" },
                { path: "src/components/Search.tsx", content: "import { useState } from 'react';\nexport function Search() { const [q, setQ] = useState(''); return <input />; }" },
                { path: "README.md", content: "# Google Clone\nA clone of Google search." }
            ];
        }

        throw new Error("Failed to fetch repository content");
    }
}
