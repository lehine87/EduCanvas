/**
 * API Routes 타입 정의
 * @description Next.js API Routes의 타입 안전성을 위한 요청/응답 타입
 * @version v1.0
 * @since 2025-08-14
 */

import type { Database } from './database'
import type { UserStatus } from './index'

// ================================================================
// 1. 공통 API 타입
// ================================================================

/**
 * 표준 API 응답 타입
 */
export interface ApiResponse<T = any> {
  success?: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * 페이지네이션 응답 타입
 */
export interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ================================================================
// 2. 인증 관련 API 타입
// ================================================================

/**
 * 로그인 요청 타입
 */
export interface LoginRequest {
  email: string
  password: string
}

/**
 * 로그인 응답 타입
 */
export interface LoginResponse {
  message: string
  user: {
    id: string
    email: string
  }
}

/**
 * 회원가입 요청 타입
 */
export interface SignupRequest {
  email: string
  password: string
  full_name: string
}

/**
 * 회원가입 응답 타입
 */
export interface SignupResponse {
  success: boolean
  user: {
    id: string
    email: string
    name: string
  }
  message: string
}

/**
 * 비밀번호 재설정 요청 타입
 */
export interface ResetPasswordRequest {
  email: string
}

/**
 * 이메일 확인 요청 타입
 */
export interface CheckEmailRequest {
  email: string
}

/**
 * 이메일 확인 응답 타입
 */
export interface CheckEmailResponse {
  exists: boolean
  status?: 'active' | 'pending' | 'blocked'
}

/**
 * 테넌트 검색 요청 타입
 */
export interface SearchTenantsRequest {
  searchType: 'name' | 'slug' | 'code'
  searchQuery: string
}

/**
 * 테넌트 검색 응답 타입
 */
export interface SearchTenantsResponse {
  tenants: Array<{
    id: string
    name: string
    slug: string
    contact_email?: string
    status: Database['public']['Enums']['tenant_status']
  }>
}

/**
 * 온보딩 요청 타입
 */
export interface OnboardingRequest {
  full_name: string
  phone?: string
  birth_date?: string
  gender?: Database['public']['Enums']['gender']
  address?: string
  emergency_contact?: string
  tenant_id: string
}

// ================================================================
// 3. 테넌트 관리 API 타입
// ================================================================

/**
 * 회원 승인/거부 요청 타입
 */
export interface ApproveMemberRequest {
  userId: string
  action: 'approve' | 'reject'
  tenantId: string
}

/**
 * 회원 업데이트 요청 타입
 */
export interface UpdateMemberRequest {
  userId: string
  tenantId: string
  updates: {
    role?: Database['public']['Enums']['user_role']
    status?: UserStatus
    name?: string
    phone?: string
    address?: string
  }
}

/**
 * 테넌트 생성 요청 타입
 */
export interface CreateTenantRequest {
  name: string
  slug: string
  contact_email?: string
  contact_phone?: string
  address?: string
  description?: string
}

/**
 * 테넌트 생성 응답 타입
 */
export interface CreateTenantResponse {
  success: boolean
  tenant: {
    id: string
    name: string
    slug: string
    status: Database['public']['Enums']['tenant_status']
  }
}

// ================================================================
// 4. 타입 가드 함수들
// ================================================================

/**
 * LoginRequest 타입 가드
 */
export function isLoginRequest(obj: unknown): obj is LoginRequest {
  if (typeof obj !== 'object' || obj === null) return false
  const req = obj as Record<string, unknown>
  return (
    typeof req.email === 'string' &&
    typeof req.password === 'string' &&
    req.email.length > 0 &&
    req.password.length > 0
  )
}

/**
 * SignupRequest 타입 가드
 */
export function isSignupRequest(obj: unknown): obj is SignupRequest {
  if (typeof obj !== 'object' || obj === null) return false
  const req = obj as Record<string, unknown>
  return (
    typeof req.email === 'string' &&
    typeof req.password === 'string' &&
    typeof req.full_name === 'string' &&
    req.email.length > 0 &&
    req.password.length > 0 &&
    req.full_name.length > 0
  )
}

/**
 * ApproveMemberRequest 타입 가드
 */
export function isApproveMemberRequest(obj: unknown): obj is ApproveMemberRequest {
  if (typeof obj !== 'object' || obj === null) return false
  const req = obj as Record<string, unknown>
  return (
    typeof req.userId === 'string' &&
    typeof req.tenantId === 'string' &&
    (req.action === 'approve' || req.action === 'reject') &&
    req.userId.length > 0 &&
    req.tenantId.length > 0
  )
}

/**
 * UpdateMemberRequest 타입 가드
 */
export function isUpdateMemberRequest(obj: unknown): obj is UpdateMemberRequest {
  if (typeof obj !== 'object' || obj === null) return false
  const req = obj as Record<string, unknown>
  return (
    typeof req.userId === 'string' &&
    typeof req.tenantId === 'string' &&
    typeof req.updates === 'object' &&
    req.updates !== null &&
    req.userId.length > 0 &&
    req.tenantId.length > 0
  )
}

/**
 * CheckEmailRequest 타입 가드
 */
export function isCheckEmailRequest(obj: unknown): obj is CheckEmailRequest {
  if (typeof obj !== 'object' || obj === null) return false
  const req = obj as Record<string, unknown>
  return (
    typeof req.email === 'string' &&
    req.email.length > 0
  )
}

/**
 * SearchTenantsRequest 타입 가드
 */
export function isSearchTenantsRequest(obj: unknown): obj is SearchTenantsRequest {
  if (typeof obj !== 'object' || obj === null) return false
  const req = obj as Record<string, unknown>
  return (
    typeof req.searchQuery === 'string' &&
    (req.searchType === 'name' || req.searchType === 'slug' || req.searchType === 'code') &&
    req.searchQuery.length > 0
  )
}

/**
 * CreateTenantRequest 타입 가드
 */
export function isCreateTenantRequest(obj: unknown): obj is CreateTenantRequest {
  if (typeof obj !== 'object' || obj === null) return false
  const req = obj as Record<string, unknown>
  return (
    typeof req.name === 'string' &&
    typeof req.slug === 'string' &&
    req.name.length > 0 &&
    req.slug.length > 0
  )
}

/**
 * 일반적인 API 에러 응답 생성 함수
 */
export function createErrorResponse(message: string, status: number = 500): Response {
  return NextResponse.json(
    { error: message },
    { status }
  )
}

/**
 * 성공 응답 생성 함수
 */
export function createSuccessResponse<T>(data?: T, message?: string): Response {
  return NextResponse.json({
    success: true,
    ...(data && { data }),
    ...(message && { message })
  })
}

// NextResponse import 추가
import { NextResponse } from 'next/server'