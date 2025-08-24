'use client'

import React, { memo, useCallback, useEffect, useState } from 'react'
import { Modal } from '@/components/ui'
import { DialogTitle } from '@/components/ui/dialog'
import { ClassForm, ClassFormData, SelectOption } from './ClassForm'
import { useClassesStore } from '@/store/classesStore'
import { useAuthStore } from '@/store/useAuthStore'
import { AcademicCapIcon } from '@heroicons/react/24/outline'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

/**
 * CreateClassModal Props
 */
export interface CreateClassModalProps {
  /** 모달 열림 상태 */
  isOpen: boolean
  /** 모달 닫기 핸들러 */
  onClose: () => void
  /** 생성 성공 콜백 */
  onSuccess?: (classData: ClassFormData) => void
  /** 추가 CSS 클래스 */
  className?: string
}

/**
 * CreateClassModal - 클래스 생성 모달 컴포넌트
 * 
 * 특징:
 * - ClassForm 재사용
 * - 실시간 강사/교실 목록 로드
 * - 성공/실패 처리
 * - 접근성 완벽 지원
 * - 에러 처리 및 사용자 피드백
 * 
 * @example
 * ```tsx
 * <CreateClassModal
 *   isOpen={isCreateModalOpen}
 *   onClose={() => setIsCreateModalOpen(false)}
 *   onSuccess={(classData) => {
 *     toast.success('클래스가 생성되었습니다')
 *     navigate(`/classes/${classData.id}`)
 *   }}
 * />
 * ```
 */
export const CreateClassModal = memo<CreateClassModalProps>(({
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

      const response = await fetch(`/api/tenant-admin/members?tenantId=${tenantId}&job_function=instructor`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        console.log('강사 목록 응답:', result) // 디버깅용
        if (result.members && Array.isArray(result.members)) {
          const instructorOptions = result.members.map((instructor: { id: string; name: string; email: string; status: string }) => ({
            value: instructor.id,
            label: instructor.name,
            disabled: instructor.status !== 'active'
          }))
          setInstructors(instructorOptions)
          console.log('강사 옵션 설정:', instructorOptions) // 디버깅용
        } else {
          console.log('강사 목록이 비어있거나 응답 구조가 다릅니다:', result)
        }
      } else {
        const error = await response.text()
        console.error('강사 목록 API 오류:', response.status, error)
      }
    } catch (error) {
      console.error('강사 목록 로드 실패:', error)
    }
  }, [tenantId])

  // 과목 목록 로드
  const loadSubjects = useCallback(async () => {
    if (!tenantId) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('인증 토큰이 없습니다')
        return
      }

      const response = await fetch(`/api/tenant-subjects?tenantId=${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data.subjects) {
          const subjectOptions = result.data.subjects.map((subject: { id: string; name: string }) => ({
            value: subject.name,
            label: subject.name,
            disabled: false // subject.is_active not available in this context
          }))
          setSubjects(subjectOptions)
        }
      }
    } catch (error) {
      console.error('과목 목록 로드 실패:', error)
    }
  }, [tenantId])

  // 과정 목록 로드
  const loadCourses = useCallback(async () => {
    if (!tenantId) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('인증 토큰이 없습니다')
        return
      }

      const response = await fetch(`/api/tenant-courses?tenantId=${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data.courses) {
          const courseOptions = result.data.courses.map((course: { id: string; name: string }) => ({
            value: course.name,
            label: course.name,
            disabled: false // course.is_active not available in this context
          }))
          setCourses(courseOptions)
        }
      }
    } catch (error) {
      console.error('과정 목록 로드 실패:', error)
    }
  }, [tenantId])


  // 옵션 데이터 로드
  const loadOptions = useCallback(async () => {
    if (!isOpen || !tenantId) return

    setLoadingOptions(true)
    try {
      await Promise.all([
        loadInstructors(),
        loadSubjects(),
        loadCourses()
      ])
    } finally {
      setLoadingOptions(false)
    }
  }, [isOpen, tenantId, loadInstructors, loadSubjects, loadCourses])

  // 모달이 열릴 때 옵션 데이터 로드
  useEffect(() => {
    loadOptions()
  }, [loadOptions])

  // 모달이 닫힐 때 에러 초기화
  useEffect(() => {
    if (!isOpen) {
      clearError()
    }
  }, [isOpen, clearError])

  // 폼 제출 핸들러
  const handleSubmit = useCallback(async (formData: ClassFormData) => {
    if (!tenantId) {
      console.error('테넌트 ID가 없습니다')
      return
    }

    try {
      // 빈 문자열을 undefined로 변환
      const cleanedData = {
        ...formData,
        instructor_id: formData.instructor_id || undefined,
        grade: formData.grade || undefined,
        course: formData.course || undefined,
        subject: formData.subject || undefined,
        color: formData.color || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined
      }

      const newClass = await createClass(cleanedData, tenantId)
      
      if (newClass) {
        onSuccess?.(newClass as any)
        onClose()
      }
    } catch (error) {
      console.error('클래스 생성 실패:', error)
    }
  }, [tenantId, createClass, onSuccess, onClose])

  // 모달 닫기 핸들러
  const handleClose = useCallback(() => {
    if (!loading) {
      onClose()
    }
  }, [loading, onClose])

  if (!tenantId) {
    return null
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="새 클래스 만들기"
      size="lg"
      className={className}
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
      header={
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
              <AcademicCapIcon className="w-6 h-6 text-brand-600" />
            </div>
          </div>
          <div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              새 클래스 만들기
            </DialogTitle>
            <p className="text-sm text-gray-500">
              새로운 클래스의 기본 정보를 입력해주세요
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* 에러 메시지 */}
        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg 
                  className="h-5 w-5 text-error-400" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-error-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 로딩 상태 */}
        {loadingOptions && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-600"></div>
              <span className="text-sm text-gray-600">
                옵션 데이터를 로드하는 중...
              </span>
            </div>
          </div>
        )}

        {/* 클래스 폼 */}
        <ClassForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleClose}
          loading={loading}
          disabled={loadingOptions}
          instructors={instructors}
          subjectOptions={subjects}
          courseOptions={courses}
        />

        {/* 디버깅 정보 (개발 환경에서만) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <div>강사 옵션 수: {instructors.length}</div>
            <div>과목 옵션 수: {subjects.length}</div>
            <div>과정 옵션 수: {courses.length}</div>
            <div>테넌트 ID: {tenantId}</div>
            <div>로딩 중: {loadingOptions ? '예' : '아니오'}</div>
          </div>
        )}
      </div>
    </Modal>
  )
})

CreateClassModal.displayName = 'CreateClassModal'