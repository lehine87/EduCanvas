---
category: design
priority: 4
type: specification
project: "educanvas_v2"
component: "dashboard"
tags: ["v2", "dashboard", "ui-design", "real-time", "widgets"]
version: "v2.0"
last_updated: "2025-08-25"
status: active
phase: "design-complete"
implementation_priority: 1
related_files:
  - "implementation-strategy.md"
  - "../../../core/development_plan.md"
  - "enrollment-design.md"
purpose: "EduCanvas v2 실시간 위젯 기반 스마트 대시보드 완전 설계"
audience: ["developers", "ui-designers", "product-managers"]
framework: "shadcn/ui"
estimated_effort: "2주"
---

# EduCanvas v2 대시보드 설계 문서

## 📋 설계 개요

**설계 일자**: 2025-08-25  
**설계 버전**: v2.0 Dashboard  
**설계 범위**: 메인 대시보드 전체 리뉴얼  
**핵심 철학**: "한눈에 파악하고 바로 행동하는 운영 현황판"

## 🎯 설계 목표

### 핵심 목표
1. **즉각적 현황 파악**: 5초 내 학원 운영 상태 이해
2. **행동 유도 설계**: 각 위젯에서 바로 상세 작업 진입
3. **역할별 최적화**: 사용자 권한에 따른 맞춤 대시보드
4. **실시간 업데이트**: 자동 새로고침으로 항상 최신 정보

## 🏗️ 레이아웃 구조

### 전체 구조 (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: 환영 메시지 + 빠른 액션 버튼                             │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│ │ 오늘의 출석 현황  │ │ 수업 진행 상태   │ │ 결제 알림       │ │
│ │ (실시간)         │ │ (실시간)        │ │ (긴급도순)      │ │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘ │
│ ┌──────────────────────────────────┐ ┌────────────────────────┐ │
│ │ 오늘의 수업 일정                  │ │ 신규/퇴원 학생        │ │
│ │ (타임라인 뷰)                    │ │ (최근 7일)           │ │
│ └──────────────────────────────────┘ └────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ 주요 지표 트렌드 (주간/월간 비교)                              │ │
│ └──────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│ │ 클래스별 현황    │ │ 강사별 현황      │ │ 공지사항/메모    │ │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🎴 핵심 위젯 설계

### 1. 오늘의 출석 현황 위젯

```tsx
interface AttendanceWidget {
  // 실시간 데이터
  data: {
    totalExpected: number      // 오늘 예정 학생 수
    present: number            // 출석
    absent: number            // 결석
    late: number              // 지각
    upcoming: number          // 수업 예정
    attendanceRate: number    // 출석률 %
  }
  
  // 시각화
  display: {
    type: 'donut-chart'      // 도넛 차트
    colors: {
      present: '#10b981'      // 녹색
      absent: '#ef4444'       // 빨강
      late: '#f59e0b'        // 노랑
      upcoming: '#94a3b8'    // 회색
    }
  }
  
  // 인터랙션
  actions: {
    onViewDetails: () => void    // 출결 관리 페이지로
    onMarkAttendance: () => void // 빠른 출결 체크
  }
}
```

### 2. 수업 진행 상태 위젯

```tsx
interface ClassStatusWidget {
  data: {
    inProgress: ClassSession[]      // 진행 중인 수업
    upcoming: ClassSession[]        // 곧 시작할 수업 (30분 내)
    completed: ClassSession[]       // 오늘 완료된 수업
  }
  
  display: {
    type: 'status-cards'
    showTimer: true                 // 실시간 타이머
    showInstructor: true
    showRoom: true
  }
  
  actions: {
    onJoinClass: (classId: string) => void
    onViewSchedule: () => void
  }
}
```

### 3. 결제 알림 위젯

```tsx
interface PaymentAlertWidget {
  data: {
    overdue: Payment[]           // 미납 (긴급)
    dueToday: Payment[]         // 오늘 마감
    upcoming: Payment[]         // 3일 내 예정
    totalAmount: number        // 총 수납 예정액
  }
  
  display: {
    type: 'priority-list'
    showAmount: true
    showDaysOverdue: true
    highlightUrgent: true      // 7일 이상 미납 강조
  }
  
  actions: {
    onProcessPayment: (studentId: string) => void
    onSendReminder: (studentId: string) => void
    onViewAllPayments: () => void
  }
}
```

### 4. 오늘의 수업 일정 위젯

