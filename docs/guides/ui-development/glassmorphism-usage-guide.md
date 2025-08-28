# Glassmorphism 사용 가이드

**작성일**: 2025-08-27  
**버전**: v1.0  
**상태**: ✅ T-V2-003 완료  
**적용**: EduCanvas v2 UI 시스템

## 📋 개요

EduCanvas에서 glassmorphism 효과를 올바르게 구현하기 위한 완전 가이드입니다. 
backdrop-filter와 Tailwind CSS를 활용한 최적화된 방법을 제공합니다.

## ✅ 올바른 Glassmorphism 구현

### 기본 패턴 (완벽한 설정)
```jsx
<div className="backdrop-blur-sm bg-white/30 dark:bg-black/30 border border-white/20 shadow-xl dark:shadow-none">
  {/* 내용 */}
</div>
```

### 간단한 버전 (그림자 없음)
```jsx
<div className="backdrop-blur-sm bg-white/30 dark:bg-black/30 border border-white/20">
  {/* 내용 */}
</div>
```

## 🔧 핵심 요소 분석

### `backdrop-blur-sm`
- **블러**: blur(8px)
- **채도**: saturate(150%)
- **커스터마이징**: `src/styles/design-tokens.css`에서 수정 가능
- **브라우저**: 모든 모던 브라우저 지원

### 배경 설정
```jsx
bg-white/30 dark:bg-black/30
```
- **라이트 모드**: 30% 불투명도 흰색 배경
- **다크 모드**: 30% 불투명도 검은색 배경
- **자동 전환**: Tailwind 다크 모드 시스템

### 테두리
```jsx
border border-white/20
```
- **색상**: 20% 불투명도 흰색 테두리
- **두께**: 1px (기본값)
- **효과**: 섬세한 경계 구분

### 그림자 (선택사항)
```jsx
shadow-xl dark:shadow-none
```
- **라이트 모드**: 큰 그림자 효과
- **다크 모드**: 그림자 제거
- **용도**: 흰 배경에서 요소 구분

## 🎯 실제 사용 예시

### 모달/다이얼로그
```jsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
  <div className="backdrop-blur-sm bg-white/30 dark:bg-black/30 border border-white/20 shadow-xl dark:shadow-none rounded-xl p-8 max-w-md">
    <h2 className="text-xl font-bold mb-4">제목</h2>
    <p className="mb-4">내용</p>
    <button className="...">확인</button>
  </div>
</div>
```

### 카드 컴포넌트
```jsx
<div className="backdrop-blur-sm bg-white/30 dark:bg-black/30 border border-white/20 rounded-lg p-6">
  <h3 className="font-semibold mb-2">카드 제목</h3>
  <p className="text-sm">카드 내용</p>
</div>
```

### 네비게이션 바
```jsx
<nav className="backdrop-blur-sm bg-white/30 dark:bg-black/30 border-b border-white/20 px-6 py-4">
  <div className="flex items-center justify-between">
    <div className="font-bold">로고</div>
    <div className="space-x-4">메뉴</div>
  </div>
</nav>
```

## ❌ 주의사항 및 금지 사항

### 커스텀 CSS 클래스 사용 금지
```jsx
// ❌ 작동하지 않음
<div className="custom-glass-effect">

// ❌ backdrop-filter가 적용되지 않음
.custom-glass {
  backdrop-filter: blur(10px);
}
```

### 인라인 스타일 사용 금지
```jsx
// ❌ 작동하지 않음
<div style={{ backdropFilter: 'blur(10px)' }}>

// ❌ 다크 모드 미지원
<div style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
```

### Shadow 충돌 주의
```jsx
// ❌ 커스텀 box-shadow는 backdrop-filter와 충돌할 수 있음
<div className="backdrop-blur-sm" style={{ boxShadow: '...' }}>

// ✅ Tailwind 내장 shadow 클래스 사용
<div className="backdrop-blur-sm shadow-xl dark:shadow-none">
```

## 🔬 기술적 배경

### 작동 원리
1. **Tailwind 내장 클래스**: `backdrop-blur-sm` 등의 클래스를 design-tokens.css에서 덮어씀
2. **브라우저 호환성**: `-webkit-backdrop-filter` 접두사 자동 포함
3. **성능 최적화**: isolation과 stacking context 자동 처리

### 왜 커스텀 CSS는 작동하지 않는가?
- **중첩 요소 문제**: Chrome의 backdrop-filter 제한사항
- **Stacking Context**: Tailwind 내장 클래스만 올바른 레이어링 보장
- **브라우저 버그**: 커스텀 구현 시 다양한 호환성 문제 발생

## 🛠️ 커스터마이징

### 블러 강도 조절
`src/styles/design-tokens.css` 파일에서:
```css
.backdrop-blur-sm {
  backdrop-filter: blur(8px) saturate(150%);
  -webkit-backdrop-filter: blur(8px) saturate(150%);
}
```

### 수정 가능한 값
- **blur()**: 블러 강도 (권장: 4px-12px)
- **saturate()**: 색상 채도 (권장: 120%-180%)

## 📚 관련 문서

- **색상 시스템**: `docs/guides/ui-development/darkmode-color-system-guide.md`
- **디자인 토큰**: `docs/guides/ui-development/design-tokens-usage.md`
- **Tailwind 가이드**: `docs/guides/ui-development/shadcn-ui-components-guide.md`

---

**💡 팁**: 이 가이드의 패턴을 복사해서 사용하면 100% 작동이 보장됩니다!