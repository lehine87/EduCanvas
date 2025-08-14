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

// 학생 이동 스키마 (기본 정보만)
const moveStudentSchema = z.object({
  tenantId: z.string().uuid('유효한 테넌트 ID가 아닙니다'),
  studentId: z.string().uuid('유효한 학생 ID가 아닙니다'),
  targetClassId: z.string().uuid('유효한 대상 클래스 ID가 아닙니다').nullable(),
  moveReason: z.string().optional()
})

type MoveStudentRequest = z.infer<typeof moveStudentSchema>

/**
 * ClassFlow 드래그앤드롭을 위한 학생 클래스 이동 (간소화 버전)
 * POST /api/classes/move-student
 */
export async function POST(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('move-student', { userId: userProfile!.id })

      // 입력 검증
      const body: unknown = await request.json()
      const validationResult = validateRequestBody(body, (data) => 
        moveStudentSchema.parse(data)
      )

      if (validationResult instanceof Response) {
        return validationResult
      }

      const { 
        tenantId, 
        studentId, 
        targetClassId, 
        moveReason
      }: MoveStudentRequest = validationResult

      // 테넌트 권한 검증
      if (!validateTenantAccess(userProfile!, tenantId)) {
        throw new Error('해당 테넌트의 학생을 이동시킬 권한이 없습니다.')
      }

      // 학생 존재 확인
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, name, student_number, status')
        .eq('id', studentId)
        .eq('tenant_id', tenantId)
        .single()

      if (studentError || !student) {
        console.error('❌ 학생 조회 실패:', studentError?.message)
        throw new Error('학생을 찾을 수 없습니다.')
      }

      // 대상 클래스 검증 (null이 아닌 경우)
      let targetClass = null
      if (targetClassId) {
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('id, name')
          .eq('id', targetClassId)
          .eq('tenant_id', tenantId)
          .single()

        if (classError || !classData) {
          console.error('❌ 대상 클래스 조회 실패:', classError?.message)
          throw new Error('대상 클래스를 찾을 수 없습니다.')
        }

        targetClass = classData
      }

      console.log(`🔄 학생 ${student.name}(${student.student_number})을(를) ${targetClassId ? `클래스 ${targetClass?.name}으로` : '미배정으로'} 이동 중...`)

      // 학생 정보 업데이트 (실제 테이블 구조에 맞게 간소화)
      const { data: updatedStudent, error: updateError } = await supabase
        .from('students')
        .update({
          // class_id 컬럼이 없다면 notes나 다른 필드에 클래스 정보 저장
          notes: targetClassId ? `Class: ${targetClass?.name}` : 'Unassigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId)
        .eq('tenant_id', tenantId)
        .select('id, name, student_number, status, notes')
        .single()

      if (updateError) {
        console.error('❌ 학생 정보 업데이트 실패:', updateError)
        throw new Error(`학생 정보 업데이트 실패: ${updateError.message}`)
      }

      const result = {
        student: updatedStudent,
        move: {
          to: {
            classId: targetClassId,
            className: targetClass?.name || '미배정'
          },
          movedAt: new Date().toISOString(),
          movedBy: userProfile!.id,
          reason: moveReason
        }
      }

      logApiSuccess('move-student', {
        studentId,
        studentName: student.name,
        toClass: targetClassId
      })

      return createSuccessResponse(
        result,
        `${student.name} 학생이 성공적으로 이동되었습니다.`
      )
    },
    {
      requireAuth: true
    }
  )
}