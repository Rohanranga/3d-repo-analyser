# CodeSonar: Complete Project & Working Documentation

This document serves as the exhaustive technical overview for the **CodeSonar** application. It details the project's purpose, its complete architectural workflow (how it works end-to-end), the roles of various files contributing to its features, and the location of the AI system prompts.

---

## 1. Project Overview & Purpose

**CodeSonar** is an enterprise-grade, AI-powered codebase analysis dashboard built using Next.js, React, and Google's Gemini 2.5 Flash model. 

The primary goal of the application is to act as a "Senior Principal Engineer as a Service." A user can submit a public GitHub repository link or manually drop a set of source files into the UI. CodeSonar then recursively processes the repository's files and uses Large Language Models and local static analysis to automatically generate:
- **Tech Stack Identification:** Languages, frameworks, tools, and package managers.
- **Code Complexity Scaling:** Cyclomatic complexity evaluations with justifications.
- **Vulnerability & Bug Detection:** Scanning for security risks and logical flaws.
- **Actionable Improvements:** Identifying "code smells" like overly long functions, prop drilling, or bad state management.
- **Architecture Mapping:** Dynamic generation of Mermaid.js flowcharts mapping the codebase's data flow.
- **Interactive Chatbot:** A real-time, context-aware chatbot capable of answering deep architectural or specific implementation questions about the submitted code.

---

## 2. How it Works: The Complete Pipeline

The internal working mechanism of CodeSonar avoids traditional Vector Databases. Instead, it leverages **Context Stuffing** – utilizing the massive context window of the Gemini 2.5 Flash model. 

Here is the step-by-step lifecycle of an analysis request:

### Step 1: Input & Ingestion
1. The user navigates to the landing page (`src/app/page.tsx`).
2. They input a GitHub URL (e.g., `https://github.com/user/repo`) or upload `.zip`/raw files via the input components.
3. The frontend sends an HTTP POST request to the custom backend route `src/app/api/analyze/route.ts`.

### Step 2: Source Code Acquisition
4. For GitHub links, the application uses the `src/lib/github.ts` service (via Octokit) to recursively fetch the branch file tree.
5. It filters out common "noise" files and directories (e.g., `node_modules`, `.git`, image assets, minified bundles) to save tokens.
6. The raw text content of every valid source code file is fetched sequentially from GitHub.

### Step 3: Context Preparation & AI Processing
7. **Context Stuffing:** The backend orchestrator (`src/lib/ai.ts`) concatenates all the fetched code into one massive string formatted as: `File: name \n \`\`\` code \`\`\``.
8. The `ai.ts` service sequentially fires off queries to the Gemini API utilizing "Mini-Agents" housed in the `prompts` object. 
    - *Tech Stack Agent* extracts technologies.
    - *Complexity Agent* scores the code.
    - *Improvements Agent* finds bad practices.
    - *Bug/Summary Agent* detects critical issues and summarizes individual files.
9. To manage API rate limits, a `withRetry` exponentially-backed-off wrapper delays consecutive AI calls.

### Step 4: Parallel Static Analysis
10. While the AI processes the code, local background processes also inspect the code deterministically:
    - `error-analyzer.ts` scans for explicitly bad patterns (e.g., `eval()`, lingering `console.log`).
    - `improvement-analyzer.ts` checks for cyclomatic depth or files with >300 lines.
    - `version-analyzer.ts` runs a child process against the `package.json` utilizing `npm outdated` to flag deprecated modules.
    - `simple-architecture.ts` forces a manual UI structural tree generation if the AI fails to generate a valid Mermaid graph.

### Step 5: Aggregation & Presentation
11. The AI JSON strings are parsed, sanitized, and merged with the local deterministic analysis.
12. The `analyze/route.ts` API route returns this comprehensive payload back to the frontend.
13. Dashboard components (`src/components/analysis/`) parse the structured data into UI scorecards, interactive file trees, and responsive tables.

### Step 6: The Chat Interface
14. Concurrently, the massive "Context String" is passed into the Chat interface state.
15. When a user asks a question via the side-panel chat, the `src/app/api/chat/route.ts` endpoint receives the chat message alongside the *entire codebase context* and system chat prompt (also housed in `ai.ts`).
16. The model responds with highly specific, codebase-aware answers.

---

## 3. 📍 Central Location of all AI Prompts

The most crucial piece of the AI orchestration in this project is centralized in a single file to keep maintenance simple.

> [!IMPORTANT]
> **All AI System Prompts and Agent Instructions are located directly in:**
> 👉 `src/lib/ai.ts`

Inside `src/lib/ai.ts` (beginning around line 46), there is a dedicated `prompts` object handling the various "mini-agents":
- `identifyTechStack`
- `assessComplexity`
- `suggestImprovements`
- `detectBugsAndExplain`
- `generateArchitecture`
- `generateSummary`

Additionally, the overarching initial Chat instructions are hardcoded within the `chatWithCodebase` function (around line 514) in the same file.

---

## 4. Complete Directory & File Breakdown

### ⚙️ Root Configuration Files
- **`package.json`**: Defines dependencies and scripts.
- **`next.config.ts`**: Handles routing, server actions, and Next.js settings.
- **`tsconfig.json`**: TypeScript compiler configuration.
- **`.env.local`**: Holds environment variables such as the Google/Gemini API key (`GOOGLE_GENAI_API_KEY`).

### 🌐 Routing and Endpoints (`src/app/`)
- **`src/app/page.tsx`**: The main entry UI and landing page.
- **`src/app/layout.tsx`**: The global HTML layout establishing document structure, fonts, and shared headers.
- **`src/app/api/analyze/route.ts`**: The backend orchestrator for analysis pipeline (receives repo, calls Github, calls AI, returns JSON).
- **`src/app/api/chat/route.ts`**: The API route for the interactive codebase chatbot feature.

### 📚 Core Services & Logic (`src/lib/`)
- **`src/lib/ai.ts`**: **The core AI orchestrator.** Manages rate limiting for Gemini, houses prompts, triggers queries, and extracts JSON.
- **`src/lib/github.ts`**: Uses Octokit to recursively traverse file trees and fetch raw GitHub content.
- **`src/lib/error-analyzer.ts`**: Local static analyzer rule-checking for deterministic mistakes (e.g., `try/catch` wrapping, unused vars, secrets).
- **`src/lib/improvement-analyzer.ts`**: Local static analyzer inspecting function length, nesting depth, and React-specific anti-patterns like `unstable_` usages or `innerHTML`.
- **`src/lib/version-analyzer.ts`**: Extracts `package.json` info and fetches up-to-date Npm registry data to determine outdated dependencies.
- **`src/lib/simple-architecture.ts`**: Fallback mapping tool building static flowcharts without AI.
- **`src/lib/line-by-line-explainer.ts`**: A static parsing engine utilized as a fallback if AI rate limits prevent generating file explanations.

### 🖥️ Frontend Components (`src/components/`)
- **`src/components/dashboard/`**: Structure wrappers holding the analysis result views.
- **`src/components/analysis/`**: Readout components taking the AI's complex JSON responses and rendering UI visuals (Data tables, Error lists, Mermaid visualizations).
- **`src/components/chat/`**: The sliding panel UI used for conversing with the chatbot.
- **`src/components/home/` & `src/components/input/`**: Pre-analysis components like search/upload bars.

### 🎣 Hooks & 🧩 Types (`src/hooks/` & `src/types/`)
- Contains reusable React state management logic and Typescript Interface declarations enforcing strict API payloads across the entire app stack.
