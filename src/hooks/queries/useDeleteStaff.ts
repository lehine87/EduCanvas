/**
 * @file useDeleteInstructor.ts
 * @description 강사 삭제를 위한 React Query Mutation Hook
 * @module T-V2-012
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteInstructor } from '@/lib/api/staff.api'
import { instructorKeys } from './useStaffs'
import { useToast } from '@/components/ui/use-toast'
import type { Instructor } from '@/types/staff.types'

/**
 * 강사 삭제 Mutation Hook
 */
export function useDeleteInstructor() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (instructorId: string) => deleteInstructor(instructorId),
    
    onSuccess: (response, instructorId) => {
      // 성공 토스트
      toast({
        title: '강사 삭제 완료',
        description: '강사가 성공적으로 삭제(비활성화)되었습니다.',
      })

      // 상세 캐시에서 제거
      queryClient.removeQueries({
        queryKey: instructorKeys.detail(instructorId),
      })

      // 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: instructorKeys.lists(),
      })
    },

    // 낙관적 업데이트 (목록에서 즉시 제거)
    onMutate: async (instructorId) => {
      // 진행 중인 쿼리들 취소
      await queryClient.cancelQueries({ 
        queryKey: instructorKeys.lists() 
      })

      // 현재 목록 데이터들 스냅샷 저장
      const previousQueries = queryClient.getQueriesData({
        queryKey: instructorKeys.lists(),
      })

      // 각 목록에서 해당 강사를 낙관적으로 제거
      queryClient.setQueriesData(
        { queryKey: instructorKeys.lists() },
        (oldData: any) => {
          if (!oldData?.instructors) return oldData

          return {
            ...oldData,
            instructors: oldData.instructors.filter(
              (instructor: Instructor) => instructor.id !== instructorId
            ),
            pagination: {
              ...oldData.pagination,
              total: Math.max(0, (oldData.pagination?.total || 0) - 1),
            },
          }
        }
      )

      // 상세 데이터도 제거
      const previousInstructor = queryClient.getQueryData(
        instructorKeys.detail(instructorId)
      )

      queryClient.removeQueries({
        queryKey: instructorKeys.detail(instructorId),
      })

      // 롤백을 위한 이전 데이터 반환
      return { previousQueries, previousInstructor, instructorId }
    },

    // 에러 발생 시 롤백 및 에러 처리
    onError: (error: any, instructorId, context) => {
      if (context?.previousQueries) {
        // 목록 데이터 롤백
        context.previousQueries.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData)
        })
      }

      if (context?.previousInstructor && context.instructorId) {
        // 상세 데이터 롤백
        queryClient.setQueryData(
          instructorKeys.detail(context.instructorId),
          context.previousInstructor
        )
      }

      // 에러 메시지 처리
      console.error('강사 삭제 실패:', error)
      
      let errorMessage = '강사 삭제 중 오류가 발생했습니다.'
      
      if (error?.status === 409) {
        errorMessage = '진행 중인 수업이 있는 강사는 삭제할 수 없습니다.'
      } else if (error?.status === 403) {
        errorMessage = '강사 삭제 권한이 없습니다.'
      } else if (error?.status === 404) {
        errorMessage = '해당 강사를 찾을 수 없습니다.'
      }
      
      toast({
        title: '강사 삭제 실패',
        description: error?.message || errorMessage,
        variant: 'destructive',
      })
    },

    onSettled: () => {
      // 최종적으로 서버와 동기화
      queryClient.invalidateQueries({
        queryKey: instructorKeys.lists(),
      })
    },
  })
}

/**
 * 강사 삭제 확인 Hook (안전장치 포함)
 */
export function useDeleteInstructorWithConfirm() {
  const deleteMutation = useDeleteInstructor()
  const { toast } = useToast()

  return {
    ...deleteMutation,
    deleteWithConfirm: (instructor: Instructor, onConfirm?: () => void) => {
      // 브라우저 기본 확인 다이얼로그 사용
      const confirmed = window.confirm(
        `정말로 "${instructor.user?.name || '이 강사'}"를 삭제하시겠습니까?\n\n` +
        '삭제된 강사는 비활성화되며, 진행 중인 수업이 있을 경우 삭제할 수 없습니다.'
      )

      if (confirmed) {
        onConfirm?.()
        deleteMutation.mutate(instructor.id)
      }
    },

    // 대량 삭제 (복수 선택)  
    deleteMultipleWithConfirm: (instructorIds: string[], onConfirm?: () => void) => {
      const confirmed = window.confirm(
        `선택된 ${instructorIds.length}명의 강사를 삭제하시겠습니까?\n\n` +
        '삭제된 강사들은 비활성화됩니다.'
      )

      if (confirmed) {
        onConfirm?.()
        
        // 순차적으로 삭제 (서버 부하 방지)
        instructorIds.forEach((id, index) => {
          setTimeout(() => {
            deleteMutation.mutate(id)
          }, index * 500) // 0.5초 간격
        })

        toast({
          title: '대량 삭제 시작',
          description: `${instructorIds.length}명의 강사 삭제를 시작합니다.`,
        })
      }
    },
  }
}