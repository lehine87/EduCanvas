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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useUpdateInstructor, useDeleteInstructor } from '@/hooks/mutations/useInstructorMutations'
import { useInstructor } from '@/hooks/queries'
import { useAuthStore } from '@/store/useAuthStore'
import { 
  UserIcon,
  PencilIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { Loader2 } from 'lucide-react'
import type { Instructor, StaffInfo } from '@/types/staff.types'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

/**
 * InstructorDetailSideSheet Props
 */
export interface InstructorDetailSideSheetProps {
  /** Sheet 열림 상태 */
  open: boolean
  /** Sheet 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void
  /** 표시할 강사 ID */
  instructorId: string
  /** 사이드바 너비 */
  sidebarWidth?: number
  /** 추가 CSS 클래스 */
  className?: string
  /** 수정 성공 콜백 */
  onUpdateSuccess?: (instructor: Instructor) => void
  /** 삭제 성공 콜백 */
  onDeleteSuccess?: (instructorId: string) => void
}

/**
 * 강사 폼 데이터 타입
 */
interface InstructorFormData {
  // 기본 정보  
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

/**
 * InstructorDetailSideSheet - 강사 상세/수정 Sheet 컴포넌트
 * 
 * 특징:
 * - 학생 상세 Sheet와 동일한 UI 패턴
 * - 실시간 입력 검증
 * - 수정/삭제 처리
 * - 접근성 완벽 지원
 * - 오른쪽에서 슬라이드되는 Sheet UI
 */
export const InstructorDetailSideSheet = memo<InstructorDetailSideSheetProps>(({
  open,
  onOpenChange,
  instructorId,
  sidebarWidth = 384,
  className,
  onUpdateSuccess,
  onDeleteSuccess
}) => {
  // 상태 관리
  const { profile: userProfile } = useAuthStore()
  const { data: instructorData, isLoading: instructorLoading } = useInstructor(instructorId)
  const updateInstructorMutation = useUpdateInstructor()
  const deleteInstructorMutation = useDeleteInstructor()

  // 로컬 상태
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<InstructorFormData>({
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
  })

  const instructor = instructorData?.instructor

  // 강사 데이터로 폼 초기화
  useEffect(() => {
    if (instructor && open) {
      setFormData({
        name: instructor.user?.name || '',
        email: instructor.user?.email || '',
        phone: instructor.user?.phone || '',
        employee_id: (instructor.staff_info as StaffInfo)?.employee_id || '',
        department: (instructor.staff_info as StaffInfo)?.department || '',
        position: (instructor.staff_info as StaffInfo)?.position || '',
        employment_type: (instructor.staff_info as StaffInfo)?.employment_type || '정규직',
        status: (instructor.status as 'active' | 'inactive' | 'pending') || 'active',
        hire_date: instructor.hire_date || '',
        teaching_level: (instructor.staff_info as StaffInfo)?.instructor_info?.teaching_level || '초급',
        subjects: (instructor.staff_info as StaffInfo)?.instructor_info?.subjects?.join(', ') || '',
        certifications: (instructor.staff_info as StaffInfo)?.instructor_info?.certifications?.join(', ') || '',
        specialties: (instructor.staff_info as StaffInfo)?.instructor_info?.specialties?.join(', ') || '',
        max_classes_per_week: (instructor.staff_info as StaffInfo)?.instructor_info?.max_classes_per_week || 20,
        emergency_contact_name: (instructor.staff_info as StaffInfo)?.emergency_contact?.name || '',
        emergency_contact_phone: (instructor.staff_info as StaffInfo)?.emergency_contact?.phone || '',
        emergency_contact_relationship: (instructor.staff_info as StaffInfo)?.emergency_contact?.relationship || '',
        notes: instructor.bio || ''
      })
      setError(null)
      setValidationErrors({})
    }
  }, [instructor, open])

  // Sheet가 닫힐 때 편집 모드 해제
  useEffect(() => {
    if (!open) {
      setIsEditing(false)
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

  // 강사 수정 핸들러
  const handleSubmit = useCallback(async () => {
    if (!instructor) return

    // 강화된 폼 검증 실행
    const validation = validateForm()
    if (!validation.isValid) {
      setError('입력 정보를 확인해주세요')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🎯 강사 수정 시작:', { formData, instructorId })
      
      // API 호출을 위한 데이터 구성
      const updateData = {
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
        status: formData.status,
        // 사용자 정보 업데이트
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null
      }
      
      // React Query Mutation 사용
      const result = await updateInstructorMutation.mutateAsync({
        instructorId: instructor.id,
        updates: updateData
      })
      
      console.log('🎉 강사 수정 성공:', result)
      
      toast.success(`${formData.name} 강사 정보가 업데이트되었습니다`)
      onUpdateSuccess?.(result.instructor)
      setIsEditing(false)
    } catch (error) {
      console.error('💥 강사 수정 실패:', error)
      
      const errorMessage = error instanceof Error ? error.message : '강사 정보 수정에 실패했습니다'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [instructor, formData, validateForm, updateInstructorMutation, onUpdateSuccess])

  // 강사 삭제 핸들러
  const handleDelete = useCallback(async () => {
    if (!instructor) return

    try {
      console.log('🗑️ 강사 삭제 시작:', instructorId)
      
      await deleteInstructorMutation.mutateAsync({ instructorId: instructor.id })
      
      console.log('🎉 강사 삭제 성공')
      
      toast.success(`${instructor.user?.name || '강사'}가 삭제되었습니다`)
      onDeleteSuccess?.(instructor.id)
      onOpenChange(false)
    } catch (error) {
      console.error('💥 강사 삭제 실패:', error)
      
      const errorMessage = error instanceof Error ? error.message : '강사 삭제에 실패했습니다'
      toast.error(errorMessage)
    }
  }, [instructor, instructorId, deleteInstructorMutation, onDeleteSuccess, onOpenChange])

  // Sheet 닫기 핸들러
  const handleClose = useCallback(() => {
    if (isEditing) {
      if (confirm('수정 중인 내용이 사라집니다. 정말 닫으시겠습니까?')) {
        setIsEditing(false)
        setError(null)
        onOpenChange(false)
      }
    } else {
      setError(null)
      onOpenChange(false)
    }
  }, [isEditing, onOpenChange])

  // 편집 모드 토글
  const handleEditToggle = useCallback(() => {
    if (isEditing) {
      // 편집 취소 시 원래 데이터로 복원
      if (instructor) {
        setFormData({
          name: instructor.user?.name || '',
          email: instructor.user?.email || '',
          phone: instructor.user?.phone || '',
          employee_id: (instructor.staff_info as StaffInfo)?.employee_id || '',
          department: (instructor.staff_info as StaffInfo)?.department || '',
          position: (instructor.staff_info as StaffInfo)?.position || '',
          employment_type: (instructor.staff_info as StaffInfo)?.employment_type || '정규직',
          status: (instructor.status as 'active' | 'inactive' | 'pending') || 'active',
          hire_date: instructor.hire_date || '',
          teaching_level: (instructor.staff_info as StaffInfo)?.instructor_info?.teaching_level || '초급',
          subjects: (instructor.staff_info as StaffInfo)?.instructor_info?.subjects?.join(', ') || '',
          certifications: (instructor.staff_info as StaffInfo)?.instructor_info?.certifications?.join(', ') || '',
          specialties: (instructor.staff_info as StaffInfo)?.instructor_info?.specialties?.join(', ') || '',
          max_classes_per_week: (instructor.staff_info as StaffInfo)?.instructor_info?.max_classes_per_week || 20,
          emergency_contact_name: (instructor.staff_info as StaffInfo)?.emergency_contact?.name || '',
          emergency_contact_phone: (instructor.staff_info as StaffInfo)?.emergency_contact?.phone || '',
          emergency_contact_relationship: (instructor.staff_info as StaffInfo)?.emergency_contact?.relationship || '',
          notes: instructor.bio || ''
        })
      }
      setError(null)
      setValidationErrors({})
    }
    setIsEditing(!isEditing)
  }, [isEditing, instructor])

  // 상태 배지 렌더링
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">재직</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">퇴직</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">대기</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  // 고용 형태 배지 렌더링
  const getEmploymentTypeBadge = (type: string) => {
    switch (type) {
      case '정규직':
        return <Badge className="bg-green-100 text-green-800">정규직</Badge>
      case '계약직':
        return <Badge className="bg-blue-100 text-blue-800">계약직</Badge>
      case '파트타임':
        return <Badge className="bg-orange-100 text-orange-800">파트타임</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{type}</Badge>
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[700px] sm:max-w-[700px] px-8">
        <SheetHeader className="px-0 pb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <SheetTitle>
                {isEditing ? '강사 정보 수정' : '강사 상세 정보'}
              </SheetTitle>
              <SheetDescription>
                {isEditing ? '강사의 정보를 수정하세요' : '강사의 상세 정보를 확인하세요'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {instructorLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        ) : !instructor ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">강사 정보를 불러올 수 없습니다</p>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-0">
              <div className="space-y-6">
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
                        {isEditing ? (
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="강사 이름을 입력하세요"
                            className={cn(
                              validationErrors.name && 'border-red-300 focus:border-red-500'
                            )}
                          />
                        ) : (
                          <div className="text-sm text-gray-900 py-2">{formData.name}</div>
                        )}
                        {validationErrors.name && (
                          <p className="text-xs text-red-600 mt-1">{validationErrors.name}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="employee_id" className="text-sm font-medium text-gray-700">
                          사번 <span className="text-red-500">*</span>
                        </Label>
                        {isEditing ? (
                          <Input
                            id="employee_id"
                            value={formData.employee_id || ''}
                            onChange={(e) => handleInputChange('employee_id', e.target.value)}
                            placeholder="사번을 입력하세요"
                            className={cn(
                              validationErrors.employee_id && 'border-red-300 focus:border-red-500'
                            )}
                          />
                        ) : (
                          <div className="text-sm text-gray-900 py-2">{formData.employee_id}</div>
                        )}
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
                        {isEditing ? (
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
                        ) : (
                          <div className="text-sm text-gray-900 py-2">{formData.email}</div>
                        )}
                        {validationErrors.email && (
                          <p className="text-xs text-red-600 mt-1">{validationErrors.email}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                          연락처
                        </Label>
                        {isEditing ? (
                          <Input
                            id="phone"
                            value={formData.phone || ''}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="010-1234-5678"
                          />
                        ) : (
                          <div className="text-sm text-gray-900 py-2">{formData.phone || '-'}</div>
                        )}
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
                        {isEditing ? (
                          <Input
                            id="department"
                            value={formData.department}
                            onChange={(e) => handleInputChange('department', e.target.value)}
                            placeholder="교무부"
                            className={cn(
                              validationErrors.department && 'border-red-300 focus:border-red-500'
                            )}
                          />
                        ) : (
                          <div className="text-sm text-gray-900 py-2">{formData.department}</div>
                        )}
                        {validationErrors.department && (
                          <p className="text-xs text-red-600 mt-1">{validationErrors.department}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="position" className="text-sm font-medium text-gray-700">
                          직위
                        </Label>
                        {isEditing ? (
                          <Input
                            id="position"
                            value={formData.position || ''}
                            onChange={(e) => handleInputChange('position', e.target.value)}
                            placeholder="수석강사"
                          />
                        ) : (
                          <div className="text-sm text-gray-900 py-2">{formData.position || '-'}</div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="employment_type" className="text-sm font-medium text-gray-700">
                          고용형태
                        </Label>
                        {isEditing ? (
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
                        ) : (
                          <div className="py-2">
                            {getEmploymentTypeBadge(formData.employment_type)}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="hire_date" className="text-sm font-medium text-gray-700">
                          입사일
                        </Label>
                        {isEditing ? (
                          <Input
                            id="hire_date"
                            type="date"
                            value={formData.hire_date || ''}
                            onChange={(e) => handleInputChange('hire_date', e.target.value)}
                          />
                        ) : (
                          <div className="text-sm text-gray-900 py-2">
                            {formData.hire_date ? new Date(formData.hire_date).toLocaleDateString('ko-KR') : '-'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                        재직 상태
                      </Label>
                      {isEditing ? (
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
                      ) : (
                        <div className="py-2">
                          {getStatusBadge(formData.status)}
                        </div>
                      )}
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
                        {isEditing ? (
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
                        ) : (
                          <div className="text-sm text-gray-900 py-2">{formData.teaching_level || '-'}</div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="max_classes_per_week" className="text-sm font-medium text-gray-700">
                          주간 최대 수업 수
                        </Label>
                        {isEditing ? (
                          <Input
                            id="max_classes_per_week"
                            type="number"
                            min="0"
                            max="50"
                            value={formData.max_classes_per_week || ''}
                            onChange={(e) => handleInputChange('max_classes_per_week', parseInt(e.target.value) || undefined)}
                            placeholder="20"
                          />
                        ) : (
                          <div className="text-sm text-gray-900 py-2">{formData.max_classes_per_week || '-'}</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="subjects" className="text-sm font-medium text-gray-700">
                        담당 과목
                      </Label>
                      {isEditing ? (
                        <Input
                          id="subjects"
                          value={formData.subjects || ''}
                          onChange={(e) => handleInputChange('subjects', e.target.value)}
                          placeholder="수학, 영어, 과학 (쉼표로 구분)"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 py-2">{formData.subjects || '-'}</div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="certifications" className="text-sm font-medium text-gray-700">
                        자격증
                      </Label>
                      {isEditing ? (
                        <Input
                          id="certifications"
                          value={formData.certifications || ''}
                          onChange={(e) => handleInputChange('certifications', e.target.value)}
                          placeholder="교원자격증, TESOL (쉼표로 구분)"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 py-2">{formData.certifications || '-'}</div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="specialties" className="text-sm font-medium text-gray-700">
                        전문 분야
                      </Label>
                      {isEditing ? (
                        <Input
                          id="specialties"
                          value={formData.specialties || ''}
                          onChange={(e) => handleInputChange('specialties', e.target.value)}
                          placeholder="입시수학, 영어회화 (쉼표로 구분)"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 py-2">{formData.specialties || '-'}</div>
                      )}
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
                        {isEditing ? (
                          <Input
                            id="emergency_contact_name"
                            value={formData.emergency_contact_name || ''}
                            onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                            placeholder="김영희"
                          />
                        ) : (
                          <div className="text-sm text-gray-900 py-2">{formData.emergency_contact_name || '-'}</div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="emergency_contact_phone" className="text-sm font-medium text-gray-700">
                          연락처
                        </Label>
                        {isEditing ? (
                          <Input
                            id="emergency_contact_phone"
                            value={formData.emergency_contact_phone || ''}
                            onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                            placeholder="010-9876-5432"
                          />
                        ) : (
                          <div className="text-sm text-gray-900 py-2">{formData.emergency_contact_phone || '-'}</div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="emergency_contact_relationship" className="text-sm font-medium text-gray-700">
                          관계
                        </Label>
                        {isEditing ? (
                          <Input
                            id="emergency_contact_relationship"
                            value={formData.emergency_contact_relationship || ''}
                            onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                            placeholder="배우자"
                          />
                        ) : (
                          <div className="text-sm text-gray-900 py-2">{formData.emergency_contact_relationship || '-'}</div>
                        )}
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
                    {isEditing ? (
                      <Textarea
                        id="notes"
                        value={formData.notes || ''}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        placeholder="특이사항이나 추가 메모를 입력하세요"
                        rows={3}
                      />
                    ) : (
                      <div className="text-sm text-gray-900 py-2 min-h-[60px]">
                        {formData.notes || '-'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="flex gap-3 pt-6">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleEditToggle}
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
                        저장 중...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4 mr-1" />
                        저장
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleEditToggle}
                    className="flex-1"
                  >
                    <PencilIcon className="w-4 h-4 mr-1" />
                    수정
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        className="flex-1"
                      >
                        <TrashIcon className="w-4 h-4 mr-1" />
                        삭제
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>강사 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                          정말로 {instructor.user?.name} 강사를 삭제하시겠습니까? 
                          이 작업은 되돌릴 수 없습니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDelete}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          삭제
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
})

InstructorDetailSideSheet.displayName = 'InstructorDetailSideSheet'