'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  PencilIcon,
  TrashIcon,
  PauseIcon,
  PlayIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarDaysIcon,
  UserIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import type { Student } from '@/types/student.types'

interface StudentDetailMainProps {
  selectedStudent: Student | null
  onStudentUpdate: (student: Student) => void
  onEditStudent: () => void
}

export default function StudentDetailMain({ selectedStudent, onStudentUpdate, onEditStudent }: StudentDetailMainProps) {
  const [activeTab, setActiveTab] = useState('basic')

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '재학중'
      case 'inactive': return '휴학'
      case 'graduated': return '졸업'
      case 'withdrawn': return '자퇴'
      case 'suspended': return '정학'
      default: return status
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'inactive': return 'secondary'
      case 'graduated': return 'outline'
      case 'withdrawn': return 'destructive'
      case 'suspended': return 'destructive'
      default: return 'secondary'
    }
  }

  if (!selectedStudent) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <UserIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            학생을 선택해주세요
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            왼쪽 사이드바에서 학생을 선택하면 상세 정보가 표시됩니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
      {/* 학생 헤더 */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={selectedStudent.profile_image || undefined} />
              <AvatarFallback className="text-lg">
                {selectedStudent.name.substring(0, 1)}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {selectedStudent.name}
                </h1>
                <Badge variant={getStatusBadgeVariant(selectedStudent.status || 'active')}>
                  {getStatusText(selectedStudent.status || 'active')}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                {selectedStudent.student_number && (
                  <span>학번: {selectedStudent.student_number}</span>
                )}
                {selectedStudent.grade_level && (
                  <span>학년: {selectedStudent.grade_level}</span>
                )}
                {selectedStudent.enrollment_date && (
                  <span>입학일: {new Date(selectedStudent.enrollment_date).toLocaleDateString('ko-KR')}</span>
                )}
              </div>
            </div>
          </div>
          
          {/* 퀵액션 버튼들 (원생등록/상세 버튼 제외) */}
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onEditStudent}>
              <PencilIcon className="h-4 w-4 mr-2" />
              편집
            </Button>
            
            {selectedStudent.status === 'active' ? (
              <Button variant="outline" size="sm" className="text-orange-600 hover:text-orange-700">
                <PauseIcon className="h-4 w-4 mr-2" />
                휴원 처리
              </Button>
            ) : selectedStudent.status === 'inactive' ? (
              <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                <PlayIcon className="h-4 w-4 mr-2" />
                복원 처리
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* 탭 시스템 */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b border-gray-200 dark:border-gray-700 px-6">
            <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 p-1 text-gray-500 dark:text-gray-400">
              <TabsTrigger value="basic" className="px-3 py-1">기본</TabsTrigger>
              <TabsTrigger value="class" className="px-3 py-1">반</TabsTrigger>
              <TabsTrigger value="payment" className="px-3 py-1">수납</TabsTrigger>
              <TabsTrigger value="attendance" className="px-3 py-1">출결</TabsTrigger>
              <TabsTrigger value="consultation" className="px-3 py-1">상담</TabsTrigger>
              <TabsTrigger value="homework" className="px-3 py-1">과제</TabsTrigger>
              <TabsTrigger value="etc" className="px-3 py-1">기타</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 p-6">
            <TabsContent value="basic" className="h-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full">
                {/* 기본 정보 카드 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <UserIcon className="h-5 w-5 mr-2" />
                      기본 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        <span className="font-medium">이름:</span> {selectedStudent.name}
                      </span>
                    </div>
                    
                    {selectedStudent.name_english && (
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          <span className="font-medium">영문명:</span> {selectedStudent.name_english}
                        </span>
                      </div>
                    )}
                    
                    {selectedStudent.birth_date && (
                      <div className="flex items-center space-x-2">
                        <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          <span className="font-medium">생년월일:</span> {new Date(selectedStudent.birth_date).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    )}
                    
                    {selectedStudent.gender && (
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          <span className="font-medium">성별:</span> {selectedStudent.gender}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 연락처 정보 카드 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <PhoneIcon className="h-5 w-5 mr-2" />
                      연락처 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedStudent.phone && (
                      <div className="flex items-center space-x-2">
                        <PhoneIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          <span className="font-medium">본인:</span> {selectedStudent.phone}
                        </span>
                      </div>
                    )}
                    
                    {selectedStudent.email && (
                      <div className="flex items-center space-x-2">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          <span className="font-medium">이메일:</span> {selectedStudent.email}
                        </span>
                      </div>
                    )}
                    
                    {selectedStudent.parent_phone_1 && (
                      <div className="flex items-center space-x-2">
                        <PhoneIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          <span className="font-medium">보호자1:</span> {selectedStudent.parent_phone_1}
                        </span>
                      </div>
                    )}
                    
                    {selectedStudent.parent_phone_2 && (
                      <div className="flex items-center space-x-2">
                        <PhoneIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          <span className="font-medium">보호자2:</span> {selectedStudent.parent_phone_2}
                        </span>
                      </div>
                    )}
                    
                    {selectedStudent.address && (
                      <div className="flex items-start space-x-2">
                        <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span className="text-sm">
                          <span className="font-medium">주소:</span> {selectedStudent.address}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 학업 정보 카드 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <AcademicCapIcon className="h-5 w-5 mr-2" />
                      학업 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedStudent.school_name && (
                      <div className="flex items-center space-x-2">
                        <AcademicCapIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          <span className="font-medium">학교:</span> {selectedStudent.school_name}
                        </span>
                      </div>
                    )}
                    
                    {selectedStudent.grade_level && (
                      <div className="flex items-center space-x-2">
                        <AcademicCapIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          <span className="font-medium">학년:</span> {selectedStudent.grade_level}
                        </span>
                      </div>
                    )}
                    
                    {selectedStudent.enrollment_date && (
                      <div className="flex items-center space-x-2">
                        <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          <span className="font-medium">입학일:</span> {new Date(selectedStudent.enrollment_date).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    )}
                    
                    {selectedStudent.notes && (
                      <div className="flex items-start space-x-2">
                        <UserIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span className="text-sm">
                          <span className="font-medium">메모:</span> {selectedStudent.notes}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="class" className="h-full">
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <AcademicCapIcon className="h-12 w-12 mx-auto mb-3" />
                  <p className="text-lg font-medium">반 정보</p>
                  <p className="text-sm">향후 개발 예정입니다.</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="h-full">
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <AcademicCapIcon className="h-12 w-12 mx-auto mb-3" />
                  <p className="text-lg font-medium">수납 정보</p>
                  <p className="text-sm">향후 개발 예정입니다.</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="attendance" className="h-full">
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <AcademicCapIcon className="h-12 w-12 mx-auto mb-3" />
                  <p className="text-lg font-medium">출결 정보</p>
                  <p className="text-sm">향후 개발 예정입니다.</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="consultation" className="h-full">
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <AcademicCapIcon className="h-12 w-12 mx-auto mb-3" />
                  <p className="text-lg font-medium">상담 정보</p>
                  <p className="text-sm">향후 개발 예정입니다.</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="homework" className="h-full">
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <AcademicCapIcon className="h-12 w-12 mx-auto mb-3" />
                  <p className="text-lg font-medium">과제 정보</p>
                  <p className="text-sm">향후 개발 예정입니다.</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="etc" className="h-full">
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <AcademicCapIcon className="h-12 w-12 mx-auto mb-3" />
                  <p className="text-lg font-medium">기타 정보</p>
                  <p className="text-sm">향후 개발 예정입니다.</p>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}