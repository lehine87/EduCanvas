'use client'

import { LoginForm } from '@/components/auth/LoginForm'
import { useEffect } from 'react'

export default function LoginPage() {
  // 페이지 로드 시 로그 출력
  useEffect(() => {
    console.log(`📄 [PAGE-LOAD] LOGIN PAGE MOUNTED:`, {
      timestamp: new Date().toISOString(),
      location: typeof window !== 'undefined' ? window.location.href : 'server-side',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) : 'server-side'
    })
  }, [])

  return <LoginForm />
}