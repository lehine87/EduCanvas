/**
 * EduCanvas 확장 타입 가드 함수 모음
 * 비즈니스 도메인별 타입 가드 구현
 * @version v4.1 스키마 기준
 * @since 2025-08-13
 */

import type { 
  Database,
  Student,
  Class,
  Instructor,
  CoursePackage,
  StudentEnrollment,
  Payment,
  Attendance,
  // Classroom, // 없는 타입
  // Schedule, // 없는 타입
  Video,
  VideoWatchSession,
  // Exam, // 없는 타입
  // ExamResult, // 없는 타입
  // Document, // 없는 타입
  Consultation,
  StudentHistory
} from '@/types'

// ================================================================
// 1. Class (반) 관련 타입 가드
// ================================================================

/**
 * 유효한 Class인지 확인
 */
export function isValidClass(obj: unknown): obj is Class {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as Class).id === 'string' &&
    'name' in obj &&
    typeof (obj as Class).name === 'string' &&
    'tenant_id' in obj &&
    typeof (obj as Class).tenant_id === 'string'
  )
}

/**
 * 활성 클래스인지 확인
 */
export function isActiveClass(cls: Class): boolean {
  return cls.is_active === true
}

/**
 * 클래스가 만원인지 확인
 * TODO: 실제 스키마와 맞지 않아 주석 처리
 */
// export function isClassFull(cls: Class): boolean {
//   const current = cls.current_students || 0
//   const max = cls.max_students || 30
//   return current >= max
// }

// ================================================================
// 2. Instructor (강사) 관련 타입 가드
// ================================================================

/**
 * 유효한 Instructor인지 확인
 */
export function isValidInstructor(obj: unknown): obj is Instructor {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as Instructor).id === 'string' &&
    'user_id' in obj &&
    typeof (obj as Instructor).user_id === 'string'
  )
}

/**
 * 정규직 강사인지 확인
 * TODO: 실제 스키마와 맞지 않아 주석 처리
 */
// export function isFullTimeInstructor(instructor: Instructor): boolean {
//   return instructor.employment_type === 'full_time'
// }

// ================================================================
// 3. CoursePackage (수강권) 관련 타입 가드
// ================================================================

/**
 * 유효한 CoursePackage인지 확인
 */
export function isValidCoursePackage(obj: unknown): obj is CoursePackage {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as CoursePackage).id === 'string' &&
    'name' in obj &&
    typeof (obj as CoursePackage).name === 'string' &&
    'price' in obj &&
    typeof (obj as CoursePackage).price === 'number'
  )
}

/**
 * 활성 수강권인지 확인
 */
export function isActiveCoursePackage(pkg: CoursePackage): boolean {
  return pkg.is_active === true
}

/**
 * 수강권이 유효기간 내인지 확인
 * TODO: 실제 스키마와 맞지 않아 주석 처리
 */
// export function isCoursePackageValid(pkg: CoursePackage): boolean {
//   if (!pkg.validity_period_days) return true
  
//   const now = new Date()
//   const created = new Date(pkg.created_at)
//   const validUntil = new Date(created.getTime() + pkg.validity_period_days * 24 * 60 * 60 * 1000)
  
//   return now <= validUntil
// }

// ================================================================
// 4. StudentEnrollment (수강신청) 관련 타입 가드
// ================================================================

/**
 * 유효한 StudentEnrollment인지 확인
 * TODO: 실제 스키마와 맞지 않아 주석 처리
 */
// export function isValidEnrollment(obj: unknown): obj is StudentEnrollment {
//   return (
//     typeof obj === 'object' &&
//     obj !== null &&
//     'id' in obj &&
//     typeof (obj as StudentEnrollment).id === 'string' &&
//     'student_id' in obj &&
//     typeof (obj as StudentEnrollment).student_id === 'string' &&
//     'course_package_id' in obj &&
//     typeof (obj as StudentEnrollment).course_package_id === 'string'
//   )
// }

/**
 * 활성 수강신청인지 확인
 */
export function isActiveEnrollment(enrollment: StudentEnrollment): boolean {
  return enrollment.status === 'active'
}

