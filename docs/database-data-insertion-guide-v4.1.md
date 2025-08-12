# EduCanvas Database Data Insertion Guide v4.1

**작성일**: 2025-08-11  
**기준**: 실제 Supabase 데이터베이스 구조 분석 결과  
**목적**: 데이터 추가 시 발생하는 오류를 방지하기 위한 정확한 가이드  

---

## 🚨 CRITICAL: 실제 DB 구조와 문서 차이점

### 발견된 주요 차이점들

#### 1. **User-first Architecture 이해** ✅
```typescript
// EduCanvas의 User-first Architecture
user_profiles (모든 사용자 기본 정보)
    ↓
instructors (강사 추가 정보) - user_id로 user_profiles와 연결
    ↓
classes.instructor_id → user_profiles.id (사용자 계정과 직접 연결)
```
**설계 의도**: 
- 모든 강사는 먼저 사용자 계정(`user_profiles`)을 가짐
- 강사 추가 정보는 `instructors` 테이블에 저장 
- 클래스는 사용자 계정과 직접 연결되어 권한 관리 용이

**결과**: `classes.instructor_id`는 `user_profiles.id`를 참조하는 것이 올바른 설계

#### 2. **Students 테이블 필수 필드**
```typescript
// 실제 DB 구조
students: {
  name: string,                    // NOT NULL
  student_number: string,          // NOT NULL ⚠️ 중요!
  parent_phone_1?: string | null,  // NULLABLE (우리가 추가한 컬럼)
  parent_phone_2?: string | null,  // NULLABLE (우리가 추가한 컬럼)
  grade_level?: string | null,     // NULLABLE (기존 컬럼)
  // ...
}
```
**결과**: `student_number` 없이 INSERT 시 오류 발생

#### 3. **Classes 테이블 컬럼명 오타**
```typescript
// 실제 DB 구조
classes: {
  cource?: string | null,  // ❌ 오타: "course"여야 함
  grade?: string | null,   // ✅ 우리가 추가한 컬럼
  // ...
}
```

---

## 🔐 RLS 정책 및 권한 체계

### RLS 정책으로 인한 제약사항
1. **클라이언트 직접 INSERT 차단**: 모든 주요 테이블에 RLS 적용
2. **Service Role 필요**: 데이터 추가는 반드시 Service Role로 실행
3. **테넌트 격리**: 모든 데이터는 `tenant_id`로 격리됨

### 권한 레벨별 접근 가능성
- **Anonymous**: 읽기 불가능
- **Authenticated User**: 소속 테넌트 데이터만 읽기 가능
- **Service Role**: 모든 데이터 읽기/쓰기 가능
- **Developer Mode** (`admin@test.com`): 개발용 전체 접근

---

## 📊 핵심 테이블별 데이터 추가 요구사항

### 1. Tenants 테이블
```sql
-- ✅ 올바른 INSERT
INSERT INTO tenants (name, slug, is_active) 
VALUES ('테스트학원', 'test-academy', true);
```

**필수 필드**:
- `name`: VARCHAR NOT NULL
- `slug`: VARCHAR NOT NULL UNIQUE

**선택 필드**:
- 나머지 모든 컬럼은 DEFAULT 또는 NULLABLE

### 2. Students 테이블
```sql
-- ✅ 올바른 INSERT (v4.1 기준)
INSERT INTO students (
  tenant_id,
  name,
  student_number,        -- ⚠️ 필수!
  parent_name,           -- v4.1 추가
  parent_phone_1,        -- v4.1 추가
  parent_phone_2,        -- v4.1 추가
  email,                 -- v4.1 추가
  grade_level,           -- 기존 필드
  status
) VALUES (
  '테넌트UUID',
  '학생이름',
  'STU001',             -- ⚠️ 고유한 학생번호 필수
  '학부모이름',
  '010-1234-5678',
  '010-9876-5432',
  'student@example.com',
  '중1',
  'active'
);
```

**필수 필드**:
- `name`: VARCHAR NOT NULL
- `student_number`: VARCHAR NOT NULL (고유 학생 번호)

