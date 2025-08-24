'use client'

import React, { memo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Badge, Button } from '@/components/ui'
import { Checkbox } from '@/components/ui/checkbox'
import type { 
  CoursePackageWithRelations, 
  BillingType
} from '@/types/course.types'
import {
  calculateDiscountPercentage,
  getBillingPeriodText,
  BILLING_TYPE_CONFIGS
} from '@/types/course.types'
import { 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserGroupIcon,
  TagIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'

// 상태별 스타일 및 라벨 정의
const statusConfig = {
  active: {
    color: 'bg-green-500',
    badgeClass: 'bg-success-100 text-success-700',
    icon: CheckCircleIcon,
    label: '활성'
  },
  inactive: {
    color: 'bg-gray-500',
    badgeClass: 'bg-gray-100 text-gray-700',
    icon: XCircleIcon,
    label: '비활성'
  }
}

/**
 * CoursePackageCard Props
 */
export interface CoursePackageCardProps {
  /** 과정 데이터 */
  coursePackage: CoursePackageWithRelations
  /** 카드 클릭 핸들러 */
  onClick?: (coursePackage: CoursePackageWithRelations) => void
  /** 수정 버튼 클릭 핸들러 */
  onEdit?: (coursePackage: CoursePackageWithRelations) => void
  /** 삭제 버튼 클릭 핸들러 */
  onDelete?: (coursePackage: CoursePackageWithRelations) => void
  /** 상세보기 버튼 클릭 핸들러 */
  onView?: (coursePackage: CoursePackageWithRelations) => void
  /** 선택된 상태 */
  isSelected?: boolean
  /** 선택 핸들러 */
  onSelect?: (packageId: string, selected: boolean) => void
  /** 액션 버튼 표시 여부 */
  showActions?: boolean
  /** 선택 체크박스 표시 여부 */
  showSelection?: boolean
  /** 컴팩트 모드 */
  compact?: boolean
  /** 추가 CSS 클래스 */
  className?: string
}

/**
 * 과정 상태 배지 컴포넌트
 */
const CourseStatusBadge = memo<{ isActive?: boolean; compact?: boolean }>(({ isActive, compact }) => {
  const config = statusConfig[isActive ? 'active' : 'inactive']
  const IconComponent = config.icon

  return (
    <Badge 
      variant="default"
      className={cn(
        config.badgeClass,
        compact ? 'text-xs px-1 py-0' : 'text-sm px-2 py-1'
      )}
    >
      {compact ? (
        <IconComponent className="w-3 h-3" />
      ) : (
        <>
          <IconComponent className="w-3 h-3 mr-1" />
          {config.label}
        </>
      )}
    </Badge>
  )
})

CourseStatusBadge.displayName = 'CourseStatusBadge'

/**
 * 결제 타입 배지 컴포넌트
 */
const BillingTypeBadge = memo<{ billingType: BillingType; compact?: boolean }>(({ billingType, compact }) => {
  const config = BILLING_TYPE_CONFIGS[billingType]
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        `bg-${config.color}-100 text-${config.color}-700`,
        compact ? 'text-xs px-1 py-0' : 'text-sm px-2 py-1'
      )}
    >
      {compact ? (
        config.icon
      ) : (
        <>
          {config.icon} {config.label}
        </>
      )}
    </Badge>
  )
})

BillingTypeBadge.displayName = 'BillingTypeBadge'

/**
 * CoursePackageCard - 과정 카드 뷰 컴포넌트
 * 
 * 특징:
 * - 시각적으로 매력적인 카드 레이아웃
 * - 과정 상태 색상 표시
 * - 가격 정보 및 할인율 표시
 * - 결제 타입별 아이콘
 * - 액션 버튼 지원
 * - 선택 가능 옵션
 * - 컴팩트 모드 지원
 * - 완전한 접근성
 */
