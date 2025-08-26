# T-V2-022: shadcn/ui 기반 학생 카드 리디자인

**태스크 ID**: T-V2-022  
**제목**: shadcn/ui 기반 학생 카드 리디자인  
**상태**: TODO  
**우선순위**: P0 (최우선)  
**담당**: Frontend  
**예상 시간**: 2.0일 (16시간)  
**기한**: 2025-10-02  
**스프린트**: S-V2-06  

---

## 📋 태스크 개요

ClassFlow v2의 핵심 요소인 학생 카드를 shadcn/ui 디자인 시스템에 맞춰 완전히 리디자인합니다. 기존 v1의 기능성을 유지하면서 더욱 직관적이고 시각적으로 매력적인 카드로 개선합니다.

### 목표
- shadcn/ui 디자인 언어에 맞는 일관된 스타일
- 드래그앤드롭 상호작용 최적화
- 학생 정보의 계층적 표시
- 접근성 및 성능 향상

---

## 🎯 상세 요구사항

### 1. 학생 카드 데이터 구조
```typescript
interface StudentCardProps {
  student: {
    id: string
    name: string
    grade: string
    school?: string
    profileImage?: string
    phoneNumber: string
    parentPhone: string
    
    // 출결 정보
    attendance: {
      rate: number                    // 출석률 (%)
      status: 'present' | 'late' | 'absent' | 'excused'
      lastAttendance: Date
    }
    
    // 수강 정보
    enrollment: {
      className: string
      courseType: string
      remainingSessions?: number      // 남은 수업 횟수
      nextPaymentDate?: Date
      paymentStatus: 'paid' | 'pending' | 'overdue'
    }
    
    // 상태 정보
    status: 'active' | 'inactive' | 'waiting' | 'graduated'
    tags?: string[]                   // 특이사항, 라벨
    priority: 'high' | 'medium' | 'low'
  }
  
  // 카드 상태
  isDragging: boolean
  isSelected: boolean
  isDropTarget: boolean
  
  // 이벤트 핸들러
  onSelect: (studentId: string) => void
  onDoubleClick: (studentId: string) => void
  onContextMenu: (studentId: string, event: MouseEvent) => void
}
```

### 2. 카드 디자인 컴포넌트
```tsx
export function StudentCard({ 
  student, 
  isDragging, 
  isSelected, 
  isDropTarget,
  onSelect,
  onDoubleClick,
  onContextMenu 
}: StudentCardProps) {
  return (
    <Card 
      className={cn(
        "group relative cursor-move transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        isDragging && "opacity-50 rotate-3 scale-105 shadow-xl",
        isSelected && "ring-2 ring-primary ring-offset-2",
        isDropTarget && "ring-2 ring-green-500 ring-offset-2 bg-green-50",
        getStatusStyles(student.status),
        getPriorityStyles(student.priority)
      )}
      onClick={() => onSelect(student.id)}
      onDoubleClick={() => onDoubleClick(student.id)}
      onContextMenu={(e) => onContextMenu(student.id, e)}
    >
      {/* 카드 헤더 - 기본 정보 */}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <StudentAvatar student={student} />
          <StudentStatusBadge status={student.status} />
        </div>
        
        <div className="mt-2">
          <h3 className="font-semibold text-sm leading-tight">
            {student.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {student.grade} · {student.school}
          </p>
        </div>
      </CardHeader>

      {/* 카드 콘텐츠 - 상세 정보 */}
      <CardContent className="py-2 space-y-2">
        {/* 출결 정보 */}
        <AttendanceIndicator attendance={student.attendance} />
        
        {/* 수강 정보 */}
        <EnrollmentInfo enrollment={student.enrollment} />
        
        {/* 태그 및 특이사항 */}
        {student.tags && (
          <StudentTags tags={student.tags} />
        )}
      </CardContent>

      {/* 카드 푸터 - 액션 버튼 */}
      <CardFooter className="pt-2 pb-3">
        <StudentActions student={student} />
      </CardFooter>

      {/* 드래그 핸들 */}
      <DragHandle />
    </Card>
  )
}
```

