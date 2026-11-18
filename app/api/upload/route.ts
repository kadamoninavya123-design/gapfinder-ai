import { extractText, getDocumentProxy } from "unpdf";
import { chunkPages, type Chunk } from "@/lib/chunk";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const files = form.getAll("files") as File[];
    if (!files.length) {
      return Response.json({ ok: false, error: "No files received" }, { status: 400 });
    }

    const chunks: Chunk[] = [];
    for (const file of files) {
      const isPdf = file.name.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
        const { text } = await extractText(pdf, { mergePages: false });
        const pages = text.map((t: string, i: number) => ({ page: i + 1, text: t }));
        chunks.push(...chunkPages(file.name, pages, true));
      } else {
        const text = await file.text();
        chunks.push(...chunkPages(file.name, [{ page: 1, text }], false));
      }
    }
    return Response.json({ ok: true, chunks });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}