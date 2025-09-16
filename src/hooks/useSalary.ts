import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  SalaryCalculationRequest, 
  SalaryCalculationResult, 
  SalaryPolicy,
  SalaryHistoryRecord 
} from '@/types/salary.types'

// 급여 계산 API 함수들
const salaryApi = {
  // 급여 계산
  calculateSalary: async (request: SalaryCalculationRequest): Promise<{ calculation: SalaryCalculationResult, preview_mode: boolean }> => {
    const response = await fetch('/api/salary/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '급여 계산에 실패했습니다.')
    }
    
    const data = await response.json()
    return data.data
  },

  // 급여 정책 목록 조회
  getSalaryPolicies: async (params?: { active?: boolean, type?: string }): Promise<{ policies: SalaryPolicy[] }> => {
    const searchParams = new URLSearchParams()
    if (params?.active !== undefined) searchParams.set('active', params.active.toString())
    if (params?.type) searchParams.set('type', params.type)
    
    const response = await fetch(`/api/salary/policies?${searchParams}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '급여 정책 조회에 실패했습니다.')
    }
    
    const data = await response.json()
    return data.data
  },

  // 급여 정책 상세 조회
  getSalaryPolicy: async (id: string): Promise<{ policy: SalaryPolicy }> => {
    const response = await fetch(`/api/salary/policies/${id}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '급여 정책 조회에 실패했습니다.')
    }
    
    const data = await response.json()
    return data.data
  },

  // 급여 정책 생성
  createSalaryPolicy: async (policy: Omit<SalaryPolicy, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<{ policy: SalaryPolicy }> => {
    const response = await fetch('/api/salary/policies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '급여 정책 생성에 실패했습니다.')
    }
    
    const data = await response.json()
    return data.data
  },

  // 급여 정책 수정
  updateSalaryPolicy: async (id: string, policy: Partial<SalaryPolicy>): Promise<{ policy: SalaryPolicy }> => {
    const response = await fetch(`/api/salary/policies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '급여 정책 수정에 실패했습니다.')
    }
    
    const data = await response.json()
    return data.data
  },

  // 급여 정책 삭제
  deleteSalaryPolicy: async (id: string): Promise<{ policy: SalaryPolicy }> => {
    const response = await fetch(`/api/salary/policies/${id}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '급여 정책 삭제에 실패했습니다.')
    }
    
    const data = await response.json()
    return data.data
  }
}

// Query Keys
export const salaryQueryKeys = {
  all: ['salary'] as const,
  calculations: () => [...salaryQueryKeys.all, 'calculations'] as const,
  calculation: (instructorId: string, month: string) => 
    [...salaryQueryKeys.calculations(), instructorId, month] as const,
  policies: () => [...salaryQueryKeys.all, 'policies'] as const,
  policy: (id: string) => [...salaryQueryKeys.policies(), id] as const,
  activePolicies: () => [...salaryQueryKeys.policies(), 'active'] as const,
}

// 급여 계산 훅
export function useSalaryCalculation(request: SalaryCalculationRequest, enabled: boolean = false) {
  return useQuery({
    queryKey: salaryQueryKeys.calculation(request.instructor_id, request.month),
    queryFn: () => salaryApi.calculateSalary(request),
    enabled,
    staleTime: 5 * 60 * 1000, // 5분
    retry: 1
  })
}

// 급여 계산 미리보기 훅
export function useSalaryPreview() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: salaryApi.calculateSalary,
    onSuccess: (data) => {
      // 미리보기 결과는 캐시하지 않음
      console.log('급여 계산 미리보기 완료:', data.calculation.net_salary)
    },
    onError: (error) => {
      console.error('급여 계산 미리보기 실패:', error)
    }
  })
}

// 급여 정책 목록 훅
export function useSalaryPolicies(params?: { active?: boolean, type?: string }) {
  return useQuery({
    queryKey: params?.active ? salaryQueryKeys.activePolicies() : salaryQueryKeys.policies(),
    queryFn: () => salaryApi.getSalaryPolicies(params),
    staleTime: 10 * 60 * 1000, // 10분
  })
}

// 급여 정책 상세 훅
export function useSalaryPolicy(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: salaryQueryKeys.policy(id),
    queryFn: () => salaryApi.getSalaryPolicy(id),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000,
  })
}

// 급여 정책 생성 훅
export function useCreateSalaryPolicy() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: salaryApi.createSalaryPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryQueryKeys.policies() })
    },
    onError: (error) => {
      console.error('급여 정책 생성 실패:', error)
    }
  })
}

