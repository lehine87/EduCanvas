# instructors 테이블 제거 및 통합 직원 관리 시스템 구축 계획

**작성일**: 2025-08-21  
**예상 소요시간**: 8시간  
**우선순위**: High  
**담당자**: Development Team  

## 📋 프로젝트 개요

**목표**: instructors 테이블을 완전히 제거하고 tenant_memberships 기반의 통합 직원 관리 시스템 구축

**핵심 철학**:
- **이원화 Role 시스템**: 직능(instructor/general) + 직급(원장/부원장/팀장...)
- **한글 직급명 완전 지원**: "원장", "실장", "주임" 등 한글 직급명 사용
- **main 영역 권한 확장**: tenant-admin이 아닌 main에서 권한 있는 직원이 관리
- **기존 API 통합**: 별도 staff API 없이 기존 구조 활용

## 🗂️ 데이터베이스 구조 변경

### 1단계: tenant_memberships 테이블 확장
```sql
-- 직능 구분 컬럼 추가
ALTER TABLE tenant_memberships ADD COLUMN job_function VARCHAR(20) DEFAULT 'general';
-- ENUM: 'general' | 'instructor'

-- instructors 테이블 핵심 정보 흡수
ALTER TABLE tenant_memberships ADD COLUMN hire_date DATE;
ALTER TABLE tenant_memberships ADD COLUMN specialization VARCHAR(200);
ALTER TABLE tenant_memberships ADD COLUMN bio TEXT;
ALTER TABLE tenant_memberships ADD COLUMN emergency_contact VARCHAR(100);
ALTER TABLE tenant_memberships ADD COLUMN bank_account VARCHAR(100);
ALTER TABLE tenant_memberships ADD COLUMN qualification VARCHAR(200);
```

### 2단계: tenant_roles 기본 데이터 설정
```sql
-- 각 테넌트별 기본 직급 생성 (한글 직급명 지원)
INSERT INTO tenant_roles (tenant_id, name, display_name, hierarchy_level, is_system_role) VALUES
(tenant_id, '원장', '원장', 10, true),
(tenant_id, '부원장', '부원장', 9, true),
(tenant_id, '팀장', '팀장', 7, true),
(tenant_id, '팀원', '팀원', 1, true);

-- 각 학원이 추가 가능한 커스텀 직급 예시
INSERT INTO tenant_roles (tenant_id, name, display_name, hierarchy_level, is_system_role) VALUES
(tenant_id, '실장', '실장', 8, false),
(tenant_id, '주임', '주임', 5, false),
(tenant_id, '대리', '대리', 3, false);
```

### 3단계: 데이터 마이그레이션
```sql
-- instructors → tenant_memberships 데이터 이전
UPDATE tenant_memberships SET
  job_function = 'instructor',
  hire_date = i.hire_date,
  specialization = i.specialization,
  bio = i.bio,
  emergency_contact = i.emergency_contact,
  bank_account = i.bank_account,
  qualification = i.qualification
FROM instructors i
WHERE tenant_memberships.user_id = i.user_id;
```

## 📁 API 구조 변경

### 삭제 대상
- ❌ `/api/instructors/route.ts`
- ❌ `/api/instructors/[id]/route.ts`

### 수정 대상 (instructors 참조 제거)
1. **`/api/classes/route.ts`** - 최우선 수정
   ```typescript
   // 기존: instructors 테이블 검증
   const instructor = await supabase.from('instructors').select()
   
   // 변경: tenant_memberships 기반 검증
   const instructor = await supabase
     .from('tenant_memberships')
     .select('*, user_profiles(*), tenant_roles(*)')
     .eq('user_id', instructor_id)
     .eq('tenant_id', tenantId)
     .eq('job_function', 'instructor')
     .eq('status', 'active')
   ```

2. **기타 8개 API 파일**:
   - `/api/salary-policies/route.ts`
   - `/api/salary-policies/[id]/route.ts`
   - `/api/enrollments/[id]/route.ts`
   - `/api/auth/onboarding/route.ts`
   - `/api/classes/[id]/route.ts`
   - `/api/classes-test/route.ts`
   - `/api/tenant-admin/members/route.ts`

### 확장 대상
- **`/api/tenant-admin/members/route.ts`**: job_function 필터링 지원
  ```typescript
  // 강사만 조회: ?job_function=instructor
  // 행정직원만 조회: ?job_function=general
  // 특정 직급: ?role_name=원장
  ```

## 🎨 프론트엔드 구조 변경

### 1. 사이드바 권한 확장
```typescript
// MainSidebar.tsx 수정
{
  name: '직원 관리', // 기존 '강사 관리'에서 변경
  href: '/main/staff',
  icon: Users,
  description: '직원 정보 관리 (강사 + 행정직원)',
  allowedRoles: ['원장', '부원장', '팀장', 'principal', 'vice_principal', 'team_leader']
}
```

### 2. 페이지 구조 변경
```
/main/instructors → /main/staff
├── page.tsx          # 통합 직원 목록 (직능별 필터링)
├── [id]/
│   ├── page.tsx       # 직원 상세
│   └── edit/
│       └── page.tsx   # 직원 수정
└── new/
    └── page.tsx       # 신규 직원 등록
```

