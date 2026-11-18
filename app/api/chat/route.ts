import { streamText } from "ai";
import { groq } from "@ai-sdk/groq";
import { MODEL } from "@/lib/llm";
import { retrieve } from "@/lib/retrieve";
import type { Chunk } from "@/lib/chunk";

export const maxDuration = 60;

type Msg = { role: "user" | "assistant"; content: string };

const SYSTEM =
  "You are a study tutor. Answer ONLY from the SOURCES provided. Never use outside knowledge. " +
  "Cite every claim with its tag in square brackets, like [S1] or [S2]. " +
  "If the sources do not contain the answer, say you cannot find it in the student's material. " +
    "Keep the answer short and clear, and explain simply. " +
  "Do not expand abbreviations or add any detail that is not written in the sources.";

export async function POST(req: Request) {
  try {
    const { messages, notes } = (await req.json()) as { messages: Msg[]; notes: Chunk[] };

    const users = messages.filter((m) => m.role === "user");
    const last = users[users.length - 1]?.content ?? "";
    const prev = users[users.length - 2]?.content ?? "";
    // short follow-ups like "why?" borrow the previous question for searching
    const query = last.split(/\s+/).length < 5 ? `${prev} ${last}` : last;

    // RETRIEVAL: find the best sections of the student's notes (no AI involved)
    const ctx = retrieve(query, notes ?? [], 4);
    const sources = ctx.map((c, i) => ({ tag: `S${i + 1}`, label: c.label }));
    const headers = { "x-sources": encodeURIComponent(JSON.stringify(sources)) };

    // GUARD: nothing relevant found, so the model is never called
    if (!ctx.length) {
      return new Response(
        "I can't find that in your uploaded material. Try a topic from your syllabus, or upload notes that cover it.",
        { headers: { ...headers, "content-type": "text/plain; charset=utf-8" } }
      );
    }

    // GENERATION: the model sees only the retrieved sections
    const context = ctx.map((c, i) => `[S${i + 1}] ${c.label}\n${c.text}`).join("\n\n");
    const result = streamText({
      model: groq(MODEL),
      system: `${SYSTEM}\n\nSOURCES:\n${context}`,
      messages: messages.slice(-6),
    });
    return result.toTextStreamResponse({ headers });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}