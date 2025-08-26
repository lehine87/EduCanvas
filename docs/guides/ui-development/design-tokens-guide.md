# EduCanvas v2 Design Tokens 완전 가이드

**버전**: v2.0  
**작성일**: 2025-08-26  
**관련 태스크**: T-V2-002  
**테스트 페이지**: `/test/design-tokens`

---

## 📋 개요

EduCanvas v2 디자인 토큰 시스템은 일관성 있는 UI/UX를 위한 통합 설계 언어입니다. shadcn/ui와 완벽 호환되며, Tailwind CSS 4와 통합되어 개발 효율성과 디자인 일관성을 동시에 제공합니다.

### 🎯 핵심 목표
- **브랜드 아이덴티티 강화**: EduCanvas 교육 테마 색상 시스템
- **접근성 준수**: WCAG 2.1 AA 수준 색상 대비
- **개발 효율성**: Tailwind CSS와 shadcn/ui 완벽 통합
- **확장성**: 새로운 토큰 쉽게 추가 가능한 구조

---

## 🎨 색상 시스템 (Color Tokens)

### EduCanvas 브랜드 색상
교육과 학습을 상징하는 따뜻하고 신뢰감 있는 파란색 계열

```css
/* Primary Brand Color - EduCanvas Blue */
--color-educanvas-50: oklch(0.98 0.02 220);   /* 매우 밝은 파란색 */
--color-educanvas-500: oklch(0.58 0.20 220);  /* 메인 브랜드 색상 */
--color-educanvas-950: oklch(0.10 0.08 220);  /* 매우 어두운 파란색 */
```

**사용 예시:**
```jsx
<Button className="bg-educanvas-500 hover:bg-educanvas-600">
  등록하기
</Button>

<div className="text-educanvas-700 border-educanvas-200">
  브랜드 강조 요소
</div>
```

### 교육 테마 보조 색상

#### 지혜 (Wisdom) - 청록색 계열
지식과 통찰을 상징하는 청록색

```css
--color-wisdom-500: oklch(0.56 0.20 180);  /* 청록색 */
```

**활용:**
- 성취도 표시
- 학습 진도 시각화
- 지식 관련 아이콘

#### 성장 (Growth) - 녹색 계열
발전과 성장을 상징하는 녹색

```css
--color-growth-500: oklch(0.56 0.20 120);  /* 녹색 */
```

**활용:**
- 진전 상황 표시
- 개선 지표
- 성장 관련 데이터

### 의미적 색상 (Semantic Colors)

모든 상태와 피드백을 위한 표준 색상 팔레트

| 상태 | 색상 | Tailwind 클래스 | 용도 |
|------|------|----------------|------|
| 성공 | `success-500` | `bg-success-500` | 완료, 성공, 활성 상태 |
| 경고 | `warning-500` | `bg-warning-500` | 주의, 대기, 검토 필요 |
| 오류 | `error-500` | `bg-error-500` | 에러, 실패, 위험 상태 |
| 정보 | `info-500` | `bg-info-500` | 알림, 도움말, 안내 |

**사용 예시:**
```jsx
<Badge variant="success">활성</Badge>
<Badge variant="warning">대기</Badge>
<Badge variant="error">오류</Badge>
<Badge variant="info">정보</Badge>

<Alert className="border-warning-200 bg-warning-50">
  <AlertDescription>주의가 필요한 상황입니다.</AlertDescription>
</Alert>
```

---

## 📝 타이포그래피 시스템

### 폰트 패밀리

#### 본문용 폰트 (Sans-serif)
```css
--font-sans: 'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, 
             system-ui, Roboto, 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 
             'Noto Sans KR', 'Malgun Gothic', sans-serif;
```

#### 코드용 폰트 (Monospace)
```css
--font-mono: 'JetBrains Mono Variable', 'JetBrains Mono', 'Fira Code', 
             'SF Mono', Monaco, Inconsolata, 'Roboto Mono', Consolas, monospace;
```

### 타이포그래피 스케일

완전한 10단계 크기 체계로 모든 UI 요소를 커버

| 레벨 | Tailwind 클래스 | 크기 | 용도 | 예시 |
|------|----------------|------|------|------|
| Display | `text-6xl` | 64px (4rem) | 메인 타이틀, 히어로 | "EduCanvas 학원 관리" |
| H1 | `text-5xl` | 48px (3rem) | 페이지 제목 | "학생 관리 대시보드" |
| H2 | `text-4xl` | 36px (2.25rem) | 섹션 제목 | "수강 등록 현황" |
| H3 | `text-3xl` | 30px (1.875rem) | 서브 섹션 | "출석 관리" |
| H4 | `text-2xl` | 24px (1.5rem) | 컴포넌트 제목 | "학생 목록" |
| H5 | `text-xl` | 20px (1.25rem) | 소제목 | "필터 옵션" |
| Body Large | `text-lg` | 18px (1.125rem) | 중요 본문 | 강조된 설명문 |
| Body | `text-base` | 16px (1rem) | 기본 본문 | 일반 텍스트 |
| Small | `text-sm` | 14px (0.875rem) | 보조 텍스트 | 부가 정보 |
| Caption | `text-xs` | 12px (0.75rem) | 라벨, 캡션 | 메타데이터 |

