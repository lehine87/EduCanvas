# EduCanvas v2 컴포넌트 패턴 및 베스트 프랙티스

**작성일**: 2025-08-28  
**목적**: 재사용 가능하고 유지보수가 쉬운 컴포넌트 작성 가이드

---

## 🎯 핵심 설계 원칙

### 1. Single Responsibility (단일 책임)
- 하나의 컴포넌트는 하나의 명확한 역할만 수행
- 복잡한 기능은 여러 작은 컴포넌트로 분리

### 2. Composition over Inheritance (합성 우선)
- 상속보다는 컴포넌트 합성 사용
- Children props와 render props 패턴 활용

### 3. Controlled vs Uncontrolled (제어 컴포넌트)
- 상태 관리가 필요한 경우 Controlled Component
- 간단한 입력은 Uncontrolled Component

### 4. Type Safety (타입 안정성)
- 모든 Props에 TypeScript 타입 정의
- Generic 타입 적극 활용

---

## 📦 컴포넌트 구조 패턴

### 1. 기본 컴포넌트 구조
```tsx
// src/components/features/StudentCard.tsx

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Database } from '@/types/database.types';

// 타입 정의
type Student = Database['public']['Tables']['students']['Row'];

export interface StudentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  student: Student;
  variant?: 'default' | 'compact' | 'detailed';
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
}

// 컴포넌트 정의 (forwardRef 사용)
export const StudentCard = forwardRef<HTMLDivElement, StudentCardProps>(
  ({ student, variant = 'default', onEdit, onDelete, className, ...props }, ref) => {
    // 상태 계산
    const statusVariant = {
      active: 'default',
      inactive: 'secondary',
      pending: 'outline',
    }[student.status] as any;

    // 렌더링
    return (
      <Card 
        ref={ref}
        className={cn(
          "transition-all hover:shadow-md",
          variant === 'compact' && "p-2",
          className
        )}
        {...props}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{student.name}</CardTitle>
            <Badge variant={statusVariant}>
              {student.status === 'active' ? '재학중' : '휴학'}
            </Badge>
          </div>
        </CardHeader>
        
        {variant !== 'compact' && (
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>이메일: {student.email}</p>
              <p>전화: {student.phone}</p>
            </div>
            
            {(onEdit || onDelete) && (
              <div className="flex gap-2 mt-4">
                {onEdit && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onEdit(student)}
                  >
                    수정
                  </Button>
                )}
                {onDelete && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => onDelete(student)}
                  >
                    삭제
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  }
);

StudentCard.displayName = 'StudentCard';
```

### 2. Compound Component 패턴
```tsx
// 복합 컴포넌트 - 여러 하위 컴포넌트를 조합

import { createContext, useContext } from 'react';

// Context 생성
const AccordionContext = createContext<{
  activeItem: string | null;
  setActiveItem: (item: string | null) => void;
} | null>(null);

// Root 컴포넌트
export function Accordion({ children, defaultValue }: AccordionProps) {
  const [activeItem, setActiveItem] = useState(defaultValue);
  
  return (
    <AccordionContext.Provider value={{ activeItem, setActiveItem }}>
      <div className="divide-y">{children}</div>
    </AccordionContext.Provider>
  );
}

// Item 컴포넌트
export function AccordionItem({ value, children }: AccordionItemProps) {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionItem must be used within Accordion');
  
  const isActive = context.activeItem === value;
  
  return (
    <div className="py-2">
      {React.Children.map(children, child =>
        React.cloneElement(child, { isActive, value })
      )}
    </div>
  );
}

// Trigger 컴포넌트
export function AccordionTrigger({ value, isActive, children }: AccordionTriggerProps) {
  const context = useContext(AccordionContext);
  
  return (
    <button
      className="flex w-full justify-between p-4"
      onClick={() => context?.setActiveItem(isActive ? null : value)}
    >
      {children}
      <ChevronDown className={cn(
        "transition-transform",
        isActive && "rotate-180"
      )} />
    </button>
  );
}

// Content 컴포넌트
export function AccordionContent({ isActive, children }: AccordionContentProps) {
  if (!isActive) return null;
  
  return (
    <div className="px-4 pb-4 animate-in slide-in-from-top-2">
      {children}
    </div>
  );
}

// 사용 예제
<Accordion defaultValue="item-1">
  <AccordionItem value="item-1">
    <AccordionTrigger>학생 정보</AccordionTrigger>
    <AccordionContent>
      <StudentInfo />
    </AccordionContent>
  </AccordionItem>
  
  <AccordionItem value="item-2">
    <AccordionTrigger>수강 내역</AccordionTrigger>
    <AccordionContent>
      <CourseHistory />
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

### 3. Render Props 패턴
```tsx
// 렌더링 로직을 Props로 전달

