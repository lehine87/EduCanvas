# EduCanvas v2 수강 등록 설계 문서

## 📋 설계 개요

**설계 일자**: 2025-08-25  
**설계 버전**: v2.0 Enrollment  
**설계 범위**: 수강 등록 및 결제 시스템 전체 리뉴얼  
**핵심 철학**: "3단계로 완료하는 간편한 수강 등록"

## 🎯 설계 목표

### 핵심 목표
1. **단순한 워크플로우**: 학생 선택 → 수강 선택 → 결제 완료
2. **자동화 극대화**: 할인 자동 적용, 시간표 자동 배정
3. **실시간 검증**: 정원, 시간 충돌 즉시 확인
4. **유연한 패키지**: 다양한 수강 조합 지원

## 🏗️ 워크플로우 설계

### 전체 프로세스

```
┌─────────────────────────────────────────────────────────────────┐
│                      수강 등록 워크플로우                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [Step 1: 학생 선택]                                             │
│     ↓                                                            │
│  ┌───────────────┐                                              │
│  │ 🔍 학생 검색  │ → 기존 학생 or 신규 학생 등록               │
│  └───────────────┘                                              │
│     ↓                                                            │
│  [Step 2: 수강 구성]                                             │
│     ↓                                                            │
│  ┌─────────────────────────────────────┐                       │
│  │ 📚 과목 선택 → 📅 시간표 배정 → 💰 패키지 구성            │
│  └─────────────────────────────────────┘                       │
│     ↓                                                            │
│  [Step 3: 결제 처리]                                             │
│     ↓                                                            │
│  ┌───────────────┐                                              │
│  │ 💳 결제 방법  │ → 할인 적용 → 결제 완료                    │
│  └───────────────┘                                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 📐 레이아웃 구조

### 메인 레이아웃 (3-Panel Split View)

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: 수강 등록 > Step Indicator [1 학생] [2 수강] [3 결제]    │
├───────────────┬─────────────────────────┬───────────────────────┤
│               │                           │                       │
│ 왼쪽 패널      │ 중앙 패널                 │ 오른쪽 패널          │
│ (학생 검색)    │ (수강 구성)              │ (요약 및 결제)       │
│               │                           │                       │
│ [검색창]      │ ┌─────────────────────┐ │ ┌─────────────────┐ │
│               │ │ 과목 카드 그리드      │ │ │ 선택된 학생     │ │
│ 최근 등록     │ │ ┌────┐ ┌────┐       │ │ │ 홍길동          │ │
│ • 김철수      │ │ │수학│ │영어│       │ │ └─────────────────┘ │
│ • 이영희      │ │ └────┘ └────┘       │ │                     │
│               │ │ ┌────┐ ┌────┐       │ │ ┌─────────────────┐ │
│ 전체 학생     │ │ │물리│ │화학│       │ │ │ 선택된 수강     │ │
│ • 홍길동 ✓    │ │ └────┘ └────┘       │ │ │ • 수학 (월수금) │ │
│ • 박민수      │ └─────────────────────┘ │ │ • 영어 (화목)   │ │
│ • ...         │                           │ └─────────────────┘ │
│               │ ┌─────────────────────┐ │                     │
│ [신규등록]    │ │ 시간표 미리보기      │ │ ┌─────────────────┐ │
│               │ │ (드래그앤드롭)       │ │ │ 결제 정보       │ │
│               │ └─────────────────────┘ │ │ 수강료: 500,000 │ │
│               │                           │ │ 할인: -50,000   │ │
│               │                           │ │ 합계: 450,000   │ │
│               │                           │ └─────────────────┘ │
│               │                           │                     │
│               │                           │ [결제 진행]        │
└───────────────┴─────────────────────────┴───────────────────────┘
```

## 🎴 핵심 컴포넌트 설계

### 1. 학생 선택 패널 (Step 1)

```tsx
interface StudentSelectionPanel {
  // 검색 기능
  search: {
    query: string
    filters: {
      status: 'all' | 'active' | 'inactive'
      grade?: string
      school?: string
    }
    results: Student[]
  }
  
  // 빠른 선택
  quickSelect: {
    recentStudents: Student[]      // 최근 등록한 학생
    siblings: Student[]            // 형제자매 (할인 대상)
    waitingList: Student[]         // 대기 중인 학생
  }
  
  // 액션
  actions: {
    onSelectStudent: (student: Student) => void
    onCreateNewStudent: () => void
    onSelectMultiple: (students: Student[]) => void  // 형제 동시 등록
  }
  
  // UI 요소
  display: {
    showPhoto: true
    showContactInfo: true
    highlightSiblings: true        // 형제 관계 표시
    showCurrentEnrollments: true   // 현재 수강 중인 과목
  }
}
```

