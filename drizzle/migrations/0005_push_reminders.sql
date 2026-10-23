CREATE TABLE public.push_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  ref_kind text NOT NULL CHECK (ref_kind IN ('event','task')),
  ref_id uuid NOT NULL,
  fire_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ref_kind, ref_id, fire_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_reminders TO authenticated;
GRANT ALL ON public.push_reminders TO service_role;
ALTER TABLE public.push_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reminders" ON public.push_reminders FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());