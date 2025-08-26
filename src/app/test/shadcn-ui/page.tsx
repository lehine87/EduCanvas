'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { CheckCircle2, XCircle, AlertCircle, Info, ChevronDown, Moon, Sun, User, Terminal, Calendar, Settings, Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react'
import { DataTable, SortableHeader } from '@/components/data-table'
import { ColumnDef } from '@tanstack/react-table'

// 데이터 타입 정의
type StudentData = {
  id: string
  name: string
  grade: string
  subject: string
  score: number
  status: '우수' | '양호' | '보통' | '주의'
}

// 샘플 데이터
const sampleStudents: StudentData[] = [
  { id: '001', name: '김영수', grade: '고1', subject: '수학', score: 95, status: '우수' },
  { id: '002', name: '이미나', grade: '고2', subject: '영어', score: 88, status: '양호' },
  { id: '003', name: '박준호', grade: '고3', subject: '국어', score: 92, status: '우수' },
  { id: '004', name: '최서연', grade: '고1', subject: '과학', score: 87, status: '양호' },
  { id: '005', name: '정민석', grade: '고2', subject: '수학', score: 76, status: '보통' },
  { id: '006', name: '한지영', grade: '고3', subject: '영어', score: 94, status: '우수' },
  { id: '007', name: '송태현', grade: '고1', subject: '국어', score: 82, status: '양호' },
  { id: '008', name: '윤서진', grade: '고2', subject: '과학', score: 89, status: '양호' },
  { id: '009', name: '배현우', grade: '고3', subject: '수학', score: 91, status: '우수' },
  { id: '010', name: '임유진', grade: '고1', subject: '영어', score: 85, status: '양호' },
  { id: '011', name: '강수빈', grade: '고2', subject: '국어', score: 93, status: '우수' },
  { id: '012', name: '조민호', grade: '고3', subject: '과학', score: 79, status: '보통' },
  { id: '013', name: '신예원', grade: '고1', subject: '수학', score: 98, status: '우수' },
  { id: '014', name: '홍성민', grade: '고2', subject: '영어', score: 84, status: '양호' },
  { id: '015', name: '문지혜', grade: '고3', subject: '국어', score: 90, status: '우수' },
  { id: '016', name: '김도현', grade: '고1', subject: '과학', score: 73, status: '보통' },
  { id: '017', name: '장민서', grade: '고2', subject: '수학', score: 86, status: '양호' },
  { id: '018', name: '오준영', grade: '고3', subject: '영어', score: 96, status: '우수' },
  { id: '019', name: '류지은', grade: '고1', subject: '국어', score: 88, status: '양호' },
  { id: '020', name: '서태우', grade: '고2', subject: '과학', score: 75, status: '보통' },
  { id: '021', name: '정하영', grade: '고3', subject: '수학', score: 97, status: '우수' },
  { id: '022', name: '노승현', grade: '고1', subject: '영어', score: 81, status: '양호' },
  { id: '023', name: '안소영', grade: '고2', subject: '국어', score: 89, status: '양호' },
  { id: '024', name: '최준혁', grade: '고3', subject: '과학', score: 92, status: '우수' },
  { id: '025', name: '김나영', grade: '고1', subject: '수학', score: 78, status: '보통' },
]