### 2. 수강 구성 패널 (Step 2)

```tsx
interface CourseConfigurationPanel {
  // 과목 선택
  courseSelection: {
    availableCourses: Course[]
    selectedCourses: Course[]
    
    // 과목 카드 정보
    courseCard: {
      name: string
      instructor: string
      schedule: string
      capacity: { current: number; max: number }
      price: number
      description: string
    }
    
    // 필터링
    filters: {
      subject?: string
      instructor?: string
      dayOfWeek?: string[]
      timeSlot?: string
      level?: string
    }
  }
  
  // 시간표 배정
  scheduleAssignment: {
    type: 'automatic' | 'manual'
    
    // 자동 배정
    automatic: {
      preferences: {
        preferredDays: string[]
        preferredTimes: string[]
        avoidDays: string[]
      }
      conflicts: ConflictInfo[]
      suggestions: ScheduleSuggestion[]
    }
    
    // 수동 배정 (드래그앤드롭)
    manual: {
      weekView: WeekSchedule
      availableSlots: TimeSlot[]
      draggedClass: Class | null
    }
  }
  
  // 패키지 구성
  packageBuilder: {
    templates: PackageTemplate[]    // 인기 패키지
    customPackage: {
      courses: Course[]
      duration: number              // 개월
      sessionsPerWeek: number
      totalSessions: number
    }
    
    pricing: {
      basePrice: number
      discounts: Discount[]
      finalPrice: number
    }
  }
}
```

### 3. 결제 처리 패널 (Step 3)

```tsx
interface PaymentProcessPanel {
  // 결제 요약
  summary: {
    student: Student
    enrollments: Enrollment[]
    
    pricing: {
      subtotal: number
      discounts: {
        sibling?: number           // 형제 할인
        earlyBird?: number        // 조기 등록 할인
        package?: number          // 패키지 할인
        loyalty?: number          // 장기 수강 할인
        referral?: number         // 추천 할인
      }
      tax?: number
      total: number
    }
    
    schedule: {
      startDate: Date
      endDate: Date
      totalSessions: number
      weeklyHours: number
    }
  }
  
  // 결제 방법
  paymentMethod: {
    type: 'card' | 'bank' | 'cash' | 'installment'
    
    // 카드 결제
    card: {
      number: string
      holder: string
      expiry: string
      cvc: string
    }
    
    // 계좌 이체
    bank: {
      accountNumber: string
      bankName: string
      depositor: string
    }
    
    // 할부
    installment: {
      months: 2 | 3 | 6 | 12
      monthlyAmount: number
      firstPayment: Date
    }
  }
  
  // 영수증 옵션
  receipt: {
    type: 'email' | 'print' | 'both'
    taxInvoice: boolean
    recipient: string
  }
}
```

## 🎨 상세 컴포넌트 설계

### Step Indicator 컴포넌트

```tsx
const EnrollmentStepIndicator = ({ currentStep, completedSteps }) => {
  const steps = [
    { id: 1, label: '학생 선택', icon: User },
    { id: 2, label: '수강 구성', icon: BookOpen },
    { id: 3, label: '결제 처리', icon: CreditCard }
  ]
  
  return (
    <div className="flex items-center justify-center py-4">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <StepItem
            number={step.id}
            label={step.label}
            icon={step.icon}
            status={
              completedSteps.includes(step.id) ? 'completed' :
              currentStep === step.id ? 'active' : 'pending'
            }
          />
          {index < steps.length - 1 && (
            <StepConnector 
              completed={completedSteps.includes(step.id)}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
```

### 과목 카드 컴포넌트

```tsx
const CourseCard = memo(({ 
  course, 
  selected, 
  onSelect, 
  disabled 
}: CourseCardProps) => {
  const capacityPercentage = (course.enrolled / course.capacity) * 100
  const isAlmostFull = capacityPercentage >= 80
  const isFull = capacityPercentage >= 100
  
  return (
    <Card
      className={cn(
        "course-card cursor-pointer transition-all",
        "hover:shadow-lg hover:scale-105",
        selected && "ring-2 ring-blue-500 bg-blue-50",
        disabled && "opacity-50 cursor-not-allowed",
        isFull && "bg-gray-50"
      )}
      onClick={() => !disabled && !isFull && onSelect(course)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              {course.name}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {course.instructor}
            </p>
          </div>
          {selected && (
            <CheckCircle className="h-5 w-5 text-blue-500" />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* 시간표 정보 */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{course.schedule}</span>
        </div>
        
        {/* 정원 상태 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">정원</span>
            <span className={cn(
              "font-medium",
              isFull && "text-red-600",
              isAlmostFull && "text-yellow-600"
            )}>
              {course.enrolled}/{course.capacity}명
            </span>
          </div>
          <Progress 
            value={capacityPercentage} 
            className={cn(
              "h-2",
              isFull && "bg-red-100",
              isAlmostFull && "bg-yellow-100"
            )}
          />
        </div>
        
        {/* 수강료 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">수강료</span>
          <span className="font-semibold text-lg">
            {formatCurrency(course.price)}
          </span>
        </div>
        
        {/* 태그 */}
        <div className="flex flex-wrap gap-1">
          {course.tags?.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
})
```

