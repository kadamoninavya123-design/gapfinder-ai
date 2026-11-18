"use client";
import { useEffect, useState } from "react";
import { KEYS, load } from "@/lib/store";
import { COLOR, computeGaps } from "@/lib/gaps";
import type { Attempt, Topic } from "@/lib/types";

export default function Progress() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTopics(load<Topic[]>(KEYS.topics, []));
    setAttempts(load<Attempt[]>(KEYS.attempts, []));
    setReady(true);
  }, []);

  if (!ready) return null;
  if (!attempts.length) {
    return <p className="mt-6 text-slate-300">Your progress appears here after your first quiz.</p>;
  }

  const overall = attempts.map((a) =>
    Math.round((a.results.filter((r) => r.correct).length / Math.max(1, a.results.length)) * 100)
  );
  const W = 600, H = 200, P = 36;
  const x = (i: number) => (overall.length === 1 ? W / 2 : P + (i * (W - 2 * P)) / (overall.length - 1));
  const y = (v: number) => H - P - (v / 100) * (H - 2 * P);
  const gaps = computeGaps(topics, attempts);

  return (
    <section className="mt-6 space-y-4">
      <div className="rounded-xl border border-[#27334b] bg-[#151d2e] p-4">
        <div className="mb-2 font-semibold">Overall score by attempt</div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Overall score for each quiz attempt">
          {[0, 50, 100].map((v) => (
            <g key={v}>
              <line x1={P} x2={W - P} y1={y(v)} y2={y(v)} stroke="#27334b" />
              <text x={4} y={y(v) + 4} fill="#8e99b0" fontSize="11">{v}%</text>
            </g>
          ))}
          <polyline
            fill="none"
            stroke="#7aa2ff"
            strokeWidth="3"
            points={overall.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
          />
          {overall.map((v, i) => (
            <g key={i}>
              <circle cx={x(i)} cy={y(v)} r="5" fill="#7aa2ff" />
              <text x={x(i)} y={y(v) - 10} fill="#e8ecf4" fontSize="12" textAnchor="middle">{v}%</text>
              <text x={x(i)} y={H - 10} fill="#8e99b0" fontSize="12" textAnchor="middle">Attempt {i + 1}</text>
            </g>
          ))}
        </svg>
      </div>

      <div className="rounded-xl border border-[#27334b] bg-[#151d2e] p-4">
        <div className="mb-2 font-semibold">Topic progress: first attempt to latest</div>
        {gaps.map((g) => (
          <div key={g.topic.id} className="flex items-center justify-between gap-3 border-t border-[#27334b] py-2 first:border-t-0">
            <span>
              <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: COLOR[g.status] }} />
              {g.topic.name}
            </span>
            <span className="text-sm text-slate-300">
              {g.first === null ? "–" : `${g.first}%`} → {g.pct === null ? "–" : `${g.pct}%`}
              {g.first !== null && g.pct !== null && g.pct !== g.first && (
                <span className={g.pct > g.first ? "ml-2 text-[#4fd1a1]" : "ml-2 text-[#ff6b6b]"}>
                  {g.pct > g.first ? "+" : ""}{g.pct - g.first}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}