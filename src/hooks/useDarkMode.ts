'use client'

import { useState, useEffect } from 'react'

/**
 * 다크모드 상태를 감지하는 커스텀 훅
 * Tailwind CSS의 dark: 클래스와 연동됨
 */
export function useDarkMode() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // 초기 다크모드 상태 확인
    const checkDarkMode = () => {
      // HTML 요소에 'dark' 클래스가 있는지 확인 (Tailwind 방식)
      const htmlElement = document.documentElement
      const hasDarkClass = htmlElement.classList.contains('dark')
      
      // 시스템 설정 확인 (fallback)
      const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      
      // dark 클래스가 우선, 없으면 시스템 설정 사용
      const currentIsDark = hasDarkClass || (!htmlElement.classList.contains('light') && systemPrefersDark)
      
      setIsDark(currentIsDark)
    }

    // 초기 체크
    checkDarkMode()

    // HTML 클래스 변경 감지 (MutationObserver)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkDarkMode()
        }
      })
    })

    // HTML 요소 감시 시작
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    // 시스템 다크모드 변경 감지
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemChange = () => checkDarkMode()
    
    // addEventListener가 있는 경우 사용 (최신 브라우저)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange)
    } else {
      // 호환성을 위한 fallback
      mediaQuery.addListener(handleSystemChange)
    }

    // 클린업
    return () => {
      observer.disconnect()
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemChange)
      } else {
        mediaQuery.removeListener(handleSystemChange)
      }
    }
  }, [])

  return isDark
}

export default useDarkMode