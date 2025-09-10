import type { Metadata } from "next";
import "./globals.css"; // PostCSS 플러그인 비활성화로 문제 해결 시도
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";

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
      <body>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}