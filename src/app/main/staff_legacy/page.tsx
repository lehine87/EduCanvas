'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, MoreVertical, Phone, Mail, Calendar } from 'lucide-react'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon as CheckCircleOutline,
  PencilIcon,
  EyeIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline'
import {
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  AcademicCapIcon,
  BriefcaseIcon
} from '@heroicons/react/24/solid'
import { useAuth } from '@/store/useAuthStore'
import { toast } from 'react-hot-toast'
import { CreateInstructorSheet } from '@/components/staff/CreateInstructorSheet'
import { InstructorDetailSheet } from '@/components/staff/InstructorDetailSheet'
import { StaffCard } from '@/components/staff/StaffCard'
import { StaffListItem } from '@/components/staff/StaffListItem'
import type { StaffMember, StaffStats } from '@/types/staff.types'


export default function StaffPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [stats, setStats] = useState<StaffStats | null>(null)
  const [filter, setFilter] = useState<'all' | 'instructor' | 'general'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [selectionMode, setSelectionMode] = useState(false)
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState<StaffMember | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'hire_date'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')
  
  // Sheet 상태
  const [createSheetOpen, setCreateSheetOpen] = useState(false)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [selectedStaffMember, setSelectedStaffMember] = useState<StaffMember | null>(null)

  useEffect(() => {
    fetchStaffMembers()
  }, [profile?.tenant_id])

  const fetchStaffMembers = async () => {
    if (!profile?.tenant_id) {
      console.log('tenant_id가 없어서 직원 목록 조회를 생략합니다.')
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams({
        tenantId: profile.tenant_id,
        status: 'all',
        job_function: 'all'  // 통계용으로 항상 전체 데이터 가져오기
      })

      const response = await fetch(`/api/tenant-admin/members?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '직원 목록을 불러오는데 실패했습니다.')
      }

      setStaffMembers(data.members)
      setStats(data.stats)
    } catch (error) {
      console.error('직원 목록 조회 오류:', error)
      toast.error('직원 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const filteredStaff = useMemo(() => {
    let result = staffMembers.filter(member => {
      // 검색 조건
      const matchesSearch = searchTerm === '' || 
        member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone?.includes(searchTerm)
      
      // 직능별 필터 조건
      const matchesJobFunction = filter === 'all' || member.job_function === filter
      
      return matchesSearch && matchesJobFunction
    })

    // 정렬
    result = [...result].sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'name':
          aValue = a.full_name || ''
          bValue = b.full_name || ''
          break
        case 'created_at':
          aValue = new Date(a.created_at || 0)
          bValue = new Date(b.created_at || 0)
          break
        case 'hire_date':
          aValue = a.hire_date ? new Date(a.hire_date) : new Date(0)
          bValue = b.hire_date ? new Date(b.hire_date) : new Date(0)
          break
        default:
          aValue = a.full_name || ''
          bValue = b.full_name || ''
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return result
  }, [staffMembers, searchTerm, filter, sortBy, sortOrder])

  const getJobFunctionBadge = (jobFunction: string) => {
    if (jobFunction === 'instructor') {
      return <Badge className="bg-blue-100 text-blue-800">강사</Badge>
    }
    return <Badge variant="secondary">행정직</Badge>
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">활동중</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">대기중</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">비활성</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // 핸들러들
  const handleStaffClick = useCallback((staff: StaffMember) => {
    if (!selectionMode) {
      setSelectedStaffMember(staff)
      setDetailSheetOpen(true)
    } else {
      handleStaffSelect(staff.id, !selectedStaff.includes(staff.id))
    }
  }, [selectionMode, selectedStaff])

  const handleStaffSelect = useCallback((staffId: string, checked: boolean) => {
    setSelectedStaff(prev => 
      checked 
        ? [...prev, staffId]
        : prev.filter(id => id !== staffId)
    )
  }, [])

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedStaff(checked ? filteredStaff.map(s => s.id) : [])
  }, [filteredStaff])

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => !prev)
    setSelectedStaff([])
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedStaff([])
  }, [])

  const handleBulkDelete = useCallback(async () => {
    if (selectedStaff.length === 0) return
    
    toast.success(`${selectedStaff.length}명의 직원을 비활성화합니다.`)
    clearSelection()
    // TODO: 실제 삭제 구현
  }, [selectedStaff, clearSelection])

  const handleDeleteStaff = useCallback((staff: StaffMember) => {
    setDeleteConfirmStaff(staff)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (deleteConfirmStaff) {
      toast.success(`${deleteConfirmStaff.full_name} 직원을 비활성화했습니다.`)
      setDeleteConfirmStaff(null)
      // TODO: 실제 삭제 구현
    }
  }, [deleteConfirmStaff])

  const handleRefresh = useCallback(() => {
    fetchStaffMembers()
  }, [])

  // Sheet 핸들러들
  const handleCreateSuccess = useCallback((newStaff: StaffMember) => {
    setStaffMembers(prev => [newStaff, ...prev])
    setStats(prev => prev ? {
      ...prev,
      total: prev.total + 1,
      active: prev.active + 1,
      [newStaff.job_function === 'instructor' ? 'instructors' : 'general']: 
        prev[newStaff.job_function === 'instructor' ? 'instructors' : 'general'] + 1
    } : null)
  }, [])

  const handleUpdateSuccess = useCallback((updatedStaff: StaffMember) => {
    setStaffMembers(prev => 
      prev.map(staff => staff.id === updatedStaff.id ? updatedStaff : staff)
    )
    setSelectedStaffMember(updatedStaff)
  }, [])

  const handleDeleteSuccess = useCallback((deletedStaff: StaffMember) => {
    setStaffMembers(prev => prev.filter(staff => staff.id !== deletedStaff.id))
    setStats(prev => prev ? {
      ...prev,
      total: prev.total - 1,
      active: prev.active - 1,
      [deletedStaff.job_function === 'instructor' ? 'instructors' : 'general']: 
        prev[deletedStaff.job_function === 'instructor' ? 'instructors' : 'general'] - 1
    } : null)
    setSelectedStaffMember(null)
  }, [])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 페이지 헤더 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">직원 관리</h1>
            <nav className="flex mt-1" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm text-gray-500">
                <li>
                  <a href="/main" className="hover:text-gray-700">홈</a>
                </li>
                <li>
                  <span className="mx-2">/</span>
                  <span className="text-gray-900">직원 관리</span>
                </li>
              </ol>
            </nav>
          </div>
          
          {/* 액션 버튼들 */}
          <div className="flex items-center space-x-3">
            {/* 일괄 작업 버튼 */}
            {selectedStaff.length > 0 && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-brand-50 rounded-lg border border-brand-200">
                <span className="text-sm font-medium text-brand-700">
                  {selectedStaff.length}명 선택됨
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-error-600 hover:text-error-700"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* 선택 모드 토글 */}
            <Button
              variant={selectionMode ? "default" : "outline"}
              size="sm"
              onClick={toggleSelectionMode}
              className="transition-all"
              title={selectionMode ? "상세보기 모드로 전환" : "선택 모드로 전환"}
            >
              <CheckCircleOutline className="w-4 h-4 mr-1" />
              {selectionMode ? "선택 모드" : "선택"}
            </Button>

            {/* 뷰 모드 토글 */}
            <div className="flex rounded-lg border border-gray-300 bg-white">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-r-none border-0"
                title="리스트"
              >
                <ListBulletIcon className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="rounded-l-none border-l border-gray-300"
                title="카드"
              >
                <Squares2X2Icon className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* 새 직원 등록 */}
            <Button onClick={() => setCreateSheetOpen(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              새 직원 등록
            </Button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* 통계 카드 */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                      <UserGroupIcon className="w-6 h-6 text-brand-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">전체 직원</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                      <CheckCircleIcon className="w-6 h-6 text-success-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">활동중</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <AcademicCapIcon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">강사</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.instructors}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BriefcaseIcon className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">행정직원</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.general}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 검색 및 필터 */}
          <Card>
            <CardContent>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                {/* 검색 */}
                <div className="flex-1 max-w-lg">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="이름, 이메일, 전화번호로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* 필터 버튼 */}
                <div className="flex items-center space-x-3">
                  {/* 직능 필터 */}
                  <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
                    <TabsList>
                      <TabsTrigger value="all">전체</TabsTrigger>
                      <TabsTrigger value="instructor">강사</TabsTrigger>
                      <TabsTrigger value="general">행정직</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* 정렬 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">정렬:</span>
                    <Select
                      value={`${sortBy}-${sortOrder}`}
                      onValueChange={(value: string) => {
                        const [sort, order] = value.split('-')
                        setSortBy(sort as 'name' | 'created_at' | 'hire_date')
                        setSortOrder(order as 'asc' | 'desc')
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name-asc">이름순</SelectItem>
                        <SelectItem value="name-desc">이름 역순</SelectItem>
                        <SelectItem value="hire_date-desc">최근 입사순</SelectItem>
                        <SelectItem value="hire_date-asc">오래된 입사순</SelectItem>
                        <SelectItem value="created_at-desc">최근 등록순</SelectItem>
                        <SelectItem value="created_at-asc">오래된 등록순</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      showFilters && 'bg-brand-50 border-brand-300 text-brand-700'
                    )}
                  >
                    <FunnelIcon className="w-4 h-4 mr-2" />
                    필터
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
                    새로고침
                  </Button>
                </div>
              </div>

              {/* 필터 옵션 */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        상태
                      </label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          <SelectItem value="active">활동중</SelectItem>
                          <SelectItem value="pending">대기중</SelectItem>
                          <SelectItem value="inactive">비활성</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        직급
                      </label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체 직급</SelectItem>
                          <SelectItem value="admin">관리자</SelectItem>
                          <SelectItem value="instructor">강사</SelectItem>
                          <SelectItem value="staff">직원</SelectItem>
                          <SelectItem value="viewer">열람자</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        추가 필터
                      </label>
                      <Button variant="outline" className="w-full">
                        상세 필터 설정
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 직원 목록 */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                등록된 직원이 없습니다
              </h3>
              <p className="text-gray-500 mb-6">
                첫 번째 직원을 등록해 관리를 시작해보세요
              </p>
              <Button onClick={() => setCreateSheetOpen(true)}>
                <PlusIcon className="w-4 h-4 mr-2" />
                새 직원 등록
              </Button>
            </div>
          ) : viewMode === 'list' ? (
            // 리스트 뷰
            <div className="space-y-2">
              {filteredStaff.map((staff) => (
                <StaffListItem
                  key={staff.id}
                  staff={staff}
                  onClick={() => handleStaffClick(staff)}
                  onSelect={selectionMode ? (staffId) => handleStaffSelect(staffId, !selectedStaff.includes(staffId)) : undefined}
                  isSelected={selectedStaff.includes(staff.id)}
                  showSelection={selectionMode}
                  showActions={!selectionMode}
                  onEdit={(staff) => {
                    setSelectedStaffMember(staff)
                    setDetailSheetOpen(true)
                  }}
                  onDelete={handleDeleteStaff}
                />
              ))}
            </div>
          ) : (
            // 카드 뷰 - 그리드 레이아웃
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStaff.map((staff) => (
                <StaffCard
                  key={staff.id}
                  staff={staff}
                  onClick={() => handleStaffClick(staff)}
                  onSelect={selectionMode ? (staffId, selected) => handleStaffSelect(staffId, selected) : undefined}
                  isSelected={selectedStaff.includes(staff.id)}
                  showSelection={selectionMode}
                  showActions={!selectionMode}
                  onView={(staff) => {
                    setSelectedStaffMember(staff)
                    setDetailSheetOpen(true)
                  }}
                  onEdit={(staff) => {
                    setSelectedStaffMember(staff)
                    setDetailSheetOpen(true)
                  }}
                  onDelete={handleDeleteStaff}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sheet 컴포넌트들 */}
      <CreateInstructorSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        onSuccess={handleCreateSuccess}
      />
      
      <InstructorDetailSheet
        instructor={selectedStaffMember}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onUpdate={handleUpdateSuccess}
        onDelete={handleDeleteSuccess}
      />

      {/* 삭제 확인 모달 */}
      {deleteConfirmStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-error-100 rounded-lg flex items-center justify-center">
                  <TrashIcon className="w-6 h-6 text-error-600" />
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  직원 비활성화
                </h3>
                <p className="text-sm text-gray-500">
                  이 작업은 되돌릴 수 있습니다
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-6">
              "{deleteConfirmStaff.full_name}" 직원을 비활성화하시겠습니까?
            </p>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmStaff(null)}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                비활성화
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}