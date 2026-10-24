ALTER TABLE public.study_notes ADD COLUMN topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL;
CREATE INDEX study_notes_topic_idx ON public.study_notes(topic_id);