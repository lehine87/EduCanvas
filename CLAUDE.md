# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EduCanvas is a student management system for educational institutions (hakwon/academy). It's built with Next.js 15, React 19, and Supabase, focusing on RBAC (Role-Based Access Control), drag-and-drop class management, and high-performance handling of large datasets.

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

- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with RBAC
- **API**: Next.js App Router API routes + Supabase client-side queries
- **Real-time**: Supabase real-time subscriptions for live updates

Key entities: Students, Classes, Users with role-based permissions.

## State Management Pattern

Uses Zustand for state management with separate stores for different domains:
- `studentsStore.ts` - Student data and operations
- `classesStore.ts` - Class/group management
- `useAuthStore.ts` - Authentication state
- `useModalStore.ts` - Modal/dialog state

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

## Project Management

The project follows an organized approach with documentation in `/project/`:
- `OVERVIEW.md` - Project goals and structure
- `ROADMAP.md` - Development timeline
- `SPRINTS/` - Sprint planning and tracking
- `TASKS/` - Individual task management
- `DECISIONS/` - Architecture Decision Records (ADRs)

Current focus: P0 features (RBAC, drag-and-drop class management, transaction APIs) with emphasis on performance and stability.