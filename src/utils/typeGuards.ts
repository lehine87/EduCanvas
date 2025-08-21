// Type Guards and Validators for EduCanvas
// Provides runtime type checking and validation using both custom guards and Zod schemas

import { z } from 'zod'
import type { Database, Json } from '@/types/database'
import type { Student } from '@/types/student.types'
import type { ClassFlowStudent } from '@/types/app.types'

// Database 타입들을 간편하게 사용하기 위한 alias
type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

// Row types
type StudentRow = Tables['students']['Row']
type ClassRow = Tables['classes']['Row']
type TenantRow = Tables['tenants']['Row']
type InstructorRow = Tables['instructors']['Row']
type VideoRow = Tables['videos']['Row']
type VideoWatchSessionRow = Tables['video_watch_sessions']['Row']
type CoursePackageRow = Tables['course_packages']['Row']

// Insert types
type StudentInsert = Tables['students']['Insert']
type ClassInsert = Tables['classes']['Insert']
type TenantInsert = Tables['tenants']['Insert']
type InstructorInsert = Tables['instructors']['Insert']
type VideoInsert = Tables['videos']['Insert']
type VideoWatchSessionInsert = Tables['video_watch_sessions']['Insert']
type CoursePackageInsert = Tables['course_packages']['Insert']

// Update types
type StudentUpdate = Tables['students']['Update']
type ClassUpdate = Tables['classes']['Update']
type TenantUpdate = Tables['tenants']['Update']
type InstructorUpdate = Tables['instructors']['Update']
type VideoUpdate = Tables['videos']['Update']
type VideoWatchSessionUpdate = Tables['video_watch_sessions']['Update']
type CoursePackageUpdate = Tables['course_packages']['Update']

// Enum types
type UserStatus = Enums['user_status']
type StudentStatus = Enums['student_status']
type VideoStatus = Enums['video_status']
// VideoQuality enum이 데이터베이스에 없으므로 제거
type BillingType = Enums['billing_type']
type AttendanceStatus = Enums['attendance_status']
type PaymentStatus = Enums['payment_status']

// Compatibility aliases for existing code
type Class = ClassRow
type Tenant = TenantRow
type Instructor = InstructorRow
type Video = VideoRow
type VideoWatchSession = VideoWatchSessionRow
type CoursePackage = CoursePackageRow

// Define missing permission types (these should be properly defined elsewhere)
type PermissionResource = 'students' | 'classes' | 'instructors' | 'videos' | 'reports' | 'settings'
type PermissionAction = 'read' | 'write' | 'delete' | 'admin'

// ================================================================
// Enum Validators
// ================================================================
export const UserStatusSchema = z.enum(['active', 'inactive', 'suspended', 'pending_approval'] as const)
export const StudentStatusSchema = z.enum(['active', 'inactive', 'graduated', 'withdrawn', 'suspended'] as const)
export const BillingTypeSchema = z.enum(['monthly', 'sessions', 'hours', 'package', 'drop_in'] as const)
export const DiscountTypeSchema = z.enum(['sibling', 'early_payment', 'loyalty', 'scholarship', 'promotion', 'volume'] as const)
export const AttendanceStatusSchema = z.enum(['present', 'absent', 'late', 'excused'] as const)
export const PaymentStatusSchema = z.enum(['pending', 'completed', 'overdue', 'cancelled', 'refunded'] as const)
export const VideoStatusSchema = z.enum(['draft', 'published', 'private', 'archived', 'deleted'] as const)
export const VideoTypeSchema = z.enum(['lecture', 'supplement', 'homework_review', 'exam_review', 'announcement'] as const)
// VideoQualitySchema 제거 - YouTube에서 품질 자동 관리

// ================================================================
// Base Zod Schemas
// ================================================================

// UUID validation
export const UUIDSchema = z.string().uuid('Invalid UUID format')

// Common field schemas
export const NameSchema = z.string().min(1, 'Name is required').max(100, 'Name too long')
export const PhoneSchema = z.string().regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone format').optional().nullable()
export const EmailSchema = z.string().email('Invalid email format').optional().nullable()
export const ColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional()

// ================================================================
// Core Entity Schemas
// ================================================================

