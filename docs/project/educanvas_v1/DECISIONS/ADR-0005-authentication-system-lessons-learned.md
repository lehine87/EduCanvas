# ADR-0005: 인증 시스템 개발 교훈 및 개발 가이드

**날짜**: 2025-08-12  
**상태**: Accepted  
**결정자**: Development Team  
**태그**: authentication, lessons-learned, development-guide

## 배경 (Context)

EduCanvas 인증 시스템(로그인, 회원가입, 온보딩, 승인 처리)을 베타 수준까지 완성하면서 얻은 중요한 교훈들과 향후 개발에서 준수해야 할 가이드라인을 정리합니다.

## 주요 교훈 (Key Lessons Learned)

### 1. 🔒 **"Reality-First" Database Development**

#### 문제 상황
- **T-005 깨달음**: 문서와 실제 DB 스키마의 심각한 괴리로 6시간 소요 (예상: 1시간)
- `user_profiles.custom_fields` 컬럼이 문서에는 있지만 실제 DB에는 없어서 500 오류 발생
- JWT 토큰 형식 불일치로 인한 인증 실패

#### 핵심 원칙
```bash
# ❌ 잘못된 접근: 문서 기반 개발
"문서에서 schema를 확인하고 개발" → 실제 DB와 불일치

# ✅ 올바른 접근: Reality-First
npx supabase gen types typescript  # 실제 DB 구조 확인 후 개발
```

#### 필수 개발 순서
1. `npx supabase gen types typescript` - 실제 스키마 확인
2. 주요 테이블의 Row/Insert 타입 분석 - 필수 필드 파악  
3. Relationships 섹션에서 FK 관계 완전 파악
4. ENUM 제약조건 및 허용값 확인
5. 소량 테스트 데이터로 검증 후 본격 진행

### 2. 🚫 **클라이언트에서 직접 DB 접근 금지**

#### 문제 상황
- `PendingApprovalsTable`에서 클라이언트에서 직접 `supabase.from('user_profiles').update()` 호출
- RLS(Row Level Security) 정책으로 인한 권한 오류 발생
- 보안 취약점: 클라이언트에서 중요한 비즈니스 로직 실행

#### **철칙: API-First Architecture**
```typescript
// ❌ 금지: 클라이언트에서 직접 DB 접근
const { error } = await supabase
  .from('user_profiles')
  .update({ status: 'active' })
  .eq('id', userId)

// ✅ 필수: API Route 사용
const response = await fetch('/api/tenant-admin/approve-member', {
  method: 'POST',
  body: JSON.stringify({ userId, action: 'approve', tenantId })
})
```

#### API Route 보안 패턴
```typescript
// 1. 인증 확인
const { data: { session } } = await middlewareClient.auth.getSession()
if (!session?.user) return 401

// 2. 권한 검증  
const userProfile = await supabaseServiceRole
  .from('user_profiles')
  .select('tenant_id, role')
  .eq('id', session.user.id)
  .single()

// 3. 비즈니스 로직 검증
if (userProfile.tenant_id !== requestedTenantId) return 403

// 4. Service Role로 안전한 DB 조작
const { error } = await supabaseServiceRole.from('table').update(data)
```

### 3. 🔐 **인증 토큰 처리 Best Practices**

#### JWT 토큰 문제 해결 과정
1. **쿠키 방식 실패**: 잘못된 쿠키 이름, 형식 불일치
2. **Authorization 헤더 성공**: `Bearer ${session.access_token}` 방식

#### 권장 인증 패턴
```typescript
// 클라이언트: Authorization 헤더 사용
const { data: { session } } = await supabase.auth.getSession()
const response = await fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }
})

// 서버: Service Role로 토큰 검증
const token = request.headers.get('authorization')?.replace('Bearer ', '')
const { data: { user }, error } = await supabaseServiceRole.auth.getUser(token)
```

### 4. 📊 **데이터베이스 스키마 진화 관리**

#### 컬럼 추가 시 단계적 접근
```sql
-- 1단계: 컬럼 추가
ALTER TABLE instructors 
ADD COLUMN bio TEXT,
ADD COLUMN emergency_contact VARCHAR(20);

-- 2단계: 애플리케이션 코드 업데이트 (호환성 유지)
const instructorData = {
  bio: bio || null,              // 새 컬럼 사용
  emergency_contact: emergency_contact || null,
  memo: backupData || null       // 기존 방식 백업 유지
}

-- 3단계: 데이터 마이그레이션 (필요시)
-- 4단계: 기존 백업 컬럼 제거 (안정화 후)
```

### 5. 🎯 **사용자 상태 관리 아키텍처**

#### EduCanvas User Status Flow
```
회원가입 → pending_approval → (승인) → active
                           ↓ (거부) → 계정 삭제
```

