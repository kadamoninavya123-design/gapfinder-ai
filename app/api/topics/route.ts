import { askJson } from "@/lib/llm";
import { bm25, retrieve } from "@/lib/retrieve";
import type { Material, Topic } from "@/lib/types";

export const maxDuration = 60;

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function POST(req: Request) {
  try {
    const { syllabus, notes, papers } = (await req.json()) as Material;
    if (!syllabus?.length) {
      return Response.json({ ok: false, error: "Upload a syllabus first." }, { status: 400 });
    }

    // GENERATION: read topic names from the syllabus text only
    const text = syllabus.map((c) => `${c.label}\n${c.text}`).join("\n\n").slice(0, 6000);
    const out = await askJson<{ topics: { name: string; unit?: string }[] }>(
      "You read a syllabus and list its topics. Use ONLY the syllabus text. Return JSON only, with no commentary.",
      `SYLLABUS:\n${text}\n\nReturn: {"topics":[{"name":"short topic name","unit":"unit or chapter it belongs to"}]} with at most 15 topics.`
    );
    const base = out.topics.slice(0, 15);

    // RETRIEVAL: build a searchable description of each topic from the notes
    const docs = base.map(
      (t) => t.name + " " + retrieve(t.name, notes ?? [], 2).map((c) => c.text).join(" ")
    );
    const topics: Topic[] = base.map((t) => ({
      id: slug(t.name),
      name: t.name,
      unit: t.unit || "General",
      weight: 0,
      questions: [],
    }));

    // RETRIEVAL: match each past-paper question to its best topic
    const qs = (papers ?? []).flatMap((c) =>
      c.text
        .split(/(?=\bQ?\d{1,2}[.)]\s)/)
        .map((s) => s.trim())
        .filter((s) => s.length > 15)
    );
    for (const q of qs) {
      const scores = bm25(q, docs);
      const best = scores.indexOf(Math.max(...scores));
      if (best >= 0 && scores[best] > 0) {
        topics[best].weight++;
        topics[best].questions.push(q);
      }
    }
    return Response.json({ ok: true, topics });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}