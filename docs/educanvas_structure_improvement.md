# EduCanvas 프로젝트 구조 개선안

## 📌 개선 목표
- 모듈화와 계층화를 강화하여 유지보수와 확장성 확보
- 페이지 → 비즈니스 로직 → 상태 → UI 흐름 명확화
- 공통 자원 재사용 극대화
- 모든 핵심 기능(학생, 클래스, 출결, 상담, 강사, 수납, DnD)을 동일한 패턴으로 관리

---

## 📂 신규 구조 제안

```
src/
├── app/                # Next.js 페이지
│   ├── (auth)/
│   ├── (admin)/
│   │   ├── dashboard/
│   │   ├── classes/
│   │   ├── students/
│   │   ├── attendance/
│   │   ├── instructors/
│   │   ├── consultations/
│   │   └── payments/
├── components/
│   ├── ui/             # 공통 UI 컴포넌트
│   ├── students/
│   ├── classes/
│   ├── attendance/
│   ├── instructors/
│   ├── consultations/
│   ├── payments/
│   └── dnd/
├── config/
│   ├── menu.ts
│   ├── theme.ts
│   ├── constants.ts
│   ├── columns/
│   │   ├── studentsColumns.ts
│   │   ├── classColumns.ts
│   │   └── ...
│   └── index.ts
├── features/
│   ├── students/
│   │   ├── api.ts
│   │   ├── service.ts
│   │   ├── hooks.ts
│   │   └── index.ts
│   ├── classes/
│   ├── attendance/
│   ├── instructors/
│   ├── consultations/
│   ├── payments/
│   └── dnd/
├── store/              # Zustand 상태 관리
├── lib/                # DB, 인증, 유효성 검사
│   ├── db/
│   ├── auth/
│   └── validations.ts
├── hooks/              # 공통 훅
├── types/              # 타입 정의
├── utils/              # 공통 유틸리티
├── tests/              # 테스트 코드 (unit, integration, e2e)
└── docs/               # 개발 문서
```

---

## 📦 파일 이동 매핑

| 현재 경로 | 이동 경로 | 비고 |
|-----------|-----------|------|
| components/class-manager/ | components/classes/ | 반 관리 UI |
| components/student/ | components/students/ | 학생 관리 UI |
| components/analytics/ | components/analytics/ | 통계/분석 |
| components/modals/ | components/ui/modals/ | 공통 모달 UI |
| store/useClassStore.ts | store/classesStore.ts | 명명 규칙 통일 |
| store/useStudentStore.ts | store/studentsStore.ts | 명명 규칙 통일 |
| store/useColumnStore.ts | config/columns/ | 고정 컬럼 정의 |
| lib/supabase.ts | lib/db/supabaseClient.ts | DB 초기화 |
| lib/auth.ts | lib/auth/index.ts | 인증 모듈 |
| utils/constants.ts | config/constants.ts | 전역 상수 |
| utils/validators.ts | lib/validations.ts | 유효성 검사 통합 |
| hooks/useDragAndDrop.ts | features/dnd/hooks.ts | DnD 훅 |
| hooks/useAuth.ts | features/auth/hooks.ts | 인증 훅 |
| types/student.ts | types/students.ts | 명명 규칙 통일 |
| types/class.ts | types/classes.ts | 명명 규칙 통일 |
| app/(admin)/class-manager/ | app/(admin)/classes/ | 라우트명 통일 |

---

## ✅ 유지할 부분
- `components/ui`
- `store`
- `lib/supabase.ts` + `lib/auth.ts` (위치만 변경)
- `hooks`
- `types`
- `utils` (validators 제외)

---

## ➕ 추가할 부분
1. **features/** : CRUD, 서비스 로직, 모듈별 훅
2. **config/** : 환경 상수, 메뉴, 테마, 컬럼 정의
3. **tests/** : 유닛·통합·E2E 테스트 코드
4. **docs/** : API 명세, ERD, UI 가이드

---

## ➖ 정리/제거 추천
- `utils/validators.ts` → `lib/validations.ts` 병합
- `store/useColumnStore.ts` → config로 이동
- `hooks/usePersistedState.ts` → Zustand persist 미들웨어로 대체 가능
