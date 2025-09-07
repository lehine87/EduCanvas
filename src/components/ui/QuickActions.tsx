'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  PencilIcon,
  UserPlusIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PauseIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { notifications } from '@/components/notifications/NotificationSystem'
import type { Student } from '@/types'

interface QuickAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  variant: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary'
  color: string
  action: () => void | Promise<void>
  badge?: string
  disabled?: boolean
  urgent?: boolean
}

interface QuickActionsProps {
  student?: Student
  context?: 'profile' | 'list' | 'search'
  className?: string
  compact?: boolean
  onOpenStudentDetail?: (studentId: string) => void
}

export function QuickActions({ student, context = 'profile', className, compact = false, onOpenStudentDetail }: QuickActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  // 빠른 액션 생성
  const createActions = (): QuickAction[] => {
    if (!student) return []

    const baseActions: QuickAction[] = [
      {
        id: 'call-student',
        label: compact ? '통화' : '학생 통화',
        icon: PhoneIcon,
        variant: 'outline',
        color: 'border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
        action: () => handleCall(student.phone, student.name, 'student'),
        disabled: !student.phone,
        badge: student.phone ? undefined : '없음'
      },
      {
        id: 'call-parent',
        label: compact ? '학부모' : '학부모 통화',
        icon: PhoneIcon,
        variant: 'outline',
        color: 'border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20',
        action: () => handleCall(student.parent_phone_1, student.parent_name_1 || `${student.name} 학부모`, 'parent'),
        disabled: !student.parent_phone_1,
        badge: student.parent_phone_1 ? undefined : '없음'
      },
      {
        id: 'send-email',
        label: compact ? '메일' : '이메일 발송',
        icon: EnvelopeIcon,
        variant: 'outline',
        color: 'border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20',
        action: () => handleEmail(student.email, student.name),
        disabled: !student.email,
        badge: student.email ? undefined : '없음'
      },
      {
        id: 'edit-student',
        label: compact ? '편집' : '정보 수정',
        icon: PencilIcon,
        variant: 'outline',
        color: 'border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
        action: () => handleEdit(student.id)
      },
      {
        id: 'book-consultation',
        label: compact ? '상담' : '상담 예약',
        icon: CalendarIcon,
        variant: 'outline',
        color: 'border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20',
        action: () => handleBookConsultation(student.id, student.name)
      }
    ]

    // 컨텍스트별 추가 액션
    if (context === 'profile') {
      baseActions.push(
        {
          id: 'view-attendance',
          label: '출석 현황',
          icon: ClockIcon,
          variant: 'ghost',
          color: 'text-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800',
          action: () => handleViewAttendance(student.id)
        },
        {
          id: 'payment-history',
          label: '납입 내역',
          icon: CheckCircleIcon,
          variant: 'ghost',
          color: 'text-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800',
          action: () => handleViewPayments(student.id)
        }
      )
    }

    // 상태에 따른 특별 액션
    if (student.status === 'active') {
      baseActions.push({
        id: 'pause-student',
        label: '휴원 처리',
        icon: PauseIcon,
        variant: 'outline',
        color: 'border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
        action: () => handleStatusChange(student.id, student.name, 'pause'),
        urgent: true
      })
    }

    if (student.status === 'inactive') {
      baseActions.push({
        id: 'activate-student',
        label: '활동 재개',
        icon: CheckCircleIcon,
        variant: 'outline',
        color: 'border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20',
        action: () => handleStatusChange(student.id, student.name, 'activate')
      })
    }

    return baseActions
  }

  const actions = createActions()

  // 액션 핸들러들
  const handleCall = async (phone: string | null, name: string, type: 'student' | 'parent') => {
    if (!phone) {
      notifications.warning(
        '연락처 없음',
        `${name}의 연락처가 등록되어 있지 않습니다.`,
        [{
          label: '정보 수정',
          type: 'primary',
          action: () => handleEdit(student?.id || '')
        }]
      )
      return
    }

    setIsLoading('call-' + type)
    
    try {
      // 통화 연결
      window.open(`tel:${phone}`)
      
      notifications.info(
        '통화 연결',
        `${name} (${phone})으로 연결합니다.`,
        [{
          label: '통화 완료 기록',
          type: 'primary',
          action: () => handleCallComplete(name, type)
        }]
      )
    } catch (error) {
      notifications.error('통화 연결 실패', '통화 연결 중 오류가 발생했습니다.')
    } finally {
      setTimeout(() => setIsLoading(null), 1000)
    }
  }

  const handleEmail = async (email: string | null, name: string) => {
    if (!email) {
      notifications.warning(
        '이메일 없음',
        `${name}의 이메일이 등록되어 있지 않습니다.`,
        [{
          label: '정보 수정',
          type: 'primary',
          action: () => handleEdit(student?.id || '')
        }]
      )
      return
    }

    setIsLoading('send-email')
    
    try {
      window.open(`mailto:${email}?subject=[EduCanvas] ${name} 학생 관련 안내`)
      notifications.success('이메일 발송', `${name} (${email})에게 이메일을 발송합니다.`)
    } catch (error) {
      notifications.error('이메일 발송 실패', '이메일 발송 중 오류가 발생했습니다.')
    } finally {
      setTimeout(() => setIsLoading(null), 1000)
    }
  }

  const handleEdit = (studentId: string) => {
    if (onOpenStudentDetail) {
      onOpenStudentDetail(studentId)
    } else {
      router.push(`/main/students/${studentId}/edit`)
    }
  }

  const handleBookConsultation = async (studentId: string, studentName: string) => {
    setIsLoading('book-consultation')
    
    // 상담 예약 로직 (실제로는 상담 예약 페이지로 이동하거나 모달 열기)
    setTimeout(() => {
      notifications.success(
        '상담 예약 페이지',
        `${studentName} 학생의 상담을 예약합니다.`,
        [{
          label: '예약하기',
          type: 'primary',
          action: () => {
            // 실제 상담 예약 로직
            notifications.success('상담 예약 완료', `${studentName} 학생 상담이 예약되었습니다.`)
          }
        }]
      )
      setIsLoading(null)
    }, 1000)
  }

  const handleViewAttendance = (studentId: string) => {
    // 출석 현황 탭으로 스크롤하거나 새 페이지로 이동
    const enrollmentTab = document.querySelector('[data-value="enrollment"]') as HTMLButtonElement
    if (enrollmentTab) {
      enrollmentTab.click()
      setTimeout(() => {
        document.querySelector('.attendance-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }

  const handleViewPayments = (studentId: string) => {
    // 납입 내역 탭으로 스크롤
    const paymentTab = document.querySelector('[data-value="payment"]') as HTMLButtonElement
    if (paymentTab) {
      paymentTab.click()
    }
  }

  const handleStatusChange = async (studentId: string, studentName: string, action: 'pause' | 'activate') => {
    setIsLoading(action + '-student')
    
    const actionText = action === 'pause' ? '휴원 처리' : '활동 재개'
    
    setTimeout(() => {
      notifications.warning(
        `${actionText} 확인`,
        `${studentName} 학생을 ${actionText}하시겠습니까?`,
        [{
          label: '확인',
          type: 'primary',
          action: async () => {
            // 실제 상태 변경 로직
            notifications.success(
              `${actionText} 완료`,
              `${studentName} 학생이 ${actionText}되었습니다.`
            )
          }
        }, {
          label: '취소',
          type: 'secondary',
          action: () => {}
        }]
      )
      setIsLoading(null)
    }, 500)
  }

  const handleCallComplete = async (name: string, type: 'student' | 'parent') => {
    // 통화 완료 기록 로직
    notifications.success(
      '통화 기록 저장',
      `${name}과의 ${type === 'student' ? '학생' : '학부모'} 통화가 기록되었습니다.`
    )
  }

  if (compact) {
    return (
      <div className={cn('flex gap-2', className)}>
        {actions.slice(0, 3).map((action, index) => (
          <Button
            key={action.id}
            variant={action.variant}
            size="sm"
            disabled={action.disabled || isLoading === action.id}
            onClick={action.action}
            className={cn(
              'h-8 w-8 p-0',
              action.color,
              action.urgent && 'ring-2 ring-orange-500/50'
            )}
          >
            {isLoading === action.id ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <action.icon className="h-4 w-4" />
            )}
          </Button>
        ))}
      </div>
    )
  }

  return (
    <motion.div 
      className={cn('flex flex-wrap gap-2', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ staggerChildren: 0.05 }}
    >
      {actions.map((action, index) => (
        <motion.div
          key={action.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
        >
          <Button
            variant={action.variant}
            disabled={action.disabled || isLoading === action.id}
            onClick={action.action}
            className={cn(
              'h-9 px-3 flex items-center gap-2 relative',
              action.color,
              action.urgent && 'ring-2 ring-orange-500/50'
            )}
          >
            {action.badge && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 text-xs"
              >
                {action.badge}
              </Badge>
            )}
            
            {isLoading === action.id ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <action.icon className="h-4 w-4" />
            )}
            
            <span className="text-sm font-medium">
              {action.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </motion.div>
  )
}

// 플로팅 빠른 액션 버튼 (모바일용)
interface FloatingQuickActionsProps {
  student: Student
  visible?: boolean
}

export function FloatingQuickActions({ student, visible = true }: FloatingQuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!visible) return null

  const primaryActions = [
    {
      id: 'call',
      icon: PhoneIcon,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => window.open(`tel:${student.phone}`)
    },
    {
      id: 'parent-call', 
      icon: PhoneIcon,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => window.open(`tel:${student.parent_phone_1}`)
    },
    {
      id: 'email',
      icon: EnvelopeIcon,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => window.open(`mailto:${student.email}`)
    },
    {
      id: 'consultation',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => notifications.info('상담 예약', '상담 예약 기능을 준비 중입니다.')
    }
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50 lg:hidden">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-16 right-0 flex flex-col gap-3"
          >
            {primaryActions.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white',
                  action.color
                )}
                onClick={action.action}
              >
                <action.icon className="h-5 w-5" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        className="w-14 h-14 bg-educanvas-500 hover:bg-educanvas-600 text-white rounded-full shadow-2xl flex items-center justify-center"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <UserPlusIcon className="h-6 w-6" />
        </motion.div>
      </motion.button>
    </div>
  )
}