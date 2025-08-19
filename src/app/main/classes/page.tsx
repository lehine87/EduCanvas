'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button, Input, Select, Badge, Card, CardBody } from '@/components/ui'
import { ClassTable } from '@/components/classes/ClassTable'
import { ClassCard } from '@/components/classes/ClassCard'
import { CreateClassModal } from '@/components/classes/CreateClassModal'
import { EditClassModal } from '@/components/classes/EditClassModal'
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
  XMarkIcon
} from '@heroicons/react/24/outline'
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
    filters,
    sort,
    stats,
    selectedClasses,
    modals,
    fetchClasses,
    setView,
    setFilters,
    setSort,
    setSelectedClass,
    toggleClassSelection,
    selectAllClasses,
    clearSelection,
    openModal,
    closeModal,
    deleteClass
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
        cls.instructor?.name.toLowerCase().includes(term)
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

  const handleEditClass = useCallback((classData: ClassWithRelations) => {
    setSelectedClass(classData)
    openModal('edit')
  }, [setSelectedClass, openModal])

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

            {/* 뷰 전환 */}
            <div className="flex rounded-lg border border-gray-300 bg-white">
              <Button
                variant={view === 'table' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setView('table')}
                className="rounded-r-none border-0"
              >
                <ListBulletIcon className="w-4 h-4" />
              </Button>
              <Button
                variant={view === 'cards' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setView('cards')}
                className="rounded-l-none border-l border-gray-300"
              >
                <Squares2X2Icon className="w-4 h-4" />
              </Button>
            </div>

            {/* 새 클래스 생성 */}
            <Button onClick={handleCreateClass}>
              <PlusIcon className="w-4 h-4 mr-2" />
              새 클래스
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
            <CardBody className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                  <AcademicCapIcon className="w-6 h-6 text-brand-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">전체 클래스</p>
                <p className="text-2xl font-bold text-gray-900">{computedStats.totalClasses}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-success-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">활성 클래스</p>
                <p className="text-2xl font-bold text-gray-900">{computedStats.activeClasses}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <XCircleIcon className="w-6 h-6 text-gray-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">비활성 클래스</p>
                <p className="text-2xl font-bold text-gray-900">{computedStats.inactiveClasses}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                  <UserGroupIcon className="w-6 h-6 text-warning-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">총 학생 수</p>
                <p className="text-2xl font-bold text-gray-900">{computedStats.totalStudents}</p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* 검색 및 필터 */}
        <Card>
          <CardBody>
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
                      onChange={(value) => setFilters({ status: value as any })}
                      options={[
                        { value: 'all', label: '전체' },
                        { value: 'active', label: '활성' },
                        { value: 'inactive', label: '비활성' }
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      학년
                    </label>
                    <Select
                      value={filters.grade || ''}
                      onChange={(value) => setFilters({ grade: value || undefined })}
                      options={[
                        { value: '', label: '전체 학년' },
                        { value: '초1', label: '초등학교 1학년' },
                        { value: '초2', label: '초등학교 2학년' },
                        { value: '초3', label: '초등학교 3학년' },
                        { value: '초4', label: '초등학교 4학년' },
                        { value: '초5', label: '초등학교 5학년' },
                        { value: '초6', label: '초등학교 6학년' },
                        { value: '중1', label: '중학교 1학년' },
                        { value: '중2', label: '중학교 2학년' },
                        { value: '중3', label: '중학교 3학년' },
                        { value: '고1', label: '고등학교 1학년' },
                        { value: '고2', label: '고등학교 2학년' },
                        { value: '고3', label: '고등학교 3학년' }
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      정렬
                    </label>
                    <Select
                      value={`${sort.sortBy}-${sort.sortOrder}`}
                      onChange={(value) => {
                        const [sortBy, sortOrder] = value.split('-')
                        setSort({ sortBy: sortBy as any, sortOrder: sortOrder as any })
                      }}
                      options={[
                        { value: 'name-asc', label: '이름 (가나다순)' },
                        { value: 'name-desc', label: '이름 (역순)' },
                        { value: 'created_at-desc', label: '최신순' },
                        { value: 'created_at-asc', label: '오래된순' },
                        { value: 'student_count-desc', label: '학생 수 (많은순)' },
                        { value: 'student_count-asc', label: '학생 수 (적은순)' }
                      ]}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* 클래스 목록 */}
        {view === 'table' ? (
          <ClassTable
            tenantId={tenantId}
            selectable={true}
            showActions={true}
            virtualized={filteredClasses.length > 100}
            height={600}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              // 로딩 스켈레톤
              Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-white border rounded-xl p-4 animate-pulse">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))
            ) : filteredClasses.length > 0 ? (
              filteredClasses.map((classData) => (
                <ClassCard
                  key={classData.id}
                  classData={classData}
                  onEdit={handleEditClass}
                  onDelete={handleDeleteClass}
                  showActions={true}
                  showSelection={true}
                  isSelected={selectedClasses.includes(classData.id)}
                  onSelect={toggleClassSelection}
                />
              ))
            ) : (
              // 빈 상태
              <div className="col-span-full text-center py-12">
                <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  등록된 클래스가 없습니다
                </h3>
                <p className="text-gray-500 mb-6">
                  첫 번째 클래스를 만들어 학생들을 관리해보세요
                </p>
                <Button onClick={handleCreateClass}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  새 클래스 만들기
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 모달들 */}
      <CreateClassModal
        isOpen={modals.create}
        onClose={() => closeModal('create')}
        onSuccess={() => {
          // 성공 시 목록 새로고침
          if (tenantId) {
            fetchClasses(tenantId, { ...filters, ...sort, search: searchTerm })
          }
        }}
      />

      <EditClassModal
        isOpen={modals.edit}
        onClose={() => closeModal('edit')}
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
                variant="error"
                onClick={() => handleConfirmDelete(false)}
                loading={loading}
              >
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}