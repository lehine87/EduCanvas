# EduCanvas v2 직원 관리 설계 문서

## 📋 설계 개요

**설계 일자**: 2025-08-25  
**설계 버전**: v2.0 Staff Management  
**설계 범위**: 통합 직원 관리 시스템 (강사 + 행정직원)  
**핵심 철학**: "역할 기반 스마트 인력 관리"

## 🎯 설계 목표

### 핵심 목표
1. **통합 관리**: 강사와 행정직원을 하나의 시스템에서 관리
2. **역할 기반 뷰**: 직급/역할별 맞춤 인터페이스
3. **급여 자동화**: 복잡한 급여 정책 자동 계산
4. **업무 가시화**: 담당 업무와 일정 한눈에 파악

## 🏗️ 레이아웃 구조

### 전체 구조 (Org Chart + Grid View)

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: 직원 관리 > [조직도] [목록] [급여] [근태] [+ 직원 추가]  │
├─────────────┬───────────────────────────────────────────────────┤
│             │                                                     │
│ 사이드바     │ 메인 영역                                          │
│ (필터/그룹)  │                                                    │
│             │ [조직도 뷰]                                        │
│ [검색창]    │ ┌─────────────────────────────────────────────────┐│
│             │ │                    원장                          ││
│ 역할별      │ │                     │                           ││
│ □ 원장     │ │      ┌──────────────┼──────────────┐           ││
│ □ 부원장   │ │      │              │              │           ││
│ □ 팀장     │ │   교무부장       행정부장       강사팀장        ││
│ □ 강사     │ │      │              │              │           ││
│ □ 행정직   │ │  ┌───┴───┐    ┌───┴───┐    ┌───┴───┐       ││
│ □ 파트타임 │ │  강사A 강사B   직원A 직원B   강사C 강사D       ││
│             │ └─────────────────────────────────────────────────┘│
│ 부서별      │                                                     │
│ ▼ 교무부    │ [목록 뷰]                                          │
│ ▼ 행정부    │ ┌─────────────────────────────────────────────────┐│
│ ▼ 상담부    │ │ 사진  이름   역할    담당업무   근무시간  상태  ││
│             │ │ [김] 김영희  원장    전체총괄   09-18   근무중 ││
│ 고용형태    │ │ [이] 이철수  강사    수학A,B    14-22   수업중 ││
│ ○ 정규직   │ │ [박] 박민수  행정    수납관리   09-18   외근   ││
│ ○ 계약직   │ │ [최] 최지은  강사    영어C,D    10-20   휴가   ││
│ ○ 파트타임 │ └─────────────────────────────────────────────────┘│
│             │                                                     │
│ 근무상태    │ [상세 정보 패널 - 선택한 직원]                      │
│ ○ 근무중   │ ┌─────────────────────────────────────────────────┐│
│ ○ 휴가중   │ │ 기본정보 | 담당업무 | 급여정보 | 근태기록 | 평가 ││
│ ○ 퇴직     │ └─────────────────────────────────────────────────┘│
└─────────────┴───────────────────────────────────────────────────┘
```

## 🎴 핵심 컴포넌트 설계

### 1. 조직도 뷰 (Organization Chart)

```tsx
interface OrganizationChartView {
  // 조직 구조
  structure: {
    root: StaffNode  // 원장/대표
    departments: Department[]
    hierarchy: HierarchyLevel[]
  }
  
  // 노드 정보
  staffNode: {
    id: string
    name: string
    role: string
    department?: string
    photo?: string
    
    // 상태 표시
    status: {
      workStatus: 'working' | 'break' | 'off' | 'vacation'
      currentTask?: string  // "수학A반 수업중"
      availability: 'available' | 'busy' | 'away'
    }
    
    // 연결 정보
    connections: {
      supervisor?: string
      subordinates: string[]
      peers: string[]
    }
    
    // 빠른 정보
    quickInfo: {
      workload: number  // 업무 부하 %
      classCount?: number
      studentCount?: number
      todaySchedule: string[]
    }
  }
  
