"use client";
import { useEffect, useState } from "react";
import type { Chunk } from "@/lib/chunk";

type Kind = "syllabus" | "notes" | "papers";
type Store = Record<Kind, Chunk[]>;
const EMPTY: Store = { syllabus: [], notes: [], papers: [] };
const KEY = "gf_material";

const SLOTS: { kind: Kind; title: string; hint: string }[] = [
  { kind: "syllabus", title: "Syllabus", hint: "The list of topics" },
  { kind: "notes", title: "Notes and chapters", hint: "Textbook or class notes" },
  { kind: "papers", title: "Past papers", hint: "Previous exam questions" },
];

const SAMPLE: Record<Kind, { name: string; text: string }> = {
  syllabus: {
    name: "Biology_syllabus.txt",
    text: `Unit 1: Cell and Energy
- Light reaction
- Calvin cycle
- Cellular respiration
- Enzymes

Unit 2: Genetics and Ecology
- Mendelian genetics
- Ecosystems`,
  },
  notes: {
    name: "Biology_notes.txt",
    text: `## Light reaction
Photosystem II splits water, releasing electrons that pass along the transport chain. This process forms ATP and NADPH in the thylakoid membrane.

## Calvin cycle
Carbon fixation by RuBisCO produces 3-PGA, which is reduced using ATP and NADPH. The cycle runs in the stroma and regenerates RuBP.

## Cellular respiration
Glycolysis happens in the cytoplasm. The Krebs cycle yields NADH, FADH2 and a little ATP. The electron transport chain produces most of the ATP made during aerobic respiration.

## Enzymes
Competitive inhibitors bind the active site and raise the apparent Km. Non-competitive inhibitors bind elsewhere and lower the maximum rate.

## Mendelian genetics
A test cross reveals the genotype of an individual with a dominant phenotype. A dihybrid cross between heterozygotes gives a 9:3:3:1 ratio.

## Ecosystems
Only about 10% of energy passes from one trophic level to the next. The rest is lost as heat and used in life processes.`,
  },
  papers: {
    name: "Past_paper_2025.txt",
    text: `## Past paper 2025
Q1. Explain the role of Photosystem II in the light reaction. (5 marks)
Q2. Describe carbon fixation in the Calvin cycle. (5 marks)
Q3. Compare the ATP yield of the stages of aerobic respiration. (6 marks)
Q4. Define competitive inhibition with an example. (3 marks)
Q5. Work out the ratio from a dihybrid cross. (4 marks)
Q6. State the 10% energy rule. (2 marks)`,
  },
};

export default function Upload() {
  const [store, setStore] = useState<Store>(EMPTY);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setStore(JSON.parse(saved));
    } catch {}
  }, []);

  function save(next: Store) {
    setStore(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }

  async function upload(files: File[]): Promise<Chunk[]> {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error ?? "Upload failed");
    return data.chunks as Chunk[];
  }

  async function handleFiles(kind: Kind, files: File[]) {
    setError("");
    setBusy(kind);
    try {
      const chunks = await upload(files);
      save({ ...store, [kind]: [...store[kind], ...chunks] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy("");
    }
  }

  async function loadSample() {
    setError("");
    setBusy("sample");
    try {
      const next: Store = { syllabus: [], notes: [], papers: [] };
      for (const kind of ["syllabus", "notes", "papers"] as Kind[]) {
        const s = SAMPLE[kind];
        next[kind] = await upload([new File([s.text], s.name, { type: "text/plain" })]);
      }
      save(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load sample");
    } finally {
      setBusy("");
    }
  }

  const names = (k: Kind) => Array.from(new Set(store[k].map((c) => c.source)));
  const total = store.syllabus.length + store.notes.length + store.papers.length;

  return (
    <section className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={loadSample}
          disabled={busy !== ""}
          className="rounded-lg bg-[#7aa2ff] px-4 py-2 font-bold text-[#0d1320] disabled:opacity-50"
        >
          {busy === "sample" ? "Loading..." : "Use sample Biology material"}
        </button>
        {total > 0 && (
          <button
            onClick={() => save(EMPTY)}
            className="rounded-lg border border-[#27334b] px-4 py-2 text-slate-300"
          >
            Clear material
          </button>
        )}
      </div>

      <p className="text-sm text-slate-400">
        Uploads are added to what is already loaded. Press Clear material before uploading your own files, so the sample and your files do not mix.
      </p>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid gap-3 md:grid-cols-3">
        {SLOTS.map((s) => (
          <div key={s.kind} className="rounded-xl border border-[#27334b] bg-[#151d2e] p-4">
            <div className="font-semibold">{s.title}</div>
            <div className="mb-3 text-sm text-slate-400">{s.hint}</div>
            <input
              type="file"
              multiple
              accept=".pdf,.txt,.md"
              onChange={(e) => {
                const f = Array.from(e.target.files ?? []);
                if (f.length) handleFiles(s.kind, f);
                e.target.value = "";
              }}
              className="w-full text-sm text-slate-300"
            />
            <div className="mt-3 text-sm text-slate-400">
              {busy === s.kind ? "Reading..." : `${store[s.kind].length} sections indexed`}
            </div>
            {names(s.kind).map((n) => (
              <div key={n} className="truncate text-xs text-[#7aa2ff]">
                {n}
              </div>
            ))}
          </div>
        ))}
      </div>

      {store.notes.length > 0 && (
        <div className="rounded-xl border border-[#27334b] bg-[#151d2e] p-4">
          <div className="mb-2 font-semibold">
            Sections found in your notes ({store.notes.length})
          </div>
          <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
            {store.notes.map((c) => (
              <li key={c.id}>
                <span className="font-semibold text-[#7aa2ff]">{c.label}</span>
                <div className="text-slate-400">{c.text.slice(0, 110)}...</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}