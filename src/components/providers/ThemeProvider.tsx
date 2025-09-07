'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)

  // 클라이언트에서만 테마 시스템 활성화
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // 서버사이드에서는 기본 테마로 렌더링
    return <div suppressHydrationWarning>{children}</div>
  }

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"  // 명시적 기본값: 라이트 모드
      enableSystem={false}  // 시스템 다크모드 자동 감지 비활성화
      disableTransitionOnChange
      storageKey="educanvas-theme"
      themes={['light', 'dark']}  // 허용되는 테마 명시
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}