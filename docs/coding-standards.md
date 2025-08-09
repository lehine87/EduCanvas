# EduCanvas 코딩 표준 및 개발 가이드라인

**작성일**: 2025-08-09  
**대상**: EduCanvas 프로젝트 전체 개발팀  
**목적**: 엔터프라이즈급 코드 품질 보장 및 팀 협업 효율성 극대화

---

## 📋 목차

1. [프로젝트 철학](#1-프로젝트-철학)
2. [TypeScript 코딩 규칙](#2-typescript-코딩-규칙)
3. [React 컴포넌트 규칙](#3-react-컴포넌트-규칙)
4. [파일 및 폴더 명명 규칙](#4-파일-및-폴더-명명-규칙)
5. [주석 및 문서화 규칙](#5-주석-및-문서화-규칙)
6. [테스트 작성 규칙](#6-테스트-작성-규칙)
7. [성능 최적화 가이드라인](#7-성능-최적화-가이드라인)
8. [접근성 규칙](#8-접근성-규칙)
9. [상태 관리 패턴](#9-상태-관리-패턴)
10. [에러 핸들링](#10-에러-핸들링)
11. [Git 및 협업 규칙](#11-git-및-협업-규칙)
12. [품질 보증 체크리스트](#12-품질-보증-체크리스트)

---

## 1. 프로젝트 철학

### 1.1 핵심 원칙 🎯

**"품질보다 빠른 것은 없다"** - 처음부터 올바르게 만들어야 합니다.

```typescript
// ❌ 피해야 할 것: 빠른 구현을 위한 타입 우회
const data: any = fetchUserData();

// ✅ 권장: 명확한 타입 정의
interface UserData {
  id: string;
  name: string;
  role: UserRole;
  lastLogin: Date;
}
const data: UserData = await fetchUserData();
```

### 1.2 코드 품질 기준

- **가독성 > 간결함**: 코드는 책처럼 읽힐 수 있어야 합니다
- **명시적 > 암시적**: 의도를 명확하게 표현해야 합니다  
- **안전성 > 편의성**: 컴파일 타임에 오류를 잡아야 합니다
- **일관성 > 개인 선호**: 팀 규칙을 개인 취향보다 우선합니다

### 1.3 성능 철학

**ClassFlow 60fps 보장**을 위한 성능 우선 설계:

```typescript
// ✅ 성능을 고려한 컴포넌트 설계
const StudentCard = memo(({ student, onMove }: StudentCardProps) => {
  const handleDrag = useCallback((event: DragEvent) => {
    onMove(student.id, event.targetClassId);
  }, [student.id, onMove]);

  return (
    <div
      draggable
      onDragEnd={handleDrag}
      className="student-card"
    >
      {student.name}
    </div>
  );
});

StudentCard.displayName = 'StudentCard';
```

---

## 2. TypeScript 코딩 규칙

### 2.1 타입 정의 📝

**모든 타입을 명시적으로 정의합니다** (any 사용 금지):

```typescript
// ❌ 금지: any 타입 사용
function processData(data: any): any {
  return data.map(item => item.value);
}

// ✅ 권장: 구체적 타입 정의
interface DataItem {
  id: string;
  value: number;
  metadata?: Record<string, unknown>;
}

function processData(data: DataItem[]): number[] {
  return data.map(item => item.value);
}
```

### 2.2 인터페이스 vs 타입

- **인터페이스**: 확장 가능한 객체 구조
- **타입**: 유니온, 교집합, 원시 타입 조합

```typescript
// ✅ 인터페이스: 확장 가능한 구조
interface BaseUser {
  id: string;
  name: string;
  email: string;
}

interface Student extends BaseUser {
  grade: string;
  classId: string;
  enrollmentDate: Date;
}

// ✅ 타입: 유니온/조합 타입
type UserRole = 'admin' | 'instructor' | 'staff' | 'viewer';
type StudentStatus = 'active' | 'waiting' | 'inactive' | 'graduated';
type APIResponse<T> = {
  data: T;
  status: 'success' | 'error';
  message?: string;
};
```

### 2.3 제네릭 사용 규칙

```typescript
// ✅ 명명 규칙: 의미 있는 제네릭 이름
interface Repository<TEntity, TId = string> {
  findById(id: TId): Promise<TEntity | null>;
  save(entity: TEntity): Promise<TEntity>;
  delete(id: TId): Promise<void>;
}

// ✅ 제네릭 제약조건 활용
interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

function updateEntity<T extends Timestamped>(
  entity: T, 
  updates: Partial<Omit<T, keyof Timestamped>>
): T {
  return {
    ...entity,
    ...updates,
    updatedAt: new Date(),
  };
}
```

### 2.4 유틸리티 타입 활용

```typescript
// ✅ 유틸리티 타입으로 타입 안전성 확보
interface Student {
  id: string;
  name: string;
  email: string;
  classId: string;
  status: StudentStatus;
}

// 생성 시에는 id 제외
type CreateStudentData = Omit<Student, 'id'>;

// 업데이트 시에는 부분 업데이트 + id 필수
type UpdateStudentData = Partial<Student> & Pick<Student, 'id'>;

// API 응답에는 추가 메타데이터
type StudentWithMetadata = Student & {
  className: string;
  instructorName: string;
};
```

---

## 3. React 컴포넌트 규칙

### 3.1 컴포넌트 구조 🏗️

**모든 컴포넌트는 다음 구조를 따릅니다**:

```typescript
/**
 * 학생 카드 컴포넌트
 * ClassFlow에서 드래그 가능한 학생 정보를 표시합니다.
 * 
 * @performance 메모이제이션 적용으로 불필요한 리렌더링 방지
 * @accessibility ARIA 레이블 및 키보드 네비게이션 지원
 */

import { memo, useCallback } from 'react';
import { Student } from '@/types/student';
import { cn } from '@/utils/cn';

// 1. Props 인터페이스 정의
interface StudentCardProps {
  /** 표시할 학생 데이터 */
  student: Student;
  /** 드래그 완료 시 호출되는 콜백 */
  onMove: (studentId: string, targetClassId: string) => void;
  /** 선택된 상태 여부 */
  isSelected?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

// 2. 컴포넌트 구현
const StudentCard = memo<StudentCardProps>(({ 
  student, 
  onMove, 
  isSelected = false, 
  className 
}) => {
  // 3. 훅 사용
  const handleDragEnd = useCallback((event: DragEvent) => {
    const targetElement = event.target as HTMLElement;
    const targetClassId = targetElement.getAttribute('data-class-id');
    
    if (targetClassId && targetClassId !== student.classId) {
      onMove(student.id, targetClassId);
    }
  }, [student.id, student.classId, onMove]);

  // 4. 렌더링
  return (
    <div
      draggable
      onDragEnd={handleDragEnd}
      className={cn(
        // 기본 스타일
        'student-card p-4 rounded-lg border bg-white shadow-sm',
        'cursor-grab active:cursor-grabbing',
        'transition-all duration-200 hover:shadow-md',
        // 상태별 스타일
        isSelected && 'ring-2 ring-blue-500 bg-blue-50',
        // 커스텀 클래스
        className
      )}
      aria-label={`학생 ${student.name}, ${student.grade} 학년`}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            {student.name.charAt(0)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {student.name}
          </p>
          <p className="text-sm text-gray-500">
            {student.grade} 학년
          </p>
        </div>
      </div>
    </div>
  );
});

// 5. displayName 설정 (디버깅용)
StudentCard.displayName = 'StudentCard';

export default StudentCard;
```

### 3.2 컴포넌트 분류 및 위치

```typescript
// ✅ 컴포넌트 분류 기준
src/components/
├── ui/                 // 범용 UI 컴포넌트
│   ├── Button/
│   ├── Modal/
│   └── Input/
├── features/           // 기능별 컴포넌트  
│   ├── classflow/     // ClassFlow 전용
│   ├── students/      // 학생 관리 전용
│   └── payments/      // 결제 관리 전용
├── layout/            // 레이아웃 컴포넌트
│   ├── Header/
│   ├── Sidebar/
│   └── Footer/
└── forms/             // 폼 관련 컴포넌트
    ├── StudentForm/
    └── ClassForm/
```

### 3.3 Props 설계 원칙

```typescript
// ✅ Props 인터페이스 설계 모범 사례
interface ComponentProps {
  // 1. 필수 props 먼저
  id: string;
  title: string;
  
  // 2. 선택적 props는 기본값과 함께
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  
  // 3. 이벤트 핸들러
  onClick?: (event: MouseEvent) => void;
  onSubmit?: (data: FormData) => Promise<void>;
  
  // 4. 렌더링 관련
  children?: ReactNode;
  className?: string;
  
  // 5. 접근성 관련
  'aria-label'?: string;
  'aria-describedby'?: string;
}

// ❌ 피해야 할 패턴
interface BadProps {
  data: any;  // 타입 불명확
  config: object;  // 구조 불명확
  handlers: Function[];  // 용도 불명확
}
```

### 3.4 훅 사용 규칙

```typescript
// ✅ 커스텀 훅 작성 규칙
/**
 * ClassFlow 드래그앤드롭 로직을 관리하는 훅
 */
function useClassFlowDragDrop() {
  const [draggedStudent, setDraggedStudent] = useState<Student | null>(null);
  const [targetClass, setTargetClass] = useState<ClassInfo | null>(null);

  const startDrag = useCallback((student: Student) => {
    setDraggedStudent(student);
  }, []);

  const endDrag = useCallback(async () => {
    if (draggedStudent && targetClass) {
      try {
        await moveStudent(draggedStudent.id, targetClass.id);
        // 성공 처리
      } catch (error) {
        // 에러 처리 및 롤백
        console.error('Failed to move student:', error);
      }
    }
    
    setDraggedStudent(null);
    setTargetClass(null);
  }, [draggedStudent, targetClass]);

  return {
    draggedStudent,
    targetClass,
    startDrag,
    endDrag,
    setTargetClass,
  };
}

// ✅ 훅 사용 시 의존성 배열 명시
const Component = () => {
  const { data, loading, error } = useSWR(
    `/api/students/${classId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분 중복 제거
    }
  );

  const memoizedValue = useMemo(() => {
    return expensiveCalculation(data);
  }, [data]); // 의존성 명확히 명시

  return <div>...</div>;
};
```

---

## 4. 파일 및 폴더 명명 규칙

### 4.1 파일 명명 규칙 📁

```
// ✅ 파일 명명 규칙
Components: PascalCase
├── StudentCard.tsx
├── ClassFlowPanel.tsx
└── PaymentHistoryTable.tsx

Hooks: camelCase with 'use' prefix
├── useStudentData.ts
├── useClassFlowDragDrop.ts
└── usePaymentValidation.ts

Utilities: camelCase
├── formatDate.ts
├── validateEmail.ts
└── calculateGPA.ts

Types: PascalCase with descriptive suffix
├── Student.types.ts
├── ClassFlow.types.ts
└── Payment.types.ts

Constants: UPPER_SNAKE_CASE
├── API_ENDPOINTS.ts
├── ERROR_MESSAGES.ts
└── VALIDATION_RULES.ts
```

### 4.2 폴더 구조 규칙

```typescript
// ✅ 권장 폴더 구조
src/
├── app/                    // Next.js 13+ App Router
│   ├── (admin)/           // 라우트 그룹
│   │   └── dashboard/     // 대시보드 페이지
│   └── api/              // API 라우트
├── components/            // 재사용 컴포넌트
│   ├── ui/               // 기본 UI 컴포넌트
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts      // Named export
│   │   └── Modal/
│   └── features/          // 기능별 컴포넌트
│       ├── classflow/
│       └── students/
├── hooks/                 // 커스텀 훅
├── lib/                   // 외부 라이브러리 설정
├── store/                 // 상태 관리
├── types/                 // 타입 정의
├── utils/                 // 유틸리티 함수
└── constants/             // 상수 정의
```

### 4.3 Import/Export 규칙

```typescript
// ✅ Named Export 사용 (기본 원칙)
// Button/index.ts
export { default as Button } from './Button';
export type { ButtonProps } from './Button';

// 컴포넌트 사용 시
import { Button } from '@/components/ui/Button';

// ✅ Default Export는 페이지 컴포넌트만
// app/dashboard/page.tsx
export default function DashboardPage() {
  return <div>Dashboard</div>;
}

// ✅ Import 순서
import React, { useState, useCallback } from 'react';  // 1. React 관련
import { NextPage } from 'next';                        // 2. 외부 라이브러리
import { Button } from '@/components/ui/Button';       // 3. 내부 컴포넌트
import { useStudentData } from '@/hooks/useStudentData'; // 4. 내부 훅
import { Student } from '@/types/Student';             // 5. 타입
import { formatDate } from '@/utils/formatDate';       // 6. 유틸리티
import './Component.css';                              // 7. CSS (필요시)
```

---

## 5. 주석 및 문서화 규칙

### 5.1 함수 문서화 📖

**모든 public 함수는 JSDoc을 작성합니다**:

```typescript
/**
 * 학생을 다른 반으로 이동시킵니다.
 * ClassFlow의 핵심 기능으로, 드래그앤드롭 시 호출됩니다.
 * 
 * @param studentId - 이동할 학생의 고유 ID
 * @param targetClassId - 대상 반의 고유 ID
 * @param options - 이동 옵션
 * @param options.skipValidation - 유효성 검사 건너뛰기 여부
 * @param options.notifyParents - 학부모 알림 발송 여부
 * 
 * @returns 이동 결과 정보가 포함된 Promise
 * 
 * @throws {ValidationError} 정원 초과 시 발생
 * @throws {PermissionError} 권한 부족 시 발생
 * 
 * @example
 * ```typescript
 * try {
 *   const result = await moveStudent('student-123', 'class-456', {
 *     notifyParents: true
 *   });
 *   console.log(`Successfully moved to ${result.targetClassName}`);
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     showError('반 정원이 초과되었습니다.');
 *   }
 * }
 * ```
 * 
 * @since v1.0.0
 * @version 2.1.0 - 알림 기능 추가
 */
async function moveStudent(
  studentId: string,
  targetClassId: string,
  options: MoveStudentOptions = {}
): Promise<MoveStudentResult> {
  // 구현...
}
```

### 5.2 컴포넌트 문서화

```typescript
/**
 * ClassFlow 메인 패널 컴포넌트
 * 
 * 드래그앤드롭을 통한 학생 관리의 핵심 인터페이스입니다.
 * 60fps 성능을 보장하기 위해 react-window를 사용한 가상화가 적용되어 있습니다.
 * 
 * @component
 * @example
 * ```tsx
 * <ClassFlowPanel
 *   classes={classesData}
 *   students={studentsData}
 *   onStudentMove={handleStudentMove}
 *   virtualized={studentsData.length > 1000}
 * />
 * ```
 */
const ClassFlowPanel = ({
  classes,
  students,
  onStudentMove,
  virtualized = false
}: ClassFlowPanelProps) => {
  // 구현...
};
```

### 5.3 복잡한 로직 주석

```typescript
// ✅ 복잡한 비즈니스 로직에는 단계별 주석
async function calculateStudentFee(student: Student, coursePackage: CoursePackage): Promise<number> {
  // 1. 기본 수강료 계산
  let totalFee = coursePackage.basePrice;
  
  // 2. 형제 할인 적용 (둘째부터 10%, 셋째부터 20%)
  const siblingDiscount = await getSiblingDiscount(student.parentId);
  if (siblingDiscount > 0) {
    totalFee -= (totalFee * siblingDiscount / 100);
  }
  
  // 3. 조기 납부 할인 적용 (매월 25일 이전 5% 할인)
  const isEarlyPayment = new Date().getDate() <= 25;
  if (isEarlyPayment) {
    totalFee -= (totalFee * 0.05);
  }
  
  // 4. 최소 금액 보장 (할인이 과도하게 적용되는 것 방지)
  return Math.max(totalFee, coursePackage.minimumFee);
}

// ✅ TODO 주석은 구체적으로 작성
// TODO(김개발, 2025-08-15): Phase 5에서 AI 추천 로직 구현 필요
//   - 학생 학습 패턴 분석
//   - 최적 반 배정 알고리즘
//   - A/B 테스트 준비
function getOptimalClass(student: Student): ClassInfo {
  // 현재는 단순 로직, 향후 AI로 대체 예정
  return getAvailableClasses().find(cls => cls.gradeLevel === student.grade);
}

// ✅ 성능 최적화 관련 주석
// PERFORMANCE: 대용량 데이터 처리를 위한 가상화 적용
// 1000개 이상의 학생 데이터에서 60fps 유지를 위해 react-window 사용
const VirtualizedStudentList = useMemo(() => {
  if (students.length < 1000) {
    return <RegularStudentList students={students} />;
  }
  
  return (
    <FixedSizeList
      height={600}
      itemCount={students.length}
      itemSize={80}
      overscanCount={5}  // 스크롤 성능 최적화
    >
      {StudentRowRenderer}
    </FixedSizeList>
  );
}, [students]);
```

### 5.4 금지되는 주석

```typescript
// ❌ 피해야 할 주석들

// 이 함수는 학생을 이동시킨다 (코드 자체가 설명하는 내용)
function moveStudent() {}

// 임시 코드 (임시 코드는 절대 금지)
// const temp = 'temporary solution';

// 주석 처리된 오래된 코드 (삭제해야 함)
// function oldFunction() {
//   // 이전 구현...
// }

// 의미 없는 주석
let i = 0; // 카운터 변수

// 욕설이나 부정적 표현
// 이 코드는 쓰레기다
// 누가 이렇게 짰지?
```

---

## 6. 테스트 작성 규칙

### 6.1 테스트 전략 🧪

**테스트 피라미드 적용**:
- **Unit Tests (70%)**: 개별 함수/컴포넌트 테스트
- **Integration Tests (20%)**: 컴포넌트 간 상호작용 테스트  
- **E2E Tests (10%)**: 전체 사용자 플로우 테스트

```typescript
// ✅ 유닛 테스트 예시
// utils/calculateGPA.test.ts
describe('calculateGPA', () => {
  it('should calculate correct GPA for valid scores', () => {
    // Arrange
    const scores = [
      { subject: 'Math', score: 95, credit: 3 },
      { subject: 'English', score: 87, credit: 2 },
      { subject: 'Science', score: 92, credit: 4 }
    ];

    // Act
    const result = calculateGPA(scores);

    // Assert
    expect(result).toBeCloseTo(3.78, 2);
  });

  it('should throw error for invalid scores', () => {
    // Arrange
    const invalidScores = [
      { subject: 'Math', score: 101, credit: 3 } // 점수 범위 초과
    ];

    // Act & Assert
    expect(() => calculateGPA(invalidScores)).toThrow('Invalid score range');
  });

  it('should handle empty scores array', () => {
    // Arrange
    const emptyScores: Score[] = [];

    // Act
    const result = calculateGPA(emptyScores);

    // Assert
    expect(result).toBe(0);
  });
});
```

### 6.2 컴포넌트 테스트

```typescript
// ✅ React 컴포넌트 테스트
// components/StudentCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { StudentCard } from './StudentCard';

const mockStudent: Student = {
  id: 'student-123',
  name: '김철수',
  grade: '9',
  classId: 'class-456',
  status: 'active'
};

describe('StudentCard', () => {
  const mockOnMove = jest.fn();

  beforeEach(() => {
    mockOnMove.mockClear();
  });

  it('renders student information correctly', () => {
    // Arrange & Act
    render(
      <StudentCard 
        student={mockStudent} 
        onMove={mockOnMove} 
      />
    );

    // Assert
    expect(screen.getByText('김철수')).toBeInTheDocument();
    expect(screen.getByText('9 학년')).toBeInTheDocument();
    expect(screen.getByLabelText('학생 김철수, 9 학년')).toBeInTheDocument();
  });

  it('calls onMove when drag ends with target class', () => {
    // Arrange
    render(
      <StudentCard 
        student={mockStudent} 
        onMove={mockOnMove} 
      />
    );

    const card = screen.getByRole('button');

    // Act
    fireEvent.dragEnd(card, {
      target: { getAttribute: () => 'class-789' }
    });

    // Assert
    expect(mockOnMove).toHaveBeenCalledWith('student-123', 'class-789');
  });

  it('applies selected styles when isSelected is true', () => {
    // Arrange & Act
    render(
      <StudentCard 
        student={mockStudent} 
        onMove={mockOnMove} 
        isSelected={true}
      />
    );

    const card = screen.getByRole('button');

    // Assert
    expect(card).toHaveClass('ring-2', 'ring-blue-500', 'bg-blue-50');
  });
});
```

### 6.3 통합 테스트

```typescript
// ✅ 통합 테스트 예시
// features/classflow/ClassFlowPanel.integration.test.tsx
describe('ClassFlow Integration', () => {
  it('should move student between classes with full flow', async () => {
    // Arrange
    const { user } = renderWithProviders(
      <ClassFlowPanel 
        classes={mockClasses} 
        students={mockStudents}
      />
    );

    // Act: 학생 카드를 다른 반으로 드래그
    const studentCard = screen.getByText('김철수');
    const targetClass = screen.getByText('A반');

    await user.drag(studentCard, targetClass);

    // Assert: UI 업데이트 확인
    expect(screen.getByText('A반')).toBeInTheDocument();
    
    // API 호출 확인
    await waitFor(() => {
      expect(mockAPI.moveStudent).toHaveBeenCalledWith(
        'student-123', 
        'class-A'
      );
    });

    // 상태 업데이트 확인
    expect(screen.getByText('김철수')).toHaveAttribute(
      'data-class-id', 
      'class-A'
    );
  });
});
```

### 6.4 E2E 테스트 (Playwright)

```typescript
// ✅ E2E 테스트 예시
// e2e/classflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('ClassFlow E2E', () => {
  test('should complete student movement workflow', async ({ page }) => {
    // 로그인
    await page.goto('/login');
    await page.fill('[data-testid=email]', 'admin@test.com');
    await page.fill('[data-testid=password]', 'password123');
    await page.click('[data-testid=login-button]');

    // 대시보드 이동
    await expect(page).toHaveURL('/dashboard');

    // ClassFlow 패널 열기
    await page.click('[data-testid=classflow-button]');
    
    // 학생 이동 테스트
    const studentCard = page.locator('[data-testid=student-김철수]');
    const targetClass = page.locator('[data-testid=class-A반]');

    await studentCard.dragTo(targetClass);

    // 성공 메시지 확인
    await expect(page.locator('.toast-success')).toContainText(
      '김철수 학생이 A반으로 이동되었습니다'
    );

    // 데이터베이스 업데이트 확인
    await page.reload();
    await expect(
      page.locator('[data-testid=class-A반] [data-testid=student-김철수]')
    ).toBeVisible();
  });

  test('should maintain 60fps during bulk operations', async ({ page }) => {
    // 성능 모니터링 시작
    await page.goto('/dashboard?students=1000');
    
    const performanceEntries = await page.evaluate(() => {
      return performance.getEntriesByType('measure');
    });

    // 드래그 작업 수행
    for (let i = 0; i < 10; i++) {
      await page.locator(`[data-testid=student-${i}]`)
        .dragTo(page.locator('[data-testid=class-target]'));
    }

    // FPS 검증 (60fps = 16.67ms per frame)
    const frameTimes = await page.evaluate(() => {
      return window.performance.getEntriesByType('measure')
        .filter(entry => entry.name.includes('frame'))
        .map(entry => entry.duration);
    });

    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    expect(avgFrameTime).toBeLessThan(16.67); // 60fps 보장
  });
});
```

### 6.5 테스트 커버리지

```json
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // 핵심 모듈은 높은 커버리지 요구
    './src/features/classflow/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ]
};
```

---

## 7. 성능 최적화 가이드라인

### 7.1 React 렌더링 최적화 ⚡

**ClassFlow 60fps 보장을 위한 필수 최적화**:

```typescript
// ✅ 메모이제이션 활용
const StudentCard = memo(({ student, onMove, isSelected }: StudentCardProps) => {
  // 콜백 메모이제이션
  const handleDragStart = useCallback((e: DragEvent) => {
    e.dataTransfer.setData('student-id', student.id);
  }, [student.id]);

  const handleDragEnd = useCallback((e: DragEvent) => {
    const targetClassId = e.dataTransfer.getData('target-class-id');
    if (targetClassId !== student.classId) {
      onMove(student.id, targetClassId);
    }
  }, [student.id, student.classId, onMove]);

  // 계산값 메모이제이션
  const studentDisplayInfo = useMemo(() => ({
    initials: student.name.charAt(0),
    gradeLabel: `${student.grade} 학년`,
    statusColor: getStatusColor(student.status)
  }), [student.name, student.grade, student.status]);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`student-card ${isSelected ? 'selected' : ''}`}
    >
      {/* 렌더링 */}
    </div>
  );
});

// ✅ 대용량 데이터 가상화
const VirtualizedClassList = ({ classes, students }: ClassListProps) => {
  const getItemSize = useCallback((index: number) => {
    const studentsCount = students.filter(s => s.classId === classes[index].id).length;
    return Math.max(200, studentsCount * 80 + 100); // 동적 높이 계산
  }, [classes, students]);

  return (
    <VariableSizeList
      height={800}
      itemCount={classes.length}
      itemSize={getItemSize}
      overscanCount={2}
    >
      {({ index, style }) => (
        <div style={style}>
          <ClassPanel 
            classInfo={classes[index]}
            students={students.filter(s => s.classId === classes[index].id)}
          />
        </div>
      )}
    </VariableSizeList>
  );
};

// ✅ 상태 업데이트 최적화
const useClassFlowStore = create<ClassFlowState>((set, get) => ({
  students: [],
  draggedStudent: null,
  
  // 배치 업데이트로 리렌더링 최소화
  moveStudentOptimistic: (studentId: string, targetClassId: string) => {
    set(produce((state) => {
      const student = state.students.find(s => s.id === studentId);
      if (student) {
        student.classId = targetClassId; // Immer로 불변성 유지
      }
    }));
  },

  // 에러 시 롤백
  rollbackStudentMove: (studentId: string, originalClassId: string) => {
    set(produce((state) => {
      const student = state.students.find(s => s.id === studentId);
      if (student) {
        student.classId = originalClassId;
      }
    }));
  }
}));
```

### 7.2 번들 사이즈 최적화

```typescript
// ✅ 동적 import 활용
const LazyChartsModule = lazy(() => 
  import('@/components/charts').then(module => ({
    default: module.ChartsModule
  }))
);

// 큰 라이브러리는 필요시에만 로드
const loadAnalyticsModule = async () => {
  const { AnalyticsEngine } = await import('@/lib/analytics');
  return new AnalyticsEngine();
};

// ✅ Tree-shaking 최적화
// 전체 라이브러리 import 금지
// ❌ import * as _ from 'lodash';
// ✅ import { debounce } from 'lodash-es';

// 또는 개별 패키지 사용
// ✅ import debounce from 'lodash.debounce';
```

### 7.3 API 호출 최적화

```typescript
// ✅ SWR/React Query 활용한 캐싱 전략
const useStudentsData = (classId: string) => {
  return useSWR(
    classId ? `/api/students?classId=${classId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분간 중복 요청 방지
      focusThrottleInterval: 5000, // 포커스 시 재검증 throttle
      onError: (error) => {
        // 에러 추적
        Sentry.captureException(error);
      }
    }
  );
};

// ✅ 낙관적 업데이트
const moveStudentMutation = useMutation({
  mutationFn: (params: MoveStudentParams) => 
    api.moveStudent(params.studentId, params.targetClassId),
  
  // 즉시 UI 업데이트
  onMutate: async (params) => {
    await queryClient.cancelQueries(['students']);
    
    const previousStudents = queryClient.getQueryData(['students']);
    
    // 낙관적 업데이트
    queryClient.setQueryData(['students'], (old: Student[]) => 
      old.map(student => 
        student.id === params.studentId 
          ? { ...student, classId: params.targetClassId }
          : student
      )
    );
    
    return { previousStudents };
  },
  
  // 실패 시 롤백
  onError: (error, params, context) => {
    queryClient.setQueryData(['students'], context.previousStudents);
    toast.error('학생 이동에 실패했습니다. 다시 시도해주세요.');
  },
  
  // 성공 시 서버 데이터로 동기화
  onSettled: () => {
    queryClient.invalidateQueries(['students']);
  }
});

// ✅ 배치 처리
const useBatchedUpdates = () => {
  const pendingUpdates = useRef<StudentUpdate[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const addUpdate = useCallback((update: StudentUpdate) => {
    pendingUpdates.current.push(update);
    
    // 100ms 후 배치 처리
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (pendingUpdates.current.length > 0) {
        api.batchUpdateStudents(pendingUpdates.current);
        pendingUpdates.current = [];
      }
    }, 100);
  }, []);

  return { addUpdate };
};
```

### 7.4 메모리 관리

```typescript
// ✅ 메모리 누수 방지
const useClassFlowSubscription = (classId: string) => {
  useEffect(() => {
    const subscription = supabase
      .channel(`class-${classId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'students',
          filter: `class_id=eq.${classId}`
        },
        (payload) => {
          // 실시간 업데이트 처리
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe();

    // 정리 함수에서 구독 해제
    return () => {
      subscription.unsubscribe();
    };
  }, [classId]);
};

// ✅ 이벤트 리스너 정리
const useDragDropEvents = () => {
  useEffect(() => {
    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
      // 글로벌 드롭 처리
    };

    document.addEventListener('dragover', handleGlobalDrop);
    document.addEventListener('drop', handleGlobalDrop);

    return () => {
      document.removeEventListener('dragover', handleGlobalDrop);
      document.removeEventListener('drop', handleGlobalDrop);
    };
  }, []);
};
```

---

## 8. 접근성 규칙

### 8.1 WCAG 2.1 AA 준수 ♿

**모든 컴포넌트는 접근성을 필수로 고려합니다**:

```typescript
// ✅ 접근성을 고려한 ClassFlow 컴포넌트
const ClassFlowPanel = () => {
  const [announceMessage, setAnnounceMessage] = useState('');

  const handleStudentMove = useCallback(async (
    studentId: string, 
    targetClassId: string
  ) => {
    try {
      await moveStudent(studentId, targetClassId);
      
      // 스크린 리더를 위한 상태 안내
      const student = getStudent(studentId);
      const targetClass = getClass(targetClassId);
      setAnnounceMessage(
        `${student.name} 학생이 ${targetClass.name}으로 이동되었습니다.`
      );
    } catch (error) {
      setAnnounceMessage('학생 이동 중 오류가 발생했습니다.');
    }
  }, []);

  return (
    <div role="application" aria-label="학생 반 배정 관리">
      {/* 실시간 상태 안내 */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announceMessage}
      </div>

      {/* 키보드 사용자를 위한 안내 */}
      <div className="sr-only">
        학생 카드에서 Tab 키로 이동하고, Enter 키로 선택한 후 
        화살표 키로 대상 반을 선택하고 Enter 키로 이동을 완료하세요.
      </div>

      <div className="classflow-grid">
        {classes.map(classInfo => (
          <ClassCard
            key={classInfo.id}
            classInfo={classInfo}
            students={studentsInClass[classInfo.id]}
            onStudentMove={handleStudentMove}
          />
        ))}
      </div>
    </div>
  );
};

// ✅ 키보드 네비게이션 지원
const StudentCard = ({ student, onMove }: StudentCardProps) => {
  const [isSelected, setIsSelected] = useState(false);
  const [targetClassId, setTargetClassId] = useState<string | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isSelected) {
          setIsSelected(true);
          // 선택 모드 진입 안내
          announce('학생을 선택했습니다. 화살표 키로 대상 반을 선택하세요.');
        } else if (targetClassId) {
          onMove(student.id, targetClassId);
          setIsSelected(false);
          setTargetClassId(null);
        }
        break;

      case 'ArrowRight':
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'ArrowDown':
        if (isSelected) {
          e.preventDefault();
          const nextClassId = getNextClassId(e.key, targetClassId);
          setTargetClassId(nextClassId);
          
          const nextClass = getClass(nextClassId);
          announce(`대상 반: ${nextClass.name}`);
        }
        break;

      case 'Escape':
        setIsSelected(false);
        setTargetClassId(null);
        announce('선택을 취소했습니다.');
        break;
    }
  }, [isSelected, targetClassId, student.id, onMove]);

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`학생 ${student.name}, ${student.grade} 학년`}
      aria-describedby={`student-${student.id}-description`}
      aria-pressed={isSelected}
      className={cn(
        'student-card',
        isSelected && 'student-card--selected',
        'focus:ring-2 focus:ring-blue-500 focus:outline-none'
      )}
    >
      <div className="student-info">
        {student.name}
      </div>
      
      <div 
        id={`student-${student.id}-description`}
        className="sr-only"
      >
        {student.grade} 학년, {student.className}에 소속
        {isSelected && targetClassId && 
          `, ${getClass(targetClassId).name}으로 이동 준비됨`
        }
      </div>
    </div>
  );
};
```

### 8.2 색상 및 대비

```typescript
// ✅ 색상 접근성 고려
const colorConfig = {
  // WCAG AA 기준 4.5:1 대비율 준수
  primary: {
    bg: '#2563eb',      // 충분한 대비율
    text: '#ffffff',
    border: '#1d4ed8'
  },
  success: {
    bg: '#059669',      // 색각 이상자 고려
    text: '#ffffff',
    border: '#047857'
  },
  error: {
    bg: '#dc2626',
    text: '#ffffff',
    border: '#b91c1c'
  },
  // 색상만으로 정보를 전달하지 않음
  status: {
    active: { bg: '#059669', icon: 'check-circle', text: '활성' },
    inactive: { bg: '#6b7280', icon: 'pause-circle', text: '비활성' },
    warning: { bg: '#d97706', icon: 'exclamation-triangle', text: '주의' }
  }
} as const;