export default function ShadcnUITestPage() {
  const [inputValue, setInputValue] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})
  const [clickCount, setClickCount] = useState(0)
  const [lastClicked, setLastClicked] = useState('')
  const [isDark, setIsDark] = useState(false)
  const [selectValue, setSelectValue] = useState('')
  const [textareaValue, setTextareaValue] = useState('')
  const [isSelectableEnabled, setIsSelectableEnabled] = useState(true)
  const [progress, setProgress] = useState(33)
  const [sliderValue, setSliderValue] = useState([50])
  const [radioValue, setRadioValue] = useState('option1')
  // 데이터 테이블 컬럼 정의
  const studentColumns: ColumnDef<StudentData>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => <SortableHeader column={column}>ID</SortableHeader>,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column}>이름</SortableHeader>,
    },
    {
      accessorKey: "grade",
      header: "학년",
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("grade")}</Badge>
      ),
    },
    {
      accessorKey: "subject",
      header: "과목",
    },
    {
      accessorKey: "score",
      header: ({ column }) => (
        <div className="text-right">
          <SortableHeader column={column}>점수</SortableHeader>
        </div>
      ),
      cell: ({ row }) => {
        const score = parseFloat(row.getValue("score"))
        return <div className="text-right font-medium">{score}</div>
      },
    },
    {
      accessorKey: "status",
      header: "상태",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const statusColor = {
          '우수': 'bg-green-500',
          '양호': 'bg-blue-500', 
          '보통': 'bg-yellow-500',
          '주의': 'bg-red-500'
        }[status] || 'bg-gray-500'
        
        return <Badge className={statusColor}>{status}</Badge>
      },
    },
  ]

  // 다크모드 초기화
  useEffect(() => {
    const darkMode = localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDark(darkMode)
    document.documentElement.classList.toggle('dark', darkMode)
  }, [])

  // 다크모드 토글
  const toggleDarkMode = () => {
    const newDarkMode = !isDark
    setIsDark(newDarkMode)
    document.documentElement.classList.toggle('dark', newDarkMode)
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light')
    console.log(`🌓 다크모드: ${newDarkMode ? '활성화' : '비활성화'}`)
  }

  // 컴포넌트 테스트 함수
  const testComponent = (componentName: string, result: boolean) => {
    console.log(`✅ 테스트: ${componentName}`)
    setTestResults(prev => ({ ...prev, [componentName]: result }))
    setLastClicked(componentName)
  }

  // 버튼 클릭 핸들러
  const handleButtonClick = (buttonType: string) => {
    setClickCount(prev => prev + 1)
    setLastClicked(buttonType)
    console.log(`🔘 버튼 클릭: ${buttonType}`)
    testComponent('Button', true)
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8 px-4">
      {/* 페이지 헤더 */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl">T-V2-001: shadcn/ui 컴포넌트 테스트</CardTitle>
              <CardDescription>
                필수 컴포넌트 10개의 렌더링 및 기능 테스트
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleDarkMode}
              className="h-10 w-10"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="sr-only">다크모드 토글</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                설치된 컴포넌트
              </h3>
              <ul className="space-y-1 text-sm grid grid-cols-2 gap-1">
                <li>✅ Button</li>
                <li>✅ Input</li>
                <li>✅ Card</li>
                <li>✅ Dialog</li>
                <li>✅ Dropdown Menu</li>
                <li>✅ Form</li>
                <li>✅ Label</li>
                <li>✅ Separator</li>
                <li>✅ Sheet</li>
                <li>✅ Tabs</li>
                <li>✅ Table</li>
                <li>✅ Data Table</li>
                <li>✅ Avatar</li>
                <li>✅ Badge</li>
                <li>✅ Switch</li>
                <li>✅ Checkbox</li>
                <li>✅ Select</li>
                <li>✅ Textarea</li>
                <li>✅ Progress</li>
                <li>✅ Alert</li>
                <li>✅ Tooltip</li>
                <li>✅ Popover</li>
                <li>✅ Alert Dialog</li>
                <li>✅ Accordion</li>
                <li>✅ Radio Group</li>
                <li>✅ Slider</li>
                <li>✅ Skeleton</li>
                <li>✅ Toggle</li>
                <li>✅ Toggle Group</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                테스트 환경
              </h3>
              <ul className="space-y-1 text-sm">
                <li>Next.js 15</li>
                <li>React 19</li>
                <li>TailwindCSS 4</li>
                <li>TypeScript Strict Mode</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* 컴포넌트 테스트 섹션들 */}
      <div className="space-y-8">
        {/* 1. Button 컴포넌트 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>1. Button 컴포넌트</CardTitle>
            <CardDescription>
              다양한 버튼 스타일 및 상태 테스트
              {clickCount > 0 && (
                <span className="ml-2 text-sm font-medium text-primary">
                  (클릭 횟수: {clickCount}, 마지막 클릭: {lastClicked})
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => handleButtonClick('Default')}>
                Default 버튼
              </Button>
              <Button variant="secondary" onClick={() => handleButtonClick('Secondary')}>
                Secondary
              </Button>
              <Button variant="destructive" onClick={() => handleButtonClick('Destructive')}>
                Destructive
              </Button>
              <Button variant="outline" onClick={() => handleButtonClick('Outline')}>
                Outline
              </Button>
              <Button variant="ghost" onClick={() => handleButtonClick('Ghost')}>
                Ghost
              </Button>
              <Button variant="link" onClick={() => handleButtonClick('Link')}>
                Link
              </Button>
              <Button disabled onClick={() => handleButtonClick('Disabled')}>
                Disabled (클릭 불가)
              </Button>
              <Button size="sm" onClick={() => handleButtonClick('Small')}>
                Small
              </Button>
              <Button size="lg" onClick={() => handleButtonClick('Large')}>
                Large
              </Button>
            </div>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm">
                💡 버튼을 클릭하면 콘솔에 로그가 출력되고 상태가 업데이트됩니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 2. Input & Label 컴포넌트 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>2. Input & Label 컴포넌트</CardTitle>
            <CardDescription>입력 필드와 라벨 테스트</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="test-input">테스트 입력 필드</Label>
              <Input 
                id="test-input"
                placeholder="여기에 입력하세요..." 
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  testComponent('Input', true)
                }}
              />
              <p className="text-sm text-muted-foreground mt-1">
                입력값: {inputValue || '(비어있음)'}
              </p>
            </div>
            <div>
              <Label htmlFor="disabled-input">비활성화된 입력 필드</Label>
              <Input id="disabled-input" disabled placeholder="비활성화됨" />
            </div>
          </CardContent>
        </Card>

        {/* 3. Card 컴포넌트 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>3. Card 컴포넌트</CardTitle>
            <CardDescription>카드 레이아웃 구조 테스트</CardDescription>
          </CardHeader>
          <CardContent>
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle>중첩된 카드</CardTitle>
                <CardDescription>카드 안의 카드</CardDescription>
              </CardHeader>
              <CardContent>
                카드 컴포넌트는 정상적으로 중첩 가능합니다.
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">취소</Button>
                <Button onClick={() => testComponent('Card', true)}>확인</Button>
              </CardFooter>
            </Card>
          </CardContent>
        </Card>

        {/* 4. Dialog 컴포넌트 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>4. Dialog 컴포넌트</CardTitle>
            <CardDescription>모달 다이얼로그 테스트</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    console.log('📢 Dialog 열기 버튼 클릭')
                    testComponent('Dialog', true)
                  }}
                >
                  다이얼로그 열기
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>테스트 다이얼로그</DialogTitle>
                  <DialogDescription>
                    이것은 shadcn/ui Dialog 컴포넌트 테스트입니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  다이얼로그 내용이 여기에 표시됩니다.
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    닫기
                  </Button>
                  <Button onClick={() => setDialogOpen(false)}>
                    확인
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* 5. Dropdown Menu 컴포넌트 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>5. Dropdown Menu 컴포넌트</CardTitle>
            <CardDescription>드롭다운 메뉴 테스트</CardDescription>
          </CardHeader>
          <CardContent>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  onClick={() => testComponent('DropdownMenu', true)}
                >
                  드롭다운 메뉴 열기 <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>메뉴 옵션</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>프로필</DropdownMenuItem>
                <DropdownMenuItem>설정</DropdownMenuItem>
                <DropdownMenuItem>팀</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>

        {/* 6. Sheet 컴포넌트 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>6. Sheet 컴포넌트</CardTitle>
            <CardDescription>사이드 패널 테스트</CardDescription>
          </CardHeader>
          <CardContent>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button onClick={() => testComponent('Sheet', true)}>
                  Sheet 열기
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>테스트 Sheet</SheetTitle>
                  <SheetDescription>
                    이것은 shadcn/ui Sheet 컴포넌트 테스트입니다.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <p>Sheet 내용이 여기에 표시됩니다.</p>
                  <Button 
                    className="mt-4 w-full" 
                    onClick={() => setSheetOpen(false)}
                  >
                    닫기
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </CardContent>
        </Card>

        {/* 7. Tabs 컴포넌트 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>7. Tabs 컴포넌트</CardTitle>
            <CardDescription>탭 네비게이션 테스트</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tab1" className="w-full">
              <TabsList>
                <TabsTrigger value="tab1" onClick={() => testComponent('Tabs', true)}>
                  탭 1
                </TabsTrigger>
                <TabsTrigger value="tab2">탭 2</TabsTrigger>
                <TabsTrigger value="tab3">탭 3</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1">
                <Card>
                  <CardHeader>
                    <CardTitle>첫 번째 탭</CardTitle>
                  </CardHeader>
                  <CardContent>
                    첫 번째 탭의 내용입니다.
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="tab2">
                <Card>
                  <CardHeader>
                    <CardTitle>두 번째 탭</CardTitle>
                  </CardHeader>
                  <CardContent>
                    두 번째 탭의 내용입니다.
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="tab3">
                <Card>
                  <CardHeader>
                    <CardTitle>세 번째 탭</CardTitle>
                  </CardHeader>
                  <CardContent>
                    세 번째 탭의 내용입니다.
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 8. Table 컴포넌트 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>8. Table 컴포넌트</CardTitle>
            <CardDescription>데이터 테이블 및 정렬 기능 테스트</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>학생 목록 예시</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>학년</TableHead>
                  <TableHead>과목</TableHead>
                  <TableHead className="text-right">점수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow onClick={() => testComponent('Table', true)} className="cursor-pointer">
                  <TableCell className="font-medium">001</TableCell>
                  <TableCell>김영수</TableCell>
                  <TableCell>고1</TableCell>
                  <TableCell>수학</TableCell>
                  <TableCell className="text-right">95</TableCell>
                </TableRow>
                <TableRow className="cursor-pointer">
                  <TableCell className="font-medium">002</TableCell>
                  <TableCell>이미나</TableCell>
                  <TableCell>고2</TableCell>
                  <TableCell>영어</TableCell>
                  <TableCell className="text-right">88</TableCell>
                </TableRow>
                <TableRow className="cursor-pointer">
                  <TableCell className="font-medium">003</TableCell>
                  <TableCell>박준호</TableCell>
                  <TableCell>고3</TableCell>
                  <TableCell>국어</TableCell>
                  <TableCell className="text-right">92</TableCell>
                </TableRow>
                <TableRow className="cursor-pointer">
                  <TableCell className="font-medium">004</TableCell>
                  <TableCell>최서연</TableCell>
                  <TableCell>고1</TableCell>
                  <TableCell>과학</TableCell>
                  <TableCell className="text-right">87</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm">💡 테이블 행을 클릭하면 테스트가 실행됩니다. 호버 효과와 정렬 기능을 확인하세요.</p>
            </div>
          </CardContent>
        </Card>

        {/* 8-2. Data Table 컴포넌트 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>8-2. Data Table 컴포넌트 (재사용 가능)</CardTitle>
            <CardDescription>모든 기능이 내장된 재사용 가능한 데이터 테이블 컴포넌트</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Label htmlFor="selectable-toggle">체크박스 기능:</Label>
                <Switch 
                  id="selectable-toggle"
                  checked={isSelectableEnabled}
                  onCheckedChange={setIsSelectableEnabled}
                />
                <span className="text-sm text-muted-foreground">
                  {isSelectableEnabled ? '활성화됨' : '비활성화됨'}
                </span>
              </div>
              <DataTable
                columns={studentColumns}
                data={sampleStudents}
                searchable={true}
                searchPlaceholder="학생 이름으로 검색..."
                selectable={isSelectableEnabled}
                actionColumn={true}
                pagination={true}
                pageSize={8}
                pageSizeOptions={[5, 8, 10, 20]}
                enableColumnResizing={true}
                columnResizeMode="onChange"
                onRowSelect={(selectedRows) => {
                  console.log('선택된 학생들:', selectedRows)
                  testComponent('DataTable', selectedRows.length > 0)
                }}
                onView={(student) => {
                  console.log('상세 보기:', student)
                  alert(`${student.name} 학생의 상세 정보를 보는 중...`)
                }}
                onEdit={(student) => {
                  console.log('편집:', student)
                  alert(`${student.name} 학생 정보를 편집하는 중...`)
                }}
                onDelete={(student) => {
                  console.log('삭제:', student)
                  if (confirm(`${student.name} 학생을 삭제하시겠습니까?`)) {
                    alert('삭제되었습니다.')
                  }
                }}
              />
            </div>
            
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">✨ 재사용 가능한 DataTable 컴포넌트 특징:</p>
              <ul className="text-sm space-y-1">
                <li>• <strong>자동 전체 선택</strong>: 헤더 체크박스로 모든 행 선택/해제</li>
                <li>• <strong>내장 정렬</strong>: SortableHeader 컴포넌트로 간편 정렬</li>
                <li>• <strong>실시간 검색</strong>: 이름 컬럼 기반 즉시 필터링</li>
                <li>• <strong>액션 메뉴</strong>: 보기/편집/삭제 콜백 지원</li>
                <li>• <strong>컬럼 숨기기</strong>: 동적 컬럼 가시성 관리</li>
                <li>• <strong>컬럼 너비 조절</strong>: 드래그로 실시간 너비 조정</li>
                <li>• <strong>고급 페이지네이션</strong>: 첫/마지막 페이지, 페이지 크기 선택, 페이지 정보</li>
                <li>• <strong>타입 안전</strong>: TypeScript 제네릭 지원</li>
              </ul>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p>🔄 <strong>페이지네이션 기능</strong>: 25개 데이터를 8개씩 페이징 (3페이지)</p>
                <p>📊 <strong>페이지 크기</strong>: 5, 8, 10, 20개 중 선택 가능</p>
                <p>⏮️ <strong>네비게이션</strong>: 첫/이전/다음/마지막 페이지 버튼</p>
                <p>📏 <strong>컬럼 리사이징</strong>: 각 컬럼 우측 경계선을 드래그해서 너비 조절</p>
                <p>💡 이제 다른 페이지에서 &lt;DataTable /&gt; 컴포넌트를 import해서 바로 사용할 수 있습니다!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 9. Separator 컴포넌트 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>9. Separator 컴포넌트</CardTitle>
            <CardDescription>구분선 테스트</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 수평 구분선 */}
              <div>
                <p className="text-sm font-medium mb-2">수평 구분선:</p>
                <div className="text-sm">위쪽 내용</div>
                <Separator />
                <div className="text-sm">아래쪽 내용</div>
              </div>

              {/* 수직 구분선 */}
              <div>
                <p className="text-sm font-medium mb-2">수직 구분선:</p>
                <div className="flex h-5 items-center space-x-4 text-sm">
                  <div>항목 1</div>
                  <Separator orientation="vertical" />
                  <div>항목 2</div>
                  <Separator orientation="vertical" />
                  <div>항목 3</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm">💡 Separator는 콘텐츠를 시각적으로 구분하는데 사용됩니다. 기본적으로 수평이며 orientation="vertical"로 수직 구분선도 만들 수 있습니다.</p>
            </div>
          </CardContent>
        </Card>

        {/* 10. Avatar 컴포넌트 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>10. Avatar 컴포넌트</CardTitle>
            <CardDescription>사용자 프로필 이미지 테스트</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/placeholder-user.svg" alt="사용자" />
                  <AvatarFallback>김영수</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarImage src="/nonexistent.jpg" alt="사용자" />
                  <AvatarFallback>이미나</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback className="bg-blue-500">박준호</AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">소형</AvatarFallback>
                </Avatar>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm">중형</AvatarFallback>
                </Avatar>
                <Avatar className="h-12 w-12">
                  <AvatarFallback>대형</AvatarFallback>
                </Avatar>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm">💡 Avatar는 이미지 로딩 실패시 자동으로 Fallback 텍스트를 표시합니다. 크기도 자유롭게 조절 가능합니다.</p>
            </div>
          </CardContent>
        </Card>

        {/* 11. Badge 컴포넌트 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>11. Badge 컴포넌트</CardTitle>
            <CardDescription>상태 및 라벨 표시 테스트</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge>기본</Badge>
                <Badge variant="secondary">보조</Badge>
                <Badge variant="destructive">경고</Badge>
                <Badge variant="outline">외곽선</Badge>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-green-500">성공</Badge>
                <Badge className="bg-yellow-500">대기중</Badge>
                <Badge className="bg-blue-500">진행중</Badge>
                <Badge className="bg-purple-500">완료</Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  onClick={() => {
                    testComponent('Badge', true)
                    console.log('🏷️ Badge 클릭됨')
                  }}
                  className="cursor-pointer hover:bg-primary/80"
                >
                  클릭 가능
                </Badge>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm">💡 Badge는 상태, 카테고리, 라벨 등을 표시하는데 사용됩니다. 다양한 variant와 커스텀 색상을 지원합니다.</p>
            </div>
          </CardContent>
        </Card>

        {/* 12. Switch 컴포넌트 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>12. Switch 컴포넌트</CardTitle>
            <CardDescription>토글 스위치 테스트</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="switch1"
                  onCheckedChange={(checked) => {
                    testComponent('Switch', checked)
                    console.log(`🔘 Switch 1: ${checked ? 'ON' : 'OFF'}`)
                  }}
                />
                <Label htmlFor="switch1">기본 스위치</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="switch2" defaultChecked />
                <Label htmlFor="switch2">기본값 ON</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="switch3" disabled />
                <Label htmlFor="switch3">비활성화</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="switch4" disabled checked />
                <Label htmlFor="switch4">비활성화 (ON)</Label>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm">💡 스위치를 토글하면 콘솔에 상태가 출력됩니다. 애니메이션과 상태 변화를 확인하세요.</p>
            </div>
          </CardContent>
        </Card>

        {/* 페이지 끝 */}
      </div>
    </div>
    </TooltipProvider>
  )
}
