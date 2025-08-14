// Type Guards and Validators Tests
// Comprehensive testing of runtime type checking and validation

import { describe, test, expect } from 'vitest'
import {
  // Type Guards
  isStudent,
  isClass,
  isTenant,
  isInstructor,
  isVideo,
  isVideoWatchSession,
  isCoursePackage,
  isClassFlowStudent,
  isUUID,
  isUserStatus,
  isStudentStatus,
  isBillingType,
  isVideoStatus,
  isVideoQuality,
  
  // Validation Functions
  validateStudent,
  validateStudentInsert,
  validateClass,
  validateVideo,
  validateVideoWatchSession,
  
  // Utility Validators
  validateEmail,
  validatePhone,
  validateUUID,
  validateColor,
  
  // Business Logic Validators
  validateStudentCapacity,
  validateVideoCompletion,
  validateDateRange,
  validateTenantSlug,
  validatePermission,
  validateUniqueConstraint,
  validateReferentialIntegrity,
  
  // Sanitization Functions
  sanitizeString,
  sanitizePhone,
  sanitizeEmail,
  
  // Schemas
  ValidationSchemas
} from './typeGuards'

import type {
  ClassFlowStudent
} from '@/types/app.types'

import type {
  Student,
  Tenant,
  UserStatus,
  StudentStatus,
  BillingType
} from '@/types'

import type { Database } from '@/types/database'

// Database type aliases for testing
type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

type StudentInsert = Tables['students']['Insert']
type Class = Tables['classes']['Row']
type Instructor = Tables['instructors']['Row']
type Video = Tables['videos']['Row']
type VideoWatchSession = Tables['video_watch_sessions']['Row']
type CoursePackage = Tables['course_packages']['Row']
type VideoStatus = Enums['video_status']
type VideoQuality = Enums['video_quality']
type PermissionAction = 'read' | 'write' | 'delete' | 'admin'

// ================================================================
// Test Data Fixtures
// ================================================================

const validUUID = '12345678-1234-1234-1234-123456789abc'
const invalidUUID = 'invalid-uuid'

const validStudent: Student = {
  id: validUUID,
  tenant_id: validUUID,
  student_number: 'STU001',
  name: 'Test Student',
  name_english: 'Test Student EN',
  phone: '010-1234-5678',
  email: 'test@example.com',
  parent_name: 'Test Parent',
  parent_phone_1: '010-9876-5432',
  parent_phone_2: null,
  address: '서울시 강남구',
  birth_date: '2005-01-01',
  gender: 'M',
  grade_level: '고2',
  school_name: 'Test High School',
  status: 'active',
  enrollment_date: '2024-01-01',
  emergency_contact: null,
  custom_fields: null,
  tags: null,
  notes: 'Test memo',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  created_by: validUUID
}

const validStudentInsert: StudentInsert = {
  tenant_id: validUUID,
  student_number: 'STU002',
  name: 'New Student',
  parent_phone_1: '010-1111-2222',
  phone: '010-3333-4444',
  grade_level: '중1',
  status: 'active'
}

const validClass: Class = {
  id: validUUID,
  tenant_id: validUUID,
  name: 'Math Class',
  subject: 'Mathematics',
  course: 'Advanced Mathematics',
  grade: 'High School',
  level: 'Advanced',
  description: 'Advanced mathematics class',
  max_students: 20,
  min_students: 5,
  instructor_id: validUUID,
  classroom_id: validUUID,
  color: '#FF6B6B',
  is_active: true,
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  schedule_config: null,
  custom_fields: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  created_by: validUUID
}

