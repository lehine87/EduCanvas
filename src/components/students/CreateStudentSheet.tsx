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
import { useStudentsStore } from '@/store/studentsStore'
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
import type { Student, StudentStatus } from '@/types/student.types'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

/**
 * CreateStudentSheet Props
 */
export interface CreateStudentSheetProps {
  /** Sheet 열림 상태 */
  open: boolean
  /** Sheet 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void
  /** 생성 성공 콜백 */
  onSuccess?: (student: Student) => void
  /** 추가 CSS 클래스 */
  className?: string
}

/**
 * 학생 폼 데이터 타입
 */
interface StudentFormData {
  // 기본 정보
  name: string
  student_number?: string
  email?: string
  phone?: string
  birth_date?: string
  gender?: 'male' | 'female'
  
  // 학업 정보
  grade_level?: string
  school_name?: string
  status: StudentStatus
  
  // 학부모 연락처
  parent_name_1?: string
  parent_phone_1?: string
  parent_name_2?: string
  parent_phone_2?: string
  
  // 주소
  address?: string
  
  // 기타
  notes?: string
}

/**
 * CreateStudentSheet - 학생 등록 Sheet 컴포넌트
 * 
 * 특징:
 * - 클래스 등록 Sheet와 동일한 UI 패턴
 * - 실시간 입력 검증
 * - 성공/실패 처리
 * - 접근성 완벽 지원
 * - 오른쪽에서 슬라이드되는 Sheet UI
 */
