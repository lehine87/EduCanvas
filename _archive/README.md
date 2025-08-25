---
category: archive
priority: 1
type: readme
tags: ["archive", "legacy", "cleanup"]
version: "v1.0"
last_updated: "2025-08-25"
status: archived
purpose: "루트 폴더 정리 시 이동된 파일들에 대한 설명"
audience: ["developers", "maintainers"]
cleanup_date: "2025-08-25"
---

# 📦 EduCanvas 아카이브

**루트 폴더 정리 시 보관된 파일들**

이 폴더는 2025-08-25 루트 폴더 정리 작업 중 생성되었으며, 현재 프로젝트에서 직접 사용되지 않지만 참고나 복구가 필요할 수 있는 파일들을 보관합니다.

---

## 📁 폴더 구조

### `legacy-templates/`
**보관된 내용**: 
- `UI_TEMPLATE/` - 초기 개발 시 사용된 UI 템플릿
- 전체 관리자 대시보드 템플릿 (React 컴포넌트, 스타일, 이미지 등)

**보관 이유**:
- 현재 shadcn/ui 기반 v2 UI로 전환하여 사용하지 않음
- 하지만 일부 컴포넌트나 디자인 패턴 참고용으로 보관
- 약 200+ 파일, 완전한 관리자 템플릿

**복구 방법**:
```bash
# 필요한 컴포넌트만 선별적으로 복사
cp _archive/legacy-templates/UI_TEMPLATE/src/components/specific-component.tsx src/components/
```

### `temp-files/`
**보관된 내용**:
- `database-fresh.types.ts` - 임시 데이터베이스 타입 파일
- `temp_types.ts` - 개발 중 생성된 임시 타입 정의
- `tsconfig.tsbuildinfo` - TypeScript 빌드 캐시 파일

**보관 이유**:
- 개발 과정에서 생성된 임시 파일들
- 정식 타입 시스템으로 교체되어 불필요
- 빌드 캐시는 자동 재생성됨

**복구 방법**:
```bash
# 응급 시 타입 파일 복구 (권장하지 않음)
cp _archive/temp-files/database-fresh.types.ts ./
```

### `test-scripts/`
**보관된 내용**:
- `test_authenticated_crud.py` - CRUD API 테스트 스크립트
- `test_crud_apis.py` - API 테스트 스크립트  
- `test_login.js` - 로그인 테스트 스크립트
- `test_ui.js` - UI 테스트 스크립트

**보관 이유**:
- 개발 초기 수동 테스트용 스크립트들
- 현재 jest/vitest 기반 자동화된 테스트 시스템으로 대체
- 하지만 수동 테스트나 디버깅 시 유용할 수 있음

**복구 방법**:
```bash
# 수동 테스트가 필요한 경우
python _archive/test-scripts/test_authenticated_crud.py
```

---

## ⚠️ 주의사항

### 삭제하지 말 것
- 이 아카이브의 모든 파일들은 **삭제하지 말고** 보관 상태 유지
- 프로젝트 히스토리와 개발 과정의 증거자료
- 일부는 향후 참고자료로 활용 가능

### 복구 시 주의점
1. **의존성 충돌**: 아카이브된 파일을 복구할 때 현재 시스템과의 호환성 확인 필요
2. **타입 정합성**: 구버전 타입 파일 사용 시 현재 스키마와 불일치 가능성
3. **보안 검토**: 오래된 파일의 보안 취약점 재검토 필요

### 정기 검토
- **6개월마다** 아카이브 내용 검토
- 완전히 불필요해진 파일들은 별도 압축 보관 고려
- 활용 가능성이 높은 파일들은 적절한 위치로 재배치

---

## 🔗 관련 문서

- `../docs/index.md` - 현재 문서 구조
- `../CLAUDE.md` - 프로젝트 가이드라인
- `../docs/core/development_plan.md` - v2 개발 계획

**정리 작업 날짜**: 2025-08-25  
**정리 작업자**: Claude Code  
**정리 이유**: 루트 폴더 가독성 향상 및 프로젝트 구조 체계화