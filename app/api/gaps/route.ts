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

    // GENERATION: summarise the quiz results only. No subject facts are allowed.
    const out = await askJson<{ reasons: { topic: string; reason: string }[] }>(
      "You summarise quiz results. Use ONLY the quiz results provided. " +
        "Do NOT state any fact about the subject, and do not use any term that is not in the missed question text. " +
        "Return JSON only, with no commentary.",
      `${list}\n\nFor each topic write one short sentence (at most 25 words) saying which question the student missed and which source section to re-read. ` +
        `Describe the gap only in the words of the missed question. ` +
        `Example: "You missed the question about where the cycle takes place; re-read Biology_notes.txt › Calvin cycle." ` +
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