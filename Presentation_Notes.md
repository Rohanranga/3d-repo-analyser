# CodeSonar - AI-Powered Code Analysis Tool (Presentation Notes)

## Project Overview
CodeSonar is a full-stack web application (and optional Electron desktop app) that lets users submit a GitHub repository URL or upload a source file, then uses Google Gemini AI to perform deep analysis - identifying tech stack, complexity, bugs, security vulnerabilities, architecture, and code explanations. Results are displayed in a rich animated dashboard with a Mermaid.js architecture diagram, and users can download a full PDF report or chat with an AI assistant about the codebase.

**Tech Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion, Google Gemini AI (gemini-2.5-flash), Octokit (GitHub API), Mermaid.js, jsPDF, Electron (optional desktop build).

---

## File-by-File Breakdown

### 1. Configuration Files

| File | Purpose |
| :--- | :--- |
| `package.json` | Project metadata, scripts (dev, build, build:electron), all dependencies and devDependencies. Also contains Electron Builder config for packaging as a Windows desktop app. |
| `tsconfig.json` | TypeScript configuration - targets ES2017, uses Next.js plugin, sets up `@/*` path alias pointing to `./src/*`. |
| `postcss.config.mjs` | PostCSS config - enables Tailwind CSS v4 via the `@tailwindcss/postcss` plugin. |
| `eslint.config.mjs` | ESLint config using Next.js recommended rules (core-web-vitals + TypeScript). |

### 2. Type Definitions
- `src/types/analysis.ts`: The central data contract. Defines the `AnalysisResult` interface that flows through the entire app. Contains:
  - `summary`: AI-generated project summary text
  - `techStack`: languages, frameworks, tools, package manager
  - `complexity`: score (1-10), analysis text, metrics (totalFiles, totalLines, avgLinesPerFile)
  - `errors` / `warnings`: array of detected issues with file, line, type, message, severity, suggestion, and fixCode
  - `packages`: all dependencies with current/latest versions and status (up-to-date/outdated)
  - `fileAnalysis`: per-file breakdown with path, language, lines, size, purpose, keyFeatures, content, explanation
  - `qualityAnalysis`: categorized code quality recommendations
  - `improvements`: actionable improvement suggestions with category, priority, effort, current/suggested code

### 3. Library / Backend Logic (the "brain")
- `src/lib/ai.ts`: The core AI orchestrator. This is the most important backend file. It:
  1. Initializes Google Gemini (`gemini-2.5-flash`) with controlled temperature (0.4)
  2. Implements retry with backoff for rate limiting (429 errors)
  3. Defines 5 specialized AI prompts (mini-agents):
     - `identifyTechStack`: detects all languages, frameworks, tools
     - `assessComplexity`: scores code complexity 1-10
     - `suggestImprovements`: finds actionable code improvements
     - `detectBugsAndExplain`: finds security bugs AND generates file explanations in one pass
     - `generateArchitecture`: creates a Mermaid.js data-flow diagram
     - `generateSummary`: writes a human-readable project summary
  4. Runs these sequentially (with 2s delays to avoid rate limits on free tier)
  5. Merges AI-detected bugs with static analysis results (deduplicating by file:line:message)
  6. Falls back to `analyzeCodebaseLocal()` if AI fails - a pure local static analysis
  7. Exports `chatWithCodebase()` - powers the chatbot feature using Gemini's chat API

- `src/lib/github.ts`: GitHub API integration using Octokit:
  - Fetches a repo's default branch, then recursively fetches the file tree
  - Filters out binary files, `node_modules`, build artifacts
  - Fetches up to 60 source files in batches of 10 (to avoid rate spikes)
  - Decodes base64 file content from the GitHub API
  - Includes a hardcoded fallback for demo purposes if the API fails

