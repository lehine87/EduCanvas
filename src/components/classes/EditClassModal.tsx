'use client'

import React, { memo, useCallback, useEffect, useState } from 'react'
import { Modal } from '@/components/ui'
import { ClassForm, ClassFormData, SelectOption } from './ClassForm'
import { useClassesStore, ClassWithRelations } from '@/store/classesStore'
import { useAuthStore } from '@/store/useAuthStore'
import { PencilIcon } from '@heroicons/react/24/outline'

/**
 * EditClassModal Props
 */
export interface EditClassModalProps {
  /** 모달 열림 상태 */
  isOpen: boolean
  /** 모달 닫기 핸들러 */
  onClose: () => void
  /** 수정할 클래스 데이터 */
  classData?: ClassWithRelations | null
  /** 수정 성공 콜백 */
  onSuccess?: (classData: ClassWithRelations) => void
  /** 추가 CSS 클래스 */
  className?: string
}

/**
 * EditClassModal - 클래스 수정 모달 컴포넌트
 * 
 * 특징:
 * - ClassForm 재사용 (edit 모드)
 * - 기존 데이터 자동 로드
 * - 실시간 강사/교실 목록 로드
 * - 성공/실패 처리
 * - 접근성 완벽 지원
 * - 변경 사항 추적
 * 
 * @example
 * ```tsx
 * <EditClassModal
 *   isOpen={isEditModalOpen}
 *   onClose={() => setIsEditModalOpen(false)}
 *   classData={selectedClass}
 *   onSuccess={(updatedClass) => {
 *     toast.success('클래스가 수정되었습니다')
 *     setSelectedClass(updatedClass)
 *   }}
 * />
 * ```
 */
