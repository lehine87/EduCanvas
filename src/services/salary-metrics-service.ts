/**
 * @file salary-metrics-service.ts
 * @description 급여 계산을 위한 메트릭 수집 서비스 레이어
 * @version v2.0 - Service Layer Pattern with Performance Optimization
 */

import type { Database } from '@/types/database.types'
import type { MonthlySalaryMetrics } from '@/types/salary.types'

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface MetricsCollectionOptions {
  includeAttendance: boolean
  includePerformanceMetrics: boolean
  includeClassDetails: boolean
  fallbackToBasicMetrics: boolean
}

export interface ClassMetricsData {
  classId: string
  className: string
  tuitionFee: number
  studentCount: number
  status: string
  startDate: string
  endDate?: string
}

export interface AttendanceMetricsData {
  date: string
  checkIn?: string
  checkOut?: string
  status: string
  regularHours: number
  overtimeHours: number
}

export interface PerformanceMetricsData {
  completedClasses: number
  cancelledClasses: number
  studentRetentionRate: number
  averageClassRating: number
  bonusEligible: boolean
}

export interface MetricsCollectionResult {
  metrics: MonthlySalaryMetrics
  collectionDetails: {
    classMetrics: ClassMetricsData[]
    attendanceMetrics: AttendanceMetricsData[]
    performanceMetrics: PerformanceMetricsData
    collectionTimestamp: string
    dataQuality: 'high' | 'medium' | 'low'
    warnings: string[]
  }
}

// ============================================================================
// Salary Metrics Service Class
// ============================================================================

export class SalaryMetricsService {
  private static readonly DEFAULT_OPTIONS: MetricsCollectionOptions = {
    includeAttendance: true,
    includePerformanceMetrics: true,
    includeClassDetails: true,
    fallbackToBasicMetrics: true
  }

