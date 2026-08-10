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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      chapter_materials: {
        Row: {
          chapter_id: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          material_type: string
          title: string
          url: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          material_type?: string
          title: string
          url: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          material_type?: string
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_materials_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_videos: {
        Row: {
          chapter_id: string
          created_at: string
          description: string | null
          display_order: number
          embed_code: string | null
          id: string
          is_active: boolean
          title: string
          video_url: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          embed_code?: string | null
          id?: string
          is_active?: boolean
          title: string
          video_url: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          embed_code?: string | null
          id?: string
          is_active?: boolean
          title?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_videos_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          color: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          subject_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          subject_id: string
        }
        Update: {
          color?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      combo_course_items: {
        Row: {
          combo_id: string
          course_id: string
          created_at: string
          id: string
        }
        Insert: {
          combo_id: string
          course_id: string
          created_at?: string
          id?: string
        }
        Update: {
          combo_id?: string
          course_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "combo_course_items_combo_id_fkey"
            columns: ["combo_id"]
            isOneToOne: false
            referencedRelation: "combo_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_course_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      combo_courses: {
        Row: {
          category: string
          created_at: string
          description: string
          display_order: number
          duration: string | null
          id: string
          image_url: string
          instructor_name: string | null
          is_active: boolean
          lessons_count: number | null
          level: string | null
          offer_end_date: string | null
          offer_label: string | null
          original_price: number | null
          price: number
          slug: string | null
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          display_order?: number
          duration?: string | null
          id?: string
          image_url?: string
          instructor_name?: string | null
          is_active?: boolean
          lessons_count?: number | null
          level?: string | null
          offer_end_date?: string | null
          offer_label?: string | null
          original_price?: number | null
          price?: number
          slug?: string | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          display_order?: number
          duration?: string | null
          id?: string
          image_url?: string
          instructor_name?: string | null
          is_active?: boolean
          lessons_count?: number | null
          level?: string | null
          offer_end_date?: string | null
          offer_label?: string | null
          original_price?: number | null
          price?: number
          slug?: string | null
          title?: string
        }
        Relationships: []
      }
      combo_enrollments: {
        Row: {
          combo_id: string
          enrolled_at: string
          id: string
          user_id: string
        }
        Insert: {
          combo_id: string
          enrolled_at?: string
          id?: string
          user_id: string
        }
        Update: {
          combo_id?: string
          enrolled_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "combo_enrollments_combo_id_fkey"
            columns: ["combo_id"]
            isOneToOne: false
            referencedRelation: "combo_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reaction_type: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "video_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          subject: string | null
          telegram: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          subject?: string | null
          telegram?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          subject?: string | null
          telegram?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          combo_id: string | null
          course_id: string | null
          created_at: string
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          is_universal: boolean | null
          max_uses: number | null
          used_count: number
        }
        Insert: {
          code: string
          combo_id?: string | null
          course_id?: string | null
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          is_universal?: boolean | null
          max_uses?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          combo_id?: string | null
          course_id?: string | null
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          is_universal?: boolean | null
          max_uses?: number | null
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_combo_id_fkey"
            columns: ["combo_id"]
            isOneToOne: false
            referencedRelation: "combo_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      course_contents: {
        Row: {
          content_text: string | null
          content_type: string
          content_url: string | null
          course_id: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          title: string
        }
        Insert: {
          content_text?: string | null
          content_type?: string
          content_url?: string | null
          course_id: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          title: string
        }
        Update: {
          content_text?: string | null
          content_type?: string
          content_url?: string | null
          course_id?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_contents_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_levels: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      course_updates: {
        Row: {
          content: string
          course_id: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          title: string
          update_type: string
          url: string | null
        }
        Insert: {
          content?: string
          course_id: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          title?: string
          update_type?: string
          url?: string | null
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          title?: string
          update_type?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_updates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string
          created_at: string
          description: string
          display_order: number
          duration: string
          id: string
          image_url: string
          instructor_name: string
          is_active: boolean
          lessons_count: number
          level: string
          offer_end_date: string | null
          offer_label: string | null
          original_price: number | null
          price: number
          slug: string | null
          students_count: number
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          display_order?: number
          duration?: string
          id?: string
          image_url?: string
          instructor_name?: string
          is_active?: boolean
          lessons_count?: number
          level?: string
          offer_end_date?: string | null
          offer_label?: string | null
          original_price?: number | null
          price?: number
          slug?: string | null
          students_count?: number
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          display_order?: number
          duration?: string
          id?: string
          image_url?: string
          instructor_name?: string
          is_active?: boolean
          lessons_count?: number
          level?: string
          offer_end_date?: string | null
          offer_label?: string | null
          original_price?: number | null
          price?: number
          slug?: string | null
          students_count?: number
          title?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          course_id: string
          enrolled_at: string
          enrolled_by: string | null
          id: string
          status: string
          user_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          enrolled_by?: string | null
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          enrolled_by?: string | null
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_courses: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      instructors: {
        Row: {
          avatar_url: string | null
          bio: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          title: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          title?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          title?: string
        }
        Relationships: []
      }
      learning_paths: {
        Row: {
          color: string
          created_at: string
          description: string
          display_order: number
          icon_color: string
          icon_name: string
          id: string
          is_active: boolean
          title: string
        }
        Insert: {
          color?: string
          created_at?: string
          description: string
          display_order?: number
          icon_color?: string
          icon_name?: string
          id?: string
          is_active?: boolean
          title: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          display_order?: number
          icon_color?: string
          icon_name?: string
          id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          combo_id: string | null
          coupon_code: string | null
          course_id: string
          created_at: string
          currency: string
          id: string
          invoice_number: string
          payment_method: string | null
          status: string
          trx_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          combo_id?: string | null
          coupon_code?: string | null
          course_id: string
          created_at?: string
          currency?: string
          id?: string
          invoice_number: string
          payment_method?: string | null
          status?: string
          trx_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          combo_id?: string | null
          coupon_code?: string | null
          course_id?: string
          created_at?: string
          currency?: string
          id?: string
          invoice_number?: string
          payment_method?: string | null
          status?: string
          trx_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_combo_id_fkey"
            columns: ["combo_id"]
            isOneToOne: false
            referencedRelation: "combo_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_login_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_reviews: {
        Row: {
          avatar_url: string | null
          course_name: string | null
          created_at: string
          id: string
          is_visible: boolean
          rating: number
          review_text: string
          student_name: string
        }
        Insert: {
          avatar_url?: string | null
          course_name?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean
          rating?: number
          review_text: string
          student_name: string
        }
        Update: {
          avatar_url?: string | null
          course_name?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean
          rating?: number
          review_text?: string
          student_name?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          color: string
          course_id: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          color?: string
          course_id: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          color?: string
          course_id?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          device_info: string
          id: string
          ip_address: string | null
          last_active: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: string
          id?: string
          ip_address?: string | null
          last_active?: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: string
          id?: string
          ip_address?: string | null
          last_active?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      video_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          user_id: string
          user_name: string
          video_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          user_id: string
          user_name?: string
          video_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          user_id?: string
          user_name?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "chapter_videos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_stats: { Args: never; Returns: Json }
      get_user_id_by_email: {
        Args: { email_input: string }
        Returns: {
          user_email: string
          user_id: string
        }[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher", "student"],
    },
  },
} as const
