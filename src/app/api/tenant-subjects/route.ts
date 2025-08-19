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

// 과목 조회 파라미터 스키마
const getSubjectsSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  includeInactive: z.boolean().default(false)
})

// 과목 생성/수정 스키마
const subjectSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  name: z.string().min(1, '과목명은 필수입니다').max(100, '과목명은 100자 이하여야 합니다'),
  code: z.string().max(50, '과목 코드는 50자 이하여야 합니다').optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '올바른 색상 코드를 입력하세요').optional(),
  displayOrder: z.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true)
})

type GetSubjectsParams = z.infer<typeof getSubjectsSchema>
type SubjectData = z.infer<typeof subjectSchema>

/**
 * 학원별 과목 목록 조회
 * GET /api/tenant-subjects?tenantId=xxx&includeInactive=false
 */
export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('get-tenant-subjects', { userId: userProfile!.id })

      // URL 파라미터 파싱
      const { searchParams } = new URL(request.url)
      const rawParams = {
        tenantId: searchParams.get('tenantId'),
        includeInactive: searchParams.get('includeInactive') === 'true'
      }

      // 파라미터 검증
      const validationResult = validateRequestBody(rawParams, (data) => 
        getSubjectsSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const params: GetSubjectsParams = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, params.tenantId)) {
        throw new Error('해당 테넌트의 과목 정보에 접근할 권한이 없습니다.')
      }

      // 과목 목록 조회
      let query = supabase
        .from('tenant_subjects')
        .select('*')
        .eq('tenant_id', params.tenantId)

      // 비활성 과목 제외 (기본값)
      if (!params.includeInactive) {
        query = query.eq('is_active', true)
      }

      const { data: subjects, error } = await query.order('display_order', { ascending: true })

      if (error) {
        console.error('❌ 과목 목록 조회 실패:', error)
        throw new Error(`과목 목록 조회 실패: ${error.message}`)
      }

      logApiSuccess('get-tenant-subjects', { 
        count: subjects?.length || 0,
        tenantId: params.tenantId
      })

      return createSuccessResponse({
        subjects: subjects || []
      })
    },
    {
      requireAuth: true
    }
  )
}

/**
 * 새 과목 생성
 * POST /api/tenant-subjects
 */
export async function POST(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('create-tenant-subject', { userId: userProfile!.id })

      // 입력 검증
      const body: unknown = await request.json()
      const validationResult = validateRequestBody(body, (data) => 
        subjectSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const subjectData: SubjectData = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, subjectData.tenantId)) {
        throw new Error('해당 테넌트에 과목을 생성할 권한이 없습니다.')
      }

      // 과목명 중복 확인
      const { data: existingSubject } = await supabase
        .from('tenant_subjects')
        .select('id')
        .eq('tenant_id', subjectData.tenantId)
        .eq('name', subjectData.name)
        .single()

      if (existingSubject) {
        throw new Error('이미 존재하는 과목명입니다.')
      }

      // 과목 코드 중복 확인 (코드가 제공된 경우)
      if (subjectData.code) {
        const { data: existingCode } = await supabase
          .from('tenant_subjects')
          .select('id')
          .eq('tenant_id', subjectData.tenantId)
          .eq('code', subjectData.code)
          .single()

        if (existingCode) {
          throw new Error('이미 존재하는 과목 코드입니다.')
        }
      }

      // 과목 생성
      const { tenantId, displayOrder, isActive, ...restData } = subjectData
      const { data: newSubject, error } = await supabase
        .from('tenant_subjects')
        .insert({
          ...restData,
          tenant_id: tenantId,
          display_order: displayOrder,
          is_active: isActive,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single()

      if (error) {
        console.error('❌ 과목 생성 실패:', error)
        throw new Error(`과목 생성 실패: ${error.message}`)
      }

      logApiSuccess('create-tenant-subject', { 
        subjectId: newSubject.id,
        subjectName: newSubject.name 
      })

      return createSuccessResponse(
        { subject: newSubject },
        '과목이 성공적으로 생성되었습니다.'
      )
    },
    {
      requireAuth: true
    }
  )
}