// ✅ 다크 모드 접근성
const useThemeColors = () => {
  const { theme } = useTheme();
  
  return {
    cardBg: theme === 'dark' 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-white border-gray-200',
    text: theme === 'dark' 
      ? 'text-gray-100' 
      : 'text-gray-900',
    textSecondary: theme === 'dark' 
      ? 'text-gray-300' 
      : 'text-gray-600'
  };
};
```

### 8.3 폼 접근성

```typescript
// ✅ 접근성을 고려한 폼 컴포넌트
interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  children: ReactNode;
}

const FormField = ({ 
  id, 
  label, 
  required = false, 
  error, 
  help, 
  children 
}: FormFieldProps) => {
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ');

  return (
    <div className="form-field">
      <label 
        htmlFor={id}
        className="form-label"
      >
        {label}
        {required && (
          <span aria-label="필수 입력" className="text-red-500">
            *
          </span>
        )}
      </label>
      
      {React.cloneElement(children as ReactElement, {
        id,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? 'true' : 'false',
        'aria-required': required
      })}
      
      {help && (
        <div id={helpId} className="form-help">
          {help}
        </div>
      )}
      
      {error && (
        <div 
          id={errorId} 
          role="alert" 
          className="form-error"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </div>
  );
};

// 사용 예시
<FormField 
  id="student-name"
  label="학생 이름"
  required
  error={errors.name?.message}
  help="한글 또는 영문으로 입력하세요"
>
  <input 
    type="text"
    {...register('name', { 
      required: '학생 이름은 필수입니다',
      minLength: { value: 2, message: '이름은 2글자 이상이어야 합니다' }
    })}
  />
</FormField>
```

---

## 9. 상태 관리 패턴

### 9.1 Zustand 스토어 설계 🗄️

```typescript
// ✅ ClassFlow 전용 스토어 설계
interface ClassFlowState {
  // 상태 데이터
  students: Student[];
  classes: ClassInfo[];
  draggedStudent: Student | null;
  targetClass: ClassInfo | null;
  
  // UI 상태
  isLoading: boolean;
  error: string | null;
  selectedStudents: Set<string>;
  
  // 필터 및 검색
  filters: {
    grade: string[];
    status: StudentStatus[];
    search: string;
  };
  
  // 액션들
  actions: {
    // 데이터 로딩
    loadStudents: () => Promise<void>;
    loadClasses: () => Promise<void>;
    
    // 드래그앤드롭
    startDrag: (student: Student) => void;
    setTargetClass: (classInfo: ClassInfo | null) => void;
    endDrag: () => Promise<void>;
    cancelDrag: () => void;
    
    // 학생 관리
    moveStudent: (studentId: string, targetClassId: string) => Promise<void>;
    updateStudent: (studentId: string, updates: Partial<Student>) => Promise<void>;
    
    // 선택 관리
    selectStudent: (studentId: string) => void;
    selectMultiple: (studentIds: string[]) => void;
    clearSelection: () => void;
    
    // 필터링
    setFilter: (key: keyof ClassFlowState['filters'], value: any) => void;
    clearFilters: () => void;
    
    // 에러 처리
    setError: (error: string | null) => void;
    clearError: () => void;
  };
}

// ✅ 스토어 구현
const useClassFlowStore = create<ClassFlowState>((set, get) => ({
  // 초기 상태
  students: [],
  classes: [],
  draggedStudent: null,
  targetClass: null,
  isLoading: false,
  error: null,
  selectedStudents: new Set(),
  filters: {
    grade: [],
    status: [],
    search: ''
  },

  actions: {
    // 학생 데이터 로딩
    loadStudents: async () => {
      set({ isLoading: true, error: null });
      
      try {
        const students = await api.getStudents();
        set({ students, isLoading: false });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '데이터 로딩 실패',
          isLoading: false 
        });
      }
    },

    // 드래그 시작
    startDrag: (student) => {
      set({ draggedStudent: student });
      
      // 드래그 시각적 피드백
      document.body.classList.add('dragging');
    },

    // 대상 클래스 설정
    setTargetClass: (classInfo) => {
      const { draggedStudent } = get();
      
      // 유효성 검사
      if (draggedStudent && classInfo) {
        const isValidTarget = validateClassTransfer(draggedStudent, classInfo);
        if (!isValidTarget.valid) {
          set({ error: isValidTarget.message });
          return;
        }
      }
      
      set({ targetClass: classInfo, error: null });
    },

    // 드래그 종료
    endDrag: async () => {
      const { draggedStudent, targetClass } = get();
      
      if (!draggedStudent || !targetClass) {
        get().actions.cancelDrag();
        return;
      }

      try {
        // 낙관적 업데이트
        set(produce((state) => {
          const student = state.students.find(s => s.id === draggedStudent.id);
          if (student) {
            student.classId = targetClass.id;
          }
        }));

        // 서버 업데이트
        await api.moveStudent(draggedStudent.id, targetClass.id);
        
        // 성공 상태 정리
        set({ 
          draggedStudent: null, 
          targetClass: null 
        });
        
        // 스크린 리더 안내
        announceToScreenReader(
          `${draggedStudent.name} 학생이 ${targetClass.name}으로 이동되었습니다.`
        );
        
      } catch (error) {
        // 롤백
        set(produce((state) => {
          const student = state.students.find(s => s.id === draggedStudent.id);
          if (student) {
            student.classId = draggedStudent.classId; // 원래 위치로 복원
          }
        }));
        
        set({ 
          error: '학생 이동에 실패했습니다. 다시 시도해주세요.',
          draggedStudent: null,
          targetClass: null
        });
      } finally {
        document.body.classList.remove('dragging');
      }
    },

    // 드래그 취소
    cancelDrag: () => {
      set({ 
        draggedStudent: null, 
        targetClass: null,
        error: null
      });
      document.body.classList.remove('dragging');
    },

    // 필터 설정
    setFilter: (key, value) => {
      set(produce((state) => {
        state.filters[key] = value;
      }));
    }
  }
}));

