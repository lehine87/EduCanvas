# T-V2-008: 실시간 출석 현황 위젯 개발

**태스크 ID**: T-V2-008  
**제목**: 실시간 출석 현황 위젯 개발  
**상태**: TODO  
**우선순위**: P0 (최우선)  
**담당**: Full Stack  
**예상 시간**: 2.0일 (16시간)  
**기한**: 2025-09-05  
**스프린트**: S-V2-02  

---

## 📋 태스크 개요

Dashboard v2의 핵심 위젯인 실시간 출석 현황 위젯을 개발합니다. 학원 운영진이 하루의 출석 상황을 한눈에 파악할 수 있는 직관적인 인터페이스를 제공합니다.

### 목표
- 실시간 출석 데이터 표시
- 시각적으로 직관적인 출석률 표현
- 클래스별/시간대별 출석 현황 분석
- 알림 및 예외 상황 하이라이트

---

## 🎯 상세 요구사항

### 1. 위젯 레이아웃 설계
```typescript
interface AttendanceWidget {
  // 전체 출석 현황
  summary: {
    totalStudents: number          // 전체 재학생 수
    presentToday: number           // 오늘 출석 학생 수
    attendanceRate: number         // 출석률 (%)
    lateStudents: number           // 지각 학생 수
    absentStudents: number         // 결석 학생 수
  }
  
  // 클래스별 현황
  classSummary: Array<{
    classId: string
    className: string
    expectedStudents: number       // 예상 출석 인원
    actualStudents: number         // 실제 출석 인원
    attendanceRate: number         // 클래스 출석률
    status: 'excellent' | 'good' | 'warning' | 'critical'
  }>
  
  // 시간대별 현황
  timeSlots: Array<{
    timeSlot: string              // "09:00-10:30"
    totalClasses: number          // 해당 시간대 총 클래스 수
    avgAttendanceRate: number     // 평균 출석률
    alertCount: number            // 주의 필요 클래스 수
  }>
  
  // 실시간 알림
  alerts: Array<{
    type: 'low_attendance' | 'absent_pattern' | 'late_pattern'
    message: string
    classId: string
    studentIds: string[]
    timestamp: Date
  }>
}
```

### 2. 시각화 컴포넌트
```tsx
// 메인 출석 위젯 컴포넌트
export function AttendanceWidget() {
  return (
    <Card className="p-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">오늘 출석 현황</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            실시간
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 전체 출석률 원형 차트 */}
        <AttendanceCircleChart />
        
        {/* 상태별 학생 수 */}
        <AttendanceStatusGrid />
        
        {/* 클래스별 출석 현황 */}
        <ClassAttendanceList />
        
        {/* 시간대별 트렌드 */}
        <TimeSlotTrend />
        
        {/* 실시간 알림 */}
        <AttendanceAlerts />
      </CardContent>
    </Card>
  )
}
```

### 3. 실시간 데이터 연동
```typescript
// 출석 데이터 실시간 구독
export function useAttendanceData() {
  const [data, setData] = useState<AttendanceWidget | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    // Supabase Realtime 구독
    const subscription = supabase
      .channel('attendance_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
          filter: `date=eq.${format(new Date(), 'yyyy-MM-dd')}`
        },
        (payload) => {
          // 실시간 데이터 업데이트 처리
          updateAttendanceData(payload)
        }
      )
      .subscribe()
    
    // 초기 데이터 로드
    loadInitialData()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])
  
  return { data, isLoading, error }
}
```

---

## 🔧 구현 단계

### Step 1: 데이터 모델 설계 (4시간)
- [ ] 출석 데이터 타입 정의
- [ ] API 엔드포인트 설계
- [ ] 실시간 구독 로직 설계
- [ ] 성능 최적화 전략 수립

### Step 2: UI 컴포넌트 개발 (8시간)
- [ ] 원형 출석률 차트 컴포넌트
- [ ] 출석 상태 그리드 컴포넌트
- [ ] 클래스별 출석 현황 리스트
- [ ] 시간대별 트렌드 차트
- [ ] 실시간 알림 컴포넌트

