import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";

export async function GET() {
  try {
    if (!process.env.GROQ_API_KEY) {
      return Response.json(
        { ok: false, error: "GROQ_API_KEY is missing in .env.local" },
        { status: 500 }
      );
    }
    const { text } = await generateText({
      model: groq("openai/gpt-oss-120b"),
      prompt: "Reply with the single word: ready",
    });
    return Response.json({ ok: true, reply: text });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}