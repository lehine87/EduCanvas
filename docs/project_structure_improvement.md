# 신규 프로젝트 폴더 구조 개선안

## 📌 개선 목표
- 모듈화와 계층화를 강화하여 유지보수와 확장성 확보
- 페이지 → 비즈니스 로직 → 상태 → UI 흐름 명확화
- 공통 자원 재사용 극대화

---

## 📂 신규 구조 제안

```
src/
├── app/                # Next.js 페이지
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
├── hooks/              # 공통 훅
├── types/              # 타입 정의
├── utils/              # 공통 유틸리티
├── tests/              # 테스트 코드 (unit, integration, e2e)
└── docs/               # 개발 문서
```

---

## ✅ 유지할 부분
- `components/ui` : 기본 UI 컴포넌트
- `store` : Zustand 상태관리
- `lib/supabase.ts` + `lib/auth.ts` : DB·인증 설정
- `hooks` : 커스텀 훅 폴더
- `types` : 모듈별 타입 정의
- `utils` : 포맷터·상수·검증 함수

---

## ➕ 추가할 부분
1. **features/** : 비즈니스 로직 계층 (CRUD, 서비스 로직, 모듈별 훅)
2. **config/** : 환경 상수, 메뉴, 테마, 컬럼 정의
3. **tests/** : 유닛·통합·E2E 테스트 코드
4. **docs/** : API 명세, ERD, UI 가이드

---

## ➖ 정리/제거 추천
1. **`utils/validators.ts` vs `lib/validations.ts`**
   - 유효성 검증 위치 통합
2. **`store/useColumnStore.ts`**
   - 컬럼 설정이 고정값이면 config로 이동
3. **`hooks/usePersistedState.ts`**
   - Zustand persist 미들웨어로 대체 가능
