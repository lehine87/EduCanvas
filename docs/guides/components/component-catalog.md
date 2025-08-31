# EduCanvas v2 컴포넌트 카탈로그

**버전**: v2.0.0  
**최종 업데이트**: 2025-08-28  
**프레임워크**: shadcn/ui + Next.js 15 + React 19

---

## 📚 개요

이 문서는 EduCanvas v2에서 사용 가능한 모든 UI 컴포넌트의 완전한 카탈로그입니다.  
각 컴포넌트의 import 방법, Props 인터페이스, 사용 예제를 포함합니다.

### 컴포넌트 카테고리
1. **기본 컴포넌트** - shadcn/ui 기본 제공
2. **커스텀 컴포넌트** - EduCanvas 전용 확장
3. **기능 컴포넌트** - 비즈니스 로직 포함

---

## 🎨 기본 컴포넌트 (shadcn/ui)

### Button
**가장 많이 사용되는 컴포넌트 #1 (75회)**

```tsx
import { Button } from '@/components/ui/button';

// Props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

// 사용 예제
<Button variant="default" size="lg" onClick={handleClick}>
  저장하기
</Button>

<Button variant="outline" disabled={isLoading}>
  {isLoading ? <Loading className="w-4 h-4" /> : '취소'}
</Button>
```

### Badge
**가장 많이 사용되는 컴포넌트 #2 (50회)**

```tsx
import { Badge } from '@/components/ui/badge';

// Props
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

// 사용 예제
<Badge variant="default">신규</Badge>
<Badge variant="secondary">재학중</Badge>
<Badge variant="destructive">휴학</Badge>
```

### Input
**가장 많이 사용되는 컴포넌트 #3 (34회)**

```tsx
import { Input } from '@/components/ui/input';

// Props
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

// 사용 예제
<Input 
  type="text" 
  placeholder="이름을 입력하세요"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### Card
```tsx
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';

// 사용 예제
<Card className="w-[350px]">
  <CardHeader>
    <CardTitle>학생 정보</CardTitle>
    <CardDescription>기본 인적사항</CardDescription>
  </CardHeader>
  <CardContent>
    <p>학생 상세 정보...</p>
  </CardContent>
  <CardFooter className="flex justify-between">
    <Button variant="outline">취소</Button>
    <Button>저장</Button>
  </CardFooter>
</Card>
```

### Dialog
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// 사용 예제
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>열기</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>학생 추가</DialogTitle>
      <DialogDescription>새로운 학생 정보를 입력하세요.</DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      {/* 폼 내용 */}
    </div>
    <DialogFooter>
      <Button type="submit">저장</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Sheet (Side Panel)
```tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

// 사용 예제
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">상세보기</Button>
  </SheetTrigger>
  <SheetContent side="right" className="w-[400px] sm:w-[540px]">
    <SheetHeader>
      <SheetTitle>학생 상세 정보</SheetTitle>
      <SheetDescription>학생의 모든 정보를 확인하고 수정할 수 있습니다.</SheetDescription>
    </SheetHeader>
    {/* 내용 */}
  </SheetContent>
</Sheet>
```

### Select
```tsx
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// 사용 예제
<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="과정 선택" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>수학</SelectLabel>
      <SelectItem value="math-basic">수학 기초</SelectItem>
      <SelectItem value="math-advanced">수학 심화</SelectItem>
    </SelectGroup>
    <SelectGroup>
      <SelectLabel>영어</SelectLabel>
      <SelectItem value="english-basic">영어 기초</SelectItem>
      <SelectItem value="english-advanced">영어 심화</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

### Table (DataTable)
```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// 사용 예제
<Table>
  <TableCaption>학생 목록</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead className="w-[100px]">학번</TableHead>
      <TableHead>이름</TableHead>
      <TableHead>상태</TableHead>
      <TableHead className="text-right">수강료</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="font-medium">001</TableCell>
      <TableCell>김학생</TableCell>
      <TableCell><Badge>재학중</Badge></TableCell>
      <TableCell className="text-right">₩450,000</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Form (React Hook Form)
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// 사용 예제
const form = useForm<FormData>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    name: '',
    email: '',
  },
});

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>이름</FormLabel>
          <FormControl>
            <Input placeholder="홍길동" {...field} />
          </FormControl>
          <FormDescription>실명을 입력해주세요.</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit">제출</Button>
  </form>
</Form>
```

### Tabs
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 사용 예제
<Tabs defaultValue="overview" className="w-[400px]">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="overview">개요</TabsTrigger>
    <TabsTrigger value="details">상세</TabsTrigger>
    <TabsTrigger value="settings">설정</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    <Card>
      <CardHeader>
        <CardTitle>개요</CardTitle>
      </CardHeader>
    </Card>
  </TabsContent>
  <TabsContent value="details">상세 정보...</TabsContent>
  <TabsContent value="settings">설정...</TabsContent>
</Tabs>
```

### Alert
```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

// 사용 예제
<Alert>
  <InfoIcon className="h-4 w-4" />
  <AlertTitle>안내</AlertTitle>
  <AlertDescription>
    수강 신청이 정상적으로 완료되었습니다.
  </AlertDescription>
</Alert>
```

### Checkbox & Switch
```tsx
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

// Checkbox 사용 예제
<div className="flex items-center space-x-2">
  <Checkbox id="terms" checked={checked} onCheckedChange={setChecked} />
  <label htmlFor="terms">약관에 동의합니다</label>
</div>

// Switch 사용 예제
<div className="flex items-center space-x-2">
  <Switch id="airplane-mode" checked={enabled} onCheckedChange={setEnabled} />
  <label htmlFor="airplane-mode">알림 받기</label>
</div>
```

### Calendar
```tsx
import { Calendar } from '@/components/ui/calendar';

