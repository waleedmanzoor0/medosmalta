import { describe, expect, it } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { extractPptxText, noteMime, PDF_MIME, PPTX_MIME } from "./notes";

const slide = (t: string[]) => strToU8(`<p:sld>${t.map((x) => `<a:p><a:r><a:t>${x}</a:t></a:r></a:p>`).join("")}</p:sld>`);

describe("notes", () => {
  it("extracts slides in numeric order", () => {
    const zip = zipSync({ "ppt/slides/slide10.xml": slide(["Last"]), "ppt/slides/slide2.xml": slide(["Heart &amp; lungs", "Second line"]) });
    expect(extractPptxText(zip)).toBe("Slide 2\nHeart & lungs\nSecond line\n\nSlide 10\nLast");
  });
  it("accepts only PDF and PPTX", () => {
    expect(noteMime("a.PDF", "")).toBe(PDF_MIME);
    expect(noteMime("b.pptx", "")).toBe(PPTX_MIME);
    expect(noteMime("c.docx", "application/msword")).toBeNull();
  });
});
