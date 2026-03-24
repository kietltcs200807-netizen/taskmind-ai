import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
// Temporarily using admin sdk or direct direct imports. 
// However, since we are in a serverless function, we should ideally use firebase-admin.
// But for simplicity of this demo, we'll try to fetch members using our client/server generic config if possible, 
// or since this is just an API, actually the Leader triggers it.
// To keep it perfectly synchronized without admin sdk, we'll rely on the client db rules, but server routes need admin.
// Wait, the Next.js API route runs on server. We cannot use `firebase/firestore` easily without auth context on server.
// For the sake of this prompt, let's keep the API simple: just parsing the document and returning JSON, 
// and the CLIENT will save it to Firestore to maintain proper auth context.

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");

export async function POST(req: NextRequest) {
  try {
    const { documentUrl, members } = await req.json();

    if (!documentUrl || !members || members.length === 0) {
      return NextResponse.json({ error: "Missing documentUrl or members list" }, { status: 400 });
    }

    // 1. Fetch file from URL
    const fileRes = await fetch(documentUrl);
    const arrayBuffer = await fileRes.arrayBuffer();
    
    // For simplicity, assuming text files are uploaded for now, or we just extract raw text if possible.
    // If it's a PDF, we'd use pdf-parse.
    let text = "";
    if (documentUrl.includes(".pdf") || documentUrl.includes("application%2Fpdf")) {
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(Buffer.from(arrayBuffer));
      text = data.text;
    } else {
      text = Buffer.from(arrayBuffer).toString("utf-8");
    }

    if (text.length > 50000) {
      text = text.substring(0, 50000); // Truncate very long documents
    }

    // 2. Build AI Prompt
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      Analyze the following academic/project assignment document and intelligently divide the work into actionable tasks.
      There are ${members.length} team members. Assign these tasks fairly among them using their IDs.
      Member IDs: ${members.join(", ")}
      
      The output MUST be a valid JSON array where each object has:
      - title: Short, concise task name
      - description: More detailed description of what needs to be done based on the assignment
      - assigneeId: One of the Member IDs provided above
      - deadline: A suggested deadline in YYYY-MM-DD format (e.g. 7 days from now)

      Document Content:
      ${text}

      Output only the JSON array with no markdown formatting or backticks.
    `;

    const result = await model.generateContent(prompt);
    let aiText = result.response.text().trim();
    
    // Clean up potential markdown blocks
    if (aiText.startsWith("```json")) aiText = aiText.substring(7);
    if (aiText.startsWith("```")) aiText = aiText.substring(3);
    if (aiText.endsWith("```")) aiText = aiText.substring(0, aiText.length - 3);

    const generatedTasks = JSON.parse(aiText);

    return NextResponse.json({ tasks: generatedTasks });
  } catch (error: any) {
    console.error("Task generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate tasks" }, { status: 500 });
  }
}