const validVideo: Video = {
  id: validUUID,
  tenant_id: validUUID,
  youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  youtube_video_id: 'dQw4w9WgXcQ',
  title: 'Test Video',
  description: 'A test video for mathematics',
  duration_seconds: 300,
  thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  tags: ['math', 'education', 'tutorial'],
  learning_objectives: ['understand basic concepts'],
  prerequisites: ['basic math knowledge'],
  instructor_id: validUUID,
  class_id: validUUID,
  video_type: 'lecture',
  status: 'published',
  quality: '1080p',
  view_count: 1000,
  like_count: 50,
  comment_count: 10,
  order_index: 1,
  is_public: true,
  password_protected: false,
  password_hash: null,
  available_from: '2024-01-01T00:00:00Z',
  available_until: null,
  total_watch_time: 25000,
  average_rating: 4.5,
  created_by: validUUID,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const validVideoWatchSessionData: VideoWatchSession = {
  id: validUUID,
  tenant_id: validUUID,
  student_id: validUUID,
  video_id: validUUID,
  enrollment_id: validUUID,
  session_start_time: '2024-01-01T11:00:00Z',
  last_position_time: '2024-01-01T12:00:00Z',
  progress_seconds: 150,
  total_watch_time: 150,
  completion_percentage: 50,
  watch_status: 'in_progress',
  playback_quality: '720p',
  device_type: 'desktop',
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  ip_address: '192.168.1.1',
  play_count: 1,
  is_liked: null,
  rating: 4,
  notes: 'Watched halfway through',
  bookmarks: { positions: [45, 90] },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T12:00:00Z'
}


// ================================================================
// Type Guard Tests
// ================================================================

describe('UUID Type Guards', () => {
  test('should validate correct UUID format', () => {
    expect(isUUID(validUUID)).toBe(true)
    expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
  })

  test('should reject invalid UUID formats', () => {
    expect(isUUID(invalidUUID)).toBe(false)
    expect(isUUID('123')).toBe(false)
    expect(isUUID('')).toBe(false)
    expect(isUUID(null)).toBe(false)
    expect(isUUID(undefined)).toBe(false)
    expect(isUUID(123)).toBe(false)
  })
})

describe('Enum Type Guards', () => {
  test('should validate user status', () => {
    expect(isUserStatus('active')).toBe(true)
    expect(isUserStatus('inactive')).toBe(true)
    expect(isUserStatus('suspended')).toBe(true)
    expect(isUserStatus('pending_approval')).toBe(true)
    expect(isUserStatus('invalid')).toBe(false)
  })

  test('should validate student status', () => {
    expect(isStudentStatus('active')).toBe(true)
    expect(isStudentStatus('inactive')).toBe(true)
    expect(isStudentStatus('graduated')).toBe(true)
    expect(isStudentStatus('withdrawn')).toBe(true)
    expect(isStudentStatus('suspended')).toBe(true)
    expect(isStudentStatus('invalid')).toBe(false)
  })

  test('should validate billing type', () => {
    expect(isBillingType('monthly')).toBe(true)
    expect(isBillingType('sessions')).toBe(true)
    expect(isBillingType('hours')).toBe(true)
    expect(isBillingType('package')).toBe(true)
    expect(isBillingType('drop_in')).toBe(true)
    expect(isBillingType('invalid')).toBe(false)
  })

  test('should validate video status', () => {
    expect(isVideoStatus('draft')).toBe(true)
    expect(isVideoStatus('published')).toBe(true)
    expect(isVideoStatus('private')).toBe(true)
    expect(isVideoStatus('archived')).toBe(true)
    expect(isVideoStatus('deleted')).toBe(true)
    expect(isVideoStatus('invalid')).toBe(false)
  })

  test('should validate video quality', () => {
    expect(isVideoQuality('240p')).toBe(true)
    expect(isVideoQuality('360p')).toBe(true)
    expect(isVideoQuality('720p')).toBe(true)
    expect(isVideoQuality('1080p')).toBe(true)
    expect(isVideoQuality('1440p')).toBe(true)
    expect(isVideoQuality('2160p')).toBe(true)
    expect(isVideoQuality('4K')).toBe(false)
  })
})

describe('Entity Type Guards', () => {
  test('should validate valid student object', () => {
    expect(isStudent(validStudent)).toBe(true)
  })

  test('should reject invalid student objects', () => {
    expect(isStudent({})).toBe(false)
    expect(isStudent({ ...validStudent, id: 'invalid' })).toBe(false)
    expect(isStudent({ ...validStudent, name: '' })).toBe(false)
    expect(isStudent({ ...validStudent, status: 'invalid' })).toBe(false)
    expect(isStudent(null)).toBe(false)
    expect(isStudent(undefined)).toBe(false)
  })

  test('should validate valid class object', () => {
    expect(isClass(validClass)).toBe(true)
  })

  test('should reject invalid class objects', () => {
    expect(isClass({})).toBe(false)
    expect(isClass({ ...validClass, max_students: -1 })).toBe(false)
    expect(isClass({ ...validClass, color: 'invalid-color' })).toBe(false)
  })

  test('should validate valid YouTube video object', () => {
    expect(isVideo(validVideo)).toBe(true)
  })

  test('should reject invalid YouTube video objects', () => {
    expect(isVideo({})).toBe(false)
    expect(isVideo({ ...validVideo, duration_seconds: -1 })).toBe(false)
    expect(isVideo({ ...validVideo, youtube_video_id: '' })).toBe(false)
  })

  test('should validate valid video progress object', () => {
    expect(isVideoWatchSession(validVideoWatchSessionData)).toBe(true)
  })

  test('should validate valid video watch session object', () => {
    expect(isVideoWatchSession(validVideoWatchSessionData)).toBe(true)
  })
})

// ================================================================
// Validation Function Tests
// ================================================================

describe('Entity Validation Functions', () => {
  test('should validate correct student data', () => {
    const result = validateStudent(validStudent)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Test Student')
    }
  })

  test('should return validation errors for invalid student data', () => {
    const invalidStudent = { ...validStudent, name: '', parent_phone: 'invalid' }
    const result = validateStudent(invalidStudent)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(err => err.includes('name'))).toBe(true)
    }
  })

  test('should validate student insert data', () => {
    const result = validateStudentInsert(validStudentInsert)
    expect(result.success).toBe(true)
  })

  test('should validate class data', () => {
    const result = validateClass(validClass)
    expect(result.success).toBe(true)
  })

  test('should validate YouTube video data', () => {
    const result = validateVideo(validVideo)
    expect(result.success).toBe(true)
  })

  test('should validate video progress data', () => {
    const result = validateVideoWatchSession(validVideoWatchSessionData)
    expect(result.success).toBe(true)
  })
})

