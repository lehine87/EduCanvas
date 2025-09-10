// 학생 관련 통합 타입 정의
import type { Database } from './database'

/**
 * 학생 상태 타입 (데이터베이스 스키마와 완전히 동기화)
 * 데이터베이스 enum을 직접 사용하여 타입 안전성 보장
 */
export type StudentStatus = Database['public']['Enums']['student_status']

/**
 * 기본 Student 타입 (데이터베이스 스키마 기반)
 */
export type Student = Database['public']['Tables']['students']['Row']
export type StudentInsert = Database['public']['Tables']['students']['Insert']  
export type StudentUpdate = Database['public']['Tables']['students']['Update']

/**
 * ClassFlow에서 사용하는 확장된 Student 타입
 */
export interface ClassFlowStudent extends Student {
  position?: { x: number; y: number }
  isDragging?: boolean
  isSelected?: boolean
  isHighlighted?: boolean
  dragIndex?: number
  originalClass?: string
}

/**
 * 관계 데이터를 포함한 Student 타입
 */
export interface StudentWithRelations extends Student {
  class?: {
    id: string
    name: string
    instructor_name?: string
  }
  enrollments?: Array<{
    id: string
    course_package_id: string
    status: string
    start_date: string
    end_date?: string
  }>
}

/**
 * Student 폼 데이터 타입
 */
export interface StudentFormData extends Omit<StudentInsert, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> {
  confirmParentPhone?: string
}

/**
 * Optimistic Locking을 위한 Student 업데이트 요청 타입
 */
export interface StudentUpdateRequest {
  updates: Partial<Student>
  expected_version: string // updated_at 값으로 버전 체크
}

/**
 * 버전 충돌 에러 타입
 */
export class StudentVersionConflictError extends Error {
  constructor(
    public currentData: Student,
    public conflictingData: Partial<Student>
  ) {
    super('Student was modified by another user')
    this.name = 'StudentVersionConflictError'
  }
}

/**
 * Student 필터 조건 타입 (T-V2-009 고도화된 필터링 지원)
 */
export interface StudentFilters {
  // 기본 검색
  search?: string
  
  // 카테고리 필터
  grade?: string[]  // 학년 (초1, 중2, 고3 등)
  class_id?: string[]
  status?: StudentStatus[]
  
  // 날짜 범위 필터
  enrollment_date_from?: string
  enrollment_date_to?: string
  
  // 고급 필터
  has_overdue_payment?: boolean
  attendance_rate_min?: number
  attendance_rate_max?: number
  
  // 정렬
  sort_field?: 'name' | 'enrollment_date' | 'class_name' | 'attendance_rate' | 'last_payment_date'
  sort_order?: 'asc' | 'desc'
  
  // 페이지네이션
  cursor?: string
  limit?: number
  
  // 추가 옵션
  include_enrollment?: boolean
  include_attendance_stats?: boolean
  include_payment_history?: boolean
}

/**
 * Student 통계 타입
 */
export interface StudentStats {
  total: number
  active: number
  inactive: number
  graduated: number
  withdrawn: number
  suspended: number
  byGrade: Record<string, number>
  byClass: Record<string, number>
}

/**
 * Student 카드 데이터 타입 (UI 컴포넌트용)
 */
export interface StudentCardData {
  id: string
  name: string
  grade?: string
  grade_level?: string
  student_number?: string
  status: StudentStatus
  class_name?: string
  parent_phone_1?: string
  avatar_url?: string
  school_name?: string
  notes?: string
}

/**
 * Student 타입 가드
 */
export function isValidStudent(student: unknown): student is Student {
  return (
    typeof student === 'object' &&
    student !== null &&
    'id' in student &&
    typeof (student as Student).id === 'string' &&
    'name' in student &&
    typeof (student as Student).name === 'string'
  )
}

/**
 * ClassFlowStudent 타입 가드
 */
export function isClassFlowStudent(student: unknown): student is ClassFlowStudent {
  return isValidStudent(student)
}

/**
 * 활성 학생인지 체크
 */
export function isActiveStudent(student: Student): boolean {
  return student.status === 'active'
}

/**
 * 학생 이름으로 검색할 수 있는지 체크
 */
export function isSearchableStudent(student: Student, searchTerm: string): boolean {
  if (!searchTerm) return true
  
  const searchLower = searchTerm.toLowerCase()
  return (
    student.name?.toLowerCase().includes(searchLower) ||
    student.student_number?.toLowerCase().includes(searchLower) ||
    student.parent_phone_1?.includes(searchTerm) ||
    false
  )
}