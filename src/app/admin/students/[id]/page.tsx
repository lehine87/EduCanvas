'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { useStudentsStore } from '@/store/studentsStore'
import { useAuthStore } from '@/store/useAuthStore'
import { LoadingPlaceholder } from '@/components/ui/classflow/LoadingPlaceholder'
import type { Student } from '@/types/student.types'
import { 
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  AcademicCapIcon,
  CalendarIcon,
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

// 상태별 스타일
const statusStyles = {
  active: 'bg-success-100 text-success-800 border-success-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  graduated: 'bg-blue-100 text-blue-800 border-blue-200',
  withdrawn: 'bg-warning-100 text-warning-800 border-warning-200',
  suspended: 'bg-error-100 text-error-800 border-error-200'
}

const statusText = {
  active: '활동중',
  inactive: '비활성',
  graduated: '졸업',
  withdrawn: '탈퇴',
  suspended: '정지'
}

// 정보 행 컴포넌트
const InfoRow = ({ 
  icon, 
  label, 
  value, 
  href 
}: { 
  icon: React.ReactNode
  label: string
  value?: string | null
  href?: string 
}) => {
  if (!value) return null

  const content = (
    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="text-gray-400 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-600">{label}</p>
        <p className="font-medium text-gray-900 truncate">{value}</p>
      </div>
    </div>
  )

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    )
  }

  return content
}

