// Type Guards and Validators for EduCanvas
// Provides runtime type checking and validation using both custom guards and Zod schemas

import { z } from 'zod'
import {
  Student, StudentInsert, StudentUpdate,
  Class, ClassInsert, ClassUpdate,
  Tenant, TenantInsert, TenantUpdate,
  Instructor, InstructorInsert, InstructorUpdate,
  YouTubeVideo, YouTubeVideoInsert, YouTubeVideoUpdate,
  VideoProgress, VideoProgressInsert, VideoProgressUpdate,
  VideoAssignment, VideoAssignmentInsert, VideoAssignmentUpdate,
  TenantUser, TenantUserInsert, TenantUserUpdate,
  CoursePackage, CoursePackageInsert, CoursePackageUpdate,
  UserRole, PermissionAction, PermissionResource,
  VideoWatchSession, ClassFlowStudent,
  UserStatus, StudentStatus, VideoStatus, VideoType, VideoQuality,
  BillingType, DiscountType, AttendanceStatus, PaymentStatus
} from '@/types/app.types'

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
export const VideoQualitySchema = z.enum(['240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'] as const)

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
  settings: z.record(z.string(), z.any()).default({}),
  features: z.record(z.string(), z.any()).default({}),
  limits: z.record(z.string(), z.any()).default({}),
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
  tenant_id: UUIDSchema,
  name: NameSchema,
  phone: PhoneSchema,
  parent_name: z.string().max(100).nullable(),
  parent_phone: z.string().min(1, 'Parent phone is required').max(20),
  grade: z.string().max(20).nullable(),
  class_id: UUIDSchema.nullable(),
  status: StudentStatusSchema.default('active'),
  enrollment_date: z.string().date(),
  graduation_date: z.string().date().nullable(),
  position_in_class: z.number().int().min(0).default(0),
  display_color: ColorSchema,
  memo: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const StudentInsertSchema = StudentSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).partial({
  enrollment_date: true,
  position_in_class: true,
  status: true
})

export const StudentUpdateSchema = StudentInsertSchema.omit({ tenant_id: true }).partial()

