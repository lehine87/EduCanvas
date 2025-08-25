# Obsidian Frontmatter 템플릿 가이드

## 📋 기본 템플릿 구조

```yaml
---
category: [core/reference/guides/maintenance/archive]
priority: [1-5] # 5=매일, 4=주2-3회, 3=주1회, 2=월1회, 1=보관용
type: [reference/manual/standards/specification/guide/roadmap/index]
project: [educanvas_v1/educanvas_v2/shared] # 해당시에만
component: [dashboard/enrollment/staff 등] # UI 컴포넌트인 경우
tags: ["tag1", "tag2", "tag3"] # 검색용 태그들
version: "v1.0"
last_updated: "2025-08-25"
status: [active/draft/deprecated/archived]
frequency: [daily/weekly/monthly/rarely] # 사용 빈도
phase: [design-complete/in-development/testing/complete] # 개발 단계
implementation_priority: [1-5] # 구현 우선순위 (해당시에만)
compliance_level: [mandatory/recommended/optional] # 준수 수준
difficulty: [beginner/intermediate/advanced] # 난이도
estimated_effort: "2주" # 예상 소요 시간 (해당시에만)
framework: "shadcn/ui" # 사용 프레임워크 (해당시에만)
related_files: # 관련 파일들
  - "file1.md"
  - "file2.md"
purpose: "문서의 목적 한 줄 설명"
audience: ["developers", "designers", "project-managers"] # 대상 사용자
philosophy: "핵심 철학 (해당시에만)"
timeline: "기간 (해당시에만)"
---
```

## 🎯 카테고리별 템플릿

### 📚 Core 문서 (priority: 5)
```yaml
---
category: core
priority: 5
type: [reference/manual/standards]
tags: ["core", "essential", "daily-use"]
frequency: daily
compliance_level: mandatory
---
```

### 📖 Reference 문서 (priority: 4)
```yaml
---
category: reference
priority: 4
type: reference
tags: ["reference", "technical"]
frequency: weekly
---
```

### 📋 Guides 문서 (priority: 3)
```yaml
---
category: guides
priority: 3
type: guide
tags: ["guide", "how-to"]
frequency: weekly
difficulty: [beginner/intermediate/advanced]
---
```

### 🔧 Maintenance 문서 (priority: 2)
```yaml
---
category: maintenance
priority: 2
type: [quality/monitoring]
tags: ["maintenance", "quality"]
frequency: monthly
---
```

### 🎨 V2 Design 문서
```yaml
---
category: design
priority: 4
type: specification
project: "educanvas_v2"
component: "component-name"
tags: ["v2", "ui-design"]
phase: "design-complete"
implementation_priority: [1-5]
framework: "shadcn/ui"
estimated_effort: "예상시간"
---
```

## 🏷️ 태그 분류 체계

### 기술별 태그
- `typescript`, `react`, `nextjs`, `supabase`, `shadcn-ui`
- `database`, `api`, `ui-ux`, `testing`

### 기능별 태그  
- `dashboard`, `enrollment`, `student-management`, `staff-management`
- `classflow`, `schedule`, `reports`, `course-management`

### 중요도별 태그
- `core`, `essential`, `daily-use`, `reference`, `guide`
- `maintenance`, `quality`, `monitoring`

### 프로젝트별 태그
- `v1`, `v2`, `v2-renewal`, `migration`
- `design`, `implementation`, `testing`

## 🎨 Obsidian 활용 팁

### 그래프 뷰 최적화
- `priority` 값으로 노드 크기 조정 가능
- `category` 별로 색상 그룹화
- `tags`로 필터링 및 검색

### 검색 쿼리 예시
```
# 매일 사용하는 core 문서들
priority:5

# v2 관련 설계 문서들
project:educanvas_v2 type:specification

# TypeScript 관련 문서들
tag:typescript

# 구현 우선순위 높은 문서들
implementation_priority:1 OR implementation_priority:2
```

### 템플릿 활용
1. 새 문서 생성시 이 템플릿을 복사
2. 문서 성격에 맞는 값들로 수정
3. 불필요한 필드는 삭제

이제 문서들이 Obsidian에서 체계적으로 관리되고 검색 가능합니다! 🎯