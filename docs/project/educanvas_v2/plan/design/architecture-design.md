# EduCanvas v2 아키텍처 설계 문서

## 📋 설계 개요

**설계 일자**: 2025-08-24  
**설계 버전**: v2.0 Architecture  
**설계 범위**: 학생 관리 시스템 전체 UI/UX 재설계  
**핵심 철학**: "검색하면서도 전체를 놓치지 않는다"

## 🎯 설계 목표 및 원칙

### 핵심 설계 목표

1. **검색 중심 워크플로우**: 사이드바 검색을 메인 인터페이스로 전환
2. **Ready State UI**: 빈 화면 없이 항상 유의미한 콘텐츠 표시
3. **Desktop-First 최적화**: 프로페셔널한 데스크톱 환경에 최적화
4. **정보 밀도 극대화**: 한 화면에서 더 많은 정보를 직관적으로 표시

### UI/UX 설계 원칙

**🔍 Search-Driven Interface**
- 검색이 가장 우선되는 인터페이스
- 실시간 검색 결과 반영
- 고급 필터링 옵션 제공

**📱 Information Dense Layout**
- 카드 기반 정보 표시로 정보 밀도 극대화
- 테이블의 제약을 넘어선 유연한 레이아웃
- 컨텍스트별 정보 우선순위 적용

**⚡ Immediate Response**
- 모든 사용자 액션에 즉시 피드백
- 로딩 상태 최소화
- 예측적 데이터 로딩

**🎨 Professional Aesthetics**
- 깔끔하고 현대적인 디자인
- 일관된 색상 체계 및 타이포그래피
- 학원 환경에 적합한 프로페셔널한 느낌

## 🏗️ 전체 아키텍처 구조

### 1. 페이지 레이아웃 구조

```
┌─────────────────────────────────────────────────────────────┐
│ Header (Global Navigation)                                   │
├─────────┬───────────────────────────────────────────────────┤
│ Search  │ Breadcrumb + Page Title                           │
│ Sidebar ├───────────────────────────────────────────────────┤
│         │ Student Info Tab Navigation                       │
│[개별검색]│ ┌──────┬─────┬──────┬──────┬──────┐               │
│🔍 검색창│ │ 기본정보 │ 수강내역 │ 결제내역 │ 출결관리 │ 상담기록 │               │
│홍길동   │ └──────┴─────┴──────┴──────┴──────┘               │
│김철수   ├───────────────────────────────────────────────────┤
│이영희   │ Main Content Area                                │
│------  │ ┌─────────────────────────────────────────────────┐ │
│[선택된  │ │ [기본정보 탭] 전체 요약 대시보드               │ │
│ 학생]   │ │                                                 │ │
│홍길동   │ │ ┌─────────┐ ┌─────────┐ ┌─────────┐           │ │
│ST001   │ │ │수강현황   │ │결제현황   │ │출결현황   │           │ │
│고1     │ │ │3개 과목  │ │정상납부  │ │95% 출석│           │ │
│📷사진   │ │ └─────────┘ └─────────┘ └─────────┘           │ │
│연락처   │ │                                                 │ │
│------  │ │ ┌─────────────────────────────────────────────┐ │ │
│[목록검색]│ │ │ 최근 활동 내역                               │ │ │
│🔍 필터  │ │ │ • 2024-08-20 수학 수업 출석                 │ │ │
│📋 학생  │ │ │ • 2024-08-18 월 수업료 납부                 │ │ │
│   목록  │ └─┴─────────────────────────────────────────────┘ │
└─────────┴───────────────────────────────────────────────────┘
```

### 2. 사이드바 검색 패널 상세 설계

```tsx
<SearchSidebar>
  {/* ===== 섹션 1: 개별 학생 스마트 검색 ===== */}
  <IndividualSearchSection>
    <SectionHeader>개별 검색</SectionHeader>
    
    {/* 스마트 검색창 */}
    <SmartSearchInput 
      placeholder="학생 이름, 전화번호로 검색"
      value={individualSearchQuery}
      onChange={handleIndividualSearch}
      autoFocus
    />
    
    {/* 심플한 검색 결과 리스트 */}
    {individualSearchResults.length > 0 && (
      <SimpleSearchResults>
        {individualSearchResults.map(student => (
          <SimpleStudentItem
            key={student.id}
            student={student}
            onClick={() => selectStudent(student)}
          >
            <span className="font-medium">{student.name}</span>
            <span className="text-sm text-gray-500">
              {student.grade_level} | {student.school_name}
            </span>
          </SimpleStudentItem>
        ))}
      </SimpleSearchResults>
    )}
  </IndividualSearchSection>

  <Divider />

  {/* ===== 섹션 2: 선택된 학생 신상정보 ===== */}
  {selectedStudent && (
    <SelectedStudentProfileSection>
      <SectionHeader>선택된 학생</SectionHeader>
      
      <StudentProfile>
        <StudentAvatar 
          student={selectedStudent} 
          size="xl"
          className="mx-auto mb-3" 
        />
        
        <div className="text-center space-y-1">
          <h3 className="font-bold text-lg">{selectedStudent.name}</h3>
          <p className="text-sm text-gray-600">{selectedStudent.student_number}</p>
          <p className="text-sm text-gray-600">{selectedStudent.grade_level}</p>
          <p className="text-sm text-gray-600">{selectedStudent.school_name}</p>
          <StatusBadge status={selectedStudent.status} className="mt-2" />
        </div>
        
        <ContactInfo className="mt-3 space-y-1">
          {selectedStudent.phone && (
            <div className="flex items-center gap-2 text-sm">
              <PhoneIcon size={14} />
              <span>{selectedStudent.phone}</span>
            </div>
          )}
          {selectedStudent.parent_phone_1 && (
            <div className="flex items-center gap-2 text-sm">
              <PhoneIcon size={14} />
              <span>{selectedStudent.parent_phone_1} (학부모)</span>
            </div>
          )}
          {selectedStudent.email && (
            <div className="flex items-center gap-2 text-sm">
              <EmailIcon size={14} />
              <span>{selectedStudent.email}</span>
            </div>
          )}
        </ContactInfo>
      </StudentProfile>
    </SelectedStudentProfileSection>
  )}

  <Divider />

  {/* ===== 섹션 3: 학생 목록 검색 (필터 기반) ===== */}
  <ListSearchSection>
    <SectionHeader>학생 목록</SectionHeader>
    
    {/* 빠른 필터 */}
    <QuickFilters>
      <FilterChip 
        label="활성 학생" 
        count={1247} 
        active={filters.status === 'active'}
        onClick={() => setFilter('status', 'active')}
      />
      <FilterChip 
        label="신규 학생" 
        count={23}
        active={filters.isNew === true}
        onClick={() => setFilter('isNew', true)}
      />
      <FilterChip 
        label="수업료 미납" 
        count={8}
        active={filters.paymentStatus === 'unpaid'}
        onClick={() => setFilter('paymentStatus', 'unpaid')}
      />
    </QuickFilters>
    
    {/* 고급 필터 */}
    <AdvancedFilters collapsed>
      <GradeLevelFilter />
      <ClassFilter />
      <SchoolFilter />
      <DateRangeFilter />
    </AdvancedFilters>
    
    {/* 필터링된 학생 목록 */}
    <FilteredStudentList>
      {filteredStudents.map(student => (
        <StudentListItem
          key={student.id}
          student={student}
          isSelected={selectedStudent?.id === student.id}
          onClick={() => selectStudent(student)}
          compact={true}
        />
      ))}
    </FilteredStudentList>
    
    {/* 목록 통계 */}
    <ListStats>
      총 {totalCount}명 중 {filteredStudents.length}명 표시
    </ListStats>
  </ListSearchSection>
</SearchSidebar>
```