// Tenant Schemas
export const TenantSchema = z.object({
  id: UUIDSchema,
  name: NameSchema,
  slug: z.string().min(1).max(50),
  domain: z.string().max(100).nullable(),
  contact_email: EmailSchema,
  contact_phone: PhoneSchema,
  address: z.string().nullable(),
  business_registration: z.string().max(50).nullable(),
  settings: z.record(z.string(), z.unknown()).default({}),
  features: z.record(z.string(), z.unknown()).default({}),
  limits: z.record(z.string(), z.unknown()).default({}),
  subscription_tier: z.string().max(20).default('basic'),
  subscription_status: z.string().max(20).default('active'),
  trial_ends_at: z.string().datetime().nullable(),
  billing_email: EmailSchema,
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const TenantInsertSchema = TenantSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).partial({
  settings: true,
  features: true,
  limits: true,
  subscription_tier: true,
  subscription_status: true,
  is_active: true
})

export const TenantUpdateSchema = TenantInsertSchema.partial()

// Student Schemas
export const StudentSchema = z.object({
  id: UUIDSchema,
  tenant_id: UUIDSchema.nullable(),
  student_number: z.string().min(1, 'Student number is required'),
  name: NameSchema,
  name_english: z.string().max(100).nullable(),
  phone: PhoneSchema,
  email: EmailSchema,
  parent_name: z.string().max(100).nullable(),
  parent_phone_1: PhoneSchema,
  parent_phone_2: PhoneSchema,
  address: z.string().nullable(),
  birth_date: z.string().nullable(),
  gender: z.string().max(10).nullable(),
  grade_level: z.string().max(20).nullable(),
  school_name: z.string().max(100).nullable(),
  status: StudentStatusSchema.nullable(),
  enrollment_date: z.string().nullable(),
  emergency_contact: z.custom<Json>().nullable(),
  custom_fields: z.custom<Json>().nullable(),
  tags: z.array(z.string()).nullable(),
  notes: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  created_by: UUIDSchema.nullable()
})

export const StudentInsertSchema = StudentSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).partial({
  tenant_id: true,
  name_english: true,
  phone: true,
  email: true,
  parent_name: true,
  parent_phone_1: true,
  parent_phone_2: true,
  address: true,
  birth_date: true,
  gender: true,
  grade_level: true,
  school_name: true,
  status: true,
  enrollment_date: true,
  emergency_contact: true,
  custom_fields: true,
  tags: true,
  notes: true,
  created_by: true
})

export const StudentUpdateSchema = StudentInsertSchema.omit({ tenant_id: true }).partial()

// Class Schemas
export const ClassSchema = z.object({
  id: UUIDSchema,
  tenant_id: UUIDSchema.nullable(),
  name: NameSchema,
  subject: z.string().max(50).nullable(),
  course: z.string().max(50).nullable(),
  grade: z.string().max(20).nullable(),
  level: z.string().max(20).nullable(),
  description: z.string().nullable(),
  max_students: z.number().int().nullable(),
  min_students: z.number().int().nullable(),
  instructor_id: UUIDSchema.nullable(),
  classroom_id: UUIDSchema.nullable(),
  color: z.string().nullable(),
  is_active: z.boolean().nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  schedule_config: z.custom<Json>().nullable(),
  custom_fields: z.custom<Json>().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  created_by: UUIDSchema.nullable()
})

export const ClassInsertSchema = ClassSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).partial({
  tenant_id: true,
  subject: true,
  course: true,
  grade: true,
  level: true,
  description: true,
  max_students: true,
  min_students: true,
  instructor_id: true,
  classroom_id: true,
  color: true,
  is_active: true,
  start_date: true,
  end_date: true,
  schedule_config: true,
  custom_fields: true,
  created_by: true
})

export const ClassUpdateSchema = ClassInsertSchema.omit({ tenant_id: true }).partial()

