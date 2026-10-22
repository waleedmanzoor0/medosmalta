CREATE TABLE public.quiz_questions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
 prompt text NOT NULL CHECK (length(trim(prompt)) > 0), options jsonb NOT NULL CHECK (jsonb_typeof(options) = 'array' AND jsonb_array_length(options) = 4), correct_index integer NOT NULL CHECK (correct_index BETWEEN 0 AND 3), explanation text, source_reference text, origin text NOT NULL DEFAULT 'user' CHECK (origin IN ('user','ai_unverified','verified')), is_sample boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_questions ON public.quiz_questions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TABLE public.quiz_attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), correct_count integer NOT NULL CHECK (correct_count >= 0), total_count integer NOT NULL CHECK (total_count > 0 AND correct_count <= total_count), answers jsonb NOT NULL DEFAULT '[]'::jsonb, module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL, is_sample boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_attempts ON public.quiz_attempts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX quiz_questions_owner ON public.quiz_questions(user_id);
CREATE INDEX quiz_attempts_owner ON public.quiz_attempts(user_id);
