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
  ExclamationTriangleIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { Loader2 } from 'lucide-react'
import { ClassWithRelations } from '@/store/classesStore'
import { ClassStudentManager } from './ClassStudentManager'
import { Database } from '@/types/database'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useAuthStore } from '@/store/useAuthStore'
import { createClient } from '@/lib/supabase/client'

type Class = Database['public']['Tables']['classes']['Row']
type ClassSchedule = Database['public']['Tables']['class_classroom_schedules']['Row']
type TimeSlot = Database['public']['Tables']['time_slots']['Row']

interface ScheduleWithDetails extends ClassSchedule {
  time_slot: TimeSlot | null
  classroom: { id: string; name: string } | null
}

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
  const [instructors, setInstructors] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [loadingInstructors, setLoadingInstructors] = useState(false)
  const [schedules, setSchedules] = useState<ScheduleWithDetails[]>([])
  const [loadingSchedules, setLoadingSchedules] = useState(false)
  
  const { profile } = useAuthStore()
  const supabase = createClient()

  // 클래스 데이터 초기화
  useEffect(() => {
    if (classData) {
      setEditedData({
        name: classData.name,
        description: classData.description,
        grade: classData.grade,
        course: classData.course,
        subject: classData.subject,
        level: classData.level,
        main_textbook: classData.main_textbook,
        supplementary_textbook: classData.supplementary_textbook,
        start_date: classData.start_date,
        instructor_id: classData.instructor_id,
        max_students: classData.max_students,
        min_students: classData.min_students,
        classroom_id: classData.classroom_id,
        is_active: classData.is_active
      })
    }
  }, [classData])

  // 강사 목록 가져오기
  useEffect(() => {
    const fetchInstructors = async () => {
      if (!profile?.tenant_id) return
      
      setLoadingInstructors(true)
      try {
        const { data, error } = await supabase
          .from('tenant_memberships')
          .select(`
            user_id,
            user_profiles!tenant_memberships_user_id_fkey (
              id,
              name,
              email
            )
          `)
          .eq('tenant_id', profile.tenant_id)
          .eq('job_function', 'instructor')
          .eq('status', 'active')

        if (error) {
          console.error('강사 목록 조회 실패:', error)
          return
        }

        const instructorList = (data || [])
          .filter(membership => membership.user_profiles)
          .map(membership => ({
            id: membership.user_profiles!.id,
            name: membership.user_profiles!.name || '이름 없음',
            email: membership.user_profiles!.email || ''
          }))

        setInstructors(instructorList)
      } catch (error) {
        console.error('강사 목록 조회 중 오류:', error)
      } finally {
        setLoadingInstructors(false)
      }
    }

    fetchInstructors()
  }, [profile?.tenant_id, supabase])

  // 스케줄 데이터 가져오기
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!classData?.id) return
      
      setLoadingSchedules(true)
      try {
        const { data, error } = await supabase
          .from('class_classroom_schedules')
          .select(`
            *,
            time_slot:time_slots!time_slot_id (
              id,
              name,
              start_time,
              end_time,
              duration_minutes
            ),
            classroom:classrooms!classroom_id (
              id,
              name
            )
          `)
          .eq('class_id', classData.id)
          .eq('is_active', true)
          .order('day_of_week')

        if (error) {
          console.error('스케줄 조회 실패:', error)
          return
        }

        setSchedules((data || []) as any)
      } catch (error) {
        console.error('스케줄 조회 중 오류:', error)
      } finally {
        setLoadingSchedules(false)
      }
    }

    fetchSchedules()
  }, [classData?.id, supabase])

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
        level: classData.level,
        main_textbook: classData.main_textbook,
        supplementary_textbook: classData.supplementary_textbook,
        start_date: classData.start_date,
        instructor_id: classData.instructor_id,
        max_students: classData.max_students,
        min_students: classData.min_students,
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
  const handleInputChange = useCallback((field: keyof Class, value: Class[keyof Class]) => {
    setEditedData(prev => ({ ...prev, [field]: value }))
  }, [])

  // 요일 변환 함수
  const getDayName = (dayOfWeek: string) => {
    const dayMap = {
      'monday': '월요일',
      'tuesday': '화요일', 
      'wednesday': '수요일',
      'thursday': '목요일',
      'friday': '금요일',
      'saturday': '토요일',
      'sunday': '일요일'
    }
    return dayMap[dayOfWeek as keyof typeof dayMap] || dayOfWeek
  }

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
                  placeholder="클래스명"
                />
              ) : (
                <SheetTitle className="text-xl pr-12">{classData.name}</SheetTitle>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant={classData.is_active ? 'default' : 'secondary'}
                  className={cn(
                    classData.is_active 
                      ? 'bg-success-100 text-success-700' 
                      : 'bg-neutral-100 text-neutral-700'
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
                    disabled={isUpdating}
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
                  <h3 className="text-sm font-medium text-neutral-700 mb-3">기본 정보</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-neutral-500">과목</Label>
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
                      <Label className="text-xs text-neutral-500">학년</Label>
                      {isEditing ? (
                        <Input
                          value={editedData.grade || ''}
                          onChange={(e) => handleInputChange('grade', e.target.value)}
                          placeholder="학년 입력 (예: 중1, 고2)"
                        />
                      ) : (
                        <p className="text-sm font-medium">
                          {classData.grade || '-'}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-neutral-500">과정</Label>
                      {isEditing ? (
                        <Input
                          value={editedData.course || ''}
                          onChange={(e) => handleInputChange('course', e.target.value)}
                          placeholder="과정 입력"
                        />
                      ) : (
                        <p className="text-sm font-medium">
                          {classData.course || '-'}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-neutral-500">레벨</Label>
                      {isEditing ? (
                        <Input
                          value={editedData.level || ''}
                          onChange={(e) => handleInputChange('level', e.target.value)}
                          placeholder="레벨 입력 (예: 기초, 심화)"
                        />
                      ) : (
                        <p className="text-sm font-medium">
                          {classData.level || '-'}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-neutral-500">개강일</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editedData.start_date || ''}
                          onChange={(e) => handleInputChange('start_date', e.target.value)}
                        />
                      ) : (
                        <p className="text-sm font-medium">
                          {classData.start_date ? format(new Date(classData.start_date), 'yyyy년 MM월 dd일', { locale: ko }) : '-'}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-neutral-500">교실</Label>
                      {isEditing ? (
                        <Input
                          value={editedData.classroom_id || ''}
                          onChange={(e) => handleInputChange('classroom_id', e.target.value)}
                          placeholder="교실 ID"
                        />
                      ) : (
                        <p className="text-sm font-medium">
                          {classData.classroom_id || '미배정'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 교재 정보 */}
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    <div>
                      <Label className="text-xs text-neutral-500">주교재</Label>
                      {isEditing ? (
                        <Input
                          value={editedData.main_textbook || ''}
                          onChange={(e) => handleInputChange('main_textbook', e.target.value)}
                          placeholder="주교재명 입력"
                        />
                      ) : (
                        <p className="text-sm font-medium">
                          {classData.main_textbook || '-'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label className="text-xs text-neutral-500">부교재</Label>
                      {isEditing ? (
                        <Input
                          value={editedData.supplementary_textbook || ''}
                          onChange={(e) => handleInputChange('supplementary_textbook', e.target.value)}
                          placeholder="부교재명 입력"
                        />
                      ) : (
                        <p className="text-sm font-medium">
                          {classData.supplementary_textbook || '-'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 강사 정보 섹션 */}
                <div>
                  <h3 className="text-sm font-medium text-neutral-700 mb-3">강사 정보</h3>
                  {isEditing ? (
                    <div>
                      <Label className="text-xs text-neutral-500 mb-1">담당 강사</Label>
                      <Select
                        value={editedData.instructor_id || ''}
                        onValueChange={(value) => handleInputChange('instructor_id', value === 'none' ? null : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="강사를 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">강사 미배정</SelectItem>
                          {loadingInstructors ? (
                            <SelectItem value="" disabled>
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                강사 목록 로딩 중...
                              </div>
                            </SelectItem>
                          ) : (
                            instructors.map((instructor) => (
                              <SelectItem key={instructor.id} value={instructor.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-educanvas-100 rounded-full flex items-center justify-center">
                                    <UserIcon className="w-3 h-3 text-educanvas-600" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{instructor.name}</span>
                                    <span className="text-xs text-neutral-500">{instructor.email}</span>
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-neutral-400 mt-1">
                        현재 강사: {classData.instructor ? classData.instructor.name : '미배정'}
                      </p>
                    </div>
                  ) : (
                    classData.instructor ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-educanvas-100 rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-educanvas-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{classData.instructor.name}</p>
                          <p className="text-xs text-neutral-500">{classData.instructor.email}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">강사 미배정</p>
                    )
                  )}
                </div>

                <Separator />

                {/* 설명 섹션 */}
                <div>
                  <h3 className="text-sm font-medium text-neutral-700 mb-3">설명</h3>
                  {isEditing ? (
                    <textarea
                      value={editedData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      rows={4}
                      placeholder="클래스 설명 입력"
                    />
                  ) : (
                    <p className="text-sm text-neutral-600">
                      {classData.description || '설명이 없습니다.'}
                    </p>
                  )}
                </div>

                {/* 통계 요약 */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-neutral-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-neutral-900">{stats.totalStudents}</p>
                    <p className="text-xs text-neutral-500">현재 학생</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-neutral-900">{stats.capacity}</p>
                    <p className="text-xs text-neutral-500">최대 인원</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-neutral-900">{stats.occupancyRate}%</p>
                    <p className="text-xs text-neutral-500">수용률</p>
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-neutral-700">주간 스케줄</h3>
                    {!loadingSchedules && (
                      <Button size="sm" variant="outline" className="text-xs">
                        <PlusIcon className="w-3 h-3 mr-1" />
                        수업 추가
                      </Button>
                    )}
                  </div>

                  {loadingSchedules ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                      <span className="ml-2 text-sm text-neutral-500">시간표 로딩 중...</span>
                    </div>
                  ) : schedules.length > 0 ? (
                    <div className="space-y-3">
                      {schedules.map((schedule) => (
                        <div 
                          key={schedule.id}
                          className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-educanvas-500 rounded-full"></div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium text-neutral-900 min-w-[60px]">
                                {getDayName(schedule.day_of_week)}
                              </span>
                              <span className="text-sm text-neutral-600">
                                {schedule.time_slot?.start_time || '--:--'}-{schedule.time_slot?.end_time || '--:--'}
                              </span>
                              <span className="text-sm text-neutral-500">
                                {schedule.classroom?.name || '교실 미배정'}
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <PencilIcon className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-sm text-neutral-500 mb-3">아직 등록된 수업 시간이 없습니다</p>
                      <Button size="sm" variant="outline">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        첫 수업 시간 추가
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* 통계 탭 */}
              <TabsContent value="stats" className="mt-0">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-neutral-700">클래스 통계</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-neutral-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <ChartBarIcon className="w-4 h-4 text-neutral-500" />
                        <p className="text-xs text-neutral-500">평균 출석률</p>
                      </div>
                      <p className="text-2xl font-bold">-</p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AcademicCapIcon className="w-4 h-4 text-neutral-500" />
                        <p className="text-xs text-neutral-500">평균 성적</p>
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
                  <p className="text-sm text-neutral-500">이 작업은 되돌릴 수 없습니다</p>
                </div>
              </div>
              
              <p className="text-sm text-neutral-700 mb-6">
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