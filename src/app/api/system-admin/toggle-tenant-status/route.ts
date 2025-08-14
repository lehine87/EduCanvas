import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  withApiHandler, 
  createSuccessResponse, 
  validateRequestBody,
  logApiStart,
  logApiSuccess 
} from '@/lib/api/utils'

// 입력 검증 스키마
const toggleTenantStatusSchema = z.object({
  tenantId: z.string().uuid('유효한 UUID가 아닙니다'),
  isActive: z.boolean()
})

type ToggleTenantStatusRequest = z.infer<typeof toggleTenantStatusSchema>

export async function POST(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('toggle-tenant-status')

      // 1. 입력 검증
      const body: unknown = await request.json()
      const validationResult = validateRequestBody(body, (data) => 
        toggleTenantStatusSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const { tenantId, isActive }: ToggleTenantStatusRequest = validationResult

      console.log(`🔄 테넌트 ${tenantId} 상태를 ${isActive ? '활성화' : '비활성화'}로 변경 중...`)

      // 2. 데이터베이스 업데이트
      const { data, error } = await supabase
        .from('tenants')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId)
        .select('id, name, is_active')
        .single()

      if (error) {
        console.error('❌ 테넌트 상태 변경 실패:', error)
        throw new Error(`테넌트 상태 변경 실패: ${error.message}`)
      }

      const result = {
        tenantId: data.id,
        name: data.name,
        newStatus: data.is_active
      }

      logApiSuccess('toggle-tenant-status', result)

      // 3. 성공 응답
      return createSuccessResponse(
        { tenant: data },
        `테넌트가 ${isActive ? '활성화' : '비활성화'}되었습니다.`
      )
    },
    {
      requireAuth: true,
      requireSystemAdmin: true
    }
  )
}