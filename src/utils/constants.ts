// src/utils/constants.ts
export const APP_CONFIG = {
  name: 'EduCanvas',
  version: '1.0.0',
  description: '그 누구도 경험해보지 못한 학원 관리 시스템',
} as const

export const ROLES = {
  ADMIN: {
    id: 'admin',
    name: '관리자',
    permissions: [
      { resource: 'students', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'classes', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'analytics', actions: ['read'] },
      { resource: 'settings', actions: ['read', 'update'] },
      { resource: 'users', actions: ['read', 'create', 'update', 'delete'] },
    ]
  },
  TEACHER: {
    id: 'teacher',
    name: '강사',
    permissions: [
      { resource: 'students', actions: ['read', 'update'] },
      { resource: 'classes', actions: ['read', 'update'] },
      { resource: 'analytics', actions: ['read'] },
    ]
  },
  STAFF: {
    id: 'staff',
    name: '직원',
    permissions: [
      { resource: 'students', actions: ['read', 'create', 'update'] },
      { resource: 'classes', actions: ['read'] },
    ]
  },
  VIEWER: {
    id: 'viewer',
    name: '조회자',
    permissions: [
      { resource: 'students', actions: ['read'] },
      { resource: 'classes', actions: ['read'] },
    ]
  }
} as const

export const GRADE_OPTIONS = [
  { value: '초1', label: '초등 1학년' },
  { value: '초2', label: '초등 2학년' },
  { value: '초3', label: '초등 3학년' },
  { value: '초4', label: '초등 4학년' },
  { value: '초5', label: '초등 5학년' },
  { value: '초6', label: '초등 6학년' },
  { value: '중1', label: '중학 1학년' },
  { value: '중2', label: '중학 2학년' },
  { value: '중3', label: '중학 3학년' },
  { value: '고1', label: '고등 1학년' },
  { value: '고2', label: '고등 2학년' },
  { value: '고3', label: '고등 3학년' },
  { value: '재수', label: '재수생' },
] as const

export const STATUS_OPTIONS = [
  { value: 'active', label: '수강중', color: 'bg-green-100 text-green-800' },
  { value: 'waiting', label: '대기중', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'inactive', label: '휴학', color: 'bg-gray-100 text-gray-800' },
  { value: 'graduated', label: '졸업', color: 'bg-blue-100 text-blue-800' },
] as const

export const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
] as const