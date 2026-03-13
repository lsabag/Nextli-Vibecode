-- Nextli Vibecode — D1 (SQLite) Schema
-- Converted from PostgreSQL (Supabase) types to SQLite-compatible types.
-- TEXT for UUID, TIMESTAMPTZ, VARCHAR, arrays (JSON), JSONB
-- INTEGER for booleans (0/1)
-- No ENUMs — use CHECK constraints instead

-- ─── user_profiles ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student', 'admin')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid', 'paid')),
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── wizard_steps ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wizard_steps (
  id TEXT PRIMARY KEY,
  question_text TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'select' CHECK(field_type IN ('select', 'text', 'textarea')),
  options TEXT, -- JSON-encoded array of strings, or NULL
  step_order INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── wizard_answers ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wizard_answers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (step_id) REFERENCES wizard_steps(id) ON DELETE CASCADE
);

-- ─── system_settings ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── courses ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'completed')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── course_sessions ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS course_sessions (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  session_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'locked' CHECK(status IN ('locked', 'open')),
  reveal_index INTEGER NOT NULL DEFAULT 0,
  scheduled_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- ─── session_content ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS session_content (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK(content_type IN ('video', 'code', 'text', 'rich_text', 'file', 'prompt', 'feedback', 'prep')),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  language TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_locked INTEGER NOT NULL DEFAULT 0,
  file_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES course_sessions(id) ON DELETE CASCADE
);

-- ─── student_notes ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS student_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES course_sessions(id) ON DELETE CASCADE
);

-- ─── prompts_library ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prompts_library (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES course_sessions(id) ON DELETE SET NULL
);

-- ─── additional_courses ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS additional_courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  badge TEXT NOT NULL DEFAULT '',
  badge_color TEXT NOT NULL DEFAULT 'purple',
  rating TEXT NOT NULL DEFAULT '',
  show_rating INTEGER NOT NULL DEFAULT 1,
  image_url TEXT,
  image_crop_x INTEGER NOT NULL DEFAULT 50,
  image_crop_y INTEGER NOT NULL DEFAULT 50,
  image_zoom INTEGER NOT NULL DEFAULT 100,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── team_members ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  initials TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── waitlist ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS waitlist (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  recommended_level TEXT NOT NULL DEFAULT '',
  answers TEXT NOT NULL DEFAULT '{}', -- JSON-encoded answers object
  status TEXT NOT NULL DEFAULT 'pending',
  course_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- ─── content_progress ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS content_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES session_content(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES course_sessions(id) ON DELETE CASCADE
);

-- ─── notifications ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- ─── prep_checklist ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prep_checklist (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  session_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  link_url TEXT,
  link_label TEXT,
  links TEXT, -- JSON-encoded array of link objects, or NULL
  display_order INTEGER NOT NULL DEFAULT 0,
  is_required INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES course_sessions(id) ON DELETE SET NULL
);

-- ─── intake_questions ──────────────────────────────────────────────────────

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

-- ─── session_feedback ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS session_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  learned TEXT NOT NULL DEFAULT '',
  missing TEXT NOT NULL DEFAULT '',
  rating INTEGER,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES course_sessions(id) ON DELETE CASCADE
);

-- ─── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_wizard_answers_user ON wizard_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_wizard_answers_step ON wizard_answers(step_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_course ON course_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_session_content_session ON session_content(session_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_user_session ON student_notes(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_prompts_library_session ON prompts_library(session_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_content_progress_user ON content_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_content_progress_content ON content_progress(content_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_prep_checklist_course ON prep_checklist(course_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_user_session ON session_feedback(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_intake_questions_order ON intake_questions(display_order);
