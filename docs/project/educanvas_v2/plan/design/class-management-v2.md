# EduCanvas v2 클래스 관리 설계 문서

## 📋 설계 개요

**설계 일자**: 2025-08-25  
**설계 버전**: v2.0 Class Management  
**설계 범위**: 클래스 관리 시스템 전체 리뉴얼  
**핵심 철학**: "ClassFlow와 완벽히 통합된 직관적 클래스 운영"

## 🎯 설계 목표

### 핵심 목표
1. **ClassFlow 중심 설계**: 드래그앤드롭으로 모든 학생 배정 관리
2. **실시간 정원 관리**: 정원 초과 방지, 자동 대기자 관리
3. **다차원 필터링**: 과목/강사/요일/시간대별 빠른 검색
4. **시각적 현황 파악**: 한눈에 보는 클래스 상태

## 🏗️ 레이아웃 구조

### 전체 구조 (ClassFlow Integration)

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: 클래스 관리 > [뷰 전환] [필터] [새 클래스]              │
├─────────────┬───────────────────────────────────────────────────┤
│             │                                                     │
│ 사이드바     │ 메인 영역 (ClassFlow Canvas)                      │
│ (필터/검색)  │                                                    │
│             │ ┌─────────────────────────────────────────────────┐│
│ [검색창]    │ │ 월요일    화요일    수요일    목요일    금요일   ││
│             │ ├─────────────────────────────────────────────────┤│
│ 빠른 필터   │ │ ┌────────┐ ┌────────┐ ┌────────┐              ││
│ □ 오늘 수업 │ │ │수학A반  │ │영어B반  │ │수학A반  │              ││
│ □ 정원 임박 │ │ │15/20   │ │18/20   │ │15/20   │              ││
│ □ 신규 개설 │ │ │[학생...]│ │[학생...]│ │[학생...]│              ││
│             │ │ └────────┘ └────────┘ └────────┘              ││
│ 과목별      │ │          ┌────────┐          ┌────────┐        ││
│ ▼ 수학 (5)  │ │          │물리C반  │          │화학D반  │        ││
│ ▼ 영어 (3)  │ │          │8/15    │          │12/15   │        ││
│ ▼ 과학 (4)  │ │          │[학생...]│          │[학생...]│        ││
│             │ │          └────────┘          └────────┘        ││
│ 강사별      │ └─────────────────────────────────────────────────┘│
│ ▼ 김선생 (3)│                                                    │
│ ▼ 이선생 (2)│ [대기 학생 풀]                                     │
│             │ ┌─────────────────────────────────────────────────┐│
│ 시간대별    │ │ 🎓 홍길동  🎓 김철수  🎓 이영희  🎓 박민수      ││
│ ○ 오전     │ │    (수학)     (영어)     (물리)     (미배정)    ││
│ ○ 오후     │ └─────────────────────────────────────────────────┘│
│ ○ 저녁     │                                                     │
└─────────────┴───────────────────────────────────────────────────┘
```

## 🎴 핵심 컴포넌트 설계

### 1. ClassFlow Canvas (메인 영역)

```tsx
interface ClassFlowCanvas {
  // 뷰 모드
  viewMode: {
    type: 'week' | 'day' | 'instructor' | 'room'
    zoom: number  // 50% - 200%
    showEmptySlots: boolean
  }
  
  // 클래스 박스
  classBox: {
    id: string
    name: string
    subject: string
    instructor: string
    room?: string
    time: string
    capacity: {
      current: number
      max: number
      waitlist: number
    }
    students: Student[]
    status: 'active' | 'cancelled' | 'postponed'
    
    // 시각적 표시
    display: {
      color: string  // 과목별 색상
      urgency: 'normal' | 'almost-full' | 'full'
      showPhotos: boolean
      compactMode: boolean
    }
  }
  
  // 드래그앤드롭
  dragAndDrop: {
    enabled: boolean
    source: 'waitlist' | 'another-class' | 'search-result'
    target: ClassBox | null
    
    // 검증
    validation: {
      canDrop: boolean
      reason?: string  // "정원 초과", "시간 충돌" 등
      suggestions?: ClassBox[]  // 대안 클래스
    }
    
    // 애니메이션
    animation: {
      dragOverlay: boolean
      dropZoneHighlight: boolean
      autoScroll: boolean
    }
  }
  
