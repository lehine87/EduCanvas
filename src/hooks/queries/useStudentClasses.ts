'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface StudentClassQueryParams {
  studentId: string
  tenantId: string
  status?: 'all' | 'active' | 'completed' | 'suspended' | 'cancelled'
  search?: string
  limit?: number
  offset?: number
}

export interface AddClassToStudentData {
  tenantId: string
  classId: string
  originalPrice?: number
  discountAmount?: number
  finalPrice?: number
  paymentPlan?: string
  hoursTotal?: number
  sessionsTotal?: number
  notes?: string
}

// 학생별 클래스 목록 조회
export function useStudentClasses(params: StudentClassQueryParams) {
  return useQuery({
    queryKey: [
      'student-classes', 
      params.studentId, 
      params.tenantId, 
      params.status || 'all',
      params.search || '',
      params.limit || 100,
      params.offset || 0
    ],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        tenantId: params.tenantId,
        status: params.status || 'all',
        limit: String(params.limit || 100),
        offset: String(params.offset || 0)
      })
      
      if (params.search?.trim()) {
        searchParams.append('search', params.search.trim())
      }

      const response = await fetch(`/api/students/${params.studentId}/classes?${searchParams}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch student classes')
      }
      return response.json()
    },
    enabled: !!params.studentId && !!params.tenantId,
    staleTime: 30000, // 30초 동안 fresh 상태 유지
    gcTime: 5 * 60 * 1000, // 5분 동안 캐시 유지
  })
}

// 학생에게 클래스 등록
export function useAddClassToStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      studentId,
      ...data
    }: AddClassToStudentData & { studentId: string }) => {
      const response = await fetch(`/api/students/${studentId}/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add class to student')
      }
      return response.json()
    },
    onSuccess: (data, variables) => {
      // 학생 클래스 목록 갱신
      queryClient.invalidateQueries({ 
        queryKey: ['student-classes', variables.studentId] 
      })
      
      // 클래스 학생 목록 갱신
      queryClient.invalidateQueries({ 
        queryKey: ['class-students', variables.classId] 
      })
      
      // 학생 정보 갱신
      queryClient.invalidateQueries({ 
        queryKey: ['students'] 
      })
      
      // 클래스 정보 갱신 (수강생 수 업데이트를 위해)
      queryClient.invalidateQueries({ 
        queryKey: ['classes'] 
      })
    }
  })
}

// 학생의 클래스 등록 해제
export function useRemoveClassFromStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      enrollmentId, 
      tenantId, 
      forceDelete = false 
    }: { 
      enrollmentId: string
      tenantId: string
      forceDelete?: boolean 
    }) => {
      const response = await fetch(
        `/api/enrollments/${enrollmentId}?tenantId=${tenantId}&forceDelete=${forceDelete}`, 
        {
          method: 'DELETE'
        }
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to remove class from student')
      }
      return response.json()
    },
    onSuccess: (data, variables) => {
      // 관련된 모든 쿼리 무효화
      queryClient.invalidateQueries({ 
        queryKey: ['student-classes'] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['class-students'] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['students'] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['classes'] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['enrollments'] 
      })
    }
  })
}

// 특정 enrollment 정보 조회
export function useEnrollment(enrollmentId: string, tenantId: string) {
  return useQuery({
    queryKey: ['enrollment', enrollmentId, tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/enrollments/${enrollmentId}?tenantId=${tenantId}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch enrollment')
      }
      return response.json()
    },
    enabled: !!enrollmentId && !!tenantId,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  })
}

// enrollment 정보 업데이트
export function useUpdateEnrollment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      ...data
    }: {
      enrollmentId: string
      tenantId: string
      [key: string]: any
    }) => {
      const response = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update enrollment')
      }
      return response.json()
    },
    onSuccess: (data, variables) => {
      // enrollment 쿼리 갱신
      queryClient.invalidateQueries({ 
        queryKey: ['enrollment', variables.enrollmentId] 
      })
      
      // 관련 목록들 갱신
      queryClient.invalidateQueries({ 
        queryKey: ['student-classes'] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['class-students'] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['enrollments'] 
      })
    }
  })
}