# T-V2-010: 클래스 관리 시스템 v2 완성

**작성일**: 2025-09-11  
**태스크 ID**: T-V2-010  
**제목**: 클래스 관리 시스템 v2 완성 (CRUD + 일정 + 통계)  
**우선순위**: P0 (핵심 필수)  
**담당**: Full Stack  
**예상 시간**: 2.5d (20시간)  
**기한**: 2025-09-12  
**스프린트**: S-V2-02  
**Phase**: 1 (핵심 기능 리뉴얼)

---

## 📋 태스크 개요

### 목표
shadcn/ui 기반으로 완전히 새로운 클래스 관리 시스템 v2를 구축하여 기존 v1 시스템을 대체하고, 일정 관리 및 통계 기능을 통합하여 운영 효율성을 극대화한다.

### 배경
- 현재 v1 클래스 관리 시스템은 기본 CRUD 기능만 제공
- 일정 관리와 통계 기능이 분리되어 있어 사용자 경험이 분산됨
- shadcn/ui 디자인 시스템 적용 필요
- 검색 및 필터링 성능 개선 필요

### 핵심 요구사항
1. **shadcn/ui 기반 모던 UI/UX** - 기존 v1 UI 완전 대체
2. **통합 CRUD 시스템** - 클래스 생성/수정/삭제/조회
3. **일정 관리 통합** - 시간표와 연동된 클래스 스케줄링
4. **실시간 통계 대시보드** - 클래스별 출석률, 수익, 학생 현황
5. **고급 검색/필터링** - 다중 조건 검색 및 정렬
6. **성능 최적화** - 대용량 데이터 처리 (가상화 적용)

---

## 🏗️ 상세 구현 계획

### Phase 1: 기반 아키텍처 설계 (0.5d)

#### 1.1 데이터 모델 정의
```typescript
// 기존 v1 구조 개선
interface ClassV2 {
  id: string
  name: string
  description?: string
  instructor_id: string
  subject_id: string
  course_id: string
  capacity: number
  current_enrollment: number
  status: 'active' | 'inactive' | 'suspended'
  
  // v2 추가 필드
  room_id?: string
  price: number
  duration_minutes: number
  start_date: string
  end_date?: string
  
  // 통계 필드 (계산됨)
  attendance_rate?: number
  revenue_total?: number
  next_session?: string
  
  // 메타데이터
  created_at: string
  updated_at: string
  tenant_id: string
}

// 클래스 스케줄 모델
interface ClassSchedule {
  id: string
  class_id: string
  day_of_week: number // 0-6 (일-토)
  start_time: string // HH:mm
  end_time: string // HH:mm
  room_id?: string
  created_at: string
}

// 클래스 통계 모델
interface ClassStats {
  class_id: string
  total_students: number
  active_students: number
  attendance_rate: number
  revenue_current_month: number
  revenue_total: number
  last_session_date?: string
  next_session_date?: string
}
```

#### 1.2 API 엔드포인트 설계
```typescript
// RESTful API 구조
GET    /api/classes           // 목록 조회 (검색/필터링 지원)
POST   /api/classes           // 새 클래스 생성
GET    /api/classes/[id]      // 특정 클래스 조회
PUT    /api/classes/[id]      // 클래스 정보 수정
DELETE /api/classes/[id]      // 클래스 삭제

// 추가 기능 API
GET    /api/classes/[id]/stats      // 클래스 통계
GET    /api/classes/[id]/schedule   // 클래스 일정
POST   /api/classes/[id]/schedule   // 일정 추가
PUT    /api/classes/[id]/schedule/[schedule_id]  // 일정 수정
DELETE /api/classes/[id]/schedule/[schedule_id]  // 일정 삭제

// 대시보드 API
GET    /api/classes/dashboard-stats // 전체 클래스 통계
GET    /api/classes/upcoming        // 다가오는 수업
```

### Phase 2: shadcn/ui 기반 컴포넌트 구축 (1.0d)

