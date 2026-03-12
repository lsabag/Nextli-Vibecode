-- Migration 13: scheduled_at for course_sessions + auto-open function
-- Allows admin to set a future date/time per session.
-- A SQL function auto-opens sessions when their scheduled time arrives.
-- Called from the workspace on every load — triggers Realtime for all students.

ALTER TABLE public.course_sessions
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

-- Auto-open any locked sessions whose scheduled_at has passed.
-- SECURITY DEFINER so any authenticated user can trigger it.
CREATE OR REPLACE FUNCTION public.auto_open_scheduled_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.course_sessions
  SET status = 'open'
  WHERE status = 'locked'
    AND scheduled_at IS NOT NULL
    AND scheduled_at <= NOW();
END;
$$;

-- Grant execute to authenticated users so the workspace can call it via RPC
GRANT EXECUTE ON FUNCTION public.auto_open_scheduled_sessions() TO authenticated;
