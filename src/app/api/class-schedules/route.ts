import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  withApiHandler, 
  createSuccessResponse, 
  validateRequestBody,
  validateTenantAccess,
  logApiStart,
  logApiSuccess 
} from '@/lib/api/utils'

// 클래스 스케줄 조회 파라미터 스키마
const getClassSchedulesSchema = z.object({
  tenantId: z.string().uuid().optional().nullable(),
  classId: z.string().uuid().optional().nullable(),
  classroomId: z.string().uuid().optional().nullable(),
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'all']).default('all'),
  date: z.string().optional().nullable(), // YYYY-MM-DD 형식
  includeTemporary: z.boolean().default(true),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0)
})

type GetClassSchedulesParams = z.infer<typeof getClassSchedulesSchema>

/**
 * 클래스 스케줄 조회 (정규 + 임시)
 * GET /api/class-schedules?tenantId=xxx&dayOfWeek=monday&date=2025-08-18
 */
export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('get-class-schedules', { userId: userProfile!.id })

      // URL 파라미터 파싱
      const { searchParams } = new URL(request.url)
      const rawParams = {
        tenantId: searchParams.get('tenantId'),
        classId: searchParams.get('classId'),
        classroomId: searchParams.get('classroomId'),
        dayOfWeek: searchParams.get('dayOfWeek') || 'all',
        date: searchParams.get('date'),
        includeTemporary: searchParams.get('includeTemporary') !== 'false',
        limit: parseInt(searchParams.get('limit') || '100'),
        offset: parseInt(searchParams.get('offset') || '0')
      }

      // 파라미터 검증
      const validationResult = validateRequestBody(rawParams, (data) => 
        getClassSchedulesSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const params: GetClassSchedulesParams = validationResult

      // 테넌트 권한 검증
      const isSystemAdmin = userProfile!.role === 'system_admin'
      if (!isSystemAdmin && params.tenantId && !validateTenantAccess(userProfile!, params.tenantId)) {
        throw new Error('해당 테넌트의 스케줄 정보에 접근할 권한이 없습니다.')
      }

      // 1. 정규 스케줄 조회
      let regularQuery = supabase
        .from('class_classroom_schedules')
        .select(`
          id,
          class_id,
          classroom_id,
          time_slot_id,
          day_of_week,
          effective_from,
          effective_until,
          is_recurring,
          recurrence_weeks,
          is_active,
          notes,
          created_at,
          classes:class_id (
            id,
            name,
            grade,
            course
          ),
          classrooms:classroom_id (
            id,
            name,
            building,
            room_number,
            capacity
          ),
          time_slots:time_slot_id (
            id,
            name,
            start_time,
            end_time
          )
        `)

      // 테넌트 필터링
      if (!isSystemAdmin && params.tenantId) {
        regularQuery = regularQuery.eq('tenant_id', params.tenantId)
      }

      // 클래스 필터링
      if (params.classId) {
        regularQuery = regularQuery.eq('class_id', params.classId)
      }

      // 교실 필터링
      if (params.classroomId) {
        regularQuery = regularQuery.eq('classroom_id', params.classroomId)
      }

      // 요일 필터링
      if (params.dayOfWeek !== 'all') {
        regularQuery = regularQuery.eq('day_of_week', params.dayOfWeek)
      }

      // 활성 스케줄만
      regularQuery = regularQuery.eq('is_active', true)

      const { data: regularSchedules, error: regularError } = await regularQuery
        .order('day_of_week')
        .order('time_slot_id')

      if (regularError) {
        console.error('❌ 정규 스케줄 조회 실패:', regularError)
        throw new Error(`정규 스케줄 조회 실패: ${regularError.message}`)
      }

      // 2. 임시 변경 스케줄 조회 (요청된 경우)
      let temporarySchedules: unknown[] = []
      
      if (params.includeTemporary) {
        let tempQuery = supabase
          .from('temporary_classroom_changes')
          .select(`
            id,
            class_id,
            original_classroom_id,
            temporary_classroom_id,
            time_slot_id,
            change_date,
            start_time,
            end_time,
            reason,
            reason_description,
            status,
            created_at,
            classes:class_id (
              id,
              name,
              grade,
              course
            ),
            original_classroom:original_classroom_id (
              id,
              name,
              building,
              room_number
            ),
            temporary_classroom:temporary_classroom_id (
              id,
              name,
              building,
              room_number,
              capacity
            ),
            time_slots:time_slot_id (
              id,
              name,
              start_time,
              end_time
            )
          `)

        // 테넌트 필터링
        if (!isSystemAdmin && params.tenantId) {
          tempQuery = tempQuery.eq('tenant_id', params.tenantId)
        }

        // 클래스 필터링
        if (params.classId) {
          tempQuery = tempQuery.eq('class_id', params.classId)
        }

        // 교실 필터링 (임시 교실 기준)
        if (params.classroomId) {
          tempQuery = tempQuery.eq('temporary_classroom_id', params.classroomId)
        }

        // 날짜 필터링
        if (params.date) {
          tempQuery = tempQuery.eq('change_date', params.date)
        } else {
          // 오늘 이후의 변경사항만
          const today = new Date().toISOString().split('T')[0]
          tempQuery = tempQuery.gte('change_date', today)
        }

        // 승인된 변경사항만
        tempQuery = tempQuery.in('status', ['approved', 'completed'])

        const { data: tempData, error: tempError } = await tempQuery
          .order('change_date')

        if (tempError) {
          console.error('❌ 임시 변경 조회 실패:', tempError)
        } else {
          temporarySchedules = tempData || []
        }
      }

      // 3. 날짜별 스케줄 계산 (요청된 날짜가 있는 경우)
      let dateSpecificSchedules: unknown[] = []
      
      if (params.date) {
        const requestDate = new Date(params.date)
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][requestDate.getDay()]
        
        // 해당 날짜에 적용되는 정규 스케줄 필터링
        dateSpecificSchedules = regularSchedules?.filter(schedule => {
          const effectiveFrom = new Date(schedule.effective_from)
          const effectiveUntil = schedule.effective_until ? new Date(schedule.effective_until) : null
          
          return schedule.day_of_week === dayOfWeek &&
                 requestDate >= effectiveFrom &&
                 (!effectiveUntil || requestDate <= effectiveUntil)
        }) || []

        // 임시 변경으로 인해 교체된 스케줄 제거
        const tempChangesForDate = temporarySchedules.filter(tc => tc.change_date === params.date)
        
        for (const tempChange of tempChangesForDate) {
          dateSpecificSchedules = dateSpecificSchedules.filter(
            schedule => !(schedule.class_id === tempChange.class_id && 
                         schedule.classroom_id === tempChange.original_classroom_id)
          )
        }
      }

      // 4. 교실 사용률 통계
      const classroomUsageStats = {}
      
      if (regularSchedules) {
        for (const schedule of regularSchedules) {
          const roomId = schedule.classroom_id
          if (!classroomUsageStats[roomId]) {
            classroomUsageStats[roomId] = {
              classroom_name: schedule.classrooms?.name || 'Unknown',
              regular_sessions: 0,
              total_hours_per_week: 0
            }
          }
          classroomUsageStats[roomId].regular_sessions++
          
          // 주간 시간 계산 (대략적)
          if (schedule.time_slots?.start_time && schedule.time_slots?.end_time) {
            const start = schedule.time_slots.start_time.split(':')
            const end = schedule.time_slots.end_time.split(':')
            const hours = (parseInt(end[0]) * 60 + parseInt(end[1])) - (parseInt(start[0]) * 60 + parseInt(start[1]))
            classroomUsageStats[roomId].total_hours_per_week += hours / 60
          }
        }
      }

      const result = {
        regular_schedules: regularSchedules || [],
        temporary_changes: temporarySchedules,
        date_specific_schedules: params.date ? dateSpecificSchedules : null,
        classroom_usage_stats: classroomUsageStats,
        summary: {
          total_regular_schedules: regularSchedules?.length || 0,
          total_temporary_changes: temporarySchedules.length,
          active_classrooms: Object.keys(classroomUsageStats).length,
          query_params: {
            tenant_id: params.tenantId,
            day_of_week: params.dayOfWeek,
            date: params.date,
            include_temporary: params.includeTemporary
          }
        }
      }

      logApiSuccess('get-class-schedules', { 
        regularCount: regularSchedules?.length || 0,
        tempCount: temporarySchedules.length
      })

      return createSuccessResponse(result)
    },
    {
      requireAuth: true
    }
  )
}