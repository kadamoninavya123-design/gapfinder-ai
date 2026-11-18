import { askJson } from "@/lib/llm";
import { retrieve } from "@/lib/retrieve";
import type { Chunk } from "@/lib/chunk";
import type { Question, Topic } from "@/lib/types";

export const maxDuration = 60;

type Raw = {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  sourceId: string;
  quote: string;
};

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

const SYSTEM =
  "You write exam questions ONLY from the SOURCE MATERIAL provided. Never use outside knowledge. " +
  "If the material does not support a question, write fewer questions. Return JSON only, with no commentary.";

export async function POST(req: Request) {
  try {
    const { topics, notes } = (await req.json()) as { topics: Topic[]; notes: Chunk[] };
    const picked = [...topics].sort((a, b) => b.weight - a.weight).slice(0, 6);

    const groups = await Promise.all(
      picked.map(async (t): Promise<Question[]> => {
        // RETRIEVAL: find the sections of the notes that cover this topic
        const ctx = retrieve(t.name, notes, 3);
        if (!ctx.length) return [];
        const context = ctx.map((c) => `[${c.id}] ${c.label}\n${c.text}`).join("\n\n");
        try {
          // GENERATION: write questions from those sections only
          const out = await askJson<{ questions: Raw[] }>(
            SYSTEM,
            `Topic: ${t.name}\n\nSOURCE MATERIAL:\n${context}\n\n` +
              `Write 2 multiple-choice questions about this topic. Each has exactly 4 options and one correct answer. Vary the position of the correct answer. ` +
              `Return: {"questions":[{"question":"","options":["","","",""],"answerIndex":0,"explanation":"","sourceId":"the id in square brackets that the question came from","quote":"one sentence copied exactly from that source"}]}`
          );
          return out.questions
            .filter((q) => q.options?.length === 4 && q.answerIndex >= 0 && q.answerIndex <= 3)
            .slice(0, 2)
            .map((q, i) => {
              const c = ctx.find((x) => x.id === q.sourceId) ?? ctx[0];
              const grounded = norm(c.text).includes(norm(q.quote ?? ""));
              return {
                id: `${t.id}-${i}`,
                topicId: t.id,
                topic: t.name,
                question: q.question,
                options: q.options,
                answer: q.answerIndex,
                explanation: q.explanation,
                citation: c.label,
                quote: grounded ? q.quote : "",
                sourceText: c.text,
              };
            });
        } catch {
          return [];
        }
      })
    );

    const questions = groups.flat();
    if (!questions.length) {
      return Response.json(
        { ok: false, error: "Could not generate questions. Try again." },
        { status: 500 }
      );
    }
    return Response.json({ ok: true, questions });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}