**FK 제약조건**:
- `tenant_id`: tenants.id 참조
- `created_by`: user_profiles.id 참조 (NULLABLE)

**ENUM 제약조건**:
- `status`: 'active' | 'inactive' | 'graduated' | 'withdrawn' | 'suspended'

### 3. Classes 테이블
```sql
-- ✅ 올바른 INSERT (v4.1 기준)
INSERT INTO classes (
  tenant_id,
  name,
  instructor_id,         -- ⚠️ user_profiles.id 참조!
  grade,                 -- v4.1 추가
  cource,                -- ⚠️ 오타: course가 아님
  subject,
  is_active
) VALUES (
  '테넌트UUID',
  '클래스이름',
  'user_profiles의UUID',  -- ⚠️ instructors.id가 아님!
  '중1',
  '기초반',
  '수학',
  true
);
```

**필수 필드**:
- `name`: VARCHAR NOT NULL

**FK 제약조건**:
- `tenant_id`: tenants.id 참조
- `instructor_id`: **user_profiles.id** 참조 (NOT instructors!)
- `created_by`: user_profiles.id 참조 (NULLABLE)

### 4. Instructors 테이블
```sql
-- ✅ 올바른 INSERT
INSERT INTO instructors (
  tenant_id,
  name,
  user_id,               -- user_profiles와 연결
  email,
  phone,
  specialization,
  status
) VALUES (
  '테넌트UUID',
  '강사이름',
  'user_profiles의UUID',   -- 인증 계정과 연결
  'instructor@example.com',
  '010-1111-2222',
  '수학',
  'active'
);
```

**필수 필드**:
- `name`: VARCHAR NOT NULL

**FK 제약조건**:
- `tenant_id`: tenants.id 참조
- `user_id`: user_profiles.id 참조 (인증 계정과 연결)

---

## ⚠️ 데이터 추가 시 발생 가능한 모든 오류 케이스

### 1. RLS 정책 위반 오류
```
ERROR: new row violates row-level security policy for table "students"
```
**원인**: 클라이언트에서 직접 INSERT 시도  
**해결**: Service Role로 실행 또는 적절한 RLS 정책 통과

### 2. NOT NULL 제약 위반
```
ERROR: null value in column "student_number" violates not-null constraint
```
**원인**: 필수 필드 누락  
**해결**: 모든 NOT NULL 컬럼에 값 제공

### 3. Foreign Key 제약 위반
```
ERROR: insert or update on table "classes" violates foreign key constraint "classes_instructor_id_fkey"
```
**원인**: 존재하지 않는 FK 참조  
**해결**: 참조되는 레코드 먼저 생성

### 4. ENUM 제약 위반
```
ERROR: invalid input value for enum student_status: "enabled"
```
**원인**: 정의되지 않은 ENUM 값 사용  
**해결**: 허용된 ENUM 값만 사용

### 5. UNIQUE 제약 위반
```
ERROR: duplicate key value violates unique constraint "tenants_slug_key"
```
**원인**: 중복 값 입력  
**해결**: 고유한 값 사용

### 6. 테넌트 격리 위반
```
ERROR: permission denied for relation "students"
```
**원인**: 다른 테넌트 데이터 접근 시도  
**해결**: 소속 테넌트 데이터만 접근

---

## ✅ 올바른 데이터 추가 전략

### Phase 1: 기반 데이터 생성 (Service Role 필요)

#### ⚠️ CRITICAL: user_profiles FK 제약조건
```sql
-- user_profiles.id는 auth.users.id를 참조하는 숨겨진 FK 제약조건 존재!
-- 따라서 임의로 user_profiles를 생성할 수 없음

-- 해결 방법 1: 기존 user_profiles 활용 (권장)
SELECT id, name, email FROM user_profiles LIMIT 10;

-- 해결 방법 2: 실제 인증 시스템을 통해 사용자 생성
-- (Supabase Auth를 통해 실제 계정 생성 후 user_profiles 자동 생성)
```

