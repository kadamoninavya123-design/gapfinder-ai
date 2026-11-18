import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";

export const MODEL = "openai/gpt-oss-120b";

export async function askText(system: string, prompt: string): Promise<string> {
  const { text } = await generateText({ model: groq(MODEL), system, prompt });
  return text;
}

export async function askJson<T>(system: string, prompt: string): Promise<T> {
  const text = await askText(system, prompt);
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.search(/[\[{]/);
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  if (start === -1 || end === -1) throw new Error("The model did not return JSON");
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}