-- Add image_url, badge_color, show_rating to additional_courses
ALTER TABLE additional_courses ADD COLUMN badge_color TEXT NOT NULL DEFAULT 'purple';
ALTER TABLE additional_courses ADD COLUMN show_rating INTEGER NOT NULL DEFAULT 1;
ALTER TABLE additional_courses ADD COLUMN image_url TEXT;
