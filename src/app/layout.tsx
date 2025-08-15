import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { Toaster } from "react-hot-toast";
import { toastConfig } from "@/lib/toast/toastConfig";

// 개발 환경에서만 Debug Interface 초기화 (런타임에서만 실행)
const initDevTools = () => {
  if (process.env.NODE_ENV === 'development') {
    // Dynamic import로 개발 도구 로드
    import('@/dev-tools/init').catch(() => {
      // 개발 도구 로드 실패는 무시
    })
  }
}

// 글로벌 에러 핸들러 초기화
const initErrorHandling = () => {
  // Dynamic import로 글로벌 에러 핸들러 로드
  import('@/lib/errors/globalErrorHandler').then(({ initGlobalErrorHandler }) => {
    initGlobalErrorHandler()
  }).catch(() => {
    console.warn('Failed to initialize global error handler')
  })
}

// 브라우저 환경에서만 실행
if (typeof window !== 'undefined') {
  initDevTools()
  initErrorHandling()
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EduCanvas | 학원 관리 시스템",
  description: "혁신적인 드래그앤드롭 기반 학원 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary
          level="page"
          enableAnalytics={true}
          showDetails={process.env.NODE_ENV === 'development'}
        >
          <AuthProvider>
            {children}
          </AuthProvider>
          
          {/* Toast 알림 시스템 */}
          <Toaster
            position={toastConfig.position}
            toastOptions={toastConfig}
          />
        </ErrorBoundary>
      </body>
    </html>
  );
}