### 3. 메인 콘텐츠 영역 설계

```tsx
<MainContent>
  {/* 상단 네비게이션 */}
  <ContentHeader>
    <Breadcrumb>
      <BreadcrumbItem>메인</BreadcrumbItem>
      <BreadcrumbItem>학생 관리</BreadcrumbItem>
      {selectedStudent && (
        <BreadcrumbItem>{selectedStudent.name}</BreadcrumbItem>
      )}
    </Breadcrumb>
    
    {/* 학생 정보 카테고리 탭 - 학생이 선택된 경우에만 표시 */}
    {selectedStudent && (
      <StudentDetailTabs>
        <Tab 
          active={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
        >
          기본정보
        </Tab>
        <Tab 
          active={activeTab === 'courses'}
          onClick={() => setActiveTab('courses')}
        >
          수강내역
        </Tab>
        <Tab 
          active={activeTab === 'payments'}
          onClick={() => setActiveTab('payments')}
        >
          결제내역
        </Tab>
        <Tab 
          active={activeTab === 'attendance'}
          onClick={() => setActiveTab('attendance')}
        >
          출결관리
        </Tab>
        <Tab 
          active={activeTab === 'counseling'}
          onClick={() => setActiveTab('counseling')}
        >
          상담기록
        </Tab>
      </StudentDetailTabs>
    )}
    
    {selectedStudent && (
      <ActionButtons>
        <Button variant="primary" onClick={() => openEditModal(selectedStudent)}>
          정보 수정
        </Button>
        <Button variant="outline" onClick={() => handleCall(selectedStudent)}>
          연락하기
        </Button>
        <Button variant="ghost" onClick={() => handlePrint(selectedStudent)}>
          인쇄하기
        </Button>
      </ActionButtons>
    )}
  </ContentHeader>
  
  {/* 선택된 학생의 상세 정보 */}
  {selectedStudent ? (
    <StudentDetailView>
      {/* 선택된 탭에 따른 상세 정보 */}
      <TabContent>
        {activeTab === 'overview' && (
          <OverviewTab student={selectedStudent}>
            {/* 요약 대시보드 */}
            <SummaryDashboard>
              <SummaryCard title="수강 현황" icon="academic-cap">
                <div className="text-2xl font-bold">3개 과목</div>
                <div className="text-sm text-gray-600">수학, 영어, 물리</div>
              </SummaryCard>
              
              <SummaryCard title="결제 현황" icon="credit-card">
                <div className="text-2xl font-bold text-green-600">정상 납부</div>
                <div className="text-sm text-gray-600">다음 납부: 2024-09-01</div>
              </SummaryCard>
              
              <SummaryCard title="출결 현황" icon="calendar">
                <div className="text-2xl font-bold text-blue-600">95%</div>
                <div className="text-sm text-gray-600">이번 달 출석률</div>
              </SummaryCard>
              
              <SummaryCard title="상담 현황" icon="chat">
                <div className="text-2xl font-bold">2건</div>
                <div className="text-sm text-gray-600">진행 중인 상담</div>
              </SummaryCard>
            </SummaryDashboard>
            
            {/* 최근 활동 */}
            <RecentActivities>
              <h3 className="text-lg font-semibold mb-4">최근 활동 내역</h3>
              <ActivityItem>
                <ActivityIcon type="attendance" />
                <div>
                  <div className="font-medium">수학 수업 출석</div>
                  <div className="text-sm text-gray-500">2024-08-20 14:00</div>
                </div>
              </ActivityItem>
              <ActivityItem>
                <ActivityIcon type="payment" />
                <div>
                  <div className="font-medium">8월 수업료 납부</div>
                  <div className="text-sm text-gray-500">2024-08-18 10:30</div>
                </div>
              </ActivityItem>
              <ActivityItem>
                <ActivityIcon type="counseling" />
                <div>
                  <div className="font-medium">학습 상담 완료</div>
                  <div className="text-sm text-gray-500">2024-08-15 16:00</div>
                </div>
              </ActivityItem>
            </RecentActivities>
          </OverviewTab>
        )}
        
        {activeTab === 'courses' && (
          <CoursesTab student={selectedStudent}>
            {/* 수강 과목 상세 정보 */}
            <CourseList />
            <CourseSchedule />
            <CourseProgress />
          </CoursesTab>
        )}
        
        {activeTab === 'payments' && (
          <PaymentsTab student={selectedStudent}>
            {/* 결제 내역 상세 정보 */}
            <PaymentHistory />
            <PaymentStatus />
            <UpcomingPayments />
          </PaymentsTab>
        )}
        
        {activeTab === 'attendance' && (
          <AttendanceTab student={selectedStudent}>
            {/* 출결 관리 상세 정보 */}
            <AttendanceCalendar />
            <AttendanceStats />
            <AttendanceAlerts />
          </AttendanceTab>
        )}
        
        {activeTab === 'counseling' && (
          <CounselingTab student={selectedStudent}>
            {/* 상담 기록 상세 정보 */}
            <CounselingHistory />
            <CounselingNotes />
            <CounselingSchedule />
          </CounselingTab>
        )}
      </TabContent>
    </StudentDetailView>
  ) : (
    <EmptyState>
      <div className="text-center py-16">
        <SearchIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">
          학생을 선택해주세요
        </h2>
        <p className="text-gray-500">
          사이드바에서 학생을 검색하고 선택하면 <br />
          상세 정보가 여기에 표시됩니다.
        </p>
        <div className="mt-6">
          <Button variant="outline" onClick={() => focusSearchInput()}>
            학생 검색하기
          </Button>
        </div>
      </div>
    </EmptyState>
  )}
</MainContent>
```

## 🎴 핵심 컴포넌트 설계

### 1. SimpleStudentItem 컴포넌트 (개별 검색 결과용)

