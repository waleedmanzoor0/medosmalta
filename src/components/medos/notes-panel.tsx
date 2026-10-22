import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { FileText, Loader2, Sparkles, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/medos/ui";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError, useRows, type StudyNote } from "@/lib/data";
import { MAX_NOTE_BYTES, noteMime } from "@/lib/notes";
import { generateCardsFromNote } from "@/lib/notes.functions";

export function NotesPanel({ onShowDrafts }: { onShowDrafts: () => void }) {
  const notesQuery = useRows<StudyNote>("study_notes");
  const notes = notesQuery.data ?? [];
  const qc = useQueryClient();
  const generate = useServerFn(generateCardsFromNote);
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [working, setWorking] = useState<string | null>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["study_notes"] }); qc.invalidateQueries({ queryKey: ["flashcards"] }); };

  async function makeCards(id: string) {
    setWorking(id);
    try {
      const r = await generate({ data: { noteId: id } });
      if (r.ok) toast.success(`${r.count} draft cards ready to review`); else toast.error(r.error);
    } catch (e) { toast.error(friendlyError(e as Error)); }
    finally { setWorking(null); refresh(); }
  }

  async function upload(file: File) {
    const mime = noteMime(file.name, file.type);
    if (!mime) { toast.error("Please choose a PDF or PowerPoint (.pptx) file."); return; }
    if (file.size > MAX_NOTE_BYTES) { toast.error("Files must be 25 MB or smaller."); return; }
    setUploading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const path = `${u.user!.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
      const up = await supabase.storage.from("study-notes").upload(path, file, { contentType: mime });
      if (up.error) throw up.error;
      const { data, error } = await supabase.from("study_notes").insert({ title: file.name.replace(/\.(pdf|pptx)$/i, ""), file_path: path, mime_type: mime, size_bytes: file.size }).select("id").single();
      if (error) throw error;
      refresh();
      await makeCards(data.id);
    } catch (e) { toast.error(friendlyError(e as Error)); }
    finally { setUploading(false); if (input.current) input.current.value = ""; }
  }

  async function open(n: StudyNote) {
    const { data, error } = await supabase.storage.from("study-notes").createSignedUrl(n.file_path, 300);
    if (error) { toast.error(friendlyError(error)); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  async function remove(n: StudyNote) {
    if (!confirm("Delete this note? Cards already made from it are kept.")) return;
    await supabase.storage.from("study-notes").remove([n.file_path]);
    const { error } = await supabase.from("study_notes").delete().eq("id", n.id);
    if (error) toast.error(friendlyError(error)); else { toast.success("Deleted"); refresh(); }
  }

  return <div>
    <div className="mb-5 rounded-lg border bg-card p-5">
      <h2 className="font-display text-xl">Turn your notes into cards</h2>
      <p className="mt-1 text-sm text-muted-foreground">Upload a PDF or PowerPoint. Your file is stored privately here and AI drafts flashcards from it. Drafts are marked “AI · unverified” until you check and verify them.</p>
      <input ref={input} type="file" accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation" className="hidden" aria-label="Upload notes" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={uploading || !!working} onClick={() => input.current?.click()}>{uploading ? <Loader2 className="animate-spin" /> : <Upload />} {uploading ? "Uploading & drafting…" : "Upload notes"}</Button>
        <Button variant="outline" onClick={onShowDrafts}>Review AI drafts</Button>
      </div>
    </div>
    {notesQuery.isLoading ? <p className="py-6 text-muted-foreground">Loading notes…</p> : !notes.length ? <EmptyState icon={FileText} title="No notes uploaded yet" /> :
      <ul className="stagger divide-y border-y">{notes.map((n) => <li key={n.id} className="flex flex-wrap items-center gap-3 py-4">
        <FileText className="size-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <button className="break-words text-left font-medium hover:underline" onClick={() => open(n)}>{n.title}</button>
          <p className="text-xs text-muted-foreground">{n.mime_type.includes("pdf") ? "PDF" : "PowerPoint"} · {(n.size_bytes / 1024 / 1024).toFixed(1)} MB · {format(new Date(n.created_at), "d MMM yyyy")}
            {" · "}{working === n.id || n.status === "processing" ? "Drafting cards…" : n.status === "ready" ? `${n.card_count} cards drafted` : n.status === "failed" ? <span className="text-destructive">{n.error ?? "Failed"}</span> : "Not processed"}</p>
        </div>
        <Button size="sm" variant="outline" disabled={!!working || uploading} onClick={() => makeCards(n.id)}>{working === n.id ? <Loader2 className="animate-spin" /> : <Sparkles />} {n.status === "ready" ? "Make more cards" : "Make cards"}</Button>
        <Button size="icon" variant="ghost" aria-label="Delete note" title="Delete note" onClick={() => remove(n)}><Trash2 /></Button>
      </li>)}</ul>}
  </div>;
}
