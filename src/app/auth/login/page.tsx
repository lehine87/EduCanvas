import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = {
  title: '로그인 | EduCanvas',
  description: 'EduCanvas 학원 관리 시스템에 로그인하세요',
}

export default function LoginPage() {
  return <LoginForm />
}