  // 인터랙션
  interactions: {
    onClassClick: (classId: string) => void
    onStudentDrop: (student: Student, targetClass: ClassBox) => void
    onClassEdit: (classId: string) => void
    onQuickAction: (action: QuickAction, classId: string) => void
  }
}
```

### 2. 필터 사이드바

```tsx
interface FilterSidebar {
  // 검색
  search: {
    query: string
    scope: 'all' | 'class-name' | 'student-name' | 'instructor'
    results: SearchResult[]
  }
  
  // 빠른 필터
  quickFilters: {
    todayClasses: boolean
    almostFull: boolean  // 80% 이상
    newClasses: boolean  // 7일 이내 개설
    myClasses: boolean   // 내가 담당하는 클래스
    issues: boolean      // 문제 있는 클래스
  }
  
  // 카테고리 필터
  categoryFilters: {
    // 과목별
    subjects: {
      id: string
      name: string
      count: number
      selected: boolean
      subCategories?: SubCategory[]
    }[]
    
    // 강사별
    instructors: {
      id: string
      name: string
      classCount: number
      selected: boolean
      availability: 'available' | 'busy' | 'off'
    }[]
    
    // 시간대별
    timeSlots: {
      morning: boolean    // 06:00 - 12:00
      afternoon: boolean  // 12:00 - 18:00
      evening: boolean    // 18:00 - 22:00
      weekend: boolean
    }
    
    // 상태별
    status: {
      active: boolean
      full: boolean
      cancelled: boolean
      postponed: boolean
    }
  }
  
  // 정렬
  sorting: {
    by: 'name' | 'time' | 'capacity' | 'instructor' | 'created'
    order: 'asc' | 'desc'
  }
}
```

### 3. 클래스 상세 패널 (Sheet/Modal)

```tsx
interface ClassDetailPanel {
  // 기본 정보
  basicInfo: {
    name: string
    subject: string
    level: string
    instructor: Instructor
    room?: string
    schedule: {
      days: string[]
      time: string
      duration: number  // minutes
    }
    period: {
      startDate: Date
      endDate: Date
      totalSessions: number
    }
  }
  
  // 학생 관리
  studentManagement: {
    enrolled: {
      students: StudentWithAttendance[]
      capacity: number
      canAddMore: boolean
    }
    
    waitlist: {
      students: Student[]
      autoEnroll: boolean
      priority: 'fifo' | 'manual'
    }
    
    attendance: {
      averageRate: number
      lastSession: AttendanceRecord
      issues: AttendanceIssue[]
    }
    
    // 빠른 액션
    quickActions: {
      markAttendance: () => void
      sendNotification: () => void
      exportList: () => void
      printRoster: () => void
    }
  }
  
  // 수업 운영
  operations: {
    // 수업 자료
    materials: {
      textbook?: string
      resources: Resource[]
      assignments: Assignment[]
    }
    
    // 일정 변경
    scheduling: {
      upcomingChanges: ScheduleChange[]
      makeupClasses: MakeupClass[]
      holidays: Holiday[]
    }
    
    // 커뮤니케이션
    communication: {
      announcements: Announcement[]
      parentNotices: Notice[]
      chatEnabled: boolean
    }
  }
  
  // 통계 및 분석
  analytics: {
    performance: {
      attendanceRate: number
      homeworkCompletion: number
      averageScore: number
      trend: 'improving' | 'stable' | 'declining'
    }
    
    financial: {
      revenue: number
      collectionRate: number
      outstanding: Payment[]
    }
  }
}
```

### 4. 대기 학생 풀 (Waiting Pool)

```tsx
interface WaitingStudentPool {
  // 학생 카드
  studentCard: {
    id: string
    name: string
    photo?: string
    grade: string
    
    // 수강 희망
    preferences: {
      subjects: string[]
      preferredTime: string[]
      preferredInstructor?: string
    }
    
    // 우선순위
    priority: {
      level: 'high' | 'normal' | 'low'
      reason?: string  // "형제 재학", "장기 수강" 등
      waitingSince: Date
    }
    
    // 드래그 가능 상태
    draggable: boolean
    matchingClasses: ClassBox[]  // 배정 가능한 클래스
  }
  
  // 필터링
  filters: {
    subject?: string
    grade?: string
    priority?: string
    showOnlyMatching: boolean
  }
  
  // 자동 배정
  autoAssignment: {
    enabled: boolean
    rules: AssignmentRule[]
    preview: () => AssignmentPreview
    execute: () => Promise<AssignmentResult>
  }
}
```

### 5. 클래스 생성/수정 모달

```tsx
interface ClassFormModal {
  mode: 'create' | 'edit' | 'duplicate'
  
