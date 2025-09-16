import { NextRequest } from 'next/server'
import { withApiHandler, createSuccessResponse, createErrorResponse, validateRequestBody, logApiStart, logApiSuccess, logApiError } from '@/lib/api/utils'
import { SalaryCalculationService, createCalculationContext, validateCalculationResult } from '@/services/salary-calculation-service'
import { SalaryMetricsService } from '@/services/salary-metrics-service'
import { SalaryPolicyService } from '@/services/salary-policy-service'
import type { 
  SalaryCalculationRequest, 
  SalaryCalculationResult
} from '@/types/salary.types'

const API_NAME = 'salary-calculate'

/**
 * POST /api/salary/calculate
 * 급여 계산 API - Service Layer 적용
 * @version v2.0 - 업계 표준 아키텍처
 */
export async function POST(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, supabase, userProfile }) => {
      logApiStart(API_NAME, { userId: userProfile?.id })

      try {
        // 1. 요청 데이터 검증
        const body = await request.json()
        const validatedBody = validateRequestBody<SalaryCalculationRequest>(
          body,
          (data: unknown) => {
            const req = data as SalaryCalculationRequest
            if (!req.instructor_id || !req.month) {
              throw new Error('instructor_id와 month는 필수입니다.')
            }
            return req
          }
        )

        if (validatedBody instanceof Response) {
          return validatedBody
        }

        const { instructor_id, month, policy_id, include_adjustments = true, preview_mode = false } = validatedBody

        // userProfile과 tenant_id null 체크
        if (!userProfile || !userProfile.tenant_id) {
          return createErrorResponse('인증 정보 또는 테넌트 정보가 없습니다.', 401)
        }

        // 2. 강사 존재 여부 확인
        const { data: instructor, error: instructorError } = await supabase
          .from('tenant_memberships')
          .select('id, staff_info')
          .eq('id', instructor_id)
          .eq('tenant_id', userProfile.tenant_id)
          .single()

        if (instructorError || !instructor) {
          logApiError(API_NAME, `강사 조회 실패: ${instructorError?.message}`)
          return createErrorResponse('강사를 찾을 수 없습니다.', 404)
        }

        // 3. 급여 정책 조회 (Service Layer 사용)
        let salaryPolicy
        if (policy_id) {
          salaryPolicy = await SalaryPolicyService.getPolicyById(supabase, userProfile.tenant_id, policy_id)
        } else {
          const staffInfo = instructor.staff_info as any
          if (!staffInfo?.salary_info?.policy_id) {
            return createErrorResponse('강사에게 설정된 급여 정책이 없습니다.', 400)
          }
          salaryPolicy = await SalaryPolicyService.getPolicyById(supabase, userProfile.tenant_id, staffInfo.salary_info.policy_id)
        }

        // 4. 월별 메트릭 수집 (Service Layer 사용)
        const metricsResult = await SalaryMetricsService.collectMonthlyMetrics(
          supabase, 
          instructor_id, 
          month, 
          userProfile.tenant_id,
          {
            includeAttendance: true,
            includePerformanceMetrics: true,
            includeClassDetails: !preview_mode, // 미리보기 모드에서는 간소화
            fallbackToBasicMetrics: true
          }
        )

        // 5. 메트릭 검증
        const metricsValidation = SalaryMetricsService.validateMetricsResult(metricsResult)
        if (!metricsValidation.isValid) {
          logApiError(API_NAME, `메트릭 검증 실패: ${metricsValidation.errors.join(', ')}`)
          return createErrorResponse(`메트릭 데이터가 올바르지 않습니다: ${metricsValidation.errors.join(', ')}`, 400)
        }

        // 6. 급여 계산 (Service Layer 사용)
        const calculationContext = createCalculationContext(
          metricsResult.metrics,
          salaryPolicy,
          include_adjustments,
          preview_mode
        )

        const calculationResult = await SalaryCalculationService.calculateSalary(calculationContext, {
          enableTaxCalculation: true,
          enableInsuranceCalculation: true,
          enablePerformanceBonus: include_adjustments
        })

        // 7. 계산 결과 검증
        const resultValidation = validateCalculationResult(calculationResult)
        if (!resultValidation.isValid) {
          logApiError(API_NAME, `계산 결과 검증 실패: ${resultValidation.errors.join(', ')}`)
          return createErrorResponse(`급여 계산 결과가 올바르지 않습니다: ${resultValidation.errors.join(', ')}`, 500)
        }

        // 8. 결과 저장 (미리보기 모드가 아닌 경우)
        if (!preview_mode) {
          const { error: saveError } = await supabase
            .from('salary_calculations')
            .upsert({
              membership_id: instructor_id,
              calculation_month: month,
              calculation_details: calculationResult as any,
              status: 'calculated',
              calculated_at: new Date().toISOString(),
              calculated_by: userProfile.id,
              tenant_id: userProfile.tenant_id,
              // 메트릭 요약 정보를 calculation_details에 포함
              total_revenue: calculationResult.net_salary || 0,
              total_students: metricsResult.metrics.total_students || 0,
              total_hours: metricsResult.metrics.total_hours || 0,
              base_salary: calculationResult.base_salary || 0,
              commission_salary: 0,
              bonus_amount: 0,
              deduction_amount: 0,
              total_calculated: calculationResult.gross_salary || 0,
              final_salary: calculationResult.net_salary || 0
            })

          if (saveError) {
            console.warn('급여 계산 결과 저장 실패:', saveError)
            // 저장 실패는 경고만 하고 계속 진행
          }
        }

        logApiSuccess(API_NAME, { 
          instructor_id, 
          month, 
          net_salary: calculationResult.net_salary,
          data_quality: metricsResult.collectionDetails.dataQuality,
          preview_mode
        })

        return createSuccessResponse({
          calculation: calculationResult,
          metrics_summary: {
            data_quality: metricsResult.collectionDetails.dataQuality,
            warnings: metricsResult.collectionDetails.warnings,
            collection_timestamp: metricsResult.collectionDetails.collectionTimestamp
          },
          preview_mode
        })

      } catch (error) {
        logApiError(API_NAME, error)
        
        // Service Layer 에러는 더 구체적인 메시지 제공
        if (error instanceof Error && error.name?.includes('Salary')) {
          return createErrorResponse(error.message, 400)
        }

        return createErrorResponse(
          error instanceof Error ? error.message : '급여 계산 중 오류가 발생했습니다.',
          500
        )
      }
    },
    { requireAuth: true, requireTenantAdmin: true }
  )
}

