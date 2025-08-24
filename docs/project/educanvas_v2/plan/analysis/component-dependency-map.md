# EduCanvas v1 컴포넌트 의존성 매핑

**분석 일자**: 2025-08-24  
**분석 범위**: 현재 학생 관리 관련 컴포넌트들  
**목적**: v2 전환 시 재사용 가능한 컴포넌트 식별

## 🗺️ 컴포넌트 의존성 다이어그램

```
StudentsPage (메인 페이지)
├── 📊 StatsDashboard
│   └── Card + CardContent (shadcn/ui)
├── 🔍 SearchAndFilters  
│   ├── Input (shadcn/ui)
│   └── Select (shadcn/ui)
├── 👥 GroupedStudentView (복잡한 그룹핑 로직)
│   ├── StudentCard (개별 학생 카드)
│   └── StudentListItem (리스트 아이템)
├── 📄 Pagination (커스텀)
└── 🔧 Modals/Sheets
    ├── CreateStudentSheet
    ├── StudentDetailSheet
    └── DeleteConfirmModal
```

## 📦 컴포넌트 상세 분석

### 1. **페이지 레벨 컴포넌트**

#### **StudentsPage** (`/main/students/page.tsx`)
```typescript
// 의존성 레벨: 최상위
// 복잡도: ⭐⭐⭐⭐⭐ (매우 복잡)
// v2 재사용: ❌ (완전 재구조 필요)

interface StudentsPageDependencies {
  // 외부 라이브러리
  react: ['useState', 'useEffect', 'useCallback', 'useMemo'];
  nextNavigation: ['useRouter'];
  
  // UI 컴포넌트 (shadcn/ui)
  uiComponents: [
    'Button', 'Input', 'Card', 'Badge', 'Table', 
    'Select', 'DropdownMenu'
  ];
  
  // 아이콘 (Heroicons)
  icons: [
    'PlusIcon', 'MagnifyingGlassIcon', 'FunnelIcon',
    'UserGroupIcon', 'CheckCircleIcon', 'XCircleIcon'
  ];
  
  // 커스텀 컴포넌트
  customComponents: [
    'CreateStudentSheet',
    'StudentDetailSheet', 
    'GroupedStudentView'
  ];
  
  // 상태 관리
  stores: ['useStudentsStore', 'useAuthStore'];
  
  // 타입
  types: ['Student', 'StudentStatus', 'StudentGroup'];
  
  // 유틸리티
  utils: ['toast', 'cn'];
}
```

### 2. **데이터 표시 컴포넌트**

#### **GroupedStudentView** (`/components/students/GroupedStudentView.tsx`)
```typescript
// 의존성 레벨: 중간
// 복잡도: ⭐⭐⭐⭐ (복잡한 그룹핑 로직)
// v2 재사용: 🔄 (단순화 후 부분 재사용)

interface GroupedStudentViewProps {
  students: Student[];
  groupBy: 'grade' | 'school' | 'class';      // v2에서 제거 예정
  subGroupBy: 'none' | 'grade' | 'school' | 'class'; // v2에서 제거 예정
  viewMode: 'list' | 'cards';                 // v2에서 단순화
  selectionMode: boolean;                     // v2에서 제거 예정
  onStudentClick: (student: Student) => void;
  selectedStudents: string[];                 // v2에서 단순화
  // ... 기타 props
}

// 내부 의존성
interface GroupedStudentViewDependencies {
  childComponents: ['StudentCard', 'StudentListItem'];
  uiComponents: ['Separator', 'Badge', 'Button', 'ScrollArea'];
  icons: ['UserIcon', 'AcademicCapIcon', 'BuildingLibraryIcon'];
  hooks: ['useState', 'useMemo'];  // 복잡한 그룹핑 계산
}
```

#### **StudentCard** (`/components/students/StudentCard.tsx`)
```typescript
// 의존성 레벨: 낮음
// 복잡도: ⭐⭐ (단순)
// v2 재사용: ✅ (100% 재사용 가능)

interface StudentCardDependencies {
  // 높은 재사용성 - v2 핵심 컴포넌트
  uiComponents: ['Card', 'CardContent', 'Badge', 'Button'];
  icons: ['PhoneIcon', 'EnvelopeIcon', 'EllipsisVerticalIcon'];
  props: {
    student: 'Student';
    onSelect?: '(student: Student) => void';
    onEdit?: '(student: Student) => void';
    onDelete?: '(student: Student) => void';
    variant?: 'default' | 'compact' | 'detailed';
    showActions?: 'boolean';
    isSelected?: 'boolean';
  };
}
```

