CREATE TABLE public.money_transactions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), title text NOT NULL CHECK (length(trim(title)) > 0), kind text NOT NULL CHECK (kind IN ('income','expense')), category text NOT NULL, amount numeric(12,2) NOT NULL CHECK (amount > 0), occurred_on date NOT NULL DEFAULT CURRENT_DATE, notes text, is_sample boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.money_transactions TO authenticated;
GRANT ALL ON public.money_transactions TO service_role;
ALTER TABLE public.money_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_transactions ON public.money_transactions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX money_transactions_owner_date ON public.money_transactions(user_id, occurred_on);
CREATE TABLE public.money_budgets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), category text NOT NULL, month date NOT NULL CHECK (extract(day FROM month) = 1), amount numeric(12,2) NOT NULL CHECK (amount > 0), is_sample boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id, category, month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.money_budgets TO authenticated;
GRANT ALL ON public.money_budgets TO service_role;
ALTER TABLE public.money_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_budgets ON public.money_budgets FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TABLE public.savings_goals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), title text NOT NULL CHECK (length(trim(title)) > 0), target_amount numeric(12,2) NOT NULL CHECK (target_amount > 0), saved_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (saved_amount >= 0), target_date date, is_sample boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.savings_goals TO authenticated;
GRANT ALL ON public.savings_goals TO service_role;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_savings_goals ON public.savings_goals FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());