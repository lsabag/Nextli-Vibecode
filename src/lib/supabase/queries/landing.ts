import { supabase } from '../client'
import type { CourseSession, PromptLibraryItem, SystemSettingsMap, AdditionalCourse, TeamMember } from '@/types'

export async function getSystemSettings(): Promise<SystemSettingsMap> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')
  if (error) throw error
  return Object.fromEntries(data.map((row: { key: string; value: string }) => [row.key, row.value]))
}

export async function getCurrentPrice(): Promise<number> {
  const { data, error } = await supabase.rpc('get_current_price')
  if (error) throw error
  return data as number
}

export async function getPublicCourseSessions(): Promise<CourseSession[]> {
  const { data, error } = await supabase
    .from('course_sessions')
    .select('*')
    .order('session_number', { ascending: true })
  if (error) throw error
  return data
}

export async function getPromptLibraryPreview(): Promise<PromptLibraryItem[]> {
  const { data, error } = await supabase
    .from('prompts_library')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(6)
  if (error) throw error
  return data
}

export async function getAdditionalCourses(): Promise<AdditionalCourse[]> {
  const { data, error } = await supabase
    .from('additional_courses')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
  if (error) throw error
  return data
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
  if (error) throw error
  return data
}
