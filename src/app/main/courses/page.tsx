'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon as CheckCircleOutline,
  ListBulletIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline'
import {
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  StarIcon
} from '@heroicons/react/24/solid'
import { useAuth } from '@/store/useAuthStore'
import { toast } from 'react-hot-toast'
import { CoursePackageCard } from '@/components/courses/CoursePackageCard'
import { CoursePackageListItem } from '@/components/courses/CoursePackageListItem'
import { CreateCoursePackageSheet } from '@/components/courses/CreateCoursePackageSheet'
import { CoursePackageDetailSheet } from '@/components/courses/CoursePackageDetailSheet'
import type { 
  CoursePackageWithRelations, 
  CoursePackageStats,
  BillingType
} from '@/types/course.types'

export default function CoursesPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<CoursePackageWithRelations[]>([])
  const [stats, setStats] = useState<CoursePackageStats | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [billingTypeFilter, setBillingTypeFilter] = useState<'all' | BillingType>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [selectionMode, setSelectionMode] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'price'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  // Sheet 상태
  const [createSheetOpen, setCreateSheetOpen] = useState(false)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<CoursePackageWithRelations | null>(null)

  const fetchCourses = useCallback(async () => {
    if (!profile?.tenant_id) return

    try {
      setLoading(true)
      const params = new URLSearchParams({
        tenantId: profile.tenant_id,
        status: 'all',
        sortBy: sortBy,
        sortOrder: sortOrder
      })

      // 검색어가 있으면 추가
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      // 필터가 있으면 추가
      if (billingTypeFilter !== 'all') {
        params.append('billingType', billingTypeFilter)
      }

      console.log('🔍 과정 목록 조회 요청:', params.toString())

      const response = await fetch(`/api/course-packages?${params}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || '과정 목록을 불러오는데 실패했습니다.')
      }

      console.log('✅ 과정 목록 조회 성공:', { 
        count: data.data?.length || 0,
        total: data.total || 0 
      })

      setCourses(data.data || [])
      setStats(data.stats)
    } catch (error) {
      console.error('❌ 과정 목록 조회 오류:', error)
      toast.error('과정 목록을 불러오는데 실패했습니다.')
      setCourses([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [profile?.tenant_id, searchTerm, billingTypeFilter, sortBy, sortOrder])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  // 서버에서 이미 필터링과 정렬이 완료되므로 그대로 사용
  const filteredCourses = useMemo(() => {
    // 클라이언트 사이드 활성/비활성 필터만 적용 (서버 필터와 별개)
    if (filter === 'all') return courses
    
    return courses.filter(course => {
      return filter === 'active' ? course.is_active : !course.is_active
    })
  }, [courses, filter])

  // 핸들러들
  const handleCourseClick = useCallback((course: CoursePackageWithRelations) => {
    if (!selectionMode) {
      setSelectedCourse(course)
      setDetailSheetOpen(true)
    } else {
      handleCourseSelect(course.id, !selectedCourses.includes(course.id))
    }
  }, [selectionMode, selectedCourses])

  const handleCourseSelect = useCallback((courseId: string, checked: boolean) => {
    setSelectedCourses(prev => 
      checked 
        ? [...prev, courseId]
        : prev.filter(id => id !== courseId)
    )
  }, [])

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedCourses(checked ? filteredCourses.map(c => c.id) : [])
  }, [filteredCourses])

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => !prev)
    setSelectedCourses([])
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedCourses([])
  }, [])

  const handleBulkDelete = useCallback(async () => {
    if (selectedCourses.length === 0) return
    
    toast.success(`${selectedCourses.length}개의 과정을 비활성화합니다.`)
    clearSelection()
    // TODO: 실제 삭제 구현
  }, [selectedCourses, clearSelection])

  const handleCreateCourse = useCallback(() => {
    setCreateSheetOpen(true)
  }, [])

  const handleRefresh = useCallback(() => {
    fetchCourses()
  }, [])

  const handleCourseCreateSuccess = useCallback((newCourse: CoursePackageWithRelations) => {
    toast.success('새 과정이 등록되었습니다.')
    fetchCourses() // 목록 새로고침
  }, [])

  const handleCourseUpdateSuccess = useCallback((updatedCourse: CoursePackageWithRelations) => {
    toast.success('과정이 수정되었습니다.')
    fetchCourses() // 목록 새로고침
  }, [])

  const handleCourseDeleteSuccess = useCallback((deletedCourse: CoursePackageWithRelations) => {
    toast.success('과정이 삭제되었습니다.')
    fetchCourses() // 목록 새로고침
  }, [])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 페이지 헤더 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">과정 관리</h1>
            <nav className="flex mt-1" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm text-gray-500">
                <li>
                  <a href="/main" className="hover:text-gray-700">홈</a>
                </li>
                <li>
                  <span className="mx-2">/</span>
                  <span className="text-gray-900">과정 관리</span>
                </li>
              </ol>
            </nav>
          </div>
          
          {/* 액션 버튼들 */}
          <div className="flex items-center space-x-3">
            {/* 일괄 작업 버튼 */}
            {selectedCourses.length > 0 && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-brand-50 rounded-lg border border-brand-200">
                <span className="text-sm font-medium text-brand-700">
                  {selectedCourses.length}개 선택됨
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

            {/* 새 과정 등록 */}
            <Button onClick={handleCreateCourse}>
              <PlusIcon className="w-4 h-4 mr-2" />
              새 과정 등록
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
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <TagIcon className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">전체 과정</p>
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
                    <p className="text-sm font-medium text-gray-500">활성 과정</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <UserGroupIcon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">총 수강생</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_enrollments}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <StarIcon className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">추천 과정</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.featured}</p>
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
                      placeholder="과정명, 설명으로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* 필터 버튼 */}
                <div className="flex items-center space-x-3">
                  {/* 상태 필터 */}
                  <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
                    <TabsList>
                      <TabsTrigger value="all">전체</TabsTrigger>
                      <TabsTrigger value="active">활성</TabsTrigger>
                      <TabsTrigger value="inactive">비활성</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* 정렬 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">정렬:</span>
                    <Select
                      value={`${sortBy}-${sortOrder}`}
                      onValueChange={(value: string) => {
                        const [sort, order] = value.split('-')
                        setSortBy(sort as 'name' | 'created_at' | 'price')
                        setSortOrder(order as 'asc' | 'desc')
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name-asc">이름순</SelectItem>
                        <SelectItem value="name-desc">이름 역순</SelectItem>
                        <SelectItem value="price-asc">가격 낮은순</SelectItem>
                        <SelectItem value="price-desc">가격 높은순</SelectItem>
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

              {/* 고급 필터 */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        결제 타입
                      </label>
                      <Select 
                        value={billingTypeFilter} 
                        onValueChange={(value) => setBillingTypeFilter(value as typeof billingTypeFilter)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          <SelectItem value="monthly">월별 결제</SelectItem>
                          <SelectItem value="sessions">세션별 결제</SelectItem>
                          <SelectItem value="hours">시간별 결제</SelectItem>
                          <SelectItem value="package">패키지 결제</SelectItem>
                          <SelectItem value="drop_in">일회 참여</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 과정 목록 */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <TagIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                등록된 과정이 없습니다
              </h3>
              <p className="text-gray-500 mb-6">
                첫 번째 과정을 등록해 관리를 시작해보세요
              </p>
              <Button onClick={handleCreateCourse}>
                <PlusIcon className="w-4 h-4 mr-2" />
                새 과정 등록
              </Button>
            </div>
          ) : viewMode === 'list' ? (
            // 리스트 뷰
            <div className="space-y-2">
              {filteredCourses.map((course) => (
                <CoursePackageListItem
                  key={course.id}
                  coursePackage={course}
                  onClick={() => handleCourseClick(course)}
                  onSelect={selectionMode ? (courseId) => handleCourseSelect(courseId, !selectedCourses.includes(courseId)) : undefined}
                  isSelected={selectedCourses.includes(course.id)}
                  showSelection={selectionMode}
                  showActions={!selectionMode}
                  onEdit={(course) => {
                    setSelectedCourse(course)
                    setDetailSheetOpen(true)
                  }}
                  onDelete={(course) => {
                    toast.success(`${course.name} 과정을 비활성화했습니다.`)
                  }}
                />
              ))}
            </div>
          ) : (
            // 카드 뷰 - 그리드 레이아웃
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCourses.map((course) => (
                <CoursePackageCard
                  key={course.id}
                  coursePackage={course}
                  onClick={() => handleCourseClick(course)}
                  onSelect={selectionMode ? (courseId, selected) => handleCourseSelect(courseId, selected) : undefined}
                  isSelected={selectedCourses.includes(course.id)}
                  showSelection={selectionMode}
                  showActions={!selectionMode}
                  onView={(course) => {
                    setSelectedCourse(course)
                    setDetailSheetOpen(true)
                  }}
                  onEdit={(course) => {
                    setSelectedCourse(course)
                    setDetailSheetOpen(true)
                  }}
                  onDelete={(course) => {
                    toast.success(`${course.name} 과정을 비활성화했습니다.`)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sheet 컴포넌트들 */}
      <CreateCoursePackageSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        onSuccess={handleCourseCreateSuccess}
      />
      
      <CoursePackageDetailSheet
        coursePackage={selectedCourse}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onUpdate={handleCourseUpdateSuccess}
        onDelete={handleCourseDeleteSuccess}
      />
    </div>
  )
}