/**
 * 수강 기간이 만료되었는지 확인
 */
export function isEnrollmentExpired(enrollment: StudentEnrollment): boolean {
  if (!enrollment.end_date) return false
  
  const now = new Date()
  const endDate = new Date(enrollment.end_date)
  
  return now > endDate
}

// ================================================================
// 5. Payment (결제) 관련 타입 가드
// ================================================================

/**
 * 유효한 Payment인지 확인
 */
export function isValidPayment(obj: unknown): obj is Payment {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as Payment).id === 'string' &&
    'enrollment_id' in obj &&
    typeof (obj as Payment).enrollment_id === 'string' &&
    'amount' in obj &&
    typeof (obj as Payment).amount === 'number'
  )
}

/**
 * 완료된 결제인지 확인
 */
export function isCompletedPayment(payment: Payment): boolean {
  return payment.status === 'completed'
}

/**
 * 환불된 결제인지 확인
 */
export function isRefundedPayment(payment: Payment): boolean {
  return payment.status === 'refunded'
}

// ================================================================
// 6. Attendance (출석) 관련 타입 가드
// ================================================================

/**
 * 유효한 Attendance인지 확인
 * TODO: 실제 스키마와 맞지 않아 주석 처리 (date -> attendance_date)
 */
// export function isValidAttendance(obj: unknown): obj is Attendance {
//   return (
//     typeof obj === 'object' &&
//     obj !== null &&
//     'id' in obj &&
//     typeof (obj as Attendance).id === 'string' &&
//     'student_id' in obj &&
//     typeof (obj as Attendance).student_id === 'string' &&
//     'class_id' in obj &&
//     typeof (obj as Attendance).class_id === 'string' &&
//     'date' in obj &&
//     typeof (obj as Attendance).date === 'string'
//   )
// }

/**
 * 출석 상태인지 확인
 */
export function isPresent(attendance: Attendance): boolean {
  return attendance.status === 'present'
}

/**
 * 지각인지 확인
 */
export function isLate(attendance: Attendance): boolean {
  return attendance.status === 'late'
}

/**
 * 결석인지 확인
 */
export function isAbsent(attendance: Attendance): boolean {
  return attendance.status === 'absent'
}

// ================================================================
// 7. Video (동영상) 관련 타입 가드
// ================================================================

/**
 * 유효한 Video인지 확인
 */
export function isValidVideo(obj: unknown): obj is Video {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as Video).id === 'string' &&
    'title' in obj &&
    typeof (obj as Video).title === 'string'
  )
}

/**
 * 공개된 비디오인지 확인
 */
export function isPublishedVideo(video: Video): boolean {
  return video.status === 'published'
}

/**
 * YouTube 비디오인지 확인
 */
export function isYouTubeVideo(video: Video): boolean {
  return video.youtube_video_id !== null && video.youtube_video_id !== undefined
}

// ================================================================
// 8. Exam (시험) 관련 타입 가드
// ================================================================

/**
 * 유효한 Exam인지 확인
 * TODO: Exam 타입이 없어서 주석 처리
 */
// export function isValidExam(obj: unknown): obj is Exam {
//   return (
//     typeof obj === 'object' &&
//     obj !== null &&
//     'id' in obj &&
//     typeof (obj as Exam).id === 'string' &&
//     'name' in obj &&
//     typeof (obj as Exam).name === 'string' &&
//     'exam_date' in obj &&
//     typeof (obj as Exam).exam_date === 'string'
//   )
// }

/**
 * 진행 중인 시험인지 확인
 * TODO: Exam 타입이 없어서 주석 처리
 */
// export function isOngoingExam(exam: Exam): boolean {
//   const now = new Date()
//   const examDate = new Date(exam.exam_date)
//   const duration = exam.duration_minutes || 60
//   const endTime = new Date(examDate.getTime() + duration * 60 * 1000)
  
//   return now >= examDate && now <= endTime
// }

/**
 * 시험이 끝났는지 확인
 * TODO: Exam 타입이 없어서 주석 처리
 */
// export function isExamEnded(exam: Exam): boolean {
//   const now = new Date()
//   const examDate = new Date(exam.exam_date)
//   const duration = exam.duration_minutes || 60
//   const endTime = new Date(examDate.getTime() + duration * 60 * 1000)
  
