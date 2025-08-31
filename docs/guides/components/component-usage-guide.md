# EduCanvas v2 컴포넌트 사용 가이드

**작성일**: 2025-08-28  
**대상**: EduCanvas v2 개발자  
**목적**: 효율적이고 일관된 컴포넌트 사용법 안내

---

## 📌 핵심 원칙

### 1. shadcn/ui 우선 사용
- 기본 제공 컴포넌트로 해결 가능한 경우 항상 shadcn/ui 사용
- 커스텀 컴포넌트는 특별한 요구사항이 있을 때만 생성

### 2. TypeScript 엄격 모드
- 모든 Props에 타입 정의 필수
- `any` 타입 사용 금지

### 3. 접근성 준수
- ARIA 속성 적절히 사용
- 키보드 네비게이션 지원

### 4. 다크모드 지원
- 모든 컴포넌트는 다크모드 자동 지원
- 인라인 스타일 사용 금지

---

## 🚀 빠른 시작

### 1. 프로젝트 설정 확인
```bash
# shadcn/ui 설정 확인
cat components.json

# 컴포넌트 경로 확인
ls src/components/ui/
```

### 2. 새 컴포넌트 추가
```bash
# shadcn/ui 컴포넌트 추가 (예: toast)
npx shadcn@latest add toast

# 자동으로 다음 파일들이 생성됨:
# - src/components/ui/toast.tsx
# - src/components/ui/use-toast.ts
# - src/components/ui/toaster.tsx
```

### 3. 컴포넌트 Import
```tsx
// ✅ 권장: 개별 import
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ⚠️ 비권장: 전체 import (번들 크기 증가)
import * as UI from '@/components/ui';
```

---

## 🎯 주요 사용 패턴

### 1. 폼 처리 패턴
```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// 1. 스키마 정의
const formSchema = z.object({
  name: z.string().min(2, '이름은 2자 이상이어야 합니다'),
  email: z.string().email('올바른 이메일을 입력하세요'),
  phone: z.string().regex(/^010-\d{4}-\d{4}$/, '올바른 전화번호 형식이 아닙니다'),
});

type FormData = z.infer<typeof formSchema>;

export function StudentForm() {
  // 2. 폼 초기화
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  // 3. 제출 핸들러
  async function onSubmit(data: FormData) {
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('등록 실패');
      
      // 성공 처리
      toast.success('학생이 등록되었습니다');
      form.reset();
    } catch (error) {
      toast.error('등록 중 오류가 발생했습니다');
    }
  }

  // 4. 렌더링
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이름 *</FormLabel>
              <FormControl>
                <Input placeholder="홍길동" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이메일 *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="student@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full">
          학생 등록
        </Button>
      </form>
    </Form>
  );
}
```

### 2. 모달/시트 패턴
```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function StudentDetailSheet({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(null);

  // 데이터 로드
  async function loadStudent() {
    setLoading(true);
    try {
      const response = await fetch(`/api/students/${studentId}`);
      const data = await response.json();
      setStudent(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" onClick={loadStudent}>
          상세보기
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>학생 정보</SheetTitle>
          <SheetDescription>
            학생의 상세 정보를 확인하고 수정할 수 있습니다.
          </SheetDescription>
        </SheetHeader>
        
        {loading ? (
          <div className="flex items-center justify-center h-[200px]">
            <Loading text="불러오는 중..." />
          </div>
        ) : student ? (
          <div className="mt-6 space-y-4">
            {/* 학생 정보 표시 */}
          </div>
        ) : (
          <div>데이터를 불러올 수 없습니다</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

### 3. 테이블 패턴
```tsx
'use client';

import { useState, useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Student {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  enrolledAt: string;
}

export function StudentTable({ students }: { students: Student[] }) {
  // 컬럼 정의
  const columns: ColumnDef<Student>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: '이름',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'email',
      header: '이메일',
    },
    {
      accessorKey: 'status',
      header: '상태',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const variant = {
          active: 'default',
          inactive: 'secondary',
          pending: 'outline',
        }[status] as any;
        
        const label = {
          active: '재학중',
          inactive: '휴학',
          pending: '대기',
        }[status];
        
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      accessorKey: 'enrolledAt',
      header: '등록일',
      cell: ({ row }) => {
        const date = new Date(row.getValue('enrolledAt'));
        return date.toLocaleDateString('ko-KR');
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            수정
          </Button>
          <Button variant="ghost" size="sm">
            삭제
          </Button>
        </div>
      ),
    },
  ], []);

  return (
    <DataTable
      data={students}
      columns={columns}
      pagination
      sorting
      filtering
    />
  );
}
```

### 4. 검색 패턴
```tsx
'use client';

