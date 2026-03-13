import { supabase } from '../client'
import type { UserProfile, WizardStep, WizardAnswer, Course, CourseSession, SessionContent, PromptLibraryItem, AdditionalCourse, TeamMember } from '@/types'

export async function getAdminUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateUserPaymentStatus(
  userId: string,
  status: 'unpaid' | 'paid'
): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ payment_status: status })
    .eq('id', userId)
  if (error) throw error
}

export async function getAdminWizardSteps(): Promise<WizardStep[]> {
  const { data, error } = await supabase
    .from('wizard_steps')
    .select('*')
    .order('step_order', { ascending: true })
  if (error) throw error
  return data
}

export async function upsertWizardStep(
  step: Omit<WizardStep, 'created_at'>
): Promise<void> {
  const { error } = await supabase
    .from('wizard_steps')
    .upsert(step)
  if (error) throw error
}

export async function deleteWizardStep(id: string): Promise<void> {
  const { error } = await supabase
    .from('wizard_steps')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Courses ──────────────────────────────────────────────────────────────────

export async function getAdminCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('display_order', { ascending: true })
  if (error) throw error
  return data
}

export async function upsertCourse(
  course: Omit<Course, 'created_at'>
): Promise<void> {
  const { error } = await supabase
    .from('courses')
    .upsert(course)
  if (error) throw error
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function updateCourseStatus(
  id: string,
  status: Course['status']
): Promise<void> {
  const { error } = await supabase
    .from('courses')
    .update({ status })
    .eq('id', id)
  if (error) throw error
}

// ── Course Sessions ──────────────────────────────────────────────────────────

export async function getAdminCourseSessions(courseId?: string): Promise<CourseSession[]> {
  let query = supabase
    .from('course_sessions')
    .select('*')
    .order('session_number', { ascending: true })
  if (courseId) query = query.eq('course_id', courseId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function upsertCourseSession(
  session: Omit<CourseSession, 'created_at'>
): Promise<void> {
  const { error } = await supabase
    .from('course_sessions')
    .upsert(session)
  if (error) throw error
}

export async function deleteCourseSession(id: string): Promise<void> {
  const { error } = await supabase
    .from('course_sessions')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function updateCourseSessionStatus(
  sessionId: string,
  status: 'locked' | 'open'
): Promise<void> {
  const { error } = await supabase
    .from('course_sessions')
    .update({ status })
    .eq('id', sessionId)
  if (error) throw error
}

export async function updateCourseSessionSchedule(
  sessionId: string,
  scheduled_at: string | null
): Promise<void> {
  const { error } = await supabase
    .from('course_sessions')
    .update({ scheduled_at })
    .eq('id', sessionId)
  if (error) throw error
}

export async function updateCourseSessionInfo(
  id: string,
  title: string,
  description: string
): Promise<void> {
  const { error } = await supabase
    .from('course_sessions')
    .update({ title, description })
    .eq('id', id)
  if (error) throw error
}

export async function updateRevealIndex(
  sessionId: string,
  reveal_index: number
): Promise<void> {
  const { error } = await supabase
    .from('course_sessions')
    .update({ reveal_index })
    .eq('id', sessionId)
  if (error) throw error
}

// ── Session Content ──────────────────────────────────────────────────────────

export async function getAdminSessionContent(sessionId: string): Promise<SessionContent[]> {
  const { data, error } = await supabase
    .from('session_content')
    .select('*')
    .eq('session_id', sessionId)
    .order('display_order', { ascending: true })
  if (error) throw error
  return data
}

export async function upsertSessionContent(
  content: Omit<SessionContent, 'created_at'>
): Promise<void> {
  const { error } = await supabase
    .from('session_content')
    .upsert(content)
  if (error) throw error
}

export async function deleteSessionContent(id: string): Promise<void> {
  const { error } = await supabase
    .from('session_content')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Prompts Library ──────────────────────────────────────────────────────────

export async function getAdminPrompts(sessionId: string): Promise<PromptLibraryItem[]> {
  const { data, error } = await supabase
    .from('prompts_library')
    .select('*')
    .eq('session_id', sessionId)
    .order('display_order', { ascending: true })
  if (error) throw error
  return data
}

export async function upsertPrompt(
  prompt: Omit<PromptLibraryItem, 'created_at'>
): Promise<void> {
  const { error } = await supabase
    .from('prompts_library')
    .upsert(prompt)
  if (error) throw error
}

export async function deletePrompt(id: string): Promise<void> {
  const { error } = await supabase
    .from('prompts_library')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── System Settings ──────────────────────────────────────────────────────────

export async function getAdminSystemSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')
  if (error) throw error
  return Object.fromEntries(data.map((row: { key: string; value: string }) => [row.key, row.value]))
}

export async function updateSystemSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('system_settings')
    .upsert({ key, value }, { onConflict: 'key' })
  if (error) throw error
}

// ── Additional Courses ────────────────────────────────────────────────────────

export async function getAdminAdditionalCourses(): Promise<AdditionalCourse[]> {
  const { data, error } = await supabase
    .from('additional_courses')
    .select('*')
    .order('display_order', { ascending: true })
  if (error) throw error
  return data
}

export async function upsertAdditionalCourse(
  course: Omit<AdditionalCourse, 'created_at'>
): Promise<void> {
  const { error } = await supabase
    .from('additional_courses')
    .upsert(course)
  if (error) throw error
}

export async function deleteAdditionalCourse(id: string): Promise<void> {
  const { error } = await supabase
    .from('additional_courses')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Team Members ──────────────────────────────────────────────────────────────

export async function getAdminTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .order('display_order', { ascending: true })
  if (error) throw error
  return data
}

export async function upsertTeamMember(
  member: Omit<TeamMember, 'created_at'>
): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .upsert(member)
  if (error) throw error
}

export async function deleteTeamMember(id: string): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Student Notes (admin view) ───────────────────────────────────────────────

export async function getAdminStudentNotes(): Promise<{
  user_id: string
  session_id: string
  content: string
  updated_at: string
}[]> {
  const { data, error } = await supabase
    .from('student_notes')
    .select('user_id, session_id, content, updated_at')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// ── Session Feedback (admin view) ────────────────────────────────────────────

export async function getAdminSessionFeedback(): Promise<{
  user_id: string
  session_id: string
  learned: string
  missing: string
  rating: number | null
  updated_at: string
}[]> {
  const { data, error } = await supabase
    .from('session_feedback')
    .select('user_id, session_id, learned, missing, rating, updated_at')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// ── Wizard Answers (for CSV export) ──────────────────────────────────────────

export async function getWizardAnswersWithSteps(): Promise<{
  steps: WizardStep[]
  answers: WizardAnswer[]
}> {
  const [stepsRes, answersRes] = await Promise.all([
    supabase.from('wizard_steps').select('*').order('step_order', { ascending: true }),
    supabase.from('wizard_answers').select('*'),
  ])
  if (stepsRes.error) throw stepsRes.error
  if (answersRes.error) throw answersRes.error
  return { steps: stepsRes.data, answers: answersRes.data }
}
