# EduCanvas UI 컴포넌트 라이브러리 사용 매뉴얼

> **버전**: 1.0.0  
> **최종 업데이트**: 2025-08-11  
> **프레임워크**: React 19 + TypeScript  
> **스타일링**: TailwindCSS 4  
> **접근성**: WCAG 2.1 AA 준수

## 📚 목차

1. [설치 및 설정](#설치-및-설정)
2. [기본 컴포넌트](#기본-컴포넌트)
3. [ClassFlow 전용 컴포넌트](#classflow-전용-컴포넌트)
4. [타입 정의](#타입-정의)
5. [성능 최적화 가이드](#성능-최적화-가이드)
6. [접근성 가이드](#접근성-가이드)
7. [예제 및 패턴](#예제-및-패턴)

---

## 설치 및 설정

### Import 방법

```typescript
// 전체 import
import { Button, Input, Card, Modal, Table } from '@/components/ui'

// 개별 import  
import { Button } from '@/components/ui/Button'
import { StudentCard } from '@/components/ui/StudentCard'

// 타입 import
import type { ButtonProps, StudentCardProps } from '@/components/ui'
```

### 필수 의존성

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  }
}
```

---

## 기본 컴포넌트

### Button 컴포넌트

**기본 사용법**

```typescript
import { Button } from '@/components/ui'

// 기본 버튼
<Button>클릭하세요</Button>

// 변형 버튼
<Button variant="primary">주요 버튼</Button>
<Button variant="secondary">보조 버튼</Button>
<Button variant="ghost">고스트 버튼</Button>

// 크기 변형
<Button size="sm">작은 버튼</Button>
<Button size="lg">큰 버튼</Button>

// 상태 변형
<Button loading={true}>로딩 중...</Button>
<Button disabled={true}>비활성화</Button>
```

**권한 기반 렌더링**

```typescript
<Button
  requiredPermissions={['student:edit']}
  currentPermissions={userPermissions}
>
  학생 편집
</Button>
```

**Props 타입**

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  disabled?: boolean
  requiredPermissions?: string[]
  currentPermissions?: string[]
  onClick?: (event: React.MouseEvent) => void
  children: React.ReactNode
  className?: string
}
```

### Input 컴포넌트

**기본 사용법**

```typescript
import { Input } from '@/components/ui'

// 기본 입력
<Input 
  label="이름" 
  placeholder="이름을 입력하세요"
  value={name}
  onChange={setName}
/>

// 에러 표시
<Input
  label="이메일"
  type="email"
  value={email}
  onChange={setEmail}
  error="올바른 이메일을 입력하세요"
  required
/>

// 도움말 텍스트
<Input
  label="비밀번호"
  type="password"
  hint="8자 이상 입력하세요"
/>
```

**Props 타입**

```typescript
interface InputProps {
  label?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel'
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  className?: string
}
```

### Card 컴포넌트

**기본 사용법**

```typescript
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui'

// 기본 카드
<Card>
  <CardHeader>
    <CardTitle>학생 정보</CardTitle>
    <CardDescription>학생의 상세 정보를 확인하세요</CardDescription>
  </CardHeader>
  <CardBody>
    <p>학생 이름: 홍길동</p>
    <p>학년: 고등학교 2학년</p>
  </CardBody>
  <CardFooter>
    <Button>편집</Button>
    <Button variant="ghost">삭제</Button>
  </CardFooter>
</Card>

// 변형 카드
<Card variant="outlined" padding="lg" shadow="md">
  컨텐츠
</Card>
```

### Modal 컴포넌트

**기본 사용법**

```typescript
import { Modal, ModalHeader, ModalBody, ModalFooter, useModal } from '@/components/ui'

function MyComponent() {
  const { isOpen, open, close } = useModal()
  
  return (
    <>
      <Button onClick={open}>모달 열기</Button>
      
      <Modal isOpen={isOpen} onClose={close} size="md">
        <ModalHeader>
          <h2>확인</h2>
        </ModalHeader>
        <ModalBody>
          <p>정말로 삭제하시겠습니까?</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="danger">삭제</Button>
          <Button variant="ghost" onClick={close}>취소</Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
```

### Table 컴포넌트

**기본 사용법**

```typescript
import { Table } from '@/components/ui'

interface Student {
  id: string
  name: string
  grade: string
  status: 'active' | 'inactive'
}

const columns = [
  {
    key: 'name',
    label: '이름',
    sortable: true
  },
  {
    key: 'grade', 
    label: '학년',
    sortable: true
  },
  {
    key: 'status',
    label: '상태',
    render: (student: Student) => (
      <StatusBadge status={student.status} />
    )
  }
]

<Table<Student>
  data={students}
  columns={columns}
  loading={loading}
  sortable={true}
  selectable={true}
  onSort={handleSort}
  onSelect={handleSelect}
/>
```

### Badge 컴포넌트

**기본 사용법**

```typescript
import { Badge, StatusBadge, CountBadge, TagBadge } from '@/components/ui'

// 기본 뱃지
<Badge variant="primary">새로운</Badge>
<Badge variant="success">완료</Badge>

// 상태 뱃지
<StatusBadge status="active" />
<StatusBadge status="pending" />

// 개수 뱃지  
<CountBadge count={5} />
<CountBadge count={100} max={99} /> {/* 99+ 표시 */}

// 태그 뱃지
<TagBadge color="#3B82F6" removable onRemove={handleRemove}>
  수학
</TagBadge>
```

### Loading 컴포넌트

**기본 사용법**

```typescript
import { Loading, Skeleton, CardSkeleton, TableSkeleton, ListSkeleton } from '@/components/ui'

// 로딩 스피너
<Loading variant="spinner" size="md" />
<Loading variant="dots" text="로딩 중..." />

// 오버레이 로딩
<Loading overlay={true} text="데이터를 불러오는 중..." />

// 스켈레톤
<Skeleton width="100%" height="1rem" />
<Skeleton variant="circular" width={40} height={40} />

// 복합 스켈레톤
<CardSkeleton />
<TableSkeleton rows={5} columns={4} />
<ListSkeleton items={3} showAvatar={true} />
```

---

## ClassFlow 전용 컴포넌트

### StudentCard 컴포넌트

**기본 사용법**

```typescript
import { StudentCard } from '@/components/ui'
import type { ClassFlowStudent } from '@/components/ui'

const student: ClassFlowStudent = {
  id: 'student-1',
  name: '홍길동',
  phone: '010-1234-5678',
  email: 'hong@example.com',
  parent_phone_1: '010-9876-5432',
  status: 'active',
  grade: '고등학교 2학년',
  tags: ['수학', '물리', '화학'],
  enrollmentDate: '2024-03-01'
}

// 기본 학생 카드
<StudentCard
  student={student}
  onSelect={handleStudentSelect}
  onEdit={handleStudentEdit}
/>

// 드래그 가능한 카드
<StudentCard
  student={student}
  variant="compact"
  isDragging={isDragging}
  showDragHandle={true}
  draggableProps={draggableProps}
  dragHandleProps={dragHandleProps}
/>

// 선택 가능한 카드
<StudentCard
  student={student}
  variant="detailed"
  isSelected={isSelected}
  showSelection={true}
  onSelect={handleSelect}
/>
```

**변형 옵션**

- `compact`: 작은 크기로 기본 정보만 표시
- `default`: 표준 크기로 연락처 정보 포함
- `detailed`: 큰 크기로 모든 정보 표시

### DropZone 컴포넌트

**기본 사용법**

```typescript
import { DropZone, ClassFlowDropZone } from '@/components/ui'

// 기본 드롭존
<DropZone
  title="파일을 여기에 드래그하세요"
  accepts={['file']}
  onDrop={handleDrop}
  variant="default"
  size="md"
/>

// ClassFlow 전용 드롭존  
<ClassFlowDropZone
  classId="class-1"
  students={classStudents}
  maxCapacity={25}
  onStudentsMove={handleStudentsMove}
  isUnassigned={false}
/>

// 미배정 학생 영역
<ClassFlowDropZone
  students={unassignedStudents}
  isUnassigned={true}
  onStudentsMove={handleStudentsMove}
/>
```

**고급 기능**

```typescript
// 커스텀 검증
<DropZone
  accepts={['student']}
  validator={(data) => {
    if (data.grade !== '고등학교 2학년') {
      return '2학년 학생만 배정 가능합니다'
    }
    return true
  }}
  onDrop={handleDrop}
/>

// 최대 용량 제한
<ClassFlowDropZone
  maxCapacity={20}
  currentCount={students.length}
  onStudentsMove={handleMove}
/>
```

---

## 타입 정의

### 공통 타입

```typescript
// 컴포넌트 크기
type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

// 컴포넌트 변형
type ComponentVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

// 기본 컴포넌트 Props
interface BaseComponentProps {
  className?: string
  'data-testid'?: string
  children?: React.ReactNode
}

// 접근성 Props
interface AccessibilityProps {
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  role?: string
  tabIndex?: number
}
```

### ClassFlow 전용 타입

```typescript
// 학생 데이터 타입
interface ClassFlowStudent {
  id: string
  name: string
  phone?: string
  email?: string
  parent_phone_1?: string
  parent_phone_2?: string
  status: 'active' | 'inactive' | 'graduated' | 'transferred'
  avatar?: string
  grade?: string
  tags?: string[]
  enrollmentDate?: string
  position_in_class?: number
}
```

---

## 성능 최적화 가이드

### React.memo 활용

모든 컴포넌트는 React.memo로 래핑되어 불필요한 리렌더링을 방지합니다.

```typescript
// 올바른 사용법
const MemoizedStudentCard = memo(() => (
  <StudentCard student={student} onSelect={handleSelect} />
))

// Props가 자주 변경되는 경우 useCallback 사용
const handleSelect = useCallback((student) => {
  // 처리 로직
}, [dependency])
```

### ClassFlow 60fps 보장

```typescript
// 드래그 중 성능 최적화
<StudentCard
  student={student}
  isDragging={isDragging}
  variant="compact" // 드래그 중에는 compact 사용
/>

// 가상화 사용 (1000개 이상 항목)
import { FixedSizeList as List } from 'react-window'

<List
  height={600}
  itemCount={students.length}
  itemSize={80}
  itemData={students}
>
  {({ index, style }) => (
    <div style={style}>
      <StudentCard student={students[index]} variant="compact" />
    </div>
  )}
</List>
```

### 메모리 최적화

```typescript
// 대용량 데이터 처리 시 cleanup
useEffect(() => {
  return () => {
    // 컴포넌트 언마운트 시 메모리 정리
    setStudents([])
    setSelectedStudents(new Set())
  }
}, [])
```

---

## 접근성 가이드

### 키보드 내비게이션

모든 인터랙티브 컴포넌트는 키보드 조작을 지원합니다.

```typescript
// 자동 지원되는 키보드 이벤트
- Enter/Space: 버튼 클릭, 카드 선택
- Escape: 모달 닫기
- Tab/Shift+Tab: 포커스 이동
- Arrow Keys: 리스트 내비게이션
```

### 스크린 리더 지원

```typescript
// ARIA 라벨 사용
<StudentCard
  student={student}
  aria-label={`학생 ${student.name}, 상태: ${student.status}`}
  aria-describedby="student-help-text"
/>

// 상태 변경 알림
<StatusBadge 
  status="active"
  aria-live="polite" // 상태 변경 시 알림
/>
```

### 색상 대비

모든 컴포넌트는 WCAG 2.1 AA 기준(4.5:1)을 준수합니다.

```scss
// 자동 적용되는 색상 대비
.text-gray-600 { color: #4B5563; } // 4.6:1 대비
.bg-blue-600 { background: #2563EB; } // 충분한 대비
```

---

## 예제 및 패턴

### 학생 관리 페이지

```typescript
import { 
  Card, CardHeader, CardTitle, CardBody,
  Input, Button, Table, StudentCard,
  Loading, Modal, useModal
} from '@/components/ui'

function StudentManagePage() {
  const [students, setStudents] = useState<ClassFlowStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const { isOpen, open, close } = useModal()

  return (
    <div className="space-y-6">
      {/* 검색 영역 */}
      <Card>
        <CardHeader>
          <CardTitle>학생 검색</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex space-x-4">
            <Input 
              placeholder="이름으로 검색"
              value={searchTerm}
              onChange={setSearchTerm}
            />
            <Button onClick={handleSearch}>검색</Button>
          </div>
        </CardBody>
      </Card>

      {/* 학생 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>학생 목록 ({students.length}명)</CardTitle>
          <Button onClick={open}>새 학생 추가</Button>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Loading text="학생 정보를 불러오는 중..." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map(student => (
                <StudentCard
                  key={student.id}
                  student={student}
                  isSelected={selectedStudents.has(student.id)}
                  showSelection={true}
                  onSelect={handleStudentSelect}
                  onEdit={handleStudentEdit}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* 학생 추가 모달 */}
      <Modal isOpen={isOpen} onClose={close} size="lg">
        <ModalHeader>
          <h2>새 학생 추가</h2>
        </ModalHeader>
        <ModalBody>
          <StudentForm onSubmit={handleAddStudent} />
        </ModalBody>
      </Modal>
    </div>
  )
}
```

### ClassFlow 드래그앤드롭

```typescript
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { ClassFlowDropZone, StudentCard } from '@/components/ui'

function ClassFlowPage() {
  const [classes, setClasses] = useState<ClassData[]>([])
  const [unassignedStudents, setUnassignedStudents] = useState<ClassFlowStudent[]>([])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over) {
      const studentId = active.id as string
      const targetClassId = over.id as string
      
      // 학생 이동 로직
      moveStudentToClass(studentId, targetClassId)
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex space-x-6">
        {/* 미배정 학생 영역 */}
        <div className="w-80">
          <ClassFlowDropZone
            isUnassigned={true}
            students={unassignedStudents}
            onStudentsMove={handleUnassignedMove}
          >
            <div className="space-y-2">
              {unassignedStudents.map(student => (
                <StudentCard
                  key={student.id}
                  student={student}
                  variant="compact"
                  showDragHandle={true}
                />
              ))}
            </div>
          </ClassFlowDropZone>
        </div>

        {/* 클래스 영역들 */}
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(classData => (
            <ClassFlowDropZone
              key={classData.id}
              classId={classData.id}
              students={classData.students}
              maxCapacity={classData.maxCapacity}
              onStudentsMove={handleClassMove}
            >
              <div className="space-y-2">
                {classData.students.map(student => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    variant="compact"
                    showDragHandle={true}
                  />
                ))}
              </div>
            </ClassFlowDropZone>
          ))}
        </div>
      </div>
    </DndContext>
  )
}
```

### 폼 검증 패턴

```typescript
import { Input, Button, Card } from '@/components/ui'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const studentSchema = z.object({
  name: z.string().min(2, '이름은 2글자 이상 입력하세요'),
  email: z.string().email('올바른 이메일을 입력하세요'),
  phone: z.string().regex(/^010-\d{4}-\d{4}$/, '올바른 전화번호를 입력하세요')
})

type StudentFormData = z.infer<typeof studentSchema>

function StudentForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema)
  })

  const onSubmit = async (data: StudentFormData) => {
    await saveStudent(data)
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="이름"
          {...register('name')}
          error={errors.name?.message}
          required
        />
        
        <Input
          label="이메일"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          required
        />
        
        <Input
          label="전화번호"
          placeholder="010-0000-0000"
          {...register('phone')}
          error={errors.phone?.message}
          hint="하이픈(-)을 포함하여 입력하세요"
          required
        />
        
        <Button 
          type="submit" 
          loading={isSubmitting}
          className="w-full"
        >
          저장
        </Button>
      </form>
    </Card>
  )
}
```

---

## 버전 히스토리

### v1.0.0 (2025-08-11)
- ✅ 기본 UI 컴포넌트 10개 구현
- ✅ ClassFlow 특화 컴포넌트 2개 구현  
- ✅ WCAG 2.1 AA 접근성 준수
- ✅ TypeScript 완전 타입 지원
- ✅ 60fps 성능 최적화
- ✅ React.memo 성능 최적화

---

## 문의 및 지원

- **개발자**: EduCanvas Development Team
- **문서 위치**: `/docs/project_manual/UI-Components-Manual.md`
- **컴포넌트 위치**: `/src/components/ui/`
- **이슈 리포팅**: GitHub Issues

---

**📝 참고사항**

- 모든 컴포넌트는 `@/components/ui`에서 import 가능
- TypeScript 타입은 자동 완성 지원
- 성능 이슈 발견 시 즉시 보고 필요
- 접근성 문제 발견 시 우선순위 높음으로 처리