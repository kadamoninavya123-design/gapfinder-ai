import type { Chunk } from "./chunk";

const STOP = new Set([
  "the", "and", "for", "with", "that", "this", "from", "are", "was", "were",
  "into", "what", "which", "how", "why", "does", "did", "has", "have", "its",
  "their", "than", "then", "these", "those", "each", "about", "explain",
  "describe", "define", "state", "compare", "marks", "mark", "work", "out", "role",
]);

export function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => w.replace(/([^s])s$/, "$1"));
}

export function bm25(query: string, texts: string[]): number[] {
  const docs = texts.map(tokens);
  const N = docs.length;
  if (!N) return [];
  const avg = docs.reduce((a, d) => a + d.length, 0) / N || 1;
  const df = new Map<string, number>();
  docs.forEach((d) => new Set(d).forEach((t) => df.set(t, (df.get(t) ?? 0) + 1)));
  const q = Array.from(new Set(tokens(query)));

  return docs.map((d) => {
    const tf = new Map<string, number>();
    d.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
    let s = 0;
    for (const t of q) {
      const f = tf.get(t) ?? 0;
      if (!f) continue;
      const n = df.get(t) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      s += (idf * f * 2.2) / (f + 1.2 * (0.25 + (0.75 * d.length) / avg));
    }
    return s;
  });
}

export function retrieve(query: string, chunks: Chunk[], k = 3): Chunk[] {
  const scores = bm25(query, chunks.map((c) => c.label + " " + c.text));
  return chunks
    .map((c, i) => ({ c, s: scores[i] }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map((x) => x.c);
}