interface DataFetcherProps<T> {
  url: string;
  render: (data: T | null, loading: boolean, error: Error | null) => React.ReactNode;
}

function DataFetcher<T>({ url, render }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return <>{render(data, loading, error)}</>;
}

// 사용 예제
<DataFetcher<Student[]>
  url="/api/students"
  render={(students, loading, error) => {
    if (loading) return <Loading />;
    if (error) return <Error message={error.message} />;
    if (!students) return <Empty />;
    
    return <StudentList students={students} />;
  }}
/>
```

### 4. HOC (Higher Order Component) 패턴
```tsx
// 컴포넌트를 감싸서 기능 추가

function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: string
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth();
    
    if (loading) return <Loading />;
    if (!user) return <LoginPrompt />;
    if (requiredRole && user.role !== requiredRole) {
      return <AccessDenied />;
    }
    
    return <Component {...props} user={user} />;
  };
}

// 사용 예제
const ProtectedAdminPanel = withAuth(AdminPanel, 'admin');
const ProtectedStudentDashboard = withAuth(StudentDashboard);
```

---

## 🎨 스타일링 패턴

### 1. Variant 패턴
```tsx
import { cva, type VariantProps } from 'class-variance-authority';

// Variant 정의
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// 컴포넌트에 적용
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
```

### 2. Polymorphic Component 패턴
```tsx
// 렌더링될 HTML 요소를 동적으로 변경

type PolymorphicProps<E extends React.ElementType> = {
  as?: E;
} & React.ComponentPropsWithoutRef<E>;

function Text<E extends React.ElementType = 'span'>({
  as,
  children,
  className,
  ...props
}: PolymorphicProps<E>) {
  const Component = as || 'span';
  
  return (
    <Component 
      className={cn("text-base", className)} 
      {...props}
    >
      {children}
    </Component>
  );
}

// 사용 예제
<Text as="h1" className="text-4xl font-bold">제목</Text>
<Text as="p" className="text-muted-foreground">본문</Text>
<Text as="label" htmlFor="input">레이블</Text>
```

---

## 📊 상태 관리 패턴

### 1. Custom Hook 패턴
```tsx
// 재사용 가능한 로직을 Hook으로 추출

