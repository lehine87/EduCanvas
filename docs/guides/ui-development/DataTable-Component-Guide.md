# DataTable 컴포넌트 완전 가이드

**작성일**: 2025-08-26  
**버전**: v1.0  
**개발자**: Lead Developer  
**테스트 완료**: ✅ `/test/shadcn-ui` 페이지에서 완전 검증

---

## 🎯 개요

EduCanvas v2에서 개발한 완전 기능의 재사용 가능한 DataTable 컴포넌트입니다. TanStack Table을 기반으로 하며, 정렬, 필터링, 페이지네이션, 선택, 액션 등 모든 고급 기능을 포함합니다.

## ✨ 주요 특징

- 🔄 **완전 재사용 가능** - Generic 타입 지원으로 모든 데이터 타입 지원
- 🎛️ **고급 기능** - 정렬, 필터링, 페이지네이션, 선택, 액션 메뉴
- 📏 **컬럼 리사이징** - 인접한 두 컬럼만 조절하는 스마트 리사이징
- ✅ **토글 가능한 체크박스** - 런타임에 켜고 끌 수 있는 선택 기능
- 🎨 **완벽한 스타일링** - shadcn/ui 디자인 시스템 완벽 통합
- 📱 **반응형** - 모든 화면 크기 대응
- 🔒 **타입 안전** - TypeScript strict 모드 100% 지원

---

## 🚀 빠른 시작

### 기본 사용법

```tsx
import { DataTable, SortableHeader } from '@/components/data-table'
import { ColumnDef } from '@tanstack/react-table'

// 데이터 타입 정의
type Student = {
  id: string
  name: string
  grade: string
  score: number
  status: '우수' | '양호' | '보통' | '주의'
}

// 컬럼 정의
const columns: ColumnDef<Student>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader column={column}>이름</SortableHeader>
    ),
  },
  {
    accessorKey: "grade",
    header: "학년",
  },
  {
    accessorKey: "score",
    header: ({ column }) => (
      <SortableHeader column={column}>점수</SortableHeader>
    ),
  },
  {
    accessorKey: "status",
    header: "상태",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.getValue("status")}</Badge>
    ),
  },
]

// 컴포넌트 사용
<DataTable
  columns={columns}
  data={students}
/>
```

### 모든 기능 활성화

```tsx
<DataTable
  columns={columns}
  data={data}
  searchable={true}
  searchPlaceholder="학생 이름으로 검색..."
  selectable={true}
  actionColumn={true}
  pagination={true}
  pageSize={10}
  pageSizeOptions={[5, 10, 20, 50]}
  enableColumnResizing={true}
  onRowSelect={(selectedRows) => {
    console.log('선택된 행들:', selectedRows)
  }}
  onView={(row) => {
    console.log('보기:', row)
  }}
  onEdit={(row) => {
    console.log('편집:', row)
  }}
  onDelete={(row) => {
    console.log('삭제:', row)
  }}
/>
```

---

## 📋 Props 완전 가이드

### DataTableProps<TData, TValue>

| Props | 타입 | 기본값 | 설명 |
|-------|------|--------|------|
| `columns` | `ColumnDef<TData, TValue>[]` | **필수** | 테이블 컬럼 정의 |
| `data` | `TData[]` | **필수** | 표시할 데이터 배열 |
| `searchable` | `boolean` | `false` | 검색 기능 활성화 |
| `searchPlaceholder` | `string` | `"검색..."` | 검색 입력 필드 placeholder |
| `selectable` | `boolean` | `false` | 체크박스 선택 기능 활성화 |
| `onRowSelect` | `(selectedRows: TData[]) => void` | - | 행 선택 시 콜백 |
| `actionColumn` | `boolean` | `false` | 액션 컬럼 표시 |
| `onView` | `(row: TData) => void` | - | 보기 액션 콜백 |
| `onEdit` | `(row: TData) => void` | - | 편집 액션 콜백 |
| `onDelete` | `(row: TData) => void` | - | 삭제 액션 콜백 |
| `pagination` | `boolean` | `true` | 페이지네이션 표시 |
| `pageSize` | `number` | `10` | 페이지당 행 수 |
| `pageSizeOptions` | `number[]` | `[5, 10, 20, 50]` | 페이지 크기 선택 옵션 |
| `enableColumnResizing` | `boolean` | `false` | 컬럼 리사이징 활성화 |
| `columnResizeMode` | `ColumnResizeMode` | `"onChange"` | 리사이징 모드 |

---

## 🔧 고급 사용법

### 1. 커스텀 셀 렌더링

