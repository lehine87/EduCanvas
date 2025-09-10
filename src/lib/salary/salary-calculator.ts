/**
 * @file salary-calculator.ts
 * @description 급여 계산 엔진 - 7가지 급여 정책 지원
 * @module T-V2-012
 */

import type { SalaryPolicyType, SalaryCalculationDetail } from '@/types/instructor.types'

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface SalaryPolicy {
  id: string
  tenant_id: string
  name: string
  policy_type: SalaryPolicyType
  base_amount: number
  hourly_rate?: number
  commission_rate?: number
  minimum_guaranteed: number
  calculation_basis: 'revenue' | 'students' | 'hours'
  policy_config?: Record<string, any>
}

export interface SalaryTier {
  tier_order: number
  min_amount: number
  max_amount?: number
  commission_rate: number
}

export interface MonthlyMetrics {
  total_revenue: number
  total_students: number
  total_hours: number
  overtime_hours?: number
  special_allowances?: Array<{
    name: string
    amount: number
  }>
  deductions?: Array<{
    name: string
    amount: number
  }>
}

export interface CalculationResult {
  base_salary: number
  commission_salary: number
  bonus_amount: number
  deduction_amount: number
  total_calculated: number
  minimum_guaranteed: number
  final_salary: number
  calculation_details: Record<string, any>
}

// ============================================================================
// Salary Calculator Class
// ============================================================================

export class SalaryCalculator {
  /**
   * 급여 계산 메인 함수
   */
  static calculateSalary(
    policy: SalaryPolicy,
    metrics: MonthlyMetrics,
    tiers?: SalaryTier[]
  ): CalculationResult {
    let result: CalculationResult = {
      base_salary: 0,
      commission_salary: 0,
      bonus_amount: 0,
      deduction_amount: 0,
      total_calculated: 0,
      minimum_guaranteed: policy.minimum_guaranteed,
      final_salary: 0,
      calculation_details: {}
    }

    // 정책별 계산
    switch (policy.policy_type) {
      case 'fixed_monthly':
        result = this.calculateFixedMonthly(policy, metrics)
        break
      case 'fixed_hourly':
        result = this.calculateFixedHourly(policy, metrics)
        break
      case 'commission':
        result = this.calculateCommission(policy, metrics)
        break
      case 'tiered_commission':
        result = this.calculateTieredCommission(policy, metrics, tiers || [])
        break
      case 'student_based':
        result = this.calculateStudentBased(policy, metrics)
        break
      case 'hybrid':
        result = this.calculateHybrid(policy, metrics)
        break
      case 'guaranteed_minimum':
        result = this.calculateGuaranteedMinimum(policy, metrics)
        break
      default:
        throw new Error(`Unsupported policy type: ${policy.policy_type}`)
    }

    // 공통 추가 계산
    result = this.applyCommonCalculations(result, metrics, policy)

    // 최종 급여 확정 (최소 보장과 비교)
    result.final_salary = Math.max(result.total_calculated, result.minimum_guaranteed)

    return result
  }

  // ============================================================================
  // Policy-specific Calculations
  // ============================================================================

  /**
   * 1. 고정 월급제 (fixed_monthly)
   */
  private static calculateFixedMonthly(
    policy: SalaryPolicy,
    metrics: MonthlyMetrics
  ): CalculationResult {
    const baseSalary = policy.base_amount

    return {
      base_salary: baseSalary,
      commission_salary: 0,
      bonus_amount: 0,
      deduction_amount: 0,
      total_calculated: baseSalary,
      minimum_guaranteed: policy.minimum_guaranteed,
      final_salary: 0,
      calculation_details: {
        calculation_method: '고정 월급제',
        base_amount: baseSalary
      }
    }
  }