#### 2.1 메인 클래스 관리 페이지
```tsx
// src/app/main/classes/page.tsx
export default function ClassesV2Page() {
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">클래스 관리</h1>
          <p className="text-muted-foreground">
            전체 클래스를 통합 관리하고 실시간 현황을 확인하세요
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          새 클래스 등록
        </Button>
      </div>

      {/* 통계 카드 섹션 */}
      <ClassStatsCards />

      {/* 검색 및 필터 */}
      <ClassSearchFilters />

      {/* 클래스 목록 테이블 */}
      <ClassDataTable />

      {/* 모달들 */}
      <CreateClassModal />
      <EditClassModal />
      <ClassDetailModal />
    </div>
  )
}
```

#### 2.2 통계 카드 컴포넌트
```tsx
// src/components/classes/ClassStatsCards.tsx
export function ClassStatsCards() {
  const { data: stats } = useClassDashboardStats()
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">전체 클래스</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalClasses || 0}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-600">활성 {stats?.activeClasses || 0}개</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">총 수강생</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-blue-600">평균 {stats?.avgClassSize || 0}명/클래스</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">이번 달 수익</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₩{(stats?.monthlyRevenue || 0).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-600">+{stats?.revenueGrowth || 0}% 전월 대비</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">평균 출석률</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.avgAttendanceRate || 0}%</div>
          <p className="text-xs text-muted-foreground">
            <span className={`${(stats?.attendanceChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats?.attendanceChange || 0 >= 0 ? '+' : ''}{stats?.attendanceChange || 0}% 지난 주 대비
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 2.3 고급 검색/필터 컴포넌트
```tsx
// src/components/classes/ClassSearchFilters.tsx
export function ClassSearchFilters() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 검색 입력 */}
          <div className="flex-1">
            <Input
              placeholder="클래스명, 강사명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10"
            />
          </div>

          {/* 상태 필터 */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="상태 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="active">활성</SelectItem>
              <SelectItem value="inactive">비활성</SelectItem>
              <SelectItem value="suspended">일시 중단</SelectItem>
            </SelectContent>
          </Select>

          {/* 과목 필터 */}
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="과목 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 과목</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 강사 필터 */}
          <Select value={instructorFilter} onValueChange={setInstructorFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="강사 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 강사</SelectItem>
              {instructors.map((instructor) => (
                <SelectItem key={instructor.id} value={instructor.id}>
                  {instructor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 필터 초기화 */}
          <Button 
            variant="outline" 
            onClick={resetFilters}
            className="px-3"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Phase 3: 데이터 테이블 구현 (0.5d)

#### 3.1 DataTable 컴포넌트
```tsx
// src/components/classes/ClassDataTable.tsx
const columns: ColumnDef<ClassV2>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="클래스명" />
    ),
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue("name")}</div>
        <div className="text-sm text-muted-foreground">
          {row.original.subject_name} • {row.original.course_name}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "instructor_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="담당 강사" />
    ),
  },
  {
    accessorKey: "current_enrollment",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="수강 현황" />
    ),
    cell: ({ row }) => {
      const current = row.getValue("current_enrollment") as number
      const capacity = row.original.capacity
      const percentage = Math.round((current / capacity) * 100)
      
      return (
        <div className="text-center">
          <div className="font-medium">{current}/{capacity}</div>
          <div className="text-sm text-muted-foreground">{percentage}%</div>
          <Progress value={percentage} className="w-16 h-2 mt-1" />
        </div>
      )
    },
  },
  {
    accessorKey: "attendance_rate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="출석률" />
    ),
    cell: ({ row }) => {
      const rate = row.getValue("attendance_rate") as number
      return (
        <div className="text-center">
          <Badge variant={rate >= 80 ? "default" : rate >= 60 ? "secondary" : "destructive"}>
            {rate}%
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "next_session",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="다음 수업" />
    ),
    cell: ({ row }) => {
      const nextSession = row.getValue("next_session") as string
      if (!nextSession) return <span className="text-muted-foreground">-</span>
      
      return (
        <div className="text-sm">
          {format(new Date(nextSession), "MM/dd HH:mm")}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="상태" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge 
          variant={
            status === "active" ? "default" : 
            status === "inactive" ? "secondary" : 
            "destructive"
          }
        >
          {status === "active" ? "활성" : 
           status === "inactive" ? "비활성" : 
           "중단"}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ClassRowActions row={row} />,
  },
]

export function ClassDataTable() {
  const {
    data: classes = [],
    isLoading,
    error
  } = useClasses({
    search: searchTerm,
    status: statusFilter,
    subject: subjectFilter,
    instructor: instructorFilter,
    page: pagination.pageIndex,
    limit: pagination.pageSize,
  })

  const table = useReactTable({
    data: classes.data || [],
    columns,
    pageCount: Math.ceil((classes.total || 0) / pagination.pageSize),
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  })

  if (isLoading) return <ClassTableSkeleton />
  if (error) return <div>에러가 발생했습니다: {error.message}</div>

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  결과가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
```

### Phase 4: 일정 관리 통합 (0.5d)

#### 4.1 클래스 일정 컴포넌트
```tsx
// src/components/classes/ClassScheduleManager.tsx
export function ClassScheduleManager({ classId }: { classId: string }) {
  const { data: schedules, isLoading } = useClassSchedules(classId)
  const [isAddingSchedule, setIsAddingSchedule] = useState(false)

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>수업 일정</CardTitle>
          <Button
            size="sm"
            onClick={() => setIsAddingSchedule(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            일정 추가
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : schedules?.length ? (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <ScheduleItem
                key={schedule.id}
                schedule={schedule}
                onEdit={() => openEditSchedule(schedule)}
                onDelete={() => deleteSchedule(schedule.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            등록된 일정이 없습니다.
          </div>
        )}

        {isAddingSchedule && (
          <AddScheduleForm
            classId={classId}
            onSuccess={() => setIsAddingSchedule(false)}
            onCancel={() => setIsAddingSchedule(false)}
          />
        )}
      </CardContent>
    </Card>
  )
}

function ScheduleItem({ schedule, onEdit, onDelete }) {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Badge variant="outline">{dayNames[schedule.day_of_week]}</Badge>
          <span className="font-medium">
            {schedule.start_time} - {schedule.end_time}
          </span>
        </div>
        {schedule.room_name && (
          <Badge variant="secondary">{schedule.room_name}</Badge>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
```

### Phase 5: API 구현 및 백엔드 연동 (0.5d)

#### 5.1 클래스 API Routes
```typescript
// src/app/api/classes/route.ts
export async function GET(request: Request) {
  try {
    const { user, tenant } = await authenticateRequest(request)
    const { searchParams } = new URL(request.url)
    
    // 쿼리 파라미터 추출
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const subject = searchParams.get('subject') || 'all'
    const instructor = searchParams.get('instructor') || 'all'
    const page = parseInt(searchParams.get('page') || '0')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Supabase 쿼리 구성
    let query = supabase
      .from('classes')
      .select(`
        *,
        instructors:instructor_id (
          id,
          user_profiles:user_id (
            full_name
          )
        ),
        subjects:subject_id (
          id,
          name
        ),
        courses:course_id (
          id,
          name
        ),
        class_schedules (
          id,
          day_of_week,
          start_time,
          end_time,
          classrooms:room_id (
            name
          )
        )
      `)
      .eq('tenant_id', tenant.id)

    // 검색 조건 적용
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,` +
        `instructors.user_profiles.full_name.ilike.%${search}%`
      )
    }

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (subject !== 'all') {
      query = query.eq('subject_id', subject)
    }

    if (instructor !== 'all') {
      query = query.eq('instructor_id', instructor)
    }

    // 페이지네이션 적용
    const from = page * limit
    const to = from + limit - 1
    
    const { data: classes, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false })

    if (error) throw error

    // 통계 데이터 추가 계산
    const enrichedClasses = await Promise.all(
      classes.map(async (cls) => {
        // 출석률 계산
        const attendanceRate = await calculateAttendanceRate(cls.id)
        
        // 다음 수업 일정 계산
        const nextSession = await getNextSession(cls.id)
        
        // 현재 등록 학생 수 계산
        const currentEnrollment = await getCurrentEnrollment(cls.id)

        return {
          ...cls,
          instructor_name: cls.instructors?.user_profiles?.full_name || '',
          subject_name: cls.subjects?.name || '',
          course_name: cls.courses?.name || '',
          attendance_rate: attendanceRate,
          next_session: nextSession,
          current_enrollment: currentEnrollment,
        }
      })
    )

    return Response.json({
      data: enrichedClasses,
      total: count,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    console.error('Classes fetch error:', error)
    return Response.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { user, tenant } = await authenticateRequest(request)
    const body = await request.json()

    // 입력 검증
    const validatedData = createClassSchema.parse(body)

    // 클래스 생성
    const { data: newClass, error } = await supabase
      .from('classes')
      .insert([
        {
          ...validatedData,
          tenant_id: tenant.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ])
      .select()
      .single()

    if (error) throw error

    // 일정이 제공된 경우 스케줄 생성
    if (validatedData.schedules && validatedData.schedules.length > 0) {
      const scheduleInserts = validatedData.schedules.map(schedule => ({
        class_id: newClass.id,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        room_id: schedule.room_id,
        created_at: new Date().toISOString(),
      }))

      await supabase
        .from('class_schedules')
        .insert(scheduleInserts)
    }

    return Response.json(newClass, { status: 201 })

  } catch (error) {
    console.error('Class creation error:', error)
    return Response.json(
      { error: 'Failed to create class' },
      { status: 500 }
    )
  }
}
```

#### 5.2 클래스 통계 API
```typescript
// src/app/api/classes/dashboard-stats/route.ts
export async function GET(request: Request) {
  try {
    const { user, tenant } = await authenticateRequest(request)

    // 전체 클래스 수
    const { count: totalClasses } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)

    // 활성 클래스 수
    const { count: activeClasses } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .eq('status', 'active')

    // 총 수강생 수
    const { data: enrollmentData } = await supabase
      .from('enrollments')
      .select('class_id')
      .eq('status', 'active')
      .in('class_id', 
        supabase
          .from('classes')
          .select('id')
          .eq('tenant_id', tenant.id)
      )

    const totalStudents = enrollmentData?.length || 0
    const avgClassSize = totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0

    // 이번 달 수익
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: paymentsData } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', startOfMonth.toISOString())
      .in('enrollment_id',
        supabase
          .from('enrollments')
          .select('id')
          .in('class_id',
            supabase
              .from('classes')
              .select('id')
              .eq('tenant_id', tenant.id)
          )
      )

    const monthlyRevenue = paymentsData?.reduce((sum, payment) => 
      sum + (payment.amount || 0), 0) || 0

    // 평균 출석률 계산
    const { data: attendanceData } = await supabase
      .from('attendances')
      .select('status, class_id')
      .in('class_id',
        supabase
          .from('classes')
          .select('id')
          .eq('tenant_id', tenant.id)
      )
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const totalAttendances = attendanceData?.length || 0
    const presentAttendances = attendanceData?.filter(a => a.status === 'present').length || 0
    const avgAttendanceRate = totalAttendances > 0 ? 
      Math.round((presentAttendances / totalAttendances) * 100) : 0

    // 성장률 계산 (전월 대비)
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    lastMonth.setDate(1)
    const endLastMonth = new Date(startOfMonth)
    endLastMonth.setTime(endLastMonth.getTime() - 1)

    const { data: lastMonthPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', lastMonth.toISOString())
      .lt('created_at', startOfMonth.toISOString())

    const lastMonthRevenue = lastMonthPayments?.reduce((sum, payment) => 
      sum + (payment.amount || 0), 0) || 0

    const revenueGrowth = lastMonthRevenue > 0 ? 
      Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0

    return Response.json({
      totalClasses: totalClasses || 0,
      activeClasses: activeClasses || 0,
      totalStudents,
      avgClassSize,
      monthlyRevenue,
      revenueGrowth,
      avgAttendanceRate,
      attendanceChange: 0, // 추후 구현
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return Response.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
```

---

## 🧪 테스트 계획

### 단위 테스트
```typescript
// __tests__/components/classes/ClassDataTable.test.tsx
describe('ClassDataTable', () => {
  it('renders class list correctly', () => {
    render(<ClassDataTable />)
    expect(screen.getByText('클래스명')).toBeInTheDocument()
  })

  it('filters classes by search term', async () => {
    render(<ClassDataTable />)
    const searchInput = screen.getByPlaceholderText('클래스명, 강사명으로 검색...')
    fireEvent.change(searchInput, { target: { value: '수학' } })
    
    await waitFor(() => {
      expect(screen.getByText('수학 기초반')).toBeInTheDocument()
    })
  })

  it('handles pagination correctly', async () => {
    render(<ClassDataTable />)
    const nextButton = screen.getByText('다음')
    fireEvent.click(nextButton)
    
    await waitFor(() => {
      expect(mockUseClasses).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 })
      )
    })
  })
})
```

### 통합 테스트
```typescript
// __tests__/api/classes.test.ts
describe('/api/classes', () => {
  describe('GET', () => {
    it('returns paginated class list', async () => {
      const response = await GET(mockRequest)
      const data = await response.json()
      
      expect(data).toHaveProperty('data')
      expect(data).toHaveProperty('total')
      expect(data).toHaveProperty('page')
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('filters by search term', async () => {
      const mockRequest = createMockRequest('?search=수학')
      const response = await GET(mockRequest)
      const data = await response.json()
      
      expect(data.data.every(cls => 
        cls.name.includes('수학') || cls.instructor_name.includes('수학')
      )).toBe(true)
    })
  })

  describe('POST', () => {
    it('creates new class successfully', async () => {
      const newClass = {
        name: '새 클래스',
        instructor_id: 'instructor-1',
        subject_id: 'subject-1',
        course_id: 'course-1',
        capacity: 20,
        price: 100000,
        duration_minutes: 90,
        start_date: '2025-09-15'
      }

      const response = await POST(createMockRequest('', newClass))
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.name).toBe(newClass.name)
    })
  })
})
```

### E2E 테스트
```typescript
// e2e/classes-management.spec.ts
test('complete class management workflow', async ({ page }) => {
  await page.goto('/main/classes')
  
  // 통계 카드 확인
  await expect(page.locator('[data-testid="total-classes"]')).toBeVisible()
  
  // 새 클래스 생성
  await page.click('text=새 클래스 등록')
  await page.fill('[name="name"]', '테스트 클래스')
  await page.selectOption('[name="instructor_id"]', 'instructor-1')
  await page.click('text=등록')
  
  // 생성된 클래스 확인
  await expect(page.locator('text=테스트 클래스')).toBeVisible()
  
  // 검색 기능 테스트
  await page.fill('[placeholder="클래스명, 강사명으로 검색..."]', '테스트')
  await expect(page.locator('text=테스트 클래스')).toBeVisible()
  
  // 클래스 수정
  await page.click('[data-testid="edit-class-button"]')
  await page.fill('[name="name"]', '수정된 테스트 클래스')
  await page.click('text=저장')
  
  await expect(page.locator('text=수정된 테스트 클래스')).toBeVisible()
})
```

---

## 📊 성능 목표

### 응답 시간
- **클래스 목록 로딩**: < 800ms (현재 1.2s → 33% 개선)
- **검색 결과 표시**: < 300ms (현재 500ms → 40% 개선)
- **통계 대시보드**: < 500ms (신규 기능)
- **페이지 전환**: < 200ms (현재 350ms → 43% 개선)

### 사용자 경험
- **첫 페이지 로딩**: < 2초
- **검색 중 실시간 피드백**: 즉시
- **데이터 테이블 스크롤**: 60fps 유지
- **모바일 반응성**: 100% 지원

### 접근성
- **WCAG 2.1 AA 준수**: 100%
- **키보드 네비게이션**: 완전 지원
- **스크린 리더**: aria-label 완비
- **색상 대비비**: 4.5:1 이상

---

## 🔄 마이그레이션 계획

### 기존 v1 시스템과의 호환성
1. **API 엔드포인트 유지**: 기존 `/api/classes` 엔드포인트 확장
2. **데이터 스키마 하위 호환**: 기존 필드 모두 유지
3. **점진적 전환**: v2 페이지 별도 구축 후 라우팅 변경

### 데이터 마이그레이션
```sql
-- 기존 classes 테이블에 v2 필드 추가
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 90,
ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- 클래스 스케줄 테이블 생성
CREATE TABLE IF NOT EXISTS class_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_id UUID REFERENCES classrooms(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 적용
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage class schedules for their tenant" ON class_schedules
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM classes 
    WHERE classes.id = class_schedules.class_id 
    AND classes.tenant_id = auth.jwt() ->> 'tenant_id'
  )
);
```

---

## 📋 체크리스트

### Phase 1: 기반 아키텍처 (0.5d)
- [ ] 데이터 모델 정의 완료
- [ ] API 엔드포인트 설계 완료
- [ ] TypeScript 인터페이스 정의
- [ ] 데이터베이스 스키마 업데이트

### Phase 2: shadcn/ui 컴포넌트 (1.0d)
- [ ] 메인 클래스 관리 페이지 구현
- [ ] 통계 카드 컴포넌트 구현
- [ ] 고급 검색/필터 컴포넌트 구현
- [ ] 반응형 디자인 적용

### Phase 3: 데이터 테이블 (0.5d)
- [ ] DataTable 컴포넌트 구현
- [ ] 컬럼 정의 및 셀 렌더링
- [ ] 페이지네이션 구현
- [ ] 정렬 및 필터링 연동

### Phase 4: 일정 관리 (0.5d)
- [ ] 클래스 일정 컴포넌트 구현
- [ ] 일정 추가/수정/삭제 기능
- [ ] 일정 시각화 (캘린더 뷰)
- [ ] 충돌 감지 로직

### Phase 5: API 및 백엔드 (0.5d)
- [ ] 클래스 CRUD API 구현
- [ ] 통계 API 구현
- [ ] 일정 관리 API 구현
- [ ] 에러 핸들링 및 검증

### 테스트 및 최적화
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] E2E 테스트 작성
- [ ] 성능 테스트 및 최적화

### 배포 준비
- [ ] 마이그레이션 스크립트 작성
- [ ] 프로덕션 환경 테스트
- [ ] 사용자 가이드 작성
- [ ] 모니터링 설정

---

## 🎯 완료 기준

### 기능적 요구사항
1. ✅ 모든 기본 CRUD 기능 정상 작동
2. ✅ 통계 대시보드 실시간 업데이트
3. ✅ 고급 검색/필터링 정확성
4. ✅ 일정 관리 완전 통합
5. ✅ 권한별 접근 제어

### 비기능적 요구사항
1. ✅ 성능 목표 100% 달성
2. ✅ 접근성 WCAG 2.1 AA 준수
3. ✅ 모바일 반응형 완벽 지원
4. ✅ TypeScript 타입 안전성
5. ✅ 테스트 커버리지 80% 이상

### 사용자 경험
1. ✅ 직관적인 UI/UX
2. ✅ 빠른 응답성
3. ✅ 에러 상황 적절한 처리
4. ✅ 로딩 상태 시각적 피드백
5. ✅ 사용자 가이드 제공

---

**작성자**: Lead Dev  
**검토자**: PM, Frontend Lead  
**승인일**: 2025-09-11  
**시작 예정일**: 2025-09-11  
**완료 예정일**: 2025-09-12  
**관련 태스크**: T-V2-008 (Dashboard), T-V2-009 (학생 관리), T-V2-011 (ClassFlow)