**사용 예시:**
```jsx
<h1 className="text-5xl font-bold text-educanvas-600 leading-tight">
  학생 관리 시스템
</h1>

<p className="text-base leading-normal text-muted-foreground">
  효율적인 학원 운영을 위한 통합 관리 솔루션입니다.
</p>

<span className="text-xs text-muted-foreground leading-normal">
  마지막 업데이트: 2025-08-26
</span>
```

### 줄간격 (Line Height) 시스템

텍스트 종류별 최적화된 줄간격

| 클래스 | 비율 | 용도 | 적용 예시 |
|--------|------|------|----------|
| `leading-tight` | 1.2 | 제목, 헤딩 | 압축적인 제목 |
| `leading-snug` | 1.375 | 서브타이틀 | 부제목, 소제목 |
| `leading-normal` | 1.5 | 기본 본문 | 일반 문단 |
| `leading-relaxed` | 1.625 | 긴 텍스트 | 설명문, 가이드 |
| `leading-loose` | 1.75 | 여유로운 텍스트 | 여백이 많은 레이아웃 |

---

## 📏 간격 시스템 (Spacing Scale)

4px 기준의 일관된 간격 시스템

### 기본 스케일

| Tailwind | 값 | px | rem | 용도 |
|----------|----|----|-----|------|
| `space-1` | 4px | 4px | 0.25rem | 최소 간격 |
| `space-2` | 8px | 8px | 0.5rem | 작은 간격 |
| `space-4` | 16px | 16px | 1rem | **기본 간격** |
| `space-6` | 24px | 24px | 1.5rem | 중간 간격 |
| `space-8` | 32px | 32px | 2rem | 큰 간격 |
| `space-12` | 48px | 48px | 3rem | 섹션 간격 |
| `space-16` | 64px | 64px | 4rem | 블록 간격 |
| `space-24` | 96px | 96px | 6rem | 레이아웃 간격 |

### 컴포넌트별 간격 가이드

#### Form 컴포넌트
```jsx
<div className="space-y-6">  {/* 섹션 간 간격 */}
  <div className="space-y-3"> {/* 폼 필드 간 간격 */}
    <Label className="mb-1">  {/* 라벨-인풋 간격 */}
      학생 이름
    </Label>
    <Input className="p-3" /> {/* 내부 패딩 */}
  </div>
</div>
```

#### Card 컴포넌트
```jsx
<Card className="p-6">      {/* 카드 내부 패딩 */}
  <div className="space-y-4"> {/* 내용 간 간격 */}
    <h3>제목</h3>
    <p>내용</p>
    <div className="flex gap-2"> {/* 버튼 간 간격 */}
      <Button>확인</Button>
      <Button>취소</Button>
    </div>
  </div>
</Card>
```

---

## 🎭 반응형 디자인

### 브레이크포인트별 조정

```css
/* 모바일 (640px 미만) */
@media (max-width: 640px) {
  html { font-size: 14px; }    /* 폰트 크기 감소 */
  .student-card { padding: 12px; }  /* 패딩 감소 */
}

/* 태블릿 (641px - 1024px) */
@media (min-width: 641px) and (max-width: 1024px) {
  html { font-size: 15px; }    /* 약간 작은 폰트 */
}

/* 데스크탑 (1025px 이상) */
@media (min-width: 1025px) {
  html { font-size: 16px; }    /* 기본 크기 */
}

/* 대형 화면 (1400px 이상) */
@media (min-width: 1400px) {
  html { font-size: 17px; }    /* 큰 폰트 */
}
```

---

## 🌙 다크 모드 지원

### 자동 색상 전환

모든 디자인 토큰은 라이트/다크 모드에서 자동으로 최적화됩니다.

```css
/* 라이트 모드 */
:root {
  --color-background: var(--color-neutral-50);   /* 흰색 배경 */
  --color-foreground: var(--color-neutral-900);  /* 검은색 텍스트 */
  --color-primary: var(--color-educanvas-500);   /* 표준 브랜드 색상 */
}

/* 다크 모드 */
.dark {
  --color-background: var(--color-neutral-950);  /* 검은색 배경 */
  --color-foreground: var(--color-neutral-50);   /* 흰색 텍스트 */
  --color-primary: var(--color-educanvas-400);   /* 밝은 브랜드 색상 */
}
```