#### 기반 데이터 생성 과정
```sql
-- 1. 테넌트 생성
INSERT INTO tenants (name, slug, is_active) 
VALUES ('테스트학원', 'test-academy', true)
RETURNING id;

-- 2. 기존 user_profiles 확인 및 활용
-- ❌ 불가능: 직접 user_profiles INSERT (FK 제약조건)
-- ✅ 가능: 기존 user_profiles.id 재사용
```

### Phase 2: 관계형 데이터 생성
```sql
-- 3. 강사 정보 생성 (user_profile과 연결)
INSERT INTO instructors (
  tenant_id, 
  name, 
  user_id,           -- user_profiles.id와 연결
  email, 
  specialization,
  status
) VALUES (
  '테넌트UUID',
  '김수학강사',
  'user_profiles의UUID',
  'math.kim@test-academy.com',
  '수학',
  'active'
);

-- 4. 클래스 생성 (instructor_id는 user_profiles.id!)
INSERT INTO classes (
  tenant_id,
  name,
  instructor_id,     -- ⚠️ user_profiles.id 사용!
  grade,
  cource,            -- ⚠️ 오타 주의
  subject,
  is_active
) VALUES (
  '테넌트UUID',
  '수학기초반',
  'user_profiles의UUID',  -- NOT instructors.id!
  '중1',
  '기초반',
  '수학',
  true
);

-- 5. 학생 생성
INSERT INTO students (
  tenant_id,
  name,
  student_number,    -- ⚠️ 필수!
  parent_name,
  parent_phone_1,
  email,
  grade_level,
  status
) VALUES (
  '테넌트UUID',
  '김민수',
  'STU001',          -- ⚠️ 고유번호 필수
  '김학부모',
  '010-1234-5678',
  'student@example.com',
  '중1',
  'active'
);
```

### Phase 3: 실행 방법

#### Option 1: Supabase SQL Editor (권장)
```sql
-- Service Role로 자동 실행됨
-- 위의 SQL 직접 복사-붙여넣기
```

#### Option 2: Application에서 Service Role 사용
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // ⚠️ Server-side only!
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// 이제 RLS 우회하여 INSERT 가능
const { data, error } = await supabaseAdmin
  .from('students')
  .insert({
    tenant_id: 'xxx',
    name: '학생이름',
    student_number: 'STU001', // ⚠️ 필수
    // ...
  })
```

---

## 🎯 검증된 샘플 데이터 생성 SQL

```sql
-- v4.1 실제 DB 구조에 맞춘 완전한 샘플 데이터
-- Supabase SQL Editor에서 Service Role로 실행

-- 1단계: 각 테넌트별로 user_profiles 먼저 생성
DO $$
DECLARE
    tenant_record RECORD;
    user_profile_1_id UUID;
    user_profile_2_id UUID;
