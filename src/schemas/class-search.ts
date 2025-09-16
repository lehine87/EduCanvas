import { z } from 'zod'

/**
 * 클래스 검색 파라미터 스키마 (업계 표준)
 */
export const ClassSearchSchema = z.object({
  // 페이지네이션 (Cursor-based)
  cursor: z.string().optional().describe('페이지네이션 커서'),
  limit: z.coerce.number().min(1).max(100).default(20).describe('페이지당 항목 수'),
  
  // 검색
  search: z.string().min(2).max(100).optional().describe('검색어 (클래스명, 설명)'),
  
  // 필터링
  status: z.enum(['active', 'inactive', 'all']).default('all').describe('클래스 상태'),
  grade: z.string().optional().describe('학년 필터'),
  course: z.string().optional().describe('과정 필터'),
  subject: z.string().optional().describe('과목 필터'),
  instructor_id: z.string().uuid().optional().describe('강사 ID 필터'),
  classroom_id: z.string().uuid().optional().describe('교실 ID 필터'),
  
  // 정렬
  sort_field: z.enum(['name', 'created_at', 'student_count', 'grade']).default('name').describe('정렬 필드'),
  sort_order: z.enum(['asc', 'desc']).default('asc').describe('정렬 순서'),
  
  // 관계 포함
  include_students: z.boolean().default(false).describe('학생 정보 포함 여부'),
  include_instructor: z.boolean().default(true).describe('강사 정보 포함 여부'),
  include_schedules: z.boolean().default(false).describe('스케줄 정보 포함 여부'),
  
  // 테넌트 (내부적으로 추가됨)
  tenant_id: z.string().uuid().optional().describe('테넌트 ID (내부)')
})

/**
 * 클래스 생성 스키마
 */
export const ClassCreateSchema = z.object({
  // 필수 필드
  name: z.string()
    .min(1, '클래스 이름은 필수입니다')
    .max(100, '클래스 이름은 100자 이하여야 합니다'),
  
  // 선택 필드
  description: z.string()
    .max(500, '설명은 500자 이하여야 합니다')
    .optional(),
  grade: z.string().optional(),
  course: z.string().optional(),
  subject: z.string().optional(),
  
  // 관계 필드
  instructor_id: z.string()
    .uuid('올바른 강사 ID를 선택해주세요')
    .optional()
    .or(z.literal('')),
  classroom_id: z.string()
    .uuid('올바른 교실 ID를 선택해주세요')
    .optional()
    .or(z.literal('')),
  
  // 용량 설정
  max_students: z.number()
    .int('정수를 입력해주세요')
    .min(1, '최소 1명 이상이어야 합니다')
    .max(1000, '최대 1000명까지 가능합니다')
    .optional(),
  min_students: z.number()
    .int('정수를 입력해주세요')
    .min(1, '최소 1명 이상이어야 합니다')
    .optional(),
  
  // 외관 설정
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, '올바른 색상 코드를 입력해주세요')
    .optional()
    .or(z.literal('')),
  
  // 기간 설정
  start_date: z.string()
    .optional()
    .or(z.literal('')),
  end_date: z.string()
    .optional()
    .or(z.literal('')),
  
  // 교재 설정
  main_textbook: z.string()
    .max(200, '주교재명은 200자 이하여야 합니다')
    .optional(),
  supplementary_textbook: z.string()
    .max(200, '부교재명은 200자 이하여야 합니다')
    .optional(),
  
  // 상태
  is_active: z.boolean().default(true),
  
  // 테넌트 (필수, API에서 추가)
  tenant_id: z.string().uuid('유효한 테넌트 ID가 아닙니다')
})
.refine((data) => {
  // 최소 학생 수가 최대 학생 수보다 작아야 함
  if (data.min_students && data.max_students) {
    return data.min_students <= data.max_students
  }
  return true
}, {
  message: '최소 학생 수는 최대 학생 수보다 작거나 같아야 합니다',
  path: ['min_students']
})
.refine((data) => {
  // 종료일이 시작일보다 늦어야 함
  if (data.start_date && data.end_date) {
    return new Date(data.start_date) <= new Date(data.end_date)
  }
  return true
}, {
  message: '종료일은 시작일보다 늦어야 합니다',
  path: ['end_date']
})

/**
 * 클래스 수정 스키마 (부분 업데이트)
 */
export const ClassUpdateSchema = ClassCreateSchema
  .omit({ tenant_id: true })
  .partial()
  .extend({
    id: z.string().uuid('유효하지 않은 클래스 ID입니다')
  })

/**
 * 클래스 삭제 스키마
 */
export const ClassDeleteSchema = z.object({
  id: z.string().uuid('유효하지 않은 클래스 ID입니다'),
  tenant_id: z.string().uuid('유효한 테넌트 ID가 아닙니다')
})

/**
 * 클래스 학생 이동 스키마
 */
export const ClassMoveStudentSchema = z.object({
  student_id: z.string().uuid('유효하지 않은 학생 ID입니다'),
  from_class_id: z.string().uuid('유효하지 않은 원본 클래스 ID입니다'),
  to_class_id: z.string().uuid('유효하지 않은 대상 클래스 ID입니다'),
  tenant_id: z.string().uuid('유효한 테넌트 ID가 아닙니다')
})

// 타입 추론
export type ClassSearchParams = z.infer<typeof ClassSearchSchema>
export type ClassCreateData = z.infer<typeof ClassCreateSchema>
export type ClassUpdateData = z.infer<typeof ClassUpdateSchema>
export type ClassDeleteData = z.infer<typeof ClassDeleteSchema>
export type ClassMoveStudentData = z.infer<typeof ClassMoveStudentSchema>

// API 요청용 타입 (tenant_id 제외)
export type ClassSearchRequest = Omit<ClassSearchParams, 'tenant_id'>
export type ClassCreateRequest = Omit<ClassCreateData, 'tenant_id'>
export type ClassDeleteRequest = Omit<ClassDeleteData, 'tenant_id'>
export type ClassMoveStudentRequest = Omit<ClassMoveStudentData, 'tenant_id'>