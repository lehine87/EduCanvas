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
import { 
  UserIcon,
  AcademicCapIcon,
  CalendarIcon,
  UsersIcon,
  ClockIcon,
  MapPinIcon,
  BookOpenIcon,
  ChartBarIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Loader2 } from 'lucide-react'
import { ClassWithRelations } from '@/store/classesStore'
import { ClassStudentManager } from './ClassStudentManager'
import { Database } from '@/types/database'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

type Class = Database['public']['Tables']['classes']['Row']

interface ClassDetailSheetProps {
  classData: ClassWithRelations | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (id: string, data: Partial<Class>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function ClassDetailSheet({
  classData,
  isOpen,
  onClose,
  onUpdate,
  onDelete
}: ClassDetailSheetProps) {
  // 상태 관리
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editedData, setEditedData] = useState<Partial<Class>>({})
  const [activeTab, setActiveTab] = useState('info')

  // 클래스 데이터 초기화
  useEffect(() => {
    if (classData) {
      setEditedData({
        name: classData.name,
        description: classData.description,
        grade: classData.grade,
        course: classData.course,
        subject: classData.subject,
        max_students: classData.max_students,
        classroom_id: classData.classroom_id,
        is_active: classData.is_active
      })
    }
  }, [classData])

  // 수정 모드 토글
  const handleEditToggle = useCallback(() => {
    if (isEditing && classData) {
      // 취소 시 원래 데이터로 복원
      setEditedData({
        name: classData.name,
        description: classData.description,
        grade: classData.grade,
        course: classData.course,
        subject: classData.subject,
        max_students: classData.max_students,
        classroom_id: classData.classroom_id,
        is_active: classData.is_active
      })
    }
    setIsEditing(!isEditing)
  }, [isEditing, classData])

  // 저장 처리
  const handleSave = useCallback(async () => {
    if (!classData) return

    setIsUpdating(true)
    try {
      await onUpdate(classData.id, editedData)
      setIsEditing(false)
    } catch (error) {
      console.error('클래스 업데이트 실패:', error)
    } finally {
      setIsUpdating(false)
    }
  }, [classData, editedData, onUpdate])

  // 삭제 처리
  const handleDelete = useCallback(async () => {
    if (!classData) return

    setIsDeleting(true)
    try {
      await onDelete(classData.id)
      setShowDeleteConfirm(false)
      onClose()
    } catch (error) {
      console.error('클래스 삭제 실패:', error)
    } finally {
      setIsDeleting(false)
    }
  }, [classData, onDelete, onClose])

  // 입력값 변경 처리
  const handleInputChange = useCallback((field: keyof Class, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }))
  }, [])

  if (!classData) return null

  // 통계 정보 계산
  const stats = {
    totalStudents: classData.student_count || 0,
    capacity: classData.max_students || 0,
    occupancyRate: classData.max_students 
      ? Math.round(((classData.student_count || 0) / classData.max_students) * 100)
      : 0
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[640px] lg:w-[800px] sm:max-w-none p-0 flex flex-col"
      >
        {/* 헤더 */}
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editedData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="text-xl font-semibold mb-2"
                  placeholder="클래스명"
                />
              ) : (
                <SheetTitle className="text-xl">{classData.name}</SheetTitle>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant={classData.is_active ? 'default' : 'secondary'}
                  className={cn(
                    classData.is_active 
                      ? 'bg-success-100 text-success-700' 
                      : 'bg-gray-100 text-gray-700'
                  )}
                >
                  {classData.is_active ? '활성' : '비활성'}
                </Badge>
                {classData.grade && (
                  <Badge variant="outline">{classData.grade}</Badge>
                )}
                {classData.course && (
                  <Badge variant="outline">{classData.course}</Badge>
                )}
              </div>
            </div>
            
            {/* 액션 버튼 */}
            <div className="flex items-center gap-2 ml-4">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEditToggle}
                    disabled={isUpdating}
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckIcon className="w-4 h-4" />
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEditToggle}
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-error-600 hover:text-error-700"
                  >
                    <TrashIcon className="w-4 h-4" />
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
            <TabsTrigger value="students">학생 목록</TabsTrigger>
            <TabsTrigger value="schedule">시간표</TabsTrigger>
            <TabsTrigger value="stats">통계</TabsTrigger>
          </TabsList>

          {/* 컨텐츠 영역 */}
          <ScrollArea className="flex-1">
            <div className="px-6 py-4">
              {/* 기본 정보 탭 */}
              <TabsContent value="info" className="space-y-6 mt-0">
                {/* 기본 정보 섹션 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">기본 정보</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">과목</Label>
                      {isEditing ? (
                        <Input
                          value={editedData.subject || ''}
                          onChange={(e) => handleInputChange('subject', e.target.value)}
                          placeholder="과목 입력"
                        />
                      ) : (
                        <p className="text-sm font-medium">
                          {classData.subject || '-'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-500">최대 인원</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editedData.max_students || ''}
                          onChange={(e) => handleInputChange('max_students', parseInt(e.target.value))}
                          placeholder="최대 인원"
                        />
                      ) : (
                        <p className="text-sm font-medium">
                          {classData.max_students || 0}명
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 강사 정보 섹션 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">강사 정보</h3>
                  {classData.instructor ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-brand-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{classData.instructor.name}</p>
                        <p className="text-xs text-gray-500">{classData.instructor.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">강사 미배정</p>
                  )}
                </div>

                <Separator />

                {/* 설명 섹션 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">설명</h3>
                  {isEditing ? (
                    <textarea
                      value={editedData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      rows={4}
                      placeholder="클래스 설명 입력"
                    />
                  ) : (
                    <p className="text-sm text-gray-600">
                      {classData.description || '설명이 없습니다.'}
                    </p>
                  )}
                </div>

                {/* 통계 요약 */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                    <p className="text-xs text-gray-500">현재 학생</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.capacity}</p>
                    <p className="text-xs text-gray-500">최대 인원</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.occupancyRate}%</p>
                    <p className="text-xs text-gray-500">수용률</p>
                  </div>
                </div>
              </TabsContent>

              {/* 학생 목록 탭 */}
              <TabsContent value="students" className="mt-0">
                <div className="space-y-4">
                  {classData && (
                    <ClassStudentManager
                      classId={classData.id}
                      className={classData.name}
                      readOnly={!isEditing}
                      additionalClassName="bg-white"
                    />
                  )}
                  
                  {!isEditing && (
                    <Alert>
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <AlertDescription>
                        학생을 추가하거나 제거하려면 수정 모드를 활성화해주세요.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>

              {/* 시간표 탭 */}
              <TabsContent value="schedule" className="mt-0">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">수업 시간표</h3>
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">시간표 정보가 없습니다</p>
                  </div>
                </div>
              </TabsContent>

              {/* 통계 탭 */}
              <TabsContent value="stats" className="mt-0">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">클래스 통계</h3>
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
                  </div>
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
                  <h3 className="text-lg font-semibold">클래스 삭제</h3>
                  <p className="text-sm text-gray-500">이 작업은 되돌릴 수 없습니다</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-6">
                "{classData.name}" 클래스를 삭제하시겠습니까?
                {classData.student_count && classData.student_count > 0 && (
                  <span className="block mt-2 text-error-600">
                    ⚠️ 현재 {classData.student_count}명의 학생이 등록되어 있습니다.
                  </span>
                )}
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