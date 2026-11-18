"use client";
import { useState } from "react";
import Upload from "./Upload";
import TopicMap from "./TopicMap";
import Quiz from "./Quiz";
import GapReport from "./GapReport";
import Plan from "./Plan";
import Progress from "./Progress";

const TABS = [
  { id: "material", label: "Material" },
  { id: "topics", label: "Topic map" },
  { id: "quiz", label: "Quiz" },
  { id: "gaps", label: "Gap report" },
  { id: "plan", label: "Revision plan" },
  { id: "progress", label: "Progress" },
];

export default function Shell() {
  const [tab, setTab] = useState("material");
  return (
    <>
      <div className="mt-4 flex gap-1 overflow-x-auto border-b border-[#27334b]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px shrink-0 border-b-2 px-4 py-2 font-semibold ${
              tab === t.id ? "border-[#7aa2ff] text-white" : "border-transparent text-slate-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "material" && <Upload />}
      {tab === "topics" && <TopicMap />}
      {tab === "quiz" && <Quiz />}
      {tab === "gaps" && <GapReport />}
      {tab === "plan" && <Plan />}
      {tab === "progress" && <Progress />}
    </>
  );
}