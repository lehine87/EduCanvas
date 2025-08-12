// EduCanvas v2.0 Database Types
// Generated from: database_schema_v2.sql
// Auto-generated on: 2025-08-08

// ================================================================
// 1. ENUM TYPES (PostgreSQL Enums → TypeScript)
// ================================================================

export type StudentStatus = 'active' | 'waiting' | 'inactive' | 'graduated';

export type UserRole = 'admin' | 'instructor' | 'staff' | 'viewer';

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';

export type PaymentStatus = 'pending' | 'completed' | 'overdue' | 'cancelled' | 'refunded';

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mobile';

export type BillingType = 'monthly' | 'sessions' | 'hours' | 'package' | 'drop_in';

export type DiscountType = 'sibling' | 'early_payment' | 'loyalty' | 'scholarship' | 'promotion' | 'volume';

export type SalaryPolicyType = 'fixed_monthly' | 'fixed_hourly' | 'commission' | 'tiered_commission' | 'student_based' | 'hybrid' | 'guaranteed_minimum';

// ================================================================
// 2. BASE ENTITY TYPES
// ================================================================

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// ================================================================
// 3. CORE TABLE TYPES
// ================================================================

export interface User extends BaseEntity {
  email: string;
  name: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  last_login?: string;
}

export interface UserProfile extends BaseEntity {
  email: string;        // NOT NULL 필수
  name: string;         // NOT NULL 필수 (full_name이 아님!)
  language?: string;    // DEFAULT 'ko'
  timezone?: string;    // DEFAULT 'Asia/Seoul'
  status?: string;      // DEFAULT 'active'
  is_premium?: boolean; // DEFAULT false
  is_admin?: boolean;   // DEFAULT false
  points?: number;      // DEFAULT 0
}

export interface Instructor extends BaseEntity {
  user_id?: string;
  name: string;
  phone?: string;
  email?: string;
  specialization?: string;
  qualification?: string;
  bank_account?: string;
  status: StudentStatus;
  hire_date: string;
  memo?: string;
}

export interface Class extends BaseEntity {
  name: string;
  subject?: string;
  grade_level?: string;
  max_students: number;
  current_students: number;
  instructor_id?: string;
  classroom?: string;
  color: string;
  status: StudentStatus;
  order_index: number;
  start_date?: string;
  end_date?: string;
  memo?: string;
}

export interface Student extends BaseEntity {
  name: string;
  phone?: string;
  parent_name?: string;
  parent_phone: string;
  grade?: string;
  class_id?: string;
  status: StudentStatus;
  enrollment_date: string;
  graduation_date?: string;
  position_in_class: number;
  display_color?: string;
  memo?: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  enrollment_id?: string;
  attendance_date: string;
  status: AttendanceStatus;
  check_in_time?: string;
  check_out_time?: string;
  temperature?: number;
  actual_hours?: number;
  memo?: string;
  created_at: string;
}

export interface Payment extends BaseEntity {
  student_id: string;
  enrollment_id?: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  due_date: string;
  status: PaymentStatus;
  receipt_number?: string;
  transaction_id?: string;
  installment_count: number;
  installment_number: number;
  parent_payment_id?: string;
  memo?: string;
}

export interface ClassSchedule {
  id: string;
  class_id: string;
  day_of_week: number; // 0-6 (Sunday=0)
  start_time: string;
  end_time: string;
  duration_minutes: number;
  created_at: string;
}