**사용법:**
```jsx
{/* 자동으로 테마에 맞춰 색상이 변경됩니다 */}
<div className="bg-background text-foreground border border-border">
  다크/라이트 모드 자동 지원
</div>
```

---

## 🛠️ 개발자 가이드

### 새로운 색상 토큰 추가

1. **CSS 변수 정의** (`src/styles/design-tokens.css`)
```css
--color-custom-500: oklch(0.60 0.15 150);  /* 새로운 색상 */
```

2. **Tailwind 설정 추가** (`tailwind.config.ts`)
```typescript
colors: {
  custom: {
    500: "var(--color-custom-500)",
  },
},
```

3. **사용**
```jsx
<div className="bg-custom-500 text-white">
  새로운 색상 적용
</div>
```

### 커스텀 유틸리티 클래스

자주 사용되는 패턴을 위한 유틸리티 클래스들

```css
/* 글래스 효과 */
.glass-effect {
  background: color-mix(in srgb, var(--color-background) 80%, transparent);
  backdrop-filter: blur(12px);
}

/* 그라데이션 배경 */
.gradient-primary {
  background: linear-gradient(135deg, var(--color-educanvas-500), var(--color-educanvas-600));
}

/* 텍스트 말줄임 */
.text-ellipsis-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
```

---

## 🔍 접근성 준수

### WCAG 2.1 AA 준수

모든 색상 조합은 4.5:1 이상의 명암 대비를 보장합니다.

**검증 도구:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Color Oracle](https://colororacle.org/) (색맹 시뮬레이션)

### 색맹 사용자 고려

- 색상만으로 정보를 전달하지 않음
- 아이콘과 텍스트로 보조 설명
- 충분한 명암 대비 유지

```jsx
{/* 좋은 예: 색상 + 아이콘 + 텍스트 */}
<Badge variant="success" className="flex items-center gap-1">
  <CheckIcon className="w-3 h-3" />
  완료
</Badge>

{/* 나쁜 예: 색상만으로 정보 전달 */}
<div className="bg-success-500 w-4 h-4" />
```

---

## 📊 성능 최적화

### CSS 변수 활용

런타임에서 효율적인 색상 변경과 메모리 사용량 최소화

```css
/* 효율적: CSS 변수 사용 */
.button {
  background-color: var(--color-primary);
  transition: background-color 200ms;
}

.button:hover {
  background-color: var(--color-primary-hover);
}
```

### 번들 크기 최적화

- 사용하지 않는 색상은 자동으로 트리 셰이킹
- CSS 변수를 통한 중복 제거
- Tailwind CSS Purge로 불필요한 스타일 제거

---

## 🧪 테스트 및 검증

### 테스트 페이지
`/test/design-tokens`에서 모든 디자인 토큰을 실시간으로 확인할 수 있습니다.

**테스트 항목:**
- ✅ 색상 팔레트 완전성
- ✅ 타이포그래피 스케일
- ✅ 간격 시스템 일관성  
- ✅ 다크/라이트 모드 전환
- ✅ 반응형 동작
- ✅ 접근성 준수

### 자동화 테스트

```bash
# TypeScript 타입 검증
npx tsc --noEmit --strict

# 빌드 테스트
npm run build

# 접근성 테스트 (추후 추가 예정)
npm run test:a11y
```

---

## 📚 참고 자료

### 디자인 시스템 참고
- [Material Design 3](https://m3.material.io/styles/color/system)
- [Ant Design Colors](https://ant.design/docs/spec/colors)
- [Chakra UI Theme](https://chakra-ui.com/docs/styling/theme)

### 접근성 가이드라인
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/)
- [Color Universal Design](https://jfly.uni-koeln.de/color/)

### 한글 타이포그래피
- [Pretendard Font](https://cactus.tistory.com/306)
- [한글 웹 타이포그래피](https://designcompass.org/typo)

---

## 🔄 버전 히스토리

### v2.0 (2025-08-26) - 초기 릴리스
- EduCanvas 브랜드 색상 시스템 구축
- 교육 테마 보조 색상 (지혜, 성장) 추가
- 10단계 타이포그래피 스케일 완성
- 4px 기준 간격 시스템 구축
- shadcn/ui 완벽 호환성 확보
- WCAG 2.1 AA 접근성 준수
- 다크/라이트 모드 완전 지원

---

**문서 작성자**: Frontend Team  
**최종 검토**: PM + Design Team  
**다음 업데이트**: T-V2-003 작업 시 필요에 따라 확장