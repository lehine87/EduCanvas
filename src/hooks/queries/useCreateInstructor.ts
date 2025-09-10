/**
 * @file useCreateInstructor.ts
 * @description 강사 생성을 위한 React Query Mutation Hook
 * @module T-V2-012
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createInstructor } from '@/lib/api/instructors.api'
import { instructorKeys } from './useInstructors'
import { useToast } from '@/components/ui/use-toast'
import type { CreateInstructorRequest, Instructor } from '@/types/instructor.types'

/**
 * 강사 생성 Mutation Hook
 */
export function useCreateInstructor() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateInstructorRequest & { user_data?: { email: string; name: string; phone?: string } }) =>
      createInstructor(data),
    
    onSuccess: (response, variables) => {
      // 성공 토스트
      toast({
        title: '강사 등록 완료',
        description: `${response.instructor.user?.name || '새 강사'}가 성공적으로 등록되었습니다.`,
      })

      // 관련 쿼리 무효화 (목록 새로고침)
      queryClient.invalidateQueries({
        queryKey: instructorKeys.lists(),
      })

      // 새로 생성된 강사를 캐시에 추가 (낙관적 업데이트)
      queryClient.setQueryData(
        instructorKeys.detail(response.instructor.id),
        response.instructor
      )
    },

    onError: (error: any, variables) => {
      console.error('강사 생성 실패:', error)
      
      toast({
        title: '강사 등록 실패',
        description: error?.message || '강사 등록 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    },

    // 낙관적 업데이트 (선택사항)
    onMutate: async (newInstructor) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ 
        queryKey: instructorKeys.lists() 
      })

      // 현재 데이터 스냅샷 저장 (롤백용)
      const previousInstructors = queryClient.getQueriesData({
        queryKey: instructorKeys.lists(),
      })

      // 로딩 상태 표시를 위한 토스트 (선택사항)
      toast({
        title: '강사 등록 중...',
        description: '잠시만 기다려 주세요.',
      })

      // 롤백을 위한 이전 데이터 반환
      return { previousInstructors }
    },

    // 에러 발생 시 롤백
    onSettled: (data, error, variables, context) => {
      if (error && context?.previousInstructors) {
        // 이전 데이터로 롤백
        context.previousInstructors.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData)
        })
      }

      // 최종적으로 서버와 동기화
      queryClient.invalidateQueries({
        queryKey: instructorKeys.lists(),
      })
    },
  })
}

/**
 * 빠른 강사 등록 Hook (기본값 포함)
 */
export function useQuickCreateInstructor() {
  const createMutation = useCreateInstructor()

  return {
    ...createMutation,
    createWithDefaults: (basicInfo: {
      name: string
      email: string
      phone?: string
      department: string
      employment_type?: '정규직' | '계약직' | '파트타임'
    }) => {
      const createData: CreateInstructorRequest & { user_data: any } = {
        user_id: '', // 백엔드에서 생성
        staff_info: {
          employee_id: `EMP${Date.now().toString().slice(-6)}`, // 임시 사번
          employment_type: basicInfo.employment_type || '정규직',
          department: basicInfo.department,
          position: '강사',
          instructor_info: {
            teaching_level: '중급',
            subjects: [],
            certifications: [],
            specialties: [],
            max_classes_per_week: 20,
          },
        },
        hire_date: new Date().toISOString().split('T')[0],
        bio: '',
        qualification: '',
        specialization: '',
        user_data: {
          name: basicInfo.name,
          email: basicInfo.email,
          phone: basicInfo.phone,
        },
      }

      return createMutation.mutate(createData)
    },
  }
}