### 3. 세부 컴포넌트들
```tsx
// 학생 아바타 컴포넌트
function StudentAvatar({ student }: { student: StudentCardProps['student'] }) {
  return (
    <Avatar className="h-12 w-12">
      <AvatarImage src={student.profileImage} alt={student.name} />
      <AvatarFallback className="text-sm font-medium">
        {getInitials(student.name)}
      </AvatarFallback>
    </Avatar>
  )
}

// 출결 상태 표시기
function AttendanceIndicator({ attendance }: { attendance: StudentCardProps['student']['attendance'] }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-1">
        <div className={cn(
          "w-2 h-2 rounded-full",
          {
            'bg-green-500': attendance.status === 'present',
            'bg-yellow-500': attendance.status === 'late', 
            'bg-red-500': attendance.status === 'absent',
            'bg-gray-400': attendance.status === 'excused'
          }
        )} />
        <span className="text-muted-foreground">출석률</span>
      </div>
      <span className="font-medium">{attendance.rate}%</span>
    </div>
  )
}

// 수강 정보 컴포넌트
function EnrollmentInfo({ enrollment }: { enrollment: StudentCardProps['student']['enrollment'] }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">수업</span>
        <span className="font-medium truncate max-w-20">
          {enrollment.className}
        </span>
      </div>
      
      {enrollment.remainingSessions && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">잔여</span>
          <Badge variant="secondary" className="text-xs px-1">
            {enrollment.remainingSessions}회
          </Badge>
        </div>
      )}
      
      <PaymentStatusIndicator status={enrollment.paymentStatus} />
    </div>
  )
}

// 결제 상태 표시기
function PaymentStatusIndicator({ status }: { status: 'paid' | 'pending' | 'overdue' }) {
  const statusConfig = {
    paid: { color: 'green', text: '완납' },
    pending: { color: 'yellow', text: '대기' },
    overdue: { color: 'red', text: '미납' }
  }
  
  const config = statusConfig[status]
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-xs border-0 px-1",
        `bg-${config.color}-50 text-${config.color}-700`
      )}
    >
      {config.text}
    </Badge>
  )
}

// 학생 태그
function StudentTags({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, 2).map((tag, index) => (
        <Badge 
          key={index}
          variant="secondary" 
          className="text-xs px-1 py-0"
        >
          {tag}
        </Badge>
      ))}
      {tags.length > 2 && (
        <Badge variant="outline" className="text-xs px-1 py-0">
          +{tags.length - 2}
        </Badge>
      )}
    </div>
  )
}

// 액션 버튼들
function StudentActions({ student }: { student: StudentCardProps['student'] }) {
  return (
    <div className="flex justify-between w-full">
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
          <Phone className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
          <MessageCircle className="h-3 w-3" />
        </Button>
      </div>
      
      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
        <MoreVertical className="h-3 w-3" />
      </Button>
    </div>
  )
}

// 드래그 핸들
function DragHandle() {
  return (
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <GripVertical className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}
```

---

## 🎨 디자인 시스템 통합

### 색상 테마
```typescript
const cardThemes = {
  // 학생 상태별 테마
  status: {
    active: {
      border: 'border-green-200',
      background: 'bg-white',
      accent: 'accent-green-500'
    },
    inactive: {
      border: 'border-gray-200', 
      background: 'bg-gray-50',
      accent: 'accent-gray-400'
    },
    waiting: {
      border: 'border-yellow-200',
      background: 'bg-yellow-50',
      accent: 'accent-yellow-500'
    },
    graduated: {
      border: 'border-blue-200',
      background: 'bg-blue-50', 
      accent: 'accent-blue-500'
    }
  },
  
  // 우선순위별 테마
  priority: {
    high: 'border-l-4 border-l-red-500',
    medium: 'border-l-4 border-l-yellow-500',
    low: 'border-l-4 border-l-green-500'
  },
  
  // 드래그 상태별 테마
  interaction: {
    dragging: 'shadow-2xl ring-4 ring-primary/20 scale-105 rotate-2',
    dropTarget: 'ring-4 ring-green-500/50 bg-green-50',
    selected: 'ring-2 ring-primary shadow-md'
  }
}
```

