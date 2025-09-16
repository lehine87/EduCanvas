import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, queryKeys, getErrorMessage } from '@/lib/api-client'
import type { Instructor, CreateInstructorRequest, UpdateInstructorRequest } from '@/types/staff.types'
import { toast } from 'sonner'

/**
 * 직원 생성 Mutation Hook - API Client 패턴 적용
 */
export function useCreateStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateInstructorRequest & { user_data?: { email: string; name: string; phone?: string } }) =>
      apiClient.post<{ instructor: Instructor, message: string }>('/api/staff', data),
    onSuccess: (data) => {
      toast.success(data.message || '직원이 성공적으로 등록되었습니다.')
      // 직원 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.staff() })
      // 새로 생성된 직원 데이터 캐시에 설정
      queryClient.setQueryData(queryKeys.staffMember(data.instructor.id), data.instructor)
    },
    onError: (error) => {
      toast.error(`직원 등록 실패: ${getErrorMessage(error)}`)
    }
  })
}

/**
 * 직원 수정 Mutation Hook
 */
export function useUpdateStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ staffId, updates }: { staffId: string; updates: UpdateInstructorRequest }) =>
      apiClient.put<{ instructor: Instructor }>(`/api/staff/${staffId}`, updates),
    onSuccess: (data, { staffId }) => {
      toast.success('직원 정보가 성공적으로 업데이트되었습니다.')
      // 특정 직원 쿼리 업데이트
      queryClient.setQueryData(queryKeys.staffMember(staffId), data.instructor)
      // 직원 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.staff() })
    },
    onError: (error) => {
      toast.error(`직원 정보 수정 실패: ${getErrorMessage(error)}`)
    }
  })
}

/**
 * 직원 삭제 Mutation Hook
 */
export function useDeleteStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (staffId: string) =>
      apiClient.delete<{ success: boolean }>(`/api/staff/${staffId}`),
    onSuccess: (_, staffId) => {
      toast.success('직원이 성공적으로 삭제되었습니다.')
      // 특정 직원 쿼리 제거
      queryClient.removeQueries({ queryKey: queryKeys.staffMember(staffId) })
      // 직원 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.staff() })
    },
    onError: (error) => {
      toast.error(`직원 삭제 실패: ${getErrorMessage(error)}`)
    }
  })
}

/**
 * 직원 상태 변경 Mutation Hook
 */
export function useUpdateStaffStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ staffId, status }: { staffId: string; status: 'active' | 'inactive' | 'suspended' }) =>
      apiClient.patch<{ instructor: Instructor }>(`/api/staff/${staffId}/status`, { status }),
    onSuccess: (data, { staffId, status }) => {
      const statusText = status === 'active' ? '활성화' : status === 'inactive' ? '비활성화' : '정지'
      toast.success(`직원이 ${statusText}되었습니다.`)

      // 특정 직원 쿼리 업데이트
      queryClient.setQueryData(queryKeys.staffMember(staffId), data.instructor)
      // 직원 목록 쿼리 무효화 (상태 필터링에 영향)
      queryClient.invalidateQueries({ queryKey: queryKeys.staff() })
    },
    onError: (error) => {
      toast.error(`직원 상태 변경 실패: ${getErrorMessage(error)}`)
    }
  })
}

/**
 * 일괄 직원 삭제 Mutation Hook
 */
export function useBulkDeleteStaffs() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (staffIds: string[]) =>
      apiClient.delete<void>('/api/staff/bulk-delete', {
        body: JSON.stringify({ staffIds }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: (_, staffIds) => {
      toast.success(`${staffIds.length}명의 직원이 성공적으로 삭제되었습니다.`)

      // 삭제된 직원들의 쿼리 제거
      staffIds.forEach(staffId => {
        queryClient.removeQueries({ queryKey: queryKeys.staffMember(staffId) })
      })

      // 직원 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.staff() })
    },
    onError: (error) => {
      toast.error(`직원 일괄 삭제 실패: ${getErrorMessage(error)}`)
    }
  })
}

// 호환성을 위한 별칭
export const useCreateInstructor = useCreateStaff
export const useUpdateInstructor = useUpdateStaff
export const useDeleteInstructor = useDeleteStaff