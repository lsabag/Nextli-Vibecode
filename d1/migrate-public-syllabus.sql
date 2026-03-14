-- Migration: Add public syllabus fields to course_sessions
-- Run this against your D1 database.
-- Command: npx wrangler d1 execute nextli-db --remote --file=d1/migrate-public-syllabus.sql

ALTER TABLE course_sessions ADD COLUMN public_visible INTEGER NOT NULL DEFAULT 0;
ALTER TABLE course_sessions ADD COLUMN public_description TEXT NOT NULL DEFAULT '';
