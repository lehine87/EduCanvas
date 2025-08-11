// Application-level TypeScript types for EduCanvas
// Built on top of Supabase generated types
import { Database } from './supabase'

// ================================================================
// Type Aliases for Convenience
// ================================================================
export type Tables = Database['public']['Tables']
export type Views = Database['public']['Views'] 
export type Enums = Database['public']['Enums']
export type Functions = Database['public']['Functions']

// Core Entity Types
export type Tenant = Tables['tenants']['Row']
export type TenantInsert = Tables['tenants']['Insert']
export type TenantUpdate = Tables['tenants']['Update']

export type TenantUser = Tables['tenant_users']['Row']
export type TenantUserInsert = Tables['tenant_users']['Insert']
export type TenantUserUpdate = Tables['tenant_users']['Update']

export type TenantRole = Tables['tenant_roles']['Row']
export type Permission = Tables['permissions']['Row']

export type Instructor = Tables['instructors']['Row']
export type InstructorInsert = Tables['instructors']['Insert']
export type InstructorUpdate = Tables['instructors']['Update']

export type Class = Tables['classes']['Row']
export type ClassInsert = Tables['classes']['Insert']
export type ClassUpdate = Tables['classes']['Update']

export type Student = Tables['students']['Row']
export type StudentInsert = Tables['students']['Insert']
export type StudentUpdate = Tables['students']['Update']

export type CoursePackage = Tables['course_packages']['Row']
export type CoursePackageInsert = Tables['course_packages']['Insert']
export type CoursePackageUpdate = Tables['course_packages']['Update']

// Video System Types (v4.1)
export type YouTubeVideo = Tables['youtube_videos']['Row']
export type YouTubeVideoInsert = Tables['youtube_videos']['Insert']
export type YouTubeVideoUpdate = Tables['youtube_videos']['Update']

export type VideoProgress = Tables['student_video_progress']['Row']
export type VideoProgressInsert = Tables['student_video_progress']['Insert']
export type VideoProgressUpdate = Tables['student_video_progress']['Update']

export type VideoAssignment = Tables['video_assignments']['Row']
export type VideoAssignmentInsert = Tables['video_assignments']['Insert']
export type VideoAssignmentUpdate = Tables['video_assignments']['Update']

// Audit Types
export type AuditLog = Tables['audit_logs']['Row']

// View Types
export type StudentEnrollmentStats = Views['student_enrollment_stats']['Row']
export type VideoLearningAnalytics = Views['video_learning_analytics']['Row']
export type ClassPerformanceAnalytics = Views['class_performance_analytics']['Row']

// ================================================================
// ClassFlow Drag-and-Drop Types
// ================================================================
export interface ClassFlowStudent extends Student {
  position?: { x: number; y: number }
  isDragging?: boolean
  isSelected?: boolean
  isHighlighted?: boolean
  dragIndex?: number
  originalClass?: string
}

export interface ClassFlowClass extends Class {
  students: ClassFlowStudent[]
  isDropZone?: boolean
  isHighlighted?: boolean
  dragOverCount?: number
  position?: { x: number; y: number; width: number; height: number }
}

export interface DragOperation {
  type: 'move' | 'copy' | 'swap'
  studentId: string
  sourceClassId: string | null
  targetClassId: string | null
  sourcePosition: number
  targetPosition: number
  timestamp: number
}

export interface ClassFlowState {
  classes: ClassFlowClass[]
  selectedStudentIds: string[]
  draggedStudentId: string | null
  currentOperation: DragOperation | null
  isDragging: boolean
  isLoading: boolean
  error: string | null
  lastSyncTime: number
}

// ================================================================
// Video Learning Types
// ================================================================
export interface VideoWatchSession {
  id: string
  startTime: number
  endTime: number
  watchedDuration: number
  pauseCount: number
  seekCount: number
  quality: string
  speed: number
  fullScreen: boolean
  timestamp: string
  deviceInfo: {
    type: string
    browser: string
    os: string
  }
}

export interface VideoLearningStats {
  videoId: string
  studentId: string
  totalWatchTime: number
  completionRate: number
  averageSessionLength: number
  totalSessions: number
  lastWatchedAt: string
  engagementScore: number
  qualityPreference: string[]
  commonPausePoints: number[]
  strugglingSegments: number[]
}

export interface VideoEngagementMetrics {
  videoId: string
  viewCount: number
  uniqueViewers: number
  averageWatchTime: number
  completionRate: number
  dropOffPoints: Array<{
    timeStamp: number
    percentage: number
    studentCount: number
  }>
  popularSegments: Array<{
    startTime: number
    endTime: number
    rewatchCount: number
  }>
  qualityDistribution: Record<string, number>
  deviceDistribution: Record<string, number>
}

// ================================================================
// Permission and Role System Types
// ================================================================
export type UserRole = 'owner' | 'admin' | 'instructor' | 'staff' | 'viewer'
export type PermissionAction = 'read' | 'write' | 'delete' | 'admin' | 'export'
export type PermissionResource = 'students' | 'classes' | 'payments' | 'reports' | 'settings' | 'videos' | 'analytics'

export interface RolePermissions {
  students: PermissionAction[]
  classes: PermissionAction[]
  payments: PermissionAction[]
  reports: PermissionAction[]
  settings: PermissionAction[]
  videos: PermissionAction[]
  analytics: PermissionAction[]
}

