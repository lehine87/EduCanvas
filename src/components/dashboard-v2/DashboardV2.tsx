'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/useAuthStore'
import { SmartGrid, GridItem, WidgetSizes } from './core/SmartGrid'
import { DraggableGrid } from './core/DraggableGrid'
import { GlassWidget } from './widgets/GlassWidget'
import { useRoleAdapter, WidgetConfig, UserRoleInfo, inferRoleCategory } from './core/RoleAdapter'
import { useBackgroundConfig, getCompleteCardShadow } from './backgrounds'
import { UnifiedBackgroundSystem } from './backgrounds/UnifiedBackgroundSystem'
import { Button } from '@/components/ui/button'
import { useDarkMode } from '@/hooks/useDarkMode'
import { AttendanceRealtimeWidget } from './widgets/attendance'

// 🚀 성능 최적화: 위젯 지연 로딩
const RevenueAnalyticsWidget = React.lazy(() => import('./widgets/RevenueAnalyticsWidget'))
const CriticalAlertsWidget = React.lazy(() => import('./widgets/CriticalAlertsWidget'))
const StudentOverviewWidget = React.lazy(() => import('./widgets/StudentOverviewWidget'))
const QuickActionsWidget = React.lazy(() => import('./widgets/QuickActionsWidget'))
const AIInsightsWidget = React.lazy(() => import('./widgets/AIInsightsWidget'))

// Import Icons
import { 
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BellIcon,
  CalendarIcon,
  PhoneIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  SparklesIcon,
  ArrowPathIcon,
  SwatchIcon
} from '@heroicons/react/24/outline'

// Dashboard Stats 타입 정의
interface DashboardStats {
  total_students: number
  active_students: number
  inactive_students: number
  graduated_students: number
  withdrawn_students: number
  suspended_students: number
  urgent_actions: number
  today_attendance: number
  unpaid_students: number
  consultation_scheduled: number
  new_registrations_this_month: number
  recent_activities: Array<{
    id: string
    student_name: string
    action: string
    timestamp: string
  }>
}

// 🚀 성능 최적화: 위젯 컴포넌트들은 별도 파일로 분리하여 지연 로딩

// AttendanceWidget는 이제 AttendanceRealtimeWidget으로 대체됨
// 이 함수는 하위 호환성을 위해 유지하되, 새로운 위젯을 래핑함

// AttendanceWidget는 이제 AttendanceRealtimeWidget으로 대체됨
function AttendanceWidget({ stats }: { stats: DashboardStats | null }) {
  // 새로운 실시간 출석 위젯 사용
  return <AttendanceRealtimeWidget className="h-full" />
}