### 시간표 미리보기 컴포넌트

```tsx
const SchedulePreview = ({ 
  studentId, 
  selectedCourses, 
  existingSchedule 
}) => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  
  // 충돌 감지
  useEffect(() => {
    const detected = detectConflicts([
      ...existingSchedule,
      ...selectedCourses
    ])
    setConflicts(detected)
  }, [selectedCourses, existingSchedule])
  
  return (
    <div className="schedule-preview border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">시간표 미리보기</h3>
        <ToggleGroup value={viewMode} onValueChange={setViewMode}>
          <ToggleGroupItem value="week">주간</ToggleGroupItem>
          <ToggleGroupItem value="month">월간</ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      {conflicts.length > 0 && (
        <Alert variant="warning" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            시간 충돌이 {conflicts.length}건 발견되었습니다.
            다른 시간대를 선택하거나 기존 수업을 조정해주세요.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="schedule-grid">
        {viewMode === 'week' ? (
          <WeekScheduleGrid
            schedule={[...existingSchedule, ...selectedCourses]}
            conflicts={conflicts}
            interactive={true}
            onSlotClick={(slot) => handleSlotClick(slot)}
          />
        ) : (
          <MonthCalendar
            schedule={[...existingSchedule, ...selectedCourses]}
            highlights={selectedCourses.map(c => c.startDate)}
          />
        )}
      </div>
    </div>
  )
}
```

### 할인 자동 적용 컴포넌트

```tsx
const DiscountCalculator = ({ 
  student, 
  enrollments, 
  basePrice 
}) => {
  const [appliedDiscounts, setAppliedDiscounts] = useState<Discount[]>([])
  const [finalPrice, setFinalPrice] = useState(basePrice)
  
  // 자동 할인 계산
  useEffect(() => {
    const discounts = []
    
    // 형제 할인 체크
    if (student.siblings?.length > 0) {
      const enrolledSiblings = student.siblings.filter(s => 
        s.enrollmentStatus === 'active'
      )
      if (enrolledSiblings.length > 0) {
        discounts.push({
          type: 'sibling',
          label: '형제 할인',
          amount: basePrice * 0.1,  // 10% 할인
          description: `${enrolledSiblings[0].name} 형제`
        })
      }
    }
    
    // 조기 등록 할인
    const daysUntilStart = differenceInDays(
      enrollments[0].startDate,
      new Date()
    )
    if (daysUntilStart >= 30) {
      discounts.push({
        type: 'earlyBird',
        label: '조기 등록 할인',
        amount: basePrice * 0.05,  // 5% 할인
        description: '30일 전 등록'
      })
    }
    
    // 패키지 할인
    if (enrollments.length >= 3) {
      discounts.push({
        type: 'package',
        label: '패키지 할인',
        amount: basePrice * 0.15,  // 15% 할인
        description: `${enrollments.length}과목 동시 수강`
      })
    }
    
    // 장기 수강 할인
    if (student.totalMonthsEnrolled >= 12) {
      discounts.push({
        type: 'loyalty',
        label: '장기 수강 할인',
        amount: basePrice * 0.1,  // 10% 할인
        description: `${student.totalMonthsEnrolled}개월 수강`
      })
    }
    
    setAppliedDiscounts(discounts)
    
    const totalDiscount = discounts.reduce((sum, d) => sum + d.amount, 0)
    setFinalPrice(Math.max(basePrice - totalDiscount, 0))
  }, [student, enrollments, basePrice])
  
  return (
    <div className="discount-calculator space-y-3">
      <div className="flex justify-between font-medium">
        <span>기본 수강료</span>
        <span>{formatCurrency(basePrice)}</span>
      </div>
      
      {appliedDiscounts.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            {appliedDiscounts.map(discount => (
              <div key={discount.type} className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="success" className="text-xs">
                    {discount.label}
                  </Badge>
                  <span className="text-gray-500">
                    {discount.description}
                  </span>
                </div>
                <span className="text-green-600 font-medium">
                  -{formatCurrency(discount.amount)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
      
      <Separator />
      
      <div className="flex justify-between text-lg font-bold">
        <span>최종 결제 금액</span>
        <span className="text-blue-600">
          {formatCurrency(finalPrice)}
        </span>
      </div>
      
      {appliedDiscounts.length > 0 && (
        <div className="bg-green-50 text-green-700 text-sm p-2 rounded">
          총 {formatCurrency(basePrice - finalPrice)} 할인 적용!
        </div>
      )}
    </div>
  )
}
```

