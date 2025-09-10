/**
 * @file useUpdateInstructor.ts
 * @description 강사 수정을 위한 React Query Mutation Hook
 * @module T-V2-012
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateInstructor } from '@/lib/api/staff.api'
import { instructorKeys } from './useInstructors'
import { useToast } from '@/components/ui/use-toast'
import type { UpdateInstructorRequest, Instructor } from '@/types/staff.types'

/**
 * 강사 수정 Mutation Hook
 */
export function useUpdateInstructor(instructorId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (updates: UpdateInstructorRequest) =>
      updateInstructor(instructorId, updates),
    
    onSuccess: (response, variables) => {
      // 성공 토스트
      toast({
        title: '강사 정보 수정 완료',
        description: `${response.instructor.user?.name || '강사'} 정보가 성공적으로 수정되었습니다.`,
      })

      // 상세 정보 캐시 업데이트
      queryClient.setQueryData(
        instructorKeys.detail(instructorId),
        response.instructor
      )

      // 목록 쿼리 무효화 (변경사항 반영)
      queryClient.invalidateQueries({
        queryKey: instructorKeys.lists(),
      })
    },

    // 낙관적 업데이트
    onMutate: async (updates) => {
      // 진행 중인 상세 쿼리 취소
      await queryClient.cancelQueries({ 
        queryKey: instructorKeys.detail(instructorId) 
      })

      // 현재 강사 데이터 가져오기
      const previousInstructor = queryClient.getQueryData<Instructor>(
        instructorKeys.detail(instructorId)
      )

      // 낙관적으로 업데이트된 데이터 생성
      if (previousInstructor) {
        const optimisticInstructor: Instructor = {
          ...previousInstructor,
          ...updates,
          staff_info: {
            ...(previousInstructor.staff_info as any || {}),
            ...(updates.staff_info || {}),
          },
          updated_at: new Date().toISOString(),
        }

        // 캐시에 낙관적 업데이트 적용
        queryClient.setQueryData(
          instructorKeys.detail(instructorId),
          optimisticInstructor
        )
      }

      // 롤백용 이전 데이터 반환
      return { previousInstructor }
    },

    // 에러 발생 시 롤백 및 에러 처리
    onError: (error: any, variables, context) => {
      if (context?.previousInstructor) {
        queryClient.setQueryData(
          instructorKeys.detail(instructorId),
          context.previousInstructor
        )
      }

      console.error('강사 수정 실패:', error)
      
      toast({
        title: '강사 수정 실패',
        description: error?.message || '강사 정보 수정 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    },

    onSettled: () => {
      // 최종적으로 서버와 동기화
      queryClient.invalidateQueries({
        queryKey: instructorKeys.detail(instructorId),
      })
    },
  })
}

/**
 * 강사 상태 변경 전용 Hook
 */
export function useUpdateInstructorStatus(instructorId: string) {
  const updateMutation = useUpdateInstructor(instructorId)

  return {
    ...updateMutation,
    activate: () => updateMutation.mutate({ status: 'active' }),
    deactivate: () => updateMutation.mutate({ status: 'inactive' }),
    setPending: () => updateMutation.mutate({ status: 'pending' }),
  }
}

/**
 * 강사 기본 정보 수정 Hook (staff_info 전용)
 */
export function useUpdateInstructorProfile(instructorId: string) {
  const updateMutation = useUpdateInstructor(instructorId)

  return {
    mutate: updateMutation.mutate,
    mutateAsync: updateMutation.mutateAsync,
    isLoading: updateMutation.isPending,
    isError: updateMutation.isError,
    error: updateMutation.error,
    updateProfile: (profileData: {
      department?: string
      position?: string
      employment_type?: '정규직' | '계약직' | '파트타임'
      teaching_level?: '초급' | '중급' | '고급'
      subjects?: string[]
      certifications?: string[]
      specialties?: string[]
      max_classes_per_week?: number
    }) => {
      const updates: UpdateInstructorRequest = {
        staff_info: {
          department: profileData.department,
          position: profileData.position,
          employment_type: profileData.employment_type,
          instructor_info: {
            teaching_level: profileData.teaching_level,
            subjects: profileData.subjects,
            certifications: profileData.certifications,
            specialties: profileData.specialties,
            max_classes_per_week: profileData.max_classes_per_week,
          },
        },
      }

      return updateMutation.mutate(updates)
    },
  }
}