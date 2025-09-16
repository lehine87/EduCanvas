# T-V2-014: 출석 관리 시스템 v2 완성

---

**Task ID**: T-V2-014
**제목**: 출석 관리 시스템 v2 완성 (CRUD + 통계 + 알림)
**Phase**: 1 (핵심 기능 리뉴얼)
**Sprint**: S-V2-04
**우선순위**: P0 (Must-Have)
**담당**: Full Stack
**예상 소요**: 2.0d (16시간)
**기한**: 2025-09-20
**상태**: TODO

---

## 📋 태스크 개요

### 목적
학원 운영의 핵심인 출석 관리 기능을 shadcn/ui 기반의 v2 시스템으로 완전 리뉴얼하여, 실시간 출석 체크, 통계 분석, 자동 알림 시스템을 구축합니다.

### 기대 효과
- **운영 효율성 60% 향상**: 자동화된 출석 체크 및 통계
- **학부모 소통 개선**: 실시간 출석 알림 및 리포트
- **데이터 기반 의사결정**: 출석률 분석을 통한 학생 관리 최적화
- **베타 출시 핵심 기능**: 학원 관리 시스템의 필수 기능 완성

---

## 🎯 핵심 요구사항

### 1. 출석 체크 시스템
- **실시간 출석 체크**: 클래스별, 날짜별 출석 상태 관리
- **벌크 출석 처리**: 전체 학생 일괄 출석/결석 처리
- **상태 관리**: 출석, 결석, 지각, 조퇴, 공결 5가지 상태
- **메모 기능**: 출석 상태별 메모 및 사유 기록

### 2. 통계 및 분석
- **출석률 통계**: 학생별, 클래스별, 기간별 출석률 계산
- **트렌드 분석**: 시계열 출석률 변화 추이
- **위험군 탐지**: 출석률 저하 학생 자동 식별
- **시각화**: 차트 및 그래프를 통한 직관적 데이터 표현

### 3. 자동 알림 시스템
- **실시간 알림**: 결석 시 즉시 알림
- **일일 리포트**: 하루 출석 현황 요약
- **주간/월간 리포트**: 정기적 출석률 통계 전송
- **알림 채널**: SMS, 이메일, 앱 푸시 (확장 가능)

---

## 🏗️ 기술적 구현 사항

### Database Schema 설계

```sql
-- 출석 기록 테이블
CREATE TABLE attendances (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  status attendance_status_enum NOT NULL DEFAULT 'present',
  memo text,
  checked_by uuid REFERENCES tenant_memberships(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 출석 상태 ENUM
CREATE TYPE attendance_status_enum AS ENUM (
  'present',     -- 출석
  'absent',      -- 결석
  'late',        -- 지각
  'early_leave', -- 조퇴
  'excused'      -- 공결
);

-- 출석 알림 설정
CREATE TABLE attendance_notification_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  notification_types text[] DEFAULT '{"absence", "late"}',
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_attendances_student_date ON attendances(student_id, attendance_date);
CREATE INDEX idx_attendances_class_date ON attendances(class_id, attendance_date);
CREATE INDEX idx_attendances_date_status ON attendances(attendance_date, status);
```

### API Routes 구현

```typescript
// /api/attendance/route.ts - 출석 CRUD
POST   /api/attendance          // 출석 체크 (개별/벌크)
GET    /api/attendance          // 출석 목록 조회 (필터링/페이지네이션)
PATCH  /api/attendance/[id]     // 출석 상태 수정
DELETE /api/attendance/[id]     // 출석 기록 삭제

// /api/attendance/stats/route.ts - 출석 통계
GET    /api/attendance/stats    // 전체 출석 통계
GET    /api/attendance/stats/student/[id] // 학생별 통계
GET    /api/attendance/stats/class/[id]   // 클래스별 통계

// /api/attendance/reports/route.ts - 출석 리포트
GET    /api/attendance/reports/daily     // 일일 출석 현황
GET    /api/attendance/reports/weekly    // 주간 출석 리포트
GET    /api/attendance/reports/monthly   // 월간 출석 리포트

// /api/attendance/notifications/route.ts - 알림 관리
POST   /api/attendance/notifications     // 알림 전송
GET    /api/attendance/notifications/settings // 알림 설정 조회
PATCH  /api/attendance/notifications/settings // 알림 설정 수정
```

