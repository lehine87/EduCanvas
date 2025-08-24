# EduCanvas v1 현재 UI 아키텍처 분석

**분석 일자**: 2025-08-24  
**분석 대상**: `/main/students/page.tsx` (현재 학생 관리 페이지)  
**목적**: v2 검색 중심 UI 전환을 위한 현재 구조 완전 이해

## 🏗️ 현재 페이지 아키텍처 개요

### 전체 구조
```
StudentsPage (메인 컴포넌트)
├── PageHeader (상단 헤더)
│   ├── 제목 + Breadcrumb (좌측)
│   └── ActionButtons (우측)
├── MainContent (스크롤 가능한 메인 영역)
│   ├── ErrorMessage (에러 시 표시)
│   ├── StatsDashboard (통계 카드들)
│   ├── SearchAndFilters (검색 + 필터)
│   ├── GroupedStudentView (학생 목록)
│   └── Pagination (페이지네이션)
└── Modals/Sheets (오버레이)
    ├── DeleteConfirmModal
    ├── CreateStudentSheet
    └── StudentDetailSheet
```

## 📊 현재 UI 구성 요소 상세 분석

### 1. **PageHeader** (Lines 292-413)

**레이아웃**:
```tsx
<div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
  <div className="flex items-center justify-between">
    <div>제목 + Breadcrumb</div>
    <div className="flex items-center space-x-3">액션 버튼들</div>
  </div>
</div>
```

**좌측 영역**:
- 페이지 제목: "학생 관리"
- Breadcrumb: "홈 / 학생 관리" (하드코딩)

**우측 액션 버튼들**:
1. **일괄 작업 표시** (`selectedStudents.length > 0`)
   - 선택된 학생 수 표시
   - 일괄 삭제 버튼
   - 선택 취소 버튼

2. **선택 모드 토글**
   - 기본: "선택" 버튼 (outline)
   - 활성화: "선택 모드" (default)

3. **그룹 뷰 옵션**
   - 그룹핑: `grade`, `school`, `class`
   - 서브그룹: `none`, `grade`, `school`, `class`
   - 뷰 모드: `list`, `cards`

4. **새 학생 등록 버튼**

### 2. **통계 대시보드** (Lines 431-488)

**4개 카드 그리드**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
```

**카드별 정보**:
1. **전체 학생** (`stats.total`)
   - 아이콘: UserGroupIcon (brand 색상)
   - 실시간 계산

2. **활동중** (`stats.active`)
   - 아이콘: CheckCircleIcon (success 색상)
   - `status === 'active'` 필터링

3. **퇴학/대기** (`stats.withdrawn`)
   - 아이콘: AcademicCapIcon (warning 색상)
   - `status === 'withdrawn'` 필터링

4. **비활성** (`stats.inactive`)
   - 아이콘: XCircleIcon (gray 색상)
   - `status === 'inactive'` 필터링

### 3. **검색 및 필터** (Lines 491-631)

**검색 영역**:
```tsx
<Input
  placeholder="이름, 학번, 연락처, 이메일로 검색..."
  value={filters.search}
  onChange={(e) => handleFilterChange('search', e.target.value)}
  className="pl-10" // 검색 아이콘 공간
/>
```

**필터 버튼들**:
- **정렬**: `name-asc/desc`, `created_at-asc/desc`, `student_number-asc/desc`
- **필터 토글**: 상세 필터 열기/닫기
- **새로고침**: 데이터 다시 로드

**상세 필터** (토글 시 표시):
```tsx
{showFilters && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Select value={filters.status}>상태 필터</Select>
    <Select value={filters.grade}>학년 필터</Select>
    <Button>상세 필터 설정</Button>
  </div>
)}
```

### 4. **학생 목록** (Lines 634-651)

**GroupedStudentView 컴포넌트 사용**:
```tsx
<GroupedStudentView
  students={paginatedStudents}
  groupBy={groupBy}                    // 'grade' | 'school' | 'class'
  subGroupBy={subGroupBy}             // 'none' | 'grade' | 'school' | 'class' 
  viewMode={groupViewMode}            // 'list' | 'cards'
  selectionMode={selectionMode}       // boolean
  selectedStudents={selectedStudents} // string[]
  onStudentClick={handleStudentClick}
  onStudentSelect={handleStudentSelect}
  onDeleteStudent={handleDeleteStudent}
  onCreateStudent={() => setShowCreateSheet(true)}
