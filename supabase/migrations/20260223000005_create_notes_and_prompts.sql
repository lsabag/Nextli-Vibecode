-- Migration 5: student_notes + prompts_library

CREATE TABLE public.student_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  content    text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_notes_user_session_unique UNIQUE (user_id, session_id)
);

CREATE TABLE public.prompts_library (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid REFERENCES public.course_sessions(id) ON DELETE SET NULL,
  title         text NOT NULL,
  content       text NOT NULL,
  category      text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX prompts_library_session_idx
  ON public.prompts_library (session_id, display_order);
CREATE INDEX student_notes_user_idx
  ON public.student_notes (user_id, session_id);

-- RLS: student_notes
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_notes_own_all"
  ON public.student_notes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "student_notes_admin_read"
  ON public.student_notes FOR SELECT
  USING (public.is_admin());

-- RLS: prompts_library (anon can read for landing page preview)
ALTER TABLE public.prompts_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prompts_library_select_all"
  ON public.prompts_library FOR SELECT
  USING (is_active = true);

CREATE POLICY "prompts_library_admin_write"
  ON public.prompts_library FOR ALL
  USING (public.is_admin());

-- Seed sample prompts
INSERT INTO public.prompts_library (title, content, category, display_order) VALUES
  ('יצירת קומפוננטה ב-React',
   'צור קומפוננטת React עם TypeScript בשם [שם]. כלול: props מוקלדות, RTL (dir="rtl"), Tailwind CSS, ו-Framer Motion animation.',
   'React', 1),
  ('שאילתת Supabase',
   'כתוב query ל-Supabase שמושך את כל הרשומות מטבלת [שם טבלה] שבהן [תנאי], ממוין לפי [עמודה] בסדר יורד.',
   'Supabase', 2),
  ('תיקון באג',
   'יש לי שגיאה: [הדבק שגיאה]. הקוד הרלוונטי: [הדבק קוד]. מה הבעיה ואיך מתקנים?',
   'Debug', 3),
  ('עיצוב עם Tailwind',
   'עצב כרטיסייה (card) עם Tailwind CSS: רקע לבן, פינות מעוגלות xl, צל עדין, RTL, ו-hover effect.',
   'UI', 4);
