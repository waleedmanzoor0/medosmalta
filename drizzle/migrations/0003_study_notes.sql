CREATE TABLE public.study_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL CHECK (length(title) > 0),
  file_path text NOT NULL,
  mime_type text NOT NULL CHECK (mime_type IN ('application/pdf','application/vnd.openxmlformats-officedocument.presentationml.presentation')),
  size_bytes bigint NOT NULL DEFAULT 0,
  module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','processing','ready','failed')),
  card_count int NOT NULL DEFAULT 0,
  error text,
  is_sample boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_notes TO authenticated;
GRANT ALL ON public.study_notes TO service_role;
ALTER TABLE public.study_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own study notes" ON public.study_notes FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX study_notes_user_idx ON public.study_notes(user_id, created_at DESC);

ALTER TABLE public.flashcards ADD COLUMN note_id uuid REFERENCES public.study_notes(id) ON DELETE SET NULL;
ALTER TABLE public.flashcards DROP CONSTRAINT IF EXISTS flashcards_origin_check;
ALTER TABLE public.flashcards ADD CONSTRAINT flashcards_origin_check CHECK (origin IN ('user','ai_unverified','ai_verified','verified'));

CREATE POLICY "own notes read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'study-notes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own notes insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'study-notes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own notes delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'study-notes' AND (storage.foldername(name))[1] = auth.uid()::text);