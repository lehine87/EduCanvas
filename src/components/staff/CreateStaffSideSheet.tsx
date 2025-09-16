'use client'

import React, { memo, useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCreateInstructor } from '@/hooks/mutations/useStaffMutations'
import { useAuthStore } from '@/store/useAuthStore'
import { 
  UserPlusIcon, 
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { Loader2 } from 'lucide-react'
import type { Instructor } from '@/types/staff.types'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

/**
 * CreateStaffSideSheet Props
 */
export interface CreateStaffSideSheetProps {
  /** Sheet 열림 상태 */
  open: boolean
  /** Sheet 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void
  /** 생성 성공 콜백 */
  onSuccess?: (instructor: Instructor) => void
  /** 사이드바 너비 */
  sidebarWidth?: number
  /** 추가 CSS 클래스 */
  className?: string
}

/**
 * 강사 폼 데이터 타입
 */
interface InstructorFormData {
  // 사용자 정보
  name: string
  email: string
  phone?: string
  
  // 직원 정보
  employee_id: string
  department: string
  position?: string
  employment_type: '정규직' | '계약직' | '파트타임'
  status: 'active' | 'inactive' | 'pending'
  hire_date?: string
  
  // 강의 정보
  teaching_level?: '초급' | '중급' | '고급'
  subjects?: string
  certifications?: string
  specialties?: string
  max_classes_per_week?: number
  
  // 비상연락처
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relationship?: string
  
  // 기타
  notes?: string
}

const initialFormData: InstructorFormData = {
  name: '',
  email: '',
  phone: '',
  employee_id: '',
  department: '',
  position: '',
  employment_type: '정규직',
  status: 'active' as const,
  hire_date: '',
  teaching_level: '초급',
  subjects: '',
  certifications: '',
  specialties: '',
  max_classes_per_week: 20,
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_relationship: '',
  notes: ''
}

/**
 * CreateStaffSideSheet - 강사 등록 Sheet 컴포넌트
 * 
 * 특징:
 * - 학생 등록 Sheet와 동일한 UI 패턴
 * - 실시간 입력 검증
 * - 성공/실패 처리
 * - 접근성 완벽 지원
 * - 오른쪽에서 슬라이드되는 Sheet UI
 */
const CreateStaffSideSheet = memo<CreateStaffSideSheetProps>(({
  open,
  onOpenChange,
  onSuccess,
  sidebarWidth = 384, // 사이드바 기본 너비
  className
}) => {
  // 상태 관리
  const { profile: userProfile } = useAuthStore()
  const createInstructorMutation = useCreateInstructor()

  // 로컬 상태
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<InstructorFormData>(initialFormData)

  // 테넌트 ID
  const tenantId = userProfile?.tenant_id

  // Sheet가 열릴 때 초기화
  useEffect(() => {
    if (open) {
      setFormData(initialFormData)
      setError(null)
      setValidationErrors({})
    }
  }, [open])

  // 입력값 변경 핸들러 (실시간 검증 포함)
  const handleInputChange = useCallback((field: keyof InstructorFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // 기본 에러 초기화
    if (error) setError(null)
    
    // 실시간 필드별 검증
    const newValidationErrors = { ...validationErrors }
    
    // 해당 필드의 에러 제거
    delete newValidationErrors[field]
    
    // 이름 실시간 검증
    if (field === 'name' && value) {
      if (value.trim().length < 2) {
        newValidationErrors.name = '이름은 2자 이상 입력해주세요'
      }
    }
    
    // 이메일 실시간 검증
    if (field === 'email' && value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newValidationErrors.email = '올바른 이메일 형식을 입력해주세요'
      }
    }
    
    setValidationErrors(newValidationErrors)
  }, [error, validationErrors])

  // 강화된 폼 검증
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}

    // 필수 필드 검증
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '이름은 2자 이상 입력해주세요'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요'
    }

    if (!formData.employee_id.trim()) {
      newErrors.employee_id = '사번을 입력해주세요'
    }

    if (!formData.department.trim()) {
      newErrors.department = '부서를 입력해주세요'
    }

    setValidationErrors(newErrors)
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors }
  }, [formData])

  // 강사 생성 핸들러
  const handleSubmit = useCallback(async () => {
    if (!tenantId) {
      setError('로그인 정보를 확인해주세요')
      return
    }

    // 강화된 폼 검증 실행
    const validation = validateForm()
    if (!validation.isValid) {
      setError('입력 정보를 확인해주세요')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🎯 강사 생성 시작:', { formData, tenantId })
      
      // API 호출을 위한 데이터 구성
      const instructorData = {
        user_id: '', // 새로운 사용자를 생성하는 경우 빈 문자열
        tenant_id: tenantId,
        staff_info: {
          employee_id: formData.employee_id,
          employment_type: formData.employment_type,
          department: formData.department,
          position: formData.position || null,
          emergency_contact: formData.emergency_contact_name ? {
            name: formData.emergency_contact_name,
            relationship: formData.emergency_contact_relationship || '',
            phone: formData.emergency_contact_phone || ''
          } : null,
          instructor_info: {
            subjects: formData.subjects ? formData.subjects.split(',').map(s => s.trim()) : [],
            certifications: formData.certifications ? formData.certifications.split(',').map(s => s.trim()) : [],
            specialties: formData.specialties ? formData.specialties.split(',').map(s => s.trim()) : [],
            teaching_level: formData.teaching_level || null,
            max_classes_per_week: formData.max_classes_per_week || null
          }
        },
        hire_date: formData.hire_date || null,
        bio: formData.notes || null,
        // 사용자 정보는 별도로 전달
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null
      }
      
      // React Query Mutation 사용
      const result = await createInstructorMutation.mutateAsync(instructorData)
      
      console.log('🎉 강사 생성 성공:', result)
      
      toast.success(`${formData.name} 강사가 등록되었습니다`)
      onSuccess?.(result.instructor)
      onOpenChange(false)
    } catch (error) {
      console.error('💥 강사 생성 실패:', error)
      
      const errorMessage = error instanceof Error ? error.message : '강사 등록에 실패했습니다'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [tenantId, formData, validateForm, createInstructorMutation, onSuccess, onOpenChange])

  // Sheet 닫기 핸들러
  const handleClose = useCallback(() => {
    setError(null)
    onOpenChange(false)
  }, [onOpenChange])

  // 취소 핸들러
  const handleCancel = useCallback(() => {
    if (formData.name || formData.employee_id || formData.email) {
      // 입력된 내용이 있으면 확인
      if (confirm('입력된 내용이 사라집니다. 정말 취소하시겠습니까?')) {
        handleClose()
      }
    } else {
      handleClose()
    }
  }, [formData, handleClose])

  return (
    <>
      {/* 메인 영역 오버레이 */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bg-black/30 z-30"
            style={{ 
              left: `${sidebarWidth}px`, // 사이드바 바로 다음부터
              top: '65px',
              right: 0,
              bottom: 0
            }}
            onClick={() => onOpenChange(false)}
          />
        )}
      </AnimatePresence>

      {/* Sheet 본체 - 사이드바 오른쪽에서 나타남 */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 200,
              duration: 0.3
            }}
            className={cn(
              "fixed w-[700px] origin-left",
              "bg-white dark:bg-neutral-950",
              "border-r border-neutral-200 dark:border-neutral-800",
              "shadow-xl",
              className
            )}
            style={{ 
              left: `${sidebarWidth}px`,
              top: '65px', // 헤더 아래부터 시작
              bottom: 0,
              zIndex: 30
            }}
          >
            <div className="flex flex-col h-full">
              {/* 헤더 */}
              <div className="px-8 py-6 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
                      <UserPlusIcon className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        새 강사 등록
                      </h2>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        새로운 강사의 정보를 입력해주세요
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onOpenChange(false)}
                    className="h-8 w-8"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* 폼 콘텐츠 */}
              <ScrollArea className="flex-1 px-8">
                <div className="space-y-6 py-6">
                  {/* 에러 표시 */}
                  {error && (
                    <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-error-700">
                        <ExclamationTriangleIcon className="w-5 h-5" />
                        <span className="font-medium">{error}</span>
                      </div>
                    </div>
                  )}

                  {/* 기본 정보 섹션 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      기본 정보
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                            강사 이름 <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="강사 이름을 입력하세요"
                            className={cn(
                              validationErrors.name && 'border-red-300 focus:border-red-500'
                            )}
                          />
                          {validationErrors.name && (
                            <p className="text-xs text-red-600 mt-1">{validationErrors.name}</p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="employee_id" className="text-sm font-medium text-gray-700">
                            사번 <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="employee_id"
                            value={formData.employee_id || ''}
                            onChange={(e) => handleInputChange('employee_id', e.target.value)}
                            placeholder="사번을 입력하세요"
                            className={cn(
                              validationErrors.employee_id && 'border-red-300 focus:border-red-500'
                            )}
                          />
                          {validationErrors.employee_id && (
                            <p className="text-xs text-red-600 mt-1">{validationErrors.employee_id}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                            이메일 <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="instructor@example.com"
                            className={cn(
                              validationErrors.email && 'border-red-300 focus:border-red-500'
                            )}
                          />
                          {validationErrors.email && (
                            <p className="text-xs text-red-600 mt-1">{validationErrors.email}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                            연락처
                          </Label>
                          <Input
                            id="phone"
                            value={formData.phone || ''}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="010-1234-5678"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* 근무 정보 섹션 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                      <CalendarDaysIcon className="w-4 h-4" />
                      근무 정보
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                            부서 <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="department"
                            value={formData.department}
                            onChange={(e) => handleInputChange('department', e.target.value)}
                            placeholder="교무부"
                            className={cn(
                              validationErrors.department && 'border-red-300 focus:border-red-500'
                            )}
                          />
                          {validationErrors.department && (
                            <p className="text-xs text-red-600 mt-1">{validationErrors.department}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="position" className="text-sm font-medium text-gray-700">
                            직위
                          </Label>
                          <Input
                            id="position"
                            value={formData.position || ''}
                            onChange={(e) => handleInputChange('position', e.target.value)}
                            placeholder="수석강사"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="employment_type" className="text-sm font-medium text-gray-700">
                            고용형태
                          </Label>
                          <Select 
                            value={formData.employment_type} 
                            onValueChange={(value) => handleInputChange('employment_type', value as any)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="정규직">정규직</SelectItem>
                              <SelectItem value="계약직">계약직</SelectItem>
                              <SelectItem value="파트타임">파트타임</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="hire_date" className="text-sm font-medium text-gray-700">
                            입사일
                          </Label>
                          <Input
                            id="hire_date"
                            type="date"
                            value={formData.hire_date || ''}
                            onChange={(e) => handleInputChange('hire_date', e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                          재직 상태
                        </Label>
                        <Select 
                          value={formData.status} 
                          onValueChange={(value) => handleInputChange('status', value as 'active' | 'inactive' | 'pending')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">재직</SelectItem>
                            <SelectItem value="inactive">퇴직</SelectItem>
                            <SelectItem value="pending">대기</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* 강의 정보 섹션 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-4">
                      강의 정보
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="teaching_level" className="text-sm font-medium text-gray-700">
                            강의 레벨
                          </Label>
                          <Select 
                            value={formData.teaching_level || ''} 
                            onValueChange={(value) => handleInputChange('teaching_level', value || undefined)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="레벨 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="초급">초급</SelectItem>
                              <SelectItem value="중급">중급</SelectItem>
                              <SelectItem value="고급">고급</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="max_classes_per_week" className="text-sm font-medium text-gray-700">
                            주간 최대 수업 수
                          </Label>
                          <Input
                            id="max_classes_per_week"
                            type="number"
                            min="0"
                            max="50"
                            value={formData.max_classes_per_week || ''}
                            onChange={(e) => handleInputChange('max_classes_per_week', parseInt(e.target.value) || undefined)}
                            placeholder="20"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="subjects" className="text-sm font-medium text-gray-700">
                          담당 과목
                        </Label>
                        <Input
                          id="subjects"
                          value={formData.subjects || ''}
                          onChange={(e) => handleInputChange('subjects', e.target.value)}
                          placeholder="수학, 영어, 과학 (쉼표로 구분)"
                        />
                      </div>

                      <div>
                        <Label htmlFor="certifications" className="text-sm font-medium text-gray-700">
                          자격증
                        </Label>
                        <Input
                          id="certifications"
                          value={formData.certifications || ''}
                          onChange={(e) => handleInputChange('certifications', e.target.value)}
                          placeholder="교원자격증, TESOL (쉼표로 구분)"
                        />
                      </div>

                      <div>
                        <Label htmlFor="specialties" className="text-sm font-medium text-gray-700">
                          전문 분야
                        </Label>
                        <Input
                          id="specialties"
                          value={formData.specialties || ''}
                          onChange={(e) => handleInputChange('specialties', e.target.value)}
                          placeholder="입시수학, 영어회화 (쉼표로 구분)"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* 비상연락처 섹션 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4" />
                      비상연락처
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="emergency_contact_name" className="text-sm font-medium text-gray-700">
                            이름
                          </Label>
                          <Input
                            id="emergency_contact_name"
                            value={formData.emergency_contact_name || ''}
                            onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                            placeholder="김영희"
                          />
                        </div>

                        <div>
                          <Label htmlFor="emergency_contact_phone" className="text-sm font-medium text-gray-700">
                            연락처
                          </Label>
                          <Input
                            id="emergency_contact_phone"
                            value={formData.emergency_contact_phone || ''}
                            onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                            placeholder="010-9876-5432"
                          />
                        </div>

                        <div>
                          <Label htmlFor="emergency_contact_relationship" className="text-sm font-medium text-gray-700">
                            관계
                          </Label>
                          <Input
                            id="emergency_contact_relationship"
                            value={formData.emergency_contact_relationship || ''}
                            onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                            placeholder="배우자"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* 기타 정보 섹션 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-4">
                      기타 정보
                    </h3>
                    <div>
                      <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                        특이사항
                      </Label>
                      <Textarea
                        id="notes"
                        value={formData.notes || ''}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        placeholder="특이사항이나 추가 메모를 입력하세요"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* 푸터 */}
              <div className="px-8 py-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1"
                  >
                    <XMarkIcon className="w-4 h-4 mr-1" />
                    취소
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={loading || !formData.name.trim()}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        등록 중...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4 mr-1" />
                        강사 등록
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
})

CreateStaffSideSheet.displayName = 'CreateStaffSideSheet'

export default CreateStaffSideSheet