/>
```

### 5. **페이지네이션** (Lines 654-707)

**페이지 정보 표시**:
- 총 개수 및 현재 페이지 범위
- 이전/다음 버튼
- 페이지 번호들 (최대 5개 + 마지막)

## 🔄 상태 관리 분석

### 1. **로컬 상태들**

```typescript
// 필터 및 정렬 상태
const [filters, setFilters] = useState<StudentFilters>({
  search: '',
  status: 'all',
  grade: 'all', 
  sortBy: 'name',
  sortOrder: 'asc'
})

// 페이지네이션
const [currentPage, setCurrentPage] = useState(1)
const itemsPerPage = 20

// 선택 관련 상태
const [selectedStudents, setSelectedStudents] = useState<string[]>([])
const [selectionMode, setSelectionMode] = useState(false)

// UI 상태
const [showFilters, setShowFilters] = useState(false)
const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<Student | null>(null)

// Sheet 상태들
const [showCreateSheet, setShowCreateSheet] = useState(false)
const [showDetailSheet, setShowDetailSheet] = useState(false)
const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

// 그룹 뷰 상태
const [groupBy, setGroupBy] = useState<'grade' | 'school' | 'class'>('grade')
const [subGroupBy, setSubGroupBy] = useState<'none' | 'grade' | 'school' | 'class'>('none')
const [groupViewMode, setGroupViewMode] = useState<'list' | 'cards'>('list')
```

### 2. **전역 상태 (Zustand)**

```typescript
// useStudentsStore에서 가져오는 상태
const { students, loading, error, actions } = useStudentsStore()

// useAuthStore에서 가져오는 상태  
const { profile } = useAuthStore()
```

### 3. **계산된 상태 (useMemo)**

```typescript
// 필터링된 학생 목록 (Lines 113-169)
const filteredStudents = useMemo(() => {
  let result = students

  // 검색 필터링 (name, student_number, phone, email)
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase()
    result = result.filter(student => 
      student.name.toLowerCase().includes(searchTerm) ||
      student.student_number?.toLowerCase().includes(searchTerm) ||
      student.phone?.toLowerCase().includes(searchTerm) ||
      student.email?.toLowerCase().includes(searchTerm)
    )
  }

  // 상태 필터링
  if (filters.status !== 'all') {
    result = result.filter(student => student.status === filters.status)
  }

  // 학년 필터링  
  if (filters.grade !== 'all') {
    result = result.filter(student => student.grade_level === filters.grade)
  }
    
  // 정렬
  result = [...result].sort((a, b) => {
    // sortBy에 따른 정렬 로직
  })

  return result
}, [students, filters])

// 페이지네이션된 데이터 (Lines 172-175)
const paginatedStudents = useMemo(() => {
  const startIndex = (currentPage - 1) * itemsPerPage
  return filteredStudents.slice(startIndex, startIndex + itemsPerPage)
}, [filteredStudents, currentPage, itemsPerPage])

// 통계 (Lines 180-187)
const stats = useMemo(() => {
  const total = students.length
  const active = students.filter(s => s.status === 'active').length
  const withdrawn = students.filter(s => s.status === 'withdrawn').length  
  const inactive = students.filter(s => s.status === 'inactive').length
  
  return { total, active, withdrawn, inactive }
}, [students])
```

## 🎭 이벤트 핸들러 분석

### 1. **데이터 관련 핸들러**

```typescript
// 데이터 새로고침 (Lines 190-195)
const handleRefresh = useCallback(() => {
  if (profile?.tenant_id || profile?.role === 'system_admin') {
    const tenantId = profile.role === 'system_admin' ? undefined : (profile.tenant_id || undefined)
    actions.fetchStudents(tenantId)
  }
}, [profile, actions])

