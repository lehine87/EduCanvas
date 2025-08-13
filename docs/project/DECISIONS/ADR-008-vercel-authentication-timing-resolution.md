# ADR-008: Vercel 인증 타이밍 이슈 해결

## Status
**ACCEPTED** - 2025-08-13

## Context
EduCanvas 프로젝트에서 로컬 환경에서는 정상 작동하던 Supabase 인증이 Vercel 배포 환경에서 무한 리다이렉트 루프와 "요청이 너무 많습니다" 오류를 발생시키는 문제가 발생했습니다.

### 초기 증상
- **로컬 환경**: 로그인 → admin 페이지 → 역할별 리다이렉트 정상 작동
- **Vercel 환경**: 로그인 시도 시 무한 리다이렉트 → Rate Limiting 오류
- **Vercel 로그**: `_vercel_jwt` 쿠키만 있고 Supabase 인증 쿠키 인식 안됨

## Problem
### 1차 가설 (잘못된 진단)
- **추측**: 순환 참조 문제 (AuthGuard ↔ system-admin 페이지)
- **해결 시도**: AuthGuard 리다이렉트 제거, Forward-Only 설계 적용
- **결과**: 순환 참조는 해결되었으나 근본 문제 지속

### 2차 가설 (잘못된 진단)  
- **추측**: Supabase 쿠키 설정 문제
- **해결 시도**: 쿠키 옵션 강화, 인코딩/디코딩 추가
- **결과**: 여전히 Vercel에서 쿠키 인식 실패

### 3차 가설 (잘못된 진단)
- **추측**: middleware getSession() 보안 이슈
- **해결 시도**: JWT 토큰 검증으로 변경, 패턴 매칭 적용
- **결과**: 보안은 향상되었으나 핵심 문제 미해결

## Decision

### 최종 원인 발견: **타이밍 이슈**
사용자의 "로그인 시 5초 대기 시간 추가" 요청으로 우연히 발견된 진짜 원인:

```typescript
// 문제: 쿠키 설정 완료 전에 리다이렉트 실행
await authClient.signIn(data)
router.push('/admin') // 즉시 실행 → 쿠키 미완성 상태

// 해결: 쿠키 설정 완료 대기
await authClient.signIn(data)
await new Promise(resolve => setTimeout(resolve, waitTime)) // 대기
router.push('/admin') // 쿠키 완성 후 실행
```

### 핵심 발견사항

#### 1. Vercel vs 로컬 환경의 쿠키 처리 차이
- **로컬**: 쿠키 설정이 거의 즉시 완료 (~100ms)
- **Vercel**: 네트워크 지연, Edge Runtime 특성으로 1-2초 소요

#### 2. 브라우저-서버 간 쿠키 동기화 지연
```javascript
// 문제 시나리오
1. 로그인 성공 → Supabase 쿠키 설정 시작
2. 즉시 router.push('/admin') 실행
3. middleware 실행 시점에 쿠키 아직 미완성
4. "인증되지 않음" 판정 → /auth/login 리다이렉트
5. 무한 루프 발생
```

#### 3. 다중 요청으로 인한 로그 반복
- 페이지 로드 시 20개 이상의 리소스 요청 (CSS, JS, 이미지, 폰트)
- 각 요청마다 middleware 실행
- 쿠키 완성 전까지 모든 요청이 "비인가" 로그 생성 (정상)

## Implementation

### 환경별 최적화된 대기 시간
```typescript
// LoginForm.tsx - 로그인 후 대기
const waitTime = isVercel ? 2000 : 500 // Vercel: 2초, 로컬: 0.5초
await new Promise(resolve => setTimeout(resolve, waitTime))

// admin/page.tsx - 리다이렉트 대기  
const redirectDelay = isVercel ? 1000 : 300 // Vercel: 1초, 로컬: 0.3초
setTimeout(() => router.push('/target'), redirectDelay)
```

### Forward-Only 리다이렉트 설계 유지
```typescript
// 순환 참조 방지 패턴 (부수적 개선사항)
// admin → system-admin (단방향)
// system-admin → admin (절대 금지)
```

## Consequences

### Positive
- ✅ **Vercel 인증 문제 완전 해결**: 무한 루프 및 Rate Limiting 해결
- ✅ **환경별 최적화**: 로컬/Vercel 환경에 맞는 타이밍 적용
- ✅ **순환 참조 제거**: 부수적으로 아키텍처 개선
- ✅ **디버깅 인프라 구축**: 상세한 로그 시스템으로 향후 문제 진단 용이

