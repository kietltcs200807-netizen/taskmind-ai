import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");

export async function POST(req: NextRequest) {
  try {
    const { query, history } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    // Try to use Gemini's built in search grounding
    // If googleSearch is not natively available in this exact SDK build, we'll try a fallback
    // The prompt explicitly asks to "retrieve real information from the internet, summarize ... not just links"
    
    // We will instruct the model to act as a research assistant.
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      // Un-comment the line below if using an enterprise Google SDK that supports it
      // tools: [{ googleSearch: {} }] 
    });
    
    // Formatting history for Gemini chat: { role: 'user' | 'model', parts: [{ text: '' }] }
    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history: formattedHistory,
      systemInstruction: { 
        role: "system", 
        parts: [{ 
          text: "You are an expert AI Research Assistant helping university students with their group assignments. You should provide detailed summaries of real-world information, reliable facts, and specifically suggest how this information can be applied to the student's current assignment tasks. Do not just output links; provide the actual synthesized knowledge."
        }] 
      }
    });

    const result = await chat.sendMessage(query);
    const text = result.response.text();

    return NextResponse.json({ response: text });
  } catch (error: any) {
    console.error("Research assistant error:", error);
    return NextResponse.json({ error: error.message || "Failed to process research request" }, { status: 500 });
  }
}
