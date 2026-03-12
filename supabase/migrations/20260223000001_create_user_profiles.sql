-- Migration 1: user_profiles
-- Auto-creates a profile row for every new Supabase Auth user.

CREATE TYPE public.user_role AS ENUM ('student', 'admin');
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'paid');

CREATE TABLE public.user_profiles (
  id                   uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name            text NOT NULL DEFAULT '',
  role                 public.user_role NOT NULL DEFAULT 'student',
  payment_status       public.payment_status NOT NULL DEFAULT 'unpaid',
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Helper function: check admin without triggering RLS recursion
-- SECURITY DEFINER bypasses RLS on user_profiles for this function only
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Own profile: read + update
CREATE POLICY "user_profiles_select_own"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "user_profiles_update_own"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin: read all (uses is_admin() to avoid recursive policy)
CREATE POLICY "user_profiles_admin_select_all"
  ON public.user_profiles FOR SELECT
  USING (public.is_admin());

-- Admin: update all (e.g. payment_status)
CREATE POLICY "user_profiles_admin_update_all"
  ON public.user_profiles FOR UPDATE
  USING (public.is_admin());

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