#### **StudentListItem** (`/components/students/StudentListItem.tsx`)
```typescript
// 의존성 레벨: 낮음  
// 복잡도: ⭐⭐ (단순)
// v2 재사용: 🔄 (사이드바 검색 결과용으로 적합)

interface StudentListItemDependencies {
  // 검색 결과 표시에 최적화된 컴포넌트
  uiComponents: ['Badge', 'Button'];
  layout: 'horizontal'; // 사이드바에 적합
  props: {
    student: 'Student';
    onSelect: '(student: Student) => void';
    isSelected?: 'boolean';
    showPhone?: 'boolean';
    compact?: 'boolean';
  };
}
```

### 3. **모달/시트 컴포넌트들**

#### **CreateStudentSheet** (`/components/students/CreateStudentSheet.tsx`)
```typescript
// 의존성 레벨: 중간
// 복잡도: ⭐⭐⭐ (폼 검증)
// v2 재사용: ✅ (그대로 재사용)

interface CreateStudentSheetDependencies {
  // v2에서도 동일하게 필요한 학생 등록 기능
  formLibraries: ['react-hook-form', 'zod', '@hookform/resolvers'];
  uiComponents: [
    'Sheet', 'SheetContent', 'SheetHeader', 
    'Form', 'FormField', 'Input', 'Button'
  ];
  validation: 'StudentCreateSchema'; // Zod 스키마
  apiIntegration: 'studentsStore.actions.createStudent';
}
```

#### **StudentDetailSheet** (`/components/students/StudentDetailSheet.tsx`)
```typescript
// 의존성 레벨: 높음
// 복잡도: ⭐⭐⭐⭐ (CRUD + 폼)
// v2 재사용: 🔄 (탭 구조로 변환 필요)

interface StudentDetailSheetDependencies {
  // v2에서는 Sheet → Tab Panel로 변환
  currentStructure: 'Sheet'; // v1
  targetStructure: 'TabPanel'; // v2
  
  formLibraries: ['react-hook-form', 'zod'];
  uiComponents: [
    'Sheet', 'Form', 'Input', 'Textarea', 
    'Select', 'Button', 'AlertDialog'
  ];
  
  // v2에서 탭별로 분리 예정
  features: [
    'studentEdit',    // → |기본| 탭
    'studentDelete',  // → 액션 버튼
    'dataValidation', // → 공통 로직
    'optimisticUpdate' // → 새로 추가
  ];
}
```

### 4. **통계/대시보드 컴포넌트**

#### **StatsDashboard** (StudentsPage 내부)
```typescript
// 의존성 레벨: 낮음
// 복잡도: ⭐⭐ (단순한 데이터 표시)
// v2 재사용: 🔄 (위젯으로 분리 가능)

interface StatsDashboardDependencies {
  // v2에서 사이드바 위젯으로 활용 가능
  structure: '4-card-grid';
  uiComponents: ['Card', 'CardContent'];
  icons: ['UserGroupIcon', 'CheckCircleIcon', 'XCircleIcon', 'AcademicCapIcon'];
  
  dataSource: {
    current: 'client-side calculation'; // useMemo로 계산
    v2Target: 'server-side API + cache'; // 성능 최적화
  };
  
  metrics: [
    'total students',
    'active students', 
    'withdrawn students',
    'inactive students'
  ];
}
```

## 🔧 shadcn/ui 의존성 분석

### 1. **현재 사용 중인 컴포넌트들**

```typescript
interface ShadcnUIUsage {
  // 핵심 UI 컴포넌트 (v2에서도 필수)
  core: [
    'Button',      // 모든 액션에 사용
    'Input',       // 검색, 폼 입력
    'Card',        // 정보 표시의 기본 단위
    'Badge',       // 상태 표시
  ];
  
  // 폼 관련 (학생 등록/수정)
  forms: [
    'Form', 'FormField', 'FormItem',
    'Label', 'Textarea', 
    'Select', 'SelectTrigger', 'SelectValue'
  ];
  
  // 레이아웃 (페이지 구조)
  layout: [
    'Sheet', 'SheetContent', 'SheetHeader',  // v2에서 제거 예정
    'Separator',
    'ScrollArea',
    'Table', 'TableBody', 'TableCell'        // v2에서 축소
  ];
  
  // 인터랙션
  interaction: [
    'DropdownMenu', 'DropdownMenuContent',   // v2에서 축소
    'AlertDialog',                           // 삭제 확인용
    'Toast'                                  // 알림
  ];
}
```

### 2. **v2에서 추가 필요한 컴포넌트들**