## 🔄 상태 관리

### Enrollment Store

```typescript
interface EnrollmentState {
  // 워크플로우 상태
  workflow: {
    currentStep: 1 | 2 | 3
    completedSteps: number[]
    canProceed: boolean
  }
  
  // Step 1: 학생 선택
  studentSelection: {
    selectedStudent: Student | null
    searchQuery: string
    searchResults: Student[]
    isNewStudent: boolean
  }
  
  // Step 2: 수강 구성
  courseConfiguration: {
    availableCourses: Course[]
    selectedCourses: Course[]
    schedule: ScheduleAssignment[]
    packageType: 'individual' | 'package'
    conflicts: Conflict[]
  }
  
  // Step 3: 결제
  payment: {
    pricing: {
      subtotal: number
      discounts: Discount[]
      total: number
    }
    method: PaymentMethod
    status: 'pending' | 'processing' | 'completed' | 'failed'
  }
  
  // 액션
  actions: {
    // 워크플로우 제어
    nextStep: () => void
    previousStep: () => void
    goToStep: (step: number) => void
    
    // 학생 선택
    selectStudent: (student: Student) => void
    createNewStudent: (data: NewStudentData) => Promise<Student>
    searchStudents: (query: string) => Promise<void>
    
    // 수강 구성
    selectCourse: (course: Course) => void
    removeCourse: (courseId: string) => void
    assignSchedule: (assignment: ScheduleAssignment) => void
    detectConflicts: () => void
    
    // 결제
    calculatePricing: () => void
    applyDiscount: (discount: Discount) => void
    processPayment: (method: PaymentMethod) => Promise<void>
    
    // 전체 프로세스
    submitEnrollment: () => Promise<EnrollmentResult>
    resetEnrollment: () => void
  }
}
```

## 📱 반응형 설계

### Mobile Layout (< 768px)
- 단일 컬럼 레이아웃
- Step별 전체 화면 전환
- 하단 고정 액션 버튼

### Tablet Layout (768px - 1024px)
- 2 컬럼 레이아웃
- 왼쪽: 학생 선택
- 오른쪽: 수강 구성 + 결제

### Desktop Layout (> 1024px)
- 3 패널 레이아웃 (설계 기본)
- 모든 정보 한 화면에 표시

## 🚀 성능 최적화

### 1. 검색 최적화
```typescript
// Debounced search with caching
const useStudentSearch = () => {
  const cache = useRef<Map<string, Student[]>>(new Map())
  
  const search = useMemo(
    () => debounce(async (query: string) => {
      if (cache.current.has(query)) {
        return cache.current.get(query)
      }
      
      const results = await searchStudents(query)
      cache.current.set(query, results)
      return results
    }, 300),
    []
  )
  
  return search
}
```

### 2. 과목 데이터 프리로딩
```typescript
// Preload popular courses
useEffect(() => {
  const preloadCourses = async () => {
    const popular = await getPopularCourses()
    setCourseCache(popular)
  }
  
  requestIdleCallback(preloadCourses)
}, [])
```

## 📊 성공 지표

1. **등록 완료율**: 80% 이상 (시작 → 완료)
2. **평균 소요 시간**: 5분 이내
3. **오류 발생률**: 1% 미만
4. **할인 자동 적용률**: 95% 이상
5. **사용자 만족도**: 4.5/5.0 이상

## 🧪 테스트 시나리오

### 주요 테스트 케이스
1. **단일 학생 단일 과목 등록**
2. **형제 동시 다과목 등록**
3. **시간 충돌 해결 프로세스**
4. **복잡한 할인 조합 적용**
5. **결제 실패 및 재시도**

## 📈 향후 개선 사항

1. **AI 추천 시스템**: 학생 프로필 기반 과목 추천
2. **대량 등록 모드**: Excel 업로드로 일괄 등록
3. **모바일 앱 연동**: QR 코드로 빠른 등록
4. **온라인 결제 게이트웨이**: 다양한 PG사 연동

---

**다음 단계**: 클래스 관리 v2 설계 문서 작성