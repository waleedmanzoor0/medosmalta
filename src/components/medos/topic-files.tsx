import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError, type StudyNote } from "@/lib/data";
import { MAX_NOTE_BYTES, noteMime } from "@/lib/notes";

export function TopicFiles({ topicId, moduleId, notes }: { topicId: string; moduleId: string; notes: StudyNote[] }) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["study_notes"] });

  async function upload(files: FileList) {
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      for (const file of Array.from(files)) {
        const mime = noteMime(file.name, file.type);
        if (!mime) { toast.error(`${file.name}: only PDF or .pptx files`); continue; }
        if (file.size > MAX_NOTE_BYTES) { toast.error(`${file.name}: must be 25 MB or smaller`); continue; }
        const path = `${u.user!.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
        const up = await supabase.storage.from("study-notes").upload(path, file, { contentType: mime });
        if (up.error) throw up.error;
        const { error } = await supabase.from("study_notes").insert({ title: file.name.replace(/\.(pdf|pptx)$/i, ""), file_path: path, mime_type: mime, size_bytes: file.size, topic_id: topicId, module_id: moduleId });
        if (error) throw error;
      }
      toast.success("Notes attached");
    } catch (e) { toast.error(friendlyError(e as Error)); }
    finally { setBusy(false); refresh(); if (input.current) input.current.value = ""; }
  }

  async function open(n: StudyNote) {
    const w = window.open("", "_blank");
    const { data, error } = await supabase.storage.from("study-notes").createSignedUrl(n.file_path, 600);
    if (error) { w?.close(); toast.error(friendlyError(error)); return; }
    if (w) w.location.href = data.signedUrl; else window.location.href = data.signedUrl;
  }

  async function detach(n: StudyNote) {
    if (!confirm(`Remove “${n.title}” from this topic? The file stays in Notes & AI drafts.`)) return;
    const { error } = await supabase.from("study_notes").update({ topic_id: null }).eq("id", n.id);
    if (error) toast.error(friendlyError(error)); else refresh();
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {notes.map((n) => (
        <span key={n.id} className="inline-flex max-w-full items-center gap-1 rounded-full border bg-card pl-2 pr-1 text-xs">
          <button onClick={() => open(n)} className="flex min-w-0 items-center gap-1 py-1 hover:underline" title={`Open ${n.title}`}>
            <FileText className="size-3.5 shrink-0 text-primary" />
            <span className="truncate">{n.title}</span>
            <span className="text-muted-foreground">{n.mime_type.includes("pdf") ? "PDF" : "PPTX"}</span>
          </button>
          <button onClick={() => detach(n)} aria-label={`Remove ${n.title}`} className="rounded-full p-0.5 text-muted-foreground hover:bg-muted"><X className="size-3" /></button>
        </span>
      ))}
      <input ref={input} type="file" multiple accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation" className="hidden" aria-label="Attach lecture notes" onChange={(e) => e.target.files?.length && upload(e.target.files)} />
      <button disabled={busy} onClick={() => input.current?.click()} className="inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-60">
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Paperclip className="size-3.5" />} {busy ? "Uploading…" : "Attach notes"}
      </button>
    </div>
  );
}