  /**
   * 2. 시급제 (fixed_hourly)
   */
  private static calculateFixedHourly(
    policy: SalaryPolicy,
    metrics: MonthlyMetrics
  ): CalculationResult {
    const hourlyRate = policy.hourly_rate || 0
    const regularHours = metrics.total_hours
    const overtimeHours = metrics.overtime_hours || 0
    
    const regularPay = regularHours * hourlyRate
    const overtimePay = overtimeHours * hourlyRate * 1.5 // 초과근무 1.5배
    const totalPay = regularPay + overtimePay

    return {
      base_salary: regularPay,
      commission_salary: 0,
      bonus_amount: overtimePay,
      deduction_amount: 0,
      total_calculated: totalPay,
      minimum_guaranteed: policy.minimum_guaranteed,
      final_salary: 0,
      calculation_details: {
        calculation_method: '시급제',
        hourly_rate: hourlyRate,
        regular_hours: regularHours,
        overtime_hours: overtimeHours,
        overtime_pay: overtimePay
      }
    }
  }

  /**
   * 3. 단순 비율제 (commission)
   */
  private static calculateCommission(
    policy: SalaryPolicy,
    metrics: MonthlyMetrics
  ): CalculationResult {
    const commissionRate = policy.commission_rate || 0
    let baseAmount = 0

    // 계산 기준에 따라 기준액 결정
    switch (policy.calculation_basis) {
      case 'revenue':
        baseAmount = metrics.total_revenue
        break
      case 'students':
        baseAmount = metrics.total_students * 100000 // 학생 1명당 10만원으로 가정
        break
      case 'hours':
        baseAmount = metrics.total_hours * 50000 // 시간당 5만원으로 가정
        break
    }

    const commissionSalary = Math.floor(baseAmount * (commissionRate / 100))

    return {
      base_salary: 0,
      commission_salary: commissionSalary,
      bonus_amount: 0,
      deduction_amount: 0,
      total_calculated: commissionSalary,
      minimum_guaranteed: policy.minimum_guaranteed,
      final_salary: 0,
      calculation_details: {
        calculation_method: '단순 비율제',
        calculation_basis: policy.calculation_basis,
        base_amount: baseAmount,
        commission_rate: commissionRate
      }
    }
  }

  /**
   * 4. 누진 비율제 (tiered_commission)
   */
  private static calculateTieredCommission(
    policy: SalaryPolicy,
    metrics: MonthlyMetrics,
    tiers: SalaryTier[]
  ): CalculationResult {
    let baseAmount = 0

    // 계산 기준에 따라 기준액 결정
    switch (policy.calculation_basis) {
      case 'revenue':
        baseAmount = metrics.total_revenue
        break
      case 'students':
        baseAmount = metrics.total_students * 100000
        break
      case 'hours':
        baseAmount = metrics.total_hours * 50000
        break
    }

    let totalCommission = 0
    let remainingAmount = baseAmount
    const tierDetails: Array<{tier: number, amount: number, rate: number, commission: number}> = []

    // 정렬된 구간별로 계산
    const sortedTiers = tiers.sort((a, b) => a.tier_order - b.tier_order)

    for (const tier of sortedTiers) {
      if (remainingAmount <= 0) break

      const tierMin = tier.min_amount
      const tierMax = tier.max_amount || Infinity
      const tierAmount = Math.min(remainingAmount, tierMax - tierMin)

      if (tierAmount > 0) {
        const tierCommission = Math.floor(tierAmount * (tier.commission_rate / 100))
        totalCommission += tierCommission
        remainingAmount -= tierAmount

        tierDetails.push({
          tier: tier.tier_order,
          amount: tierAmount,
          rate: tier.commission_rate,
          commission: tierCommission
        })
      }
    }

    return {
      base_salary: 0,
      commission_salary: totalCommission,
      bonus_amount: 0,
      deduction_amount: 0,
      total_calculated: totalCommission,
      minimum_guaranteed: policy.minimum_guaranteed,
      final_salary: 0,
      calculation_details: {
        calculation_method: '누진 비율제',
        calculation_basis: policy.calculation_basis,
        base_amount: baseAmount,
        tier_details: tierDetails
      }
    }
  }