// Instructor Schemas
export const InstructorSchema = z.object({
  id: UUIDSchema,
  tenant_id: UUIDSchema,
  user_id: UUIDSchema.nullable(),
  name: NameSchema,
  phone: PhoneSchema,
  email: EmailSchema,
  specialization: z.string().max(100).nullable(),
  qualification: z.string().nullable(),
  bank_account: z.string().max(50).nullable(),
  status: StudentStatusSchema.default('active'),
  hire_date: z.string().date(),
  memo: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const InstructorInsertSchema = InstructorSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).partial({
  hire_date: true,
  status: true
})

export const InstructorUpdateSchema = InstructorInsertSchema.omit({ tenant_id: true }).partial()

// YouTube Video Schemas
export const VideoSchema = z.object({
  id: UUIDSchema,
  tenant_id: UUIDSchema.nullable(),
  youtube_url: z.string().url(),
  youtube_video_id: z.string().nullable(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable(),
  duration_seconds: z.number().int().min(0).nullable(),
  thumbnail_url: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  learning_objectives: z.array(z.string()).nullable(),
  prerequisites: z.array(z.string()).nullable(),
  instructor_id: UUIDSchema.nullable(),
  class_id: UUIDSchema.nullable(),
  video_type: VideoTypeSchema,
  status: VideoStatusSchema.nullable(),
  // quality: 제거 - YouTube에서 자동 관리
  view_count: z.number().int().min(0).nullable(),
  like_count: z.number().int().min(0).nullable(),
  comment_count: z.number().int().min(0).nullable(),
  order_index: z.number().int().min(0).nullable(),
  is_public: z.boolean().nullable(),
  password_protected: z.boolean().nullable(),
  password_hash: z.string().nullable(),
  available_from: z.string().nullable(),
  available_until: z.string().nullable(),
  total_watch_time: z.number().int().min(0).nullable(),
  average_rating: z.number().min(0).max(5).nullable(),
  created_by: UUIDSchema.nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable()
})

export const VideoInsertSchema = VideoSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).partial({
  tenant_id: true,
  description: true,
  duration_seconds: true,
  thumbnail_url: true,
  tags: true,
  learning_objectives: true,
  prerequisites: true,
  instructor_id: true,
  class_id: true,
  status: true,
  quality: true,
  view_count: true,
  like_count: true,
  comment_count: true,
  order_index: true,
  is_public: true,
  password_protected: true,
  password_hash: true,
  available_from: true,
  available_until: true,
  total_watch_time: true,
  average_rating: true,
  created_by: true
})

export const VideoUpdateSchema = VideoInsertSchema.omit({ tenant_id: true, youtube_url: true }).partial()

// Video Watch Session Schemas
export const WatchStatusSchema = z.enum(['not_started', 'in_progress', 'completed', 'skipped'] as const)

export const VideoWatchSessionSchema = z.object({
  id: UUIDSchema,
  tenant_id: UUIDSchema.nullable(),
  student_id: UUIDSchema.nullable(),
  video_id: UUIDSchema.nullable(),
  enrollment_id: UUIDSchema.nullable(),
  session_start_time: z.string().nullable(),
  last_position_time: z.string().nullable(),
  progress_seconds: z.number().int().min(0).nullable(),
  total_watch_time: z.number().int().min(0).nullable(),
  completion_percentage: z.number().min(0).max(100).nullable(),
  watch_status: WatchStatusSchema.nullable(),
  // playback_quality: 제거 - YouTube에서 자동 관리
  device_type: z.string().nullable(),
  user_agent: z.string().nullable(),
  ip_address: z.unknown().nullable(),
  play_count: z.number().int().min(0).nullable(),
  is_liked: z.boolean().nullable(),
  rating: z.number().int().min(1).max(5).nullable(),
  notes: z.string().nullable(),
  bookmarks: z.custom<Json>().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable()
})

export const VideoWatchSessionInsertSchema = VideoWatchSessionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).partial({
  progress_seconds: true,
  total_watch_time: true,
  completion_percentage: true,
  watch_status: true,
  playback_quality: true,
  play_count: true,
  is_liked: true,
  rating: true,
  notes: true,
  bookmarks: true
})

export const VideoWatchSessionUpdateSchema = VideoWatchSessionInsertSchema.omit({
  tenant_id: true,
  student_id: true,
  video_id: true,
  enrollment_id: true
}).partial()