// ✅ 선택적 스토어 구독 (성능 최적화)
const useClassFlowStudents = () => 
  useClassFlowStore(state => state.students);

const useClassFlowActions = () => 
  useClassFlowStore(state => state.actions);

const useClassFlowDragState = () => 
  useClassFlowStore(state => ({
    draggedStudent: state.draggedStudent,
    targetClass: state.targetClass,
    isDragging: state.draggedStudent !== null
  }));
```

### 9.2 상태 정규화

```typescript
// ✅ 정규화된 상태 구조
interface NormalizedState {
  students: {
    byId: Record<string, Student>;
    allIds: string[];
    byClassId: Record<string, string[]>; // 성능 최적화를 위한 인덱스
  };
  classes: {
    byId: Record<string, ClassInfo>;
    allIds: string[];
  };
  ui: {
    selectedStudentIds: Set<string>;
    expandedClassIds: Set<string>;
    dragState: DragState;
  };
}

// 정규화 헬퍼 함수들
const studentAdapter = {
  addStudent: (state: NormalizedState, student: Student) => {
    state.students.byId[student.id] = student;
    if (!state.students.allIds.includes(student.id)) {
      state.students.allIds.push(student.id);
    }
    
    // 인덱스 업데이트
    if (!state.students.byClassId[student.classId]) {
      state.students.byClassId[student.classId] = [];
    }
    if (!state.students.byClassId[student.classId].includes(student.id)) {
      state.students.byClassId[student.classId].push(student.id);
    }
  },
  
  removeStudent: (state: NormalizedState, studentId: string) => {
    const student = state.students.byId[studentId];
    if (student) {
      delete state.students.byId[studentId];
      state.students.allIds = state.students.allIds.filter(id => id !== studentId);
      
      // 인덱스 업데이트
      state.students.byClassId[student.classId] = 
        state.students.byClassId[student.classId].filter(id => id !== studentId);
    }
  },
  
  moveStudent: (state: NormalizedState, studentId: string, newClassId: string) => {
    const student = state.students.byId[studentId];
    if (student) {
      const oldClassId = student.classId;
      
      // 학생 정보 업데이트
      student.classId = newClassId;
      
      // 인덱스 업데이트
      state.students.byClassId[oldClassId] = 
        state.students.byClassId[oldClassId].filter(id => id !== studentId);
      
      if (!state.students.byClassId[newClassId]) {
        state.students.byClassId[newClassId] = [];
      }
      state.students.byClassId[newClassId].push(studentId);
    }
  }
};
```

---

## 10. 에러 핸들링

### 10.1 에러 경계 및 복구 🚨

```typescript
// ✅ ClassFlow 전용 에러 경계
interface ClassFlowErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