// 급여 정책 수정 훅
export function useUpdateSalaryPolicy() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, policy }: { id: string, policy: Partial<SalaryPolicy> }) => 
      salaryApi.updateSalaryPolicy(id, policy),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: salaryQueryKeys.policies() })
      queryClient.setQueryData(salaryQueryKeys.policy(data.policy.id), data)
    },
    onError: (error) => {
      console.error('급여 정책 수정 실패:', error)
    }
  })
}

// 급여 정책 삭제 훅
export function useDeleteSalaryPolicy() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: salaryApi.deleteSalaryPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryQueryKeys.policies() })
    },
    onError: (error) => {
      console.error('급여 정책 삭제 실패:', error)
    }
  })
}

// 급여 계산 저장 훅
export function useSaveSalaryCalculation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (request: SalaryCalculationRequest & { preview_mode: false }) => 
      salaryApi.calculateSalary(request),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        salaryQueryKeys.calculation(variables.instructor_id, variables.month),
        data
      )
      queryClient.invalidateQueries({ queryKey: salaryQueryKeys.calculations() })
    },
    onError: (error) => {
      console.error('급여 계산 저장 실패:', error)
    }
  })
}

// 급여 정책 타입별 기본값 생성 헬퍼
export function createDefaultPolicyByType(type: SalaryPolicy['type']): Partial<SalaryPolicy> {
  const base = {
    name: '',
    type,
    is_active: true
  }

  switch (type) {
    case 'fixed_monthly':
      return {
        ...base,
        name: '고정 월급제',
        base_amount: 2500000
      }
    
    case 'fixed_hourly':
      return {
        ...base,
        name: '시급제',
        hourly_rate: 35000
      }
    
    case 'commission':
      return {
        ...base,
        name: '수수료제',
        commission_rate: 15,
        commission_basis: 'revenue'
      }
    
    case 'tiered_commission':
      return {
        ...base,
        name: '누진 수수료제',
        tiers: [
          { id: '1', min_amount: 0, max_amount: 5000000, commission_rate: 10 },
          { id: '2', min_amount: 5000000, max_amount: 10000000, commission_rate: 15 },
          { id: '3', min_amount: 10000000, max_amount: null, commission_rate: 20 }
        ]
      }
    
    case 'student_based':
      return {
        ...base,
        name: '학생수 기준제',
        student_rate: 100000,
        min_students: 1,
        max_students: 30
      }
    
    case 'hybrid':
      return {
        ...base,
        name: '혼합형',
        base_amount: 1800000,
        commission_rate: 8,
        performance_threshold: 3000000
      }
    
    case 'guaranteed_minimum':
      return {
        ...base,
        name: '최저 보장제',
        minimum_guaranteed: 2000000,
        commission_rate: 12,
        commission_basis: 'revenue'
      }
    
    default:
      return base
  }
}

// 급여 정책 유효성 검증 헬퍼
export function validateSalaryPolicy(policy: Partial<SalaryPolicy>): { isValid: boolean, errors: string[] } {
  const errors: string[] = []

  if (!policy.name?.trim()) {
    errors.push('정책명은 필수입니다.')
  }

  if (!policy.type) {
    errors.push('정책 타입은 필수입니다.')
  } else {
    switch (policy.type) {
      case 'fixed_monthly':
        if (!policy.base_amount || policy.base_amount <= 0) {
          errors.push('고정 월급제는 기본급이 필요합니다.')
        }
        break
      
      case 'fixed_hourly':
        if (!policy.hourly_rate || policy.hourly_rate <= 0) {
          errors.push('시급제는 시급이 필요합니다.')
        }
        break
      
      case 'commission':
        if (!policy.commission_rate || policy.commission_rate <= 0 || policy.commission_rate > 100) {
          errors.push('수수료율은 0-100 사이여야 합니다.')
        }
        if (!policy.commission_basis) {
          errors.push('수수료 기준을 선택해주세요.')
        }
        break
      
      case 'student_based':
        if (!policy.student_rate || policy.student_rate <= 0) {
          errors.push('학생당 단가는 필수입니다.')
        }
        break
      
      case 'hybrid':
        if (!policy.base_amount || policy.base_amount <= 0) {
          errors.push('기본급은 필수입니다.')
        }
        if (!policy.commission_rate || policy.commission_rate <= 0 || policy.commission_rate > 100) {
          errors.push('수수료율은 0-100 사이여야 합니다.')
        }
        break
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}