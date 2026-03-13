-- Create intake_questions table for admin-managed intake form questions
CREATE TABLE IF NOT EXISTS intake_questions (
  id TEXT PRIMARY KEY,
  field_key TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  options TEXT NOT NULL DEFAULT '[]',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_intake_questions_order ON intake_questions(display_order);

-- Seed default intake questions
INSERT INTO intake_questions (id, field_key, title, subtitle, options, display_order, is_active) VALUES
  ('iq-001', 'tech_level', 'מה הניסיון שלך עם טכנולוגיה?', 'זה יעזור לנו להתאים את הקצב והעומק', '[{"value":"beginner","label":"משתמש בסיסי","description":"אימייל, וורד, אקסל — בלי רקע בפיתוח"},{"value":"familiar","label":"מכיר קצת","description":"בניתי אתר ב-Wix/WordPress או שיחקתי עם קוד"},{"value":"junior","label":"מתכנת מתחיל","description":"יודע HTML/CSS, קצת JavaScript"},{"value":"experienced","label":"מפתח עם ניסיון","description":"עובד עם React / frameworks"}]', 0, 1),
  ('iq-002', 'ai_experience', 'מה הניסיון שלך עם AI?', 'כלי AI הם הבסיס של הקורס', '[{"value":"none","label":"אין ניסיון","description":"לא יודע/ת מה זה בדיוק"},{"value":"basic","label":"שיחקתי קצת","description":"ניסיתי ChatGPT או כלים דומים"},{"value":"regular","label":"משתמש באופן קבוע","description":"משתמש/ת ב-AI לעבודה או ללימודים"},{"value":"coding","label":"כותב קוד עם AI","description":"Copilot, Cursor, Claude Code — חלק מהשגרה"}]', 1, 1),
  ('iq-003', 'goal', 'מה אתה רוצה לבנות?', 'נתאים את הפרויקטים למטרות שלך', '[{"value":"website","label":"אתר לעסק","description":"דף נחיתה, אתר תדמית, או בלוג"},{"value":"ecommerce","label":"חנות / מערכת הזמנות","description":"מכירה אונליין, ניהול לקוחות"},{"value":"app","label":"אפליקציה / מוצר טכנולוגי","description":"מוצר עם משתמשים, דאטה, ולוגיקה עסקית"},{"value":"explore","label":"רוצה ללמוד","description":"עדיין לא יודע/ת — רוצה לגלות את האפשרויות"}]', 2, 1),
  ('iq-004', 'english_level', 'מה רמת האנגלית שלך?', 'רוב כלי הפיתוח וה-AI עובדים באנגלית', '[{"value":"basic","label":"בסיסית","description":"קשה לי לקרוא טקסטים באנגלית"},{"value":"moderate","label":"בינונית","description":"מבין/ה טקסט כתוב, פחות טכני"},{"value":"good","label":"טובה","description":"קורא/ת תיעוד טכני בלי בעיה"},{"value":"fluent","label":"שוטפת","description":"אנגלית שפת עבודה יומיומית"}]', 3, 1),
  ('iq-005', 'availability', 'כמה זמן בשבוע אתה מוכן להשקיע?', 'מעבר למפגשים החיים', '[{"value":"low","label":"1-2 שעות","description":"צפייה בחומר + תרגול בסיסי"},{"value":"medium","label":"3-5 שעות","description":"תרגילים + פרויקט אישי"},{"value":"high","label":"5+ שעות","description":"רוצה להתעמק ולבנות דברים אמיתיים"}]', 4, 1);