```tsx
interface ScheduleTimelineWidget {
  data: {
    schedule: {
      time: string
      class: Class
      instructor: Instructor
      room: string
      students: number
      status: 'completed' | 'in-progress' | 'upcoming'
    }[]
    currentTime: Date
  }
  
  display: {
    type: 'timeline'
    showCurrentTimeLine: true    // 현재 시간 표시선
    groupBy: 'time' | 'instructor' | 'room'
  }
  
  interactions: {
    hoverable: true              // 호버시 상세 정보
    clickable: true              // 클릭시 수업 상세
    draggable: false            // 대시보드에서는 이동 불가
  }
}
```

### 5. 신규/퇴원 학생 위젯

```tsx
interface StudentFlowWidget {
  data: {
    newStudents: Student[]       // 최근 7일 신규
    graduatedStudents: Student[] // 최근 7일 졸업/퇴원
    inactiveWarning: Student[]  // 장기 미출석 경고
    trialStudents: Student[]     // 체험 수업 중
  }
  
  display: {
    type: 'compact-list'
    showPhoto: true
    showContactInfo: true
    showEnrollmentDate: true
  }
  
  actions: {
    onViewStudent: (studentId: string) => void
    onContactStudent: (studentId: string) => void
    onCreateWelcomeTask: (studentId: string) => void
  }
}
```

### 6. 주요 지표 트렌드 위젯

```tsx
interface MetricsTrendWidget {
  data: {
    metrics: {
      name: string
      current: number
      previous: number
      change: number              // 변화율 %
      trend: number[]            // 최근 7일 데이터
      target?: number           // 목표치
    }[]
    period: 'week' | 'month' | 'quarter'
  }
  
  // 주요 지표
  defaultMetrics: [
    'totalStudents',            // 전체 학생 수
    'activeClasses',           // 운영 중인 클래스
    'monthlyRevenue',          // 월 수입
    'attendanceRate',          // 평균 출석률
    'satisfactionScore'        // 만족도 점수
  ]
  
  display: {
    type: 'metric-cards'
    showSparkline: true         // 미니 차트
    showComparison: true       // 전기 대비
    showTarget: true           // 목표 대비
  }
}
```

## 🎨 상세 컴포넌트 설계

### 대시보드 헤더

```tsx
const DashboardHeader = () => {
  const { user, tenant } = useAuth()
  const { data: quickStats } = useQuickStats()
  
  return (
    <div className="dashboard-header bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        {/* 환영 메시지 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            안녕하세요, {user.name}님! 👋
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {format(new Date(), 'yyyy년 MM월 dd일 EEEE', { locale: ko })} · 
            {tenant.name}
          </p>
        </div>
        
        {/* 빠른 액션 버튼 */}
        <div className="flex items-center gap-3">
          <QuickActionButton
            icon={<UserPlus />}
            label="학생 등록"
            onClick={() => navigate('/main/students/new')}
          />
          <QuickActionButton
            icon={<ClipboardCheck />}
            label="출결 체크"
            onClick={() => openAttendanceModal()}
          />
          <QuickActionButton
            icon={<DollarSign />}
            label="수납 처리"
            onClick={() => navigate('/main/payments')}
          />
          <QuickActionButton
            icon={<Calendar />}
            label="일정 추가"
            onClick={() => openScheduleModal()}
          />
        </div>
      </div>
      
      {/* 빠른 통계 */}
      <div className="flex items-center gap-6 mt-4">
        <QuickStat
          label="오늘 출석률"
          value={`${quickStats.attendanceRate}%`}
          trend={quickStats.attendanceTrend}
        />
        <QuickStat
          label="진행 중 수업"
          value={quickStats.classesInProgress}
          suffix="개"
        />
        <QuickStat
          label="대기 중 결제"
          value={quickStats.pendingPayments}
          suffix="건"
          urgent={quickStats.pendingPayments > 5}
        />
      </div>
    </div>
  )
}
```

### 위젯 컨테이너

```tsx
interface WidgetContainerProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  refreshInterval?: number      // 자동 새로고침 간격 (ms)
  loading?: boolean
  error?: string
  className?: string
  collapsible?: boolean
}

const WidgetContainer = ({
  title,
  subtitle,
  actions,
  children,
  refreshInterval = 30000,    // 기본 30초
  loading = false,
  error,
  className,
  collapsible = false
}: WidgetContainerProps) => {
  const [collapsed, setCollapsed] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  
  // 자동 새로고침
  useInterval(() => {
    onRefresh()
    setLastUpdated(new Date())
  }, refreshInterval)
  
  return (
    <Card className={cn("widget-container", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed(!collapsed)}
              >
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 transition-transform",
                    collapsed && "-rotate-90"
                  )}
                />
              </Button>
            )}
            <div>
              <CardTitle className="text-base font-semibold">
                {title}
              </CardTitle>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(lastUpdated, { 
                addSuffix: true,
                locale: ko 
              })}
            </span>
            {actions}
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={cn(
                "h-4 w-4",
                loading && "animate-spin"
              )} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {!collapsed && (
        <CardContent>
          {error ? (
            <ErrorState message={error} onRetry={onRefresh} />
          ) : loading ? (
            <WidgetSkeleton />
          ) : (
            children
          )}
        </CardContent>
      )}
    </Card>
  )
}
```

