# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EduCanvas is a revolutionary student management system for educational institutions (hakwon/academy), featuring the industry's first drag-and-drop class management interface (ClassFlow). Built with Next.js 15, React 19, and Supabase, it focuses on intuitive UI/UX, enterprise-grade RBAC, and high-performance handling of large datasets.

**Current Phase**: Ready for MVP development (Week 1/10 of development plan)  
**Key Innovation**: ClassFlow - drag-and-drop student management with 60fps performance  
**Target**: 10-week MVP completion timeline (2025-08-12 ~ 2025-10-17)

## 🔒 Security-First Project Philosophy

**⚠️ CRITICAL**: EduCanvas는 **보안 중심 프로젝트**입니다. 모든 개발 결정은 보안과 메모리 관리를 최우선으로 고려해야 합니다.

### Zero Trust Architecture (무신뢰 아키텍처)

- **기본 원칙**: 모든 요청을 기본적으로 신뢰하지 않음
- **다층 보안 검증**: Database RLS + API 권한 검증 + 프론트엔드 권한 체크
- **최소 권한 원칙**: 사용자에게 필요한 최소한의 권한만 부여
- **세션 관리**: 짧은 토큰 수명, 자동 갱신, 의심스러운 활동 감지 시 즉시 무효화

```typescript
// ✅ Zero Trust 패턴 예시
const verifyAccess = async (
  userId: string,
  resourceId: string,
  action: string
) => {
  // 1. 사용자 인증 상태 확인
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new UnauthorizedError();

  // 2. 데이터베이스 RLS 검증 (자동)
  // 3. API 레벨 권한 검증
  const hasPermission = await checkPermission(userId, resourceId, action);
  if (!hasPermission) throw new ForbiddenError();

  // 4. 프론트엔드 UI 상태 검증
  return { authorized: true, user };
};
```

### 데이터 보호 우선주의

- **개인정보 암호화**: 학생/학부모 민감 정보 (이름, 연락처, 주소) 저장 시 AES-256 암호화
- **메모리 내 민감데이터**: 사용 후 즉시 덮어쓰기 및 가비지 컬렉션 강제 실행
- **로그 보안**: 민감정보 절대 로깅 금지, 디버깅 시에도 마스킹 처리
- **데이터 전송**: HTTPS 강제, API 응답에서 불필요한 필드 제거

```typescript
// ✅ 민감데이터 처리 패턴
class SecureDataHandler {
  private encryptSensitiveFields(student: Student): EncryptedStudent {
    return {
      ...student,
      name: encrypt(student.name),
      phone: encrypt(student.phone),
      address: student.address ? encrypt(student.address) : null,
    };
  }

  private clearSensitiveData(dataRef: { current: string | null }) {
    if (dataRef.current) {
      // 메모리 덮어쓰기
      dataRef.current = "\0".repeat(dataRef.current.length);
      dataRef.current = null;

      // 가비지 컬렉션 강제 실행 (개발 환경에서)
      if (process.env.NODE_ENV === "development" && global.gc) {
        global.gc();
      }
    }
  }
}
```

### 메모리 보안 철학

- **메모리 누수 = 보안 취약점**: 메모리 누수는 성능 문제가 아닌 보안 위험으로 간주
- **대용량 데이터 메모리 암호화**: 1000명 이상 학생 데이터 처리 시 메모리 상 암호화 유지
- **리소스 생명주기 엄격 관리**: 모든 구독, 이벤트 리스너, 타이머 등 명시적 해제
- **메모리 프로파일링**: 지속적 모니터링 및 50MB 이상 사용 시 경고

```typescript
// ✅ 메모리 보안 모니터링
const useSecureMemoryMonitor = () => {
  useEffect(() => {
    const monitorMemory = () => {
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1048576;

        // 메모리 사용량 임계값 초과 시 보안 이벤트로 처리
        if (usedMB > 50) {
          Sentry.captureMessage(
            "High memory usage detected - potential security risk",
            {
              level: "warning",
              tags: {
                component: "memory-monitor",
                securityEvent: true,
              },
              extra: { memoryUsage: `${usedMB}MB` },
            }
          );
        }
      }
    };

    const interval = setInterval(monitorMemory, 10000);
    return () => clearInterval(interval);
  }, []);
};
```

### 보안 개발 생명주기 (SDL)

