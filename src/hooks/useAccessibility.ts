import { useEffect, useRef, useCallback, useState } from 'react'

/**
 * 키보드 내비게이션을 위한 Hook
 */
export function useKeyboardNavigation<T extends HTMLElement = HTMLElement>(
  items: Array<{ id: string }>,
  options: {
    /** 현재 선택된 아이템 인덱스 */
    initialIndex?: number
    /** 아이템 선택 시 콜백 */
    onSelect?: (index: number, item: { id: string }) => void
    /** 아이템 활성화 시 콜백 (Enter/Space) */
    onActivate?: (index: number, item: { id: string }) => void
    /** 루프 내비게이션 허용 여부 */
    loop?: boolean
    /** 방향키 외 추가 키 바인딩 */
    customKeys?: Record<string, (index: number) => void>
  } = {}
) {
  const {
    initialIndex = -1,
    onSelect,
    onActivate,
    loop = true,
    customKeys = {}
  } = options

  const [focusedIndex, setFocusedIndex] = useState(initialIndex)
  const containerRef = useRef<T>(null)
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map())

  // 아이템 등록
  const registerItem = useCallback((id: string, element: HTMLElement | null) => {
    if (element) {
      itemRefs.current.set(id, element)
    } else {
      itemRefs.current.delete(id)
    }
  }, [])

  // 포커스 이동
  const moveFocus = useCallback((direction: 'up' | 'down' | 'first' | 'last' | number) => {
    if (items.length === 0) return

    let newIndex: number

    if (typeof direction === 'number') {
      newIndex = direction
    } else {
      switch (direction) {
        case 'up':
          newIndex = focusedIndex <= 0 
            ? (loop ? items.length - 1 : 0)
            : focusedIndex - 1
          break
        case 'down':
          newIndex = focusedIndex >= items.length - 1
            ? (loop ? 0 : items.length - 1)
            : focusedIndex + 1
          break
        case 'first':
          newIndex = 0
          break
        case 'last':
          newIndex = items.length - 1
          break
        default:
          return
      }
    }

    // 인덱스 범위 검증
    if (newIndex < 0 || newIndex >= items.length) return

    setFocusedIndex(newIndex)
    
    // 실제 DOM 요소에 포커스
    const targetItem = items[newIndex]
    if (!targetItem) return
    
    const element = itemRefs.current.get(targetItem.id)
    if (element) {
      element.focus()
      // 스크린 리더를 위한 스크롤 처리
      element.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }

    onSelect?.(newIndex, targetItem)
  }, [focusedIndex, items, loop, onSelect])

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (items.length === 0) return

    const { key, ctrlKey, metaKey } = event

    // 커스텀 키 바인딩 확인
    if (customKeys[key]) {
      event.preventDefault()
      customKeys[key](focusedIndex)
      return
    }

    switch (key) {
      case 'ArrowUp':
        event.preventDefault()
        moveFocus('up')
        break
      case 'ArrowDown':
        event.preventDefault()
        moveFocus('down')
        break
      case 'Home':
        if (ctrlKey || metaKey) {
          event.preventDefault()
          moveFocus('first')
        }
        break
      case 'End':
        if (ctrlKey || metaKey) {
          event.preventDefault()
          moveFocus('last')
        }
        break
      case 'Enter':
      case ' ':
        if (focusedIndex >= 0 && focusedIndex < items.length) {
          event.preventDefault()
          const targetItem = items[focusedIndex]
          if (targetItem) {
            onActivate?.(focusedIndex, targetItem)
          }
        }
        break
      case 'Escape':
        event.preventDefault()
        setFocusedIndex(-1)
        containerRef.current?.focus()
        break
    }
  }, [items, focusedIndex, moveFocus, onActivate, customKeys])

  // 이벤트 리스너 등록
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return {
    containerRef,
    focusedIndex,
    registerItem,
    moveFocus,
    setFocusedIndex
  }
}

/**
 * 스크린 리더 지원을 위한 Hook
 */
export function useScreenReaderSupport() {
  const [announcements, setAnnouncements] = useState<string[]>([])
  const announcementRef = useRef<HTMLDivElement>(null)

  // 스크린 리더에 메시지 알림
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // 중복 메시지 방지
    setAnnouncements(prev => {
      const newAnnouncements = [message, ...prev.slice(0, 4)] // 최대 5개까지만 유지
      return newAnnouncements
    })

    // aria-live 영역 업데이트
    if (announcementRef.current) {
      announcementRef.current.setAttribute('aria-live', priority)
      announcementRef.current.textContent = message
      
      // 일정 시간 후 메시지 제거
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = ''
        }
      }, 1000)
    }
  }, [])

  // 로딩 상태 알림
  const announceLoading = useCallback((isLoading: boolean, context: string = '') => {
    if (isLoading) {
      announce(`${context} 로딩 중입니다.`, 'polite')
    } else {
      announce(`${context} 로딩이 완료되었습니다.`, 'polite')
    }
  }, [announce])

  // 에러 상태 알림
  const announceError = useCallback((error: string) => {
    announce(`오류가 발생했습니다: ${error}`, 'assertive')
  }, [announce])

  // 성공 상태 알림
  const announceSuccess = useCallback((message: string) => {
    announce(`성공: ${message}`, 'polite')
  }, [announce])

  return {
    announce,
    announceLoading,
    announceError,
    announceSuccess,
    announcements,
    announcementRef
  }
}