// CRUD 성공 핸들러들
const handleCreateSuccess = useCallback((newStudent: Student) => {
  setShowCreateSheet(false)
  toast.success(`${newStudent.name} 학생이 등록되었습니다.`)
  // 데이터 다시 로드
}, [profile, actions])

const handleUpdateSuccess = useCallback((updatedStudent: Student) => {
  toast.success(`${updatedStudent.name} 학생 정보가 업데이트되었습니다.`)
  setSelectedStudent(updatedStudent)
  // 데이터 다시 로드
}, [profile, actions])
```

### 2. **필터링 및 검색 핸들러**

```typescript
// 필터 변경 (Lines 244-247)
const handleFilterChange = useCallback((key: keyof StudentFilters, value: any) => {
  setFilters(prev => ({ ...prev, [key]: value }))
  setCurrentPage(1) // 필터 변경 시 첫 페이지로
}, [])
```

### 3. **선택 관련 핸들러**

```typescript
// 학생 클릭 (Lines 235-242)
const handleStudentClick = useCallback((student: Student) => {
  if (!selectionMode) {
    setSelectedStudent(student)
    setShowDetailSheet(true)  // 상세 Sheet 열기
  } else {
    handleStudentSelect(student.id, !selectedStudents.includes(student.id))
  }
}, [selectionMode, selectedStudents])

// 선택 토글
const handleStudentSelect = useCallback((studentId: string, checked: boolean) => {
  setSelectedStudents(prev => 
    checked 
      ? [...prev, studentId]
      : prev.filter(id => id !== studentId)
  )
}, [])

// 전체 선택
const handleSelectAll = useCallback((checked: boolean) => {
  setSelectedStudents(checked ? paginatedStudents.map(s => s.id) : [])
}, [paginatedStudents])
```

## 🧩 컴포넌트 의존성 분석

### 1. **외부 컴포넌트 의존성**

```typescript
// UI 컴포넌트 (shadcn/ui)
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// 아이콘 (Heroicons)
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, ... } from '@heroicons/react/24/outline'
import { UserGroupIcon, CheckCircleIcon, XCircleIcon, AcademicCapIcon } from '@heroicons/react/24/solid'

// 커스텀 컴포넌트
import { CreateStudentSheet } from '@/components/students/CreateStudentSheet'
import { StudentDetailSheet } from '@/components/students/StudentDetailSheet'  
import { GroupedStudentView } from '@/components/students/GroupedStudentView'

// 상태 관리
import { useStudentsStore } from '@/store/studentsStore'
import { useAuthStore } from '@/store/useAuthStore'

// 유틸리티
import { toast } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
```

### 2. **타입 의존성**

```typescript
import type { Student, StudentStatus } from '@/types/student.types'
import type { StudentGroup, GroupType } from '@/types/student-groups.types'
```

## 🔍 데이터 플로우 분석

### 1. **데이터 로딩 플로우**

```
useEffect (mount) 
    ↓
profile 확인 (tenant_id)
    ↓
actions.fetchStudents(tenantId)
    ↓ 
useStudentsStore 업데이트
    ↓
students, loading, error 상태 변경
    ↓
컴포넌트 리렌더링
```

### 2. **검색/필터링 플로우**

```
사용자 입력 (검색어/필터)
    ↓
handleFilterChange 호출
    ↓
filters 상태 업데이트 + currentPage = 1
    ↓
filteredStudents useMemo 재계산
    ↓
paginatedStudents useMemo 재계산
    ↓
GroupedStudentView 리렌더링
```

### 3. **학생 선택/액션 플로우**

```
학생 카드 클릭
    ↓
