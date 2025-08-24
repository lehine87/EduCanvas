# EduCanvas v1 API 사용 패턴 및 데이터 플로우 분석

**분석 일자**: 2025-08-24  
**분석 대상**: 현재 학생 관리 시스템의 API 패턴  
**목적**: v2 전환 시 API 활용 전략 수립

## 🌐 현재 API 아키텍처 개요

### API 구조 
```
EduCanvas API v1
├── REST API (Next.js App Router)
│   ├── /api/students/ (CRUD)
│   ├── /api/classes/ (반 관리)
│   └── /api/tenant-admin/ (권한 관리)
├── 상태 관리 (Zustand)
│   ├── studentsStore.ts
│   ├── classesStore.ts
│   └── useAuthStore.ts
└── 데이터베이스 (Supabase)
    ├── Direct Client Access (제한적)
    └── RLS 기반 보안
```

## 📊 Students API 상세 분석

### 1. **API 엔드포인트 구조**

#### **GET /api/students** (목록 조회)
```typescript
// 요청 파라미터
interface StudentsQueryParams {
  tenantId?: string;          // 테넌트 ID (시스템 관리자는 optional)
  classId?: string;           // 특정 반 필터링
  status: 'active' | 'inactive' | 'all'; // 상태 필터
  limit: number;              // 페이지 크기 (기본: 100, 최대: 1000)
  offset: number;             // 페이지 오프셋
  search?: string;            // 이름, 학번, 전화번호 검색
}

// 응답 구조
interface StudentsResponse {
  success: boolean;
  data: {
    students: Student[];
    pagination: {
      total: number;
      limit: number;  
      offset: number;
      hasMore: boolean;
    }
  };
  message?: string;
}
```

#### **POST /api/students** (학생 생성)
```typescript
// 요청 바디
interface CreateStudentRequest {
  tenantId: string;           // 필수: 테넌트 ID
  name: string;               // 필수: 학생명
  student_number: string;     // 필수: 학번 (UNIQUE)
  
  // 연락처 (선택)
  phone?: string;
  parent_phone_1?: string;
  parent_phone_2?: string;
  email?: string;
  parent_name?: string;
  
  // 학적 정보 (선택)
  grade_level?: string;
  school_name?: string;
  address?: string;
  notes?: string;
  status?: 'active' | 'inactive'; // 기본: 'active'
}

// 응답: 생성된 학생 객체
interface CreateStudentResponse {
  success: boolean;
  data: { student: Student };
  message: string;
}
```

#### **PUT /api/students/[id]** (학생 수정)
```typescript
// 요청 바디: CreateStudentRequest의 모든 필드가 optional
interface UpdateStudentRequest extends Partial<CreateStudentRequest> {
  tenantId: string; // 권한 검증용 필수
}
```

#### **DELETE /api/students/[id]** (학생 삭제)
```typescript
// URL 파라미터
interface DeleteStudentParams {
  tenantId: string;           // 권한 검증용
  forceDelete?: 'true' | 'false'; // 기본: false (소프트 삭제)
}

// forceDelete=false: status를 'withdrawn'으로 변경
// forceDelete=true: 완전 삭제
```

### 2. **검색 기능 분석**

#### **현재 검색 구현 (OR 조건)**
```sql
-- /api/students에서 실제 사용되는 검색 쿼리
SELECT * FROM students 
WHERE tenant_id = $tenantId
  AND (
    name ILIKE '%검색어%' OR
    student_number ILIKE '%검색어%' OR  
    phone ILIKE '%검색어%'
  )
ORDER BY created_at DESC
```

**검색 지원 필드**:
- `name` (학생명)
- `student_number` (학번)
- `phone` (학생 연락처)

**v2에서 확장 가능한 검색**:
- `parent_phone_1`, `parent_phone_2` (학부모 연락처)
- `email` (학생 이메일)
- `school_name` (학교명)

## 🏪 Zustand Store 패턴 분석

### 1. **studentsStore 구조**

