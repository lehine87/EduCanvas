import { NextRequest } from 'next/server'
import { withApiHandler, createSuccessResponse, createErrorResponse, validateRequestBody, logApiStart, logApiSuccess, logApiError } from '@/lib/api/utils'

const API_NAME = 'attendance'

/**
 * GET /api/attendance
 * 근태 기록 목록 조회
 */
export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, supabase, userProfile }) => {
      logApiStart(API_NAME, { userId: userProfile?.id })

      try {
        // userProfile.tenant_id null 체크
        if (!userProfile?.tenant_id) {
          return createErrorResponse('테넌트 정보가 없습니다.', 400)
        }

        const { searchParams } = new URL(request.url)
        const membershipId = searchParams.get('membership_id')
        const startDate = searchParams.get('start_date')
        const endDate = searchParams.get('end_date')
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        let query = supabase
          .from('attendance_records')
          .select(`
            *,
            tenant_memberships!inner(
              id,
              user_profiles!inner(name, email)
            )
          `)
          .eq('tenant_id', userProfile.tenant_id)
          .order('date', { ascending: false })

        // 필터 적용
        if (membershipId) {
          query = query.eq('membership_id', membershipId)
        }

        if (startDate) {
          query = query.gte('date', startDate)
        }

        if (endDate) {
          query = query.lte('date', endDate)
        }

        if (status) {
          query = query.eq('status', status)
        }

        // 페이지네이션
        const from = (page - 1) * limit
        const to = from + limit - 1

        const { data: records, error, count } = await query
          .range(from, to)

        if (error) {
          logApiError(API_NAME, `근태 기록 조회 실패: ${error.message}`)
          return createErrorResponse('근태 기록 조회에 실패했습니다.', 500)
        }

        logApiSuccess(API_NAME, { count: records?.length || 0 })

        return createSuccessResponse({
          records: records || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            total_pages: Math.ceil((count || 0) / limit)
          }
        })

      } catch (error) {
        logApiError(API_NAME, error)
        return createErrorResponse('근태 기록 조회 중 오류가 발생했습니다.', 500)
      }
    },
    { requireAuth: true }
  )
}

/**
 * POST /api/attendance
 * 근태 기록 생성/수정
 */
export async function POST(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, supabase, userProfile }) => {
      logApiStart(API_NAME, { userId: userProfile?.id, action: 'create' })

      try {
        // userProfile.tenant_id null 체크
        if (!userProfile?.tenant_id) {
          return createErrorResponse('테넌트 정보가 없습니다.', 400)
        }

        const body = await request.json()
        const validatedBody = validateRequestBody<{
          membership_id: string
          date: string
          check_in?: string
          check_out?: string
          status?: string
          notes?: string
        }>(
          body,
          (data: unknown) => {
            const record = data as any
            if (!record.membership_id || !record.date) {
              throw new Error('membership_id와 date는 필수입니다.')
            }
            return record
          }
        )

        if (validatedBody instanceof Response) {
          return validatedBody
        }

        const { membership_id, date, check_in, check_out, status = '정상', notes } = validatedBody

        // 해당 직원이 현재 테넌트에 속하는지 확인
        const { data: membership, error: membershipError } = await supabase
          .from('tenant_memberships')
          .select('id')
          .eq('id', membership_id)
          .eq('tenant_id', userProfile.tenant_id)
          .single()

        if (membershipError || !membership) {
          return createErrorResponse('유효하지 않은 직원입니다.', 400)
        }

        // 근태 기록 생성/수정 (UPSERT)
        const attendanceData = {
          tenant_id: userProfile.tenant_id,
          membership_id,
          date,
          check_in,
          check_out,
          status,
          notes,
          updated_at: new Date().toISOString()
        }

        const { data: record, error } = await supabase
          .from('attendance_records')
          .upsert(attendanceData, { 
            onConflict: 'membership_id,date',
            ignoreDuplicates: false 
          })
          .select()
          .single()

        if (error) {
          logApiError(API_NAME, `근태 기록 생성 실패: ${error.message}`)
          return createErrorResponse('근태 기록 생성에 실패했습니다.', 500)
        }

        logApiSuccess(API_NAME, { recordId: record.id, membershipId: membership_id })

        return createSuccessResponse({
          record
        }, '근태 기록이 저장되었습니다.')

      } catch (error) {
        logApiError(API_NAME, error)
        return createErrorResponse(
          error instanceof Error ? error.message : '근태 기록 생성 중 오류가 발생했습니다.',
          500
        )
      }
    },
    { requireAuth: true }
  )
}