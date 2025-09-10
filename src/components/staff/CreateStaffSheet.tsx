'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateInstructor } from '@/hooks/queries'
import { useToast } from '@/components/ui/use-toast'
import type { CreateInstructorRequest, StaffInfo } from '@/types/staff.types'

// 폼 스키마
const createInstructorSchema = z.object({
  // 기본 정보
  email: z.string().email('올바른 이메일 주소를 입력하세요'),
  name: z.string().min(1, '이름을 입력하세요'),
  phone: z.string().optional(),
  
  // 직원 정보
  employee_id: z.string().min(1, '사번을 입력하세요'),
  department: z.string().min(1, '부서를 입력하세요'),
  position: z.string().optional(),
  employment_type: z.enum(['정규직', '계약직', '파트타임']),
  hire_date: z.string().min(1, '입사일을 입력하세요'),
  
  // 강의 정보
  teaching_level: z.enum(['초급', '중급', '고급']).optional(),
  subjects: z.string().optional(),
  certifications: z.string().optional(),
  specialties: z.string().optional(),
  max_classes_per_week: z.number().min(0).optional(),
  
  // 비상연락처
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
})

type CreateInstructorForm = z.infer<typeof createInstructorSchema>

interface CreateInstructorSheetProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateInstructorSheet({
  open,
  onClose,
  onSuccess
}: CreateInstructorSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const createInstructorMutation = useCreateInstructor()

  const form = useForm<CreateInstructorForm>({
    resolver: zodResolver(createInstructorSchema),
    defaultValues: {
      email: '',
      name: '',
      phone: '',
      employee_id: '',
      department: '',
      position: '',
      employment_type: '정규직',
      hire_date: '',
      teaching_level: '중급',
      subjects: '',
      certifications: '',
      specialties: '',
      max_classes_per_week: 20,
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relationship: ''
    }
  })

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = form

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (data: CreateInstructorForm) => {
    setIsSubmitting(true)

    try {
      // 강사 정보 구성
      const staffInfo: StaffInfo = {
        employee_id: data.employee_id,
        employment_type: data.employment_type,
        department: data.department,
        position: data.position,
        emergency_contact: data.emergency_contact_name ? {
          name: data.emergency_contact_name,
          phone: data.emergency_contact_phone || '',
          relationship: data.emergency_contact_relationship || ''
        } : undefined,
        instructor_info: {
          teaching_level: data.teaching_level,
          subjects: data.subjects ? data.subjects.split(',').map(s => s.trim()) : [],
          certifications: data.certifications ? data.certifications.split(',').map(s => s.trim()) : [],
          specialties: data.specialties ? data.specialties.split(',').map(s => s.trim()) : [],
          max_classes_per_week: data.max_classes_per_week
        }
      }

      const createRequest: CreateInstructorRequest = {
        user_id: '', // 백엔드에서 생성
        staff_info: staffInfo,
        hire_date: data.hire_date,
        bio: '',
        qualification: data.certifications || '',
        specialization: data.specialties || ''
      }

      // API 호출용 데이터 (사용자 정보 포함)
      const requestData = {
        ...createRequest,
        user_data: {
          email: data.email,
          name: data.name,
          phone: data.phone
        }
      }

      await createInstructorMutation.mutateAsync(requestData as any)

      toast({
        title: '강사 등록 완료',
        description: `${data.name} 강사가 성공적으로 등록되었습니다.`,
      })

      onSuccess()
      handleClose()
    } catch (error) {
      console.error('Failed to create instructor:', error)
      toast({
        title: '등록 실패',
        description: error instanceof Error ? error.message : '강사 등록 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>새 강사 등록</SheetTitle>
          <SheetDescription>
            새로운 강사의 정보를 입력하여 등록하세요.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">기본 정보</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="홍길동"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">이메일 *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="example@domain.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">연락처</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="010-1234-5678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee_id">사번 *</Label>
                <Input
                  id="employee_id"
                  {...register('employee_id')}
                  placeholder="EMP001"
                />
                {errors.employee_id && (
                  <p className="text-sm text-red-500">{errors.employee_id.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* 직원 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">직원 정보</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">부서 *</Label>
                <Input
                  id="department"
                  {...register('department')}
                  placeholder="수학과"
                />
                {errors.department && (
                  <p className="text-sm text-red-500">{errors.department.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">직위</Label>
                <Input
                  id="position"
                  {...register('position')}
                  placeholder="강사"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employment_type">고용형태 *</Label>
                <Select
                  value={watch('employment_type')}
                  onValueChange={(value) => setValue('employment_type', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="정규직">정규직</SelectItem>
                    <SelectItem value="계약직">계약직</SelectItem>
                    <SelectItem value="파트타임">파트타임</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hire_date">입사일 *</Label>
                <Input
                  id="hire_date"
                  type="date"
                  {...register('hire_date')}
                />
                {errors.hire_date && (
                  <p className="text-sm text-red-500">{errors.hire_date.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* 강의 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">강의 정보</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teaching_level">강의 레벨</Label>
                <Select
                  value={watch('teaching_level')}
                  onValueChange={(value) => setValue('teaching_level', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="초급">초급</SelectItem>
                    <SelectItem value="중급">중급</SelectItem>
                    <SelectItem value="고급">고급</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_classes_per_week">주간 최대 수업 수</Label>
                <Input
                  id="max_classes_per_week"
                  type="number"
                  min="0"
                  {...register('max_classes_per_week', { valueAsNumber: true })}
                  placeholder="20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subjects">담당 과목</Label>
              <Input
                id="subjects"
                {...register('subjects')}
                placeholder="수학, 영어, 과학 (쉼표로 구분)"
              />
              <p className="text-sm text-gray-500">여러 과목은 쉼표(,)로 구분하여 입력하세요</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="certifications">자격증</Label>
              <Input
                id="certifications"
                {...register('certifications')}
                placeholder="교원자격증, TESOL (쉼표로 구분)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialties">전문 분야</Label>
              <Input
                id="specialties"
                {...register('specialties')}
                placeholder="입시수학, 영어회화 (쉼표로 구분)"
              />
            </div>
          </div>

          <Separator />

          {/* 비상연락처 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">비상연락처</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">이름</Label>
                <Input
                  id="emergency_contact_name"
                  {...register('emergency_contact_name')}
                  placeholder="김영희"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">연락처</Label>
                <Input
                  id="emergency_contact_phone"
                  {...register('emergency_contact_phone')}
                  placeholder="010-9876-5432"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_relationship">관계</Label>
                <Input
                  id="emergency_contact_relationship"
                  {...register('emergency_contact_relationship')}
                  placeholder="배우자"
                />
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-2 pt-6">
            <Button type="button" variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '등록 중...' : '강사 등록'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}