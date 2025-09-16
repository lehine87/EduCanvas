import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, queryKeys, getErrorMessage } from '@/lib/api-client'
import type { Student, StudentFormData } from '@/types/student.types'
import { toast } from 'sonner'

/**
 * 학생 생성 Mutation Hook - API Client 패턴 적용
 */
export function useCreateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: StudentFormData) =>
      apiClient.post<{ student: Student }>('/api/students', data),
    onSuccess: (data) => {
      toast.success('학생이 성공적으로 등록되었습니다.')
      // 학생 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.students() })
      // 학생 통계 쿼리 무효화 (신규 등록으로 인한 전체 통계 변경)
      queryClient.invalidateQueries({ queryKey: queryKeys.studentsDashboardStats() })
      // 새로 생성된 학생 데이터 캐시에 설정
      queryClient.setQueryData(queryKeys.student(data.student.id), data.student)
    },
    onError: (error) => {
      toast.error(`학생 등록 실패: ${getErrorMessage(error)}`)
    }
  })
}

/**
 * 학생 수정 Mutation Hook
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ studentId, updates }: { studentId: string; updates: Partial<StudentFormData> }) =>
      apiClient.put<{ student: Student }>(`/api/students/${studentId}`, updates),
    onSuccess: (data, { studentId }) => {
      toast.success('학생 정보가 성공적으로 업데이트되었습니다.')
      // 특정 학생 쿼리 업데이트
      queryClient.setQueryData(queryKeys.student(studentId), data.student)
      // 학생 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.students() })
      // 학생 통계 쿼리 무효화 (정보 변경으로 인한 통계 영향 가능)
      queryClient.invalidateQueries({ queryKey: queryKeys.studentsDashboardStats() })
    },
    onError: (error) => {
      toast.error(`학생 정보 수정 실패: ${getErrorMessage(error)}`)
    }
  })
}

/**
 * 학생 삭제 Mutation Hook
 */
export function useDeleteStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (studentId: string) =>
      apiClient.delete<{ success: boolean }>(`/api/students/${studentId}`),
    onSuccess: (_, studentId) => {
      toast.success('학생이 성공적으로 삭제되었습니다.')
      // 특정 학생 쿼리 제거
      queryClient.removeQueries({ queryKey: queryKeys.student(studentId) })
      // 학생 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.students() })
      // 학생 통계 쿼리 무효화 (학생 삭제로 인한 전체 통계 변경)
      queryClient.invalidateQueries({ queryKey: queryKeys.studentsDashboardStats() })
      // 학생-클래스 관계 쿼리도 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.studentClasses(studentId) })
    },
    onError: (error) => {
      toast.error(`학생 삭제 실패: ${getErrorMessage(error)}`)
    }
  })
}

/**
 * 학생 상태 변경 Mutation Hook
 */
export function useUpdateStudentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ studentId, status }: { studentId: string; status: 'active' | 'inactive' | 'graduated' | 'suspended' }) =>
      apiClient.patch<{ student: Student }>(`/api/students/${studentId}/status`, { status }),
    onSuccess: (data, { studentId, status }) => {
      const statusText = status === 'active' ? '활성화' : status === 'inactive' ? '비활성화' : status === 'graduated' ? '졸업 처리' : '정지'
      toast.success(`학생이 ${statusText}되었습니다.`)

      // 특정 학생 쿼리 업데이트
      queryClient.setQueryData(queryKeys.student(studentId), data.student)
      // 학생 목록 쿼리 무효화 (상태 필터링에 영향)
      queryClient.invalidateQueries({ queryKey: queryKeys.students() })
      // 학생 통계 쿼리 무효화 (상태 변경으로 인한 통계 변경)
      queryClient.invalidateQueries({ queryKey: queryKeys.studentsDashboardStats() })
    },
    onError: (error) => {
      toast.error(`학생 상태 변경 실패: ${getErrorMessage(error)}`)
    }
  })
}

/**
 * 일괄 학생 업데이트 Mutation Hook
 */
export function useBulkUpdateStudents() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { studentIds: string[]; updates: Partial<StudentFormData> }) =>
      apiClient.put<{ students: Student[] }>('/api/students/bulk-update', data),
    onSuccess: (data, { studentIds }) => {
      toast.success(`${studentIds.length}명의 학생 정보가 성공적으로 업데이트되었습니다.`)

      // 업데이트된 학생들의 개별 쿼리 업데이트
      data.students.forEach(student => {
        queryClient.setQueryData(queryKeys.student(student.id), student)
      })

      // 학생 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.students() })
      // 학생 통계 쿼리 무효화 (일괄 업데이트로 인한 통계 변경)
      queryClient.invalidateQueries({ queryKey: queryKeys.studentsDashboardStats() })
    },
    onError: (error) => {
      toast.error(`학생 일괄 업데이트 실패: ${getErrorMessage(error)}`)
    }
  })
}

/**
 * 일괄 학생 삭제 Mutation Hook
 */
export function useBulkDeleteStudents() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (studentIds: string[]) =>
      apiClient.delete<void>('/api/students/bulk-delete', {
        body: JSON.stringify({ studentIds }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: (_, studentIds) => {
      toast.success(`${studentIds.length}명의 학생이 성공적으로 삭제되었습니다.`)

      // 삭제된 학생들의 쿼리 제거
      studentIds.forEach(studentId => {
        queryClient.removeQueries({ queryKey: queryKeys.student(studentId) })
        queryClient.removeQueries({ queryKey: queryKeys.studentClasses(studentId) })
      })

      // 학생 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.students() })
      // 학생 통계 쿼리 무효화 (일괄 삭제로 인한 통계 변경)
      queryClient.invalidateQueries({ queryKey: queryKeys.studentsDashboardStats() })
      // 클래스-학생 관계 쿼리도 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.classStudents('') })
    },
    onError: (error) => {
      toast.error(`학생 일괄 삭제 실패: ${getErrorMessage(error)}`)
    }
  })
}

/**
 * 학생 배치 업데이트 Mutation Hook (학급 배정 등)
 */
export function useUpdateStudentBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { studentIds: string[]; batchData: any }) =>
      apiClient.post<{ students: Student[] }>('/api/students/batch', data),
    onSuccess: (data) => {
      toast.success('학생 배치 작업이 완료되었습니다.')

      // 모든 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.students() })
      queryClient.invalidateQueries({ queryKey: queryKeys.classes() })
      // 학생 통계 쿼리 무효화 (배치 업데이트로 인한 통계 변경)
      queryClient.invalidateQueries({ queryKey: queryKeys.studentsDashboardStats() })

      // 개별 학생 캐시 업데이트
      data.students.forEach(student => {
        queryClient.setQueryData(queryKeys.student(student.id), student)
      })
    },
    onError: (error) => {
      toast.error(`학생 배치 작업 실패: ${getErrorMessage(error)}`)
    }
  })
}