// ================================================================
// Utility Validation Tests
// ================================================================

describe('Utility Validators', () => {
  test('should validate email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true)
    expect(validateEmail('user.name+tag@example.co.kr')).toBe(true)
    expect(validateEmail('invalid-email')).toBe(false)
    expect(validateEmail('test@')).toBe(false)
    expect(validateEmail('@example.com')).toBe(false)
  })

  test('should validate phone numbers', () => {
    expect(validatePhone('010-1234-5678')).toBe(true)
    expect(validatePhone('02-123-4567')).toBe(true)
    expect(validatePhone('+82-10-1234-5678')).toBe(true)
    expect(validatePhone('(02) 123-4567')).toBe(true)
    expect(validatePhone('abc-defg-hijk')).toBe(false)
  })

  test('should validate UUIDs', () => {
    expect(validateUUID(validUUID)).toBe(true)
    expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    expect(validateUUID(invalidUUID)).toBe(false)
    expect(validateUUID('123')).toBe(false)
  })

  test('should validate color codes', () => {
    expect(validateColor('#FF0000')).toBe(true)
    expect(validateColor('#3B82F6')).toBe(true)
    expect(validateColor('#000000')).toBe(true)
    expect(validateColor('#FFFFFF')).toBe(true)
    expect(validateColor('red')).toBe(false)
    expect(validateColor('#FFF')).toBe(false)
    expect(validateColor('#GGGGGG')).toBe(false)
  })
})

// ================================================================
// Business Logic Validation Tests
// ================================================================