### 애니메이션 시스템
```css
/* 카드 전환 애니메이션 */
.student-card {
  @apply transition-all duration-200 ease-in-out;
}

.student-card:hover {
  @apply -translate-y-0.5 shadow-lg;
}

/* 드래그 시작 애니메이션 */
.student-card.dragging {
  @apply scale-105 rotate-2 opacity-90;
  animation: dragStart 0.2s ease-out;
}

@keyframes dragStart {
  0% { transform: scale(1) rotate(0deg); }
  100% { transform: scale(1.05) rotate(2deg); }
}

/* 드롭 대상 펄스 애니메이션 */
.student-card.drop-target {
  animation: dropTargetPulse 1s ease-in-out infinite;
}

@keyframes dropTargetPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.02); opacity: 0.95; }
}

/* 로딩 스켈레톤 애니메이션 */
.card-skeleton {
  @apply animate-pulse bg-gray-200 rounded;
}
```

---

## 🔧 구현 단계

### Step 1: 기본 카드 구조 (6시간)
- [ ] StudentCard 메인 컴포넌트 구현
- [ ] shadcn/ui Card 컴포넌트 활용
- [ ] 기본 레이아웃 및 스타일 적용
- [ ] 반응형 디자인 구현

### Step 2: 세부 컴포넌트 개발 (6시간)
- [ ] StudentAvatar 컴포넌트
- [ ] AttendanceIndicator 구현
- [ ] EnrollmentInfo 컴포넌트
- [ ] PaymentStatusIndicator 구현
- [ ] StudentTags 컴포넌트
- [ ] StudentActions 버튼 그룹

### Step 3: 상호작용 최적화 (3시간)
- [ ] 드래그앤드롭 핸들러 통합
- [ ] 호버 및 선택 상태 구현
- [ ] 컨텍스트 메뉴 연동
- [ ] 키보드 네비게이션 지원

### Step 4: 성능 최적화 (1시간)
- [ ] React.memo 적용
- [ ] 불필요한 리렌더링 방지
- [ ] 이미지 레이지 로딩
- [ ] 애니메이션 성능 최적화

---

## 🧪 테스트 케이스

### 컴포넌트 테스트
```typescript
describe('StudentCard', () => {
  const mockStudent = {
    id: '1',
    name: '김학생',
    grade: '중3',
    school: '○○중학교',
    attendance: { rate: 85, status: 'present' as const },
    enrollment: { 
      className: '수학 A반',
      paymentStatus: 'paid' as const 
    },
    status: 'active' as const,
    priority: 'medium' as const
  }

  test('학생 정보 정확한 표시', () => {
    render(<StudentCard student={mockStudent} />)
    
    expect(screen.getByText('김학생')).toBeInTheDocument()
    expect(screen.getByText('중3 · ○○중학교')).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(screen.getByText('수학 A반')).toBeInTheDocument()
  })

  test('상태별 스타일 적용', () => {
    const { rerender } = render(
      <StudentCard student={mockStudent} />
    )
    
    expect(screen.getByRole('article')).toHaveClass('border-green-200')
    
    rerender(
      <StudentCard 
        student={{ ...mockStudent, status: 'inactive' }} 
      />
    )
    
    expect(screen.getByRole('article')).toHaveClass('bg-gray-50')
  })

  test('드래그 상태 시각화', () => {
    render(
      <StudentCard 
        student={mockStudent} 
        isDragging={true}
      />
    )
    
    expect(screen.getByRole('article')).toHaveClass('opacity-50', 'scale-105')
  })
})
```

### 접근성 테스트
```typescript
describe('StudentCard 접근성', () => {
  test('키보드 네비게이션', async () => {
    render(<StudentCard student={mockStudent} />)
    
    const card = screen.getByRole('article')
    card.focus()
    
    await user.keyboard('{Enter}')
    expect(mockOnSelect).toHaveBeenCalledWith('1')
  })

  test('스크린 리더 지원', () => {
    render(<StudentCard student={mockStudent} />)
    
    const card = screen.getByRole('article')
    expect(card).toHaveAttribute('aria-label', '김학생, 중3, 출석률 85%')
  })

  test('색상 대비비 검증', () => {
    render(<StudentCard student={mockStudent} />)
    
    // 모든 텍스트 요소의 색상 대비비가 4.5:1 이상인지 검증
    const textElements = screen.getAllByText(/.*/)
    textElements.forEach(element => {
      expect(element).toHaveAccessibleDescription()
    })
  })
})
```

