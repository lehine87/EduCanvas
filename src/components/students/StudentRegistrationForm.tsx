'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Check, Loader2, Plus, X } from 'lucide-react'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { toast } from '@/components/ui/use-toast'

/**
 * 학생 등록 폼 - 업계 표준 구현
 * 
 * 기능:
 * - React Hook Form + Zod 스키마 검증
 * - 실시간 유효성 검사
 * - 단계별 폼 (기본 정보 → 학부모 정보 → 추가 정보)
 * - 자동 학번 생성 옵션
 * - 태그 입력 시스템
 * - 응답성 UI (모바일 최적화)
 * - 접근성 지원 (ARIA 레이블)
 */

// 학생 등록 스키마 (업계 표준)
const StudentRegistrationSchema = z.object({
  // 필수 기본 정보
  name: z.string()
    .min(1, '학생 이름은 필수입니다')
    .max(100, '이름이 너무 깁니다')
    .regex(/^[가-힣a-zA-Z\s]+$/, '이름은 한글 또는 영문만 입력 가능합니다'),
  
  student_number: z.string()
    .min(1, '학번은 필수입니다')
    .max(50, '학번이 너무 깁니다')
    .regex(/^[A-Z0-9-]+$/, '학번은 영문 대문자와 숫자, 하이픈만 사용 가능합니다'),

  // 선택적 개인 정보
  name_english: z.string()
    .max(100, '영문 이름이 너무 깁니다')
    .regex(/^[a-zA-Z\s]*$/, '영문 이름은 영어만 입력 가능합니다')
    .optional(),
  
  birth_date: z.string()
    .optional()
    .refine(val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)'),
  
  gender: z.enum(['male', 'female']).optional(),
  
  phone: z.string()
    .optional()
    .refine(val => !val || /^01[0-9]-\d{4}-\d{4}$/.test(val), '휴대폰 번호 형식이 올바르지 않습니다 (010-1234-5678)'),
  
  email: z.string()
    .email('이메일 형식이 올바르지 않습니다')
    .optional()
    .or(z.literal('')),
  
  address: z.string().max(500, '주소가 너무 깁니다').optional(),
  
  // 학교 정보
  school_name: z.string().max(100, '학교명이 너무 깁니다').optional(),
  grade_level: z.string().optional(),
  
  // 학부모 정보
  parent_name_1: z.string()
    .max(100, '학부모 이름이 너무 깁니다')
    .regex(/^[가-힣a-zA-Z\s]*$/, '학부모 이름은 한글 또는 영문만 입력 가능합니다')
    .optional(),
  
  parent_phone_1: z.string()
    .optional()
    .refine(val => !val || /^01[0-9]-\d{4}-\d{4}$/.test(val), '휴대폰 번호 형식이 올바르지 않습니다'),
  
  parent_name_2: z.string()
    .max(100, '학부모 이름이 너무 깁니다')
    .regex(/^[가-힣a-zA-Z\s]*$/, '학부모 이름은 한글 또는 영문만 입력 가능합니다')
    .optional(),
  
  parent_phone_2: z.string()
    .optional()
    .refine(val => !val || /^01[0-9]-\d{4}-\d{4}$/.test(val), '휴대폰 번호 형식이 올바르지 않습니다'),
  
  // 상태 및 메모
  status: z.enum(['active', 'inactive', 'graduated', 'withdrawn', 'suspended', 'waiting']),
  notes: z.string().max(1000, '메모가 너무 깁니다').optional(),
  
  // 태그 시스템
  tags: z.array(z.string().max(50, '태그가 너무 깁니다')).optional(),
  
  // 긴급 연락처 (JSON)
  emergency_contact: z.record(z.string(), z.unknown()).optional(),
  
  // 커스텀 필드 (확장성)
  custom_fields: z.record(z.string(), z.unknown()).optional(),
})

type StudentRegistrationData = z.infer<typeof StudentRegistrationSchema>

interface StudentRegistrationFormProps {
  onSubmit: (data: StudentRegistrationData) => Promise<void>
  onCancel?: () => void
  defaultValues?: Partial<StudentRegistrationData>
  isLoading?: boolean
}

const GRADE_LEVELS = [
  { value: 'elementary_1', label: '초등 1학년' },
  { value: 'elementary_2', label: '초등 2학년' },
  { value: 'elementary_3', label: '초등 3학년' },
  { value: 'elementary_4', label: '초등 4학년' },
  { value: 'elementary_5', label: '초등 5학년' },
  { value: 'elementary_6', label: '초등 6학년' },
  { value: 'middle_1', label: '중학 1학년' },
  { value: 'middle_2', label: '중학 2학년' },
  { value: 'middle_3', label: '중학 3학년' },
  { value: 'high_1', label: '고등 1학년' },
  { value: 'high_2', label: '고등 2학년' },
  { value: 'high_3', label: '고등 3학년' },
  { value: 'graduate', label: '졸업생' },
]