  // 인터랙션
  interactions: {
    expandable: boolean
    draggable: boolean  // 조직 재편성
    
    onNodeClick: (staffId: string) => void
    onNodeHover: (staffId: string) => void
    onReorganize: (from: string, to: string) => void
  }
  
  // 시각화 옵션
  visualization: {
    layout: 'tree' | 'radial' | 'force'
    showPhotos: boolean
    showStatus: boolean
    compactMode: boolean
    colorByDepartment: boolean
  }
}
```

### 2. 직원 카드/리스트 컴포넌트

```tsx
interface StaffCard {
  // 기본 정보
  basicInfo: {
    id: string
    name: string
    photo?: string
    role: string
    department: string
    employeeNumber: string
    
    // 연락처
    contact: {
      phone: string
      email: string
      emergency?: string
    }
    
    // 고용 정보
    employment: {
      type: 'full-time' | 'part-time' | 'contract'
      joinDate: Date
      contractEndDate?: Date
      probationEndDate?: Date
    }
  }
  
  // 업무 정보
  workInfo: {
    // 강사인 경우
    instructor?: {
      subjects: string[]
      classes: Class[]
      studentCount: number
      weeklyHours: number
      expertise: string[]
    }
    
    // 행정직인 경우
    admin?: {
      responsibilities: string[]
      permissions: Permission[]
      reports: string[]  // 작성 보고서
    }
    
    // 공통
    workSchedule: {
      regularHours: string  // "09:00-18:00"
      workDays: WeekDay[]
      flexTime: boolean
    }
  }
  
  // 급여 정보 (권한에 따라 표시)
  salaryInfo?: {
    type: 'monthly' | 'hourly' | 'per-class'
    base: number
    allowances: Allowance[]
    deductions: Deduction[]
    
    // 성과급
    incentives: {
      studentBonus?: number
      performanceBonus?: number
      retentionBonus?: number
    }
    
    lastPayment: {
      date: Date
      amount: number
      status: 'paid' | 'pending'
    }
  }
  
  // 근태 요약
  attendance: {
    thisMonth: {
      workDays: number
      lateDays: number
      absentDays: number
      overtimeHours: number
    }
    
    todayStatus: 'not-yet' | 'on-time' | 'late' | 'absent' | 'off'
    currentLocation?: 'office' | 'class' | 'outside' | 'home'
  }
  
  // 평가/성과
  performance: {
    rating: number  // 1-5
    lastEvaluation: Date
    kpis: KPI[]
    achievements: Achievement[]
    issues: Issue[]
  }
}
```

### 3. 급여 관리 패널

```tsx
interface SalaryManagementPanel {
  // 급여 대시보드
  dashboard: {
    // 이번 달 급여 요약
    currentMonth: {
      totalPayroll: number
      paidAmount: number
      pendingAmount: number
      employeeCount: number
      
      // 급여 유형별
      byType: {
        monthly: { count: number; amount: number }
        hourly: { count: number; amount: number }
        perClass: { count: number; amount: number }
      }
      
      // 부서별
      byDepartment: {
        [dept: string]: number
      }
    }
    
    // 급여 추이
    trends: {
      months: Month[]
      totalPayroll: number[]
      avgSalary: number[]
      headcount: number[]
    }
  }
  
  // 개인별 급여 계산
  individualCalculation: {
    employee: Staff
    
    // 기본급
    baseSalary: {
      amount: number
      calculation: string  // "월급여", "시급 x 시간"
    }
    
    // 수당
    allowances: {
      overtime?: number
      meal?: number
      transport?: number
      position?: number
      longevity?: number
      custom: CustomAllowance[]
    }
    
    // 공제
    deductions: {
      tax: number
      insurance: {
        health: number
        pension: number
        employment: number
        accident: number
      }
      absence?: number
      advance?: number
    }
    
    // 성과급 (강사)
    performanceBonus?: {
      studentCount: number
      retentionRate: number
      satisfaction: number
      total: number
    }
    
    // 최종 계산
    final: {
      gross: number
      deductions: number
      net: number
    }
  }
  
