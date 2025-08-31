'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/useAuthStore'
import { SmartGrid, GridItem, WidgetSizes } from './core/SmartGrid'
import { GlassWidget } from './widgets/GlassWidget'
import { useRoleAdapter, WidgetConfig, UserRoleInfo, inferRoleCategory } from './core/RoleAdapter'
import { BackgroundSystem, BackgroundSettings, useBackgroundConfig, getCompleteCardShadow } from './backgrounds'
import { Button } from '@/components/ui/button'
import { useDarkMode } from '@/hooks/useDarkMode'
import { AttendanceRealtimeWidget } from './widgets/attendance'

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

// 위젯 컴포넌트들
function RevenueAnalyticsWidget({ stats }: { stats: DashboardStats | null }) {
  const revenue = stats ? stats.active_students * 150000 : 0 // 평균 수강료 가정
  const growth = '+12.5%'
  
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          ₩{revenue.toLocaleString()}
        </div>
        <div className="text-sm text-emerald-600 dark:text-emerald-400">
          {growth} vs 지난달
        </div>
      </div>
      <div className="h-20 bg-gradient-to-r from-blue-100 to-emerald-100 dark:from-blue-900/30 dark:to-emerald-900/30 rounded-lg flex items-end justify-center">
        <div className="text-xs text-neutral-600 dark:text-neutral-400">매출 차트 영역</div>
      </div>
    </div>
  )
}

function CriticalAlertsWidget({ stats }: { stats: DashboardStats | null }) {
  const alerts = stats?.urgent_actions || 0
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
          {alerts}
        </div>
        <motion.div
          animate={{ 
            scale: alerts > 0 ? [1, 1.1, 1] : 1,
            opacity: alerts > 0 ? [1, 0.7, 1] : 1
          }}
          transition={{ 
            duration: 2, 
            repeat: alerts > 0 ? Infinity : 0 
          }}
          className="w-3 h-3 bg-red-500 rounded-full"
        />
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-600 dark:text-neutral-400">미납금</span>
          <span className="font-medium">{stats?.unpaid_students || 0}명</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600 dark:text-neutral-400">장기결석</span>
          <span className="font-medium">2명</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600 dark:text-neutral-400">상담요청</span>
          <span className="font-medium">3건</span>
        </div>
      </div>
    </div>
  )
}

function StudentOverviewWidget({ stats }: { stats: DashboardStats | null }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats?.active_students || 0}
          </div>
          <div className="text-xs text-neutral-600 dark:text-neutral-400">활동중</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats?.new_registrations_this_month || 0}
          </div>
          <div className="text-xs text-neutral-600 dark:text-neutral-400">신규</div>
        </div>
      </div>
      <div className="h-16 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 rounded-lg flex items-center justify-center">
        <div className="text-xs text-neutral-600 dark:text-neutral-400">학생 현황 차트</div>
      </div>
    </div>
  )
}

// AttendanceWidget는 이제 AttendanceRealtimeWidget으로 대체됨
// 이 함수는 하위 호환성을 위해 유지하되, 새로운 위젯을 래핑함

function AttendanceWidget({ stats }: { stats: DashboardStats | null }) {
  // 새로운 실시간 출석 위젯 사용
  return <AttendanceRealtimeWidget className="h-full" />
}

function QuickActionsWidget() {
  const actions = [
    { label: '신규 등록', icon: UserGroupIcon, color: 'text-blue-500' },
    { label: '출석 체크', icon: ClockIcon, color: 'text-green-500' },
    { label: '상담 예약', icon: PhoneIcon, color: 'text-purple-500' },
    { label: '수강료 관리', icon: CurrencyDollarIcon, color: 'text-yellow-500' }
  ]
  
  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action, index) => {
        const Icon = action.icon
        return (
          <motion.button
            key={action.label}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-lg bg-white/50 dark:bg-black/50 border border-white/30 dark:border-white/10 hover:bg-white/70 dark:hover:bg-black/70 transition-colors"
          >
            <Icon className={`w-5 h-5 ${action.color} mb-1 mx-auto`} />
            <div className="text-xs font-medium text-center">{action.label}</div>
          </motion.button>
        )
      })}
    </div>
  )
}