## 🔄 상태 관리

### Dashboard Store

```typescript
interface DashboardState {
  // 위젯 데이터
  widgets: {
    attendance: AttendanceData | null
    classStatus: ClassStatusData | null
    payments: PaymentAlertData | null
    schedule: ScheduleData | null
    studentFlow: StudentFlowData | null
    metrics: MetricsData | null
  }
  
  // UI 상태
  ui: {
    layout: 'default' | 'compact' | 'custom'
    refreshInterval: number
    collapsedWidgets: string[]
    widgetOrder: string[]        // 커스터마이징 가능한 순서
  }
  
  // 로딩 상태
  loading: {
    [key: string]: boolean
  }
  
  // 에러 상태
  errors: {
    [key: string]: string | null
  }
  
  // 액션
  actions: {
    // 데이터 로드
    loadDashboard: () => Promise<void>
    refreshWidget: (widgetId: string) => Promise<void>
    
    // UI 제어
    toggleWidget: (widgetId: string) => void
    reorderWidgets: (order: string[]) => void
    setLayout: (layout: LayoutType) => void
    
    // 실시간 업데이트
    subscribeToUpdates: () => void
    unsubscribeFromUpdates: () => void
  }
}

const useDashboardStore = create<DashboardState>()((set, get) => ({
  widgets: {
    attendance: null,
    classStatus: null,
    payments: null,
    schedule: null,
    studentFlow: null,
    metrics: null
  },
  
  ui: {
    layout: 'default',
    refreshInterval: 30000,
    collapsedWidgets: [],
    widgetOrder: [
      'attendance',
      'classStatus', 
      'payments',
      'schedule',
      'studentFlow',
      'metrics'
    ]
  },
  
  loading: {},
  errors: {},
  
  actions: {
    loadDashboard: async () => {
      // 병렬로 모든 위젯 데이터 로드
      const promises = [
        loadAttendanceData(),
        loadClassStatusData(),
        loadPaymentAlertData(),
        loadScheduleData(),
        loadStudentFlowData(),
        loadMetricsData()
      ]
      
      try {
        const [
          attendance,
          classStatus,
          payments,
          schedule,
          studentFlow,
          metrics
        ] = await Promise.all(promises)
        
        set({
          widgets: {
            attendance,
            classStatus,
            payments,
            schedule,
            studentFlow,
            metrics
          }
        })
      } catch (error) {
        console.error('Dashboard load error:', error)
      }
    },
    
    refreshWidget: async (widgetId: string) => {
      set(state => ({
        loading: { ...state.loading, [widgetId]: true }
      }))
      
      try {
        const data = await loadWidgetData(widgetId)
        set(state => ({
          widgets: { ...state.widgets, [widgetId]: data },
          loading: { ...state.loading, [widgetId]: false }
        }))
      } catch (error) {
        set(state => ({
          errors: { ...state.errors, [widgetId]: error.message },
          loading: { ...state.loading, [widgetId]: false }
        }))
      }
    }
  }
}))
```

## 🎯 역할별 대시보드 커스터마이징

### 관리자 (Admin) 대시보드
```typescript
const adminWidgets = [
  'attendance',      // 출석 현황
  'classStatus',     // 수업 상태
  'payments',        // 결제 알림
  'schedule',        // 일정
  'studentFlow',     // 학생 동향
  'metrics',         // 주요 지표
  'instructorStatus', // 강사 현황
  'revenue'          // 수익 분석
]
```

### 강사 (Instructor) 대시보드
```typescript
const instructorWidgets = [
  'myClasses',       // 내 수업
  'myStudents',      // 내 학생
  'todaySchedule',   // 오늘 일정
  'attendance',      // 출석 체크
  'assignments',     // 과제 현황
  'notices'          // 공지사항
]
```

### 직원 (Staff) 대시보드
```typescript
const staffWidgets = [
  'attendance',      // 출석 현황
  'payments',        // 결제 처리
  'inquiries',       // 상담 문의
  'schedule',        // 전체 일정
  'tasks',          // 업무 할당
  'notices'         // 공지사항
]
```

## 📱 반응형 설계

### Mobile Layout (< 768px)
```
┌──────────────────┐
│ Header (축약)     │
├──────────────────┤
│ 주요 알림 (스와이프)│
├──────────────────┤
│ 오늘의 출석       │
├──────────────────┤
│ 진행 중 수업      │
├──────────────────┤
│ 결제 알림        │
├──────────────────┤
│ 더보기 버튼       │
└──────────────────┘
```