export const EditClassModal = memo<EditClassModalProps>(({
  isOpen,
  onClose,
  classData,
  onSuccess,
  className
}) => {
  // 상태 관리
  const { 
    updateClass, 
    fetchClassById,
    loading, 
    error,
    clearError
  } = useClassesStore()
  
  const { 
    profile: userProfile
  } = useAuthStore()

  // 로컬 상태
  const [instructors, setInstructors] = useState<SelectOption[]>([])
  const [classrooms, setClassrooms] = useState<SelectOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [loadingClassData, setLoadingClassData] = useState(false)
  const [currentClassData, setCurrentClassData] = useState<ClassWithRelations | null>(null)

  // 테넌트 ID 가져오기
  const tenantId = userProfile?.tenant_id

  // 강사 목록 로드
  const loadInstructors = useCallback(async () => {
    if (!tenantId) return

    try {
      const response = await fetch(`/api/instructors?tenantId=${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data.instructors) {
          const instructorOptions = result.data.instructors.map((instructor: any) => ({
            value: instructor.id,
            label: `${instructor.full_name} (${instructor.email})`,
            disabled: !instructor.is_active
          }))
          setInstructors(instructorOptions)
        }
      }
    } catch (error) {
      console.error('강사 목록 로드 실패:', error)
    }
  }, [tenantId])

  // 교실 목록 로드
  const loadClassrooms = useCallback(async () => {
    if (!tenantId) return

    try {
      const response = await fetch(`/api/classrooms?tenantId=${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data.classrooms) {
          const classroomOptions = result.data.classrooms.map((classroom: any) => ({
            value: classroom.id,
            label: `${classroom.name} (${classroom.building || '건물 미지정'})`,
            disabled: !classroom.is_active
          }))
          setClassrooms(classroomOptions)
        }
      }
    } catch (error) {
      console.error('교실 목록 로드 실패:', error)
    }
  }, [tenantId])

  // 클래스 상세 데이터 로드
  const loadClassData = useCallback(async () => {
    if (!classData?.id || !tenantId) return

    setLoadingClassData(true)
    try {
      await fetchClassById(classData.id, tenantId, false)
      setCurrentClassData(classData)
    } catch (error) {
      console.error('클래스 데이터 로드 실패:', error)
    } finally {
      setLoadingClassData(false)
    }
  }, [classData, tenantId, fetchClassById])

  // 옵션 데이터 로드
  const loadOptions = useCallback(async () => {
    if (!isOpen || !tenantId) return

    setLoadingOptions(true)
    try {
      await Promise.all([
        loadInstructors(),
        loadClassrooms()
      ])
    } finally {
      setLoadingOptions(false)
    }
  }, [isOpen, tenantId, loadInstructors, loadClassrooms])

  // 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (isOpen) {
      loadOptions()
      loadClassData()
    }
  }, [isOpen, loadOptions, loadClassData])

  // 클래스 데이터 변경 시 현재 데이터 업데이트
  useEffect(() => {
    if (classData) {
      setCurrentClassData(classData)
    }
  }, [classData])

  // 모달이 닫힐 때 에러 초기화
  useEffect(() => {
    if (!isOpen) {
      clearError()
      setCurrentClassData(null)
    }
  }, [isOpen, clearError])

  // 폼 제출 핸들러
  const handleSubmit = useCallback(async (formData: ClassFormData) => {
    if (!tenantId || !currentClassData?.id) {
      console.error('테넌트 ID 또는 클래스 ID가 없습니다')
      return
    }

    try {
      // 빈 문자열을 undefined로 변환
      const cleanedData = {
        ...formData,
        instructor_id: formData.instructor_id || undefined,
        classroom_id: formData.classroom_id || undefined,
        grade: formData.grade || undefined,
        course: formData.course || undefined,
        subject: formData.subject || undefined,
        color: formData.color || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined
      }

      const updatedClass = await updateClass(currentClassData.id, cleanedData, tenantId)
      
      if (updatedClass) {
        onSuccess?.(updatedClass)
        onClose()
      }
    } catch (error) {
      console.error('클래스 수정 실패:', error)
    }
  }, [tenantId, currentClassData?.id, updateClass, onSuccess, onClose])

  // 모달 닫기 핸들러
  const handleClose = useCallback(() => {
    if (!loading && !loadingClassData) {
      onClose()
    }
  }, [loading, loadingClassData, onClose])

  if (!tenantId) {
    return null
  }

  const isLoading = loading || loadingClassData || loadingOptions

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="클래스 수정"
      size="lg"
      className={className}
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
      header={
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
              <PencilIcon className="w-6 h-6 text-brand-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              클래스 수정
            </h3>
            <p className="text-sm text-gray-500">
              {currentClassData?.name ? (
                <>"{currentClassData.name}" 클래스 정보를 수정합니다</>
              ) : (
                '클래스 정보를 수정해주세요'
              )}
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
        {isLoading && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-600"></div>
              <span className="text-sm text-gray-600">
                {loadingClassData ? '클래스 데이터를 로드하는 중...' : 
                 loadingOptions ? '옵션 데이터를 로드하는 중...' : 
                 '처리 중...'}
              </span>
            </div>
          </div>
        )}

        {/* 클래스 폼 */}
        {currentClassData && !loadingClassData && (
          <ClassForm
            mode="edit"
            initialData={currentClassData}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            loading={loading}
            disabled={loadingOptions}
            instructors={instructors}
            classrooms={classrooms}
            gradeOptions={[
              { value: '', label: '학년 선택' },
              { value: '초1', label: '초등학교 1학년' },
              { value: '초2', label: '초등학교 2학년' },
              { value: '초3', label: '초등학교 3학년' },
              { value: '초4', label: '초등학교 4학년' },
              { value: '초5', label: '초등학교 5학년' },
              { value: '초6', label: '초등학교 6학년' },
              { value: '중1', label: '중학교 1학년' },
              { value: '중2', label: '중학교 2학년' },
              { value: '중3', label: '중학교 3학년' },
              { value: '고1', label: '고등학교 1학년' },
              { value: '고2', label: '고등학교 2학년' },
              { value: '고3', label: '고등학교 3학년' },
              { value: '성인', label: '성인' },
              { value: '기타', label: '기타' }
            ]}
            courseOptions={[
              { value: '', label: '과정 선택' },
              { value: '정규', label: '정규 과정' },
              { value: '특별', label: '특별 과정' },
              { value: '심화', label: '심화 과정' },
              { value: '기초', label: '기초 과정' },
              { value: '입시', label: '입시 과정' },
              { value: '기타', label: '기타' }
            ]}
          />
        )}

        {/* 클래스 데이터가 없는 경우 */}
        {!currentClassData && !loadingClassData && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <PencilIcon className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-500">
              수정할 클래스 데이터를 불러올 수 없습니다.
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
})

EditClassModal.displayName = 'EditClassModal'