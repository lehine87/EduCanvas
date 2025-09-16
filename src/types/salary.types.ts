/**
 * 급여 계산 시스템 타입 정의
 * 7가지 급여 정책 지원
 */

export type SalaryPolicyType = 
  | 'fixed_monthly'        // 고정 월급제
  | 'fixed_hourly'         // 시급제
  | 'commission'           // 단순 비율제
  | 'tiered_commission'    // 누진 비율제
  | 'student_based'        // 학생수 기준제
  | 'hybrid'               // 혼합형
  | 'guaranteed_minimum'   // 최저 보장제

export type CommissionBasis = 'revenue' | 'students' | 'hours'

export interface SalaryTier {
  id: string
  min_amount: number
  max_amount: number | null
  commission_rate: number
}

export interface SalaryPolicy {
  id: string
  tenant_id: string
  name: string
  type: SalaryPolicyType
  is_active: boolean
  
  // 기본 설정
  base_amount?: number          // 기본급 (fixed_monthly, hybrid)
  hourly_rate?: number          // 시급 (fixed_hourly)
  student_rate?: number         // 학생당 단가 (student_based)
  
  // 비율제 설정
  commission_rate?: number      // 수수료율 (commission, hybrid)
  commission_basis?: CommissionBasis  // 수수료 기준
  
  // 누진제 설정
  tiers?: SalaryTier[]         // 구간별 수수료
  
  // 보장/제한 설정
  minimum_guaranteed?: number   // 최소 보장액
  maximum_amount?: number       // 최대 지급액
  performance_threshold?: number // 성과 기준치 (hybrid)
  
  // 학생수 제한 (student_based)
  min_students?: number
  max_students?: number
  
  created_at: string
  updated_at: string
}

export interface SalaryAdjustment {
  id: string
  name: string
  type: 'allowance' | 'deduction'
  amount_type: 'fixed' | 'percentage'
  amount: number
  is_taxable: boolean
  description?: string
}

export interface MonthlySalaryMetrics {
  instructor_id: string
  month: string  // YYYY-MM
  
  // 기초 데이터
  total_revenue: number        // 해당 월 총 매출
  total_students: number       // 담당 학생 수
  total_hours: number          // 총 근무 시간
  regular_hours: number        // 정규 근무 시간
  overtime_hours: number       // 초과 근무 시간
  
  // 수업 관련
  total_classes: number        // 총 수업 수
  completed_classes: number    // 완료된 수업 수
  cancelled_classes: number    // 취소된 수업 수
  
  // 기타
  bonus_eligible: boolean      // 보너스 대상 여부
  special_allowances: SalaryAdjustment[]  // 특별 수당
  deductions: SalaryAdjustment[]          // 공제 항목
}

export interface SalaryCalculationResult {
  instructor_id: string
  calculation_month: string
  policy_type: SalaryPolicyType
  
  // 계산 결과
  base_salary: number          // 기본급
  commission_salary: number    // 수수료
  overtime_allowance: number   // 초과 근무 수당
  special_allowances: number   // 특별 수당
  total_allowances: number     // 총 수당
  
  // 공제
  tax_deduction: number        // 세금
  insurance_deduction: number  // 보험료
  other_deductions: number     // 기타 공제
  total_deductions: number     // 총 공제
  
  // 최종
  gross_salary: number         // 세전 급여
  net_salary: number           // 실지급액
  
  // 계산 상세
  calculation_details: {
    metrics: MonthlySalaryMetrics
    applied_policy: SalaryPolicy
    tier_breakdown?: {          // 누진제인 경우
      tier: SalaryTier
      amount: number
      commission: number
    }[]
    adjustments: {
      allowances: SalaryAdjustment[]
      deductions: SalaryAdjustment[]
    }
    service_version?: string    // 서비스 버전 정보
  }
  
  calculated_at: string
}

export interface SalaryCalculationRequest {
  instructor_id: string
  month: string
  policy_id?: string          // 지정된 정책이 있으면 사용
  include_adjustments?: boolean
  preview_mode?: boolean      // 미리보기 모드
}

export interface SalaryHistoryRecord {
  id: string
  instructor_id: string
  month: string
  calculation_result: SalaryCalculationResult
  status: 'calculated' | 'approved' | 'paid' | 'disputed'
  approved_by?: string        // 승인자 ID
  paid_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

// 급여 정책별 유효성 검증
export interface PolicyValidation {
  is_valid: boolean
  errors: string[]
  warnings: string[]
}

// 급여 계산 엔진 인터페이스
export interface SalaryCalculator {
  calculateSalary(
    metrics: MonthlySalaryMetrics,
    policy: SalaryPolicy
  ): Promise<SalaryCalculationResult>
  
  validatePolicy(policy: SalaryPolicy): PolicyValidation
  
  previewCalculation(
    instructor_id: string,
    month: string,
    policy: SalaryPolicy
  ): Promise<SalaryCalculationResult>
}

// 통계 및 리포트
export interface SalaryStatistics {
  tenant_id: string
  month: string
  
  total_instructors: number
  total_gross_salary: number
  total_net_salary: number
  average_salary: number
  median_salary: number
  
  by_policy_type: {
    [key in SalaryPolicyType]: {
      count: number
      total_amount: number
      average_amount: number
    }
  }
  
  by_department?: {
    [department: string]: {
      count: number
      total_amount: number
      average_amount: number
    }
  }
}

// Frontend 컴포넌트용 Props
export interface SalaryCalculatorProps {
  instructorId: string
  currentMonth: string
  availablePolicies: SalaryPolicy[]
  onCalculationComplete: (result: SalaryCalculationResult) => void
  onError: (error: string) => void
}

export interface SalaryPolicyFormProps {
  policy?: SalaryPolicy
  onSave: (policy: SalaryPolicy) => void
  onCancel: () => void
  isEditing?: boolean
}

export interface SalaryHistoryTableProps {
  instructorId?: string
  month?: string
  data: SalaryHistoryRecord[]
  onApprove: (recordId: string) => void
  onDispute: (recordId: string, reason: string) => void
  onMarkPaid: (recordId: string) => void
}