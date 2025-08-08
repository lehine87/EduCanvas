// src/types/auth.ts
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  academy_id: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface UserRole {
  id: string
  name: string
  permissions: Permission[]
}

export interface Permission {
  resource: 'students' | 'classes' | 'analytics' | 'settings' | 'users'
  actions: ('read' | 'create' | 'update' | 'delete')[]
}

export interface Academy {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
  settings: AcademySettings
}

export interface AcademySettings {
  theme: 'light' | 'dark'
  language: 'ko' | 'en'
  timezone: string
  currency: string
}