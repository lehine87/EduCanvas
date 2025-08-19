import type { StudentStatus } from '@/types/student.types'

/**
 * 학생 상태별 UI 스타일 상수
 * @description 학생 상태에 따른 색상과 텍스트를 일관되게 관리
 */

// 상태별 색상 매핑 (TailwindCSS 클래스)
export const STUDENT_STATUS_COLORS: Record<StudentStatus, string> = {
  active: 'bg-success-100 text-success-800 border-success-200',
  inactive: 'bg-yellow-100 text-yellow-800 border-yellow-200', // 휴원으로 사용
  graduated: 'bg-blue-100 text-blue-800 border-blue-200',
  withdrawn: 'bg-warning-100 text-warning-800 border-warning-200',
  suspended: 'bg-error-100 text-error-800 border-error-200'
} as const

// 상태별 간단한 배경 색상 (VirtualizedStudentList용)
export const STUDENT_STATUS_BG_COLORS: Record<StudentStatus, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-yellow-100 text-yellow-800', // 휴원으로 사용
  graduated: 'bg-blue-100 text-blue-800',
  withdrawn: 'bg-red-100 text-red-800',
  suspended: 'bg-orange-100 text-orange-800'
} as const

// 상태별 텍스트 레이블
export const STUDENT_STATUS_TEXT: Record<StudentStatus, string> = {
  active: '활동중',
  inactive: '휴원', // 휴원으로 표시
  graduated: '졸업',
  withdrawn: '탈퇴',
  suspended: '정지'
} as const

// 상태별 아이콘 색상
export const STUDENT_STATUS_ICON_COLORS: Record<StudentStatus, string> = {
  active: 'text-success-600',
  inactive: 'text-yellow-600', // 휴원 색상으로 변경
  graduated: 'text-blue-600',
  withdrawn: 'text-warning-600',
  suspended: 'text-error-600'
} as const

/**
 * 학생 상태별 스타일 정보를 반환하는 유틸리티 함수
 */
export function getStudentStatusStyles(status: StudentStatus) {
  return {
    colors: STUDENT_STATUS_COLORS[status],
    bgColors: STUDENT_STATUS_BG_COLORS[status],
    text: STUDENT_STATUS_TEXT[status],
    iconColor: STUDENT_STATUS_ICON_COLORS[status]
  }
}

/**
 * 학생 상태 유효성 검사
 */
export function isValidStudentStatus(status: string): status is StudentStatus {
  return Object.keys(STUDENT_STATUS_TEXT).includes(status as StudentStatus)
}

/**
 * 학생 상태 목록 반환
 */
export function getStudentStatusList(): { value: StudentStatus; label: string }[] {
  return Object.entries(STUDENT_STATUS_TEXT).map(([value, label]) => ({
    value: value as StudentStatus,
    label
  }))
}

/**
 * 활성 상태 체크
 */
export function isActiveStatus(status: StudentStatus): boolean {
  return status === 'active'
}

/**
 * 비활성 상태 체크 (졸업, 탈퇴, 정지, 휴원 포함)
 */
export function isInactiveStatus(status: StudentStatus): boolean {
  return ['inactive', 'graduated', 'withdrawn', 'suspended'].includes(status)
}