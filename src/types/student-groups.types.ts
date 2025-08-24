// 학생 그룹 관리 관련 타입 정의

export type GroupType = 'grade' | 'school' | 'class' | 'custom'

export interface StudentGroup {
  id: string
  name: string
  description?: string
  type: GroupType
  color?: string
  parent_group_id?: string | null
  tenant_id: string
  student_count: number
  created_at: string
  updated_at: string
}

export interface StudentGroupMembership {
  id: string
  student_id: string
  group_id: string
  joined_at: string
  created_at: string
}

export interface GroupHierarchy extends StudentGroup {
  subgroups: GroupHierarchy[]
  students?: StudentWithGroups[]
}

export interface StudentWithGroups {
  id: string
  student_number: string
  name: string
  email?: string
  phone?: string
  status: string
  grade?: string
  school?: string
  groups: StudentGroup[]
  created_at: string
  updated_at: string
}

export interface CreateGroupRequest {
  name: string
  description?: string
  type: GroupType
  color?: string
  parent_group_id?: string
  tenant_id: string
}

export interface UpdateGroupRequest {
  name?: string
  description?: string
  color?: string
  parent_group_id?: string
}

export interface GroupFilter {
  type?: GroupType | 'all'
  parent_group_id?: string | null
  search?: string
}

export interface GroupStats {
  totalGroups: number
  totalStudents: number
  groupsByType: Record<GroupType, number>
  ungroupedStudents: number
}

// 미리 정의된 그룹 타입별 옵션
export const GROUP_TYPE_OPTIONS = {
  grade: {
    label: '학년별',
    icon: 'AcademicCapIcon',
    color: 'blue',
    description: '초등, 중등, 고등 학년별 분류'
  },
  school: {
    label: '학교별',
    icon: 'BuildingLibraryIcon',
    color: 'green',
    description: '출신 학교별 분류'
  },
  class: {
    label: '클래스별',
    icon: 'UserGroupIcon',
    color: 'purple',
    description: '수강 클래스별 분류'
  },
  custom: {
    label: '사용자 정의',
    icon: 'TagIcon',
    color: 'gray',
    description: '사용자가 직접 만든 그룹'
  }
} as const

// 그룹 색상 옵션
export const GROUP_COLORS = [
  { name: '파란색', value: 'blue', class: 'bg-blue-100 text-blue-800 border-blue-200' },
  { name: '초록색', value: 'green', class: 'bg-green-100 text-green-800 border-green-200' },
  { name: '보라색', value: 'purple', class: 'bg-purple-100 text-purple-800 border-purple-200' },
  { name: '빨간색', value: 'red', class: 'bg-red-100 text-red-800 border-red-200' },
  { name: '노란색', value: 'yellow', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { name: '회색', value: 'gray', class: 'bg-gray-100 text-gray-800 border-gray-200' },
  { name: '주황색', value: 'orange', class: 'bg-orange-100 text-orange-800 border-orange-200' },
  { name: '분홍색', value: 'pink', class: 'bg-pink-100 text-pink-800 border-pink-200' }
] as const