```typescript
interface AdditionalShadcnComponents {
  // v2 검색 중심 UI용
  search: [
    'Command',           // 검색 명령 팔레트  
    'Popover',          // 검색 제안
    'Avatar',           // 학생 프로필 이미지
  ];
  
  // 탭 기반 상세 정보용
  tabs: [
    'Tabs', 'TabsList', 'TabsTrigger', 'TabsContent'
  ];
  
  // 데이터 시각화
  dataVisualization: [
    'Progress',         // 출석률 등
    'Calendar',         // 출결 캘린더
    'Accordion',        // 정보 그룹핑
  ];
  
  // 성능 최적화
  performance: [
    'Skeleton',         // 로딩 상태
    'Drawer',           // 모바일 사이드바
  ];
}
```

## 🏗️ 컴포넌트 아키텍처 패턴 분석

### 1. **현재 패턴들**

#### **Compound Component 패턴**
```typescript
// GroupedStudentView에서 사용
<GroupedStudentView>
  <StudentCard />      // 카드 모드
  <StudentListItem />  // 리스트 모드  
</GroupedStudentView>
```

#### **Render Props 패턴**
```typescript
// GroupedStudentView 내부
{students.map(student => (
  viewMode === 'cards' 
    ? <StudentCard key={student.id} {...cardProps} />
    : <StudentListItem key={student.id} {...listProps} />
))}
```

#### **Controller 패턴**
```typescript
// StudentsPage가 모든 상태와 로직을 관리
const [filters, setFilters] = useState<StudentFilters>({...});
const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
// 복잡한 상태 관리 → v2에서 단순화 필요
```

### 2. **v2 권장 패턴들**

#### **Headless Component 패턴**
```typescript
// 비즈니스 로직과 UI 분리
const useStudentSearch = () => {
  // 검색 로직만 담당
  return { searchResults, isLoading, searchTerm, setSearchTerm };
};

const SearchSidebar = () => {
  const { searchResults } = useStudentSearch();
  // UI만 담당
  return <div>{/* UI 렌더링 */}</div>;
};
```

#### **Composition 패턴**
```typescript
// v2 사이드바 구조
<SearchSidebar>
  <SearchInput />
  <FilterOptions />
  <SearchResults>
    {results.map(student => <StudentCard key={student.id} />)}
  </SearchResults>
</SearchSidebar>
```

## 📊 재사용성 분석 결과

### 1. **✅ 100% 재사용 가능한 컴포넌트들**

```typescript
interface FullyReusableComponents {
  // v2에서 핵심 역할을 할 컴포넌트들
  components: [
    'StudentCard',           // 검색 결과 표시의 핵심
    'CreateStudentSheet',    // 학생 등록 로직 동일
    'StudentListItem'        // 사이드바 검색 결과용
  ];
  
  // 재사용 이유
  reasons: [
    '비즈니스 로직이 변경되지 않음',
    'UI 패턴이 v2에서도 유효함', 
    '의존성이 최소화되어 있음',
    'shadcn/ui 기반으로 일관성 있음'
  ];
}
```

### 2. **🔄 부분 재사용 가능한 컴포넌트들**

```typescript
interface PartiallyReusableComponents {
  'GroupedStudentView': {
    reusableParts: [
      '학생 목록 렌더링 로직',
      '반응형 그리드 레이아웃',
      'loading/empty 상태 처리'
    ];
    removeParts: [
      '복잡한 그룹핑 로직 (groupBy, subGroupBy)',
      '선택 모드 (selectionMode)',
      '벌크 액션'
    ];
    v2Usage: '단순한 StudentList 컴포넌트로 전환';
  };
  
  'StudentDetailSheet': {
    reusableParts: [
      '폼 검증 로직',
      'CRUD API 호출',
      '에러 처리'
    ];
    changeParts: [
      'Sheet UI → Tab Panel UI',
      '단일 폼 → 탭별 정보 분리',
      '모달 → 인라인 편집'
    ];
    v2Usage: '7개 탭의 기반 로직으로 활용';
  };
}
```

### 3. **❌ 재작성이 필요한 컴포넌트들**

```typescript
interface ComponentsNeedingRewrite {
  'StudentsPage': {
    reason: '전체 아키텍처 변경 (세로 → 가로 분할)';
    v2Replacement: 'StudentManagementLayout';
    keepLogic: [
      '검색/필터링 로직',
      '페이지네이션 로직', 
      '상태 관리 패턴'
    ];
  };
  
  'StatsDashboard': {
    reason: 'UI 위치 변경 (상단 → 사이드바)';
    v2Replacement: 'SidebarStatsWidgets';
    keepLogic: ['데이터 계산 로직', '실시간 업데이트'];
  };
}
```

## 🎯 v2 컴포넌트 마이그레이션 전략

### 1. **재사용 우선순위**

#### **Phase 1: 직접 재사용** (0-1일)
```typescript
// 바로 복사해서 사용 가능
const directReuse = [
  'StudentCard',           // 검색 결과 표시
  'StudentListItem',       // 사이드바 항목
  'CreateStudentSheet'     // 학생 등록 모달
];
```

