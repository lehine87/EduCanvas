import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/database'

export const createClient = (request: NextRequest) => {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Vercel 환경에서 쿠키 설정 강화
          const cookieOptions = {
            ...options,
            httpOnly: false, // 클라이언트에서 접근 가능하도록
            secure: process.env.NODE_ENV === 'production', // HTTPS에서만
            sameSite: 'lax' as const, // CSRF 보호하면서 로그인 허용
            domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined, // Vercel 도메인에서 작동
            path: '/', // 모든 경로에서 접근 가능
          }
          
          request.cookies.set({
            name,
            value,
            ...cookieOptions,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...cookieOptions,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Vercel 환경에서 쿠키 제거 강화
          const cookieOptions = {
            ...options,
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined,
            path: '/',
            maxAge: 0, // 즉시 만료
          }
          
          request.cookies.set({
            name,
            value: '',
            ...cookieOptions,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...cookieOptions,
          })
        },
      },
    }
  )

  return { supabase, response }
}