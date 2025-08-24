'use client'

import { useState, useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, User, Clock, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/store/useAuthStore'
import type { StaffMember } from '@/types/staff.types'

// 등록 대기중인 사용자 타입
interface PendingUser {
  id: string
  user_profiles: {
    id: string
    email: string
    name: string
    phone?: string
    created_at: string
  }
  status: 'pending'
  created_at: string
}

const createInstructorSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식을 입력해주세요'),
  full_name: z
    .string()
    .min(1, '이름을 입력해주세요')
    .min(2, '이름은 최소 2자 이상이어야 합니다'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[0-9-+\s()]{8,15}$/.test(val),
      '올바른 전화번호 형식을 입력해주세요'
    ),
  job_function: z.enum(['instructor', 'general'], {
    required_error: '직능을 선택해주세요',
  }),
  role: z.enum(['admin', 'instructor', 'staff', 'viewer'], {
    required_error: '직급을 선택해주세요',
  }),
  hire_date: z.string().optional(),
  specialization: z.string().optional(),
  bio: z.string().optional(),
})

type CreateInstructorFormValues = z.infer<typeof createInstructorSchema>

export interface CreateInstructorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (instructor: StaffMember) => void
  className?: string
}

export function CreateInstructorSheet({
  open,
  onOpenChange,
  onSuccess,
  className,
}: CreateInstructorSheetProps) {
  const { profile } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  const form = useForm<CreateInstructorFormValues>({
    resolver: zodResolver(createInstructorSchema),
    defaultValues: {
      email: '',
      full_name: '',
      phone: '',
      job_function: 'instructor',
      role: 'instructor',
      hire_date: '',
      specialization: '',
      bio: '',
    },
  })

  // 등록 대기중인 사용자 목록 가져오기
  const fetchPendingUsers = useCallback(async () => {
    if (!profile?.tenant_id) return

    setIsLoadingUsers(true)
    try {
      const response = await fetch(
        `/api/tenant-admin/members?tenantId=${profile.tenant_id}&status=pending`
      )
      if (response.ok) {
        const data = await response.json()
        setPendingUsers(data.members || [])
      } else {
        console.error('Failed to fetch pending users')
      }
    } catch (error) {
      console.error('Error fetching pending users:', error)
    } finally {
      setIsLoadingUsers(false)
    }
  }, [profile?.tenant_id])

  // 사용자 선택 시 폼 자동 채우기
  const handleUserSelect = useCallback((user: PendingUser) => {
    setSelectedUser(user)
    form.reset({
      email: user.user_profiles.email,
      full_name: user.user_profiles.name,
      phone: user.user_profiles.phone || '',
      job_function: 'instructor',
      role: 'instructor',
      hire_date: '',
      specialization: '',
      bio: '',
    })
  }, [form])

  const handleSubmit = useCallback(
    async (values: CreateInstructorFormValues) => {
      if (!profile?.tenant_id || !selectedUser) {
        toast.error('사용자를 선택해주세요.')
        return
      }

      setIsSubmitting(true)

      try {
        // 사용자 승인 API 호출
        const response = await fetch('/api/tenant-admin/approve-member', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tenantId: profile.tenant_id,
            userId: selectedUser.user_profiles.id,
            action: 'approve',
            role: values.role,
            staffInfo: {
              job_function: values.job_function,
              hire_date: values.hire_date || null,
              specialization: values.specialization || null,
              bio: values.bio || null,
            }
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || '직원 승인에 실패했습니다.')
        }

        toast.success('직원이 성공적으로 등록되었습니다.')
        form.reset()
        setSelectedUser(null)
        onOpenChange(false)
        onSuccess?.(data.member)
        // 목록 새로고침
        fetchPendingUsers()
      } catch (error: any) {
        console.error('직원 승인 오류:', error)
        toast.error(error.message || '직원 승인에 실패했습니다.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [profile?.tenant_id, selectedUser, form, onOpenChange, onSuccess, fetchPendingUsers]
  )

  // Sheet가 열릴 때 pending 사용자 목록 가져오기
  useEffect(() => {
    if (open) {
      fetchPendingUsers()
    } else {
      form.reset()
      setSelectedUser(null)
      setPendingUsers([])
    }
  }, [open, form, fetchPendingUsers])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[700px] sm:max-w-[700px] px-8 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>새 직원 등록</SheetTitle>
          <SheetDescription>
            회원가입 완료된 사용자 중에서 직원으로 등록할 사용자를 선택하세요.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* 등록 대기중인 사용자 목록 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                등록 대기중인 사용자
              </CardTitle>
              <CardDescription>
                회원가입은 완료했지만 아직 직원으로 등록되지 않은 사용자들입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">사용자 목록을 불러오는 중...</span>
                </div>
              ) : pendingUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>등록 대기중인 사용자가 없습니다.</p>
                  <p className="text-sm">새로운 사용자가 회원가입하면 여기에 표시됩니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedUser?.id === user.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {user.user_profiles.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium">{user.user_profiles.name}</h4>
                          <p className="text-sm text-gray-600">{user.user_profiles.email}</p>
                          {user.user_profiles.phone && (
                            <p className="text-sm text-gray-500">{user.user_profiles.phone}</p>
                          )}
                        </div>
                        {selectedUser?.id === user.id && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 선택된 사용자의 직원 정보 폼 */}
          {selectedUser && (
            <Card>
              <CardHeader>
                <CardTitle>직원 정보 설정</CardTitle>
                <CardDescription>
                  선택된 사용자: {selectedUser.user_profiles.name} ({selectedUser.user_profiles.email})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-6"
                  >
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">기본 정보</h3>
              
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이름 *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="직원 이름을 입력해주세요"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일 *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="이메일 주소를 입력해주세요"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>전화번호</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="전화번호를 입력해주세요"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 직무 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">직무 정보</h3>
              
              <FormField
                control={form.control}
                name="job_function"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>직능 *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="직능을 선택해주세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="instructor">강사</SelectItem>
                        <SelectItem value="general">행정직</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>직급 *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="직급을 선택해주세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">관리자</SelectItem>
                        <SelectItem value="instructor">강사</SelectItem>
                        <SelectItem value="staff">직원</SelectItem>
                        <SelectItem value="viewer">열람자</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hire_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>입사일</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>전문 분야</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="전문 분야를 입력해주세요 (예: 수학, 영어)"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>소개</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="직원 소개를 입력해주세요"
                        disabled={isSubmitting}
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-end space-x-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                등록
              </Button>
            </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}