  /**
   * 5. 학생수 기준제 (student_based)
   */
  private static calculateStudentBased(
    policy: SalaryPolicy,
    metrics: MonthlyMetrics
  ): CalculationResult {
    const studentRate = policy.policy_config?.student_rate || 100000 // 학생 1명당 기본 10만원
    const minStudents = policy.policy_config?.min_students || 0
    const maxStudents = policy.policy_config?.max_students || Infinity

    const effectiveStudents = Math.max(
      minStudents,
      Math.min(metrics.total_students, maxStudents)
    )

    const calculatedSalary = effectiveStudents * studentRate

    return {
      base_salary: calculatedSalary,
      commission_salary: 0,
      bonus_amount: 0,
      deduction_amount: 0,
      total_calculated: calculatedSalary,
      minimum_guaranteed: policy.minimum_guaranteed,
      final_salary: 0,
      calculation_details: {
        calculation_method: '학생수 기준제',
        student_rate: studentRate,
        total_students: metrics.total_students,
        effective_students: effectiveStudents,
        min_students: minStudents,
        max_students: maxStudents
      }
    }
  }

  /**
   * 6. 혼합형 (hybrid)
   */
  private static calculateHybrid(
    policy: SalaryPolicy,
    metrics: MonthlyMetrics
  ): CalculationResult {
    const baseSalary = policy.base_amount
    const commissionRate = policy.commission_rate || 0
    const performanceThreshold = policy.policy_config?.performance_threshold || 0

    let baseAmount = 0
    switch (policy.calculation_basis) {
      case 'revenue':
        baseAmount = metrics.total_revenue
        break
      case 'students':
        baseAmount = metrics.total_students * 100000
        break
      case 'hours':
        baseAmount = metrics.total_hours * 50000
        break
    }

    // 성과 기준치 초과분에 대해서만 수수료 적용
    const excessAmount = Math.max(0, baseAmount - performanceThreshold)
    const commissionSalary = Math.floor(excessAmount * (commissionRate / 100))
    const totalSalary = baseSalary + commissionSalary

    return {
      base_salary: baseSalary,
      commission_salary: commissionSalary,
      bonus_amount: 0,
      deduction_amount: 0,
      total_calculated: totalSalary,
      minimum_guaranteed: policy.minimum_guaranteed,
      final_salary: 0,
      calculation_details: {
        calculation_method: '혼합형',
        base_salary: baseSalary,
        calculation_basis: policy.calculation_basis,
        base_amount: baseAmount,
        performance_threshold: performanceThreshold,
        excess_amount: excessAmount,
        commission_rate: commissionRate
      }
    }
  }

  /**
   * 7. 최저 보장제 (guaranteed_minimum)
   */
  private static calculateGuaranteedMinimum(
    policy: SalaryPolicy,
    metrics: MonthlyMetrics
  ): CalculationResult {
    // 실적 기반 계산
    const commissionRate = policy.commission_rate || 0
    let baseAmount = 0

    switch (policy.calculation_basis) {
      case 'revenue':
        baseAmount = metrics.total_revenue
        break
      case 'students':
        baseAmount = metrics.total_students * 100000
        break
      case 'hours':
        baseAmount = metrics.total_hours * 50000
        break
    }

    const calculatedSalary = Math.floor(baseAmount * (commissionRate / 100))
    const guaranteedAmount = policy.minimum_guaranteed

    return {
      base_salary: 0,
      commission_salary: calculatedSalary,
      bonus_amount: 0,
      deduction_amount: 0,
      total_calculated: calculatedSalary,
      minimum_guaranteed: guaranteedAmount,
      final_salary: 0,
      calculation_details: {
        calculation_method: '최저 보장제',
        calculation_basis: policy.calculation_basis,
        base_amount: baseAmount,
        commission_rate: commissionRate,
        calculated_salary: calculatedSalary,
        guaranteed_amount: guaranteedAmount
      }
    }
  }