  // 일괄 처리
  batchProcessing: {
    // 급여 생성
    generatePayroll: {
      month: string
      employees: Staff[]
      preview: PayrollPreview[]
      
      actions: {
        calculate: () => Promise<void>
        approve: () => Promise<void>
        process: () => Promise<void>
      }
    }
    
    // 급여 명세서
    payslips: {
      generate: () => Promise<Payslip[]>
      send: (method: 'email' | 'print') => Promise<void>
      archive: () => Promise<void>
    }
  }
}
```

### 4. 근태 관리 뷰

```tsx
interface AttendanceManagementView {
  // 실시간 근태 현황
  realtime: {
    // 현재 상태
    currentStatus: {
      total: number
      present: number
      late: number
      absent: number
      vacation: number
      outside: number
    }
    
    // 실시간 출퇴근 로그
    todayLogs: {
      time: Date
      employee: Staff
      type: 'check-in' | 'check-out' | 'break-start' | 'break-end'
      method: 'card' | 'mobile' | 'manual'
      location?: string
    }[]
    
    // 이상 징후
    alerts: {
      notCheckedIn: Staff[]  // 출근 시간 지남
      overtime: Staff[]       // 초과 근무 중
      unauthorized: Staff[]   // 비정상 위치
    }
  }
  
  // 캘린더 뷰
  calendar: {
    view: 'month' | 'week' | 'list'
    
    // 일자별 데이터
    dates: {
      [date: string]: {
        employees: {
          staff: Staff
          status: AttendanceStatus
          workHours: number
          overtime?: number
          note?: string
        }[]
        
        summary: {
          attendanceRate: number
          avgWorkHours: number
          issues: string[]
        }
      }
    }
    
    // 휴가/휴무 관리
    leaves: {
      pending: LeaveRequest[]
      approved: LeaveRequest[]
      
      actions: {
        approve: (id: string) => Promise<void>
        reject: (id: string, reason: string) => Promise<void>
        cancel: (id: string) => Promise<void>
      }
    }
  }
  
