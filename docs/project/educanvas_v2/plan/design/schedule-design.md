# EduCanvas v2 시간표 설계 문서

## 📋 설계 개요

**설계 일자**: 2025-08-25  
**설계 버전**: v2.0 Schedule Management  
**설계 범위**: 통합 시간표 관리 시스템  
**핵심 철학**: "드래그앤드롭으로 완성하는 완벽한 시간표"

## 🎯 설계 목표

### 핵심 목표
1. **통합 시간표 뷰**: 강사, 학생, 교실별 일정을 한 화면에
2. **드래그앤드롭 편집**: 직관적인 시간표 조정
3. **자동 충돌 감지**: 강사/교실/학생 스케줄 충돌 실시간 체크
4. **다양한 뷰**: 일간/주간/월간, 강사별/교실별/학생별

## 🏗️ 레이아웃 구조

### 전체 구조 (Multi-View Calendar)

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: 시간표 > [뷰 전환] [날짜 이동] [필터] [새 수업]          │
├─────────────┬───────────────────────────────────────────────────┤
│             │                                                     │
│ 사이드바     │ 메인 영역 (Calendar Grid)                          │
│ (필터/리스트)│                                                    │
│             │ [Week View] 2025년 8월 25일 - 31일                 │
│ [뷰 선택]   │ ┌─────────────────────────────────────────────────┐│
│ ○ 주간      │ │      월    화    수    목    금    토    일     ││
│ ○ 월간      │ ├─────────────────────────────────────────────────┤│
│ ○ 일간      │ │ 9:00 ■■■  ■■■  ■■■               ■■■  ││
│ ○ 강사별    │ │      수학  영어  물리               국어     ││
│             │ │      A반   B반   C반               D반      ││
│ [필터]      │ │                                                 ││
│ □ 내 수업   │ │10:00 ■■■  ■■■  ■■■  ■■■             ││
│ □ 변경사항  │ │      과학  수학  영어  화학              ││
│ □ 휴일      │ │      E반   A반   B반   F반               ││
│             │ │                                                 ││
│ [강사 목록] │ │11:00      ■■■         ■■■  ■■■      ││
│ ▼ 김선생    │ │           음악         미술  체육         ││
│   - 수학A   │ │           G반         H반   I반          ││
│   - 수학B   │ │                                                 ││
│ ▼ 이선생    │ │...                                              ││
│   - 영어C   │ └─────────────────────────────────────────────────┘│
│             │                                                     │
│ [교실 현황] │ [하단 패널]                                        │
│ 101호 (2/3) │ ┌─────────────────────────────────────────────────┐│
│ 102호 (1/3) │ │ 📋 오늘의 일정  📚 변경사항  ⚠️ 충돌 알림    ││
│ 103호 (3/3) │ └─────────────────────────────────────────────────┘│
└─────────────┴───────────────────────────────────────────────────┘
```

## 🎴 핵심 컴포넌트 설계

### 1. Calendar Grid (메인 시간표)

```tsx
interface CalendarGrid {
  // 뷰 모드
  viewMode: {
    type: 'week' | 'month' | 'day' | 'instructor' | 'room'
    dateRange: {
      start: Date
      end: Date
    }
    timeRange: {
      start: number  // 시작 시간 (분)
      end: number    // 종료 시간 (분)
      interval: number  // 간격 (분)
    }
    
    // 표시 옵션
    display: {
      showWeekends: boolean
      showHolidays: boolean
      showBreaks: boolean
      compactMode: boolean
      colorScheme: 'subject' | 'instructor' | 'room' | 'level'
    }
  }
  
  // 시간표 블록
  scheduleBlock: {
    id: string
    title: string
    subtitle?: string  // 강사명, 교실명 등
    
    // 시간 정보
    time: {
      start: Date
      end: Date
      duration: number  // 분
      timezone: string
    }
    
    // 연관 정보
    class: Class
    instructor: Instructor
    room?: Room
    students: Student[]
    
    // 상태
    status: 'confirmed' | 'pending' | 'cancelled' | 'rescheduled'
    
    // 시각적 표시
    display: {
      color: string
      pattern?: 'solid' | 'striped' | 'dotted'  // 상태별
      opacity: number
      borderStyle?: string
    }
    
    // 충돌 정보
    conflicts: {
      instructor?: Conflict[]
      room?: Conflict[]
      students?: Conflict[]
    }
  }
  