- **코드 작성 단계**: 모든 입력 검증, XSS/CSRF 방지, SQL 인젝션 방지
- **코드 리뷰 단계**: 보안 체크리스트 필수 통과
- **테스팅 단계**: 보안 테스트, 메모리 누수 테스트, 권한 테스트
- **배포 단계**: 보안 헤더 검증, 환경변수 검증, 의존성 취약점 스캔

## 🚀 개발 핵심 원칙 (2025-08-12 Beta 완성 교훈)

### **"Reality-First" Database Development**
- ❌ **금지**: 문서만 보고 DB 스키마 추측
- ✅ **필수**: `npx supabase gen types typescript`로 실제 스키마 확인 후 개발
- ✅ **순서**: 스키마 확인 → FK 관계 파악 → ENUM 제약조건 확인 → 테스트 데이터 검증 → 개발 시작

### **API-First Architecture (클라이언트 DB 직접 접근 금지)**
```typescript
// ❌ 절대 금지: 클라이언트에서 직접 DB 접근
const { error } = await supabase.from('user_profiles').update({ status: 'active' })

// ✅ 필수: API Route 사용
const response = await fetch('/api/tenant-admin/approve-member', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${session.access_token}` },
  body: JSON.stringify({ userId, action: 'approve', tenantId })
})
```

### **표준 API Route 패턴**
```typescript
export async function POST(request: NextRequest) {
  // 1. 인증 확인
  const { supabase: middlewareClient } = createMiddlewareClient(request)
  const { data: { session } } = await middlewareClient.auth.getSession()
  if (!session?.user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

  // 2. 입력 검증 (Zod)
  const body = await request.json()
  const validatedData = schema.parse(body)

  // 3. 권한 검증 (테넌트별 격리)
  const userProfile = await supabaseServiceRole
    .from('user_profiles').select('tenant_id').eq('id', session.user.id).single()
  if (userProfile.tenant_id !== validatedData.tenantId) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  // 4. Service Role로 DB 조작
  const result = await supabaseServiceRole.from('table').update(validatedData)
  
  // 5. 구조화된 응답
  return NextResponse.json({ success: true, data: result })
}
```

### **JWT 인증 표준 패턴**
```typescript
// 클라이언트: Authorization 헤더 사용 (쿠키 방식 금지)
const { data: { session } } = await supabase.auth.getSession()
fetch('/api/endpoint', {
  headers: { 'Authorization': `Bearer ${session.access_token}` }
})

// 서버: Service Role로 토큰 검증
const token = request.headers.get('authorization')?.replace('Bearer ', '')
const { data: { user } } = await supabaseServiceRole.auth.getUser(token)
```

### **구조화된 로깅 패턴**
```typescript
console.log('🏢 API 시작:', apiName)
console.log('🔑 인증 확인:', { hasToken: !!token })
console.log('👤 사용자 검증:', { userId, email })
console.log('✅ 처리 완료') || console.error('❌ 처리 실패:', error)
```

## Development Commands

- `npm run dev` - Start development server with turbopack
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Tech Stack & Architecture

### Core Technologies

- **Framework**: Next.js 15 with App Router
- **UI**: React 19, TailwindCSS 4, Headless UI
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Drag & Drop**: @dnd-kit
- **Forms**: React Hook Form with Zod validation
- **Virtualization**: react-window (for large datasets)
- **Error Tracking**: Sentry

### Key Dependencies

- Authentication: @supabase/auth-helpers-nextjs
- Form validation: react-hook-form + @hookform/resolvers + zod
- UI Components: @headlessui/react, @heroicons/react
- Charts: recharts
- Date handling: date-fns
- Immutable updates: immer

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (admin)/           # Admin layout group
│   ├── (auth)/            # Auth layout group (login/register)
│   └── admin/             # Admin pages (dashboard, students, etc.)
├── components/            # Reusable UI components
│   ├── auth/              # Authentication components
│   ├── classes/           # Class management components
│   ├── students/          # Student management components
│   └── ui/                # Generic UI components
├── config/                # Configuration files
├── features/              # Feature-specific code
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and external service configs
│   ├── auth/              # Authentication utilities
│   └── db/                # Database client configuration
├── store/                 # Zustand state management
├── types/                 # TypeScript type definitions
└── utils/                 # General utility functions
```

## Path Aliases

The project uses TypeScript path aliases configured in tsconfig.json:

- `@/*` → `./src/*`
- `@/components/*` → `./src/components/*`
- `@/lib/*` → `./src/lib/*`
- `@/hooks/*` → `./src/hooks/*`
- `@/store/*` → `./src/store/*`
- `@/types/*` → `./src/types/*`
- `@/utils/*` → `./src/utils/*`

## Database & API Architecture

- **Database**: Supabase PostgreSQL with Row Level Security (RLS) - **Schema v4.1**
- **Authentication**: Supabase Auth with comprehensive RBAC (admin/instructor/staff/viewer)
- **API**: RESTful API with Next.js App Router + Supabase client-side queries
- **Real-time**: Supabase real-time subscriptions for ClassFlow and live updates
- **Complex Systems**: Advanced billing types (5 types) and salary policies (7 types)

**Schema v4.1 Key Features** (2025-08-11 Updated):

- **MVP Core** (v2.0): 5 billing types, 7 salary policies, complete enrollment tracking
- **Extended Features** (v3.0): Classroom management, timetable system, grade management
- **Multitenant Architecture** (v4.0): Complete tenant isolation with flexible RBAC
- **Enhanced Student Management** (v4.1): 복수 학부모 연락처, 학생 이메일 지원
- **Advanced Class Management** (v4.1): 학년별/과정별 세분화된 클래스 관리

**v4.1 Schema Updates** (2025-08-11):

- **Students Table**: `parent_phone_1`, `parent_phone_2`, `parent_name`, `email` 컬럼 추가
- **Classes Table**: `grade`, `course` 컬럼 추가 (학년별/과정별 관리 지원)
- **Enhanced Indexing**: 성능 최적화를 위한 학년/연락처별 인덱스 추가

**Key Entities**: Students, Classes, Users, Course Packages, Student Enrollments, Salary Policies, Classrooms, Exams, Documents, Student Histories, Consultations.

## 🚨 CRITICAL Database Development Guidelines

### "Reality-First" Database Development Philosophy

**⚠️ 2025-08-11 T-005 깨달음: "문서와 실제 DB의 심각한 괴리" 사건으로 6시간 소요 (예상: 1시간)**

#### 핵심 원칙: 문서보다 실제 DB가 정답이다

```typescript
// ❌ 잘못된 접근: 문서 기반 개발
// 문서에서 classes.instructor_id → instructors.id 라고 되어있음
// 실제로는 classes.instructor_id → user_profiles.id 임

// ✅ 올바른 접근: Reality-First
npx supabase gen types typescript  // 실제 DB 구조 확인
```

#### EduCanvas의 User-First Architecture 이해 (필수 암기)

```typescript
// EduCanvas 핵심 아키텍처
user_profiles (모든 사용자의 기본 정보)
    ↓ (user_id FK)
instructors (강사 추가 정보)
    ↓ (instructor_id는 user_profiles.id를 직접 참조!)
classes.instructor_id → user_profiles.id (NOT instructors.id!)
```

**설계 의도**: 권한 관리의 일관성과 단순성을 위해 모든 강사는 먼저 사용자가 되고, 클래스는 사용자 계정과 직접 연결됨

#### 데이터베이스 개발 체크리스트 (필수 준수)

```bash
# BEFORE 코딩 (필수 순서)
1. npx supabase gen types typescript  # 실제 스키마 확인
2. 주요 테이블의 Row/Insert 타입 분석  # 필수 필드 파악
3. Relationships 섹션에서 FK 관계 완전 파악
4. ENUM 제약조건 및 허용값 확인
5. 소량 테스트 데이터로 검증
6. 성공 후 본격 진행

# 금지사항
❌ 문서만 보고 FK 관계 추측
❌ 복잡한 PL/pgSQL부터 시작 (단순한 INSERT 문부터)
❌ RETURNING 절과 변수 사용 (오류 위험)
❌ 필수 필드 누락 (특히 students.student_number)
```

#### 숨겨진 제약조건 주의사항

```typescript
// 발견된 숨겨진 제약조건들
user_profiles.id → auth.users.id (FK, 타입에 미표시)
students.student_number: NOT NULL (필수, 누락 시 오류)
classes.cource (오타: "course"가 아님, 실제 컬럼명)
```

#### Supabase RLS 및 권한 체계 완전 이해

```sql
-- Service Role vs Client Role 차이점 (필수 이해)
Service Role: RLS 우회 가능, 모든 테넌트 데이터 접근
Client Role: RLS 강제 적용, 소속 테넌트만 접근
Developer Mode (admin@test.com): 개발용 전체 접근 권한

-- 데이터 추가 시 필수 사항
1. 샘플 데이터 생성: 반드시 Service Role 사용
2. 애플리케이션 레벨: Client Role + RLS 정책 준수
3. 테넌트 격리: 모든 데이터에 tenant_id 필수
```

#### 제약조건 우선 사고 (Constraint-First Thinking)

```typescript
// ✅ 올바른 개발 순서
1. NOT NULL 제약조건 확인 → 필수 필드 파악
2. FK 제약조건 확인 → 참조 관계 파악
3. ENUM 제약조건 확인 → 허용값 파악
4. UNIQUE 제약조건 확인 → 중복 방지
5. 제약조건을 만족하는 최소 데이터부터 시작

// ❌ 잘못된 접근
"일단 데이터 넣고 오류 보면서 수정" → 무한 디버깅 지옥
```

### UUID 작업 시 필수 준수사항

**⚠️ 2025-08-10 UUID 오류 사건 반성: T-003 작업에서 잘못된 UUID 형식으로 인해 3시간 개발 지연 발생**

#### 1. UUID 형식 엄격 준수 (8-4-4-4-12)

```
✅ 올바른: 12345678-1234-1234-1234-123456789abc
❌ 잘못된: 12345678-1234-1234-1234-123456789abcd (13자리)
❌ 잘못된: 12345678-1234-1234-1234-123456789ab (11자리)
```

#### 2. 필수 UUID 생성 방법 우선순위

1. **최우선**: `gen_random_uuid()` 사용 - PostgreSQL 자동 생성
2. **차선책**: 검증된 UUID 생성기 사용
3. **절대금지**: 수동으로 하드코딩된 UUID 작성

```sql
-- ✅ 권장: 자동 UUID 생성
INSERT INTO tenants (name, slug) VALUES ('학원명', 'academy-slug');

-- ✅ 허용: 검증된 UUID 사용
INSERT INTO tenants (id, name, slug) VALUES
('12345678-1234-1234-1234-123456789abc', '학원명', 'academy-slug');

-- ❌ 금지: 수동 UUID 하드코딩 (오타 위험)
INSERT INTO tenants (id, name, slug) VALUES
('ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj', '학원명', 'academy-slug');
```

#### 3. 관계형 데이터 생성 시 동적 참조 필수

```sql
-- ✅ 권장: JOIN으로 안전한 FK 참조
INSERT INTO classes (tenant_id, name)
SELECT t.id, '클래스명'
FROM tenants t
WHERE t.slug = 'academy-slug';

-- ❌ 금지: 하드코딩된 FK 사용
INSERT INTO classes (tenant_id, name) VALUES
('12345678-1234-1234-1234-123456789abc', '클래스명');
```

#### 4. SQL 스크립트 작성 시 검증 절차

1. UUID 길이 확인: 36자 (하이픈 포함)
2. 형식 검증: 8-4-4-4-12 패턴
3. 관계 무결성: FK는 반드시 실제 존재하는 값 참조
4. 충돌 방지: `ON CONFLICT DO NOTHING` 적극 활용

## State Management Pattern

Uses Zustand for state management with separate stores for different domains:

- `classflowStore.ts` - Drag-and-drop state and student movement operations (핵심)
- `studentsStore.ts` - Student data management and CRUD operations
- `classesStore.ts` - Class/group management and statistics
- `useAuthStore.ts` - Authentication state and user permissions
- `useModalStore.ts` - Modal/dialog state management
- `paymentsStore.ts` - Enrollment and payment data management

## Design System

Custom design system built on TailwindCSS with:

- Brand colors (blue-based palette)
- Status colors (success/warning/error)
- Custom animations (fade-in, slide-up, scale-in)
- Typography using Inter font family
- Forms and typography plugins

## Development Guidelines

### Code Quality Standards 🏆

**MANDATORY**: All code MUST follow the comprehensive `/docs/coding-standards.md` - enterprise-grade development guidelines covering:

**Core Requirements**:

- **TypeScript Strict Mode**: No `any`, complete type coverage, strict null checks
- **React Performance**: memo(), useCallback(), useMemo() mandatory for ClassFlow components
- **60fps ClassFlow Guarantee**: Virtualization, batch updates, optimized reconciliation
- **WCAG 2.1 AA Compliance**: Keyboard navigation, screen readers, color contrast
- **Test Coverage 80%+**: Unit, integration, E2E tests for all features
- **Error Handling**: Try-catch blocks, custom error types, Sentry integration
- **Code Review**: Mandatory PR reviews, automated quality checks

### Performance Requirements

- Support 10,000+ student records with virtualization
- Maintain 60+ FPS during drag-and-drop operations (ClassFlow)
- Use react-window for large data sets (1000+ items)
- Bundle size < 500KB per chunk
- Memory usage < 50MB peak

### Mandatory Code Patterns

**CRITICAL**: Follow these patterns exactly as specified in `/docs/coding-standards.md`:

```typescript
// ✅ Required React Component Pattern
const StudentCard = memo<StudentCardProps>(({ student, onUpdate }) => {
  // 1. Hooks (order matters)
  const { isLoading, error } = useStudentData(student.id);
  const handleClick = useCallback(() => onUpdate(student), [student, onUpdate]);
  const memoizedData = useMemo(() => computeExpensive(student), [student]);

  // 2. Early returns for loading/error states
  if (isLoading) return <SkeletonCard />;
  if (error) return <ErrorCard error={error} />;

  // 3. Main render
  return (
    <Card role="button" tabIndex={0} onClick={handleClick}>
      {memoizedData.display}
    </Card>
  );
});
StudentCard.displayName = "StudentCard";

// ✅ Required Zustand Store Pattern
const useStudentsStore = create<StudentsState>()((set, get) => ({
  students: [],
  loading: false,
  error: null,
  actions: {
    updateStudent: (id: string, updates: Partial<Student>) =>
      set(
        produce((draft) => {
          const index = draft.students.findIndex((s) => s.id === id);
          if (index !== -1) Object.assign(draft.students[index], updates);
        })
      ),
  },
}));
```

### File Naming & Organization Standards

**STRICT ENFORCEMENT**: Follow exact naming conventions from `/docs/coding-standards.md`:

- **React Components**: `PascalCase.tsx` (`StudentCard.tsx`, `ClassFlowPanel.tsx`)
- **Custom Hooks**: `camelCase.ts` with `use` prefix (`useStudentData.ts`, `useClassFlow.ts`)
- **Utility Functions**: `camelCase.ts` (`formatDate.ts`, `validateEmail.ts`)
- **Type Definitions**: `PascalCase.types.ts` (`Student.types.ts`, `ClassFlow.types.ts`)
- **Constants**: `UPPER_SNAKE_CASE.ts` (`API_ENDPOINTS.ts`, `PERFORMANCE_THRESHOLDS.ts`)
- **Stores**: `camelCaseStore.ts` (`studentsStore.ts`, `classflowStore.ts`)
- **API Routes**: `kebab-case` (`/api/student-enrollment`, `/api/class-schedule`)

### Testing Standards (80%+ Coverage Required)

**MANDATORY TESTING**: Comprehensive test coverage as specified in `/docs/coding-standards.md`:

- **Unit Tests**: 80%+ coverage for utilities, hooks, pure functions
- **Component Tests**: React Testing Library for all interactive components
- **Integration Tests**: API routes, database operations, user workflows
- **E2E Tests**: Playwright for critical business processes (ClassFlow, payments)
- **Performance Tests**: 60fps validation, memory usage, bundle size monitoring
- **Accessibility Tests**: axe-core integration, keyboard navigation testing
- **Test File Naming**: `Component.test.tsx`, `utils.test.ts`, `integration.test.ts`

### Error Handling & Logging Standards

**CRITICAL RELIABILITY**: Comprehensive error handling as specified in `/docs/coding-standards.md`:

```typescript
// ✅ Required Error Boundary Pattern
<ErrorBoundary
  fallback={<ClassFlowErrorFallback />}
  onError={(error, errorInfo) =>
    Sentry.captureException(error, { extra: errorInfo })
  }
>
  <ClassFlowPanel />
</ErrorBoundary>;

// ✅ Required API Error Handling with Type Safety
try {
  const result = await supabase.from("students").select();
  if (result.error) throw new DatabaseError(result.error.message);
  return result.data;
} catch (error) {
  if (error instanceof DatabaseError) {
    toast.error("Database connection failed");
    logger.error("Database error", { error, context: "student-fetch" });
  }
  Sentry.captureException(error, { tags: { component: "StudentList" } });
  throw error;
}

// ✅ Required Custom Error Types
class ClassFlowError extends Error {
  constructor(message: string, public code: string, public retryable = false) {
    super(message);
    this.name = "ClassFlowError";
  }
}
```

### Environment Variables & Security 🔐

**⚠️ MANDATORY SECURITY**: 모든 환경변수는 보안 중심으로 설정되어야 합니다.

#### Core Application Settings

- `NODE_ENV` - Environment detection (development/production/test)
- `NEXT_PUBLIC_APP_URL` - Application base URL for callbacks
- `NEXT_PUBLIC_APP_NAME` - Application name for security headers

#### Database & Authentication (Supabase)

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key (제한된 권한)
- `SUPABASE_SERVICE_ROLE_KEY` - 🚨 Server-side only (NEVER expose to client)
- `SUPABASE_JWT_SECRET` - JWT 토큰 검증용 시크릿

#### Authentication & Session Security

- `NEXTAUTH_SECRET` - Authentication encryption key (32+ characters)
- `NEXTAUTH_URL` - NextAuth callback URL
- `JWT_SIGNING_PRIVATE_KEY` - JWT 서명용 private key
- `JWT_ENCRYPTION_KEY` - JWT 암호화용 키 (32 bytes)
- `SESSION_SECRET` - Session 암호화 키
- `CSRF_SECRET` - CSRF 토큰 생성 시크릿

#### Data Encryption & Security

- `DATA_ENCRYPTION_KEY` - 민감데이터 암호화 키 (AES-256)
- `STUDENT_DATA_ENCRYPTION_KEY` - 학생 개인정보 전용 암호화 키
- `DATABASE_ENCRYPTION_PASSWORD` - 데이터베이스 레벨 암호화 패스워드
- `CRYPTO_SALT` - 해시 생성용 솔트 값

#### Security Headers & CSP

- `SECURITY_HEADERS_ENABLED` - 보안 헤더 활성화 (true)
- `CSP_REPORT_URI` - Content Security Policy 위반 보고 URI
- `HSTS_MAX_AGE` - HTTP Strict Transport Security 만료 시간 (31536000)
- `ALLOWED_ORIGINS` - CORS 허용 도메인 (comma-separated)

#### Monitoring & Error Tracking

- `SENTRY_DSN` - 오류 추적 및 성능 모니터링
- `SENTRY_AUTH_TOKEN` - Sentry 인증 토큰
- `LOG_LEVEL` - 로그 레벨 (error/warn/info/debug)
- `AUDIT_LOG_ENDPOINT` - 감사 로그 전송 엔드포인트

#### Rate Limiting & DDoS Protection

- `RATE_LIMIT_MAX` - API 요청 제한 (분당 100개)
- `RATE_LIMIT_WINDOW` - 제한 시간 윈도우 (60초)
- `DDOS_PROTECTION_ENABLED` - DDoS 보호 활성화 (true)
- `IP_WHITELIST` - IP 화이트리스트 (comma-separated)

#### Memory & Performance Security

- `MAX_MEMORY_USAGE` - 최대 메모리 사용량 (50MB)
- `MEMORY_MONITORING_ENABLED` - 메모리 모니터링 활성화 (true)
- `GC_AGGRESSIVE` - 적극적 가비지 컬렉션 (development only)
- `SENSITIVE_DATA_TTL` - 민감데이터 메모리 보관 시간 (100ms)

#### Development & Testing Security

- `ENABLE_MEMORY_PROFILING` - 메모리 프로파일링 (development only)
- `SECURITY_TESTING_ENABLED` - 보안 테스트 활성화 (development/staging)
- `MOCK_SECURITY_BYPASS` - 테스트용 보안 우회 (test only)

**🔒 Security Best Practices**:

```bash
# .env.local (Development)
NODE_ENV=development
NEXTAUTH_SECRET="your-super-secure-32-char-secret-key-here"
DATA_ENCRYPTION_KEY="AES256-encryption-key-32-characters-long"
SECURITY_HEADERS_ENABLED=true
MEMORY_MONITORING_ENABLED=true
RATE_LIMIT_MAX=100
CSP_REPORT_URI="/api/security/csp-report"

# .env.production (Production - Server only)
NODE_ENV=production
NEXTAUTH_SECRET="${NEXTAUTH_SECRET_FROM_VAULT}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_KEY_FROM_VAULT}"
DATA_ENCRYPTION_KEY="${DATA_ENCRYPTION_KEY_FROM_VAULT}"
SECURITY_HEADERS_ENABLED=true
DDOS_PROTECTION_ENABLED=true
AUDIT_LOG_ENDPOINT="https://audit.educanvas.com/api/logs"
```

**⚠️ CRITICAL SECURITY RULES**:

1. **절대 금지**: `SUPABASE_SERVICE_ROLE_KEY`를 클라이언트에 노출
2. **필수**: 모든 시크릿은 32자 이상 랜덤 문자열 사용
3. **강제**: Production에서는 환경변수를 외부 Vault에서 로드
4. **감시**: 환경변수 변경 시 보안팀 승인 필요

## Comprehensive Documentation

**⚠️ IMPORTANT**: Complete zero-base project reorganization completed on 2025-08-08. All documentation updated to reflect schema v2.0 and MVP focus.

### Core Documentation (`/docs/`)

- `coding-standards.md` - **🏆 MANDATORY** Enterprise-grade development guidelines (TypeScript, React, Testing, Performance, Accessibility)
- `database_design.md` - **v2.0** Complete database schema documentation (schema_v2.sql 기반)
- `기능요구서.md` - **v2.0** MVP-focused feature requirements (P0 only)
- `development_plan.md` - **v2.0** Complete 10-week MVP development roadmap
- `api_specification.md` - **v2.0** Comprehensive RESTful API documentation
- `database_schema_v2.sql` - MVP-focused database schema (Phase 1-3)
- `database_schema_v3.sql` - Extended database schema for Phase 4-10 features (Current)
- `extended_roadmap.md` - **NEW** 3-year development roadmap (2025-2028)
- `feature_priority_matrix.md` - **NEW** Feature prioritization analysis
- `competitive_features_integration.md` - **NEW** Competitive feature integration strategy

### Project Management (`/docs/project/`)

- `BACKLOG.md` - **UPDATED** Comprehensive 150+ task backlog (MVP + 3-year expansion)
- `ROADMAP.md` - **UPDATED** Integrated MVP + long-term roadmap
- `OVERVIEW.md` - **UPDATED** Project overview with expanded vision
- `TASKS/` - Individual development task specifications
- `SPRINTS/` - Sprint planning and retrospectives
- `DECISIONS/` - Architecture Decision Records (ADRs)

### Archived Documentation (`/docs/archive/`)

- Outdated v1.0 documents moved here during reorganization
- Previous competitor analysis and planning documents

## Current Development Status

**Phase**: MVP Development Ready (Post-reorganization)  
**Timeline**: Week 1/10 (2025-08-12 ~ 2025-10-17)  
**Next Steps**: Begin Phase 1 infrastructure development as per development_plan.md

**P0 MVP Features (10-week timeline)**:

1. **ClassFlow** (3주) - 드래그앤드롭 학생 관리 (킬러 기능)
2. **학생 관리** (2주) - CRUD, 출결, 상태 관리
3. **강사 관리** (1주) - 기본 정보, 반 배정, 급여 정책
4. **결제 관리** (3주) - 복합 수강권 시스템 (schema_v2 기반)
5. **권한 관리** (1주) - RBAC 완전 구현

**Success Criteria**: ClassFlow 60fps + 1000+ students + WCAG 2.1 AA + 99.9% uptime

- 한국어로 답변해줘.
- Supabase 접속은 항상 .env.local 정보를 이용해 npx supabase 명령어로 cli를 이용하도록 해
- 이 프로젝트에서는 로컬DB를 사용하지 않아. 항상 .env.local 파일의 정보를 이용해 supabase 클라우드 데이터베이스로 접속해야 해.

- UI컴포넌트 사용시 docs/project_manual/UI-Components-Manual.md 파일을 봐야 해.