# EduCanvas Type Dictionary (타입 사전)
*최종 업데이트: 2025-08-12*
*버전: v4.1 (Schema v4.1 기준)*

이 문서는 EduCanvas 프로젝트에서 사용하는 모든 TypeScript 타입의 완전한 사전입니다.

## 📋 목차

1. [핵심 데이터베이스 타입](#1-핵심-데이터베이스-타입)
2. [사용자 및 인증 타입](#2-사용자-및-인증-타입)
3. [학생 관리 타입](#3-학생-관리-타입)
4. [클래스 관리 타입](#4-클래스-관리-타입)
5. [결제 및 수강권 타입](#5-결제-및-수강권-타입)
6. [API 응답 타입](#6-api-응답-타입)
7. [UI 컴포넌트 타입](#7-ui-컴포넌트-타입)
8. [유틸리티 타입](#8-유틸리티-타입)
9. [상수 및 Enum](#9-상수-및-enum)
10. [ClassFlow 전용 타입](#10-classflow-전용-타입)

---

## 1. 핵심 데이터베이스 타입

### 1.1 기본 엔터티 타입

```typescript
// 파일: src/types/database-v4.1.ts

// 기본 엔터티 인터페이스 (모든 테이블 공통)
interface BaseEntity {
  id: string              // UUID
  created_at: string      // ISO timestamp
  updated_at: string      // ISO timestamp
}

// 멀티테넌트 지원
interface WithTenant {
  tenant_id: string       // UUID
}

// 타임스탬프 유틸리티
interface WithTimestamps {
  created_at: string
  updated_at: string
}
```

### 1.2 Supabase 자동 생성 타입

```typescript
// 파일: src/types/database.types.ts (자동 생성)

export interface Database {
  public: {
    Tables: {
      // 모든 테이블 정의...
    }
    Views: {
      // 뷰 정의...
    }
    Enums: {
      // Enum 정의...
    }
  }
}

// 편의 타입
export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums']
```

---

## 2. 사용자 및 인증 타입

### 2.1 사용자 프로필 타입

```typescript
// 파일: src/types/database-v4.1.ts

export interface UserProfileV41 extends BaseEntity, WithTenant {
  email: string                    // 이메일 (고유)
  full_name: string               // 전체 이름
  avatar_url?: string | null      // 프로필 이미지 URL
  phone?: string | null           // 전화번호
  role: UserRole                  // 사용자 역할
  status: 'active' | 'inactive' | 'suspended' | 'pending_approval'
  last_sign_in?: string | null    // 마지막 로그인
  is_developer?: boolean          // 개발자 계정 여부
  preferences?: Record<string, unknown> | null  // 사용자 설정
}
```

### 2.2 인증 관련 타입

```typescript
// 파일: src/types/auth.ts

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  tenant_id?: string
  avatar_url?: string
}

export interface AuthSession {
  user: User
  access_token: string
  refresh_token: string
  expires_at: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignUpData {
  email: string
  password: string
  full_name: string
}
```

### 2.3 권한 및 역할 타입

```typescript
// 파일: src/types/database-v4.1.ts

export type UserRole = 'admin' | 'instructor' | 'staff' | 'viewer'

export interface TenantUserV41 extends BaseEntity {
  tenant_id: string               // 테넌트 ID
  user_id: string                // 사용자 ID
  role: UserRole                 // 테넌트 내 역할
  status: 'active' | 'pending' | 'inactive'
  invited_by?: string | null     // 초대자 ID
  joined_at?: string | null      // 가입일
}

export interface Permission {
  resource: string
  action: 'create' | 'read' | 'update' | 'delete' | '*'
  conditions?: Record<string, unknown>
}
```

---

## 3. 학생 관리 타입

### 3.1 학생 기본 타입

```typescript
// 파일: src/types/database-v4.1.ts

export interface StudentV41 extends BaseEntity, WithTenant {
  name: string                    // 학생 이름 (필수)
  student_number: string          // 학생 번호 (필수, 고유)
  phone?: string | null          // 학생 연락처
  email?: string | null          // 학생 이메일 (v4.1 추가)
  grade?: string | null          // 학년 (예: "중1", "고2")
  birth_date?: string | null     // 생년월일 (YYYY-MM-DD)
  address?: string | null        // 주소
  
  // v4.1 복수 학부모 연락처 지원
  parent_name?: string | null    // 주 학부모 이름
  parent_phone_1?: string | null // 첫 번째 학부모 연락처
  parent_phone_2?: string | null // 두 번째 학부모 연락처
  
  enrollment_date?: string | null // 등록일
  graduation_date?: string | null // 졸업일
  status: StudentStatus          // 학생 상태
  memo?: string | null          // 메모
  
  // UI 관련
  display_color?: string | null  // 표시 색상
  position_in_class?: number | null // 클래스 내 위치
}
```

### 3.2 학생 상태 및 통계

```typescript
export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'withdrawn' | 'suspended'

export interface StudentStats {
  total_students: number
  active_students: number
  new_this_month: number
  retention_rate: number
  by_grade: Record<string, number>
  by_status: Record<StudentStatus, number>
}

export interface StudentWithDetails extends StudentV41 {
  class?: ClassV41
  instructor?: InstructorV41
  current_enrollment?: StudentEnrollmentV41
  attendance_stats?: {
    attendance_rate: number
    total_days: number
    present_count: number
  }
  payment_status?: {
    current_balance: number
    overdue_amount: number
    next_due_date?: string
  }
}
```

---

## 4. 클래스 관리 타입

### 4.1 클래스 기본 타입

```typescript
// 파일: src/types/database-v4.1.ts

export interface ClassV41 extends BaseEntity, WithTenant {
  name: string                   // 클래스 이름 (필수)
  description?: string | null    // 설명
  
  // v4.1 학년/과정별 세분화
  grade?: string | null         // 대상 학년
  course?: string | null        // 과정/과목
  
  max_students: number          // 최대 학생 수
  instructor_id?: string | null // 담당 강사 ID (user_profiles 참조)
  classroom?: string | null     // 교실
  color?: string | null        // 클래스 색상
  
  start_date?: string | null    // 시작일
  end_date?: string | null     // 종료일
  
  status: 'active' | 'inactive' | 'completed' | 'cancelled'
  order_index?: number | null   // 정렬 순서
  memo?: string | null         // 메모
}
```

### 4.2 클래스 통계 및 상세 정보

```typescript
export interface ClassStats {
  occupancy_rate: number        // 수용률
  total_revenue: number        // 총 수익
  average_attendance_rate: number // 평균 출석률
  student_retention_rate: number  // 학생 유지율
}

export interface ClassWithDetails extends ClassV41 {
  instructor?: UserProfileV41
  students?: StudentWithDetails[]
  course_packages?: CoursePackageV41[]
  stats?: ClassStats
  current_enrollment_count: number
}

// ClassFlow 전용 클래스 데이터
export interface ClassFlowData {
  id: string
  name: string
  capacity: number
  current_count: number
  color?: string
  instructor?: string
  students: StudentFlowData[]
}
```

---

## 5. 결제 및 수강권 타입

### 5.1 결제 관련 타입

```typescript
// 파일: src/types/database-v4.1.ts

export type PaymentStatus = 'pending' | 'completed' | 'overdue' | 'cancelled' | 'refunded'
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mobile'

export interface PaymentV41 extends BaseEntity, WithTenant {
  student_id: string            // 학생 ID
  enrollment_id?: string | null // 수강권 ID
  amount: number               // 결제 금액
  payment_method: PaymentMethod
  payment_date: string         // 결제 예정일
  actual_payment_date?: string | null // 실제 결제일
  due_date: string            // 납부 기한
  status: PaymentStatus
  receipt_number?: string | null // 영수증 번호
  memo?: string | null        // 메모
  
  // 분납 관련
  installment_count?: number | null // 총 분납 회차
  installment_number?: number | null // 현재 분납 회차
  parent_payment_id?: string | null // 원 결제 ID (분납인 경우)
}
```

### 5.2 수강권 및 코스 패키지

```typescript
export type BillingType = 'monthly' | 'sessions' | 'hours' | 'package' | 'drop_in'

export interface CoursePackageV41 extends BaseEntity, WithTenant {
  name: string                 // 패키지 이름
  description?: string | null  // 설명
  class_id?: string | null    // 대상 클래스 ID
  
  billing_type: BillingType   // 빌링 타입
  price: number              // 가격
  
  // 세션 기반
  total_sessions?: number | null
  session_duration?: number | null // 분
  
  // 시간 기반
  total_hours?: number | null
  
  // 기간 기반
  validity_period?: number | null // 일
  
  is_active: boolean
  display_order?: number | null
}

export interface StudentEnrollmentV41 extends BaseEntity, WithTenant {
  student_id: string
  course_package_id: string
  start_date: string
  end_date?: string | null
  
  // 사용 추적
  sessions_used: number
  hours_used: number
  remaining_sessions: number
  remaining_hours: number
  
  status: 'active' | 'expired' | 'cancelled' | 'completed'
  auto_renewal: boolean
  memo?: string | null
}
```

### 5.3 할인 및 정책

```typescript
export type DiscountType = 'sibling' | 'early_payment' | 'loyalty' | 'scholarship' | 'promotion' | 'volume'

export interface DiscountPolicyV41 extends BaseEntity, WithTenant {
  name: string
  description?: string | null
  discount_type: DiscountType
  
  // 할인 방식
  discount_rate?: number | null      // 할인율 (0-100)
  discount_amount?: number | null    // 고정 할인액
  
  // 적용 조건
  min_amount?: number | null         // 최소 금액
  max_discount?: number | null       // 최대 할인액
  
  valid_from: string
  valid_to?: string | null
  is_active: boolean
  
  // 사용 제한
  usage_limit?: number | null        // 총 사용 제한
  usage_count: number               // 현재 사용 횟수
  per_student_limit?: number | null  // 학생당 사용 제한
}
```

---

## 6. API 응답 타입

### 6.1 기본 API 응답 구조

```typescript
// 파일: src/types/api.ts

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  timestamp: string
}

export interface PaginatedResponse<T = Record<string, unknown>> {
  data: T[]
  total: number
  page: number
  limit: number
  has_more: boolean
  total_pages: number
}
```

### 6.2 특정 도메인 API 타입

```typescript
// 학생 API
export interface CreateStudentRequest {
  name: string
  student_number: string
  phone?: string
  email?: string
  parent_name?: string
  parent_phone_1?: string
  parent_phone_2?: string
  grade?: string
  class_id?: string
  enrollment_date?: string
  memo?: string
}

// 클래스 API
export interface CreateClassRequest {
  name: string
  description?: string
  grade?: string
  course?: string
  max_students: number
  instructor_id?: string
  classroom?: string
  color?: string
  start_date?: string
  end_date?: string
  memo?: string
}

// 결제 API
export interface CreatePaymentRequest {
  student_id: string
  enrollment_id?: string
  amount: number
  payment_method: PaymentMethod
  payment_date: string
  due_date: string
  installment_count?: number
  memo?: string
}
```

---

## 7. UI 컴포넌트 타입

### 7.1 기본 컴포넌트 Props

```typescript
// 파일: src/components/ui/types.ts

export interface BaseComponentProps {
  className?: string
  children?: ReactNode
  'data-testid'?: string
}

export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type ComponentVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost' | 'outline'
export type ComponentAlignment = 'left' | 'center' | 'right'
```

### 7.2 Table 컴포넌트 타입

```typescript
export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T | string
  header: string
  width?: number
  sortable?: boolean
  render?: (value: T[keyof T], row: T, index: number) => ReactNode
  cellClassName?: (value: T[keyof T], row: T) => string
  headerClassName?: string
  align?: ComponentAlignment
}

export interface TableProps<T = Record<string, unknown>> extends BaseComponentProps {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  emptyMessage?: string
  virtualized?: boolean
  height?: number
  rowHeight?: number
  selectable?: boolean
  selectedRows?: Set<number>
  onSelectionChange?: (selectedRows: Set<number>) => void
  onRowClick?: (row: T, index: number) => void
}
```

### 7.3 Form 컴포넌트 타입

```typescript
export interface FormFieldState {
  value?: string | number | boolean
  error?: string
  required?: boolean
  disabled?: boolean
  helperText?: string
  success?: boolean
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, keyof BaseComponentProps | 'size'>, BaseComponentProps {
  label?: string
  fieldState?: FormFieldState
  size?: ComponentSize
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  loading?: boolean
  wrapperClassName?: string
}
```

### 7.4 Modal 및 Dialog 타입

```typescript
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: ComponentSize | 'full'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  header?: ReactNode
  footer?: ReactNode
}
```

---

## 8. 유틸리티 타입

### 8.1 공통 유틸리티 타입

```typescript
// 파일: src/types/index.ts

// 날짜 관련
export type DateString = string      // YYYY-MM-DD 형식
export type DateTimeString = string  // ISO 8601 형식
export type TimeString = string      // HH:MM 형식

// 색상 관련
export type HexColor = string        // #RRGGBB 형식
export type StatusColor = 'success' | 'warning' | 'error' | 'info'

// 상태 타입
export type StatusType = 'active' | 'inactive' | 'pending' | 'suspended' | 'success' | 'warning' | 'error'

// 폼 관련
export type FormMode = 'create' | 'edit' | 'view'
```

### 8.2 파일 업로드 타입

```typescript
export interface FileUpload {
  file: File
  filename: string
  content_type: string
  size: number
}

export interface UploadedFile {
  id: string
  filename: string
  original_filename: string
  content_type: string
  size: number
  url: string
  uploaded_at: string
}
```

### 8.3 페이지네이션 타입

```typescript
export interface PaginationParams {
  page: number
  limit: number
  offset?: number
}

export interface PaginationResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}
```

---

## 9. 상수 및 Enum

### 9.1 상태 상수

```typescript
// 파일: src/types/index.ts

export const STATUS_COLORS: Record<string, StatusColor> = {
  active: 'success',
  waiting: 'warning', 
  inactive: 'info',
  graduated: 'info'
}

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100
export const DEFAULT_DEBOUNCE_DELAY = 300
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
```

### 9.2 학년 옵션

```typescript
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
  { value: '재수', label: '재수생' }
] as const
```

---

## 10. ClassFlow 전용 타입

### 10.1 ClassFlow 컴포넌트 타입

```typescript
// 파일: src/components/ui/types.ts

export interface StudentFlowData {
  id: string
  name: string
  email?: string
  phone?: string
  status: StatusType
  avatar?: string
  grade?: string
  enrollmentDate?: string
  classId?: string
}

export interface ClassFlowData {
  id: string
  name: string
  description?: string
  capacity: number
  currentCount: number
  color?: string
  instructor?: string
  schedule?: string
  room?: string
}

export interface ClassFlowContainerProps extends BaseComponentProps {
  classData: ClassFlowData
  students: StudentFlowData[]
  isDropTarget?: boolean
  isOver?: boolean
  variant?: 'grid' | 'list' | 'compact'
  onStudentClick?: (student: StudentFlowData) => void
  onContainerClick?: (classData: ClassFlowData) => void
}
```

### 10.2 드래그 앤 드롭 타입

```typescript
export interface DragDropProps {
  draggable?: boolean
  droppable?: boolean
  onDragStart?: (event: DragEvent) => void
  onDragEnd?: (event: DragEvent) => void
  onDrop?: (event: DragEvent) => void
  onDragOver?: (event: DragEvent) => void
}

// ClassFlow 전용 드래그 데이터
export interface StudentDragData {
  studentId: string
  sourceClassId: string
  dragIndex: number
}

export interface ClassDropData {
  targetClassId: string
  dropIndex: number
  position: 'before' | 'after' | 'inside'
}
```

---

## 📚 타입 사용 가이드라인

### 1. 타입 임포트 우선순위

```typescript
// 1순위: v4.1 enhanced types
import type { StudentV41, ClassV41, UserProfileV41 } from '@/types/database-v4.1'

// 2순위: Application types
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type { Tenant, TenantUser } from '@/types/app.types'

// 3순위: UI component types
import type { TableProps, ModalProps } from '@/types'

// 4순위: Utility types
import type { DateString, StatusColor } from '@/types'
```

### 2. 새로운 타입 추가 시 규칙

1. **데이터베이스 관련**: `database-v4.1.ts`에 추가
2. **API 관련**: `api.ts`에 추가
3. **UI 컴포넌트**: `components/ui/types.ts`에 추가
4. **공통 유틸리티**: `index.ts`에 추가

### 3. 네이밍 컨벤션

- **인터페이스**: `PascalCase` (예: `StudentV41`, `ApiResponse`)
- **타입**: `PascalCase` (예: `UserRole`, `PaymentStatus`)
- **Enum**: `UPPER_SNAKE_CASE` (예: `DEFAULT_PAGE_SIZE`)
- **Props**: `ComponentNameProps` (예: `TableProps`, `ModalProps`)

### 4. 타입 안전성 체크리스트

- [ ] `any` 타입 사용 금지
- [ ] `unknown` 또는 구체적 타입 사용
- [ ] 선택적 속성에 `| null` 명시
- [ ] Generic 타입에 기본값 설정
- [ ] 중복 타입 정의 방지

---

## 🔄 업데이트 히스토리

- **v4.1 (2025-08-12)**: any 타입 제거, 타입 안전성 강화
- **v4.1 (2025-08-11)**: 복수 학부모 연락처, 학생 이메일 지원
- **v4.0 (2025-08-10)**: 멀티테넌트 아키텍처 완성
- **v3.0 (2025-08-09)**: 고급 클래스 관리, 성적 시스템
- **v2.0 (2025-08-08)**: MVP 타입 시스템 구축

---

*이 문서는 프로젝트 진행에 따라 지속적으로 업데이트됩니다.*