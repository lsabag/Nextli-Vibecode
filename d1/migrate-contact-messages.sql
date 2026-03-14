-- Migration: Add lead tracking columns to contact_messages
-- Run this against your D1 database if the table was created before the schema update.
-- Command: npx wrangler d1 execute nextli-db --remote --file=d1/migrate-contact-messages.sql

ALTER TABLE contact_messages ADD COLUMN status TEXT NOT NULL DEFAULT 'new';
ALTER TABLE contact_messages ADD COLUMN handler_notes TEXT NOT NULL DEFAULT '';
ALTER TABLE contact_messages ADD COLUMN handled_by TEXT;
ALTER TABLE contact_messages ADD COLUMN handled_at TEXT;
ALTER TABLE contact_messages ADD COLUMN is_read INTEGER NOT NULL DEFAULT 0;
