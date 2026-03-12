-- Nextli Vibecode — D1 Seed Data
-- Run after schema.sql to populate development data.

-- ─── Admin user ─────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO user_profiles (id, full_name, role, payment_status, onboarding_completed)
VALUES ('admin@nextli.co.il', 'Admin', 'admin', 'paid', 1);

-- ─── System settings ────────────────────────────────────────────────────────

INSERT OR IGNORE INTO system_settings (key, value) VALUES ('hero_headline', 'למד לבנות אתרים עם AI');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('hero_subheadline', 'קורס אינטנסיבי לפיתוח עם וייבקוד');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('hero_description', 'בנה אתרים ואפליקציות מלאים בעזרת כלי AI מתקדמים — ללא ניסיון קודם בתכנות.');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('contact_email', 'info@nextli.co.il');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('contact_phone', '050-1234567');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('fomo_banner_active', 'true');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('fomo_text', 'מקומות מוגבלים! המחיר עולה בקרוב — הצטרף עכשיו');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('fomo_cta_text', 'הצטרף עכשיו');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('fomo_cta_link', '/intake');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('fomo_variant', 'gradient');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('fomo_end_time', '');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('ai_mentor_active', 'false');

-- ─── Sample course ──────────────────────────────────────────────────────────

INSERT OR IGNORE INTO courses (id, title, description, status, display_order)
VALUES ('course-001', 'וייבקוד — פיתוח עם AI', 'קורס אינטנסיבי לבניית אתרים ואפליקציות בעזרת כלי AI', 'active', 0);

-- ─── Sample sessions ────────────────────────────────────────────────────────

INSERT OR IGNORE INTO course_sessions (id, course_id, session_number, title, description, status, reveal_index, scheduled_at)
VALUES ('session-001', 'course-001', 1, 'מפגש 1: הכרות עם AI Coding', 'סביבת עבודה, כלים בסיסיים, ופרויקט ראשון', 'open', 3, NULL);

INSERT OR IGNORE INTO course_sessions (id, course_id, session_number, title, description, status, reveal_index, scheduled_at)
VALUES ('session-002', 'course-001', 2, 'מפגש 2: בניית אפליקציה מלאה', 'Frontend, Backend, ו-Database', 'open', 2, NULL);

INSERT OR IGNORE INTO course_sessions (id, course_id, session_number, title, description, status, reveal_index, scheduled_at)
VALUES ('session-003', 'course-001', 3, 'מפגש 3: Deploy ו-Production', 'העלאה לאוויר, דומיין, ואופטימיזציה', 'locked', 0, '2026-04-01T18:00:00Z');

-- ─── Sample content ─────────────────────────────────────────────────────────

INSERT OR IGNORE INTO session_content (id, session_id, content_type, title, content, language, display_order, is_locked, file_url)
VALUES ('content-001', 'session-001', 'rich_text', 'ברוכים הבאים!', '<p>ברוכים הבאים לקורס <strong>וייבקוד</strong>. בקורס זה נלמד איך לבנות אתרים ואפליקציות בעזרת כלי AI מתקדמים.</p>', NULL, 0, 0, NULL);

INSERT OR IGNORE INTO session_content (id, session_id, content_type, title, content, language, display_order, is_locked, file_url)
VALUES ('content-002', 'session-001', 'video', 'סרטון הדגמה', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', NULL, 1, 0, NULL);

INSERT OR IGNORE INTO session_content (id, session_id, content_type, title, content, language, display_order, is_locked, file_url)
VALUES ('content-003', 'session-001', 'prompt', 'פרומפט ראשון', 'Build me a modern landing page with a hero section, features grid, and contact form. Use React, Tailwind CSS, and make it responsive.', NULL, 2, 0, NULL);

INSERT OR IGNORE INTO session_content (id, session_id, content_type, title, content, language, display_order, is_locked, file_url)
VALUES ('content-004', 'session-001', 'code', 'דוגמת קוד', 'export default function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <h1>Hello World</h1>
    </div>
  )
}', 'typescript', 3, 0, NULL);

INSERT OR IGNORE INTO session_content (id, session_id, content_type, title, content, language, display_order, is_locked, file_url)
VALUES ('content-005', 'session-001', 'file', 'חומרי עזר', 'קובץ PDF עם סיכום החומר', NULL, 4, 1, 'https://example.com/file.pdf');

INSERT OR IGNORE INTO session_content (id, session_id, content_type, title, content, language, display_order, is_locked, file_url)
VALUES ('content-010', 'session-002', 'rich_text', 'מבנה אפליקציה', '<p>במפגש זה נבנה אפליקציה <strong>Full Stack</strong> מאפס.</p><ul><li>Frontend עם React</li><li>Backend עם Supabase</li><li>Database עם PostgreSQL</li></ul>', NULL, 0, 0, NULL);

INSERT OR IGNORE INTO session_content (id, session_id, content_type, title, content, language, display_order, is_locked, file_url)
VALUES ('content-011', 'session-002', 'prompt', 'פרומפט לבניית DB', 'Create a Supabase database schema for a task management app with: users, projects, tasks (with status, priority, due_date), and comments. Include RLS policies.', NULL, 1, 0, NULL);

INSERT OR IGNORE INTO session_content (id, session_id, content_type, title, content, language, display_order, is_locked, file_url)
VALUES ('content-012', 'session-002', 'rich_text', 'סיכום', '<p>כל הכבוד! סיימתם את המפגש השני.</p>', NULL, 2, 0, NULL);

