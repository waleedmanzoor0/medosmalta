import { unzipSync, strFromU8 } from "fflate";

export const PDF_MIME = "application/pdf";
export const PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
export const MAX_NOTE_BYTES = 25 * 1024 * 1024;

export function noteMime(fileName: string, type: string): string | null {
  const n = fileName.toLowerCase();
  if (type === PDF_MIME || n.endsWith(".pdf")) return PDF_MIME;
  if (type === PPTX_MIME || n.endsWith(".pptx")) return PPTX_MIME;
  return null;
}

const decode = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

/** Pull slide text from a .pptx file, in slide order, labelled "Slide N". */
export function extractPptxText(bytes: Uint8Array): string {
  const files = unzipSync(bytes, { filter: (f) => /^ppt\/slides\/slide\d+\.xml$/.test(f.name) });
  return Object.keys(files)
    .sort((a, b) => Number(a.match(/(\d+)\.xml$/)![1]) - Number(b.match(/(\d+)\.xml$/)![1]))
    .map((name) => {
      const xml = strFromU8(files[name]!);
      const paras = xml.split(/<\/a:p>/).map((p) => [...p.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => decode(m[1]!)).join("").trim()).filter(Boolean);
      return `Slide ${name.match(/(\d+)\.xml$/)![1]}\n${paras.join("\n")}`;
    })
    .join("\n\n");
}
