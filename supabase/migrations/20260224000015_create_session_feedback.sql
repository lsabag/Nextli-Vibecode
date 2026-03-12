-- Session feedback: per-user per-session feedback on what they learned / what's missing
create table if not exists session_feedback (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null references course_sessions(id) on delete cascade,
  learned text not null default '',
  missing text not null default '',
  rating int check (rating between 1 and 5),
  updated_at timestamptz not null default now(),
  unique (user_id, session_id)
);

create index if not exists idx_session_feedback_session on session_feedback(session_id);
create index if not exists idx_session_feedback_user on session_feedback(user_id);

-- RLS
alter table session_feedback enable row level security;

create policy "Users can read own feedback"
  on session_feedback for select using (auth.uid() = user_id);

create policy "Users can upsert own feedback"
  on session_feedback for insert with check (auth.uid() = user_id);

create policy "Users can update own feedback"
  on session_feedback for update using (auth.uid() = user_id);

create policy "Admins can read all feedback"
  on session_feedback for select using (
    exists (select 1 from user_profiles where id = auth.uid() and role = 'admin')
  );
