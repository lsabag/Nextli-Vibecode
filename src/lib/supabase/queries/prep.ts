import { supabase } from '@/lib/supabase/client'
import type { PrepChecklistItem } from '@/types'

export type PrepLink = { url: string; label: string }

/** Get links array from item — supports both legacy link_url/link_label and new links JSON field */
export function getItemLinks(item: PrepChecklistItem): PrepLink[] {
  if (item.links) {
    try { return JSON.parse(item.links) as PrepLink[] } catch { /* fall through */ }
  }
  if (item.link_url) return [{ url: item.link_url, label: item.link_label || '' }]
  return []
}

export async function getPrepChecklist(courseId: string, sessionId?: string | null): Promise<PrepChecklistItem[]> {
  let query = supabase
    .from('prep_checklist')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (sessionId) {
    query = query.eq('session_id', sessionId)
  }

  const { data } = await query
  return (data ?? []) as PrepChecklistItem[]
}

export async function getAdminPrepChecklist(courseId: string): Promise<PrepChecklistItem[]> {
  const { data } = await supabase
    .from('prep_checklist')
    .select('*')
    .eq('course_id', courseId)
    .order('display_order', { ascending: true })
  return (data ?? []) as PrepChecklistItem[]
}

export async function upsertPrepItem(item: Partial<PrepChecklistItem> & { id?: string }): Promise<PrepChecklistItem> {
  const { data, error } = await supabase
    .from('prep_checklist')
    .upsert(item as never)
    .select()
    .single()
  if (error) throw error
  return data as PrepChecklistItem
}

export async function deletePrepItem(id: string): Promise<void> {
  await supabase.from('prep_checklist').delete().eq('id', id)
}
