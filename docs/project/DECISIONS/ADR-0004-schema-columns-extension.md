# ADR-0004: Database Schema Columns Extension

**Date:** 2025-08-11  
**Status:** Accepted  
**Context:** T-005 샘플 데이터 생성 과정에서 발견된 스키마 갭  

## Summary

실제 학원 운영 요구사항을 반영하여 `students` 및 `classes` 테이블에 필수 컬럼을 추가하였습니다.

## Problem

T-005 작업 중 샘플 데이터 생성 시 다음 문제를 발견:

1. **학부모 연락처 관리 한계**: 기존 스키마에서는 한 명의 학부모 연락처만 저장 가능
2. **클래스 학년/과정 정보 부재**: 클래스 테이블에서 학년 및 과정 정보를 구체적으로 관리할 수 없음

## Decision

### 1. Students 테이블 확장

**기존:**
```sql
-- parent_phone만 존재 (단일 연락처)
parent_phone VARCHAR(20) NOT NULL
```

**변경:**
```sql
-- 복수 학부모 연락처 지원
parent_name VARCHAR(100),
parent_phone_1 VARCHAR(20),  -- 주 연락처 (엄마/아빠)
parent_phone_2 VARCHAR(20)   -- 부 연락처 (엄마/아빠)
```

**사유:**
- 현실적으로 대부분 학원에서 아버지/어머니 연락처를 모두 관리
- 긴급상황 시 복수 연락처 필요
- 향후 확장성 고려 (guardian_1_phone, guardian_2_phone으로 발전 가능)

### 2. Classes 테이블 확장

**기존:**
```sql
-- 학년/과정 정보 부재
subject VARCHAR(50)  -- 과목명만 존재
```

**추가:**
```sql
grade VARCHAR(20),    -- 학년 정보 (초1, 중2, 고3 등)
course VARCHAR(100)   -- 과정명 (기초반, 심화반, 특별반 등)
```

**사유:**
- 동일 과목이라도 학년별 클래스 구분 필요
- 과정별 세분화된 관리 (기초/심화/특별과정)
- ClassFlow에서 학년별 그룹핑 필요

## Implementation

### Database Migration
```sql
-- Students 테이블 컬럼 추가
ALTER TABLE students 
ADD COLUMN parent_name VARCHAR(100),
ADD COLUMN parent_phone_1 VARCHAR(20),
ADD COLUMN parent_phone_2 VARCHAR(20);

-- 기존 parent_phone 데이터를 parent_phone_1로 이전 (필요시)
UPDATE students SET parent_phone_1 = parent_phone WHERE parent_phone IS NOT NULL;

-- Classes 테이블 컬럼 추가  
ALTER TABLE classes
ADD COLUMN grade VARCHAR(20),
ADD COLUMN course VARCHAR(100);
```

### Application Layer 업데이트
- TypeScript 타입 정의 업데이트 필요
- Form validation 로직 수정
- ClassFlow UI에서 학년/과정 표시 로직 추가

## Consequences

### Positive
✅ **현실적인 학부모 연락처 관리**: 복수 연락처로 소통 효율성 증대  
✅ **세분화된 클래스 관리**: 학년/과정별 정확한 분류  
✅ **향후 확장성**: Guardian 개념으로 발전 가능  
✅ **ClassFlow 개선**: 학년별 그룹핑으로 더 나은 UX  

### Negative
⚠️ **스키마 복잡성 증가**: 추가 컬럼으로 인한 관리 포인트 증가  
⚠️ **기존 코드 수정 필요**: Form, validation, display 로직 업데이트 필요  
⚠️ **데이터 일관성**: 기존 데이터 마이그레이션 및 NULL 처리 필요  

## Migration Strategy

### Phase 1: 컬럼 추가 (완료)
- [x] `parent_phone_1`, `parent_phone_2` 컬럼 추가
- [x] `grade`, `course` 컬럼 추가

### Phase 2: 애플리케이션 레이어 업데이트
- [ ] TypeScript 타입 정의 업데이트
- [ ] 학생 등록/수정 Form 컴포넌트 업데이트
- [ ] 클래스 생성/관리 Form 컴포넌트 업데이트
- [ ] ClassFlow에서 grade 표시 로직 추가

### Phase 3: 기존 데이터 정리
- [ ] 기존 `parent_phone` 데이터를 `parent_phone_1`로 이전
- [ ] 기존 클래스들에 적절한 `grade`, `course` 값 설정

## Related Documents

- **T-005 권한 문제 해결**: 샘플 데이터 생성 과정에서 발견
- **database_schema_v4_multitenant.sql**: 스키마 정의 문서 (업데이트 필요)
- **TypeScript Types**: 생성된 타입 정의 (재생성 필요)

## Approval

- **Proposed by:** Claude Code  
- **Reviewed by:** Carl (User)  
- **Approved on:** 2025-08-11  
- **Implementation:** Immediate