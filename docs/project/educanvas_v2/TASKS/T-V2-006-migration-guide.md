# T-V2-006: v1/v2 컴포넌트 호환성 매핑 및 Migration 가이드

**작업 ID**: T-V2-006  
**상태**: TODO  
**우선순위**: P0 (핵심 필수)  
**예상 작업 시간**: 1.0d (8시간)  
**목표 기한**: 2025-09-01  
**스프린트**: S-V2-01  
**담당**: Lead Dev  
**의존성**: T-V2-001~T-V2-005 완료 필요

---

## 📋 작업 개요

### 목적
v1에서 v2로의 안정적이고 점진적인 마이그레이션을 위해 기존 v1 컴포넌트와 새로운 v2 (shadcn/ui) 컴포넌트 간의 완전한 호환성 매핑 테이블을 작성하고, 단계적 마이그레이션 전략을 수립합니다.

### 핵심 목표
1. **완벽한 컴포넌트 매핑 테이블** 작성 (v1 → v2 1:1 대응)
2. **점진적 마이그레이션 전략** 수립 (Zero Downtime)
3. **자동 마이그레이션 도구** 개발 (코드 변환 스크립트)
4. **호환성 레이어** 구축 (v1/v2 공존 가능)

---

## 🎯 작업 범위

### 1. 컴포넌트 인벤토리 조사 (2시간)

#### v1 컴포넌트 전수 조사
```typescript
// 조사 대상 디렉터리
src/components/v1/
  ├── common/        // 공통 UI 컴포넌트
  ├── forms/         // 폼 관련 컴포넌트
  ├── layout/        // 레이아웃 컴포넌트
  ├── modals/        // 모달 컴포넌트
  └── features/      // 기능별 전용 컴포넌트
```

#### 조사 항목
- [ ] 컴포넌트 이름 및 경로
- [ ] Props 인터페이스
- [ ] 의존성 관계
- [ ] 사용 빈도 (검색으로 확인)
- [ ] 복잡도 레벨 (Low/Medium/High)

### 2. v1→v2 매핑 테이블 작성 (3시간)

#### 매핑 테이블 구조
```markdown
| v1 Component | v2 Component | Props 변경사항 | 마이그레이션 난이도 | 비고 |
|--------------|--------------|----------------|-------------------|------|
| Button       | Button       | variant 추가    | Low              | 직접 교체 가능 |
| Input        | Input        | 호환            | Low              | 직접 교체 가능 |
| Modal        | Dialog       | 구조 변경       | Medium           | 래퍼 필요 |
| Table        | DataTable    | 완전 재구성     | High             | 단계적 전환 |
```

#### 매핑 카테고리
1. **직접 교체 가능** (Low): Props 100% 호환
2. **부분 수정 필요** (Medium): Props 매핑 필요
3. **래퍼 컴포넌트 필요** (High): 호환성 레이어 구축
4. **완전 재작성 필요** (Critical): 새로운 패러다임

### 3. 마이그레이션 전략 문서 (2시간)

#### Phase별 전환 계획
```typescript
// Phase 1: Core Components (Week 1)
const phase1Components = [
  'Button', 'Input', 'Card', 'Badge', 'Label'
];

// Phase 2: Form Components (Week 2)
const phase2Components = [
  'Form', 'Select', 'Checkbox', 'Radio', 'Switch'
];

// Phase 3: Complex Components (Week 3-4)
const phase3Components = [
  'DataTable', 'Dialog', 'Sheet', 'Tabs', 'Calendar'
];

// Phase 4: Feature Components (Week 5-6)
const phase4Components = [
  'ClassFlow', 'StudentCard', 'Dashboard Widgets'
];
```

#### 우선순위 기준
1. **사용 빈도**: 가장 많이 사용되는 컴포넌트 우선
2. **의존성**: 다른 컴포넌트가 의존하는 기본 컴포넌트 우선
3. **복잡도**: 간단한 컴포넌트부터 복잡한 컴포넌트로
4. **비즈니스 임팩트**: 핵심 기능 관련 컴포넌트 우선

### 4. 호환성 레이어 개발 (1시간)

#### 호환성 래퍼 패턴
```typescript
// src/components/compat/Button.tsx
import { Button as V1Button } from '@/components/v1/Button';
import { Button as V2Button } from '@/components/ui/button';

interface CompatButtonProps {
  version?: 'v1' | 'v2';
  // 공통 Props
}

export const Button = ({ version = 'v2', ...props }: CompatButtonProps) => {
  if (version === 'v1') {
    return <V1Button {...mapPropsToV1(props)} />;
  }
  return <V2Button {...mapPropsToV2(props)} />;
};
```

#### Feature Flag 시스템
```typescript
// src/config/features.ts
export const featureFlags = {
  useV2Components: {
    button: true,
    input: true,
    modal: false,  // 아직 v1 사용
    table: false,  // 아직 v1 사용
  }
};
```

---

## 📊 작업 산출물

### 필수 산출물
1. **컴포넌트 매핑 스프레드시트** (`docs/migration/component-mapping.xlsx`)
   - 100+ 컴포넌트 완전 매핑
   - Props 변경사항 상세 기록
   - 마이그레이션 난이도 평가

2. **마이그레이션 가이드 문서** (`docs/migration/v1-to-v2-guide.md`)
   - 단계별 전환 계획
   - 컴포넌트별 상세 가이드
   - 트러블슈팅 가이드

3. **자동 변환 스크립트** (`scripts/migrate-components.ts`)
   ```bash
   npm run migrate:component Button
   # v1 Button 사용처를 v2 Button으로 자동 변환
   ```

