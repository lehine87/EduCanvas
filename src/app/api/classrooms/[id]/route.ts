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

// 교실 수정 스키마
const updateClassroomSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  name: z.string().min(1, '교실 이름은 필수입니다').optional(),
  building: z.string().optional(),
  floor: z.number().int().min(0).optional(),
  room_number: z.string().optional(),
  capacity: z.number().int().min(1, '수용 인원은 1명 이상이어야 합니다').optional(),
  area: z.number().min(0).optional(),
  classroom_type: z.enum(['general', 'lab', 'seminar', 'lecture_hall', 'study_room']).optional(),
  facilities: z.any().optional(), // Json 타입과 호환성을 위해 any 사용
  equipment_list: z.array(z.string()).optional(),
  suitable_subjects: z.array(z.string()).optional(),
  special_features: z.array(z.string()).optional(),
  status: z.enum(['available', 'occupied', 'maintenance', 'reserved']).optional(),
  is_bookable: z.boolean().optional(),
  hourly_rate: z.number().min(0).optional(),
  description: z.string().optional(),
  photo_urls: z.array(z.string()).optional(),
  qr_code: z.string().optional()
})

type UpdateClassroomData = z.infer<typeof updateClassroomSchema>

/**
 * 특정 교실 조회
 * GET /api/classrooms/[id]?tenantId=xxx
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('get-classroom', { userId: userProfile!.id, classroomId: params.id })

      // URL 파라미터에서 tenantId 추출
      const { searchParams } = new URL(request.url)
      const tenantId = searchParams.get('tenantId')

      if (!tenantId) {
        throw new Error('tenantId 파라미터가 필요합니다.')
      }

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, tenantId)) {
        throw new Error('해당 테넌트의 교실 정보에 접근할 권한이 없습니다.')
      }

      // 교실 정보 조회
      const { data: classroom, error } = await supabase
        .from('classrooms')
        .select('*')
        .eq('id', params.id)
        .eq('tenant_id', tenantId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('교실을 찾을 수 없습니다.')
        }
        console.error('❌ 교실 조회 실패:', error)
        throw new Error(`교실 조회 실패: ${error.message}`)
      }

      // 교실 사용률 계산 (예약 시스템이 있다면)
      const result = {
        ...classroom,
        utilization_stats: {
          current_status: classroom.status,
          is_bookable: classroom.is_bookable,
          hourly_rate: classroom.hourly_rate
        }
      }

      logApiSuccess('get-classroom', { classroomId: classroom.id })

      return createSuccessResponse({ classroom: result })
    },
    {
      requireAuth: true
    }
  )
}

/**
 * 교실 정보 수정
 * PUT /api/classrooms/[id]
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('update-classroom', { userId: userProfile!.id, classroomId: params.id })

      // 입력 검증
      const body: unknown = await request.json()
      const validationResult = validateRequestBody(body, (data) => 
        updateClassroomSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const updateData: UpdateClassroomData = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, updateData.tenantId)) {
        throw new Error('해당 테넌트의 교실 정보를 수정할 권한이 없습니다.')
      }

      // 기존 교실 존재 확인
      const { data: existingClassroom, error: fetchError } = await supabase
        .from('classrooms')
        .select('id, name, tenant_id')
        .eq('id', params.id)
        .eq('tenant_id', updateData.tenantId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('수정할 교실을 찾을 수 없습니다.')
        }
        throw new Error(`교실 조회 실패: ${fetchError.message}`)
      }

      // 교실명 중복 확인 (이름이 변경되는 경우만)
      if (updateData.name && updateData.name !== existingClassroom.name) {
        const { data: duplicateClassroom } = await supabase
          .from('classrooms')
          .select('id')
          .eq('tenant_id', updateData.tenantId)
          .eq('name', updateData.name)
          .neq('id', params.id)
          .single()

        if (duplicateClassroom) {
          throw new Error('이미 존재하는 교실명입니다.')
        }
      }

      // tenantId 제거 (업데이트 대상이 아님)
      const { tenantId: _, ...updateFields } = updateData

      // 교실 정보 업데이트
      const { data: updatedClassroom, error } = await supabase
        .from('classrooms')
        .update({
          ...updateFields,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('tenant_id', updateData.tenantId)
        .select('*')
        .single()

      if (error) {
        console.error('❌ 교실 수정 실패:', error)
        throw new Error(`교실 수정 실패: ${error.message}`)
      }

      logApiSuccess('update-classroom', { 
        classroomId: updatedClassroom.id,
        classroomName: updatedClassroom.name 
      })

      return createSuccessResponse(
        { classroom: updatedClassroom },
        '교실 정보가 성공적으로 수정되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}

/**
 * 교실 삭제 (소프트 삭제)
 * DELETE /api/classrooms/[id]?tenantId=xxx&forceDelete=false
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const params = await context.params
      logApiStart('delete-classroom', { userId: userProfile!.id, classroomId: params.id })

      // URL 파라미터에서 tenantId와 forceDelete 추출
      const { searchParams } = new URL(request.url)
      const tenantId = searchParams.get('tenantId')
      const forceDelete = searchParams.get('forceDelete') === 'true'

      if (!tenantId) {
        throw new Error('tenantId 파라미터가 필요합니다.')
      }

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, tenantId)) {
        throw new Error('해당 테넌트의 교실을 삭제할 권한이 없습니다.')
      }

      // 기존 교실 존재 확인
      const { data: existingClassroom, error: fetchError } = await supabase
        .from('classrooms')
        .select('id, name, status')
        .eq('id', params.id)
        .eq('tenant_id', tenantId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('삭제할 교실을 찾을 수 없습니다.')
        }
        throw new Error(`교실 조회 실패: ${fetchError.message}`)
      }

      // 교실 사용 중 확인 (점유 상태에서는 삭제 불가)
      if (!forceDelete && existingClassroom.status === 'occupied') {
        throw new Error('현재 사용 중인 교실은 삭제할 수 없습니다. 강제 삭제를 원하시면 forceDelete=true를 사용하세요.')
      }

      let result

      if (forceDelete) {
        // 하드 삭제: 완전 삭제
        const { error } = await supabase
          .from('classrooms')
          .delete()
          .eq('id', params.id)
          .eq('tenant_id', tenantId)

        if (error) {
          console.error('❌ 교실 삭제 실패:', error)
          throw new Error(`교실 삭제 실패: ${error.message}`)
        }

        result = { deleted: true, type: 'hard' }
      } else {
        // 소프트 삭제: 상태를 'maintenance'로 변경하고 예약 불가 설정
        const { data: updatedClassroom, error } = await supabase
          .from('classrooms')
          .update({
            status: 'maintenance',
            is_bookable: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', params.id)
          .eq('tenant_id', tenantId)
          .select('*')
          .single()

        if (error) {
          console.error('❌ 교실 상태 변경 실패:', error)
          throw new Error(`교실 상태 변경 실패: ${error.message}`)
        }

        result = { classroom: updatedClassroom, type: 'soft' }
      }

      logApiSuccess('delete-classroom', { 
        classroomId: params.id,
        classroomName: existingClassroom.name,
        deleteType: forceDelete ? 'hard' : 'soft'
      })

      return createSuccessResponse(
        result,
        forceDelete 
          ? '교실이 완전히 삭제되었습니다.' 
          : '교실이 비활성화되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}