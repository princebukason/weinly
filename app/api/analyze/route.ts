import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // important for OpenAI SDK on Next.js

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = body?.input;

    if (!input || typeof input !== "string") {
      return NextResponse.json(
        { error: "Missing input" },
        { status: 400 }
      );
    }

    const prompt = `
You are Weinly AI, a fabric sourcing assistant.

Your task: convert the user's fabric description into a manufacturer-ready fabric specification.

Return ONLY valid JSON with EXACTLY these keys:
{
  "fabric_type": "string",
  "intended_use": "string",
  "quality_level": "budget | mid | premium | Not specified",
  "color_or_pattern": "string",
  "weight_or_thickness": "string",
  "quantity": "string",
  "budget": "string"
}

Rules:
- If information is missing, write "Not specified"
- Do NOT invent details
- Do NOT add extra keys
- Output JSON only

User input: ${input}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || "{}";
    const result = JSON.parse(content);

    return NextResponse.json({ result });
  } catch (e: any) {
    console.error("ANALYZE ERROR:", e);
    return NextResponse.json(
      { error: e?.message || "Analyze failed" },
      { status: 500 }
    );
  }
}
