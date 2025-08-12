import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export const metadata = {
  title: '비밀번호 재설정 | EduCanvas',
  description: 'EduCanvas 계정의 비밀번호를 재설정하세요',
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}