import { useState, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { EnhancedSearchBox } from '@/components/ui/EnhancedSearchBox';
import { SearchResults } from '@/components/search/SearchResults';

export function StudentSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 디바운스된 검색어
  const debouncedQuery = useDebounce(query, 300);

  // 검색 실행
  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search/students?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('검색 오류:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 디바운스된 검색어 변경 시 검색 실행
  React.useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  return (
    <div className="space-y-4">
      <EnhancedSearchBox
        placeholder="학생 이름, 이메일로 검색"
        value={query}
        onChange={setQuery}
        isLoading={loading}
      />
      
      {results.length > 0 && (
        <SearchResults
          results={results}
          onSelect={(student) => {
            // 학생 선택 처리
            console.log('Selected:', student);
          }}
        />
      )}
    </div>
  );
}
```

---

## 🎨 스타일링 가이드

### 1. 색상 시스템
```tsx
// ✅ 올바른 사용 - 다크모드 자동 지원
<div className="bg-white dark:bg-neutral-900">
<div className="text-neutral-900 dark:text-neutral-100">
<div className="border border-neutral-200 dark:border-neutral-800">

// ✅ 브랜드 색상 사용
<div className="bg-educanvas-500 text-educanvas-contrast">
<div className="bg-wisdom-500 text-wisdom-contrast">
<div className="bg-growth-500 text-growth-contrast">

// ❌ 잘못된 사용 - 인라인 스타일
<div style={{ backgroundColor: '#3B82F6' }}>
<div style={{ color: 'white' }}>
```

### 2. 간격 시스템
```tsx
// ✅ 디자인 토큰 사용
<div className="p-4 space-y-4">           // 기본 간격
<div className="p-spacing-md gap-spacing-sm">  // 토큰 간격

// ❌ 임의의 값 사용
<div className="p-[17px] gap-[13px]">    // 비표준 간격
```

### 3. 반응형 디자인
```tsx
// ✅ 모바일 우선 접근
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
<div className="text-sm md:text-base lg:text-lg">

// ✅ 컨테이너 쿼리 사용
<div className="@container">
  <div className="@md:grid-cols-2 @lg:grid-cols-3">
```

### 4. 애니메이션
```tsx
// ✅ Tailwind 애니메이션 클래스
<div className="transition-all duration-200 hover:scale-105">
<div className="animate-pulse">
<div className="animate-spin">

// ✅ 조건부 애니메이션
<div className={cn(
  "transition-opacity duration-300",
  isVisible ? "opacity-100" : "opacity-0"
)}>
```

---

## 🔧 성능 최적화

### 1. 동적 Import
```tsx
// 큰 컴포넌트는 동적 import 사용
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Loading />,
  ssr: false, // 필요한 경우
});
```

### 2. 메모이제이션
```tsx
// 무거운 계산은 useMemo 사용
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// 콜백은 useCallback 사용
const handleClick = useCallback(() => {
  // 처리 로직
}, [dependencies]);
```

### 3. 가상화
```tsx
// 긴 리스트는 가상화 사용
import { VirtualizedStudentList } from '@/components/ui/VirtualizedStudentList';

<VirtualizedStudentList
  students={students} // 1000+ items
  height={600}
  itemHeight={80}
/>
```

---

## ⚠️ 주의사항

### 1. Client Component 선언
```tsx
// 클라이언트 기능이 필요한 경우만 선언
'use client';

// useState, useEffect, onClick 등 사용 시 필요
```

### 2. 서버 컴포넌트 우선
```tsx
// 가능한 서버 컴포넌트로 유지
// 데이터 페칭은 서버에서
async function StudentList() {
  const students = await getStudents(); // 서버에서 실행
  return <StudentTable students={students} />;
}
```

### 3. 타입 안정성
```tsx
// ✅ 명확한 타입 정의
interface Props {
  student: Database['public']['Tables']['students']['Row'];
}

// ❌ any 타입 사용 금지
interface Props {
  student: any;
}
```

---

## 📚 추가 리소스

- [컴포넌트 카탈로그](./component-catalog.md)
- [컴포넌트 패턴](./component-patterns.md)
- [TypeScript 안전 매뉴얼](../../core/typescript-safety-manual.md)
- [shadcn/ui 공식 문서](https://ui.shadcn.com)
- [Tailwind CSS 문서](https://tailwindcss.com)

---

## 🆘 문제 해결

### 컴포넌트를 찾을 수 없을 때
```bash
# 1. 경로 확인
ls src/components/ui/

# 2. import 경로 확인
# tsconfig.json의 paths 설정 확인

# 3. 컴포넌트 재설치
npx shadcn@latest add [component-name]
```

### 스타일이 적용되지 않을 때
```bash
# 1. Tailwind 설정 확인
cat tailwind.config.ts

# 2. globals.css import 확인
# app/layout.tsx에서 import 확인

# 3. 개발 서버 재시작
npm run dev
```

### 타입 에러가 발생할 때
```bash
# 1. 타입 체크
npx tsc --noEmit

# 2. 타입 정의 업데이트
npm run generate:types

# 3. IDE 재시작
```

---

**작성일**: 2025-08-28  
**작성자**: Claude AI Assistant  
**버전**: 1.0.0