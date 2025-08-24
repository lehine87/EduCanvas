'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Badge, Card, CardContent } from '@/components/ui'
import { ClassTable } from '@/components/classes/ClassTable'
import { ClassCard } from '@/components/classes/ClassCard'
import { CreateClassSheet } from '@/components/classes/CreateClassSheet'
import { ClassDetailSheet } from '@/components/classes/ClassDetailSheet'
import { GroupedClassView } from '@/components/classes/GroupedClassView'
import { useClassesStore, ClassWithRelations } from '@/store/classesStore'
import { useAuthStore } from '@/store/useAuthStore'
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  AdjustmentsHorizontalIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  CheckCircleIcon as CheckCircleOutline
} from '@heroicons/react/24/outline'
import { Loader2 } from 'lucide-react'
import { 
  AcademicCapIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/solid'

/**
 * 클래스 관리 메인 페이지
 * 
 * 특징:
 * - 테이블/카드 뷰 토글
 * - 실시간 검색 및 필터링
 * - 통계 대시보드
 * - 일괄 작업 지원
 * - 클래스 생성/수정/삭제
 * - 완전한 접근성
 * - 60fps 성능 보장
 */
export default function ClassesPage() {
  // 상태 관리
  const { 
    classes,
    loading,
    error,
    view,
    groupBy,
    subGroupBy,
    groupViewMode,
    filters,
    sort,
    stats,
    selectedClasses,
    selectionMode,
    modals,
    detailSheet,
    fetchClasses,
    setView,
    setGroupBy,
    setSubGroupBy,
    setGroupViewMode,
    setFilters,
    setSort,
    setSelectedClass,
    toggleClassSelection,
    selectAllClasses,
    clearSelection,
    toggleSelectionMode,
    setSelectionMode,
    openModal,
    closeModal,
    deleteClass,
    updateClass,
    openDetailSheet,
    closeDetailSheet
  } = useClassesStore()

  const { profile: userProfile } = useAuthStore()

  // 로컬 상태
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [deleteConfirmClass, setDeleteConfirmClass] = useState<ClassWithRelations | null>(null)

  // 테넌트 ID
  const tenantId = userProfile?.tenant_id

  // 페이지 헤더 정보
  const pageTitle = '클래스 관리'

  // 데이터 로드
  useEffect(() => {
    if (tenantId) {
      fetchClasses(tenantId, { ...filters, ...sort, search: searchTerm })
    }
  }, [tenantId, fetchClasses, filters, sort, searchTerm])

  // 필터링된 클래스 목록
  const filteredClasses = useMemo(() => {
    let result = [...classes]

    // 검색어 필터링
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(cls => 
        cls.name.toLowerCase().includes(term) ||
        cls.description?.toLowerCase().includes(term) ||
        cls.grade?.toLowerCase().includes(term) ||
        cls.course?.toLowerCase().includes(term) ||
        cls.instructor?.name?.toLowerCase().includes(term)
      )
    }

    return result
  }, [classes, searchTerm])

  // 통계 계산
  const computedStats = useMemo(() => {
    if (stats) return stats

    const totalClasses = filteredClasses.length
    const activeClasses = filteredClasses.filter(cls => cls.is_active).length
    const inactiveClasses = totalClasses - activeClasses
    const totalStudents = filteredClasses.reduce((sum, cls) => sum + (cls.student_count || 0), 0)

    return {
      totalClasses,
      activeClasses,
      inactiveClasses,
      totalStudents,
      averageStudentsPerClass: totalClasses > 0 ? Math.round((totalStudents / totalClasses) * 10) / 10 : 0
    }
  }, [stats, filteredClasses])

  // 이벤트 핸들러
  const handleCreateClass = useCallback(() => {
    openModal('create')
  }, [openModal])

  
  // 클래스 클릭 핸들러 (상세보기)
  const handleClassClick = useCallback((classData: ClassWithRelations) => {
    openDetailSheet(classData.id)
  }, [openDetailSheet])
  
  // Sheet에서 업데이트 핸들러
  const handleUpdateFromSheet = useCallback(async (id: string, data: Partial<ClassWithRelations>) => {
    if (tenantId) {
      await updateClass(id, data, tenantId)
    }
  }, [tenantId, updateClass])
  
  // Sheet에서 삭제 핸들러
  const handleDeleteFromSheet = useCallback(async (id: string) => {
    if (tenantId) {
      await deleteClass(id, tenantId, false)
    }
  }, [tenantId, deleteClass])

  const handleDeleteClass = useCallback((classData: ClassWithRelations) => {
    setDeleteConfirmClass(classData)
  }, [])

  const handleConfirmDelete = useCallback(async (forceDelete = false) => {
    if (deleteConfirmClass && tenantId) {
      const success = await deleteClass(deleteConfirmClass.id, tenantId, forceDelete)
      if (success) {
        setDeleteConfirmClass(null)
      }
    }
  }, [deleteConfirmClass, tenantId, deleteClass])

  const handleBulkDelete = useCallback(async () => {
    if (selectedClasses.length === 0 || !tenantId) return

    const promises = selectedClasses.map(classId => 
      deleteClass(classId, tenantId, false)
    )

    try {
      await Promise.all(promises)
      clearSelection()
    } catch (error) {
      console.error('일괄 삭제 실패:', error)
    }
  }, [selectedClasses, tenantId, deleteClass, clearSelection])

  const handleRefresh = useCallback(() => {
    if (tenantId) {
      fetchClasses(tenantId, { ...filters, ...sort, search: searchTerm })
    }
  }, [tenantId, fetchClasses, filters, sort, searchTerm])

  if (!tenantId) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="text-center py-12">
          <p className="text-gray-500">로그인이 필요합니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 페이지 헤더 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
            <nav className="flex mt-1" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm text-gray-500">
                <li>
                  <a href="/main" className="hover:text-gray-700">홈</a>
                </li>
                <li>
                  <span className="mx-2">/</span>
                  <span className="text-gray-900">클래스 관리</span>
                </li>
              </ol>
            </nav>
          </div>
          
          {/* 액션 버튼들 */}
          <div className="flex items-center space-x-3">
            {/* 일괄 작업 버튼 */}
            {selectedClasses.length > 0 && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-brand-50 rounded-lg border border-brand-200">
                <span className="text-sm font-medium text-brand-700">
                  {selectedClasses.length}개 선택됨
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
              className="transition-all flex-shrink-0 z-10"
              title={selectionMode ? "상세보기 모드로 전환" : "선택 모드로 전환"}
            >
              <CheckCircleOutline className="w-4 h-4 mr-1" />
              {selectionMode ? "선택 모드" : "선택"}
            </Button>

            {/* 그룹 뷰 옵션 */}
            <div className="flex items-center gap-2">
              <Select
                value={groupBy}
                onValueChange={(value: 'instructor' | 'subject' | 'grade') => setGroupBy(value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instructor">강사별</SelectItem>
                  <SelectItem value="subject">과목별</SelectItem>
                  <SelectItem value="grade">학년별</SelectItem>
                </SelectContent>
              </Select>
              
              {/* 서브그룹 선택 */}
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500">→</span>
                <Select
                  value={subGroupBy}
                  onValueChange={(value: 'none' | 'instructor' | 'subject' | 'grade') => setSubGroupBy(value)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">없음</SelectItem>
                    {groupBy !== 'instructor' && <SelectItem value="instructor">강사별</SelectItem>}
                    {groupBy !== 'subject' && <SelectItem value="subject">과목별</SelectItem>}
                    {groupBy !== 'grade' && <SelectItem value="grade">학년별</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex rounded-lg border border-gray-300 bg-white">
                <Button
                  variant={groupViewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setGroupViewMode('list')}
                  className="rounded-r-none border-0"
                  title="리스트"
                >
                  <ListBulletIcon className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant={groupViewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setGroupViewMode('cards')}
                  className="rounded-l-none border-l border-gray-300"
                  title="카드"
                >
                  <Squares2X2Icon className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* 새 클래스 등록 */}
            <Button onClick={handleCreateClass}>
              <PlusIcon className="w-4 h-4 mr-2" />
              새 클래스 등록
            </Button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 overflow-auto p-6">
      <div className="space-y-6">
        {/* 에러 메시지 */}
        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-4">
            <div className="flex items-center">
              <XCircleIcon className="w-5 h-5 text-error-400 mr-3" />
              <div>
                <p className="text-sm text-error-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 통계 대시보드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                  <AcademicCapIcon className="w-6 h-6 text-brand-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">전체 클래스</p>
                <p className="text-2xl font-bold text-gray-900">{computedStats.totalClasses}</p>
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
                <p className="text-sm font-medium text-gray-500">활성 클래스</p>
                <p className="text-2xl font-bold text-gray-900">{computedStats.activeClasses}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <XCircleIcon className="w-6 h-6 text-gray-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">비활성 클래스</p>
                <p className="text-2xl font-bold text-gray-900">{computedStats.inactiveClasses}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                  <UserGroupIcon className="w-6 h-6 text-warning-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">총 학생 수</p>
                <p className="text-2xl font-bold text-gray-900">{computedStats.totalStudents}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 검색 및 필터 */}
        <Card>
          <CardContent>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
              {/* 검색 */}
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="클래스명, 강사명, 학년, 과정으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* 필터 버튼 */}
              <div className="flex items-center space-x-3">
                {/* 그룹 내 정렬 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">정렬:</span>
                  <Select
                    value={`${sort.sortBy}-${sort.sortOrder}`}
                    onValueChange={(value: string) => {
                      const [sortBy, sortOrder] = value.split('-')
                      setSort({ 
                        sortBy: sortBy as 'name' | 'created_at' | 'student_count', 
                        sortOrder: sortOrder as 'asc' | 'desc' 
                      })
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">이름순</SelectItem>
                      <SelectItem value="name-desc">이름 역순</SelectItem>
                      <SelectItem value="created_at-desc">최신순</SelectItem>
                      <SelectItem value="created_at-asc">오래된순</SelectItem>
                      <SelectItem value="student_count-desc">학생 많은순</SelectItem>
                      <SelectItem value="student_count-asc">학생 적은순</SelectItem>
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
                    <Select
                      value={filters.status}
                      onValueChange={(value: string) => setFilters({ status: value as 'all' | 'active' | 'inactive' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="active">활성</SelectItem>
                        <SelectItem value="inactive">비활성</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      학년
                    </label>
                    <Select
                      value={filters.grade || 'all'}
                      onValueChange={(value: string) => setFilters({ grade: value === 'all' ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체 학년</SelectItem>
                        <SelectItem value="초1">초등학교 1학년</SelectItem>
                        <SelectItem value="초2">초등학교 2학년</SelectItem>
                        <SelectItem value="초3">초등학교 3학년</SelectItem>
                        <SelectItem value="초4">초등학교 4학년</SelectItem>
                        <SelectItem value="초5">초등학교 5학년</SelectItem>
                        <SelectItem value="초6">초등학교 6학년</SelectItem>
                        <SelectItem value="중1">중학교 1학년</SelectItem>
                        <SelectItem value="중2">중학교 2학년</SelectItem>
                        <SelectItem value="중3">중학교 3학년</SelectItem>
                        <SelectItem value="고1">고등학교 1학년</SelectItem>
                        <SelectItem value="고2">고등학교 2학년</SelectItem>
                        <SelectItem value="고3">고등학교 3학년</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      정렬
                    </label>
                    <Select
                      value={`${sort.sortBy}-${sort.sortOrder}`}
                      onValueChange={(value: string) => {
                        const [sortBy, sortOrder] = value.split('-')
                        setSort({ 
                          sortBy: sortBy as 'name' | 'created_at' | 'student_count', 
                          sortOrder: sortOrder as 'asc' | 'desc' 
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name-asc">이름 (가나다순)</SelectItem>
                        <SelectItem value="name-desc">이름 (역순)</SelectItem>
                        <SelectItem value="created_at-desc">최신순</SelectItem>
                        <SelectItem value="created_at-asc">오래된순</SelectItem>
                        <SelectItem value="student_count-desc">학생 수 (많은순)</SelectItem>
                        <SelectItem value="student_count-asc">학생 수 (적은순)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 클래스 목록 - 그룹 뷰만 사용 */}
        <GroupedClassView
          classes={filteredClasses}
          groupBy={groupBy}
          subGroupBy={subGroupBy}
          viewMode={groupViewMode}
          selectionMode={selectionMode}
          onClassClick={handleClassClick}
          onClassSelect={toggleClassSelection}
          selectedClasses={selectedClasses}
          loading={loading}
          onCreateClass={handleCreateClass}
        />
      </div>

      {/* Sheet들 */}
      <CreateClassSheet
        isOpen={modals.create}
        onClose={() => closeModal('create')}
        onSuccess={() => {
          // 성공 시 목록 새로고침
          if (tenantId) {
            fetchClasses(tenantId, { ...filters, ...sort, search: searchTerm })
          }
        }}
      />


      {/* 삭제 확인 모달 */}
      {deleteConfirmClass && (
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
                  클래스 삭제
                </h3>
                <p className="text-sm text-gray-500">
                  이 작업은 되돌릴 수 없습니다
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-6">
              "{deleteConfirmClass.name}" 클래스를 삭제하시겠습니까?
            </p>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmClass(null)}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleConfirmDelete(false)}
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* 클래스 상세보기 Sheet */}
      <ClassDetailSheet
        classData={detailSheet.classId ? filteredClasses.find(c => c.id === detailSheet.classId) || null : null}
        isOpen={detailSheet.isOpen}
        onClose={closeDetailSheet}
        onUpdate={handleUpdateFromSheet}
        onDelete={handleDeleteFromSheet}
      />
      </div>
    </div>
  )
}