### React Components 구조

```
src/components/attendance/
├── AttendancePageLayout.tsx           # 메인 레이아웃
├── AttendanceCheckSheet.tsx           # 출석 체크 사이드 시트
├── AttendanceStatsGrid.tsx            # 통계 그리드 위젯
├── AttendanceCalendar.tsx             # 달력 기반 출석 현황
├── AttendanceBulkActions.tsx          # 벌크 액션 바
├── AttendanceStatusBadge.tsx          # 출석 상태 배지
├── AttendanceChart.tsx                # 출석률 차트
├── AttendanceReportModal.tsx          # 리포트 모달
├── AttendanceNotificationPanel.tsx    # 알림 패널
└── AttendanceSearchFilters.tsx        # 검색 및 필터
```

### State Management

```typescript
// src/store/attendanceStore.ts
interface AttendanceStore {
  // 출석 데이터
  attendances: Attendance[];
  currentDate: Date;
  selectedClass: string | null;

  // 통계 데이터
  stats: AttendanceStats | null;
  trends: AttendanceTrend[] | null;

  // UI 상태
  isCheckingAttendance: boolean;
  isGeneratingReport: boolean;

  // 액션
  checkAttendance: (data: AttendanceCheckData) => Promise<void>;
  bulkUpdateAttendance: (updates: BulkAttendanceUpdate) => Promise<void>;
  fetchAttendanceStats: () => Promise<void>;
  generateReport: (params: ReportParams) => Promise<void>;
}
```

---

## 🎨 UI/UX 설계

### 1. 메인 출석 관리 페이지
```tsx
<AttendancePageLayout>
  <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
    {/* 출석 통계 카드 */}
    <div className="xl:col-span-1">
      <AttendanceStatsGrid />
    </div>

    {/* 출석 체크 영역 */}
    <div className="xl:col-span-3">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>출석 체크</CardTitle>
            <Button onClick={openBulkCheck}>일괄 체크</Button>
          </div>
        </CardHeader>
        <CardContent>
          <AttendanceCalendar />
          <AttendanceTable />
        </CardContent>
      </Card>
    </div>
  </div>
</AttendancePageLayout>
```

### 2. 출석 통계 위젯
```tsx
<div className="grid grid-cols-2 gap-4">
  <StatCard
    title="오늘 출석률"
    value="87.5%"
    change="+2.3%"
    icon={<Users />}
    color="success"
  />
  <StatCard
    title="이번 주 평균"
    value="82.1%"
    change="-1.2%"
    icon={<Calendar />}
    color="warning"
  />
  <StatCard
    title="결석 위험군"
    value="3명"
    change="+1명"
    icon={<AlertTriangle />}
    color="danger"
  />
  <StatCard
    title="완벽 출석"
    value="12명"
    change="+4명"
    icon={<Award />}
    color="success"
  />
</div>
```