export const CreateStudentSheet = memo<CreateStudentSheetProps>(({
  open,
  onOpenChange,
  onSuccess,
  className
}) => {
  // 상태 관리
  const { actions: studentActions } = useStudentsStore()
  const { profile: userProfile } = useAuthStore()

  // 로컬 상태
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    status: 'active'
  })

  // 테넌트 ID
  const tenantId = userProfile?.tenant_id

  // Sheet가 열릴 때 초기화
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        status: 'active'
      })
      setError(null)
    }
  }, [open])

  // 입력값 변경 핸들러
  const handleInputChange = useCallback((field: keyof StudentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null) // 에러 초기화
  }, [error])

  // 폼 검증
  const validateForm = useCallback((): string | null => {
    if (!formData.name.trim()) {
      return '학생 이름은 필수입니다.'
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return '올바른 이메일 형식이 아닙니다.'
    }
    return null
  }, [formData])

  // 학생 생성 핸들러
  const handleSubmit = useCallback(async () => {
    if (!tenantId) {
      setError('로그인 정보를 확인해주세요')
      return
    }

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🎯 학생 생성 시작:', { formData, tenantId })
      
      const studentData: Partial<Student> = {
        ...formData,
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // TODO: 실제 API 호출로 대체
      await new Promise(resolve => setTimeout(resolve, 1000)) // 임시 딜레이
      
      console.log('🎉 학생 생성 성공:', studentData)
      
      toast.success(`${formData.name} 학생이 등록되었습니다`)
      onSuccess?.(studentData as Student)
      onOpenChange(false)
    } catch (error) {
      console.error('💥 학생 생성 실패:', error)
      
      const errorMessage = error instanceof Error ? error.message : '학생 등록에 실패했습니다'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [tenantId, formData, validateForm, onSuccess, onOpenChange])

  // Sheet 닫기 핸들러
  const handleClose = useCallback(() => {
    setError(null)
    onOpenChange(false)
  }, [onOpenChange])

  // 취소 핸들러
  const handleCancel = useCallback(() => {
    if (formData.name || formData.student_number || formData.email) {
      // 입력된 내용이 있으면 확인
      if (confirm('입력된 내용이 사라집니다. 정말 취소하시겠습니까?')) {
        handleClose()
      }
    } else {
      handleClose()
    }
  }, [formData, handleClose])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[700px] sm:max-w-[700px] px-8">
        <SheetHeader className="px-0 pb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
              <UserPlusIcon className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <SheetTitle>새 학생 등록</SheetTitle>
              <SheetDescription>
                새로운 학생의 정보를 입력해주세요
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

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
                      학생 이름 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="학생 이름을 입력하세요"
                      className={cn(
                        error && !formData.name.trim() && 'border-red-300 focus:border-red-500'
                      )}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="student_number" className="text-sm font-medium text-gray-700">
                      학번
                    </Label>
                    <Input
                      id="student_number"
                      value={formData.student_number || ''}
                      onChange={(e) => handleInputChange('student_number', e.target.value)}
                      placeholder="학번 입력 (선택사항)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="birth_date" className="text-sm font-medium text-gray-700">
                      생년월일
                    </Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date || ''}
                      onChange={(e) => handleInputChange('birth_date', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                      성별
                    </Label>
                    <Select 
                      value={formData.gender || ''} 
                      onValueChange={(value) => handleInputChange('gender', value || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="성별 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">선택안함</SelectItem>
                        <SelectItem value="male">남성</SelectItem>
                        <SelectItem value="female">여성</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                    상태
                  </Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleInputChange('status', value as StudentStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800">활동중</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="inactive">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gray-100 text-gray-800">비활성</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="withdrawn">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-yellow-100 text-yellow-800">퇴학</Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* 연락처 정보 섹션 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                <PhoneIcon className="w-4 h-4" />
                연락처 정보
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      학생 전화번호
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="010-0000-0000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      학생 이메일
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="student@example.com"
                      className={cn(
                        error && formData.email && 'border-red-300 focus:border-red-500'
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parent_name_1" className="text-sm font-medium text-gray-700">
                      학부모 1 이름
                    </Label>
                    <Input
                      id="parent_name_1"
                      value={formData.parent_name_1 || ''}
                      onChange={(e) => handleInputChange('parent_name_1', e.target.value)}
                      placeholder="학부모 이름"
                    />
                  </div>

                  <div>
                    <Label htmlFor="parent_phone_1" className="text-sm font-medium text-gray-700">
                      학부모 1 전화번호
                    </Label>
                    <Input
                      id="parent_phone_1"
                      value={formData.parent_phone_1 || ''}
                      onChange={(e) => handleInputChange('parent_phone_1', e.target.value)}
                      placeholder="010-0000-0000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parent_name_2" className="text-sm font-medium text-gray-700">
                      학부모 2 이름
                    </Label>
                    <Input
                      id="parent_name_2"
                      value={formData.parent_name_2 || ''}
                      onChange={(e) => handleInputChange('parent_name_2', e.target.value)}
                      placeholder="학부모 이름 (선택사항)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="parent_phone_2" className="text-sm font-medium text-gray-700">
                      학부모 2 전화번호
                    </Label>
                    <Input
                      id="parent_phone_2"
                      value={formData.parent_phone_2 || ''}
                      onChange={(e) => handleInputChange('parent_phone_2', e.target.value)}
                      placeholder="010-0000-0000 (선택사항)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* 학업 정보 섹션 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                <CalendarDaysIcon className="w-4 h-4" />
                학업 정보
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="grade_level" className="text-sm font-medium text-gray-700">
                      학년
                    </Label>
                    <Select 
                      value={formData.grade_level || ''} 
                      onValueChange={(value) => handleInputChange('grade_level', value || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="학년 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">선택안함</SelectItem>
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
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="school_name" className="text-sm font-medium text-gray-700">
                      재학 학교
                    </Label>
                    <Input
                      id="school_name"
                      value={formData.school_name || ''}
                      onChange={(e) => handleInputChange('school_name', e.target.value)}
                      placeholder="재학 중인 학교명"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                    주소
                  </Label>
                  <Input
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="주소를 입력하세요"
                  />
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

        <SheetFooter className="flex gap-3 pt-6">
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
                학생 등록
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
})

CreateStudentSheet.displayName = 'CreateStudentSheet'