```typescript
interface StudentsState {
  // 데이터 상태
  students: Student[];              // 메인 데이터
  selectedStudent: Student | null;  // 선택된 학생
  stats: StudentStats | null;       // 통계 (로컬 계산)
  
  // UI 상태  
  loading: boolean;
  error: string | null;
  
  // 필터/검색 상태
  filters: StudentFilters;          // 현재 적용된 필터
  searchTerm: string;               // 검색어
  
  // 페이지네이션 상태
  pagination: {
    total: number;
    limit: number;    // 기본: 50
    offset: number;
    hasMore: boolean;
  };
  
  // 액션 메서드들
  actions: {
    // CRUD 액션
    fetchStudents: (tenantId?, filters?) => Promise<void>;
    createStudent: (data, tenantId) => Promise<Student>;
    updateStudent: (id, updates, tenantId) => Promise<Student>;
    deleteStudent: (id, tenantId, force?) => Promise<void>;
    
    // 페이지네이션
    loadMoreStudents: (tenantId?) => Promise<void>;
    refreshStudents: (tenantId?) => Promise<void>;
    
    // 필터링
    setFilters: (filters: Partial<StudentFilters>) => void;
    setSearchTerm: (term: string) => void;
    clearFilters: () => void;
    
    // 유틸리티
    getStudentById: (id: string) => Student | undefined;
    updateStudentInList: (id, updates) => void;
    removeStudentFromList: (id) => void;
  };
}
```

### 2. **API 호출 패턴**

#### **표준화된 API 호출 함수**
```typescript
// 공통 API 호출 유틸리티 (15초 타임아웃)
const apiCall = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  // 1. Supabase 세션에서 JWT 토큰 추출
  const { session } = await supabase.auth.getSession();
  
  // 2. Authorization 헤더 자동 추가
  const headers = {
    'Content-Type': 'application/json',
    ...(session?.access_token && {
      'Authorization': `Bearer ${session.access_token}`
    }),
    ...options.headers,
  };
  
  // 3. AbortController로 타임아웃 설정
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  // 4. 요청 실행 + 에러 처리
  const response = await fetch(url, {
    ...options,
    headers,
    signal: controller.signal,
  });
  
  clearTimeout(timeoutId);
  
  // 5. 표준 응답 형식 검증
  if (!response.ok) {
    throw createApiError(url, response.status, errorMessage);
  }
  
  const result: ApiResponse<T> = await response.json();
  return result.data;
};
```

#### **실제 사용 예시**
```typescript
// 학생 목록 조회
const fetchStudents = async (tenantId?: string, filters?: Partial<StudentFilters>) => {
  set({ loading: true, error: null });
  
  try {
    const params = new URLSearchParams({
      limit: get().pagination.limit.toString(),
      offset: '0',
      ...(filters?.status?.[0] && { status: filters.status[0] }),
      ...(filters?.search && { search: filters.search }),
      ...(tenantId && { tenantId })
    });

    const data = await apiCall<StudentListResponse>(`/api/students?${params}`);
    
    // Immer를 사용한 불변성 업데이트
    set(produce((draft) => {
      draft.students = data.students;
      draft.pagination = data.pagination;
      draft.filters = { ...draft.filters, ...filters };
      draft.loading = false;
    }));
  } catch (error) {
    // 구조화된 에러 처리
    set({ 
      error: getErrorMessage(error),
      loading: false 
    });
    logError(error, { component: 'studentsStore', action: 'fetchStudents' });
  }
};
```

## 🔐 인증 및 권한 시스템

### 1. **JWT 기반 인증**

```typescript
// 클라이언트 → API 서버 인증 플로우
1. Supabase Auth에서 JWT 토큰 획득
   ↓
2. API 요청 시 Authorization 헤더에 포함
   ↓  
3. API 서버에서 withApiHandler로 토큰 검증
   ↓
4. userProfile 추출 및 권한 확인
   ↓
5. 테넌트별 데이터 접근 제어
```

### 2. **테넌트 기반 권한 검증**

