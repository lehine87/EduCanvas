# Sonner 컴포넌트 다크모드 색상 수정 매뉴얼

> **문제**: Sonner 버튼이 다크모드에서 흰색으로 표시되는 버그  
> **원인**: CSS 클래스 중복 정의로 인한 우선순위 문제  
> **해결**: Sonner 컴포넌트 내 CSS 오버라이드 또는 페이지별 수정

## 🛠️ 방법 1: Sonner 컴포넌트 수정 (권장)

**파일**: `src/components/ui/sonner.tsx`

컴포넌트 내부에 `styled-jsx` 오버라이드 추가:

```tsx
return (
  <>
    {/* Sonner 전용 CSS 오버라이드 */}
    <style jsx global>{`
      .bg-success-500 {
        background-color: var(--color-success-500) !important;
      }
      .text-success-contrast {
        color: var(--color-neutral-50) !important;
      }
      .dark .text-success-contrast {
        color: var(--color-success-50) !important;
      }
      
      /* 다른 의미적 색상들도 동일 패턴으로... */
    `}</style>
    
    <Sonner {...props} />
  </>
)
```

## 🛠️ 방법 2: 페이지별 수정 (임시방편)

Sonner 버튼을 사용하는 페이지에서 다음 패턴 적용:

### 기본 패턴

```tsx
// ❌ 다크모드에서 흰색으로 표시됨
<Button className="bg-success-500 text-success-contrast">
  버튼
</Button>

// ✅ 강제 CSS 변수 사용
<Button 
  className="bg-success-500 text-success-contrast"
  style={{
    backgroundColor: 'var(--color-success-500)',
    color: 'var(--color-neutral-50)', // 라이트모드
  }}
>
  버튼
</Button>
```

### 다크모드 대응 패턴

```tsx
import { useTheme } from 'next-themes'

const { theme } = useTheme()
const isDark = theme === 'dark'

<Button 
  className="bg-success-500 text-success-contrast"
  style={{
    backgroundColor: 'var(--color-success-500)',
    color: isDark ? 'var(--color-success-50)' : 'var(--color-neutral-50)',
  }}
>
  버튼
</Button>
```

### 페이지별 CSS 오버라이드

```tsx
export default function YourPage() {
  return (
    <div>
      <style jsx>{`
        .sonner-fix.bg-success-500 {
          background-color: var(--color-success-500) !important;
        }
        .sonner-fix.text-success-contrast {
          color: var(--color-neutral-50) !important;
        }
        .dark .sonner-fix.text-success-contrast {
          color: var(--color-success-50) !important;
        }
      `}</style>
      
      <Button className="sonner-fix bg-success-500 text-success-contrast">
        버튼
      </Button>
    </div>
  )
}
```

## 📋 지원되는 색상 클래스

### 의미적 색상
- `bg-success-500` / `text-success-contrast`
- `bg-warning-500` / `text-warning-contrast`  
- `bg-error-500` / `text-error-contrast`
- `bg-info-500` / `text-info-contrast`

### 브랜드 색상
- `bg-educanvas-500` / `text-educanvas-contrast`
- `bg-wisdom-500` / `text-wisdom-contrast`
- `bg-growth-500` / `text-growth-contrast`

## 🎯 문제 해결 검증

1. **라이트모드**: 모든 버튼이 의도된 색상으로 표시
2. **다크모드**: 버튼 색상이 올바르게 전환
3. **CSS 디버깅**: 브라우저 개발자 도구에서 `!important` 규칙 확인

## ⚠️ 주의사항

- `design-tokens.css` 파일은 절대 수정하지 말 것
- 가능한 방법 1(컴포넌트 수정)을 우선 사용
- 방법 2는 긴급한 경우에만 사용

---

**최종 업데이트**: 2025-08-27  
**적용 파일**: `src/components/ui/sonner.tsx`