describe('Business Logic Validators', () => {
  test('should validate student capacity', () => {
    expect(validateStudentCapacity(15, 20, 1)).toBe(true)
    expect(validateStudentCapacity(15, 20, 5)).toBe(true)
    expect(validateStudentCapacity(15, 20, 6)).toBe(false)
    expect(validateStudentCapacity(20, 20, 1)).toBe(false)
  })

  test('should calculate video completion percentage', () => {
    expect(validateVideoCompletion(150, 300)).toBe(50)
    expect(validateVideoCompletion(300, 300)).toBe(100)
    expect(validateVideoCompletion(0, 300)).toBe(0)
    expect(validateVideoCompletion(450, 300)).toBe(100) // Cap at 100%
    expect(validateVideoCompletion(150, 0)).toBe(0) // Avoid division by zero
  })

  test('should validate date ranges', () => {
    expect(validateDateRange('2024-01-01', '2024-12-31')).toBe(true)
    expect(validateDateRange('2024-01-01', '2024-01-02')).toBe(true)
    expect(validateDateRange('2024-12-31', '2024-01-01')).toBe(false)
    expect(validateDateRange('2024-01-01', '2024-01-01')).toBe(false)
  })

  test('should validate tenant slugs', () => {
    expect(validateTenantSlug('my-academy')).toBe(true)
    expect(validateTenantSlug('academy123')).toBe(true)
    expect(validateTenantSlug('a1-b2-c3')).toBe(true)
    expect(validateTenantSlug('My-Academy')).toBe(false) // Uppercase not allowed
    expect(validateTenantSlug('-academy')).toBe(false) // Cannot start with hyphen
    expect(validateTenantSlug('academy-')).toBe(false) // Cannot end with hyphen
    expect(validateTenantSlug('ac')).toBe(false) // Too short
    expect(validateTenantSlug('a'.repeat(51))).toBe(false) // Too long
  })

  test('should validate permissions', () => {
    const userPermissions = {
      students: ['read', 'write'] as PermissionAction[],
      classes: ['read'] as PermissionAction[],
      settings: ['admin'] as PermissionAction[]
    }

    expect(validatePermission('students', 'read', userPermissions)).toBe(true)
    expect(validatePermission('students', 'write', userPermissions)).toBe(true)
    expect(validatePermission('students', 'delete', userPermissions)).toBe(false)
    expect(validatePermission('classes', 'read', userPermissions)).toBe(true)
    expect(validatePermission('classes', 'write', userPermissions)).toBe(false)
    expect(validatePermission('settings', 'read', userPermissions)).toBe(true) // Admin includes all
    expect(validatePermission('settings', 'write', userPermissions)).toBe(true) // Admin includes all
  })

  test('should validate unique constraints', () => {
    const items = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' }
    ]

    expect(validateUniqueConstraint(items, 'name', 'Item 3')).toBe(true)
    expect(validateUniqueConstraint(items, 'name', 'Item 1')).toBe(false)
    expect(validateUniqueConstraint(items, 'name', 'Item 1', '1')).toBe(true) // Exclude existing
  })

  test('should validate referential integrity', () => {
    const parentItems = [{ id: validUUID }, { id: 'other-id' }]

    expect(validateReferentialIntegrity(validUUID, parentItems)).toBe(true)
    expect(validateReferentialIntegrity('non-existent-id', parentItems)).toBe(false)
  })
})

// ================================================================
// Sanitization Function Tests
// ================================================================

describe('Sanitization Functions', () => {
  test('should sanitize strings', () => {
    expect(sanitizeString('  Test String  ')).toBe('Test String')
    expect(sanitizeString('Very long string that exceeds limit', 10)).toBe('Very long ')
    expect(sanitizeString('')).toBe('')
  })

  test('should sanitize phone numbers', () => {
    expect(sanitizePhone('010-1234-5678')).toBe('010-1234-5678')
    expect(sanitizePhone('abc010def1234ghij5678')).toBe('010-1234-5678')
    expect(sanitizePhone('+82-10-1234-5678')).toBe('+82-10-1234-5678')
    expect(sanitizePhone('  010-1234-5678  ')).toBe('010-1234-5678')
  })

  test('should sanitize email addresses', () => {
    expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com')
    expect(sanitizeEmail('User.Name@Domain.Co.Kr')).toBe('user.name@domain.co.kr')
  })
})