```tsx
interface SimpleStudentItemProps {
  student: Student;
  onClick: (student: Student) => void;
  highlighted?: boolean;
}

const SimpleStudentItem = memo<SimpleStudentItemProps>(({ 
  student, 
  onClick,
  highlighted = false
}) => {
  return (
    <div 
      className={cn(
        "simple-student-item",
        "flex flex-col gap-1 p-2 rounded cursor-pointer transition-colors",
        "hover:bg-gray-50",
        highlighted && "bg-blue-50"
      )}
      role="button"
      tabIndex={0}
      onClick={() => onClick(student)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(student);
        }
      }}
      aria-label={`${student.name} 학생 선택`}
    >
      <span className="font-medium text-gray-900 text-sm">
        {student.name}
      </span>
      <span className="text-xs text-gray-500">
        {student.grade_level} | {student.school_name || '학교 미설정'}
      </span>
    </div>
  );
});

// 목록 검색용 더 상세한 컴포넌트
interface StudentListItemProps {
  student: Student;
  isSelected?: boolean;
  onClick: (student: Student) => void;
}

const StudentListItem = memo<StudentListItemProps>(({ 
  student, 
  isSelected = false,
  onClick
}) => {
  const itemContent = useMemo(() => ({
    name: student.name,
    studentNumber: student.student_number,
    status: student.status,
    avatar: generateAvatar(student.name),
    phone: student.phone || student.parent_phone_1,
    grade: student.grade_level,
    paymentStatus: getPaymentStatus(student),
  }), [student]);

  return (
    <div 
      className={cn(
        "student-list-item",
        "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
        "hover:bg-gray-50 border border-transparent",
        isSelected && "bg-blue-50 border-blue-200",
        student.status === 'inactive' && "opacity-60"
      )}
      role="button"
      tabIndex={0}
      onClick={() => onClick(student)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(student);
        }
      }}
      aria-label={`${itemContent.name} 학생 선택`}
    >
      {/* 작은 아바타 */}
      <Avatar 
        src={itemContent.avatar}
        fallback={itemContent.name[0]}
        size="sm"
        className={cn(
          isSelected && "ring-1 ring-blue-400"
        )}
      />
      
      {/* 학생 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm text-gray-900 truncate">
            {itemContent.name}
          </span>
          <PaymentStatusDot status={itemContent.paymentStatus} />
        </div>
        
        <div className="text-xs text-gray-500 truncate">
          {itemContent.studentNumber}
          {itemContent.grade && ` · ${itemContent.grade}`}
        </div>
      </div>
    </div>
  );
});
```

### 2. SelectedStudentProfile 컴포넌트 (사이드바 선택된 학생)

```tsx
interface SelectedStudentProfileProps {
  student: Student;
  onEdit?: () => void;
  onCall?: () => void;
}

const SelectedStudentProfile = memo<SelectedStudentProfileProps>(({ 
  student, 
  onEdit,
  onCall
}) => {
  return (
    <div className="selected-student-profile bg-white rounded-lg p-4 border shadow-sm">
      {/* 학생 아바타 */}
      <div className="text-center mb-4">
        <StudentAvatar 
          student={student} 
          size="xl"
          className="mx-auto mb-3" 
        />
        <h3 className="font-bold text-lg text-gray-900">{student.name}</h3>
        <p className="text-sm text-gray-600">{student.student_number}</p>
      </div>
      
      {/* 기본 정보 */}
      <div className="space-y-2 text-sm">
        {student.grade_level && (
          <div className="flex items-center gap-2">
            <AcademicCapIcon size={14} className="text-gray-400" />
            <span>{student.grade_level}</span>
          </div>
        )}
        {student.school_name && (
          <div className="flex items-center gap-2">
            <BuildingIcon size={14} className="text-gray-400" />
            <span className="truncate">{student.school_name}</span>
          </div>
        )}
        {student.phone && (
          <div className="flex items-center gap-2">
            <PhoneIcon size={14} className="text-gray-400" />
            <span>{student.phone}</span>
            {onCall && (
              <Button
                variant="ghost"
                size="xs"
                onClick={onCall}
                className="ml-auto"
              >
                연결
              </Button>
            )}
          </div>
        )}
        {student.parent_phone_1 && (
          <div className="flex items-center gap-2">
            <PhoneIcon size={14} className="text-gray-400" />
            <span>{student.parent_phone_1}</span>
            <span className="text-xs text-gray-500">(학부모)</span>
          </div>
        )}
        {student.email && (
          <div className="flex items-center gap-2">
            <EmailIcon size={14} className="text-gray-400" />
            <span className="truncate">{student.email}</span>
          </div>
        )}
      </div>
      
      {/* 상태 및 액션 */}
      <div className="mt-4 pt-3 border-t">
        <div className="flex items-center justify-between mb-3">
          <StatusBadge status={student.status} />
          <PaymentStatusBadge student={student} size="sm" />
        </div>
        
        {onEdit && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onEdit}
            className="w-full"
          >
            정보 수정
          </Button>
        )}
      </div>
    </div>
  );
});
```

### 3. SummaryCard 컴포넌트 (기본정보 탭 요약용)

```tsx
interface SummaryCardProps {
  title: string;
  icon: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
  onClick?: () => void;
}

const SummaryCard = memo<SummaryCardProps>(({
  title,
  icon,
  value,
  subtitle,
  trend,
  color = 'gray',
  onClick
}) => {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    red: 'border-red-200 bg-red-50',
    yellow: 'border-yellow-200 bg-yellow-50',
    gray: 'border-gray-200 bg-gray-50'
  };
  
  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600', 
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    gray: 'text-gray-600'
  };
  
  const valueColorClasses = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    red: 'text-red-700', 
    yellow: 'text-yellow-700',
    gray: 'text-gray-700'
  };

  return (
    <div 
      className={cn(
        "summary-card",
        "rounded-lg border-2 p-4 transition-all",
        colorClasses[color],
        onClick && "cursor-pointer hover:shadow-md"
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-600">{title}</h4>
        <Icon 
          name={icon} 
          size={20} 
          className={iconColorClasses[color]} 
        />
      </div>
      
      {/* 메인 값 */}
      <div className="mb-2">
        <div className={cn(
          "text-2xl font-bold",
          valueColorClasses[color]
        )}>
          {value}
        </div>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
      
      {/* 트렌드 인디케이터 */}
      {trend && (
        <div className="flex items-center text-xs">
          <TrendIcon 
            trend={trend} 
            className={cn(
              "mr-1",
              trend === 'up' && "text-green-500",
              trend === 'down' && "text-red-500", 
              trend === 'neutral' && "text-gray-400"
            )}
          />
          <span className="text-gray-500">
            {trend === 'up' && '증가'}
            {trend === 'down' && '감소'}
            {trend === 'neutral' && '유지'}
          </span>
        </div>
      )}
    </div>
  );
});
```

### 4. SmartSearchInput 컴포넌트