// Course Package Schemas
export const CoursePackageSchema = z.object({
  id: UUIDSchema,
  tenant_id: UUIDSchema,
  class_id: UUIDSchema,
  name: NameSchema,
  billing_type: BillingTypeSchema,
  price: z.number().min(0),
  sessions_count: z.number().int().min(0).nullable(),
  hours_count: z.number().min(0).nullable(),
  validity_days: z.number().int().min(1).nullable(),
  max_monthly_sessions: z.number().int().min(0).nullable(),
  discount_type: DiscountTypeSchema.nullable(),
  discount_value: z.number().min(0).nullable(),
  auto_extend: z.boolean().default(false),
  status: StudentStatusSchema.default('active'),
  description: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const CoursePackageInsertSchema = CoursePackageSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).partial({
  auto_extend: true,
  status: true
})

export const CoursePackageUpdateSchema = CoursePackageInsertSchema.omit({ tenant_id: true }).partial()

// ================================================================
// Custom Validation Schemas
// ================================================================

// ClassFlow Student Schema
export const ClassFlowStudentSchema = StudentSchema.extend({
  position: z.object({
    x: z.number(),
    y: z.number()
  }).optional(),
  isDragging: z.boolean().optional(),
  isSelected: z.boolean().optional(),
  isHighlighted: z.boolean().optional(),
  dragIndex: z.number().optional(),
  originalClass: z.string().optional()
})

// Video Watch Session Schema
// Form Data Schemas
export const StudentFormDataSchema = StudentInsertSchema.extend({
  confirmParentPhone: z.string().optional(),
  emergencyContact: z.object({
    name: z.string().min(1),
    relationship: z.string().min(1),
    phone: z.string().min(1)
  }).optional()
}).refine(
  (data) => {
    // confirmParentPhone이 있는 경우에만 검증
    if (data.confirmParentPhone) {
      return data.parent_phone_1 === data.confirmParentPhone
    }
    return true
  },
  {
    message: 'Parent phone confirmation does not match',
    path: ['confirmParentPhone']
  }
)

export const VideoWatchSessionFormDataSchema = z.object({
  studentId: UUIDSchema,
  videoId: UUIDSchema,
  enrollmentId: UUIDSchema.optional(),
  progressSeconds: z.number().int().min(0),
  totalWatchTime: z.number().int().min(0),
  completionPercentage: z.number().min(0).max(100),
  watchStatus: WatchStatusSchema,
  notes: z.string().optional(),
  sessionData: VideoWatchSessionSchema
})

// ================================================================
// Type Guards (Runtime Type Checking)
// ================================================================

export function isUUID(value: unknown): value is string {
  return typeof value === 'string' && UUIDSchema.safeParse(value).success
}

export function isStudent(obj: unknown): obj is Student {
  return StudentSchema.safeParse(obj).success
}

export function isClass(obj: unknown): obj is Class {
  return ClassSchema.safeParse(obj).success
}

export function isTenant(obj: unknown): obj is Tenant {
  return TenantSchema.safeParse(obj).success
}

export function isInstructor(obj: unknown): obj is Instructor {
  return InstructorSchema.safeParse(obj).success
}

export function isVideo(obj: unknown): obj is Video {
  return VideoSchema.safeParse(obj).success
}

export function isCoursePackage(obj: unknown): obj is CoursePackage {
  return CoursePackageSchema.safeParse(obj).success
}

export function isClassFlowStudent(obj: unknown): obj is ClassFlowStudent {
  return ClassFlowStudentSchema.safeParse(obj).success
}

export function isVideoWatchSession(obj: unknown): obj is VideoWatchSession {
  return VideoWatchSessionSchema.safeParse(obj).success
}

// Enum Type Guards
export function isUserStatus(value: unknown): value is UserStatus {
  return UserStatusSchema.safeParse(value).success
}

export function isStudentStatus(value: unknown): value is StudentStatus {
  return StudentStatusSchema.safeParse(value).success
}

export function isBillingType(value: unknown): value is BillingType {
  return BillingTypeSchema.safeParse(value).success
}

export function isVideoStatus(value: unknown): value is VideoStatus {
  return VideoStatusSchema.safeParse(value).success
}

// VideoQuality 관련 함수 제거 - YouTube 기반으로 품질 자동 관리

// ================================================================
// Validation Functions
// ================================================================

export function validateStudent(data: unknown): { success: true; data: Student } | { success: false; errors: string[] } {
  const result = StudentSchema.safeParse(data)
  if (result.success) {
    // Zod 스키마 결과를 Database 타입으로 안전하게 변환
    return { success: true, data: result.data as any }
  } else {
    return {
      success: false,
      errors: result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
    }
  }
}

export function validateStudentInsert(data: unknown): { success: true; data: StudentInsert } | { success: false; errors: string[] } {
  const result = StudentInsertSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data as StudentInsert }
  } else {
    return {
      success: false,
      errors: result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
    }
  }
}

export function validateClass(data: unknown): { success: true; data: Class } | { success: false; errors: string[] } {
  const result = ClassSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data as Class }
  } else {
    return {
      success: false,
      errors: result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
    }
  }
}

export function validateVideo(data: unknown): { success: true; data: Video } | { success: false; errors: string[] } {
  const result = VideoSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data as any }
  } else {
    return {
      success: false,
      errors: result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
    }
  }
}

export function validateVideoWatchSession(data: unknown): { success: true; data: VideoWatchSession } | { success: false; errors: string[] } {
  const result = VideoWatchSessionSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data as any }
  } else {
    return {
      success: false,
      errors: result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
    }
  }
}