```typescript
// API 서버에서의 권한 검증 패턴
export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ userProfile, supabase }) => {
      // 1. 시스템 관리자 체크
      const isSystemAdmin = userProfile!.role === 'system_admin';
      
      // 2. 테넌트 권한 검증
      if (!isSystemAdmin && !validateTenantAccess(userProfile!, params.tenantId)) {
        throw new Error('해당 테넌트의 데이터에 접근할 권한이 없습니다.');
      }
      
      // 3. 쿼리에 테넌트 필터 적용
      let query = supabase.from('students').select('*');
      
      if (!isSystemAdmin && params.tenantId) {
        query = query.eq('tenant_id', params.tenantId);
      }
      
      // 4. 데이터 반환
      const { data } = await query;
      return createSuccessResponse({ students: data });
    },
    { requireAuth: true }
  );
}
```

## 📱 실시간 데이터 동기화

### 1. **현재 동기화 방식**

```typescript
// 수동 새로고침 기반
const handleRefresh = useCallback(() => {
  if (profile?.tenant_id || profile?.role === 'system_admin') {
    const tenantId = profile.role === 'system_admin' ? undefined : profile.tenant_id;
    actions.fetchStudents(tenantId);
  }
}, [profile, actions]);

// CRUD 작업 후 자동 새로고침
const handleCreateSuccess = useCallback((newStudent: Student) => {
  setShowCreateSheet(false);
  toast.success(`${newStudent.name} 학생이 등록되었습니다.`);
  // 전체 목록 다시 로드
  actions.fetchStudents(tenantId);
}, []);
```

### 2. **v2에서 개선 가능한 실시간 기능**

```typescript
// Supabase Realtime 구독 패턴 (v2 적용 예정)
useEffect(() => {
  const subscription = supabase
    .channel('students_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'students',
      filter: `tenant_id=eq.${tenantId}`
    }, (payload) => {
      // 실시간 업데이트 처리
      handleRealtimeUpdate(payload);
    })
    .subscribe();
    
  return () => subscription.unsubscribe();
}, [tenantId]);
```

## 🎯 Project Manual 검증 결과

### 1. **CRUD-API-Patterns.md 준수 현황**

#### ✅ **준수하는 패턴들**
- `withApiHandler` 사용으로 통일된 에러 처리
- Zod 스키마 기반 입력 검증
- `tenantId` → `tenant_id` 자동 매핑  
- 구조화된 응답 형식 (`createSuccessResponse`)
- 권한 검증 (`validateTenantAccess`)
- 상세한 로깅 (`logApiStart`, `logApiSuccess`)

#### ✅ **잘 구현된 보안 기능들**
- JWT 기반 인증 (Authorization 헤더)
- 테넌트별 데이터 격리
- 입력 검증 및 SQL 인젝션 방지
- 15초 API 타임아웃
- 구조화된 에러 처리

#### 🔄 **부분적 준수 / 개선 가능**
- **검색 기능**: 현재 3개 필드만 지원 → 5개 필드로 확장 가능
- **페이지네이션**: offset 기반 → cursor 기반 검토 필요
- **실시간 업데이트**: 수동 새로고침 → Realtime 구독으로 개선

### 2. **UI-Components-Manual.md 활용도**

#### ✅ **이미 활용 중인 컴포넌트들**
- shadcn/ui 기반 Button, Input, Card, Badge
- 메모이제이션 (`useMemo`, `useCallback`) 적극 활용
- 접근성 지원 (ARIA 라벨, 키보드 네비게이션)

#### 🆕 **v2에서 추가 활용 예정**
- StudentCard 컴포넌트 (검색 결과용)
- DropZone 컴포넌트 (ClassFlow 관련)
- Loading, Skeleton 컴포넌트

## ⚡ 성능 분석

### 1. **현재 성능 특징**

#### **장점들**
- React 메모이제이션 적극 활용
- Zustand의 경량 상태 관리  
- Immer를 통한 효율적 불변성 관리
- 조건부 렌더링으로 불필요한 DOM 최소화

