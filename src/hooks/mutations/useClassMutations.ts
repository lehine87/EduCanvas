import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient, queryKeys, getErrorMessage } from '@/lib/api-client'
import type { Class, ClassFormData } from '@/types/class.types'

// 클래스 생성
export function useCreateClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ClassFormData) =>
      apiClient.post<{ success: true; data: { class: Class }; message: string }>('/api/classes', data),
    onSuccess: (response) => {
      const newClass = response.data.class
      toast.success('클래스가 성공적으로 생성되었습니다.')
      // 클래스 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.classes() })
      // 대시보드 통계 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.classesDashboardStats() })
      // 새로 생성된 클래스 데이터 캐시에 설정
      queryClient.setQueryData(queryKeys.class(newClass.id), newClass)
    },
    onError: (error) => {
      toast.error(`클래스 생성 실패: ${getErrorMessage(error)}`)
    }
  })
}

// 클래스 수정
export function useUpdateClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ classId, data }: { classId: string; data: Partial<ClassFormData> }) =>
      apiClient.put<{ success: true; data: { class: Class }; message: string }>(`/api/classes/${classId}`, data),
    onSuccess: (response, { classId }) => {
      const updatedClass = response.data.class
      toast.success('클래스가 성공적으로 수정되었습니다.')
      // 특정 클래스 쿼리 업데이트
      queryClient.setQueryData(queryKeys.class(classId), updatedClass)
      // 클래스 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.classes() })
      // 대시보드 통계 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.classesDashboardStats() })
    },
    onError: (error) => {
      toast.error(`클래스 수정 실패: ${getErrorMessage(error)}`)
    }
  })
}

// 클래스 삭제
export function useDeleteClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (classId: string) =>
      apiClient.delete<{ success: true; data: any; message: string }>(`/api/classes/${classId}`),
    onSuccess: (_, classId) => {
      toast.success('클래스가 성공적으로 삭제되었습니다.')
      // 특정 클래스 쿼리 제거
      queryClient.removeQueries({ queryKey: queryKeys.class(classId) })
      // 클래스-학생 관계 쿼리도 제거
      queryClient.removeQueries({ queryKey: queryKeys.classStudents(classId) })
      // 클래스 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.classes() })
      // 대시보드 통계 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.classesDashboardStats() })
    },
    onError: (error) => {
      toast.error(`클래스 삭제 실패: ${getErrorMessage(error)}`)
    }
  })
}

// 클래스 상태 변경
export function useUpdateClassStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ classId, status }: { classId: string; status: 'active' | 'inactive' | 'suspended' }) =>
      apiClient.patch<{ success: true; data: { class: Class }; message: string }>(`/api/classes/${classId}/status`, { status }),
    onSuccess: (response, { classId, status }) => {
      const updatedClass = response.data.class
      const statusText = status === 'active' ? '활성화' : status === 'inactive' ? '비활성화' : '정지'
      toast.success(`클래스가 ${statusText}되었습니다.`)

      // 특정 클래스 쿼리 업데이트
      queryClient.setQueryData(queryKeys.class(classId), updatedClass)
      // 클래스 목록 쿼리 무효화 (상태 필터링에 영향)
      queryClient.invalidateQueries({ queryKey: queryKeys.classes() })
      // 대시보드 통계 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.classesDashboardStats() })
    },
    onError: (error) => {
      toast.error(`클래스 상태 변경 실패: ${getErrorMessage(error)}`)
    }
  })
}

// 일괄 클래스 삭제
export function useBulkDeleteClasses() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (classIds: string[]) =>
      apiClient.delete<{ success: true; data: any; message: string }>('/api/classes/bulk-delete', {
        body: JSON.stringify({ classIds }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: (_, classIds) => {
      toast.success(`${classIds.length}개의 클래스가 성공적으로 삭제되었습니다.`)

      // 삭제된 클래스들의 쿼리 제거
      classIds.forEach(classId => {
        queryClient.removeQueries({ queryKey: queryKeys.class(classId) })
        queryClient.removeQueries({ queryKey: queryKeys.classStudents(classId) })
      })

      // 클래스 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.classes() })
      // 대시보드 통계 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.classesDashboardStats() })
    },
    onError: (error) => {
      toast.error(`클래스 일괄 삭제 실패: ${getErrorMessage(error)}`)
    }
  })
}

// 클래스 복제
export function useDuplicateClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ classId, name }: { classId: string; name: string }) =>
      apiClient.post<{ success: true; data: { class: Class }; message: string }>(`/api/classes/${classId}/duplicate`, { name }),
    onSuccess: (response, { name }) => {
      const duplicatedClass = response.data.class
      toast.success(`클래스 "${name}"가 성공적으로 복제되었습니다.`)

      // 새로 생성된 클래스 데이터 캐시에 설정
      queryClient.setQueryData(queryKeys.class(duplicatedClass.id), duplicatedClass)
      // 클래스 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.classes() })
      // 대시보드 통계 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.classesDashboardStats() })
    },
    onError: (error) => {
      toast.error(`클래스 복제 실패: ${getErrorMessage(error)}`)
    }
  })
}