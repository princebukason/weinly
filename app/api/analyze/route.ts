import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const WINDOW_MS = 10 * 60 * 1000;
const MAX_CALLS = 10;
const rateMap = new Map<string, { count: number; resetAt: number }>();

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (entry && now < entry.resetAt) {
    if (entry.count >= MAX_CALLS) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }
    entry.count += 1;
  } else {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  }

  try {
    const body = await req.json();
    const input = body?.input;

    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Missing input" }, { status: 400 });
    }
    if (input.length > 2000) {
      return NextResponse.json({ error: "Input too long. Please keep it under 2000 characters." }, { status: 400 });
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
