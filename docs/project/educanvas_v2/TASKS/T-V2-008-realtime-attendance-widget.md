---
task_id: "T-V2-008"
title: "실시간 출석 현황 위젯 개발"
phase: "Phase 1 - 핵심 기능 리뉴얼"
week: "Week 2-3 (2025-09-02 ~ 2025-09-15)"
sprint: "S-V2-02"
priority: "P0"
assignee: "Full Stack Developer"
estimated_effort: "2.0d"
deadline: "2025-09-05"
status: "COMPLETED"
category: "Dashboard v2"
type: "feature"
dependencies: ["T-V2-007"]
blocks: []
related: ["T-V2-009", "T-V2-010", "T-V2-011"]
tags: ["dashboard", "widget", "realtime", "attendance", "analytics"]
created: "2025-08-30"
updated: "2025-08-30"
---

# T-V2-008: 실시간 출석 현황 위젯 개발

**Dashboard v2 구현의 핵심 실시간 분석 위젯**

## 📋 태스크 개요

### 목표
Dashboard v2의 핵심 분석 위젯으로서 실시간 출석 현황을 시각적으로 표시하는 인터랙티브 위젯을 개발합니다.

### 주요 요구사항
- 실시간 출석률 표시 및 자동 업데이트
- 클래스별, 시간대별 출석 현황 분석
- 출석 트렌드 시각화 (차트 및 통계)
- 알림 및 이상 상황 감지
- 드래그앤드롭으로 위치 조정 가능한 위젯

### 성공 기준
- [x] 실시간 데이터 업데이트 (30초 간격) ✅
- [x] 응답 시간 < 500ms ✅
- [x] 모바일 반응형 완벽 지원 ✅
- [x] WCAG 2.1 AA 접근성 준수 ✅

## 🎯 기능 상세 명세

### 1. 실시간 출석 현황 표시

#### 1.1 출석률 대시보드
```typescript
interface AttendanceStats {
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  lateStudents: number;
  attendanceRate: number; // 백분율
  updateTime: Date;
}
```

**시각적 요소**:
- 원형 진행률 바 (출석률)
- 숫자 카운터 애니메이션
- 색상 코딩 (🟢 출석, 🔴 결석, 🟡 지각)

#### 1.2 클래스별 출석 현황
```typescript
interface ClassAttendance {
  classId: string;
  className: string;
  scheduledTime: Date;
  totalStudents: number;
  presentCount: number;
  attendanceRate: number;
  status: 'ongoing' | 'completed' | 'upcoming';
}
```

### 2. 시각화 및 차트

#### 2.1 출석 트렌드 차트
- **시간별 출석률**: 24시간 라인 차트
- **주별 비교**: 현재 주 vs 이전 주
- **월별 트렌드**: 출석률 변화 추이

#### 2.2 인터랙티브 요소
```jsx
// 출석률 원형 차트 컴포넌트
<AttendanceCircularChart
  attendanceRate={85.7}
  size="large"
  showAnimation={true}
  onClick={handleChartClick}
/>

// 클래스별 출석 현황 테이블
<ClassAttendanceTable
  classes={classAttendanceData}
  sortBy="attendanceRate"
  filterBy="ongoing"
/>
```

## 🏗️ 기술 구현 사양

### 1. Frontend 컴포넌트 구조

```
src/components/dashboard-v2/widgets/
├── attendance/
│   ├── AttendanceWidget.tsx           # 메인 위젯 컨테이너
│   ├── AttendanceStatsCard.tsx        # 통계 카드
│   ├── AttendanceCircularChart.tsx    # 원형 차트
│   ├── ClassAttendanceTable.tsx       # 클래스별 테이블
│   ├── AttendanceTrendChart.tsx       # 트렌드 차트
│   └── AttendanceAlerts.tsx           # 알림 시스템
├── types/
│   └── attendance-widget.ts           # TypeScript 인터페이스
└── hooks/
    └── useAttendanceData.ts           # 데이터 페칭 훅
```

### 2. API 엔드포인트 설계

#### 2.1 실시간 출석 현황 API
```typescript
// GET /api/dashboard/attendance/realtime
interface AttendanceRealtimeResponse {
  stats: AttendanceStats;
  classesByTime: ClassAttendance[];
  trends: AttendanceTrend[];
  alerts: AttendanceAlert[];
  lastUpdated: string;
}
```

#### 2.2 출석 트렌드 분석 API
```typescript
// GET /api/dashboard/attendance/trends?period=7d
interface AttendanceTrendsResponse {
  daily: DailyAttendanceTrend[];
  hourly: HourlyAttendanceTrend[];
  comparison: {
    currentPeriod: number;
    previousPeriod: number;
    changePercent: number;
  };
}
```

### 3. Database 쿼리 최적화

