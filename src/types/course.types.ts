'use strict'

import { Database } from './database.types'

// ================================================================
// 과정 패키지 기본 타입들
// ================================================================

export type CoursePackage = Database['public']['Tables']['course_packages']['Row']
export type CoursePackageInsert = Database['public']['Tables']['course_packages']['Insert']
export type CoursePackageUpdate = Database['public']['Tables']['course_packages']['Update']

// 결제 타입 (데이터베이스 ENUM과 일치)
export type BillingType = 'monthly' | 'sessions' | 'hours' | 'package' | 'drop_in'

// ================================================================
// 과정 패키지 확장 타입들
// ================================================================

// 관계 정보를 포함한 과정 패키지
export interface CoursePackageWithRelations extends CoursePackage {
  class?: {
    id: string
    name: string
  }
  enrollment_count?: number
  created_by_user?: {
    id: string
    name: string | null
  }
}

// 과정 패키지 폼 데이터
export interface CoursePackageFormData {
  name: string
  description?: string
  price: number
  original_price?: number
  billing_type: BillingType
  currency?: string
  class_id?: string
  
  // 기간/횟수 관련
  months?: number
  sessions?: number
  hours?: number
  validity_days?: number
  
  // 접근 제어
  max_enrollments?: number
  is_active?: boolean
  is_featured?: boolean
  available_from?: string
  available_until?: string
  
  // 추가 기능
  download_allowed?: boolean
  offline_access?: boolean
  video_access_days?: number
  display_order: number
}

// 과정 패키지 카드용 데이터
export interface CoursePackageCardData extends CoursePackage {
  enrollment_count: number
  class_name?: string
  is_popular?: boolean
  discount_percentage?: number
}

// ================================================================
// 결제 타입별 설정 정보
// ================================================================

export interface BillingTypeConfig {
  label: string
  description: string
  icon: string
  color: string
  requiredFields: string[]
  optionalFields: string[]
}

export const BILLING_TYPE_CONFIGS: Record<BillingType, BillingTypeConfig> = {
  monthly: {
    label: '월별 결제',
    description: '매월 정기 결제',
    icon: '📅',
    color: 'blue',
    requiredFields: ['months'],
    optionalFields: ['validity_days']
  },
  sessions: {
    label: '세션별 결제',
    description: '수업 횟수 기준',
    icon: '🎯',
    color: 'green',
    requiredFields: ['sessions'],
    optionalFields: ['validity_days']
  },
  hours: {
    label: '시간별 결제',
    description: '수업 시간 기준',
    icon: '⏰',
    color: 'orange',
    requiredFields: ['hours'],
    optionalFields: ['validity_days']
  },
  package: {
    label: '패키지 결제',
    description: '종합 패키지',
    icon: '📦',
    color: 'purple',
    requiredFields: [],
    optionalFields: ['months', 'sessions', 'hours', 'validity_days']
  },
  drop_in: {
    label: '일회 참여',
    description: '단발성 수업',
    icon: '🎪',
    color: 'pink',
    requiredFields: [],
    optionalFields: []
  }
}

// ================================================================
// 과정 통계 타입
// ================================================================

export interface CoursePackageStats {
  total: number
  active: number
  inactive: number
  featured: number
  total_enrollments: number
  total_revenue: number
  average_price: number
  by_billing_type: Record<BillingType, number>
}

// ================================================================
// API 응답 타입들
// ================================================================

export interface GetCoursePackagesResponse {
  success: boolean
  data: CoursePackageWithRelations[]
  total: number
  stats?: CoursePackageStats
}

export interface CreateCoursePackageResponse {
  success: boolean
  data: CoursePackage
  message?: string
}

export interface UpdateCoursePackageResponse {
  success: boolean
  data: CoursePackage
  message?: string
}

// ================================================================
// 유틸리티 함수들
// ================================================================

// 할인율 계산
export function calculateDiscountPercentage(originalPrice: number, currentPrice: number): number {
  if (!originalPrice || originalPrice <= currentPrice) return 0
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
}

// 결제 타입에 따른 기간 텍스트 생성
export function getBillingPeriodText(coursePackage: CoursePackage): string {
  const { billing_type, months, sessions, hours } = coursePackage
  
  switch (billing_type) {
    case 'monthly':
      return months ? `${months}개월` : '월별'
    case 'sessions':
      return sessions ? `${sessions}회` : '세션별'
    case 'hours':
      return hours ? `${hours}시간` : '시간별'
    case 'package':
      const parts = []
      if (months) parts.push(`${months}개월`)
      if (sessions) parts.push(`${sessions}회`)
      if (hours) parts.push(`${hours}시간`)
      return parts.length > 0 ? parts.join(' / ') : '패키지'
    case 'drop_in':
      return '1회'
    default:
      return '미정'
  }
}

// 과정 패키지 유효성 검사
export function validateCoursePackage(data: CoursePackageFormData): string[] {
  const errors: string[] = []
  
  if (!data.name?.trim()) {
    errors.push('과정명은 필수입니다')
  }
  
  if (data.price < 0) {
    errors.push('가격은 0 이상이어야 합니다')
  }
  
  if (data.original_price && data.original_price < data.price) {
    errors.push('정가는 현재 가격보다 높아야 합니다')
  }
  
  // 결제 타입별 필수 필드 검사
  const config = BILLING_TYPE_CONFIGS[data.billing_type]
  config.requiredFields.forEach(field => {
    if (!data[field as keyof CoursePackageFormData]) {
      errors.push(`${config.label}에는 ${field}가 필수입니다`)
    }
  })
  
  if (data.max_enrollments && data.max_enrollments < 1) {
    errors.push('최대 수강생은 1명 이상이어야 합니다')
  }
  
  return errors
}