#### **Phase 2: 수정 후 재사용** (1-2일)  
```typescript
// 간단한 수정으로 재사용 가능
const modifyAndReuse = [
  'GroupedStudentView → StudentList',  // 그룹핑 로직 제거
  'StudentDetailSheet → StudentTabs'   // Sheet → Tab 변환
];
```

#### **Phase 3: 영감을 받아 재작성** (2-3일)
```typescript  
// 로직은 참고하되 새로 작성
const rewriteWithInspiration = [
  'StudentsPage → StudentManagementLayout',
  'StatsDashboard → SidebarWidgets'
];
```

### 2. **의존성 최적화 방향**

#### **v2 목표 의존성 구조**
```typescript
// 더 단순하고 명확한 의존성
interface V2DependencyGoals {
  // 외부 의존성 최소화
  externalDeps: ['react', 'shadcn/ui', 'heroicons'];
  
  // 내부 의존성 명확화  
  internalDeps: {
    stores: ['useStudentSearch', 'useSelectedStudent']; // 단순화
    utils: ['api', 'validation', 'formatting'];
    types: ['Student', 'SearchFilters']; // 핵심만
  };
  
  // 컴포넌트 의존성 최소화
  maxDepth: 3; // 3단계 이하 중첩
  cyclicDeps: 0; // 순환 의존성 금지
}
```

## 🔍 숨겨진 의존성 및 위험 요소

### 1. **암묵적 의존성들**

```typescript
interface ImplicitDependencies {
  // 전역 상태에 대한 의존성
  globalState: [
    'useAuthStore.profile.tenant_id',  // 모든 API 호출에 필요
    'useStudentsStore.students',       // 캐시된 학생 목록
    'toast notifications'              // 전역 알림 시스템
  ];
  
  // 환경 변수 의존성
  environment: [
    'API_URL',                         // API 엔드포인트
    'SUPABASE_*',                     // 데이터베이스 연결
  ];
  
  // 런타임 의존성
  runtime: [
    'localStorage',                    // 사용자 설정 저장
    'sessionStorage',                 // 임시 데이터
    'window.location'                 // 라우팅
  ];
}
```

### 2. **v2 전환 시 주의사항**

```typescript
interface MigrationRisks {
  // 상태 관리 변경 위험
  stateManagement: {
    risk: 'Zustand 스토어 구조 변경 시 연쇄 영향';
    mitigation: '점진적 마이그레이션 + 기존 스토어 병행';
  };
  
  // API 호출 패턴 변경
  apiPattern: {
    risk: 'studentsStore.actions 의존성 깨짐';
    mitigation: '호환 레이어 제공';
  };
  
  // 타입 정의 변경
  typeDefinitions: {
    risk: 'Student 타입 변경 시 모든 컴포넌트 영향';
    mitigation: '기존 타입 유지 + 새 타입 점진 도입';
  };
}
```

## 📋 v2 컴포넌트 설계 체크리스트

### ✅ **재사용 컴포넌트 검증**
- [ ] 비즈니스 로직과 UI 로직 분리되어 있는가?
- [ ] props 인터페이스가 명확하고 최소화되어 있는가?
- [ ] 외부 의존성이 최소화되어 있는가?
- [ ] 테스트 가능한 구조인가?

### ✅ **성능 최적화 검증**  
- [ ] React.memo 적용되어 있는가?
- [ ] 불필요한 리렌더링이 없는가?
- [ ] 메모리 누수 위험이 없는가?

### ✅ **접근성 검증**
- [ ] 키보드 네비게이션 지원하는가?
- [ ] 스크린 리더 지원하는가?
- [ ] ARIA 라벨이 적절한가?

## 🎯 결론

### ✅ **재사용성 높은 자산들**
- **StudentCard, StudentListItem**: v2 검색 중심 UI의 핵심
- **CreateStudentSheet**: 학생 등록 로직 그대로 활용
- **API 패턴 및 상태 관리**: 안정적인 데이터 계층

### 🔄 **수정 필요한 부분들**
- **GroupedStudentView**: 복잡한 그룹핑 → 단순한 목록으로  
- **StudentDetailSheet**: Sheet UI → Tab 기반으로
- **페이지 레이아웃**: 세로 분할 → 가로 분할로

### 🚀 **v2 마이그레이션 전략**
1. **재사용 가능한 컴포넌트 우선 이전**
2. **새로운 레이아웃 구조 구축**  
3. **기존 로직 점진적 통합**
4. **성능 및 접근성 최적화**

다음 단계로 현재 시스템의 장단점을 종합 분석하여 v2 설계 방향을 확정해야 합니다.