  // 기본 정보 탭
  basicInfoTab: {
    name: string
    subject: string
    level: string
    description?: string
    tags: string[]
    
    // 자동 생성 옵션
    autoGenerate: {
      namePattern: string  // "{과목}{레벨}{순번}"
      count: number        // 동시 생성 개수
    }
  }
  
  // 일정 설정 탭
  scheduleTab: {
    // 정규 일정
    regular: {
      days: WeekDay[]
      time: TimeSlot
      duration: number
      room?: string
    }
    
    // 기간 설정
    period: {
      type: 'semester' | 'monthly' | 'custom'
      startDate: Date
      endDate?: Date
      totalSessions?: number
    }
    
    // 충돌 검사
    conflictCheck: {
      instructor: Conflict[]
      room: Conflict[]
      students: Conflict[]
    }
  }
  
  // 강사 배정 탭
  instructorTab: {
    primary: Instructor
    assistants?: Instructor[]
    
    // 강사 추천
    recommendations: {
      byAvailability: Instructor[]
      byExpertise: Instructor[]
      byWorkload: Instructor[]
    }
  }
  
  // 학생 배정 탭
  studentTab: {
    // 정원 설정
    capacity: {
      min: number
      max: number
      waitlistEnabled: boolean
      waitlistMax?: number
    }
    
    // 초기 배정
    initialStudents: Student[]
    
    // 배정 규칙
    rules: {
      levelRestriction?: string
      ageRestriction?: { min: number; max: number }
      prerequisite?: string[]
    }
  }
  
  // 수강료 설정 탭
  pricingTab: {
    basePrice: number
    
    // 할인 정책
    discounts: {
      sibling: number
      earlyBird: number
      package: number
    }
    
    // 추가 비용
    additional: {
      material?: number
      activity?: number
    }
  }
}
```

## 🎨 주요 UI 컴포넌트

### ClassBox 컴포넌트 (ClassFlow 핵심)

```tsx
const ClassBox = memo(({ 
  class: classData,
  isDropTarget,
  isDragging,
  onDrop,
  onEdit,
  onQuickAction
}: ClassBoxProps) => {
  const capacityPercentage = (classData.enrolled / classData.capacity) * 100
  const urgencyLevel = getUrgencyLevel(capacityPercentage)
  
  return (
    <Card
      className={cn(
        "class-box relative",
        "min-h-[120px] p-3",
        "border-2 transition-all",
        isDropTarget && "border-blue-500 bg-blue-50",
        isDragging && "opacity-50",
        urgencyLevel === 'full' && "border-red-300 bg-red-50",
        urgencyLevel === 'almost-full' && "border-yellow-300 bg-yellow-50"
      )}
      onDrop={(e) => handleDrop(e, classData.id)}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-semibold text-sm">{classData.name}</h4>
          <p className="text-xs text-gray-600">{classData.instructor}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="xs">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(classData.id)}>
              수정
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onQuickAction('attendance', classData.id)}>
              출석 체크
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onQuickAction('notify', classData.id)}>
              알림 발송
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* 정원 표시 */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span>정원</span>
          <span className={cn(
            "font-medium",
            urgencyLevel === 'full' && "text-red-600",
            urgencyLevel === 'almost-full' && "text-yellow-600"
          )}>
            {classData.enrolled}/{classData.capacity}
          </span>
        </div>
        <Progress 
          value={capacityPercentage} 
          className="h-1.5"
          indicatorClassName={cn(
            urgencyLevel === 'full' && "bg-red-500",
            urgencyLevel === 'almost-full' && "bg-yellow-500"
          )}
        />
      </div>
      
      {/* 학생 미니 리스트 */}
      <div className="student-mini-list">
        <div className="flex flex-wrap gap-1">
          {classData.students.slice(0, 5).map(student => (
            <StudentChip
              key={student.id}
              student={student}
              size="xs"
              draggable
            />
          ))}
          {classData.students.length > 5 && (
            <span className="text-xs text-gray-500">
              +{classData.students.length - 5}
            </span>
          )}
        </div>
      </div>
      
      {/* 대기자 표시 */}
      {classData.waitlist > 0 && (
        <div className="mt-2 pt-2 border-t">
          <span className="text-xs text-gray-500">
            대기 {classData.waitlist}명
          </span>
        </div>
      )}
    </Card>
  )
})
```

### StudentChip 컴포넌트 (드래그 가능)

```tsx
const StudentChip = ({ 
  student, 
  size = 'sm',
  draggable = true,
  onRemove
}: StudentChipProps) => {
  return (
    <div
      className={cn(
        "student-chip",
        "inline-flex items-center gap-1",
        "bg-white border rounded-full",
        "cursor-move select-none",
        size === 'xs' && "px-2 py-0.5 text-xs",
        size === 'sm' && "px-3 py-1 text-sm"
      )}
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData('student', JSON.stringify(student))
        e.dataTransfer.effectAllowed = 'move'
      }}
    >
      {student.photo ? (
        <img 
          src={student.photo} 
          alt={student.name}
          className={cn(
            "rounded-full",
            size === 'xs' && "w-4 h-4",
            size === 'sm' && "w-5 h-5"
          )}
        />
      ) : (
        <div className={cn(
          "rounded-full bg-gray-300",
          size === 'xs' && "w-4 h-4",
          size === 'sm' && "w-5 h-5"
        )} />
      )}
      <span>{student.name}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(student.id)
          }}
          className="ml-1 hover:text-red-500"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