#### 3.1 실시간 출석 현황 쿼리
```sql
-- 실시간 출석 통계 (성능 최적화)
WITH attendance_summary AS (
  SELECT 
    c.id as class_id,
    c.name as class_name,
    c.scheduled_at,
    COUNT(DISTINCT cm.student_id) as total_students,
    COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.student_id END) as present_count,
    COUNT(DISTINCT CASE WHEN a.status = 'absent' THEN a.student_id END) as absent_count,
    COUNT(DISTINCT CASE WHEN a.status = 'late' THEN a.student_id END) as late_count
  FROM classes c
  LEFT JOIN class_memberships cm ON c.id = cm.class_id
  LEFT JOIN attendances a ON c.id = a.class_id 
    AND DATE(a.date) = CURRENT_DATE
  WHERE c.tenant_id = $1
    AND c.scheduled_at::date = CURRENT_DATE
  GROUP BY c.id, c.name, c.scheduled_at
)
SELECT 
  class_id,
  class_name,
  scheduled_at,
  total_students,
  present_count,
  absent_count,
  late_count,
  ROUND((present_count::decimal / NULLIF(total_students, 0)) * 100, 1) as attendance_rate
FROM attendance_summary
ORDER BY scheduled_at;
```

#### 3.2 인덱스 최적화
```sql
-- 성능 최적화를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_attendances_date_class_status 
  ON attendances(date, class_id, status);

CREATE INDEX IF NOT EXISTS idx_classes_tenant_scheduled 
  ON classes(tenant_id, scheduled_at) 
  WHERE scheduled_at >= CURRENT_DATE;
```

## 🎨 UI/UX 디자인 가이드

### 1. shadcn/ui 컴포넌트 활용

```jsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export function AttendanceWidget() {
  return (
    <Card className="widget-container">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          실시간 출석 현황
        </CardTitle>
        <CardDescription>
          오늘의 출석률과 클래스별 현황을 확인하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* 출석률 원형 차트 */}
          <div className="attendance-chart">
            <AttendanceCircularChart attendanceRate={85.7} />
          </div>
          
          {/* 통계 카드들 */}
          <div className="stats-grid">
            <StatCard
              title="총 학생 수"
              value={totalStudents}
              icon={Users}
            />
            <StatCard
              title="출석"
              value={presentCount}
              icon={UserCheck}
              variant="success"
            />
            <StatCard
              title="결석"
              value={absentCount}
              icon={UserX}
              variant="destructive"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 2. 다크모드 지원

```css
/* 출석 현황 색상 시스템 */
.attendance-present {
  @apply bg-success-500 text-success-contrast;
}

.attendance-absent {
  @apply bg-destructive-500 text-destructive-contrast;
}

.attendance-late {
  @apply bg-warning-500 text-warning-contrast;
}

/* 다크모드 대응 */
.dark .attendance-widget {
  @apply bg-neutral-900/50 border-neutral-800;
}

.dark .attendance-chart {
  @apply bg-neutral-800/50;
}
```

### 3. 반응형 디자인

```jsx
// 모바일 우선 반응형 그리드
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <AttendanceStatsCard className="md:col-span-2 lg:col-span-1" />
  <AttendanceTrendChart className="col-span-full lg:col-span-2" />
  <ClassAttendanceTable className="col-span-full" />
</div>
```

## ⚡ 성능 최적화 전략

### 1. 실시간 데이터 업데이트

```typescript
// React Query를 활용한 실시간 데이터 관리
import { useQuery } from '@tanstack/react-query'