```tsx
const columns: ColumnDef<Student>[] = [
  {
    accessorKey: "status",
    header: "상태",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge 
          variant={status === '우수' ? 'default' : 'secondary'}
          className={
            status === '우수' ? 'bg-green-100 text-green-800' :
            status === '양호' ? 'bg-blue-100 text-blue-800' :
            status === '보통' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }
        >
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "score",
    header: ({ column }) => (
      <SortableHeader column={column}>점수</SortableHeader>
    ),
    cell: ({ row }) => {
      const score = row.getValue("score") as number
      return (
        <div className="text-right font-mono">
          {score}점
        </div>
      )
    },
  },
]
```

### 2. 조건부 액션 메뉴

```tsx
<DataTable
  columns={columns}
  data={data}
  actionColumn={true}
  onView={(row) => {
    // 모든 행에서 보기 가능
    navigate(`/students/${row.id}`)
  }}
  onEdit={(row) => {
    // 활성 상태인 학생만 편집 가능
    if (row.status === '활성') {
      setEditingStudent(row)
      setEditDialogOpen(true)
    }
  }}
  onDelete={(row) => {
    // 관리자만 삭제 가능
    if (userRole === 'admin') {
      setDeletingStudent(row)
      setDeleteDialogOpen(true)
    }
  }}
/>
```

### 3. 실시간 선택 관리

```tsx
const [selectedStudents, setSelectedStudents] = useState<Student[]>([])

<DataTable
  columns={columns}
  data={students}
  selectable={true}
  onRowSelect={setSelectedStudents}
/>

{/* 선택된 행 정보 표시 */}
{selectedStudents.length > 0 && (
  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
    <p className="text-sm font-medium">
      {selectedStudents.length}명의 학생이 선택되었습니다.
    </p>
    <div className="mt-2 space-x-2">
      <Button size="sm" onClick={handleBulkEdit}>
        일괄 편집
      </Button>
      <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
        일괄 삭제
      </Button>
    </div>
  </div>
)}
```

### 4. 동적 체크박스 토글

```tsx
const [isSelectableEnabled, setIsSelectableEnabled] = useState(true)

<div className="space-y-4">
  <div className="flex items-center space-x-4">
    <Label htmlFor="selectable-toggle">선택 기능:</Label>
    <Switch 
      id="selectable-toggle"
      checked={isSelectableEnabled}
      onCheckedChange={setIsSelectableEnabled}
    />
  </div>
  
  <DataTable
    columns={columns}
    data={data}
    selectable={isSelectableEnabled}
    onRowSelect={(selectedRows) => {
      if (isSelectableEnabled) {
        setSelectedRows(selectedRows)
      }
    }}
  />
</div>
```

### 5. 컬럼 리사이징 사용

```tsx
<DataTable
  columns={columns}
  data={data}
  enableColumnResizing={true}
  columnResizeMode="onChange"
/>
```

**리사이징 특징:**
- ✅ 인접한 두 컬럼만 크기 조절 (전체 테이블 폭 고정)
- ✅ 체크박스와 액션 컬럼은 고정 크기 (리사이징 불가)
- ✅ 시각적 핸들과 넓은 클릭 영역
- ✅ 최소 크기 보장 (50px)

---

## 🎨 스타일 커스터마이징

### 테이블 컨테이너 스타일링

```tsx
<div className="rounded-lg border shadow-sm">
  <DataTable
    columns={columns}
    data={data}
    className="border-0"  // 내부 border 제거
  />
</div>
```

### 페이지네이션 커스터마이징

```tsx
<DataTable
  columns={columns}
  data={data}
  pagination={true}
  pageSize={20}
  pageSizeOptions={[10, 20, 50, 100]}
/>
```

### 검색 기능 커스터마이징

```tsx
<DataTable
  columns={columns}
  data={data}
  searchable={true}
  searchPlaceholder="이름, 이메일, 또는 학번으로 검색..."
/>
```

---

## 🔍 실제 사용 예제

### 학생 관리 테이블

