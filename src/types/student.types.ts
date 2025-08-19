// 학생 관련 통합 타입 정의
import type { Database } from './database'

/**
 * 학생 상태 타입 (통일된 정의)
 * 데이터베이스 enum과 일치: active, inactive, graduated, withdrawn, suspended
 */
export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'withdrawn' | 'suspended'

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
 * Student 필터 조건 타입
 */
export interface StudentFilters {
  status?: StudentStatus[]
  class_id?: string[]
  grade_level?: string[]
  search?: string
  created_after?: string
  created_before?: string
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
  student_number?: string
  status: StudentStatus
  class_name?: string
  parent_phone_1?: string
  avatar_url?: string
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