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

### Performance Requirements
- Support 10,000+ student records with virtualization
- Maintain 50+ FPS during drag-and-drop operations
- Use react-window for large data sets

### Code Patterns
- Feature-based folder structure
- Custom hooks for business logic
- Zustand stores for state management
- Zod schemas for validation
- Error boundaries with Sentry integration

### Environment Variables
Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Comprehensive Documentation

**⚠️ IMPORTANT**: Complete zero-base project reorganization completed on 2025-08-08. All documentation updated to reflect schema v2.0 and MVP focus.

### Core Documentation (`/docs/`)
- `database_design.md` - **v2.0** Complete database schema documentation (schema_v2.sql 기반)
- `기능요구서.md` - **v2.0** MVP-focused feature requirements (P0 only)  
- `development_plan.md` - **NEW** Complete 10-week MVP development roadmap
- `api_specification.md` - **NEW** Comprehensive RESTful API documentation
- `database_schema_v2.sql` - Production-ready database schema

### Template Files (`/project/`)
- `BACKLOG.md` - Task backlog template
- `ROADMAP.md` - High-level roadmap template
- **Note**: These are templates and not directly related to current project

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