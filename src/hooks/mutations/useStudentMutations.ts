import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { createStudent, updateStudent, deleteStudent } from '@/lib/api/students.api'
import { studentQueryKeys, studentCacheUtils } from '@/lib/react-query'
import type { Student, StudentFormData } from '@/types/student.types'
import type { PaginatedData } from '@/lib/api-response'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/store/useAuthStore'

/**
 * 학생 생성 Mutation Hook - Optimistic Updates 적용
 * 
 * 성능 최적화:
 * - 즉시 UI 업데이트 (Optimistic)
 * - 실패 시 자동 롤백
 * - 캐시 무효화로 일관성 보장
 */
export function useCreateStudent(
  options?: UseMutationOptions<{ student: Student }, Error, StudentFormData>
) {
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()
  const tenantId = profile?.tenant_id
  
  return useMutation<{ student: Student }, Error, StudentFormData>({
    mutationFn: async (studentData) => {
      if (!tenantId) throw new Error('Tenant ID is required')
      return createStudent(studentData, tenantId)
    },
    onMutate: async (newStudent) => {
      // 진행 중인 쿼리들 취소
      await queryClient.cancelQueries({ queryKey: studentQueryKeys.lists() })

      // 이전 데이터 백업 (롤백용)
      const previousStudents = queryClient.getQueriesData({ 
        queryKey: studentQueryKeys.lists() 
      })

      // Optimistic Update: 임시 ID로 즉시 UI 업데이트
      const tempStudent: Student = {
        id: `temp-${Date.now()}`,
        tenant_id: tenantId!,
        name: newStudent.name,
        student_number: newStudent.student_number || `STU${Date.now()}`,
        status: newStudent.status || 'active',
        grade_level: newStudent.grade_level || null,
        phone: newStudent.phone || null,
        email: newStudent.email || null,
        birth_date: newStudent.birth_date || null,
        gender: newStudent.gender || null,
        parent_name_1: newStudent.parent_name_1 || null,
        parent_phone_1: newStudent.parent_phone_1 || null,
        parent_name_2: newStudent.parent_name_2 || null,
        parent_phone_2: newStudent.parent_phone_2 || null,
        address: newStudent.address || null,
        school_name: newStudent.school_name || null,
        notes: newStudent.notes || null,
        name_english: null,
        emergency_contact: null,
        custom_fields: null,
        tags: null,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        enrollment_date: null,
        profile_image: null,
      }

      studentCacheUtils.addStudentToCache(tempStudent)

      return { previousStudents, tempStudent }
    },
    onSuccess: (data, variables, context: any) => {
      // 성공 시 실제 데이터로 교체
      if (context?.tempStudent) {
        studentCacheUtils.removeStudentFromCache(context.tempStudent.id)
      }
      studentCacheUtils.addStudentToCache(data.student)
      
      // 관련 캐시 무효화
      studentCacheUtils.invalidateStudentStats()
      
      toast.success(`${data.student.name} 학생이 등록되었습니다`)
      options?.onSuccess?.(data, variables, context)
    },
    onError: (error, variables, context: any) => {
      // 실패 시 롤백
      if (context?.previousStudents) {
        context.previousStudents.forEach(([queryKey, data]: [any, any]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      
      const errorMessage = error instanceof Error ? error.message : '학생 등록에 실패했습니다'
      toast.error(errorMessage)
      options?.onError?.(error, variables, context)
    },
    onSettled: () => {
      // 최종적으로 관련 쿼리들 무효화
      studentCacheUtils.invalidateStudentsList()
    },
  })
}

/**
 * 학생 수정 Mutation Hook - Optimistic Updates 적용
 */
export function useUpdateStudent(
  options?: UseMutationOptions<{ student: Student }, Error, { studentId: string; updates: Partial<Student> }>
) {
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()
  const tenantId = profile?.tenant_id

  return useMutation({
    mutationFn: async ({ studentId, updates }: { studentId: string; updates: Partial<Student> }) => {
      if (!tenantId) throw new Error('Tenant ID is required')
      return updateStudent(studentId, updates, tenantId)
    },
    onMutate: async ({ studentId, updates }) => {
      // 진행 중인 쿼리들 취소
      await queryClient.cancelQueries({ queryKey: studentQueryKeys.all })

      // 이전 데이터 백업
      const previousStudentDetail = queryClient.getQueryData(
        studentQueryKeys.detail(studentId)
      )
      const previousStudentLists = queryClient.getQueriesData({ 
        queryKey: studentQueryKeys.lists() 
      })

      // Optimistic Update
      studentCacheUtils.setStudentInCache(studentId, updates)

      return { previousStudentDetail, previousStudentLists, studentId }
    },
    onSuccess: (data, variables, context) => {
      // 성공 시 실제 데이터로 교체
      studentCacheUtils.setStudentInCache(data.student.id, data.student)
      
      toast.success(`${data.student.name} 정보가 업데이트되었습니다`)
      options?.onSuccess?.(data, variables, context)
    },
    onError: (error, variables, context) => {
      // 실패 시 롤백
      if (context?.previousStudentDetail) {
        queryClient.setQueryData(
          studentQueryKeys.detail(context.studentId),
          context.previousStudentDetail
        )
      }
      
      if (context?.previousStudentLists) {
        context.previousStudentLists.forEach(([queryKey, data]: [any, any]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      
      const errorMessage = error instanceof Error ? error.message : '학생 정보 수정에 실패했습니다'
      toast.error(errorMessage)
      options?.onError?.(error, variables, context)
    },
    onSettled: (data, error, variables) => {
      // 해당 학생의 캐시 무효화
      studentCacheUtils.invalidateStudentDetail(variables.studentId)
    },
  })
}

/**
 * 학생 삭제 Mutation Hook - Soft Delete
 */
export function useDeleteStudent(
  options?: UseMutationOptions<void, Error, { studentId: string; forceDelete?: boolean }>
) {
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()
  const tenantId = profile?.tenant_id

  return useMutation({
    mutationFn: async ({ studentId, forceDelete = false }: { studentId: string; forceDelete?: boolean }): Promise<void> => {
      if (!tenantId) throw new Error('Tenant ID is required')
      await deleteStudent(studentId, tenantId, forceDelete)
    },
    onMutate: async ({ studentId, forceDelete }) => {
      // 진행 중인 쿼리들 취소
      await queryClient.cancelQueries({ queryKey: studentQueryKeys.all })

      // 삭제될 학생 정보 백업
      const studentToDelete = queryClient.getQueryData(
        studentQueryKeys.detail(studentId)
      ) as Student | undefined

      // 이전 목록 데이터 백업
      const previousStudentLists = queryClient.getQueriesData({ 
        queryKey: studentQueryKeys.lists() 
      })

      // Optimistic Update
      if (forceDelete) {
        // 완전 삭제: 캐시에서 제거
        studentCacheUtils.removeStudentFromCache(studentId)
      } else {
        // Soft Delete: 상태만 변경
        studentCacheUtils.setStudentInCache(studentId, { status: 'withdrawn' })
      }

      return { studentToDelete, previousStudentLists, studentId, forceDelete }
    },
    onSuccess: (data, variables, context) => {
      const studentName = context?.studentToDelete?.name || '학생'
      const actionText = variables.forceDelete ? '삭제' : '퇴학 처리'
      
      toast.success(`${studentName}이 ${actionText}되었습니다`)
      
      // 통계 캐시 무효화
      studentCacheUtils.invalidateStudentStats()
      options?.onSuccess?.(data, variables, context)
    },
    onError: (error, variables, context) => {
      // 실패 시 롤백
      if (context?.previousStudentLists) {
        context.previousStudentLists.forEach(([queryKey, data]: [any, any]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }

      if (context?.studentToDelete) {
        studentCacheUtils.setStudentInCache(
          context.studentId, 
          context.studentToDelete
        )
      }
      
      const actionText = variables.forceDelete ? '삭제' : '퇴학 처리'
      const errorMessage = error instanceof Error ? error.message : `학생 ${actionText}에 실패했습니다`
      toast.error(errorMessage)
      options?.onError?.(error, variables, context)
    },
    onSettled: (data, error, variables) => {
      // 관련 캐시 무효화
      studentCacheUtils.invalidateStudentsList()
      studentCacheUtils.invalidateStudentDetail(variables.studentId)
    },
  })
}

/**
 * 대량 학생 작업 뮤테이션 훅
 */
export function useBulkStudentActions(
  options?: UseMutationOptions<{ affected: number }, Error, { studentIds: string[]; action: 'update' | 'delete' | 'move'; data?: any }>
) {
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()
  const tenantId = profile?.tenant_id

  return useMutation({
    mutationFn: async ({ studentIds, action, data }: { studentIds: string[]; action: 'update' | 'delete' | 'move'; data?: any }) => {
      if (!tenantId) throw new Error('Tenant ID is required')

      const response = await fetch('/api/students/bulk-update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentIds,
          action,
          data,
          tenantId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `Bulk action failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Bulk action failed')
      }

      return result.data
    },
    onSuccess: (data, variables) => {
      // 전체 학생 목록 무효화 (대량 작업 후에는 전체 갱신이 안전)
      studentCacheUtils.invalidateAllStudents()
      
      const actionText = variables.action === 'update' ? '수정' : 
                        variables.action === 'delete' ? '삭제' : '이동'
      
      toast.success(`${data.affected}명의 학생이 일괄 ${actionText}되었습니다`)
      options?.onSuccess?.(data, variables, undefined)
    },
    onError: (error, variables) => {
      const actionText = variables.action === 'update' ? '수정' : 
                        variables.action === 'delete' ? '삭제' : '이동'
      
      const errorMessage = error instanceof Error ? error.message : `일괄 ${actionText}에 실패했습니다`
      toast.error(errorMessage)
      options?.onError?.(error, variables, undefined)
    },
  })
}

/**
 * 액세스 토큰 가져오기 헬퍼
 */
async function getAccessToken(): Promise<string> {
  const { createClient } = await import('@/lib/supabase/client')
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('No access token available')
  }
  
  return session.access_token
}