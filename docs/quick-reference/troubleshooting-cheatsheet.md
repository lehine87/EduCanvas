# 🔧 문제해결 Quick Reference

**목적**: 1-2분 내 즉시 해결 가능한 일반적 문제들  
**업데이트**: 2025-08-28

---

## 🚨 TypeScript 에러 해결

### 1. Type 'any' 사용 금지 에러
```tsx
// ❌ 문제
const data: any = await response.json();

// ✅ 해결
type Student = Database['public']['Tables']['students']['Row'];
const data: Student[] = await response.json();

// 또는 unknown 사용 후 타입가드
const data: unknown = await response.json();
if (Array.isArray(data)) {
  // data는 이제 unknown[]
}
```

### 2. Database 타입 오류
```tsx
// ❌ 문제 - 오래된 타입
const { data } = await supabase.from('students').select('*');

// ✅ 해결 - 타입 업데이트
npx supabase gen types typescript --project-id hodkqpmukwfrreozwmcy

// ✅ 정확한 타입 사용
type Student = Database['public']['Tables']['students']['Row'];
const { data }: { data: Student[] | null } = await supabase.from('students').select('*');
```

### 3. Props 타입 오류
```tsx
// ❌ 문제
function StudentCard({ student }) {  // 타입 없음

// ✅ 해결
interface StudentCardProps {
  student: Database['public']['Tables']['students']['Row'];
  onEdit?: (student: Student) => void;
}

function StudentCard({ student, onEdit }: StudentCardProps) {
```

---

## 🎨 스타일링 문제 해결

### 1. 다크모드가 작동하지 않음
```tsx
// ❌ 문제 - 인라인 스타일
<div style={{ backgroundColor: '#3B82F6', color: 'white' }}>

// ❌ 문제 - 고정 색상
<div className="bg-blue-500 text-white">

// ✅ 해결 - 다크모드 지원
<div className="bg-educanvas-500 text-educanvas-contrast">
<div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
```

### 2. Tailwind 클래스가 적용되지 않음
```bash
# 문제: 개발 서버 재시작
npm run dev

# Tailwind 설정 확인
cat tailwind.config.ts

# CSS import 확인 (app/globals.css)
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3. 커스텀 색상이 작동하지 않음
```tsx
// ✅ 브랜드 색상 사용
<div className="bg-educanvas-500 text-educanvas-contrast">
<div className="bg-wisdom-500 text-wisdom-contrast">
<div className="bg-growth-500 text-growth-contrast">

// 디자인 토큰 확인
http://localhost:3000/test/design-tokens
```

---

## 🗄️ 데이터베이스 연결 문제

### 1. Supabase 연결 실패
```bash
# 환경변수 확인
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# 로컬 설정 확인
cat .env.local

# CLI 로그인 상태 확인
npx supabase status
```

### 2. RLS 정책 에러
```sql
-- 문제: 데이터 조회되지 않음
-- 해결: RLS 정책 확인
SELECT * FROM auth.users WHERE id = auth.uid();

-- 테넌트 정책 확인
SELECT * FROM tenant_memberships WHERE user_id = auth.uid();
```

### 3. UUID 생성 오류
```tsx
// ❌ 문제 - 클라이언트에서 UUID 생성
import { v4 as uuidv4 } from 'uuid';
const id = uuidv4();

// ✅ 해결 - DB에서 자동 생성
const { data } = await supabase
  .from('students')
  .insert({ name: 'John' })  // id는 자동 생성됨
  .select()
  .single();
```

---

## 🚀 API 관련 문제

### 1. CORS 에러
```tsx
// Next.js API Route에서 CORS 설정
export async function GET(request: NextRequest) {
  const response = NextResponse.json(data);
  
  // CORS 헤더 추가
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  
  return response;
}
```

### 2. 404 Not Found
```bash
# API Route 파일 위치 확인
app/api/students/route.ts          # /api/students
app/api/students/[id]/route.ts     # /api/students/[id]

