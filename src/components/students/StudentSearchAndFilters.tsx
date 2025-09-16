'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CalendarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'
import { useDebounce } from '@/hooks/useDebounce'
import type { StudentSearchParams } from '@/schemas/student-search'

// StudentFilters는 types/student.types.ts에서 import하여 사용
import type { StudentFilters, StudentStatus } from '@/types/student.types'

interface StudentSearchAndFiltersProps {
  onFiltersChange: (filters: StudentFilters) => void
  activeFilters: StudentFilters
  isLoading?: boolean
  totalResults?: number
  className?: string
}

// 학년 옵션 (학원 표준)
const GRADE_OPTIONS = [
  { value: '초1', label: '초등 1학년' },
  { value: '초2', label: '초등 2학년' },
  { value: '초3', label: '초등 3학년' },
  { value: '초4', label: '초등 4학년' },
  { value: '초5', label: '초등 5학년' },
  { value: '초6', label: '초등 6학년' },
  { value: '중1', label: '중학 1학년' },
  { value: '중2', label: '중학 2학년' },
  { value: '중3', label: '중학 3학년' },
  { value: '고1', label: '고등 1학년' },
  { value: '고2', label: '고등 2학년' },
  { value: '고3', label: '고등 3학년' },
  { value: '기타', label: '기타' },
]

// 상태 옵션 (데이터베이스 스키마와 일치)
const STATUS_OPTIONS = [
  { value: 'active', label: '재학중', variant: 'default' as const },
  { value: 'inactive', label: '휴학', variant: 'outline' as const },
  { value: 'graduated', label: '졸업', variant: 'outline' as const },
  { value: 'withdrawn', label: '자퇴', variant: 'destructive' as const },
  { value: 'suspended', label: '정학', variant: 'destructive' as const },
]

// 정렬 옵션
const SORT_OPTIONS = [
  { value: 'name', label: '이름' },
  { value: 'enrollment_date', label: '등록일' },
  { value: 'class_name', label: '반 이름' },
  { value: 'attendance_rate', label: '출석률' },
  { value: 'last_payment_date', label: '최근 결제일' },
]

