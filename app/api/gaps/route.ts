import { askJson } from "@/lib/llm";

export const maxDuration = 60;

type Body = {
  topics: { name: string; pct: number; wrong: { question: string; citation: string }[] }[];
};

export async function POST(req: Request) {
  try {
    const { topics } = (await req.json()) as Body;
    const list = topics
      .map(
        (t) =>
          `Topic: ${t.name}\nScore: ${t.pct}%\nMissed questions:\n` +
          (t.wrong.map((w) => `- ${w.question} (${w.citation})`).join("\n") || "- none")
      )
      .join("\n\n");

    // GENERATION: explain the gaps using only the quiz results (no outside facts)
    const out = await askJson<{ reasons: { topic: string; reason: string }[] }>(
      "You analyse quiz results. Use ONLY the quiz results provided. Do not add facts about the subject. Return JSON only, with no commentary.",
      `${list}\n\nFor each topic write one short sentence (at most 25 words) saying what the student is missing, based on the missed questions. Name the source section when there is one. ` +
        `Return: {"reasons":[{"topic":"exact topic name","reason":""}]}`
    );
    return Response.json({ ok: true, reasons: out.reasons });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}