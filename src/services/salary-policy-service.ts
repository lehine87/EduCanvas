/**
 * @file salary-policy-service.ts
 * @description 급여 정책 관리 서비스 레이어
 * @version v2.0 - Service Layer Pattern
 */

import type { Database } from '@/types/database.types'
import type { SalaryPolicy, SalaryTier } from '@/types/salary.types'

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface PolicySearchOptions {
  isActive?: boolean
  policyType?: string
  limit?: number
  offset?: number
}

export interface PolicyValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

export interface PolicyCreationData {
  name: string
  type: SalaryPolicy['type']
  base_amount?: number
  hourly_rate?: number
  commission_rate?: number
  commission_basis?: 'revenue' | 'students' | 'hours'
  minimum_guaranteed?: number
  maximum_amount?: number
  student_rate?: number
  min_students?: number
  max_students?: number
  performance_threshold?: number
  tiers?: SalaryTier[]
  is_active?: boolean
  description?: string
}

export interface PolicyUpdateData extends Partial<PolicyCreationData> {
  updated_at?: string
}

// ============================================================================
// Salary Policy Service Class
// ============================================================================

export class SalaryPolicyService {
  
  /**
   * 급여 정책 목록 조회
   */
  static async getPolicies(
    supabase: any,
    tenantId: string,
    options: PolicySearchOptions = {}
  ): Promise<{ policies: SalaryPolicy[]; total: number }> {
    try {
      let query = supabase
        .from('salary_policies')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      // 필터 적용
      if (options.isActive !== undefined) {
        query = query.eq('is_active', options.isActive)
      }

      if (options.policyType) {
        query = query.eq('type', options.policyType)
      }

      // 페이지네이션
      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
      }

      const { data: policies, error, count } = await query

      if (error) {
        throw new SalaryPolicyError(
          'FETCH_POLICIES_FAILED',
          `정책 목록 조회 실패: ${error.message}`,
          { tenantId, options, error }
        )
      }

      return {
        policies: policies || [],
        total: count || 0
      }

    } catch (error) {
      if (error instanceof SalaryPolicyError) throw error
      
      throw new SalaryPolicyError(
        'UNEXPECTED_ERROR',
        `급여 정책 조회 중 예상치 못한 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        { tenantId, options }
      )
    }
  }

  /**
   * 급여 정책 상세 조회
   */
  static async getPolicyById(
    supabase: any,
    tenantId: string,
    policyId: string
  ): Promise<SalaryPolicy> {
    try {
      const { data: policy, error } = await supabase
        .from('salary_policies')
        .select('*')
        .eq('id', policyId)
        .eq('tenant_id', tenantId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new SalaryPolicyError(
            'POLICY_NOT_FOUND',
            '급여 정책을 찾을 수 없습니다.',
            { policyId, tenantId }
          )
        }

        throw new SalaryPolicyError(
          'FETCH_POLICY_FAILED',
          `정책 조회 실패: ${error.message}`,
          { policyId, tenantId, error }
        )
      }

      return policy

    } catch (error) {
      if (error instanceof SalaryPolicyError) throw error
      
      throw new SalaryPolicyError(
        'UNEXPECTED_ERROR',
        `급여 정책 조회 중 예상치 못한 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        { policyId, tenantId }
      )
    }
  }

  /**
   * 급여 정책 생성
   */
  static async createPolicy(
    supabase: any,
    tenantId: string,
    policyData: PolicyCreationData
  ): Promise<SalaryPolicy> {
    try {
      // 1. 데이터 검증
      const validation = this.validatePolicyData(policyData)
      if (!validation.isValid) {
        throw new SalaryPolicyError(
          'VALIDATION_FAILED',
          `정책 데이터 검증 실패: ${validation.errors.join(', ')}`,
          { policyData, validation }
        )
      }

      // 2. 중복 이름 확인
      await this.checkDuplicateName(supabase, tenantId, policyData.name)

      // 3. 정책 생성 데이터 준비
      const createData = {
        ...policyData,
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // 4. 데이터베이스에 저장
      const { data: newPolicy, error } = await supabase
        .from('salary_policies')
        .insert(createData)
        .select()
        .single()

      if (error) {
        throw new SalaryPolicyError(
          'CREATE_POLICY_FAILED',
          `정책 생성 실패: ${error.message}`,
          { policyData, error }
        )
      }

      return newPolicy

    } catch (error) {
      if (error instanceof SalaryPolicyError) throw error
      
      throw new SalaryPolicyError(
        'UNEXPECTED_ERROR',
        `급여 정책 생성 중 예상치 못한 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        { policyData, tenantId }
      )
    }
  }

  /**
   * 급여 정책 수정
   */
  static async updatePolicy(
    supabase: any,
    tenantId: string,
    policyId: string,
    updateData: PolicyUpdateData
  ): Promise<SalaryPolicy> {
    try {
      // 1. 기존 정책 확인
      const existingPolicy = await this.getPolicyById(supabase, tenantId, policyId)

      // 2. 수정 데이터 검증
      const mergedData = { ...existingPolicy, ...updateData }
      const validation = this.validatePolicyData(mergedData)
      if (!validation.isValid) {
        throw new SalaryPolicyError(
          'VALIDATION_FAILED',
          `정책 수정 데이터 검증 실패: ${validation.errors.join(', ')}`,
          { policyId, updateData, validation }
        )
      }

      // 3. 이름 변경 시 중복 확인
      if (updateData.name && updateData.name !== existingPolicy.name) {
        await this.checkDuplicateName(supabase, tenantId, updateData.name, policyId)
      }

      // 4. 수정 데이터 준비
      const finalUpdateData = {
        ...updateData,
        updated_at: new Date().toISOString()
      }

      // 5. 데이터베이스 수정
      const { data: updatedPolicy, error } = await supabase
        .from('salary_policies')
        .update(finalUpdateData)
        .eq('id', policyId)
        .eq('tenant_id', tenantId)
        .select()
        .single()

      if (error) {
        throw new SalaryPolicyError(
          'UPDATE_POLICY_FAILED',
          `정책 수정 실패: ${error.message}`,
          { policyId, updateData, error }
        )
      }

      return updatedPolicy

    } catch (error) {
      if (error instanceof SalaryPolicyError) throw error
      
      throw new SalaryPolicyError(
        'UNEXPECTED_ERROR',
        `급여 정책 수정 중 예상치 못한 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        { policyId, updateData, tenantId }
      )
    }
  }

  /**
   * 급여 정책 삭제 (소프트 삭제)
   */
  static async deletePolicy(
    supabase: any,
    tenantId: string,
    policyId: string
  ): Promise<void> {
    try {
      // 1. 정책 사용 여부 확인
      await this.checkPolicyUsage(supabase, tenantId, policyId)

      // 2. 소프트 삭제 (is_active = false)
      const { error } = await supabase
        .from('salary_policies')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', policyId)
        .eq('tenant_id', tenantId)

      if (error) {
        throw new SalaryPolicyError(
          'DELETE_POLICY_FAILED',
          `정책 삭제 실패: ${error.message}`,
          { policyId, error }
        )
      }

    } catch (error) {
      if (error instanceof SalaryPolicyError) throw error
      
      throw new SalaryPolicyError(
        'UNEXPECTED_ERROR',
        `급여 정책 삭제 중 예상치 못한 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        { policyId, tenantId }
      )
    }
  }

  // ============================================================================
  // Validation Methods
  // ============================================================================

  /**
   * 급여 정책 데이터 검증
   */
  static validatePolicyData(policyData: PolicyCreationData | (PolicyCreationData & {id?: string})): PolicyValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 기본 필드 검증
    if (!policyData.name?.trim()) {
      errors.push('정책명은 필수입니다.')
    } else if (policyData.name.length > 100) {
      errors.push('정책명은 100자를 초과할 수 없습니다.')
    }

    if (!policyData.type) {
      errors.push('정책 타입은 필수입니다.')
    }

    // 정책 타입별 세부 검증
    if (policyData.type) {
      switch (policyData.type) {
        case 'fixed_monthly':
          this.validateFixedMonthlyPolicy(policyData, errors, warnings)
          break
        case 'fixed_hourly':
          this.validateFixedHourlyPolicy(policyData, errors, warnings)
          break
        case 'commission':
          this.validateCommissionPolicy(policyData, errors, warnings)
          break
        case 'tiered_commission':
          this.validateTieredCommissionPolicy(policyData, errors, warnings)
          break
        case 'student_based':
          this.validateStudentBasedPolicy(policyData, errors, warnings)
          break
        case 'hybrid':
          this.validateHybridPolicy(policyData, errors, warnings)
          break
        case 'guaranteed_minimum':
          this.validateGuaranteedMinimumPolicy(policyData, errors, warnings)
          break
        default:
          errors.push(`지원하지 않는 정책 타입: ${policyData.type}`)
      }
    }

    // 공통 검증
    this.validateCommonFields(policyData, errors, warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  /**
   * 고정 월급제 검증
   */
  private static validateFixedMonthlyPolicy(
    policyData: PolicyCreationData,
    errors: string[],
    warnings: string[]
  ): void {
    if (!policyData.base_amount || policyData.base_amount <= 0) {
      errors.push('고정 월급제는 기본급(base_amount)이 필요합니다.')
    } else if (policyData.base_amount < 1000000) {
      warnings.push('기본급이 최저임금보다 낮을 수 있습니다.')
    }
  }

  /**
   * 시급제 검증
   */
  private static validateFixedHourlyPolicy(
    policyData: PolicyCreationData,
    errors: string[],
    warnings: string[]
  ): void {
    if (!policyData.hourly_rate || policyData.hourly_rate <= 0) {
      errors.push('시급제는 시급(hourly_rate)이 필요합니다.')
    } else if (policyData.hourly_rate < 9620) { // 2024년 최저시급
      warnings.push('시급이 최저시급보다 낮습니다.')
    }
  }

  /**
   * 단순 비율제 검증
   */
  private static validateCommissionPolicy(
    policyData: PolicyCreationData,
    errors: string[],
    warnings: string[]
  ): void {
    if (!policyData.commission_rate || policyData.commission_rate <= 0 || policyData.commission_rate > 100) {
      errors.push('비율제는 0-100 사이의 수수료율이 필요합니다.')
    }

    if (!policyData.commission_basis) {
      errors.push('비율제는 수수료 기준(revenue/students/hours)이 필요합니다.')
    } else if (!['revenue', 'students', 'hours'].includes(policyData.commission_basis)) {
      errors.push('수수료 기준은 revenue, students, hours 중 하나여야 합니다.')
    }

    if (policyData.commission_rate && policyData.commission_rate > 50) {
      warnings.push('수수료율이 50%를 초과합니다. 검토가 필요할 수 있습니다.')
    }
  }

  /**
   * 누진 비율제 검증
   */
  private static validateTieredCommissionPolicy(
    policyData: PolicyCreationData,
    errors: string[],
    warnings: string[]
  ): void {
    if (!policyData.tiers || !Array.isArray(policyData.tiers) || policyData.tiers.length === 0) {
      errors.push('누진 비율제는 구간 설정(tiers)이 필요합니다.')
      return
    }

    // 구간 개별 검증
    const sortedTiers = [...policyData.tiers].sort((a, b) => a.min_amount - b.min_amount)
    
    for (let i = 0; i < sortedTiers.length; i++) {
      const tier = sortedTiers[i]
      
      if (tier.min_amount < 0) {
        errors.push(`구간 ${i + 1}: 최소 금액은 0 이상이어야 합니다.`)
      }
      
      if (tier.commission_rate <= 0 || tier.commission_rate > 100) {
        errors.push(`구간 ${i + 1}: 수수료율은 0-100 사이여야 합니다.`)
      }
      
      if (tier.max_amount && tier.max_amount <= tier.min_amount) {
        errors.push(`구간 ${i + 1}: 최대 금액은 최소 금액보다 커야 합니다.`)
      }
      
      // 구간 중복 검사
      if (i > 0) {
        const prevTier = sortedTiers[i - 1]
        if (tier.min_amount < (prevTier.max_amount || Infinity)) {
          errors.push(`구간 ${i + 1}: 이전 구간과 금액이 중복됩니다.`)
        }
      }
    }
  }

  /**
   * 학생수 기준제 검증
   */
  private static validateStudentBasedPolicy(
    policyData: PolicyCreationData,
    errors: string[],
    warnings: string[]
  ): void {
    if (!policyData.student_rate || policyData.student_rate <= 0) {
      errors.push('학생수 기준제는 학생당 단가(student_rate)가 필요합니다.')
    }

    if (policyData.min_students && policyData.max_students && 
        policyData.min_students > policyData.max_students) {
      errors.push('최소 학생수는 최대 학생수보다 작아야 합니다.')
    }

    if (policyData.min_students && policyData.min_students > 50) {
      warnings.push('최소 학생수가 매우 높습니다.')
    }
  }

  /**
   * 혼합형 검증
   */
  private static validateHybridPolicy(
    policyData: PolicyCreationData,
    errors: string[],
    warnings: string[]
  ): void {
    if (!policyData.base_amount || policyData.base_amount <= 0) {
      errors.push('혼합형은 기본급(base_amount)이 필요합니다.')
    }

    if (!policyData.commission_rate || policyData.commission_rate <= 0 || policyData.commission_rate > 100) {
      errors.push('혼합형은 0-100 사이의 수수료율이 필요합니다.')
    }

    if (!policyData.commission_basis) {
      errors.push('혼합형은 수수료 기준이 필요합니다.')
    }

    if (policyData.performance_threshold && policyData.performance_threshold < 0) {
      errors.push('성과 기준치는 0 이상이어야 합니다.')
    }
  }

  /**
   * 최저 보장제 검증
   */
  private static validateGuaranteedMinimumPolicy(
    policyData: PolicyCreationData,
    errors: string[],
    warnings: string[]
  ): void {
    if (!policyData.minimum_guaranteed || policyData.minimum_guaranteed <= 0) {
      errors.push('최저 보장제는 최소 보장액(minimum_guaranteed)이 필요합니다.')
    }

    if (!policyData.commission_rate || policyData.commission_rate <= 0 || policyData.commission_rate > 100) {
      errors.push('최저 보장제는 수수료율이 필요합니다.')
    }

    if (!policyData.commission_basis) {
      errors.push('최저 보장제는 수수료 기준이 필요합니다.')
    }
  }

  /**
   * 공통 필드 검증
   */
  private static validateCommonFields(
    policyData: PolicyCreationData,
    errors: string[],
    warnings: string[]
  ): void {
    // 최소 보장액과 최대 지급액 관계 검증
    if (policyData.minimum_guaranteed && policyData.maximum_amount && 
        policyData.minimum_guaranteed > policyData.maximum_amount) {
      errors.push('최소 보장액은 최대 지급액보다 작아야 합니다.')
    }

    // 설명 길이 검증
    if (policyData.description && policyData.description.length > 500) {
      errors.push('정책 설명은 500자를 초과할 수 없습니다.')
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * 중복 이름 확인
   */
  private static async checkDuplicateName(
    supabase: any,
    tenantId: string,
    name: string,
    excludeId?: string
  ): Promise<void> {
    let query = supabase
      .from('salary_policies')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('name', name)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) {
      throw new SalaryPolicyError(
        'DUPLICATE_CHECK_FAILED',
        `이름 중복 확인 실패: ${error.message}`,
        { name, tenantId, excludeId }
      )
    }

    if (data && data.length > 0) {
      throw new SalaryPolicyError(
        'DUPLICATE_NAME',
        '같은 이름의 급여 정책이 이미 존재합니다.',
        { name, tenantId }
      )
    }
  }

  /**
   * 정책 사용 여부 확인
   */
  private static async checkPolicyUsage(
    supabase: any,
    tenantId: string,
    policyId: string
  ): Promise<void> {
    // 1. 직원에게 할당된 정책인지 확인
    const { data: staffUsage, error: staffError } = await supabase
      .from('tenant_memberships')
      .select('id')
      .eq('tenant_id', tenantId)
      .contains('staff_info', { salary_info: { policy_id: policyId } })
      .limit(1)

    if (staffError) {
      throw new SalaryPolicyError(
        'USAGE_CHECK_FAILED',
        `정책 사용 여부 확인 실패: ${staffError.message}`,
        { policyId, tenantId }
      )
    }

    if (staffUsage && staffUsage.length > 0) {
      throw new SalaryPolicyError(
        'POLICY_IN_USE',
        '이 정책은 현재 직원에게 할당되어 있어 삭제할 수 없습니다.',
        { policyId, tenantId, usage: 'staff' }
      )
    }

    // 2. 급여 계산 기록이 있는지 확인
    const { data: calculationUsage, error: calcError } = await supabase
      .from('salary_calculations')
      .select('id')
      .contains('calculation_result', { applied_policy: { id: policyId } })
      .limit(1)

    if (calcError) {
      throw new SalaryPolicyError(
        'USAGE_CHECK_FAILED',
        `급여 계산 기록 확인 실패: ${calcError.message}`,
        { policyId, tenantId }
      )
    }

    if (calculationUsage && calculationUsage.length > 0) {
      throw new SalaryPolicyError(
        'POLICY_IN_USE',
        '이 정책으로 계산된 급여 기록이 있어 삭제할 수 없습니다.',
        { policyId, tenantId, usage: 'calculation' }
      )
    }
  }
}

// ============================================================================
// Error Classes
// ============================================================================

export class SalaryPolicyError extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: any
  ) {
    super(message)
    this.name = 'SalaryPolicyError'
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 정책 타입별 기본값 생성
 */
export function createDefaultPolicyByType(type: SalaryPolicy['type']): Partial<PolicyCreationData> {
  const base: Partial<PolicyCreationData> = {
    name: '',
    type,
    is_active: true
  }

  switch (type) {
    case 'fixed_monthly':
      return {
        ...base,
        name: '고정 월급제',
        base_amount: 2500000,
        minimum_guaranteed: 2500000
      }
    
    case 'fixed_hourly':
      return {
        ...base,
        name: '시급제',
        hourly_rate: 35000,
        minimum_guaranteed: 1800000
      }
    
    case 'commission':
      return {
        ...base,
        name: '수수료제',
        commission_rate: 15,
        commission_basis: 'revenue',
        minimum_guaranteed: 1500000
      }
    
    case 'tiered_commission':
      return {
        ...base,
        name: '누진 수수료제',
        commission_basis: 'revenue',
        minimum_guaranteed: 1500000,
        tiers: [
          { id: '1', min_amount: 0, max_amount: 5000000, commission_rate: 10 },
          { id: '2', min_amount: 5000000, max_amount: 10000000, commission_rate: 15 },
          { id: '3', min_amount: 10000000, max_amount: null, commission_rate: 20 }
        ]
      }
    
    case 'student_based':
      return {
        ...base,
        name: '학생수 기준제',
        student_rate: 100000,
        min_students: 1,
        max_students: 30,
        minimum_guaranteed: 1000000
      }
    
    case 'hybrid':
      return {
        ...base,
        name: '혼합형',
        base_amount: 1800000,
        commission_rate: 8,
        commission_basis: 'revenue',
        performance_threshold: 3000000,
        minimum_guaranteed: 1800000
      }
    
    case 'guaranteed_minimum':
      return {
        ...base,
        name: '최저 보장제',
        minimum_guaranteed: 2000000,
        commission_rate: 12,
        commission_basis: 'revenue'
      }
    
    default:
      return base
  }
}