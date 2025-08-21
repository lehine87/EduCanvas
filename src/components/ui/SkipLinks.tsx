'use client'

import React from 'react'
import { cn } from '@/lib/utils'

/**
 * 스킵 링크 아이템 타입
 */
interface SkipLinkItem {
  /** 링크 대상 요소의 ID */
  target: string
  /** 링크 텍스트 */
  label: string
  /** 접근키 (선택사항) */
  accessKey?: string
}

/**
 * SkipLinks 컴포넌트 Props
 */
interface SkipLinksProps {
  /** 스킵 링크 목록 */
  links?: SkipLinkItem[]
  /** 추가 CSS 클래스 */
  className?: string
}

/**
 * 기본 스킵 링크 목록
 */
const defaultSkipLinks: SkipLinkItem[] = [
  {
    target: 'main-content',
    label: '주요 내용으로 바로가기',
    accessKey: '1'
  },
  {
    target: 'main-navigation',
    label: '주메뉴로 바로가기',
    accessKey: '2'
  },
  {
    target: 'search',
    label: '검색으로 바로가기',
    accessKey: '3'
  },
  {
    target: 'footer',
    label: '푸터로 바로가기',
    accessKey: '4'
  }
]

/**
 * 웹 접근성을 위한 스킵 링크 컴포넌트
 * 키보드 사용자가 주요 콘텐츠로 빠르게 이동할 수 있도록 지원
 * 
 * @example
 * ```tsx
 * // 기본 사용
 * <SkipLinks />
 * 
 * // 커스텀 링크 사용
 * <SkipLinks
 *   links={[
 *     { target: 'content', label: '내용으로 이동' },
 *     { target: 'sidebar', label: '사이드바로 이동' }
 *   ]}
 * />
 * ```
 */
export const SkipLinks: React.FC<SkipLinksProps> = ({
  links = defaultSkipLinks,
  className
}) => {
  const handleSkipClick = (target: string) => {
    const element = document.getElementById(target)
    if (element) {
      // 포커스 이동
      element.focus()
      // 스크롤 이동
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      
      // 시각적 포커스가 없는 요소의 경우 tabindex 추가
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '-1')
        // 포커스 해제 시 tabindex 제거
        element.addEventListener('blur', () => {
          element.removeAttribute('tabindex')
        }, { once: true })
      }
    }
  }

  return (
    <nav
      className={cn(
        'skip-links',
        'fixed top-0 left-0 z-[9999]',
        'bg-white border border-gray-300 rounded-br-lg shadow-lg',
        'transform -translate-y-full',
        'focus-within:translate-y-0',
        'transition-transform duration-200',
        className
      )}
      aria-label="스킵 링크"
      role="navigation"
    >
      <ul className="list-none m-0 p-2 space-y-1">
        {links.map((link, index) => (
          <li key={`${link.target}-${index}`}>
            <a
              href={`#${link.target}`}
              onClick={(e) => {
                e.preventDefault()
                handleSkipClick(link.target)
              }}
              accessKey={link.accessKey}
              className={cn(
                'block px-4 py-2 text-sm font-medium text-blue-600',
                'bg-blue-50 rounded border border-blue-200',
                'hover:bg-blue-100 hover:text-blue-800',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'transition-colors duration-150',
                'no-underline'
              )}
              title={link.accessKey ? `접근키: Alt + ${link.accessKey}` : undefined}
            >
              {link.label}
              {link.accessKey && (
                <span className="text-xs text-blue-500 ml-2">
                  (Alt+{link.accessKey})
                </span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/**
 * 랜드마크 영역을 위한 스킵 타겟 컴포넌트
 */
interface SkipTargetProps {
  /** 타겟 ID */
  id: string
  /** 자식 요소 */
  children: React.ReactNode
  /** HTML 태그 타입 */
  as?: React.ElementType
  /** 추가 props */
  [key: string]: any
}

export const SkipTarget: React.FC<SkipTargetProps> = ({
  id,
  children,
  as: Component = 'div',
  ...props
}) => {
  return (
    <Component
      id={id}
      {...props}
    >
      {children}
    </Component>
  )
}

/**
 * 메인 콘텐츠 래퍼 컴포넌트
 */
interface MainContentProps {
  children: React.ReactNode
  className?: string
  [key: string]: any
}

export const MainContent: React.FC<MainContentProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <SkipTarget
      id="main-content"
      as="main"
      role="main"
      className={cn('focus:outline-none', className)}
      tabIndex={-1}
      {...props}
    >
      {children}
    </SkipTarget>
  )
}

/**
 * 사이드바 네비게이션 래퍼 컴포넌트
 */
interface SidebarNavProps {
  children: React.ReactNode
  className?: string
  [key: string]: any
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <SkipTarget
      id="main-navigation"
      as="nav"
      role="navigation"
      aria-label="주메뉴"
      className={cn('focus:outline-none', className)}
      tabIndex={-1}
      {...props}
    >
      {children}
    </SkipTarget>
  )
}