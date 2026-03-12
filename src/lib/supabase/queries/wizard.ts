import { supabase } from '../client'
import type { WizardStep, WizardAnswer } from '@/types'

export async function getWizardSteps(): Promise<WizardStep[]> {
  const { data, error } = await supabase
    .from('wizard_steps')
    .select('*')
    .eq('is_active', true)
    .order('step_order', { ascending: true })
  if (error) throw error
  return data
}

export async function getWizardStepById(id: string): Promise<WizardStep> {
  const { data, error } = await supabase
    .from('wizard_steps')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getUserWizardAnswers(userId: string): Promise<WizardAnswer[]> {
  const { data, error } = await supabase
    .from('wizard_answers')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data
}

export async function upsertWizardAnswer(
  userId: string,
  stepId: string,
  answer: string
): Promise<void> {
  const { error } = await supabase
    .from('wizard_answers')
    .upsert(
      { user_id: userId, step_id: stepId, answer },
      { onConflict: 'user_id,step_id' }
    )
  if (error) throw error
}