const STATUS_OPTIONS = [
  { value: 'waiting', label: '대기', description: '등록 대기 중인 학생' },
  { value: 'active', label: '활성', description: '현재 수강 중인 학생' },
  { value: 'inactive', label: '비활성', description: '수강 중단 중인 학생' },
  { value: 'graduated', label: '졸업', description: '졸업한 학생' },
]

export function StudentRegistrationForm({ 
  onSubmit, 
  onCancel, 
  defaultValues,
  isLoading = false 
}: StudentRegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [tagInput, setTagInput] = useState('')
  const [autoGenerateStudentNumber, setAutoGenerateStudentNumber] = useState(true)

  const form = useForm<StudentRegistrationData>({
    resolver: zodResolver(StudentRegistrationSchema),
    defaultValues: {
      status: 'waiting',
      tags: [],
      ...defaultValues,
    },
    mode: 'onChange', // 실시간 검증
  })

  const { watch, setValue, getValues } = form
  const watchedName = watch('name')
  const watchedTags = watch('tags') || []

  // 자동 학번 생성 (이름 기반 + 타임스탬프)
  const generateStudentNumber = () => {
    if (!watchedName) return
    
    const nameInitial = watchedName.charAt(0).toUpperCase()
    const timestamp = Date.now().toString().slice(-6)
    const studentNumber = `${nameInitial}${timestamp}`
    
    setValue('student_number', studentNumber)
    toast({
      title: '학번 자동 생성',
      description: `학번 ${studentNumber}가 생성되었습니다.`,
    })
  }

  // 태그 추가
  const addTag = () => {
    if (!tagInput.trim()) return
    
    const newTag = tagInput.trim()
    if (watchedTags.includes(newTag)) {
      toast({
        title: '중복된 태그',
        description: '이미 존재하는 태그입니다.',
        variant: 'destructive',
      })
      return
    }
    
    if (watchedTags.length >= 10) {
      toast({
        title: '태그 개수 초과',
        description: '태그는 최대 10개까지 추가할 수 있습니다.',
        variant: 'destructive',
      })
      return
    }
    
    setValue('tags', [...watchedTags, newTag])
    setTagInput('')
  }

  // 태그 제거
  const removeTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove))
  }

  // 폼 제출 처리
  const handleSubmit = async (data: StudentRegistrationData) => {
    try {
      await onSubmit(data)
      toast({
        title: '학생 등록 완료',
        description: `${data.name} 학생이 성공적으로 등록되었습니다.`,
      })
      form.reset()
      setCurrentStep(1)
    } catch (error) {
      toast({
        title: '등록 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  // 다음 단계로 이동
  const nextStep = async () => {
    let fieldsToValidate: (keyof StudentRegistrationData)[] = []
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['name', 'student_number']
        break
      case 2:
        fieldsToValidate = ['phone', 'email', 'parent_phone_1', 'parent_phone_2']
        break
    }

    const isStepValid = await form.trigger(fieldsToValidate)
    
    if (isStepValid) {
      setCurrentStep(prev => Math.min(prev + 1, 3))
    }
  }

  // 이전 단계로 이동
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          새 학생 등록
        </CardTitle>
        <CardDescription>
          학생의 기본 정보를 입력해주세요. 필수 항목은 빨간색 별표(*)로 표시됩니다.
        </CardDescription>
        
        {/* 진행률 표시 */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-2">
            {[1, 2, 3].map(step => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : step < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step < currentStep ? <Check className="h-4 w-4" /> : step}
              </div>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            단계 {currentStep} / 3
          </div>
        </div>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => handleSubmit(data as StudentRegistrationData))}>
          <CardContent className="space-y-6">
            
            {/* Step 1: 기본 정보 */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold">기본 정보</h3>
                  <Badge variant="secondary">1단계</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 학생 이름 */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          학생 이름 <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="홍길동"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              if (autoGenerateStudentNumber && e.target.value) {
                                setTimeout(() => generateStudentNumber(), 500)
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          학생의 실제 이름을 입력하세요
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 학번 */}
                  <FormField
                    control={form.control}
                    name="student_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center justify-between">
                          <span>
                            학번 <span className="text-red-500">*</span>
                          </span>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="auto-generate"
                              checked={autoGenerateStudentNumber}
                              onCheckedChange={(checked) => setAutoGenerateStudentNumber(checked === true)}
                            />
                            <label htmlFor="auto-generate" className="text-sm">
                              자동생성
                            </label>
                          </div>
                        </FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input 
                              placeholder="H123456"
                              {...field}
                              disabled={autoGenerateStudentNumber}
                            />
                          </FormControl>
                          {!autoGenerateStudentNumber && (
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={generateStudentNumber}
                              disabled={!watchedName}
                            >
                              생성
                            </Button>
                          )}
                        </div>
                        <FormDescription>
                          학생을 식별하는 고유 번호입니다
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 영문 이름 */}
                  <FormField
                    control={form.control}
                    name="name_english"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>영문 이름</FormLabel>
                        <FormControl>
                          <Input placeholder="Hong Gil Dong" {...field} />
                        </FormControl>
                        <FormDescription>
                          영문 성명 (선택사항)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 생년월일 */}
                  <FormField
                    control={form.control}
                    name="birth_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>생년월일</FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          학생의 생년월일을 선택하세요
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 성별 */}
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>성별</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="성별을 선택하세요" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">남성</SelectItem>
                            <SelectItem value="female">여성</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 학년 */}
                  <FormField
                    control={form.control}
                    name="grade_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>학년</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="학년을 선택하세요" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GRADE_LEVELS.map(grade => (
                              <SelectItem key={grade.value} value={grade.value}>
                                {grade.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 학교 정보 */}
                <Separator />
                <h4 className="text-md font-medium">학교 정보</h4>
                
                <FormField
                  control={form.control}
                  name="school_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>학교명</FormLabel>
                      <FormControl>
                        <Input placeholder="서울초등학교" {...field} />
                      </FormControl>
                      <FormDescription>
                        현재 재학 중인 학교명을 입력하세요
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: 연락처 정보 */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold">연락처 정보</h3>
                  <Badge variant="secondary">2단계</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 학생 연락처 */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>학생 연락처</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="010-1234-5678"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          학생의 휴대폰 번호
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 학생 이메일 */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>학생 이메일</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="student@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          학생의 이메일 주소
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 학부모 1 정보 */}
                  <FormField
                    control={form.control}
                    name="parent_name_1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>학부모 1 이름</FormLabel>
                        <FormControl>
                          <Input placeholder="홍부모" {...field} />
                        </FormControl>
                        <FormDescription>
                          주 보호자 이름
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parent_phone_1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>학부모 1 연락처</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="010-9876-5432"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          주 보호자 휴대폰 번호
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 학부모 2 정보 */}
                  <FormField
                    control={form.control}
                    name="parent_name_2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>학부모 2 이름</FormLabel>
                        <FormControl>
                          <Input placeholder="홍어머니" {...field} />
                        </FormControl>
                        <FormDescription>
                          부 보호자 이름 (선택사항)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parent_phone_2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>학부모 2 연락처</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="010-1111-2222"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          부 보호자 휴대폰 번호 (선택사항)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 주소 */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>주소</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="서울특별시 강남구 테헤란로 123길 45, 교육빌딩 6층"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        학생의 거주 주소
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: 추가 정보 */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold">추가 정보</h3>
                  <Badge variant="secondary">3단계</Badge>
                </div>

                {/* 상태 */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>상태</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUS_OPTIONS.map(status => (
                            <SelectItem key={status.value} value={status.value}>
                              <div className="flex flex-col">
                                <span>{status.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {status.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 태그 시스템 */}
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>태그</FormLabel>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="태그를 입력하세요"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          />
                          <Button type="button" variant="outline" size="sm" onClick={addTag}>
                            추가
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {watchedTags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {tag}
                              <X 
                                className="h-3 w-3 cursor-pointer hover:text-red-500" 
                                onClick={() => removeTag(tag)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <FormDescription>
                        학생을 구분하는 태그를 추가하세요 (예: VIP, 우수학생, 집중관리)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 메모 */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>메모</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="학생에 대한 추가 정보나 특이사항을 입력하세요..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        학생 관리에 도움이 되는 정보를 자유롭게 입력하세요
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>

          {/* 하단 버튼 */}
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  이전
                </Button>
              )}
              {onCancel && (
                <Button type="button" variant="ghost" onClick={onCancel}>
                  취소
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {currentStep < 3 ? (
                <Button type="button" onClick={nextStep}>
                  다음
                </Button>
              ) : (
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      등록 중...
                    </>
                  ) : (
                    '등록 완료'
                  )}
                </Button>
              )}
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}