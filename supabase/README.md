# EduCanvas Database Schema v4.1 - 실행 가이드

## 📋 개요

EduCanvas의 멀티테넌트 아키텍처와 YouTube 동영상 강의 시스템을 지원하는 database_schema_v4.1을 Supabase에 적용하는 가이드입니다.

## 🚀 실행 순서

### 1. Supabase 대시보드 접속
1. [Supabase 대시보드](https://supabase.com/dashboard/project/hodkqpmukwfrreozwmcy)에 접속
2. 좌측 메뉴에서 **"SQL Editor"** 선택

### 2. 스키마 설정 (1단계)
1. `supabase/schema_setup.sql` 파일의 내용을 SQL Editor에 복사
2. **"Run"** 버튼 클릭하여 실행
3. 성공 메시지 확인: "EduCanvas Database Schema v4.1이 성공적으로 설정되었습니다!"

### 3. RLS 정책 적용 (2단계)
1. `supabase/rls_policies.sql` 파일의 내용을 SQL Editor에 복사
2. **"Run"** 버튼 클릭하여 실행
3. 성공 메시지 확인: "EduCanvas 멀티테넌트 RLS 정책이 성공적으로 설정되었습니다!"

### 4. 샘플 데이터 생성 (3단계)
1. `supabase/sample_data.sql` 파일의 내용을 SQL Editor에 복사
2. **"Run"** 버튼 클릭하여 실행
3. 데이터 요약 테이블과 성공 메시지 확인

## 🏗️ 생성된 구조

### 핵심 테이블
- **tenants**: 테넌트(학원) 관리
- **tenant_roles**: 테넌트별 역할 정의
- **tenant_memberships**: 사용자-테넌트 멤버십
- **user_profiles**: 사용자 프로필
- **students**: 학생 정보 (테넌트별 격리)
- **classes**: 클래스 정보 (테넌트별 격리)
- **course_packages**: 수강권 패키지
- **student_enrollments**: 학생 수강 등록
- **videos**: YouTube 동영상 강의
- **video_watch_sessions**: 동영상 시청 기록

### 생성된 샘플 데이터
- **3개 테넌트**: EduCanvas 데모 학원, XYZ 교육센터, 스마트 아카데미
- **각 테넌트별 4개 역할**: admin, instructor, staff, student
- **총 8개 클래스**: 수학, 영어, 과학, 컴퓨터 등 다양한 과목
- **11명 학생**: 각 테넌트별로 배치
- **5개 수강 등록**: ClassFlow 테스트를 위한 position_in_class 설정
- **4개 동영상 강의**: YouTube 연동 테스트용
- **5개 시청 기록**: 진도 관리 테스트용

## 🔒 보안 기능

### RLS (Row Level Security) 정책
- **테넌트별 완전 데이터 격리**: 사용자는 자신의 테넌트 데이터만 접근 가능
- **역할 기반 접근 제어**: admin, instructor, staff, student 역할별 권한 차별화
- **동영상 접근 권한**: 수강 등록 상태와 동영상 액세스 만료일 확인

### 자동화 트리거
- **동영상 진도 추적**: 시청 시간에 따른 완료율 자동 계산
- **수강권 사용량 관리**: 잔여 수강권 자동 계산 및 만료 처리

## 🧪 테스트 방법

### 1. 데이터베이스 접속 테스트
```
브라우저에서 http://localhost:3000/test-db 접속
"🚀 데이터베이스 테스트 시작" 버튼 클릭
```

### 2. 테넌트 격리 테스트 (SQL Editor에서 실행)
```sql
-- 현재 생성된 테넌트 확인
SELECT id, name, slug FROM tenants;

-- 테넌트별 데이터 분포 확인
SELECT 
  t.name as tenant_name,
  COUNT(DISTINCT c.id) as classes,
  COUNT(DISTINCT s.id) as students,
  COUNT(DISTINCT se.id) as enrollments
FROM tenants t
LEFT JOIN classes c ON c.tenant_id = t.id
LEFT JOIN students s ON s.tenant_id = t.id
LEFT JOIN student_enrollments se ON se.tenant_id = t.id
GROUP BY t.id, t.name;
```

### 3. 동영상 시청 진도 테스트
```sql
-- 동영상 시청 현황 확인
SELECT 
  v.title,
  s.name as student_name,
  vws.watch_status,
  vws.completion_percentage,
  vws.progress_seconds
FROM video_watch_sessions vws
JOIN videos v ON v.id = vws.video_id
JOIN students s ON s.id = vws.student_id
ORDER BY v.title, s.name;
```

## 📊 주요 기능

### ClassFlow 지원
- `student_enrollments.position_in_class`: 드래그앤드롭 위치 관리
- 실시간 구독 설정으로 동시 편집 지원

### 동영상 강의 시스템
- YouTube 동영상 ID 기반 강의 관리
- 학생별 시청 진도 추적
- 수강권별 동영상 액세스 제어

### 멀티테넌트 아키텍처
- 완전한 테넌트별 데이터 격리
- 유연한 역할 및 권한 시스템
- 확장 가능한 구조

## 🚨 주의사항

1. **실행 순서 준수**: schema_setup.sql → rls_policies.sql → sample_data.sql 순서로 실행
2. **오류 발생 시**: 각 단계별로 성공 메시지를 확인하고 다음 단계 진행
3. **테스트 환경**: 현재는 테스트용 샘플 데이터이므로 프로덕션에서는 적절한 데이터로 교체 필요

## 🔗 다음 단계

1. **T-004**: TypeScript 타입 자동 생성 설정
2. **T-005**: 멀티테넌트 인증 시스템 구현
3. **T-007**: YouTube 동영상 강의 API 구현
4. **T-013**: 학생 CRUD API 엔드포인트 구현

---

**작업 완료일**: 2025-08-10  
**데이터베이스 스키마 버전**: v4.1  
**Supabase 프로젝트 ID**: hodkqpmukwfrreozwmcy