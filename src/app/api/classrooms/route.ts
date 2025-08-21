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

// 교실 조회 파라미터 스키마
const getClassroomsSchema = z.object({
  tenantId: z.string().uuid().optional().nullable(),
  status: z.enum(['available', 'occupied', 'maintenance', 'reserved', 'all']).default('all'),
  classroom_type: z.enum(['general', 'lab', 'seminar', 'lecture_hall', 'study_room', 'all']).default('all'),
  building: z.string().optional().nullable(),
  min_capacity: z.number().min(1).optional(),
  max_capacity: z.number().min(1).optional(),
  is_bookable: z.boolean().optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
  search: z.string().optional().nullable()
})

// 교실 생성 스키마
const createClassroomSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  name: z.string().min(1, '교실 이름은 필수입니다'),
  building: z.string().optional(),
  floor: z.number().int().min(0).default(1),
  room_number: z.string().optional(),
  capacity: z.number().int().min(1, '수용 인원은 1명 이상이어야 합니다'),
  area: z.number().min(0).optional(),
  classroom_type: z.enum(['general', 'lab', 'seminar', 'lecture_hall', 'study_room']).default('general'),
  facilities: z.any().optional(), // Json 타입과 호환성을 위해 any 사용
  equipment_list: z.array(z.string()).optional(),
  suitable_subjects: z.array(z.string()).optional(),
  special_features: z.array(z.string()).optional(),
  status: z.enum(['available', 'occupied', 'maintenance', 'reserved']).default('available'),
  is_bookable: z.boolean().default(true),
  hourly_rate: z.number().min(0).default(0),
  description: z.string().optional(),
  photo_urls: z.array(z.string()).optional(),
  qr_code: z.string().optional()
})

type GetClassroomsParams = z.infer<typeof getClassroomsSchema>
type CreateClassroomData = z.infer<typeof createClassroomSchema>

/**
 * 교실 목록 조회
 * GET /api/classrooms?tenantId=xxx&status=all&classroom_type=all&building=본관
 */
export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('get-classrooms', { userId: userProfile!.id })

      // URL 파라미터 파싱
      const { searchParams } = new URL(request.url)
      const rawParams = {
        tenantId: searchParams.get('tenantId'),
        status: searchParams.get('status') || 'all',
        classroom_type: searchParams.get('classroom_type') || 'all',
        building: searchParams.get('building'),
        min_capacity: searchParams.get('min_capacity') ? parseInt(searchParams.get('min_capacity')!) : undefined,
        max_capacity: searchParams.get('max_capacity') ? parseInt(searchParams.get('max_capacity')!) : undefined,
        is_bookable: searchParams.get('is_bookable') === 'true' ? true : searchParams.get('is_bookable') === 'false' ? false : undefined,
        limit: parseInt(searchParams.get('limit') || '100'),
        offset: parseInt(searchParams.get('offset') || '0'),
        search: searchParams.get('search')
      }

      // 파라미터 검증
      const validationResult = validateRequestBody(rawParams, (data) => 
        getClassroomsSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const params: GetClassroomsParams = validationResult

      // 테넌트 권한 검증 (시스템 관리자는 전체 접근)
      const isSystemAdmin = userProfile!.role === 'system_admin'
      if (!isSystemAdmin && params.tenantId && !validateTenantAccess(userProfile!, params.tenantId)) {
        throw new Error('해당 테넌트의 교실 정보에 접근할 권한이 없습니다.')
      }

      // 쿼리 구성 (is_active 컬럼 제거)
      let query = supabase.from('classrooms').select(`
        id,
        name,
        building,
        floor,
        capacity,
        status
      `)
      
      // 시스템 관리자가 아닌 경우에만 테넌트 필터링
      if (!isSystemAdmin && params.tenantId) {
        query = query.eq('tenant_id', params.tenantId)
      }

      // 상태 필터링
      if (params.status !== 'all') {
        query = query.eq('status', params.status)
      }

      // 교실 타입 필터링
      if (params.classroom_type !== 'all') {
        query = query.eq('classroom_type', params.classroom_type)
      }

      // 건물 필터링
      if (params.building) {
        query = query.eq('building', params.building)
      }

      // 수용 인원 필터링
      if (params.min_capacity) {
        query = query.gte('capacity', params.min_capacity)
      }
      if (params.max_capacity) {
        query = query.lte('capacity', params.max_capacity)
      }

      // 예약 가능 여부 필터링
      if (typeof params.is_bookable === 'boolean') {
        query = query.eq('is_bookable', params.is_bookable)
      }

      // 검색 기능 (교실명, 건물명)
      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,building.ilike.%${params.search}%`)
      }

      const { data: classrooms, error } = await query
        .order('building', { ascending: true })
        .order('floor', { ascending: true })
        .order('room_number', { ascending: true })
        .range(params.offset, params.offset + params.limit - 1)

      if (error) {
        console.error('❌ 교실 목록 조회 실패:', error)
        throw new Error(`교실 목록 조회 실패: ${error.message}`)
      }

      const result = {
        classrooms: classrooms || [],
        total: classrooms?.length || 0,
        filters: {
          status: params.status,
          classroom_type: params.classroom_type,
          building: params.building || null,
          capacity_range: {
            min: params.min_capacity || null,
            max: params.max_capacity || null
          },
          is_bookable: params.is_bookable ?? null,
          search: params.search || null
        }
      }

      logApiSuccess('get-classrooms', { count: classrooms?.length || 0 })

      return createSuccessResponse(result)
    },
    {
      requireAuth: true
    }
  )
}

/**
 * 새 교실 생성
 * POST /api/classrooms
 */
export async function POST(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('create-classroom', { userId: userProfile!.id })

      // 입력 검증
      const body: unknown = await request.json()
      const validationResult = validateRequestBody(body, (data) => 
        createClassroomSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const classroomData: CreateClassroomData = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, classroomData.tenantId)) {
        throw new Error('해당 테넌트에 교실을 생성할 권한이 없습니다.')
      }

      // 교실명 중복 확인
      const { data: existingClassroom } = await supabase
        .from('classrooms')
        .select('id')
        .eq('tenant_id', classroomData.tenantId)
        .eq('name', classroomData.name)
        .single()

      if (existingClassroom) {
        throw new Error('이미 존재하는 교실명입니다.')
      }

      // 교실 데이터 생성 - tenantId를 tenant_id로 매핑
      const { tenantId, ...restClassroomData } = classroomData
      const { data: newClassroom, error } = await supabase
        .from('classrooms')
        .insert({
          ...restClassroomData,
          tenant_id: tenantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single()

      if (error) {
        console.error('❌ 교실 생성 실패:', error)
        throw new Error(`교실 생성 실패: ${error.message}`)
      }

      logApiSuccess('create-classroom', { 
        classroomId: newClassroom.id,
        classroomName: newClassroom.name 
      })

      return createSuccessResponse(
        { classroom: newClassroom },
        '교실이 성공적으로 생성되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}