-- ─── Sample wizard steps ────────────────────────────────────────────────────

INSERT OR IGNORE INTO wizard_steps (id, question_text, field_type, options, step_order, is_active)
VALUES ('wiz-001', 'מה רמת הניסיון שלך בתכנות?', 'select', '["אין לי ניסיון בכלל","ניסיתי קצת לבד (YouTube / קורסים)","יש לי ניסיון בסיסי (HTML/CSS)","אני מתכנת/ת עם ניסיון"]', 1, 1);

INSERT OR IGNORE INTO wizard_steps (id, question_text, field_type, options, step_order, is_active)
VALUES ('wiz-002', 'האם השתמשת בעבר בכלי AI לפיתוח (כמו ChatGPT, Copilot, Lovable)?', 'select', '["לא, בכלל לא","ניסיתי ChatGPT לדברים כלליים","השתמשתי ב-AI לכתיבת קוד","אני משתמש/ת באופן קבוע"]', 2, 1);

INSERT OR IGNORE INTO wizard_steps (id, question_text, field_type, options, step_order, is_active)
VALUES ('wiz-003', 'מה היית רוצה לבנות בקורס?', 'select', '["אתר אישי / תיק עבודות","דף נחיתה לעסק","אפליקציית ווב (SaaS / כלי)","חנות / מסחר אלקטרוני","עוד לא יודע/ת"]', 3, 1);

INSERT OR IGNORE INTO wizard_steps (id, question_text, field_type, options, step_order, is_active)
VALUES ('wiz-004', 'למה נרשמת לקורס? מה הציפיות שלך?', 'textarea', NULL, 4, 1);

INSERT OR IGNORE INTO wizard_steps (id, question_text, field_type, options, step_order, is_active)
VALUES ('wiz-005', 'איך שמעת עלינו?', 'select', '["פייסבוק / אינסטגרם","חבר/ה המליץ/ה","חיפוש בגוגל","טיקטוק","אחר"]', 5, 1);

-- ─── Sample prompts library ─────────────────────────────────────────────────

INSERT OR IGNORE INTO prompts_library (id, session_id, title, content, category, display_order, is_active)
VALUES ('prompt-001', 'session-001', 'יצירת Landing Page', 'Build me a modern landing page with hero, features, and CTA sections using React and Tailwind.', 'פיתוח', 0, 1);

INSERT OR IGNORE INTO prompts_library (id, session_id, title, content, category, display_order, is_active)
VALUES ('prompt-002', 'session-001', 'דיבאג קוד', 'I have this error: [paste error]. Here is my code: [paste code]. Help me fix it and explain what went wrong.', 'דיבאג', 1, 1);

-- ─── Sample prep checklist ──────────────────────────────────────────────────

INSERT OR IGNORE INTO prep_checklist (id, course_id, session_id, title, description, link_url, link_label, links, display_order, is_required, is_active)
VALUES ('prep-001', 'course-001', 'session-001', 'פתיחת חשבון ב-Lovable', 'הירשמו דרך הקישור שלנו — שנינו מקבלים 10 קרדיטים בחינם. חשוב: אל תשתמשו בקרדיטים לפני הקורס!', 'https://lovable.dev/invite/NK2MOR2', 'הרשמה ל-Lovable', NULL, 0, 1, 1);

INSERT OR IGNORE INTO prep_checklist (id, course_id, session_id, title, description, link_url, link_label, links, display_order, is_required, is_active)
VALUES ('prep-002', 'course-001', 'session-001', 'דפדפן Chrome מעודכן', 'ודאו שמותקן לכם Google Chrome בגרסה העדכנית — זה הדפדפן הכי מתאים לעבודה.', 'https://www.google.com/chrome/', 'הורדת Chrome', NULL, 1, 1, 1);

INSERT OR IGNORE INTO prep_checklist (id, course_id, session_id, title, description, link_url, link_label, links, display_order, is_required, is_active)
VALUES ('prep-003', 'course-001', 'session-001', 'חשבון Google או GitHub', 'נדרש להתחברות ל-Lovable. אם יש לכם כבר — מצוין, אפשר לסמן V.', NULL, NULL, NULL, 2, 1, 1);

INSERT OR IGNORE INTO prep_checklist (id, course_id, session_id, title, description, link_url, link_label, links, display_order, is_required, is_active)
VALUES ('prep-004', 'course-001', 'session-001', 'חשבו מה תרצו לבנות', 'אתר אישי? תיק עבודות? דף עסקי? משחק? תביאו רעיון כללי למפגש הראשון.', NULL, NULL, NULL, 3, 0, 1);

INSERT OR IGNORE INTO prep_checklist (id, course_id, session_id, title, description, link_url, link_label, links, display_order, is_required, is_active)
VALUES ('prep-005', 'course-001', 'session-001', 'הכינו תוכן אישי', '2-3 משפטים על עצמכם, תמונת פרופיל אם יש, לוגו אם יש. נשתמש בזה בפרויקט הראשון.', NULL, NULL, NULL, 4, 0, 1);

INSERT OR IGNORE INTO prep_checklist (id, course_id, session_id, title, description, link_url, link_label, links, display_order, is_required, is_active)
VALUES ('prep-006', 'course-001', 'session-001', 'מצאו אתר שמעצב אתכם', 'צלמו מסך של אתר שאתם אוהבים את העיצוב שלו — נשתמש בזה כהשראה.', NULL, NULL, NULL, 5, 0, 1);