```tsx
interface SmartSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
}

const SmartSearchInput = memo<SmartSearchInputProps>(({
  value,
  onChange,
  placeholder = "학생 이름, 전화번호로 검색",
  onFocus,
  onBlur,
  autoFocus = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 실시간 검색 (매우 빠른 반응)
  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    onChange(query);
  }, [onChange]);
  
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);
  
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);
  
  return (
    <div className={cn(
      "smart-search-input relative",
      isFocused && "focused"
    )}>
      <div className="relative">
        <SearchIcon 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={16}
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            "w-full pl-10 pr-4 py-2 text-sm",
            "border border-gray-300 rounded-lg",
            "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "transition-colors duration-200"
          )}
          role="searchbox"
          aria-label="학생 검색"
        />
        {value && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            aria-label="검색어 지우기"
          >
            <XIcon size={14} />
          </Button>
        )}
      </div>
    </div>
  );
});
```

## 🔄 새로운 상태 관리 아키텍처

### 수정된 Store 구조

```typescript
// stores/studentsV2Store.ts
interface StudentsV2State {
  // 개별 검색 상태
  individualSearch: {
    query: string;
    results: Student[];
    isSearching: boolean;
  };
  
  // 목록 검색 상태  
  listSearch: {
    filters: SearchFilters;
    results: Student[];
    isLoading: boolean;
    pagination: PaginationState;
  };
  
  // 선택된 학생 상태
  selectedStudent: {
    student: Student | null;
    activeTab: 'overview' | 'courses' | 'payments' | 'attendance' | 'counseling';
    detailsLoading: boolean;
  };
  
  // UI 상태
  ui: {
    sidebarCollapsed: boolean;
    showCreateModal: boolean;
    showEditModal: boolean;
  };
  
  // 액션들
  actions: {
    // 개별 검색 액션
    setIndividualSearchQuery: (query: string) => void;
    performIndividualSearch: (query: string) => Promise<void>;
    
    // 목록 검색 액션
    setListFilters: (filters: Partial<SearchFilters>) => void;
    performListSearch: () => Promise<void>;
    
    // 학생 선택 액션
    selectStudent: (student: Student) => void;
    setActiveTab: (tab: StudentTab) => void;
    loadStudentDetails: (studentId: string) => Promise<void>;
    
    // CRUD 액션
    createStudent: (data: CreateStudentData) => Promise<void>;
    updateStudent: (id: string, data: UpdateStudentData) => Promise<void>;
    deleteStudent: (id: string) => Promise<void>;
    
    // UI 액션
    toggleSidebar: (collapsed?: boolean) => void;
    openCreateModal: () => void;
    openEditModal: (student: Student) => void;
  };
}

const useStudentsV2Store = create<StudentsV2State>()((set, get) => ({
  // 초기 상태
  individualSearch: {
    query: '',
    results: [],
    isSearching: false,
  },
  
  listSearch: {
    filters: {},
    results: [],
    isLoading: false,
    pagination: { page: 1, limit: 50, total: 0 },
  },
  
  selectedStudent: {
    student: null,
    activeTab: 'overview',
    detailsLoading: false,
  },
  
  ui: {
    sidebarCollapsed: false,
    showCreateModal: false,
    showEditModal: false,
  },
  
  actions: {
    // 개별 검색 (스마트 검색)
    setIndividualSearchQuery: (query: string) => {
      set(produce((draft) => {
        draft.individualSearch.query = query;
        if (query.length === 0) {
          draft.individualSearch.results = [];
        }
      }));
      
      // 디바운스된 검색 실행
      if (query.length >= 2) {
        debounce(() => {
          get().actions.performIndividualSearch(query);
        }, 300)();
      }
    },
    
    performIndividualSearch: async (query: string) => {
      set(produce((draft) => {
        draft.individualSearch.isSearching = true;
      }));
      
      try {
        const results = await apiCall<Student[]>('/api/students/search', {
          params: { 
            q: query, 
            limit: 10, // 개별 검색은 최대 10개만
            fields: ['name', 'student_number', 'grade_level', 'school_name']
          }
        });
        
        set(produce((draft) => {
          draft.individualSearch.results = results;
          draft.individualSearch.isSearching = false;
        }));
      } catch (error) {
        set(produce((draft) => {
          draft.individualSearch.isSearching = false;
        }));
      }
    },
    
    // 학생 선택 (개별 검색 또는 목록에서)
    selectStudent: (student: Student) => {
      set(produce((draft) => {
        draft.selectedStudent.student = student;
        draft.selectedStudent.activeTab = 'overview';
        draft.selectedStudent.detailsLoading = true;
      }));
      
      // 상세 정보 로드
      get().actions.loadStudentDetails(student.id);
    },
    
    loadStudentDetails: async (studentId: string) => {
      try {
        const detailedStudent = await apiCall<StudentDetails>(`/api/students/${studentId}`, {
          params: { include: 'courses,payments,attendance,counseling' }
        });
        
        set(produce((draft) => {
          draft.selectedStudent.student = detailedStudent;
          draft.selectedStudent.detailsLoading = false;
        }));
      } catch (error) {
        set(produce((draft) => {
          draft.selectedStudent.detailsLoading = false;
        }));
      }
    },
    
    setActiveTab: (tab: StudentTab) => {
      set(produce((draft) => {
        draft.selectedStudent.activeTab = tab;
      }));
    },
    
    // 목록 검색 (필터 기반)
    setListFilters: (filters: Partial<SearchFilters>) => {
      set(produce((draft) => {
        draft.listSearch.filters = { ...draft.listSearch.filters, ...filters };
      }));
      
      // 필터 변경시 즉시 검색
      get().actions.performListSearch();
    },
    
    performListSearch: async () => {
      const { listSearch } = get();
      
      set(produce((draft) => {
        draft.listSearch.isLoading = true;
      }));
      
      try {
        const response = await apiCall<StudentsResponse>('/api/students', {
          params: {
            ...listSearch.filters,
            page: listSearch.pagination.page,
            limit: listSearch.pagination.limit,
          }
        });
        
        set(produce((draft) => {
          draft.listSearch.results = response.students;
          draft.listSearch.pagination.total = response.total;
          draft.listSearch.isLoading = false;
        }));
      } catch (error) {
        set(produce((draft) => {
          draft.listSearch.isLoading = false;
        }));
      }
    },
    
    // ... 기타 CRUD 액션들
  },
}));
```

---