// ============================================================================
// Legacy Code Removed - Now Using Service Layer Architecture
// ============================================================================
//
// 기존의 모든 계산 로직이 Service Layer로 이관되었습니다:
// - collectMonthlyMetrics() → SalaryMetricsService.collectMonthlyMetrics()
// - calculateInstructorSalary() → SalaryCalculationService.calculateSalary()
// - calculateTieredCommission() → SalaryCalculationService 내부 구현
// - calculateSpecialAllowances() → SalaryCalculationService 내부 구현
// - calculateTax() → SalaryCalculationService 내부 구현
// - calculateInsurance() → SalaryCalculationService 내부 구현
// - calculateOtherDeductions() → SalaryCalculationService 내부 구현
//
// 새로운 아키텍처의 이점:
// 1. 관심사 분리: HTTP 처리와 비즈니스 로직 분리
// 2. 재사용성: 다른 API에서도 Service Layer 재사용 가능
// 3. 테스트 용이성: Service Layer 독립적 테스트 가능
// 4. 유지보수성: 비즈니스 로직 변경 시 Service Layer만 수정
// 5. 확장성: 새로운 급여 정책 추가 시 Strategy Pattern 적용 용이
//
// Service Layer 파일 위치:
// - src/services/salary-calculation-service.ts
// - src/services/salary-metrics-service.ts
// - src/services/salary-policy-service.ts
//
// v2.0 - Service Layer Pattern 완료
// ============================================================================