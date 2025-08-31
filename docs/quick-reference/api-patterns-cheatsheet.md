# 🚀 API 패턴 Quick Reference

**목적**: 1-2분 내 즉시 참조 가능한 API 개발 필수 패턴  
**업데이트**: 2025-08-28

---

## ⚡ CRUD API 기본 패턴

### 1. 데이터 페칭 (GET)
```tsx
// 서버 컴포넌트 (권장)
async function getStudents() {
  const response = await fetch(`${process.env.API_URL}/api/students`);
  if (!response.ok) throw new Error('Failed to fetch students');
  return response.json();
}

// 클라이언트 컴포넌트
'use client';
import useSWR from 'swr';

function StudentList() {
  const { data, error, isLoading } = useSWR('/api/students', fetcher);
  
  if (error) return <div>에러 발생</div>;
  if (isLoading) return <div>로딩 중...</div>;
  
  return <div>{/* 학생 목록 */}</div>;
}
```

### 2. 데이터 생성 (POST)
```tsx
async function createStudent(data: StudentInsert) {
  const response = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
}

// 사용 예시
const handleSubmit = async (data: FormData) => {
  try {
    await createStudent(data);
    toast.success('학생이 등록되었습니다');
    router.refresh();
  } catch (error) {
    toast.error(error.message);
  }
};
```

### 3. 데이터 업데이트 (PUT/PATCH)
```tsx
async function updateStudent(id: string, data: StudentUpdate) {
  const response = await fetch(`/api/students/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) throw new Error('업데이트 실패');
  return response.json();
}
```

### 4. 데이터 삭제 (DELETE)
```tsx
async function deleteStudent(id: string) {
  const response = await fetch(`/api/students/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) throw new Error('삭제 실패');
  return response.json();
}
```

---

## 🛡️ API Route 구조 (Next.js 15)

### 기본 API Route
```tsx
// app/api/students/route.ts
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('students')
    .select('*');
    
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();
  
  // 데이터 검증
  const validatedData = studentSchema.parse(body);
  
  const { data, error } = await supabase
    .from('students')
    .insert(validatedData)
    .select()
    .single();
    
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  
  return Response.json(data, { status: 201 });
}
```

### 동적 라우트 (ID 기반)
```tsx
// app/api/students/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', params.id)
    .single();
    
  if (error) {
    return Response.json({ error: 'Student not found' }, { status: 404 });
  }
  
  return Response.json(data);
}
```

---

## 🔒 인증 및 권한

### RLS 정책 확인
```tsx
export async function GET() {
  const supabase = createClient();
  
  // RLS 정책이 자동으로 적용됨
  const { data, error } = await supabase
    .from('students')
    .select('*');  // 현재 사용자의 tenant 데이터만 조회됨
    
  return Response.json(data);
}
```

### 권한 체크
```tsx
import { getCurrentUser } from '@/lib/auth/server';

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  // 삭제 로직
}
```

---

## 📝 폼 데이터 처리

### React Hook Form + Zod
```tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  name: z.string().min(2, '이름은 2자 이상이어야 합니다'),
  email: z.string().email('올바른 이메일을 입력하세요'),
});

export function StudentForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '' },
  });
  
  const onSubmit = async (data) => {
    try {
      await createStudent(data);
      toast.success('저장되었습니다');
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  return <Form {...form}>/* 폼 JSX */</Form>;
}
```

---

## 🔄 상태 관리 패턴

### SWR (추천)
```tsx
import useSWR from 'swr';

function useStudents() {
  const { data, error, mutate } = useSWR('/api/students', fetcher);
  
  const createStudent = async (newStudent) => {
    // Optimistic update
    mutate([...data, newStudent], false);
    
    try {
      await fetch('/api/students', {
        method: 'POST',
        body: JSON.stringify(newStudent),
      });
      mutate(); // 재검증
    } catch (error) {
      mutate(); // 롤백
      throw error;
    }
  };
  
  return { students: data, isLoading: !error && !data, createStudent };
}
```

---

## 🔍 검색 및 필터링

### URL 기반 검색
```tsx
// app/api/students/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const status = searchParams.get('status');
  
  let dbQuery = supabase.from('students').select('*');
  
  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%`);
  }
  
  if (status) {
    dbQuery = dbQuery.eq('status', status);
  }
  
  const { data } = await dbQuery;
  return Response.json(data);
}
```

### 클라이언트에서 사용
```tsx
const [query, setQuery] = useState('');
const [status, setStatus] = useState('');

const { data } = useSWR(
  `/api/students?q=${query}&status=${status}`,
  fetcher
);
```

---

## ⚡ 성능 최적화

### 페이지네이션
```tsx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;
  
  const { data, count } = await supabase
    .from('students')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1);
    
  return Response.json({
    data,
    pagination: {
      page,
      limit,
      total: count,
      hasNext: count > offset + limit,
    },
  });
}
```

---

## 🔍 검색 키워드 (더 자세한 정보 필요 시)

| 키워드 | 검색할 문서 | 찾을 내용 |
|--------|-------------|-----------|
| `authentication` | supabase-connection-guide.md | 인증 설정 및 RLS 정책 |
| `validation` | CRUD-API-Patterns.md | Zod 스키마 및 검증 패턴 |
| `error handling` | typescript-safety-manual.md | 에러 처리 베스트 프랙티스 |
| `database types` | typescript-type-dictionary.md | Supabase 타입 정의 |
| `server actions` | Quick-API-Reference.md | Next.js 15 Server Actions |

---

## ⚡ 필수 명령어

```bash
# 타입 생성
npx supabase gen types typescript --project-id hodkqpmukwfrreozwmcy

# API 테스트
curl -X GET http://localhost:3000/api/students
curl -X POST http://localhost:3000/api/students -H "Content-Type: application/json" -d '{"name":"홍길동"}'

# 타입 체크
npx tsc --noEmit --strict
```

---

**💡 이 치트시트로 해결되지 않는 경우에만 전체 문서를 참조하세요!**