'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { signUpSchema, type SignUpFormData } from '@/lib/auth/authValidation'
import { useEmailCheckMutation, useSignUpMutation } from '@/hooks/useAuth'

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

  // API Client 패턴 사용
  const emailCheckMutation = useEmailCheckMutation()
  const signUpMutation = useSignUpMutation()

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  })

  const emailValue = form.watch('email')

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
      // API Client 패턴으로 이메일 중복 검사
      const result = await emailCheckMutation.mutateAsync({ email })

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
      passwordLength: data.password?.length
    })

    try {
      await signUpMutation.mutateAsync({
        email: data.email,
        password: data.password,
        full_name: data.full_name
      })

      setSuccess(true)
    } catch (error) {
      // 에러 처리는 useSignUpMutation에서 toast로 처리됨
      console.error('🚨 회원가입 실패:', error)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">
                    회원가입 완료!
                  </h2>
                  
                  <p className="text-muted-foreground">
                    이메일로 전송된 인증 링크를 클릭하여<br />
                    계정 인증 후 온보딩을 완료해주세요.
                  </p>
                </div>
                
                <Alert>
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertDescription>
                    <div className="text-left space-y-3">
                      <p className="font-medium">📋 다음 단계:</p>
                      <ol className="space-y-1 text-sm">
                        <li>1. 이메일 인증 링크 클릭</li>
                        <li>2. 기본 프로필 정보 입력</li>
                        <li>3. 소속 학원 연결</li>
                        <li>4. 관리자 승인 완료</li>
                      </ol>
                    </div>
                  </AlertDescription>
                </Alert>
                
                <Button
                  onClick={() => router.push('/auth/login')}
                  className="w-full"
                  size="lg"
                >
                  로그인 페이지로 이동
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            EduCanvas
          </h1>
          <p className="mt-2 text-muted-foreground">
            새 계정을 만들어 시작하세요
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>회원가입</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <AlertDescription>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이름</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="홍길동" 
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
                      {emailCheckResult.message && (
                        <div className="flex items-center gap-2 mt-2">
                          {emailCheckResult.isChecking && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          )}
                          {emailCheckResult.isAvailable === true && (
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                          )}
                          {emailCheckResult.isAvailable === false && (
                            <XCircleIcon className="h-4 w-4 text-red-600" />
                          )}
                          <Badge 
                            variant={
                              emailCheckResult.isChecking 
                                ? "secondary"
                                : emailCheckResult.isAvailable 
                                ? "default" 
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {emailCheckResult.message}
                          </Badge>
                        </div>
                      )}
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
                      <FormDescription>
                        최소 8자, 영문과 숫자 포함
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>비밀번호 확인</FormLabel>
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={signUpMutation.isPending || emailCheckResult.isAvailable === false}
                >
                  {signUpMutation.isPending && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  )}
                  {emailCheckResult.isAvailable === false
                    ? '이미 사용 중인 이메일입니다'
                    : '회원가입'
                  }
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    이미 계정이 있으신가요?{' '}
                    <Link
                      href="/auth/login"
                      className="font-medium text-primary hover:underline"
                    >
                      로그인
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <p>
            회원가입 시{' '}
            <Link href="/terms" className="text-primary hover:underline">
              이용약관
            </Link>{' '}
            및{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              개인정보처리방침
            </Link>
            에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}