  /**
   * 메인 메트릭 수집 메서드 - 최적화된 단일 쿼리 방식
   */
  static async collectMonthlyMetrics(
    supabase: any,
    instructorId: string,
    month: string,
    tenantId: string,
    options: Partial<MetricsCollectionOptions> = {}
  ): Promise<MetricsCollectionResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options }
    
    try {
      // 1. PostgreSQL 저장 프로시저 사용 (최적화된 방식)
      const result = await this.collectMetricsOptimized(supabase, instructorId, month, tenantId, opts)
      
      if (result) {
        return result
      }

      // 2. 폴백: 기존 방식으로 수집
      if (opts.fallbackToBasicMetrics) {
        return await this.collectMetricsBasic(supabase, instructorId, month, tenantId, opts)
      }

      throw new SalaryMetricsError(
        'COLLECTION_FAILED',
        '메트릭 수집에 실패했습니다.',
        { instructorId, month, tenantId }
      )

    } catch (error) {
      if (error instanceof SalaryMetricsError) throw error
      
      throw new SalaryMetricsError(
        'UNEXPECTED_ERROR',
        `메트릭 수집 중 예상치 못한 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        { instructorId, month, tenantId, options: opts }
      )
    }
  }

  // ============================================================================
  // Optimized Collection Methods
  // ============================================================================

  /**
   * 최적화된 메트릭 수집 (PostgreSQL 저장 프로시저 사용)
   */
  private static async collectMetricsOptimized(
    supabase: any,
    instructorId: string,
    month: string,
    tenantId: string,
    options: MetricsCollectionOptions
  ): Promise<MetricsCollectionResult | null> {
    try {
      // PostgreSQL 저장 프로시저 호출
      const { data, error } = await supabase
        .rpc('get_instructor_monthly_metrics', {
          p_instructor_id: instructorId,
          p_month: month,
          p_tenant_id: tenantId,
          p_include_attendance: options.includeAttendance,
          p_include_performance: options.includePerformanceMetrics,
          p_include_class_details: options.includeClassDetails
        })

      if (error) {
        console.warn('저장 프로시저 호출 실패, 기본 방식으로 폴백:', error.message)
        return null
      }

      if (!data) {
        return null
      }

      // 저장 프로시저 결과를 표준 형식으로 변환
      return this.transformOptimizedResult(data, instructorId, month)

    } catch (error) {
      console.warn('최적화된 메트릭 수집 실패, 기본 방식으로 폴백:', error)
      return null
    }
  }

  /**
   * 저장 프로시저 결과 변환
   */
  private static transformOptimizedResult(
    data: any,
    instructorId: string,
    month: string
  ): MetricsCollectionResult {
    const result = Array.isArray(data) ? data[0] : data

    return {
      metrics: {
        instructor_id: instructorId,
        month,
        total_revenue: result.total_revenue || 0,
        total_students: result.total_students || 0,
        total_hours: result.total_hours || 0,
        regular_hours: result.regular_hours || 0,
        overtime_hours: result.overtime_hours || 0,
        total_classes: result.total_classes || 0,
        completed_classes: result.completed_classes || 0,
        cancelled_classes: result.cancelled_classes || 0,
        bonus_eligible: result.bonus_eligible || false,
        special_allowances: result.special_allowances || [],
        deductions: result.deductions || []
      },
      collectionDetails: {
        classMetrics: result.class_details || [],
        attendanceMetrics: result.attendance_details || [],
        performanceMetrics: {
          completedClasses: result.completed_classes || 0,
          cancelledClasses: result.cancelled_classes || 0,
          studentRetentionRate: result.student_retention_rate || 0,
          averageClassRating: result.average_class_rating || 0,
          bonusEligible: result.bonus_eligible || false
        },
        collectionTimestamp: new Date().toISOString(),
        dataQuality: 'high',
        warnings: []
      }
    }
  }

  // ============================================================================
  // Basic Collection Methods (Fallback)
  // ============================================================================

  /**
   * 기본 메트릭 수집 방식 (폴백용)
   */
  private static async collectMetricsBasic(
    supabase: any,
    instructorId: string,
    month: string,
    tenantId: string,
    options: MetricsCollectionOptions
  ): Promise<MetricsCollectionResult> {
    const [year, monthNum] = month.split('-')
    const startDate = `${year}-${monthNum.padStart(2, '0')}-01`
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0]

    const warnings: string[] = []
    
    try {
      // 병렬로 데이터 수집
      const [
        classMetricsResult,
        attendanceMetricsResult,
        performanceMetricsResult
      ] = await Promise.all([
        this.collectClassMetrics(supabase, instructorId, tenantId, startDate, endDate, options),
        options.includeAttendance 
          ? this.collectAttendanceMetrics(supabase, instructorId, tenantId, startDate, endDate)
          : Promise.resolve({ metrics: [], details: [] }),
        options.includePerformanceMetrics
          ? this.collectPerformanceMetrics(supabase, instructorId, tenantId, startDate, endDate)
          : Promise.resolve(this.getDefaultPerformanceMetrics())
      ])

      // 메트릭 계산
      const totalRevenue = classMetricsResult.details.reduce(
        (sum, cls) => sum + (cls.tuitionFee * cls.studentCount), 0
      )

      const totalStudents = classMetricsResult.details.reduce(
        (sum, cls) => sum + cls.studentCount, 0
      )

      const { totalHours, regularHours, overtimeHours } = this.calculateWorkingHours(
        attendanceMetricsResult.details
      )

      // 데이터 품질 평가
      const dataQuality = this.evaluateDataQuality(
        classMetricsResult.details,
        attendanceMetricsResult.details,
        performanceMetricsResult,
        warnings
      )

      const metrics: MonthlySalaryMetrics = {
        instructor_id: instructorId,
        month,
        total_revenue: totalRevenue,
        total_students: totalStudents,
        total_hours: totalHours,
        regular_hours: regularHours,
        overtime_hours: overtimeHours,
        total_classes: classMetricsResult.details.length,
        completed_classes: performanceMetricsResult.completedClasses,
        cancelled_classes: performanceMetricsResult.cancelledClasses,
        bonus_eligible: performanceMetricsResult.bonusEligible,
        special_allowances: [],
        deductions: []
      }

      return {
        metrics,
        collectionDetails: {
          classMetrics: classMetricsResult.details,
          attendanceMetrics: attendanceMetricsResult.details,
          performanceMetrics: performanceMetricsResult,
          collectionTimestamp: new Date().toISOString(),
          dataQuality,
          warnings
        }
      }

    } catch (error) {
      throw new SalaryMetricsError(
        'BASIC_COLLECTION_FAILED',
        `기본 메트릭 수집 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        { instructorId, month, tenantId, options }
      )
    }
  }

  /**
   * 수업 메트릭 수집
   */
  private static async collectClassMetrics(
    supabase: any,
    instructorId: string,
    tenantId: string,
    startDate: string,
    endDate: string,
    options: MetricsCollectionOptions
  ): Promise<{ metrics: any[]; details: ClassMetricsData[] }> {
    try {
      const { data: classes, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          tuition_fee,
          status,
          start_date,
          end_date,
          students!inner(count)
        `)
        .eq('instructor_id', instructorId)
        .eq('tenant_id', tenantId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (error) {
        throw new SalaryMetricsError(
          'CLASS_METRICS_FAILED',
          `수업 메트릭 수집 실패: ${error.message}`,
          { instructorId, tenantId, startDate, endDate }
        )
      }

      const details: ClassMetricsData[] = (classes || []).map((cls: any) => ({
        classId: cls.id,
        className: cls.name,
        tuitionFee: cls.tuition_fee || 0,
        studentCount: cls.students?.length || 0,
        status: cls.status || 'active',
        startDate: cls.start_date,
        endDate: cls.end_date
      }))

      return { metrics: classes || [], details }

    } catch (error) {
      if (error instanceof SalaryMetricsError) throw error
      
      throw new SalaryMetricsError(
        'CLASS_METRICS_ERROR',
        `수업 메트릭 수집 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        { instructorId, tenantId }
      )
    }
  }

  /**
   * 출석 메트릭 수집
   */
  private static async collectAttendanceMetrics(
    supabase: any,
    instructorId: string,
    tenantId: string,
    startDate: string,
    endDate: string
  ): Promise<{ metrics: any[]; details: AttendanceMetricsData[] }> {
    try {
      const { data: attendance, error } = await supabase
        .from('attendance_records')
        .select('date, check_in, check_out, status')
        .eq('membership_id', instructorId)
        .eq('tenant_id', tenantId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date')

      if (error) {
        console.warn('출석 메트릭 수집 실패:', error.message)
        return { metrics: [], details: [] }
      }

      const details: AttendanceMetricsData[] = (attendance || []).map((record: any) => {
        const { regularHours, overtimeHours } = this.calculateDailyHours(
          record.check_in,
          record.check_out,
          record.status
        )

        return {
          date: record.date,
          checkIn: record.check_in,
          checkOut: record.check_out,
          status: record.status,
          regularHours,
          overtimeHours
        }
      })

      return { metrics: attendance || [], details }

    } catch (error) {
      console.warn('출석 메트릭 수집 중 오류:', error)
      return { metrics: [], details: [] }
    }
  }

  /**
   * 성과 메트릭 수집
   */
  private static async collectPerformanceMetrics(
    supabase: any,
    instructorId: string,
    tenantId: string,
    startDate: string,
    endDate: string
  ): Promise<PerformanceMetricsData> {
    try {
      // 수업 완료/취소 통계
      const { data: classStats, error: classError } = await supabase
        .from('classes')
        .select('status')
        .eq('instructor_id', instructorId)
        .eq('tenant_id', tenantId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (classError) {
        console.warn('수업 통계 수집 실패:', classError.message)
      }

      const completedClasses = classStats?.filter((c: any) => c.status === 'completed').length || 0
      const cancelledClasses = classStats?.filter((c: any) => c.status === 'cancelled').length || 0
      const totalClasses = classStats?.length || 0

      // 학생 유지율 계산 (간단한 방식)
      const studentRetentionRate = totalClasses > 0 ? (completedClasses / totalClasses) * 100 : 0

      // 보너스 자격 계산 (완료율 80% 이상)
      const completionRate = totalClasses > 0 ? (completedClasses / totalClasses) * 100 : 0
      const bonusEligible = completionRate >= 80 && completedClasses >= 10

      return {
        completedClasses,
        cancelledClasses,
        studentRetentionRate,
        averageClassRating: 0, // 평가 시스템이 있다면 추후 구현
        bonusEligible
      }

    } catch (error) {
      console.warn('성과 메트릭 수집 중 오류:', error)
      return this.getDefaultPerformanceMetrics()
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * 일일 근무시간 계산
   */
  private static calculateDailyHours(
    checkIn?: string,
    checkOut?: string,
    status?: string
  ): { regularHours: number; overtimeHours: number } {
    if (!checkIn || !checkOut || status !== '정상') {
      return { regularHours: 0, overtimeHours: 0 }
    }

    try {
      const checkInTime = new Date(`1970-01-01T${checkIn}`)
      const checkOutTime = new Date(`1970-01-01T${checkOut}`)
      const totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)

      if (totalHours <= 0) {
        return { regularHours: 0, overtimeHours: 0 }
      }

      const regularHours = Math.min(totalHours, 8)
      const overtimeHours = Math.max(0, totalHours - 8)

      return { regularHours, overtimeHours }

    } catch (error) {
      return { regularHours: 0, overtimeHours: 0 }
    }
  }

  /**
   * 총 근무시간 계산
   */
  private static calculateWorkingHours(
    attendanceDetails: AttendanceMetricsData[]
  ): { totalHours: number; regularHours: number; overtimeHours: number } {
    return attendanceDetails.reduce(
      (acc, record) => ({
        totalHours: acc.totalHours + record.regularHours + record.overtimeHours,
        regularHours: acc.regularHours + record.regularHours,
        overtimeHours: acc.overtimeHours + record.overtimeHours
      }),
      { totalHours: 0, regularHours: 0, overtimeHours: 0 }
    )
  }

  /**
   * 데이터 품질 평가
   */
  private static evaluateDataQuality(
    classMetrics: ClassMetricsData[],
    attendanceMetrics: AttendanceMetricsData[],
    performanceMetrics: PerformanceMetricsData,
    warnings: string[]
  ): 'high' | 'medium' | 'low' {
    let qualityScore = 100

    // 수업 데이터 품질 평가
    if (classMetrics.length === 0) {
      qualityScore -= 30
      warnings.push('수업 데이터가 없습니다.')
    }

    // 출석 데이터 품질 평가
    if (attendanceMetrics.length === 0) {
      qualityScore -= 20
      warnings.push('출석 데이터가 없습니다.')
    } else {
      const validAttendanceRate = attendanceMetrics.filter(
        record => record.checkIn && record.checkOut && record.status === '정상'
      ).length / attendanceMetrics.length

      if (validAttendanceRate < 0.8) {
        qualityScore -= 15
        warnings.push('출석 데이터의 완성도가 낮습니다.')
      }
    }

    // 성과 데이터 품질 평가
    if (performanceMetrics.completedClasses === 0 && performanceMetrics.cancelledClasses === 0) {
      qualityScore -= 10
      warnings.push('성과 데이터가 부족합니다.')
    }

    if (qualityScore >= 90) return 'high'
    if (qualityScore >= 70) return 'medium'
    return 'low'
  }

  /**
   * 기본 성과 메트릭 생성
   */
  private static getDefaultPerformanceMetrics(): PerformanceMetricsData {
    return {
      completedClasses: 0,
      cancelledClasses: 0,
      studentRetentionRate: 0,
      averageClassRating: 0,
      bonusEligible: false
    }
  }

  /**
   * 메트릭 수집 결과 검증
   */
  static validateMetricsResult(result: MetricsCollectionResult): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!result.metrics.instructor_id) {
      errors.push('강사 ID가 누락되었습니다.')
    }

    if (!result.metrics.month || !/^\d{4}-\d{1,2}$/.test(result.metrics.month)) {
      errors.push('월 정보가 올바르지 않습니다.')
    }

    if (result.metrics.total_revenue < 0) {
      errors.push('총 매출이 음수입니다.')
    }

    if (result.metrics.total_students < 0) {
      errors.push('총 학생수가 음수입니다.')
    }

    if (result.metrics.total_hours < 0) {
      errors.push('총 근무시간이 음수입니다.')
    }

    if (result.metrics.regular_hours > result.metrics.total_hours) {
      errors.push('정규 근무시간이 총 근무시간보다 큽니다.')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// ============================================================================
// Error Classes
// ============================================================================

export class SalaryMetricsError extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: any
  ) {
    super(message)
    this.name = 'SalaryMetricsError'
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 월 범위 유틸리티
 */
export function getMonthDateRange(month: string): { startDate: string; endDate: string } {
  const [year, monthNum] = month.split('-')
  const startDate = `${year}-${monthNum.padStart(2, '0')}-01`
  
  const nextMonth = new Date(parseInt(year), parseInt(monthNum), 0)
  const endDate = nextMonth.toISOString().split('T')[0]

  return { startDate, endDate }
}

/**
 * 메트릭 요약 생성
 */
export function generateMetricsSummary(result: MetricsCollectionResult): string {
  const { metrics, collectionDetails } = result

  return `
=== 급여 메트릭 요약 ===
강사 ID: ${metrics.instructor_id}
대상월: ${metrics.month}
데이터 품질: ${collectionDetails.dataQuality}

[재정 메트릭]
총 매출: ${metrics.total_revenue.toLocaleString()}원
학생수: ${metrics.total_students}명
수업수: ${metrics.total_classes}개

[근무 메트릭]
총 근무시간: ${metrics.total_hours}시간
정규 근무시간: ${metrics.regular_hours}시간
초과 근무시간: ${metrics.overtime_hours}시간

[성과 메트릭]
완료 수업: ${metrics.completed_classes}개
취소 수업: ${metrics.cancelled_classes}개
보너스 자격: ${metrics.bonus_eligible ? '적격' : '부적격'}

[수집 정보]
수집 시각: ${collectionDetails.collectionTimestamp}
경고사항: ${collectionDetails.warnings.length > 0 ? collectionDetails.warnings.join(', ') : '없음'}
  `.trim()
}