import { askText } from "@/lib/llm";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as {
      question: string;
      options: string[];
      chosen: number;
      answer: number;
      sourceText: string;
    };
    const right = b.chosen === b.answer;
    const feedback = await askText(
      "You are a tutor. Use ONLY the source text provided. Do not add outside facts. Reply in 2 or 3 short sentences of plain text.",
      `SOURCE TEXT:\n${b.sourceText}\n\nQuestion: ${b.question}\nStudent chose: ${b.options[b.chosen]}\nCorrect answer: ${b.options[b.answer]}\n\n` +
        (right
          ? "Explain why the student is right."
          : "Explain why the student's choice is wrong and why the correct answer is right.")
    );
    return Response.json({ ok: true, feedback: feedback.trim() });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}