export const CoursePackageCard = memo<CoursePackageCardProps>(({
  coursePackage,
  onClick,
  onEdit,
  onDelete,
  onView,
  isSelected = false,
  onSelect,
  showActions = true,
  showSelection = false,
  compact = false,
  className
}) => {
  // 이벤트 핸들러
  const handleCardClick = useCallback(() => {
    onClick?.(coursePackage)
  }, [onClick, coursePackage])

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(coursePackage)
  }, [onEdit, coursePackage])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(coursePackage)
  }, [onDelete, coursePackage])

  const handleView = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onView?.(coursePackage)
  }, [onView, coursePackage])

  const handleSelect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.(coursePackage.id, !isSelected)
  }, [onSelect, coursePackage.id, isSelected])

  // 할인율 계산
  const discountPercentage = coursePackage.original_price && coursePackage.original_price > coursePackage.price
    ? calculateDiscountPercentage(coursePackage.original_price, coursePackage.price)
    : 0

  // 기간 텍스트
  const periodText = getBillingPeriodText(coursePackage)

  // 과정 상태 설정
  const statusInfo = statusConfig[coursePackage.is_active ? 'active' : 'inactive']

  // 카드 스타일
  const cardStyles = cn(
    // 기본 스타일
    'relative bg-white border rounded-xl shadow-card transition-all duration-200 cursor-pointer overflow-hidden',
    // 호버 효과
    'hover:shadow-card-hover hover:-translate-y-0.5',
    // 선택 상태
    isSelected && 'ring-2 ring-brand-500 border-brand-300',
    // 비활성 상태
    !coursePackage.is_active && 'opacity-75',
    // 컴팩트 모드
    compact ? 'p-3' : 'p-4',
    className
  )

  return (
    <div className={cardStyles} onClick={handleCardClick}>
      {/* 추천 과정 리본 */}
      {coursePackage.is_featured && (
        <div className="absolute top-0 right-0 z-20">
          <div className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 transform rotate-12 translate-x-2 -translate-y-1">
            <StarIcon className="w-3 h-3 inline mr-1" />
            추천
          </div>
        </div>
      )}

      {/* 선택 체크박스 */}
      {showSelection && (
        <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect?.(coursePackage.id, !isSelected)}
            onClick={handleSelect}
            aria-label={`${coursePackage.name} 과정 선택`}
          />
        </div>
      )}

      {/* 상태 배지 */}
      <div className={cn(
        'absolute z-10',
        compact ? 'top-2 right-2' : 'top-3 right-3'
      )}>
        <CourseStatusBadge 
          isActive={coursePackage.is_active ?? false} 
          compact={compact}
        />
      </div>

      {/* 헤더 */}
      <div className={cn(
        'flex items-start',
        compact ? 'space-x-2 mb-2' : 'space-x-3 mb-3',
        // 체크박스가 있을 때 왼쪽 여백 추가
        showSelection && 'pl-8'
      )}>
        {/* 상태 색상 인디케이터 */}
        <div 
          className={cn(
            'rounded-full flex-shrink-0 mt-1',
            compact ? 'w-3 h-3' : 'w-4 h-4',
            statusInfo.color
          )}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cn(
              'font-semibold text-gray-900 truncate',
              compact ? 'text-sm' : 'text-lg'
            )}>
              {coursePackage.name}
            </h3>
            
            {/* 결제 타입 배지 */}
            <BillingTypeBadge 
              billingType={coursePackage.billing_type as BillingType}
              compact={compact}
            />
          </div>
          
          {!compact && coursePackage.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
              {coursePackage.description}
            </p>
          )}
        </div>
      </div>

      {/* 가격 정보 */}
      <div className={cn(
        'mb-3',
        // 체크박스가 있을 때 왼쪽 여백 추가
        showSelection && 'pl-8'
      )}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-2xl font-bold text-gray-900">
            <CurrencyDollarIcon className="w-5 h-5 text-gray-400" />
            {coursePackage.price.toLocaleString()}
            <span className="text-sm text-gray-500 font-normal">
              {coursePackage.currency || 'KRW'}
            </span>
          </div>
          
          {/* 할인 정보 */}
          {discountPercentage > 0 && (
            <>
              <span className="text-sm text-gray-400 line-through">
                {coursePackage.original_price?.toLocaleString()}
              </span>
              <Badge className="bg-red-100 text-red-700 text-xs">
                {discountPercentage}% 할인
              </Badge>
            </>
          )}
        </div>
        
        {/* 기간 정보 */}
        <div className="flex items-center text-sm text-gray-500 mt-1">
          <CalendarIcon className="w-4 h-4 mr-1" />
          {periodText}
        </div>
      </div>

      {/* 과정 정보 */}
      <div className={cn(
        'grid gap-2',
        compact ? 'grid-cols-1' : 'grid-cols-2',
        // 체크박스가 있을 때 왼쪽 여백 추가
        showSelection && 'pl-8'
      )}>
        {/* 클래스 정보 */}
        {coursePackage.class && (
          <div className={cn(
            'flex items-center text-gray-600',
            compact ? 'text-xs' : 'text-sm'
          )}>
            <TagIcon className={cn(
              'mr-1 flex-shrink-0',
              compact ? 'w-3 h-3' : 'w-4 h-4'
            )} />
            <span className="truncate">
              {coursePackage.class.name}
            </span>
          </div>
        )}

        {/* 수강생 수 */}
        {coursePackage.enrollment_count !== undefined && (
          <div className={cn(
            'flex items-center text-gray-600',
            compact ? 'text-xs' : 'text-sm'
          )}>
            <UserGroupIcon className={cn(
              'mr-1 flex-shrink-0',
              compact ? 'w-3 h-3' : 'w-4 h-4'
            )} />
            <span className="truncate">
              {coursePackage.enrollment_count}명 수강
              {coursePackage.max_enrollments && (
                <span className="text-gray-400">
                  / {coursePackage.max_enrollments}
                </span>
              )}
            </span>
          </div>
        )}

        {/* 생성일 */}
        {!compact && coursePackage.created_at && (
          <div className="flex items-center text-gray-500 text-xs col-span-2">
            <CalendarIcon className="w-3 h-3 mr-1 flex-shrink-0" />
            <span>
              {new Date(coursePackage.created_at).toLocaleDateString('ko-KR')}
            </span>
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      {showActions && !compact && (
        <div className="flex justify-end space-x-1 mt-3 pt-3 border-t">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleView}
              className="text-gray-500 hover:text-brand-600"
              aria-label={`${coursePackage.name} 과정 상세보기`}
            >
              <EyeIcon className="w-4 h-4" />
            </Button>
          )}
          
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="text-gray-500 hover:text-brand-600"
              aria-label={`${coursePackage.name} 과정 수정`}
            >
              <PencilIcon className="w-4 h-4" />
            </Button>
          )}
          
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-gray-500 hover:text-error-600"
              aria-label={`${coursePackage.name} 과정 삭제`}
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
})

CoursePackageCard.displayName = 'CoursePackageCard'