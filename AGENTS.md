<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Every user table has `user_id default auth.uid()` + own-row RLS; client reads/writes via `src/lib/data.ts` hooks (react-query + browser Supabase client). Why: privacy per user with one consistent CRUD path.
- Signed-in pages live under `src/routes/_authenticated/` (ssr:false gate + AppShell nav). Why: session lives in localStorage.
- Sample rows carry `is_sample=true` so they can be bulk-removed. Why: user requirement for removable demo data.
- Scheduling logic (conflicts, free-slot finding, recurrence) stays pure in `src/lib/schedule.ts` with tests. Why: testable rules.
- Revision scheduling wraps the SuperMemo engine in pure `src/lib/revision.ts`; quiz attempts store answer snapshots. Why: reliable spaced repetition and durable results after questions change.
- AI-generated study content must be stored with an `origin` flag (`ai_unverified` until the user verifies). Why: never present AI medical content as verified.
- Single-owner auth: public signup is disabled; the first and only account is created by `createOwner` (server fn, admin client, refuses once any user exists). Usernames map to `<username>@medos.local` for auth calls. Why: private personal app.
- Money totals and analytics live in pure `src/lib/money.ts` and `src/lib/analytics.ts` with tests; analytics labels calendar hours as scheduled and excludes sample rows by default. Why: precise financial calculations and honest progress reporting without an actual-study log.
- Mobile navigation keeps five primary destinations and a More menu for money, analytics and settings. Why: preserve legible navigation as sections grow.
- Study notes (PDF/PPTX) live in the private `study-notes` bucket under `<user_id>/`; `generateCardsFromNote` (src/lib/notes.functions.ts) sends PDFs inline and PPTX slide text (pure `src/lib/notes.ts`) to the AI Gateway and inserts flashcards as `ai_unverified` with `note_id`. Why: reviewable AI drafts traceable to their source.
- Phone alerts (Firebase web push): push_devices table, src/lib/push.ts registers tokens, push.functions.ts sends via connector gateway. Why: login alerts on owner's phone.
- Push reminders: events 30 min before, tasks 08:00 Malta on due day (every 5 min). Why: phone reminders.
