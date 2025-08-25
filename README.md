---
category: root
priority: 5
type: readme
tags: ["main", "overview", "classflow", "educanvas"]
version: "v2.0"
last_updated: "2025-08-25"
status: active
frequency: weekly
project_phase: "v2-renewal"
related_files:
  - "CLAUDE.md"
  - "docs/index.md"
  - "docs/core/development_plan.md"
purpose: "EduCanvas 프로젝트 메인 소개 및 설정 가이드"
audience: ["developers", "stakeholders", "new-users"]
framework: ["nextjs", "supabase", "shadcn-ui"]
---

# 🎓 EduCanvas

**혁신적인 드래그앤드롭 기반 학원 관리 시스템**

EduCanvas는 교육기관(학원/academy)을 위한 차세대 학생 관리 시스템으로, 업계 최초의 **ClassFlow** 드래그앤드롭 인터페이스를 통해 직관적이고 효율적인 학생 관리를 제공합니다.

> **현재 단계**: v1→v2 UI/UX 완전 리뉴얼 진행 중 (2025-08-26 시작)

---

## ✨ 주요 특징

### 🎯 **ClassFlow** - 킬러 기능
- **60fps 드래그앤드롭**: 1000+ 학생 데이터에서도 부드러운 성능
- **실시간 반영**: 학생 이동 시 즉시 데이터베이스 업데이트
- **시각적 피드백**: 직관적인 드롭존과 상태 표시

### 🚀 **고성능 아키텍처**
- **Next.js 15**: 최신 App Router와 React 19 Server Components
- **Supabase**: PostgreSQL 기반 실시간 데이터베이스
- **TailwindCSS 4**: 최적화된 디자인 시스템
- **TypeScript Strict**: 100% 타입 안전성

### 🛡️ **엔터프라이즈급 기능**
- **RBAC**: admin/instructor/staff/viewer 권한 체계
- **복합 결제 시스템**: 5가지 수강권 타입 지원
- **고급 급여 정책**: 7가지 급여 계산 방식
- **WCAG 2.1 AA**: 완벽한 접근성 준수

---

## 🏗️ 기술 스택

### **Frontend**
- **Next.js 15** - React 메타 프레임워크
- **React 19** - 최신 React with Server Components
- **TypeScript** - 타입 안전성
- **TailwindCSS 4** - 유틸리티 기반 스타일링

### **UI/UX**
- **@dnd-kit** - 고성능 드래그앤드롭
- **Headless UI** - 접근성 준수 컴포넌트
- **Heroicons** - 일관된 아이콘 시스템
- **react-window** - 대용량 데이터 가상화

### **Backend & Database**
- **Supabase** - PostgreSQL + 실시간 구독
- **Row Level Security** - 데이터 보안
- **Database Schema v2.0** - 최적화된 스키마

### **상태 관리 & 폼**
- **Zustand** - 경량 상태 관리
- **React Hook Form** - 고성능 폼 처리
- **Zod** - 스키마 검증

### **개발 도구**
- **ESLint** - 코드 품질 관리
- **Sentry** - 에러 추적
- **Supabase CLI** - 데이터베이스 관리

---

## 🚀 빠른 시작

### 1. 프로젝트 클론
```bash
git clone https://github.com/your-org/educanvas.git
cd educanvas
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
```bash
cp .env.example .env.local
# .env.local 파일을 편집하여 Supabase 키 설정
```

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

---

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (admin)/           # 관리자 레이아웃 그룹
│   ├── (auth)/            # 인증 레이아웃 그룹 (login/register)
│   ├── admin/             # 관리자 페이지
│   └── api/               # API Routes
├── components/            # 재사용 가능한 컴포넌트
│   ├── auth/              # 인증 컴포넌트
│   ├── classes/           # 반 관리 컴포넌트  
│   ├── students/          # 학생 관리 컴포넌트
│   └── ui/                # 기본 UI 컴포넌트
│       └── classflow/     # ClassFlow 전용 컴포넌트
├── hooks/                 # 커스텀 React 훅
├── lib/                   # 외부 서비스 설정
├── store/                 # Zustand 상태 관리
├── types/                 # TypeScript 타입 정의
└── utils/                 # 유틸리티 함수
```