/**
 * 색상 대비 검증을 위한 Hook
 */
export function useColorContrast() {
  // 색상 대비 계산 (WCAG 기준)
  const calculateContrast = useCallback((foreground: string, background: string): number => {
    // 간단한 색상 대비 계산 (실제로는 더 복잡한 알고리즘 필요)
    // 여기서는 기본적인 구현만 제공
    const getLuminance = (color: string): number => {
      // RGB 값 추출 (간단한 hex 색상 처리)
      const hex = color.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16) / 255
      const g = parseInt(hex.substr(2, 2), 16) / 255
      const b = parseInt(hex.substr(4, 2), 16) / 255

      // 상대 휘도 계산 (간소화된 버전)
      const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
    }

    const l1 = getLuminance(foreground)
    const l2 = getLuminance(background)
    const lightest = Math.max(l1, l2)
    const darkest = Math.min(l1, l2)

    return (lightest + 0.05) / (darkest + 0.05)
  }, [])

  // WCAG AA 준수 여부 확인
  const isWCAGAA = useCallback((foreground: string, background: string, isLargeText = false): boolean => {
    const contrast = calculateContrast(foreground, background)
    return isLargeText ? contrast >= 3 : contrast >= 4.5
  }, [calculateContrast])

  // WCAG AAA 준수 여부 확인
  const isWCAGAAA = useCallback((foreground: string, background: string, isLargeText = false): boolean => {
    const contrast = calculateContrast(foreground, background)
    return isLargeText ? contrast >= 4.5 : contrast >= 7
  }, [calculateContrast])

  return {
    calculateContrast,
    isWCAGAA,
    isWCAGAAA
  }
}

/**
 * 포커스 관리를 위한 Hook
 */
export function useFocusManagement() {
  const focusHistoryRef = useRef<HTMLElement[]>([])

  // 포커스 기록
  const recordFocus = useCallback((element: HTMLElement) => {
    focusHistoryRef.current.push(element)
    // 최대 10개까지만 기록
    if (focusHistoryRef.current.length > 10) {
      focusHistoryRef.current.shift()
    }
  }, [])

  // 이전 포커스로 복귀
  const restoreFocus = useCallback(() => {
    const lastFocused = focusHistoryRef.current.pop()
    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus()
      return true
    }
    return false
  }, [])

  // 포커스 트랩 (모달 등에서 사용)
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return {
    recordFocus,
    restoreFocus,
    trapFocus
  }
}

/**
 * ARIA 속성 관리를 위한 Hook
 */
export function useARIAAttributes() {
  // 동적 ARIA 라벨 생성
  const generateAriaLabel = useCallback((
    baseLabel: string,
    context: Record<string, any> = {}
  ): string => {
    let label = baseLabel

    // 상태 정보 추가
    if (context.isSelected) label += ', 선택됨'
    if (context.isExpanded !== undefined) {
      label += context.isExpanded ? ', 펼쳐짐' : ', 접혀짐'
    }
    if (context.isDisabled) label += ', 비활성화됨'
    if (context.hasError) label += ', 오류 있음'
    if (context.isRequired) label += ', 필수 항목'

    // 위치 정보 추가
    if (context.position && context.total) {
      label += `, ${context.position}번째 항목, 총 ${context.total}개 중`
    }

    return label
  }, [])

  // 복합 ARIA 속성 생성
  const generateARIAProps = useCallback((
    config: {
      label?: string
      describedBy?: string[]
      expanded?: boolean
      selected?: boolean
      disabled?: boolean
      required?: boolean
      invalid?: boolean
      controls?: string
      owns?: string
      level?: number
      setSize?: number
      posInSet?: number
    }
  ) => {
    const props: Record<string, any> = {}

    if (config.label) props['aria-label'] = config.label
    if (config.describedBy?.length) props['aria-describedby'] = config.describedBy.join(' ')
    if (config.expanded !== undefined) props['aria-expanded'] = config.expanded
    if (config.selected !== undefined) props['aria-selected'] = config.selected
    if (config.disabled) props['aria-disabled'] = true
    if (config.required) props['aria-required'] = true
    if (config.invalid) props['aria-invalid'] = true
    if (config.controls) props['aria-controls'] = config.controls
    if (config.owns) props['aria-owns'] = config.owns
    if (config.level) props['aria-level'] = config.level
    if (config.setSize) props['aria-setsize'] = config.setSize
    if (config.posInSet) props['aria-posinset'] = config.posInSet

    return props
  }, [])

  return {
    generateAriaLabel,
    generateARIAProps
  }
}