'use client'

import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { useSearchStore, useSearchContext, useSearchFilters } from '@/lib/stores/searchStore'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function SearchFilters() {
  const context = useSearchContext()
  const filters = useSearchFilters()
  const { updateFilter, clearFilters } = useSearchStore()
  
  // Get active filter count
  const activeFilterCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof typeof filters]
    if (Array.isArray(value)) return value.length > 0
    if (value && typeof value === 'object' && 'start' in value && 'end' in value) {
      return value.start && value.end
    }
    return Boolean(value)
  }).length

  // Context-specific filter configurations
  const getFilterConfig = () => {
    switch (context) {
      case 'students':
        return {
          title: '학생 필터',
          filters: [
            { key: 'status', label: '상태', type: 'checkbox', options: [
              { value: 'active', label: '재학' },
              { value: 'inactive', label: '휴학' },
              { value: 'graduated', label: '졸업' }
            ]},
            { key: 'grade', label: '학년', type: 'checkbox', options: [
              { value: '1', label: '1학년' },
              { value: '2', label: '2학년' },
              { value: '3', label: '3학년' }
            ]}
          ]
        }
      case 'classes':
        return {
          title: '수업 필터',
          filters: [
            { key: 'dayOfWeek', label: '요일', type: 'checkbox', options: [
              { value: 'mon', label: '월' },
              { value: 'tue', label: '화' },
              { value: 'wed', label: '수' },
              { value: 'thu', label: '목' },
              { value: 'fri', label: '금' },
              { value: 'sat', label: '토' },
              { value: 'sun', label: '일' }
            ]},
            { key: 'room', label: '강의실', type: 'checkbox', options: [
              { value: '101호', label: '101호' },
              { value: '102호', label: '102호' },
              { value: '103호', label: '103호' }
            ]}
          ]
        }
      case 'staff':
        return {
          title: '직원 필터',
          filters: [
            { key: 'role', label: '역할', type: 'checkbox', options: [
              { value: 'admin', label: '관리자' },
              { value: 'instructor', label: '강사' },
              { value: 'staff', label: '직원' }
            ]},
            { key: 'department', label: '부서', type: 'checkbox', options: [
              { value: '수학', label: '수학' },
              { value: '영어', label: '영어' },
              { value: '과학', label: '과학' }
            ]}
          ]
        }
      default:
        return {
          title: '필터',
          filters: [
            { key: 'status', label: '상태', type: 'checkbox', options: [
              { value: 'active', label: '활성' },
              { value: 'inactive', label: '비활성' }
            ]}
          ]
        }
    }
  }

  const config = getFilterConfig()

  const handleCheckboxChange = (filterKey: string, value: string, checked: boolean) => {
    const currentValues = (filters[filterKey as keyof typeof filters] as string[]) || []
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter((v: string) => v !== value)
    
    updateFilter(filterKey as keyof typeof filters, newValues.length > 0 ? newValues : undefined)
  }

  const handleDateRangeChange = (type: 'start' | 'end', date: Date | undefined) => {
    const currentRange = filters.dateRange || { start: undefined, end: undefined }
    const newRange = {
      ...currentRange,
      [type]: date
    }
    
    if (newRange.start && newRange.end) {
      updateFilter('dateRange', newRange as any)
    } else if (!newRange.start && !newRange.end) {
      updateFilter('dateRange', undefined)
    }
  }

  return (
    <div className="space-y-4">
        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">📅 기간</Label>
          <div className="grid grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`
                    justify-start text-left font-normal h-8 text-xs
                    ${filters.dateRange?.start 
                      ? 'bg-educanvas-50 dark:bg-educanvas-950/30 border-educanvas-300 dark:border-educanvas-700' 
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'
                    }
                  `}
                >
                  <Calendar className="mr-1 h-3 w-3" />
                  {filters.dateRange?.start
                    ? format(filters.dateRange.start, 'M/d', { locale: ko })
                    : '시작일'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={filters.dateRange?.start}
                  onSelect={(date) => handleDateRangeChange('start', date)}
                  locale={ko}
                />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`
                    justify-start text-left font-normal h-8 text-xs
                    ${filters.dateRange?.end 
                      ? 'bg-educanvas-50 dark:bg-educanvas-950/30 border-educanvas-300 dark:border-educanvas-700' 
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'
                    }
                  `}
                >
                  <Calendar className="mr-1 h-3 w-3" />
                  {filters.dateRange?.end
                    ? format(filters.dateRange.end, 'M/d', { locale: ko })
                    : '종료일'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={filters.dateRange?.end}
                  onSelect={(date) => handleDateRangeChange('end', date)}
                  locale={ko}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Dynamic Filters */}
        {config.filters.map((filter) => (
          <div key={filter.key} className="space-y-2">
            <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {filter.key === 'status' && '📊 '}
              {filter.key === 'grade' && '🎓 '}
              {filter.key === 'dayOfWeek' && '📅 '}
              {filter.key === 'room' && '🏠 '}
              {filter.key === 'role' && '👥 '}
              {filter.key === 'department' && '🏢 '}
              {filter.label}
            </Label>
            {filter.type === 'checkbox' && (
              <div className={
                filter.key === 'dayOfWeek' 
                  ? 'grid grid-cols-7 gap-1.5' // 요일은 그리드 유지 (정확히 7개)
                  : 'flex flex-wrap gap-1.5' // 나머지는 유연한 flex로
              }>
                {filter.options?.map((option) => {
                  const currentValues = (filters[filter.key as keyof typeof filters] as string[]) || []
                  const isChecked = currentValues.includes(option.value)
                  
                  return (
                    <Button
                      key={option.value}
                      variant={isChecked ? "default" : "outline"}
                      size="sm"
                      className={`
                        justify-center h-7 text-xs transition-all duration-200 px-3 py-1
                        ${filter.key === 'dayOfWeek' 
                          ? 'aspect-square p-0 w-full min-w-0' 
                          : 'whitespace-nowrap flex-shrink-0'
                        }
                        ${isChecked 
                          ? 'bg-educanvas-500 text-white hover:bg-educanvas-600 dark:bg-educanvas-400 dark:text-neutral-900' 
                          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:border-educanvas-300'
                        }
                      `}
                      onClick={() => handleCheckboxChange(filter.key, option.value, !isChecked)}
                      role="checkbox"
                      aria-checked={isChecked}
                      title={option.label}
                    >
                      {option.label}
                    </Button>
                  )
                })}
              </div>
            )}
          </div>
        ))}

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              onClick={clearFilters}
            >
              <span className="text-xs">필터 초기화 ({activeFilterCount}개)</span>
            </Button>
          </div>
        )}
    </div>
  )
}