### 3. 실시간 출석 체크
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>학생</TableHead>
      <TableHead>출석 상태</TableHead>
      <TableHead>메모</TableHead>
      <TableHead>액션</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {students.map((student) => (
      <TableRow key={student.id}>
        <TableCell>{student.name}</TableCell>
        <TableCell>
          <AttendanceStatusSelect
            value={student.attendanceStatus}
            onChange={(status) => updateAttendance(student.id, status)}
          />
        </TableCell>
        <TableCell>
          <Input
            placeholder="메모 입력..."
            value={student.memo}
            onChange={(e) => updateMemo(student.id, e.target.value)}
          />
        </TableCell>
        <TableCell>
          <Button size="sm" onClick={() => notifyParent(student.id)}>
            알림
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## 🔧 기술적 세부 사항

### 1. 실시간 출석 체크 로직
```typescript
// src/hooks/useAttendanceCheck.ts
export function useAttendanceCheck(classId: string, date: Date) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const checkAttendance = async (studentId: string, status: AttendanceStatus) => {
    try {
      const response = await api.post('/attendance', {
        student_id: studentId,
        class_id: classId,
        attendance_date: date.toISOString().split('T')[0],
        status,
        checked_by: currentUser.id
      });

      // 실시간 UI 업데이트
      setAttendance(prev =>
        prev.map(record =>
          record.student_id === studentId
            ? { ...record, status, updated_at: new Date().toISOString() }
            : record
        )
      );

      // 알림 전송
      if (status === 'absent' || status === 'late') {
        await triggerNotification(studentId, status);
      }
    } catch (error) {
      toast.error('출석 체크 실패');
    }
  };

  return { attendance, checkAttendance };
}
```

### 2. 출석률 계산 알고리즘
```typescript
// src/services/attendanceAnalytics.ts
export class AttendanceAnalytics {
  static calculateAttendanceRate(records: AttendanceRecord[]): number {
    if (records.length === 0) return 0;

    const presentCount = records.filter(r =>
      ['present', 'late', 'excused'].includes(r.status)
    ).length;

    return Math.round((presentCount / records.length) * 100 * 10) / 10;
  }

  static detectAtRiskStudents(studentRecords: StudentAttendanceRecord[]): AtRiskStudent[] {
    const RISK_THRESHOLD = 70; // 70% 미만 위험군
    const RECENT_DAYS = 14; // 최근 2주 기준

    return studentRecords
      .filter(student => {
        const recentRecords = student.records
          .filter(r => isWithinDays(r.date, RECENT_DAYS));
        const rate = this.calculateAttendanceRate(recentRecords);
        return rate < RISK_THRESHOLD;
      })
      .map(student => ({
        ...student,
        riskLevel: student.attendanceRate < 50 ? 'high' : 'medium'
      }));
  }
}
```

### 3. 알림 시스템 구현
```typescript
// src/services/attendanceNotification.ts
export class AttendanceNotificationService {
  static async sendAbsenceNotification(studentId: string) {
    const student = await getStudent(studentId);
    const settings = await getNotificationSettings(student.tenant_id, studentId);

    if (!settings.enabled || !settings.notification_types.includes('absence')) {
      return;
    }

    const message = `[${student.name}] 학생이 오늘 수업에 결석하였습니다.
확인 부탁드립니다. - ${getCurrentClassName()}`;

    // SMS 전송
    if (student.parent_phone) {
      await smsService.send(student.parent_phone, message);
    }

    // 이메일 전송
    if (student.parent_email) {
      await emailService.send(student.parent_email, {
        subject: `[출석 알림] ${student.name} 학생 결석 안내`,
        template: 'absence-notification',
        data: { student, className: getCurrentClassName() }
      });
    }

    // 알림 기록 저장
    await createNotificationLog({
      student_id: studentId,
      type: 'absence',
      channels: ['sms', 'email'],
      sent_at: new Date()
    });
  }
}
```

---

## 📊 성능 최적화

### 1. 데이터베이스 최적화
```sql
-- 출석 조회 성능 최적화를 위한 인덱스
CREATE INDEX CONCURRENTLY idx_attendances_composite
ON attendances(tenant_id, attendance_date DESC, class_id, student_id);

-- 통계 계산을 위한 구체화된 뷰
CREATE MATERIALIZED VIEW attendance_daily_stats AS
SELECT
  tenant_id,
  class_id,
  attendance_date,
  COUNT(*) as total_students,
  COUNT(*) FILTER (WHERE status = 'present') as present_count,
  COUNT(*) FILTER (WHERE status = 'absent') as absent_count,
  COUNT(*) FILTER (WHERE status = 'late') as late_count,
  ROUND(
    COUNT(*) FILTER (WHERE status IN ('present', 'late', 'excused'))::numeric /
    COUNT(*)::numeric * 100, 1
  ) as attendance_rate
FROM attendances
GROUP BY tenant_id, class_id, attendance_date;

-- 매일 자동 갱신
CREATE OR REPLACE FUNCTION refresh_attendance_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY attendance_daily_stats;
END;
$$ LANGUAGE plpgsql;
```

### 2. React Query 캐싱 전략
```typescript
// src/hooks/queries/useAttendance.ts
export function useAttendanceData(classId: string, date: Date) {
  return useQuery({
    queryKey: ['attendance', classId, date.toISOString().split('T')[0]],
    queryFn: () => fetchAttendanceData(classId, date),
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 10 * 60 * 1000,   // 10분 후 가비지 컬렉션
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });
}

export function useAttendanceStats(filters: AttendanceStatsFilters) {
  return useQuery({
    queryKey: ['attendance-stats', filters],
    queryFn: () => fetchAttendanceStats(filters),
    staleTime: 30 * 60 * 1000, // 30분간 캐시 유지 (통계는 덜 자주 변경)
    gcTime: 60 * 60 * 1000     // 1시간 후 가비지 컬렉션
  });
}
```

---

## ✅ 완료 기준 (Definition of Done)

### 기능적 완료 기준
- [ ] 출석 체크 CRUD 기능 100% 구현
- [ ] 5가지 출석 상태 완전 지원
- [ ] 벌크 출석 처리 기능 구현
- [ ] 실시간 출석률 통계 계산
- [ ] 위험군 학생 자동 탐지
- [ ] SMS/이메일 자동 알림 시스템
- [ ] 일일/주간/월간 리포트 생성

### 기술적 완료 기준
- [ ] TypeScript 타입 안전성 100%
- [ ] shadcn/ui 컴포넌트 100% 활용
- [ ] 반응형 디자인 완벽 지원
- [ ] WCAG 2.1 AA 접근성 준수
- [ ] API 응답시간 < 300ms
- [ ] 데이터베이스 쿼리 최적화

### 사용자 경험 완료 기준
- [ ] 직관적인 출석 체크 워크플로우
- [ ] 실시간 UI 업데이트
- [ ] 오프라인 상태 지원 (추후 확장)
- [ ] 모바일 최적화
- [ ] 로딩 상태 및 에러 처리

---

## 🚀 배포 및 테스트

### 단위 테스트
```typescript
// src/components/attendance/__tests__/AttendanceCheck.test.tsx
describe('AttendanceCheck', () => {
  it('should update attendance status correctly', async () => {
    render(<AttendanceCheck classId="test-class" date={new Date()} />);

    const statusSelect = screen.getByLabelText('출석 상태');
    fireEvent.change(statusSelect, { target: { value: 'absent' } });

    await waitFor(() => {
      expect(mockUpdateAttendance).toHaveBeenCalledWith('absent');
    });
  });
});
```

### E2E 테스트
```typescript
// cypress/e2e/attendance-management.cy.ts
describe('Attendance Management', () => {
  it('should complete full attendance check workflow', () => {
    cy.visit('/main/attendance');
    cy.selectClass('수학 기초반');
    cy.selectDate('2025-09-20');

    // 벌크 출석 체크
    cy.get('[data-testid="bulk-present"]').click();
    cy.get('[data-testid="confirm-bulk"]').click();

    // 개별 상태 변경
    cy.get('[data-testid="student-row-1"] select').select('absent');
    cy.get('[data-testid="notify-parent-1"]').click();

    // 결과 검증
    cy.get('[data-testid="attendance-rate"]').should('contain', '87.5%');
    cy.get('.toast-success').should('contain', '출석 체크 완료');
  });
});
```

---

## 📈 성공 지표

### 운영 효율성
- **출석 체크 시간**: 기존 10분 → 목표 3분 (70% 단축)
- **데이터 정확성**: 수동 입력 오류 90% 감소
- **학부모 소통**: 알림 응답률 60% → 85% 향상

### 기술적 성능
- **페이지 로딩**: < 2초
- **출석 체크 응답**: < 300ms
- **통계 계산**: < 500ms
- **동시 사용자**: 50명 처리 가능

### 사용자 만족도
- **직관적 UX**: 클릭 수 50% 감소
- **모바일 지원**: 터치 최적화 완료
- **접근성**: WCAG 2.1 AA 100% 준수

---

## 🔄 확장 계획

### Phase 2 확장 (추후)
- **얼굴 인식 출석**: AI 기반 자동 출석 체크
- **모바일 앱 연동**: 학부모/학생용 모바일 앱
- **IoT 센서 연동**: 출입문 센서 기반 자동 출석
- **예측 분석**: 출석 패턴 기반 이탈 위험 예측

### 기술적 개선사항
- **실시간 동기화**: WebSocket 기반 실시간 업데이트
- **오프라인 지원**: PWA 기반 오프라인 출석 체크
- **백업 및 복구**: 출석 데이터 자동 백업 시스템
- **감사 로그**: 출석 변경 이력 완전 추적

---

**작성자**: Lead Developer
**검토자**: PM + Full Stack Team
**승인일**: 2025-09-15
**구현 시작일**: 2025-09-18
**목표 완료일**: 2025-09-20