  // 근태 정책
  policies: {
    workHours: {
      regular: string  // "09:00-18:00"
      flexible: {
        core: string   // "10:00-16:00"
        range: string  // "07:00-22:00"
      }
    }
    
    overtime: {
      maxDaily: number
      maxMonthly: number
      approvalRequired: boolean
      rate: number  // 1.5x
    }
    
    leave: {
      annual: number
      sick: number
      special: LeaveType[]
      carryOver: boolean
    }
  }
}
```

### 5. 직원 상세 정보 패널

```tsx
interface StaffDetailPanel {
  // 탭 구조
  tabs: {
    // 기본 정보 탭
    basicInfo: {
      personal: PersonalInfo
      contact: ContactInfo
      employment: EmploymentInfo
      documents: Document[]
    }
    
    // 담당 업무 탭
    responsibilities: {
      // 강사
      teaching?: {
        currentClasses: Class[]
        subjects: Subject[]
        schedule: WeeklySchedule
        materials: TeachingMaterial[]
        
        performance: {
          studentCount: number
          avgAttendance: number
          satisfaction: number
          retentionRate: number
        }
      }
      
      // 행정
      administrative?: {
        tasks: Task[]
        projects: Project[]
        reports: Report[]
        approvals: Approval[]
      }
      
      // 권한
      permissions: {
        system: SystemPermission[]
        data: DataPermission[]
        approval: ApprovalPermission[]
      }
    }
    
    // 급여 정보 탭
    salary: {
      current: {
        structure: SalaryStructure
        history: SalaryHistory[]
        projection: SalaryProjection
      }
      
      payments: {
        recent: Payment[]
        pending: Payment[]
        issues: PaymentIssue[]
      }
      
      documents: {
        contracts: Contract[]
        payslips: Payslip[]
        taxDocuments: TaxDocument[]
      }
    }
    
    // 근태 기록 탭
    attendance: {
      summary: {
        thisYear: YearlyAttendance
        thisMonth: MonthlyAttendance
        thisWeek: WeeklyAttendance
      }
      
      records: AttendanceRecord[]
      leaves: LeaveRecord[]
      overtime: OvertimeRecord[]
      
      patterns: {
        avgCheckIn: string
        avgCheckOut: string
        lateFrequency: number
        preferredWorkDays: string[]
      }
    }
    
    // 평가/교육 탭
    evaluation: {
      reviews: PerformanceReview[]
      goals: Goal[]
      training: Training[]
      certifications: Certification[]
      
      feedback: {
        from: Feedback[]  // 받은 피드백
        to: Feedback[]    // 준 피드백
      }
    }
  }
}
```

## 🎨 주요 UI 컴포넌트

### StaffOrgNode 컴포넌트 (조직도 노드)

```tsx
const StaffOrgNode = memo(({ 
  staff,
  isSelected,
  isExpanded,
  level,
  onSelect,
  onExpand
}: StaffOrgNodeProps) => {
  const statusColor = getStatusColor(staff.status)
  const workloadLevel = getWorkloadLevel(staff.workload)
  
  return (
    <div
      className={cn(
        "org-node",
        "relative bg-white rounded-lg border-2 p-3",
        "cursor-pointer transition-all",
        "hover:shadow-lg hover:scale-105",
        isSelected && "ring-2 ring-blue-500",
        level === 0 && "border-purple-500",  // 원장
        level === 1 && "border-blue-500",    // 부장
        level === 2 && "border-green-500"    // 팀원
      )}
      onClick={() => onSelect(staff.id)}
    >
      {/* 프로필 */}
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={staff.photo} />
          <AvatarFallback>{staff.name[0]}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{staff.name}</h4>
          <p className="text-xs text-gray-600">{staff.role}</p>
        </div>
        
        {/* 상태 인디케이터 */}
        <div className="flex flex-col items-end gap-1">
          <Badge 
            variant="dot"
            className={cn(
              "text-xs",
              statusColor
            )}
          >
            {staff.status}
          </Badge>
          
          {staff.currentTask && (
            <span className="text-xs text-gray-500">
              {staff.currentTask}
            </span>
          )}
        </div>
      </div>
      
      {/* 업무 부하 게이지 */}
      {staff.workload !== undefined && (
        <div className="mt-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">업무량</span>
            <span className={cn(
              "font-medium",
              workloadLevel === 'high' && "text-red-600",
              workloadLevel === 'medium' && "text-yellow-600",
              workloadLevel === 'low' && "text-green-600"
            )}>
              {staff.workload}%
            </span>
          </div>
          <Progress 
            value={staff.workload} 
            className="h-1.5"
            indicatorClassName={cn(
              workloadLevel === 'high' && "bg-red-500",
              workloadLevel === 'medium' && "bg-yellow-500",
              workloadLevel === 'low' && "bg-green-500"
            )}
          />
        </div>
      )}
      
      {/* 하위 직원 수 */}
      {staff.subordinates?.length > 0 && (
        <button
          className="absolute -bottom-3 left-1/2 transform -translate-x-1/2"
          onClick={(e) => {
            e.stopPropagation()
            onExpand(staff.id)
          }}
        >
          <div className="bg-white border rounded-full px-2 py-0.5 text-xs">
            {isExpanded ? '−' : '+'} {staff.subordinates.length}
          </div>
        </button>
      )}
    </div>
  )
})
```

### SalaryCalculator 컴포넌트

```tsx
const SalaryCalculator = ({ employee, month }) => {
  const [calculation, setCalculation] = useState<SalaryCalculation | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  
  useEffect(() => {
    calculateSalary()
  }, [employee, month])
  
  const calculateSalary = async () => {
    setIsCalculating(true)
    
    try {
      // 기본급 계산
      const base = calculateBaseSalary(employee)
      
      // 수당 계산
      const allowances = calculateAllowances(employee, month)
      
      // 공제 계산
      const deductions = calculateDeductions(base + allowances.total)
      
      // 성과급 계산 (강사)
      const bonus = employee.role === 'instructor' 
        ? await calculatePerformanceBonus(employee, month)
        : 0
      
      setCalculation({
        base,
        allowances,
        deductions,
        bonus,
        gross: base + allowances.total + bonus,
        net: base + allowances.total + bonus - deductions.total
      })
    } finally {
      setIsCalculating(false)
    }
  }
  
  if (isCalculating) {
    return <CalculationSkeleton />
  }
  
  return (
    <Card className="salary-calculator">
      <CardHeader>
        <CardTitle>급여 계산서</CardTitle>
        <CardDescription>
          {employee.name} · {month}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 기본급 */}
        <div className="space-y-2">
          <div className="flex justify-between font-medium">
            <span>기본급</span>
            <span>{formatCurrency(calculation.base)}</span>
          </div>
        </div>
        
        <Separator />
        
        {/* 수당 */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-600">수당</h4>
          {Object.entries(calculation.allowances).map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-gray-600">{getAllowanceName(key)}</span>
              <span>+{formatCurrency(value)}</span>
            </div>
          ))}
        </div>
        
        <Separator />
        
        {/* 공제 */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-600">공제</h4>
          {Object.entries(calculation.deductions).map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-gray-600">{getDeductionName(key)}</span>
              <span className="text-red-600">-{formatCurrency(value)}</span>
            </div>
          ))}
        </div>
        
        {/* 성과급 */}
        {calculation.bonus > 0 && (
          <>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>성과급</span>
              <span className="text-green-600">+{formatCurrency(calculation.bonus)}</span>
            </div>
          </>
        )}
        
        <Separator />
        
        {/* 최종 금액 */}
        <div className="space-y-2 bg-gray-50 p-3 rounded">
          <div className="flex justify-between">
            <span>총 지급액</span>
            <span>{formatCurrency(calculation.gross)}</span>
          </div>
          <div className="flex justify-between">
            <span>총 공제액</span>
            <span className="text-red-600">-{formatCurrency(calculation.deductions.total)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>실 수령액</span>
            <span className="text-blue-600">{formatCurrency(calculation.net)}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button variant="outline" className="w-full">
          급여명세서 발행
        </Button>
      </CardFooter>
    </Card>
  )
}
```

## 🔄 상태 관리

### Staff Store

```typescript
interface StaffState {
  // 뷰 상태
  view: {
    mode: 'org-chart' | 'list' | 'grid'
    filters: StaffFilters
    sorting: SortOptions
    selectedStaff: string | null
  }
  
