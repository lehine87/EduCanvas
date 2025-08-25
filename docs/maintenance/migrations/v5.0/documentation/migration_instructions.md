# 🚀 Classes Instructor ID Migration Instructions

## 📋 현재 상황
- **분석 완료**: classes.instructor_id → user_profiles.id (admin 역할)
- **목표**: classes.instructor_id → tenant_memberships.id
- **데이터**: 1개 클래스 ("중2 현행반")가 영향받음

## 🛠️ **Step 1: Manual DDL Commands (Supabase Dashboard)**

**Supabase Dashboard → SQL Editor에서 다음 명령어들을 실행하세요:**

```sql
-- 1. 백업 테이블 생성
CREATE TABLE classes_backup_20250825 AS 
SELECT * FROM classes;

-- 2. 새 컬럼 추가
ALTER TABLE classes 
ADD COLUMN new_instructor_id UUID;

-- 3. 외래키 제약조건 추가
ALTER TABLE classes 
ADD CONSTRAINT classes_new_instructor_id_fkey 
FOREIGN KEY (new_instructor_id) REFERENCES tenant_memberships(id)
ON DELETE SET NULL;
```

## 🤖 **Step 2: Automated Data Migration (Node.js)**

위의 DDL이 완료되면, 다음 명령어로 데이터 마이그레이션을 실행합니다:

```bash
node -e "/* Node.js migration script will be provided */"
```

## 🔍 **Step 3: Final Verification**

마이그레이션 완료 후 수동으로 컬럼 교체:

```sql
-- 4. 기존 외래키 제약조건 제거
ALTER TABLE classes DROP CONSTRAINT classes_instructor_id_fkey;

-- 5. 기존 컬럼 제거
ALTER TABLE classes DROP COLUMN instructor_id;

-- 6. 새 컬럼을 instructor_id로 이름 변경
ALTER TABLE classes RENAME COLUMN new_instructor_id TO instructor_id;

-- 7. 새 외래키 제약조건 추가
ALTER TABLE classes ADD CONSTRAINT classes_instructor_id_fkey 
  FOREIGN KEY (instructor_id) REFERENCES tenant_memberships(id) ON DELETE SET NULL;
```

## 📊 **Expected Results**

- Classes 테이블의 instructor_id가 tenant_memberships.id를 참조
- user_profiles는 순수 인증용으로만 사용
- 미래 학생/학부모 앱 구축을 위한 깨끗한 아키텍처

---

**🎯 준비 완료됐습니다! Step 1의 SQL을 실행해주시면 자동화된 마이그레이션을 진행하겠습니다.**