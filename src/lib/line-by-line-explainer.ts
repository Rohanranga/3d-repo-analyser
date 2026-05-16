/**
 * Enhanced line-by-line code explanation generator
 * Provides COMPREHENSIVE, DETAILED explanations for beginners
 */

export function generateLineByLineExplanation(file: { path: string; content: string }): string {
    const lines = file.content.split('\n');
    let explanation = `# 📄 Complete Code Analysis\n\n`;

    // File type identification
    const isConfig = file.path.endsWith('.json') || file.path.includes('config');
    const isMarkdown = file.path.endsWith('.md');
    const isTypeScript = file.path.endsWith('.ts') || file.path.endsWith('.tsx');
    const isJavaScript = file.path.endsWith('.js') || file.path.endsWith('.jsx');
    const isCSS = file.path.endsWith('.css') || file.path.endsWith('.scss');
    const isReact = file.content.includes('import React') || file.content.includes('from "react"') || file.content.includes("from 'react'");

    // File overview
    explanation += `## 🎯 File Overview\n\n`;
    explanation += `**File:** \`${file.path}\`\n`;
    explanation += `**Type:** `;

    if (isConfig) {
        explanation += `Configuration File\n`;
        explanation += `**Purpose:** Stores settings and configuration data for the application\n\n`;
    } else if (isMarkdown) {
        explanation += `Documentation File\n`;
        explanation += `**Purpose:** Contains documentation, instructions, or explanations in Markdown format\n\n`;
    } else if (file.path.includes('page.tsx')) {
        explanation += `Next.js Page Route\n`;
        explanation += `**Purpose:** Defines a unique public route (URL) in the application. Everything exported here is accessible via the browser.\n\n`;
    } else if (file.path.includes('layout.tsx')) {
        explanation += `Next.js Layout\n`;
        explanation += `**Purpose:** Wraps all pages in this directory and below. Used for persistent UI like Headers, Sidebars, and Fonts.\n\n`;
    } else if (file.path.includes('route.ts')) {
        explanation += `API Route Handler\n`;
        explanation += `**Purpose:** Server-side logic (GET, POST requests). Acts like a backend API endpoint.\n\n`;
    } else if (isReact) {
        explanation += `React Component\n`;
        explanation += `**Purpose:** A reusable UI component that renders part of the user interface\n\n`;
    } else if (isTypeScript || isJavaScript) {
        explanation += `${isTypeScript ? 'TypeScript' : 'JavaScript'} Module\n`;
        explanation += `**Purpose:** Contains code logic and functionality\n\n`;
    } else if (isCSS) {
        explanation += `Stylesheet\n`;
        explanation += `**Purpose:** Defines visual styling (colors, layouts, animations)\n\n`;
    }

    // For JSON files
    if (isConfig && file.path.endsWith('.json')) {
        try {
            const jsonData = JSON.parse(file.content);
            explanation += `## 📦 Configuration Structure\n\n`;
            explanation += `This JSON file contains ${Object.keys(jsonData).length} configuration sections:\n\n`;

            Object.keys(jsonData).forEach((key, index) => {
                const value = jsonData[key];
                explanation += `### ${index + 1}. \`${key}\`\n\n`;

                if (key === 'name') {
                    explanation += `- **What it is:** The project/package name\n`;
                    explanation += `- **Value:** "${value}"\n`;
                    explanation += `- **Why it matters:** Identifies this project uniquely\n\n`;
                } else if (key === 'version') {
                    explanation += `- **What it is:** Current version number\n`;
                    explanation += `- **Value:** ${value}\n`;
                    explanation += `- **Format:** Usually follows semantic versioning (MAJOR.MINOR.PATCH)\n\n`;
                } else if (key === 'dependencies') {
                    explanation += `- **What it is:** External packages this project needs to run\n`;
                    explanation += `- **Count:** ${Object.keys(value).length} dependencies\n`;
                    explanation += `- **Why it matters:** These must be installed for the app to work\n\n`;
                } else if (key === 'devDependencies') {
                    explanation += `- **What it is:** Packages needed only during development\n`;
                    explanation += `- **Count:** ${Object.keys(value).length} dev dependencies\n`;
                    explanation += `- **Why it matters:** Used for building, testing, and development\n\n`;
                } else if (key === 'scripts') {
                    explanation += `- **What it is:** Commands you can run with npm/yarn\n`;
                    explanation += `- **Available commands:** ${Object.keys(value).length}\n`;
                    explanation += `- **Usage:** Run with \`npm run <script-name>\`\n\n`;
                } else {
                    explanation += `- **Type:** ${typeof value}\n`;
                    if (typeof value === 'object' && value !== null) {
                        explanation += `- **Contains:** ${Object.keys(value).length} items\n\n`;
                    } else {
                        explanation += `- **Value:** ${JSON.stringify(value).substring(0, 100)}\n\n`;
                    }
                }
            });
        } catch (e) {
            explanation += `This appears to be a configuration file with structured data.\n\n`;
        }
        return explanation;
    }

    // For Markdown files
    if (isMarkdown) {
        explanation += `## 📝 Documentation Content\n\n`;
        explanation += `This Markdown file contains:\n\n`;

        const hasHeaders = file.content.includes('#');
        const hasLinks = file.content.includes('[') && file.content.includes('](');
        const hasCode = file.content.includes('```');
        const hasLists = file.content.includes('- ') || file.content.includes('* ');

        if (hasHeaders) explanation += `- ✅ **Headers** - Organized sections and titles\n`;
        if (hasLinks) explanation += `- ✅ **Links** - References to other resources\n`;
        if (hasCode) explanation += `- ✅ **Code blocks** - Example code snippets\n`;
        if (hasLists) explanation += `- ✅ **Lists** - Organized information\n`;

        explanation += `\n**Purpose:** Documentation to help users understand and use the project\n\n`;
        return explanation;
    }

    // --- 🔍 Analysis Phase ---
    const imports = lines.filter(l => l.trim().startsWith('import '));
    const functionLines = lines.filter(l => {
        const t = l.trim();
        return t.startsWith('function ') || t.startsWith('export function ') ||
            t.startsWith('async function ') || (t.startsWith('const ') && t.includes('= (')) ||
            (t.startsWith('export const ') && t.includes('= ('));
    });
    const varLines = lines.filter(l => {
        const t = l.trim();
        return (t.startsWith('const ') || t.startsWith('let ') || t.startsWith('var ')) && !t.includes('= (');
    });
    const hasAsyncAwait = file.content.includes('async') && file.content.includes('await');

    // Enhanced Analysis Logic
    explanation += `## 🔍 Deep Code Analysis\n\n`;

    // 1. Core Logic Flow
    explanation += `### 🧠 Logic Flow\n`;
    explanation += `This file follows a structured flow:\n`;
    if (imports.length > 0) explanation += `1. **Initialization**: Imports necessary dependencies (${imports.length} modules).\n`;
    if (varLines.length > 0) explanation += `2. **State/Config**: Defines ${varLines.length} variables and constants.\n`;
    if (functionLines.length > 0) explanation += `3. **Execution**: Defines ${functionLines.length} major functions that handle the core logic.\n`;
    if (lines.some(l => l.includes('export default'))) explanation += `4. **Export**: Exposes the main functionality for other files to use.\n`;
    explanation += `\n`;

    // 2. Key Concepts Explained
    explanation += `### 🔑 Key Concepts\n\n`;

    if (isReact) {
        explanation += `#### **Component Architecture**\n`;
        explanation += `This is a **Functional Component**. Unlike older Class components, it uses **Hooks** to manage logic. \n`;
        explanation += `Think of it as a function that takes inputs (Props) and returns a UI (JSX).\n\n`;
    }

    if (hasAsyncAwait) {
        explanation += `#### **Asynchronous Operations**\n`;
        explanation += `The code uses \`async/await\`. This is crucial for performance. instead of blocking the whole app while waiting for a database or API, it lets the browser run other tasks and comes back when the data is ready.\n\n`;
    }

    if (file.content.includes('map(')) {
        explanation += `#### **List Rendering**\n`;
        explanation += `The \`.map()\` function is used to transform arrays into UI elements. This is how lists of items (like products, posts, or messages) are efficiently displayed on screen.\n\n`;
    }

    // 3. Line-by-Line Breakdown (Major Blocks)
    explanation += `### 📝 Step-by-Step Code Walkthrough\n\n`;

    let stepCount = 1;
    let inInterface = false;
    let inComponent = false;

    lines.forEach((line, i) => {
        const t = line.trim();
        const lineNum = i + 1;

        if (!t || t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')) return;

        // Detect Step: Imports
        if (t.startsWith('import ')) {
            // Only show the first import or significant ones to avoid clutter, 
            // but user wants COMPLETE detail, so let's summarize blocks if consecutive.
            const isFirstImport = lines[i - 1]?.trim().startsWith('import ') === false;
            if (isFirstImport) {
                explanation += `#### **Step ${stepCount++}: Importing Dependencies**\n`;
                explanation += `*Line ${lineNum}*: The code starts by importing necessary external libraries and local modules.\n`;
            }
            return;
        }

        // Detect Step: Interfaces/Types
        if (t.startsWith('interface ') || t.startsWith('type ')) {
            const name = t.split(' ')[1];
            inInterface = true;
            explanation += `#### **Step ${stepCount++}: Defining Data Types**\n`;
            explanation += `*Line ${lineNum}*: We define a strict structure for \`${name}\`. This ensures that data passed around matches exactly what we expect (Type Safety).\n`;
            return;
        }

        // Detect Step: Main Component Declaration
        if (t.match(/export\s+(default\s+)?function\s+\w+/) || t.match(/const\s+\w+\s*=\s*(async\s*)?\([^)]*\)\s*=>/)) {
            const funcName = t.split('(')[0].replace(/export\s+default\s+function\s+|export\s+function\s+|function\s+|const\s+|export\s+const\s+/g, '').replace('=', '').trim();
            inComponent = true;
            explanation += `#### **Step ${stepCount++}: Defining the Logic Container \`${funcName}\`**\n`;
            explanation += `*Line ${lineNum}*: This is where the main functionality begins. Everything inside the \`{ ... }\` belongs to this unit.\n`;
            if (isReact) explanation += `For a React component, this function will run every time the component needs to re-render.\n`;
            return;
        }

        // Detect Step: Hooks (UseState, UseEffect)
        if (t.startsWith('const [') && t.includes('useState')) {
            const stateVar = t.split('[')[1].split(',')[0];
            explanation += `#### **Step ${stepCount++}: Initializing State \`${stateVar}\`**\n`;
            explanation += `*Line ${lineNum}*: We create a memory box called \`${stateVar}\`. When this value changes, the component will automatically update to show the new data.\n`;
            return;
        }

        if (t.startsWith('useEffect')) {
            explanation += `#### **Step ${stepCount++}: Setting up Side Effects**\n`;
            explanation += `*Line ${lineNum}*: This block tells React to "do something after the component paints". Use cases: Fetching data, setting up timers, or listening to mouse events.\n`;
            return;
        }

        // Detect Step: Return Statement (JSX)
        if (t.startsWith('return (') || (t.startsWith('return') && t.includes('<'))) {
            explanation += `#### **Step ${stepCount++}: Rendering the Output**\n`;
            explanation += `*Line ${lineNum}*: Finally, the function returns the layout (HTML/JSX) that the user will actually see on the screen.\n`;
            return;
        }

        // Detect Step: API Call
        if (t.includes('fetch(') || t.includes('axios.') || t.includes('.get(')) {
            explanation += `#### **Step ${stepCount++}: Fetching External Data**\n`;
            explanation += `*Line ${lineNum}*: The code reaches out to an external server (API) to get fresh data.\n`;
            return;
        }
    });

    explanation += `\n### 💡 Usage & Context\n`;
    explanation += `**How to use this component:**\n`;
    if (file.path.includes('page.tsx')) {
        explanation += `This is a **Page**. You don't import it; you visit it in your browser. The URL depends on the folder name (e.g., \`src/app/about/page.tsx\` -> \`/about\`).\n`;
    } else if (file.path.includes('components/')) {
        explanation += `This is a **Reusable Component**. You import it into a Page or another Component like this:\n`;
        const componentName = file.path.split('/').pop()?.split('.')[0] || 'Component';
        explanation += `\`\`\`tsx\nimport { ${componentName} } from "@/components/${componentName}";\n\n<${componentName} />\n\`\`\`\n`;
    } else {
        explanation += `This is a **Utility Module**. You import specific functions from it when you need this logic.\n`;
    }

    explanation += `\n**Why is this code important?**\n`;
    explanation += `It solves the problem of *${isReact ? 'presenting data to the user' : 'handling business logic'}* in the \`${file.path.split('/').slice(-2).join('/')}\` part of the application.\n`;

    return explanation;
}
