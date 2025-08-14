import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";

// 개발 환경에서만 Debug Interface 초기화
if (process.env.NODE_ENV === 'development') {
  // Dynamic import로 개발 도구 로드 (Tree-shaking 보장)
  import('@/lib/dev-init.dev').catch(() => {
    // 개발 도구 로드 실패는 무시 (Production에서는 파일이 없을 수 있음)
  })
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
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
