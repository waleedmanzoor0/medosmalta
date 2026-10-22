import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Field, selectCls } from "./ui";
import { useSave, type Flashcard, type QuizQuestion, type Topic } from "@/lib/data";

export function RevisionEditor({ kind, row, topics, onClose }: { kind: "card" | "question"; row: Partial<Flashcard> | Partial<QuizQuestion>; topics: Topic[]; onClose: () => void }) {
  const save = useSave(kind === "card" ? "flashcards" : "quiz_questions");
  const [busy, setBusy] = useState(false);
  const card = row as Partial<Flashcard>;
  const question = row as Partial<QuizQuestion>;
  const options = Array.isArray(question.options) ? question.options : [];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? "").trim();
    const common = { id: row.id, topic_id: text("topic") || null, source_reference: text("source") || null };
    const answers = [0, 1, 2, 3].map((i) => text(`option${i}`));
    if (kind === "question" && new Set(answers.map((v) => v.toLowerCase())).size !== 4) return void toast.error("Each answer option must be different.");
    setBusy(true);
    try {
      await save.mutateAsync(kind === "card" ? { ...common, front: text("front"), back: text("back") } : { ...common, prompt: text("prompt"), options: answers, correct_index: Number(text("correct")), explanation: text("explanation") || null });
      onClose();
    } catch { /* useSave displays the error and retains the form */ }
    finally { setBusy(false); }
  }
  return <Dialog open onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{row.id ? "Edit" : "New"} {kind === "card" ? "flashcard" : "quiz question"}</DialogTitle><DialogDescription>Your study notes · no patient-identifiable information</DialogDescription></DialogHeader>
      <form className="grid gap-4" onSubmit={submit}>
        <Field label="Topic"><select name="topic" className={selectCls} defaultValue={row.topic_id ?? ""}><option value="">Unlinked</option>{topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></Field>
        {kind === "card" ? <>
          <Field label="Front"><Textarea name="front" defaultValue={card.front} required maxLength={3000} rows={3} autoFocus /></Field>
          <Field label="Back"><Textarea name="back" defaultValue={card.back} required maxLength={10000} rows={4} /></Field>
        </> : <>
          <Field label="Question"><Textarea name="prompt" defaultValue={question.prompt} required maxLength={3000} rows={3} autoFocus /></Field>
          <div className="grid gap-3 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <Field key={i} label={`Option ${String.fromCharCode(65 + i)}`}><Input name={`option${i}`} defaultValue={typeof options[i] === "string" ? options[i] : ""} required maxLength={1000} /></Field>)}</div>
          <Field label="Correct answer"><select name="correct" className={selectCls} defaultValue={question.correct_index ?? 0}>{[0, 1, 2, 3].map((i) => <option key={i} value={i}>{String.fromCharCode(65 + i)}</option>)}</select></Field>
          <Field label="Explanation"><Textarea name="explanation" defaultValue={question.explanation ?? ""} rows={3} maxLength={10000} /></Field>
        </>}
        <Field label="Source reference"><Input name="source" defaultValue={row.source_reference ?? ""} maxLength={1000} /></Field>
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
      </form>
    </DialogContent>
  </Dialog>;
}