import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import { BookOpen, Check, CircleCheck, Flag, Layers, Pencil, Play, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState, PageHeader, selectCls, StatusPill } from "@/components/medos/ui";
import { RevisionEditor } from "@/components/medos/revision-editor";
import { NotesPanel } from "@/components/medos/notes-panel";
import { useRows, useSave, useRemove, type Flashcard, type QuizQuestion, type QuizAttempt, type Topic, type Module } from "@/lib/data";
import { isDue, questionOptions, quizScore, scheduleReview, type ReviewRating } from "@/lib/revision";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/revision")({
  head: () => ({ meta: [
    { title: "Revision Centre — MedOS" },
    { name: "description", content: "Personal flashcard reviews, quizzes and difficult topics." },
    { property: "og:title", content: "Revision Centre — MedOS" },
    { property: "og:description", content: "Personal flashcard reviews, quizzes and difficult topics." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: RevisionCentre,
});

function RevisionCentre() {
  const cardsQuery = useRows<Flashcard>("flashcards");
  const questionsQuery = useRows<QuizQuestion>("quiz_questions");
  const topicsQuery = useRows<Topic>("topics");
  const modulesQuery = useRows<Module>("modules");
  const attemptsQuery = useRows<QuizAttempt>("quiz_attempts");
  const cards = cardsQuery.data ?? [], questions = questionsQuery.data ?? [], topics = topicsQuery.data ?? [], modules = modulesQuery.data ?? [], attempts = attemptsQuery.data ?? [];
  const saveCard = useSave("flashcards", "");
  const saveQuestion = useSave("quiz_questions", "Verified");
  const saveTopic = useSave("topics", "Topic updated");
  const removeCard = useRemove("flashcards");
  const removeQuestion = useRemove("quiz_questions");
  const saveAttempt = useSave("quiz_attempts", "Quiz result saved");
  const [tab, setTab] = useState("cards");
  const [moduleId, setModuleId] = useState("all");
  const [search, setSearch] = useState("");
  const [draftsOnly, setDraftsOnly] = useState(false);
  const [editing, setEditing] = useState<{ kind: "card" | "question"; row: Partial<Flashcard> | Partial<QuizQuestion> } | null>(null);
  const [review, setReview] = useState<Flashcard[] | null>(null);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [quizModule, setQuizModule] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ question_id: string; prompt: string; options: string[]; selected: number; correct: number; explanation: string | null; source_reference: string | null; origin: string }[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const queries = [cardsQuery, questionsQuery, topicsQuery, modulesQuery, attemptsQuery];
  const topicName = (id: string | null) => topics.find((t) => t.id === id)?.title ?? "Unlinked";
  const inModule = (id: string | null) => moduleId === "all" || topics.some((t) => t.id === id && t.module_id === moduleId);
  const matches = (text: string) => text.toLowerCase().includes(search.toLowerCase());
  const filteredCards = cards.filter((c) => (!draftsOnly || c.origin === "ai_unverified") && inModule(c.topic_id) && matches(`${c.front} ${c.back} ${topicName(c.topic_id)}`));
  const filteredQuestions = questions.filter((q) => inModule(q.topic_id) && matches(`${q.prompt} ${topicName(q.topic_id)}`));
  const dueCards = filteredCards.filter((c) => isDue(c.due_at));
  const difficult = topics.filter((t) => t.is_difficult && (moduleId === "all" || t.module_id === moduleId) && matches(t.title));
  const activeCard = review?.[reviewIndex];
  const activeQuestion = quiz?.[answers.length];
  const score = quizScore(answers);

  async function rate(rating: ReviewRating) {
    if (!activeCard || busy) return;
    setBusy(true);
    try {
      await saveCard.mutateAsync({ id: activeCard.id, ...scheduleReview(activeCard, rating) });
      setReviewIndex((i) => i + 1); setRevealed(false);
    } catch { /* keep current card available to retry */ }
    finally { setBusy(false); }
  }
  function startQuiz() {
    const eligible = filteredQuestions.filter((q) => questionOptions(q.options).length === 4);
    if (!eligible.length) return;
    setQuiz(eligible); setQuizModule(moduleId === "all" ? null : moduleId); setAnswers([]); setSelected(null); setSubmitted(false); setSaved(false);
  }
  function nextQuestion() {
    if (!activeQuestion || selected === null) return;
    setAnswers((a) => [...a, { question_id: activeQuestion.id, prompt: activeQuestion.prompt, options: questionOptions(activeQuestion.options), selected, correct: activeQuestion.correct_index, explanation: activeQuestion.explanation, source_reference: activeQuestion.source_reference, origin: activeQuestion.origin }]);
    setSelected(null); setSubmitted(false);
  }
  async function persistQuiz() {
    if (busy || !answers.length) return;
    setBusy(true);
    try {
      await saveAttempt.mutateAsync({ ...score, answers, module_id: quizModule }); setSaved(true);
    } catch { /* retain results so saving can be retried */ }
    finally { setBusy(false); }
  }

  if (review) return <>
    <PageHeader eyebrow="Revision Centre" title="Flashcard review" action={<Button variant="outline" disabled={busy} onClick={() => setReview(null)}>End session</Button>} />
    <p className="mb-5 text-sm text-muted-foreground">{Math.min(reviewIndex + 1, review.length)} / {review.length} cards</p>
    {activeCard ? <div className="mx-auto max-w-2xl">
      <div className="border-y py-8 text-center">
        <p className="eyebrow mb-5">{topicName(activeCard.topic_id)}</p>
        <Origin origin={activeCard.origin} />
        <p className="mt-4 whitespace-pre-wrap break-words font-display text-2xl">{activeCard.front}</p>
        {revealed && <div className="mt-8 border-t pt-8"><p className="whitespace-pre-wrap break-words text-lg">{activeCard.back}</p>{activeCard.source_reference && <p className="mt-4 text-xs text-muted-foreground">Source: {activeCard.source_reference}</p>}</div>}
      </div>
      {!revealed ? <Button className="mt-6 w-full" onClick={() => setRevealed(true)}><RotateCcw /> Reveal answer</Button> : <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">{(["again", "hard", "good", "easy"] as ReviewRating[]).map((r) => <Button key={r} variant={r === "good" ? "default" : "outline"} className="h-auto flex-col py-3" disabled={busy} onClick={() => rate(r)}><span className="capitalize">{r}</span><span className="text-xs opacity-75">{scheduleReview(activeCard, r).interval_days}d</span></Button>)}</div>}
    </div> : <EmptyState icon={CircleCheck} title="Session complete" action={<Button onClick={() => setReview(null)}>Back to revision</Button>}><span>{review.length} cards reviewed</span></EmptyState>}
  </>;

  if (quiz) return <>
    <PageHeader eyebrow="Revision Centre" title={activeQuestion ? "Quiz session" : "Your results"} action={<Button variant="outline" onClick={() => { if (saved || confirm("Leave this quiz? Unsaved results will be lost.")) setQuiz(null); }} disabled={busy}>Close quiz</Button>} />
    {activeQuestion ? <div className="mx-auto max-w-2xl">
      <p className="mb-6 text-sm text-muted-foreground">Question {answers.length + 1} of {quiz.length} · {topicName(activeQuestion.topic_id)}</p>
      <Origin origin={activeQuestion.origin} />
      <h2 className="mb-6 mt-3 whitespace-pre-wrap break-words font-display text-2xl">{activeQuestion.prompt}</h2>
      <div className="grid gap-3">{questionOptions(activeQuestion.options).map((option, i) => <Button key={i} variant="outline" className={cn("h-auto min-h-14 justify-start whitespace-normal px-4 py-3 text-left", selected === i && "ring-2 ring-primary", submitted && i === activeQuestion.correct_index && "bg-primary-soft text-accent-foreground", submitted && selected === i && i !== activeQuestion.correct_index && "bg-destructive/10 text-destructive")} onClick={() => setSelected(i)} disabled={submitted}><span className="mr-3 shrink-0 font-semibold">{String.fromCharCode(65 + i)}</span><span className="break-words">{option}</span>{submitted && i === activeQuestion.correct_index && <Check className="ml-auto shrink-0" />}</Button>)}</div>
      {submitted && <div className="mt-5 border-l-2 border-primary pl-4"><p className="font-semibold">{selected === activeQuestion.correct_index ? "Correct" : `Correct answer: ${String.fromCharCode(65 + activeQuestion.correct_index)}`}</p>{activeQuestion.explanation && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{activeQuestion.explanation}</p>}{activeQuestion.source_reference && <p className="mt-2 text-xs text-muted-foreground">Source: {activeQuestion.source_reference}</p>}</div>}
      <Button className="mt-6" disabled={selected === null} onClick={() => submitted ? nextQuestion() : setSubmitted(true)}>{submitted ? answers.length + 1 === quiz.length ? "See results" : "Next question" : "Check answer"}</Button>
    </div> : <div className="mx-auto max-w-2xl">
      <div className="border-y py-8"><p className="font-display text-5xl">{score.correct_count} / {score.total_count}</p><p className="mt-2 text-muted-foreground">{Math.round(score.correct_count / score.total_count * 100)}% correct</p><Button className="mt-5" disabled={saved || busy} onClick={persistQuiz}>{saved ? <><Check /> Result saved</> : busy ? "Saving…" : "Save result"}</Button></div>
      <ul className="mt-5 divide-y">{answers.map((a, i) => <li key={i} className="py-4"><p className="break-words font-medium">{a.selected === a.correct ? "✓" : "✕"} {a.prompt}</p><p className="mt-1 break-words text-sm text-muted-foreground">Your answer: {a.options[a.selected]}</p>{a.selected !== a.correct && <p className="mt-1 break-words text-sm text-accent-foreground">Correct answer: {a.options[a.correct]}</p>}<Origin origin={a.origin} /></li>)}</ul>
    </div>}
  </>;

  return <>
    <PageHeader eyebrow="Study & recall" title="Revision Centre" action={<Button onClick={() => setEditing({ kind: tab === "questions" ? "question" : "card", row: {} })}><Plus /> {tab === "questions" ? "Question" : "Flashcard"}</Button>} />
    <div className="mb-7 grid grid-cols-3 divide-x border-y py-5">
      <div><p className="font-display text-3xl">{dueCards.length}</p><p className="mt-1 text-xs text-muted-foreground">Cards due</p></div>
      <div className="pl-5"><p className="font-display text-3xl">{filteredQuestions.length}</p><p className="mt-1 text-xs text-muted-foreground">Quiz questions</p></div>
      <div className="pl-5"><p className="font-display text-3xl">{difficult.length}</p><p className="mt-1 text-xs text-muted-foreground">Difficult topics</p></div>
    </div>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Search revision" placeholder="Search revision" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div><select aria-label="Filter module" className={cn(selectCls, "sm:w-56")} value={moduleId} onChange={(e) => setModuleId(e.target.value)}><option value="all">All modules</option>{modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
    {queries.some((q) => q.isError) ? <div className="py-8"><p>Could not load revision records.</p><Button className="mt-3" variant="outline" onClick={() => queries.forEach((q) => q.refetch())}>Retry</Button></div> : queries.some((q) => q.isLoading) ? <p className="py-8 text-muted-foreground">Loading revision…</p> : <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="mb-5 flex h-auto flex-wrap justify-start"><TabsTrigger value="cards"><Layers className="mr-1.5 size-4" />Flashcards</TabsTrigger><TabsTrigger value="questions">Quizzes</TabsTrigger><TabsTrigger value="difficult">Difficult topics</TabsTrigger><TabsTrigger value="history">Results</TabsTrigger><TabsTrigger value="notes">Notes &amp; AI drafts</TabsTrigger></TabsList>
      <TabsContent value="notes"><NotesPanel onShowDrafts={() => { setDraftsOnly(true); setTab("cards"); }} /></TabsContent>
      <TabsContent value="cards">
        <div className="mb-4 flex items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-3"><h2 className="text-sm font-semibold">Your card library</h2><label className="flex items-center gap-1.5 text-xs text-muted-foreground"><input type="checkbox" checked={draftsOnly} onChange={(e) => setDraftsOnly(e.target.checked)} />AI drafts to review ({cards.filter((c) => c.origin === "ai_unverified").length})</label></div><Button size="sm" disabled={!dueCards.length} onClick={() => { setReview(dueCards); setReviewIndex(0); setRevealed(false); }}><Play /> Review due ({dueCards.length})</Button></div>
        {!filteredCards.length ? <EmptyState icon={Layers} title={cards.length ? "No matching cards" : "No flashcards yet"} action={!cards.length && <Button variant="outline" onClick={() => setEditing({ kind: "card", row: {} })}><Plus /> Flashcard</Button>} /> : <ul className="grid gap-3 sm:grid-cols-2">{filteredCards.map((c) => <li key={c.id} className="min-w-0 rounded-lg border bg-card p-4"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-xs text-muted-foreground">{topicName(c.topic_id)}</p><p className="mt-2 line-clamp-3 break-words font-medium">{c.front}</p></div><div className="flex shrink-0"><Button size="icon" variant="ghost" aria-label="Edit flashcard" title="Edit flashcard" onClick={() => setEditing({ kind: "card", row: c })}><Pencil /></Button><Button size="icon" variant="ghost" aria-label="Delete flashcard" title="Delete flashcard" onClick={() => confirm("Delete this flashcard?") && removeCard.mutate(c.id)}><Trash2 /></Button></div></div><div className="mt-4 flex flex-wrap items-center gap-2"><span className={cn("text-xs font-semibold", isDue(c.due_at) ? "text-accent-foreground" : "text-muted-foreground")}>{isDue(c.due_at) ? "Due now" : `Due ${format(new Date(c.due_at), "d MMM")}`}</span><Origin origin={c.origin} />{c.is_sample && <span className="text-xs text-muted-foreground">Sample</span>}<Button variant="ghost" size="sm" className="ml-auto" onClick={() => { setReview([c]); setReviewIndex(0); setRevealed(false); }}>Review</Button>{c.origin === "ai_unverified" && <Button size="sm" variant="outline" onClick={() => saveCard.mutate({ id: c.id, origin: "verified" })}>Mark verified</Button>}</div></li>)}</ul>}
      </TabsContent>
      <TabsContent value="questions">
        <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">Question bank</h2><Button size="sm" disabled={!filteredQuestions.some((q) => questionOptions(q.options).length === 4)} onClick={startQuiz}><Play /> Start quiz</Button></div>
        {!filteredQuestions.length ? <EmptyState icon={BookOpen} title={questions.length ? "No matching questions" : "No quiz questions yet"} action={!questions.length && <Button variant="outline" onClick={() => setEditing({ kind: "question", row: {} })}><Plus /> Question</Button>} /> : <ul className="divide-y border-y">{filteredQuestions.map((q) => <li key={q.id} className="flex items-start justify-between gap-3 py-4"><div className="min-w-0"><p className="text-xs text-muted-foreground">{topicName(q.topic_id)}</p><p className="mt-1 break-words font-medium">{q.prompt}</p><Origin origin={q.origin} />{q.origin === "ai_unverified" && <Button className="mt-2" size="sm" variant="outline" onClick={() => saveQuestion.mutate({ id: q.id, origin: "verified" })}>Mark verified</Button>}</div><div className="flex shrink-0"><Button variant="ghost" size="icon" aria-label="Edit question" title="Edit question" onClick={() => setEditing({ kind: "question", row: q })}><Pencil /></Button><Button variant="ghost" size="icon" aria-label="Delete question" title="Delete question" onClick={() => confirm("Delete this question?") && removeQuestion.mutate(q.id)}><Trash2 /></Button></div></li>)}</ul>}
      </TabsContent>
      <TabsContent value="difficult">{!difficult.length ? <EmptyState icon={Flag} title="No difficult topics" /> : <ul className="divide-y border-y">{difficult.map((t) => <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="min-w-0"><p className="text-xs text-muted-foreground">{modules.find((m) => m.id === t.module_id)?.name}</p><p className="mt-1 break-words font-medium">{t.title}</p><div className="mt-2"><StatusPill status={t.status} /></div></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => setEditing({ kind: "card", row: { topic_id: t.id, source_reference: t.source_reference } })}><Plus /> Card</Button><Button variant="outline" size="sm" disabled={saveTopic.isPending} onClick={() => saveTopic.mutate({ id: t.id, is_difficult: false })}><Check /> Clear flag</Button></div></li>)}</ul>}<Link to="/study" className="mt-5 inline-flex items-center gap-2 text-sm text-primary"><BookOpen className="size-4" /> Study Hub</Link></TabsContent>
      <TabsContent value="history">{!attempts.filter((a) => moduleId === "all" || a.module_id === moduleId).length ? <EmptyState icon={CircleCheck} title="No saved quiz results" /> : <ul className="divide-y border-y">{attempts.filter((a) => moduleId === "all" || a.module_id === moduleId).map((a) => <li key={a.id} className="flex items-center justify-between gap-3 py-4"><div><p className="text-sm font-medium">{a.module_id ? modules.find((m) => m.id === a.module_id)?.name ?? "Removed module" : "Mixed quiz"}</p><p className="mt-1 text-xs text-muted-foreground">{format(new Date(a.created_at), "d MMM yyyy · HH:mm")}</p></div><p className="shrink-0 font-display text-2xl">{a.correct_count}/{a.total_count} <span className="font-sans text-xs text-muted-foreground">{Math.round(a.correct_count / a.total_count * 100)}%</span></p></li>)}</ul>}</TabsContent>
    </Tabs>}
    {editing && <RevisionEditor key={`${editing.kind}-${editing.row.id ?? "new"}`} {...editing} topics={topics} onClose={() => setEditing(null)} />}
  </>;
}

function Origin({ origin }: { origin: string }) {
  if (origin === "ai_unverified") return <span className="inline-block rounded bg-warning-soft px-2 py-1 text-xs font-semibold text-warning">AI · unverified</span>;
  if (origin === "verified") return <span className="inline-block text-xs font-semibold text-accent-foreground">Verified by you</span>;
  return null;
}