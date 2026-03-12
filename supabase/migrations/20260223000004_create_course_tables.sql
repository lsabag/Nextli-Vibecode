-- Migration 4: course_sessions + session_content
-- 3 sessions with lockable content. Realtime-enabled (see migration 7).

CREATE TYPE public.session_status AS ENUM ('locked', 'open');
CREATE TYPE public.content_type   AS ENUM ('video', 'code', 'text');

CREATE TABLE public.course_sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_number integer NOT NULL CHECK (session_number BETWEEN 1 AND 3),
  title          text NOT NULL,
  description    text NOT NULL,
  status         public.session_status NOT NULL DEFAULT 'locked',
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT course_sessions_number_unique UNIQUE (session_number)
);

CREATE TABLE public.session_content (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid NOT NULL REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  content_type  public.content_type NOT NULL,
  title         text NOT NULL,
  content       text NOT NULL,
  language      text,
  display_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX session_content_session_idx
  ON public.session_content (session_id, display_order);

-- RLS: course_sessions (anon can read for public landing page syllabus)
ALTER TABLE public.course_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_sessions_select_all"
  ON public.course_sessions FOR SELECT
  USING (true);

CREATE POLICY "course_sessions_admin_write"
  ON public.course_sessions FOR ALL
  USING (public.is_admin());

-- RLS: session_content (auth users can read open sessions; admins read all)
ALTER TABLE public.session_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_content_select_open"
  ON public.session_content FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.course_sessions cs
      WHERE cs.id = session_id AND cs.status = 'open'
    )
    OR public.is_admin()
  );

CREATE POLICY "session_content_admin_write"
  ON public.session_content FOR ALL
  USING (public.is_admin());

-- Seed 3 sessions
INSERT INTO public.course_sessions (session_number, title, description, status) VALUES
  (1, 'מפגש 1: יסודות ה-Vibe Coding',
   'מבנה פרויקט, React basics, Supabase, ו-Claude Code — מהתקנה עד דפדפן', 'open'),
  (2, 'מפגש 2: בניית פיצ''רים',
   'Auth, CRUD, Realtime, UI components עם shadcn/ui ו-Framer Motion', 'locked'),
  (3, 'מפגש 3: השקה לפרודקשן',
   'Deploy ל-Vercel, דומיין, מוניטורינג, ו-Demo Day', 'locked');
