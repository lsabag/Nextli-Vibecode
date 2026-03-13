// Supabase Database types — manually maintained.
// Regenerate after migrations: npx supabase gen types typescript --project-id wgdhiwdaityxwoykpjik

export type UserRole      = 'student' | 'admin'
export type PaymentStatus = 'unpaid' | 'paid'
export type FieldType     = 'select' | 'text' | 'textarea'
export type SessionStatus = 'locked' | 'open'
export type ContentType   = 'video' | 'code' | 'text' | 'rich_text' | 'file' | 'prompt' | 'feedback' | 'prep'
export type CourseStatus  = 'draft' | 'active' | 'completed'

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          full_name: string
          role: UserRole
          payment_status: PaymentStatus
          onboarding_completed: boolean
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string
          role?: UserRole
          payment_status?: PaymentStatus
          onboarding_completed?: boolean
          created_at?: string
        }
        Update: {
          full_name?: string
          role?: UserRole
          payment_status?: PaymentStatus
          onboarding_completed?: boolean
        }
        Relationships: []
      }
      wizard_steps: {
        Row: {
          id: string
          question_text: string
          field_type: FieldType
          options: string[] | null
          step_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          question_text: string
          field_type?: FieldType
          options?: string[] | null
          step_order: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          question_text?: string
          field_type?: FieldType
          options?: string[] | null
          step_order?: number
          is_active?: boolean
        }
        Relationships: []
      }
      wizard_answers: {
        Row: {
          id: string
          user_id: string
          step_id: string
          answer: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          step_id: string
          answer: string
          created_at?: string
        }
        Update: {
          answer?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          key: string
          value: string
          updated_at: string
        }
        Insert: {
          key: string
          value: string
          updated_at?: string
        }
        Update: {
          value?: string
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string
          status: CourseStatus
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          status?: CourseStatus
          display_order?: number
          created_at?: string
        }
        Update: {
          title?: string
          description?: string
          status?: CourseStatus
          display_order?: number
        }
        Relationships: []
      }
      course_sessions: {
        Row: {
          id: string
          course_id: string
          session_number: number
          title: string
          description: string
          status: SessionStatus
          reveal_index: number
          scheduled_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          session_number: number
          title: string
          description: string
          status?: SessionStatus
          reveal_index?: number
          scheduled_at?: string | null
          created_at?: string
        }
        Update: {
          course_id?: string
          title?: string
          description?: string
          status?: SessionStatus
          reveal_index?: number
          scheduled_at?: string | null
        }
        Relationships: []
      }
      session_content: {
        Row: {
          id: string
          session_id: string
          content_type: ContentType
          title: string
          content: string
          language: string | null
          display_order: number
          is_locked: boolean
          file_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          content_type: ContentType
          title: string
          content: string
          language?: string | null
          display_order?: number
          is_locked?: boolean
          file_url?: string | null
          created_at?: string
        }
        Update: {
          content_type?: ContentType
          title?: string
          content?: string
          language?: string | null
          display_order?: number
          is_locked?: boolean
          file_url?: string | null
        }
        Relationships: []
      }
      student_notes: {
        Row: {
          id: string
          user_id: string
          session_id: string
          content: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          content?: string
          updated_at?: string
        }
        Update: {
          content?: string
          updated_at?: string
        }
        Relationships: []
      }
      prompts_library: {
        Row: {
          id: string
          session_id: string | null
          title: string
          content: string
          category: string
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          title: string
          content: string
          category: string
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          session_id?: string | null
          title?: string
          content?: string
          category?: string
          display_order?: number
          is_active?: boolean
        }
        Relationships: []
      }
      additional_courses: {
        Row: {
          id: string
          title: string
          description: string
          badge: string
          badge_color: string
          rating: string
          show_rating: boolean
          image_url: string | null
          image_crop_x: number
          image_crop_y: number
          image_zoom: number
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          badge?: string
          badge_color?: string
          rating?: string
          show_rating?: boolean
          image_url?: string | null
          image_crop_x?: number
          image_crop_y?: number
          image_zoom?: number
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          title?: string
          description?: string
          badge?: string
          badge_color?: string
          rating?: string
          show_rating?: boolean
          image_url?: string | null
          image_crop_x?: number
          image_crop_y?: number
          image_zoom?: number
          display_order?: number
          is_active?: boolean
        }
        Relationships: []
      }
      content_progress: {
        Row: {
          id: string
          user_id: string
          content_id: string
          session_id: string
          completed: boolean
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          content_id: string
          session_id: string
          completed?: boolean
          completed_at?: string | null
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          type: string
          title: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          type: string
          title: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          is_read?: boolean
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          recommended_level: string
          answers: string
          status: string
          course_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          phone?: string | null
          recommended_level: string
          answers?: string
          status?: string
          course_id?: string | null
          created_at?: string
        }
        Update: {
          full_name?: string
          email?: string
          phone?: string | null
          recommended_level?: string
          status?: string
          course_id?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          name: string
          role: string
          initials: string
          image_url: string | null
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          role: string
          initials: string
          image_url?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          role?: string
          initials?: string
          image_url?: string | null
          display_order?: number
          is_active?: boolean
        }
        Relationships: []
      }
      prep_checklist: {
        Row: {
          id: string
          course_id: string
          session_id: string | null
          title: string
          description: string
          link_url: string | null
          link_label: string | null
          links: string | null
          display_order: number
          is_required: boolean
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          session_id?: string | null
          title: string
          description?: string
          link_url?: string | null
          link_label?: string | null
          links?: string | null
          display_order?: number
          is_required?: boolean
          is_active?: boolean
          created_at?: string
        }
        Update: {
          course_id?: string
          session_id?: string | null
          title?: string
          description?: string
          link_url?: string | null
          link_label?: string | null
          links?: string | null
          display_order?: number
          is_required?: boolean
          is_active?: boolean
        }
        Relationships: []
      }
      session_feedback: {
        Row: {
          id: string
          user_id: string
          session_id: string
          learned: string
          missing: string
          rating: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          learned?: string
          missing?: string
          rating?: number | null
          updated_at?: string
        }
        Update: {
          learned?: string
          missing?: string
          rating?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      get_current_price: {
        Args: Record<string, never>
        Returns: number
      }
      auto_open_scheduled_sessions: {
        Args: Record<string, never>
        Returns: void
      }
    }
    Enums: {
      user_role: UserRole
      payment_status: PaymentStatus
      field_type: FieldType
      session_status: SessionStatus
      content_type: ContentType
      course_status: CourseStatus
    }
  }
}
