# EduCanvas 회원가입 플로우 설계

## 🏢 전체 플로우 개요

### 1단계: 테넌트(학원) 생성 - EduCanvas 관리자
```
고객사 계약 → 테넊트 생성 → 관리자 계정 생성 → 고객번호 & 테넊트명 제공
```

### 2단계: 일반 사용자 회원가입 - 강사/스태프
```
회원가입 → 이메일 인증 → 온보딩(프로필 입력) → 테넊트 연결 → 승인 대기 → 활성화
```

---

## 🔧 구현 상세

### A. 테넌트 생성 프로세스

#### A-1. 고객사 정보 수집
- **학원명**: "ABC 영어학원"
- **대표자명**: "홍길동"
- **연락처**: "02-1234-5678"
- **주소**: "서울시 강남구..."
- **사업자등록번호**: "123-45-67890"

#### A-2. 테넌트 생성 (EduCanvas 관리자)
```sql
INSERT INTO tenants (
  name,           -- 'ABC 영어학원'
  slug,           -- 'abc-academy-123456' (자동생성)
  tenant_code,    -- '123456' (6자리 고객번호)
  contact_email,
  contact_phone,
  address,
  business_registration,
  subscription_tier,    -- 'basic', 'premium', 'enterprise'
  trial_ends_at,        -- 30일 무료체험
  is_active
) VALUES (...);
```

#### A-3. 원장/관리자 계정 생성 (EduCanvas에서 직접)
```sql
-- 1. Auth 사용자 생성 (Supabase Admin)
-- 2. user_profiles 생성
INSERT INTO user_profiles (
  id,           -- auth.users.id
  email,        -- 'admin@abc-academy.com'
  name,         -- '홍길동 원장'
  role,         -- 'admin'
  tenant_id,    -- 위에서 생성한 tenant.id
  status        -- 'active'
);
```

#### A-4. 고객에게 제공할 정보
```
🏫 학원 정보
- 학원명: ABC 영어학원
- 고객번호: 123456
- 관리자 이메일: admin@abc-academy.com
- 임시 비밀번호: TempPass2025!

📋 직원 가입 안내
- 가입 URL: https://educanvas.com/register
- 고객번호 입력: 123456
- 또는 학원명 입력: ABC 영어학원
```

---

### B. 일반 사용자 회원가입 프로세스

#### B-1. 기본 회원가입
```typescript
// 기존 회원가입 (테넌트 정보 없이)
signUp({
  email: 'teacher@gmail.com',
  password: 'password123',
  full_name: '김선생'
  // tenant_slug 제거 - 나중에 온보딩에서 처리
})
```

#### B-2. 이메일 인증
- 사용자가 이메일 인증 링크 클릭
- `/auth/callback` → `/onboarding` 페이지로 리다이렉트

#### B-3. 온보딩 프로세스 (/onboarding 페이지)
```typescript
interface OnboardingData {
  // 1단계: 기본 정보
  name: string
  phone: string
  position: string  // '강사', '스태프', '관리자'
  
  // 2단계: 소속 학원 찾기
  tenant_identifier: string  // 고객번호(123456) 또는 학원명(ABC 영어학원)
  tenant_search_type: 'code' | 'name'
  
  // 3단계: 추가 정보
  specialization?: string  // 전문분야 (강사인 경우)
  bio?: string
  emergency_contact?: string
}
```

#### B-4. 테넌트 검색 및 검증
```typescript
// 고객번호로 검색
async function findTenantByCode(code: string) {
  const { data } = await supabase
    .from('tenants')
    .select('id, name, slug, tenant_code')
    .eq('tenant_code', code)
    .eq('is_active', true)
    .single()
  
  return data
}

// 학원명으로 검색 (정확한 매칭)
async function findTenantByName(name: string) {
  const { data } = await supabase
    .from('tenants')
    .select('id, name, slug, tenant_code')
    .ilike('name', name)  // 대소문자 무시 검색
    .eq('is_active', true)
  
  return data  // 여러 결과 가능, 사용자가 선택
}
```

