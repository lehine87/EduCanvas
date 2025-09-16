# 출석체크 UI 설계 완전 계획서

**작성일**: 2025-09-15
**태스크**: T-V2-014 출석 관리 시스템 v2
**목적**: 베타 출시 핵심 기능 완성
**설계자**: Claude + User
**구현 우선순위**: P0 (Must-Have)

---

## 🎯 전체 UI 구조 (사이드바 + 메인영역)

```
┌─────────────────────────────────────────────────────────┐
│                   출석체크 시스템                         │
├─────────────┬───────────────────────────────────────────┤
│  Sidebar    │              Main Area                    │
│   (320px)   │                                           │
│             │  ┌─ 전일/당일 출석률 비교 ────────────────┐  │
│ [📅날짜선택] │  │ 어제: 87% (123/141)  오늘: 92% (45/49)│  │
│             │  └───────────────────────────────────────┘  │
│ ┌─현재시간─┐  │                                           │
│ │ ⏰ 09:00 │  │  ┌─────────────┬─────────────┬──────────┐  │
│ │ 수학기초반│  │  │ 수학기초반   │ 영어중급반  │ 과학실험반│  │
│ │ ⏰ 10:00 │  │  │ 총:15 출:12 │ 총:18 출:18│ 총:12    │  │
│ │ 영어중급반│  │  │ 결:2 지:1   │ 결:0 지:0  │ (미시작)  │  │
│ └─────────┘  │  │ (빨간배경)   │ (초록배경)  │ (흰배경)  │  │
│             │  └─────────────┴─────────────┴──────────┘  │
│ [이전/다음]   │                                           │
└─────────────┴───────────────────────────────────────────┘
```

---

## 📱 1. 사이드바 설계 (AttendanceTimeSidebar)

### 핵심 기능
- **날짜 선택**: Shadcn Calendar, 기본값 오늘
- **시간 기반 필터링**: 현재 시각 ±30분 클래스만 우선 표시
- **현재시간대/전체 토글**: 필요시 모든 클래스 보기 가능
- **실시간 표시**: 진행중 클래스 "진행중" 배지 + 애니메이션

### 구현 세부사항

```tsx
// 시간 필터링 핵심 로직
const getCurrentTimeClasses = (classes: ClassSchedule[]) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return classes.filter(cls => {
    const classTime = parseTime(cls.start_time); // "09:00" → 540분
    return Math.abs(classTime - currentMinutes) <= 30; // ±30분
  });
};

// 클래스 카드 상태 표시
- 현재 시간대 클래스: border-primary/50 bg-primary/5
- 진행중 배지: animate-pulse
- 출석 상태: Badge variant (success/destructive/default)
```

---

## 🎨 2. 메인 영역 설계 (AttendanceMainArea)

### 전일/당일 출석률 비교 카드
```tsx
// 시각적 비교 표시
<div className="grid grid-cols-2 gap-6">
  <AttendanceComparisonCard
    title="어제"
    variant="secondary"  // 회색 테두리
    data={yesterdayStats}
  />
  <AttendanceComparisonCard
    title="오늘"
    variant="primary"    // 파란색 테두리 강조
    data={todayStats}
  />
</div>

// 출석률 색상 구분
- 90% 이상: text-success (초록)
- 80-89%: text-warning (노랑)
- 80% 미만: text-destructive (빨강)
```

### 클래스 카드뷰 (상태별 배경색)

```tsx
// 다크모드 고려 배경색 시스템
const getCardVariant = (attendanceStatus) => {
  if (!attendanceStatus) return 'default';           // 미시작 (흰색)
  if (attendanceStatus.absent_count > 0) return 'destructive'; // 결석자 있음 (빨강)
  if (attendanceStatus.is_completed) return 'success';        // 완료 (초록)
  return 'default';
};

// 배경색 적용
success: "bg-success/10 border-success/20 hover:bg-success/15 dark:bg-success/5"
destructive: "bg-destructive/10 border-destructive/20 hover:bg-destructive/15 dark:bg-destructive/5"
default: "기본 Card 배경 (흰색/다크)"
```

---

## 📱 3. 출석체크 화면 (AttendanceCheckDetail)

### 반응형 2열 레이아웃
```tsx
// 화면 크기별 적응형 그리드
<div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
  {students.map(student =>
    <StudentAttendanceCard key={student.id} />
  )}
</div>

// 브레이크포인트
- 모바일/태블릿: 1열 (grid-cols-1)
- 데스크톱(1280px+): 2열 (xl:grid-cols-2)
- 3열은 복잡하므로 최대 2열로 제한
```

### 학생 카드 구성요소
```tsx
<Card> // hover:shadow-sm 효과
  <CardContent className="p-4">
    // 1. 학생 정보 영역
    <div className="flex items-start justify-between">
      <Avatar + 이름/학번/학년>
      <Badge variant="status별색상">현재상태</Badge>
    </div>

    // 2. 출석 버튼 그리드 (4개)
    <div className="grid grid-cols-4 gap-2 mt-4">
      <Button variant="출석시default">✓ 출석</Button>
      <Button variant="결석시destructive">✗ 결석</Button>
      <Button variant="지각시secondary">⏰ 지각</Button>
      <Button variant="조퇴시secondary">⏭ 조퇴</Button>
    </div>

    // 3. 체크 시간 표시
    <p className="text-xs">15:30 체크됨</p>
  </CardContent>
</Card>
```

