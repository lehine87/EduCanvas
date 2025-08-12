import { SignUpForm } from '@/components/auth/SignUpForm'

export const metadata = {
  title: '회원가입 | EduCanvas',
  description: 'EduCanvas 학원 관리 시스템에 새 계정을 만드세요',
}

export default function SignUpPage() {
  return <SignUpForm />
}