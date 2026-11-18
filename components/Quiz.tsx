"use client";
import { useState } from "react";
import { KEYS, load, save } from "@/lib/store";
import type { Attempt, Material, Question, Topic } from "@/lib/types";

export default function Quiz() {
  const [qs, setQs] = useState<Question[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [checking, setChecking] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setError("");
    setBusy(true);
    setDone(false);
    try {
      const topics = load<Topic[]>(KEYS.topics, []);
      const material = load<Material>(KEYS.material, { syllabus: [], notes: [], papers: [] });
      if (!topics.length) throw new Error("Build the topic map first.");
      if (!material.notes.length) throw new Error("Upload your notes first.");
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics, notes: material.notes }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Could not generate the quiz");
      setQs(data.questions);
      setI(0);
      setPicked(null);
      setFeedback("");
      setAnswers([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function choose(j: number) {
    if (picked !== null) return;
    const q = qs[i];
    setPicked(j);
    setAnswers((a) => [...a, j === q.answer]);
    setChecking(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.question,
          options: q.options,
          chosen: j,
          answer: q.answer,
          sourceText: q.sourceText,
        }),
      });
      const d = await res.json();
      setFeedback(d.ok ? d.feedback : q.explanation);
    } catch {
      setFeedback(q.explanation);
    } finally {
      setChecking(false);
    }
  }

  function next() {
    if (i + 1 < qs.length) {
      setI(i + 1);
      setPicked(null);
      setFeedback("");
      return;
    }
    const attempts = load<Attempt[]>(KEYS.attempts, []);
    attempts.push({
      id: Date.now(),
      at: new Date().toISOString(),
            results: qs.map((q, k) => ({ topicId: q.topicId, topic: q.topic, correct: answers[k], question: q.question, citation: q.citation })),
    });
    save(KEYS.attempts, attempts);
    setDone(true);
  }

  if (done) {
    const score = answers.filter(Boolean).length;
    return (
      <section className="mt-6 rounded-xl border border-[#27334b] bg-[#151d2e] p-6">
        <h2 className="text-xl font-bold">
          You got {score} of {qs.length}
        </h2>
        <p className="mt-1 text-slate-400">
          This attempt is saved. The gap report will turn these answers into weak, medium and strong topics.
        </p>
        <button
          onClick={generate}
          className="mt-4 rounded-lg border border-[#27334b] px-4 py-2 text-slate-200"
        >
          Take another quiz
        </button>
      </section>
    );
  }

  if (!qs.length) {
    return (
      <section className="mt-6 space-y-3">
        <p className="text-slate-300">
          The quiz is written from your own notes. Every question shows the section it came from.
        </p>
        <button
          onClick={generate}
          disabled={busy}
          className="rounded-lg bg-[#7aa2ff] px-4 py-2 font-bold text-[#0d1320] disabled:opacity-50"
        >
          {busy ? "Writing questions..." : "Generate diagnostic quiz"}
        </button>
        {busy && <p className="text-sm text-slate-400">This takes about 10 seconds.</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </section>
    );
  }

  const q = qs[i];
  return (
    <section className="mt-6 rounded-xl border border-[#27334b] bg-[#151d2e] p-5">
      <div className="mb-1 text-sm text-slate-400">
        Question {i + 1} of {qs.length} · {q.topic}
      </div>
      <h2 className="text-lg font-semibold">{q.question}</h2>
      <div className="mb-3 mt-1 text-sm text-slate-400">Generated from {q.citation}</div>

      {q.options.map((o, j) => {
        let style = "border-[#27334b] bg-[#1b2539]";
        if (picked !== null) {
          if (j === q.answer) style = "border-[#4fd1a1] bg-[#4fd1a120]";
          else if (j === picked) style = "border-[#ff6b6b] bg-[#ff6b6b20]";
        }
        return (
          <button
            key={j}
            onClick={() => choose(j)}
            disabled={picked !== null}
            className={`mt-2 block w-full rounded-lg border px-3 py-2 text-left ${style}`}
          >
            {o}
          </button>
        );
      })}

      {picked !== null && (
        <div className="mt-4 rounded-lg bg-[#1b2539] p-3 text-sm">
          <div className="mb-1 font-semibold">
            {picked === q.answer ? "Correct" : "Not quite"}
          </div>
          <div>{checking ? "Checking your answer..." : feedback}</div>
          {q.quote && (
            <div className="mt-2 italic text-slate-400">
              “{q.quote}” ({q.citation})
            </div>
          )}
        </div>
      )}

      {picked !== null && !checking && (
        <button
          onClick={next}
          className="mt-4 rounded-lg bg-[#7aa2ff] px-4 py-2 font-bold text-[#0d1320]"
        >
          {i + 1 < qs.length ? "Next question" : "Finish quiz"}
        </button>
      )}
    </section>
  );
}