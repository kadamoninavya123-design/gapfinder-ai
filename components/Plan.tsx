"use client";
import { useEffect, useState } from "react";
import { KEYS, load } from "@/lib/store";
import { COLOR, LABEL, computeGaps, priority, type Gap } from "@/lib/gaps";
import { retrieve } from "@/lib/retrieve";
import type { Attempt, Material, Topic } from "@/lib/types";

type Item = { gap: Gap; h: number; reread: string };
type Cache = { attemptId: number; map: Record<string, string> };

const HOURS = { weak: 1.5, medium: 1, untested: 1, strong: 0.5 };

export default function Plan() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [material, setMaterial] = useState<Material>({ syllabus: [], notes: [], papers: [] });
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [days, setDays] = useState(5);
  const [hrs, setHrs] = useState(2);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTopics(load<Topic[]>(KEYS.topics, []));
    setAttempts(load<Attempt[]>(KEYS.attempts, []));
    setMaterial(load<Material>(KEYS.material, { syllabus: [], notes: [], papers: [] }));
    const c = load<Cache | null>(KEYS.reasons, null);
    if (c) setReasons(c.map);
    setReady(true);
  }, []);

  if (!ready) return null;
  if (!attempts.length) {
    return (
      <p className="mt-6 text-slate-300">
        The plan is built from your quiz results. Take the diagnostic quiz first.
      </p>
    );
  }

  // The gap report decides the order. Retrieval finds the section of your notes to re-read.
  const items: Item[] = computeGaps(topics, attempts)
    .sort((a, b) => priority(b) - priority(a))
    .map((g) => ({
      gap: g,
      h: HOURS[g.status],
      reread: retrieve(g.topic.name, material.notes, 1)[0]?.label ?? "",
    }));

  const plan: { it: Item; h: number }[][] = [];
  const left: Item[] = [];
  let day = 0;
  let room = hrs;
  for (const it of items) {
    let h = it.h;
    if (day >= days) {
      left.push(it);
      continue;
    }
    while (h > 0 && day < days) {
      const g = Math.min(h, room);
      if (!plan[day]) plan[day] = [];
      plan[day].push({ it, h: g });
      h -= g;
      room -= g;
      if (room <= 0) {
        day++;
        room = hrs;
      }
    }
    if (h > 0) left.push({ ...it, h });
  }

  return (
    <section className="mt-6">
      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-[#27334b] bg-[#151d2e] p-4">
        <label className="flex items-center gap-2 text-slate-300">
          Days left
          <input
            type="number"
            min={1}
            max={30}
            value={days}
            onChange={(e) => setDays(Math.max(1, +e.target.value || 1))}
            className="w-16 rounded-lg border border-[#27334b] bg-[#1b2539] p-1.5 text-white"
          />
        </label>
        <label className="flex items-center gap-2 text-slate-300">
          Hours per day
          <input
            type="number"
            min={0.5}
            max={12}
            step={0.5}
            value={hrs}
            onChange={(e) => setHrs(Math.max(0.5, +e.target.value || 1))}
            className="w-16 rounded-lg border border-[#27334b] bg-[#1b2539] p-1.5 text-white"
          />
        </label>
      </div>

      {plan.map((d, i) =>
        d ? (
          <div key={i} className="mb-3 rounded-xl border border-[#27334b] bg-[#151d2e] p-4">
            <h3 className="mb-2 font-semibold">Day {i + 1}</h3>
            {d.map(({ it, h }, k) => (
              <div key={k} className="border-t border-[#27334b] py-2 first:border-t-0">
                <div className="flex justify-between gap-3">
                  <span>
                    <span
                      className="mr-2 inline-block h-2 w-2 rounded-full"
                      style={{ background: COLOR[it.gap.status] }}
                    />
                    {it.gap.topic.name}
                    <span className="ml-2 text-sm text-slate-400">{LABEL[it.gap.status]}</span>
                  </span>
                  <span className="text-sm text-slate-400">{h} h</span>
                </div>
                {reasons[it.gap.topic.name] && (
                  <div className="mt-1 text-sm text-slate-400">{reasons[it.gap.topic.name]}</div>
                )}
                {it.reread && (
                  <div className="mt-1 text-sm text-[#7aa2ff]">Re-read: {it.reread}</div>
                )}
              </div>
            ))}
          </div>
        ) : null
      )}

      <p className="text-sm text-slate-400">
        {left.length
          ? `Not enough time for: ${left.map((x) => x.gap.topic.name).join(", ")}. Add days or hours to fit them.`
          : "Everything fits. Take another quiz and this plan reorders itself."}
      </p>
    </section>
  );
}