// 삭제 확인 모달 컴포넌트
const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  studentName,
  isDeleting 
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: (forceDelete: boolean) => void
  studentName: string
  isDeleting: boolean
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-error-600">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span>학생 삭제</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            정말로 <strong>{studentName}</strong> 학생을 삭제하시겠습니까?
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• 소프트 삭제: 학생 상태를 &apos;탈퇴&apos;로 변경합니다.</p>
            <p>• 강제 삭제: 모든 데이터를 완전히 삭제합니다.</p>
          </div>
          <div className="flex space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1"
            >
              취소
            </Button>
            <Button 
              variant="outline"
              onClick={() => onConfirm(false)}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? '처리중...' : '탈퇴 처리'}
            </Button>
            <Button 
              variant="destructive"
              onClick={() => onConfirm(true)}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? '삭제중...' : '완전 삭제'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function StudentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { profile } = useAuthStore()
  const { selectedStudent, loading, error, actions } = useStudentsStore()
  
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const studentId = params.id as string
  const tenantId = profile?.tenant_id

  // 학생 정보 로드
  useEffect(() => {
    if (studentId && tenantId) {
      actions.fetchStudent(studentId, tenantId)
    }
  }, [studentId, tenantId, actions])

  // 편집 핸들러
  const handleEdit = useCallback(() => {
    router.push(`/admin/students/${studentId}/edit`)
  }, [router, studentId])

  // 삭제 핸들러
  const handleDelete = useCallback(async (forceDelete: boolean) => {
    if (!tenantId || !selectedStudent) return

    setIsDeleting(true)
    
    try {
      await actions.deleteStudent(studentId, tenantId, forceDelete)
      
      toast.success(
        forceDelete 
          ? '학생이 완전히 삭제되었습니다.' 
          : '학생이 탈퇴 처리되었습니다.'
      )
      
      router.push('/admin/students')
    } catch (error) {
      console.error('학생 삭제 실패:', error)
      toast.error(error instanceof Error ? error.message : '삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }, [tenantId, selectedStudent, studentId, router, actions])

  // 로딩 상태
  if (loading && !selectedStudent) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          <LoadingPlaceholder className="h-16" />
          <LoadingPlaceholder className="h-64" />
          <LoadingPlaceholder className="h-48" />
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error || !selectedStudent) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="border-error-200 bg-error-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-error-600" />
              <div>
                <h3 className="text-lg font-medium text-error-900">
                  학생 정보를 불러올 수 없습니다
                </h3>
                <p className="text-error-700">
                  {error || '학생을 찾을 수 없습니다.'}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Button 
                onClick={() => router.back()} 
                variant="outline"
              >
                돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const student = selectedStudent

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>돌아가기</span>
          </Button>
          <div className="h-6 border-l border-gray-300" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <UserIcon className="h-8 w-8 mr-3 text-blue-600" />
              {student.name}
            </h1>
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-gray-600">학번: {student.student_number}</span>
              <Badge className={statusStyles[student.status as keyof typeof statusStyles]}>
                {statusText[student.status as keyof typeof statusText]}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button onClick={handleEdit} variant="outline">
            <PencilIcon className="h-4 w-4 mr-2" />
            편집
          </Button>
          <Button 
            onClick={() => setShowDeleteModal(true)}
            variant="destructive"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            삭제
          </Button>
        </div>
      </div>

      {/* 상세 정보 탭 */}
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">기본 정보</TabsTrigger>
          <TabsTrigger value="academic">학습 정보</TabsTrigger>
          <TabsTrigger value="payment">결제 정보</TabsTrigger>
          <TabsTrigger value="history">활동 내역</TabsTrigger>
        </TabsList>

        {/* 기본 정보 탭 */}
        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 학생 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>학생 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow
                  icon={<UserIcon className="h-5 w-5" />}
                  label="이름"
                  value={student.name}
                />
                <InfoRow
                  icon={<PhoneIcon className="h-5 w-5" />}
                  label="연락처"
                  value={student.phone}
                  href={student.phone ? `tel:${student.phone}` : undefined}
                />
                <InfoRow
                  icon={<EnvelopeIcon className="h-5 w-5" />}
                  label="이메일"
                  value={student.email}
                  href={student.email ? `mailto:${student.email}` : undefined}
                />
                <InfoRow
                  icon={<AcademicCapIcon className="h-5 w-5" />}
                  label="학년"
                  value={student.grade_level}
                />
                <InfoRow
                  icon={<AcademicCapIcon className="h-5 w-5" />}
                  label="학교"
                  value={student.school_name}
                />
                <InfoRow
                  icon={<MapPinIcon className="h-5 w-5" />}
                  label="주소"
                  value={student.address}
                />
              </CardContent>
            </Card>

            {/* 학부모 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>학부모 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow
                  icon={<UserIcon className="h-5 w-5" />}
                  label="학부모 이름"
                  value={student.parent_name}
                />
                <InfoRow
                  icon={<PhoneIcon className="h-5 w-5" />}
                  label="주 연락처"
                  value={student.parent_phone_1}
                  href={student.parent_phone_1 ? `tel:${student.parent_phone_1}` : undefined}
                />
                <InfoRow
                  icon={<PhoneIcon className="h-5 w-5" />}
                  label="보조 연락처"
                  value={student.parent_phone_2}
                  href={student.parent_phone_2 ? `tel:${student.parent_phone_2}` : undefined}
                />
              </CardContent>
            </Card>
          </div>

          {/* 메모 */}
          {student.notes && (
            <Card>
              <CardHeader>
                <CardTitle>메모</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{student.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* 시스템 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>시스템 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow
                icon={<CalendarIcon className="h-5 w-5" />}
                label="등록일"
                value={student.created_at ? new Date(student.created_at).toLocaleDateString('ko-KR') : undefined}
              />
              <InfoRow
                icon={<CalendarIcon className="h-5 w-5" />}
                label="최종 수정일"
                value={student.updated_at ? new Date(student.updated_at).toLocaleDateString('ko-KR') : undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 학습 정보 탭 */}
        <TabsContent value="academic">
          <Card>
            <CardContent className="p-12 text-center">
              <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                학습 정보
              </h3>
              <p className="text-gray-600">
                수강 중인 강의, 출석 현황, 성적 등의 정보가 표시됩니다.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 결제 정보 탭 */}
        <TabsContent value="payment">
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                결제 정보
              </h3>
              <p className="text-gray-600">
                수강료 결제 내역, 미납금 등의 정보가 표시됩니다.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 활동 내역 탭 */}
        <TabsContent value="history">
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                활동 내역
              </h3>
              <p className="text-gray-600">
                상담 기록, 변경 이력 등의 정보가 표시됩니다.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        studentName={student.name}
        isDeleting={isDeleting}
      />
    </div>
  )
}