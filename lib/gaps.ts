import type { Attempt, Topic } from "./types";

export type Status = "weak" | "medium" | "strong" | "untested";

export type Gap = {
  topic: Topic;
  pct: number | null;
  first: number | null;
  status: Status;
  tested: number;
  wrong: { question: string; citation: string }[];
};

export const COLOR: Record<Status, string> = {
  weak: "#ff6b6b",
  medium: "#f6b94c",
  strong: "#4fd1a1",
  untested: "#8e99b0",
};

export const LABEL: Record<Status, string> = {
  weak: "Weak",
  medium: "Medium",
  strong: "Strong",
  untested: "Not tested",
};

export const statusOf = (pct: number | null): Status =>
  pct === null ? "untested" : pct < 40 ? "weak" : pct < 70 ? "medium" : "strong";

const score = (a: Attempt, id: string) => {
  const r = a.results.filter((x) => x.topicId === id);
  return r.length ? Math.round((r.filter((x) => x.correct).length / r.length) * 100) : null;
};

export function computeGaps(topics: Topic[], attempts: Attempt[]): Gap[] {
  return topics.map((t) => {
    const withTopic = attempts.filter((a) => a.results.some((r) => r.topicId === t.id));
    const latest = withTopic[withTopic.length - 1];
    const first = withTopic[0];
    const r = latest ? latest.results.filter((x) => x.topicId === t.id) : [];
    const pct = latest ? score(latest, t.id) : null;
    return {
      topic: t,
      pct,
      first: first ? score(first, t.id) : null,
      status: statusOf(pct),
      tested: r.length,
      wrong: r
        .filter((x) => !x.correct)
        .map((x) => ({ question: x.question ?? "", citation: x.citation ?? "" })),
    };
  });
}

// How urgent a topic is: how weak it is, multiplied by how often it appears in past papers.
export const priority = (g: Gap) =>
  (g.pct === null ? 50 : 100 - g.pct) * (1 + g.topic.weight);

export const defaultReason = (g: Gap) =>
  g.pct === null
    ? "Not covered by a quiz yet."
    : g.wrong.length
    ? `You missed ${g.wrong.length} of ${g.tested} questions on this topic.`
    : `You answered all ${g.tested} questions correctly.`;