// 사용 예제
<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  className="rounded-md border"
/>
```

### Command (검색/명령 팔레트)
```tsx
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

// 사용 예제
<Command className="rounded-lg border shadow-md">
  <CommandInput placeholder="검색..." />
  <CommandList>
    <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
    <CommandGroup heading="추천">
      <CommandItem>학생 관리</CommandItem>
      <CommandItem>수업 관리</CommandItem>
      <CommandItem>일정 관리</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>
```

---

## 🔧 커스텀 컴포넌트

### Modal (커스텀 모달)
```tsx
import { Modal } from '@/components/ui/Modal';

// Props
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// 사용 예제
<Modal isOpen={isOpen} onClose={handleClose} title="확인">
  <p>정말 삭제하시겠습니까?</p>
  <div className="flex justify-end gap-2 mt-4">
    <Button variant="outline" onClick={handleClose}>취소</Button>
    <Button variant="destructive" onClick={handleDelete}>삭제</Button>
  </div>
</Modal>
```

### Loading (로딩 인디케이터)
```tsx
import { Loading } from '@/components/ui/Loading';

// Props
interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

// 사용 예제
<Loading size="lg" text="데이터를 불러오는 중..." />
```

### EnhancedSearchBox
```tsx
import { EnhancedSearchBox } from '@/components/ui/EnhancedSearchBox';

// Props
interface EnhancedSearchBoxProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  suggestions?: string[];
  isLoading?: boolean;
}

// 사용 예제
<EnhancedSearchBox
  placeholder="학생 이름으로 검색"
  onSearch={handleSearch}
  suggestions={recentSearches}
  isLoading={isSearching}
/>
```

### DropZone (파일 업로드)
```tsx
import { DropZone } from '@/components/ui/DropZone';

// Props
interface DropZoneProps {
  onDrop: (files: File[]) => void;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
}

// 사용 예제
<DropZone
  onDrop={handleFileUpload}
  accept="image/*"
  maxSize={5 * 1024 * 1024} // 5MB
  multiple={false}
/>
```

---

## 🚀 기능별 전용 컴포넌트

### ClassFlow 컴포넌트 시스템
```tsx
import { 
  ClassContainer,
  StudentCard,
  DragHandle,
  LoadingPlaceholder 
} from '@/components/ui/classflow';

// ClassFlow 통합 예제
<ClassContainer classId={classId}>
  {students.map(student => (
    <StudentCard 
      key={student.id}
      student={student}
      draggable
      renderDragHandle={() => <DragHandle />}
    />
  ))}
  {isLoading && <LoadingPlaceholder count={3} />}
</ClassContainer>
```

### SearchSidebar (통합 검색)
```tsx
import { SearchSidebar } from '@/components/search/SearchSidebar';
import { SearchProvider } from '@/components/search/SearchProvider';

// 사용 예제
<SearchProvider>
  <SearchSidebar
    isOpen={sidebarOpen}
    onClose={() => setSidebarOpen(false)}
    context="students" // 'students' | 'staff' | 'classes' | 'dashboard'
  />
</SearchProvider>
```

### TabNavigation (탭 네비게이션)
```tsx
import { TabNavigation } from '@/components/navigation/TabNavigation';
import { TabItem } from '@/components/navigation/TabItem';

// 사용 예제
<TabNavigation>
  <TabItem href="/main/dashboard" icon={LayoutDashboard} label="대시보드" />
  <TabItem href="/main/students" icon={Users} label="학생 관리" />
  <TabItem href="/main/classes" icon={School} label="수업 관리" />
</TabNavigation>
```

### DataTable (고급 테이블)
```tsx
import { DataTable } from '@/components/data-table';

// Props
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pagination?: boolean;
  sorting?: boolean;
  filtering?: boolean;
  onRowClick?: (row: T) => void;
}

// 사용 예제
<DataTable
  data={students}
  columns={studentColumns}
  pagination
  sorting
  filtering
  onRowClick={(student) => router.push(`/students/${student.id}`)}
/>
```

---

## 📦 컴포넌트 Import 패턴

### 개별 Import (권장)
```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
```

### 그룹 Import
```tsx
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui';
```

### 기능별 Import
```tsx
// 검색 관련
import { SearchSidebar, SearchInput, SearchResults } from '@/components/search';

// 레이아웃 관련
import { AdminLayout, Sidebar, Header } from '@/components/layout';

// 인증 관련
import { AuthGuard, LoginForm, PermissionGate } from '@/components/auth';
```

---

## 🎨 스타일링 가이드

### Tailwind CSS 클래스 사용
```tsx
// 색상 - 브랜드 컬러 시스템
<div className="bg-educanvas-500 text-educanvas-contrast">
<div className="bg-wisdom-500 text-wisdom-contrast">
<div className="bg-growth-500 text-growth-contrast">

// 다크모드 지원
<div className="bg-white dark:bg-neutral-900">
<div className="text-neutral-900 dark:text-neutral-100">

// 간격 - 디자인 토큰
<div className="p-spacing-md gap-spacing-sm">
```

### cn() 유틸리티 함수
```tsx
import { cn } from '@/lib/utils';

// 조건부 클래스 적용
<Button 
  className={cn(
    "base-class",
    isActive && "active-class",
    isDisabled && "disabled-class"
  )}
>
```

---

## 🔗 관련 문서

- [컴포넌트 사용 가이드](./component-usage-guide.md)
- [컴포넌트 패턴](./component-patterns.md)
- [디자인 토큰 가이드](../../../guides/ui-development/design-tokens-usage.md)
- [shadcn/ui 공식 문서](https://ui.shadcn.com)

---

**작성일**: 2025-08-28  
**작성자**: Claude AI Assistant  
**버전**: 1.0.0