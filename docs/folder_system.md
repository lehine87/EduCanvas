/src
├── app/                      # Next.js App Router 페이지
│   ├── dashboard/            # 통합 대시보드
│   ├── students/             # 학생 관리 모듈
│   ├── classes/              # 클래스 관리 모듈
│   ├── attendance/           # 출결 관리 모듈
│   ├── consultations/        # 상담 관리 모듈
│   ├── instructors/          # 강사 관리 모듈
│   ├── payments/              # 수납 관리 모듈
│   ├── dnd-class-students/   # 반-학생 DnD 관리 모듈 (킬러 콘텐츠)
│   └── settings/             # 시스템 설정
│
├── components/               # UI 컴포넌트
│   ├── layout/               # MainLayout, PageLayout
│   ├── ui/                   # Button, Card, Modal, Table 등
│   ├── forms/                # FormInput, Select, DatePicker 등
│   └── charts/               # 출결·수납·상담 통계 차트
│
├── features/                  # 비즈니스 로직 단위 모듈
│   ├── students/              # 학생 관리 로직 + hooks + API
│   ├── classes/               # 클래스 관리 로직 + hooks + API
│   ├── attendance/            # 출결 관리 로직
│   ├── consultations/         # 상담 관리 로직
│   ├── instructors/           # 강사 관리 로직
│   ├── payments/               # 수납 관리 로직
│   └── dnd/                   # 드래그앤드롭 로직
│
├── lib/                       # 공통 유틸리티
│   ├── api/                   # fetcher, API 클라이언트
│   ├── db/                    # DB 쿼리 함수 (Supabase/Prisma)
│   ├── auth/                  # 인증·인가
│   ├── validations/           # Zod/Yup 스키마
│   └── hooks/                 # 공통 React Hooks
│
├── store/                     # Zustand 전역 상태 관리
│   ├── studentsStore.ts
│   ├── classesStore.ts
│   ├── attendanceStore.ts
│   └── ...
│
└── tests/                     # 테스트 코드 (Jest/Playwright)
