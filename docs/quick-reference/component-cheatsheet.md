# 🎨 컴포넌트 개발 Quick Reference

**목적**: 1-2분 내 즉시 참조 가능한 컴포넌트 필수 정보  
**업데이트**: 2025-08-28

---

## ⚡ 가장 많이 사용되는 Top 10 컴포넌트

### 1. Button (75회 사용)
```tsx
import { Button } from '@/components/ui/button';

// 기본 사용
<Button variant="default" size="lg" onClick={handleClick}>저장</Button>
<Button variant="outline" disabled={loading}>취소</Button>

// 아이콘 버튼
<Button variant="ghost" size="icon"><Plus className="h-4 w-4" /></Button>
```

### 2. Badge (50회 사용)
```tsx
import { Badge } from '@/components/ui/badge';

// 상태 표시
<Badge variant="default">재학중</Badge>
<Badge variant="secondary">휴학</Badge>
<Badge variant="destructive">탈퇴</Badge>
```

### 3. Input (34회 사용)
```tsx
import { Input } from '@/components/ui/input';

// 폼 입력
<Input type="text" placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} />
<Input type="email" placeholder="이메일" required />
```

### 4. Card (28회 사용)
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>제목</CardTitle>
  </CardHeader>
  <CardContent>내용</CardContent>
</Card>
```

### 5. Dialog (22회 사용)
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild><Button>열기</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>제목</DialogTitle>
    </DialogHeader>
    내용
  </DialogContent>
</Dialog>
```

### 6. Sheet (18회 사용)
```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

<Sheet>
  <SheetTrigger asChild><Button>사이드 패널 열기</Button></SheetTrigger>
  <SheetContent side="right" className="w-[400px]">
    <SheetHeader><SheetTitle>제목</SheetTitle></SheetHeader>
    내용
  </SheetContent>
</Sheet>
```

### 7. Select (15회 사용)
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="선택하세요" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">옵션 1</SelectItem>
    <SelectItem value="option2">옵션 2</SelectItem>
  </SelectContent>
</Select>
```

### 8. Table (12회 사용)
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>이름</TableHead>
      <TableHead>상태</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>홍길동</TableCell>
      <TableCell><Badge>재학중</Badge></TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### 9. Form (React Hook Form 연동)
```tsx
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

const form = useForm();

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>이름</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

### 10. Tabs (8회 사용)
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">탭 1</TabsTrigger>
    <TabsTrigger value="tab2">탭 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">탭 1 내용</TabsContent>
  <TabsContent value="tab2">탭 2 내용</TabsContent>
</Tabs>
```

---

## 🎨 필수 스타일링 패턴

### 다크모드 지원 색상
```tsx
// ✅ 올바른 방법
<div className="bg-white dark:bg-neutral-900">
<div className="text-neutral-900 dark:text-neutral-100">
<div className="border-neutral-200 dark:border-neutral-800">

// ✅ 브랜드 색상 + 자동 대비
<div className="bg-educanvas-500 text-educanvas-contrast">
<div className="bg-wisdom-500 text-wisdom-contrast">
<div className="bg-growth-500 text-growth-contrast">

// ❌ 금지
<div className="bg-educanvas-500 text-white">  // 다크모드 미지원
<div style={{ color: 'blue' }}>  // 인라인 스타일
```

### 조건부 스타일링
```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  "base-class",
  isActive && "bg-educanvas-500",
  isDisabled && "opacity-50 cursor-not-allowed"
)} />
```

---

## 🔍 검색 키워드 (더 자세한 정보 필요 시)

| 키워드 | 검색할 문서 | 찾을 내용 |
|--------|-------------|-----------|
| `Button Props` | component-catalog.md | 모든 Button variant, size 옵션 |
| `Form patterns` | component-patterns.md | 폼 검증, 에러 처리 패턴 |
| `Table advanced` | DataTable-Component-Guide.md | 정렬, 필터링, 페이지네이션 |
| `dark mode colors` | design-tokens-usage.md | 전체 색상 토큰 시스템 |
| `API patterns` | CRUD-API-Patterns.md | 데이터 페칭 및 상태 관리 |
| `TypeScript errors` | typescript-safety-manual.md | 타입 에러 해결책 |

---

## ⚡ 자주 사용하는 명령어

```bash
# 컴포넌트 개발 도구
npm run create:component MyComponent --type feature --variant
npm run validate:components
npm run analyze:components

# 타입 체크
npx tsc --noEmit --strict

# 개발 서버
npm run dev
```

---

**💡 이 치트시트로 해결되지 않는 경우에만 전체 문서를 참조하세요!**