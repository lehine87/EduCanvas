"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <>
      {/* EduCanvas 브랜드 색상을 위한 CSS 변수 정의 */}
      <style jsx global>{`
        /* Sonner richColors를 위한 정확한 브랜드 색상 변수 정의 */
        :root {
          --success: 74 222 128;  /* #4ade80 -> success-500 */
          --info: 96 165 250;     /* #60a5fa -> info-500 */
          --warning: 251 191 36;  /* #fbbf24 -> warning-500 */
          --error: 248 113 113;   /* #f87171 -> error-500 */
        }
        
        /* 기본 토스트(브랜드)를 위한 추가 스타일 */
        [data-sonner-toaster] [data-sonner-toast]:not([data-type]) {
          background-color: var(--color-educanvas-500) !important;
          color: var(--color-neutral-50) !important;
          border-color: var(--color-educanvas-600) !important;
        }
        
        /* 다크모드에서 모든 토스트 팝업 색상 반전 */
        .dark [data-sonner-toaster] [data-sonner-toast][data-type="success"] {
          background-color: var(--color-success-400) !important;
          color: var(--color-success-900) !important;
          border-color: var(--color-success-300) !important;
        }
        
        .dark [data-sonner-toaster] [data-sonner-toast][data-type="error"] {
          background-color: var(--color-error-400) !important;
          color: var(--color-error-900) !important;
          border-color: var(--color-error-300) !important;
        }
        
        .dark [data-sonner-toaster] [data-sonner-toast][data-type="info"] {
          background-color: var(--color-info-400) !important;
          color: var(--color-info-900) !important;
          border-color: var(--color-info-300) !important;
        }
        
        .dark [data-sonner-toaster] [data-sonner-toast][data-type="warning"] {
          background-color: var(--color-warning-400) !important;
          color: var(--color-warning-900) !important;
          border-color: var(--color-warning-300) !important;
        }
        
        /* 다크모드에서 기본 토스트 (브랜드) */
        .dark [data-sonner-toaster] [data-sonner-toast]:not([data-type]) {
          background-color: var(--color-educanvas-400) !important;
          color: var(--color-educanvas-900) !important;
          border-color: var(--color-educanvas-300) !important;
        }
        
        /* 테스트 페이지의 토스트 버튼 스타일 수정 - 커스텀 클래스 기반 */
        /* 성공 토스트 버튼 */
        .success-toast-btn {
          background-color: var(--color-success-500) !important;
          color: var(--color-neutral-50) !important;
        }
        .dark .success-toast-btn {
          background-color: var(--color-success-400) !important;
          color: var(--color-success-900) !important;
        }
        
        /* 에러 토스트 버튼 */
        .error-toast-btn {
          background-color: var(--color-error-500) !important;
          color: var(--color-neutral-50) !important;
        }
        .dark .error-toast-btn {
          background-color: var(--color-error-400) !important;
          color: var(--color-error-900) !important;
        }
        
        /* 정보 토스트 버튼 */
        .info-toast-btn {
          background-color: var(--color-info-500) !important;
          color: var(--color-neutral-50) !important;
        }
        .dark .info-toast-btn {
          background-color: var(--color-info-400) !important;
          color: var(--color-info-900) !important;
        }
        
        /* 브랜드 토스트 버튼 */
        .brand-toast-btn {
          background-color: var(--color-educanvas-500) !important;
          color: var(--color-neutral-50) !important;
        }
        .dark .brand-toast-btn {
          background-color: var(--color-educanvas-400) !important;
          color: var(--color-educanvas-900) !important;
        }
      `}</style>
      
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className="toaster group"
        richColors
        toastOptions={{}}
        {...props}
      />
    </>
  )
}

export { Toaster }
