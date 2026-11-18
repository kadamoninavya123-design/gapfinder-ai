"use client";
import { useEffect, useState } from "react";
import { KEYS, load, save } from "@/lib/store";
import { COLOR, LABEL, computeGaps, defaultReason, priority, type Status } from "@/lib/gaps";
import type { Attempt, Topic } from "@/lib/types";

type Cache = { attemptId: number; map: Record<string, string> };

export default function GapReport() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = load<Topic[]>(KEYS.topics, []);
    const a = load<Attempt[]>(KEYS.attempts, []);
    setTopics(t);
    setAttempts(a);
    setReady(true);
    if (!a.length) return;

    const latest = a[a.length - 1];
    const cache = load<Cache | null>(KEYS.reasons, null);
    if (cache && cache.attemptId === latest.id) {
      setReasons(cache.map);
      return;
    }
    const need = computeGaps(t, a).filter((g) => g.pct !== null && g.status !== "strong");
    if (!need.length) return;

    setLoading(true);
    fetch("/api/gaps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topics: need.map((g) => ({ name: g.topic.name, pct: g.pct, wrong: g.wrong })),
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) return;
        const map: Record<string, string> = {};
        (d.reasons as { topic: string; reason: string }[]).forEach((x) => (map[x.topic] = x.reason));
        setReasons(map);
        save(KEYS.reasons, { attemptId: latest.id, map });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!ready) return null;
  if (!attempts.length) {
    return (
      <p className="mt-6 text-slate-300">
        No quiz results yet. Take the diagnostic quiz first, then come back to see your gaps.
      </p>
    );
  }

  const gaps = computeGaps(topics, attempts).sort((a, b) => priority(b) - priority(a));
  const count = (s: Status) => gaps.filter((g) => g.status === s).length;
  const order: Status[] = ["weak", "medium", "strong", "untested"];

  return (
    <section className="mt-6">
      <h2 className="text-xl font-bold">
        {count("weak")
          ? `Start with ${gaps.filter((g) => g.status === "weak").slice(0, 2).map((g) => g.topic.name).join(" and ")}.`
          : "No weak topics. Keep the medium ones moving."}
      </h2>
      <p className="mb-3 text-sm text-slate-400">
        Based on attempt {attempts.length}. Topics are ordered by how weak they are and how often they appear in past papers.
      </p>

      <div className="mb-2 flex h-3 gap-1 overflow-hidden rounded">
        {order.map((s) =>
          count(s) ? (
            <span key={s} style={{ flex: count(s), background: COLOR[s] }} />
          ) : null
        )}
      </div>
      <div className="mb-5 flex flex-wrap gap-4 text-sm text-slate-400">
        {order.map((s) =>
          count(s) ? (
            <span key={s}>
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: COLOR[s] }} />
              {count(s)} {LABEL[s].toLowerCase()}
            </span>
          ) : null
        )}
      </div>

      {gaps.map((g) => (
        <details
          key={g.topic.id}
          className="mb-2 rounded-xl border border-[#27334b] bg-[#151d2e]"
          style={{ borderLeft: `4px solid ${COLOR[g.status]}` }}
        >
          <summary className="flex cursor-pointer items-center gap-3 p-4">
            <div className="flex-1">
              <div className="font-semibold">{g.topic.name}</div>
              <div className="text-sm text-slate-400">
                {LABEL[g.status]} · {g.topic.weight} past-paper question{g.topic.weight === 1 ? "" : "s"}
              </div>
            </div>
            <div className="text-lg font-bold">{g.pct === null ? "–" : `${g.pct}%`}</div>
          </summary>
          <div className="space-y-2 px-4 pb-4 text-sm">
            <div className="rounded-lg bg-[#1b2539] p-3">
              <span className="mr-2 rounded bg-[#f6b94c26] px-2 py-0.5 font-semibold text-[#f6b94c]">Generated</span>
              {reasons[g.topic.name] ?? (loading && g.status !== "strong" ? "Writing the reason..." : defaultReason(g))}
            </div>
            {g.wrong.map((w, i) => (
              <div key={i} className="rounded-lg bg-[#1b2539] p-3">
                <span className="mr-2 rounded bg-[#7aa2ff26] px-2 py-0.5 font-semibold text-[#7aa2ff]">Retrieved</span>
                {w.citation && <span className="font-semibold text-[#7aa2ff]">{w.citation}</span>}
                <div className="mt-1 text-slate-400">Missed: {w.question || "question text not saved"}</div>
              </div>
            ))}
          </div>
        </details>
      ))}
    </section>
  );
}