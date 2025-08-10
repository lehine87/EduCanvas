# EduCanvas UI 교체 가능 구조 가이드 v2.0

## 🎯 목표
현재는 Tailwind UI 템플릿으로 빠르게 개발하고, 추후 내부 디자이너가 만든 UI로 쉽게 교체할 수 있도록 구조 설계.

## ✅ 완료 상태 (2025-08-09)
모든 핵심 UI 컴포넌트와 ClassFlow 전용 컴포넌트가 완성되어 UI 교체 준비가 완료되었습니다.

---

## 1. UI와 로직 철저 분리

### 원칙
- **UI 컴포넌트**: 오직 렌더링만 담당 (`props`로 데이터와 이벤트를 받음)
- **비즈니스 로직**: `features/` 또는 `store/`에서만 처리
- **TypeScript 타입 안전성**: 모든 컴포넌트 완전한 타입 정의
- **60fps 성능 보장**: ClassFlow 컴포넌트 최적화 완료

예:
```tsx
// components/ui/Button.tsx
type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
};

export const Button = ({ children, onClick, variant = 'primary', size = 'md', disabled = false, className = '' }: ButtonProps) => {
  const base = 'rounded px-4 py-2 font-semibold';
  const variants = {
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-200 text-black',
  };
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
};
```

---

## 2. 디렉토리 구조 설계

```
src/
├── components/
│   ├── ui/              # 현재 Tailwind UI 기반 컴포넌트
│   ├── students/        # 학생 모듈 전용 UI (로직 X)
│   ├── classes/
│   ├── attendance/
│   ├── ...
├── features/
│   ├── students/
│   │   ├── hooks.ts     # 로직 훅
│   │   ├── service.ts   # API/비즈니스 로직
│   ├── classes/
│   ├── ...
└── store/               # Zustand 상태 관리
```

> 추후 UI 교체 시 `components/ui/`만 변경하면 됨.

---

## 3. 전역 스타일 Tailwind Config로 관리

```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      primary: '#1C64F2',
      secondary: '#F3F4F6',
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    },
  },
}
```
- 브랜드 색상, 폰트, 간격 등을 여기서 관리하면 교체 시 수정 범위 최소화.

---

## 4. 교체 시나리오

| 시점 | 동작 | 설명 |
|------|------|------|
| MVP 초기 | `components/ui/`는 Tailwind UI 템플릿 기반 | 빠른 개발 |
| 디자이너 투입 | `components/ui/` 내부 스타일만 변경 | 로직 변경 없음 |
| 전체 커스터마이징 | `components/ui-v2/` 폴더 생성 후 새 UI 구성 → `import` 경로 교체 | 병렬 작업 가능 |

---

## 5. 권장 개발 플로우

1. **UI 인터페이스 정의** → props 타입 고정
2. **Tailwind UI 적용** → 빠르게 기능 완성
3. **로직은 features/와 store에만 작성**
4. **UI 교체 필요 시** → UI 폴더만 교체 또는 버전 폴더 생성

---

## 📌 핵심 요약
- ✅ UI와 로직 완전 분리 완료
- ✅ `components/ui/`만 교체하면 디자인 변경 가능
- ✅ 강화된 Tailwind Config로 전역 디자인 토큰 관리
- ✅ 표준화된 Props 인터페이스로 장기 유지보수 보장
- ✅ ClassFlow 전용 컴포넌트 (60fps 최적화)
- ✅ 완전한 TypeScript 타입 안전성
- ✅ 체계적인 컴포넌트 export 구조

## 🚀 구현 완료 항목

### 핵심 UI 컴포넌트
- `Button.tsx`: 7가지 variant, 5가지 size, 로딩/아이콘 지원
- `Input.tsx` & `Textarea.tsx`: 완전한 validation, error state 처리
- `Modal.tsx` & `ConfirmModal.tsx`: 접근성 준수, 재사용 가능 구조
- `Table.tsx`: 정렬, 필터링, 가상화 지원

### ClassFlow 전용 컴포넌트
- `DragHandle.tsx`: 3가지 variant, 60fps 최적화
- `StudentCard.tsx`: 완전한 학생 정보 표시, 드래그 상태 지원
- `ClassContainer.tsx`: 용량 관리, 드롭존 시각화, 3가지 layout
- `LoadingPlaceholder.tsx`: 4가지 skeleton type, 다양한 애니메이션

### 디자인 시스템 강화
- 완전한 색상 팔레트 (50-900 단계)
- 커스텀 spacing, shadow, border-radius 토큰
- 8가지 애니메이션 타입과 keyframes
- EduCanvas 전용 shadow 세트

### 타입 안전성
- `types.ts`: 70+ 표준화된 인터페이스
- 모든 컴포넌트 완전한 JSDoc 문서화
- React.memo 최적화로 렌더링 성능 보장

## 🔄 UI 교체 시나리오 (업데이트됨)

| 시점 | 동작 | 설명 |
|------|------|------|
| **현재** | 완전한 UI 시스템 구축 완료 | 모든 컴포넌트 준비 완료 |
| **MVP 개발** | `@/components/ui`에서 import 사용 | 일관성 있는 UI/UX |
| **디자이너 투입** | `components/ui/` 내부만 수정 | 로직 변경 없이 스타일만 교체 |
| **전체 리브랜딩** | `components/ui-v2/` 생성 후 index.ts 교체 | 무중단 UI 교체 가능 |

## 💡 사용 방법

```tsx
// 기본 사용법
import { Button, Input, Modal } from '@/components/ui';

// ClassFlow 사용법
import { StudentCard, ClassContainer } from '@/components/ui';

// 그룹 import (선택사항)
import { BasicComponents, ClassFlowComponents } from '@/components/ui';
```
