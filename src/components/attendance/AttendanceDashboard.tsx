'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ClockIcon,
  CalendarIcon,
  UserGroupIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { useAttendanceRecords, useAttendanceStatus, ATTENDANCE_STATUS_CONFIG } from '@/hooks/useAttendance'
import { formatTime, formatDate } from '@/lib/utils'
import type { AttendanceRecord, AttendanceFilters } from '@/types/attendance.types'

interface AttendanceDashboardProps {
  className?: string
}

export default function AttendanceDashboard({ className }: AttendanceDashboardProps) {
  const [filters, setFilters] = useState<AttendanceFilters>({
    page: 1,
    limit: 10
  })

  // 현재 사용자의 출석 상태
  const { record: todayRecord, status, workingHours, isLoading: statusLoading } = useAttendanceStatus()
  
  // 근태 기록 목록
  const { data: recordsData, isLoading: recordsLoading } = useAttendanceRecords(filters)

  const records = recordsData?.records || []
  const pagination = recordsData?.pagination

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClockIcon className="h-6 w-6" />
            근태 관리
          </h2>
          <p className="text-muted-foreground">
            출퇴근 현황과 근태 기록을 관리합니다
          </p>
        </div>
      </div>

      {/* 오늘 출석 현황 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 현재 상태 카드 */}
        <div className="lg:col-span-1">
          <TodayAttendanceCard 
            record={todayRecord}
            status={status}
            workingHours={workingHours}
            isLoading={statusLoading}
          />
        </div>

        {/* 오늘 통계 */}
        <div className="lg:col-span-2">
          <TodayStatsGrid />
        </div>
      </div>

      {/* 근태 기록 및 관리 */}
      <Tabs defaultValue="records" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="records">근태 기록</TabsTrigger>
          <TabsTrigger value="calendar">캘린더</TabsTrigger>
          <TabsTrigger value="stats">통계</TabsTrigger>
          <TabsTrigger value="management">관리</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <AttendanceRecordsTable 
            records={records}
            pagination={pagination}
            isLoading={recordsLoading}
            onFilterChange={setFilters}
          />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <AttendanceCalendar records={records} />
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <AttendanceStatsView />
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          <AttendanceManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// 오늘 출석 현황 카드
function TodayAttendanceCard({ 
  record, 
  status, 
  workingHours, 
  isLoading 
}: {
  record: AttendanceRecord | null
  status: 'not_started' | 'working' | 'completed'
  workingHours: number
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  const statusConfig = {
    not_started: {
      title: '출근 전',
      description: '아직 출근하지 않았습니다',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/10'
    },
    working: {
      title: '근무 중',
      description: '현재 근무 중입니다',
      color: 'text-growth-600',
      bgColor: 'bg-growth-50 dark:bg-growth-950'
    },
    completed: {
      title: '퇴근 완료',
      description: '오늘 근무를 완료했습니다',
      color: 'text-educanvas-600',
      bgColor: 'bg-educanvas-50 dark:bg-educanvas-950'
    }
  }

  const config = statusConfig[status]
  const attendanceStatus = record?.status
  const attendanceConfig = attendanceStatus ? ATTENDANCE_STATUS_CONFIG[attendanceStatus] : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>
          {attendanceConfig && (
            <Badge className={attendanceConfig.color}>
              {attendanceConfig.icon} {attendanceConfig.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className={`p-4 rounded-lg ${config.bgColor}`}>
          <div className="space-y-2">
            {record?.check_in && (
              <div className="flex justify-between text-sm">
                <span>출근 시간</span>
                <span className="font-medium">{formatTime(record.check_in)}</span>
              </div>
            )}
            
            {record?.check_out && (
              <div className="flex justify-between text-sm">
                <span>퇴근 시간</span>
                <span className="font-medium">{formatTime(record.check_out)}</span>
              </div>
            )}
            
            {status === 'working' && (
              <div className="flex justify-between text-sm">
                <span>근무 시간</span>
                <span className={`font-medium ${config.color}`}>
                  {workingHours.toFixed(1)}시간
                </span>
              </div>
            )}
            
            {status === 'completed' && record?.check_in && record?.check_out && (
              <div className="flex justify-between text-sm">
                <span>총 근무 시간</span>
                <span className="font-medium">
                  {calculateWorkHours(record.check_in, record.check_out).toFixed(1)}시간
                </span>
              </div>
            )}
          </div>
        </div>

        {record?.notes && (
          <div className="text-sm text-muted-foreground">
            <p>메모: {record.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 오늘 통계 그리드
function TodayStatsGrid() {
  // 실제로는 API에서 데이터를 가져와야 함
  const todayStats = {
    total_staff: 12,
    checked_in: 10,
    late_arrivals: 2,
    on_vacation: 1,
    absent: 1
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-educanvas-100 dark:bg-educanvas-900 rounded-lg">
              <UserGroupIcon className="h-5 w-5 text-educanvas-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">전체 직원</p>
              <p className="text-2xl font-bold">{todayStats.total_staff}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-growth-100 dark:bg-growth-900 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-growth-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">출근</p>
              <p className="text-2xl font-bold text-growth-600">{todayStats.checked_in}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning-100 dark:bg-warning-900 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">지각</p>
              <p className="text-2xl font-bold text-warning-600">{todayStats.late_arrivals}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <XCircleIcon className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">결근</p>
              <p className="text-2xl font-bold text-destructive">{todayStats.absent}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 근태 기록 테이블
function AttendanceRecordsTable({ 
  records, 
  pagination, 
  isLoading, 
  onFilterChange 
}: {
  records: AttendanceRecord[]
  pagination?: any
  isLoading: boolean
  onFilterChange: (filters: AttendanceFilters) => void
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center text-muted-foreground">
            <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>근태 기록이 없습니다</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>근태 기록</CardTitle>
        <CardDescription>
          최근 근태 기록을 확인할 수 있습니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {records.map((record) => {
            const statusConfig = ATTENDANCE_STATUS_CONFIG[record.status]
            const workHours = record.check_in && record.check_out 
              ? calculateWorkHours(record.check_in, record.check_out)
              : null

            return (
              <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-sm font-medium">{formatDate(record.date, 'MM/dd')}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(record.date, 'E')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={statusConfig.color}>
                      {statusConfig.icon} {statusConfig.label}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  {record.check_in && (
                    <div className="text-center">
                      <p className="text-muted-foreground">출근</p>
                      <p className="font-medium">{formatTime(record.check_in)}</p>
                    </div>
                  )}
                  
                  {record.check_out && (
                    <div className="text-center">
                      <p className="text-muted-foreground">퇴근</p>
                      <p className="font-medium">{formatTime(record.check_out)}</p>
                    </div>
                  )}
                  
                  {workHours && (
                    <div className="text-center">
                      <p className="text-muted-foreground">근무시간</p>
                      <p className="font-medium">{workHours.toFixed(1)}h</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              총 {pagination.total}개 기록
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFilterChange({ page: pagination.page - 1 })}
                disabled={pagination.page <= 1}
              >
                이전
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFilterChange({ page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.total_pages}
              >
                다음
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 근태 캘린더 (간단한 버전)
function AttendanceCalendar({ records }: { records: AttendanceRecord[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>근태 캘린더</CardTitle>
        <CardDescription>
          월별 근태 현황을 한눈에 확인할 수 있습니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <InformationCircleIcon className="h-4 w-4" />
          <AlertDescription>
            근태 캘린더 기능은 준비 중입니다. 향후 업데이트에서 제공될 예정입니다.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

// 근태 통계 뷰
function AttendanceStatsView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>근태 통계</CardTitle>
        <CardDescription>
          출석률, 근무시간 등 다양한 통계를 확인할 수 있습니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <ChartBarIcon className="h-4 w-4" />
          <AlertDescription>
            근태 통계 기능은 준비 중입니다. 향후 업데이트에서 제공될 예정입니다.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

// 근태 관리 (관리자용)
function AttendanceManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>근태 관리</CardTitle>
        <CardDescription>
          근태 기록 수정, 휴가 승인 등 관리 기능입니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <InformationCircleIcon className="h-4 w-4" />
          <AlertDescription>
            근태 관리 기능은 준비 중입니다. 향후 업데이트에서 제공될 예정입니다.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

// 유틸리티 함수
function calculateWorkHours(checkIn: string, checkOut: string): number {
  const [inHour, inMinute] = checkIn.split(':').map(Number)
  const [outHour, outMinute] = checkOut.split(':').map(Number)
  
  const inMinutes = inHour * 60 + inMinute
  const outMinutes = outHour * 60 + outMinute
  
  const workMinutes = outMinutes - inMinutes
  return Math.round((workMinutes / 60) * 10) / 10 // 소수점 1자리
}