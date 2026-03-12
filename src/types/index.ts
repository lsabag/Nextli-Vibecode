import type { Database } from '@/lib/supabase/types'

export type UserProfile       = Database['public']['Tables']['user_profiles']['Row']
export type WizardStep        = Database['public']['Tables']['wizard_steps']['Row']
export type WizardAnswer      = Database['public']['Tables']['wizard_answers']['Row']
export type SystemSetting     = Database['public']['Tables']['system_settings']['Row']
export type Course            = Database['public']['Tables']['courses']['Row']
export type CourseSession     = Database['public']['Tables']['course_sessions']['Row']
export type SessionContent    = Database['public']['Tables']['session_content']['Row']
export type StudentNote       = Database['public']['Tables']['student_notes']['Row']
export type PromptLibraryItem = Database['public']['Tables']['prompts_library']['Row']
export type AdditionalCourse  = Database['public']['Tables']['additional_courses']['Row']
export type TeamMember        = Database['public']['Tables']['team_members']['Row']
export type WaitlistEntry     = Database['public']['Tables']['waitlist']['Row']
export type ContentProgress   = Database['public']['Tables']['content_progress']['Row']
export type Notification      = Database['public']['Tables']['notifications']['Row']
export type PrepChecklistItem = Database['public']['Tables']['prep_checklist']['Row']
export type SessionFeedback  = Database['public']['Tables']['session_feedback']['Row']

export type { UserRole, PaymentStatus, FieldType, SessionStatus, ContentType, CourseStatus }
  from '@/lib/supabase/types'

// Convenience map: system_settings key → value
export type SystemSettingsMap = Record<string, string>