---

## 🎪 4. 사유 입력 모달 (AttendanceReasonModal)

### 직관적 UX 설계
```tsx
// 모달 트리거 조건
onClick={status} => {
  if (['absent', 'late', 'early_leave'].includes(status)) {
    // 사유 모달 열기
    setReasonModal({ studentId, studentName, status });
  } else {
    // 출석은 바로 처리
    updateAttendance({ studentId, status, reason: null });
  }
}
```

### 빠른 선택 템플릿
```tsx
const reasonTemplates = {
  absent: ['몸이 아파서', '가정사로 인해', '교통사고/지연', '기타 개인사정'],
  late: ['교통 지연', '늦잠', '가정사로 인해', '기타 사정'],
  early_leave: ['몸이 아파서', '가정사로 인해', '다른 일정 때문에', '기타 사정']
};

// UI: 2열 그리드 버튼 배치
<div className="grid grid-cols-2 gap-2">
  {templates.map(template =>
    <Button onClick={() => setReason(template)}>
      {template}
    </Button>
  )}
</div>
```

### 키보드 UX
```tsx
// Enter: 즉시 저장 (Shift+Enter: 줄바꿈)
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSubmit(); // 빈칸이어도 저장됨
  }
  if (e.key === 'Escape') {
    onClose();
  }
};
```

---

## ⚡ 5. 키보드 단축키 시스템

### 전역 단축키
```tsx
// Ctrl/Cmd + 숫자키로 빠른 상태 변경
const useAttendanceShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey)) {
        const shortcuts = {
          '1': 'present',   // Ctrl+1: 출석
          '2': 'absent',    // Ctrl+2: 결석
          '3': 'late',      // Ctrl+3: 지각
          '4': 'early_leave' // Ctrl+4: 조퇴
        };

        // 포커스된 학생카드에서 상태 변경
        const studentId = document.activeElement
          ?.closest('[data-student-id]')
          ?.getAttribute('data-student-id');

        if (studentId && shortcuts[e.key]) {
          onStatusChange(studentId, shortcuts[e.key]);
        }
      }
    };
  }, []);
};
```

---

## 🎨 6. 색상 시스템 (다크모드 지원)

### 상태별 색상 정의
```scss
// 출석 관련 색상 (Tailwind 기반)
.attendance-success {
  /* 완료된 클래스 */
  @apply bg-success/10 border-success/20 text-success;
  @apply dark:bg-success/5 dark:border-success/10;
}

.attendance-destructive {
  /* 결석자 있는 클래스 */
  @apply bg-destructive/10 border-destructive/20 text-destructive;
  @apply dark:bg-destructive/5 dark:border-destructive/10;
}

.attendance-warning {
  /* 지각 관련 */
  @apply bg-warning/10 border-warning/20 text-warning;
  @apply dark:bg-warning/5 dark:border-warning/10;
}

.attendance-default {
  /* 미시작 클래스 */
  @apply bg-background border-border;
  @apply dark:bg-card dark:border-border;
}
```

---

## 🚀 7. 구현 우선순위 및 일정

### Phase 1: 핵심 구조 (1일차)
1. ✅ 사이드바 날짜 선택 + 시간 필터링
2. ✅ 메인 영역 비교 카드 + 클래스 카드뷰
3. ✅ 기본 출석체크 화면 레이아웃

### Phase 2: 상호작용 (2일차)
1. ✅ 출석 상태 변경 로직
2. ✅ 사유 입력 모달 + 템플릿
3. ✅ 실시간 상태 업데이트

### Phase 3: 최적화 (추후)
1. 키보드 단축키 시스템
2. 성능 최적화 (React Query)
3. 접근성 개선 (WCAG 2.1 AA)

---

## 💡 8. 베타 출시 핵심 가치

### 🎯 사용자 중심 설계
- **시간 기반 우선순위**: 현재 진행 수업만 집중 표시
- **상태별 시각적 구분**: 한눈에 파악 가능한 색상 시스템
- **빠른 워크플로우**: 최소 클릭으로 출석체크 완료

### ⚡ 실용적 효율성
- **30분 룰**: 수업 시작 전후 30분만 우선 표시
- **선택사항 사유**: 필수가 아닌 선택적 입력
- **2열 제한**: 복잡하지 않은 깔끔한 레이아웃

### 🌟 기술적 우수성
- **완벽한 반응형**: 모든 디바이스 지원
- **다크모드 완벽**: 브랜드 색상 시스템 적용
- **키보드 친화적**: 마우스 없이도 빠른 조작 가능

---

## 🎉 예상 완성 결과

이 설계를 구현하면:

1. **출석체크 시간 70% 단축**: 기존 10분 → 목표 3분
2. **사용자 만족도 향상**: 직관적 UI/UX
3. **베타 출시 준비 완료**: 학원 핵심 기능 완성
4. **확장성 확보**: 추후 기능 추가 용이한 구조

**이 계획대로 구현하면 학원 베타 서비스에 필요한 완벽한 출석체크 시스템이 완성됩니다!** 🚀

---

**다음 단계**: 이 설계를 바탕으로 실제 React 컴포넌트 개발 시작
**구현 기간**: 2.0d (16시간) 예상
**완료 목표**: 2025-09-20