// ================================================================
// Zod Schema Compilation Tests
// ================================================================

describe('Zod Schema Compilation', () => {
  test('should compile Student schema without errors', () => {
    expect(ValidationSchemas.Student.safeParse(validStudent).success).toBe(true)
  })

  test('should compile StudentInsert schema without errors', () => {
    expect(ValidationSchemas.StudentInsert.safeParse(validStudentInsert).success).toBe(true)
  })

  test('should compile Class schema without errors', () => {
    expect(ValidationSchemas.Class.safeParse(validClass).success).toBe(true)
  })

  test('should compile Video schema without errors', () => {
    expect(ValidationSchemas.Video.safeParse(validVideo).success).toBe(true)
  })

  test('should compile VideoWatchSession schema without errors', () => {
    expect(ValidationSchemas.VideoWatchSession.safeParse(validVideoWatchSessionData).success).toBe(true)
  })

  test('should compile VideoWatchSession schema without errors', () => {
    expect(ValidationSchemas.VideoWatchSession.safeParse(validVideoWatchSessionData).success).toBe(true)
  })
})

// ================================================================
// Edge Case Tests
// ================================================================

describe('Edge Cases', () => {
  test('should handle null and undefined values', () => {
    expect(isStudent(null)).toBe(false)
    expect(isStudent(undefined)).toBe(false)
    expect(isClass(null)).toBe(false)
    expect(isVideo(undefined)).toBe(false)
  })

  test('should handle empty objects', () => {
    expect(isStudent({})).toBe(false)
    expect(isClass({})).toBe(false)
    expect(isVideo({})).toBe(false)
  })

  test('should handle arrays', () => {
    expect(isStudent([])).toBe(false)
    expect(isClass([validClass])).toBe(false)
  })

  test('should handle primitive types', () => {
    expect(isStudent('string')).toBe(false)
    expect(isStudent(123)).toBe(false)
    expect(isStudent(true)).toBe(false)
  })

  test('should handle video completion edge cases', () => {
    expect(validateVideoCompletion(-10, 100)).toBe(0) // Negative watched duration
    expect(validateVideoCompletion(100, -10)).toBe(0) // Negative total duration
    expect(validateVideoCompletion(0, 0)).toBe(0) // Both zero
  })

  test('should handle student capacity edge cases', () => {
    expect(validateStudentCapacity(0, 0, 1)).toBe(false) // No capacity
    expect(validateStudentCapacity(-5, 10, 1)).toBe(true) // Negative current (treat as 0)
    expect(validateStudentCapacity(10, 10, 0)).toBe(true) // Adding zero students
  })
})

// ================================================================
// Performance Tests
// ================================================================

describe('Performance Tests', () => {
  test('should validate large datasets efficiently', () => {
    const students = Array.from({ length: 1000 }, (_, i) => ({
      ...validStudent,
      id: `student-${i.toString().padStart(4, '0')}-1234-1234-1234-123456789abc`,
      name: `Student ${i}`
    }))

    const start = performance.now()
    const results = students.map(student => isStudent(student))
    const end = performance.now()

    expect(results.every(result => result === true)).toBe(true)
    expect(end - start).toBeLessThan(100) // Should complete within 100ms
  })

  test('should handle validation of complex objects efficiently', () => {
    const complexVideo = {
      ...validVideo,
      metadata: {
        chapters: Array.from({ length: 50 }, (_, i) => ({
          title: `Chapter ${i}`,
          startTime: i * 60,
          endTime: (i + 1) * 60
        })),
        tags: Array.from({ length: 100 }, (_, i) => `tag${i}`),
        comments: Array.from({ length: 200 }, (_, i) => ({
          id: i,
          text: `Comment ${i}`,
          timestamp: new Date().toISOString()
        }))
      }
    }

    const start = performance.now()
    const result = isVideo(complexVideo)
    const end = performance.now()

    expect(result).toBe(true)
    expect(end - start).toBeLessThan(50) // Should complete within 50ms
  })
})