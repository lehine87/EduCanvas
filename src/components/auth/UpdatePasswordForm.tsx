'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { Loader2 } from 'lucide-react'
import { authClient } from '@/lib/auth/authClient'

const updatePasswordSchema = z.object({
  password: z.string()
    .min(8, '비밀번호는 8자 이상이어야 합니다')
    .max(128, '비밀번호는 128자 이하여야 합니다')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '영문 대소문자와 숫자를 포함해야 합니다'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword']
})

type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>

export function UpdatePasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema)
  })

  // 세션 확인
  useEffect(() => {
    const checkSession = async () => {
      const session = await authClient.getCurrentSession()
      console.log('🔍 [UPDATE-PASSWORD] 세션 확인:', { 
        hasSession: !!session,
        expiresAt: session?.expires_at 
      })
      
      setHasSession(!!session)
      
      if (!session) {
        setError('비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다. 다시 요청해주세요.')
      }
    }

    checkSession()
  }, [])

  const onSubmit = async (data: UpdatePasswordFormData) => {
    if (!hasSession) {
      setError('유효한 세션이 없습니다. 다시 비밀번호 재설정을 요청해주세요.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await authClient.updatePassword(data.password)
      setSuccess(true)
      
      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push('/auth/login?message=password_updated')
      }, 3000)
    } catch (error) {
      console.error('비밀번호 업데이트 에러:', error)
      
      const errorMessage = error instanceof Error ? error.message : '';
      
      if (errorMessage.includes('New password should be different')) {
        setError('기존 비밀번호와 다른 새 비밀번호를 입력해주세요')
      } else if (errorMessage.includes('Password should be at least')) {
        setError('비밀번호는 최소 8자 이상이어야 합니다')
      } else {
        setError('비밀번호 변경 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900">
                  비밀번호 변경 완료
                </h2>
                
                <p className="text-gray-600">
                  비밀번호가 성공적으로 변경되었습니다.<br />
                  잠시 후 로그인 페이지로 이동합니다.
                </p>
                
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!hasSession && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900">
                  링크가 만료되었습니다
                </h2>
                
                <p className="text-gray-600">
                  {error}
                </p>
                
                <div className="space-y-3">
                  <Button
                    onClick={() => router.push('/auth/reset-password')}
                    className="w-full"
                  >
                    비밀번호 재설정 다시 요청
                  </Button>
                  
                  <Button
                    onClick={() => router.push('/auth/login')}
                    variant="ghost"
                    className="w-full"
                  >
                    로그인 페이지로 이동
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            EduCanvas
          </h1>
          <p className="mt-2 text-gray-600">
            새로운 비밀번호를 설정하세요
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>새 비밀번호 설정</CardTitle>
          </CardHeader>
          <CardContent>
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

              <div className="text-sm text-gray-600 mb-4">
                <p>비밀번호는 다음 조건을 만족해야 합니다:</p>
                <ul className="mt-2 list-disc list-inside text-xs space-y-1">
                  <li>8자 이상 128자 이하</li>
                  <li>영문 대문자 포함</li>
                  <li>영문 소문자 포함</li>
                  <li>숫자 포함</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
                <Input
                  type="password"
                  {...register('password')}
                  // error will be shown below
                  placeholder="새 비밀번호를 입력하세요"
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
                <Input
                  type="password"
                  {...register('confirmPassword')}
                  // error will be shown below
                  placeholder="비밀번호를 다시 입력하세요"
                  disabled={isLoading}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !hasSession}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                비밀번호 변경
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push('/auth/login')}
                  className="text-sm text-gray-600 hover:text-gray-500"
                >
                  로그인 페이지로 돌아가기
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}