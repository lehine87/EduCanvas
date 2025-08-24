'use client'

import React, { memo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Badge, Button } from '@/components/ui'
import { Checkbox } from '@/components/ui/checkbox'
import type { StaffMember } from '@/types/staff.types'
import { 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  BriefcaseIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid'

// 상태별 스타일 및 라벨 정의
const statusConfig = {
  active: {
    color: 'bg-green-500',
    badgeClass: 'bg-success-100 text-success-700',
    icon: CheckCircleIcon,
    label: '활동중'
  },
  pending: {
    color: 'bg-yellow-500', 
    badgeClass: 'bg-yellow-100 text-yellow-700',
    icon: ExclamationTriangleIcon,
    label: '대기중'
  },
  inactive: {
    color: 'bg-gray-500',
    badgeClass: 'bg-gray-100 text-gray-700',
    icon: XCircleIcon,
    label: '비활성'
  }
}

// 직능별 스타일 정의
const jobFunctionConfig = {
  instructor: {
    badgeClass: 'bg-blue-100 text-blue-700',
    label: '강사'
  },
  general: {
    badgeClass: 'bg-purple-100 text-purple-700', 
    label: '행정직'
  },
  admin: {
    badgeClass: 'bg-brand-100 text-brand-700',
    label: '관리자'
  }
}

/**
 * StaffCard Props
 */
export interface StaffCardProps {
  /** 직원 데이터 */
  staff: StaffMember
  /** 카드 클릭 핸들러 */
  onClick?: (staff: StaffMember) => void
  /** 수정 버튼 클릭 핸들러 */
  onEdit?: (staff: StaffMember) => void
  /** 삭제 버튼 클릭 핸들러 */
  onDelete?: (staff: StaffMember) => void
  /** 상세보기 버튼 클릭 핸들러 */
  onView?: (staff: StaffMember) => void
  /** 선택된 상태 */
  isSelected?: boolean
  /** 선택 핸들러 */
  onSelect?: (staffId: string, selected: boolean) => void
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
 * 직원 상태 배지 컴포넌트
 */
const StaffStatusBadge = memo<{ status: string; compact?: boolean }>(({ status, compact }) => {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive
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

StaffStatusBadge.displayName = 'StaffStatusBadge'

/**
 * 직능 배지 컴포넌트
 */
const JobFunctionBadge = memo<{ jobFunction: string; compact?: boolean }>(({ jobFunction, compact }) => {
  const config = jobFunctionConfig[jobFunction as keyof typeof jobFunctionConfig] || jobFunctionConfig.general

  return (
    <Badge 
      variant="outline" 
      className={cn(
        config.badgeClass,
        compact ? 'text-xs px-1 py-0' : 'text-sm px-2 py-1'
      )}
    >
      {config.label}
    </Badge>
  )
})

JobFunctionBadge.displayName = 'JobFunctionBadge'

/**
 * StaffCard - 직원 카드 뷰 컴포넌트
 * 
 * 특징:
 * - 시각적으로 매력적인 카드 레이아웃
 * - 직원 상태 색상 표시
 * - 연락처 및 기본 정보 표시
 * - 액션 버튼 지원
 * - 선택 가능 옵션
 * - 컴팩트 모드 지원
 * - 완전한 접근성
 */
export const StaffCard = memo<StaffCardProps>(({
  staff,
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
    onClick?.(staff)
  }, [onClick, staff])

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(staff)
  }, [onEdit, staff])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(staff)
  }, [onDelete, staff])

  const handleView = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onView?.(staff)
  }, [onView, staff])

  const handleSelect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.(staff.id, !isSelected)
  }, [onSelect, staff.id, isSelected])

  // 직원 상태 설정
  const statusInfo = statusConfig[staff.status as keyof typeof statusConfig] || statusConfig.inactive

  // 카드 스타일
  const cardStyles = cn(
    // 기본 스타일
    'relative bg-white border rounded-xl shadow-card transition-all duration-200 cursor-pointer',
    // 호버 효과
    'hover:shadow-card-hover hover:-translate-y-0.5',
    // 선택 상태
    isSelected && 'ring-2 ring-brand-500 border-brand-300',
    // 비활성 상태
    staff.status !== 'active' && 'opacity-90',
    // 컴팩트 모드
    compact ? 'p-3' : 'p-4',
    className
  )

  return (
    <div className={cardStyles} onClick={handleCardClick}>
      {/* 선택 체크박스 */}
      {showSelection && (
        <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect?.(staff.id, !isSelected)}
            onClick={handleSelect}
            aria-label={`${staff.full_name} 직원 선택`}
          />
        </div>
      )}

      {/* 상태 배지 */}
      <div className={cn(
        'absolute z-10',
        compact ? 'top-2 right-2' : 'top-3 right-3'
      )}>
        <StaffStatusBadge 
          status={staff.status}
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
              {staff.full_name}
            </h3>
            
            {/* 직능 배지 */}
            <JobFunctionBadge 
              jobFunction={staff.job_function}
              compact={compact}
            />
          </div>
          
          {!compact && staff.role && (
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                {staff.role}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* 직원 정보 */}
      <div className={cn(
        'grid gap-2',
        compact ? 'grid-cols-1' : 'grid-cols-2',
        // 체크박스가 있을 때 왼쪽 여백 추가
        showSelection && 'pl-8'
      )}>
        {/* 이메일 */}
        {staff.email && (
          <div className={cn(
            'flex items-center text-gray-600',
            compact ? 'text-xs' : 'text-sm'
          )}>
            <EnvelopeIcon className={cn(
              'mr-1 flex-shrink-0',
              compact ? 'w-3 h-3' : 'w-4 h-4'
            )} />
            <span className="truncate">
              {staff.email}
            </span>
          </div>
        )}

        {/* 연락처 */}
        {staff.phone && (
          <div className={cn(
            'flex items-center text-gray-600',
            compact ? 'text-xs' : 'text-sm'
          )}>
            <PhoneIcon className={cn(
              'mr-1 flex-shrink-0',
              compact ? 'w-3 h-3' : 'w-4 h-4'
            )} />
            <span className="truncate">
              {staff.phone}
            </span>
          </div>
        )}

        {/* 입사일 */}
        {staff.hire_date && (
          <div className={cn(
            'flex items-center text-gray-600',
            compact ? 'text-xs' : 'text-sm'
          )}>
            <BriefcaseIcon className={cn(
              'mr-1 flex-shrink-0',
              compact ? 'w-3 h-3' : 'w-4 h-4'
            )} />
            <span className="truncate">
              {new Date(staff.hire_date).toLocaleDateString('ko-KR')}
            </span>
          </div>
        )}

        {/* 등록일 */}
        {!compact && staff.created_at && (
          <div className="flex items-center text-gray-500 text-xs">
            <CalendarIcon className="w-3 h-3 mr-1 flex-shrink-0" />
            <span>
              {new Date(staff.created_at).toLocaleDateString('ko-KR')}
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
              aria-label={`${staff.full_name} 직원 상세보기`}
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
              aria-label={`${staff.full_name} 직원 수정`}
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
              aria-label={`${staff.full_name} 직원 삭제`}
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
})

StaffCard.displayName = 'StaffCard'