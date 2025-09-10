'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  UserIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import type { Instructor, StaffInfo, SalaryCalculation, AttendanceRecord } from '@/types/staff.types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface InstructorDetailMainProps {
  selectedInstructor: Instructor
  onInstructorUpdate: (instructor: Instructor) => void
  onEditInstructor: () => void
}

export default function InstructorDetailMain({
  selectedInstructor,
  onInstructorUpdate,
  onEditInstructor
}: InstructorDetailMainProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [salaryHistory, setSalaryHistory] = useState<SalaryCalculation[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)

  const staffInfo = selectedInstructor.staff_info as StaffInfo

  // 급여 내역 로드
  useEffect(() => {
    const loadSalaryHistory = async () => {
      setLoading(true)
      try {
        // TODO: API 호출
        console.log('Loading salary history for instructor:', selectedInstructor.id)
        setSalaryHistory([])
      } catch (error) {
        console.error('Failed to load salary history:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSalaryHistory()
  }, [selectedInstructor.id])

  // 출근 기록 로드
  useEffect(() => {
    const loadAttendanceRecords = async () => {
      setLoading(true)
      try {
        // TODO: API 호출
        console.log('Loading attendance records for instructor:', selectedInstructor.id)
        setAttendanceRecords([])
      } catch (error) {
        console.error('Failed to load attendance records:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAttendanceRecords()
  }, [selectedInstructor.id])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">재직</Badge>
      case 'inactive':
        return <Badge variant="secondary">퇴직</Badge>
      case 'pending':
        return <Badge variant="outline">대기</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getEmploymentTypeBadge = (type?: string) => {
    if (!type) return null
    
    const variant = type === '정규직' ? 'default' : 
                   type === '계약직' ? 'secondary' : 
                   'outline'
    
    return <Badge variant={variant}>{type}</Badge>
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <UserIcon className="h-8 w-8 text-gray-400" />
            </div>
            
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {selectedInstructor.user?.name || '이름 없음'}
                </h1>
                {selectedInstructor.status && getStatusBadge(selectedInstructor.status)}
                {getEmploymentTypeBadge(staffInfo?.employment_type)}
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                {staffInfo?.employee_id && (
                  <span>사번: {staffInfo.employee_id}</span>
                )}
                {staffInfo?.department && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center space-x-1">
                      <BriefcaseIcon className="h-4 w-4" />
                      <span>{staffInfo.department}</span>
                    </div>
                  </>
                )}
                {staffInfo?.position && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <span>{staffInfo.position}</span>
                  </>
                )}
                {selectedInstructor.hire_date && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>입사: {format(new Date(selectedInstructor.hire_date), 'yyyy.MM.dd', { locale: ko })}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <Button onClick={onEditInstructor}>
            <PencilIcon className="h-4 w-4 mr-2" />
            편집
          </Button>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="m-6 mb-0">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="salary">급여</TabsTrigger>
            <TabsTrigger value="attendance">출근</TabsTrigger>
            <TabsTrigger value="evaluation">평가</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-y-auto p-6">
            <TabsContent value="overview" className="mt-0 space-y-6">
              {/* 기본 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UserIcon className="h-5 w-5" />
                    <span>기본 정보</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">이메일</label>
                      <p className="text-sm">{selectedInstructor.user?.email || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">연락처</label>
                      <p className="text-sm">{selectedInstructor.user?.phone || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">비상연락처</label>
                      <p className="text-sm">
                        {staffInfo?.emergency_contact ? 
                          `${staffInfo.emergency_contact.name} (${staffInfo.emergency_contact.phone})` : 
                          '-'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">관계</label>
                      <p className="text-sm">{staffInfo?.emergency_contact?.relationship || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 강의 정보 */}
              {staffInfo?.instructor_info && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AcademicCapIcon className="h-5 w-5" />
                      <span>강의 정보</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">강의 레벨</label>
                        <p className="text-sm">{staffInfo.instructor_info.teaching_level || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">주간 최대 수업</label>
                        <p className="text-sm">{staffInfo.instructor_info.max_classes_per_week || '-'}회</p>
                      </div>
                    </div>
                    
                    {staffInfo.instructor_info.subjects && staffInfo.instructor_info.subjects.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">담당 과목</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {staffInfo.instructor_info.subjects.map((subject, index) => (
                            <Badge key={index} variant="outline">{subject}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {staffInfo.instructor_info.certifications && staffInfo.instructor_info.certifications.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">자격증</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {staffInfo.instructor_info.certifications.map((cert, index) => (
                            <Badge key={index} variant="secondary">{cert}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {staffInfo.instructor_info.specialties && staffInfo.instructor_info.specialties.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">전문 분야</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {staffInfo.instructor_info.specialties.map((specialty, index) => (
                            <Badge key={index} variant="default">{specialty}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* 급여 정보 */}
              {staffInfo?.salary_info && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CurrencyDollarIcon className="h-5 w-5" />
                      <span>급여 정보</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">급여 유형</label>
                        <p className="text-sm">{staffInfo.salary_info.type || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">기본급</label>
                        <p className="text-sm">
                          {staffInfo.salary_info.base_amount ? 
                            `${staffInfo.salary_info.base_amount.toLocaleString()}원` : 
                            '-'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">급여일</label>
                        <p className="text-sm">
                          {staffInfo.salary_info.payment_day ? 
                            `매월 ${staffInfo.salary_info.payment_day}일` : 
                            '-'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">은행 정보</label>
                        <p className="text-sm">
                          {staffInfo.salary_info.bank_info ? 
                            `${staffInfo.salary_info.bank_info.bank_name} ${staffInfo.salary_info.bank_info.account_number}` : 
                            '-'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="salary" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CurrencyDollarIcon className="h-5 w-5" />
                    <span>급여 내역</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">
                      급여 내역을 불러오는 중...
                    </div>
                  ) : salaryHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      급여 내역이 없습니다
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {salaryHistory.map((salary) => (
                        <div key={salary.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{salary.calculation_month}</span>
                            <Badge variant={
                              salary.status === 'paid' ? 'default' :
                              salary.status === 'approved' ? 'secondary' :
                              'outline'
                            }>
                              {salary.status === 'paid' ? '지급완료' :
                               salary.status === 'approved' ? '승인됨' :
                               '계산됨'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>최종 급여: {salary.final_salary.toLocaleString()}원</div>
                            <div>기본급: {salary.base_salary.toLocaleString()}원</div>
                            <div>성과급: {salary.commission_salary.toLocaleString()}원</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ClockIcon className="h-5 w-5" />
                    <span>출근 기록</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">
                      출근 기록을 불러오는 중...
                    </div>
                  ) : attendanceRecords.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      출근 기록이 없습니다
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {attendanceRecords.map((record) => (
                        <div key={record.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{record.date}</span>
                            <Badge variant={
                              record.status === '정상' ? 'default' :
                              record.status === '지각' ? 'destructive' :
                              'secondary'
                            }>
                              {record.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            {record.check_in && <div>출근: {record.check_in}</div>}
                            {record.check_out && <div>퇴근: {record.check_out}</div>}
                            {record.notes && <div>비고: {record.notes}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evaluation" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ChartBarIcon className="h-5 w-5" />
                    <span>평가 기록</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    평가 기록 기능은 곧 구현 예정입니다
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}