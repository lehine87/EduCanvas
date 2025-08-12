# T-024: 스키마 변경사항 애플리케이션 레이어 적용

**생성일**: 2025-08-11  
**상태**: TODO  
**우선순위**: P0 (MVP 필수)  
**담당**: Full Stack Developer  
**예상 소요**: 1.5일  
**기한**: 2025-08-14  
**스프린트**: S1

## 📋 작업 개요

Schema v4.1 업데이트(T-023)로 추가된 컬럼들을 애플리케이션 레이어에 반영하여 실제 사용 가능하도록 구현합니다.

## 🎯 작업 목표

**Primary Goals:**
- [ ] TypeScript 타입 정의를 v4.1 스키마에 맞춰 업데이트
- [ ] 학생 등록/수정 폼에서 복수 학부모 연락처 지원
- [ ] 클래스 생성/관리 폼에서 학년/과정 정보 입력 지원
- [ ] ClassFlow UI에서 학년 정보 표시

**Secondary Goals:**
- [ ] 기존 샘플 데이터 마이그레이션
- [ ] 검색/필터링 기능에 새 컬럼 반영
- [ ] 유효성 검증 로직 추가

## 📊 상세 작업 내용

### Phase 1: TypeScript 타입 업데이트 (0.3일)

#### 1.1 Supabase 타입 재생성
```bash
npx supabase gen types typescript --project-id hodkqpmukwfrreozwmcy > src/types/database.types.ts
```

#### 1.2 애플리케이션 타입 업데이트
```typescript
// src/types/Student.types.ts 업데이트
export interface Student {
  id: string
  tenant_id: string
  name: string
  phone?: string
  email?: string
  
  // v4.1 확장
  parent_name?: string
  parent_phone_1?: string  // 주 연락처
  parent_phone_2?: string  // 부 연락처
  
  grade?: string
  class_id?: string
  status: 'active' | 'inactive' | 'graduated' | 'withdrawn' | 'suspended'
  enrollment_date?: string
  graduation_date?: string
  position_in_class?: number
  display_color?: string
  memo?: string
  created_at: string
  updated_at: string
}

// src/types/Class.types.ts 업데이트
export interface Class {
  id: string
  tenant_id: string
  name: string
  subject?: string
  
  // v4.1 확장
  grade?: string      // 대상 학년
  course?: string     // 과정명
  
  max_students?: number
  min_students?: number
  level?: string
  description?: string
  instructor_id?: string
  classroom_id?: string
  color?: string
  is_active?: boolean
  start_date?: string
  end_date?: string
  schedule_config?: Record<string, any>
  custom_fields?: Record<string, any>
  created_by?: string
  created_at: string
  updated_at: string
}
```

### Phase 2: 학생 관리 폼 업데이트 (0.5일)

#### 2.1 학생 등록/수정 폼 컴포넌트 수정
`src/components/students/StudentForm.tsx`:

```typescript
// 학부모 연락처 섹션 추가
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium text-gray-700">
      학부모 성명
    </label>
    <input
      type="text"
      name="parent_name"
      value={formData.parent_name || ''}
      onChange={handleInputChange}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
      placeholder="학부모 성명"
    />
  </div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium text-gray-700">
      연락처 1 (주) *
    </label>
    <input
      type="tel"
      name="parent_phone_1"
      value={formData.parent_phone_1 || ''}
      onChange={handleInputChange}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
      placeholder="010-1234-5678"
      required
    />
  </div>
  
  <div>
    <label className="block text-sm font-medium text-gray-700">
      연락처 2 (부)
    </label>
    <input
      type="tel"
      name="parent_phone_2"
      value={formData.parent_phone_2 || ''}
      onChange={handleInputChange}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
      placeholder="010-1234-5678"
    />
  </div>
</div>

<div>
  <label className="block text-sm font-medium text-gray-700">
    학생 이메일
  </label>
  <input
    type="email"
    name="email"
    value={formData.email || ''}
    onChange={handleInputChange}
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
    placeholder="student@example.com"
  />
</div>
```

#### 2.2 폼 검증 로직 업데이트
```typescript
// Zod 스키마 업데이트
const studentSchema = z.object({
  name: z.string().min(1, '학생 이름을 입력해주세요'),
  phone: z.string().optional(),
  email: z.string().email('유효한 이메일 형식이 아닙니다').optional().or(z.literal('')),
  
  // v4.1 확장
  parent_name: z.string().optional(),
  parent_phone_1: z.string().min(10, '연락처 1을 입력해주세요').optional(),
  parent_phone_2: z.string().optional(),
  
  grade: z.string().optional(),
  // ... 기타 필드들
}).refine(
  (data) => data.parent_phone_1 || data.parent_phone_2,
  {
    message: "적어도 하나의 학부모 연락처를 입력해주세요",
    path: ["parent_phone_1"],
  }
)
```

