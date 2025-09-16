'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Label, Modal, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { Loader2 } from 'lucide-react'
import type { UserProfile } from '@/types/auth.types'

const staffApprovalSchema = z.object({
  employee_id: z.string().min(1, '사원번호를 입력해주세요'),
  department: z.string().min(1, '부서를 입력해주세요'),
  position: z.string().min(1, '직책을 입력해주세요'),
  role: z.enum(['instructor', 'staff', 'admin'], {
    message: '역할을 선택해주세요',
  }),
  employment_type: z.enum(['정규직', '계약직', '파트타임'], {
    message: '고용형태를 선택해주세요',
  }),
})

type StaffApprovalFormData = z.infer<typeof staffApprovalSchema>

interface ApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserProfile | null
  tenantId: string
  onApprovalComplete: () => void
  title?: string // 모달 제목 커스터마이징
}

export function ApprovalModal({ 
  isOpen, 
  onClose, 
  user, 
  tenantId, 
  onApprovalComplete,
  title = "회원 가입 승인"
}: ApprovalModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isValid }
  } = useForm<StaffApprovalFormData>({
    resolver: zodResolver(staffApprovalSchema),
    defaultValues: {
      employment_type: '정규직',
      role: 'staff'
    },
    mode: 'onChange'
  })

  const selectedRole = watch('role')

  const handleApprove = async (data: StaffApprovalFormData) => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      console.log('🔄 직원 승인 처리 시작:', { userId: user.id, ...data })

      // 승인 API 호출 (확장된 버전)
      const response = await fetch('/api/tenant-admin/approve-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'approve',
          tenantId,
          staffInfo: {
            employee_id: data.employee_id,
            department: data.department,
            position: data.position,
            employment_type: data.employment_type,
            role: data.role
          }
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ 승인 처리 API 실패:', result.error)
        setError(result.error || '승인 처리에 실패했습니다.')
        return
      }

      console.log('✅ 직원 승인 처리 성공')
      
      // 성공 처리
      onApprovalComplete()
      onClose()
      reset()

    } catch (error) {
      console.error('❌ 직원 승인 처리 예외:', error)
      setError('승인 처리 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      console.log('🔄 사용자 거부 처리 시작:', user.id)

      const response = await fetch('/api/tenant-admin/approve-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'reject',
          tenantId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ 거부 처리 API 실패:', result.error)
        setError(result.error || '거부 처리에 실패했습니다.')
        return
      }

      console.log('✅ 사용자 거부 처리 성공')
      
      // 성공 처리
      onApprovalComplete()
      onClose()
      reset()

    } catch (error) {
      console.error('❌ 사용자 거부 처리 예외:', error)
      setError('거부 처리 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setError(null)
    onClose()
  }

  if (!user) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
    >
      <div className="space-y-6">
        {/* 신청자 정보 */}
        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4">
          <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">신청자 정보</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-neutral-600 dark:text-neutral-400">이름:</span>
              <span className="ml-2 font-medium text-neutral-900 dark:text-neutral-100">{user.name}</span>
            </div>
            <div>
              <span className="text-neutral-600 dark:text-neutral-400">이메일:</span>
              <span className="ml-2 font-medium text-neutral-900 dark:text-neutral-100">{user.email}</span>
            </div>
            {user.phone && (
              <div>
                <span className="text-neutral-600 dark:text-neutral-400">연락처:</span>
                <span className="ml-2 font-medium text-neutral-900 dark:text-neutral-100">{user.phone}</span>
              </div>
            )}
            <div>
              <span className="text-neutral-600 dark:text-neutral-400">신청일:</span>
              <span className="ml-2 font-medium text-neutral-900 dark:text-neutral-100">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '없음'}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-error-700">
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* 직원 정보 설정 폼 */}
        <form onSubmit={handleSubmit(handleApprove)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employee_id" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                사원번호 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="employee_id"
                {...register('employee_id')}
                placeholder="EMP001"
                className={errors.employee_id && 'border-red-300 focus:border-red-500'}
                disabled={isLoading}
              />
              {errors.employee_id && (
                <p className="text-xs text-red-600 mt-1">{errors.employee_id.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="department" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                부서 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="department"
                {...register('department')}
                placeholder="교무부"
                className={errors.department && 'border-red-300 focus:border-red-500'}
                disabled={isLoading}
              />
              {errors.department && (
                <p className="text-xs text-red-600 mt-1">{errors.department.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="position" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                직책 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="position"
                {...register('position')}
                placeholder="팀장"
                className={errors.position && 'border-red-300 focus:border-red-500'}
                disabled={isLoading}
              />
              {errors.position && (
                <p className="text-xs text-red-600 mt-1">{errors.position.message}</p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                역할 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => setValue('role', value as 'instructor' | 'staff' | 'admin', { shouldValidate: true })}
                disabled={isLoading}
              >
                <SelectTrigger className={errors.role && 'border-red-300 focus:border-red-500'}>
                  <SelectValue placeholder="역할 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">스태프</SelectItem>
                  <SelectItem value="instructor">강사</SelectItem>
                  <SelectItem value="admin">관리자</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-xs text-red-600 mt-1">{errors.role.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              고용형태 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch('employment_type')}
              onValueChange={(value) => setValue('employment_type', value as '정규직' | '계약직' | '파트타임', { shouldValidate: true })}
              disabled={isLoading}
            >
              <SelectTrigger className={errors.employment_type && 'border-red-300 focus:border-red-500'}>
                <SelectValue placeholder="고용형태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="정규직">정규직</SelectItem>
                <SelectItem value="계약직">계약직</SelectItem>
                <SelectItem value="파트타임">파트타임</SelectItem>
              </SelectContent>
            </Select>
            {errors.employment_type && (
              <p className="text-xs text-red-600 mt-1">{errors.employment_type.message}</p>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              취소
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
              onClick={handleReject}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '거부'}
            </Button>
            
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={!isValid || isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '승인'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}