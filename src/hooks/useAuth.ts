/**
 * 인증 관련 통합 훅
 *
 * Phase 3: 인증/온보딩 시스템 API Client 마이그레이션
 * - API Client 패턴 사용
 * - 타입 안전성 보장
 * - 에러 처리 표준화
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient, queryKeys, getErrorMessage } from '@/lib/api-client'
import type { OnboardingFormData, TenantSearchParams, EmailCheckParams, Tenant } from '@/lib/api-client'

interface SignUpData {
  email: string
  password: string
  full_name: string
}

/**
 * 온보딩 mutation
 */
export function useOnboarding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: OnboardingFormData) => apiClient.auth!.onboarding(data),
    onSuccess: (data) => {
      toast.success('온보딩이 완료되었습니다.')
      // 인증 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.auth() })
    },
    onError: (error) => {
      const message = getErrorMessage(error)
      toast.error(`온보딩 처리 실패: ${message}`)
    }
  })
}

/**
 * 테넌트 검색 query
 */
export function useTenantSearch(
  params: TenantSearchParams,
  { enabled = false }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: queryKeys.tenantSearch(params as Record<string, unknown>),
    queryFn: () => apiClient.auth!.searchTenants(params),
    enabled: enabled && !!params.searchQuery && params.searchQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  })
}

/**
 * 테넌트 검색 mutation (수동 트리거용)
 */
export function useTenantSearchMutation() {
  return useMutation({
    mutationFn: (params: TenantSearchParams) => apiClient.auth!.searchTenants(params),
    onError: (error) => {
      const message = getErrorMessage(error)
      toast.error(`학원 검색 실패: ${message}`)
    }
  })
}

/**
 * 이메일 중복 체크 query
 */
export function useEmailCheck(
  email: string,
  { enabled = false }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: queryKeys.emailCheck(email),
    queryFn: () => apiClient.auth!.checkEmail({ email }),
    enabled: enabled && !!email && email.includes('@'),
    staleTime: 2 * 60 * 1000, // 2분 (짧은 캐시)
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * 이메일 중복 체크 mutation (수동 트리거용)
 */
export function useEmailCheckMutation() {
  return useMutation({
    mutationFn: (params: EmailCheckParams) => apiClient.auth!.checkEmail(params),
    onError: (error) => {
      const message = getErrorMessage(error)
      console.error('이메일 체크 실패:', message)
    }
  })
}

/**
 * 회원가입 mutation
 */
export function useSignUpMutation() {
  return useMutation({
    mutationFn: (data: SignUpData) => apiClient.post<{ user: any }>('/api/auth/signup', data),
    onSuccess: () => {
      toast.success('회원가입이 완료되었습니다. 이메일을 확인해주세요.')
    },
    onError: (error) => {
      const message = getErrorMessage(error)
      toast.error(`회원가입 실패: ${message}`)
    }
  })
}

/**
 * 통합 인증 훅 (여러 기능을 조합해서 사용할 때)
 */
export function useAuthOperations() {
  const onboarding = useOnboarding()
  const tenantSearch = useTenantSearchMutation()
  const emailCheck = useEmailCheckMutation()
  const signUp = useSignUpMutation()

  return {
    onboarding,
    tenantSearch,
    emailCheck,
    signUp,

    // 편의 메소드들
    async submitOnboarding(data: OnboardingFormData) {
      return onboarding.mutateAsync(data)
    },

    async searchTenants(params: TenantSearchParams) {
      return tenantSearch.mutateAsync(params)
    },

    async checkEmail(email: string) {
      return emailCheck.mutateAsync({ email })
    },

    async submitSignUp(data: SignUpData) {
      return signUp.mutateAsync(data)
    },

    // 로딩 상태 통합
    isLoading: onboarding.isPending || tenantSearch.isPending || emailCheck.isPending || signUp.isPending
  }
}