import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const INSTRUCTIONS = `You turn a medical student's own study notes into draft flashcards.
Rules: use ONLY facts stated in the notes; never add outside clinical facts, doses or numbers that are not in the notes.
Each card tests one idea: a concise question on the front, a short accurate answer on the back.
source_reference names where in the notes the fact appears (e.g. "Slide 4" or "Page 2").
Never include patient-identifiable information. Make between 5 and 30 cards depending on how much content there is.`;

export const generateCardsFromNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { noteId: string }) => z.object({ noteId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: note, error } = await supabase.from("study_notes").select("*").eq("id", data.noteId).single();
    if (error || !note) throw new Error("Note not found");
    await supabase.from("study_notes").update({ status: "processing", error: null }).eq("id", note.id);
    const fail = async (msg: string) => {
      await supabase.from("study_notes").update({ status: "failed", error: msg }).eq("id", note.id);
      return { ok: false as const, error: msg };
    };
    try {
      const { data: blob, error: dlErr } = await supabase.storage.from("study-notes").download(note.file_path);
      if (dlErr || !blob) return fail("Could not read the uploaded file.");
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const { PDF_MIME, extractPptxText } = await import("./notes");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let content: any[];
      if (note.mime_type === PDF_MIME) {
        let bin = "";
        for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        content = [{ type: "file", filename: `${note.title}.pdf`, data: btoa(bin), mediaType: "application/pdf" }, { type: "text", text: "Make flashcards from these notes." }];
      } else {
        const text = extractPptxText(bytes).slice(0, 120_000);
        if (!text.replace(/Slide \d+/g, "").trim()) return fail("No text found in the slides.");
        content = [{ type: "text", text: `Make flashcards from these slide notes:\n\n${text}` }];
      }

      const apiKey = process.env["LOVABLE_API_KEY"];
      if (!apiKey) return fail("AI is not configured.");
      const { createOpenAI } = await import("@ai-sdk/openai");
      const { streamText, Output } = await import("ai");
      const provider = createOpenAI({
        baseURL: "https://ai.gateway.lovable.dev/v1",
        apiKey,
        headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      });
      const schema = z.object({ cards: z.array(z.object({ front: z.string(), back: z.string(), source_reference: z.string().nullable() })) });
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        instructions: INSTRUCTIONS,
        messages: [{ role: "user", content }],
        output: Output.object({ schema }),
        maxRetries: 0,
        providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
      });
      const out = await result.output;
      const cards = (out?.cards ?? []).filter((c) => c.front.trim() && c.back.trim()).slice(0, 40);
      if (!cards.length) return fail("The AI could not find content to turn into cards.");
      const rows = cards.map((c) => ({
        front: c.front.trim(), back: c.back.trim(), origin: "ai_unverified", note_id: note.id,
        source_reference: [note.title, c.source_reference].filter(Boolean).join(" · "),
      }));
      const { error: insErr } = await supabase.from("flashcards").insert(rows);
      if (insErr) return fail("Could not save the cards.");
      await supabase.from("study_notes").update({ status: "ready", card_count: rows.length }).eq("id", note.id);
      return { ok: true as const, count: rows.length };
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      console.error("generateCardsFromNote", e);
      return fail(status === 402 ? "AI credits have run out. Top up in Settings → Plans & credits." : status === 429 ? "AI is busy right now. Please try again in a minute." : "Card generation failed. Please try again.");
    }
  });
