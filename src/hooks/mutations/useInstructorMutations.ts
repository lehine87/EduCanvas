import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { createInstructor, updateInstructor, deleteInstructor } from '@/lib/api/instructors.api'
import { instructorQueryKeys } from '@/lib/react-query'
import type { Instructor } from '@/types/instructor.types'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/store/useAuthStore'

/**
 * 강사 생성 Mutation Hook - Optimistic Updates 적용
 * 
 * 성능 최적화:
 * - 즉시 UI 업데이트 (Optimistic)
 * - 실패 시 자동 롤백
 * - 캐시 무효화로 일관성 보장
 */
export function useCreateInstructor(
  options?: UseMutationOptions<{ instructor: Instructor, message: string }, Error, any>
) {
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()
  
  return useMutation<{ instructor: Instructor, message: string }, Error, any>({
    mutationFn: async (instructorData) => {
      return createInstructor(instructorData)
    },
    onMutate: async (newInstructor) => {
      // 진행 중인 쿼리들 취소
      await queryClient.cancelQueries({ queryKey: instructorQueryKeys.lists() })

      // 이전 데이터 백업 (롤백용)
      const previousInstructors = queryClient.getQueriesData({ 
        queryKey: instructorQueryKeys.lists() 
      })

      // Optimistic Update: 임시 ID로 즉시 UI 업데이트
      const tempInstructor: Instructor = {
        id: `temp-${Date.now()}`,
        user_id: newInstructor.user_id,
        tenant_id: profile?.tenant_id || '',
        role_id: newInstructor.role_id,
        status: 'active',
        hire_date: newInstructor.hire_date,
        bio: newInstructor.bio,
        qualification: newInstructor.qualification,
        specialization: newInstructor.specialization,
        staff_info: newInstructor.staff_info,
        invited_by: profile?.id || '',
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: undefined, // Will be populated from server response
        role: undefined, // Will be populated from server response
        bank_account: null,
        emergency_contact: null,
        is_primary_contact: false,
        job_function: null,
        salary_policies: [],
        last_accessed_at: null,
        permissions_override: null
      }

      // Add to cache optimistically
      queryClient.setQueryData(instructorQueryKeys.lists(), (old: any) => {
        if (!old) return { instructors: [tempInstructor], pagination: { total: 1 } }
        return {
          ...old,
          instructors: [tempInstructor, ...old.instructors],
          pagination: { ...old.pagination, total: old.pagination.total + 1 }
        }
      })

      return { previousInstructors, tempInstructor }
    },
    onSuccess: (data, variables, context: any) => {
      // 성공 시 실제 데이터로 교체
      if (context?.tempInstructor) {
        queryClient.setQueryData(instructorQueryKeys.lists(), (old: any) => {
          if (!old) return { instructors: [data.instructor], pagination: { total: 1 } }
          return {
            ...old,
            instructors: old.instructors.map((instructor: Instructor) => 
              instructor.id === context.tempInstructor.id ? data.instructor : instructor
            )
          }
        })
      }
      
      // 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: instructorQueryKeys.all })
      
      toast.success(data.message || '강사가 등록되었습니다')
      options?.onSuccess?.(data, variables, context)
    },
    onError: (error, variables, context: any) => {
      // 실패 시 롤백
      if (context?.previousInstructors) {
        context.previousInstructors.forEach(([queryKey, data]: [any, any]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      
      const errorMessage = error instanceof Error ? error.message : '강사 등록에 실패했습니다'
      toast.error(errorMessage)
      options?.onError?.(error, variables, context)
    },
    onSettled: () => {
      // 최종적으로 관련 쿼리들 무효화
      queryClient.invalidateQueries({ queryKey: instructorQueryKeys.lists() })
    },
  })
}

/**
 * 강사 수정 Mutation Hook - Optimistic Updates 적용
 */
export function useUpdateInstructor(
  options?: UseMutationOptions<{ instructor: Instructor }, Error, { instructorId: string; updates: any }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ instructorId, updates }: { instructorId: string; updates: any }) => {
      return updateInstructor(instructorId, updates)
    },
    onMutate: async ({ instructorId, updates }) => {
      // 진행 중인 쿼리들 취소
      await queryClient.cancelQueries({ queryKey: instructorQueryKeys.all })

      // 이전 데이터 백업
      const previousInstructorDetail = queryClient.getQueryData(
        instructorQueryKeys.detail(instructorId)
      )
      const previousInstructorLists = queryClient.getQueriesData({ 
        queryKey: instructorQueryKeys.lists() 
      })

      // Optimistic Update
      queryClient.setQueryData(instructorQueryKeys.detail(instructorId), (old: any) => {
        if (!old) return old
        return { ...old, ...updates, updated_at: new Date().toISOString() }
      })

      queryClient.setQueryData(instructorQueryKeys.lists(), (old: any) => {
        if (!old) return old
        return {
          ...old,
          instructors: old.instructors.map((instructor: Instructor) =>
            instructor.id === instructorId ? { ...instructor, ...updates, updated_at: new Date().toISOString() } : instructor
          )
        }
      })

      return { previousInstructorDetail, previousInstructorLists, instructorId }
    },
    onSuccess: (data, variables, context) => {
      // 성공 시 실제 데이터로 교체
      queryClient.setQueryData(instructorQueryKeys.detail(data.instructor.id), data.instructor)
      
      queryClient.setQueryData(instructorQueryKeys.lists(), (old: any) => {
        if (!old) return old
        return {
          ...old,
          instructors: old.instructors.map((instructor: Instructor) =>
            instructor.id === data.instructor.id ? data.instructor : instructor
          )
        }
      })
      
      toast.success('강사 정보가 업데이트되었습니다')
      options?.onSuccess?.(data, variables, context)
    },
    onError: (error, variables, context) => {
      // 실패 시 롤백
      if (context?.previousInstructorDetail) {
        queryClient.setQueryData(
          instructorQueryKeys.detail(context.instructorId),
          context.previousInstructorDetail
        )
      }
      
      if (context?.previousInstructorLists) {
        context.previousInstructorLists.forEach(([queryKey, data]: [any, any]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      
      const errorMessage = error instanceof Error ? error.message : '강사 정보 수정에 실패했습니다'
      toast.error(errorMessage)
      options?.onError?.(error, variables, context)
    },
    onSettled: (data, error, variables) => {
      // 해당 강사의 캐시 무효화
      queryClient.invalidateQueries({ queryKey: instructorQueryKeys.detail(variables.instructorId) })
    },
  })
}

/**
 * 강사 삭제 Mutation Hook - Soft Delete
 */
export function useDeleteInstructor(
  options?: UseMutationOptions<{ success: boolean }, Error, { instructorId: string }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ instructorId }: { instructorId: string }) => {
      return deleteInstructor(instructorId)
    },
    onMutate: async ({ instructorId }) => {
      // 진행 중인 쿼리들 취소
      await queryClient.cancelQueries({ queryKey: instructorQueryKeys.all })

      // 삭제될 강사 정보 백업
      const instructorToDelete = queryClient.getQueryData(
        instructorQueryKeys.detail(instructorId)
      ) as Instructor | undefined

      // 이전 목록 데이터 백업
      const previousInstructorLists = queryClient.getQueriesData({ 
        queryKey: instructorQueryKeys.lists() 
      })

      // Optimistic Update: 목록에서 제거
      queryClient.setQueryData(instructorQueryKeys.lists(), (old: any) => {
        if (!old) return old
        return {
          ...old,
          instructors: old.instructors.filter((instructor: Instructor) => instructor.id !== instructorId),
          pagination: { ...old.pagination, total: old.pagination.total - 1 }
        }
      })

      return { instructorToDelete, previousInstructorLists, instructorId }
    },
    onSuccess: (data, variables, context) => {
      const instructorName = context?.instructorToDelete?.user?.name || '강사'
      
      toast.success(`${instructorName}이 삭제되었습니다`)
      options?.onSuccess?.(data, variables, context)
    },
    onError: (error, variables, context) => {
      // 실패 시 롤백
      if (context?.previousInstructorLists) {
        context.previousInstructorLists.forEach(([queryKey, data]: [any, any]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      
      const errorMessage = error instanceof Error ? error.message : '강사 삭제에 실패했습니다'
      toast.error(errorMessage)
      options?.onError?.(error, variables, context)
    },
    onSettled: (data, error, variables) => {
      // 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: instructorQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: instructorQueryKeys.detail(variables.instructorId) })
    },
  })
}