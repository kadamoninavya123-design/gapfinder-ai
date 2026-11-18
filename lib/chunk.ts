export type Chunk = { id: string; source: string; label: string; text: string };

const HEAD = /^(#{1,4}\s+.+|(chapter|section|unit|topic)\s+\d+.*)$/i;

export function chunkPages(
  source: string,
  pages: { page: number; text: string }[],
  hasPages: boolean
): Chunk[] {
  const chunks: Chunk[] = [];
  let n = 0;
  let heading = "";

  for (const { page, text } of pages) {
    let buf = "";

    const flush = () => {
      const body = buf.trim();
      buf = "";
      if (body.length < 20) return;
      n++;
      const where = hasPages ? `, p.${page}` : "";
      const label = heading
        ? `${source} › ${heading}${where}`
        : `${source}${where}, part ${n}`;
      chunks.push({ id: `${source}-${n}`, source, label, text: body });
    };

    for (const raw of text.split("\n")) {
      const line = raw.trim();
      if (!line) {
        if (buf.length > 500) flush();
        continue;
      }
      if (HEAD.test(line)) {
        flush();
        heading = line.replace(/^#+\s*/, "");
        continue;
      }
      buf += (buf ? " " : "") + line;
      if (buf.length > 900) flush();
    }
    flush();
  }
  return chunks;
}