### Step 3: 백엔드 API 구현 (3시간)
- [ ] 출석 현황 조회 API
- [ ] 실시간 데이터 집계 로직
- [ ] 알림 생성 로직
- [ ] 캐싱 전략 구현

### Step 4: 통합 및 테스트 (1시간)
- [ ] 프론트엔드-백엔드 통합
- [ ] 실시간 업데이트 테스트
- [ ] 성능 테스트 및 최적화

---

## 🎨 UI/UX 설계

### 색상 시스템
```typescript
const attendanceColors = {
  excellent: 'text-green-600 bg-green-50',    // 90% 이상
  good: 'text-blue-600 bg-blue-50',           // 80-89%
  warning: 'text-yellow-600 bg-yellow-50',    // 70-79%
  critical: 'text-red-600 bg-red-50'          // 70% 미만
}

const statusColors = {
  present: 'bg-green-500',      // 출석
  late: 'bg-yellow-500',        // 지각
  absent: 'bg-red-500',         // 결석
  excused: 'bg-gray-400'        // 사유결석
}
```

### 반응형 레이아웃
```scss
// 모바일 (< 768px)
.attendance-widget {
  @apply grid grid-cols-1 gap-4;
}

// 태블릿 (768px - 1024px) 
@media (min-width: 768px) {
  .attendance-widget {
    @apply grid-cols-2 gap-6;
  }
}

// 데스크톱 (> 1024px)
@media (min-width: 1024px) {
  .attendance-widget {
    @apply grid-cols-3 gap-6;
  }
}
```

### 애니메이션 효과
```typescript
// 숫자 카운트업 애니메이션
const CountUpNumber = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    let start = 0
    const end = value
    const incrementTime = duration / end
    
    const timer = setInterval(() => {
      start += 1
      setCount(start)
      if (start === end) clearInterval(timer)
    }, incrementTime)
    
    return () => clearInterval(timer)
  }, [value, duration])
  
  return <span className="font-bold text-2xl">{count}</span>
}

// 원형 진행률 애니메이션  
const CircularProgress = ({ percentage }) => {
  return (
    <div className="relative w-24 h-24">
      <svg className="transform -rotate-90 w-24 h-24">
        <circle
          cx="12"
          cy="12" 
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          fill="transparent"
          className="text-gray-200"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          fill="transparent"
          strokeDasharray={`${percentage} ${100 - percentage}`}
          className="text-primary transition-all duration-1000 ease-out"
        />
      </svg>
    </div>
  )
}
```

---

## 🧪 테스트 케이스

### 단위 테스트
```typescript
describe('AttendanceWidget', () => {
  test('출석률 계산 정확성', () => {
    const testData = {
      totalStudents: 100,
      presentToday: 85,
      lateStudents: 10,
      absentStudents: 5
    }
    
    const attendanceRate = calculateAttendanceRate(testData)
    expect(attendanceRate).toBe(85)
  })
  
  test('실시간 데이터 업데이트', async () => {
    render(<AttendanceWidget />)
    
    // 초기 데이터 로딩 확인
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    
    // 데이터 로드 후 확인
    await waitFor(() => {
      expect(screen.getByText('오늘 출석 현황')).toBeInTheDocument()
    })
  })
  
  test('출석 상태별 색상 표시', () => {
    const { container } = render(
      <AttendanceStatusGrid data={mockAttendanceData} />
    )
    
    expect(container.querySelector('.bg-green-50')).toBeInTheDocument()
    expect(container.querySelector('.bg-red-50')).toBeInTheDocument()
  })
})
```

