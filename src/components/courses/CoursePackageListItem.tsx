'use client'

import React, { memo } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { CoursePackageWithRelations, BillingType } from '@/types/course.types'
import {
  getBillingPeriodText,
  BILLING_TYPE_CONFIGS,
  calculateDiscountPercentage
} from '@/types/course.types'
import {
  CurrencyDollarIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  TagIcon,
  StarIcon
} from '@heroicons/react/24/outline'

// 상태별 스타일 매핑
const statusStyles = {
  active: 'bg-green-500',
  inactive: 'bg-gray-500'
}

const statusLabels = {
  active: '활성',
  inactive: '비활성'
}

const statusBadgeStyles = {
  active: 'bg-success-100 text-success-700',
  inactive: 'bg-gray-100 text-gray-700'
}

interface CoursePackageListItemProps {
  coursePackage: CoursePackageWithRelations
  onClick?: () => void
  onSelect?: (packageId: string) => void
  isSelected?: boolean
  onEdit?: (coursePackage: CoursePackageWithRelations) => void
  onDelete?: (coursePackage: CoursePackageWithRelations) => void
  showActions?: boolean
  showSelection?: boolean
}

export const CoursePackageListItem = memo<CoursePackageListItemProps>(({
  coursePackage,
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
    onSelect?.(coursePackage.id)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(coursePackage)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(coursePackage)
  }

  // 할인율 계산
  const discountPercentage = coursePackage.original_price && coursePackage.original_price > coursePackage.price
    ? calculateDiscountPercentage(coursePackage.original_price, coursePackage.price)
    : 0

  // 기간 텍스트
  const periodText = getBillingPeriodText(coursePackage)
  
  // 결제 타입 설정
  const billingConfig = BILLING_TYPE_CONFIGS[coursePackage.billing_type as BillingType]

  return (
    <div
      className={cn(
        "group flex items-center gap-3 p-3 bg-white border rounded-lg",
        "hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer relative",
        isSelected && "bg-brand-50 border-brand-300"
      )}
      onClick={handleClick}
    >
      {/* 추천 과정 표시 */}
      {coursePackage.is_featured && (
        <div className="absolute -top-1 -right-1 z-10">
          <div className="bg-yellow-500 text-white text-xs rounded-full p-1">
            <StarIcon className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* 선택 체크박스 */}
      {showSelection && onSelect && (
        <div data-no-detail className="flex-shrink-0">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(coursePackage.id)}
            onClick={handleSelect}
          />
        </div>
      )}

      {/* 과정 상태 인디케이터 */}
      <div 
        className={cn(
          "w-1 h-12 rounded-full flex-shrink-0",
          statusStyles[coursePackage.is_active ? 'active' : 'inactive']
        )}
      />

      {/* 메인 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gray-900 truncate">
                {coursePackage.name}
              </h3>
              <Badge 
                variant="default"
                className={cn(
                  "text-xs",
                  statusBadgeStyles[coursePackage.is_active ? 'active' : 'inactive']
                )}
              >
                {statusLabels[coursePackage.is_active ? 'active' : 'inactive']}
              </Badge>
              
              {/* 결제 타입 배지 */}
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  `bg-${billingConfig.color}-100 text-${billingConfig.color}-700`
                )}
              >
                {billingConfig.icon} {billingConfig.label}
              </Badge>
            </div>

            {/* 부가 정보 */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {/* 가격 정보 */}
              <div className="flex items-center gap-1">
                <CurrencyDollarIcon className="w-3.5 h-3.5" />
                <span className="font-medium text-gray-900">
                  {coursePackage.price.toLocaleString()}
                  <span className="text-gray-500 ml-1">
                    {coursePackage.currency || 'KRW'}
                  </span>
                </span>
                {discountPercentage > 0 && (
                  <>
                    <span className="line-through text-gray-400 ml-1">
                      {coursePackage.original_price?.toLocaleString()}
                    </span>
                    <Badge className="bg-red-100 text-red-700 text-xs ml-1">
                      -{discountPercentage}%
                    </Badge>
                  </>
                )}
              </div>

              {/* 기간 정보 */}
              <div className="flex items-center gap-1">
                <CalendarDaysIcon className="w-3.5 h-3.5" />
                <span>{periodText}</span>
              </div>

              {/* 클래스 정보 */}
              {coursePackage.class && (
                <div className="flex items-center gap-1">
                  <TagIcon className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[120px]">
                    {coursePackage.class.name}
                  </span>
                </div>
              )}

              {/* 수강생 수 */}
              {coursePackage.enrollment_count !== undefined && (
                <div className="flex items-center gap-1">
                  <UserGroupIcon className="w-3.5 h-3.5" />
                  <span>
                    {coursePackage.enrollment_count}명
                    {coursePackage.max_enrollments && (
                      <span className="text-gray-400">
                        /{coursePackage.max_enrollments}
                      </span>
                    )}
                  </span>
                </div>
              )}

              {/* 생성일 */}
              {coursePackage.created_at && (
                <div className="flex items-center gap-1">
                  <CalendarDaysIcon className="w-3.5 h-3.5" />
                  <span>
                    {new Date(coursePackage.created_at).toLocaleDateString('ko-KR')}
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

        {/* 설명 */}
        {coursePackage.description && (
          <div className="mt-2 text-sm text-gray-600 line-clamp-1">
            {coursePackage.description}
          </div>
        )}
      </div>
    </div>
  )
})

CoursePackageListItem.displayName = 'CoursePackageListItem'