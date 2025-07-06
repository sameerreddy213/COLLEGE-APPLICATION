export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attendance: {
        Row: {
          attendance_date: string
          created_at: string | null
          faculty_id: string | null
          id: string
          is_present: boolean
          student_id: string | null
          subject_id: string | null
          updated_at: string | null
        }
        Insert: {
          attendance_date: string
          created_at?: string | null
          faculty_id?: string | null
          id?: string
          is_present?: boolean
          student_id?: string | null
          subject_id?: string | null
          updated_at?: string | null
        }
        Update: {
          attendance_date?: string
          created_at?: string | null
          faculty_id?: string | null
          id?: string
          is_present?: boolean
          student_id?: string | null
          subject_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      faculty: {
        Row: {
          created_at: string | null
          department_id: string | null
          designation: string
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          designation: string
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          designation?: string
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faculty_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      hostel_complaints: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string
          id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["complaint_status"] | null
          student_id: string | null
          title: string
          updated_at: string | null
          warden_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description: string
          id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["complaint_status"] | null
          student_id?: string | null
          title: string
          updated_at?: string | null
          warden_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string
          id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["complaint_status"] | null
          student_id?: string | null
          title?: string
          updated_at?: string | null
          warden_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hostel_complaints_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_complaints_warden_id_fkey"
            columns: ["warden_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mess_menu: {
        Row: {
          created_at: string | null
          id: string
          items: string[]
          meal_type: Database["public"]["Enums"]["meal_type"]
          menu_date: string
          mess_type: Database["public"]["Enums"]["mess_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          items: string[]
          meal_type: Database["public"]["Enums"]["meal_type"]
          menu_date: string
          mess_type: Database["public"]["Enums"]["mess_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          items?: string[]
          meal_type?: Database["public"]["Enums"]["meal_type"]
          menu_date?: string
          mess_type?: Database["public"]["Enums"]["mess_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          blood_group: Database["public"]["Enums"]["blood_group"] | null
          created_at: string | null
          email: string
          id: string
          name: string
          phone_number: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          blood_group?: Database["public"]["Enums"]["blood_group"] | null
          created_at?: string | null
          email: string
          id: string
          name: string
          phone_number?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          blood_group?: Database["public"]["Enums"]["blood_group"] | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          batch_year: number
          branch: string
          created_at: string | null
          department_id: string | null
          hostel_block_number: string | null
          hostel_room_no: string | null
          id: string
          roll_number: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          batch_year: number
          branch: string
          created_at?: string | null
          department_id?: string | null
          hostel_block_number?: string | null
          hostel_room_no?: string | null
          id?: string
          roll_number: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          batch_year?: number
          branch?: string
          created_at?: string | null
          department_id?: string | null
          hostel_block_number?: string | null
          hostel_room_no?: string | null
          id?: string
          roll_number?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string | null
          credits: number | null
          department_id: string | null
          id: string
          name: string
          semester: number
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          credits?: number | null
          department_id?: string | null
          id?: string
          name: string
          semester: number
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          credits?: number | null
          department_id?: string | null
          id?: string
          name?: string
          semester?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      timetables: {
        Row: {
          branch: string
          classroom: string
          created_at: string | null
          day_of_week: number
          end_time: string
          faculty_id: string | null
          id: string
          section: string
          start_time: string
          subject_id: string | null
          updated_at: string | null
        }
        Insert: {
          branch: string
          classroom: string
          created_at?: string | null
          day_of_week: number
          end_time: string
          faculty_id?: string | null
          id?: string
          section: string
          start_time: string
          subject_id?: string | null
          updated_at?: string | null
        }
        Update: {
          branch?: string
          classroom?: string
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          faculty_id?: string | null
          id?: string
          section?: string
          start_time?: string
          subject_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetables_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      blood_group: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-"
      complaint_status: "open" | "resolved" | "completed"
      meal_type: "breakfast" | "lunch" | "dinner"
      mess_type: "veg" | "non_veg"
      user_role:
        | "super_admin"
        | "academic_staff"
        | "faculty"
        | "student"
        | "mess_supervisor"
        | "hostel_warden"
        | "hod"
        | "director"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      blood_group: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      complaint_status: ["open", "resolved", "completed"],
      meal_type: ["breakfast", "lunch", "dinner"],
      mess_type: ["veg", "non_veg"],
      user_role: [
        "super_admin",
        "academic_staff",
        "faculty",
        "student",
        "mess_supervisor",
        "hostel_warden",
        "hod",
        "director",
      ],
    },
  },
} as const