### 통합 테스트
```typescript
describe('실시간 출석 현황 통합', () => {
  test('Supabase Realtime 연동', async () => {
    const mockSubscription = jest.fn()
    jest.spyOn(supabase, 'channel').mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: mockSubscription
    })
    
    render(<AttendanceWidget />)
    
    expect(mockSubscription).toHaveBeenCalled()
  })
  
  test('API 데이터 페칭', async () => {
    const mockData = { totalStudents: 100, presentToday: 85 }
    jest.spyOn(api, 'getAttendanceData').mockResolvedValue(mockData)
    
    render(<AttendanceWidget />)
    
    await waitFor(() => {
      expect(screen.getByText('85')).toBeInTheDocument()
    })
  })
})
```

### 성능 테스트
- [ ] 위젯 렌더링 시간 < 500ms
- [ ] 실시간 업데이트 지연 < 1초  
- [ ] 메모리 사용량 모니터링
- [ ] 대용량 데이터 처리 테스트 (1000+ 학생)

---

## 📊 완료 기준

### 기능 요구사항
- [ ] 실시간 출석 현황 정확한 표시
- [ ] 클래스별 출석률 시각화
- [ ] 시간대별 출석 트렌드 분석
- [ ] 출석 관련 알림 시스템 동작
- [ ] 반응형 레이아웃 완벽 지원

### 성능 요구사항  
- [ ] 위젯 로딩 시간 < 2초
- [ ] 실시간 업데이트 지연 < 1초
- [ ] 1000명 이상 학생 데이터 처리 가능
- [ ] 메모리 사용량 < 50MB (위젯당)

### 접근성 요구사항
- [ ] 스크린 리더 호환성
- [ ] 키보드 네비게이션 지원
- [ ] 색상 대비비 4.5:1 이상
- [ ] ARIA 레이블 완전 적용

### 데이터 정확성
- [ ] 출석률 계산 100% 정확성
- [ ] 실시간 데이터 동기화
- [ ] 예외 상황 올바른 처리
- [ ] 데이터 일관성 보장

---

## 🚨 위험 요소 및 대응

### 높은 위험
**실시간 데이터 동기화 지연**
- 위험도: 중간 | 영향: 부정확한 현황 정보
- 대응: WebSocket fallback, 정기적 데이터 새로고침

**대용량 데이터 성능 저하**  
- 위험도: 중간 | 영향: 위젯 로딩 지연
- 대응: 데이터 집계 최적화, 캐싱 전략 적용

### 기술적 이슈
**출석 데이터 정합성**
- 위험도: 높음 | 영향: 잘못된 출석률 표시
- 대응: 데이터 검증 로직 강화, 이중 체크 시스템

**브라우저 호환성**
- 위험도: 낮음 | 영향: 일부 사용자 접근 제한
- 대응: Polyfill 적용, 그라데이션 차트 대안 제공

---

## 🔗 관련 태스크

### 선행 태스크
- **T-V2-007**: Dashboard v2 레이아웃 및 그리드 시스템 구축

### 후속 태스크
- **T-V2-009**: 수익 분석 위젯 구현
- **T-V2-010**: 학생 현황 위젯 개발
- **T-V2-011**: 알림 센터 위젯 시스템 구현

### 의존성 태스크
- **T-V2-003**: 기본 UI 컴포넌트 20개 구축 (Chart, Badge 등)
- **출결 관리 시스템**: 기존 v1 출결 데이터 활용

---

## 📝 추가 고려사항

### 데이터 개인정보 보호
- 개별 학생 정보는 집계된 형태로만 표시
- 민감한 개인정보 마스킹 처리
- 권한별 정보 노출 수준 제어

### 다국어 지원 준비
- 텍스트 하드코딩 방지
- i18n 키 체계적 관리
- 숫자 형식 로케일별 대응

### 확장성 고려
- 주간/월간 출석 트렌드 위젯 확장 가능
- 출석 패턴 AI 분석 연동 준비
- 학부모 알림 시스템 연계 가능

---

**작성자**: Full Stack Developer  
**작성일**: 2025-08-25  
**최종 수정**: 2025-08-25  
**다음 리뷰**: T-V2-009 태스크 시작 전