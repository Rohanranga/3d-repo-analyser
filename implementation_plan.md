# Implementation Plan - Project Completion & Real AI Integration

This plan transitions CodeSonar from a mock prototype to a fully functional AI-powered code analysis tool using the Google Generative AI SDK (Gemini 1.5 Pro).

## User Review Required
> [!IMPORTANT]
> This requires a valid `GOOGLE_GENAI_API_KEY` in `.env.local`. Ensure your environment variable is set correctly.

## Proposed Changes

### 1. Analysis Engine (Backend)
Transition from Genkit/Mock to `@google/generative-ai`.

#### [MODIFY] [src/lib/ai.ts](file:///r:/codesonar/src/lib/ai.ts)
- Replace mock `analyzeCodebase` with real call to `model.generateContent`.
- Implement robust prompt engineering to extract:
  - Tech Stack (Languages, Frameworks, Tools)
  - Complexity Score & Analysis
  - Architecture (Mermaid.js graph)
  - Detailed Errors & Fixes (with line numbers)
  - Code Quality Recommendations
- Using `responseMimeType: "application/json"` for structured output.

#### [MODIFY] [src/app/api/analyze/route.ts](file:///r:/codesonar/src/app/api/analyze/route.ts)
- Update to handle large payloads (for file uploads).
- Integrate the new `analyzeCodebase` function.
- Add error handling for token limits (Gemini 1.5 Pro has a large context window, but we should be mindful).

### 2. Chat System
Enable context-aware chat about the specific codebase.

#### [MODIFY] [src/app/api/chat/route.ts](file:///r:/codesonar/src/app/api/chat/route.ts)
- Pass the analysis context (summary, architecture, issues) to the system prompt.
- Use Gemini for conversational answers.

### 3. Frontend / UI
Ensure data is displayed correctly and file uploads work.

#### [MODIFY] [src/components/input/RepoInput.tsx](file:///r:/codesonar/src/components/input/RepoInput.tsx)
- Enable file reader for "Upload File" tab.
- Send file content to the analyze API.

#### [MODIFY] [src/components/dashboard/AnalysisDashboard.tsx](file:///r:/codesonar/src/components/dashboard/AnalysisDashboard.tsx)
- Verify `DetailedAnalysis` rendering.
- Ensure loading states are accurate.

## Verification Plan

### Automated Tests
- N/A (Project does not have a test suite set up yet).

### Manual Verification
1. **Repository Analysis**:
   - Input `https://github.com/Rohanranga/Google_Clone_App`.
   - Verify "Tech Stack" shows React/Next.js.
   - Verify "Errors" list actual code issues (e.g., missing keys, console.logs).
   - Verify "Architecture" renders a valid graph.
   
2. **File Analysis**:
   - Paste a single complex file (e.g., a React component).
   - Verify it analyzes just that file.

3. **Chat**:
   - Ask "How do I fix the errors?" and verify it references the specific errors found.
