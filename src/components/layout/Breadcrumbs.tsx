'use client'

import Link from 'next/link'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import type { BreadcrumbItem } from './types'

/**
 * 브레드크럼 Props
 */
interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  separator?: 'chevron' | 'slash' | 'dot'
  showHome?: boolean
  homeHref?: string
  className?: string
}

/**
 * 브레드크럼 네비게이션 컴포넌트
 * @description 현재 페이지의 경로를 표시하는 네비게이션
 */
export function Breadcrumbs({ 
  items, 
  separator = 'chevron',
  showHome = true,
  homeHref = '/admin',
  className
}: BreadcrumbsProps) {
  // 홈 아이템 추가
  const breadcrumbItems: BreadcrumbItem[] = showHome 
    ? [{ label: '홈', href: homeHref, icon: HomeIcon }, ...items]
    : items

  // 구분자 렌더링
  const renderSeparator = () => {
    switch (separator) {
      case 'slash':
        return <span className="mx-2 text-gray-400">/</span>
      case 'dot':
        return <span className="mx-2 text-gray-400">·</span>
      case 'chevron':
      default:
        return <ChevronRightIcon className="mx-2 h-4 w-4 text-gray-400" />
    }
  }

  if (breadcrumbItems.length === 0) return null

  return (
    <nav 
      className={cn(
        'bg-white border-b border-gray-200 px-4 py-2 sm:px-6',
        className
      )}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1 text-sm">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1
          const Icon = item.icon

          return (
            <li key={index} className="flex items-center">
              {index > 0 && renderSeparator()}
              
              <div className={cn(
                'flex items-center',
                isLast ? 'font-medium text-gray-900' : ''
              )}>
                {Icon && (
                  <Icon className={cn(
                    'mr-1.5 h-4 w-4',
                    isLast ? 'text-gray-700' : 'text-gray-400'
                  )} />
                )}
                
                {item.current || isLast ? (
                  <span 
                    className={cn(
                      'text-gray-900',
                      item.current && 'font-medium'
                    )}
                    aria-current={item.current ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                ) : item.href ? (
                  <Link
                    href={item.href}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-gray-600">
                    {item.label}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * 동적 브레드크럼 생성 유틸리티
 */
export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  // 경로별 라벨 매핑
  const labelMap: Record<string, string> = {
    admin: '관리자',
    students: '학생 관리',
    new: '새 학생 등록',
    edit: '편집',
    instructors: '강사 관리',
    classes: '클래스 관리',
    payments: '결제 관리',
    attendance: '출결 관리',
    schedule: '일정 관리',
    analytics: '분석 및 리포트',
    settings: '설정',
    profile: '프로필',
    'system-admin': '시스템 관리',
    'tenant-admin': '테넌트 관리',
    instructor: '강사',
    staff: '스태프'
  }

  let currentPath = ''
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const label = labelMap[segment] || segment
    const isLast = index === segments.length - 1

    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
      current: isLast
    })
  })

  return breadcrumbs
}

/**
 * 모바일용 간소화 브레드크럼
 */
export function MobileBreadcrumbs({ 
  items,
  homeHref = '/admin'
}: Pick<BreadcrumbsProps, 'items' | 'homeHref'>) {
  if (items.length === 0) return null

  const lastItem = items[items.length - 1]
  const previousItem = items.length > 1 ? items[items.length - 2] : null

  if (!lastItem) return null

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2 lg:hidden">
      <div className="flex items-center justify-between">
        <Link
          href={previousItem?.href || homeHref}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronRightIcon className="mr-1 h-4 w-4 rotate-180" />
          {previousItem?.label || '홈'}
        </Link>
        
        <span className="text-sm font-medium text-gray-900">
          {lastItem.label}
        </span>
      </div>
    </nav>
  )
}