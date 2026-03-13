-- Add image crop/zoom controls to additional_courses
ALTER TABLE additional_courses ADD COLUMN image_crop_x INTEGER NOT NULL DEFAULT 50;
ALTER TABLE additional_courses ADD COLUMN image_crop_y INTEGER NOT NULL DEFAULT 50;
ALTER TABLE additional_courses ADD COLUMN image_zoom INTEGER NOT NULL DEFAULT 100;
