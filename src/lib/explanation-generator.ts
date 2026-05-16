/**
 * Enhanced code explanation generator
 * Provides detailed, logic-focused explanations for code files
 */

export function generateDetailedExplanation(file: { path: string; content: string }): string {
    const lines = file.content.split('\n');
    const imports = lines.filter(l => l.trim().startsWith('import')).map(l => l.split('from')[1]?.trim().replace(/['"`]/g, '')).filter(Boolean);
    const exports = lines.filter(l => l.includes('export const') || l.includes('export function') || l.includes('export default')).map(l => {
        const parts = l.split(/\s+/);
        const idx = parts.findIndex(p => p === 'const' || p === 'function' || p === 'default');
        return parts[idx + 1]?.split('(')[0].split('=')[0];
    }).filter(Boolean);

    const hasReact = file.content.includes('import React') || file.content.includes('from "react"') || file.content.includes("from 'react'");
    const hasUseState = file.content.includes('useState');
    const hasUseEffect = file.content.includes('useEffect');
    const isComponent = hasReact && (file.content.includes('return (') || file.content.includes('return('));
    const isAPI = file.path.includes('/api/');
    const isConfig = file.path.includes('config') || file.path.endsWith('.json') || file.path.endsWith('.config.js');

    let explanation = `## 📄 What is this file?\n\n`;

    // File type description
    if (isComponent) {
        explanation += `This is a **React Component** - a reusable piece of UI that can be rendered on the page.\n\n`;
    } else if (isAPI) {
        explanation += `This is an **API Route** - handles HTTP requests and returns data or performs server-side operations.\n\n`;
    } else if (isConfig) {
        explanation += `This is a **Configuration File** - contains settings and options for the application.\n\n`;
    } else if (file.content.includes('interface') || file.content.includes('type ')) {
        explanation += `This is a **Type Definition File** - defines TypeScript types for type safety.\n\n`;
    } else {
        explanation += `This is a **Utility/Helper File** - contains reusable functions and logic.\n\n`;
    }

    // What does it do?
    explanation += `## 🎯 What does it do?\n\n`;

    // Provide specific explanations based on file type
    if (isConfig) {
        if (file.path.endsWith('package.json')) {
            explanation += `**Package Configuration:** Defines project dependencies, scripts, and metadata. Lists all npm packages needed to run the application and provides commands for building, testing, and running the project.\n\n`;
        } else if (file.path.endsWith('.json')) {
            explanation += `**Configuration Data:** Stores structured configuration data in JSON format. This data is read by the application to determine how it should behave.\n\n`;
        } else {
            explanation += `**Settings Management:** Contains configuration settings that control various aspects of the application's behavior.\n\n`;
        }
    } else if (file.path.endsWith('.md')) {
        explanation += `**Documentation:** Provides human-readable documentation about the project, features, or specific functionality. Written in Markdown format for easy reading.\n\n`;
    } else if (isComponent && hasUseState) {
        explanation += `**State Management:** This component manages its own state (data that changes over time). When state updates, the component re-renders to reflect the new data.\n\n`;
    } else if (isComponent) {
        explanation += `**UI Rendering:** This component renders user interface elements. It receives data through props and returns JSX that describes what should be displayed on screen.\n\n`;
    } else if (isAPI) {
        explanation += `**API Endpoint:** Handles HTTP requests (GET, POST, PUT, DELETE) from clients. Processes the request, interacts with databases or other services, and returns a response.\n\n`;
    }

    if (hasUseEffect) {
        explanation += `**Side Effects:** Uses useEffect to perform operations when the component mounts, updates, or unmounts (like fetching data, subscriptions, or DOM manipulation).\n\n`;
    }
    if (exports.length > 0) {
        explanation += `**Exports:** This file exports the following:\n`;
        exports.slice(0, 5).forEach(exp => {
            explanation += `- \`${exp}\`\n`;
        });
        explanation += `\n`;
    } else if (!isConfig && !file.path.endsWith('.md')) {
        // If no exports and not a config/doc file, mention it
        explanation += `**Internal Module:** This file contains internal logic that is used within the application but doesn't export any public functions or components.\n\n`;
    }

    // Dependencies
    if (imports.length > 0) {
        explanation += `## 📦 Dependencies\n\n`;
        imports.slice(0, 5).forEach(imp => {
            if (imp.startsWith('.') || imp.startsWith('@/')) {
                explanation += `- \`${imp}\` - Local project file\n`;
            } else {
                explanation += `- \`${imp}\` - External library\n`;
            }
        });
        explanation += `\n`;
    }

    // DETAILED LOGIC ANALYSIS
    explanation += `## 💡 Code Logic Breakdown\n\n`;

    // Control flow
    const hasIfElse = file.content.includes('if (') || file.content.includes('if(');
    const hasSwitch = file.content.includes('switch');
    const hasFor = file.content.includes('for (');
    const hasWhile = file.content.includes('while (');
    const hasMap = file.content.includes('.map(');
    const hasFilter = file.content.includes('.filter(');
    const hasReduce = file.content.includes('.reduce(');

    if (hasIfElse) {
        explanation += `**Conditional Logic (if/else):** The code makes decisions by checking conditions. Different code blocks execute based on whether conditions are true or false.\n\n`;
    }

    if (hasSwitch) {
        explanation += `**Switch Statements:** Handles multiple possible values efficiently using switch/case instead of multiple if/else statements.\n\n`;
    }

    if (hasFor || hasWhile) {
        explanation += `**Loops:** Iterates over data using for/while loops to perform repetitive operations.\n\n`;
    }

    if (hasMap) {
        explanation += `**Array Transformation (.map):** Transforms each element in an array and returns a new array. Example: \`[1,2,3].map(x => x*2)\` returns \`[2,4,6]\`.\n\n`;
    }

    if (hasFilter) {
        explanation += `**Array Filtering (.filter):** Creates a new array with only elements that pass a test. Example: \`[1,2,3,4].filter(x => x > 2)\` returns \`[3,4]\`.\n\n`;
    }

    if (hasReduce) {
        explanation += `**Array Reduction (.reduce):** Combines all array elements into a single value. Example: \`[1,2,3].reduce((sum, x) => sum + x, 0)\` returns \`6\`.\n\n`;
    }

    // Async patterns
    const hasAsync = file.content.includes('async ') || file.content.includes('await ');
    const hasFetch = file.content.includes('fetch(') || file.content.includes('axios');
    const hasPromiseAll = file.content.includes('Promise.all');

    if (hasAsync) {
        explanation += `**Asynchronous Operations (async/await):** Handles operations that take time (like API calls) without blocking the rest of the code. The \`await\` keyword pauses execution until the async operation completes.\n\n`;
    }

    if (hasFetch) {
        explanation += `**HTTP Requests:** Makes API calls to fetch or send data to external servers. Uses fetch() or axios to communicate with backend services.\n\n`;
    }

    if (hasPromiseAll) {
        explanation += `**Parallel Execution (Promise.all):** Runs multiple async operations simultaneously instead of one-by-one, improving performance. Waits for all operations to complete before continuing.\n\n`;
    }

    // React-specific patterns
    if (isComponent) {
        const hasOnClick = file.content.includes('onClick');
        const hasOnChange = file.content.includes('onChange');
        const hasForm = file.content.includes('<form') || file.content.includes('onSubmit');

        if (hasOnClick || hasOnChange) {
            explanation += `**Event Handling:** Responds to user interactions (clicks, typing, etc.). Event handlers are functions that run when users interact with the UI.\n\n`;
        }

        if (hasForm) {
            explanation += `**Form Handling:** Manages form submissions and input validation. Prevents default browser behavior to handle data programmatically.\n\n`;
        }

        const hasProps = file.content.includes('props') || file.content.match(/\{[^}]*\}\s*:/);
        if (hasProps) {
            explanation += `**Props (Data Flow):** Receives data from parent components. Props allow components to be reusable with different data.\n\n`;
        }
    }

    // Error handling
    const hasTryCatch = file.content.includes('try {') && file.content.includes('catch');
    if (hasTryCatch) {
        explanation += `**Error Handling (try/catch):** Catches and handles errors gracefully instead of crashing. The try block contains code that might fail, and the catch block handles any errors that occur.\n\n`;
    }

    // Code quality indicators
    explanation += `## 🔧 Code Quality\n\n`;
    const lineCount = lines.length;
    explanation += `**File Size:** ${lineCount} lines of code. `;
    if (lineCount < 50) {
        explanation += `Small and focused - easy to understand and maintain.\n\n`;
    } else if (lineCount < 150) {
        explanation += `Medium complexity - handles a complete feature.\n\n`;
    } else {
        explanation += `Large file - consider breaking into smaller modules.\n\n`;
    }

    if (hasTryCatch) {
        explanation += `✅ **Good:** Includes error handling\n`;
    }
    if (hasAsync && hasTryCatch) {
        explanation += `✅ **Good:** Async operations are wrapped in try/catch\n`;
    }

    // If no logic patterns were found, provide a helpful message
    const hasAnyLogicPattern = hasIfElse || hasSwitch || hasFor || hasWhile || hasMap || hasFilter || hasReduce || hasAsync || hasFetch || hasPromiseAll || (isComponent && (file.content.includes('onClick') || file.content.includes('onChange'))) || hasTryCatch;

    if (!hasAnyLogicPattern) {
        // Go back and add content to the Code Logic Breakdown section
        const logicSectionIndex = explanation.indexOf('## 💡 Code Logic Breakdown\n\n');
        if (logicSectionIndex !== -1) {
            const beforeLogic = explanation.substring(0, logicSectionIndex + '## 💡 Code Logic Breakdown\n\n'.length);
            const afterLogic = explanation.substring(logicSectionIndex + '## 💡 Code Logic Breakdown\n\n'.length);

            let logicContent = '';
            if (isConfig || file.path.endsWith('.md')) {
                logicContent = `This file contains ${isConfig ? 'configuration data' : 'documentation'} rather than executable code logic. It defines ${isConfig ? 'settings and options' : 'information and instructions'} in a structured format.\n\n`;
            } else {
                logicContent = `This file contains straightforward code without complex control flow patterns. The logic is simple and linear, making it easy to understand and maintain.\n\n`;
            }

            explanation = beforeLogic + logicContent + afterLogic;
        }
    }

    return explanation;
}
