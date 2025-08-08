# 엔터프라이즈급 학원 관리 시스템 프로젝트 셋업

## 🚀 Step 1: 프로젝트 생성

### 1.1 Next.js 프로젝트 생성

```bash
# 최신 Next.js 14 + TypeScript + Tailwind 프로젝트 생성
npx create-next-app@latest academy-management-pro --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# 프로젝트 디렉토리로 이동
cd academy-management-pro
```

### 1.2 필수 패키지 설치

```bash
# 상태 관리 & 유틸리티
npm install zustand immer

# UI & 접근성
npm install @headlessui/react @heroicons/react
npm install react-hot-toast

# 드래그앤드롭
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# 가상화 & 성능
npm install react-window react-window-infinite-loader
npm install @types/react-window

# 차트 & 분석
npm install recharts

# 인증 & 데이터베이스
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# 폼 관리
npm install react-hook-form @hookform/resolvers zod

# 날짜 처리
npm install date-fns

# 에러 추적 (선택사항)
npm install @sentry/nextjs

# 개발 도구
npm install -D @types/node
```

---

## 📁 Step 2: 프로젝트 구조 설계

### 2.1 최적화된 폴더 구조 생성

```bash
# 기본 폴더 구조 생성
mkdir -p src/components/{ui,auth,class-manager,student,analytics,modals}
mkdir -p src/store
mkdir -p src/lib
mkdir -p src/hooks
mkdir -p src/types
mkdir -p src/utils
mkdir -p src/app/{auth,admin,dashboard}
mkdir -p public/icons

# 각 폴더에 index.ts 파일 생성
touch src/components/index.ts
touch src/store/index.ts
touch src/lib/index.ts
touch src/hooks/index.ts
touch src/types/index.ts
touch src/utils/index.ts
```

