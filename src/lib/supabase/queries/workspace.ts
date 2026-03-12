import { supabase } from '../client'
import type { Course, CourseSession, SessionContent, StudentNote, PromptLibraryItem, ContentProgress, Notification, SessionFeedback } from '@/types'

export async function getActiveCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .in('status', ['active', 'completed'])
    .order('display_order', { ascending: true })
  if (error) throw error
  return data
}

export async function getAllSessions(courseId?: string): Promise<CourseSession[]> {
  let query = supabase
    .from('course_sessions')
    .select('*')
    .order('session_number', { ascending: true })
  if (courseId) query = query.eq('course_id', courseId)
  const { data, error } = await query
  if (error) throw error
  return data
}

// Triggers the DB function that auto-opens any session whose scheduled_at has passed.
// Call this on workspace load — Realtime will propagate the change to all students.
export async function triggerAutoOpenSessions(): Promise<void> {
  await supabase.rpc('auto_open_scheduled_sessions')
}

export async function getSessionContent(sessionId: string): Promise<SessionContent[]> {
  const { data, error } = await supabase
    .from('session_content')
    .select('*')
    .eq('session_id', sessionId)
    .order('display_order', { ascending: true })
  if (error) throw error
  return data
}

export async function getStudentNote(
  userId: string,
  sessionId: string
): Promise<StudentNote | null> {
  const { data, error } = await supabase
    .from('student_notes')
    .select('*')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertStudentNote(
  userId: string,
  sessionId: string,
  content: string
): Promise<void> {
  const { error } = await supabase
    .from('student_notes')
    .upsert(
      { user_id: userId, session_id: sessionId, content },
      { onConflict: 'user_id,session_id' }
    )
  if (error) throw error
}

export async function getPromptsForSession(
  sessionId: string | null
): Promise<PromptLibraryItem[]> {
  let query = supabase
    .from('prompts_library')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (sessionId) {
    query = query.or(`session_id.eq.${sessionId},session_id.is.null`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

// ── Progress Tracking ───────────────────────────────────────────────────────

export async function getProgressForSession(
  userId: string,
  sessionId: string
): Promise<ContentProgress[]> {
  const { data, error } = await supabase
    .from('content_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
  if (error) throw error
  return data
}

export async function getAllProgress(userId: string): Promise<ContentProgress[]> {
  const { data, error } = await supabase
    .from('content_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', true)
  if (error) throw error
  return data
}

export async function toggleContentProgress(
  userId: string,
  contentId: string,
  sessionId: string,
  completed: boolean
): Promise<void> {
  if (completed) {
    const { error } = await supabase
      .from('content_progress')
      .upsert(
        { user_id: userId, content_id: contentId, session_id: sessionId, completed: true, completed_at: new Date().toISOString() },
        { onConflict: 'user_id,content_id' }
      )
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('content_progress')
      .delete()
      .eq('user_id', userId)
      .eq('content_id', contentId)
    if (error) throw error
  }
}

// ── Notifications ───────────────────────────────────────────────────────────

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
  if (error) throw error
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .or(`user_id.eq.${userId},user_id.is.null`)
    .eq('is_read', false)
  if (error) throw error
}

// ── Search ──────────────────────────────────────────────────────────────────

export interface SearchResult {
  id: string
  type: 'content' | 'prompt' | 'note'
  title: string
  snippet: string
  sessionId: string | null
}

export async function searchWorkspace(
  query: string,
  userId: string
): Promise<SearchResult[]> {
  const q = query.trim()
  if (!q) return []

  const results: SearchResult[] = []

  // Search session content
  const { data: contentData } = await supabase
    .from('session_content')
    .select('id, title, content, session_id')
    .eq('is_locked', false)
    .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
    .limit(10)

  if (contentData) {
    for (const item of contentData) {
      results.push({
        id: item.id,
        type: 'content',
        title: item.title,
        snippet: extractSnippet(item.content, q),
        sessionId: item.session_id,
      })
    }
  }

  // Search prompts
  const { data: promptData } = await supabase
    .from('prompts_library')
    .select('id, title, content, session_id')
    .eq('is_active', true)
    .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
    .limit(10)

  if (promptData) {
    for (const item of promptData) {
      results.push({
        id: item.id,
        type: 'prompt',
        title: item.title,
        snippet: extractSnippet(item.content, q),
        sessionId: item.session_id,
      })
    }
  }

  // Search personal notes
  const { data: noteData } = await supabase
    .from('student_notes')
    .select('id, content, session_id')
    .eq('user_id', userId)
    .ilike('content', `%${q}%`)
    .limit(10)

  if (noteData) {
    for (const item of noteData) {
      results.push({
        id: item.id,
        type: 'note',
        title: 'הערה אישית',
        snippet: extractSnippet(item.content, q),
        sessionId: item.session_id,
      })
    }
  }

  return results
}

// ── Session Feedback ─────────────────────────────────────────────────────────

export async function getSessionFeedback(
  userId: string,
  sessionId: string
): Promise<SessionFeedback | null> {
  const { data, error } = await supabase
    .from('session_feedback')
    .select('*')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertSessionFeedback(
  userId: string,
  sessionId: string,
  learned: string,
  missing: string,
  rating: number | null
): Promise<void> {
  const { error } = await supabase
    .from('session_feedback')
    .upsert(
      { user_id: userId, session_id: sessionId, learned, missing, rating },
      { onConflict: 'user_id,session_id' }
    )
  if (error) throw error
}

// ── Search ──────────────────────────────────────────────────────────────────

function extractSnippet(text: string, query: string): string {
  const stripped = text.replace(/<[^>]+>/g, '')
  const idx = stripped.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return stripped.slice(0, 120) + '...'
  const start = Math.max(0, idx - 40)
  const end = Math.min(stripped.length, idx + query.length + 80)
  return (start > 0 ? '...' : '') + stripped.slice(start, end) + (end < stripped.length ? '...' : '')
}
