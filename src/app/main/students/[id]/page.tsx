'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { useStudentsStore } from '@/store/studentsStore'
import { useAuthStore } from '@/store/useAuthStore'
import { clsx } from 'clsx'
import { LoadingPlaceholder } from '@/components/ui/classflow/LoadingPlaceholder'
import type { Student, Class, Attendance, StudentEnrollment, Consultation, Payment, StudentHistory } from '@/types'
import { ClassSearchSelector, ClassSearchResult } from '@/components/ui/ClassSearchSelector'
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
  ExclamationTriangleIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ClockIcon,
  ChevronRightIcon,
  BookOpenIcon,
  CheckCircleIcon,
  XCircleIcon,
  PauseIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import ResponsiveStudentLayout from '@/components/layout/ResponsiveStudentLayout'
import { StudentInfoCard, QuickStatsCard } from '@/components/ui/ResponsiveCard'
import { SmartGrid, GridItem, WidgetSizes } from '@/components/dashboard-v2/core/SmartGrid'
import { NotificationBell, notifications } from '@/components/notifications/NotificationSystem'
import { QuickActions, FloatingQuickActions } from '@/components/ui/QuickActions'

// 🎯 Phase 2: UX 가이드에 따른 5개 탭 정의
const TAB_CONFIGS = [
  {
    id: 'basic',
    label: '기본 정보',
    icon: UserIcon,
    description: '프로필, 연락처, 학부모 정보'
  },
  {
    id: 'enrollment',
    label: '수강 현황', 
    icon: AcademicCapIcon,
    description: '현재 클래스, 출석률, 시간표'
  },
  {
    id: 'consultation',
    label: '상담 내역',
    icon: ChatBubbleLeftRightIcon, 
    description: '상담 기록, 예정 상담, 메모'
  },
  {
    id: 'payment',
    label: '납입 내역',
    icon: CreditCardIcon,
    description: '결제 이력, 미납 현황, 다음 청구'
  },
  {
    id: 'learning',
    label: '학습 기록',
    icon: BookOpenIcon,
    description: '성적, 과제, 진도'
  }
] as const

type TabId = typeof TAB_CONFIGS[number]['id']

// 상태별 스타일 (inactive를 휴원으로 사용)
const statusStyles = {
  active: 'bg-success-100 text-success-800 border-success-200',
  inactive: 'bg-yellow-100 text-yellow-800 border-yellow-200', // 휴원으로 사용
  graduated: 'bg-blue-100 text-blue-800 border-blue-200',
  withdrawn: 'bg-warning-100 text-warning-800 border-warning-200',
  suspended: 'bg-error-100 text-error-800 border-error-200'
}

const statusText = {
  active: '활동중',
  inactive: '휴원', // 휴원으로 표시
  graduated: '졸업',
  withdrawn: '탈퇴',
  suspended: '정지'
}