```

## 🔄 상태 관리

### ClassFlow Store

```typescript
interface ClassFlowState {
  // 뷰 상태
  view: {
    mode: 'week' | 'day' | 'instructor' | 'room'
    date: Date
    filters: FilterState
    sorting: SortState
  }
  
  // 클래스 데이터
  classes: {
    all: ClassWithDetails[]
    filtered: ClassWithDetails[]
    selected: string | null
  }
  
  // 학생 풀
  studentPool: {
    waiting: Student[]
    searching: Student[]
    dragging: Student | null
  }
  
  // 드래그앤드롭
  dragAndDrop: {
    isDragging: boolean
    draggedItem: Student | null
    targetClass: string | null
    canDrop: boolean
    dropReason?: string
  }
  
  // 실시간 업데이트
  realtime: {
    connected: boolean
    updates: RealtimeUpdate[]
    conflicts: Conflict[]
  }
  
  // 액션
  actions: {
    // 클래스 관리
    createClass: (data: CreateClassData) => Promise<void>
    updateClass: (id: string, data: UpdateClassData) => Promise<void>
    deleteClass: (id: string) => Promise<void>
    duplicateClass: (id: string) => Promise<void>
    
    // 학생 배정
    assignStudent: (studentId: string, classId: string) => Promise<void>
    removeStudent: (studentId: string, classId: string) => Promise<void>
    moveStudent: (studentId: string, fromClass: string, toClass: string) => Promise<void>
    bulkAssign: (assignments: Assignment[]) => Promise<void>
    
    // 대기자 관리
    addToWaitlist: (studentId: string, classId: string) => Promise<void>
    promoteFromWaitlist: (studentId: string, classId: string) => Promise<void>
    
    // 필터링
    setFilters: (filters: Partial<FilterState>) => void
    clearFilters: () => void
    
    // 실시간
    subscribeToUpdates: (classIds: string[]) => void
    unsubscribeFromUpdates: () => void
  }
}
```

## 📱 반응형 설계

### Mobile (< 768px)
- 단일 컬럼 일별 뷰
- 하단 탭 네비게이션
- 스와이프로 날짜 이동
- 풀스크린 클래스 상세

### Tablet (768px - 1024px)
- 2열 그리드
- 축소된 사이드바
- 터치 최적화 드래그앤드롭

### Desktop (> 1024px)
- 전체 ClassFlow Canvas
- 확장된 필터 사이드바
- 멀티 선택 및 벌크 액션

## 🚀 성능 최적화

### 1. 가상화
```typescript
// 대량 클래스 렌더링 최적화
const VirtualizedClassGrid = ({ classes }) => {
  return (
    <VirtualGrid
      columnCount={5}  // 요일
      rowCount={Math.ceil(classes.length / 5)}
      columnWidth={200}
      rowHeight={150}
      width={1000}
      height={600}
    >
      {({ columnIndex, rowIndex, style }) => (
        <div style={style}>
          <ClassBox class={classes[rowIndex * 5 + columnIndex]} />
        </div>
      )}
    </VirtualGrid>
  )
}
```

### 2. 실시간 업데이트 최적화
```typescript
// Selective subscription
useEffect(() => {
  // 화면에 보이는 클래스만 구독
  const visibleClassIds = getVisibleClasses()
  subscribeToUpdates(visibleClassIds)
  
  return () => unsubscribeFromUpdates()
}, [visibleClasses])
```

## 📊 성공 지표

1. **학생 배정 시간**: 기존 대비 70% 단축
2. **정원 관리 정확도**: 99.9%
3. **드래그앤드롭 성능**: 60fps 유지
4. **실시간 동기화**: < 1초 지연
5. **사용자 만족도**: 4.6/5.0

---

**다음 단계**: 직원 관리 v2 설계 문서 작성