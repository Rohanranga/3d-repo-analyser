# CodeSonar Project Documentation

CodeSonar is an AI-powered codebase analysis tool built with Next.js and Google's Gemini 2.5 Flash model. It allows users to input a GitHub repository URL or upload files to automatically generate a comprehensive analysis of the code. This includes technology stack detection, complexity scoring, bug detection, improvement suggestions, architecture diagrams, and a chatbot feature to query the codebase.

## 🧠 Approach to RAG (Retrieval-Augmented Generation)

As discussed previously, CodeSonar utilizes a **"Context Stuffing"** approach rather than traditional RAG with a Vector Database.

When an analysis is requested:
1. The application fetches the source files directly from the GitHub API.
2. The contents of these files are concatenated into a single, massive string context.
3. This entire context is sent alongside specific prompts to the Gemini model in a single request.

There are **no Vector Databases** (like Pinecone or ChromaDB) and no embedding generations. It relies completely on the large context window capabilities of the Gemini 2.5 Flash model.

---

## 🤖 Where Are the AI Prompts?

**The AI Prompts are centrally located in:**
👉 `src/lib/ai.ts`

Inside this file, there is a `prompts` object that defines several "mini-agents". Each property is a function that takes the codebase context and returns the full prompt string:

- `prompts.identifyTechStack`: Asks the AI to list languages, frameworks, and tools.
- `prompts.assessComplexity`: Asks the AI to evaluate cyclomatic complexity, coupling, and provide a score.
- `prompts.suggestImprovements`: Asks the AI to do a code review and suggest actionable fixes.
- `prompts.detectBugsAndExplain`: A combined prompt to find security/logic bugs and generate a summary of what each file does.
- `prompts.generateArchitecture`: Asks the AI to generate a Mermaid.js flowchart representing the data flow.
- `prompts.generateSummary`: Asks the AI for an executive summary based on the gathered metrics.

The system prompt for the Chatbot feature is also located in `src/lib/ai.ts` inside the `chatWithCodebase` function.

---

## 📂 File Purposes and Structure

Here is a breakdown of what every key file in the `src` directory contributes to the project:

### ⚙️ API Routes (`src/app/api/`)
These act as the backend for the Next.js application.

- **`src/app/api/analyze/route.ts`**: The main entry point for the analysis. It receives the GitHub URL or file upload, calls the GitHub fetching logic, triggers the AI analysis pipeline, and returns the aggregated JSON results to the frontend.
- **`src/app/api/chat/route.ts`**: The endpoint for the interactive chat feature. It takes the chat history, user message, and codebase context, and forwards them to Gemini.

### 📚 Core Libraries & Logic (`src/lib/`)
This is where all the heavy lifting happens.

- **`src/lib/ai.ts`**: **The core AI orchestrator.** It contains all the prompts, maintains the retry/backoff logic for API rate limits, orchestrates the sequential calls to Gemini for the different analysis stages, and parses the JSON results.
- **`src/lib/github.ts`**: Handles external communication with the GitHub API via Octokit. It recursively fetches the file tree, filters out noise (like `node_modules` or images), and fetches the raw code content.
- **`src/lib/error-analyzer.ts`**: A *static analysis* tool that runs locally (without AI). It scans code for common mistakes like `console.log` leftovers, `eval()` usage, hardcoded secrets, `var` usage, missing `try/catch` in async functions, and missing semicolons.
- **`src/lib/improvement-analyzer.ts`**: Another *static analysis* tool. It scans for long functions (>50 lines), deep nesting, chained array operations, duplicated code blocks, missing React ErrorBoundaries, and XSS vulnerabilities (`innerHTML`).
- **`src/lib/simple-architecture.ts`**: Responsible for generating the Mermaid.js flowchart. It first tries to use Gemini to generate a smart workflow diagram based on the code. If that fails, it falls back to a static script that maps components, APIs, and pages sequentially.
- **`src/lib/version-analyzer.ts`**: Analyzes dependencies. It parses the `package.json`, detects frameworks/languages, and utilizes the local terminal command `npm outdated` (if available) to determine if dependencies are outdated compared to the npm registry.
- **`src/lib/explanation-generator.ts`**: Calculates a basic description of a file based on static rules (e.g., identifying React components by imports, API routes by path, or config files by extension).
- **`src/lib/line-by-line-explainer.ts`**: A more detailed parser that attempts to break down code execution logically (identifying hooks, async operations, mapping logic) without invoking the AI, acting as a fallback for file analysis.

### 🖥️ Frontend Components (`src/components/`, `src/app/`)

- **`src/app/page.tsx`**: The main landing page.
- **`src/app/layout.tsx`**: The global layout wrapper (fonts, headers, metadata).
- **`src/components/...`**: Reusable UI components for the dashboard, like the upload inputs, analysis results displays, chat interface windows, and architecture rendering components.
