'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { useFocusManagement } from '@/hooks/useAccessibility'

/**
 * 포커스 트랩 컴포넌트 Props
 */
interface FocusTrapProps {
  /** 포커스 트랩 활성화 여부 */
  isActive: boolean
  /** 자식 요소 */
  children: React.ReactNode
  /** 포커스 복원 여부 */
  restoreFocus?: boolean
  /** 초기 포커스 요소 선택자 */
  initialFocus?: string
  /** 트랩 해제 시 콜백 */
  onEscape?: () => void
  /** 추가 CSS 클래스 */
  className?: string
}

/**
 * 모달, 드롭다운 등에서 포커스를 가두는 컴포넌트
 * 키보드 내비게이션 시 포커스가 컨테이너를 벗어나지 않도록 함
 */
export const FocusTrap: React.FC<FocusTrapProps> = ({
  isActive,
  children,
  restoreFocus = true,
  initialFocus,
  onEscape,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const { trapFocus, restoreFocus: restorePreviousFocus } = useFocusManagement()

  // 포커스 트랩 설정
  useEffect(() => {
    if (!isActive || !containerRef.current) return

    // 현재 포커스된 요소 저장
    previousFocusRef.current = document.activeElement as HTMLElement

    // 포커스 트랩 활성화
    const cleanup = trapFocus(containerRef.current)

    // 초기 포커스 설정
    if (initialFocus) {
      const initialElement = containerRef.current.querySelector(initialFocus) as HTMLElement
      if (initialElement) {
        initialElement.focus()
      }
    }

    return cleanup
  }, [isActive, initialFocus, trapFocus])

  // 컴포넌트 언마운트 시 포커스 복원
  useEffect(() => {
    return () => {
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [restoreFocus])

  // ESC 키 처리
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onEscape?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isActive, onEscape])

  if (!isActive) return <>{children}</>

  return (
    <div
      ref={containerRef}
      className={className}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  )
}

/**
 * 포커스 가시성 향상 컴포넌트 Props
 */
interface FocusVisibleProps {
  /** 자식 요소 */
  children: React.ReactNode
  /** 포커스 스타일 클래스 */
  focusClass?: string
  /** 키보드 포커스만 표시할지 여부 */
  keyboardOnly?: boolean
}

/**
 * 포커스 상태를 시각적으로 명확하게 표시하는 컴포넌트
 */
export const FocusVisible: React.FC<FocusVisibleProps> = ({
  children,
  focusClass = 'ring-2 ring-blue-500 ring-offset-2',
  keyboardOnly = true
}) => {
  const [isKeyboardFocus, setIsKeyboardFocus] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)

  // 키보드 사용 감지
  useEffect(() => {
    let isUsingKeyboard = false

    const handleKeyDown = () => {
      isUsingKeyboard = true
    }

    const handleMouseDown = () => {
      isUsingKeyboard = false
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  const handleFocus = () => {
    setIsFocused(true)
    if (!keyboardOnly) {
      setIsKeyboardFocus(true)
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    setIsKeyboardFocus(false)
  }

  const shouldShowFocus = keyboardOnly ? isKeyboardFocus : isFocused

  return (
    <div
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={shouldShowFocus ? focusClass : ''}
    >
      {children}
    </div>
  )
}

/**
 * 로빙 포커스 관리 컴포넌트 Props
 */
interface RovingTabIndexProps {
  /** 활성화된 아이템 인덱스 */
  activeIndex: number
  /** 아이템 변경 콜백 */
  onActiveIndexChange: (index: number) => void
  /** 방향 (수평/수직) */
  orientation?: 'horizontal' | 'vertical'
  /** 루프 네비게이션 허용 */
  loop?: boolean
  /** 자식 요소 */
  children: React.ReactNode
}

/**
 * 그리드나 리스트에서 방향키로 포커스를 이동하는 컴포넌트
 * 탭으로는 그룹에만 접근하고, 방향키로 내부 아이템을 탐색
 */
export const RovingTabIndex: React.FC<RovingTabIndexProps> = ({
  activeIndex,
  onActiveIndexChange,
  orientation = 'vertical',
  loop = true,
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const childElements = containerRef.current?.children
    if (!childElements) return

    const { key } = event
    const isHorizontal = orientation === 'horizontal'
    const count = childElements.length

    let newIndex = activeIndex

    switch (key) {
      case 'ArrowDown':
        if (!isHorizontal) {
          event.preventDefault()
          newIndex = activeIndex + 1
        }
        break
      case 'ArrowUp':
        if (!isHorizontal) {
          event.preventDefault()
          newIndex = activeIndex - 1
        }
        break
      case 'ArrowRight':
        if (isHorizontal) {
          event.preventDefault()
          newIndex = activeIndex + 1
        }
        break
      case 'ArrowLeft':
        if (isHorizontal) {
          event.preventDefault()
          newIndex = activeIndex - 1
        }
        break
      case 'Home':
        event.preventDefault()
        newIndex = 0
        break
      case 'End':
        event.preventDefault()
        newIndex = count - 1
        break
      default:
        return
    }

    // 범위 조정
    if (loop) {
      if (newIndex < 0) newIndex = count - 1
      if (newIndex >= count) newIndex = 0
    } else {
      if (newIndex < 0) newIndex = 0
      if (newIndex >= count) newIndex = count - 1
    }

    if (newIndex !== activeIndex) {
      onActiveIndexChange(newIndex)
      
      // 새로운 요소에 포커스
      const newElement = childElements[newIndex] as HTMLElement
      if (newElement) {
        newElement.focus()
      }
    }
  }, [activeIndex, onActiveIndexChange, orientation, loop])

  return (
    <div
      ref={containerRef}
      role={orientation === 'horizontal' ? 'tablist' : 'listbox'}
      aria-orientation={orientation}
      onKeyDown={handleKeyDown}
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            tabIndex: index === activeIndex ? 0 : -1,
            'aria-selected': index === activeIndex,
            role: orientation === 'horizontal' ? 'tab' : 'option'
          })
        }
        return child
      })}
    </div>
  )
}

/**
 * 자동 포커스 컴포넌트 Props
 */
interface AutoFocusProps {
  /** 자동 포커스 활성화 여부 */
  enabled?: boolean
  /** 지연 시간 (ms) */
  delay?: number
  /** 선택자 (지정하지 않으면 첫 번째 포커스 가능한 요소) */
  selector?: string
  /** 자식 요소 */
  children: React.ReactNode
}

/**
 * 마운트 시 자동으로 포커스를 설정하는 컴포넌트
 */
export const AutoFocus: React.FC<AutoFocusProps> = ({
  enabled = true,
  delay = 0,
  selector,
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled) return

    const focusElement = () => {
      if (!containerRef.current) return

      let targetElement: HTMLElement | null = null

      if (selector) {
        targetElement = containerRef.current.querySelector(selector)
      } else {
        // 첫 번째 포커스 가능한 요소 찾기
        const focusableElements = containerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        targetElement = focusableElements[0] as HTMLElement
      }

      if (targetElement) {
        targetElement.focus()
      }
    }

    if (delay > 0) {
      const timer = setTimeout(focusElement, delay)
      return () => clearTimeout(timer)
    } else {
      focusElement()
    }
  }, [enabled, delay, selector])

  return (
    <div ref={containerRef}>
      {children}
    </div>
  )
}