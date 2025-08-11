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
const verifyAccess = async (userId: string, resourceId: string, action: string) => {
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
      address: student.address ? encrypt(student.address) : null
    };
  }
  
  private clearSensitiveData(dataRef: { current: string | null }) {
    if (dataRef.current) {
      // 메모리 덮어쓰기
      dataRef.current = '\0'.repeat(dataRef.current.length);
      dataRef.current = null;
      
      // 가비지 컬렉션 강제 실행 (개발 환경에서)
      if (process.env.NODE_ENV === 'development' && global.gc) {
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
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1048576;
        
        // 메모리 사용량 임계값 초과 시 보안 이벤트로 처리
        if (usedMB > 50) {
          Sentry.captureMessage('High memory usage detected - potential security risk', {
            level: 'warning',
            tags: { 
              component: 'memory-monitor',
              securityEvent: true 
            },
            extra: { memoryUsage: `${usedMB}MB` }
          });
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

- **Database**: Supabase PostgreSQL with Row Level Security (RLS) - **Schema v3.0**
- **Authentication**: Supabase Auth with comprehensive RBAC (admin/instructor/staff/viewer)
- **API**: RESTful API with Next.js App Router + Supabase client-side queries
- **Real-time**: Supabase real-time subscriptions for ClassFlow and live updates
- **Complex Systems**: Advanced billing types (5 types) and salary policies (7 types)

**Schema v3.0 Key Features**:
- **MVP Core** (v2.0): 5 billing types, 7 salary policies, complete enrollment tracking
- **Extended Features** (v3.0): Classroom management, timetable system, grade management
- **Document Management**: File storage with version control and OCR text extraction
- **Student History**: Comprehensive tracking with AI-powered academic progress analysis
- **Consultation System**: Structured counseling management with effectiveness tracking

**Key Entities**: Students, Classes, Users, Course Packages, Student Enrollments, Salary Policies, Classrooms, Exams, Documents, Student Histories, Consultations.

## 🚨 CRITICAL Database Development Guidelines

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
StudentCard.displayName = 'StudentCard';

// ✅ Required Zustand Store Pattern 
const useStudentsStore = create<StudentsState>()((set, get) => ({
  students: [],
  loading: false,
  error: null,
  actions: {
    updateStudent: (id: string, updates: Partial<Student>) =>
      set(produce(draft => {
        const index = draft.students.findIndex(s => s.id === id);
        if (index !== -1) Object.assign(draft.students[index], updates);
      })),
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
  onError={(error, errorInfo) => Sentry.captureException(error, { extra: errorInfo })}
>
  <ClassFlowPanel />
</ErrorBoundary>

// ✅ Required API Error Handling with Type Safety
try {
  const result = await supabase.from('students').select();
  if (result.error) throw new DatabaseError(result.error.message);
  return result.data;
} catch (error) {
  if (error instanceof DatabaseError) {
    toast.error('Database connection failed');
    logger.error('Database error', { error, context: 'student-fetch' });
  }
  Sentry.captureException(error, { tags: { component: 'StudentList' } });
  throw error;
}

// ✅ Required Custom Error Types
class ClassFlowError extends Error {
  constructor(message: string, public code: string, public retryable = false) {
    super(message);
    this.name = 'ClassFlowError';
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