// Class Schemas
export const ClassSchema = z.object({
  id: UUIDSchema,
  tenant_id: UUIDSchema,
  name: NameSchema,
  subject: z.string().max(50).nullable(),
  grade_level: z.string().max(20).nullable(),
  max_students: z.number().int().min(1).max(100).default(20),
  current_students: z.number().int().min(0).default(0),
  instructor_id: UUIDSchema.nullable(),
  classroom: z.string().max(50).nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  status: StudentStatusSchema.default('active'),
  order_index: z.number().int().min(0).default(0),
  start_date: z.string().date().nullable(),
  end_date: z.string().date().nullable(),
  memo: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const ClassInsertSchema = ClassSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).partial({
  max_students: true,
  current_students: true,
  color: true,
  status: true,
  order_index: true
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
export const YouTubeVideoSchema = z.object({
  id: UUIDSchema,
  tenant_id: UUIDSchema,
  youtube_id: z.string().min(1, 'YouTube ID is required'),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().nullable(),
  duration: z.number().int().min(0),
  thumbnail_url: z.string().url().nullable(),
  channel_id: z.string().min(1, 'Channel ID is required'),
  published_at: z.string().datetime(),
  category: z.string().max(50).nullable(),
  tags: z.array(z.string()).default([]),
  quality_levels: z.array(VideoQualitySchema).default([]),
  captions_available: z.boolean().default(false),
  instructor_id: UUIDSchema.nullable(),
  class_id: UUIDSchema.nullable(),
  video_type: VideoTypeSchema.default('lecture'),
  status: VideoStatusSchema.default('draft'),
  view_count: z.number().int().min(0).default(0),
  like_count: z.number().int().min(0).nullable(),
  dislike_count: z.number().int().min(0).nullable(),
  privacy_level: z.string().default('private'),
  is_age_restricted: z.boolean().default(false),
  upload_date: z.string().datetime().nullable(),
  last_updated: z.string().datetime().nullable(),
  metadata: z.record(z.string(), z.any()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const YouTubeVideoInsertSchema = YouTubeVideoSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).partial({
  tags: true,
  quality_levels: true,
  captions_available: true,
  video_type: true,
  status: true,
  view_count: true,
  privacy_level: true,
  is_age_restricted: true,
  metadata: true
})

export const YouTubeVideoUpdateSchema = YouTubeVideoInsertSchema.omit({ tenant_id: true, youtube_id: true }).partial()

// Video Progress Schemas
export const VideoProgressSchema = z.object({
  id: UUIDSchema,
  tenant_id: UUIDSchema,
  student_id: UUIDSchema,
  video_id: UUIDSchema,
  watched_duration: z.number().min(0).default(0),
  total_duration: z.number().min(0),
  completion_percentage: z.number().min(0).max(100).default(0),
  last_watched_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable(),
  watch_sessions: z.array(z.record(z.string(), z.any())).default([]),
  notes: z.string().nullable(),
  quality_watched: VideoQualitySchema.nullable(),
  watch_speed: z.number().min(0.25).max(3).default(1),
  pause_count: z.number().int().min(0).default(0),
  rewind_count: z.number().int().min(0).default(0),
  forward_count: z.number().int().min(0).default(0),
  full_screen_duration: z.number().min(0).nullable(),
  device_type: z.string().max(50).nullable(),
  browser_type: z.string().max(50).nullable(),
  ip_address: z.string().nullable(),
  location_info: z.record(z.string(), z.any()).nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const VideoProgressInsertSchema = VideoProgressSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).partial({
  watched_duration: true,
  completion_percentage: true,
  watch_sessions: true,
  watch_speed: true,
  pause_count: true,
  rewind_count: true,
  forward_count: true
})

export const VideoProgressUpdateSchema = VideoProgressInsertSchema.omit({
  tenant_id: true,
  student_id: true,
  video_id: true
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
export const VideoWatchSessionSchema = z.object({
  id: UUIDSchema,
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  watchedDuration: z.number().min(0),
  pauseCount: z.number().int().min(0),
  seekCount: z.number().int().min(0),
  quality: VideoQualitySchema,
  speed: z.number().min(0.25).max(3),
  fullScreen: z.boolean(),
  timestamp: z.string().datetime(),
  deviceInfo: z.object({
    type: z.string(),
    browser: z.string(),
    os: z.string()
  })
})

// Form Data Schemas
export const StudentFormDataSchema = StudentInsertSchema.extend({
  confirmParentPhone: z.string().optional(),
  emergencyContact: z.object({
    name: z.string().min(1),
    relationship: z.string().min(1),
    phone: z.string().min(1)
  }).optional()
}).refine(
  (data) => data.parent_phone === data.confirmParentPhone,
  {
    message: 'Parent phone confirmation does not match',
    path: ['confirmParentPhone']
  }
)

export const VideoProgressFormDataSchema = z.object({
  studentId: UUIDSchema,
  videoId: UUIDSchema,
  watchedDuration: z.number().min(0),
  totalDuration: z.number().min(0),
  notes: z.string().optional(),
  sessionData: VideoWatchSessionSchema
})

// ================================================================
// Type Guards (Runtime Type Checking)
// ================================================================

export function isUUID(value: any): value is string {
  return typeof value === 'string' && UUIDSchema.safeParse(value).success
}

export function isStudent(obj: any): obj is Student {
  return StudentSchema.safeParse(obj).success
}

export function isClass(obj: any): obj is Class {
  return ClassSchema.safeParse(obj).success
}

export function isTenant(obj: any): obj is Tenant {
  return TenantSchema.safeParse(obj).success
}

export function isInstructor(obj: any): obj is Instructor {
  return InstructorSchema.safeParse(obj).success
}

export function isYouTubeVideo(obj: any): obj is YouTubeVideo {
  return YouTubeVideoSchema.safeParse(obj).success
}

export function isVideoProgress(obj: any): obj is VideoProgress {
  return VideoProgressSchema.safeParse(obj).success
}

export function isCoursePackage(obj: any): obj is CoursePackage {
  return CoursePackageSchema.safeParse(obj).success
}

export function isClassFlowStudent(obj: any): obj is ClassFlowStudent {
  return ClassFlowStudentSchema.safeParse(obj).success
}

export function isVideoWatchSession(obj: any): obj is VideoWatchSession {
  return VideoWatchSessionSchema.safeParse(obj).success
}

// Enum Type Guards
export function isUserStatus(value: any): value is UserStatus {
  return UserStatusSchema.safeParse(value).success
}

export function isStudentStatus(value: any): value is StudentStatus {
  return StudentStatusSchema.safeParse(value).success
}

export function isBillingType(value: any): value is BillingType {
  return BillingTypeSchema.safeParse(value).success
}

export function isVideoStatus(value: any): value is VideoStatus {
  return VideoStatusSchema.safeParse(value).success
}

export function isVideoQuality(value: any): value is VideoQuality {
  return VideoQualitySchema.safeParse(value).success
}

// ================================================================
// Validation Functions
// ================================================================

export function validateStudent(data: any): { success: true; data: Student } | { success: false; errors: string[] } {
  const result = StudentSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data as Student }
  } else {
    return {
      success: false,
      errors: result.error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`)
    }
  }
}

export function validateStudentInsert(data: any): { success: true; data: StudentInsert } | { success: false; errors: string[] } {
  const result = StudentInsertSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return {
      success: false,
      errors: result.error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`)
    }
  }
}

export function validateClass(data: any): { success: true; data: Class } | { success: false; errors: string[] } {
  const result = ClassSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return {
      success: false,
      errors: result.error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`)
    }
  }
}

export function validateYouTubeVideo(data: any): { success: true; data: YouTubeVideo } | { success: false; errors: string[] } {
  const result = YouTubeVideoSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return {
      success: false,
      errors: result.error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`)
    }
  }
}

export function validateVideoProgress(data: any): { success: true; data: VideoProgress } | { success: false; errors: string[] } {
  const result = VideoProgressSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return {
      success: false,
      errors: result.error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`)
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
    (excludeId === undefined || (item as any).id !== excludeId)
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
  YouTubeVideo: YouTubeVideoSchema,
  YouTubeVideoInsert: YouTubeVideoInsertSchema,
  YouTubeVideoUpdate: YouTubeVideoUpdateSchema,
  VideoProgress: VideoProgressSchema,
  VideoProgressInsert: VideoProgressInsertSchema,
  VideoProgressUpdate: VideoProgressUpdateSchema,
  CoursePackage: CoursePackageSchema,
  CoursePackageInsert: CoursePackageInsertSchema,
  CoursePackageUpdate: CoursePackageUpdateSchema,
  ClassFlowStudent: ClassFlowStudentSchema,
  VideoWatchSession: VideoWatchSessionSchema,
  StudentFormData: StudentFormDataSchema,
  VideoProgressFormData: VideoProgressFormDataSchema
} as const