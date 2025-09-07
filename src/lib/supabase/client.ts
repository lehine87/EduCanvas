import { createBrowserClient, type CookieOptions } from '@supabase/ssr'
import { Database } from '@/types/database.types'

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL 환경변수가 설정되지 않았습니다.')
  }

  if (!supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다.')
  }

  // Vercel 환경에서 클라이언트 생성 시 디버깅
  const isVercel = typeof window !== 'undefined' && 
    process.env.NODE_ENV === 'production' && 
    window.location.hostname.includes('vercel.app')
  
  // 항상 로그 출력 (디버깅을 위해)
  if (typeof window !== 'undefined') {
    console.log(`🔧 [CLIENT-DEBUG] SUPABASE CONFIG:`, {
      isVercel: isVercel,
      nodeEnv: process.env.NODE_ENV,
      hostname: window.location.hostname,
      supabaseUrlDomain: new URL(supabaseUrl).hostname,
      anonKeyPrefix: supabaseAnonKey.substring(0, 20) + '...',
      currentDomain: window.location.hostname,
      isSecure: window.location.protocol === 'https:',
      cookieSupport: typeof document !== 'undefined' && 'cookie' in document
    })
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        // 브라우저에서 쿠키 직접 읽기
        if (typeof document !== 'undefined') {
          const value = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1]
          return decodeURIComponent(value || '')
        }
        return undefined
      },
      set(name: string, value: string, options: CookieOptions) {
        // Vercel 환경에서 쿠키 설정 강화
        if (typeof document !== 'undefined') {
          const cookieOptions = {
            ...options,
            secure: process.env.NODE_ENV === 'production', // HTTPS에서만
            sameSite: 'lax' as const, // CSRF 보호하면서 로그인 허용
            path: '/', // 모든 경로에서 접근 가능
            httpOnly: false, // 클라이언트에서 접근 가능
          }
          
          let cookieString = `${name}=${encodeURIComponent(value)}`
          
          if (cookieOptions.maxAge) {
            cookieString += `; Max-Age=${cookieOptions.maxAge}`
          }
          if (cookieOptions.path) {
            cookieString += `; Path=${cookieOptions.path}`
          }
          if (cookieOptions.secure) {
            cookieString += `; Secure`
          }
          if (cookieOptions.sameSite) {
            cookieString += `; SameSite=${cookieOptions.sameSite}`
          }
          
          document.cookie = cookieString
          
          // Vercel 환경에서 디버깅
          if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
            console.log(`🍪 [VERCEL-COOKIE] SET:`, { name, valueLength: value.length, cookieString: cookieString.substring(0, 100) + '...' })
          }
        }
      },
      remove(name: string, _options: CookieOptions) {
        if (typeof document !== 'undefined') {
          document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
          
          // Vercel 환경에서 디버깅
          if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
            console.log(`🍪 [VERCEL-COOKIE] REMOVE:`, { name })
          }
        }
      },
    },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
}