# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EduCanvas is a revolutionary student management system for educational institutions (hakwon/academy), featuring the industry's first drag-and-drop class management interface (ClassFlow). Built with Next.js 15, React 19, and Supabase, it focuses on intuitive UI/UX, enterprise-grade RBAC, and high-performance handling of large datasets.

**Current Phase**: Ready for MVP development (Week 1/10 of development plan)  
**Key Innovation**: ClassFlow - drag-and-drop student management with 60fps performance  
**Target**: 10-week MVP completion timeline (2025-08-12 ~ 2025-10-17)

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

- **Database**: Supabase PostgreSQL with Row Level Security (RLS) - **Schema v2.0**
- **Authentication**: Supabase Auth with comprehensive RBAC (admin/instructor/staff/viewer)
- **API**: RESTful API with Next.js App Router + Supabase client-side queries
- **Real-time**: Supabase real-time subscriptions for ClassFlow and live updates
- **Complex Systems**: Advanced billing types (5 types) and salary policies (7 types)

**Schema v2.0 Key Features**:
- 5 billing types: monthly, sessions, hours, package, drop_in
- 7 salary policy types: fixed_monthly, fixed_hourly, commission, tiered_commission, etc.
- Automatic enrollment usage tracking and salary calculations
- Complete discount policy management system

Key entities: Students, Classes, Users, Course Packages, Student Enrollments, Salary Policies.

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

### Environment Variables & Security
**MANDATORY SECURITY**: Environment configuration as per `/docs/coding-standards.md`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side operations (NEVER expose to client)
- `SENTRY_DSN` - Error tracking configuration
- `NODE_ENV` - Environment detection (development/production)
- `NEXTAUTH_SECRET` - Authentication encryption key
- `NEXT_PUBLIC_APP_URL` - Application base URL for callbacks

## Comprehensive Documentation

**⚠️ IMPORTANT**: Complete zero-base project reorganization completed on 2025-08-08. All documentation updated to reflect schema v2.0 and MVP focus.

### Core Documentation (`/docs/`)
- `coding-standards.md` - **🏆 MANDATORY** Enterprise-grade development guidelines (TypeScript, React, Testing, Performance, Accessibility)
- `database_design.md` - **v2.0** Complete database schema documentation (schema_v2.sql 기반)
- `기능요구서.md` - **v2.0** MVP-focused feature requirements (P0 only)  
- `development_plan.md` - **v2.0** Complete 10-week MVP development roadmap
- `api_specification.md` - **v2.0** Comprehensive RESTful API documentation
- `database_schema_v2.sql` - Production-ready database schema (MVP)
- `database_schema_v3.sql` - **NEW** Extended schema for Phase 4-10 features
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