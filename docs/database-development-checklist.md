# 🗃️ Database Development Checklist

**작성일**: 2025-08-10  
**목적**: UUID 오류 방지 및 데이터베이스 개발 품질 향상  
**적용 범위**: EduCanvas 프로젝트 모든 데이터베이스 작업

## 📋 필수 체크리스트

### 🔑 UUID 작업 시 (CRITICAL)

#### ✅ 작업 전 준비
- [ ] UUID 형식 이해: **8-4-4-4-12** (총 36자, 하이픈 포함)
- [ ] 자동 생성 우선 원칙 숙지
- [ ] 관계형 데이터는 동적 참조만 사용

#### ✅ UUID 생성 방법 선택
- [ ] **1순위**: `gen_random_uuid()` 사용 (PostgreSQL 자동 생성)
- [ ] **2순위**: 검증된 UUID 생성 도구 사용
- [ ] **금지사항**: 수동 하드코딩 UUID 작성

```sql
-- ✅ 올바른 방법
INSERT INTO tenants (name, slug) VALUES ('학원명', 'academy-slug');

-- ❌ 잘못된 방법  
INSERT INTO tenants (id, name, slug) VALUES 
('ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj', '학원명', 'academy-slug');
```

#### ✅ 관계형 데이터 생성
- [ ] FK는 반드시 JOIN으로 동적 참조
- [ ] 하드코딩된 FK 값 사용 금지
- [ ] 존재하지 않는 ID 참조 방지

```sql
-- ✅ 올바른 FK 참조
INSERT INTO classes (tenant_id, name) 
SELECT t.id, '클래스명'
FROM tenants t 
WHERE t.slug = 'academy-slug';
```

### 🛡️ SQL 스크립트 작성 시

#### ✅ 작성 중 검증
- [ ] UUID 길이 확인: 정확히 36자
- [ ] 패턴 검증: `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`
- [ ] 충돌 방지: `ON CONFLICT DO NOTHING` 추가
- [ ] 트랜잭션 고려: 필요시 BEGIN/COMMIT 사용

#### ✅ 실행 전 검증
- [ ] SQL 구문 검사 완료
- [ ] 테이블 존재 여부 확인
- [ ] 제약 조건 충돌 가능성 검토
- [ ] 백업 데이터 준비 (프로덕션인 경우)

### 🧪 테스트 및 검증

#### ✅ 로컬 테스트
- [ ] 로컬 환경에서 스크립트 실행 성공
- [ ] 생성된 데이터 무결성 확인
- [ ] 관계형 데이터 연결 상태 검증
- [ ] 성능 영향도 측정

#### ✅ 프로덕션 배포 전
- [ ] 스테이징 환경 테스트 완료
- [ ] 롤백 계획 수립
- [ ] 다운타임 최소화 방안 준비
- [ ] 팀 리뷰 및 승인 완료

## 🚨 흔한 실수와 해결책

### ❌ 실수 1: UUID 길이 오류
```sql
-- 잘못된 예: 마지막 부분이 11자리
'12345678-1234-1234-1234-12345678901'  -- ❌

-- 올바른 예: 마지막 부분이 12자리  
'12345678-1234-1234-1234-123456789012' -- ✅
```

### ❌ 실수 2: 하드코딩된 FK 참조
```sql
-- 잘못된 예
INSERT INTO classes (tenant_id, name) VALUES 
('some-hardcoded-uuid', '클래스명'); -- ❌

-- 올바른 예
INSERT INTO classes (tenant_id, name) 
SELECT t.id, '클래스명' FROM tenants t WHERE t.slug = 'tenant-slug'; -- ✅
```

### ❌ 실수 3: 충돌 처리 누락
```sql
-- 위험한 예: 중복 시 오류 발생
INSERT INTO tenants (name, slug) VALUES ('학원', 'academy'); -- ❌

-- 안전한 예: 중복 시 무시
INSERT INTO tenants (name, slug) VALUES ('학원', 'academy')
ON CONFLICT (slug) DO NOTHING; -- ✅
```

## 🔧 유용한 도구 및 쿼리

### UUID 형식 검증 쿼리
```sql
-- UUID 형식 검증
SELECT 
  uuid_value,
  LENGTH(uuid_value) as length_check,
  CASE 
    WHEN uuid_value ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN '✅ Valid' 
    ELSE '❌ Invalid' 
  END as validation_result
FROM (VALUES 
  ('12345678-1234-1234-1234-123456789abc'),  -- Valid
  ('12345678-1234-1234-1234-123456789abcd'), -- Invalid (too long)
  ('12345678-1234-1234-1234-123456789ab')    -- Invalid (too short)
) t(uuid_value);
```

### UUID 자동 생성 테스트
```sql
-- 새로운 UUID 생성 및 검증
WITH new_uuid AS (
  SELECT gen_random_uuid() as uuid_value
)
SELECT 
  uuid_value,
  LENGTH(uuid_value::text) as length,
  uuid_value::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' as is_valid
FROM new_uuid;
```

### 관계 무결성 검증
```sql
-- FK 무결성 확인
SELECT 
  'classes' as table_name,
  COUNT(*) as total_records,
  COUNT(tenant_id) as records_with_tenant,
  COUNT(*) - COUNT(tenant_id) as orphaned_records
FROM classes
UNION ALL
SELECT 
  'students' as table_name,
  COUNT(*) as total_records,
  COUNT(tenant_id) as records_with_tenant,
  COUNT(*) - COUNT(tenant_id) as orphaned_records  
FROM students;
```

## 📞 도움 요청 시점

다음 상황에서는 즉시 팀에 도움을 요청하세요:

- [ ] UUID 형식 오류가 계속 발생하는 경우
- [ ] 복잡한 관계형 데이터 생성이 필요한 경우  
- [ ] 대용량 데이터 마이그레이션 시
- [ ] 프로덕션 데이터에 영향을 주는 작업 시
- [ ] 성능에 심각한 영향을 줄 수 있는 쿼리 실행 시

## 📚 참고 자료

- [PostgreSQL UUID 공식 문서](https://www.postgresql.org/docs/current/datatype-uuid.html)
- [RFC 4122 - UUID 표준](https://tools.ietf.org/html/rfc4122)
- [CLAUDE.md - UUID 가이드라인](../CLAUDE.md)
- [ADR-0003 - UUID 개발 표준](./project/DECISIONS/ADR-0003-uuid-development-standards.md)

---

**⚠️ 이 체크리스트는 필수사항입니다. 모든 데이터베이스 작업 시 반드시 준수하세요.**

**마지막 업데이트**: 2025-08-10  
**다음 리뷰 예정일**: 2025-09-10