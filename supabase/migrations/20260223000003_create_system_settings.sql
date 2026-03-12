-- Migration 3: system_settings
-- Key-value store for all dynamic system configuration.
-- Anon users can read (landing page is public).

CREATE TABLE public.system_settings (
  key        text PRIMARY KEY,
  value      text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anon) can read — landing page needs this unauthenticated
CREATE POLICY "system_settings_select_all"
  ON public.system_settings FOR SELECT
  USING (true);

-- Only admins can write
CREATE POLICY "system_settings_admin_write"
  ON public.system_settings FOR ALL
  USING (public.is_admin());

-- Seed default values
INSERT INTO public.system_settings (key, value) VALUES
  ('fomo_banner_active', 'true'),
  ('fomo_text', '🔥 מקומות מוגבלים! המחיר עולה בקרוב — הצטרף עכשיו'),
  ('hero_headline', 'מרעיון למוצר'),
  ('hero_subheadline', 'תוך 3 מפגשים'),
  ('hero_description', 'לומדים לבנות מוצרים דיגיטליים אמיתיים עם AI — בלי ניסיון קודם בקוד'),
  ('contact_email', 'hello@nextli.co'),
  ('contact_phone', '+972-50-000-0000');