### 성능 테스트
```typescript
describe('StudentCard 성능', () => {
  test('렌더링 성능', () => {
    const start = performance.now()
    
    render(
      <div>
        {Array.from({ length: 100 }, (_, i) => (
          <StudentCard 
            key={i}
            student={{ ...mockStudent, id: i.toString() }}
          />
        ))}
      </div>
    )
    
    const end = performance.now()
    expect(end - start).toBeLessThan(1000) // 1초 이내
  })

  test('메모리 사용량', () => {
    const { unmount } = render(<StudentCard student={mockStudent} />)
    
    // 메모리 리크 검사
    unmount()
    
    // 가비지 컬렉션 후 메모리 정리 확인
    expect(mockStudent).toBeDefined()
  })
})
```

---

## 📊 완료 기준

### 기능 요구사항
- [ ] 모든 학생 정보 정확한 표시
- [ ] 상태별 시각적 구분 명확
- [ ] 드래그앤드롭 상호작용 완벽 지원
- [ ] 컨텍스트 메뉴 및 액션 버튼 동작
- [ ] 반응형 레이아웃 완성

### 성능 요구사항
- [ ] 100개 카드 렌더링 < 1초
- [ ] 드래그 응답 시간 < 50ms
- [ ] 메모리 사용량 < 10MB (100개 카드)
- [ ] 애니메이션 60fps 유지

### 접근성 요구사항
- [ ] WCAG 2.1 AA 수준 준수
- [ ] 키보드 네비게이션 완전 지원
- [ ] 스크린 리더 완벽 호환
- [ ] 색상 대비비 4.5:1 이상

### 디자인 품질
- [ ] shadcn/ui 디자인 언어 일관성
- [ ] 상태별 시각적 피드백 명확
- [ ] 애니메이션 자연스러움
- [ ] 타이포그래피 가독성

---

## 🚨 위험 요소 및 대응

### 높은 위험
**성능 저하 (대용량 카드 렌더링)**
- 위험도: 중간 | 영향: 사용자 경험 저하
- 대응: React.memo, 가상화, 레이지 로딩 적용

**접근성 복잡성**
- 위험도: 중간 | 영향: 일부 사용자 접근 제한
- 대응: 전용 접근성 전문가 검토, 단계적 개선

### 기술적 이슈
**shadcn/ui 컴포넌트 제약**
- 위험도: 낮음 | 영향: 디자인 제한
- 대응: 커스터마이징 최소화, 기본 스타일 활용

**드래그앤드롭 호환성**
- 위험도: 낮음 | 영향: 기능 제한
- 대응: @dnd-kit과의 완벽한 호환성 검증

---

## 🔗 관련 태스크

### 선행 태스크
- **T-V2-003**: 기본 UI 컴포넌트 20개 구축
- **T-V2-021**: 등록 완료 후 알림 시스템

### 후속 태스크  
- **T-V2-023**: 클래스 박스 시각화 개선
- **T-V2-024**: react-window 기반 가상화 적용
- **T-V2-025**: 실시간 충돌 감지 및 해결 알고리즘

### 의존성 태스크
- **기존 v1 ClassFlow**: 학생 데이터 구조 및 드래그앤드롭 로직
- **학생 관리 API**: 학생 정보 조회 및 업데이트

---

## 📝 추가 고려사항

### 다크 모드 지원
```typescript
const darkModeStyles = {
  card: 'dark:bg-gray-800 dark:border-gray-700',
  text: 'dark:text-gray-100',
  muted: 'dark:text-gray-400',
  accent: 'dark:bg-gray-700'
}
```

### 국제화 준비
- 모든 텍스트 하드코딩 제거
- RTL 레이아웃 지원 고려
- 날짜/시간 형식 로케일별 대응

### 확장성 고려
- 카드 레이아웃 커스터마이징 옵션
- 추가 학생 정보 필드 동적 표시
- 카드 템플릿 시스템 구축 준비

---

**작성자**: Frontend Developer  
**작성일**: 2025-08-25  
**최종 수정**: 2025-08-25  
**다음 리뷰**: T-V2-023 태스크 시작 전