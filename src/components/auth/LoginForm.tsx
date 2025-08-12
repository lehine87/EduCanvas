'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Button, Input, Card, CardHeader, CardTitle, CardBody } from '@/components/ui'
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

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema)
  })

  // URL 파라미터에서 에러 메시지 확인
  useEffect(() => {
    const urlError = searchParams.get('error')
    const errorCode = searchParams.get('error_code')
    const errorDescription = searchParams.get('error_description')

    if (urlError === 'access_denied' && errorCode === 'otp_expired') {
      setError('이메일 인증 링크가 만료되었습니다. 새로운 인증 이메일을 요청해주세요.')
    } else if (urlError === 'callback_error') {
      setError('인증 중 오류가 발생했습니다. 다시 시도해주세요.')
    } else if (searchParams.get('message') === 'check_email') {
      setMessage('이메일로 전송된 인증 링크를 확인해주세요.')
    } else if (searchParams.get('message') === 'email_confirmed') {
      setMessage('이메일 인증이 완료되었습니다! 이제 로그인하실 수 있습니다.')
    }
  }, [searchParams])

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { user, session } = await authClient.signIn(data)
      
      if (user && session) {
        const profile = await authClient.getUserProfile()
        setUser(user)
        setProfile(profile)
        router.push('/admin')
        router.refresh()
      }
    } catch (error) {
      console.error('Login error:', error)
      
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            EduCanvas
          </h1>
          <p className="mt-2 text-gray-600">
            학원 관리 시스템에 로그인하세요
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>로그인</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div 
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </div>
              )}
              
              {message && (
                <div 
                  className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm"
                  role="alert"
                  aria-live="polite"
                >
                  {message}
                </div>
              )}

              <Input
                label="이메일"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="example@academy.com"
                disabled={isLoading}
                required
              />

              <Input
                label="비밀번호"
                type="password"
                {...register('password')}
                error={errors.password?.message}
                placeholder="••••••••"
                disabled={isLoading}
                required
              />

              <div className="flex items-center justify-between">
                <Link
                  href="/auth/reset-password"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
                disabled={isLoading}
              >
                로그인
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  계정이 없으신가요?{' '}
                  <Link
                    href="/auth/signup"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    회원가입
                  </Link>
                </p>
              </div>
            </form>
          </CardBody>
        </Card>

        <div className="text-center text-xs text-gray-500">
          <p>© 2025 EduCanvas. 모든 권리 보유.</p>
        </div>
      </div>
    </div>
  )
}