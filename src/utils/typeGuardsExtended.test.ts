/**
 * 확장 타입 가드 테스트
 */

import {
  isValidClass,
  isActiveClass,
  isClassFull,
  isValidInstructor,
  isFullTimeInstructor,
  isValidCoursePackage,
  isActiveCoursePackage,
  isValidEnrollment,
  isActiveEnrollment,
  isEnrollmentExpired,
  isValidPayment,
  isCompletedPayment,
  isRefundedPayment,
  isRefundable,
  isValidAttendance,
  isPresent,
  isLate,
  isAbsent,
  isValidVideo,
  isPublishedVideo,
  isYouTubeVideo,
  isValidExam,
  isOngoingExam,
  isExamEnded,
  isValidConsultation,
  isScheduledConsultation,
  isCompletedConsultation,
  canStudentEnrollInClass,
  canStudentTakeExam,
  canInstructorTeachClass,
  isValidUUID,
  isValidEmail,
  isValidPhoneNumber,
  isPastDate,
  isFutureDate,
  isToday
} from './typeGuardsExtended'

import type {
  Class,
  Student,
  Instructor,
  CoursePackage,
  StudentEnrollment,
  Payment,
  Attendance,
  Video,
  Exam,
  Consultation
} from '@/types'

describe('Extended Type Guards', () => {
  
  describe('Class Type Guards', () => {
    const validClass: Class = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      tenant_id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Math 101',
      instructor_id: '123e4567-e89b-12d3-a456-426614174002',
      instructor_name: 'John Doe',
      room_number: '101',
      schedule: 'MWF 10:00-11:00',
      max_students: 30,
      current_students: 25,
      is_active: true,
      start_date: '2025-01-01',
      end_date: '2025-06-30',
      description: null,
      price: null,
      subject: null,
      grade: null,
      course: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    }

    test('isValidClass should return true for valid class', () => {
      expect(isValidClass(validClass)).toBe(true)
    })

    test('isValidClass should return false for invalid class', () => {
      expect(isValidClass({})).toBe(false)
      expect(isValidClass(null)).toBe(false)
      expect(isValidClass(undefined)).toBe(false)
    })

    test('isActiveClass should return true for active class', () => {
      expect(isActiveClass(validClass)).toBe(true)
    })

    test('isClassFull should return false when not full', () => {
      expect(isClassFull(validClass)).toBe(false)
    })

    test('isClassFull should return true when full', () => {
      const fullClass = { ...validClass, current_students: 30 }
      expect(isClassFull(fullClass)).toBe(true)
    })
  })

  describe('Instructor Type Guards', () => {
    const validInstructor: Instructor = {
      id: '123e4567-e89b-12d3-a456-426614174003',
      user_id: '123e4567-e89b-12d3-a456-426614174004',
      tenant_id: '123e4567-e89b-12d3-a456-426614174001',
      employee_id: 'EMP001',
      department: 'Mathematics',
      position: 'Senior Instructor',
      employment_type: 'full_time',
      specialization: null,
      qualification: null,
      bio: null,
      hire_date: '2020-01-01',
      termination_date: null,
      is_active: true,
      created_at: '2020-01-01T00:00:00Z',
      updated_at: '2020-01-01T00:00:00Z'
    }

    test('isValidInstructor should return true for valid instructor', () => {
      expect(isValidInstructor(validInstructor)).toBe(true)
    })

    test('isFullTimeInstructor should return true for full-time instructor', () => {
      expect(isFullTimeInstructor(validInstructor)).toBe(true)
    })
  })

  describe('Payment Type Guards', () => {
    const validPayment: Payment = {
      id: '123e4567-e89b-12d3-a456-426614174005',
      enrollment_id: '123e4567-e89b-12d3-a456-426614174006',
      amount: 100000,
      payment_date: '2025-01-01',
      payment_method: 'card',
      status: 'completed',
      invoice_number: null,
      receipt_url: null,
      refund_amount: null,
      refund_date: null,
      refund_reason: null,
      notes: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    }

    test('isValidPayment should return true for valid payment', () => {
      expect(isValidPayment(validPayment)).toBe(true)
    })

    test('isCompletedPayment should return true for completed payment', () => {
      expect(isCompletedPayment(validPayment)).toBe(true)
    })

    test('isRefundedPayment should return false for non-refunded payment', () => {
      expect(isRefundedPayment(validPayment)).toBe(false)
    })

    test('isRefundable should return true for recent completed payment', () => {
      const recentPayment = {
        ...validPayment,
        created_at: new Date().toISOString()
      }
      expect(isRefundable(recentPayment)).toBe(true)
    })
  })

  describe('Data Validation Helpers', () => {
    test('isValidUUID should validate UUID format', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
      expect(isValidUUID('invalid-uuid')).toBe(false)
      expect(isValidUUID('12345678-1234-1234-1234-123456789abc')).toBe(true)
    })

    test('isValidEmail should validate email format', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('user@domain.co.kr')).toBe(true)
    })

    test('isValidPhoneNumber should validate Korean phone numbers', () => {
      expect(isValidPhoneNumber('010-1234-5678')).toBe(true)
      expect(isValidPhoneNumber('01012345678')).toBe(true)
      expect(isValidPhoneNumber('02-1234-5678')).toBe(false)
      expect(isValidPhoneNumber('invalid')).toBe(false)
    })

    test('isPastDate should check if date is in the past', () => {
      expect(isPastDate('2020-01-01')).toBe(true)
      expect(isPastDate('2030-01-01')).toBe(false)
    })

    test('isFutureDate should check if date is in the future', () => {
      expect(isFutureDate('2030-01-01')).toBe(true)
      expect(isFutureDate('2020-01-01')).toBe(false)
    })

    test('isToday should check if date is today', () => {
      const today = new Date().toISOString().split('T')[0]
      expect(isToday(today)).toBe(true)
      expect(isToday('2020-01-01')).toBe(false)
    })
  })

  describe('Complex Business Logic Guards', () => {
    const activeStudent: Student = {
      id: '123e4567-e89b-12d3-a456-426614174007',
      tenant_id: '123e4567-e89b-12d3-a456-426614174001',
      student_number: 'STU001',
      name: 'Jane Doe',
      grade: '10',
      school: 'High School',
      birth_date: '2010-01-01',
      phone: '010-1234-5678',
      email: 'jane@example.com',
      address: '123 Main St',
      parent_name: 'John Doe',
      parent_phone_1: '010-9876-5432',
      parent_phone_2: null,
      status: 'active',
      enrollment_date: '2025-01-01',
      withdrawal_date: null,
      withdrawal_reason: null,
      notes: null,
      avatar_url: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    }

    const activeClass: Class = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      tenant_id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Math 101',
      instructor_id: '123e4567-e89b-12d3-a456-426614174002',
      instructor_name: 'John Doe',
      room_number: '101',
      schedule: 'MWF 10:00-11:00',
      max_students: 30,
      current_students: 25,
      is_active: true,
      start_date: '2025-01-01',
      end_date: '2025-06-30',
      description: null,
      price: null,
      subject: null,
      grade: '10',
      course: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    }

    test('canStudentEnrollInClass should return true for eligible student', () => {
      expect(canStudentEnrollInClass(activeStudent, activeClass)).toBe(true)
    })

    test('canStudentEnrollInClass should return false for full class', () => {
      const fullClass = { ...activeClass, current_students: 30 }
      expect(canStudentEnrollInClass(activeStudent, fullClass)).toBe(false)
    })

    test('canStudentEnrollInClass should return false for inactive student', () => {
      const inactiveStudent = { ...activeStudent, status: 'inactive' as const }
      expect(canStudentEnrollInClass(inactiveStudent, activeClass)).toBe(false)
    })
  })
})