BEGIN
    FOR tenant_record IN (SELECT id, name, slug FROM tenants WHERE is_active = true) LOOP
        -- 강사용 user_profiles 생성
        INSERT INTO user_profiles (id, name, email, status) 
        VALUES (
            gen_random_uuid(),
            '김수학_' || tenant_record.name,
            'math.kim@' || tenant_record.slug || '.test.com',
            'active'
        ) RETURNING id INTO user_profile_1_id;

        INSERT INTO user_profiles (id, name, email, status) 
        VALUES (
            gen_random_uuid(),
            '이영어_' || tenant_record.name,
            'eng.lee@' || tenant_record.slug || '.test.com',
            'active'
        ) RETURNING id INTO user_profile_2_id;

        -- 강사 테이블 생성
        INSERT INTO instructors (
            tenant_id, name, user_id, email, specialization, status
        ) VALUES 
        (tenant_record.id, '김수학_' || tenant_record.name, user_profile_1_id, 'math.kim@' || tenant_record.slug || '.test.com', '수학', 'active'),
        (tenant_record.id, '이영어_' || tenant_record.name, user_profile_2_id, 'eng.lee@' || tenant_record.slug || '.test.com', '영어', 'active');

        -- 클래스 생성 (instructor_id는 user_profiles.id!)
        INSERT INTO classes (
            tenant_id, name, instructor_id, grade, cource, subject, is_active
        ) VALUES 
        (tenant_record.id, '수학기초반_' || tenant_record.name, user_profile_1_id, '중1', '기초반', '수학', true),
        (tenant_record.id, '영어회화반_' || tenant_record.name, user_profile_2_id, '중2', '회화반', '영어', true);

        -- 학생 생성 (student_number 필수!)
        INSERT INTO students (
            tenant_id, name, student_number, parent_name, parent_phone_1, email, grade_level, status
        ) VALUES 
        (tenant_record.id, '김민수_' || tenant_record.name, 'STU001_' || tenant_record.slug, '김학부모', '010-1001-' || LPAD((ROW_NUMBER() OVER())::text, 4, '0'), 'student1@' || tenant_record.slug || '.test.com', '중1', 'active'),
        (tenant_record.id, '이지은_' || tenant_record.name, 'STU002_' || tenant_record.slug, '이학부모', '010-1002-' || LPAD((ROW_NUMBER() OVER())::text, 4, '0'), 'student2@' || tenant_record.slug || '.test.com', '중1', 'active'),
        (tenant_record.id, '박준호_' || tenant_record.name, 'STU003_' || tenant_record.slug, '박학부모', '010-1003-' || LPAD((ROW_NUMBER() OVER())::text, 4, '0'), 'student3@' || tenant_record.slug || '.test.com', '중1', 'active'),
        (tenant_record.id, '최서연_' || tenant_record.name, 'STU004_' || tenant_record.slug, '최학부모', '010-1004-' || LPAD((ROW_NUMBER() OVER())::text, 4, '0'), 'student4@' || tenant_record.slug || '.test.com', '중2', 'active'),
        (tenant_record.id, '정다현_' || tenant_record.name, 'STU005_' || tenant_record.slug, '정학부모', '010-1005-' || LPAD((ROW_NUMBER() OVER())::text, 4, '0'), 'student5@' || tenant_record.slug || '.test.com', '중2', 'active');

        RAISE NOTICE 'Tenant % 완료: 강사 2명, 클래스 2개, 학생 5명 생성', tenant_record.name;
    END LOOP;
    
    RAISE NOTICE '✅ 모든 테넌트 샘플 데이터 생성 완료';
END $$;

-- 결과 검증
SELECT 
    t.name as tenant_name,
    COUNT(DISTINCT s.id) as students,
    COUNT(DISTINCT c.id) as classes,
    COUNT(DISTINCT i.id) as instructors,
    COUNT(DISTINCT up.id) as user_profiles
FROM tenants t
LEFT JOIN students s ON t.id = s.tenant_id AND s.status = 'active'
LEFT JOIN classes c ON t.id = c.tenant_id AND c.is_active = true
LEFT JOIN instructors i ON t.id = i.tenant_id AND i.status = 'active'
LEFT JOIN user_profiles up ON up.email LIKE '%@' || t.slug || '.test.com'
WHERE t.is_active = true
GROUP BY t.id, t.name
ORDER BY t.name;
```

---

## 📚 요약 및 핵심 포인트

### ✅ 성공 요소
1. **Service Role 사용**: RLS 우회 위해 필수
2. **모든 필수 필드 제공**: 특히 `student_number`
3. **올바른 FK 관계**: `classes.instructor_id → user_profiles.id`
4. **정확한 ENUM 값**: 허용된 값만 사용
5. **테넌트별 격리 준수**: 모든 데이터에 `tenant_id` 설정

### ❌ 실패 요소
1. 클라이언트에서 직접 INSERT 시도
2. 필수 필드 누락 (특히 `student_number`)
3. 잘못된 FK 참조
4. 정의되지 않은 ENUM 값 사용
5. 테넌트 격리 위반

### 🔧 권장 사항
1. **문서와 실제 DB 동기화**: 주기적인 스키마 검증 필요
2. **타입 안전성**: TypeScript 타입 정의 활용
3. **트랜잭션 사용**: 관련 데이터 일괄 생성 시
4. **오류 처리**: 각 단계별 오류 케이스 대응
5. **테스트 데이터 관리**: 일관된 명명 규칙과 고유성 보장

이 가이드를 따르면 데이터 추가 시 오류 없이 안정적으로 실행할 수 있습니다.