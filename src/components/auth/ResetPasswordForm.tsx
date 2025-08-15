'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Card, CardHeader, CardTitle, CardBody } from '@/components/ui'
import { authClient } from '@/lib/auth/authClient'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/auth/authValidation'

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const searchParams = useSearchParams()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema)
  })

  // URL 파라미터에서 에러 메시지 확인
  useEffect(() => {
    const urlError = searchParams.get('error')
    const urlErrorDescription = searchParams.get('error_description')
    
    if (urlError) {
      let errorMessage = '비밀번호 재설정 요청 중 문제가 발생했습니다.'
      
      switch (urlError) {
        case 'callback_error':
          errorMessage = urlErrorDescription || '비밀번호 재설정 링크가 만료되었거나 이미 사용되었습니다. 새로운 링크를 요청해주세요.'
          break
        case 'no_code':
        case 'no_auth':
          errorMessage = urlErrorDescription || '잘못된 링크입니다. 새로운 비밀번호 재설정 링크를 요청해주세요.'
          break
        default:
          errorMessage = urlErrorDescription || errorMessage
      }
      
      setError(errorMessage)
    }
  }, [searchParams])

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      await authClient.resetPassword(data.email)
      setSuccess(true)
    } catch (error) {
      console.error('비밀번호 재설정 에러:', error)
      
      // 타입 가드를 사용한 안전한 에러 처리
      const errorMessage = error instanceof Error ? error.message : '';
      
      if (errorMessage.includes('Unable to validate email address')) {
        setError('등록되지 않은 이메일 주소입니다')
      } else {
        setError('비밀번호 재설정 요청 중 오류가 발생했습니다. 다시 시도해주세요.')
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
            <CardBody>
              <div className="text-center space-y-4">
                <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900">
                  이메일을 확인하세요
                </h2>
                
                <p className="text-gray-600">
                  비밀번호 재설정 링크를 이메일로 보냈습니다.<br />
                  이메일을 확인하고 링크를 클릭해주세요.
                </p>
                
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      setSuccess(false)
                      setError(null)
                    }}
                    variant="ghost"
                    className="w-full"
                  >
                    다시 요청하기
                  </Button>
                  
                  <Link href="/auth/login">
                    <Button variant="ghost" className="w-full">
                      로그인 페이지로 돌아가기
                    </Button>
                  </Link>
                </div>
              </div>
            </CardBody>
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
            비밀번호를 재설정하세요
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>비밀번호 재설정</CardTitle>
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

              <div className="text-sm text-gray-600 mb-4">
                <p>
                  가입할 때 사용한 이메일 주소를 입력하시면,<br />
                  비밀번호 재설정 링크를 보내드립니다.
                </p>
              </div>

              <Input
                label="이메일"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="example@academy.com"
                disabled={isLoading}
                required
              />

              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
                disabled={isLoading}
              >
                재설정 링크 보내기
              </Button>

              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  로그인 페이지로 돌아가기
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}