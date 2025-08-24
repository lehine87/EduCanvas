'use client'

import React, { useState, useCallback, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  UserIcon,
  AcademicCapIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  HomeIcon,
  ChartBarIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BookOpenIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'react-hot-toast'
import type { Student, StudentStatus } from '@/types/student.types'

interface StudentDetailSheetProps {
  student: Student | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (student: Student) => void
  onDelete: (student: Student) => void
}

export function StudentDetailSheet({
  student,
  open,
  onOpenChange,
  onUpdate,
  onDelete
}: StudentDetailSheetProps) {
  // 상태 관리
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editedData, setEditedData] = useState<Partial<Student>>({})
  const [activeTab, setActiveTab] = useState('info')

  // 학생 데이터 초기화
  useEffect(() => {
    if (student) {
      setEditedData({
        name: student.name,
        student_number: student.student_number,
        email: student.email,
        phone: student.phone,
        birth_date: student.birth_date,
        gender: student.gender,
        grade_level: student.grade_level,
        school_name: student.school_name,
        status: student.status,
        parent_name_1: student.parent_name_1,
        parent_phone_1: student.parent_phone_1,
        parent_name_2: student.parent_name_2,
        parent_phone_2: student.parent_phone_2,
        address: student.address,
        notes: student.notes
      })
    }
  }, [student])

  // 수정 모드 토글
  const handleEditToggle = useCallback(() => {
    if (isEditing && student) {
      // 취소 시 원래 데이터로 복원
      setEditedData({
        name: student.name,
        student_number: student.student_number,
        email: student.email,
        phone: student.phone,
        birth_date: student.birth_date,
        gender: student.gender,
        grade_level: student.grade_level,
        school_name: student.school_name,
        status: student.status,
        parent_name_1: student.parent_name_1,
        parent_phone_1: student.parent_phone_1,
        parent_name_2: student.parent_name_2,
        parent_phone_2: student.parent_phone_2,
        address: student.address,
        notes: student.notes
      })
    }
    setIsEditing(!isEditing)
  }, [isEditing, student])

  // 저장 처리
  const handleSave = useCallback(async () => {
    if (!student) return

    // 폼 검증
    if (!editedData.name?.trim()) {
      toast.error('학생 이름은 필수입니다.')
      return
    }

    if (editedData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedData.email)) {
      toast.error('올바른 이메일 형식이 아닙니다.')
      return
    }

    setIsUpdating(true)
    try {
      const updatedStudent = {
        ...student,
        ...editedData,
        updated_at: new Date().toISOString()
      } as Student
      
      onUpdate(updatedStudent)
      setIsEditing(false)
      toast.success('학생 정보가 업데이트되었습니다.')
    } catch (error) {
      console.error('학생 업데이트 실패:', error)
      toast.error('학생 정보 업데이트에 실패했습니다.')
    } finally {
      setIsUpdating(false)
    }
  }, [student, editedData, onUpdate])

  // 삭제 처리
  const handleDelete = useCallback(async () => {
    if (!student) return

    setIsDeleting(true)
    try {
      onDelete(student)
      setShowDeleteConfirm(false)
      toast.success('학생 정보가 삭제되었습니다.')
      onOpenChange(false)
    } catch (error) {
      console.error('학생 삭제 실패:', error)
      toast.error('학생 삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }, [student, onDelete, onOpenChange])

  // 입력값 변경 처리
  const handleInputChange = useCallback((field: keyof Student, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }))
  }, [])

  // 상태별 스타일 및 라벨 가져오기
  const getStatusBadge = (status: StudentStatus) => {
    const statusConfig = {
      active: { className: 'bg-green-100 text-green-800', label: '활동중' },
      inactive: { className: 'bg-gray-100 text-gray-800', label: '비활성' },
      withdrawn: { className: 'bg-yellow-100 text-yellow-800', label: '퇴학' },
      suspended: { className: 'bg-red-100 text-red-800', label: '정지' },
      graduated: { className: 'bg-blue-100 text-blue-800', label: '졸업' }
    }
    const config = statusConfig[status] || { className: 'bg-gray-100 text-gray-800', label: status }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  // 성별 라벨 가져오기
  const getGenderLabel = (gender: string | null | undefined) => {
    if (!gender) return '미지정'
    return gender === 'male' ? '남성' : gender === 'female' ? '여성' : '미지정'
  }

  if (!student) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-[700px] sm:max-w-[700px] p-0 flex flex-col"
      >
        {/* 헤더 */}
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex flex-col gap-3">
            {/* 제목과 뱃지 */}
            <div>
              {isEditing ? (
                <Input
                  value={editedData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="text-xl font-semibold mb-2 pr-12"
                  placeholder="학생 이름"
                />
              ) : (
                <SheetTitle className="text-xl pr-12">{student.name}</SheetTitle>
              )}
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(student.status)}
                {student.grade_level && (
                  <Badge variant="outline">{student.grade_level}</Badge>
                )}
                {student.student_number && (
                  <Badge variant="outline" className="font-mono">
                    {student.student_number}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* 액션 버튼 - 별도 행으로 분리 */}
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEditToggle}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    <XMarkIcon className="w-4 h-4 mr-1" />
                    취소
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isUpdating || !editedData.name?.trim()}
                    className="flex-1"
                  >
                    {isUpdating ? (
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
                    size="sm"
                    variant="outline"
                    onClick={handleEditToggle}
                    className="flex-1"
                  >
                    <PencilIcon className="w-4 h-4 mr-1" />
                    수정
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex-1 text-error-600 hover:text-error-700 hover:bg-error-50 border-error-200"
                  >
                    <TrashIcon className="w-4 h-4 mr-1" />
                    삭제
                  </Button>
                </>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* 탭 네비게이션 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4 px-6">
            <TabsTrigger value="info">기본 정보</TabsTrigger>
            <TabsTrigger value="academic">학업 정보</TabsTrigger>
            <TabsTrigger value="contact">연락처</TabsTrigger>
            <TabsTrigger value="stats">통계</TabsTrigger>
          </TabsList>

          {/* 컨텐츠 영역 */}
          <ScrollArea className="flex-1">
            <div className="px-6 py-4">
              {/* 기본 정보 탭 */}
              <TabsContent value="info" className="space-y-6 mt-0">
                {/* 개인 정보 섹션 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    개인 정보
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">학생 이름</Label>
                      {isEditing ? (
                        <Input
                          value={editedData.name || ''}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="학생 이름"
                        />
                      ) : (
                        <p className="text-sm font-medium">{student.name}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-500">학번</Label>
                      {isEditing ? (
                        <Input
                          value={editedData.student_number || ''}
                          onChange={(e) => handleInputChange('student_number', e.target.value)}
                          placeholder="학번"
                        />
                      ) : (
                        <p className="text-sm font-medium font-mono">
                          {student.student_number || '-'}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500">생년월일</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editedData.birth_date || ''}
                          onChange={(e) => handleInputChange('birth_date', e.target.value)}
                        />
                      ) : (
                        <p className="text-sm font-medium">
                          {student.birth_date 
                            ? format(new Date(student.birth_date), 'yyyy년 MM월 dd일', { locale: ko })
                            : '-'
                          }
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500">성별</Label>
                      {isEditing ? (
                        <Select 
                          value={editedData.gender || ''} 
                          onValueChange={(value) => handleInputChange('gender', value || null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="성별 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">미지정</SelectItem>
                            <SelectItem value="male">남성</SelectItem>
                            <SelectItem value="female">여성</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm font-medium">
                          {getGenderLabel(student.gender)}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500">상태</Label>
                      {isEditing ? (
                        <Select 
                          value={editedData.status || 'active'} 
                          onValueChange={(value) => handleInputChange('status', value as StudentStatus)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">활동중</SelectItem>
                            <SelectItem value="inactive">비활성</SelectItem>
                            <SelectItem value="withdrawn">퇴학</SelectItem>
                            <SelectItem value="suspended">정지</SelectItem>
                            <SelectItem value="graduated">졸업</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        getStatusBadge(student.status)
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500">등록일</Label>
                      <p className="text-sm font-medium">
                        {student.created_at 
                          ? format(new Date(student.created_at), 'yyyy년 MM월 dd일', { locale: ko })
                          : '-'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 주소 정보 섹션 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <HomeIcon className="w-4 h-4" />
                    주소 정보
                  </h3>
                  <div>
                    <Label className="text-xs text-gray-500">주소</Label>
                    {isEditing ? (
                      <Input
                        value={editedData.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="주소를 입력하세요"
                      />
                    ) : (
                      <p className="text-sm font-medium">
                        {student.address || '주소 정보 없음'}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* 메모 섹션 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">특이사항</h3>
                  {isEditing ? (
                    <Textarea
                      value={editedData.notes || ''}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="w-full"
                      rows={4}
                      placeholder="특이사항이나 추가 메모를 입력하세요"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {student.notes || '특이사항 없음'}
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* 학업 정보 탭 */}
              <TabsContent value="academic" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <AcademicCapIcon className="w-4 h-4" />
                    학업 정보
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">학년</Label>
                      {isEditing ? (
                        <Select 
                          value={editedData.grade_level || ''} 
                          onValueChange={(value) => handleInputChange('grade_level', value || null)}
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
                      ) : (
                        <p className="text-sm font-medium">
                          {student.grade_level || '-'}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500">재학 학교</Label>
                      {isEditing ? (
                        <Input
                          value={editedData.school_name || ''}
                          onChange={(e) => handleInputChange('school_name', e.target.value)}
                          placeholder="재학 중인 학교명"
                        />
                      ) : (
                        <p className="text-sm font-medium">
                          {student.school_name || '-'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 수강 클래스 목록 (추후 구현) */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <BookOpenIcon className="w-4 h-4" />
                    수강 클래스
                  </h3>
                  <div className="text-center py-8">
                    <BookOpenIcon className="w-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">수강 클래스 정보를 불러오는 중...</p>
                  </div>
                </div>
              </TabsContent>

              {/* 연락처 탭 */}
              <TabsContent value="contact" className="space-y-6 mt-0">
                {/* 학생 연락처 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    학생 연락처
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">전화번호</Label>
                      {isEditing ? (
                        <Input
                          value={editedData.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="010-0000-0000"
                        />
                      ) : (
                        <p className="text-sm font-medium font-mono">
                          {student.phone || '-'}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500">이메일</Label>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={editedData.email || ''}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="student@example.com"
                        />
                      ) : (
                        <p className="text-sm font-medium">
                          {student.email || '-'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 학부모 연락처 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <PhoneIcon className="w-4 h-4" />
                    학부모 연락처
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">학부모 1 이름</Label>
                        {isEditing ? (
                          <Input
                            value={editedData.parent_name_1 || ''}
                            onChange={(e) => handleInputChange('parent_name_1', e.target.value)}
                            placeholder="학부모 이름"
                          />
                        ) : (
                          <p className="text-sm font-medium">
                            {student.parent_name_1 || '-'}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs text-gray-500">학부모 1 전화번호</Label>
                        {isEditing ? (
                          <Input
                            value={editedData.parent_phone_1 || ''}
                            onChange={(e) => handleInputChange('parent_phone_1', e.target.value)}
                            placeholder="010-0000-0000"
                          />
                        ) : (
                          <p className="text-sm font-medium font-mono">
                            {student.parent_phone_1 || '-'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">학부모 2 이름</Label>
                        {isEditing ? (
                          <Input
                            value={editedData.parent_name_2 || ''}
                            onChange={(e) => handleInputChange('parent_name_2', e.target.value)}
                            placeholder="학부모 이름 (선택사항)"
                          />
                        ) : (
                          <p className="text-sm font-medium">
                            {student.parent_name_2 || '-'}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs text-gray-500">학부모 2 전화번호</Label>
                        {isEditing ? (
                          <Input
                            value={editedData.parent_phone_2 || ''}
                            onChange={(e) => handleInputChange('parent_phone_2', e.target.value)}
                            placeholder="010-0000-0000 (선택사항)"
                          />
                        ) : (
                          <p className="text-sm font-medium font-mono">
                            {student.parent_phone_2 || '-'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* 통계 탭 */}
              <TabsContent value="stats" className="mt-0">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">학습 통계</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <ChartBarIcon className="w-4 h-4 text-gray-500" />
                        <p className="text-xs text-gray-500">평균 출석률</p>
                      </div>
                      <p className="text-2xl font-bold">-</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AcademicCapIcon className="w-4 h-4 text-gray-500" />
                        <p className="text-xs text-gray-500">평균 성적</p>
                      </div>
                      <p className="text-2xl font-bold">-</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <ClockIcon className="w-4 h-4 text-gray-500" />
                        <p className="text-xs text-gray-500">총 수강 시간</p>
                      </div>
                      <p className="text-2xl font-bold">-</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpenIcon className="w-4 h-4 text-gray-500" />
                        <p className="text-xs text-gray-500">수강 클래스 수</p>
                      </div>
                      <p className="text-2xl font-bold">-</p>
                    </div>
                  </div>

                  {!isEditing && (
                    <Alert>
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <AlertDescription>
                        통계 데이터는 실제 수강 기록이 누적되면 표시됩니다.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        {/* 삭제 확인 다이얼로그 */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-error-100 rounded-lg flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-error-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold">학생 삭제</h3>
                  <p className="text-sm text-gray-500">이 작업은 되돌릴 수 없습니다</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-6">
                "{student.name}" 학생의 모든 정보를 삭제하시겠습니까?
                <span className="block mt-2 text-error-600">
                  ⚠️ 수강 기록과 성적 정보도 함께 삭제됩니다.
                </span>
              </p>
              
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    '삭제'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}