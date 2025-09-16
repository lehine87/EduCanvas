'use client'

import React, { memo, useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DataTable } from '@/components/data-table'
import { useAuthStore } from '@/store/useAuthStore'
import { ApprovalModal } from '@/components/admin/ApprovalModal'
import { 
  UserPlusIcon, 
  MagnifyingGlassIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Loader2 } from 'lucide-react'
import type { UserProfile } from '@/types/auth.types'
import { cn } from '@/lib/utils'

/**
 * SelectPendingStaffSheet Props
 */
export interface SelectPendingStaffSheetProps {
  /** Sheet 열림 상태 */
  open: boolean
  /** Sheet 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void
  /** 등록 성공 콜백 */
  onSuccess?: () => void
  /** 사이드바 너비 */
  sidebarWidth?: number
  /** 추가 CSS 클래스 */
  className?: string
}

/**
 * SelectPendingStaffSheet - pending 유저 선택하여 직원 등록하는 Sheet 컴포넌트
 */
const SelectPendingStaffSheet = memo<SelectPendingStaffSheetProps>(({
  open,
  onOpenChange,
  onSuccess,
  sidebarWidth = 384,
  className
}) => {
  // 상태 관리
  const { profile: userProfile } = useAuthStore()
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)

  // 테넌트 ID
  const tenantId = userProfile?.tenant_id

  // Sheet가 열릴 때 pending 유저 로드
  useEffect(() => {
    if (open && tenantId) {
      loadPendingUsers()
    }
  }, [open, tenantId])

  // 검색 필터링
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(pendingUsers)
    } else {
      const filtered = pendingUsers.filter(user => 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone?.includes(searchQuery)
      )
      setFilteredUsers(filtered)
    }
  }, [pendingUsers, searchQuery])

  // pending 유저 로드
  const loadPendingUsers = useCallback(async () => {
    if (!tenantId) return

    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🔍 pending 유저 목록 로드 중...', tenantId)
      
      const response = await fetch(`/api/tenant-admin/members?tenantId=${tenantId}&status=pending`)
      
      if (!response.ok) {
        throw new Error('pending 유저 조회 실패')
      }
      
      const result = await response.json()
      
      console.log('✅ pending 유저 조회 성공:', result.members?.length || 0, '명')
      setPendingUsers(result.members || [])
      
    } catch (error) {
      console.error('❌ pending 유저 조회 실패:', error)
      setError('pending 유저 목록을 불러올 수 없습니다.')
      setPendingUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [tenantId])

  // 직원 등록 모달 열기
  const handleSelectUser = (user: UserProfile) => {
    setSelectedUser(user)
    setShowApprovalModal(true)
  }

  // 등록 완료 후 처리
  const handleRegistrationComplete = () => {
    // pending 유저 목록에서 제거
    if (selectedUser) {
      setPendingUsers(prev => prev.filter(user => user.id !== selectedUser.id))
    }
    
    // 모달 닫기
    setSelectedUser(null)
    setShowApprovalModal(false)
    
    // 성공 콜백 호출
    onSuccess?.()
    
    // Sheet 닫기
    onOpenChange(false)
  }

  // Sheet 닫기
  const handleClose = useCallback(() => {
    setError(null)
    setSearchQuery('')
    setSelectedUser(null)
    setShowApprovalModal(false)
    onOpenChange(false)
  }, [onOpenChange])

  // DataTable 컬럼 정의
  const columns = [
    {
      accessorKey: 'name',
      header: '이름',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium text-neutral-900 dark:text-neutral-100">
            {row.original.name}
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {row.original.email}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'phone',
      header: '연락처',
      cell: ({ row }: any) => (
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          {row.original.phone || '-'}
        </div>
      )
    },
    {
      accessorKey: 'created_at',
      header: '신청일',
      cell: ({ row }: any) => (
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString('ko-KR') : '-'}
        </div>
      )
    },
    {
      id: 'actions',
      header: '액션',
      cell: ({ row }: any) => (
        <Button
          size="sm"
          onClick={() => handleSelectUser(row.original)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          등록하기
        </Button>
      )
    }
  ]

  return (
    <>
      {/* 메인 영역 오버레이 */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bg-black/30 z-30"
            style={{ 
              left: `${sidebarWidth}px`,
              top: '65px',
              right: 0,
              bottom: 0
            }}
            onClick={() => onOpenChange(false)}
          />
        )}
      </AnimatePresence>

      {/* Sheet 본체 */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 200,
              duration: 0.3
            }}
            className={cn(
              "fixed w-[800px] origin-left",
              "bg-white dark:bg-neutral-950",
              "border-r border-neutral-200 dark:border-neutral-800",
              "shadow-xl",
              className
            )}
            style={{ 
              left: `${sidebarWidth}px`,
              top: '65px',
              bottom: 0,
              zIndex: 30
            }}
          >
            <div className="flex flex-col h-full">
              {/* 헤더 */}
              <div className="px-8 py-6 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
                      <UserPlusIcon className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        직원 등록
                      </h2>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        승인 대기 중인 사용자를 직원으로 등록해주세요
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="h-8 w-8"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* 검색 영역 */}
              <div className="px-8 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    placeholder="이름, 이메일, 연락처로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* 콘텐츠 영역 */}
              <div className="flex-1 flex flex-col">
                {/* 에러 표시 */}
                {error && (
                  <div className="mx-8 mt-4 bg-error-50 border border-error-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-error-700">
                      <ExclamationTriangleIcon className="w-5 h-5" />
                      <span className="font-medium">{error}</span>
                    </div>
                  </div>
                )}

                {/* 로딩 상태 */}
                {isLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        승인 대기 중인 사용자를 불러오는 중...
                      </p>
                    </div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  /* 빈 상태 */
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-neutral-400 text-4xl mb-4">👥</div>
                      <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                        {searchQuery ? '검색 결과가 없습니다' : '승인 대기 중인 사용자가 없습니다'}
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                        {searchQuery 
                          ? '다른 검색어로 시도해보세요' 
                          : '새로운 가입 신청이 있으면 여기에 표시됩니다'
                        }
                      </p>
                      <div className="flex gap-3 justify-center">
                        {searchQuery && (
                          <Button
                            variant="outline"
                            onClick={() => setSearchQuery('')}
                          >
                            검색 초기화
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={loadPendingUsers}
                          disabled={isLoading}
                        >
                          🔄 새로고침
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 데이터 테이블 */
                  <div className="flex-1 px-8 py-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">
                        총 {filteredUsers.length}명의 사용자
                        {searchQuery && ` (검색: "${searchQuery}")`}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadPendingUsers}
                        disabled={isLoading}
                      >
                        🔄 새로고침
                      </Button>
                    </div>
                    
                    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
                      <DataTable
                        data={filteredUsers}
                        columns={columns}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 직원 등록 모달 */}
      <ApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        user={selectedUser}
        tenantId={tenantId || ''}
        onApprovalComplete={handleRegistrationComplete}
        title="직원 등록"
      />
    </>
  )
})

SelectPendingStaffSheet.displayName = 'SelectPendingStaffSheet'

export default SelectPendingStaffSheet