import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withRouteValidation, handleCorsPreflightRequest } from '@/lib/route-validation'
import {
  createPaginatedResponse,
  createValidationErrorResponse,
  createServerErrorResponse,
  createSuccessResponse
} from '@/lib/api-response'
import { createClient } from '@/lib/supabase/server'
import type { AttendanceStatus } from '@/types/student-attendance.types'

/**
 * 학생 출석 관리 API
 * T-V2-014: 출석 관리 시스템 v2
 */

// 출석 체크 스키마
const AttendanceCheckSchema = z.object({
  student_id: z.string().uuid('올바른 학생 ID가 필요합니다'),
  class_id: z.string().uuid('올바른 클래스 ID가 필요합니다'),
  attendance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다'),
  status: z.enum(['present', 'absent', 'late', 'early_leave', 'excused'] as const),
  reason: z.string().optional(),
  check_in_time: z.string().optional(),
})

// 벌크 출석 업데이트 스키마
const BulkAttendanceSchema = z.object({
  class_id: z.string().uuid('올바른 클래스 ID가 필요합니다'),
  attendance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다'),
  updates: z.array(z.object({
    student_id: z.string().uuid(),
    status: z.enum(['present', 'absent', 'late', 'early_leave', 'excused'] as const),
    reason: z.string().optional(),
  })),
})

// 출석 조회 스키마
const AttendanceQuerySchema = z.object({
  class_id: z.string().optional(),
  student_id: z.string().optional(),
  attendance_date: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['present', 'absent', 'late', 'early_leave', 'excused'] as const).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

export async function OPTIONS() {
  return handleCorsPreflightRequest()
}

// GET: 출석 기록 조회
export const GET = withRouteValidation({
  querySchema: AttendanceQuerySchema,
  handler: async (request: NextRequest) => {
    try {
      const supabase = createClient()
      const { searchParams } = new URL(request.url)
      const params = AttendanceQuerySchema.parse(Object.fromEntries(searchParams))

      // 현재 사용자의 tenant_id 가져오기
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return createValidationErrorResponse('인증이 필요합니다', 'auth')
      }

      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!userProfile?.tenant_id) {
        return createValidationErrorResponse('테넌트 정보를 찾을 수 없습니다', 'tenant')
      }

      // 출석 기록 조회 쿼리 작성
      let query = supabase
        .from('attendances')
        .select(`
          id,
          student_id,
          class_id,
          enrollment_id,
          attendance_date,
          status,
          reason,
          check_in_time,
          check_out_time,
          actual_hours,
          late_minutes,
          checked_by,
          created_at,
          updated_at,
          students (
            id,
            name,
            student_number,
            grade_level,
            profile_image
          ),
          classes (
            id,
            name,
            instructor_id
          )
        `)
        .eq('tenant_id', userProfile.tenant_id)

      // 필터 적용
      if (params.class_id) {
        query = query.eq('class_id', params.class_id)
      }
      if (params.student_id) {
        query = query.eq('student_id', params.student_id)
      }
      if (params.attendance_date) {
        query = query.eq('attendance_date', params.attendance_date)
      }
      if (params.start_date && params.end_date) {
        query = query.gte('attendance_date', params.start_date).lte('attendance_date', params.end_date)
      }
      if (params.status) {
        query = query.eq('status', params.status)
      }

      // 페이지네이션
      const offset = (params.page - 1) * params.limit
      query = query
        .order('attendance_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + params.limit - 1)

      const { data: attendanceRecords, error, count } = await query

      if (error) {
        console.error('출석 기록 조회 오류:', error)
        return createServerErrorResponse('출석 기록을 조회할 수 없습니다')
      }

      // 전체 개수 조회 (페이지네이션용)
      const { count: totalCount } = await supabase
        .from('attendances')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', userProfile.tenant_id)

      return createPaginatedResponse({
        data: attendanceRecords || [],
        pagination: {
          page: params.page,
          limit: params.limit,
          total: totalCount || 0,
          total_pages: Math.ceil((totalCount || 0) / params.limit)
        }
      })

    } catch (error) {
      console.error('출석 기록 조회 오류:', error)
      return createServerErrorResponse('서버 오류가 발생했습니다')
    }
  }
})

// POST: 출석 체크 (개별)
export const POST = withRouteValidation({
  bodySchema: AttendanceCheckSchema,
  handler: async (request: NextRequest) => {
    try {
      const supabase = createClient()
      const body = AttendanceCheckSchema.parse(await request.json())

      // 현재 사용자의 tenant_id 가져오기
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return createValidationErrorResponse('인증이 필요합니다', 'auth')
      }

      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!userProfile?.tenant_id) {
        return createValidationErrorResponse('테넌트 정보를 찾을 수 없습니다', 'tenant')
      }

      // 현재 사용자의 tenant_memberships ID 조회
      const { data: membership } = await supabase
        .from('tenant_memberships')
        .select('id')
        .eq('user_profile_id', user.id)
        .eq('tenant_id', userProfile.tenant_id)
        .single()

      // enrollment_id 조회 (student_id와 class_id로부터)
      const { data: enrollment } = await supabase
        .from('student_enrollments')
        .select('id')
        .eq('student_id', body.student_id)
        .eq('class_id', body.class_id)
        .eq('tenant_id', userProfile.tenant_id)
        .single()

      // 기존 출석 기록 확인
      const { data: existingRecord } = await supabase
        .from('attendances')
        .select('id')
        .eq('student_id', body.student_id)
        .eq('class_id', body.class_id)
        .eq('attendance_date', body.attendance_date)
        .eq('tenant_id', userProfile.tenant_id)
        .single()

      const attendanceData = {
        tenant_id: userProfile.tenant_id,
        student_id: body.student_id,
        class_id: body.class_id,
        enrollment_id: enrollment?.id || null,
        attendance_date: body.attendance_date,
        status: body.status,
        reason: body.reason || null,
        check_in_time: body.check_in_time ? new Date().toISOString() : null,
        checked_by: membership?.id || null,
        updated_at: new Date().toISOString(),
      }

      let result;

      if (existingRecord) {
        // 기존 기록 업데이트
        const { data, error } = await supabase
          .from('attendances')
          .update(attendanceData)
          .eq('id', existingRecord.id)
          .select(`
            *,
            students (
              id,
              name,
              student_number,
              grade_level,
              profile_image
            ),
            classes (
              id,
              name
            )
          `)
          .single()

        result = { data, error }
      } else {
        // 새 기록 생성
        const { data, error } = await supabase
          .from('attendances')
          .insert(attendanceData)
          .select(`
            *,
            students (
              id,
              name,
              student_number,
              grade_level,
              profile_image
            ),
            classes (
              id,
              name
            )
          `)
          .single()

        result = { data, error }
      }

      if (result.error) {
        console.error('출석 체크 오류:', result.error)
        return createServerErrorResponse('출석 체크를 처리할 수 없습니다')
      }

      return createSuccessResponse(result.data, '출석 체크가 완료되었습니다')

    } catch (error) {
      console.error('출석 체크 오류:', error)
      if (error instanceof z.ZodError) {
        return createValidationErrorResponse('입력 데이터가 올바르지 않습니다', 'validation', error.errors)
      }
      return createServerErrorResponse('서버 오류가 발생했습니다')
    }
  }
})