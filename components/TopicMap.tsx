"use client";
import { useEffect, useState } from "react";
import { KEYS, load, save } from "@/lib/store";
import type { Material, Topic } from "@/lib/types";

export default function TopicMap() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTopics(load<Topic[]>(KEYS.topics, []));
  }, []);

  async function build() {
    setError("");
    setBusy(true);
    try {
      const material = load<Material>(KEYS.material, { syllabus: [], notes: [], papers: [] });
      if (!material.syllabus.length) throw new Error("Upload a syllabus first (Material tab).");
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(material),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Could not build the topic map");
      setTopics(data.topics);
      save(KEYS.topics, data.topics);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const units = Array.from(new Set(topics.map((t) => t.unit)));
  const max = Math.max(1, ...topics.map((t) => t.weight));

  return (
    <section className="mt-6 space-y-4">
      <div className="rounded-xl border border-[#27334b] bg-[#151d2e] p-4 text-sm">
        <div className="mb-1 font-semibold">How this works</div>
        <p className="text-slate-300">
          <span className="mr-2 rounded bg-[#f6b94c26] px-2 py-0.5 font-semibold text-[#f6b94c]">Generated</span>
          The model reads only your syllabus and lists the topics.
        </p>
        <p className="mt-2 text-slate-300">
          <span className="mr-2 rounded bg-[#7aa2ff26] px-2 py-0.5 font-semibold text-[#7aa2ff]">Retrieved</span>
          Each past-paper question is matched to a topic by searching your notes. No model is involved in the matching.
        </p>
      </div>

      <button
        onClick={build}
        disabled={busy}
        className="rounded-lg bg-[#7aa2ff] px-4 py-2 font-bold text-[#0d1320] disabled:opacity-50"
      >
        {busy ? "Building..." : topics.length ? "Rebuild topic map" : "Build topic map"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}

      {units.map((u) => (
        <div key={u} className="rounded-xl border border-[#27334b] bg-[#151d2e] p-4">
          <h3 className="mb-2 font-semibold">{u}</h3>
          {topics
            .filter((t) => t.unit === u)
            .map((t) => (
              <details key={t.id} className="border-t border-[#27334b] py-2">
                <summary className="flex cursor-pointer items-center gap-3">
                  <span className="flex-1">{t.name}</span>
                  <span className="h-2 w-24 overflow-hidden rounded bg-[#1b2539]">
                    <span
                      className="block h-full bg-[#7aa2ff]"
                      style={{ width: `${(t.weight / max) * 100}%` }}
                    />
                  </span>
                  <span className="w-6 text-right font-bold">{t.weight}</span>
                </summary>
                <div className="mt-2 space-y-1 text-sm text-slate-400">
                  {t.questions.length
                    ? t.questions.map((q, i) => <div key={i}>{q}</div>)
                    : "No past-paper question matched this topic."}
                </div>
              </details>
            ))}
        </div>
      ))}
      {topics.length > 0 && (
        <p className="text-sm text-slate-400">
          The number on each row is how many past-paper questions map to that topic. It becomes the exam weight in your revision plan.
        </p>
      )}
    </section>
  );
}