// ================================================================
// 4. SUPABASE DATABASE TYPE
// ================================================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at' | 'language' | 'timezone' | 'status' | 'is_premium' | 'is_admin' | 'points'> & {
          id: string; // 필수: auth.users.id와 동일해야 함
          language?: string;
          timezone?: string;
          status?: string;
          is_premium?: boolean;
          is_admin?: boolean;
          points?: number;
        };
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;
      };
      instructors: {
        Row: Instructor;
        Insert: Omit<Instructor, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Instructor, 'id' | 'created_at' | 'updated_at'>>;
      };
      classes: {
        Row: Class;
        Insert: Omit<Class, 'id' | 'created_at' | 'updated_at' | 'current_students'>;
        Update: Partial<Omit<Class, 'id' | 'created_at' | 'updated_at' | 'current_students'>>;
      };
      students: {
        Row: Student;
        Insert: Omit<Student, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Student, 'id' | 'created_at' | 'updated_at'>>;
      };
      attendances: {
        Row: Attendance;
        Insert: Omit<Attendance, 'id' | 'created_at'>;
        Update: Partial<Omit<Attendance, 'id' | 'created_at'>>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Payment, 'id' | 'created_at' | 'updated_at'>>;
      };
      class_schedules: {
        Row: ClassSchedule;
        Insert: Omit<ClassSchedule, 'id' | 'created_at' | 'duration_minutes'>;
        Update: Partial<Omit<ClassSchedule, 'id' | 'created_at' | 'duration_minutes'>>;
      };
    };
    Views: {
      // Views will be defined in view-specific types
    };
    Functions: {
      // Functions will be defined in function-specific types
    };
    Enums: {
      student_status: StudentStatus;
      user_role: UserRole;
      attendance_status: AttendanceStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
      billing_type: BillingType;
      discount_type: DiscountType;
      salary_policy_type: SalaryPolicyType;
    };
  };
}

// ================================================================
// 5. COMMON UTILITY TYPES
// ================================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginationResult<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
  has_more: boolean;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

// ================================================================
// 6. FILTER AND SEARCH TYPES
// ================================================================

export interface StudentFilters {
  search?: string;
  status?: StudentStatus | 'all';
  class_id?: string | 'all';
  grade?: string | 'all';
  enrollment_date_from?: string;
  enrollment_date_to?: string;
}

export interface ClassFilters {
  search?: string;
  status?: StudentStatus | 'all';
  instructor_id?: string | 'all';
  subject?: string | 'all';
}

export interface PaymentFilters {
  student_id?: string;
  status?: PaymentStatus | 'all';
  payment_method?: PaymentMethod | 'all';
  due_date_from?: string;
  due_date_to?: string;
  overdue_only?: boolean;
}

export interface AttendanceFilters {
  student_id?: string;
  class_id?: string;
  status?: AttendanceStatus | 'all';
  date_from?: string;
  date_to?: string;
}

// ================================================================
// 7. RELATIONSHIP TYPES (WITH JOINS)
// ================================================================

export interface StudentWithClass extends Student {
  class?: Class;
  instructor?: Instructor;
}

export interface ClassWithInstructor extends Class {
  instructor?: Instructor;
  students?: Student[];
}

export interface AttendanceWithRelations extends Attendance {
  student?: Student;
  class?: Class;
}

export interface PaymentWithRelations extends Payment {
  student?: Student;
  enrollment?: StudentEnrollment;
}

// ================================================================
// 8. STATISTICS AND AGGREGATION TYPES
// ================================================================

export interface StudentStats {
  total: number;
  active: number;
  waiting: number;
  inactive: number;
  graduated: number;
  new_this_month: number;
}

export interface ClassStats {
  total: number;
  active: number;
  inactive: number;
  average_occupancy: number;
  total_revenue: number;
}

export interface AttendanceStats {
  total_days: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  excused_count: number;
  attendance_rate: number;
}

export interface PaymentStats {
  total_amount: number;
  completed_amount: number;
  pending_amount: number;
  overdue_amount: number;
  overdue_count: number;
}

// Forward declarations for course package and enrollment types
export interface CoursePackage extends BaseEntity {
  class_id: string;
  name: string;
  billing_type: BillingType;
  base_price: number;
  sessions_count?: number;
  hours_count?: number;
  duration_months?: number;
  duration_days?: number;
  discount_rate: number;
  is_active: boolean;
  auto_renewal: boolean;
  sort_order: number;
}

export interface StudentEnrollment extends BaseEntity {
  student_id: string;
  course_package_id: string;
  enrolled_at: string;
  start_date: string;
  end_date?: string;
  original_price: number;
  final_price: number;
  applied_discounts?: Json;
  total_sessions: number;
  used_sessions: number;
  remaining_sessions: number;
  total_hours: number;
  used_hours: number;
  remaining_hours: number;
  status: StudentStatus;
  auto_renewal: boolean;
  memo?: string;
}