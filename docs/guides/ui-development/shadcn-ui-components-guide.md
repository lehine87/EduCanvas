# shadcn/ui 컴포넌트 사용 가이드

**작성일**: 2025-08-26  
**버전**: v1.0  
**테스트 완료**: ✅ `/test/shadcn-ui` 페이지에서 모든 컴포넌트 검증 완료

---

## 🎯 개요

EduCanvas v2에서 사용 가능한 shadcn/ui 컴포넌트들의 실제 사용법과 예제를 제공합니다. 모든 컴포넌트는 실제 프로젝트 환경에서 테스트되고 검증되었습니다.

## 📋 설치된 컴포넌트 목록 (30개)

### 기본 입력 컴포넌트
- [Button](#button) - 기본 버튼, 다양한 variants
- [Input](#input) - 텍스트 입력 필드
- [Textarea](#textarea) - 다중 라인 텍스트 입력
- [Label](#label) - 폼 라벨
- [Checkbox](#checkbox) - 체크박스 입력
- [Switch](#switch) - 토글 스위치
- [RadioGroup](#radiogroup) - 라디오 버튼 그룹
- [Select](#select) - 드롭다운 선택
- [Slider](#slider) - 범위 선택 슬라이더

### 레이아웃 컴포넌트
- [Card](#card) - 카드 레이아웃
- [Separator](#separator) - 구분선
- [Accordion](#accordion) - 접을 수 있는 섹션
- [Tabs](#tabs) - 탭 인터페이스
- [Table](#table) - 기본 테이블

### 오버레이 컴포넌트
- [Dialog](#dialog) - 모달 대화상자
- [Sheet](#sheet) - 사이드 시트
- [Popover](#popover) - 팝오버
- [Tooltip](#tooltip) - 툴팁
- [AlertDialog](#alertdialog) - 확인/취소 대화상자

### 피드백 컴포넌트
- [Alert](#alert) - 알림 메시지
- [Badge](#badge) - 배지/태그
- [Progress](#progress) - 진행률 표시
- [Skeleton](#skeleton) - 로딩 스켈레톤

### 내비게이션 컴포넌트
- [DropdownMenu](#dropdownmenu) - 드롭다운 메뉴
- [Toggle](#toggle) - 토글 버튼
- [ToggleGroup](#togglegroup) - 토글 버튼 그룹

### 표시 컴포넌트
- [Avatar](#avatar) - 사용자 아바타

### 고급 컴포넌트
- [DataTable](#datatable) - 완전한 데이터 테이블 (자체 개발)

---

## 📚 컴포넌트 상세 사용법

### Button

기본적인 버튼 컴포넌트입니다.

```tsx
import { Button } from "@/components/ui/button"

// 기본 버튼
<Button>클릭하세요</Button>

// Variants
<Button variant="default">기본</Button>
<Button variant="destructive">삭제</Button>
<Button variant="outline">외곽선</Button>
<Button variant="secondary">보조</Button>
<Button variant="ghost">고스트</Button>
<Button variant="link">링크</Button>

// 크기
<Button size="sm">작게</Button>
<Button size="default">기본</Button>
<Button size="lg">크게</Button>

// 상태
<Button disabled>비활성화</Button>

// 아이콘과 함께
import { Plus } from "lucide-react"
<Button><Plus className="mr-2 h-4 w-4" />추가</Button>
```

### Input

텍스트 입력 필드입니다.

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// 기본 입력
<Input placeholder="이름을 입력하세요" />

// 라벨과 함께
<div className="space-y-2">
  <Label htmlFor="email">이메일</Label>
  <Input id="email" type="email" placeholder="email@example.com" />
</div>

// 제어된 입력
const [value, setValue] = useState("")
<Input 
  value={value} 
  onChange={(e) => setValue(e.target.value)}
  placeholder="제어된 입력"
/>

// 비활성화
<Input disabled placeholder="비활성화된 입력" />
```

### Card

카드 레이아웃 컴포넌트입니다.

```tsx
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>카드 제목</CardTitle>
    <CardDescription>카드 설명입니다.</CardDescription>
  </CardHeader>
  <CardContent>
    <p>카드의 주요 내용이 여기에 들어갑니다.</p>
  </CardContent>
  <CardFooter>
    <Button>액션</Button>
  </CardFooter>
</Card>
```

### Dialog

모달 대화상자 컴포넌트입니다.

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>대화상자 열기</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>대화상자 제목</DialogTitle>
      <DialogDescription>
        대화상자 설명입니다.
      </DialogDescription>
    </DialogHeader>
    {/* 대화상자 내용 */}
  </DialogContent>
</Dialog>

// 상태 제어
const [open, setOpen] = useState(false)
<Dialog open={open} onOpenChange={setOpen}>
  {/* ... */}
</Dialog>
```

### Select

드롭다운 선택 컴포넌트입니다.

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="옵션을 선택하세요" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">옵션 1</SelectItem>
    <SelectItem value="option2">옵션 2</SelectItem>
    <SelectItem value="option3">옵션 3</SelectItem>
  </SelectContent>
</Select>

// 제어된 선택
const [value, setValue] = useState("")
<Select value={value} onValueChange={setValue}>
  {/* ... */}
</Select>
```

### Checkbox

체크박스 입력 컴포넌트입니다.

```tsx
import { Checkbox } from "@/components/ui/checkbox"

// 기본 체크박스
<Checkbox id="terms" />
<Label htmlFor="terms">약관에 동의합니다</Label>

// 제어된 체크박스
const [checked, setChecked] = useState(false)
<Checkbox 
  checked={checked} 
  onCheckedChange={setChecked}
  id="controlled" 
/>

// 불확정 상태
<Checkbox checked="indeterminate" />
```

### Switch

토글 스위치 컴포넌트입니다.

```tsx
import { Switch } from "@/components/ui/switch"

// 기본 스위치
<Switch id="airplane-mode" />
<Label htmlFor="airplane-mode">비행기 모드</Label>

// 제어된 스위치
const [enabled, setEnabled] = useState(false)
<Switch 
  checked={enabled} 
  onCheckedChange={setEnabled}
/>
```

### Badge

배지/태그 컴포넌트입니다.

```tsx
import { Badge } from "@/components/ui/badge"

// 기본 배지
<Badge>기본</Badge>

// Variants
<Badge variant="default">기본</Badge>
<Badge variant="secondary">보조</Badge>
<Badge variant="destructive">삭제</Badge>
<Badge variant="outline">외곽선</Badge>

// 상태 표시에 유용
<Badge variant="secondary" className="bg-green-100 text-green-800">
  활성
</Badge>
<Badge variant="secondary" className="bg-red-100 text-red-800">
  비활성
</Badge>
```

### Alert

알림 메시지 컴포넌트입니다.

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react"

// 기본 알림
<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>주의!</AlertTitle>
  <AlertDescription>
    중요한 메시지입니다.
  </AlertDescription>
</Alert>

// 성공 알림
<Alert className="border-green-200 bg-green-50">
  <CheckCircle2 className="h-4 w-4 text-green-600" />
  <AlertTitle className="text-green-800">성공</AlertTitle>
  <AlertDescription className="text-green-700">
    작업이 성공적으로 완료되었습니다.
  </AlertDescription>
</Alert>

// 오류 알림
<Alert variant="destructive">
  <XCircle className="h-4 w-4" />
  <AlertTitle>오류</AlertTitle>
  <AlertDescription>
    문제가 발생했습니다.
  </AlertDescription>
</Alert>
```

### Tabs

탭 인터페이스 컴포넌트입니다.

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="tab1" className="w-[400px]">
  <TabsList>
    <TabsTrigger value="tab1">탭 1</TabsTrigger>
    <TabsTrigger value="tab2">탭 2</TabsTrigger>
    <TabsTrigger value="tab3">탭 3</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    첫 번째 탭 내용입니다.
  </TabsContent>
  <TabsContent value="tab2">
    두 번째 탭 내용입니다.
  </TabsContent>
  <TabsContent value="tab3">
    세 번째 탭 내용입니다.
  </TabsContent>
</Tabs>
```

### Table

기본 테이블 컴포넌트입니다.

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>이름</TableHead>
      <TableHead>이메일</TableHead>
      <TableHead>상태</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>김영수</TableCell>
      <TableCell>kim@example.com</TableCell>
      <TableCell><Badge>활성</Badge></TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Progress

진행률 표시 컴포넌트입니다.

```tsx
import { Progress } from "@/components/ui/progress"

// 기본 진행률
<Progress value={33} />

// 애니메이션 진행률
const [progress, setProgress] = useState(13)
useEffect(() => {
  const timer = setTimeout(() => setProgress(66), 500)
  return () => clearTimeout(timer)
}, [])
<Progress value={progress} className="w-[60%]" />
```

### Avatar

사용자 아바타 컴포넌트입니다.

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

<Avatar>
  <AvatarImage src="https://github.com/shadcn.png" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>

// 크기 조정
<Avatar className="h-20 w-20">
  <AvatarImage src="/placeholder-user.jpg" />
  <AvatarFallback className="text-lg">김영수</AvatarFallback>
</Avatar>
```

---

## 🎨 스타일링 팁

### CSS 변수 활용
```css
/* 테마 색상 커스터마이징 */
:root {
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
}
```

### 조건부 스타일링
```tsx
// cn 유틸리티 사용
import { cn } from "@/lib/utils"

<Button 
  className={cn(
    "hover:bg-accent",
    isActive && "bg-accent",
    disabled && "opacity-50"
  )}
>
```

### 반응형 디자인
```tsx
<Card className="w-full md:w-1/2 lg:w-1/3">
  <CardContent className="p-4 md:p-6">
    {/* 콘텐츠 */}
  </CardContent>
</Card>
```

---

## 🔧 고급 사용법

### 폼 통합 (React Hook Form)
```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const formSchema = z.object({
  username: z.string().min(2),
  email: z.string().email(),
})

const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
})

<form onSubmit={form.handleSubmit(onSubmit)}>
  <div className="space-y-4">
    <div>
      <Label htmlFor="username">사용자명</Label>
      <Input id="username" {...form.register("username")} />
    </div>
    <Button type="submit">제출</Button>
  </div>
</form>
```

### 다크 모드 지원
```tsx
import { useTheme } from "next-themes"

const { theme, setTheme } = useTheme()

<Button 
  variant="outline" 
  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
>
  {theme === "dark" ? <Sun /> : <Moon />}
</Button>
```

---

## 📖 참고 링크

- [shadcn/ui 공식 문서](https://ui.shadcn.com)
- [Radix UI 문서](https://radix-ui.com)
- [TailwindCSS 문서](https://tailwindcss.com)
- **테스트 페이지**: `/test/shadcn-ui` - 모든 컴포넌트 실제 동작 확인 가능

---

**작성자**: Lead Developer  
**최종 업데이트**: 2025-08-26  
**다음 업데이트 예정**: DataTable 컴포넌트 추가 시