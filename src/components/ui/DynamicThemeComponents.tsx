/**
 * 동적 임포트를 사용한 테마 컴포넌트들
 * SSR 환경에서 안전하게 로드되는 클라이언트 전용 컴포넌트들
 * @version 1.0
 * @date 2025-01-11
 */

'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// 로딩 컴포넌트
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8 bg-bg-200 rounded-lg border border-bg-300">
    <div className="text-text-200">테마 컴포넌트 로딩 중...</div>
  </div>
);

// 동적 임포트 - SSR 비활성화
export const DynamicUnifiedThemeSwitcher = dynamic(
  () => import('./UnifiedThemeSwitcher').then(mod => ({ default: mod.UnifiedThemeSwitcher })),
  {
    ssr: false,
    loading: LoadingFallback,
  }
);

export const DynamicBackgroundCustomizer = dynamic(
  () => import('./BackgroundCustomizer').then(mod => ({ default: mod.BackgroundCustomizer })),
  {
    ssr: false,
    loading: LoadingFallback,
  }
);

// 테마 검증 컴포넌트
export const DynamicThemeValidator = dynamic(
  () => import('./ThemeValidator').then(mod => ({ default: mod.ThemeValidator })),
  {
    ssr: false,
    loading: LoadingFallback,
  }
);

// 컴포넌트 래퍼 (Suspense 포함)
interface DynamicThemeComponentProps {
  children: React.ReactNode;
}

export function DynamicThemeWrapper({ children }: DynamicThemeComponentProps) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      {children}
    </Suspense>
  );
}