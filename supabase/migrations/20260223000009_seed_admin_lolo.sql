-- Seed: grant admin role to lolo@lolo
-- Safe to re-run: UPDATE affects 0 rows if user doesn't exist yet.
UPDATE public.user_profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'lolo@lolo'
);