class ClassFlowErrorBoundary extends Component<
  { children: ReactNode },
  ClassFlowErrorBoundaryState
> {
  private maxRetries = 3;

  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ClassFlowErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Sentry에 에러 전송
    Sentry.captureException(error, {
      tags: {
        component: 'ClassFlowErrorBoundary',
        feature: 'drag-drop'
      },
      contexts: {
        react: {
          componentStack: errorInfo.componentStack
        }
      }
    });

    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1
      });
    } else {
      // 최대 재시도 횟수 초과 시 전체 새로고침
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>ClassFlow에서 문제가 발생했습니다</h2>
            <p>
              학생 배정 시스템에 일시적인 문제가 발생했습니다. 
              잠시 후 다시 시도해주세요.
            </p>
            
            {this.state.retryCount < this.maxRetries ? (
              <button 
                onClick={this.handleRetry}
                className="retry-button"
              >
                다시 시도 ({this.maxRetries - this.state.retryCount}번 남음)
              </button>
            ) : (
              <button 
                onClick={() => window.location.reload()}
                className="reload-button"
              >
                페이지 새로고침
              </button>
            )}
            
            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>개발자 정보</summary>
                <pre>{this.state.error?.stack}</pre>
                <pre>{this.state.errorInfo?.componentStack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 10.2 API 에러 처리

```typescript
// ✅ 통합 에러 처리 시스템
enum APIErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED', 
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  CAPACITY_EXCEEDED = 'CAPACITY_EXCEEDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR'
}

class APIError extends Error {
  constructor(
    public code: APIErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// ✅ API 클라이언트의 에러 처리
class APIClient {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      let errorCode: APIErrorCode;
      let message: string;
      
      switch (response.status) {
        case 400:
          errorCode = APIErrorCode.VALIDATION_ERROR;
          message = errorData.message || '입력 데이터가 올바르지 않습니다.';
          break;
        case 403:
          errorCode = APIErrorCode.PERMISSION_DENIED;
          message = '이 작업을 수행할 권한이 없습니다.';
          break;
        case 404:
          errorCode = APIErrorCode.RESOURCE_NOT_FOUND;
          message = '요청한 리소스를 찾을 수 없습니다.';
          break;
        case 409:
          errorCode = APIErrorCode.CAPACITY_EXCEEDED;
          message = '반 정원이 초과되어 학생을 이동할 수 없습니다.';
          break;
        default:
          errorCode = APIErrorCode.SERVER_ERROR;
          message = '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      }
      
      throw new APIError(errorCode, message, response.status, errorData);
    }
    
    return response.json();
  }

  async moveStudent(studentId: string, targetClassId: string): Promise<MoveStudentResult> {
    try {
      const response = await fetch('/api/students/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, targetClassId })
      });
      
      return await this.handleResponse<MoveStudentResult>(response);
    } catch (error) {
      // 네트워크 에러 처리
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new APIError(
          APIErrorCode.NETWORK_ERROR,
          '네트워크 연결을 확인해주세요.',
          0
        );
      }
      
      throw error;
    }
  }
}

// ✅ 컴포넌트에서의 에러 처리
const ClassFlowPanel = () => {
  const [error, setError] = useState<APIError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleStudentMove = async (studentId: string, targetClassId: string) => {
    try {
      setError(null);
      await apiClient.moveStudent(studentId, targetClassId);
      
      // 성공 알림
      toast.success('학생이 성공적으로 이동되었습니다.');
      
    } catch (error) {
      if (error instanceof APIError) {
        setError(error);
        
        // 에러 타입에 따른 처리
        switch (error.code) {
          case APIErrorCode.CAPACITY_EXCEEDED:
            toast.error('반 정원이 초과되었습니다. 다른 반을 선택해주세요.');
            break;
          case APIErrorCode.PERMISSION_DENIED:
            toast.error('학생을 이동할 권한이 없습니다.');
            break;
          case APIErrorCode.NETWORK_ERROR:
            // 자동 재시도
            handleRetry(studentId, targetClassId);
            break;
          default:
            toast.error(error.message);
        }
        
        // 에러 추적
        Sentry.captureException(error, {
          tags: {
            feature: 'student-move',
            errorCode: error.code
          }
        });
      }
    }
  };

  const handleRetry = async (studentId: string, targetClassId: string) => {
    setIsRetrying(true);
    
    // 지수 백오프로 재시도
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        await apiClient.moveStudent(studentId, targetClassId);
        
        toast.success('학생이 성공적으로 이동되었습니다.');
        setError(null);
        break;
        
      } catch (retryError) {
        if (i === maxRetries - 1) {
          toast.error('재시도에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
      }
    }
    
    setIsRetrying(false);
  };

  return (
    <ClassFlowErrorBoundary>
      <div className="classflow-panel">
        {error && (
          <ErrorAlert 
            error={error} 
            onRetry={error.code === APIErrorCode.NETWORK_ERROR ? handleRetry : undefined}
            isRetrying={isRetrying}
          />
        )}
        
        {/* ClassFlow 컨텐츠 */}
      </div>
    </ClassFlowErrorBoundary>
  );
};
```

### 10.3 사용자 친화적 에러 메시지

```typescript
// ✅ 에러 메시지 국제화 및 사용자 친화화
const ERROR_MESSAGES = {
  [APIErrorCode.VALIDATION_ERROR]: {
    title: '입력 오류',
    message: '입력하신 정보를 확인해주세요.',
    suggestion: '누락된 정보가 있는지 확인하고 다시 시도해주세요.',
    recoverable: true
  },
  [APIErrorCode.PERMISSION_DENIED]: {
    title: '권한 없음',
    message: '이 작업을 수행할 권한이 없습니다.',
    suggestion: '관리자에게 권한 요청을 해주세요.',
    recoverable: false
  },
  [APIErrorCode.CAPACITY_EXCEEDED]: {
    title: '정원 초과',
    message: '선택한 반의 정원이 초과되었습니다.',
    suggestion: '다른 반을 선택하거나 반 정원을 늘려주세요.',
    recoverable: true
  },
  [APIErrorCode.NETWORK_ERROR]: {
    title: '연결 오류',
    message: '인터넷 연결을 확인해주세요.',
    suggestion: '잠시 후 자동으로 재시도됩니다.',
    recoverable: true
  }
} as const;

const ErrorAlert = ({ 
  error, 
  onRetry, 
  isRetrying 
}: {
  error: APIError;
  onRetry?: () => void;
  isRetrying?: boolean;
}) => {
  const errorConfig = ERROR_MESSAGES[error.code] || {
    title: '알 수 없는 오류',
    message: '예상치 못한 오류가 발생했습니다.',
    suggestion: '잠시 후 다시 시도해주세요.',
    recoverable: true
  };

  return (
    <div 
      role="alert"
      className="error-alert"
      aria-live="polite"
    >
      <div className="error-header">
        <AlertTriangleIcon className="error-icon" />
        <h3>{errorConfig.title}</h3>
      </div>
      
      <div className="error-body">
        <p className="error-message">{errorConfig.message}</p>
        <p className="error-suggestion">{errorConfig.suggestion}</p>
        
        {errorConfig.recoverable && onRetry && (
          <button 
            onClick={onRetry}
            disabled={isRetrying}
            className="retry-button"
          >
            {isRetrying ? '재시도 중...' : '다시 시도'}
          </button>
        )}
      </div>
    </div>
  );
};
```

---

## 11. Git 및 협업 규칙

### 11.1 커밋 메시지 규칙 📝

**Conventional Commits 스타일을 따릅니다**:

```bash
# ✅ 커밋 메시지 형식
<type>(scope): <description>

[optional body]

[optional footer(s)]

# 예시들
feat(classflow): add drag-and-drop student movement
fix(payments): resolve discount calculation error  
docs(api): update student management endpoints
perf(classflow): optimize rendering for 1000+ students
test(students): add integration tests for CRUD operations
refactor(auth): simplify RBAC permission logic

# 상세 예시
feat(classflow): implement keyboard navigation for accessibility

- Add Tab, Enter, Arrow key support for student cards
- Include ARIA announcements for screen readers  
- Maintain focus management during drag operations
- Add escape key to cancel drag operations

Closes #156
Resolves #142
```

### 11.2 브랜치 전략

```bash
# ✅ 브랜치 명명 규칙
main                    # 프로덕션 코드
develop                # 개발 통합 브랜치

# 기능 개발
feature/classflow-drag-drop
feature/student-management
feature/payment-system

# 버그 수정  
fix/classflow-performance-issue
fix/payment-calculation-bug

# 핫픽스
hotfix/critical-security-patch

# 릴리스 준비
release/v1.0.0
release/v1.1.0

# 예시 작업 플로우
git checkout develop
git pull origin develop
git checkout -b feature/student-search-filter

# 작업 완료 후
git add .
git commit -m "feat(students): add advanced search and filter functionality

- Implement real-time search with debouncing
- Add filters for grade, status, and enrollment date  
- Include search result highlighting
- Optimize search performance for 1000+ students

Closes #234"

git push origin feature/student-search-filter
```

### 11.3 Pull Request 규칙

```markdown
<!-- ✅ PR 템플릿 -->
## 📋 변경 사항 요약
간결하고 명확하게 변경 내용을 설명해주세요.

## 🔍 변경 상세
- [ ] 새로운 기능 추가
- [ ] 버그 수정  
- [ ] 리팩토링
- [ ] 문서 업데이트
- [ ] 테스트 추가
- [ ] 성능 개선

## 🧪 테스트 계획
- [ ] 유닛 테스트 추가/업데이트 
- [ ] 통합 테스트 실행
- [ ] E2E 테스트 확인
- [ ] 수동 테스트 완료

## 📊 성능 영향
ClassFlow 60fps 성능에 영향이 있는지 확인해주세요:
- [ ] 성능 영향 없음
- [ ] 성능 개선
- [ ] 성능 측정 필요

## ♿ 접근성 체크리스트
- [ ] 키보드 네비게이션 테스트
- [ ] 스크린 리더 테스트
- [ ] 색상 대비 확인  
- [ ] ARIA 레이블 적절히 사용

## 📱 브라우저 호환성
테스트한 브라우저를 체크해주세요:
- [ ] Chrome (최신)
- [ ] Firefox (최신)
- [ ] Safari (최신) 
- [ ] Edge (최신)

## 🔗 관련 이슈
Closes #123
Resolves #456
Related to #789

## 📸 스크린샷 (UI 변경 시)
변경사항을 보여주는 스크린샷이나 GIF를 첨부해주세요.

## 📝 리뷰어를 위한 노트
리뷰어가 특별히 주의깊게 봐야 할 부분이 있다면 알려주세요.
```

### 11.4 코드 리뷰 가이드라인

```typescript
// ✅ 코드 리뷰 체크리스트

/**
 * 1. 기능적 검토
 * - 코드가 요구사항을 충족하는가?
 * - 비즈니스 로직이 정확한가?
 * - 엣지 케이스가 처리되었는가?
 */

/**
 * 2. 코드 품질 검토
 * - TypeScript 타입이 적절히 정의되었는가?
 * - 함수가 단일 책임을 갖는가?
 * - 네이밍이 명확하고 일관성 있는가?
 * - 중복 코드가 없는가?
 */

/**
 * 3. 성능 검토 (ClassFlow 60fps 보장)
 * - 불필요한 리렌더링이 없는가?
 * - 메모이제이션이 적절히 사용되었는가?
 * - 대용량 데이터 처리가 최적화되었는가?
 */

/**
 * 4. 접근성 검토
 * - ARIA 레이블이 적절한가?
 * - 키보드 네비게이션이 가능한가?
 * - 색상 대비가 충분한가?
 */

/**
 * 5. 보안 검토
 * - 사용자 입력이 적절히 검증되는가?
 * - 권한 체크가 올바른가?
 * - 민감 정보가 노출되지 않는가?
 */

// 리뷰 코멘트 예시
// ✅ 좋은 리뷰 코멘트
"이 함수가 200ms 이상 걸릴 수 있어 ClassFlow 성능에 영향을 줄 것 같습니다. 
useMemo나 debouncing을 고려해보시는 게 어떨까요?"

"접근성 관점에서 이 버튼에 aria-label이 필요해 보입니다. 
스크린 리더 사용자가 기능을 이해하기 어려울 것 같아요."

// ❌ 피해야 할 리뷰 코멘트
"이 코드가 이상해요" (구체적이지 않음)
"저라면 다르게 짰을 거예요" (대안 제시 없음)
"왜 이렇게 했나요?" (비판적 톤)
```

---

## 12. 품질 보증 체크리스트

### 12.1 개발 완료 전 체크리스트 ✅

```markdown
## 🔍 코드 품질 체크리스트

### TypeScript 및 타입 안전성
- [ ] 모든 변수와 함수에 적절한 타입 지정
- [ ] any 타입 사용 금지 (불가피한 경우 주석으로 설명)
- [ ] 유틸리티 타입 적절히 활용
- [ ] 제네릭 타입 제약조건 명시

### React 컴포넌트 
- [ ] displayName 설정 (디버깅용)
- [ ] memo() 적절히 적용 (성능 최적화)
- [ ] useCallback, useMemo 적절히 사용
- [ ] Props 인터페이스 명확히 정의
- [ ] 조건부 렌더링 시 key prop 사용

### 성능 최적화 (ClassFlow 60fps 보장)
- [ ] 대용량 데이터 가상화 적용 (1000+ 항목)
- [ ] 불필요한 리렌더링 방지
- [ ] 무거운 계산 메모이제이션
- [ ] 이미지 lazy loading 적용
- [ ] 번들 크기 확인 (chunk 분석)

### 접근성 (WCAG 2.1 AA)
- [ ] 키보드 네비게이션 완전 지원
- [ ] ARIA 레이블 및 설명 추가
- [ ] 색상 대비 4.5:1 이상 유지
- [ ] 스크린 리더 테스트 통과
- [ ] focus trap 구현 (모달 등)

### 에러 처리
- [ ] API 에러 적절히 처리
- [ ] 사용자 친화적 에러 메시지
- [ ] 에러 경계(Error Boundary) 설정
- [ ] 네트워크 에러 재시도 로직

### 테스트
- [ ] 유닛 테스트 커버리지 80% 이상
- [ ] 핵심 기능 통합 테스트 작성
- [ ] E2E 테스트 주요 플로우 커버
- [ ] 성능 테스트 (60fps 검증)
```

### 12.2 PR 머지 전 체크리스트

```markdown
## 🚀 배포 준비 체크리스트

### 코드 검토
- [ ] 팀원 2명 이상의 승인
- [ ] 모든 리뷰 코멘트 해결
- [ ] CI/CD 파이프라인 통과
- [ ] 머지 충돌 없음

### 기능 검증
- [ ] 요구사항 100% 충족
- [ ] 엣지 케이스 처리 확인
- [ ] 다양한 브라우저에서 테스트
- [ ] 모바일 반응형 확인

### 성능 검증
- [ ] Lighthouse 점수 확인
- [ ] Core Web Vitals 기준 충족
- [ ] ClassFlow 60fps 성능 유지
- [ ] 메모리 누수 없음

### 보안 검증
- [ ] 입력값 검증 적절히 구현
- [ ] 권한 체크 완료
- [ ] 민감 정보 보호 확인
- [ ] OWASP 보안 체크리스트 검토
```

### 12.3 정기 코드 품질 점검

```typescript
// ✅ 월간 코드 품질 점검 스크립트
interface CodeQualityMetrics {
  // TypeScript 관련
  typeErrors: number;
  anyUsageCount: number;
  
  // 성능 관련  
  bundleSize: number;
  renderingPerformance: number; // fps
  memoryUsage: number;
  
  // 접근성 관련
  accessibilityScore: number;
  wcagViolations: number;
  
  // 테스트 관련
  testCoverage: number;
  testCount: number;
  flakyTests: number;
  
  // 코드 복잡도
  cyclomaticComplexity: number;
  duplicatedLines: number;
  
  // 문서화
  undocumentedFunctions: number;
  outdatedDocs: number;
}

// 품질 기준
const QUALITY_STANDARDS: CodeQualityMetrics = {
  typeErrors: 0,                    // TypeScript 에러 0개
  anyUsageCount: 5,                 // any 사용 최대 5회
  bundleSize: 500 * 1024,          // 500KB 이하
  renderingPerformance: 60,         // 60fps 유지
  memoryUsage: 50 * 1024 * 1024,   // 50MB 이하
  accessibilityScore: 95,           // 접근성 95점 이상
  wcagViolations: 0,                // WCAG 위반 0건
  testCoverage: 80,                 // 커버리지 80% 이상
  testCount: 100,                   // 최소 100개 테스트
  flakyTests: 0,                    // 불안정한 테스트 0개
  cyclomaticComplexity: 10,         // 복잡도 10 이하
  duplicatedLines: 3,               // 중복 코드 3% 이하
  undocumentedFunctions: 0,         // 미문서화 함수 0개
  outdatedDocs: 0                   // 오래된 문서 0개
};

// 자동화된 품질 체크
async function runQualityCheck(): Promise<CodeQualityMetrics> {
  const results = await Promise.all([
    checkTypeScriptErrors(),
    analyzeBundleSize(), 
    measurePerformance(),
    runAccessibilityAudit(),
    calculateTestCoverage(),
    analyzeCodeComplexity()
  ]);
  
  return aggregateMetrics(results);
}
```

---

## 📚 참고 자료 및 추가 학습

### 공식 문서
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React 공식 문서](https://react.dev/)
- [Next.js 문서](https://nextjs.org/docs)
- [WCAG 2.1 가이드라인](https://www.w3.org/WAI/WCAG21/quickref/)

### 성능 최적화
- [React Performance](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
- [Bundle Analysis](https://bundlephobia.com/)

### 접근성
- [A11y Project](https://www.a11yproject.com/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### 테스팅
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)
- [Jest](https://jestjs.io/)

---

## 🔄 문서 업데이트 정책

이 문서는 살아있는 문서입니다:

- **정기 검토**: 분기별 1회 전체 검토
- **수정 기준**: 새로운 기술 도입, 팀 피드백, 성능 이슈 발견 시
- **승인 과정**: 시니어 개발자 2명 이상의 승인 필요
- **변경 사항 알림**: 전체 개발팀에 변경 사항 공지

---

**문서 버전**: v1.0  
**최초 작성**: 2025-08-09  
**최종 검토**: 2025-08-09  
**다음 검토 예정**: 2025-11-09

---

**이 문서는 EduCanvas 프로젝트의 성공을 위한 필수 가이드라인입니다. 모든 개발팀 구성원은 반드시 숙지하고 준수해야 합니다.**