#### **병목 지점들**
- **전체 목록 새로고침**: CRUD 작업 후 전체 다시 로드
- **복잡한 그룹핑 로직**: `GroupedStudentView`의 O(n²) 연산
- **대용량 데이터**: 1000+ 학생에서 클라이언트 사이드 처리

### 2. **v2 성능 최적화 방향**

```typescript
// 1. 낙관적 업데이트 (Optimistic Updates)
const optimisticUpdate = (studentId: string, updates: Partial<Student>) => {
  // UI 즉시 업데이트
  updateStudentInList(studentId, updates);
  
  // 백그라운드에서 API 호출
  updateStudent(studentId, updates, tenantId)
    .catch(() => {
      // 실패 시 롤백
      rollbackStudentUpdate(studentId);
      toast.error('업데이트 실패');
    });
};

// 2. 가상화된 리스트 (1000+ 항목)
import { FixedSizeList as List } from 'react-window';

// 3. 검색 debouncing
const debouncedSearch = useMemo(
  () => debounce((term: string) => {
    actions.setSearchTerm(term);
  }, 300),
  [actions]
);
```

## 🚨 v2 전환 시 주요 변경점

### 1. **API 측면**
- **기존 API 유지**: CRUD API는 그대로 재사용 가능
- **검색 확장**: parent_phone_1, parent_phone_2, email 필드 추가
- **실시간 기능**: Supabase Realtime 구독 추가
- **응답 최적화**: 불필요한 JOIN 제거, 성능 향상

### 2. **상태 관리 측면**  
- **Store 단순화**: 복잡한 groupBy 로직 제거/단순화
- **검색 중심**: searchTerm을 primary state로 승격
- **캐싱 강화**: React Query 도입 검토

### 3. **컴포넌트 측면**
- **사이드바 검색**: 새로운 SearchSidebar 컴포넌트
- **탭 기반 상세**: 기존 Sheet 대신 탭 패널 사용
- **카드 중심**: 테이블 대신 StudentCard 활용

## 📋 v2 API 설계 권장사항

### 1. **검색 API 확장**
```typescript
// 확장된 검색 쿼리
const searchQuery = `
  name.ilike.%${term}% OR 
  student_number.ilike.%${term}% OR
  phone.ilike.%${term}% OR 
  parent_phone_1.ilike.%${term}% OR
  parent_phone_2.ilike.%${term}% OR
  email.ilike.%${term}%
`;
```

### 2. **탭별 데이터 API**
```typescript
// 각 탭용 전용 엔드포인트
GET /api/students/[id]/basic       // 기본 정보 + 요약
GET /api/students/[id]/classes     // 수강 이력
GET /api/students/[id]/attendance  // 출결 현황  
GET /api/students/[id]/payments    // 수납 내역
GET /api/students/[id]/consultations // 상담 기록
```

### 3. **실시간 이벤트 API**
```typescript
// 실시간 알림용 이벤트
interface StudentEvent {
  type: 'student_updated' | 'student_created' | 'student_deleted';
  studentId: string;
  tenantId: string;
  data: Partial<Student>;
  timestamp: string;
}
```

## 🎯 결론

**현재 EduCanvas v1 API 시스템**은:

### ✅ **강점**
- **완전한 CRUD 지원** 및 표준화된 패턴
- **강력한 보안** (JWT + 테넌트 격리 + RLS)  
- **체계적인 에러 처리** 및 로깅
- **성능 최적화**된 클라이언트 상태 관리

### 🔄 **v2 전환 용이성**
- **기존 API 100% 재사용 가능**
- **점진적 기능 확장** (검색 필드, 실시간 기능)
- **안정적인 데이터 계층** 위에 새 UI 구축

### 🚀 **v2 개선 방향**
1. **검색 기능 확장** (3개 → 6개 필드)
2. **실시간 업데이트** 도입 (Supabase Realtime)
3. **성능 최적화** (낙관적 업데이트, 가상화)
4. **탭별 데이터 API** 추가

**다음 단계**: 컴포넌트 의존성 매핑을 통해 재사용 가능한 UI 요소들을 식별하고 v2 설계에 반영