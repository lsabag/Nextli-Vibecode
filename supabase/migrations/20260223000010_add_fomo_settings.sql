-- Migration 10: Extended FOMO banner settings
-- Adds variant, countdown end time, and CTA button fields.

INSERT INTO public.system_settings (key, value) VALUES
  ('fomo_variant',  'gradient'),
  ('fomo_end_time', ''),
  ('fomo_cta_text', 'הצטרף עכשיו'),
  ('fomo_cta_link', '#contact')
ON CONFLICT (key) DO NOTHING;