- `src/lib/error-analyzer.ts`: Static code analysis engine (runs without AI). Scans every file for:
  - `console.log` / `console.error` / `console.warn` statements
  - `TODO`/`FIXME` comments
  - `debugger` statements
  - `var` usage (suggests `const`/`let`)
  - Loose equality `==` (suggests `===`)
  - `await` without try/catch
  - Hardcoded API keys/secrets (regex patterns)
  - Missing semicolons, long lines (>120 chars), nested ternaries
  - Missing TypeScript type annotations, large files (>300 lines)
  - Deduplicates results using Maps, limits output to 50 errors / 100 warnings

- `src/lib/improvement-analyzer.ts`: Code improvement suggestion engine (static). Checks for:
  - Long functions (>50 lines), deep nesting (>5 levels)
  - Chained `.map().filter()` that could be a single `.reduce()`
  - React components missing `React.memo`
  - Code duplication (repeated blocks)
  - Missing error boundaries in React components
  - Magic numbers, missing PropTypes/interfaces
  - `eval()` usage, `innerHTML`/`dangerouslySetInnerHTML` (XSS risk)
  - Long parameter lists, large switch statements
  - Sorts results by priority, caps at 50

- `src/lib/explanation-generator.ts`: Generates human-readable explanations of code files. Produces markdown with:
  - File type identification (React component, API route, config, etc.)
  - What it does (state management, UI rendering, API endpoint)
  - Dependencies list (local vs external)
  - Code logic breakdown (conditionals, loops, map/filter/reduce, async patterns, event handling, error handling)
  - Code quality assessment

- `src/lib/line-by-line-explainer.ts`: Step-by-step code walkthrough generator. Produces detailed markdown explaining each section of code:
  - File overview (page route, layout, API handler, component, module)
  - For JSON: parses and explains each config key (name, version, dependencies, scripts)
  - For Markdown: describes content types (headers, links, code blocks, lists)
  - For code: walks through imports, interfaces, component declarations, useState, useEffect, return/JSX, API calls
  - Adds usage context (how to import/use the file)

- `src/lib/version-analyzer.ts`: Package version checker:
  - Parses `package.json` to extract all dependencies
  - Runs `npm outdated --json` to get real outdated info (async version)
  - Has a hardcoded table of known latest versions as fallback
  - Detects technologies from file extensions and import statements
  - Compares versions semantically (major.minor.patch)

- `src/lib/simple-architecture.ts`: Mermaid diagram generator using Gemini AI:
  - Sends code context to Gemini with strict formatting rules for valid Mermaid syntax
  - Sanitizes AI output (removes parentheses from edge labels, strips markdown fences)
  - Has a detailed static fallback diagram if AI fails
  - `generateSimpleArchitectureDiagram()` - builds a diagram programmatically from file paths (no AI needed)

- `src/lib/utils.ts`: Utility. Exports `cn()` which merges Tailwind classes using `clsx` + `tailwind-merge`.

### 4. API Routes (Server-Side)
- `src/app/api/analyze/route.ts`: Main analysis endpoint (`POST /api/analyze`):
  - Accepts `{ type: "url"|"file", value: string }`
  - For url: parses GitHub URL, fetches repo files via `github.ts`
  - For file: parses uploaded file content
  - Calls `analyzeCodebase()` from `ai.ts` and returns the full analysis result
  - 5-minute timeout (`maxDuration = 300`)

- `src/app/api/chat/route.ts`: Chat endpoint (`POST /api/chat`):
  - Accepts `{ history, message, context }`
  - Calls `chatWithCodebase()` from `ai.ts` to generate a response using Gemini's chat API
  - Returns `{ response: string }`

- `src/app/api/private-analyze/route.ts`: Private analysis endpoint (`POST /api/private-analyze`):
  - Same as `/api/analyze` but accepts user-supplied API keys (`geminiKey`, `githubKey`)
  - Temporarily swaps `process.env.GOOGLE_GENAI_API_KEY` with the user's key during analysis
  - Uses its own Octokit instance with the user's GitHub token
  - Restores the original env key in a finally block

### 5. Pages (Frontend Routes)
- `src/app/layout.tsx`: Root layout wrapping all pages:
  - Loads Inter font, sets dark theme, renders persistent UI elements (FlowFieldBackground, ambient glow orbs, grid overlay, Header, SpotlightEffect, ClickBurst, NeonCursor)

