-- Migration 12: extend session_content
-- Adds per-block locking, file download URLs, and new content types (rich_text, file)

-- New content types for TipTap HTML and file downloads
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'rich_text';
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'file';

-- Per-block lock flag (admin can lock individual blocks within an open session)
ALTER TABLE public.session_content
  ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false;

-- External file download URL (null = no file attached)
ALTER TABLE public.session_content
  ADD COLUMN IF NOT EXISTS file_url text;
