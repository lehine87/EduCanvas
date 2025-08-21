'use client'

import React, { memo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Badge, Button } from '@/components/ui'
import { ClassWithRelations } from '@/store/classesStore'
import { 
  PencilIcon, 
  TrashIcon, 
  EyeIcon, 
  UsersIcon,
  MapPinIcon,
  UserIcon,
  CalendarIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'

/**
 * ClassCard Props
 */
export interface ClassCardProps {
  /** 클래스 데이터 */
  classData: ClassWithRelations
  /** 카드 클릭 핸들러 */
  onClick?: (classData: ClassWithRelations) => void
  /** 수정 버튼 클릭 핸들러 */
  onEdit?: (classData: ClassWithRelations) => void
  /** 삭제 버튼 클릭 핸들러 */
  onDelete?: (classData: ClassWithRelations) => void
  /** 상세보기 버튼 클릭 핸들러 */
  onView?: (classData: ClassWithRelations) => void
  /** 선택된 상태 */
  isSelected?: boolean
  /** 선택 핸들러 */
  onSelect?: (classId: string, selected: boolean) => void
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
 * 클래스 상태 배지 컴포넌트
 */
const ClassStatusBadge = memo<{ isActive?: boolean; compact?: boolean }>(({ isActive, compact }) => (
  <Badge 
    variant={isActive ? 'default' : 'destructive'} 
    className={`${compact ? 'text-xs px-1 py-0' : 'text-sm px-2 py-1'} ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
  >
    {compact ? (
      isActive ? (
        <CheckCircleIcon className="w-3 h-3" />
      ) : (
        <XCircleIcon className="w-3 h-3" />
      )
    ) : (
      <>
        {isActive ? (
          <CheckCircleIcon className="w-3 h-3 mr-1" />
        ) : (
          <XCircleIcon className="w-3 h-3 mr-1" />
        )}
        {isActive ? '활성' : '비활성'}
      </>
    )}
  </Badge>
))

ClassStatusBadge.displayName = 'ClassStatusBadge'

/**
 * 클래스 용량 표시 컴포넌트
 */
const ClassCapacityIndicator = memo<{ 
  current: number
  max?: number
  compact?: boolean
}>(({ current, max, compact }) => {
  const percentage = max && max > 0 ? (current / max) * 100 : 0
  const isFull = current >= (max || 0)
  const isNearFull = percentage >= 80

  return (
    <div className={cn(
      'flex items-center',
      compact ? 'space-x-1' : 'space-x-2'
    )}>
      <UsersIcon className={cn(
        'text-gray-400',
        compact ? 'w-3 h-3' : 'w-4 h-4'
      )} />
      <span className={cn(
        'font-medium',
        compact ? 'text-xs' : 'text-sm',
        isFull && 'text-error-600',
        isNearFull && !isFull && 'text-warning-600',
        !isNearFull && 'text-gray-700'
      )}>
        {current}{max ? ` / ${max}` : ''}
      </span>
      
      {!compact && max && max > 0 && (
        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full transition-all duration-300 rounded-full',
              isFull && 'bg-error-500',
              isNearFull && !isFull && 'bg-warning-500',
              !isNearFull && 'bg-success-500'
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
})

ClassCapacityIndicator.displayName = 'ClassCapacityIndicator'

/**
 * ClassCard - 클래스 카드 뷰 컴포넌트
 * 
 * 특징:
 * - 시각적으로 매력적인 카드 레이아웃
 * - 클래스 색상 표시
 * - 용량 상태 시각화
 * - 액션 버튼 지원
 * - 선택 가능 옵션
 * - 컴팩트 모드 지원
 * - 완전한 접근성
 * 
 * @example
 * ```tsx
 * <ClassCard
 *   classData={classInfo}
 *   onClick={handleCardClick}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   showActions={true}
 *   showSelection={true}
 * />
 * ```
 */
export const ClassCard = memo<ClassCardProps>(({
  classData,
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
    // 선택 모드일 때는 이미 GroupedClassView에서 올바른 onClick이 전달됨
    onClick?.(classData)
  }, [onClick, classData])

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(classData)
  }, [onEdit, classData])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(classData)
  }, [onDelete, classData])

  const handleView = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onView?.(classData)
  }, [onView, classData])

  const handleSelect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.(classData.id, !isSelected)
  }, [onSelect, classData.id, isSelected])

  // 카드 스타일
  const cardStyles = cn(
    // 기본 스타일
    'relative bg-white border rounded-xl shadow-card transition-all duration-200 cursor-pointer',
    // 호버 효과
    'hover:shadow-card-hover hover:-translate-y-0.5',
    // 선택 상태
    isSelected && 'ring-2 ring-brand-500 border-brand-300',
    // 비활성 상태
    !classData.is_active && 'opacity-75',
    // 컴팩트 모드
    compact ? 'p-3' : 'p-4',
    className
  )

  return (
    <div className={cardStyles} onClick={handleCardClick}>
      {/* 선택 체크박스 */}
      {showSelection && (
        <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => handleSelect(e as any)}
            className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
            aria-label={`${classData.name} 클래스 선택`}
          />
        </div>
      )}

      {/* 상태 배지 */}
      <div className={cn(
        'absolute z-10',
        compact ? 'top-2 right-2' : 'top-3 right-3'
      )}>
        <ClassStatusBadge 
          isActive={classData.is_active ?? false} 
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
        {/* 색상 인디케이터 */}
        {classData.color && (
          <div 
            className={cn(
              'rounded-full flex-shrink-0 mt-1',
              compact ? 'w-3 h-3' : 'w-4 h-4'
            )}
            style={{ backgroundColor: classData.color }}
          />
        )}

        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'font-semibold text-gray-900 truncate',
            compact ? 'text-sm' : 'text-lg'
          )}>
            {classData.name}
          </h3>
          
          {!compact && classData.description && (
            <p className="text-sm text-gray-500 truncate mt-1">
              {classData.description}
            </p>
          )}
        </div>
      </div>

      {/* 클래스 정보 */}
      <div className={cn(
        'grid gap-2',
        compact ? 'grid-cols-1' : 'grid-cols-2',
        // 체크박스가 있을 때 왼쪽 여백 추가
        showSelection && 'pl-8'
      )}>
        {/* 학년/과정 */}
        {(classData.grade || classData.course) && (
          <div className={cn(
            'flex items-center text-gray-600',
            compact ? 'text-xs' : 'text-sm'
          )}>
            <BookOpenIcon className={cn(
              'mr-1 flex-shrink-0',
              compact ? 'w-3 h-3' : 'w-4 h-4'
            )} />
            <span className="truncate">
              {[classData.grade, classData.course].filter(Boolean).join(' • ')}
            </span>
          </div>
        )}

        {/* 강사 */}
        {classData.instructor && (
          <div className={cn(
            'flex items-center text-gray-600',
            compact ? 'text-xs' : 'text-sm'
          )}>
            <UserIcon className={cn(
              'mr-1 flex-shrink-0',
              compact ? 'w-3 h-3' : 'w-4 h-4'
            )} />
            <span className="truncate">
              {classData.instructor.name}
            </span>
          </div>
        )}


        {/* 교재 정보 */}
        {((classData as any).main_textbook || (classData as any).supplementary_textbook) && (
          <div className={cn(
            'text-gray-600',
            compact ? 'text-xs' : 'text-sm'
          )}>
            {(classData as any).main_textbook && (
              <div className="flex items-center mb-1">
                <BookOpenIcon className={cn(
                  'mr-1 flex-shrink-0',
                  compact ? 'w-3 h-3' : 'w-4 h-4'
                )} />
                <span className="truncate">
                  📚 {(classData as any).main_textbook}
                </span>
              </div>
            )}
            {(classData as any).supplementary_textbook && (
              <div className="flex items-center">
                <BookOpenIcon className={cn(
                  'mr-1 flex-shrink-0',
                  compact ? 'w-3 h-3' : 'w-4 h-4'
                )} />
                <span className="truncate">
                  📖 {(classData as any).supplementary_textbook}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 생성일 */}
        {!compact && classData.created_at && (
          <div className="flex items-center text-gray-500 text-xs">
            <CalendarIcon className="w-3 h-3 mr-1 flex-shrink-0" />
            <span>
              {new Date(classData.created_at).toLocaleDateString('ko-KR')}
            </span>
          </div>
        )}
      </div>

      {/* 학생 수 표시 */}
      <div className={cn(
        'border-t pt-3',
        compact ? 'mt-2' : 'mt-3',
        // 체크박스가 있을 때 왼쪽 여백 추가
        showSelection && 'pl-8'
      )}>
        <ClassCapacityIndicator
          current={classData.student_count || 0}
          max={classData.max_students ?? undefined}
          compact={compact}
        />
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
              aria-label={`${classData.name} 클래스 상세보기`}
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
              aria-label={`${classData.name} 클래스 수정`}
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
              aria-label={`${classData.name} 클래스 삭제`}
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
})

ClassCard.displayName = 'ClassCard'