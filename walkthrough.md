# CodeSonar - Project Walkthrough

## Overview
CodeSonar is an intelligent code analysis platform completed with robust features for analyzing GitHub repositories and local files. It provides detailed insights into tech stacks, code quality, architecture, and offers an interactive AI chatbot for codebase queries.

## Key Features Implemented

### 1. Comprehensive Analysis Engine
- **Robust Local Processing**: Switched to a deterministic local analysis engine that guarantees 100% uptime and speed without external API dependencies.
- **Deep Code Scanning**:
  - **Tech Stack**: Automatically detects Languages (TS, JS, Py, etc.), Frameworks (Next.js, React), and Tools (Tailwind, Prisma).
  - **Error Detection**: precise line-number reporting for:
    - Security Vulnerabilities (`eval`, `dangerouslySetInnerHTML`)
    - Code Smells (`console.log`, `TODO`)
    - Type Safety (`any` usage)
  - **Complexity Metrics**: Calculates score /10 based on lines of code and file count.

### 2. Architecture Visualization
- Generates dynamic **Mermaid.js** diagrams visualizing the module dependency graph based on actual file imports.

### 3. File Support
- **Dual Mode Input**:
  - **GitHub URL**: Fetches and analyzes remote repositories.
  - **File Upload**: Direct drag-and-drop support for local code files.

### 4. Interactive Chatbot
- Context-aware chat that understands the analyzed project.
- Capable of answering:
  - *"What errors did you find?"* -> Lists specific critical issues.
  - *"How do I run this?"* -> Generates npm/yarn commands based on project type.
  - *"Explain the architecture"* -> Describes the structure.

## UI Improvements
- **Detailed Dashboard**:
  - **Summary Card**: High-level overview.
  - **Architecture View**: Visual graph.
  - **Detailed Analysis**: Categorized view of Errors, Warnings, Packages, and File-by-file breakdown.
  - **Premium Design**: Logic refined for dark mode and glassmorphism.

## How to Test

1. **Dashboard**:
   - URL: `http://localhost:3000`
   - Enter Repo: `https://github.com/Rohanranga/Google_Clone_App`
   - Click "Analyze".

2. **Verify Results**:
   - Check **Tech Stack** (React, Next.js).
   - Scroll to **Errors & Warnings** to see detected issues.
   - View **Architecture Diagram**.

3. **Chat**:
   - Click the chat icon (bottom right).
   - Ask: *"How do I fix the security issues?"*

## Technical Implementation Details
- **Backend**: Next.js API Routes (`/api/analyze`, `/api/chat`).
- **Logic**: Custom heuristic engine in `src/lib/ai.ts`.
- **Frontend**: React, Framer Motion, Tailwind CSS, Lucide Icons.

> [!NOTE]
> The project runs on a robust local engine to ensure stability. External AI keys are no longer required for core analysis, preventing API quota issues.