  // ============================================================================
  // Common Calculations
  // ============================================================================

  /**
   * 공통 추가 계산 (수당, 공제 등)
   */
  private static applyCommonCalculations(
    result: CalculationResult,
    metrics: MonthlyMetrics,
    policy: SalaryPolicy
  ): CalculationResult {
    // 특별 수당 계산
    const specialAllowances = metrics.special_allowances || []
    const totalAllowances = specialAllowances.reduce((sum, allowance) => sum + allowance.amount, 0)

    // 공제 계산
    const deductions = metrics.deductions || []
    const totalDeductions = deductions.reduce((sum, deduction) => sum + deduction.amount, 0)

    // 세금 계산 (간이세액표 기준)
    const grossSalary = result.base_salary + result.commission_salary + totalAllowances
    const taxAmount = this.calculateTax(grossSalary)

    // 4대 보험료 계산 (간단 계산)
    const insuranceAmount = this.calculateInsurance(grossSalary)

    const finalDeductions = totalDeductions + taxAmount + insuranceAmount

    return {
      ...result,
      bonus_amount: result.bonus_amount + totalAllowances,
      deduction_amount: finalDeductions,
      total_calculated: grossSalary - finalDeductions,
      calculation_details: {
        ...result.calculation_details,
        special_allowances: specialAllowances,
        deductions: deductions,
        tax: taxAmount,
        insurance: insuranceAmount,
        total_allowances: totalAllowances,
        total_deductions: finalDeductions
      }
    }
  }

  /**
   * 간이 세금 계산
   */
  private static calculateTax(grossSalary: number): number {
    // 간이세액표 기준 (2024년 기준)
    if (grossSalary <= 1060000) return 0
    if (grossSalary <= 2060000) return Math.floor((grossSalary - 1060000) * 0.06)
    if (grossSalary <= 3060000) return Math.floor(60000 + (grossSalary - 2060000) * 0.15)
    if (grossSalary <= 5060000) return Math.floor(210000 + (grossSalary - 3060000) * 0.24)
    return Math.floor(690000 + (grossSalary - 5060000) * 0.35)
  }

  /**
   * 4대 보험료 계산
   */
  private static calculateInsurance(grossSalary: number): number {
    // 국민연금 4.5%, 건강보험 3.545%, 고용보험 0.9%, 장기요양 0.4%
    const pensionRate = 0.045
    const healthRate = 0.03545
    const unemploymentRate = 0.009
    const longTermCareRate = 0.004

    const totalRate = pensionRate + healthRate + unemploymentRate + longTermCareRate
    return Math.floor(grossSalary * totalRate)
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * 급여 계산 검증
   */
  static validateCalculation(result: CalculationResult): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (result.final_salary < 0) {
      errors.push('최종 급여가 음수입니다.')
    }

    if (result.final_salary < result.minimum_guaranteed) {
      errors.push('최종 급여가 최소 보장금액보다 적습니다.')
    }

    if (result.deduction_amount > result.base_salary + result.commission_salary + result.bonus_amount) {
      errors.push('공제 금액이 총 급여보다 큽니다.')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 급여 내역서 생성
   */
  static generatePayslip(
    instructorName: string,
    month: string,
    result: CalculationResult,
    policy: SalaryPolicy
  ): string {
    return `
=== 급여 내역서 ===
강사명: ${instructorName}
대상월: ${month}
급여정책: ${policy.name} (${policy.policy_type})

[급여 구성]
기본급: ${result.base_salary.toLocaleString()}원
성과급: ${result.commission_salary.toLocaleString()}원
수당: ${result.bonus_amount.toLocaleString()}원
소계: ${(result.base_salary + result.commission_salary + result.bonus_amount).toLocaleString()}원

[공제 내역]
총 공제: ${result.deduction_amount.toLocaleString()}원

[최종 급여]
실지급액: ${result.final_salary.toLocaleString()}원
최소보장: ${result.minimum_guaranteed.toLocaleString()}원
    `.trim()
  }
}