4. **호환성 레이어 컴포넌트** (`src/components/compat/`)
   - 주요 컴포넌트 래퍼
   - Props 매핑 유틸리티
   - Feature Flag 통합

### 선택 산출물
- **Visual Regression Test** 설정
- **Storybook 마이그레이션** 가이드
- **성능 비교 리포트**

---

## ✅ 완료 기준

### 기능적 요구사항
- [ ] 모든 v1 컴포넌트 조사 완료 (100%)
- [ ] v1→v2 매핑 테이블 100% 완성
- [ ] 최소 20개 핵심 컴포넌트 호환성 레이어 구축
- [ ] 자동 마이그레이션 스크립트 작동 확인

### 품질 요구사항
- [ ] TypeScript 타입 100% 호환성 보장
- [ ] 기존 테스트 100% 통과
- [ ] 성능 저하 없음 (±5% 이내)
- [ ] 접근성 기준 유지 또는 개선

### 문서화 요구사항
- [ ] 컴포넌트별 마이그레이션 가이드 작성
- [ ] 트러블슈팅 FAQ 10개 이상
- [ ] 코드 예제 각 패턴별 3개 이상

---

## 🚧 리스크 및 대응 방안

### 기술적 리스크

#### 1. Props 인터페이스 비호환성
- **리스크**: v1과 v2의 Props 구조가 근본적으로 다름
- **대응**: 매핑 함수 및 어댑터 패턴 적용
```typescript
const mapV1PropsToV2 = (v1Props: V1Props): V2Props => {
  return {
    variant: v1Props.type === 'primary' ? 'default' : 'outline',
    size: v1Props.large ? 'lg' : 'default',
    // ... 매핑 로직
  };
};
```

#### 2. 스타일링 충돌
- **리스크**: CSS-in-JS vs Tailwind 충돌
- **대응**: CSS 격리 및 우선순위 관리
```css
/* v1 컴포넌트는 .v1-compat 래퍼 내부에서만 작동 */
.v1-compat {
  /* v1 스타일 격리 */
}
```

#### 3. 상태 관리 차이
- **리스크**: Controlled vs Uncontrolled 컴포넌트 차이
- **대응**: 상태 관리 래퍼 제공

### 일정 리스크
- **예상 지연 요인**: 컴포넌트 수가 예상보다 많을 경우
- **대응**: 핵심 컴포넌트 우선 처리, 나머지는 Phase 2로 연기

---

## 🔗 관련 작업

### 선행 작업 (완료됨)
- ✅ T-V2-001: shadcn/ui 설치 및 초기 설정
- ✅ T-V2-002: 디자인 토큰 시스템 구축
- ✅ T-V2-003: 기본 UI 컴포넌트 구축
- ✅ T-V2-004: 검색 사이드바 컴포넌트
- ✅ T-V2-005: 탭 네비게이션 시스템

### 후속 작업
- T-V2-007: Dashboard v2 레이아웃 (이 작업의 결과물 활용)
- T-V2-015: 수강 등록 워크플로우 (호환성 레이어 사용)
- T-V2-022: ClassFlow v2 리디자인 (마이그레이션 가이드 참조)

---

## 💡 구현 힌트

### 효율적인 조사 방법
```bash
# v1 컴포넌트 사용처 빠른 검색
rg "import.*from.*components/v1" --type tsx

# 컴포넌트별 사용 빈도 카운트
rg "<Button" --type tsx | wc -l
```

### 자동화 스크립트 예시
```typescript
// scripts/analyze-components.ts
import { glob } from 'glob';
import { parse } from '@typescript-eslint/parser';

async function analyzeV1Components() {
  const files = await glob('src/components/v1/**/*.tsx');
  
  for (const file of files) {
    const ast = parse(file);
    // AST 분석으로 Props 자동 추출
  }
}
```

### 테스트 전략
```typescript
// Visual Regression Test
describe('v1 to v2 Migration', () => {
  it('Button 컴포넌트 시각적 호환성', async () => {
    const v1Screenshot = await page.screenshot({ selector: '.v1-button' });
    const v2Screenshot = await page.screenshot({ selector: '.v2-button' });
    expect(v1Screenshot).toMatchSnapshot(v2Screenshot, { threshold: 0.95 });
  });
});
```

---

## 📝 체크리스트

### 작업 시작 전
- [ ] v1 컴포넌트 디렉터리 구조 파악
- [ ] shadcn/ui 컴포넌트 목록 확인
- [ ] 분석 도구 및 스크립트 준비

### 작업 중
- [ ] 컴포넌트 인벤토리 스프레드시트 작성
- [ ] Props 매핑 규칙 정의
- [ ] 호환성 레이어 프로토타입 개발
- [ ] 자동 변환 스크립트 개발

### 작업 완료
- [ ] 매핑 테이블 검증 (샘플 10개 테스트)
- [ ] 마이그레이션 가이드 리뷰
- [ ] 팀 공유 및 피드백 반영
- [ ] Phase 1 컴포넌트 실제 마이그레이션 시작

---

## 📅 상세 일정

### Day 1 (8시간)

#### 오전 (4시간)
- 09:00-10:00: v1 컴포넌트 전수 조사
- 10:00-12:00: 컴포넌트 분류 및 복잡도 평가
- 12:00-13:00: 점심

#### 오후 (4시간)  
- 13:00-15:00: v1→v2 매핑 테이블 작성
- 15:00-16:30: 호환성 레이어 프로토타입 개발
- 16:30-18:00: 마이그레이션 가이드 초안 작성

---

**작성일**: 2025-08-28  
**작성자**: Claude AI Assistant  
**검토자**: Lead Dev (예정)  
**승인자**: PM (예정)