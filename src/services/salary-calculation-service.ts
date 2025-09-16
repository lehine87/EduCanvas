/**
 * @file salary-calculation-service.ts
 * @description 급여 계산 서비스 레이어 - 업계 표준 아키텍처 적용
 * @version v2.0 - Service Layer Pattern
 */

import type { Database } from '@/types/database.types'
import type { 
  SalaryCalculationRequest,
  SalaryCalculationResult,
  MonthlySalaryMetrics,
  SalaryPolicy,
  SalaryTier
} from '@/types/salary.types'

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface SalaryCalculationContext {
  metrics: MonthlySalaryMetrics
  policy: SalaryPolicy
  includeAdjustments: boolean
  isPreviewMode: boolean
}

export interface SalaryCalculationServiceOptions {
  enableTaxCalculation: boolean
  enableInsuranceCalculation: boolean
  enablePerformanceBonus: boolean
}

export interface CalculationBreakdown {
  baseSalary: number
  commissionSalary: number
  overtimeAllowance: number
  specialAllowances: number
  totalAllowances: number
  taxDeduction: number
  insuranceDeduction: number
  otherDeductions: number
  totalDeductions: number
  grossSalary: number
  netSalary: number
  calculationDetails: Record<string, any>
  appliedPolicy: SalaryPolicy
  policySpecificDetails?: Record<string, any>
}

// ============================================================================
// Salary Calculation Service Class
// ============================================================================

export class SalaryCalculationService {
  private static readonly DEFAULT_OPTIONS: SalaryCalculationServiceOptions = {
    enableTaxCalculation: true,
    enableInsuranceCalculation: true,
    enablePerformanceBonus: true
  }

