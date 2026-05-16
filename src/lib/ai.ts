import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { generateLineByLineExplanation } from "./line-by-line-explainer";
import { analyzePackageVersionsAsync, compareVersions } from "./version-analyzer";
import { analyzeCodeForErrors } from "./error-analyzer";
import { analyzeForImprovements } from "./improvement-analyzer";
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

function getModel(apiKey?: string, preferredModel?: string): GenerativeModel {
    const key = apiKey || process.env.GOOGLE_GENAI_API_KEY || "";
    const modelName = preferredModel || process.env.GOOGLE_MODEL_NAME || "gemini-2.0-flash";
    const genAI = new GoogleGenerativeAI(key);
    return genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
            temperature: 0.3,
            topP: 0.9,
            maxOutputTokens: 20480, // Increased for longer summaries
        }
    });
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function withRetry<T>(fn: () => Promise<T>, retries = 3, baseMs = 8000): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (e: any) {
            const is429 = e?.message?.includes('429') || e?.status === 429;
            if (is429 && i < retries - 1) {
                const wait = baseMs * (i + 1);
                console.log(`Rate limited. Retrying in ${wait / 1000}s...`);
                await delay(wait);
            } else {
                throw e;
            }
        }
    }
    throw new Error('Max retries exceeded');
}