// 메인 DashboardV2 컴포넌트
export default function DashboardV2() {
  const { profile, loading, initialized, initialize } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // 인증 초기화
  useEffect(() => {
    if (!initialized) {
      initialize()
    }
  }, [initialized, initialize])
  
  // 배경 설정 시스템
  const { config: backgroundConfig } = useBackgroundConfig()
  
  // 다크모드 상태 감지
  const isDark = useDarkMode()
  const cardShadowClass = React.useMemo(() => 
    getCompleteCardShadow({ isDark }), 
    [isDark]
  )
  
  // 성능 최적화: 불필요한 로깅 useEffect 제거됨

  // 현재 사용자 역할 정보 생성 (임시로 tenant_admin 기반)
  const userRoleInfo: UserRoleInfo | null = React.useMemo(() => {
    if (!profile?.role) return null
    
    const roleName = profile.role as string
    const roleCategory = inferRoleCategory(roleName)
    
    // tenant_admin은 모든 권한을 가짐 (임시)
    const permissions = roleName === 'tenant_admin' ? [
      'students.read',
      'students.write', 
      'attendance.read',
      'attendance.write',
      'payments.read',
      'payments.create',
      'analytics.view',
      'classes.read',
      'classes.write'
    ] : []
    
    return {
      roleName,
      roleDisplayName: roleName === 'tenant_admin' ? '학원 관리자' : '직원',
      roleCategory,
      permissions,
      hierarchyLevel: roleName === 'tenant_admin' ? 10 : 1
    }
  }, [profile?.role])

  // 🚀 성능 최적화: 개별 데이터 페칭 함수들
  const fetchDashboardStats = useCallback(async () => {
    if (!profile?.tenant_id) {
      return {
        total_students: 156,
        active_students: 142,
        inactive_students: 14,
        graduated_students: 89,
        withdrawn_students: 12,
        suspended_students: 3,
        urgent_actions: 5,
        today_attendance: 128,
        unpaid_students: 8,
        consultation_scheduled: 12,
        new_registrations_this_month: 23,
        recent_activities: []
      }
    }
    
    const response = await fetch(`/api/students/dashboard-stats?tenantId=${profile.tenant_id}`)
    if (response.ok) {
      const data = await response.json()
      return data.data
    }
    throw new Error('Failed to fetch dashboard stats')
  }, [profile?.tenant_id])

  const fetchAttendanceData = useCallback(async () => {
    if (!profile?.tenant_id) {
      return { attendance_rate: 85, present_today: 128, total_today: 150 }
    }
    
    try {
      const response = await fetch(`/api/dashboard/attendance/realtime?tenantId=${profile.tenant_id}`)
      if (response.ok) {
        const data = await response.json()
        return data.data
      }
    } catch (error) {
      console.log('출석 데이터 로드 실패, 기본값 사용')
    }
    return { attendance_rate: 85, present_today: 128, total_today: 150 }
  }, [profile?.tenant_id])

  const fetchAIInsights = useCallback(async () => {
    // AI 인사이트는 정적 데이터로 즉시 반환 (실제 구현시 API 호출)
    return [
      "수학 클래스 출석률이 10% 증가했습니다",
      "3명의 학생이 레벨업 대상입니다", 
      "김민수 학생의 학부모 상담이 필요합니다"
    ]
  }, [])

  // 🚀 성능 최적화: 모든 데이터를 병렬로 로딩
  const loadAllDashboardData = useCallback(async () => {
    setIsLoadingStats(true)
    try {
      const [dashboardStats, attendanceData, aiInsights] = await Promise.allSettled([
        fetchDashboardStats(),
        fetchAttendanceData(),
        fetchAIInsights()
      ])

      // 각 결과를 개별적으로 처리
      if (dashboardStats.status === 'fulfilled') {
        setStats(dashboardStats.value)
      } else {
        console.error('대시보드 통계 로드 실패:', dashboardStats.reason)
        setStats({
          total_students: 156,
          active_students: 142,
          inactive_students: 14,
          graduated_students: 89,
          withdrawn_students: 12,
          suspended_students: 3,
          urgent_actions: 5,
          today_attendance: 128,
          unpaid_students: 8,
          consultation_scheduled: 12,
          new_registrations_this_month: 23,
          recent_activities: []
        })
      }

      // 출석 및 AI 인사이트 데이터는 나중에 각 위젯에서 개별적으로 처리
      console.log('🚀 병렬 데이터 로딩 완료:', {
        dashboardStats: dashboardStats.status,
        attendanceData: attendanceData.status,
        aiInsights: aiInsights.status
      })
      
    } catch (error) {
      console.error('대시보드 데이터 로딩 실패:', error)
    } finally {
      // 🚀 성능 최적화: 최소 로딩 시간 단축 (200ms) - Layout shift 방지하면서 빠른 로딩
      setTimeout(() => {
        setIsLoadingStats(false)
      }, 200)
    }
  }, [fetchDashboardStats, fetchAttendanceData, fetchAIInsights])

  // 새로고침 핸들러
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadAllDashboardData()
    setTimeout(() => setRefreshing(false), 500) // 시각적 피드백
  }, [loadAllDashboardData])

  useEffect(() => {
    loadAllDashboardData()
  }, [loadAllDashboardData])

  // 🚀 성능 최적화: 위젯 설정 메모이제이션 (새로운 권한 시스템)
  const widgetConfigs: WidgetConfig[] = useMemo(() => [
    {
      id: 'revenue-analytics',
      component: RevenueAnalyticsWidget,
      props: { stats },
      size: 'medium',
      priority: 1,
      roleCategories: ['admin'],
      permissions: ['payments.read', 'analytics.view'],
      title: '매출 분석',
      subtitle: '실시간 수익 현황',
      icon: <ChartBarIcon className="w-5 h-5" />
    },
    {
      id: 'critical-alerts',
      component: CriticalAlertsWidget,
      props: { stats },
      size: 'small',
      priority: 2,
      roleCategories: ['admin', 'instructor', 'staff'],
      title: '긴급 알림',
      subtitle: '즉시 처리 필요',
      icon: <ExclamationTriangleIcon className="w-5 h-5" />
    },
    {
      id: 'student-overview',
      component: StudentOverviewWidget,
      props: { stats },
      size: 'medium',
      priority: 3,
      roleCategories: ['admin', 'instructor'],
      permissions: ['students.read'],
      title: '학생 현황',
      subtitle: '전체 학생 통계',
      icon: <UserGroupIcon className="w-5 h-5" />
    },
    {
      id: 'attendance-realtime',
      component: AttendanceWidget, // 내부적으로 AttendanceRealtimeWidget 사용
      props: { stats },
      size: 'extra-wide', // 초대형 사이즈로 변경
      priority: 4,
      roleCategories: ['instructor', 'staff', 'admin'], // admin도 포함
      permissions: ['attendance.read'],
      title: '실시간 출석 현황',
      subtitle: '오늘의 출석률 및 클래스별 현황',
      icon: <ClockIcon className="w-5 h-5" />
    },
    {
      id: 'quick-actions',
      component: QuickActionsWidget,
      props: {},
      size: 'medium',
      priority: 5,
      roleCategories: ['admin', 'instructor', 'staff'],
      title: '빠른 작업',
      subtitle: '자주 사용하는 기능',
      icon: <Cog6ToothIcon className="w-5 h-5" />
    },
    {
      id: 'ai-insights',
      component: AIInsightsWidget,
      props: {},
      size: 'wide',
      priority: 6,
      roleCategories: ['admin', 'instructor'],
      permissions: ['analytics.view'],
      title: 'AI 인사이트',
      subtitle: '지능형 분석 결과',
      icon: <SparklesIcon className="w-5 h-5" />
    }
  ], [stats])

  // 🚀 성능 최적화: Role Adapter 결과 메모이제이션
  const { 
    widgets: adaptedWidgets, 
    layoutConfig, 
    theme, 
    colors,
    roleInfo
  } = useRoleAdapter(userRoleInfo, widgetConfigs)

  // 🚀 성능 최적화: 어댑티드 위젯 메모이제이션
  const memoizedAdaptedWidgets = useMemo(() => 
    adaptedWidgets.map(widget => ({
      id: widget.id,
      title: widget.title,
      subtitle: widget.subtitle,
      icon: widget.icon,
      component: ({ children, ...props }: any) => (
        <GlassWidget
          opacity={widget.id === 'critical-alerts' ? 'critical' : (theme.styles.primary as any)}
          size="md"
          animate={theme.animations}
          glow={true}
          float={false}
          className={cardShadowClass}
        >
          <React.Suspense fallback={
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-white/30 dark:bg-black/30 rounded w-24"></div>
              <div className="h-8 bg-white/30 dark:bg-black/30 rounded w-32"></div>
              <div className="h-20 bg-white/30 dark:bg-black/30 rounded"></div>
            </div>
          }>
            <widget.component {...widget.props} />
          </React.Suspense>
        </GlassWidget>
      ),
      props: widget.props,
      size: widget.size,
      priority: widget.priority
    })), 
    [adaptedWidgets, theme.styles.primary, theme.animations, cardShadowClass]
  )

  // 🚀 성능 최적화: 콜백 함수들을 미리 정의 (hooks 순서 보장)
  const handleReorder = useCallback((newOrder: string[]) => {
    console.log('새로운 위젯 순서:', newOrder)
    // TODO: 사용자 설정 저장
  }, [])

  const handleSizeChange = useCallback((widgetId: string, newSize: string) => {
    console.log('위젯 크기 변경:', widgetId, newSize)
    // TODO: 사용자 설정 저장
  }, [])

  // 로딩 상태 (Layout Shift 방지용)
  if (isLoadingStats) {
    return (
      <UnifiedBackgroundSystem 
        config={backgroundConfig}
        className="h-full p-6"
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="h-9 bg-white/20 dark:bg-black/20 rounded w-48 mb-2 animate-pulse"></div>
              <div className="h-5 bg-white/20 dark:bg-black/20 rounded w-80 animate-pulse"></div>
            </div>
            <div className="h-10 w-24 bg-white/20 dark:bg-black/20 rounded animate-pulse"></div>
          </div>
          
          {/* 고정된 크기의 스켈레톤 그리드 */}
          <SmartGrid 
            maxColumns={layoutConfig.gridConfig.maxColumns}
            gap={layoutConfig.gridConfig.gap}
            autoFlow={layoutConfig.gridConfig.autoFlow}
            animate={false} // 로딩 중에는 애니메이션 비활성화
          >
            {/* 예상 위젯들과 동일한 크기로 스켈레톤 생성 */}
            <GridItem size={WidgetSizes.medium} animate={false}>
              <div className={`backdrop-blur-sm bg-white/20 dark:bg-black/20 border border-white/20 rounded-xl p-6 h-[220px] ${cardShadowClass}`}>
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-white/30 dark:bg-black/30 rounded w-24"></div>
                  <div className="h-8 bg-white/30 dark:bg-black/30 rounded w-32"></div>
                  <div className="h-20 bg-white/30 dark:bg-black/30 rounded"></div>
                </div>
              </div>
            </GridItem>
            <GridItem size={WidgetSizes.small} animate={false}>
              <div className={`backdrop-blur-sm bg-white/20 dark:bg-black/20 border border-white/20 rounded-xl p-6 h-[180px] ${cardShadowClass}`}>
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-white/30 dark:bg-black/30 rounded w-16"></div>
                  <div className="h-6 bg-white/30 dark:bg-black/30 rounded w-12"></div>
                </div>
              </div>
            </GridItem>
            <GridItem size={WidgetSizes.medium} animate={false}>
              <div className={`backdrop-blur-sm bg-white/20 dark:bg-black/20 border border-white/20 rounded-xl p-6 h-[220px] ${cardShadowClass}`}>
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-white/30 dark:bg-black/30 rounded w-20"></div>
                  <div className="h-8 bg-white/30 dark:bg-black/30 rounded w-24"></div>
                  <div className="h-16 bg-white/30 dark:bg-black/30 rounded"></div>
                </div>
              </div>
            </GridItem>
            <GridItem size={WidgetSizes.small} animate={false}>
              <div className={`backdrop-blur-sm bg-white/20 dark:bg-black/20 border border-white/20 rounded-xl p-6 h-[180px] ${cardShadowClass}`}>
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-white/30 dark:bg-black/30 rounded w-18"></div>
                  <div className="h-8 bg-white/30 dark:bg-black/30 rounded w-16"></div>
                </div>
              </div>
            </GridItem>
            <GridItem size={WidgetSizes.medium} animate={false}>
              <div className={`backdrop-blur-sm bg-white/20 dark:bg-black/20 border border-white/20 rounded-xl p-6 h-[220px] ${cardShadowClass}`}>
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-white/30 dark:bg-black/30 rounded w-20"></div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="h-12 bg-white/30 dark:bg-black/30 rounded"></div>
                    <div className="h-12 bg-white/30 dark:bg-black/30 rounded"></div>
                    <div className="h-12 bg-white/30 dark:bg-black/30 rounded"></div>
                    <div className="h-12 bg-white/30 dark:bg-black/30 rounded"></div>
                  </div>
                </div>
              </div>
            </GridItem>
            <GridItem size={WidgetSizes.wide} animate={false}>
              <div className={`backdrop-blur-sm bg-white/20 dark:bg-black/20 border border-white/20 rounded-xl p-6 h-[180px] ${cardShadowClass}`}>
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-white/30 dark:bg-black/30 rounded w-24"></div>
                  <div className="space-y-2 mt-4">
                    <div className="h-3 bg-white/30 dark:bg-black/30 rounded w-full"></div>
                    <div className="h-3 bg-white/30 dark:bg-black/30 rounded w-3/4"></div>
                    <div className="h-3 bg-white/30 dark:bg-black/30 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </GridItem>
          </SmartGrid>
        </div>
      </UnifiedBackgroundSystem>
    )
  }

  return (
    <UnifiedBackgroundSystem 
      config={backgroundConfig}
      className="min-h-full p-6"
    >
      {/* Hidden failsafe 제거됨 - 배경 간섭 방지 */}
      
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Dashboard v2
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              {roleInfo?.roleCategory === 'admin' && '경영 현황을 한눈에 확인하세요'}
              {roleInfo?.roleCategory === 'instructor' && '오늘의 수업과 학생들을 관리하세요'}  
              {roleInfo?.roleCategory === 'staff' && '운영 업무를 효율적으로 처리하세요'}
              {roleInfo?.roleCategory === 'viewer' && '학원 현황을 조회하세요'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* 배경 설정 버튼 - TODO: BackgroundSettings 컴포넌트 구현 필요 */}
            {/* <BackgroundSettings
              trigger={
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="backdrop-blur-sm bg-white/50 dark:bg-black/20 border-neutral-300 dark:border-white/10 hover:bg-white/70 dark:hover:bg-black/30 text-neutral-700 dark:text-neutral-200"
                >
                  <SwatchIcon className="w-4 h-4" />
                </Button>
              }
            /> */}

            {/* 새로고침 버튼 */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg backdrop-blur-sm bg-white/50 dark:bg-black/20 border border-neutral-300 dark:border-white/10 hover:bg-white/70 dark:hover:bg-black/30 text-neutral-700 dark:text-neutral-200 transition-colors"
            >
              <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>새로고침</span>
            </motion.button>
          </div>
        </motion.div>

        {/* 🚀 성능 최적화: 메모이제이션된 Draggable Widgets Grid */}
        <DraggableGrid
          widgets={memoizedAdaptedWidgets}
          onReorder={handleReorder}
          onSizeChange={handleSizeChange}
        />

      </div>
    </UnifiedBackgroundSystem>
  )
}