export default function StudentSearchAndFilters({
  onFiltersChange,
  activeFilters,
  isLoading = false,
  totalResults = 0,
  className = '',
}: StudentSearchAndFiltersProps) {
  // activeFilters가 undefined일 경우를 대비한 안전한 처리
  const safeActiveFilters = activeFilters || {}

  const [localSearch, setLocalSearch] = useState(safeActiveFilters.search || '')
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    safeActiveFilters.enrollment_date_from ? new Date(safeActiveFilters.enrollment_date_from) : undefined
  )
  const [dateTo, setDateTo] = useState<Date | undefined>(
    safeActiveFilters.enrollment_date_to ? new Date(safeActiveFilters.enrollment_date_to) : undefined
  )
  const [attendanceRange, setAttendanceRange] = useState<[number, number]>([
    safeActiveFilters.attendance_rate_min || 0,
    safeActiveFilters.attendance_rate_max || 100
  ])

  const debouncedSearch = useDebounce(localSearch, 300)

  // 검색어 디바운싱 적용
  useEffect(() => {
    if (debouncedSearch !== safeActiveFilters.search) {
      const newFilters = {
        ...safeActiveFilters,
        search: debouncedSearch || undefined
      }
      onFiltersChange(newFilters)
    }
  }, [debouncedSearch, safeActiveFilters.search, onFiltersChange])

  // 학년 필터 토글
  const handleGradeToggle = useCallback((grade: string) => {
    const currentGrades = safeActiveFilters.grade || []
    const newGrades = currentGrades.includes(grade)
      ? currentGrades.filter(g => g !== grade)
      : [...currentGrades, grade]

    onFiltersChange({
      ...safeActiveFilters,
      grade: newGrades.length > 0 ? newGrades : undefined
    })
  }, [safeActiveFilters, onFiltersChange])

  // 상태 필터 토글
  const handleStatusToggle = useCallback((status: string) => {
    const currentStatuses = safeActiveFilters.status || []
    const typedStatus = status as StudentStatus // STATUS_OPTIONS에서 검증된 값이므로 안전
    const newStatuses = currentStatuses.includes(typedStatus)
      ? currentStatuses.filter(s => s !== typedStatus)
      : [...currentStatuses, typedStatus]

    onFiltersChange({
      ...safeActiveFilters,
      status: newStatuses.length > 0 ? newStatuses : undefined
    })
  }, [safeActiveFilters, onFiltersChange])

  // 날짜 범위 적용
  const handleDateRangeApply = useCallback(() => {
    onFiltersChange({
      ...safeActiveFilters,
      enrollment_date_from: dateFrom ? dateFrom.toISOString() : undefined,
      enrollment_date_to: dateTo ? dateTo.toISOString() : undefined
    })
  }, [dateFrom, dateTo, safeActiveFilters, onFiltersChange])

  // 출석률 범위 적용
  const handleAttendanceRangeApply = useCallback(() => {
    onFiltersChange({
      ...safeActiveFilters,
      attendance_rate_min: attendanceRange[0] > 0 ? attendanceRange[0] : undefined,
      attendance_rate_max: attendanceRange[1] < 100 ? attendanceRange[1] : undefined
    })
  }, [attendanceRange, safeActiveFilters, onFiltersChange])

  // 미납 필터 토글
  const handleOverdueToggle = useCallback((checked: boolean) => {
    onFiltersChange({
      ...safeActiveFilters,
      has_overdue_payment: checked ? true : undefined
    })
  }, [safeActiveFilters, onFiltersChange])

  // 정렬 변경
  const handleSortChange = useCallback((field: string, order: 'asc' | 'desc') => {
    onFiltersChange({
      ...safeActiveFilters,
      sort_field: field as any, // 타입 단언 (실제로는 SORT_OPTIONS에서 검증됨)
      sort_order: order
    })
  }, [safeActiveFilters, onFiltersChange])

  // 모든 필터 초기화
  const clearAllFilters = useCallback(() => {
    setLocalSearch('')
    setDateFrom(undefined)
    setDateTo(undefined)
    setAttendanceRange([0, 100])
    onFiltersChange({})
  }, [onFiltersChange])

  // 활성 필터 카운트
  const activeFilterCount = [
    safeActiveFilters.search,
    safeActiveFilters.grade?.length,
    safeActiveFilters.status?.length,
    safeActiveFilters.enrollment_date_from,
    safeActiveFilters.has_overdue_payment,
    (safeActiveFilters.attendance_rate_min !== undefined && safeActiveFilters.attendance_rate_min > 0) ||
    (safeActiveFilters.attendance_rate_max !== undefined && safeActiveFilters.attendance_rate_max < 100)
  ].filter(Boolean).length

  // 활성 필터 태그 렌더링
  const renderActiveFilterTags = () => {
    const tags = []

    if (safeActiveFilters.search) {
      tags.push(
        <Badge key="search" variant="secondary" className="flex items-center gap-1">
          검색: {safeActiveFilters.search}
          <XMarkIcon 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => {
              setLocalSearch('')
              onFiltersChange({ ...safeActiveFilters, search: undefined })
            }}
          />
        </Badge>
      )
    }

    if (safeActiveFilters.grade?.length) {
      safeActiveFilters.grade.forEach(grade => {
        const gradeLabel = GRADE_OPTIONS.find(g => g.value === grade)?.label || grade
        tags.push(
          <Badge key={`grade-${grade}`} variant="outline" className="flex items-center gap-1">
            <AcademicCapIcon className="h-3 w-3" />
            {gradeLabel}
            <XMarkIcon 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => handleGradeToggle(grade)}
            />
          </Badge>
        )
      })
    }

    if (safeActiveFilters.status?.length) {
      safeActiveFilters.status.forEach(status => {
        const statusLabel = STATUS_OPTIONS.find(s => s.value === status)?.label || status
        tags.push(
          <Badge key={`status-${status}`} variant="outline" className="flex items-center gap-1">
            <UserGroupIcon className="h-3 w-3" />
            {statusLabel}
            <XMarkIcon 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => handleStatusToggle(status)}
            />
          </Badge>
        )
      })
    }

    if (safeActiveFilters.enrollment_date_from || safeActiveFilters.enrollment_date_to) {
      const fromStr = safeActiveFilters.enrollment_date_from ? format(new Date(safeActiveFilters.enrollment_date_from), 'MM/dd', { locale: ko }) : '시작'
      const toStr = safeActiveFilters.enrollment_date_to ? format(new Date(safeActiveFilters.enrollment_date_to), 'MM/dd', { locale: ko }) : '끝'
      tags.push(
        <Badge key="date-range" variant="outline" className="flex items-center gap-1">
          <CalendarIcon className="h-3 w-3" />
          등록일: {fromStr} ~ {toStr}
          <XMarkIcon 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => {
              setDateFrom(undefined)
              setDateTo(undefined)
              onFiltersChange({
                ...safeActiveFilters,
                enrollment_date_from: undefined,
                enrollment_date_to: undefined
              })
            }}
          />
        </Badge>
      )
    }

    if (safeActiveFilters.has_overdue_payment) {
      tags.push(
        <Badge key="overdue" variant="destructive" className="flex items-center gap-1">
          <CurrencyDollarIcon className="h-3 w-3" />
          미납자
          <XMarkIcon 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => handleOverdueToggle(false)}
          />
        </Badge>
      )
    }

    if ((safeActiveFilters.attendance_rate_min !== undefined && safeActiveFilters.attendance_rate_min > 0) ||
        (safeActiveFilters.attendance_rate_max !== undefined && safeActiveFilters.attendance_rate_max < 100)) {
      const min = safeActiveFilters.attendance_rate_min || 0
      const max = safeActiveFilters.attendance_rate_max || 100
      tags.push(
        <Badge key="attendance" variant="outline" className="flex items-center gap-1">
          <ChartBarIcon className="h-3 w-3" />
          출석률: {min}% ~ {max}%
          <XMarkIcon 
            className="h-3 w-3 cursor-pointer" 
            onClick={() => {
              setAttendanceRange([0, 100])
              onFiltersChange({
                ...safeActiveFilters,
                attendance_rate_min: undefined,
                attendance_rate_max: undefined
              })
            }}
          />
        </Badge>
      )
    }

    return tags
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 통합 검색 */}
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="학생명, 연락처로 검색..."
              className="pl-10"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              disabled={isLoading}
            />
            {localSearch && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0"
                onClick={() => setLocalSearch('')}
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* 필터 버튼들 */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 학년 필터 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <AcademicCapIcon className="h-4 w-4 mr-2" />
                학년
                {safeActiveFilters.grade?.length && (
                  <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                    {safeActiveFilters.grade.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>학년 선택</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {GRADE_OPTIONS.map((grade) => (
                <DropdownMenuCheckboxItem
                  key={grade.value}
                  checked={safeActiveFilters.grade?.includes(grade.value) || false}
                  onCheckedChange={() => handleGradeToggle(grade.value)}
                >
                  {grade.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 상태 필터 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <UserGroupIcon className="h-4 w-4 mr-2" />
                상태
                {safeActiveFilters.status?.length && (
                  <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                    {safeActiveFilters.status.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuLabel>상태 선택</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {STATUS_OPTIONS.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status.value}
                  checked={safeActiveFilters.status?.includes(status.value as StudentStatus) || false}
                  onCheckedChange={() => handleStatusToggle(status.value)}
                >
                  {status.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 등록일 범위 필터 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <CalendarIcon className="h-4 w-4 mr-2" />
                등록일
                {(safeActiveFilters.enrollment_date_from || safeActiveFilters.enrollment_date_to) && (
                  <Badge className="ml-2 h-2 w-2 rounded-full p-0 bg-blue-500" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>시작일</Label>
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    locale={ko}
                    className="rounded-md border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>종료일</Label>
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    locale={ko}
                    className="rounded-md border"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleDateRangeApply}>
                    적용
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setDateFrom(undefined)
                    setDateTo(undefined)
                  }}>
                    초기화
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* 고급 필터 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <FunnelIcon className="h-4 w-4 mr-2" />
                고급 필터
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80">
              <div className="p-4 space-y-4">
                {/* 출석률 범위 */}
                <div className="space-y-2">
                  <Label>출석률 범위</Label>
                  <Slider
                    value={attendanceRange}
                    onValueChange={(value) => setAttendanceRange(value as [number, number])}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{attendanceRange[0]}%</span>
                    <span>{attendanceRange[1]}%</span>
                  </div>
                  <Button size="sm" onClick={handleAttendanceRangeApply}>
                    출석률 적용
                  </Button>
                </div>
                
                <DropdownMenuSeparator />
                
                {/* 미납자 필터 */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="overdue"
                    checked={safeActiveFilters.has_overdue_payment || false}
                    onCheckedChange={handleOverdueToggle}
                  />
                  <Label htmlFor="overdue" className="text-sm">미납자만 보기</Label>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 정렬 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                정렬: {SORT_OPTIONS.find(s => s.value === safeActiveFilters.sort_field)?.label || '이름'}
                {safeActiveFilters.sort_order === 'desc' ? ' ↓' : ' ↑'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>정렬 기준</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {SORT_OPTIONS.map((sort) => (
                <div key={sort.value} className="flex">
                  <DropdownMenuCheckboxItem
                    checked={safeActiveFilters.sort_field === sort.value && safeActiveFilters.sort_order === 'asc'}
                    onCheckedChange={() => handleSortChange(sort.value, 'asc')}
                  >
                    {sort.label} ↑
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={safeActiveFilters.sort_field === sort.value && safeActiveFilters.sort_order === 'desc'}
                    onCheckedChange={() => handleSortChange(sort.value, 'desc')}
                  >
                    {sort.label} ↓
                  </DropdownMenuCheckboxItem>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 필터 초기화 */}
          {activeFilterCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              초기화
            </Button>
          )}
        </div>
      </div>

      {/* 결과 요약 */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            총 {totalResults.toLocaleString()}명
          </Badge>
          {activeFilterCount > 0 && (
            <Badge variant="outline">
              {activeFilterCount}개 필터 적용됨
            </Badge>
          )}
        </div>
        
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            검색 중...
          </div>
        )}
      </div>

      {/* 활성 필터 태그 */}
      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 mt-4 pt-4 border-t"
          >
            {renderActiveFilterTags()}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}