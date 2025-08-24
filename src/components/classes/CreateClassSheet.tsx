'use client'

import React, { memo, useCallback, useEffect, useState } from 'react'
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ClassForm, ClassFormData, SelectOption } from './ClassForm'
import { ClassStudentManager } from './ClassStudentManager'
import { useClassesStore } from '@/store/classesStore'
import { useAuthStore } from '@/store/useAuthStore'
import { AcademicCapIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import { toast } from 'sonner'

/**
 * CreateClassSheet Props
 */
export interface CreateClassSheetProps {
  /** Sheet 열림 상태 */
  isOpen: boolean
  /** Sheet 닫기 핸들러 */
  onClose: () => void
  /** 생성 성공 콜백 */
  onSuccess?: (classData: ClassFormData) => void
  /** 추가 CSS 클래스 */
  className?: string
}

/**
 * CreateClassSheet - 클래스 생성 Sheet 컴포넌트
 * 
 * 특징:
 * - ClassForm 재사용
 * - 실시간 강사/교실 목록 로드
 * - 성공/실패 처리
 * - 접근성 완벽 지원
 * - 에러 처리 및 사용자 피드백
 * - 오른쪽에서 슬라이드되는 Sheet UI
 */
export const CreateClassSheet = memo<CreateClassSheetProps>(({
  isOpen,
  onClose,
  onSuccess,
  className
}) => {
  // 상태 관리
  const { 
    createClass, 
    loading, 
    error,
    clearError
  } = useClassesStore()
  
  const { 
    profile: userProfile
  } = useAuthStore()

  // 로컬 상태
  const [instructors, setInstructors] = useState<SelectOption[]>([])
  const [subjects, setSubjects] = useState<SelectOption[]>([])
  const [courses, setCourses] = useState<SelectOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [step, setStep] = useState<'form' | 'students'>('form')
  const [createdClass, setCreatedClass] = useState<{ id: string; name: string } | null>(null)

  // 테넌트 ID 가져오기
  const tenantId = userProfile?.tenant_id

  // Supabase 클라이언트
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 강사 목록 로드
  const loadInstructors = useCallback(async () => {
    if (!tenantId) return

    try {
      // Supabase 세션에서 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('인증 토큰이 없습니다')
        return
      }

      console.log('🔍 강사 API 호출 시작:', `/api/tenant-admin/members?tenantId=${tenantId}&job_function=instructor`)

      const response = await fetch(`/api/tenant-admin/members?tenantId=${tenantId}&job_function=instructor`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('📡 강사 API 응답 상태:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ 강사 API 오류:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        })
        throw new Error(`강사 목록 로드 실패: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      console.log('🔍 강사 API 전체 응답:', data) // 전체 구조 확인
      
      // API 응답 구조: { members: [...], stats: {...} }
      if (Array.isArray(data.members)) {
        const instructorArray = data.members
        console.log('✅ 강사 배열 확인:', instructorArray.length, '개')
        console.log('✅ 첫 번째 강사:', instructorArray[0])
        
        const instructorOptions: SelectOption[] = instructorArray.map((instructor: any) => ({
          value: instructor.id,
          label: instructor.name || '이름 없음'
        }))
        
        console.log('✅ 강사 옵션 생성 완료:', instructorOptions)
        setInstructors(instructorOptions)
      } else {
        console.error('❌ 강사 API 응답 구조 오류:', {
          hasSuccess: 'success' in data,
          hasData: 'data' in data,
          hasInstructors: data.data && 'instructors' in data.data,
          isArray: data.data && Array.isArray(data.data.instructors),
          responseKeys: Object.keys(data)
        })
        
        // 빈 배열로 설정
        setInstructors([])
      }
    } catch (error) {
      console.error('💥 강사 목록 로드 중 오류:', error)
      setInstructors([]) // 에러 시 빈 배열로 설정
    }
  }, [tenantId, supabase.auth])

  // 과목 목록 로드
  const loadSubjects = useCallback(async () => {
    if (!tenantId) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('과목 로드: 인증 토큰이 없습니다')
        return
      }

      console.log('🔍 과목 API 호출 시작:', `/api/tenant-subjects?tenantId=${tenantId}`)

      const response = await fetch(`/api/tenant-subjects?tenantId=${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('📡 과목 API 응답 상태:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ 과목 API 오류:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        })
        throw new Error(`과목 목록 로드 실패: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      console.log('🔍 과목 API 전체 응답:', data) // 디버깅용
      
      if (data.success && data.data && Array.isArray(data.data.subjects)) {
        const subjectOptions: SelectOption[] = data.data.subjects.map((subject: any) => ({
          value: subject.name,
          label: subject.name
        }))
        console.log('✅ 과목 옵션 생성:', subjectOptions) // 디버깅용
        setSubjects(subjectOptions)
      } else if (data.success && Array.isArray(data.subjects)) {
        // 백워드 호환성
        const subjectOptions: SelectOption[] = data.subjects.map((subject: any) => ({
          value: subject.name,
          label: subject.name
        }))
        setSubjects(subjectOptions)
      } else {
        console.error('❌ 과목 데이터 구조 오류:', data)
        setSubjects([])
      }
    } catch (error) {
      console.error('💥 과목 목록 로드 중 오류:', error)
      setSubjects([]) // 에러 시 빈 배열로 설정
    }
  }, [tenantId, supabase.auth])

  // 과정 목록 로드
  const loadCourses = useCallback(async () => {
    if (!tenantId) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('과정 로드: 인증 토큰이 없습니다')
        return
      }

      console.log('🔍 과정 API 호출 시작:', `/api/tenant-courses?tenantId=${tenantId}`)

      const response = await fetch(`/api/tenant-courses?tenantId=${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('📡 과정 API 응답 상태:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ 과정 API 오류:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        })
        throw new Error(`과정 목록 로드 실패: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      console.log('🔍 과정 API 전체 응답:', data) // 디버깅용
      
      if (data.success && data.data && Array.isArray(data.data.courses)) {
        const courseOptions: SelectOption[] = data.data.courses.map((course: any) => ({
          value: course.name,
          label: course.name
        }))
        console.log('✅ 과정 옵션 생성:', courseOptions) // 디버깅용
        setCourses(courseOptions)
      } else if (data.success && Array.isArray(data.courses)) {
        // 백워드 호환성
        const courseOptions: SelectOption[] = data.courses.map((course: any) => ({
          value: course.name,
          label: course.name
        }))
        setCourses(courseOptions)
      } else {
        console.error('❌ 과정 데이터 구조 오류:', data)
        setCourses([])
      }
    } catch (error) {
      console.error('💥 과정 목록 로드 중 오류:', error)
      setCourses([]) // 에러 시 빈 배열로 설정
    }
  }, [tenantId, supabase.auth])

  // 옵션 데이터 로드
  const loadOptions = useCallback(async () => {
    setLoadingOptions(true)
    try {
      console.log('🚀 모든 옵션 데이터 로드 시작')
      
      // 각 API 호출을 독립적으로 처리 (하나가 실패해도 다른 것들은 계속 진행)
      const results = await Promise.allSettled([
        loadInstructors(),
        loadSubjects(),
        loadCourses()
      ])
      
      console.log('📊 옵션 로드 결과:', results.map((result, index) => ({
        api: ['instructors', 'subjects', 'courses'][index],
        status: result.status,
        ...(result.status === 'rejected' && { reason: result.reason })
      })))
      
    } catch (error) {
      console.error('💥 옵션 로드 중 전체 오류:', error)
    } finally {
      setLoadingOptions(false)
    }
  }, [loadInstructors, loadSubjects, loadCourses])

  // Sheet가 열릴 때 옵션 데이터 로드
  useEffect(() => {
    if (isOpen && tenantId) {
      loadOptions()
      clearError()
    }
  }, [isOpen, tenantId, loadOptions, clearError])

  // 클래스 생성 핸들러
  const handleSubmit = useCallback(async (formData: ClassFormData) => {
    if (!tenantId) {
      console.error('테넌트 ID가 없습니다')
      toast.error('로그인 정보를 확인해주세요')
      return
    }

    try {
      // Supabase 세션에서 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('로그인이 필요합니다')
        return
      }

      console.log('🎯 클래스 생성 시작:', { formData, tenantId, hasToken: !!session.access_token })
      
      const result = await createClass(formData, tenantId, session.access_token)
      
      console.log('🎉 클래스 생성 결과:', result)
      
      if (result) {
        // 클래스 생성 성공 후 학생 등록 단계로 이동
        setCreatedClass({ id: result.id, name: result.name })
        setStep('students')
        toast.success(`${result.name} 클래스가 생성되었습니다`)
        onSuccess?.(formData)
      } else {
        toast.error('클래스 생성에 실패했습니다')
      }
    } catch (error) {
      console.error('💥 클래스 생성 실패:', error)
      
      const errorMessage = error instanceof Error ? error.message : '클래스 생성에 실패했습니다'
      toast.error(errorMessage)
    }
  }, [tenantId, createClass, onSuccess, supabase.auth])

  // 학생 등록 단계 완료 핸들러
  const handleStudentsComplete = useCallback(() => {
    onClose()
  }, [onClose])

  // 학생 등록 단계 건너뛰기 핸들러
  const handleSkipStudents = useCallback(() => {
    onClose()
  }, [onClose])

  // 이전 단계로 돌아가기 (폼으로 돌아가기)
  const handleBackToForm = useCallback(() => {
    setStep('form')
    setCreatedClass(null)
  }, [])

  // Sheet 닫기 핸들러
  const handleClose = useCallback(() => {
    clearError()
    setStep('form')
    setCreatedClass(null)
    onClose()
  }, [clearError, onClose])

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-[700px] sm:max-w-[700px] px-8">
        <SheetHeader className="px-0 pb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
              <AcademicCapIcon className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <SheetTitle>
                {step === 'form' ? '새 클래스 만들기' : '학생 등록'}
              </SheetTitle>
              <SheetDescription>
                {step === 'form' 
                  ? '새로운 클래스의 정보를 입력해주세요'
                  : `${createdClass?.name} 클래스에 학생을 등록해보세요`
                }
              </SheetDescription>
            </div>
          </div>
          
          {/* 단계 표시 */}
          <div className="flex items-center gap-4 mt-4">
            <div className={`flex items-center gap-2 ${step === 'form' ? 'text-brand-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                step === 'form' ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-400'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">클래스 정보</span>
            </div>
            <ChevronRightIcon className="w-4 h-4 text-gray-300" />
            <div className={`flex items-center gap-2 ${step === 'students' ? 'text-brand-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                step === 'students' ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-400'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">학생 등록</span>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 px-0">
          {step === 'form' ? (
            <div className="space-y-4">
              {/* 에러 표시 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <span className="font-medium">오류 발생:</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}
              
              <ClassForm
                mode="create"
                onSubmit={handleSubmit}
                onCancel={handleClose}
                loading={loading}
                instructors={instructors}
                subjectOptions={subjects}
                courseOptions={courses}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {createdClass && (
                <ClassStudentManager
                  classId={createdClass.id}
                  className={createdClass.name}
                  readOnly={false}
                  onStudentsChange={(students) => {
                    console.log('등록된 학생 수:', students.length)
                  }}
                />
              )}
              
              <SheetFooter className="flex gap-3 pt-6">
                <Button 
                  variant="outline" 
                  onClick={handleBackToForm}
                  className="flex items-center gap-2"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  뒤로 가기
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSkipStudents}
                >
                  나중에 등록
                </Button>
                <Button 
                  onClick={handleStudentsComplete}
                  className="flex items-center gap-2"
                >
                  완료
                </Button>
              </SheetFooter>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
})

CreateClassSheet.displayName = 'CreateClassSheet'