```tsx
import React, { useState } from 'react'
import { DataTable, SortableHeader } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type Student = {
  id: string
  name: string
  grade: string
  subject: string
  score: number
  status: '우수' | '양호' | '보통' | '주의'
}

const studentColumns: ColumnDef<Student>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader column={column}>이름</SortableHeader>
    ),
  },
  {
    accessorKey: "grade",
    header: "학년",
  },
  {
    accessorKey: "subject",
    header: "과목",
  },
  {
    accessorKey: "score",
    header: ({ column }) => (
      <SortableHeader column={column}>점수</SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="text-right font-mono">
        {row.getValue("score")}점
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "상태",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge 
          variant="secondary"
          className={
            status === '우수' ? 'bg-green-100 text-green-800' :
            status === '양호' ? 'bg-blue-100 text-blue-800' :
            status === '보통' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }
        >
          {status}
        </Badge>
      )
    },
  },
]

export function StudentManagementTable({ students }: { students: Student[] }) {
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([])

  return (
    <div className="space-y-4">
      <DataTable
        columns={studentColumns}
        data={students}
        searchable={true}
        searchPlaceholder="학생 이름으로 검색..."
        selectable={true}
        actionColumn={true}
        pagination={true}
        pageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
        enableColumnResizing={true}
        onRowSelect={setSelectedStudents}
        onView={(student) => {
          console.log('학생 상세 보기:', student)
        }}
        onEdit={(student) => {
          console.log('학생 정보 편집:', student)
        }}
        onDelete={(student) => {
          console.log('학생 삭제:', student)
        }}
      />
      
      {selectedStudents.length > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium mb-2">
            {selectedStudents.length}명의 학생이 선택되었습니다.
          </p>
          <div className="space-x-2">
            <Button size="sm">성적 일괄 수정</Button>
            <Button size="sm" variant="outline">메시지 발송</Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## 📊 성능 최적화

### 1. 대용량 데이터 처리

```tsx
// 10,000개 이상의 행에서는 가상화 고려
import { useMemo } from 'react'

const memoizedColumns = useMemo(() => columns, [])
const memoizedData = useMemo(() => data, [data])

<DataTable
  columns={memoizedColumns}
  data={memoizedData}
  pagination={true}
  pageSize={50}  // 적절한 페이지 크기 설정
/>
```

### 2. 컬럼 메모화

```tsx
const columns = useMemo<ColumnDef<Student>[]>(() => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader column={column}>이름</SortableHeader>
    ),
  },
  // ... 다른 컬럼들
], [])
```

---

## ⚠️ 주의사항

### 1. 데이터 타입 일관성
```tsx
// ✅ 올바른 방법
type Student = {
  id: string    // 항상 string으로 일관성 있게
  name: string
  score: number // 항상 number로 일관성 있게
}

// ❌ 잘못된 방법  
type Student = {
  id: string | number  // 타입이 불일치하면 정렬 문제 발생
  score: string | number  // 혼재된 타입은 피할 것
}
```

### 2. 액션 콜백 처리
```tsx
// ✅ 안전한 방법
onDelete={(row) => {
  if (confirm('정말 삭제하시겠습니까?')) {
    handleDelete(row.id)
  }
}}

// ❌ 위험한 방법
onDelete={(row) => {
  // 확인 없이 즉시 삭제는 위험
  handleDelete(row.id)
}}
```

### 3. 메모리 누수 방지
```tsx
// ✅ 클린업 함수 사용
useEffect(() => {
  return () => {
    // 선택 상태 초기화
    setSelectedRows([])
  }
}, [])
```

---

## 🔧 트러블슈팅

### 문제: 정렬이 작동하지 않음
```tsx
// 해결: SortableHeader 사용 및 올바른 데이터 타입 확인
{
  accessorKey: "score",
  header: ({ column }) => (
    <SortableHeader column={column}>점수</SortableHeader>
  ),
  // 숫자 데이터는 number 타입이어야 함
}
```

### 문제: 검색이 작동하지 않음
```tsx
// 해결: 검색 대상 컬럼의 accessorKey가 "name"인지 확인
// 현재는 "name" 컬럼만 검색 지원
// 다른 컬럼 검색이 필요하면 컴포넌트 수정 필요
```

### 문제: 컬럼 리사이징이 작동하지 않음
```tsx
// 해결: enableColumnResizing={true} 설정 확인
<DataTable
  enableColumnResizing={true}
  columns={columns}
  data={data}
/>
```

---

## 📚 관련 문서

- [shadcn/ui Components Guide](./shadcn-ui-components-guide.md)
- [TanStack Table 공식 문서](https://tanstack.com/table)
- **실제 예제**: `/test/shadcn-ui` 페이지에서 모든 기능 테스트 가능

---

## 🔄 버전 히스토리

### v1.0 (2025-08-26)
- ✅ 초기 릴리스
- ✅ 모든 기본 기능 구현
- ✅ 컬럼 리사이징 기능
- ✅ 동적 체크박스 토글
- ✅ 완전한 타입 안전성
- ✅ 실제 프로젝트 환경에서 테스트 완료

---

**작성자**: Lead Developer  
**최종 업데이트**: 2025-08-26  
**다음 업데이트 예정**: 사용자 피드백에 따른 기능 개선