// 🎯 UX 가이드: 점진적 공개 패턴을 위한 컴포넌트
const ProgressiveDisclosure = ({ 
  title, 
  children, 
  defaultExpanded = false 
}: {
  title: string
  children: React.ReactNode
  defaultExpanded?: boolean
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  
  return (
    <Card className="overflow-hidden">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <ChevronRightIcon 
            className={`h-5 w-5 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          {children}
        </CardContent>
      )}
    </Card>
  )
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

// 🎯 UX 가이드: 탭별 데이터 인터페이스 (미래 확장용)
interface TabData {
  basic: {
    student: Student
    loaded: boolean
  }
  enrollment: {
    classes: Class[]
    attendance: Attendance[]
    schedule: StudentEnrollment[]
    loaded: boolean
  }
  consultation: {
    records: Consultation[]
    upcoming: Consultation[]
    notes: Consultation[]
    loaded: boolean
  }
  payment: {
    history: Payment[]
    unpaid: Payment[]
    nextDue: Payment[]
    loaded: boolean
  }
  learning: {
    grades: StudentHistory[]
    assignments: StudentHistory[]
    progress: StudentHistory[]
    loaded: boolean
  }
}

// 휴원 확인 모달 컴포넌트
const LeaveConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  studentName,
  currentStatus,
  isProcessing 
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  studentName: string
  currentStatus: string
  isProcessing: boolean
}) => {
  if (!isOpen) return null

  const isCurrentlyOnLeave = currentStatus === 'inactive'
  const actionText = isCurrentlyOnLeave ? '복원' : '휴원'
  const newStatus = isCurrentlyOnLeave ? 'active' : 'inactive'
  const description = isCurrentlyOnLeave 
    ? '학생을 활동 상태로 복원하시겠습니까?'
    : '학생을 휴원 상태로 변경하시겠습니까?'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-yellow-600">
            <PauseIcon className="h-5 w-5" />
            <span>학생 {actionText}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            <strong>{studentName}</strong> 학생을 {description}
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            {isCurrentlyOnLeave ? (
              <>
                <p>• 학생 상태가 '활동중'으로 변경됩니다.</p>
                <p>• 정상적인 수강이 가능해집니다.</p>
              </>
            ) : (
              <>
                <p>• 학생 상태가 '휴원'으로 변경됩니다.</p>
                <p>• 일시적으로 수강을 중단합니다.</p>
                <p>• 언제든지 복원할 수 있습니다.</p>
              </>
            )}
          </div>
          <div className="flex space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              취소
            </Button>
            <Button 
              variant="default"
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700"
            >
              {isProcessing ? '처리중...' : `${actionText} 확인`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
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
            <p>• 소프트 삭제: 학생 상태를 '탈퇴'로 변경합니다.</p>
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
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [isProcessingLeave, setIsProcessingLeave] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('basic')
  const [showClassSelector, setShowClassSelector] = useState(false)
  const [enrollingInClass, setEnrollingInClass] = useState(false)
  
  // 빠른 편집 상태
  const [isQuickEditing, setIsQuickEditing] = useState(false)
  const [quickEditData, setQuickEditData] = useState<{
    phone?: string
    email?: string
    parent_phone_1?: string
    parent_phone_2?: string
  }>({})
  const [isSavingQuickEdit, setIsSavingQuickEdit] = useState(false)

  // 🎯 UX 가이드: 모든 탭 데이터 즉시 로딩을 위한 상태
  const [tabData, setTabData] = useState<TabData>({
    basic: { student: selectedStudent!, loaded: false },
    enrollment: { classes: [], attendance: [], schedule: [], loaded: false },
    consultation: { records: [], upcoming: [], notes: [], loaded: false },
    payment: { history: [], unpaid: [], nextDue: [], loaded: false },
    learning: { grades: [], assignments: [], progress: [], loaded: false }
  })

  const studentId = params.id as string
  const tenantId = profile?.tenant_id

  // 🎯 UX 가이드: 즉시 로딩 시스템 - 모든 탭 데이터를 미리 로드
  const loadAllTabData = useCallback(async (student: Student) => {
    console.log('🎯 [PHASE2] 모든 탭 데이터 즉시 로딩 시작')
    
    try {
      // 병렬로 모든 탭 데이터 로드
      const [enrollmentData, consultationData, paymentData, learningData] = await Promise.all([
        // 수강 현황 데이터 (임시 목업)
        Promise.resolve({
          classes: [
            { id: 1, name: '수학 고급반', instructor: '김선생님', schedule: '월/수/금 19:00-21:00' },
            { id: 2, name: '영어 회화반', instructor: '박선생님', schedule: '화/목 18:00-19:30' }
          ],
          attendance: [
            { date: '2024-08-17', status: 'present' },
            { date: '2024-08-15', status: 'present' },
            { date: '2024-08-14', status: 'late' }
          ],
          schedule: []
        }),
        
        // 상담 내역 데이터 (임시 목업)
        Promise.resolve({
          records: [
            { id: 1, date: '2024-08-10', counselor: '이상담사', topic: '학습 진도 상담', summary: '수학 성적 향상 방안 논의' },
            { id: 2, date: '2024-07-25', counselor: '김상담사', topic: '진로 상담', summary: '대학 진학 계획 수립' }
          ],
          upcoming: [
            { id: 1, date: '2024-08-25', counselor: '이상담사', topic: '중간평가 결과 상담' }
          ],
          notes: []
        }),
        
        // 납입 내역 데이터 (임시 목업)
        Promise.resolve({
          history: [
            { id: 1, date: '2024-08-01', amount: 200000, method: '카드', status: 'completed', course: '수학 고급반' },
            { id: 2, date: '2024-07-01', amount: 150000, method: '계좌이체', status: 'completed', course: '영어 회화반' }
          ],
          unpaid: [],
          nextDue: [
            { id: 1, dueDate: '2024-09-01', amount: 200000, course: '수학 고급반' }
          ]
        }),
        
        // 학습 기록 데이터 (임시 목업)
        Promise.resolve({
          grades: [
            { subject: '수학', score: 85, test: '8월 모의고사', date: '2024-08-15' },
            { subject: '영어', score: 92, test: '회화 평가', date: '2024-08-10' }
          ],
          assignments: [
            { title: '수학 워크북 3단원', dueDate: '2024-08-20', status: 'submitted' },
            { title: '영어 에세이 작성', dueDate: '2024-08-22', status: 'pending' }
          ],
          progress: []
        })
      ])

      // 탭 데이터 업데이트 (타입 단언으로 임시 해결)
      setTabData((prev: any) => ({
        basic: { student, loaded: true },
        enrollment: {
          ...prev.enrollment,
          classes: enrollmentData.classes as any,
          attendance: enrollmentData.attendance as any,
          schedule: enrollmentData.schedule as any,
          loaded: true
        },
        consultation: {
          ...prev.consultation,
          ...consultationData,
          loaded: true
        },
        payment: {
          ...prev.payment,
          ...paymentData,
          loaded: true
        },
        learning: {
          ...prev.learning,
          ...learningData,
          loaded: true
        }
      }))

      console.log('✅ [PHASE2] 모든 탭 데이터 로딩 완료')
      
    } catch (error) {
      console.error('❌ [PHASE2] 탭 데이터 로딩 실패:', error)
    }
  }, [])

  // 학생 정보 로드
  useEffect(() => {
    if (studentId && tenantId) {
      actions.fetchStudent(studentId, tenantId)
    }
  }, [studentId, tenantId, actions])

  // 🎯 UX 가이드: 학생 정보 로드 완료 시 모든 탭 데이터 즉시 로딩
  useEffect(() => {
    if (selectedStudent && !tabData.basic.loaded) {
      loadAllTabData(selectedStudent)
    }
  }, [selectedStudent, tabData.basic.loaded, loadAllTabData])

  // 편집 핸들러
  const handleEdit = useCallback(() => {
    router.push(`/main/students/${studentId}/edit`)
  }, [router, studentId])
  
  // 빠른 편집 모드 토글
  const toggleQuickEdit = useCallback(() => {
    if (isQuickEditing) {
      // 편집 모드 종료 - 변경사항 되돌리기
      setQuickEditData({})
      setIsQuickEditing(false)
    } else {
      // 편집 모드 시작 - 현재 값으로 초기화
      setQuickEditData({
        phone: selectedStudent?.phone || '',
        email: selectedStudent?.email || '',
        parent_phone_1: selectedStudent?.parent_phone_1 || '',
        parent_phone_2: selectedStudent?.parent_phone_2 || ''
      })
      setIsQuickEditing(true)
    }
  }, [isQuickEditing, selectedStudent])
  
  // 빠른 편집 저장
  const saveQuickEdit = useCallback(async () => {
    if (!tenantId || !selectedStudent) return
    
    setIsSavingQuickEdit(true)
    const loadingToast = toast.loading('정보를 저장하는 중...')
    
    try {
      // 변경된 필드만 업데이트
      const updateData: Partial<any> = {}
      if (quickEditData.phone !== selectedStudent.phone) {
        updateData.phone = quickEditData.phone || null
      }
      if (quickEditData.email !== selectedStudent.email) {
        updateData.email = quickEditData.email || null
      }
      if (quickEditData.parent_phone_1 !== selectedStudent.parent_phone_1) {
        updateData.parent_phone_1 = quickEditData.parent_phone_1 || null
      }
      if (quickEditData.parent_phone_2 !== selectedStudent.parent_phone_2) {
        updateData.parent_phone_2 = quickEditData.parent_phone_2 || null
      }
      
      // 변경사항이 있을 때만 업데이트
      if (Object.keys(updateData).length > 0) {
        await actions.updateStudent(studentId, updateData, tenantId)
        toast.dismiss(loadingToast)
        toast.success('정보가 성공적으로 저장되었습니다.')
        
        // 실시간 알림 발송
        notifications.studentUpdate(
          selectedStudent.name,
          '정보가 업데이트되었습니다',
          selectedStudent.id,
          [{
            label: '상세 보기',
            type: 'primary',
            action: () => window.location.reload()
          }]
        )
        
        // 탭 데이터 새로고침
        if (selectedStudent) {
          loadAllTabData({ ...selectedStudent, ...updateData })
        }
      } else {
        toast.dismiss(loadingToast)
        toast.success('변경사항이 없습니다.')
      }
      
      setIsQuickEditing(false)
      setQuickEditData({})
    } catch (error) {
      console.error('빠른 편집 저장 실패:', error)
      toast.dismiss(loadingToast)
      toast.error(error instanceof Error ? error.message : '정보 저장에 실패했습니다.')
    } finally {
      setIsSavingQuickEdit(false)
    }
  }, [tenantId, selectedStudent, studentId, quickEditData, actions, loadAllTabData])

  // 클래스 등록 핸들러
  const handleClassSelected = useCallback(async (classData: ClassSearchResult) => {
    if (!tenantId || !selectedStudent) return

    setEnrollingInClass(true)
    const loadingToast = toast.loading(`${classData.name} 클래스에 등록하는 중...`)
    
    try {
      const supabase = require('@supabase/ssr').createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('인증 토큰이 없습니다')
      }

      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenantId,
          studentId: selectedStudent.id,
          classId: classData.id,
          packageId: null,
          finalPrice: 0,
          notes: `학생 상세보기에서 ${classData.name} 클래스에 배정`
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '클래스 등록 실패')
      }

      toast.dismiss(loadingToast)
      toast.success(`${selectedStudent.name} 학생이 ${classData.name} 클래스에 성공적으로 등록되었습니다.`)
      
      // 수강 현황 데이터 새로고침
      loadAllTabData(selectedStudent)
      setShowClassSelector(false)

    } catch (error) {
      console.error('클래스 등록 중 오류:', error)
      toast.dismiss(loadingToast)
      toast.error(error instanceof Error ? error.message : '클래스 등록에 실패했습니다.')
    } finally {
      setEnrollingInClass(false)
    }
  }, [tenantId, selectedStudent, loadAllTabData])

  // 휴원/복원 핸들러
  const handleLeave = useCallback(async () => {
    if (!tenantId || !selectedStudent) {
      console.error('❌ 휴원 처리 실패: tenantId 또는 selectedStudent가 없음', {
        tenantId,
        selectedStudent: selectedStudent?.id
      })
      return
    }

    setIsProcessingLeave(true)
    
    try {
      const isCurrentlyOnLeave = selectedStudent.status === 'inactive'
      const newStatus = isCurrentlyOnLeave ? 'active' : 'inactive'
      const actionText = isCurrentlyOnLeave ? '복원' : '휴원'

      console.log('🔄 학생 상태 변경 시작:', {
        studentId,
        currentStatus: selectedStudent.status,
        newStatus,
        tenantId,
        actionText
      })

      // 개발 환경에서만 간단한 fetch 테스트
      if (process.env.NODE_ENV === 'development') {
        console.log('🧪 [DEBUG] 직접 fetch 테스트 시작')
        try {
          const testResponse = await fetch(`/api/students/${studentId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          console.log('🧪 [DEBUG] GET 요청 테스트 결과:', {
            ok: testResponse.ok,
            status: testResponse.status,
            statusText: testResponse.statusText
          })
        } catch (testError) {
          console.error('🧪 [DEBUG] GET 요청 테스트 실패:', testError)
        }
      }

      const result = await actions.updateStudent(studentId, { status: newStatus }, tenantId)
      
      console.log('✅ 학생 상태 변경 성공:', result)
      
      toast.success(`학생이 ${actionText} 처리되었습니다.`)
      
      // 탭 데이터 새로고침
      if (selectedStudent) {
        loadAllTabData({ ...selectedStudent, status: newStatus })
      }
    } catch (error) {
      console.error('❌ 학생 상태 변경 실패:', {
        error,
        errorMessage: error instanceof Error ? error.message : '알 수 없는 오류',
        stack: error instanceof Error ? error.stack : undefined
      })
      toast.error(error instanceof Error ? error.message : '상태 변경에 실패했습니다.')
    } finally {
      setIsProcessingLeave(false)
      setShowLeaveModal(false)
    }
  }, [tenantId, selectedStudent, studentId, actions, loadAllTabData])

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
      
      router.push('/main/students')
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
    <ResponsiveStudentLayout showSearchSidebar={true} searchContext="students" enableGridLayout={false}>
      <div className="container mx-auto p-6 max-w-5xl">
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

        <div className="flex items-center space-x-3">
          {/* 실시간 알림 벨 */}
          <NotificationBell className="hidden lg:flex" />
          
          <Button onClick={handleEdit} variant="outline">
            <PencilIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">편집</span>
          </Button>
          <Button 
            onClick={() => setShowLeaveModal(true)}
            variant="outline"
            className={
              student.status === 'inactive' 
                ? 'border-green-300 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20' 
                : 'border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
            }
          >
            <PauseIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{student.status === 'inactive' ? '복원' : '휴원'}</span>
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

      {/* 빠른 액션 버튼들 */}
      <div className="mb-6">
        <QuickActions 
          student={student} 
          context="profile"
          className="bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm rounded-lg p-4 border border-neutral-200/50 dark:border-neutral-800/50"
        />
      </div>

      {/* 🎯 Phase 2: 5개 탭 상세 정보 시스템 */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabId)} className="space-y-6">
        {/* 🎯 UX 가이드: 아이콘 + 텍스트 탭 레이블 */}
        <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-white shadow-sm border">
          {TAB_CONFIGS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const isLoaded = tabData[tab.id].loaded
            
            // 탭별 배지 정보 계산
            const getBadgeInfo = () => {
              switch (tab.id) {
                case 'basic':
                  return selectedStudent?.status === 'active' 
                    ? { count: '✓', color: 'bg-green-500', textColor: 'text-white' }
                    : { count: '!', color: 'bg-yellow-500', textColor: 'text-white' }
                    
                case 'enrollment':
                  const enrollmentCount = tabData.enrollment?.classes?.length || 0
                  return enrollmentCount > 0 
                    ? { count: enrollmentCount, color: 'bg-blue-500', textColor: 'text-white' }
                    : { count: 0, color: 'bg-gray-300', textColor: 'text-gray-600' }
                    
                case 'consultation':
                  const consultationCount = (tabData.consultation?.records?.length || 0) + 
                                          (tabData.consultation?.upcoming?.length || 0)
                  return consultationCount > 0
                    ? { count: consultationCount, color: 'bg-purple-500', textColor: 'text-white' }
                    : { count: 0, color: 'bg-gray-300', textColor: 'text-gray-600' }
                    
                case 'payment':
                  const unpaidCount = tabData.payment?.unpaid?.length || 0
                  return unpaidCount > 0
                    ? { count: unpaidCount, color: 'bg-red-500', textColor: 'text-white' }
                    : { count: '✓', color: 'bg-green-500', textColor: 'text-white' }
                    
                case 'learning':
                  const hasGrades = (tabData.learning?.grades?.length || 0) > 0
                  return hasGrades
                    ? { count: '📊', color: 'bg-indigo-500', textColor: 'text-white' }
                    : { count: '-', color: 'bg-gray-300', textColor: 'text-gray-600' }
                    
                default:
                  return { count: '-', color: 'bg-gray-300', textColor: 'text-gray-600' }
              }
            }
            
            const badgeInfo = getBadgeInfo()
            
            return (
              <TabsTrigger 
                key={tab.id}
                value={tab.id}
                className={`
                  relative flex flex-col items-center p-4 space-y-2 text-sm transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center space-x-2 relative">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="font-medium">{tab.label}</span>
                  
                  {/* 진행 상태 인디케이터 */}
                  {isLoaded && (
                    <div className="absolute -top-1 -right-1">
                      <CheckCircleIcon className="h-3 w-3 text-green-500 bg-white rounded-full" />
                    </div>
                  )}
                  
                  {/* 배지 시스템 */}
                  <div className={`
                    min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium
                    flex items-center justify-center
                    ${badgeInfo.color} ${badgeInfo.textColor}
                  `}>
                    {badgeInfo.count}
                  </div>
                </div>
                
                <span className="text-xs text-gray-500 hidden md:block text-center leading-tight">
                  {tab.description}
                </span>
                
                {/* 활성 탭 인디케이터 */}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* 기본 정보 탭 */}
        <TabsContent value="basic" className="space-y-6">
          <SmartGrid 
            gap={20}
            maxColumns={{
              xs: 1,
              sm: 1,
              md: 2,
              lg: 2,
              xl: 2,
              '2xl': 3
            }}
          >
            {/* 퀵 스탯 카드들 */}
            <GridItem size={{ cols: { xs: 1, sm: 1, md: 2, lg: 2, xl: 2, '2xl': 3 }, minHeight: '120px' }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <QuickStatsCard
                  title="출석률"
                  value="92%"
                  label="지난 30일"
                  badge={{ text: '우수', color: 'bg-green-500 text-white' }}
                  trend="up"
                  change="+5%"
                />
                <QuickStatsCard
                  title="수강 클래스"
                  value={tabData.enrollment.classes?.length || 0}
                  label="현재 진행"
                  badge={{ text: '활동중', color: 'bg-blue-500 text-white' }}
                />
                <QuickStatsCard
                  title="미납금"
                  value="0원"
                  label="납입 상태"
                  badge={{ text: '완납', color: 'bg-green-500 text-white' }}
                  trend="neutral"
                />
                <QuickStatsCard
                  title="상담 예정"
                  value="2회"
                  label="이번 달"
                  badge={{ text: '예정', color: 'bg-orange-500 text-white' }}
                />
              </div>
            </GridItem>
            
            {/* 학생 정보 - 개선된 프로필 카드 */}
            <GridItem size={WidgetSizes.medium}>
              <StudentInfoCard
                title="학생 프로필"
                subtitle="기본 정보 및 상태"
                icon={UserIcon}
                badge={{
                  text: statusText[student.status as keyof typeof statusText],
                  color: student.status === 'active' ? 'bg-green-500 text-white' : 
                         student.status === 'inactive' ? 'bg-yellow-500 text-white' :
                         student.status === 'graduated' ? 'bg-blue-500 text-white' : 
                         'bg-red-500 text-white'
                }}
                className="h-full"
              >
                {/* 프로필 요약 정보 */}
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar className="w-16 h-16 border-2 border-white shadow-lg">
                    <AvatarImage src="" alt={student.name} />
                    <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-educanvas-500 to-wisdom-500 text-white">
                      {student.name?.charAt(0) || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{student.name}</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {student.student_number && `#${student.student_number} • `}
                      {student.grade_level} • {student.school_name || '학교 정보 없음'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className={clsx(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                        student.status === 'active' && "bg-green-100 text-green-700",
                        student.status === 'inactive' && "bg-yellow-100 text-yellow-700",
                        student.status === 'graduated' && "bg-blue-100 text-blue-700",
                        student.status === 'withdrawn' && "bg-orange-100 text-orange-700",
                        student.status === 'suspended' && "bg-red-100 text-red-700"
                      )}>
                        {student.status === 'active' && <CheckCircleIcon className="w-3 h-3" />}
                        {student.status === 'inactive' && <PauseIcon className="w-3 h-3" />}
                        {student.status === 'graduated' && <AcademicCapIcon className="w-3 h-3" />}
                        {student.status === 'withdrawn' && <XCircleIcon className="w-3 h-3" />}
                        {student.status === 'suspended' && <ExclamationTriangleIcon className="w-3 h-3" />}
                        {statusText[student.status as keyof typeof statusText]}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 연락처 정보 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <PhoneIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">학생</p>
                      <a
                        href={student.phone ? `tel:${student.phone}` : '#'}
                        className="font-medium text-neutral-900 dark:text-neutral-100 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {student.phone || '등록되지 않음'}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <PhoneIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">학부모</p>
                      <a
                        href={student.parent_phone_1 ? `tel:${student.parent_phone_1}` : '#'}
                        className="font-medium text-neutral-900 dark:text-neutral-100 hover:text-green-600 dark:hover:text-green-400"
                      >
                        {student.parent_phone_1 || '등록되지 않음'}
                      </a>
                    </div>
                  </div>
                </div>

                {/* 빠른 액션 버튼들 */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleQuickEdit}
                    className="flex-1"
                  >
                    <PencilIcon className="w-4 h-4 mr-2" />
                    편집
                  </Button>
                </div>
              </StudentInfoCard>
            </GridItem>

            {/* 학부모 정보 카드 */}
            <GridItem size={WidgetSizes.medium}>
              <StudentInfoCard
                title="학부모 정보"
                subtitle="보호자 연락처"
                icon={UserIcon}
                className="h-full"
              >
                {/* 학부모 연락처 목록 */}
                <div className="space-y-3">
                  {student.parent_name_1 && (
                    <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                      <Avatar className="w-10 h-10 bg-green-100 dark:bg-green-900/30">
                        <AvatarFallback className="text-green-700 dark:text-green-300 font-semibold">
                          {student.parent_name_1?.charAt(0) || 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">{student.parent_name_1}</p>
                        <a
                          href={student.parent_phone_1 ? `tel:${student.parent_phone_1}` : '#'}
                          className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-green-600 dark:hover:text-green-400"
                        >
                          {student.parent_phone_1 || '연락처 없음'}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {student.parent_name_2 && (
                    <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                      <Avatar className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30">
                        <AvatarFallback className="text-emerald-700 dark:text-emerald-300 font-semibold">
                          {student.parent_name_2?.charAt(0) || 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">{student.parent_name_2}</p>
                        <a
                          href={student.parent_phone_2 ? `tel:${student.parent_phone_2}` : '#'}
                          className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                        >
                          {student.parent_phone_2 || '연락처 없음'}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {/* 학부모 정보가 없는 경우 */}
                  {!student.parent_name_1 && !student.parent_name_2 && !student.parent_phone_1 && !student.parent_phone_2 && (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-full mx-auto mb-3 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-neutral-400" />
                      </div>
                      <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-3">등록된 학부모 정보가 없습니다</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/main/students/${studentId}/edit`)}
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        정보 추가
                      </Button>
                    </div>
                  )}
                </div>
              </StudentInfoCard>
            </GridItem>
          </SmartGrid>
        </TabsContent>

        {/* 수강 현황 탭 */}
        <TabsContent value="enrollment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 현재 수강 클래스 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AcademicCapIcon className="h-5 w-5 text-blue-600" />
                    <span>현재 수강 클래스</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClassSelector(true)}
                    disabled={enrollingInClass}
                    className="flex items-center space-x-1"
                  >
                    <AcademicCapIcon className="h-4 w-4" />
                    <span>클래스 추가</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tabData.enrollment.loaded ? (
                  <div className="space-y-3">
                    {tabData.enrollment.classes.length > 0 ? (
                      tabData.enrollment.classes.map((cls) => (
                        <div key={cls.id} className="p-3 border rounded-lg">
                          <h4 className="font-medium text-gray-900">{cls.name}</h4>
                          <p className="text-sm text-gray-600">담당: {(cls as any).instructor || cls.instructor_id}</p>
                          <p className="text-sm text-gray-500">{(cls as any).schedule || '스케줄 정보 없음'}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <AcademicCapIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium">등록된 클래스가 없습니다</p>
                        <p className="text-sm mb-4">새 클래스에 학생을 등록해보세요</p>
                        <Button
                          variant="outline"
                          onClick={() => setShowClassSelector(true)}
                          disabled={enrollingInClass}
                          className="flex items-center space-x-2 mx-auto"
                        >
                          <AcademicCapIcon className="h-4 w-4" />
                          <span>클래스 추가</span>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <LoadingPlaceholder className="h-24" />
                )}
              </CardContent>
            </Card>

            {/* 최근 출석 현황 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5 text-green-600" />
                  <span>최근 출석 현황</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tabData.enrollment.loaded ? (
                  <div className="space-y-2">
                    {tabData.enrollment.attendance.map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border-b last:border-b-0">
                        <span className="text-sm">{(record as any).date || record.attendance_date}</span>
                        <Badge variant={record.status === 'present' ? 'default' : record.status === 'late' ? 'secondary' : 'destructive'}>
                          {record.status === 'present' ? '출석' : record.status === 'late' ? '지각' : '결석'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <LoadingPlaceholder className="h-24" />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 상담 내역 탭 */}
        <TabsContent value="consultation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 상담 기록 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-600" />
                  <span>상담 기록</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tabData.consultation.loaded ? (
                  <div className="space-y-4">
                    {tabData.consultation.records.map((record) => (
                      <div key={record.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{(record as any).topic || record.agenda}</h4>
                          <span className="text-sm text-gray-500">{(record as any).date || record.scheduled_at}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">담당: {(record as any).counselor || record.counselor_id}</p>
                        <p className="text-sm text-gray-700">{(record as any).summary || record.notes}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <LoadingPlaceholder className="h-32" />
                )}
              </CardContent>
            </Card>

            {/* 예정된 상담 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5 text-orange-600" />
                  <span>예정된 상담</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tabData.consultation.loaded ? (
                  <div className="space-y-3">
                    {tabData.consultation.upcoming.map((upcoming) => (
                      <div key={upcoming.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-orange-900">{(upcoming as any).topic || upcoming.agenda}</h4>
                          <span className="text-sm text-orange-700">{(upcoming as any).date || upcoming.scheduled_at}</span>
                        </div>
                        <p className="text-sm text-orange-600">담당: {(upcoming as any).counselor || upcoming.counselor_id}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <LoadingPlaceholder className="h-24" />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 납입 내역 탭 */}
        <TabsContent value="payment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 결제 이력 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCardIcon className="h-5 w-5 text-green-600" />
                  <span>최근 결제 이력</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tabData.payment.loaded ? (
                  <div className="space-y-3">
                    {tabData.payment.history.slice(0, 3).map((payment) => (
                      <div key={payment.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900">{(payment as any).course || '코스'}</h4>
                          <Badge variant="default">{payment.status === 'completed' ? '완료' : '대기'}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{(payment as any).date || payment.payment_date}</span>
                          <span className="font-medium text-gray-900">{payment.amount.toLocaleString()}원</span>
                        </div>
                        <span className="text-xs text-gray-500">{(payment as any).method || payment.payment_method}</span>
                      </div>
                    ))}
                    {tabData.payment.history.length > 3 && (
                      <Button variant="outline" className="w-full">
                        더 보기 ({tabData.payment.history.length - 3}건 더)
                      </Button>
                    )}
                  </div>
                ) : (
                  <LoadingPlaceholder className="h-32" />
                )}
              </CardContent>
            </Card>

            {/* 다음 청구 예정 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5 text-blue-600" />
                  <span>다음 청구 예정</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tabData.payment.loaded ? (
                  <div className="space-y-3">
                    {tabData.payment.nextDue.map((due) => (
                      <div key={due.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-900">{(due as any).course || '코스'}</h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-blue-700">청구 예정일: {(due as any).dueDate || due.due_date}</span>
                          <span className="font-medium text-blue-900">{due.amount.toLocaleString()}원</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <LoadingPlaceholder className="h-24" />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 학습 기록 탭 */}
        <TabsContent value="learning" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 성적 현황 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                  <span>최근 성적</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tabData.learning.loaded ? (
                  <div className="space-y-3">
                    {tabData.learning.grades.map((grade, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900">{(grade as any).subject || '과목 정보 없음'}</h4>
                          <span className="text-lg font-bold text-indigo-600">{(grade as any).score || 0}점</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{(grade as any).test || '시험 정보 없음'}</span>
                          <span className="text-gray-500">{(grade as any).date || (grade as any).created_at}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <LoadingPlaceholder className="h-32" />
                )}
              </CardContent>
            </Card>

            {/* 과제 현황 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpenIcon className="h-5 w-5 text-yellow-600" />
                  <span>과제 현황</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tabData.learning.loaded ? (
                  <div className="space-y-3">
                    {tabData.learning.assignments.map((assignment, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900">{(assignment as any).title || '과제 제목 없음'}</h4>
                          {(assignment as any).status === 'submitted' ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircleIcon className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">마감일: {(assignment as any).dueDate || (assignment as any).due_date}</span>
                          <Badge variant={(assignment as any).status === 'submitted' ? 'default' : 'destructive'}>
                            {(assignment as any).status === 'submitted' ? '제출완료' : '미제출'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <LoadingPlaceholder className="h-32" />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 플로팅 빠른 액션 (모바일) */}
      <FloatingQuickActions student={student} visible={true} />

      {/* 휴원 확인 모달 */}
      <LeaveConfirmModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={handleLeave}
        studentName={student.name}
        currentStatus={student.status || 'active'}
        isProcessing={isProcessingLeave}
      />

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        studentName={student.name}
        isDeleting={isDeleting}
      />

      {/* 클래스 선택 Modal */}
      <ClassSearchSelector
        isOpen={showClassSelector}
        onClose={() => setShowClassSelector(false)}
        onClassSelected={handleClassSelected}
        allowMultiple={false}
        activeOnly={true}
        title="클래스 선택"
        description={`${student.name} 학생을 등록할 클래스를 선택하세요`}
      />

      {/* 등록 처리 중 오버레이 */}
      {enrollingInClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>클래스에 등록하고 있습니다...</span>
          </div>
        </div>
      )}
      </div>
    </ResponsiveStudentLayout>
  )
}