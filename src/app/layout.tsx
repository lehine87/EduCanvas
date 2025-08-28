import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { Toaster } from "react-hot-toast";
import { toastConfig } from "@/lib/toast/toastConfig";
import { ClientInitializer } from "@/components/ClientInitializer";
import SearchProvider from "@/components/search/SearchProvider";


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
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary
            level="page"
            enableAnalytics={true}
            showDetails={process.env.NODE_ENV === 'development'}
          >
            <ClientInitializer />
            <SearchProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </SearchProvider>
            
            {/* Toast 알림 시스템 */}
            <Toaster
              position={toastConfig.position}
              toastOptions={toastConfig}
            />
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
