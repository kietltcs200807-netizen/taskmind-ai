import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import nodemailer from "nodemailer";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");

export async function POST(req: NextRequest) {
  try {
    const { memberIds, roomName, tasks } = await req.json();

    if (!memberIds || memberIds.length === 0) {
      return NextResponse.json({ error: "No members specified" }, { status: 400 });
    }

    // 1. Generate Email Content using AI
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are an AI assistant helping a team leader write a professional reminder email.
      The team is working on the project: "${roomName}".
      The team members being emailed have the following pending tasks: ${JSON.stringify(tasks)}.
      
      Draft a polite but firm professional email reminding them of their tasks and deadlines.
      Return ONLY the email body. Start directly with the greeting.
    `;

    const result = await model.generateContent(prompt);
    const emailBody = result.response.text();

    // 2. Setup Nodemailer
    // Note: In production, configure proper SMTP variables (e.g. SendGrid, Resend)
    // Here we use environment variables or a fallback ethereal test account for demo
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER || "test_user",
        pass: process.env.SMTP_PASS || "test_pass",
      },
    });

    // 3. Send Emails (Simulating identifying emails from memberIds for demo purposes)
    // Normally, we'd lookup Firebase Auth or our Users collection to get the real email addresses.
    // Assuming memberIds might actually be email strings or we have a map:
    const emailsToNotify = memberIds.map((id: string) => 
      id.includes("@") ? id : `user_${id.substring(0, 5)}@example.com`
    );

    for (const email of emailsToNotify) {
      await transporter.sendMail({
        from: '"AI Team Manager" <noreply@aiteammanager.com>',
        to: email,
        subject: `Reminder: Tasks pending for ${roomName}`,
        text: emailBody,
      });
    }

    return NextResponse.json({ success: true, message: "Reminders generated and sent" });
  } catch (error: any) {
    console.error("Reminder error:", error);
    return NextResponse.json({ error: error.message || "Failed to send reminders" }, { status: 500 });
  }
}
