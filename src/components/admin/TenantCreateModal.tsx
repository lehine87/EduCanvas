'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, Button, Input, Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui'
import { Loader2 } from 'lucide-react'
import type { Tenant } from '@/types'

const tenantSchema = z.object({
  name: z.string().min(2, '학원명은 2자 이상이어야 합니다'),
  contact_email: z.string().email('올바른 이메일을 입력해주세요'),
  contact_phone: z.string().min(10, '올바른 전화번호를 입력해주세요'),
  address: z.string().min(5, '주소를 입력해주세요'),
  business_registration: z.string().optional(),
  admin_name: z.string().min(2, '관리자 이름을 입력해주세요'),
  admin_email: z.string().email('올바른 관리자 이메일을 입력해주세요'),
})

type TenantFormData = z.infer<typeof tenantSchema>

interface TenantCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onTenantCreated: (tenant: Tenant) => void
}

export function TenantCreateModal({ isOpen, onClose, onTenantCreated }: TenantCreateModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'tenant' | 'success'>('tenant')
  const [createdData, setCreatedData] = useState<{tenant: Tenant, admin: {email: string, name: string, tempPassword: string}} | null>(null)

  const form = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      business_registration: '',
      admin_name: '',
      admin_email: ''
    }
  })


  const onSubmit = async (data: TenantFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🏢 테넌트 생성 시작:', data.name)

      // API Route를 통해 서버 사이드에서 테넌트 생성
      const response = await fetch('/api/system-admin/create-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '학원 생성에 실패했습니다.')
      }

      console.log('✅ 테넌트 생성 성공:', result.tenant.name)

      // 성공 데이터 저장
      setCreatedData({
        tenant: result.tenant,
        admin: result.admin
      })

      setStep('success')

    } catch (error) {
      console.error('테넌트 생성 과정 오류:', error)
      setError(error instanceof Error ? error.message : '학원 생성 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (createdData) {
      onTenantCreated(createdData.tenant)
    }
    
    // 상태 초기화
    setStep('tenant')
    setCreatedData(null)
    setError(null)
    form.reset()
    onClose()
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // TODO: 토스트 메시지 추가
    console.log('클립보드에 복사됨:', text)
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title={step === 'tenant' ? '새 학원 생성' : '학원 생성 완료'}
      size="lg"
    >
      {step === 'tenant' ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* 학원 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">학원 정보</h3>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>학원명</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="ABC 영어학원"
                      disabled={isLoading}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>대표 이메일</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="contact@abc-academy.com"
                      disabled={isLoading}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>대표 전화번호</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="02-1234-5678"
                      disabled={isLoading}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>주소</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="서울시 강남구 테헤란로 123"
                      disabled={isLoading}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="business_registration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>사업자등록번호 (선택사항)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="123-45-67890"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <hr />

          {/* 관리자 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">관리자 계정</h3>
            
            <FormField
              control={form.control}
              name="admin_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>관리자 이름</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="홍길동 원장"
                      disabled={isLoading}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="admin_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>관리자 이메일</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="admin@abc-academy.com"
                      disabled={isLoading}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700">
              💡 관리자 계정의 임시 비밀번호가 자동 생성되며, 생성 완료 후 제공됩니다.
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              학원 생성
            </Button>
          </div>
          </form>
        </Form>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              학원 생성 완료! 🎉
            </h3>
            <p className="text-gray-600">
              {createdData?.tenant?.name}가 성공적으로 생성되었습니다.
            </p>
          </div>

          {/* 생성된 정보 */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-gray-900">생성된 정보</h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">학원명:</span>
                <p className="font-medium">{createdData?.tenant?.name}</p>
              </div>
              <div>
                <span className="text-gray-600">고객번호:</span>
                <div className="flex items-center space-x-2">
                  <p className="font-medium font-mono">{createdData?.tenant?.tenant_code}</p>
                  <button
                    onClick={() => createdData?.tenant?.tenant_code && copyToClipboard(createdData.tenant.tenant_code)}
                    className="text-blue-600 hover:text-blue-500"
                    title="복사"
                  >
                    📋
                  </button>
                </div>
              </div>
              <div>
                <span className="text-gray-600">관리자:</span>
                <p className="font-medium">{createdData?.admin?.name}</p>
              </div>
              <div>
                <span className="text-gray-600">관리자 이메일:</span>
                <div className="flex items-center space-x-2">
                  <p className="font-medium">{createdData?.admin?.email}</p>
                  <button
                    onClick={() => createdData?.admin?.email && copyToClipboard(createdData.admin.email)}
                    className="text-blue-600 hover:text-blue-500"
                    title="복사"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 임시 비밀번호 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ 임시 비밀번호</h4>
            <div className="flex items-center space-x-2">
              <code className="bg-white px-2 py-1 rounded font-mono text-sm border">
                {createdData?.admin?.tempPassword}
              </code>
              <button
                onClick={() => createdData?.admin?.tempPassword && copyToClipboard(createdData.admin.tempPassword)}
                className="text-yellow-600 hover:text-yellow-500"
                title="복사"
              >
                📋
              </button>
            </div>
            <p className="text-yellow-700 text-sm mt-2">
              이 정보를 안전한 곳에 저장하고 관리자에게 전달해주세요.
            </p>
          </div>

          {/* 다음 단계 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">📋 다음 단계</h4>
            <ol className="text-blue-700 text-sm space-y-1">
              <li>1. 관리자에게 로그인 정보 전달</li>
              <li>2. 관리자가 첫 로그인 후 비밀번호 변경</li>
              <li>3. 직원들이 고객번호로 가입 신청</li>
              <li>4. 관리자가 직원 가입 승인</li>
            </ol>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleClose}>
              완료
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}