-- Migration 2: wizard_steps + wizard_answers
-- Dynamic onboarding wizard — all content controlled from the DB.

CREATE TYPE public.field_type AS ENUM ('select', 'text', 'textarea');

CREATE TABLE public.wizard_steps (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  field_type    public.field_type NOT NULL DEFAULT 'text',
  options       jsonb,       -- string[] for 'select', NULL otherwise
  step_order    integer NOT NULL,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.wizard_answers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  step_id    uuid NOT NULL REFERENCES public.wizard_steps(id) ON DELETE CASCADE,
  answer     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wizard_answers_user_step_unique UNIQUE (user_id, step_id)
);

CREATE INDEX wizard_steps_order_idx ON public.wizard_steps (step_order);
CREATE INDEX wizard_answers_user_idx ON public.wizard_answers (user_id);

-- RLS: wizard_steps
ALTER TABLE public.wizard_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wizard_steps_select_auth"
  ON public.wizard_steps FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "wizard_steps_select_anon"
  ON public.wizard_steps FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "wizard_steps_admin_all"
  ON public.wizard_steps FOR ALL
  USING (public.is_admin());

-- RLS: wizard_answers
ALTER TABLE public.wizard_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wizard_answers_own_select"
  ON public.wizard_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "wizard_answers_own_insert"
  ON public.wizard_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wizard_answers_own_update"
  ON public.wizard_answers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wizard_answers_admin_all"
  ON public.wizard_answers FOR ALL
  USING (public.is_admin());

-- Seed initial wizard steps
INSERT INTO public.wizard_steps (question_text, field_type, options, step_order) VALUES
  ('מה שמך המלא?', 'text', NULL, 1),
  ('מה רמת הניסיון שלך בפיתוח?', 'select',
   '["מתחיל — אין ניסיון", "בינוני — קצת קוד", "מתקדם — יש ניסיון"]'::jsonb, 2),
  ('מה המוצר שאתה רוצה לבנות?', 'textarea', NULL, 3);
