'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Button, Input, Card, CardHeader, CardTitle, CardBody } from '@/components/ui'
import { authClient } from '@/lib/auth/authClient'
import { signUpSchema, type SignUpFormData } from '@/lib/auth/authValidation'

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [emailCheckResult, setEmailCheckResult] = useState<{
    isChecking: boolean
    isAvailable: boolean | null
    message: string | null
  }>({
    isChecking: false,
    isAvailable: null,
    message: null
  })
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema)
  })

  const emailValue = watch('email')

  // 실시간 이메일 중복 검사 (디바운싱)
  const checkEmailAvailability = async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailCheckResult({
        isChecking: false,
        isAvailable: null,
        message: null
      })
      return
    }

    setEmailCheckResult({
      isChecking: true,
      isAvailable: null,
      message: '이메일 확인 중...'
    })

    try {
      // user_profiles 테이블에서 이메일 중복 검사
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const result = await response.json()

      if (result.exists) {
        setEmailCheckResult({
          isChecking: false,
          isAvailable: false,
          message: '이미 사용 중인 이메일입니다'
        })
      } else {
        setEmailCheckResult({
          isChecking: false,
          isAvailable: true,
          message: '사용 가능한 이메일입니다'
        })
      }
    } catch (error) {
      setEmailCheckResult({
        isChecking: false,
        isAvailable: null,
        message: null
      })
    }
  }

  // 이메일 필드 변경 시 디바운싱으로 체크
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (emailValue) {
        checkEmailAvailability(emailValue)
      }
    }, 500) // 500ms 디바운싱

    return () => clearTimeout(timeoutId)
  }, [emailValue])

  const onSubmit = async (data: SignUpFormData) => {
    console.log('📝 회원가입 폼 데이터:', {
      email: data.email,
      full_name: data.full_name,
      tenant_slug: data.tenant_slug,
      passwordLength: data.password?.length
    })

    setIsLoading(true)
    setError(null)

    try {
      console.log('🚀 authClient.signUp 호출 시작...')
      
      await authClient.signUp({
        email: data.email,
        password: data.password,
        full_name: data.full_name
      })
      
      console.log('✅ 회원가입 성공!')
      setSuccess(true)
    } catch (error) {
      console.error('🚨 회원가입 에러 상세:', error)
      
      // 타입 가드를 사용한 안전한 에러 처리
      const errorName = error instanceof Error ? error.name : '';
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      const errorStatus = (error as {status?: number}).status;
      
      console.error('🚨 회원가입 에러 상세:', {
        name: errorName,
        message: errorMessage,
        status: errorStatus,
        details: error
      })
      
      // 네트워크 오류 체크
      if (errorName === 'AuthRetryableFetchError' || errorMessage.includes('Failed to fetch')) {
        setError('네트워크 연결을 확인해주세요. 잠시 후 다시 시도해보세요.')
        return
      }
      
      // authClient에서 이미 사용자 친화적 메시지로 변환되어 전달됨
      
      // 추가 에러 타입 처리
      if (errorMessage.includes('이미 등록된 이메일')) {
        setError('💡 ' + errorMessage + ' 혹시 비밀번호를 잊으셨나요?')
      } else if (errorMessage.includes('비밀번호')) {
        setError('🔐 ' + errorMessage)
      } else if (errorMessage.includes('이메일')) {
        setError('📧 ' + errorMessage)
      } else if (errorMessage.includes('프로필 생성')) {
        setError('👤 ' + errorMessage + ' 잠시 후 다시 시도해주세요.')
      } else {
        setError('❌ ' + errorMessage)
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
                <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900">
                  회원가입 완료!
                </h2>
                
                <p className="text-gray-600">
                  이메일로 전송된 인증 링크를 클릭하여<br />
                  계정 인증 후 온보딩을 완료해주세요.
                </p>
                
                <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md border border-blue-200">
                  <p>📋 <strong>다음 단계:</strong></p>
                  <ol className="mt-2 text-left space-y-1">
                    <li>1. 이메일 인증 링크 클릭</li>
                    <li>2. 기본 프로필 정보 입력</li>
                    <li>3. 소속 학원 연결</li>
                    <li>4. 관리자 승인 완료</li>
                  </ol>
                </div>
                
                <Button
                  onClick={() => router.push('/auth/login')}
                  className="w-full"
                >
                  로그인 페이지로 이동
                </Button>
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
            새 계정을 만들어 시작하세요
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>회원가입</CardTitle>
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

              <Input
                label="이름"
                type="text"
                {...register('full_name')}
                error={errors.full_name?.message}
                placeholder="홍길동"
                disabled={isLoading}
                required
              />

              <div className="space-y-1">
                <Input
                  label="이메일"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  placeholder="example@academy.com"
                  disabled={isLoading}
                  required
                />
                {emailCheckResult.message && (
                  <div className={`text-xs px-2 py-1 rounded ${
                    emailCheckResult.isChecking
                      ? 'text-gray-600 bg-gray-50'
                      : emailCheckResult.isAvailable
                      ? 'text-green-600 bg-green-50'
                      : 'text-red-600 bg-red-50'
                  }`}>
                    {emailCheckResult.isChecking && (
                      <span className="inline-block w-3 h-3 mr-1">
                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </span>
                    )}
                    {emailCheckResult.isAvailable === true && '✅ '}
                    {emailCheckResult.isAvailable === false && '❌ '}
                    {emailCheckResult.message}
                  </div>
                )}
              </div>

              <Input
                label="비밀번호"
                type="password"
                {...register('password')}
                error={errors.password?.message}
                placeholder="••••••••"
                hint="최소 8자, 영문과 숫자 포함"
                disabled={isLoading}
                required
              />

              <Input
                label="비밀번호 확인"
                type="password"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
                placeholder="••••••••"
                disabled={isLoading}
                required
              />


              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
                disabled={isLoading || emailCheckResult.isAvailable === false}
              >
                {emailCheckResult.isAvailable === false 
                  ? '이미 사용 중인 이메일입니다' 
                  : '회원가입'
                }
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  이미 계정이 있으신가요?{' '}
                  <Link
                    href="/auth/login"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    로그인
                  </Link>
                </p>
              </div>
            </form>
          </CardBody>
        </Card>

        <div className="text-center text-xs text-gray-500">
          <p>
            회원가입 시{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-500">
              이용약관
            </Link>{' '}
            및{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
              개인정보처리방침
            </Link>
            에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}