//   return now > endTime
// }

// ================================================================
// 9. Consultation (상담) 관련 타입 가드
// ================================================================

/**
 * 유효한 Consultation인지 확인
 * TODO: 실제 스키마와 맞지 않아 주석 처리 (consultation_date 속성 없음)
 */
// export function isValidConsultation(obj: unknown): obj is Consultation {
//   return (
//     typeof obj === 'object' &&
//     obj !== null &&
//     'id' in obj &&
//     typeof (obj as Consultation).id === 'string' &&
//     'student_id' in obj &&
//     typeof (obj as Consultation).student_id === 'string' &&
//     'consultation_date' in obj &&
//     typeof (obj as Consultation).consultation_date === 'string'
//   )
// }

/**
 * 예정된 상담인지 확인
 */
export function isScheduledConsultation(consultation: Consultation): boolean {
  return consultation.status === 'scheduled'
}

/**
 * 완료된 상담인지 확인
 */
export function isCompletedConsultation(consultation: Consultation): boolean {
  return consultation.status === 'completed'
}

// ================================================================
// 10. 복합 비즈니스 로직 타입 가드
// ================================================================

/**
 * 학생이 특정 수업을 수강할 수 있는지 확인
 * TODO: 실제 스키마와 맞지 않아 주석 처리 (grade 속성 등)
 */
// export function canStudentEnrollInClass(student: Student, cls: Class): boolean {
//   // 학생이 활성 상태인지
//   if (student.status !== 'active') return false
  
//   // 클래스가 활성 상태인지
//   if (!cls.is_active) return false
  
//   // 클래스가 만원이 아닌지
//   if (isClassFull(cls)) return false
  
//   // 학년이 맞는지 (선택사항)
//   if (cls.grade && student.grade && cls.grade !== student.grade) return false
  
//   return true
// }

/**
 * 학생이 시험을 볼 수 있는지 확인
 * TODO: 실제 스키마와 맞지 않아 주석 처리
 */
// export function canStudentTakeExam(student: Student, exam: Exam): boolean {
//   // 학생이 활성 상태인지
//   if (student.status !== 'active') return false
  
//   // 시험이 아직 진행 중인지
//   if (isExamEnded(exam)) return false
  
//   return true
// }

/**
 * 결제가 환불 가능한지 확인
 */
export function isRefundable(payment: Payment): boolean {
  // 이미 환불된 경우
  if (isRefundedPayment(payment)) return false
  
  // 완료된 결제가 아닌 경우
  if (!isCompletedPayment(payment)) return false
  
  // 결제일로부터 7일 이내인지
  const now = new Date()
  if (!payment.created_at) return false
  const paymentDate = new Date(payment.created_at)
  const daysSincePayment = (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
  
  return daysSincePayment <= 7
}

/**
 * 수강권이 유효하고 구매 가능한지 확인
 */
export function isPurchasableCoursePackage(pkg: CoursePackage): boolean {
  return isActiveCoursePackage(pkg) // && isCoursePackageValid(pkg) // 주석처리됨
}

/**
 * 강사가 수업을 가르칠 수 있는지 확인
 */
export function canInstructorTeachClass(instructor: Instructor, cls: Class): boolean {
  // 강사 ID가 일치하는지
  if (cls.instructor_id !== instructor.user_id) return false
  
  // 클래스가 활성 상태인지
  if (!cls.is_active) return false
  
  return true
}

// ================================================================
// 11. 데이터 검증 헬퍼 함수
// ================================================================

/**
 * UUID 형식인지 확인
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * 이메일 형식인지 확인
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 전화번호 형식인지 확인 (한국)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/
  return phoneRegex.test(phone.replace(/-/g, ''))
}

/**
 * 날짜가 과거인지 확인
 */
export function isPastDate(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  return date < now
}

/**
 * 날짜가 미래인지 확인
 */
export function isFutureDate(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  return date > now
}

/**
 * 날짜가 오늘인지 확인
 */
export function isToday(dateStr: string): boolean {
  const date = new Date(dateStr)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}