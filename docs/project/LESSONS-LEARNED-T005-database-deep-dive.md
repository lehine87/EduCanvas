# T-005 Database Deep Dive: 반성과 깨달음

**작성일**: 2025-08-11  
**작업**: T-005 권한 문제 해결 및 샘플 데이터 생성  
**결과**: 성공 (복수의 시행착오 후)  
**소요시간**: 약 6시간 (예상: 1시간)  

---

## 🚨 핵심 문제: 문서와 실제 DB의 심각한 괴리

### 발생한 문제들

#### 1. **문서 기반 추측의 위험성** ⚠️
- **예상**: `classes.instructor_id → instructors.id`
- **실제**: `classes.instructor_id → user_profiles.id`
- **결과**: 모든 샘플 데이터 생성 실패

#### 2. **숨겨진 제약조건의 존재** ⚠️  
- **예상**: `user_profiles`는 독립적인 테이블
- **실제**: `user_profiles.id → auth.users.id` FK 제약조건 존재
- **결과**: "violates foreign key constraint" 오류

#### 3. **컬럼명 오타와 필수 필드 누락** ⚠️
- **예상**: `classes.course` 컬럼
- **실제**: `classes.cource` (오타가 실제 컬럼명)
- **추가 발견**: `students.student_number` 필수 필드 (NOT NULL)

---

## 💡 핵심 깨달음 

### 1. **"문서 vs 실제"의 진실**
```
문서화된 스키마 ≠ 실제 데이터베이스 스키마
```
- 문서는 빠르게 outdated 됨
- 실제 스키마가 항상 정답
- **반드시 실제 DB 구조 먼저 확인**

### 2. **Architecture 이해의 중요성**
```typescript
// EduCanvas는 User-first Architecture
user_profiles (모든 사용자 기본)
    ↓ 
instructors (강사 추가 정보) - user_id로 연결
    ↓
classes.instructor_id → user_profiles.id (직접 연결)
```
**설계 의도**: 권한 관리의 일관성과 단순성

### 3. **Supabase의 숨겨진 복잡성**
- `auth.users` 테이블과의 자동 연동
- TypeScript 타입에 표시되지 않는 제약조건들
- RLS 정책의 다층적 적용

---

## 🔍 해결 과정의 시행착오

### 시도 1: 문서 기반 접근 (실패)
```sql
-- ❌ 문서 기반 추측
INSERT INTO classes (instructor_id, ...) 
VALUES (instructors.id, ...);  -- FK 제약 위반
```

### 시도 2: TypeScript 타입 기반 (부분 실패)
```sql  
-- ✅ FK 관계는 해결, but...
INSERT INTO classes (instructor_id, current_students, grade_level, ...)
-- ❌ 존재하지 않는 컬럼들 (current_students, grade_level)
```

### 시도 3: 실제 스키마 정밀 분석 (성공)
```bash
# 실제 DB 구조 완전 분석
npx supabase gen types typescript --project-id xxx > current_database_types.ts
```

### 시도 4: 복잡한 PL/pgSQL (오류 연발)
```sql
-- ❌ RETURNING 절 오류, 여러 행 반환 오류
RETURNING id INTO variable  -- Multiple rows error
```

### 시도 5: 단순화된 접근 (최종 성공)
```sql
-- ✅ 단순한 INSERT 문들만 사용
-- ✅ 기존 user_profiles 재사용
-- ✅ 모든 제약조건 준수
```

---

## 📚 구체적 학습 사항

### 1. **DB 구조 분석의 올바른 순서**
```bash
1. npx supabase gen types typescript  # 실제 스키마 확인
2. 주요 테이블 구조 분석             # Row, Insert, Relationships
3. FK 관계 및 제약조건 파악           # Relationships 섹션
4. ENUM 타입 및 필수 필드 확인       # Insert 타입에서 required 필드
5. 실제 데이터로 검증               # 소량 테스트 후 본격 진행
```

### 2. **Supabase 특수성 이해**
- `auth.users`와 `user_profiles`의 1:1 관계
- Service Role의 RLS 우회 특성
- TypeScript 타입 정의의 한계 (숨겨진 제약조건 미표시)

### 3. **오류 메시지 해석 능력**
```
"violates row-level security policy" → RLS 문제
"violates foreign key constraint" → FK 관계 오류  
"violates not-null constraint" → 필수 필드 누락
"query returned more than one row" → RETURNING 절 오류
```

