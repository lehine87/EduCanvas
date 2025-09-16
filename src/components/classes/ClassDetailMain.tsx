'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  PencilIcon,
  TrashIcon,
  PauseIcon,
  PlayIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  MapPinIcon,
  ChartBarIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline'
import ClassStudentList from './ClassStudentList'
import AddStudentToClassModal from './AddStudentToClassModal'
import type { Class } from '@/types/class.types'

interface ClassDetailMainProps {
  selectedClass: Class | null
  onClassUpdate: (classItem: Class) => void
  onEditClass: () => void
  tenantId: string
}

export default function ClassDetailMain({ selectedClass, onClassUpdate, onEditClass, tenantId }: ClassDetailMainProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false)

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '활성'
      case 'inactive': return '비활성'
      case 'suspended': return '일시 중단'
      default: return status
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'inactive': return 'secondary'
      case 'suspended': return 'destructive'
      default: return 'secondary'
    }
  }

  if (!selectedClass) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <AcademicCapIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            클래스를 선택하세요
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            왼쪽 사이드바에서 클래스를 선택하시면 상세 정보를 확인할 수 있습니다
          </p>
        </div>
      </div>
    )
  }

  // 수강률 계산
  const maxStudents = selectedClass.max_students || 0
  const studentCount = selectedClass.student_count || 0
  const enrollmentRate = maxStudents > 0 
    ? Math.round((studentCount / maxStudents) * 100)
    : 0

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* 헤더 */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            {/* 클래스 아바타 */}
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-educanvas-100 text-educanvas-700 text-lg font-semibold">
                <AcademicCapIcon className="w-8 h-8" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {selectedClass.name}
                </h1>
                <Badge variant={getStatusBadgeVariant(selectedClass.is_active ? 'active' : 'inactive')}>
                  {getStatusText(selectedClass.is_active ? 'active' : 'inactive')}
                </Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <UsersIcon className="w-4 h-4" />
                  <span>{studentCount}/{maxStudents}명</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <ClockIcon className="w-4 h-4" />
                  <span>수업시간</span>
                </div>
                
                {selectedClass.instructor?.name && (
                  <div className="flex items-center space-x-1">
                    <AcademicCapIcon className="w-4 h-4" />
                    <span>{selectedClass.instructor.name}</span>
                  </div>
                )}

                {selectedClass.classroom_id && (
                  <div className="flex items-center space-x-1">
                    <MapPinIcon className="w-4 h-4" />
                    <span>강의실</span>
                  </div>
                )}
              </div>

              {selectedClass.description && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {selectedClass.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onEditClass}>
              <PencilIcon className="w-4 h-4 mr-1" />
              편집
            </Button>
            
            <Button variant="outline" size="sm">
              {(selectedClass.is_active ? 'active' : 'inactive') === 'active' ? (
                <>
                  <PauseIcon className="w-4 h-4 mr-1" />
                  비활성화
                </>
              ) : (
                <>
                  <PlayIcon className="w-4 h-4 mr-1" />
                  활성화
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 수강률 진행바 */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">수강률</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{enrollmentRate}%</span>
          </div>
          <Progress value={enrollmentRate} className="h-2" />
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="flex-shrink-0 grid w-full grid-cols-4 mx-6 mt-4">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="students">수강생</TabsTrigger>
            <TabsTrigger value="schedule">시간표</TabsTrigger>
            <TabsTrigger value="analytics">분석</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto p-6">
            <TabsContent value="overview" className="mt-0 space-y-6">
              {/* 기본 정보 카드 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpenIcon className="w-5 h-5" />
                      <span>기본 정보</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">과목</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {selectedClass.subject || '미설정'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">과정</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {selectedClass.course || '미설정'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">수강료</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          0원
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">수업 시간</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          설정안됨
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">시작일</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {selectedClass.start_date ? new Date(selectedClass.start_date).toLocaleDateString() : '미설정'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">종료일</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {selectedClass.end_date ? new Date(selectedClass.end_date).toLocaleDateString() : '미설정'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ChartBarIcon className="w-5 h-5" />
                      <span>통계 정보</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">출석률</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {selectedClass.attendance_rate || 0}%
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">총 수익</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {selectedClass.revenue_total?.toLocaleString() || 0}원
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">다음 수업</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {selectedClass.next_session ? new Date(selectedClass.next_session).toLocaleDateString() : '미정'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">마지막 수업</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {selectedClass.last_session ? new Date(selectedClass.last_session).toLocaleDateString() : '없음'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">수강률</label>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>{studentCount}명 / {maxStudents}명</span>
                          <span>{enrollmentRate}%</span>
                        </div>
                        <Progress value={enrollmentRate} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 최근 활동 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CalendarIcon className="w-5 h-5" />
                    <span>최근 활동</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-400">2024-09-10</span>
                      <span className="text-gray-900 dark:text-gray-100">새 학생 등록: 김민수</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-400">2024-09-09</span>
                      <span className="text-gray-900 dark:text-gray-100">출석 체크 완료 (18/20명)</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-400">2024-09-08</span>
                      <span className="text-gray-900 dark:text-gray-100">수업료 납부: 5명</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students" className="mt-0">
              <ClassStudentList
                classData={selectedClass}
                tenantId={tenantId}
                onAddStudent={() => setIsAddStudentModalOpen(true)}
              />
            </TabsContent>

            <TabsContent value="schedule" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>수업 시간표</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 dark:text-gray-400">
                    시간표 컴포넌트가 구현되면 여기에 표시됩니다.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>분석 및 리포트</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 dark:text-gray-400">
                    분석 컴포넌트가 구현되면 여기에 표시됩니다.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* 학생 등록 모달 */}
      {selectedClass && (
        <AddStudentToClassModal
          isOpen={isAddStudentModalOpen}
          onClose={() => setIsAddStudentModalOpen(false)}
          classData={selectedClass}
          tenantId={tenantId}
        />
      )}
    </div>
  )
}