#### 핵심 설계 원칙
- **Single Source of Truth**: `user_profiles.status`가 모든 권한의 기준
- **Role-based Redirect**: 사용자 상태에 따른 자동 페이지 리다이렉트
- **Tenant Isolation**: 모든 데이터는 `tenant_id`로 격리

### 6. 🔍 **디버깅 및 로깅 전략**

#### 구조화된 로깅 패턴
```typescript
// API 시작
console.log('🏢 테넌트 관리자 API - 회원 승인/거부 시작')

// 주요 단계
console.log('🔑 토큰 확인:', { hasAuthHeader: !!authHeader })
console.log('👤 사용자 확인:', { userId: user.id, email: user.email })

// 성공/실패
console.log('✅ 회원 승인 성공')
console.error('❌ 회원 승인 실패:', error)
```

#### 오류 처리 계층화
1. **클라이언트**: 사용자 친화적 메시지
2. **서버 로그**: 상세한 기술적 정보  
3. **Sentry**: 프로덕션 오류 추적

## 결정 사항 (Decision)

### 🔒 **필수 준수 사항**

#### 1. Database Access Rules
- ✅ **API Route Only**: 모든 DB 접근은 API Route를 통해서만
- ✅ **Service Role for CUD**: Create/Update/Delete는 반드시 Service Role 사용
- ✅ **Reality-First**: 실제 DB 스키마 확인 후 개발 시작

#### 2. Authentication Rules  
- ✅ **Authorization Header**: JWT 토큰은 Authorization 헤더로 전달
- ✅ **Session Validation**: 모든 API에서 세션 검증 필수
- ✅ **Tenant Permission**: 테넌트별 권한 격리 엄격 적용

#### 3. Security Rules
- ✅ **Zero Trust**: 모든 요청을 기본적으로 신뢰하지 않음
- ✅ **Input Validation**: Zod 스키마로 모든 입력 검증
- ✅ **Error Handling**: 민감정보 노출 방지

#### 4. Development Process Rules
- ✅ **Schema First**: 새 기능 개발 전 DB 스키마 확인
- ✅ **API Documentation**: 모든 API Route 문서화 필수
- ✅ **Test Data**: 실제 데이터로 테스트 후 프로덕션 배포

### 🚫 **절대 금지 사항**

```typescript
// ❌ 클라이언트에서 직접 DB 수정
await supabase.from('table').update()

// ❌ 하드코딩된 UUID 사용  
const tenantId = '12345678-1234-1234-1234-123456789abc'

// ❌ 민감정보 로깅
console.log('Password:', password)

// ❌ 문서만 보고 스키마 추측
// 반드시 npx supabase gen types typescript로 확인

// ❌ 쿠키에서 직접 JWT 파싱
const token = cookies.get('complex-cookie-name')?.value
```

### ✅ **권장 패턴**

```typescript
// ✅ 표준 API Route 패턴
export async function POST(request: NextRequest) {
  // 1. 인증 확인
  const { supabase: middlewareClient } = createMiddlewareClient(request)
  const { data: { session } } = await middlewareClient.auth.getSession()
  
  // 2. 입력 검증
  const body = await request.json()
  const validatedData = schema.parse(body)
  
  // 3. 권한 검증
  const hasPermission = await checkTenantPermission(session.user.id, validatedData.tenantId)
  
  // 4. 비즈니스 로직 실행
  const result = await supabaseServiceRole.from('table').update(validatedData)
  
  // 5. 응답
  return NextResponse.json({ success: true, data: result })
}
```

## 결과 (Consequences)

### 긍정적 효과
- 🔒 **보안 강화**: API-First로 RLS 정책과 권한 검증 완벽 구현
- 🚀 **개발 속도 향상**: Reality-First로 스키마 불일치 문제 사전 방지
- 🎯 **유지보수성**: 구조화된 로깅과 오류 처리로 디버깅 시간 단축
- 📈 **확장성**: 표준화된 패턴으로 새로운 기능 개발 가속화

### 주의 사항
- 🔄 **Learning Curve**: 새로운 개발자 온보딩 시 가이드라인 교육 필요
- 📋 **Documentation**: API 변경 시 문서 업데이트 필수
- 🧪 **Testing**: 각 계층별 테스트 전략 수립 필요

## 참고 자료

- [T-005 Database Deep Dive 교훈](./LESSONS-LEARNED-T005-database-deep-dive.md)
- [EduCanvas Security Guidelines](../../../CLAUDE.md#보안-중심-프로젝트-철학)
- [API Development Standards](../../../docs/api_specification.md)

---

> **핵심 메시지**: "문서보다 실제가 정답이다. 클라이언트는 API만 호출한다. 보안은 서버에서 처리한다."