  // 드래그앤드롭
  dragAndDrop: {
    enabled: boolean
    draggedBlock: ScheduleBlock | null
    dropTarget: TimeSlot | null
    
    // 제약사항
    constraints: {
      minDuration: number
      maxDuration: number
      allowedDays: WeekDay[]
      allowedTimes: TimeRange[]
    }
    
    // 검증
    validation: {
      canDrop: boolean
      warnings: string[]
      suggestions: TimeSlot[]
    }
  }
  
  // 인터랙션
  interactions: {
    onBlockClick: (blockId: string) => void
    onBlockDrag: (block: ScheduleBlock, target: TimeSlot) => void
    onSlotClick: (slot: TimeSlot) => void
    onTimeRangeSelect: (range: TimeRange) => void
  }
}
```

### 2. 필터 사이드바

```tsx
interface ScheduleFilterSidebar {
  // 뷰 선택
  viewSelector: {
    current: ViewType
    options: ViewOption[]
    
    customViews: {
      name: string
      config: ViewConfig
    }[]
  }
  
  // 필터 옵션
  filters: {
    // 범위 필터
    scope: {
      myClasses: boolean
      allClasses: boolean
      publicEvents: boolean
    }
    
    // 상태 필터
    status: {
      confirmed: boolean
      pending: boolean
      cancelled: boolean
      rescheduled: boolean
    }
    
    // 카테고리 필터
    categories: {
      subjects: {
        [subject: string]: boolean
      }
      instructors: {
        [instructorId: string]: boolean
      }
      rooms: {
        [roomId: string]: boolean
      }
      levels: {
        [level: string]: boolean
      }
    }
    
    // 시간 필터
    timeFilters: {
      morning: boolean    // 오전
      afternoon: boolean  // 오후
      evening: boolean    // 저녁
      weekend: boolean    // 주말
    }
  }
  
  // 리스트 뷰
  listView: {
    // 강사 목록
    instructors: {
      id: string
      name: string
      todayClasses: number
      weeklyHours: number
      status: 'available' | 'busy' | 'off'
      upcomingClass?: {
        name: string
        time: string
        room: string
      }
    }[]
    
    // 교실 현황
    rooms: {
      id: string
      name: string
      capacity: number
      currentUtilization: number
      
      // 오늘 사용 현황
      todaySchedule: {
        time: string
        class: string
        instructor: string
      }[]
      
      availability: 'available' | 'occupied' | 'maintenance'
    }[]
    
    // 변경사항
    changes: {
      type: 'created' | 'modified' | 'cancelled'
      class: string
      instructor: string
      originalTime?: string
      newTime: string
      reason?: string
      timestamp: Date
    }[]
  }
}
```

### 3. 수업 상세 편집 모달

```tsx
interface ClassScheduleModal {
  mode: 'create' | 'edit' | 'reschedule'
  
  // 기본 정보
  basicInfo: {
    className: string
    subject: string
    instructor: Instructor
    room?: Room
    
    // 자동 생성 옵션
    autoNaming: boolean  // "수학 A반 (월수금 14:00)"
  }
  
  // 시간 설정
  timeSettings: {
    // 단일 수업
    single?: {
      date: Date
      startTime: string
      duration: number
      endTime: string  // 자동 계산
    }
    
    // 정기 수업
    recurring?: {
      days: WeekDay[]
      startTime: string
      duration: number
      
      // 반복 설정
      recurrence: {
        type: 'weekly' | 'biweekly' | 'monthly'
        interval: number
        endType: 'never' | 'after' | 'until'
        endValue?: number | Date
      }
      
      // 예외 처리
      exceptions: {
        skipDates: Date[]
        makeupDates: Date[]
      }
    }
  }
  
  // 학생 배정
  studentAssignment: {
    enrolled: Student[]
    capacity: number
    waitlist: Student[]
    
    // 일괄 배정
    bulkAssign: {
      fromClass?: string
      byGrade?: string
      byLevel?: string
    }
  }
  
  // 충돌 검사
  conflictCheck: {
    instructor: {
      conflicts: Conflict[]
      suggestions: TimeSlot[]
    }
    
    room: {
      conflicts: Conflict[]
      alternatives: Room[]
    }
    
    students: {
      conflicts: StudentConflict[]
      affectedCount: number
    }
    
    // 자동 해결
    autoResolve: {
      enabled: boolean
      options: ResolutionOption[]
    }
  }
  
