-- Migration 11: additional_courses + team_members tables
-- Enables full admin control over landing page "קורסים נוספים" and "הנבחרת שלנו" sections

-- ── additional_courses ──────────────────────────────────────────────────────

CREATE TABLE public.additional_courses (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text        NOT NULL,
  description   text        NOT NULL DEFAULT '',
  badge         text        NOT NULL DEFAULT 'בקרוב',
  rating        text        NOT NULL DEFAULT '5.0',
  display_order integer     NOT NULL DEFAULT 0,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.additional_courses ENABLE ROW LEVEL SECURITY;

-- Anyone can read (used on public landing page)
CREATE POLICY "additional_courses_select_all"
  ON public.additional_courses FOR SELECT
  USING (true);

-- Only admins can write
CREATE POLICY "additional_courses_admin_write"
  ON public.additional_courses FOR ALL
  USING (public.is_admin());

-- Seed with existing static data
INSERT INTO public.additional_courses (title, description, badge, rating, display_order) VALUES
  ('אוטומציה עסקית',    'בניית אוטומציות עם n8n ו-AI Agents',       'בקרוב', '4.9', 1),
  ('עיצוב UX/UI עם AI', 'יצירת ממשקים יפים עם Figma ו-Claude',       'בקרוב', '4.8', 2),
  ('SaaS ב-React',       'בניית מוצר SaaS מלא עם תשלומים',            'בקרוב', '5.0', 3);

-- ── team_members ─────────────────────────────────────────────────────────────

CREATE TABLE public.team_members (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  role          text        NOT NULL DEFAULT '',
  initials      text        NOT NULL DEFAULT '',
  display_order integer     NOT NULL DEFAULT 0,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_members_select_all"
  ON public.team_members FOR SELECT
  USING (true);

CREATE POLICY "team_members_admin_write"
  ON public.team_members FOR ALL
  USING (public.is_admin());

-- Seed with existing static data
INSERT INTO public.team_members (name, role, initials, display_order) VALUES
  ('מנהל VP',   'Marketing VP',    'מנ', 1),
  ('רון אבגדם', 'Full Stack Lead',  'רא', 2),
  ('שרה לוי',   'Product Designer', 'של', 3),
  ('דניאל כץ',  'Founding VP',      'דכ', 4);