# 파일명 확인 (route.ts 필수)
```

### 3. JSON Parse 에러
```tsx
// ✅ 에러 처리 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // 처리 로직
  } catch (error) {
    return Response.json(
      { error: 'Invalid JSON format' }, 
      { status: 400 }
    );
  }
}
```

---

## 🎛️ 개발 환경 문제

### 1. 개발 서버가 시작되지 않음
```bash
# 포트 충돌 확인
lsof -ti:3000 | xargs kill -9

# 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 캐시 클리어
npm run dev -- --reset-cache
```

### 2. Hot Reload가 작동하지 않음
```bash
# Turbopack 사용 (Next.js 15)
npm run dev

# 파일 감시 확인
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 3. Build 실패
```bash
# TypeScript 에러 확인
npx tsc --noEmit --strict

# ESLint 에러 확인
npm run lint

# 의존성 문제 확인
npm audit --audit-level=high
```

---

## 📱 컴포넌트 관련 문제

### 1. shadcn/ui 컴포넌트 import 에러
```tsx
// ❌ 문제
import { Button } from 'shadcn/ui';

// ✅ 해결
import { Button } from '@/components/ui/button';

// 컴포넌트 재설치
npx shadcn@latest add button
```

### 2. 폼 validation이 작동하지 않음
```tsx
// ✅ 올바른 React Hook Form 설정
const form = useForm({
  resolver: zodResolver(schema),  // Zod resolver 필수
  mode: 'onChange',              // 실시간 검증
});

// Schema 검증
const schema = z.object({
  name: z.string().min(1, '이름은 필수입니다'),
});
```

### 3. State 업데이트가 반영되지 않음
```tsx
// ❌ 문제 - 직접 mutation
const [items, setItems] = useState([]);
items.push(newItem);  // React는 감지하지 못함

// ✅ 해결 - 새 배열 생성
setItems([...items, newItem]);
setItems(items => [...items, newItem]);
```

---

## ⚡ 성능 문제

### 1. 페이지 로딩이 느림
```tsx
// ✅ 동적 import 사용
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Loading />,
  ssr: false,
});

// ✅ React.memo 사용
const StudentCard = React.memo(({ student }) => {
  return <div>{student.name}</div>;
});
```

### 2. 긴 리스트 렌더링이 느림
```tsx
// ✅ 가상화 사용
import { VirtualizedStudentList } from '@/components/ui/VirtualizedStudentList';

<VirtualizedStudentList
  students={students}  // 1000+ items
  height={600}
  itemHeight={80}
/>
```

---

## 🔍 디버깅 도구

### 1. 개발 도구
```bash
# React Developer Tools
# Chrome Extension 설치

# Next.js Bundle Analyzer
npm install --save-dev @next/bundle-analyzer
npm run analyze
```

### 2. 로그 확인
```tsx
// 서버 로그
console.log('API Response:', data);

// 클라이언트 로그 (개발 환경만)
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', debugData);
}
```

### 3. 네트워크 확인
```bash
# API 요청 테스트
curl -X GET http://localhost:3000/api/students
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}'
```

---

## 🔍 검색 키워드 (더 자세한 정보 필요 시)

| 에러/문제 | 검색할 문서 | 찾을 내용 |
|-----------|-------------|-----------|
| `Type errors` | typescript-safety-manual.md | 타입 에러 해결 가이드 |
| `Database connection` | supabase-connection-guide.md | Supabase 연결 설정 |
| `RLS policies` | database-development-checklist.md | Row Level Security 정책 |
| `Component imports` | component-catalog.md | 올바른 컴포넌트 import |
| `API routing` | Quick-API-Reference.md | Next.js 15 API Routes |
| `Performance` | component-patterns.md | 성능 최적화 패턴 |

---

## ⚡ 긴급 복구 명령어

```bash
# 전체 초기화 (최후 수단)
rm -rf node_modules .next
npm install
npm run build

# TypeScript 강제 체크
npx tsc --noEmit --strict

# 타입 재생성
npx supabase gen types typescript --project-id hodkqpmukwfrreozwmcy

# Git 상태 확인
git status
git log --oneline -5
```

---

**💡 이 치트시트로 해결되지 않는 경우에만 전체 문서를 참조하거나 팀에 문의하세요!**