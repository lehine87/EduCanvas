# 📚 EduCanvas API 스켈레톤 가이드

## 📖 목차
1. [API 표준 템플릿 사용법](#api-표준-템플릿-사용법)
2. [학생 관리 API](#학생-관리-api)
3. [클래스 관리 API](#클래스-관리-api)
4. [테넌트 관리 API](#테넌트-관리-api)
5. [API 개발 체크리스트](#api-개발-체크리스트)
6. [예제 코드](#예제-코드)

---

## 🛠️ API 표준 템플릿 사용법

### 기본 구조

```typescript
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  withApiHandler, 
  createSuccessResponse, 
  validateRequestBody,
  validateTenantAccess,
  logApiStart,
  logApiSuccess 
} from '@/lib/api/utils'

// 1. 입력 검증 스키마 정의
const yourApiSchema = z.object({
  tenantId: z.string().uuid(),
  // 추가 필드들...
})

// 2. API 핸들러 구현
export async function POST(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      logApiStart('your-api-name')

      // 비즈니스 로직 구현
      
      logApiSuccess('your-api-name', result)
      return createSuccessResponse(result, 'Success message')
    },
    {
      requireAuth: true,
      requireSystemAdmin: false,  // 필요시 true
      requireTenantAdmin: false   // 필요시 true
    }
  )
}
```

### 권한 옵션

| 옵션 | 설명 | 사용 예시 |
|------|------|----------|
| `requireAuth: true` | 로그인 필수 | 모든 보호된 API |
| `requireSystemAdmin: true` | 시스템 관리자 권한 | 테넌트 생성/삭제 |
| `requireTenantAdmin: true` | 테넌트 관리자 권한 | 회원 승인/거부 |

---

## 👥 학생 관리 API

### 📋 1. 학생 목록 조회

**Endpoint:** `GET /api/students`

```typescript
// 요청 예시
const response = await fetch(`/api/students?tenantId=${tenantId}&status=active&limit=50&search=홍길동`)

// 응답 구조
interface GetStudentsResponse {
  success: boolean
  data: {
    students: Array<Student & { 
      classes?: { id: string, name: string }
      student_enrollments?: Array<Enrollment>
    }>
    pagination: {
      total: number
      limit: number  
      offset: number
      hasMore: boolean
    }
  }
}
```

**쿼리 파라미터:**
- `tenantId` (필수): 테넌트 ID
- `classId` (선택): 특정 클래스 학생만 조회
- `status` (선택): `active | inactive | graduated | all`
- `limit` (선택): 페이지 크기 (기본값: 100)
- `offset` (선택): 페이지 오프셋
- `search` (선택): 이름/학번/전화번호로 검색

### ➕ 2. 학생 생성

**Endpoint:** `POST /api/students`

```typescript
// 요청 예시
const response = await fetch('/api/students', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    tenantId: 'tenant-uuid',
    name: '홍길동',
    student_number: 'S2024001',
    phone: '010-1234-5678',
    email: 'student@example.com',
    parent_name: '홍아버지',
    parent_phone_1: '010-9876-5432',
    grade: '고3',
    school: '서울고등학교'
  })
})

// 응답 구조  
interface CreateStudentResponse {
  success: boolean
  data: { student: Student }
  message: string
}
```

### 🔄 3. 학생 대량 업데이트

**Endpoint:** `POST /api/students/bulk-update`

```typescript
// ClassFlow 드래그앤드롭 후 사용 예시
const response = await fetch('/api/students/bulk-update', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    tenantId: 'tenant-uuid',
    updates: [
      {
        studentId: 'student-1-uuid',
        updates: { 
          class_id: 'new-class-uuid',
          status: 'active'
        }
      },
      {
        studentId: 'student-2-uuid', 
        updates: {
          phone: '010-1111-2222',
          parent_phone_1: '010-3333-4444'
        }
      }
    ]
  })
})

// 응답에서 성공/실패 개별 확인 가능
const result = await response.json()
console.log(`${result.data.successful}/${result.data.total} 성공`)
result.data.errors.forEach(error => {
  console.error(`학생 ${error.studentId}: ${error.error}`)
})
```

---

## 🏫 클래스 관리 API

### 📋 1. 클래스 목록 조회

**Endpoint:** `GET /api/classes`

```typescript
// 기본 클래스 목록 (학생 수 포함)
const response = await fetch(`/api/classes?tenantId=${tenantId}`)

// 학생 정보까지 포함 (ClassFlow용)  
const responseWithStudents = await fetch(`/api/classes?tenantId=${tenantId}&includeStudents=true`)

// 필터링 예시
const filtered = await fetch(`/api/classes?tenantId=${tenantId}&grade=고3&course=수학&status=active`)
```

**쿼리 파라미터:**
- `tenantId` (필수): 테넌트 ID
- `includeStudents` (선택): 학생 정보 포함 여부
- `status` (선택): `active | inactive | all`  
- `grade` (선택): 학년별 필터링
- `course` (선택): 과목별 필터링

### ➕ 2. 클래스 생성

**Endpoint:** `POST /api/classes`

```typescript
const response = await fetch('/api/classes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    tenantId: 'tenant-uuid',
    name: '고3 수학 심화반',
    grade: '고3',
    course: '수학',
    instructor_id: 'instructor-uuid',
    max_students: 20,
    description: '수능 대비 심화 과정'
  })
})
```

### 🔄 3. 학생 클래스 이동 (ClassFlow 핵심)

**Endpoint:** `POST /api/classes/move-student`

```typescript
// ClassFlow 드래그앤드롭 이벤트 처리 예시
const handleStudentDrop = async (studentId: string, targetClassId: string | null) => {
  const response = await fetch('/api/classes/move-student', {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      tenantId: currentTenantId,
      studentId: studentId,
      targetClassId: targetClassId, // null이면 미배정
      moveReason: '클래스 재배정'
    })
  })
  
  if (response.ok) {
    const result = await response.json()
    toast.success(result.message)
    // UI 업데이트
    refreshClassData()
  }
}
```

---

## 🏢 테넌트 관리 API

### 🔄 1. 테넌트 상태 토글

**Endpoint:** `POST /api/system-admin/toggle-tenant-status`

```typescript
// 시스템 관리자 전용
const response = await fetch('/api/system-admin/toggle-tenant-status', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    tenantId: 'tenant-uuid',
    isActive: false // true로 활성화, false로 비활성화
  })
})
```

### ✅ 2. 회원 승인/거부

**Endpoint:** `POST /api/tenant-admin/approve-member`

```typescript
// 테넌트 관리자 권한 필요
const response = await fetch('/api/tenant-admin/approve-member', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    userId: 'user-uuid',
    action: 'approve', // 또는 'reject'
    tenantId: 'tenant-uuid'
  })
})
```

---

## ✅ API 개발 체크리스트

### 🔨 새 API 생성 시

1. **[ ]** `src/app/api/your-endpoint/route.ts` 파일 생성
2. **[ ]** `withApiHandler` 래퍼 사용
3. **[ ]** Zod 스키마로 입력 검증
4. **[ ]** 적절한 권한 옵션 설정
5. **[ ]** 로깅 (`logApiStart`, `logApiSuccess`) 추가
6. **[ ]** 에러 처리 (`throw new Error()`)
7. **[ ]** 테넌트 격리 검증 (`validateTenantAccess`)

### 🧪 테스트 체크리스트  

1. **[ ]** TypeScript 컴파일: `npx tsc --noEmit --strict`
2. **[ ]** 빌드 테스트: `npm run build`
3. **[ ]** 권한 테스트 (인증되지 않은 사용자)
4. **[ ]** 테넌트 격리 테스트 (다른 테넌트 접근)
5. **[ ]** 입력 검증 테스트 (잘못된 데이터)

### 📝 타입 정의 추가

1. **[ ]** `src/types/api.types.ts`에 요청/응답 타입 추가
2. **[ ]** `src/types/index.ts`에서 export 추가
3. **[ ]** 타입 가드 함수 작성 (필요시)

---

## 💡 예제 코드

### React 컴포넌트에서 API 사용

```typescript
// src/hooks/useStudents.ts
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GetStudentsResponse } from '@/types'

export function useStudents(tenantId: string) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()
  
  const fetchStudents = async (search?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      // 인증 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('인증이 필요합니다')
      }
      
      // API 호출
      const url = new URL('/api/students', window.location.origin)
      url.searchParams.set('tenantId', tenantId)
      if (search) url.searchParams.set('search', search)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '학생 목록 조회 실패')
      }
      
      const result: GetStudentsResponse = await response.json()
      setStudents(result.data.students)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    if (tenantId) {
      fetchStudents()
    }
  }, [tenantId])
  
  return {
    students,
    loading,
    error,
    refetch: fetchStudents
  }
}
```

### ClassFlow 드래그앤드롭 이벤트 처리

```typescript
// src/components/classflow/ClassFlowPanel.tsx
import { useDragAndDrop } from '@dnd-kit/core'
import { useStudents } from '@/hooks/useStudents'

export function ClassFlowPanel({ tenantId }: { tenantId: string }) {
  const { students, refetch } = useStudents(tenantId)
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return
    
    const studentId = active.id as string
    const targetClassId = over.id === 'unassigned' ? null : over.id as string
    
    try {
      // 학생 이동 API 호출
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/classes/move-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          tenantId,
          studentId,
          targetClassId,
          moveReason: '관리자가 클래스 이동'
        })
      })
      
      if (response.ok) {
        toast.success('학생이 성공적으로 이동되었습니다')
        refetch() // 학생 목록 새로고침
      } else {
        const error = await response.json()
        toast.error(error.error || '이동 실패')
      }
      
    } catch (error) {
      console.error('학생 이동 오류:', error)
      toast.error('학생 이동 중 오류가 발생했습니다')
    }
  }
  
  return (
    <DndContext onDragEnd={handleDragEnd}>
      {/* ClassFlow UI 구현 */}
    </DndContext>
  )
}
```

### 대량 업데이트 예시

```typescript
// 여러 학생을 한 번에 다른 클래스로 이동
const bulkMoveStudents = async (studentIds: string[], targetClassId: string) => {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  const response = await fetch('/api/students/bulk-update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      tenantId: currentTenantId,
      updates: studentIds.map(studentId => ({
        studentId,
        updates: { class_id: targetClassId }
      }))
    })
  })
  
  const result = await response.json()
  
  // 결과 처리
  if (result.data.successful > 0) {
    toast.success(`${result.data.successful}명의 학생이 이동되었습니다`)
  }
  
  if (result.data.failed > 0) {
    toast.warn(`${result.data.failed}명의 학생 이동에 실패했습니다`)
    // 실패한 학생들 개별 확인
    result.data.errors.forEach(error => {
      console.error(`학생 이동 실패: ${error.error}`)
    })
  }
}
```

---

## 🎯 API 사용 패턴

### 인증 헤더 설정

```typescript
// 모든 보호된 API 호출 시 필수
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${session.access_token}`
}
```

### 에러 처리 패턴

```typescript
try {
  const response = await fetch('/api/endpoint', { /* options */ })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'API 호출 실패')
  }
  
  const result = await response.json()
  // 성공 처리
  
} catch (error) {
  console.error('API 오류:', error)
  toast.error(error instanceof Error ? error.message : '알 수 없는 오류')
}
```

### 로딩 상태 관리

```typescript
const [isLoading, setIsLoading] = useState(false)

const handleApiCall = async () => {
  setIsLoading(true)
  try {
    // API 호출
  } catch (error) {
    // 에러 처리
  } finally {
    setIsLoading(false)
  }
}
```

---

## 🚀 다음 단계

1. **ClassFlow 개발**: 학생 이동 API를 활용한 드래그앤드롭 구현
2. **실시간 업데이트**: Supabase 실시간 구독으로 다중 사용자 동기화  
3. **고급 필터링**: 복잡한 검색 조건과 정렬 옵션 추가
4. **성능 최적화**: 대용량 데이터 처리를 위한 가상화 및 캐싱
5. **모니터링**: API 사용량 추적 및 성능 지표 수집

---

## 📚 관련 문서

- [TypeScript 타입 사전](./typescript-type-dictionary.md)
- [데이터베이스 스키마 가이드](./database_design.md)
- [개발 계획](./development_plan.md)
- [API 명세](./api_specification.md)

---

**🎉 이제 생성된 API 스켈레톤을 활용하여 안전하고 확장 가능한 ClassFlow와 학생 관리 기능을 구현할 수 있습니다!**