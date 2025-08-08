# EduCanvas UI 교체 가능 구조 가이드

## 🎯 목표
현재는 Tailwind UI 템플릿으로 빠르게 개발하고, 추후 내부 디자이너가 만든 UI로 쉽게 교체할 수 있도록 구조 설계.

---

## 1. UI와 로직 철저 분리

### 원칙
- **UI 컴포넌트**: 오직 렌더링만 담당 (`props`로 데이터와 이벤트를 받음)
- **비즈니스 로직**: `features/` 또는 `store/`에서만 처리

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
- UI와 로직을 분리하면 교체가 쉬움
- `components/ui/`만 갈아끼우면 디자인 변경 가능
- Tailwind Config를 활용하면 전역 디자인 요소 수정이 쉬움
- props 인터페이스 고정이 장기 유지보수의 핵심