function AIInsightsWidget() {
  const insights = [
    "수학 클래스 출석률이 10% 증가했습니다",
    "3명의 학생이 레벨업 대상입니다", 
    "김민수 학생의 학부모 상담이 필요합니다"
  ]
  
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <SparklesIcon className="w-5 h-5 text-purple-500" />
        <span className="font-medium text-purple-600 dark:text-purple-400">AI 인사이트</span>
      </div>
      <ul className="space-y-2">
        {insights.map((insight, index) => (
          <li key={index} className="text-sm text-neutral-700 dark:text-neutral-300 flex items-start space-x-2">
            <span className="text-purple-500 mt-1">•</span>
            <span>{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// 메인 DashboardV2 컴포넌트
export default function DashboardV2() {
  const { profile } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // 배경 설정 시스템
  const { config: backgroundConfig } = useBackgroundConfig()
  
  // 다크모드 상태 감지
  const isDark = useDarkMode()
  const cardShadowClass = React.useMemo(() => 
    getCompleteCardShadow({ isDark }), 
    [isDark]
  )
  
  // 디버깅: backgroundConfig 및 다크모드 상태 추적
  React.useEffect(() => {
    console.log('🖼️ DashboardV2 backgroundConfig 변경됨:', backgroundConfig)
    console.log('🎯 DashboardV2 backgroundConfig.pattern:', backgroundConfig.pattern)
    console.log('🎯 DashboardV2 backgroundConfig.type:', backgroundConfig.type)
    console.log('🌙 DashboardV2 isDark:', isDark)
    console.log('🎨 DashboardV2 cardShadowClass:', cardShadowClass)
  }, [backgroundConfig, isDark])

  // 현재 사용자 역할 정보 생성 (임시로 tenant_admin 기반)
  const userRoleInfo: UserRoleInfo | null = React.useMemo(() => {
    if (!profile?.role) return null
    
    const roleName = profile.role as string
    const roleCategory = inferRoleCategory(roleName)
    
    return {
      roleName,
      roleDisplayName: roleName === 'tenant_admin' ? '학원 관리자' : '직원',
      roleCategory,
      permissions: [], // 실제로는 DB에서 가져와야 함
      hierarchyLevel: roleName === 'tenant_admin' ? 10 : 1
    }
  }, [profile?.role])

  // 대시보드 통계 데이터 로드
  const fetchDashboardStats = useCallback(async () => {
    if (!profile?.tenant_id) return

    setIsLoadingStats(true)
    try {
      const response = await fetch(`/api/students/dashboard-stats?tenantId=${profile.tenant_id}`)
      if (!response.ok) throw new Error('Failed to fetch dashboard stats')
      
      const data = await response.json()
      setStats(data.data)
    } catch (error) {
      console.error('대시보드 통계 로드 실패:', error)
      // 에러 시 기본값 설정
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
    } finally {
      // 최소 로딩 시간 보장 (800ms) - Layout shift 없는 자연스러운 로딩
      setTimeout(() => {
        setIsLoadingStats(false)
      }, 800)
    }
  }, [profile?.tenant_id])

  // 새로고침 핸들러
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchDashboardStats()
    setTimeout(() => setRefreshing(false), 500) // 시각적 피드백
  }, [fetchDashboardStats])

  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  // 위젯 설정 정의 (새로운 권한 시스템)
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
      size: 'wide', // 실시간 위젯은 더 많은 공간 필요
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

  // Role Adapter 사용
  const { 
    widgets: adaptedWidgets, 
    layoutConfig, 
    theme, 
    colors,
    roleInfo
  } = useRoleAdapter(userRoleInfo, widgetConfigs)

  // 로딩 상태 (Layout Shift 방지용)
  if (isLoadingStats) {
    return (
      <BackgroundSystem 
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
      </BackgroundSystem>
    )
  }

  return (
    <BackgroundSystem 
      config={backgroundConfig}
      className="min-h-full p-6"
    >
      {/* Hidden failsafe for Tailwind class detection */}
      <div className="hidden w-full h-full absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950 from-neutral-50 to-blue-50 dark:from-neutral-900 dark:to-blue-900 from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-950 dark:via-pink-950 dark:to-indigo-950 animate-pulse relative min-h-full bg-cover bg-center bg-no-repeat pointer-events-none" />
      
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
            {/* 배경 설정 버튼 */}
            <BackgroundSettings
              trigger={
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="backdrop-blur-sm bg-white/50 dark:bg-black/20 border-neutral-300 dark:border-white/10 hover:bg-white/70 dark:hover:bg-black/30 text-neutral-700 dark:text-neutral-200"
                >
                  <SwatchIcon className="w-4 h-4" />
                </Button>
              }
            />

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

        {/* Widgets Grid */}
        <SmartGrid 
          maxColumns={layoutConfig.gridConfig.maxColumns}
          gap={layoutConfig.gridConfig.gap}
          autoFlow={layoutConfig.gridConfig.autoFlow}
          animate={theme.animations}
        >
          <AnimatePresence>
            {adaptedWidgets.map((widget) => {
              const WidgetComponent = widget.component
              
              return (
                <GridItem 
                  key={widget.id}
                  size={WidgetSizes[widget.size]}
                  animate={theme.animations}
                >
                  <GlassWidget
                    opacity={widget.id === 'critical-alerts' ? 'critical' : theme.styles.primary}
                    size="md"
                    title={widget.title}
                    subtitle={widget.subtitle}
                    icon={widget.icon}
                    animate={theme.animations}
                    glow={true}
                    float={false}
                    className={cardShadowClass}
                  >
                    <WidgetComponent {...widget.props} />
                  </GlassWidget>
                </GridItem>
              )
            })}
          </AnimatePresence>
        </SmartGrid>

      </div>
    </BackgroundSystem>
  )
}