**다음 단계**: 마이그레이션 전략 및 롤백 계획 수립  
**예상 구현 기간**: 6-8주 (단계별 2-3주씩)  
**핵심 혁신 포인트**: 검색 중심 + 사이드바 학생 프로필 + 요약 대시보드
  onChange,
  placeholder = "검색어를 입력하세요",
  autoFocus = false,
  suggestions = []
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 실시간 검색 디바운스
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      onChange(query);
    }, 300),
    [onChange]
  );
  
  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    debouncedSearch(query);
    setShowSuggestions(query.length > 0 && suggestions.length > 0);
  }, [debouncedSearch, suggestions.length]);
  
  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    onChange(suggestion.query);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [onChange]);
  
  return (
    <div className="search-input-container">
      <div className={cn(
        "search-input-wrapper",
        isFocused && "focused"
      )}>
        <Icon name="search" className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          className="search-input"
          role="searchbox"
          aria-label="학생 검색"
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange('');
              setShowSuggestions(false);
            }}
            className="clear-button"
            aria-label="검색어 지우기"
          >
            <Icon name="x" size={16} />
          </Button>
        )}
      </div>
      
      {/* 검색 제안 */}
      {showSuggestions && (
        <div className="search-suggestions">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="search-suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseDown={(e) => e.preventDefault()}
            >
              <Icon name={suggestion.type} size={16} />
              <span className="suggestion-text">
                {suggestion.text}
              </span>
              <span className="suggestion-count">
                {suggestion.count}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
```

### 3. StudentsGrid 컴포넌트

```tsx
interface StudentsGridProps {
  students: Student[];
  loading?: boolean;
  error?: string;
  onStudentEdit: (student: Student) => void;
  onStudentView: (student: Student) => void;
  gridSize?: 'compact' | 'normal' | 'detailed';
}

const StudentsGrid = memo<StudentsGridProps>(({
  students,
  loading = false,
  error,
  onStudentEdit,
  onStudentView,
  gridSize = 'normal'
}) => {
  // 가상화된 그리드 (대량 데이터 처리)
  const containerRef = useRef<HTMLDivElement>(null);
  const { virtualItems, totalSize } = useVirtualizer({
    count: students.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => gridSize === 'compact' ? 120 : 180,
    overscan: 5
  });
  
  // 그리드 반응형 계산
  const gridColumns = useMemo(() => {
    switch (gridSize) {
      case 'compact': return 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6';
      case 'normal': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 'detailed': return 'grid-cols-1 md:grid-cols-2';
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  }, [gridSize]);
  
  // 로딩 상태
  if (loading) {
    return (
      <div className={cn("students-grid", gridColumns)}>
        {Array.from({ length: 12 }).map((_, index) => (
          <StudentCardSkeleton key={index} compact={gridSize === 'compact'} />
        ))}
      </div>
    );
  }
  
  // 에러 상태
  if (error) {
    return (
      <ErrorState 
        title="학생 목록을 불러올 수 없습니다"
        description={error}
        action={{ label: "다시 시도", onClick: () => window.location.reload() }}
      />
    );
  }
  
  // 빈 상태 (Ready State UI - 완전히 빈 화면은 없음)
  if (students.length === 0) {
    return (
      <EmptyState 
        title="검색 결과가 없습니다"
        description="다른 검색어를 시도해보시거나 필터를 조정해보세요"
        illustration="search-empty"
        actions={[
          { label: "전체 보기", onClick: () => {/* 필터 초기화 */} },
          { label: "새 학생 등록", onClick: () => {/* 등록 모달 */} }
        ]}
      />
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className="students-grid-container"
      style={{ height: '600px', overflow: 'auto' }}
    >
      <div
        style={{ height: totalSize }}
        className="relative"
      >
        {virtualItems.map((virtualRow) => {
          const student = students[virtualRow.index];
          return (
            <div
              key={student.id}
              className="absolute inset-x-0"
              style={{
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              <div className={cn("students-grid p-2", gridColumns)}>
                <StudentCard
                  student={student}
                  onEdit={onStudentEdit}
                  onViewDetails={onStudentView}
                  compact={gridSize === 'compact'}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
```

## 🔄 상태 관리 아키텍처

### 1. 새로운 Store 구조

```typescript
// stores/studentsV2Store.ts
interface StudentsV2State {
  // 검색 상태
  search: {
    query: string;
    filters: SearchFilters;
    suggestions: SearchSuggestion[];
    savedSearches: SavedSearch[];
    isSearching: boolean;
  };
  
  // 표시 상태
  display: {
    view: 'grid' | 'list' | 'table';
    gridSize: 'compact' | 'normal' | 'detailed';
    sortBy: SortOption;
    selectedTab: StudentTab;
  };
  
  // 데이터 상태
  data: {
    students: Student[];
    filteredStudents: Student[];
    selectedStudents: string[];
    loading: boolean;
    error: string | null;
    pagination: PaginationState;
  };
  
  // UI 상태
  ui: {
    selectedStudent: Student | null;
    showCreateModal: boolean;
    showBulkActions: boolean;
    sidebarCollapsed: boolean;
  };
  
  // 액션들
  actions: {
    // 검색 액션
    setSearchQuery: (query: string) => void;
    setFilters: (filters: Partial<SearchFilters>) => void;
    clearSearch: () => void;
    saveSearch: (name: string) => void;
    loadSavedSearch: (search: SavedSearch) => void;
    
    // 표시 액션
    setView: (view: DisplayView) => void;
    setGridSize: (size: GridSize) => void;
    setSortBy: (sort: SortOption) => void;
    setSelectedTab: (tab: StudentTab) => void;
    
    // 데이터 액션
    fetchStudents: () => Promise<void>;
    refreshStudents: () => Promise<void>;
    createStudent: (data: CreateStudentData) => Promise<void>;
    updateStudent: (id: string, data: UpdateStudentData) => Promise<void>;
    deleteStudent: (id: string) => Promise<void>;
    bulkUpdateStudents: (ids: string[], data: Partial<Student>) => Promise<void>;
    
    // UI 액션
    selectStudent: (student: Student | null) => void;
    toggleCreateModal: (show?: boolean) => void;
    toggleSidebar: (collapsed?: boolean) => void;
  };
}

const useStudentsV2Store = create<StudentsV2State>()((set, get) => ({
  // 초기 상태
  search: {
    query: '',
    filters: {},
    suggestions: [],
    savedSearches: [],
    isSearching: false,
  },
  
  display: {
    view: 'grid',
    gridSize: 'normal',
    sortBy: 'name',
    selectedTab: 'all',
  },
  
  data: {
    students: [],
    filteredStudents: [],
    selectedStudents: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 50, total: 0 },
  },
  
  ui: {
    selectedStudent: null,
    showCreateModal: false,
    showBulkActions: false,
    sidebarCollapsed: false,
  },
  
  actions: {
    // 실시간 검색 구현
    setSearchQuery: (query: string) => 
      set(produce((draft) => {
        draft.search.query = query;
        draft.search.isSearching = true;
        
        // 클라이언트 사이드 필터링 (즉시 반응)
        draft.data.filteredStudents = draft.data.students.filter(student =>
          student.name.includes(query) ||
          student.student_number.includes(query) ||
          student.phone?.includes(query) ||
          student.parent_phone_1?.includes(query)
        );
        
        // 서버 사이드 검색은 디바운스로 처리
        debounce(() => {
          get().actions.fetchStudents();
          set(produce((draft) => {
            draft.search.isSearching = false;
          }));
        }, 500)();
      })),
      
    // 필터 적용
    setFilters: (filters: Partial<SearchFilters>) =>
      set(produce((draft) => {
        draft.search.filters = { ...draft.search.filters, ...filters };
        // 필터 변경시 즉시 서버에서 새로운 데이터 요청
      })),
      
    // 데이터 가져오기 (서버 사이드 필터링)
    fetchStudents: async () => {
      const { search, data: { pagination } } = get();
      
      set(produce((draft) => {
        draft.data.loading = true;
        draft.data.error = null;
      }));
      
      try {
        const response = await apiCall<StudentsResponse>('/api/students', {
          params: {
            q: search.query,
            ...search.filters,
            page: pagination.page,
            limit: pagination.limit,
          },
        });
        
        set(produce((draft) => {
          draft.data.students = response.students;
          draft.data.filteredStudents = response.students;
          draft.data.pagination.total = response.total;
          draft.data.loading = false;
        }));
      } catch (error) {
        set(produce((draft) => {
          draft.data.error = error.message;
          draft.data.loading = false;
        }));
      }
    },
    
    // ... 기타 액션들
  },
}));
```

### 2. 검색 최적화 전략

```typescript
// hooks/useSearchOptimization.ts
export const useSearchOptimization = () => {
  const { search, actions } = useStudentsV2Store();
  
  // 실시간 검색 (클라이언트 사이드 - 즉시 반응)
  const handleInstantSearch = useCallback(
    debounce((query: string) => {
      actions.setSearchQuery(query);
    }, 150), // 매우 빠른 반응
    []
  );
  
  // 서버 검색 (정확한 결과)
  const handleServerSearch = useCallback(
    debounce((query: string) => {
      if (query.length > 2) {
        actions.fetchStudents();
      }
    }, 500), // 서버 부하 고려
    []
  );
  
  // 검색 제안 생성
  const generateSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length > 1) {
        const suggestions = await apiCall<SearchSuggestion[]>('/api/search/suggestions', {
          params: { q: query, type: 'students' }
        });
        // suggestions를 스토어에 저장
      }
    }, 300),
    []
  );
  
  return {
    handleInstantSearch,
    handleServerSearch,
    generateSuggestions,
    isSearching: search.isSearching,
  };
};
```

## 📱 반응형 디자인 전략

### 1. 브레이크포인트 정의

```typescript
// design-system/breakpoints.ts
export const breakpoints = {
  mobile: '0px',      // 360px - 768px
  tablet: '768px',    // 768px - 1024px  
  desktop: '1024px',  // 1024px - 1440px
  wide: '1440px',     // 1440px+
} as const;

// Responsive Grid Configurations
export const gridConfigs = {
  students: {
    mobile: 'grid-cols-1',
    tablet: 'grid-cols-2', 
    desktop: 'grid-cols-3',
    wide: 'grid-cols-4',
  },
  compact: {
    mobile: 'grid-cols-2',
    tablet: 'grid-cols-4',
    desktop: 'grid-cols-6', 
    wide: 'grid-cols-8',
  },
  detailed: {
    mobile: 'grid-cols-1',
    tablet: 'grid-cols-1',
    desktop: 'grid-cols-2',
    wide: 'grid-cols-2',
  }
} as const;
```

### 2. 사이드바 반응형 동작

```tsx
// components/SearchSidebar.tsx
const SearchSidebar = () => {
  const [isMobile, setIsMobile] = useState(false);
  const { ui, actions } = useStudentsV2Store();
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        // 모바일에서는 사이드바를 기본으로 숨김
        actions.toggleSidebar(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [actions]);
  
  // 모바일에서는 오버레이 모달로 표시
  if (isMobile) {
    return (
      <Dialog open={!ui.sidebarCollapsed} onOpenChange={actions.toggleSidebar}>
        <DialogContent className="max-w-sm p-0">
          <MobileSidebarContent />
        </DialogContent>
      </Dialog>
    );
  }
  
  // 데스크탑에서는 고정 사이드바
  return (
    <aside className={cn(
      "search-sidebar",
      ui.sidebarCollapsed && "collapsed"
    )}>
      <DesktopSidebarContent />
    </aside>
  );
};
```

## 🚀 성능 최적화 전략

### 1. 렌더링 최적화

```typescript
// 메모이제이션 전략
const StudentCard = memo<StudentCardProps>(({ student, ...props }) => {
  // 카드 데이터 메모이제이션
  const cardData = useMemo(() => ({
    displayName: student.name,
    avatar: generateAvatar(student.name),
    status: getStatusColor(student.status),
    stats: calculateStudentStats(student),
  }), [student.name, student.status, student.updated_at]);
  
  // 이벤트 핸들러 메모이제이션
  const handleEdit = useCallback(() => {
    props.onEdit(student);
  }, [student.id, props.onEdit]);
  
  return <Card data={cardData} onEdit={handleEdit} />;
});

// 가상화된 그리드
const VirtualizedGrid = ({ students, ...props }) => {
  const parentRef = useRef();
  
  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(students.length / ITEMS_PER_ROW),
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT + CARD_MARGIN,
    overscan: 2,
  });
  
  return (
    <div ref={parentRef} className="grid-container">
      {rowVirtualizer.getVirtualItems().map((virtualRow) => (
        <div key={virtualRow.index}>
          {students
            .slice(
              virtualRow.index * ITEMS_PER_ROW,
              (virtualRow.index + 1) * ITEMS_PER_ROW
            )
            .map(student => (
              <StudentCard key={student.id} student={student} {...props} />
            ))}
        </div>
      ))}
    </div>
  );
};
```

### 2. 데이터 로딩 최적화

```typescript
// Progressive Loading Strategy
const useProgressiveLoading = () => {
  const [loadingStage, setLoadingStage] = useState<'skeleton' | 'basic' | 'complete'>('skeleton');
  
  useEffect(() => {
    // 1단계: 스켈레톤 표시 (즉시)
    setLoadingStage('skeleton');
    
    // 2단계: 기본 데이터 로드 (빠른 API)
    setTimeout(() => {
      setLoadingStage('basic');
    }, 100);
    
    // 3단계: 완전한 데이터 로드 (상세 정보)
    setTimeout(() => {
      setLoadingStage('complete');
    }, 500);
  }, []);
  
  return loadingStage;
};

// Predictive Preloading
const usePredictivePreloading = () => {
  const { search } = useStudentsV2Store();
  
  useEffect(() => {
    // 사용자가 타이핑 중일 때 다음에 올 가능성이 높은 데이터를 미리 로드
    if (search.query.length > 2) {
      const predictedQueries = generatePredictedQueries(search.query);
      predictedQueries.forEach(query => {
        preloadSearchResults(query);
      });
    }
  }, [search.query]);
};
```

### 3. 메모리 관리

```typescript
// Smart Cleanup Strategy
const useSmartCleanup = () => {
  const { data } = useStudentsV2Store();
  
  useEffect(() => {
    // 화면에서 벗어난 학생 데이터의 상세 정보 정리
    const cleanup = () => {
      if (data.students.length > 1000) {
        // 대량 데이터시 메모리 정리
        requestIdleCallback(() => {
          // 가비지 컬렉션 최적화
          window.gc?.();
        });
      }
    };
    
    const timeoutId = setTimeout(cleanup, 30000);
    return () => clearTimeout(timeoutId);
  }, [data.students.length]);
};
```

## 📊 사용성 개선 전략

### 1. 접근성 (A11y) 강화

```tsx
// 키보드 네비게이션
const useKeyboardNavigation = () => {
  const { data, actions } = useStudentsV2Store();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case '/':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // 검색창에 포커스
            document.querySelector<HTMLInputElement>('[role="searchbox"]')?.focus();
          }
          break;
          
        case 'ArrowUp':
        case 'ArrowDown':
          if (document.activeElement?.closest('.student-card')) {
            e.preventDefault();
            navigateCards(e.key === 'ArrowUp' ? 'up' : 'down');
          }
          break;
          
        case 'Enter':
          if (document.activeElement?.closest('.student-card')) {
            const studentId = document.activeElement.getAttribute('data-student-id');
            if (studentId) {
              const student = data.students.find(s => s.id === studentId);
              if (student) actions.selectStudent(student);
            }
          }
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [data.students, actions]);
};

// 스크린 리더 지원
const StudentCard = ({ student, ...props }) => {
  const ariaLabel = `${student.name}, 학번 ${student.student_number}, ${
    student.status === 'active' ? '활성' : student.status === 'inactive' ? '비활성' : '졸업'
  } 상태${student.phone ? `, 연락처 ${student.phone}` : ''}`;
  
  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-describedby={`student-${student.id}-details`}
      onClick={() => props.onViewDetails(student)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          props.onViewDetails(student);
        }
      }}
    >
      {/* 카드 내용 */}
      <div id={`student-${student.id}-details`} className="sr-only">
        학생 상세 정보: {student.name}님의 학번은 {student.student_number}이며, 
        현재 상태는 {student.status}입니다.
        {student.grade_level && `학년: ${student.grade_level}`}
        {student.school_name && `학교: ${student.school_name}`}
      </div>
    </Card>
  );
};
```

### 2. 사용자 피드백 시스템

```tsx
// 실시간 피드백
const useFeedbackSystem = () => {
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    visible: boolean;
  }>({
    type: 'info',
    message: '',
    visible: false
  });
  
  const showFeedback = useCallback((type: FeedbackType, message: string) => {
    setFeedback({ type, message, visible: true });
    
    // 자동 숨김 (성공/정보 메시지)
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        setFeedback(prev => ({ ...prev, visible: false }));
      }, 3000);
    }
  }, []);
  
  return { feedback, showFeedback };
};

