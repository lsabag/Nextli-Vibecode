-- Migration 7: Realtime + updated_at triggers
-- Enables Supabase Realtime on tables that need live updates.

-- Realtime publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.course_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;

-- updated_at auto-update trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply to student_notes
CREATE TRIGGER student_notes_set_updated_at
  BEFORE UPDATE ON public.student_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Apply to system_settings
CREATE TRIGGER system_settings_set_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
