'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, queryKeys, getErrorMessage } from '@/lib/api-client'
import type { StandardApiResponse } from '@/lib/api-response'
import { toast } from 'sonner'

export interface ClassStudentQueryParams {
  classId: string
  tenantId: string
  status?: 'all' | 'active' | 'completed' | 'suspended' | 'cancelled'
  search?: string
  limit?: number
  offset?: number
}

export interface Student {
  id: string
  name: string
  student_number: string
  status: string
  phone?: string
  email?: string
  grade_level?: string
  school_name?: string
  profile_image?: string
  created_at: string
}

export interface Enrollment {
  id: string
  student_id: string
  class_id: string
  status: string
  enrollment_date: string
  students: Student
  position_in_class?: number
}

export interface ClassStudentsResponse {
  classInfo: {
    id: string
    name: string
    isActive: boolean
  }
  students: Enrollment[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface AddStudentToClassData {
  tenantId: string
  studentId: string
  originalPrice?: number
  discountAmount?: number
  finalPrice?: number
  paymentPlan?: string
  hoursTotal?: number
  sessionsTotal?: number
  notes?: string
}

// 클래스별 학생 목록 조회
export function useClassStudents(params: ClassStudentQueryParams) {
  const filters = {
    tenantId: params.tenantId,
    status: params.status || 'active',
    search: params.search,
    limit: params.limit || 100,
    offset: params.offset || 0
  }

  return useQuery({
    queryKey: queryKeys.classStudents(params.classId, filters),
    queryFn: () => {
      const apiParams: Record<string, string | number> = {
        tenantId: params.tenantId,
        status: params.status || 'active',
        limit: params.limit || 100,
        offset: params.offset || 0
      }

      if (params.search?.trim()) {
        apiParams.search = params.search.trim()
      }

      return apiClient.get<StandardApiResponse<ClassStudentsResponse>>(`/api/classes/${params.classId}/students`, {
        params: apiParams
      })
    },
    enabled: !!params.classId && !!params.tenantId,
    staleTime: 30000, // 30초 동안 fresh 상태 유지
    gcTime: 5 * 60 * 1000, // 5분 동안 캐시 유지
    select: (response) => response.data
  })
}

// 클래스에 학생 등록
export function useAddStudentToClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ classId, ...data }: AddStudentToClassData & { classId: string }) =>
      apiClient.post<StandardApiResponse<{ enrollment: Enrollment }>>(`/api/classes/${classId}/students`, data),
    onSuccess: (data, variables) => {
      toast.success('학생이 클래스에 성공적으로 등록되었습니다.')

      // 클래스 학생 목록 갱신
      queryClient.invalidateQueries({
        queryKey: queryKeys.classStudents(variables.classId)
      })

      // 학생 클래스 목록 갱신
      queryClient.invalidateQueries({
        queryKey: queryKeys.studentClasses(variables.studentId)
      })

      // 클래스 정보 갱신 (수강생 수 업데이트를 위해)
      queryClient.invalidateQueries({
        queryKey: queryKeys.classes()
      })

      // 학생 정보 갱신
      queryClient.invalidateQueries({
        queryKey: queryKeys.students()
      })

      // 대시보드 통계 갱신
      queryClient.invalidateQueries({
        queryKey: queryKeys.classesDashboardStats()
      })
    },
    onError: (error) => {
      toast.error(`학생 등록 실패: ${getErrorMessage(error)}`)
    }
  })
}

// 클래스에서 학생 제거 (수강 등록 해제)
export function useRemoveStudentFromClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      enrollmentId,
      tenantId,
      forceDelete = false
    }: {
      enrollmentId: string
      tenantId: string
      forceDelete?: boolean
    }) => apiClient.delete<StandardApiResponse<any>>(`/api/enrollments/${enrollmentId}`, {
      params: {
        tenantId,
        forceDelete
      }
    }),
    onSuccess: (data, variables) => {
      toast.success('학생이 클래스에서 제거되었습니다.')

      // 관련된 모든 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.classStudents('')
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.studentClasses('')
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.classes()
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.students()
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.enrollments()
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.classesDashboardStats()
      })
    },
    onError: (error) => {
      toast.error(`학생 제거 실패: ${getErrorMessage(error)}`)
    }
  })
}