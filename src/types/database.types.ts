export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      attendances: {
        Row: {
          actual_hours: number | null
          attendance_date: string
          check_in_time: string | null
          check_out_time: string | null
          class_id: string | null
          created_at: string | null
          enrollment_id: string | null
          id: string
          late_minutes: number | null
          notes: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string | null
          tenant_id: string | null
        }
        Insert: {
          actual_hours?: number | null
          attendance_date: string
          check_in_time?: string | null
          check_out_time?: string | null
          class_id?: string | null
          created_at?: string | null
          enrollment_id?: string | null
          id?: string
          late_minutes?: number | null
          notes?: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          actual_hours?: number | null
          attendance_date?: string
          check_in_time?: string | null
          check_out_time?: string | null
          class_id?: string | null
          created_at?: string | null
          enrollment_id?: string | null
          id?: string
          late_minutes?: number | null
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendances_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          application_name: string | null
          audit_date: string | null
          changed_columns: string[] | null
          id: string
          ip_address: unknown | null
          is_anomalous: boolean | null
          new_values: Json | null
          occurred_at: string | null
          old_values: Json | null
          record_id: string | null
          request_id: string | null
          risk_level: string | null
          session_id: string | null
          table_name: string
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          application_name?: string | null
          audit_date?: string | null
          changed_columns?: string[] | null
          id?: string
          ip_address?: unknown | null
          is_anomalous?: boolean | null
          new_values?: Json | null
          occurred_at?: string | null
          old_values?: Json | null
          record_id?: string | null
          request_id?: string | null
          risk_level?: string | null
          session_id?: string | null
          table_name: string
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          application_name?: string | null
          audit_date?: string | null
          changed_columns?: string[] | null
          id?: string
          ip_address?: unknown | null
          is_anomalous?: boolean | null
          new_values?: Json | null
          occurred_at?: string | null
          old_values?: Json | null
          record_id?: string | null
          request_id?: string | null
          risk_level?: string | null
          session_id?: string | null
          table_name?: string
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_executions: {
        Row: {
          backup_metadata: Json | null
          backup_path: string | null
          backup_size: number | null
          checksum: string | null
          completed_at: string | null
          compressed_size: number | null
          created_by: string | null
          error_message: string | null
          execution_time_seconds: number | null
          execution_type: string
          id: string
          policy_id: string | null
          records_count: number | null
          started_at: string | null
          status: string | null
          storage_url: string | null
          tables_count: number | null
          tenant_id: string | null
        }
        Insert: {
          backup_metadata?: Json | null
          backup_path?: string | null
          backup_size?: number | null
          checksum?: string | null
          completed_at?: string | null
          compressed_size?: number | null
          created_by?: string | null
          error_message?: string | null
          execution_time_seconds?: number | null
          execution_type: string
          id?: string
          policy_id?: string | null
          records_count?: number | null
          started_at?: string | null
          status?: string | null
          storage_url?: string | null
          tables_count?: number | null
          tenant_id?: string | null
        }
        Update: {
          backup_metadata?: Json | null
          backup_path?: string | null
          backup_size?: number | null
          checksum?: string | null
          completed_at?: string | null
          compressed_size?: number | null
          created_by?: string | null
          error_message?: string | null
          execution_time_seconds?: number | null
          execution_type?: string
          id?: string
          policy_id?: string | null
          records_count?: number | null
          started_at?: string | null
          status?: string | null
          storage_url?: string | null
          tables_count?: number | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backup_executions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backup_executions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "backup_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backup_executions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_policies: {
        Row: {
          backup_type: string | null
          compression_type: string | null
          created_at: string | null
          encryption_enabled: boolean | null
          encryption_key_id: string | null
          exclude_tables: string[] | null
          id: string
          include_tables: string[] | null
          is_active: boolean | null
          last_backup_at: string | null
          name: string
          next_backup_at: string | null
          retention_days: number | null
          schedule: Json
          storage_config: Json | null
          storage_provider: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          backup_type?: string | null
          compression_type?: string | null
          created_at?: string | null
          encryption_enabled?: boolean | null
          encryption_key_id?: string | null
          exclude_tables?: string[] | null
          id?: string
          include_tables?: string[] | null
          is_active?: boolean | null
          last_backup_at?: string | null
          name: string
          next_backup_at?: string | null
          retention_days?: number | null
          schedule: Json
          storage_config?: Json | null
          storage_provider?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          backup_type?: string | null
          compression_type?: string | null
          created_at?: string | null
          encryption_enabled?: boolean | null
          encryption_key_id?: string | null
          exclude_tables?: string[] | null
          id?: string
          include_tables?: string[] | null
          is_active?: boolean | null
          last_backup_at?: string | null
          name?: string
          next_backup_at?: string | null
          retention_days?: number | null
          schedule?: Json
          storage_config?: Json | null
          storage_provider?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backup_policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          classroom_id: string | null
          color: string | null
          course: string | null
          created_at: string | null
          created_by: string | null
          custom_fields: Json | null
          description: string | null
          end_date: string | null
          grade: string | null
          id: string
          instructor_id: string | null
          is_active: boolean | null
          level: string | null
          max_students: number | null
          min_students: number | null
          name: string
          schedule_config: Json | null
          start_date: string | null
          subject: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          classroom_id?: string | null
          color?: string | null
          course?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          description?: string | null
          end_date?: string | null
          grade?: string | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          level?: string | null
          max_students?: number | null
          min_students?: number | null
          name: string
          schedule_config?: Json | null
          start_date?: string | null
          subject?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          classroom_id?: string | null
          color?: string | null
          course?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          description?: string | null
          end_date?: string | null
          grade?: string | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          level?: string | null
          max_students?: number | null
          min_students?: number | null
          name?: string
          schedule_config?: Json | null
          start_date?: string | null
          subject?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          agenda: string | null
          consultation_type: Database["public"]["Enums"]["consultation_type"]
          counselor_id: string | null
          created_at: string | null
          duration_minutes: number | null
          effectiveness_rating: number | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          location: string | null
          meeting_url: string | null
          notes: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["consultation_status"] | null
          student_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          agenda?: string | null
          consultation_type: Database["public"]["Enums"]["consultation_type"]
          counselor_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          effectiveness_rating?: number | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          location?: string | null
          meeting_url?: string | null
          notes?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["consultation_status"] | null
          student_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          agenda?: string | null
          consultation_type?: Database["public"]["Enums"]["consultation_type"]
          counselor_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          effectiveness_rating?: number | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          location?: string | null
          meeting_url?: string | null
          notes?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["consultation_status"] | null
          student_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_counselor_id_fkey"
            columns: ["counselor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      course_packages: {
        Row: {
          available_from: string | null
          available_until: string | null
          billing_type: Database["public"]["Enums"]["billing_type"]
          class_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          download_allowed: boolean | null
          hours: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          max_enrollments: number | null
          months: number | null
          name: string
          offline_access: boolean | null
          original_price: number | null
          price: number
          sessions: number | null
          tenant_id: string | null
          updated_at: string | null
          validity_days: number | null
          video_access_days: number | null
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          billing_type: Database["public"]["Enums"]["billing_type"]
          class_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          download_allowed?: boolean | null
          hours?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_enrollments?: number | null
          months?: number | null
          name: string
          offline_access?: boolean | null
          original_price?: number | null
          price: number
          sessions?: number | null
          tenant_id?: string | null
          updated_at?: string | null
          validity_days?: number | null
          video_access_days?: number | null
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          billing_type?: Database["public"]["Enums"]["billing_type"]
          class_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          download_allowed?: boolean | null
          hours?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_enrollments?: number | null
          months?: number | null
          name?: string
          offline_access?: boolean | null
          original_price?: number | null
          price?: number
          sessions?: number | null
          tenant_id?: string | null
          updated_at?: string | null
          validity_days?: number | null
          video_access_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_packages_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_packages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_packages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      instructors: {
        Row: {
          bank_account: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          emergency_contact: string | null
          hire_date: string | null
          id: string
          memo: string | null
          name: string
          phone: string | null
          qualification: string | null
          specialization: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bank_account?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          emergency_contact?: string | null
          hire_date?: string | null
          id?: string
          memo?: string | null
          name: string
          phone?: string | null
          qualification?: string | null
          specialization?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bank_account?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          emergency_contact?: string | null
          hire_date?: string | null
          id?: string
          memo?: string | null
          name?: string
          phone?: string | null
          qualification?: string | null
          specialization?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string
          enrollment_id: string | null
          id: string
          memo: string | null
          payment_date: string | null
          payment_method: string | null
          receipt_number: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          student_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date: string
          enrollment_id?: string | null
          id?: string
          memo?: string | null
          payment_date?: string | null
          payment_method?: string | null
          receipt_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          student_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string
          enrollment_id?: string | null
          id?: string
          memo?: string | null
          payment_date?: string | null
          payment_method?: string | null
          receipt_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          student_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_system_permission: boolean | null
          name: string
          requires_approval: boolean | null
          resource: string
          scope: string
        }
        Insert: {
          action: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_permission?: boolean | null
          name: string
          requires_approval?: boolean | null
          resource: string
          scope: string
        }
        Update: {
          action?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_permission?: boolean | null
          name?: string
          requires_approval?: boolean | null
          resource?: string
          scope?: string
        }
        Relationships: []
      }
      playlist_video_items: {
        Row: {
          created_at: string | null
          id: string
          is_required: boolean | null
          playlist_id: string | null
          sort_order: number
          tenant_id: string | null
          unlock_condition: Json | null
          video_lecture_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          playlist_id?: string | null
          sort_order: number
          tenant_id?: string | null
          unlock_condition?: Json | null
          video_lecture_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          playlist_id?: string | null
          sort_order?: number
          tenant_id?: string | null
          unlock_condition?: Json | null
          video_lecture_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playlist_video_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "video_playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_video_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_video_items_video_lecture_id_fkey"
            columns: ["video_lecture_id"]
            isOneToOne: false
            referencedRelation: "video_lectures"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_scopes: {
        Row: {
          created_at: string | null
          definition: Json
          description: string | null
          id: string
          is_default: boolean | null
          priority: number | null
          resource_type: string
          scope_name: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          definition: Json
          description?: string | null
          id?: string
          is_default?: boolean | null
          priority?: number | null
          resource_type: string
          scope_name: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          definition?: Json
          description?: string | null
          id?: string
          is_default?: boolean | null
          priority?: number | null
          resource_type?: string
          scope_name?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_scopes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          conditions: Json | null
          granted_at: string | null
          granted_by: string | null
          id: string
          permission_id: string | null
          restrictions: Json | null
          role_id: string | null
        }
        Insert: {
          conditions?: Json | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_id?: string | null
          restrictions?: Json | null
          role_id?: string | null
        }
        Update: {
          conditions?: Json | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_id?: string | null
          restrictions?: Json | null
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "tenant_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_policies: {
        Row: {
          base_amount: number | null
          commission_rate: number | null
          conditions: Json | null
          created_at: string | null
          effective_from: string | null
          effective_until: string | null
          id: string
          instructor_id: string | null
          is_active: boolean | null
          name: string
          policy_type: Database["public"]["Enums"]["salary_policy_type"]
          tenant_id: string | null
          tier_config: Json | null
          updated_at: string | null
        }
        Insert: {
          base_amount?: number | null
          commission_rate?: number | null
          conditions?: Json | null
          created_at?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          name: string
          policy_type: Database["public"]["Enums"]["salary_policy_type"]
          tenant_id?: string | null
          tier_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          base_amount?: number | null
          commission_rate?: number | null
          conditions?: Json | null
          created_at?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          name?: string
          policy_type?: Database["public"]["Enums"]["salary_policy_type"]
          tenant_id?: string | null
          tier_config?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_policies_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          assignment_completion_rate: number | null
          attendance_rate: number | null
          average_grade: number | null
          can_download_videos: boolean | null
          class_id: string | null
          created_at: string | null
          custom_fields: Json | null
          discount_amount: number | null
          end_date: string | null
          enrolled_by: string | null
          enrollment_date: string | null
          expires_at: string | null
          final_price: number
          hours_remaining: number | null
          hours_total: number | null
          hours_used: number | null
          id: string
          notes: string | null
          original_price: number
          package_id: string | null
          payment_plan: string | null
          position_in_class: number | null
          sessions_remaining: number | null
          sessions_total: number | null
          sessions_used: number | null
          start_date: string | null
          status: string | null
          student_id: string | null
          tenant_id: string | null
          updated_at: string | null
          video_access_expires_at: string | null
          video_watch_count: number | null
        }
        Insert: {
          assignment_completion_rate?: number | null
          attendance_rate?: number | null
          average_grade?: number | null
          can_download_videos?: boolean | null
          class_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          discount_amount?: number | null
          end_date?: string | null
          enrolled_by?: string | null
          enrollment_date?: string | null
          expires_at?: string | null
          final_price: number
          hours_remaining?: number | null
          hours_total?: number | null
          hours_used?: number | null
          id?: string
          notes?: string | null
          original_price: number
          package_id?: string | null
          payment_plan?: string | null
          position_in_class?: number | null
          sessions_remaining?: number | null
          sessions_total?: number | null
          sessions_used?: number | null
          start_date?: string | null
          status?: string | null
          student_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          video_access_expires_at?: string | null
          video_watch_count?: number | null
        }
        Update: {
          assignment_completion_rate?: number | null
          attendance_rate?: number | null
          average_grade?: number | null
          can_download_videos?: boolean | null
          class_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          discount_amount?: number | null
          end_date?: string | null
          enrolled_by?: string | null
          enrollment_date?: string | null
          expires_at?: string | null
          final_price?: number
          hours_remaining?: number | null
          hours_total?: number | null
          hours_used?: number | null
          id?: string
          notes?: string | null
          original_price?: number
          package_id?: string | null
          payment_plan?: string | null
          position_in_class?: number | null
          sessions_remaining?: number | null
          sessions_total?: number | null
          sessions_used?: number | null
          start_date?: string | null
          status?: string | null
          student_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          video_access_expires_at?: string | null
          video_watch_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_enrolled_by_fkey"
            columns: ["enrolled_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "course_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      student_histories: {
        Row: {
          action: Database["public"]["Enums"]["history_action"]
          description: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          occurred_at: string | null
          performed_by: string | null
          student_id: string | null
          tenant_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["history_action"]
          description: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          occurred_at?: string | null
          performed_by?: string | null
          student_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["history_action"]
          description?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          occurred_at?: string | null
          performed_by?: string | null
          student_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_histories_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_histories_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_histories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      student_video_access: {
        Row: {
          access_expires_at: string | null
          access_granted_at: string | null
          completed_at: string | null
          completion_percentage: number | null
          created_at: string | null
          current_views: number | null
          enrollment_id: string | null
          first_watched_at: string | null
          has_access: boolean | null
          id: string
          last_watched_at: string | null
          max_views: number | null
          student_id: string | null
          tenant_id: string | null
          updated_at: string | null
          video_lecture_id: string | null
          watch_progress_seconds: number | null
          watch_status: Database["public"]["Enums"]["watch_status"] | null
        }
        Insert: {
          access_expires_at?: string | null
          access_granted_at?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          current_views?: number | null
          enrollment_id?: string | null
          first_watched_at?: string | null
          has_access?: boolean | null
          id?: string
          last_watched_at?: string | null
          max_views?: number | null
          student_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          video_lecture_id?: string | null
          watch_progress_seconds?: number | null
          watch_status?: Database["public"]["Enums"]["watch_status"] | null
        }
        Update: {
          access_expires_at?: string | null
          access_granted_at?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          current_views?: number | null
          enrollment_id?: string | null
          first_watched_at?: string | null
          has_access?: boolean | null
          id?: string
          last_watched_at?: string | null
          max_views?: number | null
          student_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          video_lecture_id?: string | null
          watch_progress_seconds?: number | null
          watch_status?: Database["public"]["Enums"]["watch_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "student_video_access_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_video_access_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_video_access_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_video_access_video_lecture_id_fkey"
            columns: ["video_lecture_id"]
            isOneToOne: false
            referencedRelation: "video_lectures"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          birth_date: string | null
          created_at: string | null
          created_by: string | null
          custom_fields: Json | null
          email: string | null
          emergency_contact: Json | null
          enrollment_date: string | null
          gender: string | null
          grade_level: string | null
          id: string
          name: string
          name_english: string | null
          notes: string | null
          parent_name: string | null
          parent_phone_1: string | null
          parent_phone_2: string | null
          phone: string | null
          school_name: string | null
          status: Database["public"]["Enums"]["student_status"] | null
          student_number: string
          tags: string[] | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          email?: string | null
          emergency_contact?: Json | null
          enrollment_date?: string | null
          gender?: string | null
          grade_level?: string | null
          id?: string
          name: string
          name_english?: string | null
          notes?: string | null
          parent_name?: string | null
          parent_phone_1?: string | null
          parent_phone_2?: string | null
          phone?: string | null
          school_name?: string | null
          status?: Database["public"]["Enums"]["student_status"] | null
          student_number: string
          tags?: string[] | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          email?: string | null
          emergency_contact?: Json | null
          enrollment_date?: string | null
          gender?: string | null
          grade_level?: string | null
          id?: string
          name?: string
          name_english?: string | null
          notes?: string | null
          parent_name?: string | null
          parent_phone_1?: string | null
          parent_phone_2?: string | null
          phone?: string | null
          school_name?: string | null
          status?: Database["public"]["Enums"]["student_status"] | null
          student_number?: string
          tags?: string[] | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_memberships: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          is_primary_contact: boolean | null
          last_accessed_at: string | null
          permissions_override: Json | null
          role_id: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_primary_contact?: boolean | null
          last_accessed_at?: string | null
          permissions_override?: Json | null
          role_id?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_primary_contact?: boolean | null
          last_accessed_at?: string | null
          permissions_override?: Json | null
          role_id?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_memberships_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_memberships_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "tenant_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_roles: {
        Row: {
          base_permissions: Json | null
          created_at: string | null
          description: string | null
          display_name: string
          hierarchy_level: number | null
          id: string
          is_assignable: boolean | null
          is_system_role: boolean | null
          max_users: number | null
          name: string
          parent_role_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          base_permissions?: Json | null
          created_at?: string | null
          description?: string | null
          display_name: string
          hierarchy_level?: number | null
          id?: string
          is_assignable?: boolean | null
          is_system_role?: boolean | null
          max_users?: number | null
          name: string
          parent_role_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          base_permissions?: Json | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          hierarchy_level?: number | null
          id?: string
          is_assignable?: boolean | null
          is_system_role?: boolean | null
          max_users?: number | null
          name?: string
          parent_role_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_roles_parent_role_id_fkey"
            columns: ["parent_role_id"]
            isOneToOne: false
            referencedRelation: "tenant_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_users: {
        Row: {
          accepted_at: string | null
          additional_roles: string[] | null
          avatar_url: string | null
          cached_permissions: Json | null
          created_at: string | null
          email: string
          id: string
          invited_at: string | null
          invited_by: string | null
          last_login_at: string | null
          locked_until: string | null
          login_attempts: number | null
          name: string
          password_changed_at: string | null
          permission_overrides: Json | null
          phone: string | null
          primary_role_id: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          additional_roles?: string[] | null
          avatar_url?: string | null
          cached_permissions?: Json | null
          created_at?: string | null
          email: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          last_login_at?: string | null
          locked_until?: string | null
          login_attempts?: number | null
          name: string
          password_changed_at?: string | null
          permission_overrides?: Json | null
          phone?: string | null
          primary_role_id?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          additional_roles?: string[] | null
          avatar_url?: string | null
          cached_permissions?: Json | null
          created_at?: string | null
          email?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          last_login_at?: string | null
          locked_until?: string | null
          login_attempts?: number | null
          name?: string
          password_changed_at?: string | null
          permission_overrides?: Json | null
          phone?: string | null
          primary_role_id?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tenant_users_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          billing_email: string | null
          business_registration: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          domain: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          limits: Json | null
          name: string
          settings: Json | null
          slug: string
          subscription_status: string | null
          subscription_tier: string | null
          tenant_code: string
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          billing_email?: string | null
          business_registration?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          domain?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          limits?: Json | null
          name: string
          settings?: Json | null
          slug: string
          subscription_status?: string | null
          subscription_tier?: string | null
          tenant_code: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          billing_email?: string | null
          business_registration?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          domain?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          limits?: Json | null
          name?: string
          settings?: Json | null
          slug?: string
          subscription_status?: string | null
          subscription_tier?: string | null
          tenant_code?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          email_verified: boolean | null
          id: string
          last_login_at: string | null
          login_count: number | null
          name: string
          phone: string | null
          preferred_language: string | null
          role: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          tenant_id: string | null
          timezone: string | null
          two_factor_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          id: string
          last_login_at?: string | null
          login_count?: number | null
          name: string
          phone?: string | null
          preferred_language?: string | null
          role?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          tenant_id?: string | null
          timezone?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          id?: string
          last_login_at?: string | null
          login_count?: number | null
          name?: string
          phone?: string | null
          preferred_language?: string | null
          role?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          tenant_id?: string | null
          timezone?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      video_lectures: {
        Row: {
          available_qualities:
            | Database["public"]["Enums"]["video_quality"][]
            | null
          average_rating: number | null
          chapter_number: number | null
          class_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          instructor_id: string | null
          is_free: boolean | null
          learning_objectives: string[] | null
          lesson_number: number | null
          like_count: number | null
          prerequisites: string[] | null
          preview_duration_seconds: number | null
          published_at: string | null
          related_materials: Json | null
          sort_order: number | null
          status: Database["public"]["Enums"]["video_status"] | null
          tenant_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_duration_seconds: number | null
          video_type: Database["public"]["Enums"]["video_type"] | null
          view_count: number | null
          youtube_url: string | null
          youtube_video_id: string | null
        }
        Insert: {
          available_qualities?:
            | Database["public"]["Enums"]["video_quality"][]
            | null
          average_rating?: number | null
          chapter_number?: number | null
          class_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          instructor_id?: string | null
          is_free?: boolean | null
          learning_objectives?: string[] | null
          lesson_number?: number | null
          like_count?: number | null
          prerequisites?: string[] | null
          preview_duration_seconds?: number | null
          published_at?: string | null
          related_materials?: Json | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["video_status"] | null
          tenant_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_duration_seconds?: number | null
          video_type?: Database["public"]["Enums"]["video_type"] | null
          view_count?: number | null
          youtube_url?: string | null
          youtube_video_id?: string | null
        }
        Update: {
          available_qualities?:
            | Database["public"]["Enums"]["video_quality"][]
            | null
          average_rating?: number | null
          chapter_number?: number | null
          class_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          instructor_id?: string | null
          is_free?: boolean | null
          learning_objectives?: string[] | null
          lesson_number?: number | null
          like_count?: number | null
          prerequisites?: string[] | null
          preview_duration_seconds?: number | null
          published_at?: string | null
          related_materials?: Json | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["video_status"] | null
          tenant_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_duration_seconds?: number | null
          video_type?: Database["public"]["Enums"]["video_type"] | null
          view_count?: number | null
          youtube_url?: string | null
          youtube_video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_lectures_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_lectures_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_lectures_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_lectures_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      video_playlists: {
        Row: {
          auto_progress: boolean | null
          class_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          instructor_id: string | null
          is_published: boolean | null
          is_sequential: boolean | null
          name: string
          sort_order: number | null
          tenant_id: string | null
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          auto_progress?: boolean | null
          class_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean | null
          is_sequential?: boolean | null
          name: string
          sort_order?: number | null
          tenant_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_progress?: boolean | null
          class_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean | null
          is_sequential?: boolean | null
          name?: string
          sort_order?: number | null
          tenant_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_playlists_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_playlists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_playlists_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_playlists_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      video_ratings: {
        Row: {
          audio_quality: number | null
          content_quality: number | null
          created_at: string | null
          difficulty_level: number | null
          explanation_clarity: number | null
          id: string
          is_helpful: boolean | null
          rating: number | null
          review_text: string | null
          student_id: string | null
          tags: string[] | null
          tenant_id: string | null
          updated_at: string | null
          video_lecture_id: string | null
          video_quality_rating: number | null
        }
        Insert: {
          audio_quality?: number | null
          content_quality?: number | null
          created_at?: string | null
          difficulty_level?: number | null
          explanation_clarity?: number | null
          id?: string
          is_helpful?: boolean | null
          rating?: number | null
          review_text?: string | null
          student_id?: string | null
          tags?: string[] | null
          tenant_id?: string | null
          updated_at?: string | null
          video_lecture_id?: string | null
          video_quality_rating?: number | null
        }
        Update: {
          audio_quality?: number | null
          content_quality?: number | null
          created_at?: string | null
          difficulty_level?: number | null
          explanation_clarity?: number | null
          id?: string
          is_helpful?: boolean | null
          rating?: number | null
          review_text?: string | null
          student_id?: string | null
          tags?: string[] | null
          tenant_id?: string | null
          updated_at?: string | null
          video_lecture_id?: string | null
          video_quality_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_ratings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_ratings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_ratings_video_lecture_id_fkey"
            columns: ["video_lecture_id"]
            isOneToOne: false
            referencedRelation: "video_lectures"
            referencedColumns: ["id"]
          },
        ]
      }
      video_watch_sessions: {
        Row: {
          bookmarks: Json | null
          completion_percentage: number | null
          created_at: string | null
          device_type: string | null
          enrollment_id: string | null
          id: string
          ip_address: unknown | null
          is_liked: boolean | null
          last_position_time: string | null
          notes: string | null
          play_count: number | null
          playback_quality: Database["public"]["Enums"]["video_quality"] | null
          progress_seconds: number | null
          rating: number | null
          session_start_time: string | null
          student_id: string | null
          tenant_id: string | null
          total_watch_time: number | null
          updated_at: string | null
          user_agent: string | null
          video_id: string | null
          watch_status: Database["public"]["Enums"]["watch_status"] | null
        }
        Insert: {
          bookmarks?: Json | null
          completion_percentage?: number | null
          created_at?: string | null
          device_type?: string | null
          enrollment_id?: string | null
          id?: string
          ip_address?: unknown | null
          is_liked?: boolean | null
          last_position_time?: string | null
          notes?: string | null
          play_count?: number | null
          playback_quality?: Database["public"]["Enums"]["video_quality"] | null
          progress_seconds?: number | null
          rating?: number | null
          session_start_time?: string | null
          student_id?: string | null
          tenant_id?: string | null
          total_watch_time?: number | null
          updated_at?: string | null
          user_agent?: string | null
          video_id?: string | null
          watch_status?: Database["public"]["Enums"]["watch_status"] | null
        }
        Update: {
          bookmarks?: Json | null
          completion_percentage?: number | null
          created_at?: string | null
          device_type?: string | null
          enrollment_id?: string | null
          id?: string
          ip_address?: unknown | null
          is_liked?: boolean | null
          last_position_time?: string | null
          notes?: string | null
          play_count?: number | null
          playback_quality?: Database["public"]["Enums"]["video_quality"] | null
          progress_seconds?: number | null
          rating?: number | null
          session_start_time?: string | null
          student_id?: string | null
          tenant_id?: string | null
          total_watch_time?: number | null
          updated_at?: string | null
          user_agent?: string | null
          video_id?: string | null
          watch_status?: Database["public"]["Enums"]["watch_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "video_watch_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_watch_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_watch_sessions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          available_from: string | null
          available_until: string | null
          average_rating: number | null
          class_id: string | null
          comment_count: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_seconds: number | null
          id: string
          instructor_id: string | null
          is_public: boolean | null
          learning_objectives: string[] | null
          like_count: number | null
          order_index: number | null
          password_hash: string | null
          password_protected: boolean | null
          prerequisites: string[] | null
          quality: Database["public"]["Enums"]["video_quality"] | null
          status: Database["public"]["Enums"]["video_status"] | null
          tags: string[] | null
          tenant_id: string | null
          thumbnail_url: string | null
          title: string
          total_watch_time: number | null
          updated_at: string | null
          video_type: Database["public"]["Enums"]["video_type"]
          view_count: number | null
          youtube_url: string
          youtube_video_id: string
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          average_rating?: number | null
          class_id?: string | null
          comment_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          instructor_id?: string | null
          is_public?: boolean | null
          learning_objectives?: string[] | null
          like_count?: number | null
          order_index?: number | null
          password_hash?: string | null
          password_protected?: boolean | null
          prerequisites?: string[] | null
          quality?: Database["public"]["Enums"]["video_quality"] | null
          status?: Database["public"]["Enums"]["video_status"] | null
          tags?: string[] | null
          tenant_id?: string | null
          thumbnail_url?: string | null
          title: string
          total_watch_time?: number | null
          updated_at?: string | null
          video_type?: Database["public"]["Enums"]["video_type"]
          view_count?: number | null
          youtube_url: string
          youtube_video_id: string
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          average_rating?: number | null
          class_id?: string | null
          comment_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          instructor_id?: string | null
          is_public?: boolean | null
          learning_objectives?: string[] | null
          like_count?: number | null
          order_index?: number | null
          password_hash?: string | null
          password_protected?: boolean | null
          prerequisites?: string[] | null
          quality?: Database["public"]["Enums"]["video_quality"] | null
          status?: Database["public"]["Enums"]["video_status"] | null
          tags?: string[] | null
          tenant_id?: string | null
          thumbnail_url?: string | null
          title?: string
          total_watch_time?: number | null
          updated_at?: string | null
          video_type?: Database["public"]["Enums"]["video_type"]
          view_count?: number | null
          youtube_url?: string
          youtube_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_developer_email: {
        Args: { email_to_check: string }
        Returns: boolean
      }
      user_can_access_tenant: {
        Args: { target_tenant_id: string }
        Returns: boolean
      }
      user_has_role: {
        Args: { role_name: string }
        Returns: boolean
      }
    }
    Enums: {
      attendance_status: "present" | "absent" | "late" | "excused"
      billing_type: "monthly" | "sessions" | "hours" | "package" | "drop_in"
      consultation_status: "scheduled" | "completed" | "cancelled" | "no_show"
      consultation_type:
        | "enrollment"
        | "academic"
        | "behavioral"
        | "career"
        | "parent_meeting"
        | "follow_up"
      history_action:
        | "create"
        | "update"
        | "delete"
        | "move"
        | "enroll"
        | "withdraw"
        | "payment"
        | "exam"
        | "consultation"
      payment_status:
        | "pending"
        | "completed"
        | "overdue"
        | "cancelled"
        | "refunded"
      salary_policy_type:
        | "fixed_monthly"
        | "fixed_hourly"
        | "commission"
        | "tiered_commission"
        | "student_based"
        | "hybrid"
        | "guaranteed_minimum"
      student_status:
        | "active"
        | "inactive"
        | "graduated"
        | "withdrawn"
        | "suspended"
      user_status: "active" | "inactive" | "suspended" | "pending_approval"
      video_quality:
        | "240p"
        | "360p"
        | "480p"
        | "720p"
        | "1080p"
        | "1440p"
        | "2160p"
      video_status: "draft" | "published" | "private" | "archived" | "deleted"
      video_type:
        | "lecture"
        | "supplement"
        | "homework_review"
        | "exam_review"
        | "announcement"
      watch_status: "not_started" | "in_progress" | "completed" | "skipped"
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
      attendance_status: ["present", "absent", "late", "excused"],
      billing_type: ["monthly", "sessions", "hours", "package", "drop_in"],
      consultation_status: ["scheduled", "completed", "cancelled", "no_show"],
      consultation_type: [
        "enrollment",
        "academic",
        "behavioral",
        "career",
        "parent_meeting",
        "follow_up",
      ],
      history_action: [
        "create",
        "update",
        "delete",
        "move",
        "enroll",
        "withdraw",
        "payment",
        "exam",
        "consultation",
      ],
      payment_status: [
        "pending",
        "completed",
        "overdue",
        "cancelled",
        "refunded",
      ],
      salary_policy_type: [
        "fixed_monthly",
        "fixed_hourly",
        "commission",
        "tiered_commission",
        "student_based",
        "hybrid",
        "guaranteed_minimum",
      ],
      student_status: [
        "active",
        "inactive",
        "graduated",
        "withdrawn",
        "suspended",
      ],
      user_status: ["active", "inactive", "suspended", "pending_approval"],
      video_quality: [
        "240p",
        "360p",
        "480p",
        "720p",
        "1080p",
        "1440p",
        "2160p",
      ],
      video_status: ["draft", "published", "private", "archived", "deleted"],
      video_type: [
        "lecture",
        "supplement",
        "homework_review",
        "exam_review",
        "announcement",
      ],
      watch_status: ["not_started", "in_progress", "completed", "skipped"],
    },
  },
} as const
