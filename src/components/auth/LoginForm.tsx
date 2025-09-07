'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { authClient } from '@/lib/auth/authClient'
import { signInSchema, type SignInFormData } from '@/lib/auth/authValidation'
import { useAuthStore } from '@/store/useAuthStore'

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser, setProfile } = useAuthStore()

  // Vercel 환경에서 컴포넌트 마운트 시 디버깅
  useEffect(() => {
    const isVercel = typeof window !== 'undefined' && 
      process.env.NODE_ENV === 'production' && 
      window.location.hostname.includes('vercel.app')
    
    if (isVercel) {
      console.log(`🏗️ [VERCEL-MOUNT] LOGIN FORM LOADED:`, {
        timestamp: new Date().toISOString(),
        currentUrl: window.location.href,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        nodeEnv: process.env.NODE_ENV,
        vercelUrl: process.env.VERCEL_URL,
        publicAppUrl: process.env.NEXT_PUBLIC_APP_URL,
        cookiesOnMount: document.cookie || 'no cookies'
      })
    }
  }, [])

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  // URL 파라미터에서 에러 메시지 확인
  useEffect(() => {
    const urlError = searchParams.get('error')
    const errorCode = searchParams.get('error_code')
    const errorDescription = searchParams.get('error_description')
    const urlMessage = searchParams.get('message')

    if (urlError === 'access_denied' && errorCode === 'otp_expired') {
      setError('이메일 인증 링크가 만료되었습니다. 새로운 인증 이메일을 요청해주세요.')
    } else if (urlError === 'callback_error') {
      setError('인증 중 오류가 발생했습니다. 다시 시도해주세요.')
    } else if (urlError === 'no_code') {
      setError('유효하지 않은 링크입니다. 비밀번호 재설정을 다시 요청해주세요.')
    } else if (urlMessage === 'check_email') {
      setMessage('이메일로 전송된 인증 링크를 확인해주세요.')
    } else if (urlMessage === 'email_confirmed') {
      setMessage('이메일 인증이 완료되었습니다! 이제 로그인하실 수 있습니다.')
    } else if (urlMessage === 'password_updated') {
      setMessage('비밀번호가 성공적으로 변경되었습니다! 새 비밀번호로 로그인해주세요.')
    }
  }, [searchParams])

  const onSubmit = async (data: SignInFormData) => {
    console.log(`🔐 [LOGIN-ATTEMPT] Starting login process:`, {
      email: data.email,
      hasPassword: !!data.password,
      timestamp: new Date().toISOString()
    })

    setIsLoading(true)
    setError(null)

    // Vercel 환경에서만 상세 디버깅
    const isVercel = typeof window !== 'undefined' && 
      process.env.NODE_ENV === 'production' && 
      window.location.hostname.includes('vercel.app')
    const requestId = Math.random().toString(36).substring(7)

    if (isVercel) {
      console.log(`🔐 [VERCEL-LOGIN-${requestId}] LOGIN ATTEMPT:`, {
        email: data.email,
        hasPassword: !!data.password,
        currentPath: window.location.pathname,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hostname: window.location.hostname,
        origin: window.location.origin,
        fullUrl: window.location.href
      })
    }

    try {
      if (isVercel) {
        console.log(`🔐 [VERCEL-LOGIN-${requestId}] BEFORE AUTH:`, {
          cookiesBefore: document.cookie
        })
      }
      
      const authData = await authClient.signIn(data)
      const { user, session } = authData
      
      if (isVercel) {
        console.log(`✅ [VERCEL-LOGIN-${requestId}] AUTH SUCCESS:`, {
          hasUser: !!user,
          hasSession: !!session,
          userId: user?.id,
          userEmail: user?.email,
          cookiesAfterAuth: document.cookie,
          sessionExpiresAt: session?.expires_at
        })
      }
      
      if (user && session) {
        const profile = await authClient.getUserProfile()
        
        if (isVercel) {
          console.log(`👤 [VERCEL-LOGIN-${requestId}] PROFILE LOADED:`, {
            hasProfile: !!profile,
            profileRole: profile?.role,
            profileStatus: profile?.status,
            tenantId: profile?.tenant_id
          })
        }
        
        setUser(user)
        setProfile(profile)
        
        if (isVercel) {
          console.log(`🔄 [VERCEL-LOGIN-${requestId}] REDIRECTING TO ADMIN:`, {
            from: window.location.pathname,
            to: '/main',
            cookiesAfterLogin: document.cookie,
            cookieNames: document.cookie.split(';').map(c => c.split('=')[0]?.trim() || '')
          })
        }
        
        // 쿠키 설정 완료를 위한 대기 (Vercel 환경에서는 더 긴 대기)
        const waitTime = isVercel ? 2000 : 500 // Vercel: 2초, 로컬: 0.5초
        console.log(`⏰ [LOGIN-DEBUG] ${waitTime}ms 후 리다이렉트 시작...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        
        console.log(`🔄 [LOGIN-DEBUG] 리다이렉트 실행 중...`)
        
        // Next.js router navigation 대신 브라우저 네이티브 navigation 사용 (더 안전함)
        if (typeof window !== 'undefined') {
          window.location.href = '/main'
        } else {
          router.push('/main')
          router.refresh()
        }
      } else {
        if (isVercel) {
          console.error(`❌ [VERCEL-LOGIN-${requestId}] AUTH INCOMPLETE:`, {
            hasUser: !!user,
            hasSession: !!session
          })
        }
        setError('로그인 처리 중 문제가 발생했습니다. 다시 시도해주세요.')
      }
    } catch (error) {
      console.error('로그인 에러:', error)
      
      if (isVercel) {
        console.error(`❌ [VERCEL-LOGIN-${requestId}] LOGIN ERROR:`, {
          error: error instanceof Error ? error.message : String(error),
          errorName: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack?.substring(0, 200) : undefined
        })
      }
      
      // 타입 가드를 사용한 안전한 에러 처리
      const errorMessage = error instanceof Error ? error.message : '';
      
      if (errorMessage.includes('Invalid login credentials')) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다')
      } else if (errorMessage.includes('Email not confirmed')) {
        setError('이메일 인증을 완료해주세요')
      } else {
        setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            EduCanvas
          </h1>
          <p className="mt-2 text-muted-foreground">
            학원 관리 시스템에 로그인하세요
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>로그인</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div 
                className="bg-destructive/15 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm mb-4"
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}
            
            {message && (
              <div 
                className="bg-primary/15 border border-primary/20 text-primary px-4 py-3 rounded-md text-sm mb-4"
                role="alert"
                aria-live="polite"
              >
                {message}
              </div>
            )}

            <Form {...form}>
              <form 
                onSubmit={(e) => {
                  console.log(`📝 [FORM-SUBMIT] Form submission triggered`)
                  form.handleSubmit(onSubmit)(e)
                }} 
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이메일</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="example@academy.com"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>비밀번호</FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="••••••••"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <Link
                    href="/auth/reset-password"
                    className="text-sm text-primary hover:text-primary/80 underline-offset-4 hover:underline"
                  >
                    비밀번호를 잊으셨나요?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  onClick={() => {
                    // 로그인 버튼 클릭 즉시 로그 (로컬 환경에서도 출력)
                    console.log(`🖱️ [LOGIN-CLICK] LOGIN BUTTON CLICKED:`, {
                      timestamp: new Date().toISOString(),
                      isLoading,
                      hasErrors: !!Object.keys(form.formState.errors).length,
                      errors: form.formState.errors,
                      cookiesCount: document.cookie.split(';').length
                    })
                  }}
                >
                  {isLoading ? "로그인 중..." : "로그인"}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    계정이 없으신가요?{' '}
                    <Link
                      href="/auth/signup"
                      className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline"
                    >
                      회원가입
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <p>© 2025 EduCanvas. 모든 권리 보유.</p>
        </div>
      </div>
    </div>
  )
}