---

## 🛠️ 개선된 개발 프로세스

### Before (문제가 있던 접근)
```
문서 읽기 → 코드 작성 → 실행 → 오류 → 디버깅 반복
```

### After (개선된 접근)
```
1. 실제 DB 스키마 분석 (TypeScript 타입)
2. 관계 및 제약조건 완전 파악
3. 소량 테스트 데이터로 검증
4. 성공 후 확장
5. 문서 업데이트
```

### 새로운 체크리스트
- [ ] `npx supabase gen types` 실행했는가?
- [ ] 모든 FK 관계를 정확히 파악했는가?
- [ ] 필수 필드 (NOT NULL) 모두 포함했는가?
- [ ] ENUM 제약조건 확인했는가?
- [ ] RLS 정책 고려했는가?
- [ ] 단순한 접근법부터 시작했는가?

---

## 📊 성과 및 결과물

### 생성된 문서들
1. **`database-data-insertion-guide-v4.1.md`** - 완전한 데이터 추가 가이드
2. **`simple_sample_data_final.sql`** - 검증된 샘플 데이터 생성 스크립트
3. **ADR-0004** - 스키마 v4.1 업데이트 결정 기록
4. **T-024** - 애플리케이션 레이어 적용 작업 명세

### 핵심 발견사항
- User-first Architecture 완전 이해
- 숨겨진 FK 제약조건 (`user_profiles → auth.users`) 발견
- 실제 컬럼명 정정 (`cource` 오타, `student_number` 필수)
- RLS 정책의 정확한 작동 원리 파악

---

## 🎯 향후 적용 원칙

### 1. **Documentation-First가 아닌 Reality-First**
- 문서는 참고용, 실제 DB가 진실
- 코드 작성 전 반드시 실제 구조 확인
- 문서와 실제의 차이를 항상 염두

### 2. **점진적 접근법 (Progressive Approach)**
- 복잡한 방법 대신 단순한 방법부터
- 한 번에 모든 걸 해결하려 하지 말고 단계적 접근
- 검증된 방법을 확장하는 방식

### 3. **제약조건 우선 사고 (Constraint-First Thinking)**
- FK, NOT NULL, UNIQUE, ENUM 제약조건 먼저 파악
- 제약조건을 만족하는 최소한의 데이터부터 시작
- 제약조건 위반 시 데이터 수정이 아닌 접근법 수정

### 4. **도구 활용의 지혜**
```bash
# 신뢰할 수 있는 정보원
npx supabase gen types typescript  # 실제 스키마
Supabase SQL Editor                # Service Role 실행
TypeScript 컴파일러                # 타입 안전성

# 신뢰하기 어려운 정보원  
문서화된 스키마 파일               # Outdated 위험
추측 기반 코드                    # 제약조건 간과
복잡한 PL/pgSQL                   # 디버깅 어려움
```

---

## 🔄 반성과 다짐

### 잘못된 가정들
1. **문서가 정확할 것이다** → 실제와 다를 수 있다
2. **TypeScript 타입이 완전할 것이다** → 숨겨진 제약조건 존재
3. **복잡한 방법이 더 좋을 것이다** → 단순한 방법이 더 안정적
4. **한 번에 완벽하게 할 수 있다** → 점진적 접근이 현실적

### 앞으로의 다짐
1. **실제 확인 우선주의**: 가정하지 말고 확인하라
2. **단순함의 추구**: 복잡한 해법보다 단순하고 확실한 해법
3. **제약조건 중심 사고**: 데이터베이스 설계 의도 이해하기
4. **문서화의 가치**: 이런 삽질을 다시 하지 않기 위해

---

## 🏆 최종 교훈

> **"데이터베이스와 대화하라, 문서와 대화하지 말고"**

데이터베이스는 거짓말하지 않는다. 문서는 outdated될 수 있고, 추측은 틀릴 수 있지만, 실제 데이터베이스 스키마와 제약조건은 정확한 현실을 보여준다.

이번 경험을 통해 **겸손한 개발자**가 되었다. 추측보다는 검증을, 복잡함보다는 단순함을, 속도보다는 정확성을 추구하는 개발자로 성장할 수 있는 값진 경험이었다.

**"삽질도 공부다. 하지만 같은 삽질을 두 번 하지는 말자."**