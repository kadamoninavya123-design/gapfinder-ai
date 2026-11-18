import type { Chunk } from "./chunk";

export type Material = { syllabus: Chunk[]; notes: Chunk[]; papers: Chunk[] };

export type Topic = {
  id: string;
  name: string;
  unit: string;
  weight: number;
  questions: string[];
};

export type Question = {
  id: string;
  topicId: string;
  topic: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  citation: string;
  quote: string;
  sourceText: string;
};

export type Attempt = {
  id: number;
  at: string;
  results: {
    topicId: string;
    topic: string;
    correct: boolean;
    question?: string;
    citation?: string;
  }[];
};