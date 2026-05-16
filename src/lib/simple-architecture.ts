/**
 * Dynamic Architecture Generator using Gemini AI
 * Generates unique architecture diagrams for each repository
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

function getModel(apiKey?: string) {
    const key = apiKey || process.env.GOOGLE_GENAI_API_KEY || "";
    const modelName = process.env.GOOGLE_MODEL_NAME || "gemini-2.0-flash";
    const genAI = new GoogleGenerativeAI(key);
    return genAI.getGenerativeModel({ model: modelName });
}

export async function generateArchitectureDiagram(files: Array<{ path: string; content: string }>, apiKey?: string): Promise<string> {
    try {
        const model = getModel(apiKey);
        console.log(`Starting architecture generation for ${files.length} files...`);

        // Prepare focused context - prioritize important files
        const importantFiles = files
            .filter(f => {
                const path = f.path.toLowerCase();
                return !path.includes('lock') &&
                    !path.includes('node_modules') &&
                    (path.includes('/api/') ||
                        path.includes('/lib/') ||
                        path.includes('/components/') ||
                        path.includes('page.') ||
                        path.includes('route.') ||
                        path.includes('layout.') ||
                        path.endsWith('.ts') ||
                        path.endsWith('.tsx'));
            })
            .slice(0, 30); // Limit to 30 most important files

        const context = importantFiles
            .map(f => `File: ${f.path}\n${f.content.slice(0, 1000)}`)
            .join("\n\n");

        console.log(`Analyzing ${importantFiles.length} key files (${context.length} chars)`);

        const prompt = `Analyze this codebase and create a Mermaid flowchart showing the complete workflow.

START WITH: flowchart TD

STRICT RULES — violations break the parser:
- Node labels: use ["text"] format only
- Edge labels: use |"text"| format, NEVER use parentheses () or brackets [] inside edge labels
- No special characters inside labels except letters, numbers, spaces, slashes, hyphens
- 12-16 nodes maximum

Show: user interactions, UI components, API routes, services, data flow, results.
Use actual file names and route paths from the code.

Code:
${context.slice(0, 40000)}

Example of VALID syntax:
flowchart TD
    User["👤 User"] -->|"GitHub URL"| HomePage["🖥️ page.tsx"]
    HomePage -->|"POST request"| API["⚙️ /api/analyze"]
    API -->|"fetch files"| GitHub["📦 GitHub API"]
    GitHub -->|"raw files"| Analyzer["🤖 AI Analyzer"]
    Analyzer -->|"results"| Dashboard["📊 Dashboard"]
    Dashboard -->|"display"| User

Return only valid Mermaid code, nothing else.`;

        console.log("Calling Gemini AI for architecture...");
        const result = await model.generateContent(prompt);
        const rawResponse = result.response.text();

        console.log(`Got response: ${rawResponse.length} chars`);

        const diagram = rawResponse
            .replace(/```mermaid/gi, '')
            .replace(/```/g, '')
            .trim();

        // Sanitize edge labels — remove parentheses and brackets inside |"..."| which break Mermaid parser
        const sanitized = diagram
            .replace(/\|"([^"]+)"\|/g, (_, label) =>
                `|"${label.replace(/[()[\]{}]/g, '').trim()}"|`
            )
            // Also handle unquoted labels
            .replace(/\|([^|">\n]+)\|/g, (_, label) =>
                `|"${label.replace(/[()[\]{}]/g, '').trim()}"|`
            );

        if (sanitized.length < 50) {
            throw new Error("Generated diagram too short");
        }

        console.log("Architecture generated successfully!");
        return sanitized;

    } catch (error) {
        console.error("Architecture generation failed:", error);
        // Use the dynamic fallback that generates a diagram from the file list
        return generateSimpleArchitectureDiagram(files);
    }
}

// Synchronous fallback that dynamically generates based on file list
export function generateSimpleArchitectureDiagram(files: Array<{ path: string }>): string {
    console.log("⚠️ Generative dynamic fallback architecture");

    const components = files.filter(f => f.path.includes('/components/')).slice(0, 5);
    const pages = files.filter(f => f.path.includes('page.tsx') || f.path.includes('page.js'));
    const apiRoutes = files.filter(f => f.path.includes('/api/') || f.path.includes('route.ts'));
    const libs = files.filter(f => f.path.includes('/lib/') || f.path.includes('/utils/') || f.path.includes('/services/')).slice(0, 5);
    const styles = files.filter(f => f.path.endsWith('.css'));

    let diagram = `flowchart TD\n`;
    diagram += `    User["👤 User"]\n`;

    // 1. Pages Layer
    if (pages.length > 0) {
        diagram += `    subgraph UI ["🖥️ User Interface"]\n`;
        pages.forEach((p, i) => {
            const name = p.path.split('/').slice(-2, -1)[0] || 'Home';
            const node = `Page${i}`;
            diagram += `        ${node}["📄 ${name}"]\n`;
            if (i === 0) diagram += `        User --> ${node}\n`;
        });
        diagram += `    end\n`;
    } else {
        diagram += `    User --> App["🖥️ Application"]\n`;
    }

    // 2. Components Layer
    if (components.length > 0) {
        diagram += `    subgraph Components ["🧩 Components"]\n`;
        components.forEach((c, i) => {
            const name = c.path.split('/').pop()?.split('.')[0] || 'Comp';
            const node = `Comp${i}`;
            diagram += `        ${node}["🧱 ${name}"]\n`;
            // Link Pages to Components (Approximation)
            diagram += `        Page0 -.-> ${node}\n`;
        });
        diagram += `    end\n`;
    }

    // 3. API/Backend Layer
    if (apiRoutes.length > 0) {
        diagram += `    subgraph API ["⚙️ API Layer"]\n`;
        apiRoutes.forEach((r, i) => {
            const name = r.path.includes('/api/')
                ? r.path.split('/api/')[1].split('/')[0]
                : 'Route';
            const node = `API${i}`;
            diagram += `        ${node}["🔌 /api/${name}"]\n`;
            diagram += `        Page0 --> ${node}\n`;
        });
        diagram += `    end\n`;
    }

    // 4. Lib/Service Layer
    if (libs.length > 0) {
        diagram += `    subgraph Lib ["📚 Core Logic"]\n`;
        libs.forEach((l, i) => {
            const name = l.path.split('/').pop()?.split('.')[0] || 'Lib';
            const node = `Lib${i}`;
            diagram += `        ${node}["🛠️ ${name}"]\n`;
            // Connect API to Libs
            if (apiRoutes.length > 0) diagram += `        API0 --> ${node}\n`;
            // Connect UI to Libs if no API
            else if (pages.length > 0) diagram += `        Page0 --> ${node}\n`;
        });
        diagram += `    end\n`;
    }

    // 5. Stylings
    if (styles.length > 0) {
        diagram += `    subgraph Styles ["🎨 Styles"]\n`;
        styles.forEach((s, i) => {
            const name = s.path.split('/').pop();
            diagram += `        Style${i}["💅 ${name}"]\n`;
        });
        diagram += `    end\n`;
    }

    // Fallback if no structure detected
    if (pages.length === 0 && components.length === 0 && apiRoutes.length === 0) {
        diagram += `    User --> Code["📂 Source Code"]\n`;
        diagram += `    Code --> Logic["⚙️ Logic"]\n`;
    }

    // Styling
    diagram += `    style User fill:#333,stroke:#fff,stroke-width:2px,color:#fff\n`;

    return diagram;
}