function buildContext(files: { path: string; content: string }[]): string {
    const sourceExts = new Set(['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'java', 'rs', 'cpp', 'c', 'vue', 'svelte']);
    const sorted = [...files].sort((a, b) => {
        const aExt = a.path.split('.').pop()?.toLowerCase() || '';
        const bExt = b.path.split('.').pop()?.toLowerCase() || '';
        const aIsSource = sourceExts.has(aExt) ? 0 : 1;
        const bIsSource = sourceExts.has(bExt) ? 0 : 1;
        return aIsSource - bIsSource;
    });

    const isSmallProject = files.length <= 25;
    const maxPerFile = isSmallProject ? 8000 : 4000;

    return sorted
        .map(f => `=== FILE: ${f.path} (${f.content.split('\n').length} lines) ===\n${f.content.slice(0, maxPerFile)}`)
        .join("\n\n");
}

const prompts = {
    identifyTechStack: (context: string) => `
You are an expert software architect. Analyze this ENTIRE repository thoroughly.

Identify EVERY technology used by examining:
- File extensions and naming conventions
- All import/require/include statements
- package.json, requirements.txt, go.mod, Cargo.toml, pom.xml etc.
- Build configs, CI/CD files, docker files
- CSS frameworks (Tailwind, Bootstrap, etc.)
- State management libraries
- Testing frameworks
- Database/ORM libraries
- API frameworks

Repository Content:
${context.slice(0, 40000)}

Return ONLY a valid JSON object with NO markdown fences:
{ "languages": ["string"], "frameworks": ["string"], "tools": ["string"], "packageManager": "string" }
`,

    assessComplexity: (context: string) => `
You are a senior software engineer performing a thorough complexity assessment.

Analyze the ACTUAL code for:
1. Cyclomatic complexity of functions (count conditionals, loops, ternaries)
2. Coupling between modules (how many files import from each other)
3. Code duplication (repeated patterns across files)
4. State management complexity
5. Error handling coverage
6. Nesting depth
7. Function/method sizes

Count the ACTUAL total lines across ALL files shown.

Repository Content:
${context.slice(0, 40000)}

Return ONLY a valid JSON object with NO markdown fences:
{ "score": number (1-10), "level": "Low"|"Medium"|"High", "justification": "detailed 3-4 sentence analysis referencing specific files and patterns", "metrics": { "totalFiles": number, "totalLines": number } }
`,

    analyzeFilesDeep: (context: string) => `
You are a principal engineer doing a thorough code review. Analyze EVERY file in detail.

For EACH file you must provide:
1. "explanation" — A detailed 3-5 sentence description: what the file does, how it works, what role it plays in the project, what patterns/libraries it uses, and any notable implementation details. Be SPECIFIC — reference actual function names, component names, API endpoints, state variables, etc.
2. "keyFeatures" — 3-6 specific features/behaviors implemented in that file (e.g. "Handles user authentication via JWT", "Renders product card grid with pagination", "Validates form inputs with Zod schema")
3. "purpose" — One of: "API Route", "Component", "Page", "Utility", "Hook", "Configuration", "Style", "Test", "Documentation", "Service", "Model", "Middleware"
4. "issues" — Array of specific problems found (empty if none): security vulnerabilities, bugs, logic errors, missing validation, performance problems, deprecated usage, hardcoded values

Repository Content:
${context.slice(0, 50000)}

Return ONLY a valid JSON object with NO markdown fences:
{
  "files": [{
    "path": "string",
    "explanation": "string (min 200 chars, be very specific about what the code does)",
    "keyFeatures": ["string (be specific, not generic)"],
    "purpose": "string",
    "issues": [{ "type": "bug"|"security"|"performance"|"style"|"logic", "message": "string", "line": number|null, "severity": "critical"|"error"|"warning"|"info", "suggestion": "string", "fixCode": "string|null" }]
  }]
}
`,

    detectBugs: (context: string) => `
You are a senior security engineer and bug hunter performing a THOROUGH code audit. Your ONLY job is to find real bugs, vulnerabilities, and logic errors.

Scan EVERY file for:
1. **Security Vulnerabilities**: XSS, SQL injection, command injection, CSRF, insecure deserialization, path traversal, exposed secrets/API keys, missing auth checks, CORS misconfig
2. **Logic Bugs**: off-by-one errors, race conditions, null/undefined access, unreachable code, incorrect conditionals, wrong operator precedence, mutation of shared state
3. **Runtime Errors**: unhandled promise rejections, missing null checks, type coercion issues, accessing properties of undefined, array out of bounds
4. **Memory/Performance Bugs**: memory leaks (event listeners not removed, intervals not cleared), infinite loops, unbounded data structures, N+1 queries
5. **API/Data Issues**: missing input validation, missing error responses, incorrect HTTP status codes, data not sanitized, missing rate limiting
6. **Dependency Issues**: known vulnerable patterns, deprecated API usage, unsafe eval/innerHTML usage
7. **Concurrency Issues**: race conditions in state updates, stale closures in React hooks, missing dependency arrays

For each bug found, provide:
- The exact file path and line number (or closest line)
- A clear description of what the bug IS (not what it could be)
- The severity: "critical" (security/data loss), "error" (will crash/break), "warning" (potential issue), "info" (code smell)
- A concrete fix with actual code

Be AGGRESSIVE in finding issues. Report everything suspicious. It's better to over-report than miss a real bug.

Repository Content:
${context.slice(0, 50000)}

Return ONLY a valid JSON object with NO markdown fences:
{
  "errors": [{ "file": "string", "line": number, "message": "string (specific description)", "severity": "critical"|"error"|"warning", "type": "security"|"logic"|"runtime"|"performance"|"api"|"dependency"|"concurrency", "fixCode": "string (actual fix)", "explanation": "string (why this is dangerous)" }],
  "warnings": [{ "file": "string", "line": number, "message": "string", "severity": "warning"|"info", "type": "string", "fixCode": "string|null", "explanation": "string" }]
}
`,

    suggestImprovements: (context: string) => `
You are a principal engineer doing a comprehensive code review. Find specific, actionable improvements.

Look for:
- Missing error handling or try/catch blocks
- Functions that are too long (>50 lines) and should be split
- Repeated code that should be extracted
- Missing TypeScript types (any usage)
- Security issues (XSS, injection, exposed secrets)
- Performance problems (unnecessary re-renders, missing memoization, N+1 queries)
- Missing input validation
- Console.log statements in production code
- Hardcoded strings/URLs that should be config/env vars
- Missing loading/error states in UI
- Accessibility issues

For each: exact title, detailed explanation, category, priority, file path, current code snippet, suggested fix.

Repository Content:
${context.slice(0, 40000)}

Return ONLY a valid JSON object with NO markdown fences:
{ "improvements": [{ "category": "complexity"|"performance"|"duplication"|"security"|"best-practice"|"refactoring"|"accessibility", "priority": "high"|"medium"|"low", "title": "string", "description": "string (2-3 sentences)", "file": "string", "line": number|null, "currentCode": "string|null", "suggestedCode": "string|null", "impact": "string", "effort": "low"|"medium"|"high" }] }
`,

    generateArchitecture: (context: string) => `
You are an expert software architect. Generate a Mermaid.js flowchart showing the complete DATA FLOW of this application.

CRITICAL RULES:
- START WITH "flowchart TD"
- Use ACTUAL component/file names from the code (not generic labels)
- Show the real data flow: user interactions → components → API calls → services → database/external APIs → responses
- Include ALL major components, pages, API routes, and services you find
- Label every arrow with what data flows through it
- 12-20 nodes minimum for thorough coverage

Repository Content:
${context.slice(0, 30000)}

Return ONLY raw Mermaid code, no markdown fences, no explanation text.
`,

    generateSummary: (details: any, context: string) => `
You are a principal technical architect and writer. Write an EXTREMELY DETAILED and COMPREHENSIVE analysis summary for this project.

Structure your response with these specific sections (use markdown headings):

# Executive Summary
A high-level overview of the project's value proposition, core functionality, and overall technical health. (Min 150 words)

# System Architecture & Design Patterns
A deep dive into the structural organization of the project.
- Explain the architectural style (e.g., Modular Monolith, Micro-services, Component-based)
- Identify specific design patterns found (e.g., Repository pattern, Dependency Injection, Observer, etc.)
- Explain the data flow from entry point to storage/output. (Min 250 words)

# Deep Component Analysis
Analyze the 10 most critical files/modules in detail. For each, explain:
1. Exact responsibility and role.
2. Key logic and algorithms used.
3. How it interacts with other modules.
4. Specific code quality observations.

# Technology Stack & Tooling
A detailed breakdown of every library, framework, and tool used. Explain WHY they were chosen (if apparent) or how they are utilized. Include versions if available.

# Code Quality & Maintainability Audit
Evaluate the codebase against industry standards.
- Modularization: Is the code properly separated?
- Type Safety: Assessment of TypeScript/type usage.
- Error Handling: How robust is the error management?
- Testing: Presence and quality of tests.
- Documentation: Quality of comments and docstrings.

# Performance & Scalability Considerations
Analyze potential bottlenecks and how the system handles load. Identify any N+1 query issues, heavy client-side processing, or memory leaks.

# Strategic Recommendations
Provide 5-7 specific, actionable improvements with technical justification for each. Rank them by impact vs. effort.

Project Analysis Data:
${JSON.stringify(details.fileAnalysis?.map((f: any) => ({ path: f.path, explanation: f.explanation, features: f.keyFeatures, purpose: f.purpose }))).slice(0, 20000)}

Tech Stack: ${JSON.stringify(details.techStack)}
Complexity: ${JSON.stringify(details.complexity)}
Errors Found: ${details.errorCount} errors, ${details.warningCount} warnings

Source Code Context:
${context.slice(0, 30000)}

DO NOT BE CONCISE. Be as thorough as possible. Reference actual line numbers and function names from the context.
`
};

export async function analyzeCodebase(files: { path: string; content: string }[], apiKey?: string) {
    const resolvedKey = apiKey || process.env.GOOGLE_GENAI_API_KEY || "";
    if (!resolvedKey) {
        console.error("No Gemini API key found — falling back to local analysis");
        return analyzeCodebaseLocal(files);
    }

    const model = getModel(apiKey);

    const filteredFiles = files.filter(f =>
        !f.path.includes('lock') &&
        !f.path.includes('node_modules') &&
        !f.path.endsWith('.min.js') &&
        !f.path.endsWith('.map')
    );

    const context = buildContext(filteredFiles);
    console.log(`Analyzing ${filteredFiles.length} files, context: ${context.length} chars`);

    const parse = (res: any, fallback: any) => {
        try {
            const txt = res.response.text();
            let clean = txt.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            const objMatch = clean.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
            if (objMatch) clean = objMatch[1];
            clean = clean.replace(/,\s*([}\]])/g, '$1');
            return JSON.parse(clean);
        } catch (e) { console.error("Parse Error", e); return fallback; }
    };

    let aiStepsSucceeded = 0;

    // --- Step 1: Tech Stack (with independent fallback) ---
    let techStack = { languages: [] as string[], frameworks: [] as string[], tools: [] as string[], packageManager: "Unknown" };
    const packageInfoPromise = analyzePackageVersionsAsync(files);
    try {
        console.log("Step 1/6: Identifying tech stack...");
        const res = await withRetry(() => model.generateContent(prompts.identifyTechStack(context)));
        techStack = parse(res, techStack);
        aiStepsSucceeded++;
        console.log("Step 1/6: Tech stack identified via AI ✓");
        await delay(2000);
    } catch (err) {
        console.error("Step 1/6 FAILED (tech stack) — using local detection:", err);
        const langs = new Set<string>();
        const fws = new Set<string>();
        const tls = new Set<string>();
        filteredFiles.forEach(f => {
            const ext = f.path.split('.').pop()?.toLowerCase();
            if (ext === 'ts' || ext === 'tsx') langs.add('TypeScript');
            if (ext === 'js' || ext === 'jsx') langs.add('JavaScript');
            if (ext === 'py') langs.add('Python');
            if (ext === 'go') langs.add('Go');
            if (ext === 'rs') langs.add('Rust');
            if (ext === 'java') langs.add('Java');
            if (ext === 'css') langs.add('CSS');
            const c = f.content.toLowerCase();
            if (c.includes('import react') || c.includes("from 'react'")) fws.add('React');
            if (c.includes('next/') || c.includes('next.config')) fws.add('Next.js');
            if (c.includes('tailwindcss') || c.includes('tailwind')) tls.add('Tailwind CSS');
            if (c.includes('from "vue"') || c.includes("from 'vue'")) fws.add('Vue');
            if (c.includes('express')) fws.add('Express');
        });
        if (langs.size === 0) langs.add('JavaScript');
        const pkgFile = files.find(f => f.path.endsWith('package.json'));
        techStack = { languages: Array.from(langs), frameworks: Array.from(fws), tools: Array.from(tls), packageManager: pkgFile ? 'npm' : 'Unknown' };
        await delay(2000);
    }

    // --- Step 2: Complexity (with independent fallback) ---
    const totalLinesLocal = filteredFiles.reduce((a, f) => a + f.content.split('\n').length, 0);
    let complexity = { score: 5, level: "Medium", justification: "Local analysis — AI unavailable for this step.", metrics: { totalFiles: filteredFiles.length, totalLines: totalLinesLocal } };
    try {
        console.log("Step 2/6: Assessing complexity...");
        const res = await withRetry(() => model.generateContent(prompts.assessComplexity(context)));
        complexity = parse(res, complexity);
        aiStepsSucceeded++;
        console.log("Step 2/6: Complexity assessed via AI ✓");
        await delay(2000);
    } catch (err) {
        console.error("Step 2/6 FAILED (complexity) — using local metrics:", err);
        await delay(2000);
    }

    // --- Step 3: Improvements (with independent fallback) ---
    let improvementsData = { improvements: [] as any[] };
    try {
        console.log("Step 3/6: Suggesting improvements...");
        const res = await withRetry(() => model.generateContent(prompts.suggestImprovements(context)));
        improvementsData = parse(res, improvementsData);
        aiStepsSucceeded++;
        console.log("Step 3/6: Improvements suggested via AI ✓");
        await delay(2000);
    } catch (err) {
        console.error("Step 3/6 FAILED (improvements) — using local analyzer:", err);
        await delay(2000);
    }

    // --- Step 4: Deep file analysis (with independent fallback) ---
    let fileAnalysisData = { files: [] as any[] };
    try {
        console.log("Step 4/6: Deep file analysis...");
        const res = await withRetry(() => model.generateContent(prompts.analyzeFilesDeep(context)));
        fileAnalysisData = parse(res, fileAnalysisData);
        aiStepsSucceeded++;
        console.log(`Step 4/6: ${fileAnalysisData.files?.length || 0} files analyzed via AI ✓`);
        await delay(2000);
    } catch (err) {
        console.error("Step 4/6 FAILED (file analysis) — will use local explanations:", err);
        await delay(2000);
    }

    // --- Step 5: Bug & security audit (with independent fallback) ---
    let bugData = { errors: [] as any[], warnings: [] as any[] };
    try {
        console.log("Step 5/6: Bug & security audit...");
        const res = await withRetry(() => model.generateContent(prompts.detectBugs(context)));
        bugData = parse(res, bugData);
        aiStepsSucceeded++;
        console.log(`Step 5/6: Found ${bugData.errors?.length || 0} errors, ${bugData.warnings?.length || 0} warnings via AI ✓`);
        await delay(2000);
    } catch (err) {
        console.error("Step 5/6 FAILED (bug detection) — using local error analyzer:", err);
        await delay(2000);
    }

    // Collect errors/warnings from per-file issues + dedicated bug detection
    const detectedErrors: any[] = [...(bugData.errors || [])];
    const detectedWarnings: any[] = [...(bugData.warnings || [])];
    (fileAnalysisData.files || []).forEach((f: any) => {
        (f.issues || []).forEach((issue: any) => {
            const entry = { file: f.path, line: issue.line || 0, message: issue.message, severity: issue.severity || "warning", type: issue.type || "logic", fixCode: issue.suggestion || issue.fixCode || "", explanation: issue.explanation || "" };
            if (issue.severity === "critical" || issue.severity === "error") {
                detectedErrors.push(entry);
            } else {
                detectedWarnings.push(entry);
            }
        });
    });

    // Build file explanation map
    const explanationMap = new Map<string, any>();
    (fileAnalysisData.files || []).forEach((f: any) => explanationMap.set(f.path, f));

    // --- Step 6: Architecture + Summary (with independent fallback) ---
    let architectureResult = "";
    try {
        const { generateArchitectureDiagram } = await import('./simple-architecture');
        architectureResult = await withRetry(() => generateArchitectureDiagram(filteredFiles, apiKey));
        console.log("Architecture diagram generated via AI ✓");
    } catch (err) {
        console.error("Architecture diagram FAILED — using local generator:", err);
        try {
            const { generateSimpleArchitectureDiagram } = await import('./simple-architecture');
            architectureResult = generateSimpleArchitectureDiagram(filteredFiles);
        } catch { architectureResult = "flowchart TD\n  A[Project] --> B[Source Files]"; }
    }

    const packageInfoRes = await packageInfoPromise;

    let summary = `Analyzed ${filteredFiles.length} files with ${aiStepsSucceeded}/6 AI steps. Found ${detectedErrors.length} issues and ${detectedWarnings.length} warnings.`;
    try {
        console.log("Step 6/6: Generating summary...");
        const summaryRes = await withRetry(() => model.generateContent(prompts.generateSummary({
            fileAnalysis: (fileAnalysisData.files || []).slice(0, 10),
            techStack,
            complexity,
            improvements: (improvementsData.improvements || []).slice(0, 3),
            errorCount: detectedErrors.length,
            warningCount: detectedWarnings.length
        }, context)));
        summary = summaryRes.response.text();
        aiStepsSucceeded++;
        console.log("Step 6/6: Summary generated via AI ✓");
    } catch (err) {
        console.error("Step 6/6 FAILED (summary) — using template:", err);
    }

    console.log(`Analysis Complete. ${aiStepsSucceeded}/6 AI steps succeeded.`);

    // Merge static + AI errors/warnings (deduplicated)
    const staticAnalysis = analyzeCodeForErrors(filteredFiles);
    const uniqueErrors = new Map();
    [...staticAnalysis.errors, ...detectedErrors].forEach(e => {
        const key = `${e.file}:${e.line}:${e.message}`;
        if (!uniqueErrors.has(key)) uniqueErrors.set(key, e);
    });
    const uniqueWarnings = new Map();
    [...staticAnalysis.warnings, ...detectedWarnings].forEach(w => {
        const key = `${w.file}:${w.line}:${w.message}`;
        if (!uniqueWarnings.has(key)) uniqueWarnings.set(key, w);
    });

    // Package info
    const packageJsonFile = files.find(f => f.path.endsWith('package.json'));
    let deps = {};
    let devDeps = {};
    try {
        if (packageJsonFile) {
            const json = JSON.parse(packageJsonFile.content);
            deps = json.dependencies || {};
            devDeps = json.devDependencies || {};
        }
    } catch (e) { }

    // Quality analysis from AI improvements + local fallback
    const uniqueQualityMap = new Map();
    (improvementsData.improvements || []).forEach((imp: any) => {
        const key = imp.title;
        if (!uniqueQualityMap.has(key)) {
            uniqueQualityMap.set(key, {
                category: imp.category || "Improvement",
                issue: imp.title,
                recommendation: imp.description || imp.explanation,
                priority: imp.priority || "medium"
            });
        }
    });

    // File analysis — AI explanations where available, local fallback per-file
    const fileAnalysis = filteredFiles.map(f => {
        const aiExplain = explanationMap.get(f.path);
        return {
            path: f.path,
            language: f.path.split('.').pop() || 'Text',
            lines: f.content.split('\n').length,
            size: f.content.length,
            preview: f.content.slice(0, 300),
            content: f.content,
            explanation: aiExplain?.explanation || generateLineByLineExplanation(f),
            purpose: aiExplain?.purpose || (f.path.includes('/api/') ? 'API Route' : f.path.endsWith('.json') ? 'Configuration' : 'Source Code'),
            keyFeatures: aiExplain?.keyFeatures || ['See detailed explanation']
        };
    });

    // Use local improvement analyzer as supplement
    const localImprovements = analyzeForImprovements(filteredFiles);

    return {
        summary,
        techStack,
        complexity: {
            score: complexity.score,
            analysis: complexity.justification,
            metrics: {
                totalFiles: filteredFiles.length,
                totalLines: complexity.metrics?.totalLines || totalLinesLocal,
                avgLinesPerFile: Math.round((complexity.metrics?.totalLines || totalLinesLocal) / (filteredFiles.length || 1))
            }
        },
        architecture: architectureResult,
        errors: Array.from(uniqueErrors.values()),
        warnings: Array.from(uniqueWarnings.values()),
        packages: {
            total: packageInfoRes.length,
            all: packageInfoRes,
            outdated: packageInfoRes.filter((p: any) => p.status === 'outdated'),
            dependencies: deps,
            devDependencies: devDeps
        },
        fileAnalysis,
        qualityAnalysis: Array.from(uniqueQualityMap.values()),
        improvements: localImprovements
    };
}