// 로딩 상태 표시
const LoadingStates = {
  searching: (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Spinner size="sm" />
      검색 중...
    </div>
  ),
  
  loading: (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Spinner size="sm" />
      학생 정보를 불러오는 중...
    </div>
  ),
  
  updating: (
    <div className="flex items-center gap-2 text-sm text-blue-600">
      <Spinner size="sm" />
      정보 업데이트 중...
    </div>
  ),
};
```

## 🧪 테스트 전략

### 1. 컴포넌트 테스트

```typescript
// StudentCard.test.tsx
describe('StudentCard', () => {
  const mockStudent: Student = {
    id: '1',
    name: '홍길동',
    student_number: 'ST001',
    status: 'active',
    phone: '010-1234-5678',
    grade_level: '고1',
    school_name: '테스트고등학교'
  };
  
  it('should render student information correctly', () => {
    render(
      <StudentCard 
        student={mockStudent} 
        onEdit={jest.fn()} 
        onViewDetails={jest.fn()} 
      />
    );
    
    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('ST001')).toBeInTheDocument();
    expect(screen.getByText('010-1234-5678')).toBeInTheDocument();
  });
  
  it('should handle keyboard navigation', async () => {
    const mockOnViewDetails = jest.fn();
    
    render(
      <StudentCard 
        student={mockStudent} 
        onEdit={jest.fn()} 
        onViewDetails={mockOnViewDetails} 
      />
    );
    
    const card = screen.getByRole('button');
    card.focus();
    
    await user.keyboard('{Enter}');
    expect(mockOnViewDetails).toHaveBeenCalledWith(mockStudent);
  });
  
  it('should be accessible to screen readers', () => {
    render(
      <StudentCard 
        student={mockStudent} 
        onEdit={jest.fn()} 
        onViewDetails={jest.fn()} 
      />
    );
    
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label');
    expect(card.getAttribute('aria-label')).toContain('홍길동');
    expect(card.getAttribute('aria-label')).toContain('ST001');
  });
});
```

### 2. E2E 테스트

```typescript
// e2e/student-search.spec.ts
test('사용자가 학생을 검색하고 상세정보를 확인할 수 있다', async ({ page }) => {
  await page.goto('/main/students');
  
  // 검색창에 포커스
  await page.click('[role="searchbox"]');
  
  // 검색어 입력
  await page.fill('[role="searchbox"]', '홍길동');
  
  // 실시간 검색 결과 확인
  await expect(page.locator('.student-card')).toContainText('홍길동');
  
  // 학생 카드 클릭
  await page.click('.student-card:has-text("홍길동")');
  
  // 상세 정보 모달/페이지 확인
  await expect(page.locator('[data-testid="student-details"]')).toBeVisible();
  await expect(page.locator('[data-testid="student-name"]')).toContainText('홍길동');
});

