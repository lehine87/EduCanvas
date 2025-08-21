'use client'

import React, { memo } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ClassWithRelations } from '@/store/classesStore'
import {
  UserIcon,
  UsersIcon,
  ClockIcon,
  MapPinIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { Database } from '@/types/database'

type Class = Database['public']['Tables']['classes']['Row']

interface ClassListItemProps {
  classData: ClassWithRelations
  onClick?: () => void
  onSelect?: (classId: string) => void
  isSelected?: boolean
  onEdit?: (classData: ClassWithRelations) => void
  onDelete?: (classData: ClassWithRelations) => void
  showActions?: boolean
  showSelection?: boolean
}

export const ClassListItem = memo<ClassListItemProps>(({
  classData,
  onClick,
  onSelect,
  isSelected = false,
  onEdit,
  onDelete,
  showActions = true,
  showSelection = true
}) => {
  // 이벤트 핸들러
  const handleClick = (e: React.MouseEvent) => {
    // 체크박스나 액션 버튼 클릭 시 상세보기 방지
    if ((e.target as HTMLElement).closest('[data-no-detail]')) {
      return
    }
    onClick?.()
  }

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.(classData.id)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(classData)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(classData)
  }

  // 통계 정보
  const occupancyRate = classData.max_students 
    ? Math.round(((classData.student_count || 0) / classData.max_students) * 100)
    : 0

  return (
    <div
      className={cn(
        "group flex items-center gap-3 p-3 bg-white border rounded-lg",
        "hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer",
        isSelected && "bg-brand-50 border-brand-300"
      )}
      onClick={handleClick}
    >
      {/* 선택 체크박스 */}
      {showSelection && onSelect && (
        <div data-no-detail className="flex-shrink-0">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(classData.id)}
            onClick={handleSelect}
          />
        </div>
      )}

      {/* 클래스 색상 인디케이터 */}
      <div 
        className="w-1 h-12 rounded-full flex-shrink-0"
        style={{ backgroundColor: classData.color || '#3B82F6' }}
      />

      {/* 메인 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gray-900 truncate">
                {classData.name}
              </h3>
              <Badge 
                variant={classData.is_active ? 'default' : 'secondary'}
                className={cn(
                  "text-xs",
                  classData.is_active 
                    ? 'bg-success-100 text-success-700' 
                    : 'bg-gray-100 text-gray-700'
                )}
              >
                {classData.is_active ? '활성' : '비활성'}
              </Badge>
              {classData.grade && (
                <Badge variant="outline" className="text-xs">
                  {classData.grade}
                </Badge>
              )}
              {classData.course && (
                <Badge variant="outline" className="text-xs">
                  {classData.course}
                </Badge>
              )}
            </div>

            {/* 부가 정보 */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {/* 강사 */}
              {classData.instructor && (
                <div className="flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[120px]">
                    {classData.instructor.name}
                  </span>
                </div>
              )}

              {/* 학생 수 */}
              <div className="flex items-center gap-1">
                <UsersIcon className="w-3.5 h-3.5" />
                <span>
                  {classData.student_count || 0}/{classData.max_students || 0}명
                </span>
                {occupancyRate >= 80 && (
                  <Badge 
                    variant="outline" 
                    className="text-xs ml-1 border-warning-500 text-warning-700"
                  >
                    {occupancyRate}%
                  </Badge>
                )}
              </div>

              {/* 과목 */}
              {classData.subject && (
                <div className="flex items-center gap-1">
                  <span className="truncate max-w-[100px]">
                    {classData.subject}
                  </span>
                </div>
              )}

              {/* 교실 */}
              {classData.classroom_id && (
                <div className="flex items-center gap-1">
                  <MapPinIcon className="w-3.5 h-3.5" />
                  <span>교실</span>
                </div>
              )}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-1 ml-4">
            {showActions && (
              <div 
                data-no-detail
                className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {onEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEdit}
                    className="h-7 w-7 p-0"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDelete}
                    className="h-7 w-7 p-0 text-error-600 hover:text-error-700"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            )}
            
            {/* 상세보기 화살표 */}
            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  )
})

ClassListItem.displayName = 'ClassListItem'