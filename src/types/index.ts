// src/types/index.ts
export * from './auth'
export * from './student'
export * from './class'
export * from './database'

// 공통 타입
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginationResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export type Status = 'active' | 'inactive' | 'waiting' | 'graduated'