### 3. UI 컴포넌트 개선
```typescript
// 직능 + 직급 뱃지 시스템
<div className="flex gap-2">
  <Badge variant={member.job_function === 'instructor' ? 'default' : 'secondary'}>
    {member.job_function === 'instructor' ? '강사' : '행정'}
  </Badge>
  <Badge variant="outline">
    {member.tenant_roles?.[0]?.display_name || '팀원'}
  </Badge>
</div>

// 직능별 필터 탭
<Tabs value={filter} onValueChange={setFilter}>
  <TabsList>
    <TabsTrigger value="all">전체 직원</TabsTrigger>
    <TabsTrigger value="instructor">강사</TabsTrigger>
    <TabsTrigger value="general">행정직원</TabsTrigger>
  </TabsList>
</Tabs>
```

## 🔐 권한 시스템 설계

### 계층적 권한 체계
```typescript
// hierarchy_level 기반 권한 관리
const canManageStaff = (userLevel: number, targetLevel: number) => {
  return userLevel >= targetLevel + 2 // 2단계 이상 차이
}

// 직급별 hierarchy_level
원장(10) → 모든 직원 관리
부원장(9) → 팀장(7) 이하 관리  
팀장(7) → 팀원(1~5) 관리
```

### 권한 기반 UI 제어
```typescript
// 한글/영어 직급명 혼용 지원
const managementRoles = [
  '원장', '부원장', '팀장', '실장',     // 한글
  'principal', 'vice_principal'        // 영어
]

const canManage = userRoles.some(role => 
  managementRoles.includes(role.name)
)
```

## 🚀 단계별 실행 계획

### Phase 1: 데이터베이스 준비 (1시간)
1. tenant_memberships 컬럼 추가
2. 기본 tenant_roles 데이터 삽입
3. instructors → tenant_memberships 데이터 마이그레이션

### Phase 2: 핵심 API 수정 (1.5시간)
1. `/api/classes/route.ts` 강사 검증 로직 변경 (최우선)
2. `/api/tenant-admin/members/route.ts` job_function 필터링 추가

### Phase 3: 나머지 API 순차 수정 (2시간)
1. instructors 참조하는 8개 API 파일 수정
2. 테스트 및 검증

### Phase 4: 프론트엔드 적용 (2.5시간)
1. `/main/instructors` → `/main/staff` 이름 변경
2. 통합 직원 관리 UI 구현
3. 사이드바 권한 체계 확장
4. 직능별 필터링 및 한글 직급 표시

### Phase 5: 정리 및 검증 (1시간)
1. instructors 테이블 및 API 완전 삭제
2. 타입 정의 재생성 (`npx supabase gen types typescript`)
3. 전체 기능 테스트

## 🎉 최종 장점

1. **통합 관리**: 강사 + 행정직원 하나의 시스템에서 관리
2. **권한 확장**: 부원장, 팀장도 직원 관리 가능 (기존: admin만)
3. **한글 지원**: "원장", "실장", "주임" 등 직관적인 한글 직급명
4. **유연성**: 각 테넌트가 필요한 직급 자유롭게 추가
5. **확장성**: 새로운 직급 추가 시 코드 수정 불필요
6. **일관성**: 모든 직원이 동일한 권한 체계로 관리

## 🔍 한글 직급명 처리 세부사항

### tenant_roles 테이블 구조 활용
```sql
tenant_roles {
  name: string,         -- 시스템 내부용: "원장", "실장", "주임" (한글 가능)
  display_name: string, -- 사용자 표시용: "원장", "실장", "주임" (한글)
  hierarchy_level: int  -- 권한 레벨: 10, 8, 5 등
}
```

### 한글 직급명 권한 체크
```typescript
// 한글 직급명으로 권한 체크 가능
const hasManagementPermission = userRoles.some(role => 
  ['원장', '부원장', '팀장', '실장'].includes(role.name)
)

// UI에서 한글 직급명 표시
<Badge>{role.display_name}</Badge> // "원장", "실장" 등
```

## ⚠️ 주의사항

1. **데이터 백업**: instructors 테이블 삭제 전 완전 백업 필수
2. **점진적 변경**: API → 프론트엔드 순서로 단계적 진행
3. **권한 검증**: API에서 철저한 권한 체크 (hierarchy_level 활용)
4. **타입 안전성**: TypeScript strict mode 유지
5. **FK 관계 유지**: classes.instructor_id → user_profiles.id 관계 그대로 유지
6. **UTF-8 지원**: PostgreSQL에서 한글 직급명 완전 지원 확인됨

## 📋 체크리스트

### 데이터베이스
- [ ] tenant_memberships 테이블 확장
- [ ] 기본 tenant_roles 데이터 삽입
- [ ] instructors 데이터 마이그레이션
- [ ] instructors 테이블 삭제

### API
- [ ] `/api/classes/route.ts` 수정
- [ ] `/api/tenant-admin/members/route.ts` 확장
- [ ] 8개 API 파일 instructors 참조 제거
- [ ] `/api/instructors/` 폴더 삭제

### 프론트엔드
- [ ] `/main/instructors` → `/main/staff` 변경
- [ ] 사이드바 권한 확장
- [ ] 통합 직원 관리 UI 구현
- [ ] 한글 직급명 표시 시스템

### 검증
- [ ] 타입 정의 재생성
- [ ] 전체 기능 테스트
- [ ] 권한 체계 검증
- [ ] 한글 직급명 동작 확인

## ⏰ 총 예상 시간: 8시간

**완료 후**: instructors 테이블 없이도 더 유연하고 확장 가능한 직원 관리 시스템 완성!

---

**Status**: 계획 수립 완료  
**Next Action**: Phase 1 데이터베이스 준비부터 시작