export function useAttendanceData() {
  return useQuery({
    queryKey: ['attendance', 'realtime'],
    queryFn: fetchRealtimeAttendance,
    refetchInterval: 30000, // 30초마다 자동 업데이트
    refetchIntervalInBackground: true,
    staleTime: 25000, // 25초간 캐시 유효
  })
}
```

### 2. 메모이제이션 최적화

```typescript
// 차트 컴포넌트 메모이제이션
export const AttendanceCircularChart = memo(({ 
  attendanceRate, 
  size = "medium" 
}: AttendanceChartProps) => {
  const chartData = useMemo(() => 
    calculateChartData(attendanceRate), 
    [attendanceRate]
  )
  
  return (
    <div className={cn("attendance-chart", `chart-${size}`)}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            animationDuration={800}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
})
```

### 3. 가상화 적용

```typescript
// 대량 클래스 목록 가상화 (react-window)
import { FixedSizeList as List } from 'react-window'

export function ClassAttendanceTable({ classes }: ClassAttendanceTableProps) {
  const Row = ({ index, style }: { index: number, style: CSSProperties }) => (
    <div style={style}>
      <ClassAttendanceRow data={classes[index]} />
    </div>
  )

  return (
    <List
      height={400}
      itemCount={classes.length}
      itemSize={64}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

## 🔧 개발 체크리스트

### Phase 1: 기본 구조 구축 (0.5d) ✅
- [x] 위젯 컴포넌트 골격 생성 - `AttendanceRealtimeWidget.tsx` 완성
- [x] TypeScript 인터페이스 정의 - 모든 타입 정의 완료
- [x] 기본 레이아웃 구성 - 반응형 그리드 레이아웃 구현

### Phase 2: 실시간 데이터 연동 (1.0d) ✅
- [x] API 엔드포인트 구현 - `/api/dashboard/attendance/realtime` 구현
- [x] Database 쿼리 최적화 - Supabase 쿼리 최적화 완료
- [x] React Query 데이터 페칭 구현 - `useAttendanceData` 훅 구현
- [x] 실시간 업데이트 로직 - 30초 간격 자동 리페치 구현

### Phase 3: 시각화 및 차트 (0.5d) ✅
- [x] 원형 출석률 차트 구현 - `AttendanceCircularChart.tsx` 완성
- [x] 트렌드 라인 차트 추가 - `AttendanceTrendChart.tsx` 구현
- [x] 클래스별 테이블 구현 - `ClassAttendanceTable.tsx` 완성
- [x] 애니메이션 효과 적용 - Framer Motion 애니메이션 적용

## 🧪 테스트 전략

### 1. 단위 테스트
```typescript
// AttendanceWidget.test.tsx
describe('AttendanceWidget', () => {
  test('출석률이 정확히 계산되어 표시되는가', () => {
    render(<AttendanceWidget data={mockAttendanceData} />)
    expect(screen.getByText('85.7%')).toBeInTheDocument()
  })

  test('실시간 업데이트가 30초마다 발생하는가', async () => {
    jest.useFakeTimers()
    render(<AttendanceWidget />)
    
    await act(() => {
      jest.advanceTimersByTime(30000)
    })
    
    expect(fetchRealtimeAttendance).toHaveBeenCalledTimes(2)
  })
})
```

### 2. E2E 테스트 시나리오
1. **실시간 데이터 표시**: 위젯 로드 시 최신 출석 데이터 표시
2. **드래그앤드롭**: 위젯 위치 변경 및 저장
3. **반응형**: 모바일에서 레이아웃 정상 동작
4. **접근성**: 스크린 리더로 모든 정보 접근 가능

## 📊 성능 목표

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| 초기 로딩 시간 | < 500ms | Lighthouse |
| 실시간 업데이트 | 30초 간격 | 네트워크 모니터링 |
| 메모리 사용량 | < 50MB | Chrome DevTools |
| 애니메이션 FPS | 60fps | Performance API |

## 🚀 배포 및 롤아웃

### 1. 점진적 배포 전략
1. **개발 환경**: 기본 기능 구현 완료
2. **스테이징**: 실데이터 테스트 및 성능 검증
3. **프로덕션 1%**: A/B 테스트 및 사용자 피드백
4. **프로덕션 100%**: 전면 배포

### 2. 모니터링 지표
- API 응답 시간 모니터링
- 위젯 로딩 성능 추적
- 사용자 인터랙션 분석
- 에러율 모니터링

## 🔗 연관 태스크

### Dependencies (선행 태스크)
- **T-V2-007**: Dashboard v2 레이아웃 및 그리드 시스템 구축

### Related (관련 태스크)
- **T-V2-009**: 수익 분석 위젯 구현
- **T-V2-010**: 학생 현황 위젯 개발
- **T-V2-011**: 알림 센터 위젯 시스템 구현

### Blocks (후속 태스크)
- **T-V2-012**: 드래그앤드롭 위젯 재배치 기능

## 📝 구현 노트

### 중요 고려사항
1. **데이터 일관성**: 실시간 업데이트와 캐시 간의 동기화
2. **성능**: 대량 클래스 목록 처리 시 가상화 필수
3. **사용성**: 한 눈에 파악 가능한 직관적 UI
4. **확장성**: 향후 알림 기능 통합 대비

### 기술적 도전
- 실시간 데이터와 사용자 인터랙션 조화
- 차트 라이브러리와 다크모드 통합
- 접근성과 애니메이션 성능 균형

---

**작성자**: Claude Code AI  
**검토자**: Lead Developer  
**승인자**: Project Manager  
**마지막 업데이트**: 2025-09-01

## 🎉 완료 보고

### 구현 완료 항목
1. **컴포넌트 구조**: 
   - `AttendanceRealtimeWidget.tsx` - 메인 위젯 컨테이너
   - `AttendanceCircularChart.tsx` - 원형 출석률 차트
   - `AttendanceTrendChart.tsx` - 출석 트렌드 차트
   - `ClassAttendanceTable.tsx` - 클래스별 출석 테이블

2. **API 엔드포인트**:
   - `/api/dashboard/attendance/realtime` - 실시간 출석 데이터
   - `/api/dashboard/attendance/trends` - 출석 트렌드 분석

3. **데이터 페칭**:
   - `useAttendanceData` 훅으로 React Query 통합
   - 30초 간격 자동 업데이트 구현

4. **드래그앤드롭**:
   - React-Grid-Layout 기반 위젯 재배치 기능 ✅

### 성과
- 모든 개발 체크리스트 항목 완료
- 성공 기준 모두 충족
- 업계 표준 라이브러리(React-Grid-Layout) 사용으로 안정성 확보