handleStudentClick 호출
    ↓
selectionMode 확인
    ├─ false: selectedStudent 설정 + DetailSheet 열기
    └─ true: selectedStudents 토글
```

## 🎨 스타일링 패턴 분석

### 1. **레이아웃 구조**
```scss
.flex-1.flex.flex-col.overflow-hidden {  // 전체 컨테이너
  .flex-shrink-0 { }                    // 고정 헤더
  .flex-1.overflow-auto.p-6 { }         // 스크롤 가능한 메인
}
```

### 2. **색상 시스템**
- **브랜드 색상**: `brand-50`, `brand-200`, `brand-600`, `brand-700`
- **상태 색상**: `success-100`, `warning-100`, `error-50`
- **기본 색상**: `gray-100`, `gray-500`, `gray-900`

### 3. **간격 시스템**  
- **컨테이너 패딩**: `px-6 py-4`, `p-6`
- **요소 간격**: `space-x-3`, `space-y-4`, `gap-6`

## ⚡ 성능 최적화 현황

### 1. **메모이제이션 사용**
- `filteredStudents`: 필터링 결과 캐싱
- `paginatedStudents`: 페이지네이션 결과 캐싱  
- `stats`: 통계 계산 캐싱

### 2. **콜백 최적화**
- 모든 이벤트 핸들러에 `useCallback` 적용
- 의존성 배열 적절히 관리

### 3. **조건부 렌더링**
- 에러 상태: `{error && <ErrorMessage />}`
- 로딩 상태: `{loading ? <Loader /> : <Content />}`
- 선택 모드: `{selectedStudents.length > 0 && <BulkActions />}`

## 🚨 v2 전환 시 주요 변경점 예상

### 1. **레이아웃 구조 변경**
```
현재 (v1): 상단 헤더 + 메인 영역 (세로 분할)
    ↓
v2 예상: 사이드바 + 메인 영역 (가로 분할)
```

### 2. **검색 우선순위 변경**
```
현재 (v1): 통계 → 검색 → 목록 (세로 나열)
    ↓  
v2 예상: 검색 (사이드바) ← → 상세 정보 (메인)
```

### 3. **상태 관리 단순화 필요**
- 그룹뷰 관련 복잡한 상태들 제거/단순화
- 페이지네이션 방식 변경 (무한스크롤?)
- 탭 기반 상세 정보 표시

## 📋 v2 전환을 위한 재사용 가능 요소들

### ✅ **그대로 사용 가능**
- 검색 로직 (`filteredStudents` useMemo)
- 통계 계산 (`stats` useMemo)
- CRUD 핸들러들 (`handleCreateSuccess`, `handleUpdateSuccess`)
- 상태 관리 스토어 (`useStudentsStore`, `useAuthStore`)

### 🔄 **수정 필요**
- 레이아웃 구조 (flex 방향 변경)
- 검색 UI (인라인 → 사이드바)
- 그룹뷰 로직 (단순화 필요)
- 페이지네이션 (분할 → 연속)

### ❌ **제거 대상**
- 복잡한 그룹핑 옵션들
- 선택 모드 관련 UI들 (단순화)
- 일괄 작업 UI들

## 🎯 결론

현재 EduCanvas v1 학생 관리 페이지는:

**✅ 장점:**
- 완전한 기능성 (CRUD, 검색, 필터링, 정렬)
- 체계적인 상태 관리
- 성능 최적화 (메모이제이션)  
- 반응형 디자인

**⚠️ v2 전환 시 고려사항:**
- 복잡한 UI 구조 단순화 필요
- 검색 중심으로 UX 재설계
- 불필요한 기능들 정리
- 탭 기반 정보 표시로 전환

**다음 단계**: API 사용 패턴 및 컴포넌트 의존성을 더 자세히 분석하여 v2 마이그레이션 전략을 수립해야 함.