### 2.2 완성된 폴더 구조

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 인증 관련 페이지 그룹
│   │   ├── login/
│   │   └── register/
│   ├── (admin)/                  # 관리자 페이지 그룹
│   │   ├── dashboard/
│   │   ├── class-manager/
│   │   ├── students/
│   │   ├── analytics/
│   │   └── settings/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # 재사용 가능한 컴포넌트
│   ├── ui/                      # 기본 UI 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   └── index.ts
│   ├── auth/                    # 인증 관련 컴포넌트
│   │   ├── LoginForm.tsx
│   │   ├── PermissionGate.tsx
│   │   └── index.ts
│   ├── class-manager/           # 반 관리 컴포넌트
│   │   ├── ClassBox.tsx
│   │   ├── StudentTable.tsx
│   │   ├── DragDropContext.tsx
│   │   └── index.ts
│   ├── student/                 # 학생 관리 컴포넌트
│   ├── analytics/               # 분석 컴포넌트
│   └── modals/                  # 모달 컴포넌트
├── store/                       # 상태 관리 (Zustand)
│   ├── useAuthStore.ts
│   ├── useClassStore.ts
│   ├── useStudentStore.ts
│   ├── useColumnStore.ts
│   ├── useModalStore.ts
│   └── index.ts
├── lib/                         # 라이브러리 설정
│   ├── supabase.ts
│   ├── auth.ts
│   ├── validations.ts
│   └── utils.ts
├── hooks/                       # 커스텀 훅
│   ├── useAuth.ts
│   ├── useDragAndDrop.ts
│   ├── usePersistedState.ts
│   └── index.ts
├── types/                       # TypeScript 타입 정의
│   ├── auth.ts
│   ├── student.ts
│   ├── class.ts
│   ├── database.ts
│   └── index.ts
├── utils/                       # 유틸리티 함수
│   ├── constants.ts
│   ├── formatters.ts
│   ├── validators.ts
│   └── index.ts
└── middleware.ts                # Next.js 미들웨어
```

---

## ⚙️ Step 3: 기본 설정 파일 구성

### 3.1 TypeScript 설정 강화

```json
// tsconfig.json (기존 파일 업데이트)
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/store/*": ["./src/store/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 3.2 Tailwind CSS 설정

```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 브랜드 컬러
        brand: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        // 상태 컬러
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}

export default config
```

### 3.3 환경 변수 설정

```bash
# .env.local 파일 생성
cat > .env.local << 'EOF'
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 애플리케이션 설정
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Academy Management Pro

# Sentry (선택사항)
SENTRY_DSN=your_sentry_dsn

# 기타
NODE_ENV=development
EOF
```

### 3.4 환경 변수 타입 정의

```typescript
// src/types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string
    SUPABASE_SERVICE_ROLE_KEY: string
    NEXT_PUBLIC_APP_URL: string
    NEXT_PUBLIC_APP_NAME: string
    SENTRY_DSN?: string
    NODE_ENV: 'development' | 'production' | 'test'
  }
}
```

---

## 🗄️ Step 4: 핵심 타입 정의

### 4.1 기본 타입 정의

```typescript
// src/types/index.ts
export * from './auth'
export * from './student'
export * from './class'
export * from './database'

// 공통 타입
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginationResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export type Status = 'active' | 'inactive' | 'waiting' | 'graduated'
```

### 4.2 인증 관련 타입

```typescript
// src/types/auth.ts
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  academy_id: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface UserRole {
  id: string
  name: string
  permissions: Permission[]
}

export interface Permission {
  resource: 'students' | 'classes' | 'analytics' | 'settings' | 'users'
  actions: ('read' | 'create' | 'update' | 'delete')[]
}

export interface Academy {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
  settings: AcademySettings
}

export interface AcademySettings {
  theme: 'light' | 'dark'
  language: 'ko' | 'en'
  timezone: string
  currency: string
}
```

### 4.3 학생 관련 타입

```typescript
// src/types/student.ts
export interface Student {
  id: string
  name: string
  phone?: string
  parent_name?: string
  parent_phone: string
  grade?: string
  class_id?: string
  status: Status
  monthly_fee: number
  enrollment_date: string
  graduation_date?: string
  display_color?: string
  position_in_class: number
  memo?: string
  academy_id: string
  created_at: string
  updated_at: string
}

export interface StudentFilters {
  search: string
  status: Status | 'all'
  class: string | 'all'
  grade: string | 'all'
}

export interface StudentStats {
  total: number
  active: number
  waiting: number
  graduated: number
  revenue: {
    total: number
    monthly: number
    projected: number
  }
}
```

### 4.4 반 관련 타입

```typescript
// src/types/class.ts
export interface Class {
  id: string
  name: string
  subject: string
  grade_level?: string
  max_students: number
  monthly_fee: number
  main_instructor_id?: string
  classroom?: string
  color: string
  status: Status
  start_date?: string
  end_date?: string
  order_index: number
  memo?: string
  academy_id: string
  created_at: string
  updated_at: string
}

export interface ClassSchedule {
  id: string
  class_id: string
  day_of_week: number // 0=일요일, 1=월요일, ..., 6=토요일
  start_time: string
  end_time: string
  created_at: string
}

export interface ClassStats {
  total_students: number
  active_students: number
  waiting_students: number
  total_revenue: number
  attendance_rate: number
}
```

---

## 🛠️ Step 5: 기본 라이브러리 설정

### 5.1 Supabase 클라이언트 설정

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// 서버 사이드용 Supabase 클라이언트
export const createServerClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
```

### 5.2 유틸리티 함수

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('ko-KR').format(new Date(date))
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{4})(\d{4})$/)
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`
  }
  return phone
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
```

### 5.3 상수 정의

```typescript
// src/utils/constants.ts
export const APP_CONFIG = {
  name: 'Academy Management Pro',
  version: '1.0.0',
  description: '엔터프라이즈급 학원 관리 시스템',
} as const

export const ROLES = {
  ADMIN: {
    id: 'admin',
    name: '관리자',
    permissions: [
      { resource: 'students', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'classes', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'analytics', actions: ['read'] },
      { resource: 'settings', actions: ['read', 'update'] },
      { resource: 'users', actions: ['read', 'create', 'update', 'delete'] },
    ]
  },
  TEACHER: {
    id: 'teacher',
    name: '강사',
    permissions: [
      { resource: 'students', actions: ['read', 'update'] },
      { resource: 'classes', actions: ['read', 'update'] },
      { resource: 'analytics', actions: ['read'] },
    ]
  },
  STAFF: {
    id: 'staff',
    name: '직원',
    permissions: [
      { resource: 'students', actions: ['read', 'create', 'update'] },
      { resource: 'classes', actions: ['read'] },
    ]
  },
  VIEWER: {
    id: 'viewer',
    name: '조회자',
    permissions: [
      { resource: 'students', actions: ['read'] },
      { resource: 'classes', actions: ['read'] },
    ]
  }
} as const

export const GRADE_OPTIONS = [
  { value: '초1', label: '초등 1학년' },
  { value: '초2', label: '초등 2학년' },
  { value: '초3', label: '초등 3학년' },
  { value: '초4', label: '초등 4학년' },
  { value: '초5', label: '초등 5학년' },
  { value: '초6', label: '초등 6학년' },
  { value: '중1', label: '중학 1학년' },
  { value: '중2', label: '중학 2학년' },
  { value: '중3', label: '중학 3학년' },
  { value: '고1', label: '고등 1학년' },
  { value: '고2', label: '고등 2학년' },
  { value: '고3', label: '고등 3학년' },
  { value: '재수', label: '재수생' },
] as const

export const STATUS_OPTIONS = [
  { value: 'active', label: '수강중', color: 'bg-green-100 text-green-800' },
  { value: 'waiting', label: '대기중', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'inactive', label: '휴학', color: 'bg-gray-100 text-gray-800' },
  { value: 'graduated', label: '졸업', color: 'bg-blue-100 text-blue-800' },
] as const

export const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
] as const
```

---

## 🚀 Step 6: 프로젝트 실행 및 확인

### 6.1 개발 서버 실행

```bash
# 개발 서버 시작
npm run dev

# 브라우저에서 확인
# http://localhost:3000
```

### 6.2 린팅 및 타입 체크

```bash
# ESLint 실행
npm run lint

# TypeScript 타입 체크
npx tsc --noEmit

# Prettier 포맷팅 (선택사항)
npx prettier --write "src/**/*.{ts,tsx}"
```

---

## ✅ 완료 체크리스트

- [x] ✅ Next.js 14 + TypeScript 프로젝트 생성
- [x] ✅ 필수 패키지 설치 완료
- [x] ✅ 엔터프라이즈급 폴더 구조 설계
- [x] ✅ TypeScript 설정 강화
- [x] ✅ Tailwind CSS 커스텀 설정
- [x] ✅ 환경 변수 설정
- [x] ✅ 기본 타입 정의 완료
- [x] ✅ 유틸리티 함수 및 상수 정의
- [x] ✅ Supabase 클라이언트 설정

---

## 🎯 다음 단계

프로젝트 셋업이 완료되었습니다! 이제 다음 단계로 진행할 준비가 되었습니다:

1. **데이터베이스 스키마 설계** (Supabase)
2. **인증 시스템 구축** (Auth Store + 컴포넌트)
3. **기본 UI 컴포넌트 라이브러리** 구축
4. **핵심 비즈니스 로직** 구현

**어떤 단계부터 진행하시겠어요?** 🚀