  // 알림 설정
  notifications: {
    // 생성 알림
    onCreate: {
      students: boolean
      parents: boolean
      instructor: boolean
    }
    
    // 변경 알림
    onChange: {
      advanceNotice: number  // 시간 (분)
      methods: ('email' | 'sms' | 'app')[]
    }
    
    // 취소 알림
    onCancel: {
      immediate: boolean
      reason: string
    }
  }
}
```

### 4. 시간표 분석 패널

```tsx
interface ScheduleAnalyticsPanel {
  // 활용도 분석
  utilization: {
    // 교실별
    byRoom: {
      room: Room
      totalHours: number
      utilizedHours: number
      utilizationRate: number
      peakTimes: string[]
      
      // 주간 패턴
      weeklyPattern: {
        [day: string]: number
      }
    }[]
    
    // 강사별
    byInstructor: {
      instructor: Instructor
      scheduledHours: number
      teachingHours: number
      preparationHours: number
      breakHours: number
      
      // 업무 분포
      workload: {
        light: number    // < 80%
        optimal: number  // 80-90%
        heavy: number    // > 90%
      }
    }[]
    
    // 시간대별
    byTimeSlot: {
      timeSlot: string
      totalClasses: number
      totalStudents: number
      popularSubjects: string[]
      roomDemand: number
    }[]
  }
  
  // 충돌 분석
  conflicts: {
    // 유형별
    byType: {
      instructor: number
      room: number
      student: number
      holiday: number
    }
    
    // 심각도별
    bySeverity: {
      critical: ConflictDetail[]  // 수업 불가
      warning: ConflictDetail[]   // 주의 필요
      info: ConflictDetail[]      // 참고 사항
    }
    
    // 해결 제안
    resolutions: {
      automated: ResolutionOption[]
      manual: ResolutionOption[]
      preventive: PreventiveAction[]
    }
  }
  
  // 최적화 제안
  optimization: {
    // 시간표 효율성
    efficiency: {
      score: number  // 0-100
      improvements: Improvement[]
      
      // 제안 사항
      suggestions: {
        type: 'move' | 'swap' | 'merge' | 'split'
        description: string
        impact: 'low' | 'medium' | 'high'
        effort: 'easy' | 'moderate' | 'difficult'
      }[]
    }
    
    // 리소스 분배
    resourceDistribution: {
      unbalanced: ResourceIssue[]
      recommendations: ResourceRecommendation[]
    }
  }
}
```

### 5. 빠른 액션 도구모음

```tsx
interface QuickActionToolbar {
  // 시간 탐색
  timeNavigation: {
    currentDate: Date
    
    actions: {
      today: () => void
      previousWeek: () => void
      nextWeek: () => void
      goToDate: (date: Date) => void
    }
    
    // 빠른 이동
    quickJump: {
      label: string
      date: Date
    }[]  // "다음 월요일", "학기 시작일" 등
  }
  
  // 벌크 액션
  bulkActions: {
    selectedBlocks: ScheduleBlock[]
    
    actions: {
      move: (targetTime: TimeSlot) => void
      cancel: (reason: string) => void
      duplicate: (times: number) => void
      notify: (message: string) => void
    }
    
    // 패턴 적용
    applyPattern: {
      shift: number  // 시간 이동 (분)
      repeat: number  // 반복 횟수
      interval: number  // 간격 (일)
    }
  }
  
  // 템플릿
  templates: {
    // 저장된 시간표 템플릿
    saved: {
      id: string
      name: string
      description: string
      preview: SchedulePreview
      
      apply: () => Promise<void>
    }[]
    
    // 빠른 생성
    quickCreate: {
      regularClass: () => void
      makeupClass: () => void
      specialEvent: () => void
      holiday: () => void
    }
  }
  
