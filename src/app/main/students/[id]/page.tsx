'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
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
    classes: any[]
    attendance: any[]
    schedule: any[]
    loaded: boolean
  }
  consultation: {
    records: any[]
    upcoming: any[]
    notes: any[]
    loaded: boolean
  }
  payment: {
    history: any[]
    unpaid: any[]
    nextDue: any[]
    loaded: boolean
  }
  learning: {
    grades: any[]
    assignments: any[]
    progress: any[]
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
      const [enrollmentData, consultationData, paymentData, learningData] = await Promise.allSettled([
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
            { id: 1, date: '2024-08-01', amount: 200000, method: '카드', status: 'paid', course: '수학 고급반' },
            { id: 2, date: '2024-07-01', amount: 150000, method: '계좌이체', status: 'paid', course: '영어 회화반' }
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

      // 탭 데이터 업데이트
      setTabData(prev => ({
        basic: { student, loaded: true },
        enrollment: {
          ...prev.enrollment,
          ...(enrollmentData.status === 'fulfilled' ? enrollmentData.value : {}),
          loaded: true
        },
        consultation: {
          ...prev.consultation,
          ...(consultationData.status === 'fulfilled' ? consultationData.value : {}),
          loaded: true
        },
        payment: {
          ...prev.payment,
          ...(paymentData.status === 'fulfilled' ? paymentData.value : {}),
          loaded: true
        },
        learning: {
          ...prev.learning,
          ...(learningData.status === 'fulfilled' ? learningData.value : {}),
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

        <div className="flex space-x-3">
          <Button onClick={handleEdit} variant="outline">
            <PencilIcon className="h-4 w-4 mr-2" />
            편집
          </Button>
          <Button 
            onClick={() => setShowLeaveModal(true)}
            variant="outline"
            className={
              student.status === 'inactive' 
                ? 'border-green-300 text-green-700 hover:bg-green-50' 
                : 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
            }
          >
            <PauseIcon className="h-4 w-4 mr-2" />
            {student.status === 'inactive' ? '복원' : '휴원'}
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

      {/* 🎯 Phase 2: 5개 탭 상세 정보 시스템 */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabId)} className="space-y-6">
        {/* 🎯 UX 가이드: 아이콘 + 텍스트 탭 레이블 */}
        <TabsList className="grid w-full grid-cols-5 h-auto p-1">
          {TAB_CONFIGS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const isLoaded = tabData[tab.id].loaded
            
            return (
              <TabsTrigger 
                key={tab.id}
                value={tab.id}
                className={`flex flex-col items-center p-4 space-y-2 text-sm ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="font-medium">{tab.label}</span>
                  {isLoaded && (
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <span className="text-xs text-gray-500 hidden md:block">
                  {tab.description}
                </span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* 기본 정보 탭 */}
        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 학생 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                  <span>학생 정보</span>
                </CardTitle>
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
                <CardTitle className="flex items-center space-x-2">
                  <UserIcon className="h-5 w-5 text-green-600" />
                  <span>학부모 정보</span>
                </CardTitle>
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

          {/* 점진적 공개: 메모 및 시스템 정보 */}
          <div className="space-y-4">
            {student.notes && (
              <ProgressiveDisclosure title="메모" defaultExpanded={false}>
                <p className="text-gray-700 whitespace-pre-wrap">{student.notes}</p>
              </ProgressiveDisclosure>
            )}

            <ProgressiveDisclosure title="시스템 정보" defaultExpanded={false}>
              <div className="space-y-2">
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
              </div>
            </ProgressiveDisclosure>
          </div>
        </TabsContent>

        {/* 수강 현황 탭 */}
        <TabsContent value="enrollment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 현재 수강 클래스 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AcademicCapIcon className="h-5 w-5 text-blue-600" />
                  <span>현재 수강 클래스</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tabData.enrollment.loaded ? (
                  <div className="space-y-3">
                    {tabData.enrollment.classes.map((cls) => (
                      <div key={cls.id} className="p-3 border rounded-lg">
                        <h4 className="font-medium text-gray-900">{cls.name}</h4>
                        <p className="text-sm text-gray-600">담당: {cls.instructor}</p>
                        <p className="text-sm text-gray-500">{cls.schedule}</p>
                      </div>
                    ))}
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
                        <span className="text-sm">{record.date}</span>
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
                          <h4 className="font-medium text-gray-900">{record.topic}</h4>
                          <span className="text-sm text-gray-500">{record.date}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">담당: {record.counselor}</p>
                        <p className="text-sm text-gray-700">{record.summary}</p>
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
                          <h4 className="font-medium text-orange-900">{upcoming.topic}</h4>
                          <span className="text-sm text-orange-700">{upcoming.date}</span>
                        </div>
                        <p className="text-sm text-orange-600">담당: {upcoming.counselor}</p>
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
                          <h4 className="font-medium text-gray-900">{payment.course}</h4>
                          <Badge variant="default">{payment.status === 'paid' ? '완료' : '대기'}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{payment.date}</span>
                          <span className="font-medium text-gray-900">{payment.amount.toLocaleString()}원</span>
                        </div>
                        <span className="text-xs text-gray-500">{payment.method}</span>
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
                        <h4 className="font-medium text-blue-900">{due.course}</h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-blue-700">청구 예정일: {due.dueDate}</span>
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
                          <h4 className="font-medium text-gray-900">{grade.subject}</h4>
                          <span className="text-lg font-bold text-indigo-600">{grade.score}점</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{grade.test}</span>
                          <span className="text-gray-500">{grade.date}</span>
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
                          <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                          {assignment.status === 'submitted' ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircleIcon className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">마감일: {assignment.dueDate}</span>
                          <Badge variant={assignment.status === 'submitted' ? 'default' : 'destructive'}>
                            {assignment.status === 'submitted' ? '제출완료' : '미제출'}
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

      {/* 휴원 확인 모달 */}
      <LeaveConfirmModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={handleLeave}
        studentName={student.name}
        currentStatus={student.status}
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
    </div>
  )
}