test('사용자가 필터를 사용하여 학생을 찾을 수 있다', async ({ page }) => {
  await page.goto('/main/students');
  
  // 고급 필터 열기
  await page.click('[data-testid="advanced-filters-toggle"]');
  
  // 상태 필터 적용
  await page.selectOption('[data-testid="status-filter"]', 'active');
  
  // 학년 필터 적용
  await page.selectOption('[data-testid="grade-filter"]', '고1');
  
  // 필터 적용 버튼
  await page.click('[data-testid="apply-filters"]');
  
  // 결과 확인
  await expect(page.locator('.student-card')).toHaveCount(await page.locator('.student-card').count());
  
  // 모든 카드가 '고1'을 포함하는지 확인
  const cards = await page.locator('.student-card').all();
  for (const card of cards) {
    await expect(card).toContainText('고1');
  }
});
```

## 📈 성공 지표 및 KPI

### 1. 기술적 성능 지표

```typescript
// Performance Monitoring
const performanceMetrics = {
  // Core Web Vitals
  LCP: { target: '< 2.5s', critical: '> 4s' },
  FID: { target: '< 100ms', critical: '> 300ms' },
  CLS: { target: '< 0.1', critical: '> 0.25' },
  
  // Custom Metrics
  searchResponseTime: { target: '< 500ms', critical: '> 1s' },
  cardRenderTime: { target: '< 100ms', critical: '> 300ms' },
  infiniteScrollPerformance: { target: '60fps', critical: '< 30fps' },
  
  // Memory Usage
  memoryUsage: { target: '< 50MB', critical: '> 100MB' },
  memoryLeakRate: { target: '< 1MB/min', critical: '> 5MB/min' },
};

