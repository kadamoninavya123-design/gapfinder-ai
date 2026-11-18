"use client";
import { useEffect, useRef, useState } from "react";
import { KEYS, load } from "@/lib/store";
import type { Material, Topic } from "@/lib/types";

type Source = { tag: string; label: string };
type Msg = { role: "user" | "assistant"; content: string; sources?: Source[] };

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTopics(load<Topic[]>(KEYS.topics, []));
  }, []);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const material = load<Material>(KEYS.material, { syllabus: [], notes: [], papers: [] });
    const history: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);

    const patch = (content: string, sources?: Source[]) =>
      setMsgs((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content, sources };
        return copy;
      });

    try {
      if (!material.notes.length) {
        patch("Upload your notes first (Material tab), then ask me about a topic.");
        return;
      }
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((h) => ({ role: h.role, content: h.content })),
          notes: material.notes,
        }),
      });
      if (!res.ok || !res.body) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error ?? "The assistant could not answer.");
      }
      let sources: Source[] = [];
      try {
        sources = JSON.parse(decodeURIComponent(res.headers.get("x-sources") ?? "[]"));
      } catch {}

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        patch(acc, sources);
      }
    } catch (e) {
      patch(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 space-y-3">
      <div className="rounded-xl border border-[#27334b] bg-[#151d2e] p-4 text-sm text-slate-300">
        <span className="mr-2 rounded bg-[#7aa2ff26] px-2 py-0.5 font-semibold text-[#7aa2ff]">Retrieved</span>
        The app searches your notes first.
        <span className="mx-2 rounded bg-[#f6b94c26] px-2 py-0.5 font-semibold text-[#f6b94c]">Generated</span>
        The model answers only from what was found. If nothing matches, it says so.
      </div>

      {topics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => send(`Explain ${t.name}`)}
              disabled={busy}
              className="rounded-full border border-[#27334b] bg-[#1b2539] px-3 py-1 text-sm text-slate-200 disabled:opacity-50"
            >
              Explain {t.name}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`rounded-xl p-4 text-[15px] leading-relaxed ${
              m.role === "user" ? "ml-8 bg-[#1b2539]" : "mr-8 border border-[#27334b] bg-[#151d2e]"
            }`}
          >
            <div className="whitespace-pre-wrap">{m.content || (busy ? "Searching your notes..." : "")}</div>
            {m.role === "assistant" && m.sources && m.sources.length > 0 && m.content && (
              <div className="mt-3 border-t border-[#27334b] pt-2 text-sm">
                <span className="mr-2 rounded bg-[#7aa2ff26] px-2 py-0.5 font-semibold text-[#7aa2ff]">Retrieved</span>
                                {m.sources.filter((s) => m.content.includes(`[${s.tag}]`)).map((s) => (
                  <div key={s.tag} className="text-slate-400">
                    <span className="font-semibold text-[#7aa2ff]">[{s.tag}]</span> {s.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={end} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a topic from your notes..."
          className="flex-1 rounded-lg border border-[#27334b] bg-[#1b2539] p-2.5 text-white"
        />
        <button
          disabled={busy || !input.trim()}
          className="rounded-lg bg-[#7aa2ff] px-4 py-2 font-bold text-[#0d1320] disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </section>
  );
}