function useStudentForm(studentId?: string) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 학생 데이터 로드
  useEffect(() => {
    if (!studentId) return;
    
    setLoading(true);
    fetch(`/api/students/${studentId}`)
      .then(res => res.json())
      .then(setStudent)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [studentId]);
  
  // 저장 함수
  const save = useCallback(async (data: Partial<Student>) => {
    setLoading(true);
    try {
      const url = studentId 
        ? `/api/students/${studentId}` 
        : '/api/students';
      const method = studentId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('저장 실패');
      
      const savedStudent = await response.json();
      setStudent(savedStudent);
      return savedStudent;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [studentId]);
  
  return {
    student,
    loading,
    error,
    save,
    setStudent,
  };
}

// 사용 예제
function StudentForm({ studentId }: { studentId?: string }) {
  const { student, loading, error, save } = useStudentForm(studentId);
  const form = useForm({
    defaultValues: student || getDefaultStudent(),
  });
  
  const onSubmit = async (data: FormData) => {
    try {
      await save(data);
      toast.success('저장되었습니다');
      router.push('/students');
    } catch {
      toast.error('저장 실패');
    }
  };
  
  if (loading) return <Loading />;
  if (error) return <Error message={error} />;
  
  return <Form onSubmit={onSubmit} {...form} />;
}
```

### 2. Context Provider 패턴
```tsx
// 전역 상태 관리

interface ThemeContextValue {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

---

## 🔄 데이터 페칭 패턴

### 1. Server Component 데이터 페칭
```tsx
// app/students/page.tsx - Server Component

async function getStudents() {
  const response = await fetch(`${process.env.API_URL}/students`, {
    next: { revalidate: 60 }, // 60초 캐시
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch students');
  }
  
  return response.json();
}

export default async function StudentsPage() {
  const students = await getStudents();
  
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">학생 목록</h1>
      <Suspense fallback={<TableSkeleton />}>
        <StudentTable students={students} />
      </Suspense>
    </div>
  );
}
```

### 2. Client Component 데이터 페칭
```tsx
'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

function StudentSearch() {
  const [query, setQuery] = useState('');
  
  // SWR로 데이터 페칭 및 캐싱
  const { data, error, isLoading, mutate } = useSWR(
    query ? `/api/search/students?q=${query}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );
  
  return (
    <div className="space-y-4">
      <Input
        placeholder="학생 검색..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      
      {isLoading && <Loading />}
      {error && <Error message="검색 실패" />}
      {data && <SearchResults results={data} />}
      
      <Button onClick={() => mutate()}>
        새로고침
      </Button>
    </div>
  );
}
```

### 3. Optimistic Update 패턴
```tsx
function TodoList() {
  const { data: todos, mutate } = useSWR('/api/todos', fetcher);
  
  const addTodo = async (text: string) => {
    const newTodo = {
      id: Date.now(),
      text,
      completed: false,
    };
    
    // Optimistic update
    mutate(
      [...(todos || []), newTodo],
      {
        revalidate: false,
        populateCache: false,
        optimisticData: [...(todos || []), newTodo],
        rollbackOnError: true,
      }
    );
    
    try {
      // 실제 API 호출
      await fetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      
      // 성공 시 재검증
      mutate();
    } catch (error) {
      // 에러 시 자동 롤백
      toast.error('추가 실패');
    }
  };
  
  return (
    <div>
      {todos?.map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
      <AddTodoForm onAdd={addTodo} />
    </div>
  );
}
```

---

## ✅ 체크리스트

### 컴포넌트 작성 시
- [ ] Props에 TypeScript 타입 정의
- [ ] forwardRef 필요 여부 확인
- [ ] displayName 설정
- [ ] 기본값 설정
- [ ] 에러 경계 고려
- [ ] 접근성 속성 추가

### 스타일링 시
- [ ] Tailwind 클래스 사용
- [ ] 다크모드 지원
- [ ] 반응형 디자인
- [ ] 애니메이션 성능 고려

### 성능 최적화
- [ ] 불필요한 리렌더링 방지
- [ ] 메모이제이션 적용
- [ ] 동적 import 고려
- [ ] 가상화 필요 여부

### 테스트
- [ ] 단위 테스트 작성
- [ ] 스토리북 스토리 작성
- [ ] 접근성 테스트
- [ ] 크로스 브라우저 테스트

---

## 📚 참고 자료

- [React Patterns](https://reactpatterns.com)
- [TypeScript React Cheatsheet](https://react-typescript-cheatsheet.netlify.app)
- [shadcn/ui Examples](https://ui.shadcn.com/examples)
- [Tailwind CSS Best Practices](https://tailwindcss.com/docs/reusing-styles)

---

**작성일**: 2025-08-28  
**작성자**: Claude AI Assistant  
**버전**: 1.0.0