'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useStudentsStore } from '@/store/studentsStore'
import { useAuthStore } from '@/store/useAuthStore'
import { ClassSearchSelector, ClassSearchResult } from '@/components/ui/ClassSearchSelector'
import type { StudentFormData } from '@/types/student.types'
import { ArrowLeftIcon, UserPlusIcon, AcademicCapIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import StudentDetailLayout from '@/components/layout/StudentDetailLayout'

// 폼 검증 스키마 - Database 타입과 일치시키기 위해 status를 optional로 수정
const studentFormSchema = z.object({
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

type StudentFormValues = z.infer<typeof studentFormSchema>

export default function NewStudentPage() {
  const router = useRouter()
  const { profile } = useAuthStore()
  const { actions } = useStudentsStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassSearchResult | null>(null)
  const [showClassSelector, setShowClassSelector] = useState(false)
  const [enrollingInClass, setEnrollingInClass] = useState(false)

  const tenantId = profile?.tenant_id

  // Supabase 클라이언트
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // React Hook Form 설정
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty }
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      status: 'active'
    }
  })

  // 클래스 등록 핸들러
  const enrollStudentInClass = useCallback(async (studentId: string, classId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('인증 토큰이 없습니다')
      }

      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenantId,
          studentId,
          classId,
          packageId: null, // 기본 패키지 (추후 확장 가능)
          finalPrice: 0,
          notes: `학생 생성 시 ${selectedClass?.name} 클래스에 배정`
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '클래스 등록 실패')
      }

      return await response.json()
    } catch (error) {
      console.error('클래스 등록 중 오류:', error)
      throw error
    }
  }, [tenantId, supabase.auth, selectedClass])

  // 폼 제출 핸들러
  const onSubmit = useCallback(async (data: StudentFormValues) => {
    if (!tenantId) {
      console.error('테넌트 정보를 찾을 수 없습니다.')
      toast.error('테넌트 정보를 찾을 수 없습니다.')
      return
    }

    setIsSubmitting(true)
    const loadingToast = toast.loading('학생을 등록하는 중...')
    
    try {
      console.log('📝 폼 데이터:', data)
      
      const studentData: any = {
        ...data,
        email: data.email || undefined, // 빈 문자열을 undefined로 변환
        phone: data.phone || undefined,
        parent_name: data.parent_name || undefined,
        parent_phone_1: data.parent_phone_1 || undefined,
        parent_phone_2: data.parent_phone_2 || undefined,
        grade: data.grade_level || undefined,
        school: data.school_name || undefined,
        address: data.address || undefined,
        memo: data.notes || undefined
      }
      
      console.log('🚀 전송할 데이터:', studentData)
      
      const newStudent = await actions.createStudent(studentData, tenantId)
      
      console.log('✅ 학생 등록 완료:', newStudent)
      
      // 클래스가 선택된 경우 클래스에 등록
      if (selectedClass) {
        setEnrollingInClass(true)
        toast.dismiss(loadingToast)
        const classEnrollToast = toast.loading(`${selectedClass.name} 클래스에 등록하는 중...`)
        
        try {
          await enrollStudentInClass(newStudent.id, selectedClass.id)
          toast.dismiss(classEnrollToast)
          toast.success(`학생이 성공적으로 등록되고 ${selectedClass.name} 클래스에 배정되었습니다.`)
        } catch (classError) {
          toast.dismiss(classEnrollToast)
          toast.error(`학생은 등록되었지만 클래스 배정에 실패했습니다: ${classError instanceof Error ? classError.message : '알 수 없는 오류'}`)
        } finally {
          setEnrollingInClass(false)
        }
      } else {
        toast.dismiss(loadingToast)
        toast.success('학생이 성공적으로 등록되었습니다.')
      }
      
      // 약간의 딜레이로 사용자가 성공 메시지를 볼 수 있게 함
      setTimeout(() => {
        router.push(`/main/students/${newStudent.id}`)
      }, 1000)
    } catch (error) {
      console.error('❌ 학생 등록 실패:', error)
      toast.dismiss(loadingToast)
      toast.error(error instanceof Error ? error.message : '학생 등록에 실패했습니다.')
      setIsSubmitting(false)
    }
  }, [tenantId, actions, router, selectedClass, enrollStudentInClass])

  // 클래스 선택 핸들러
  const handleClassSelected = useCallback((classData: ClassSearchResult) => {
    setSelectedClass(classData)
    setShowClassSelector(false)
  }, [])

  // 클래스 선택 해제
  const handleRemoveClass = useCallback(() => {
    setSelectedClass(null)
  }, [])

  // 취소 핸들러
  const handleCancel = useCallback(() => {
    if (isDirty) {
      if (confirm('작성중인 내용이 있습니다. 정말로 취소하시겠습니까?')) {
        router.back()
      }
    } else {
      router.back()
    }
  }, [isDirty, router])

  return (
    <StudentDetailLayout showSearchSidebar={true} searchContext="students">
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
            <UserPlusIcon className="h-8 w-8 mr-3 text-blue-600" />
            새 학생 등록
          </h1>
          <p className="text-gray-600 mt-1">새로운 학생의 정보를 입력해주세요.</p>
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
                <Select defaultValue="active" onValueChange={(value) => setValue('status', value as 'active' | 'inactive')}>
                  <SelectTrigger>
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">활동중</SelectItem>
                    <SelectItem value="inactive">비활성</SelectItem>
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

        {/* 클래스 배정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AcademicCapIcon className="w-5 h-5 text-blue-600" />
              클래스 배정 (선택사항)
            </CardTitle>
            <p className="text-sm text-gray-600">
              학생을 특정 클래스에 바로 배정하려면 클래스를 선택하세요. 나중에도 배정할 수 있습니다.
            </p>
          </CardHeader>
          <CardContent>
            {selectedClass ? (
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {selectedClass.name}
                      </h4>
                      <Badge variant="default">
                        {selectedClass.current_student_count}/{selectedClass.max_students || '무제한'}명
                      </Badge>
                      {selectedClass.grade && (
                        <Badge variant="outline">
                          {selectedClass.grade}학년
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {selectedClass.subject && <span>과목: {selectedClass.subject}</span>}
                      {selectedClass.instructor_name && (
                        <span className="ml-4">담당강사: {selectedClass.instructor_name}</span>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveClass}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                <AcademicCapIcon className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 mb-4">클래스를 선택하지 않았습니다</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowClassSelector(true)}
                  className="flex items-center gap-2"
                >
                  <AcademicCapIcon className="w-4 h-4" />
                  클래스 선택
                </Button>
              </div>
            )}
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
            disabled={isSubmitting || enrollingInClass}
            className="min-w-[120px] transition-all"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>등록 중...</span>
              </div>
            ) : enrollingInClass ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>클래스 배정 중...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <UserPlusIcon className="h-4 w-4" />
                <span>
                  {selectedClass ? `학생 등록 및 ${selectedClass.name} 배정` : '학생 등록'}
                </span>
              </div>
            )}
          </Button>
        </div>
      </form>

      {/* 클래스 선택 Modal */}
      <ClassSearchSelector
        isOpen={showClassSelector}
        onClose={() => setShowClassSelector(false)}
        onClassSelected={handleClassSelected}
        allowMultiple={false}
        activeOnly={true}
        title="클래스 선택"
        description="새로 등록할 학생을 배정할 클래스를 선택하세요"
      />
    </div>
    </StudentDetailLayout>
  )
}