export interface PermissionCheck {
  resource: PermissionResource
  action: PermissionAction
  context?: {
    studentId?: string
    classId?: string
    instructorId?: string
    tenantId: string
  }
}

export interface SecurityContext {
  userId: string
  tenantId: string
  roleId: string
  permissions: RolePermissions
  sessionId: string
  ipAddress: string
  userAgent: string
  lastActivity: string
  mfaVerified: boolean
}

// ================================================================
// API Response Types
// ================================================================
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  success: boolean
  timestamp?: string
  requestId?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
  totalPages: number
}

export interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: string
  path: string
  method: string
}

// ================================================================
// Form Data Types
// ================================================================
export interface StudentFormData extends Omit<StudentInsert, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> {
  // Additional form-specific fields
  confirmParentPhone?: string
  emergencyContact?: {
    name: string
    relationship: string
    phone: string
  }
}

export interface ClassFormData extends Omit<ClassInsert, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> {
  selectedStudentIds?: string[]
}

export interface VideoProgressFormData {
  studentId: string
  videoId: string
  watchedDuration: number
  totalDuration: number
  notes?: string
  sessionData: VideoWatchSession
}

export interface VideoAssignmentFormData extends Omit<VideoAssignmentInsert, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> {
  selectedStudentIds?: string[]
  selectedClassIds?: string[]
}

// ================================================================
// UI State Types
// ================================================================
export interface TableColumn<T = any> {
  key: keyof T | string
  label: string
  sortable?: boolean
  filterable?: boolean
  width?: number
  render?: (value: any, row: T) => React.ReactNode
  className?: string
}

export interface TableState<T = any> {
  data: T[]
  loading: boolean
  error: string | null
  sortBy: string | null
  sortOrder: 'asc' | 'desc'
  filters: Record<string, any>
  pagination: {
    page: number
    limit: number
    total: number
  }
  selectedRows: Set<string>
}

export interface ModalState {
  isOpen: boolean
  type: string | null
  data: any
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeable?: boolean
}

export interface NotificationState {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  actions?: Array<{
    label: string
    handler: () => void
  }>
}

// ================================================================
// Analytics and Reporting Types
// ================================================================
export interface AnalyticsTimeRange {
  start: string
  end: string
  granularity: 'hour' | 'day' | 'week' | 'month'
}

export interface TenantAnalytics {
  tenantId: string
  timeRange: AnalyticsTimeRange
  metrics: {
    totalStudents: number
    activeStudents: number
    totalClasses: number
    activeClasses: number
    totalVideos: number
    totalWatchHours: number
    averageEngagement: number
    completionRate: number
  }
  trends: {
    studentGrowth: Array<{ date: string; count: number }>
    videoConsumption: Array<{ date: string; hours: number }>
    engagement: Array<{ date: string; score: number }>
  }
  topPerformers: {
    students: Array<{ studentId: string; name: string; score: number }>
    videos: Array<{ videoId: string; title: string; engagementScore: number }>
    classes: Array<{ classId: string; name: string; averageCompletion: number }>
  }
}

export interface ReportConfiguration {
  type: 'student_progress' | 'class_analytics' | 'video_engagement' | 'financial' | 'attendance'
  parameters: {
    timeRange: AnalyticsTimeRange
    includeInactive: boolean
    groupBy: string[]
    metrics: string[]
    filters: Record<string, any>
  }
  format: 'pdf' | 'excel' | 'csv'
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    time: string
    recipients: string[]
  }
}

// ================================================================
// Integration Types
// ================================================================
export interface YouTubeApiResponse {
  kind: string
  etag: string
  items: any[]
  nextPageToken?: string
  prevPageToken?: string
  pageInfo: {
    totalResults: number
    resultsPerPage: number
  }
}

export interface YouTubeVideoData {
  id: string
  title: string
  description: string
  duration: string
  thumbnails: {
    default: { url: string; width: number; height: number }
    medium: { url: string; width: number; height: number }
    high: { url: string; width: number; height: number }
    standard?: { url: string; width: number; height: number }
    maxres?: { url: string; width: number; height: number }
  }
  channelId: string
  channelTitle: string
  publishedAt: string
  tags: string[]
  categoryId: string
  statistics: {
    viewCount: string
    likeCount: string
    dislikeCount: string
    favoriteCount: string
    commentCount: string
  }
}

// ================================================================
// Utility Types
// ================================================================
export type WithTenant<T> = T & { tenant_id: string }
export type WithTimestamps<T> = T & { 
  created_at: string
  updated_at: string 
}
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Type Guards
export type TypeGuard<T> = (value: any) => value is T

// Event Types
export interface AppEvent<T = any> {
  type: string
  payload: T
  timestamp: number
  source: string
}

export interface SystemEvent extends AppEvent {
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'security' | 'performance' | 'user' | 'system'
}

export interface UserEvent extends AppEvent {
  userId: string
  tenantId: string
  sessionId: string
}

// ================================================================
// Feature Flag Types
// ================================================================
export interface FeatureFlag {
  key: string
  enabled: boolean
  rolloutPercentage: number
  conditions?: {
    tenantTier?: string[]
    userRoles?: string[]
    minVersion?: string
  }
}

export interface FeatureFlagContext {
  userId: string
  tenantId: string
  tenantTier: string
  userRole: string
  version: string
}

// ================================================================
// Export all types
// ================================================================
export * from './supabase'