### Phase 3: 클래스 관리 폼 업데이트 (0.4일)

#### 3.1 클래스 생성/수정 폼 컴포넌트 수정
`src/components/classes/ClassForm.tsx`:

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium text-gray-700">
      대상 학년
    </label>
    <select
      name="grade"
      value={formData.grade || ''}
      onChange={handleInputChange}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
    >
      <option value="">학년 선택</option>
      <option value="초1">초등 1학년</option>
      <option value="초2">초등 2학년</option>
      <option value="초3">초등 3학년</option>
      <option value="초4">초등 4학년</option>
      <option value="초5">초등 5학년</option>
      <option value="초6">초등 6학년</option>
      <option value="중1">중학 1학년</option>
      <option value="중2">중학 2학년</option>
      <option value="중3">중학 3학년</option>
      <option value="고1">고등 1학년</option>
      <option value="고2">고등 2학년</option>
      <option value="고3">고등 3학년</option>
      <option value="전체">전체 학년</option>
      <option value="기타">기타</option>
    </select>
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700">
      과정명
    </label>
    <input
      type="text"
      name="course"
      value={formData.course || ''}
      onChange={handleInputChange}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
      placeholder="기초반, 심화반, 특별반 등"
    />
  </div>
</div>
```

### Phase 4: ClassFlow UI 업데이트 (0.3일)

#### 4.1 ClassFlow에서 학년 정보 표시
`src/components/classes/ClassFlowPanel.tsx`:

```typescript
// 클래스 카드에 학년 정보 추가
<div className="class-card">
  <div className="class-header">
    <h3 className="class-name">{className}</h3>
    {classData.grade && (
      <span className="grade-badge">
        {classData.grade}
      </span>
    )}
  </div>
  
  <div className="class-info">
    {classData.course && (
      <p className="course-name">{classData.course}</p>
    )}
    <p className="student-count">
      {currentStudents}/{maxStudents}명
    </p>
  </div>
</div>
```

#### 4.2 학년별 그룹핑 기능 추가
```typescript
// 학년별 클래스 그룹핑 로직
const groupClassesByGrade = (classes: Class[]) => {
  return classes.reduce((groups, cls) => {
    const grade = cls.grade || '기타'
    if (!groups[grade]) {
      groups[grade] = []
    }
    groups[grade].push(cls)
    return groups
  }, {} as Record<string, Class[]>)
}
```

## ✅ 완료 기준 (Definition of Done)

### 필수 조건
- [ ] TypeScript 컴파일 에러 없음
- [ ] 학생 등록 시 복수 학부모 연락처 입력 가능
- [ ] 클래스 생성 시 학년/과정 정보 입력 가능
- [ ] 기존 샘플 데이터 정상 표시
- [ ] ClassFlow에서 학년 정보 표시

### 품질 조건
- [ ] 폼 유효성 검증 통과
- [ ] 반응형 UI 정상 작동
- [ ] 접근성 가이드라인 준수
- [ ] ESLint, Prettier 통과

### 테스트 조건
- [ ] 학생 CRUD 테스트 통과
- [ ] 클래스 CRUD 테스트 통과
- [ ] 브라우저 호환성 테스트
- [ ] 모바일 반응형 테스트

## 🔗 연관 작업

**Dependencies:**
- [x] T-023: Schema v4.1 업데이트 (완료)
- [x] T-004: TypeScript 타입 자동 생성 설정 (완료)

**Related:**
- T-007: Supabase Auth 인증 시스템 구현
- T-015: 학생 관리 CRUD 구현
- T-018: ClassFlow 드래그앤드롭 구현

**Impacts:**
- TypeScript 타입 변경으로 인한 전체 애플리케이션 영향
- 기존 컴포넌트들의 props 인터페이스 업데이트 필요

## 📝 구현 노트

### 주의사항
1. **하위 호환성**: 기존 데이터가 NULL인 경우 처리 로직 필요
2. **성능**: 새로운 컬럼에 대한 인덱스 활용
3. **UX**: 복수 연락처 입력 시 사용자 경험 고려
4. **검증**: 전화번호 형식 및 이메일 형식 검증 강화

### 기술적 고려사항
1. **Form State 관리**: React Hook Form의 useFieldArray 활용 검토
2. **실시간 검증**: debounce를 활용한 실시간 유효성 검사
3. **Error Handling**: 스키마 변경으로 인한 예외 상황 처리
4. **Migration**: 기존 데이터 점진적 업데이트 방안

## 🚀 배포 계획

### Stage 1: 개발 환경
- [ ] 로컬 개발 환경에서 테스트
- [ ] Storybook 컴포넌트 업데이트

### Stage 2: 스테이징 환경
- [ ] 실제 데이터로 테스트
- [ ] 성능 및 UX 검증

### Stage 3: 프로덕션 배포
- [ ] 점진적 배포 (Blue-Green)
- [ ] 모니터링 및 롤백 준비