- `src/app/page.tsx`: Home page (the main page):
  - State: `isLoading`, `analysisData`, `error`, `chatContext`
  - `handleAnalyze()`: POSTs to `/api/analyze`, stores result, builds chat context string, scrolls to dashboard
  - Renders: Hero -> AnalysisDashboard -> ChatInterface
  - Shows features section when no analysis is active

- `src/app/private/page.tsx`: Private analysis page (`/private`):
  - Full standalone page where users bring their own Gemini + GitHub API keys
  - Features an animated PrivateLogo with orbit rings The input accepts toggleable password fields for key.
  - Submits to `/api/private-analyze`

- `src/app/globals.css`: Global styles:
  - Imports Tailwind CSS v4, custom CSS variables for dark theme (HSL), custom utilities (`glass`, `glass-card`, `text-gradient`), missing native cursor replaced, neon-gradient scrollbar.

### 6. Components
#### Layout & Home
- `src/components/layout/Header.tsx`: Fixed top navigation bar.
- `src/components/home/Hero.tsx`: Landing hero section with animated badges, stats counters, 3D robot, particle bursts.

#### Input
- `src/components/input/RepoInput.tsx`: Input component with GitHub URL and file upload tabs.

#### Dashboard & Analysis Views
- `src/components/dashboard/AnalysisDashboard.tsx`: Main results container. Features orbital spinner loading screen, checklist, and success states rendering sub-components.
- `src/components/analysis/SummaryCard.tsx`: Project summary, tech stack pills, complexity scale visualization.
- `src/components/analysis/ArchitectureView.tsx`: Sanitizes and renders Mermaid.js SVG architecture diagrams with download button.
- `src/components/analysis/DetailedAnalysis.tsx`: Comprehensive findings panel spanning errors, warnings, package dependencies, quality improvements, and split-pane file browser.
- `src/components/analysis/PotentialChanges.tsx`: Improvement suggestions panel with code diffs (current vs suggested).
- `src/components/analysis/DownloadPDF.tsx`: Uses jsPDF to programmatically build a multi-page PDF presentation of all findings.
- `src/components/chat/ChatInterface.tsx`: Floating AI chatbot taking the entire context to answer subsequent queries.

#### UI Components

| File | Purpose |
| :--- | :--- |
| `CodeBlock.tsx` | Syntax-highlighted code blocks for markdown rendering |
| `splite.tsx` | Lazy-loads the Spline 3D robot scene |
| `card.tsx` | Reusable card wrapper (glassmorphism) |
| `spotlight.tsx / SpotlightEffect.tsx` | Animated spotlight effect following mouse |
| `neon-flow.tsx / flow-field-background.tsx / FlowFieldWrapper.tsx` | Animated particle/flow field background canvas |
| `ClickBurst.tsx` | Particle burst effect on click |
| `NeonCursor.tsx` | Custom neon cursor replacement |

---

## 7. Data Flow Summary
1. **User Input:** User enters GitHub URL or uploads file
2. **Analysis Triggered:** Frontend (`page.tsx`) POSTs to `/api/analyze`
3. **Fetching Source:** `route.ts` parses URL, calls `github.ts` to fetch repo files
4. **AI Processing:** Calls `ai.ts` `analyzeCodebase()` which runs 5 sequential Gemini prompts:
   - *identifyTechStack*
   - *assessComplexity*
   - *suggestImprovements*
   - *detectBugsAndExplain*
   - *generateArchitecture* + *generateSummary*
5. **Static Analysis Merge:** Merges AI results with static analysis (`error-analyzer`, `improvement-analyzer`)
6. **Delivery:** Returns full `AnalysisResult` JSON
7. **Rendering:** Frontend renders `AnalysisDashboard` with all sub-components
8. **Interactive Follow-ups:** User can chat with AI about the codebase via `/api/chat` and download PDF report

Good luck with your presentation tomorrow!