  /**
   * 메인 급여 계산 서비스 메서드
   */
  static async calculateSalary(
    context: SalaryCalculationContext,
    options: Partial<SalaryCalculationServiceOptions> = {}
  ): Promise<SalaryCalculationResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options }
    
    try {
      // 1. 정책별 기본 급여 계산
      const breakdown = await this.calculatePolicyBasedSalary(context)
      
      // 2. 수당 계산 (옵션에 따라)
      if (context.includeAdjustments) {
        this.calculateAllowances(breakdown, context, opts)
      }
      
      // 3. 공제 계산 (세금, 보험 등)
      this.calculateDeductions(breakdown, context, opts)
      
      // 4. 최종 급여 확정 (최소 보장액, 최대 제한액 적용)
      this.applyFinalAdjustments(breakdown, context)
      
      // 5. 결과 객체 생성
      return this.buildCalculationResult(breakdown, context)
      
    } catch (error) {
      throw new SalaryCalculationError(
        'CALCULATION_FAILED',
        `급여 계산 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        { context, options: opts }
      )
    }
  }

  // ============================================================================
  // Policy-Based Calculation Methods
  // ============================================================================

  /**
   * 정책별 기본 급여 계산
   */
  private static async calculatePolicyBasedSalary(
    context: SalaryCalculationContext
  ): Promise<CalculationBreakdown> {
    const { metrics, policy } = context
    
    let baseSalary = 0
    let commissionSalary = 0
    let policySpecificDetails: Record<string, any> = {}

    switch (policy.type) {
      case 'fixed_monthly':
        ({ baseSalary, policySpecificDetails } = this.calculateFixedMonthlySalary(policy, metrics))
        break

      case 'fixed_hourly':
        ({ baseSalary, policySpecificDetails } = this.calculateFixedHourlySalary(policy, metrics))
        break

      case 'commission':
        ({ commissionSalary, policySpecificDetails } = this.calculateCommissionSalary(policy, metrics))
        break

      case 'tiered_commission':
        ({ commissionSalary, policySpecificDetails } = await this.calculateTieredCommissionSalary(policy, metrics))
        break

      case 'student_based':
        ({ baseSalary, policySpecificDetails } = this.calculateStudentBasedSalary(policy, metrics))
        break

      case 'hybrid':
        ({ baseSalary, commissionSalary, policySpecificDetails } = this.calculateHybridSalary(policy, metrics))
        break

      case 'guaranteed_minimum':
        ({ baseSalary, commissionSalary, policySpecificDetails } = this.calculateGuaranteedMinimumSalary(policy, metrics))
        break

      default:
        throw new SalaryCalculationError(
          'UNSUPPORTED_POLICY_TYPE',
          `지원하지 않는 급여 정책 타입: ${policy.type}`,
          { policyType: policy.type }
        )
    }

    return {
      baseSalary,
      commissionSalary,
      overtimeAllowance: 0,
      specialAllowances: 0,
      totalAllowances: 0,
      taxDeduction: 0,
      insuranceDeduction: 0,
      otherDeductions: 0,
      totalDeductions: 0,
      grossSalary: baseSalary + commissionSalary,
      netSalary: 0,
      calculationDetails: {
        calculationMethod: policy.type,
        policyName: policy.name
      },
      appliedPolicy: policy,
      policySpecificDetails
    }
  }

  /**
   * 고정 월급제 계산
   */
  private static calculateFixedMonthlySalary(
    policy: SalaryPolicy,
    metrics: MonthlySalaryMetrics
  ): { baseSalary: number; policySpecificDetails: Record<string, any> } {
    const baseSalary = policy.base_amount || 0

    return {
      baseSalary,
      policySpecificDetails: {
        baseAmount: baseSalary,
        calculationNote: '고정 월급제 - 기본급 지급'
      }
    }
  }

  /**
   * 시급제 계산
   */
  private static calculateFixedHourlySalary(
    policy: SalaryPolicy,
    metrics: MonthlySalaryMetrics
  ): { baseSalary: number; policySpecificDetails: Record<string, any> } {
    const hourlyRate = policy.hourly_rate || 0
    const regularHours = metrics.regular_hours || 0
    const baseSalary = regularHours * hourlyRate

    return {
      baseSalary,
      policySpecificDetails: {
        hourlyRate,
        regularHours,
        totalHours: metrics.total_hours,
        calculationNote: `시급 ${hourlyRate.toLocaleString()}원 × ${regularHours}시간`
      }
    }
  }

  /**
   * 단순 비율제 계산
   */
  private static calculateCommissionSalary(
    policy: SalaryPolicy,
    metrics: MonthlySalaryMetrics
  ): { commissionSalary: number; policySpecificDetails: Record<string, any> } {
    const commissionRate = policy.commission_rate || 0
    const basis = policy.commission_basis || 'revenue'
    
    let baseAmount = 0
    let basisDescription = ''

    switch (basis) {
      case 'revenue':
        baseAmount = metrics.total_revenue
        basisDescription = '총 매출'
        break
      case 'students':
        baseAmount = metrics.total_students
        basisDescription = '총 학생수'
        break
      case 'hours':
        baseAmount = metrics.total_hours
        basisDescription = '총 근무시간'
        break
      default:
        throw new SalaryCalculationError(
          'INVALID_COMMISSION_BASIS',
          `잘못된 수수료 기준: ${basis}`,
          { basis, policy }
        )
    }

    const commissionSalary = Math.floor(baseAmount * (commissionRate / 100))

    return {
      commissionSalary,
      policySpecificDetails: {
        commissionRate,
        commissionBasis: basis,
        baseAmount,
        basisDescription,
        calculationNote: `${basisDescription} ${baseAmount.toLocaleString()} × ${commissionRate}%`
      }
    }
  }

  /**
   * 누진 비율제 계산
   */
  private static async calculateTieredCommissionSalary(
    policy: SalaryPolicy,
    metrics: MonthlySalaryMetrics
  ): Promise<{ commissionSalary: number; policySpecificDetails: Record<string, any> }> {
    const tiers = policy.tiers || []
    const basis = policy.commission_basis || 'revenue'
    
    let baseAmount = 0
    switch (basis) {
      case 'revenue':
        baseAmount = metrics.total_revenue
        break
      case 'students':
        baseAmount = metrics.total_students
        break
      case 'hours':
        baseAmount = metrics.total_hours
        break
    }

    let totalCommission = 0
    let remainingAmount = baseAmount
    const tierBreakdown: Array<{
      tier: SalaryTier
      applicableAmount: number
      commission: number
    }> = []

    // 구간별 계산
    const sortedTiers = tiers.sort((a: any, b: any) => a.min_amount - b.min_amount)
    
    for (const tier of sortedTiers) {
      if (remainingAmount <= 0) break

      const tierMin = tier.min_amount
      const tierMax = tier.max_amount || Infinity
      const applicableAmount = Math.min(
        Math.max(remainingAmount - (tierBreakdown.length === 0 ? 0 : tierMin), 0),
        tierMax - tierMin
      )

      if (applicableAmount > 0) {
        const commission = Math.floor(applicableAmount * (tier.commission_rate / 100))
        totalCommission += commission
        remainingAmount -= applicableAmount

        tierBreakdown.push({
          tier,
          applicableAmount,
          commission
        })
      }
    }

    return {
      commissionSalary: totalCommission,
      policySpecificDetails: {
        commissionBasis: basis,
        baseAmount,
        tierBreakdown,
        totalTiers: tiers.length,
        calculationNote: `누진 구간별 계산 (${tiers.length}개 구간)`
      }
    }
  }

  /**
   * 학생수 기준제 계산
   */
  private static calculateStudentBasedSalary(
    policy: SalaryPolicy,
    metrics: MonthlySalaryMetrics
  ): { baseSalary: number; policySpecificDetails: Record<string, any> } {
    const studentRate = policy.student_rate || 0
    const minStudents = policy.min_students || 0
    const maxStudents = policy.max_students || Infinity
    
    const effectiveStudents = Math.max(
      minStudents,
      Math.min(metrics.total_students, maxStudents)
    )
    
    const baseSalary = effectiveStudents * studentRate

    return {
      baseSalary,
      policySpecificDetails: {
        studentRate,
        totalStudents: metrics.total_students,
        effectiveStudents,
        minStudents,
        maxStudents: maxStudents === Infinity ? null : maxStudents,
        calculationNote: `학생 ${effectiveStudents}명 × ${studentRate.toLocaleString()}원`
      }
    }
  }

  /**
   * 혼합형 계산
   */
  private static calculateHybridSalary(
    policy: SalaryPolicy,
    metrics: MonthlySalaryMetrics
  ): { baseSalary: number; commissionSalary: number; policySpecificDetails: Record<string, any> } {
    const baseSalary = policy.base_amount || 0
    const commissionRate = policy.commission_rate || 0
    const threshold = policy.performance_threshold || 0
    const basis = policy.commission_basis || 'revenue'
    
    let baseAmount = 0
    switch (basis) {
      case 'revenue':
        baseAmount = metrics.total_revenue
        break
      case 'students':
        baseAmount = metrics.total_students
        break
      case 'hours':
        baseAmount = metrics.total_hours
        break
    }

    const excessAmount = Math.max(0, baseAmount - threshold)
    const commissionSalary = Math.floor(excessAmount * (commissionRate / 100))

    return {
      baseSalary,
      commissionSalary,
      policySpecificDetails: {
        baseAmount: baseSalary,
        commissionBasis: basis,
        performanceAmount: baseAmount,
        performanceThreshold: threshold,
        excessAmount,
        commissionRate,
        calculationNote: `기본급 ${baseSalary.toLocaleString()}원 + 초과분 ${excessAmount.toLocaleString()} × ${commissionRate}%`
      }
    }
  }

  /**
   * 최저 보장제 계산
   */
  private static calculateGuaranteedMinimumSalary(
    policy: SalaryPolicy,
    metrics: MonthlySalaryMetrics
  ): { baseSalary: number; commissionSalary: number; policySpecificDetails: Record<string, any> } {
    const commissionRate = policy.commission_rate || 0
    const guaranteedAmount = policy.minimum_guaranteed || 0
    const basis = policy.commission_basis || 'revenue'
    
    let baseAmount = 0
    switch (basis) {
      case 'revenue':
        baseAmount = metrics.total_revenue
        break
      case 'students':
        baseAmount = metrics.total_students
        break
      case 'hours':
        baseAmount = metrics.total_hours
        break
    }

    const calculatedCommission = Math.floor(baseAmount * (commissionRate / 100))

    return {
      baseSalary: 0,
      commissionSalary: calculatedCommission,
      policySpecificDetails: {
        commissionBasis: basis,
        baseAmount,
        commissionRate,
        calculatedCommission,
        guaranteedAmount,
        willApplyGuarantee: calculatedCommission < guaranteedAmount,
        calculationNote: `실적 기반 ${calculatedCommission.toLocaleString()}원, 최소 보장 ${guaranteedAmount.toLocaleString()}원`
      }
    }
  }

  // ============================================================================
  // Allowance Calculation Methods
  // ============================================================================

  /**
   * 수당 계산
   */
  private static calculateAllowances(
    breakdown: CalculationBreakdown,
    context: SalaryCalculationContext,
    options: SalaryCalculationServiceOptions
  ): void {
    const { metrics } = context

    // 초과근무 수당
    breakdown.overtimeAllowance = this.calculateOvertimeAllowance(metrics)

    // 성과 수당 (옵션에 따라)
    if (options.enablePerformanceBonus) {
      breakdown.specialAllowances = this.calculateSpecialAllowances(metrics)
    }

    // 기타 수당 (메트릭에서 제공되는 경우)
    const additionalAllowances = metrics.special_allowances?.reduce(
      (sum: number, allowance: any) => sum + allowance.amount, 0
    ) || 0

    breakdown.totalAllowances = breakdown.overtimeAllowance + breakdown.specialAllowances + additionalAllowances
    breakdown.grossSalary = breakdown.baseSalary + breakdown.commissionSalary + breakdown.totalAllowances
  }

  /**
   * 초과근무 수당 계산
   */
  private static calculateOvertimeAllowance(metrics: MonthlySalaryMetrics): number {
    const overtimeHours = metrics.overtime_hours || 0
    const OVERTIME_RATE = 35000 // 시급 35,000원
    const OVERTIME_MULTIPLIER = 1.5 // 1.5배

    return Math.floor(overtimeHours * OVERTIME_RATE * OVERTIME_MULTIPLIER)
  }

  /**
   * 특별 수당 계산
   */
  private static calculateSpecialAllowances(metrics: MonthlySalaryMetrics): number {
    let allowances = 0

    // 우수 강사 수당 (학생 15명 이상)
    if (metrics.total_students >= 15) {
      allowances += 200000
    }

    // 완벽 출석 보너스
    if (metrics.bonus_eligible) {
      allowances += 100000
    }

    return allowances
  }

  // ============================================================================
  // Deduction Calculation Methods
  // ============================================================================

  /**
   * 공제 계산
   */
  private static calculateDeductions(
    breakdown: CalculationBreakdown,
    context: SalaryCalculationContext,
    options: SalaryCalculationServiceOptions
  ): void {
    const { metrics } = context

    // 세금 계산
    if (options.enableTaxCalculation) {
      breakdown.taxDeduction = this.calculateTax(breakdown.grossSalary)
    }

    // 보험료 계산
    if (options.enableInsuranceCalculation) {
      breakdown.insuranceDeduction = this.calculateInsurance(breakdown.grossSalary)
    }

    // 기타 공제
    breakdown.otherDeductions = metrics.deductions?.reduce(
      (sum: number, deduction: any) => sum + deduction.amount, 0
    ) || 0

    breakdown.totalDeductions = breakdown.taxDeduction + breakdown.insuranceDeduction + breakdown.otherDeductions
  }

  /**
   * 세금 계산 (간이세액표 기준)
   */
  private static calculateTax(grossSalary: number): number {
    // 2024년 간이세액표 기준
    if (grossSalary <= 1200000) return 0
    if (grossSalary <= 4600000) return Math.floor((grossSalary - 1200000) * 0.06)
    if (grossSalary <= 8800000) return Math.floor(204000 + (grossSalary - 4600000) * 0.15)
    return Math.floor(834000 + (grossSalary - 8800000) * 0.24)
  }

  /**
   * 4대 보험료 계산
   */
  private static calculateInsurance(grossSalary: number): number {
    // 국민연금 4.5%, 건강보험 3.545%, 고용보험 0.9%, 장기요양 0.4%
    const TOTAL_INSURANCE_RATE = 0.09145 // 약 9.145%
    return Math.floor(grossSalary * TOTAL_INSURANCE_RATE)
  }

  // ============================================================================
  // Final Adjustment Methods
  // ============================================================================

  /**
   * 최종 조정 (최소 보장액, 최대 제한액)
   */
  private static applyFinalAdjustments(
    breakdown: CalculationBreakdown,
    context: SalaryCalculationContext
  ): void {
    const { policy } = context
    let finalGrossSalary = breakdown.grossSalary

    // 최소 보장액 적용
    if (policy.minimum_guaranteed && finalGrossSalary < policy.minimum_guaranteed) {
      finalGrossSalary = policy.minimum_guaranteed
      breakdown.calculationDetails.minimumGuaranteeApplied = true
      breakdown.calculationDetails.originalGrossSalary = breakdown.grossSalary
    }

    // 최대 제한액 적용
    if (policy.maximum_amount && finalGrossSalary > policy.maximum_amount) {
      finalGrossSalary = policy.maximum_amount
      breakdown.calculationDetails.maximumLimitApplied = true
      breakdown.calculationDetails.originalGrossSalary = breakdown.grossSalary
    }

    breakdown.grossSalary = finalGrossSalary
    breakdown.netSalary = finalGrossSalary - breakdown.totalDeductions
  }

  // ============================================================================
  // Result Building
  // ============================================================================

  /**
   * 최종 결과 객체 생성
   */
  private static buildCalculationResult(
    breakdown: CalculationBreakdown,
    context: SalaryCalculationContext
  ): SalaryCalculationResult {
    return {
      instructor_id: context.metrics.instructor_id,
      calculation_month: context.metrics.month,
      policy_type: context.policy.type,
      base_salary: breakdown.baseSalary,
      commission_salary: breakdown.commissionSalary,
      overtime_allowance: breakdown.overtimeAllowance,
      special_allowances: breakdown.specialAllowances,
      total_allowances: breakdown.totalAllowances,
      tax_deduction: breakdown.taxDeduction,
      insurance_deduction: breakdown.insuranceDeduction,
      other_deductions: breakdown.otherDeductions,
      total_deductions: breakdown.totalDeductions,
      gross_salary: breakdown.grossSalary,
      net_salary: breakdown.netSalary,
      calculation_details: {
        ...breakdown.calculationDetails,
        metrics: context.metrics,
        applied_policy: breakdown.appliedPolicy,
        service_version: '2.0'
      },
      calculated_at: new Date().toISOString()
    }
  }
}

// ============================================================================
// Error Classes
// ============================================================================

export class SalaryCalculationError extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: any
  ) {
    super(message)
    this.name = 'SalaryCalculationError'
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 급여 계산 컨텍스트 생성 헬퍼
 */
export function createCalculationContext(
  metrics: MonthlySalaryMetrics,
  policy: SalaryPolicy,
  includeAdjustments: boolean = true,
  isPreviewMode: boolean = false
): SalaryCalculationContext {
  return {
    metrics,
    policy,
    includeAdjustments,
    isPreviewMode
  }
}

/**
 * 급여 계산 검증
 */
export function validateCalculationResult(result: SalaryCalculationResult): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (result.net_salary < 0) {
    errors.push('최종 급여가 음수입니다.')
  }

  if (result.total_deductions > result.gross_salary) {
    errors.push('공제 금액이 총 급여보다 큽니다.')
  }

  if (result.gross_salary < (result.base_salary + result.commission_salary)) {
    errors.push('총 급여가 기본급과 성과급의 합보다 작습니다.')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}