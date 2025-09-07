import { z } from 'zod'

/**
 * 학생 검색 API Query Parameter Schema
 * 업계 표준 방식: Cursor-based pagination + Query parameter filtering
 */
export const StudentSearchSchema = z.object({
  // Cursor-based pagination (업계 표준 - offset보다 성능 우수)
  cursor: z.string().optional().describe('페이지네이션 커서'),
  limit: z.coerce.number().min(1).max(100).default(20).describe('페이지 크기'),
  
  // Full-text search (PostgreSQL 기반)
  search: z.string().min(2).max(100).optional().describe('통합 검색 (이름, 연락처)'),
  
  // 필터링 (Query Parameter 방식)
  grade: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => Array.isArray(val) ? val : [val])
    .optional()
    .describe('학년 필터'),
  
  class_id: z
    .union([z.string().uuid(), z.array(z.string().uuid())])
    .transform((val) => Array.isArray(val) ? val : [val])
    .optional()
    .describe('반 ID 필터'),
    
  status: z
    .union([
      z.enum(['active', 'waiting', 'inactive', 'graduated']),
      z.array(z.enum(['active', 'waiting', 'inactive', 'graduated']))
    ])
    .transform((val) => Array.isArray(val) ? val : [val])
    .optional()
    .describe('상태 필터'),
  
  // 정렬 (기본값 강제 - 업계 표준)
  sort_field: z
    .enum(['name', 'enrollment_date', 'class_name', 'attendance_rate', 'last_payment_date'])
    .default('name')
    .describe('정렬 기준'),
    
  sort_order: z
    .enum(['asc', 'desc'])
    .default('asc')
    .describe('정렬 순서'),
  
  // 날짜 범위 필터
  enrollment_date_from: z
    .string()
    .datetime()
    .optional()
    .describe('등록일 시작'),
    
  enrollment_date_to: z
    .string()
    .datetime()
    .optional()
    .describe('등록일 끝'),
  
  // 고급 필터
  has_overdue_payment: z
    .union([z.string(), z.boolean()])
    .transform((val) => {
      if (typeof val === 'string') {
        return val === 'true'
      }
      return val
    })
    .optional()
    .describe('미납 여부'),
    
  attendance_rate_min: z
    .coerce.number()
    .min(0)
    .max(100)
    .optional()
    .describe('최소 출석률'),
    
  attendance_rate_max: z
    .coerce.number()
    .min(0)
    .max(100)
    .optional()
    .describe('최대 출석률'),
  
  // 포함할 데이터 (성능 최적화)
  include_enrollment: z
    .union([z.string(), z.boolean()])
    .transform((val) => {
      if (typeof val === 'string') {
        return val === 'true'
      }
      return val
    })
    .default(true)
    .describe('수강권 정보 포함'),
    
  include_attendance_stats: z
    .union([z.string(), z.boolean()])
    .transform((val) => {
      if (typeof val === 'string') {
        return val === 'true'
      }
      return val
    })
    .default(false)
    .describe('출석 통계 포함'),
})

export type StudentSearchParams = z.infer<typeof StudentSearchSchema>

/**
 * 자동완성 검색 Schema
 */
export const StudentAutocompleteSchema = z.object({
  query: z.string().min(1).max(50).describe('검색어'),
  limit: z.coerce.number().min(1).max(20).default(10).describe('결과 수'),
  include_parent: z
    .union([z.string(), z.boolean()])
    .transform((val) => {
      if (typeof val === 'string') {
        return val === 'true'
      }
      return val
    })
    .default(false)
    .describe('학부모 정보 포함'),
})

export type StudentAutocompleteParams = z.infer<typeof StudentAutocompleteSchema>

/**
 * 일괄 처리 Schema
 */
export const StudentBatchActionSchema = z.object({
  action: z.enum([
    'update_status',
    'move_class', 
    'send_notification',
    'export_data'
  ]).describe('일괄 처리 액션'),
  
  student_ids: z
    .array(z.string().uuid())
    .min(1)
    .max(100)
    .describe('대상 학생 ID 목록'),
    
  data: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('액션별 추가 데이터'),
})

export type StudentBatchActionParams = z.infer<typeof StudentBatchActionSchema>