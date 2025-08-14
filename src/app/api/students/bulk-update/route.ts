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

// 대량 업데이트 스키마
const bulkUpdateSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  updates: z.array(z.object({
    studentId: z.string().uuid('유효한 학생 ID가 아닙니다'),
    updates: z.object({
      class_id: z.string().uuid().optional(),
      status: z.enum(['active', 'inactive', 'graduated']).optional(),
      grade: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      parent_name: z.string().optional(),
      parent_phone_1: z.string().optional(),
      parent_phone_2: z.string().optional(),
      notes: z.string().optional()
    })
  })).min(1, '최소 1개 이상의 업데이트가 필요합니다').max(100, '한 번에 최대 100개까지 업데이트 가능합니다')
})

type BulkUpdateRequest = z.infer<typeof bulkUpdateSchema>

/**
 * 학생 대량 업데이트
 * ClassFlow에서 드래그앤드롭으로 여러 학생의 클래스 변경 시 사용
 * POST /api/students/bulk-update
 */
export async function POST(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('bulk-update-students', { userId: userProfile!.id })

      // 입력 검증
      const body: unknown = await request.json()
      const validationResult = validateRequestBody(body, (data) => 
        bulkUpdateSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const { tenantId, updates }: BulkUpdateRequest = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, tenantId)) {
        throw new Error('해당 테넌트의 학생 정보를 수정할 권한이 없습니다.')
      }

      console.log(`🔄 ${updates.length}명의 학생 정보 대량 업데이트 시작`)

      const results = []
      const errors = []

      // 트랜잭션으로 처리하기 위해 배치로 실행
      for (const updateItem of updates) {
        try {
          // 학생이 해당 테넌트에 속하는지 확인
          const { data: existingStudent } = await supabase
            .from('students')
            .select('id')
            .eq('id', updateItem.studentId)
            .eq('tenant_id', tenantId)
            .single()

          if (!existingStudent) {
            errors.push({
              studentId: updateItem.studentId,
              error: '학생을 찾을 수 없거나 권한이 없습니다.'
            })
            continue
          }

          // 업데이트 실행
          const { data: updatedStudent, error } = await supabase
            .from('students')
            .update({
              ...updateItem.updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', updateItem.studentId)
            .eq('tenant_id', tenantId) // 보안: 같은 테넌트만 수정 가능
            .select('id, name, student_number, class_id, status')
            .single()

          if (error) {
            console.error(`❌ 학생 ${updateItem.studentId} 업데이트 실패:`, error)
            errors.push({
              studentId: updateItem.studentId,
              error: error.message
            })
            continue
          }

          results.push({
            studentId: updateItem.studentId,
            success: true,
            student: updatedStudent
          })

        } catch (error) {
          console.error(`❌ 학생 ${updateItem.studentId} 업데이트 예외:`, error)
          errors.push({
            studentId: updateItem.studentId,
            error: error instanceof Error ? error.message : '알 수 없는 오류'
          })
        }
      }

      const summary = {
        total: updates.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors
      }

      logApiSuccess('bulk-update-students', summary)

      // 부분 성공이라도 성공으로 처리하되, 에러 정보도 함께 반환
      return createSuccessResponse(
        summary,
        `${results.length}명의 학생 정보가 업데이트되었습니다.${errors.length > 0 ? ` (${errors.length}명 실패)` : ''}`
      )
    },
    {
      requireAuth: true
    }
  )
}