import { NextRequest, NextResponse } from 'next/server'
import { ZodError, ZodSchema } from 'zod'
import { 
  createValidationErrorResponse, 
  createServerErrorResponse,
  setStandardHeaders,
  ExecutionTimer
} from './api-response'

/**
 * Route 검증 옵션
 */
interface RouteValidationOptions<TQuery = unknown, TBody = unknown> {
  querySchema?: ZodSchema<TQuery>
  bodySchema?: ZodSchema<TBody>
  requireAuth?: boolean
  rateLimitKey?: string
  handler: (
    req: NextRequest,
    context: {
      query: TQuery
      body?: TBody
      user?: any
      timer: ExecutionTimer
    }
  ) => Promise<NextResponse>
}

/**
 * 업계 표준 Route Validation 미들웨어
 * 
 * 기능:
 * - Query parameter & Body validation (Zod)
 * - 인증/권한 체크
 * - Rate limiting 
 * - 중앙집중식 에러 처리
 * - 실행 시간 측정
 * - 표준 헤더 설정
 */
export function withRouteValidation<TQuery = unknown, TBody = unknown>(
  options: RouteValidationOptions<TQuery, TBody>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const timer = new ExecutionTimer()
    let response: NextResponse

    try {
      // 1. Query Parameter 검증
      let validatedQuery: TQuery = {} as TQuery
      if (options.querySchema) {
        const url = new URL(req.url)
        const queryParams = parseQueryParams(url.searchParams)
        validatedQuery = options.querySchema.parse(queryParams)
      }

      // 2. Request Body 검증 (POST/PUT/PATCH)
      let validatedBody: TBody | undefined
      if (options.bodySchema && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        try {
          const body = await req.json()
          validatedBody = options.bodySchema.parse(body)
        } catch (error) {
          if (error instanceof SyntaxError) {
            return createValidationErrorResponse(
              [{ field: 'body', message: 'Invalid JSON format' }],
              'Request body must be valid JSON'
            )
          }
          throw error
        }
      }

      // 3. 인증 체크 (옵션)
      let user: any
      if (options.requireAuth) {
        user = await validateAuthentication(req)
        if (!user) {
          return createValidationErrorResponse(
            [{ field: 'authorization', message: 'Invalid or missing token' }],
            'Authentication required'
          )
        }
      }

      // 4. Rate Limiting (옵션)
      if (options.rateLimitKey) {
        const rateLimitResult = await checkRateLimit(req, options.rateLimitKey)
        if (!rateLimitResult.allowed) {
          return createValidationErrorResponse(
            [{ field: 'rate_limit', message: 'Too many requests' }],
            'Rate limit exceeded'
          )
        }
      }

      // 5. 사용자 정보를 req에 주입 (API Route에서 직접 접근 가능)
      ;(req as any).user = user

      // 6. 핸들러 실행
      response = await options.handler(req, {
        query: validatedQuery,
        body: validatedBody,
        user,
        timer
      })

    } catch (error) {
      console.error('Route validation error:', error)

      // Zod validation 에러
      if (error instanceof ZodError) {
        const validationErrors = error.issues.map((err) => ({
          field: (err.path || []).join('.') || 'unknown',
          message: err.message,
          code: err.code
        }))

        return createValidationErrorResponse(
          validationErrors,
          'Request validation failed'
        )
      }

      // 일반적인 서버 에러
      return createServerErrorResponse(
        'An unexpected error occurred',
        error instanceof Error ? error : new Error(String(error))
      )
    }

    // 6. 표준 헤더 설정 및 응답
    return setStandardHeaders(response)
  }
}

/**
 * Query Parameters 파싱 (배열 지원)
 */
function parseQueryParams(searchParams: URLSearchParams): Record<string, any> {
  const params: Record<string, any> = {}

  for (const [key, value] of searchParams.entries()) {
    // 배열 형태 처리 (key[]=value1&key[]=value2 또는 key=value1,value2)
    if (params[key]) {
      if (Array.isArray(params[key])) {
        params[key].push(value)
      } else {
        params[key] = [params[key], value]
      }
    } else if (value.includes(',') && !key.includes('date')) {
      // 쉼표로 구분된 값들을 배열로 변환 (날짜 제외)
      params[key] = value.split(',').map(v => v.trim())
    } else {
      params[key] = value
    }
  }

  return params
}

/**
 * 인증 검증 (JWT 토큰) - 권한 시스템 연동
 */
async function validateAuthentication(req: NextRequest): Promise<any> {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    
    // 실제 Supabase JWT 검증 구현
    if (token && token !== 'test-token') {
      const { createServiceRoleClient } = await import('@/lib/supabase/server')
      const supabase = createServiceRoleClient()
      
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token)
        if (error || !user) {
          console.log('🔒 [AUTH] Invalid token:', error?.message)
          return null
        }

        // tenant_memberships에서 사용자 정보 조회
        const { data: membership, error: membershipError } = await supabase
          .from('tenant_memberships')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        if (membershipError || !membership) {
          console.log('🔒 [AUTH] No active membership found for user:', user.id)
          return null
        }

        return {
          id: user.id,
          tenant_id: membership.tenant_id,
          role: (membership.staff_info as {role?: string})?.role || 'viewer',
          email: user.email,
          membership
        }
      } catch (jwtError) {
        console.error('🔒 [AUTH] JWT verification failed:', jwtError)
        return null
      }
    }

    // 개발/테스트용 임시 인증 (실제 UUID 사용)
    if (token === 'test-token') {
      console.log('🔧 [DEV] Using test authentication (admin role)')
      return { 
        id: '550e8400-e29b-41d4-a716-446655440000', 
        tenant_id: '11111111-1111-1111-1111-111111111111',
        role: 'admin',
        email: 'test@educanvas.com',
        isTestUser: true
      }
    }

    // instructor 권한 테스트
    if (token === 'instructor-token') {
      console.log('🔧 [DEV] Using instructor test authentication')
      return { 
        id: '550e8400-e29b-41d4-a716-446655440001', 
        tenant_id: '11111111-1111-1111-1111-111111111111',
        role: 'instructor',
        email: 'instructor@educanvas.com',
        isTestUser: true
      }
    }

    // viewer 권한 테스트 (삭제 권한 없음)
    if (token === 'viewer-token') {
      console.log('🔧 [DEV] Using viewer test authentication')
      return { 
        id: '550e8400-e29b-41d4-a716-446655440002', 
        tenant_id: '11111111-1111-1111-1111-111111111111',
        role: 'viewer',
        email: 'viewer@educanvas.com',
        isTestUser: true
      }
    }

    return null
    
  } catch (error) {
    console.error('🔒 [AUTH] Authentication error:', error)
    return null
  }
}

/**
 * Rate Limiting 체크
 */
async function checkRateLimit(
  req: NextRequest,
  key: string
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    // Redis 또는 메모리 기반 rate limiter 구현
    // 현재는 허용으로 처리 (실제 구현 필요)
    return { allowed: true, remaining: 100 }
    
  } catch (error) {
    console.error('Rate limit check error:', error)
    return { allowed: true, remaining: 100 }
  }
}

/**
 * CORS 프리플라이트 요청 처리
 */
export function handleCorsPreflightRequest(): NextResponse {
  const response = new NextResponse(null, { status: 200 })
  
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')
  
  return response
}

/**
 * 에러 로깅 유틸리티
 */
export function logApiError(error: Error, context: {
  method: string
  url: string
  user_id?: string
  tenant_id?: string
}): void {
  console.error('API Error:', {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    context,
    timestamp: new Date().toISOString()
  })

  // 실제 환경에서는 Winston, DataDog 등으로 로깅
}