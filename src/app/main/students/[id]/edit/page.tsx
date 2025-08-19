'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { useStudentsStore } from '@/store/studentsStore'
import { useAuthStore } from '@/store/useAuthStore'
import { LoadingPlaceholder } from '@/components/ui/classflow/LoadingPlaceholder'
import type { StudentFormData } from '@/types/student.types'
import { ArrowLeftIcon, PencilIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

// 폼 검증 스키마
const studentEditSchema = z.object({
  name: z.string().min(1, '학생 이름은 필수입니다'),
  student_number: z.string().min(1, '학번은 필수입니다'),
  phone: z.string().optional(),
  email: z.string().email('올바른 이메일 형식이 아닙니다').optional().or(z.literal('')),
  parent_name: z.string().optional(),
  parent_phone_1: z.string().optional(),
  parent_phone_2: z.string().optional(),
  grade_level: z.string().optional(),
  school_name: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive', 'graduated', 'withdrawn', 'suspended'])
})

type StudentEditValues = z.infer<typeof studentEditSchema>

export default function EditStudentPage() {
  const router = useRouter()
  const params = useParams()
  const { profile } = useAuthStore()
  const { selectedStudent, loading, error, actions } = useStudentsStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const studentId = params.id as string
  const tenantId = profile?.tenant_id

  // React Hook Form 설정
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty }
  } = useForm<StudentEditValues>({
    resolver: zodResolver(studentEditSchema)
  })

  // 학생 정보 로드
  useEffect(() => {
    if (studentId && tenantId) {
      const loadingToast = toast.loading('학생 정보를 불러오는 중...')
      actions.fetchStudent(studentId, tenantId).then(() => {
        toast.dismiss(loadingToast)
      }).catch(() => {
        toast.dismiss(loadingToast)
        toast.error('학생 정보를 불러오는데 실패했습니다.')
      })
    }
  }, [studentId, tenantId, actions])

  // 폼 데이터 설정
  useEffect(() => {
    if (selectedStudent) {
      reset({
        name: selectedStudent.name,
        student_number: selectedStudent.student_number,
        phone: selectedStudent.phone || '',
        email: selectedStudent.email || '',
        parent_name: selectedStudent.parent_name || '',
        parent_phone_1: selectedStudent.parent_phone_1 || '',
        parent_phone_2: selectedStudent.parent_phone_2 || '',
        grade_level: selectedStudent.grade_level || '',
        school_name: selectedStudent.school_name || '',
        address: selectedStudent.address || '',
        notes: selectedStudent.notes || '',
        status: selectedStudent.status as 'active' | 'inactive' | 'graduated' | 'withdrawn' | 'suspended'
      })
    }
  }, [selectedStudent, reset])

  // 폼 제출 핸들러
  const onSubmit = useCallback(async (data: StudentEditValues) => {
    if (!tenantId || !selectedStudent) {
      toast.error('학생 정보를 찾을 수 없습니다.')
      return
    }

    setIsSubmitting(true)
    const loadingToast = toast.loading('변경사항을 저장하는 중...')
    
    try {
      const updateData: Partial<StudentFormData> = {
        ...data,
        email: data.email || undefined, // 빈 문자열을 undefined로 변환
        phone: data.phone || undefined,
        parent_name: data.parent_name || undefined,
        parent_phone_1: data.parent_phone_1 || undefined,
        parent_phone_2: data.parent_phone_2 || undefined,
        grade_level: data.grade_level || undefined,
        school_name: data.school_name || undefined,
        address: data.address || undefined,
        notes: data.notes || undefined
      }
      
      await actions.updateStudent(studentId, updateData, tenantId)
      
      toast.dismiss(loadingToast)
      toast.success('학생 정보가 성공적으로 수정되었습니다.')
      
      // 약간의 딜레이로 사용자가 성공 메시지를 볼 수 있게 함
      setTimeout(() => {
        router.push(`/main/students/${studentId}`)
      }, 500)
    } catch (error) {
      console.error('학생 정보 수정 실패:', error)
      toast.dismiss(loadingToast)
      toast.error(error instanceof Error ? error.message : '학생 정보 수정에 실패했습니다.')
      setIsSubmitting(false)
    }
  }, [tenantId, selectedStudent, studentId, router, actions])

  // 취소 핸들러
  const handleCancel = useCallback(() => {
    if (isDirty) {
      if (confirm('변경사항이 있습니다. 정말로 취소하시겠습니까?')) {
        router.back()
      }
    } else {
      router.back()
    }
  }, [isDirty, router])

  // 로딩 상태
  if (loading && !selectedStudent) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          <LoadingPlaceholder className="h-16" />
          <LoadingPlaceholder className="h-64" />
          <LoadingPlaceholder className="h-48" />
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error || !selectedStudent) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="border-error-200 bg-error-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-error-600" />
              <div>
                <h3 className="text-lg font-medium text-error-900">
                  학생 정보를 불러올 수 없습니다
                </h3>
                <p className="text-error-700">
                  {error || '학생을 찾을 수 없습니다.'}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={() => router.back()} variant="outline">
                돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* 헤더 */}
      <div className="flex items-center space-x-4 mb-6">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="flex items-center space-x-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>돌아가기</span>
        </Button>
        <div className="h-6 border-l border-gray-300" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <PencilIcon className="h-8 w-8 mr-3 text-blue-600" />
            학생 정보 수정
          </h1>
          <p className="text-gray-600 mt-1">
            {selectedStudent.name} ({selectedStudent.student_number})
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="required">학생 이름</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="홍길동"
                  className={errors.name ? 'border-error-300' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-error-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="student_number" className="required">학번</Label>
                <Input
                  id="student_number"
                  {...register('student_number')}
                  placeholder="ST2024001"
                  className={errors.student_number ? 'border-error-300' : ''}
                />
                {errors.student_number && (
                  <p className="text-sm text-error-600 mt-1">{errors.student_number.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">학생 연락처</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="010-1234-5678"
                  type="tel"
                />
              </div>

              <div>
                <Label htmlFor="email">학생 이메일</Label>
                <Input
                  id="email"
                  {...register('email')}
                  placeholder="student@example.com"
                  type="email"
                  className={errors.email ? 'border-error-300' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-error-600 mt-1">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="grade_level">학년</Label>
                <Select onValueChange={(value) => setValue('grade_level', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="학년 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="초1">초등학교 1학년</SelectItem>
                    <SelectItem value="초2">초등학교 2학년</SelectItem>
                    <SelectItem value="초3">초등학교 3학년</SelectItem>
                    <SelectItem value="초4">초등학교 4학년</SelectItem>
                    <SelectItem value="초5">초등학교 5학년</SelectItem>
                    <SelectItem value="초6">초등학교 6학년</SelectItem>
                    <SelectItem value="중1">중학교 1학년</SelectItem>
                    <SelectItem value="중2">중학교 2학년</SelectItem>
                    <SelectItem value="중3">중학교 3학년</SelectItem>
                    <SelectItem value="고1">고등학교 1학년</SelectItem>
                    <SelectItem value="고2">고등학교 2학년</SelectItem>
                    <SelectItem value="고3">고등학교 3학년</SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="school_name">학교</Label>
                <Input
                  id="school_name"
                  {...register('school_name')}
                  placeholder="○○초등학교"
                />
              </div>

              <div>
                <Label htmlFor="status">상태</Label>
                <Select 
                  onValueChange={(value) => setValue('status', value as 'active' | 'inactive' | 'graduated' | 'withdrawn' | 'suspended')}
                  defaultValue={selectedStudent.status || 'active'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">활동중</SelectItem>
                    <SelectItem value="inactive">비활성</SelectItem>
                    <SelectItem value="graduated">졸업</SelectItem>
                    <SelectItem value="withdrawn">탈퇴</SelectItem>
                    <SelectItem value="suspended">정지</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 학부모 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>학부모 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="parent_name">학부모 이름</Label>
              <Input
                id="parent_name"
                {...register('parent_name')}
                placeholder="홍아버지"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parent_phone_1">주 연락처</Label>
                <Input
                  id="parent_phone_1"
                  {...register('parent_phone_1')}
                  placeholder="010-1234-5678"
                  type="tel"
                />
              </div>

              <div>
                <Label htmlFor="parent_phone_2">보조 연락처</Label>
                <Input
                  id="parent_phone_2"
                  {...register('parent_phone_2')}
                  placeholder="010-8765-4321"
                  type="tel"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 추가 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>추가 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">주소</Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="서울시 강남구 ..."
              />
            </div>

            <div>
              <Label htmlFor="notes">메모</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="학생에 대한 추가 메모사항을 입력하세요..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* 액션 버튼 */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="min-w-[120px] transition-all"
            variant={isDirty ? "default" : "outline"}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>저장 중...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <PencilIcon className="h-4 w-4" />
                <span>{isDirty ? '변경사항 저장' : '변경사항 없음'}</span>
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}