// Keep the local version as fallback
async function analyzeCodebaseLocal(files: { path: string; content: string }[]) {
    // 1. Package Analysis with npm outdated
    const packageJsonFile = files.find(f => f.path.endsWith('package.json'));
    let packageData: any = null;
    let allPackages: any[] = [];
    const languages = new Set<string>();
    const frameworks = new Set<string>();
    const tools = new Set<string>();

    if (packageJsonFile) {
        try {
            packageData = JSON.parse(packageJsonFile.content);
            const deps = { ...packageData.dependencies || {}, ...packageData.devDependencies || {} };

            // Initial map from package.json
            const packageMap = new Map();
            Object.entries(deps).forEach(([name, version]) => {
                packageMap.set(name, {
                    name,
                    current: version,
                    latest: 'Checking...',
                    status: 'unknown'
                });
            });

            // Run npm outdated to get real versions
            try {
                // We use process.cwd() as we assume the app is running in the project root
                const { stdout } = await execAsync('npm outdated --json', { encoding: 'utf8' }).catch(e => e);
                if (stdout) {
                    const outdatedData = JSON.parse(stdout);
                    Object.entries(outdatedData).forEach(([name, info]: [string, any]) => {
                        if (packageMap.has(name)) {
                            packageMap.set(name, {
                                ...packageMap.get(name),
                                current: info.current || packageMap.get(name).current,
                                latest: info.latest,
                                status: 'outdated'
                            });
                        }
                    });
                }
            } catch (err) {
                console.warn("Failed to run npm outdated:", err);
            }

            // Mark others as up-to-date or unknown
            allPackages = Array.from(packageMap.values()).map(pkg => ({
                ...pkg,
                latest: pkg.latest === 'Checking...' ? pkg.current : pkg.latest,
                status: pkg.status === 'unknown' ? 'up-to-date' : pkg.status
            }));

            // Detect Tech Stack
            Object.keys(deps).forEach(d => {
                if (d.includes('react')) frameworks.add('React');
                if (d.includes('next')) frameworks.add('Next.js');
                if (d.includes('vue')) frameworks.add('Vue');
                if (d.includes('tailwind')) tools.add('Tailwind CSS');
                if (d.includes('typescript')) languages.add('TypeScript');
            });

        } catch (e) { console.error('Error parsing package.json', e); }
    }

    // 2. Tech Stack from files
    files.forEach(f => {
        const ext = f.path.split('.').pop()?.toLowerCase();
        if (ext === 'js' || ext === 'jsx') languages.add('JavaScript');
        if (ext === 'ts' || ext === 'tsx') languages.add('TypeScript');
        if (ext === 'css') languages.add('CSS');

        const content = f.content.toLowerCase();
        if (content.includes('import react')) frameworks.add('React');
        if (content.includes('next/')) frameworks.add('Next.js');
    });

    // 3. Simple Errors/Warnings & Quality Analysis
    const errors: any[] = [];
    const warnings: any[] = [];

    // Use Maps for deduplication
    const qualityMap = new Map<string, any>();
    const improvementMap = new Map<string, any>();

    files.forEach(f => {
        const lines = f.content.split('\n');

        // Error Checks
        if (f.content.includes('eval(')) {
            const key = "eval-usage";
            if (!qualityMap.has(key)) {
                errors.push({ file: f.path, line: 0, message: "Avoid eval() - Security Risk", severity: "high", fixCode: "Remove eval() usage" });
                qualityMap.set(key, { category: "Security", issue: "Usage of eval() detected", recommendation: "Remove eval() to prevent code injection", priority: "critical", count: 1 });
            } else {
                qualityMap.get(key).count++;
            }
        }

        // Warning Checks & Quality
        let anyCount = 0;
        lines.forEach((line, idx) => {
            if (line.includes('console.log')) {
                warnings.push({ file: f.path, line: idx + 1, message: "Console log left in code", severity: "low", fixCode: "// Remove console.log" });
            }
            if (line.includes(': any') || line.includes('as any')) {
                anyCount++;
            }
        });

        if (anyCount > 0) {
            const key = "type-safety-any";
            if (!qualityMap.has(key)) {
                qualityMap.set(key, {
                    category: "Type Safety",
                    issue: "Usage of 'any' type",
                    recommendation: "Use specific types (interface/type) instead of 'any' to ensure type safety.",
                    priority: "medium",
                    count: anyCount
                });
            } else {
                qualityMap.get(key).count += anyCount;
            }
        }

        // Improvement Checks
        if (lines.length > 300) {
            improvementMap.set(f.path, {
                title: "Large File Detected",
                description: `File **${f.path.split('/').pop()}** is ${lines.length} lines long. Consider splitting it into smaller components.`,
                file: f.path,
                category: "complexity",
                priority: "medium",
                currentCode: `// ${lines.length} lines of code`,
                suggestedCode: `// Split into sub-components`,
                effort: "medium",
                impact: "Improves maintainability"
            });
        }
    });

    // Convert Maps to Arrays and format issues
    const qualityAnalysis = Array.from(qualityMap.values()).map(item => ({
        ...item,
        issue: item.count > 1 ? `${item.issue} (${item.count} occurrences)` : item.issue
    }));

    const improvements = Array.from(improvementMap.values());

    const totalLines = files.reduce((acc, f) => acc + f.content.split('\n').length, 0);
    const avgLines = Math.round(totalLines / files.length);

    // 4. File Analysis
    const fileAnalysis = files.map(f => {
        const originalFile = files.find(file => file.path === f.path);
        return {
            path: f.path,
            language: f.path.split('.').pop() || 'Text',
            lines: originalFile?.content.split('\n').length || 0,
            size: originalFile?.content.length || 0, // Using 0 as fallback if undefined
            preview: originalFile?.content.slice(0, 300) || "",
            content: originalFile?.content || "",
            explanation: originalFile ? generateLineByLineExplanation(originalFile) : "No detailed explanation available.",
            purpose: 'Source Code',
            keyFeatures: ['Local Analysis']
        };
    });

    // Default Tech Stack Fallback
    if (frameworks.size === 0) frameworks.add('Unknown Framework');
    if (languages.size === 0) languages.add('JavaScript');

    return {
        summary: `Analyzed ${files.length} files. Detected ${languages.size} languages and ${frameworks.size} frameworks. Found ${qualityAnalysis.length} quality insights.`,
        techStack: {
            languages: Array.from(languages),
            frameworks: Array.from(frameworks),
            tools: Array.from(tools),
            packageManager: packageData ? 'npm' : 'Detected manually'
        },
        complexity: {
            score: 5,
            analysis: "Local analysis fallback triggered.",
            metrics: { totalFiles: files.length, totalLines, avgLinesPerFile: avgLines }
        },
        // Force detailed diagram
        architecture: await (async () => {
            const { generateSimpleArchitectureDiagram } = await import('./simple-architecture');
            return generateSimpleArchitectureDiagram(files);
        })(),
        errors,
        warnings,
        packages: {
            total: allPackages.length,
            all: allPackages,
            outdated: allPackages.filter(p => p.status === 'outdated'),
            dependencies: packageData?.dependencies || {},
            devDependencies: packageData?.devDependencies || {}
        },
        fileAnalysis,
        qualityAnalysis: qualityAnalysis.slice(0, 10),
        improvements: improvements.slice(0, 5),
        isFallback: true
    };
}