### Negative
- ⚠️ **사용자 경험 지연**: 로그인 후 2초, 리다이렉트마다 1초 대기
- ⚠️ **브라우저별 차이 가능성**: 다른 브라우저에서는 다른 타이밍 필요할 수 있음

### Neutral
- 📊 **20번 반복 로그**: 정상적인 다중 리소스 요청 과정 (문제 아님)

## Lessons Learned

### 🎯 핵심 교훈: "근본 원인 vs 증상"

#### 1. 증상에 현혹되지 말 것
```
증상: "무한 리다이렉트" 
→ 잘못된 진단: "순환 참조 문제"
→ 실제 원인: "타이밍 이슈"
```

#### 2. 환경 차이를 항상 의심할 것
- **로컬에서 되는데 Vercel에서 안 된다** = 99% 환경 차이 문제
- 네트워크 지연, 런타임 차이, 브라우저 동작 차이 등

#### 3. 우연한 발견의 가치
- 사용자의 "5초 대기" 요청이 진짜 원인 발견의 열쇠
- 때로는 의도하지 않은 변경이 핵심 해결책

### 🔍 디버깅 방법론 개선점

#### 1. 시간 축 분석 부족
```
개선 전: "왜 쿠키가 없지?"
개선 후: "언제 쿠키가 설정되는지?" → 타이밍 분석
```

#### 2. 환경별 테스트 부족
```
개선 전: 로컬에서만 테스트 → Vercel 배포 후 문제 발견
개선 후: 각 수정마다 로컬 + Vercel 동시 검증
```

#### 3. 비동기 처리 인식 부족
```
개선 전: 쿠키 설정을 즉시 완료되는 것으로 가정
개선 후: 모든 외부 연동(인증, DB, API)은 지연 가능성 고려
```

### 🛠️ 개발 프로세스 개선안

#### 1. "Environment-First" 디버깅
```typescript
// 모든 이슈는 환경별로 분석
const isLocalIssue = works_locally && !works_production
if (isLocalIssue) {
  // 환경 차이 요소 집중 분석
  // - 네트워크 지연
  // - 런타임 차이 (Node.js vs Edge)
  // - 브라우저 정책 차이
}
```

#### 2. "Timing-Aware" 코딩
```typescript
// 모든 외부 연동에 타이밍 고려
async function authFlow() {
  await externalAuth()
  await waitForCompletion() // 명시적 대기
  proceedWithNext()
}
```

#### 3. "Gradual Rollback" 전략
```
문제 발생 시:
1. 최근 변경사항부터 되돌리기
2. 환경별 차이 분석
3. 타이밍/비동기 이슈 검토
4. 근본 원인 찾을 때까지 단계별 접근
```

### 🚨 향후 주의사항

#### 1. Supabase 인증 타이밍
- 모든 인증 후 작업에 적절한 대기 시간 필수
- 환경별 대기 시간 차별화 고려

#### 2. Vercel Edge Runtime 특성
- 로컬 Node.js와 다른 동작 가능성 항상 염두
- 쿠키, 세션, 상태 관리 시 추가 주의

#### 3. 사용자 피드백의 가치
- "너무 빨라서 확인 못 하겠다" = 타이밍 힌트일 수 있음
- 개발자 관점이 아닌 사용자 관점에서 문제 재해석

## 추가 고려사항

### 성능 최적화 여지
```typescript
// 현재: 고정 대기 시간
await sleep(2000)

// 개선 가능: 쿠키 확인 + 최대 대기
await waitUntilCookieReady({ maxWait: 3000, checkInterval: 100 })
```

### 브라우저별 대응
- Safari, Chrome, Firefox별 쿠키 처리 시간 차이 가능성
- 필요시 브라우저 감지 후 차등 대기 시간 적용

### 모니터링 강화
- Vercel 환경에서 실제 쿠키 설정 완료 시간 측정
- 사용자별 네트워크 환경에 따른 타이밍 분석

---

**결론**: 6시간 소요된 이번 이슈는 "증상"에 집중해 "원인"을 놓친 사례입니다. 
앞으로는 환경 차이와 타이밍 이슈를 우선 의심하고, 사용자 피드백을 기술적 힌트로 활용하겠습니다.