'use client'

import React, { memo } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { StaffMember } from '@/types/staff.types'
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  BriefcaseIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

// 상태별 스타일 매핑
const statusStyles = {
  active: 'bg-green-500',
  pending: 'bg-yellow-500',
  inactive: 'bg-gray-500'
}

const statusLabels = {
  active: '활동중',
  pending: '대기중',
  inactive: '비활성'
}

const statusBadgeStyles = {
  active: 'bg-success-100 text-success-700',
  pending: 'bg-yellow-100 text-yellow-700',
  inactive: 'bg-gray-100 text-gray-700'
}

// 직능별 배지 스타일
const jobFunctionLabels = {
  instructor: '강사',
  general: '행정직',
  admin: '관리자'
}

const jobFunctionBadgeStyles = {
  instructor: 'bg-blue-100 text-blue-700',
  general: 'bg-purple-100 text-purple-700',
  admin: 'bg-brand-100 text-brand-700'
}

interface StaffListItemProps {
  staff: StaffMember
  onClick?: () => void
  onSelect?: (staffId: string) => void
  isSelected?: boolean
  onEdit?: (staff: StaffMember) => void
  onDelete?: (staff: StaffMember) => void
  showActions?: boolean
  showSelection?: boolean
}

export const StaffListItem = memo<StaffListItemProps>(({
  staff,
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
    onSelect?.(staff.id)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(staff)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(staff)
  }

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
            onCheckedChange={() => onSelect(staff.id)}
            onClick={handleSelect}
          />
        </div>
      )}

      {/* 직원 상태 인디케이터 */}
      <div 
        className={cn(
          "w-1 h-12 rounded-full flex-shrink-0",
          statusStyles[staff.status as keyof typeof statusStyles] || statusStyles.inactive
        )}
      />

      {/* 메인 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gray-900 truncate">
                {staff.full_name}
              </h3>
              <Badge 
                variant="default"
                className={cn(
                  "text-xs",
                  statusBadgeStyles[staff.status as keyof typeof statusBadgeStyles]
                )}
              >
                {statusLabels[staff.status as keyof typeof statusLabels]}
              </Badge>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  jobFunctionBadgeStyles[staff.job_function as keyof typeof jobFunctionBadgeStyles]
                )}
              >
                {jobFunctionLabels[staff.job_function as keyof typeof jobFunctionLabels]}
              </Badge>
              {staff.role && (
                <Badge variant="outline" className="text-xs">
                  {staff.role}
                </Badge>
              )}
            </div>

            {/* 부가 정보 */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {/* 이메일 */}
              {staff.email && (
                <div className="flex items-center gap-1">
                  <EnvelopeIcon className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[150px]">
                    {staff.email}
                  </span>
                </div>
              )}

              {/* 연락처 */}
              {staff.phone && (
                <div className="flex items-center gap-1">
                  <PhoneIcon className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[120px]">
                    {staff.phone}
                  </span>
                </div>
              )}

              {/* 입사일 */}
              {staff.hire_date && (
                <div className="flex items-center gap-1">
                  <BriefcaseIcon className="w-3.5 h-3.5" />
                  <span>
                    {new Date(staff.hire_date).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              )}

              {/* 등록일 */}
              {staff.created_at && (
                <div className="flex items-center gap-1">
                  <CalendarDaysIcon className="w-3.5 h-3.5" />
                  <span>
                    {new Date(staff.created_at).toLocaleDateString('ko-KR')}
                  </span>
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

StaffListItem.displayName = 'StaffListItem'