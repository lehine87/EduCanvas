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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, 
  Mail, 
  Phone, 
  Calendar,
  User,
  Briefcase,
  GraduationCap
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/store/useAuthStore'
import type { StaffMember } from '@/types/staff.types'

const updateInstructorSchema = z.object({
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

type UpdateInstructorFormValues = z.infer<typeof updateInstructorSchema>

export interface InstructorDetailSheetProps {
  instructor: StaffMember | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: (instructor: StaffMember) => void
  onDelete?: (instructor: StaffMember) => void
  className?: string
}

export function InstructorDetailSheet({
  instructor,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  className,
}: InstructorDetailSheetProps) {
  const { profile } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const form = useForm<UpdateInstructorFormValues>({
    resolver: zodResolver(updateInstructorSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      job_function: 'instructor',
      role: 'staff',
      hire_date: '',
      specialization: '',
      bio: '',
    },
  })

  // instructor 데이터가 변경되면 폼 업데이트
  useEffect(() => {
    if (instructor && open) {
      form.reset({
        full_name: instructor.full_name || '',
        phone: instructor.phone || '',
        job_function: instructor.job_function,
        role: instructor.role_name || instructor.role || 'staff',
        hire_date: instructor.hire_date || '',
        specialization: instructor.specialization || '',
        bio: instructor.bio || '',
      })
    }
  }, [instructor, open, form])

  // Sheet가 닫힐 때 편집 모드 해제
  useEffect(() => {
    if (!open) {
      setIsEditing(false)
    }
  }, [open])

  const handleUpdate = useCallback(
    async (values: UpdateInstructorFormValues) => {
      if (!instructor || !profile?.tenant_id) {
        toast.error('업데이트할 직원 정보를 찾을 수 없습니다.')
        return
      }

      setIsSubmitting(true)

      try {
        const response = await fetch(`/api/tenant-admin/members/${instructor.membership_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tenantId: profile.tenant_id,
            full_name: values.full_name,
            phone: values.phone,
            job_function: values.job_function,
            role: values.role,
            hire_date: values.hire_date || null,
            specialization: values.specialization || null,
            bio: values.bio || null,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || '직원 정보 업데이트에 실패했습니다.')
        }

        toast.success('직원 정보가 성공적으로 업데이트되었습니다.')
        setIsEditing(false)
        onUpdate?.(data.member)
      } catch (error: any) {
        console.error('직원 정보 업데이트 오류:', error)
        toast.error(error.message || '직원 정보 업데이트에 실패했습니다.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [instructor, profile?.tenant_id, onUpdate]
  )

  const handleDelete = useCallback(async () => {
    if (!instructor || !profile?.tenant_id) {
      toast.error('삭제할 직원 정보를 찾을 수 없습니다.')
      return
    }

    if (!confirm(`"${instructor.full_name}" 직원을 비활성화하시겠습니까?`)) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/tenant-admin/members/${instructor.membership_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: profile.tenant_id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '직원 비활성화에 실패했습니다.')
      }

      toast.success('직원이 성공적으로 비활성화되었습니다.')
      onOpenChange(false)
      onDelete?.(instructor)
    } catch (error: any) {
      console.error('직원 삭제 오류:', error)
      toast.error(error.message || '직원 비활성화에 실패했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }, [instructor, profile?.tenant_id, onOpenChange, onDelete])

  const getJobFunctionBadge = (jobFunction: string) => {
    if (jobFunction === 'instructor') {
      return <Badge className="bg-blue-100 text-blue-800">강사</Badge>
    }
    return <Badge variant="secondary">행정직</Badge>
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">활동중</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">대기중</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">비활성</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!instructor) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[700px] sm:max-w-[700px] px-8 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>직원 정보</SheetTitle>
          <SheetDescription>
            {isEditing ? '직원 정보를 수정하세요' : '직원의 상세 정보를 확인하세요'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6 px-4">
          {/* 직원 기본 정보 헤더 */}
          {!isEditing && (
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-brand-700">
                  {instructor.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{instructor.full_name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {getJobFunctionBadge(instructor.job_function)}
                  {getStatusBadge(instructor.status)}
                </div>
              </div>
            </div>
          )}

          {isEditing ? (
            /* 편집 모드 */
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-6">
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

                  <div>
                    <FormLabel>이메일</FormLabel>
                    <Input
                      type="email"
                      value={instructor.email}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">이메일은 수정할 수 없습니다</p>
                  </div>

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
                          value={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
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
                          value={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
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
                            placeholder="전문 분야를 입력해주세요"
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

                {/* 편집 모드 액션 버튼 */}
                <div className="flex justify-end space-x-3 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isSubmitting}
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    저장
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            /* 보기 모드 */
            <div className="space-y-6">
              {/* 연락처 정보 */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5" />
                  연락처 정보
                </h3>
                <div className="space-y-2 pl-7">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{instructor.email}</span>
                  </div>
                  {instructor.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{instructor.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* 직무 정보 */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  직무 정보
                </h3>
                <div className="space-y-3 pl-7">
                  <div>
                    <span className="text-sm text-gray-500">직급</span>
                    <div className="mt-1">
                      <Badge variant="outline">{instructor.role}</Badge>
                    </div>
                  </div>
                  {instructor.hire_date && (
                    <div>
                      <span className="text-sm text-gray-500">입사일</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {new Date(instructor.hire_date).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                  )}
                  {instructor.specialization && (
                    <div>
                      <span className="text-sm text-gray-500">전문 분야</span>
                      <div className="flex items-center gap-2 mt-1">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{instructor.specialization}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {instructor.bio && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">소개</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {instructor.bio}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              {/* 기타 정보 */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">기타 정보</h3>
                <div className="space-y-2 text-sm text-gray-500">
                  <div>
                    등록일: {new Date(instructor.created_at).toLocaleDateString('ko-KR')}
                  </div>
                  <div>
                    직원 ID: {instructor.id}
                  </div>
                </div>
              </div>

              {/* 보기 모드 액션 버튼 */}
              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  비활성화
                </Button>
                <Button
                  onClick={() => setIsEditing(true)}
                >
                  편집
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}