### Tablet Layout (768px - 1024px)
- 2열 그리드
- 중요 위젯 상단 배치
- 스크롤 가능한 레이아웃

## 🚀 성능 최적화

### 1. 데이터 로딩 전략
```typescript
// Progressive Loading
const loadDashboard = async () => {
  // 1차: 핵심 위젯 (즉시 표시)
  const criticalData = await Promise.all([
    loadAttendance(),
    loadClassStatus()
  ])
  
  // 2차: 보조 위젯 (순차 로드)
  const secondaryData = await Promise.all([
    loadPayments(),
    loadSchedule()
  ])
  
  // 3차: 분석 데이터 (백그라운드)
  requestIdleCallback(() => {
    loadMetrics()
    loadTrends()
  })
}
```

### 2. 캐싱 전략
```typescript
const cacheStrategy = {
  attendance: 30,        // 30초 캐시
  classStatus: 30,      // 30초 캐시
  payments: 60,         // 1분 캐시
  schedule: 300,        // 5분 캐시
  metrics: 600,         // 10분 캐시
  studentFlow: 3600     // 1시간 캐시
}
```

### 3. 실시간 업데이트
```typescript
// WebSocket or SSE for real-time updates
useEffect(() => {
  const ws = new WebSocket(WS_URL)
  
  ws.on('attendance:update', (data) => {
    updateAttendanceWidget(data)
  })
  
  ws.on('class:status', (data) => {
    updateClassStatusWidget(data)
  })
  
  return () => ws.close()
}, [])
```

## 📊 데이터 API

### Dashboard Endpoints

```typescript
// 대시보드 전체 데이터
GET /api/dashboard
Response: {
  attendance: AttendanceData
  classStatus: ClassStatusData
  payments: PaymentAlertData
  schedule: ScheduleData
  studentFlow: StudentFlowData
  metrics: MetricsData
}

// 개별 위젯 데이터
GET /api/dashboard/attendance
GET /api/dashboard/class-status
GET /api/dashboard/payments
GET /api/dashboard/schedule
GET /api/dashboard/student-flow
GET /api/dashboard/metrics

// 실시간 업데이트 구독
WS /api/dashboard/subscribe
```

## 🎨 디자인 시스템

### 색상 체계
```typescript
const dashboardColors = {
  // 상태 색상
  success: '#10b981',    // 출석, 완료
  warning: '#f59e0b',    // 지각, 주의
  danger: '#ef4444',     // 결석, 미납
  info: '#3b82f6',       // 정보, 링크
  neutral: '#94a3b8',    // 미정, 대기
  
  // 차트 색상
  chart: [
    '#3b82f6',  // 파랑
    '#10b981',  // 초록
    '#f59e0b',  // 노랑
    '#ef4444',  // 빨강
    '#8b5cf6',  // 보라
    '#ec4899',  // 핑크
  ]
}
```

### 타이포그래피
```typescript
const typography = {
  widgetTitle: 'text-base font-semibold',
  metricValue: 'text-2xl font-bold',
  metricLabel: 'text-xs text-gray-600',
  listItem: 'text-sm',
  timestamp: 'text-xs text-gray-500'
}
```

## 📋 구현 우선순위

### Phase 1 (Week 1)
1. ✅ 대시보드 레이아웃 구조
2. ✅ 위젯 컨테이너 컴포넌트
3. ✅ 출석 현황 위젯
4. ✅ 수업 진행 상태 위젯

### Phase 2 (Week 2)
1. 결제 알림 위젯
2. 수업 일정 타임라인
3. 신규/퇴원 학생 위젯

### Phase 3 (Week 3)
1. 주요 지표 트렌드
2. 역할별 커스터마이징
3. 실시간 업데이트
4. 성능 최적화

## 🔍 테스트 계획

### 단위 테스트
- 각 위젯 컴포넌트 렌더링
- 데이터 변환 로직
- 상태 관리 액션

### 통합 테스트
- 대시보드 전체 로딩
- 위젯 간 상호작용
- 실시간 업데이트

### E2E 테스트
- 역할별 대시보드 접근
- 위젯에서 상세 페이지 이동
- 자동 새로고침

## 📈 성공 지표

1. **페이지 로드 시간**: < 2초
2. **위젯 업데이트 시간**: < 500ms
3. **사용자 체류 시간**: +30% 증가
4. **일일 활성 사용자**: +25% 증가
5. **작업 완료 시간**: -40% 단축

---

**다음 단계**: 수강 등록 설계 문서 작성