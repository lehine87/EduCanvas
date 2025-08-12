import { z } from 'zod'

export const signInSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력하세요')
    .email('올바른 이메일 형식이 아닙니다'),
  password: z
    .string()
    .min(1, '비밀번호를 입력하세요')
})

export const signUpSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력하세요')
    .email('올바른 이메일 형식이 아닙니다'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      '영문과 숫자를 포함해야 합니다'
    ),
  confirmPassword: z
    .string()
    .min(1, '비밀번호 확인을 입력하세요'),
  full_name: z
    .string()
    .min(2, '이름은 2글자 이상 입력하세요')
    .max(50, '이름은 50글자를 초과할 수 없습니다'),
  tenant_slug: z
    .string()
    .optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword']
})

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력하세요')
    .email('올바른 이메일 형식이 아닙니다')
})

export const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      '영문과 숫자를 포함해야 합니다'
    ),
  confirmPassword: z
    .string()
    .min(1, '비밀번호 확인을 입력하세요')
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword']
})

export type SignInFormData = z.infer<typeof signInSchema>
export type SignUpFormData = z.infer<typeof signUpSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>