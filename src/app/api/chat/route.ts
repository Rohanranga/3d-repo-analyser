import { NextRequest, NextResponse } from "next/server";
import { chatWithCodebase } from "@/lib/ai";

export async function POST(req: NextRequest) {
    try {
        const { history, message, context } = await req.json();

        if (!message || !context) {
            return NextResponse.json({ error: "Missing message or context" }, { status: 400 });
        }

        const response = await chatWithCodebase(history || [], message, context);

        return NextResponse.json({ response });
    } catch (error) {
        console.error("Chat error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
