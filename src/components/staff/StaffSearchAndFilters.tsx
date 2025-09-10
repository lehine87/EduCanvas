'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
// import { DatePickerWithRange } from '@/components/ui/date-picker'
import {
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import type { InstructorFilters } from '@/types/staff.types'
// import type { DateRange } from 'react-day-picker'

interface InstructorSearchAndFiltersProps {
  onFilterChange: (filters: InstructorFilters) => void
  initialFilters?: InstructorFilters
  className?: string
}

export default function InstructorSearchAndFilters({
  onFilterChange,
  initialFilters = {},
  className
}: InstructorSearchAndFiltersProps) {
  const [localFilters, setLocalFilters] = useState<InstructorFilters>(initialFilters)
  // const [dateRange, setDateRange] = useState<DateRange | undefined>()

  // 필터 상태 업데이트
  useEffect(() => {
    setLocalFilters(initialFilters)
  }, [initialFilters])

  // 로컬 필터 변경 시 부모에게 전달
  const handleFilterUpdate = (newFilters: InstructorFilters) => {
    setLocalFilters(newFilters)
    onFilterChange(newFilters)
  }

  // 개별 필터 업데이트
  const updateFilter = (key: keyof InstructorFilters, value: any) => {
    const updated = { ...localFilters, [key]: value }
    if (!value || (Array.isArray(value) && value.length === 0)) {
      delete updated[key]
    }
    handleFilterUpdate(updated)
  }

  // 날짜 범위 업데이트 함수는 인라인으로 이동

  // 모든 필터 초기화
  const clearAllFilters = () => {
    handleFilterUpdate({})
  }

  // 활성 필터 개수 계산
  const activeFilterCount = Object.keys(localFilters).filter(key => {
    const value = localFilters[key as keyof InstructorFilters]
    return value !== undefined && value !== '' && 
           !(Array.isArray(value) && value.length === 0)
  }).length

  return (
    <Card className={cn("border-dashed", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">상세 검색 및 필터</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}개 적용
              </Badge>
            )}
          </div>
          
          {activeFilterCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              모두 지우기
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 검색 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">통합 검색</Label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                placeholder="이름, 직원번호, 부서 검색..."
                value={localFilters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="department">부서</Label>
            <Input
              id="department"
              placeholder="부서명 입력..."
              value={localFilters.department || ''}
              onChange={(e) => updateFilter('department', e.target.value)}
            />
          </div>
        </div>

        <Separator />

        {/* 상태 및 고용 형태 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>재직 상태</Label>
            <Select 
              value={localFilters.status || ''} 
              onValueChange={(value) => updateFilter('status', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                <SelectItem value="active">재직</SelectItem>
                <SelectItem value="inactive">퇴직</SelectItem>
                <SelectItem value="pending">대기</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>고용 형태</Label>
            <Select 
              value={localFilters.employment_type || ''} 
              onValueChange={(value) => updateFilter('employment_type', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="고용형태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                <SelectItem value="정규직">정규직</SelectItem>
                <SelectItem value="계약직">계약직</SelectItem>
                <SelectItem value="파트타임">파트타임</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>강의 레벨</Label>
            <Select 
              value={localFilters.teaching_level || ''} 
              onValueChange={(value) => updateFilter('teaching_level', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="레벨 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                <SelectItem value="초급">초급</SelectItem>
                <SelectItem value="중급">중급</SelectItem>
                <SelectItem value="고급">고급</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* 날짜 범위 */}
        <div className="space-y-2">
          <Label>입사일 범위</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              placeholder="시작일"
              value={localFilters.date_range?.start || ''}
              onChange={(e) => {
                const newRange = {
                  start: e.target.value,
                  end: localFilters.date_range?.end || ''
                }
                updateFilter('date_range', newRange.start && newRange.end ? newRange : undefined)
              }}
            />
            <Input
              type="date"
              placeholder="종료일"
              value={localFilters.date_range?.end || ''}
              onChange={(e) => {
                const newRange = {
                  start: localFilters.date_range?.start || '',
                  end: e.target.value
                }
                updateFilter('date_range', newRange.start && newRange.end ? newRange : undefined)
              }}
            />
          </div>
        </div>

        {/* 적용된 필터 표시 */}
        {activeFilterCount > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">적용된 필터</Label>
              <div className="flex flex-wrap gap-2">
                {localFilters.search && (
                  <Badge variant="outline" className="gap-1">
                    검색: {localFilters.search}
                    <XMarkIcon 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => updateFilter('search', undefined)}
                    />
                  </Badge>
                )}
                
                {localFilters.status && (
                  <Badge variant="outline" className="gap-1">
                    상태: {localFilters.status}
                    <XMarkIcon 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => updateFilter('status', undefined)}
                    />
                  </Badge>
                )}
                
                {localFilters.employment_type && (
                  <Badge variant="outline" className="gap-1">
                    고용형태: {localFilters.employment_type}
                    <XMarkIcon 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => updateFilter('employment_type', undefined)}
                    />
                  </Badge>
                )}
                
                {localFilters.department && (
                  <Badge variant="outline" className="gap-1">
                    부서: {localFilters.department}
                    <XMarkIcon 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => updateFilter('department', undefined)}
                    />
                  </Badge>
                )}
                
                {localFilters.teaching_level && (
                  <Badge variant="outline" className="gap-1">
                    레벨: {localFilters.teaching_level}
                    <XMarkIcon 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => updateFilter('teaching_level', undefined)}
                    />
                  </Badge>
                )}
                
                {localFilters.date_range && (
                  <Badge variant="outline" className="gap-1">
                    입사일: {localFilters.date_range.start} ~ {localFilters.date_range.end}
                    <XMarkIcon 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => updateFilter('date_range', undefined)}
                    />
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}