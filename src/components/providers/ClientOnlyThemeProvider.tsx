/**
 * SSR 호환 클라이언트 전용 테마 프로바이더
 * 업계 표준: dynamic import + NoSSR 패턴
 * @version 1.0
 * @date 2025-01-11
 */

'use client';

import { useEffect, useState } from 'react';
import { EnhancedThemeProvider } from '@/providers/EnhancedThemeProvider';

interface ClientOnlyThemeProviderProps {
  children: React.ReactNode;
}

/**
 * SSR 중에는 렌더링하지 않고, 클라이언트에서만 테마 프로바이더를 활성화
 * 업계 표준 NoSSR 패턴 구현
 */
export function ClientOnlyThemeProvider({ children }: ClientOnlyThemeProviderProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // SSR 중에는 기본 children만 렌더링
  if (!hasMounted) {
    return <>{children}</>;
  }

  // 클라이언트에서만 테마 프로바이더 활성화
  return (
    <EnhancedThemeProvider>
      {children}
    </EnhancedThemeProvider>
  );
}