// ================================================================
// Utility Validation Functions
// ================================================================

export function validateEmail(email: string): boolean {
  return EmailSchema.safeParse(email).success
}

export function validatePhone(phone: string): boolean {
  return PhoneSchema.safeParse(phone).success
}

export function validateUUID(uuid: string): boolean {
  return UUIDSchema.safeParse(uuid).success
}

export function validateColor(color: string): boolean {
  return ColorSchema.safeParse(color).success
}

// Sanitization Functions
export function sanitizeString(input: string, maxLength = 255): string {
  return input.trim().slice(0, maxLength)
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d\s\-\+\(\)]/g, '').trim()
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

// ================================================================
// Custom Validation Rules
// ================================================================

// Business Logic Validators
export function validateStudentCapacity(currentStudents: number, maxStudents: number, newStudentsCount = 1): boolean {
  return (currentStudents + newStudentsCount) <= maxStudents
}

export function validateVideoCompletion(watchedDuration: number, totalDuration: number): number {
  if (totalDuration <= 0) return 0
  const percentage = Math.round((watchedDuration / totalDuration) * 100)
  return Math.min(Math.max(percentage, 0), 100)
}

export function validateDateRange(startDate: string, endDate: string): boolean {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return start < end
}

export function validateTenantSlug(slug: string): boolean {
  // Must be lowercase, alphanumeric with hyphens only, 3-50 chars
  const slugRegex = /^[a-z0-9][a-z0-9\-]{1,48}[a-z0-9]$/
  return slugRegex.test(slug)
}

// Permission Validators
export function validatePermission(
  resource: PermissionResource,
  action: PermissionAction,
  userPermissions: Record<string, PermissionAction[]>
): boolean {
  const resourcePermissions = userPermissions[resource] || []
  return resourcePermissions.includes(action) || resourcePermissions.includes('admin')
}

// Data integrity validators
export function validateUniqueConstraint<T>(
  items: T[],
  key: keyof T,
  newValue: T[keyof T],
  excludeId?: string | number
): boolean {
  return !items.some(item => 
    item[key] === newValue && 
    (excludeId === undefined || (item as {id: string | number}).id !== excludeId)
  )
}

export function validateReferentialIntegrity(
  parentId: string,
  parentItems: { id: string }[]
): boolean {
  return parentItems.some(item => item.id === parentId)
}

// ================================================================
// Error Messages
// ================================================================
export const ValidationErrors = {
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  INVALID_FORMAT: (field: string) => `${field} has invalid format`,
  TOO_LONG: (field: string, max: number) => `${field} must be less than ${max} characters`,
  TOO_SHORT: (field: string, min: number) => `${field} must be at least ${min} characters`,
  INVALID_RANGE: (field: string, min: number, max: number) => `${field} must be between ${min} and ${max}`,
  NOT_UNIQUE: (field: string) => `${field} must be unique`,
  INVALID_REFERENCE: (field: string) => `${field} references non-existent record`,
  CAPACITY_EXCEEDED: 'Student capacity would be exceeded',
  INVALID_DATE_RANGE: 'Start date must be before end date',
  PERMISSION_DENIED: 'Insufficient permissions for this action'
} as const

// Export schemas for external use
export const ValidationSchemas = {
  Tenant: TenantSchema,
  TenantInsert: TenantInsertSchema,
  TenantUpdate: TenantUpdateSchema,
  Student: StudentSchema,
  StudentInsert: StudentInsertSchema,
  StudentUpdate: StudentUpdateSchema,
  Class: ClassSchema,
  ClassInsert: ClassInsertSchema,
  ClassUpdate: ClassUpdateSchema,
  Instructor: InstructorSchema,
  InstructorInsert: InstructorInsertSchema,
  InstructorUpdate: InstructorUpdateSchema,
  Video: VideoSchema,
  VideoInsert: VideoInsertSchema,
  VideoUpdate: VideoUpdateSchema,
  VideoWatchSession: VideoWatchSessionSchema,
  VideoWatchSessionInsert: VideoWatchSessionInsertSchema,
  VideoWatchSessionUpdate: VideoWatchSessionUpdateSchema,
  CoursePackage: CoursePackageSchema,
  CoursePackageInsert: CoursePackageInsertSchema,
  CoursePackageUpdate: CoursePackageUpdateSchema,
  ClassFlowStudent: ClassFlowStudentSchema,
  StudentFormData: StudentFormDataSchema,
  VideoWatchSessionFormData: VideoWatchSessionFormDataSchema
} as const