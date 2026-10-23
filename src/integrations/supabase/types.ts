export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      events: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          is_sample: boolean
          kind: string
          location: string | null
          module_id: string | null
          notes: string | null
          starts_at: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          is_sample?: boolean
          kind: string
          location?: string | null
          module_id?: string | null
          notes?: string | null
          starts_at: string
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          is_sample?: boolean
          kind?: string
          location?: string | null
          module_id?: string | null
          notes?: string | null
          starts_at?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          due_at: string
          ease_factor: number
          front: string
          id: string
          interval_days: number
          is_sample: boolean
          last_reviewed_at: string | null
          note_id: string | null
          origin: string
          repetitions: number
          source_reference: string | null
          topic_id: string | null
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          due_at?: string
          ease_factor?: number
          front: string
          id?: string
          interval_days?: number
          is_sample?: boolean
          last_reviewed_at?: string | null
          note_id?: string | null
          origin?: string
          repetitions?: number
          source_reference?: string | null
          topic_id?: string | null
          user_id?: string
        }
        Update: {
          back?: string
          created_at?: string
          due_at?: string
          ease_factor?: number
          front?: string
          id?: string
          interval_days?: number
          is_sample?: boolean
          last_reviewed_at?: string | null
          note_id?: string | null
          origin?: string
          repetitions?: number
          source_reference?: string | null
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "study_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          code: string | null
          color: string
          created_at: string
          id: string
          is_sample: boolean
          name: string
          user_id: string
          year_of_study: number | null
        }
        Insert: {
          code?: string | null
          color?: string
          created_at?: string
          id?: string
          is_sample?: boolean
          name: string
          user_id?: string
          year_of_study?: number | null
        }
        Update: {
          code?: string | null
          color?: string
          created_at?: string
          id?: string
          is_sample?: boolean
          name?: string
          user_id?: string
          year_of_study?: number | null
        }
        Relationships: []
      }
      money_budgets: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: string
          is_sample: boolean
          month: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          id?: string
          is_sample?: boolean
          month: string
          user_id?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          is_sample?: boolean
          month?: string
          user_id?: string
        }
        Relationships: []
      }
      money_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: string
          is_sample: boolean
          kind: string
          notes: string | null
          occurred_on: string
          title: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          id?: string
          is_sample?: boolean
          kind: string
          notes?: string | null
          occurred_on?: string
          title: string
          user_id?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          is_sample?: boolean
          kind?: string
          notes?: string | null
          occurred_on?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          weekly_study_goal_hours: number
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          weekly_study_goal_hours?: number
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          weekly_study_goal_hours?: number
        }
        Relationships: []
      }
      push_devices: {
        Row: {
          created_at: string
          id: string
          label: string | null
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          token: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          correct_count: number
          created_at: string
          id: string
          is_sample: boolean
          module_id: string | null
          total_count: number
          user_id: string
        }
        Insert: {
          answers?: Json
          correct_count: number
          created_at?: string
          id?: string
          is_sample?: boolean
          module_id?: string | null
          total_count: number
          user_id?: string
        }
        Update: {
          answers?: Json
          correct_count?: number
          created_at?: string
          id?: string
          is_sample?: boolean
          module_id?: string | null
          total_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_index: number
          created_at: string
          explanation: string | null
          id: string
          is_sample: boolean
          options: Json
          origin: string
          prompt: string
          source_reference: string | null
          topic_id: string | null
          user_id: string
        }
        Insert: {
          correct_index: number
          created_at?: string
          explanation?: string | null
          id?: string
          is_sample?: boolean
          options: Json
          origin?: string
          prompt: string
          source_reference?: string | null
          topic_id?: string | null
          user_id?: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          explanation?: string | null
          id?: string
          is_sample?: boolean
          options?: Json
          origin?: string
          prompt?: string
          source_reference?: string | null
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          created_at: string
          id: string
          is_sample: boolean
          saved_amount: number
          target_amount: number
          target_date: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_sample?: boolean
          saved_amount?: number
          target_amount: number
          target_date?: string | null
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_sample?: boolean
          saved_amount?: number
          target_amount?: number
          target_date?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      study_notes: {
        Row: {
          card_count: number
          created_at: string
          error: string | null
          file_path: string
          id: string
          is_sample: boolean
          mime_type: string
          module_id: string | null
          size_bytes: number
          status: string
          title: string
          user_id: string
        }
        Insert: {
          card_count?: number
          created_at?: string
          error?: string | null
          file_path: string
          id?: string
          is_sample?: boolean
          mime_type: string
          module_id?: string | null
          size_bytes?: number
          status?: string
          title: string
          user_id?: string
        }
        Update: {
          card_count?: number
          created_at?: string
          error?: string | null
          file_path?: string
          id?: string
          is_sample?: boolean
          mime_type?: string
          module_id?: string | null
          size_bytes?: number
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_notes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          due_date: string | null
          id: string
          is_sample: boolean
          kind: string
          module_id: string | null
          notes: string | null
          priority: string
          recurrence: string
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          is_sample?: boolean
          kind?: string
          module_id?: string | null
          notes?: string | null
          priority?: string
          recurrence?: string
          title: string
          user_id?: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          is_sample?: boolean
          kind?: string
          module_id?: string | null
          notes?: string | null
          priority?: string
          recurrence?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string
          id: string
          is_difficult: boolean
          is_sample: boolean
          learning_objectives: string | null
          lecture: string | null
          module_id: string
          next_review_at: string | null
          notes: string | null
          source_reference: string | null
          status: string
          subject: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_difficult?: boolean
          is_sample?: boolean
          learning_objectives?: string | null
          lecture?: string | null
          module_id: string
          next_review_at?: string | null
          notes?: string | null
          source_reference?: string | null
          status?: string
          subject?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_difficult?: boolean
          is_sample?: boolean
          learning_objectives?: string | null
          lecture?: string | null
          module_id?: string
          next_review_at?: string | null
          notes?: string | null
          source_reference?: string | null
          status?: string
          subject?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