  // 내보내기/공유
  export: {
    // 포맷 옵션
    formats: ('pdf' | 'excel' | 'ical' | 'google')[]
    
    // 범위 설정
    range: {
      current: 'week' | 'month' | 'semester'
      custom: DateRange
    }
    
    // 필터 적용
    includeFilters: boolean
    
    actions: {
      print: () => void
      download: (format: string) => void
      share: (method: string) => void
    }
  }
}
```

## 🎨 주요 UI 컴포넌트

### ScheduleBlock 컴포넌트

```tsx
const ScheduleBlock = memo(({ 
  block,
  isDragging,
  isSelected,
  conflicts,
  onDragStart,
  onEdit
}: ScheduleBlockProps) => {
  const hasConflicts = conflicts.length > 0
  const statusColor = getStatusColor(block.status)
  
  return (
    <div
      className={cn(
        "schedule-block",
        "relative rounded-md p-2 text-sm",
        "cursor-move select-none",
        "border-l-4 transition-all",
        statusColor.bg,
        statusColor.border,
        isDragging && "opacity-60 scale-95",
        isSelected && "ring-2 ring-blue-500",
        hasConflicts && "ring-2 ring-red-500"
      )}
      draggable
      onDragStart={(e) => onDragStart(e, block)}
      onClick={() => onEdit(block.id)}
    >
      {/* 메인 정보 */}
      <div className="font-medium text-gray-900 truncate">
        {block.title}
      </div>
      
      {block.subtitle && (
        <div className="text-xs text-gray-600 truncate">
          {block.subtitle}
        </div>
      )}
      
      {/* 시간 표시 */}
      <div className="text-xs text-gray-500 mt-1">
        {format(block.time.start, 'HH:mm')} - {format(block.time.end, 'HH:mm')}
      </div>
      
      {/* 상태 아이콘 */}
      <div className="absolute top-1 right-1 flex gap-1">
        {hasConflicts && (
          <AlertTriangle className="h-3 w-3 text-red-500" />
        )}
        
        {block.status === 'pending' && (
          <Clock className="h-3 w-3 text-yellow-500" />
        )}
        
        {block.status === 'cancelled' && (
          <X className="h-3 w-3 text-red-500" />
        )}
      </div>
      
      {/* 학생 수 표시 */}
      {block.students.length > 0 && (
        <div className="absolute bottom-1 right-1">
          <Badge variant="secondary" className="text-xs">
            {block.students.length}
          </Badge>
        </div>
      )}
    </div>
  )
})
```

### ConflictAlert 컴포넌트

```tsx
const ConflictAlert = ({ conflicts, onResolve, onDismiss }) => {
  const criticalConflicts = conflicts.filter(c => c.severity === 'critical')
  
  return (
    <Alert variant={criticalConflicts.length > 0 ? 'destructive' : 'warning'}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        시간표 충돌 {conflicts.length}건 발견
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-2">
          {conflicts.slice(0, 3).map(conflict => (
            <div key={conflict.id} className="flex items-center justify-between">
              <div>
                <span className="font-medium">{conflict.title}</span>
                <span className="text-sm text-gray-500 ml-2">
                  {conflict.description}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onResolve(conflict.id)}
              >
                해결
              </Button>
            </div>
          ))}
          
          {conflicts.length > 3 && (
            <div className="text-sm text-gray-500">
              및 {conflicts.length - 3}건 더...
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button size="sm" onClick={() => onResolve('all')}>
            모두 자동 해결
          </Button>
          <Button variant="outline" size="sm" onClick={onDismiss}>
            나중에
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
```

## 🔄 상태 관리

### Schedule Store

```typescript
interface ScheduleState {
  // 뷰 상태
  view: {
    type: ViewType
    dateRange: DateRange
    filters: ScheduleFilters
    selectedBlocks: string[]
  }
  
  // 스케줄 데이터
  schedule: {
    blocks: ScheduleBlock[]
    recurring: RecurringSchedule[]
    templates: ScheduleTemplate[]
  }
  
  // 충돌 관리
  conflicts: {
    detected: Conflict[]
    resolved: ResolvedConflict[]
    suggestions: ResolutionSuggestion[]
  }
  
  // 드래그앤드롭
  dragState: {
    isDragging: boolean
    draggedBlock: ScheduleBlock | null
    dropTarget: TimeSlot | null
    previewMode: boolean
  }
  
  // 액션
  actions: {
    // 스케줄 관리
    createSchedule: (data: CreateScheduleData) => Promise<void>
    updateSchedule: (id: string, data: UpdateScheduleData) => Promise<void>
    deleteSchedule: (id: string) => Promise<void>
    
    // 이동/복사
    moveSchedule: (id: string, newTime: TimeSlot) => Promise<void>
    copySchedule: (id: string, targetTimes: TimeSlot[]) => Promise<void>
    
    // 충돌 관리
    detectConflicts: () => Promise<Conflict[]>
    resolveConflict: (conflictId: string, resolution: Resolution) => Promise<void>
    
    // 뷰 제어
    setView: (viewType: ViewType, options?: ViewOptions) => void
    setFilters: (filters: ScheduleFilters) => void
    
    // 템플릿
    saveTemplate: (name: string) => Promise<void>
    applyTemplate: (templateId: string) => Promise<void>
  }
}
```

## 📊 성공 지표

1. **시간표 작성 시간**: 기존 대비 60% 단축
2. **충돌 감지 정확도**: 99.9%
3. **드래그앤드롭 성능**: 60fps 유지
4. **사용자 만족도**: 4.5/5.0
5. **시간표 활용도**: 85% 이상

---

**다음 단계**: 통계 및 리포트 설계 문서 작성