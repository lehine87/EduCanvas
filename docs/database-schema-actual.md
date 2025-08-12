# EduCanvas 실제 데이터베이스 스키마

**분석 일시**: 2025-08-11  
**데이터베이스**: hodkqpmukwfrreozwmcy.supabase.co

## 📋 테이블 목록 및 현황

| 테이블명 | 존재여부 | 레코드 수 | 상태 |
|----------|----------|-----------|------|
| **user_profiles** | ✅ | 0 | 빈 테이블 |
| **users** | ✅ | 0 | 빈 테이블 |
| **tenants** | ✅ | 4 | 활성 |
| **students** | ✅ | 27 | 활성 |
| **classes** | ✅ | 16 | 활성 |
| **instructors** | ✅ | 8 | 활성 |
| **attendances** | ✅ | 0 | 빈 테이블 |
| **payments** | ✅ | 0 | 빈 테이블 |
| **enrollments** | ✅ | 0 | 빈 테이블 |

## 🔍 user_profiles 테이블 (중요!)

### 실제 스키마 구조

**분석 결과**: 오류 메시지로부터 추론한 실제 컬럼 구조

```sql
-- NOT NULL 제약조건이 있는 필수 컬럼들
id              UUID PRIMARY KEY NOT NULL
email           TEXT NOT NULL
name            TEXT NOT NULL

-- 기본값이 있는 컬럼들 (Failing row details에서 확인)
language        TEXT DEFAULT 'ko'
timezone        TEXT DEFAULT 'Asia/Seoul' 
status          TEXT DEFAULT 'active'
is_premium      BOOLEAN DEFAULT false
is_admin        BOOLEAN DEFAULT false
-- null 컬럼 (아마 선택적)
? (unknown)     
points          INTEGER DEFAULT 0
created_at      TIMESTAMP WITH TIME ZONE
updated_at      TIMESTAMP WITH TIME ZONE
```

### 존재하지 않는 컬럼들

❌ `tenant_id` - 컬럼이 존재하지 않음  
❌ `full_name` - 컬럼이 존재하지 않음  
❌ `role` - 확인되지 않음  
❌ `avatar_url` - 확인되지 않음

## 🏢 tenants 테이블

### 실제 컬럼 구조 (27개 컬럼)

```typescript
interface Tenant {
  id: string
  name: string
  slug: string
  domain?: string
  contact_email?: string
  contact_phone?: string
  address?: string
  business_registration?: string
  settings?: object
  features?: object
  limits?: object
  subscription_tier?: string
  subscription_status?: string
  trial_ends_at?: string
  billing_email?: string
  is_active: boolean
  created_at: string
  updated_at: string
}
```

### 기존 테넌트 데이터

1. `11111111-1111-1111-1111-111111111111` - EduCanvas 데모 학원
2. `22017dda-0caa-4916-bd81-fb90ba7ce5fd` - XYZ 교육센터
3. `649e8bef-7b53-4d16-8034-59d6cb4422f8` - 스마트 아카데미

## 👥 Auth Users (Supabase Auth)

### 등록된 사용자 (3명)

1. **admin@test.com**
   - ID: `324551eb-f43d-4ddc-8fa6-9009a4a0814e`
   - 이메일 인증: ✅

2. **instructor@test.com**
   - ID: `f089e4d5-c4f5-4389-8814-42fd4fe5a607`
   - 이메일 인증: ✅

3. **staff@test.com**
   - ID: `4f9e2a28-3034-4dda-9f05-f4cfd066e9a9`
   - 이메일 인증: ✅

## 📊 students 테이블 (24개 컬럼)

```typescript
interface Student {
  id: string
  tenant_id: string
  student_number: string
  name: string
  name_english?: string
  birth_date?: string
  gender?: string
  phone?: string
  email?: string
  address?: string
  school_name?: string
  grade_level?: string
  status: string
  notes?: string
  emergency_contact?: string
  custom_fields?: object
  tags?: string[]
  created_by: string
  created_at: string
  updated_at: string
  parent_name?: string
  parent_phone_1?: string
  parent_phone_2?: string
  enrollment_date: string
}
```

## 🎓 classes 테이블 (20개 컬럼)

```typescript
interface Class {
  id: string
  tenant_id: string
  name: string
  description?: string
  subject?: string
  level?: string
  color?: string
  max_students?: number
  min_students?: number
  instructor_id?: string
  classroom_id?: string
  is_active: boolean
  start_date?: string
  end_date?: string
  schedule_config?: object
  custom_fields?: object
  created_by: string
  created_at: string
  updated_at: string
  course?: string
  grade?: string
}
```

## 👨‍🏫 instructors 테이블 (14개 컬럼)

```typescript
interface Instructor {
  id: string
  tenant_id: string
  user_id?: string
  name: string
  phone?: string
  email?: string
  specialization?: string
  qualification?: string
  bank_account?: string
  status: string
  hire_date: string
  memo?: string
  created_at: string
  updated_at: string
}
```

## 🚨 중요한 발견사항

### 1. user_profiles 테이블 스키마 불일치
- 기존 TypeScript 정의와 실제 데이터베이스가 다름
- `tenant_id`, `full_name` 컬럼이 존재하지 않음
- `email`, `name` 컬럼이 NOT NULL 제약조건

### 2. Auth 연동 문제
- Supabase Auth에는 사용자가 있지만 user_profiles 테이블은 비어있음
- 프로필 자동 생성 로직이 필요

### 3. 멀티테넌트 구조
- tenants 테이블 존재
- students, classes, instructors 모두 tenant_id로 격리
- user_profiles에는 tenant_id가 없음 (설계 이슈?)

## 🔧 해결해야 할 문제

1. **user_profiles 스키마 정의 수정**
2. **AuthClient의 getUserProfile 함수 수정**
3. **사용자 프로필 자동 생성 로직 구현**
4. **TypeScript 타입 정의 업데이트**

---

**다음 단계**: 실제 스키마에 맞춰 코드 수정 및 테스트