export async function chatWithCodebase(
    history: { role: "user" | "model"; content: string }[],
    message: string,
    context: string,
    apiKey?: string
) {
    try {
        const model = getModel(apiKey);
        const systemPrompt = `You are an expert code assistant and 3D architectural guide analyzing a codebase. You have access to the complete codebase context.
        
Your capabilities:
- Explain code logic and architecture in a spatial context (City, Buildings, Rooms)
- Suggest improvements and optimizations
- Identify bugs and security issues
- Answer questions about the codebase
- Provide code examples and fixes
- Explain dependencies as "logical paths" or "data routes"

When asked about a specific building (class/module) or room (function) in the 3D world:
1. Explain its primary purpose in the overall city (application).
2. Describe who it "talks to" (dependencies) and why.
3. Highlight any "structural damage" (bugs or complexity) it might have.

Guidelines:
- Be specific and reference actual code when possible
- Provide actionable suggestions
- Explain technical concepts clearly
- Use code examples to illustrate points
- Be concise but thorough

Codebase Context:
${context.slice(0, 50000)}

Now, help the user with their questions about this codebase.`;

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "I've analyzed the codebase and I'm ready to help! I can explain code, suggest improvements, identify issues, or answer any questions about the project. What would you like to know?" }] },
                ...history.map(m => ({ role: m.role, parts: [{ text: m.content }] }))
            ],
            generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 2048,
            }
        });

        const result = await chat.sendMessage(message);
        return result.response.text();
    } catch (e) {
        console.error("Chat error:", e);
        return "I'm having trouble processing your request. Please try rephrasing your question or ask about:\n- Code explanations\n- Improvement suggestions\n- Bug identification\n- Architecture questions\n- Best practices";
    }
}
