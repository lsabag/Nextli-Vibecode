-- Migration 6: RPC get_current_price()
-- Returns dynamic course price based on number of paid students:
--   0–4  paid → 50 NIS
--   5–9  paid → 70 NIS
--   10+  paid → 100 NIS

CREATE OR REPLACE FUNCTION public.get_current_price()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  paid_count integer;
BEGIN
  SELECT COUNT(*) INTO paid_count
  FROM public.user_profiles
  WHERE payment_status = 'paid';

  IF paid_count < 5 THEN
    RETURN 50;
  ELSIF paid_count < 10 THEN
    RETURN 70;
  ELSE
    RETURN 100;
  END IF;
END;
$$;

-- Allow anon + authenticated to call (landing page shows price before login)
GRANT EXECUTE ON FUNCTION public.get_current_price() TO anon;
GRANT EXECUTE ON FUNCTION public.get_current_price() TO authenticated;
