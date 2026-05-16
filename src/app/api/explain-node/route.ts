import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

function getModel() {
    const modelName = process.env.GOOGLE_MODEL_NAME || "gemini-2.0-flash";
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || "");
    return genAI.getGenerativeModel({ model: modelName });
}

export async function POST(req: NextRequest) {
    try {
        const { nodeType, nodeName, code, filePath, connections } = await req.json();
        const model = getModel();

        const prompt = `You are an expert code analyst inside an immersive 3D code visualization tool. A user has selected a ${nodeType} node named "${nodeName}" in file "${filePath}".

The code is:
\`\`\`
${code?.slice(0, 2000) || "No code available"}
\`\`\`

Connected to: ${connections?.join(", ") || "none"}

Provide a concise explanation in this JSON format (no markdown fences):
{
    "summary": "1-2 sentence summary of what this does",
    "purpose": "Why this exists in the codebase",
    "complexity": "Simple explanation of complexity level",
    "suggestions": ["improvement suggestion 1", "suggestion 2"],
    "risks": ["potential risk or concern"],
    "relatedConcepts": ["concept 1", "concept 2"]
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        const parsed = JSON.parse(clean);

        return NextResponse.json(parsed);
    } catch (error) {
        console.error("Node explanation error:", error);
        return NextResponse.json({
            summary: "AI explanation unavailable",
            purpose: "Could not generate explanation",
            complexity: "Unknown",
            suggestions: [],
            risks: [],
            relatedConcepts: [],
        });
    }
}
