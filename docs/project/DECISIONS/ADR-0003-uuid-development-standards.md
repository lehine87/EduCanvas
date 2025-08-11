# ADR-0003: UUID 개발 표준 수립

**작성일**: 2025-08-10  
**상태**: Accepted  
**작성자**: Claude Code  
**관련 이슈**: T-003 UUID 오류로 인한 개발 지연

## 상황 (Context)

2025-08-10 T-003 작업 중 잘못된 UUID 형식으로 인해 다음과 같은 문제가 발생했습니다:

### 발생한 문제
```
ERROR: 22P02: invalid input syntax for type uuid: "ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj"
```

### 문제 원인 분석
1. **UUID 형식 오류**: 마지막 segment가 11자리 (올바른 형식: 12자리)
2. **수동 하드코딩**: 개발자가 임의로 UUID를 생성하여 오타 발생
3. **검증 부재**: UUID 형식 검증 없이 SQL 스크립트 작성
4. **반복적 오류**: 같은 실수를 3번 반복하여 개발 지연 발생

### 영향도
- **개발 지연**: 3시간 소요
- **사용자 경험**: 데이터베이스 설정 불가로 기능 테스트 중단
- **개발 효율성**: 동일한 실수 반복으로 생산성 저하

## 결정 (Decision)

EduCanvas 프로젝트에서 UUID 관련 작업 시 다음 표준을 의무적으로 적용합니다.

### 1. UUID 생성 방법 우선순위

#### 🥇 최우선: PostgreSQL 자동 생성
```sql
-- ✅ 권장: ID 컬럼 생략으로 자동 생성
INSERT INTO tenants (name, slug) VALUES ('학원명', 'academy-slug');
```

#### 🥈 차선책: 검증된 도구 사용
```sql
-- ✅ 허용: 검증된 UUID 생성기 사용
INSERT INTO tenants (id, name, slug) VALUES 
(gen_random_uuid(), '학원명', 'academy-slug');
```

#### 🚫 금지: 수동 하드코딩
```sql
-- ❌ 절대 금지: 수동 UUID 하드코딩
INSERT INTO tenants (id, name, slug) VALUES 
('ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj', '학원명', 'academy-slug');
```

### 2. 관계형 데이터 생성 표준

#### ✅ 필수: 동적 참조 시스템
```sql
-- JOIN을 통한 안전한 FK 참조
INSERT INTO classes (tenant_id, name) 
SELECT t.id, '클래스명'
FROM tenants t 
WHERE t.slug = 'academy-slug';
```

#### ❌ 금지: 하드코딩된 FK
```sql
-- 하드코딩된 FK 사용 금지
INSERT INTO classes (tenant_id, name) VALUES 
('12345678-1234-1234-1234-123456789abc', '클래스명');
```

### 3. SQL 스크립트 검증 체크리스트

모든 SQL 스크립트 작성 시 다음을 필수로 확인:

- [ ] **UUID 길이**: 정확히 36자 (하이픈 포함)
- [ ] **UUID 형식**: 8-4-4-4-12 패턴 준수
- [ ] **자동 생성**: `gen_random_uuid()` 우선 사용
- [ ] **관계 무결성**: FK는 동적 참조로 생성
- [ ] **충돌 방지**: `ON CONFLICT DO NOTHING` 적용
- [ ] **테스트 실행**: 로컬에서 검증 후 배포

### 4. 개발 도구 및 유틸리티

#### UUID 검증 함수
```bash
# UUID 형식 검증 (36자, 8-4-4-4-12)
validate_uuid() {
  echo "$1" | grep -qE '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
}
```

#### PostgreSQL UUID 생성
```sql
-- 안전한 UUID 생성
SELECT gen_random_uuid();

-- UUID 형식 검증
SELECT 
  uuid_value,
  CASE 
    WHEN uuid_value ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
    THEN 'Valid' 
    ELSE 'Invalid' 
  END as validation
FROM (VALUES ('12345678-1234-1234-1234-123456789abc')) t(uuid_value);
```

## 결과 (Consequences)

### 긍정적 영향
- **개발 안정성**: UUID 오류로 인한 개발 중단 방지
- **코드 품질**: 일관된 UUID 사용 패턴 확립
- **유지보수성**: 동적 참조로 인한 데이터 무결성 향상
- **개발 효율성**: 반복적 오류 제거로 생산성 향상

### 주의사항
- **학습 곡선**: 개발자들이 새로운 표준에 적응 필요
- **기존 코드**: 레거시 코드의 점진적 리팩토링 필요
- **성능**: 동적 참조로 인한 미미한 쿼리 오버헤드

### 준수 방법
1. **코드 리뷰**: 모든 UUID 관련 코드는 필수 리뷰
2. **자동화**: CI/CD에서 UUID 형식 검증 추가
3. **문서화**: 신규 개발자 온보딩에 표준 교육 포함
4. **템플릿**: UUID 생성 코드 스니펫 제공

## 관련 문서
- [CLAUDE.md - UUID 작업 가이드라인](../../CLAUDE.md)
- [T-003 완료 보고서](../TASKS/t-003-completed.md)
- [Database Schema v4.1 문서](../../database_schema_v4.1_video_integrated.sql)

---

**승인자**: Lead Developer  
**검토자**: Database Architect, Security Engineer  
**적용 범위**: EduCanvas 전체 프로젝트  
**우선순위**: P0 (Critical)