  // 직원 데이터
  staff: {
    all: StaffMember[]
    filtered: StaffMember[]
    departments: Department[]
    hierarchy: OrgStructure
  }
  
  // 급여 관리
  salary: {
    currentMonth: MonthlyPayroll
    calculations: SalaryCalculation[]
    policies: SalaryPolicy[]
  }
  
  // 근태 관리
  attendance: {
    today: TodayAttendance
    records: AttendanceRecord[]
    leaves: LeaveRequest[]
  }
  
  // 액션
  actions: {
    // CRUD
    createStaff: (data: CreateStaffData) => Promise<void>
    updateStaff: (id: string, data: UpdateStaffData) => Promise<void>
    deleteStaff: (id: string) => Promise<void>
    
    // 조직 관리
    reorganize: (staffId: string, newSupervisor: string) => Promise<void>
    changeRole: (staffId: string, newRole: string) => Promise<void>
    
    // 급여
    calculateSalary: (staffId: string, month: string) => Promise<SalaryCalculation>
    processSalary: (calculations: SalaryCalculation[]) => Promise<void>
    
    // 근태
    checkIn: (staffId: string) => Promise<void>
    checkOut: (staffId: string) => Promise<void>
    approveLeave: (leaveId: string) => Promise<void>
  }
}
```

## 📊 성공 지표

1. **급여 계산 정확도**: 99.9%
2. **근태 관리 자동화**: 80% 이상
3. **조직도 실시간성**: < 1초 업데이트
4. **직원 검색 속도**: < 500ms
5. **관리자 만족도**: 4.7/5.0

---

**다음 단계**: 시간표 설계 문서 작성