#### B-5. 테넌트 연결 및 승인 대기
```sql
-- user_profiles 업데이트
UPDATE user_profiles 
SET 
  tenant_id = '찾은_테넌트_ID',
  role = 'pending',  -- 승인 대기 상태
  status = 'pending_approval',
  onboarding_completed_at = NOW()
WHERE id = '사용자_ID';

-- tenant_join_requests 테이블에 승인 요청 생성
INSERT INTO tenant_join_requests (
  user_id,
  tenant_id,
  requested_role,  -- 'instructor', 'staff'
  message,         -- 사용자가 입력한 메시지
  status          -- 'pending'
);
```

#### B-6. 관리자 승인 프로세스
```typescript
// 테넌트 관리자가 승인/거부
async function approveUser(requestId: string, approved: boolean) {
  if (approved) {
    // 1. user_profiles 활성화
    await supabase
      .from('user_profiles')
      .update({ 
        role: 'instructor',  // 요청했던 역할
        status: 'active' 
      })
      .eq('id', userId)
    
    // 2. 승인 요청 상태 업데이트
    await supabase
      .from('tenant_join_requests')
      .update({ 
        status: 'approved',
        approved_by: adminUserId,
        approved_at: new Date()
      })
      .eq('id', requestId)
      
    // 3. 승인 완료 이메일 발송
    await sendApprovalEmail(userEmail)
  }
}
```

---

## 🗃️ 필요한 데이터베이스 변경사항

### 1. tenants 테이블에 tenant_code 컬럼 추가
```sql
ALTER TABLE tenants ADD COLUMN tenant_code VARCHAR(6) UNIQUE;
CREATE INDEX idx_tenants_tenant_code ON tenants(tenant_code);
```

### 2. tenant_join_requests 테이블 생성
```sql
CREATE TABLE tenant_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  tenant_id UUID REFERENCES tenants(id),
  requested_role TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. user_profiles 상태 값 확장
```sql
-- status 컬럼의 enum 값 확장
-- 'active', 'inactive', 'pending_approval', 'suspended'

-- role 컬럼의 enum 값 확장  
-- 'admin', 'instructor', 'staff', 'viewer', 'pending'
```

---

## 🎯 UI/UX 플로우

### 회원가입 페이지 (/register)
```
[기본 정보 입력]
- 이름
- 이메일  
- 비밀번호
- 비밀번호 확인

[회원가입 버튼] → 이메일 인증 안내
```

### 온보딩 페이지 (/onboarding)
```
Step 1: 기본 프로필
- 이름 (수정 가능)
- 전화번호
- 직책 선택 (강사/스태프/관리자)

Step 2: 소속 학원 찾기
○ 고객번호로 찾기: [______] (6자리)
○ 학원명으로 찾기: [________________]
[검색] → 결과 표시 → [이 학원이 맞습니다]

Step 3: 추가 정보
- 전문분야 (강사인 경우)
- 자기소개
- 비상연락처

[가입 신청] → 승인 대기 안내
```

### 승인 대기 페이지 (/pending-approval)
```
🕐 승인 대기 중입니다

ABC 영어학원에 가입 신청이 완료되었습니다.
관리자 승인 후 이용 가능합니다.

신청 정보:
- 이름: 김선생
- 직책: 강사
- 전문분야: 영어회화

📧 승인 완료 시 이메일로 알려드립니다.
```

---

## 🚀 구현 우선순위

### Phase 1: 기본 구조
1. ✅ tenant_code 컬럼 추가
2. ✅ tenant_join_requests 테이블 생성
3. ✅ 기존 회원가입 로직에서 tenant_slug 제거

### Phase 2: 온보딩 시스템
1. 온보딩 페이지 구현
2. 테넌트 검색 API
3. 승인 요청 시스템

### Phase 3: 관리자 기능
1. 가입 승인 관리 페이지
2. 이메일 알림 시스템
3. 사용자 역할 관리

이 구조가 어떠신가요? 실제 B2B SaaS 운영에 적합한 플로우로 설계했습니다.