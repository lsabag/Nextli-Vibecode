-- Prep checklist: items students must complete before accessing a session
create table if not exists prep_checklist (
  id text primary key default gen_random_uuid()::text,
  course_id text not null references courses(id) on delete cascade,
  session_id text references course_sessions(id) on delete set null,
  title text not null,
  description text not null default '',
  link_url text,
  link_label text,
  display_order int not null default 0,
  is_required boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Index for fast lookup by course + session
create index if not exists idx_prep_checklist_course on prep_checklist(course_id);
create index if not exists idx_prep_checklist_session on prep_checklist(session_id);

-- RLS
alter table prep_checklist enable row level security;

create policy "Anyone can read active prep items"
  on prep_checklist for select using (true);

create policy "Admins can manage prep items"
  on prep_checklist for all using (
    exists (select 1 from user_profiles where id = auth.uid() and role = 'admin')
  );