// Performance Tracking Hook
const usePerformanceTracking = () => {
  useEffect(() => {
    // Core Web Vitals 측정
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    });
    
    // Custom Metrics 측정
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name === 'student-search') {
          console.log('Search Performance:', entry.duration);
        }
      });
    });
    
    observer.observe({ entryTypes: ['measure'] });
    
    return () => observer.disconnect();
  }, []);
};
```

### 2. 사용자 경험 지표

```typescript
// User Experience Metrics
const uxMetrics = {
  // Task Completion
  searchSuccess: { target: '> 95%', current: 0 },
  taskCompletionTime: { target: '< 30s', current: 0 },
  errorRate: { target: '< 1%', current: 0 },
  
  // User Satisfaction
  satisfactionScore: { target: '> 4.5/5', current: 0 },
  npsScore: { target: '> 50', current: 0 },
  
  // Engagement
  dailyActiveUsers: { target: '+20%', current: 0 },
  sessionDuration: { target: '+15%', current: 0 },
  featureAdoption: { target: '> 80%', current: 0 },
};

// UX Tracking Implementation
const useUXTracking = () => {
  const [sessionStart] = useState(Date.now());
  
  useEffect(() => {
    // 세션 시간 추적
    const handleBeforeUnload = () => {
      const sessionDuration = Date.now() - sessionStart;
      analytics.track('session_duration', { duration: sessionDuration });
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionStart]);
  
  const trackSearch = useCallback((query: string, resultsCount: number) => {
    analytics.track('student_search', {
      query: query.length, // 길이만 추적 (개인정보 보호)
      results_count: resultsCount,
      timestamp: Date.now()
    });
  }, []);
  
  const trackTaskCompletion = useCallback((task: string, duration: number) => {
    analytics.track('task_completion', {
      task,
      duration,
      success: true
    });
  }, []);
  
  return { trackSearch, trackTaskCompletion };
};
```

## 🚧 마이그레이션 전략

### Phase 1: Foundation (Week 1-2)

**목표**: 새로운 컴포넌트 아키텍처 구축
```typescript
// 1. 새로운 스토어 생성
✅ studentsV2Store.ts 구현
✅ 기존 studentsStore.ts와 병렬 운영

// 2. 핵심 컴포넌트 개발
✅ SearchSidebar 컴포넌트
✅ StudentCard 컴포넌트 (재설계)
✅ StudentsGrid 컴포넌트

// 3. Feature Flag 설정
const useV2Interface = useFeatureFlag('students-v2-ui');
```

### Phase 2: Integration (Week 3-4)

**목표**: 기존 시스템과 통합
```typescript
// 1. API 인터페이스 확장
// 기존 API 유지하면서 v2 최적화 파라미터 추가
export async function GET(request: NextRequest) {
  const version = searchParams.get('ui_version') || 'v1';
  
  if (version === 'v2') {
    // v2 최적화된 응답 (검색 힌트, 미리보기 등)
    return createV2Response(data);
  }
  
  // 기존 v1 응답 유지
  return createV1Response(data);
}

// 2. 점진적 전환
const StudentsPageV2 = () => {
  const useV2 = useFeatureFlag('students-v2-ui');
  
  return useV2 ? <StudentsV2Interface /> : <StudentsV1Interface />;
};
```

### Phase 3: Optimization (Week 5-6)

**목표**: 성능 최적화 및 피드백 반영
```typescript
// 1. 성능 최적화
- 가상화된 무한 스크롤 구현
- 서버 사이드 검색 최적화
- 메모리 사용량 최소화

// 2. 사용자 피드백 반영
- A/B 테스트 결과 분석
- 사용성 개선사항 적용
- 접근성 강화

// 3. 모니터링 강화
- 성능 메트릭 실시간 추적
- 오류율 모니터링
- 사용자 만족도 측정
```

### 롤백 계획

```typescript
// 즉시 롤백 가능한 Feature Flag 시스템
const FeatureFlags = {
  STUDENTS_V2_UI: 'students-v2-ui',
  V2_SEARCH_SIDEBAR: 'v2-search-sidebar', 
  V2_CARD_LAYOUT: 'v2-card-layout',
} as const;

// 세분화된 롤백 제어
const useGradualRollback = () => {
  const [rollbackStage, setRollbackStage] = useState<'none' | 'partial' | 'full'>('none');
  
  const initiateRollback = (stage: RollbackStage, reason: string) => {
    console.warn(`Initiating ${stage} rollback: ${reason}`);
    
    switch (stage) {
      case 'partial':
        // 일부 기능만 v1으로 되돌리기
        disableFeatureFlag(FeatureFlags.V2_SEARCH_SIDEBAR);
        break;
        
      case 'full':
        // 전체 인터페이스 v1으로 되돌리기
        disableFeatureFlag(FeatureFlags.STUDENTS_V2_UI);
        break;
    }
    
    setRollbackStage(stage);
  };
  
  return { rollbackStage, initiateRollback };
};
```

## 📋 결론

EduCanvas v2 아키텍처는 현재 시스템의 견고한 기술적 기반 위에 사용자 중심의 혁신적인 인터페이스를 구축하는 것을 목표로 합니다.

### 핵심 혁신 포인트

1. **검색 중심 워크플로우**: 사이드바 검색으로 항상 접근 가능한 인터페이스
2. **정보 밀도 극대화**: 카드 기반 레이아웃으로 한 화면에서 더 많은 정보 표시
3. **Ready State UI**: 빈 화면 없이 항상 유의미한 콘텐츠 제공
4. **성능 최적화**: 가상화와 메모이제이션으로 대량 데이터 처리 최적화

### 예상 효과

- **작업 효율성 80% 향상**: 검색 시간 5-10초 → 1-2초
- **화면 정보량 100% 증가**: 10-15개 → 20-30개 학생 정보 동시 표시
- **사용자 만족도 40% 향상**: 3.2/5.0 → 4.5/5.0 목표
- **새로운 시장 확장**: 모바일/태블릿 사용성 확보

### 리스크 관리

- **점진적 마이그레이션**: Feature Flag 기반 안전한 전환
- **즉시 롤백 가능**: 세분화된 롤백 계획으로 위험 최소화
- **기존 시스템 유지**: API 호환성 보장으로 데이터 안정성 확보

**다음 단계**: 마이그레이션 전략 및 상세 구현 계획 수립