---

## 🎯 핵심 기능

### 📊 **ClassFlow 드래그앤드롭**
```typescript
import { ClassContainer, StudentCard } from '@/components/ui';

<ClassContainer
  classData={classInfo}
  students={students}
  onStudentClick={handleStudentClick}
  variant="grid"
/>
```

### 📝 **폼 처리**
```typescript
import { Button, Input } from '@/components/ui';
import { useForm } from 'react-hook-form';

<Input
  label="학생 이름"
  {...register('name')}
  error={errors.name?.message}
  required
/>
```

### 📈 **데이터 테이블**
```typescript
import { Table } from '@/components/ui';

<Table
  data={students}
  columns={columns}
  virtualized
  selectable
  height={400}
/>
```

---

## 🛠️ 개발 가이드

### 스크립트 명령어
```bash
npm run dev          # 개발 서버 실행 (Turbopack)
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버 실행
npm run lint         # ESLint 실행
```

### 환경 변수
주요 환경 변수들:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 공개 키
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase 서비스 키 (서버 전용)
- `NEXTAUTH_SECRET` - 인증 암호화 키

### 코딩 표준
- **TypeScript Strict 모드** 필수
- **ESLint 규칙** 엄격 준수
- **React.memo** 성능 최적화
- **WCAG 2.1 AA** 접근성 준수

---

## 🧪 테스트

### 개발 환경 테스트
```bash
# 개발 서버 실행
npm run dev

# 빌드 테스트
npm run build

# 타입 체크
npx tsc --noEmit
```

### 성능 테스트
- **60fps 보장**: ClassFlow 드래그앤드롭
- **1000+ 학생**: 가상화를 통한 대용량 데이터 처리
- **실시간 업데이트**: Supabase 실시간 구독

---

## 📚 문서

### 프로젝트 문서
- [기능 요구서](docs/기능요구서.md) - 상세 기능 명세
- [개발 계획](docs/development_plan.md) - 10주 MVP 개발 로드맵
- [데이터베이스 설계](docs/database_design.md) - Schema v2.0 문서
- [API 명세서](docs/api_specification.md) - RESTful API 문서

### 개발 가이드
- [코딩 표준](docs/coding-standards.md) - 필수 개발 가이드라인
- [컴포넌트 가이드](src/components/ui/index.ts) - UI 컴포넌트 사용법

### 프로젝트 관리
- [백로그](docs/project/BACKLOG.md) - 전체 작업 목록
- [스프린트](docs/project/SPRINTS/) - 스프린트 계획
- [작업 명세](docs/project/TASKS/) - 개별 작업 상세

---

## 🚀 배포

### Vercel 배포 (권장)
1. Vercel에 프로젝트 연결
2. 환경 변수 설정
3. 자동 배포 확인

### 기타 플랫폼
- **Netlify**: Next.js 지원
- **Railway**: PostgreSQL 포함
- **Docker**: 컨테이너 배포

---

## 🤝 기여하기

### 개발 환경 설정
1. 저장소 포크
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

### 코드 리뷰 기준
- TypeScript 타입 안전성
- 성능 최적화 (60fps 보장)
- 접근성 준수 (WCAG 2.1 AA)
- 테스트 커버리지 80%+

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 🌟 로드맵

### 🎯 **MVP (2025년 10월)**
- ClassFlow 드래그앤드롭 완성
- 기본 학생/강사 관리
- 결제 시스템 구축
- RBAC 권한 관리

### 🚀 **Phase 2 (2025년 말)**
- 고급 분석 대시보드
- 모바일 앱
- 외부 서비스 연동
- AI 기반 추천 시스템

### 💡 **Phase 3 (2026년)**
- 멀티 테넌시 지원
- 화상 수업 통합
- 고급 리포팅
- 마케팅 자동화

---

## 📞 지원

문제가 발생하거나 질문이 있으시면:
- **Issues**: GitHub Issues를 통해 버그 리포트
- **Discussions**: 기능 제안 및 아이디어 논의
- **Email**: support@educanvas.io
- **Discord**: EduCanvas 커뮤니티

---

**Built with ❤️ for Education**

EduCanvas는 교육의 디지털 혁신을 목표로 합니다.