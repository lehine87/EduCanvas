'use client'

import { useState, useEffect, useCallback } from 'react'
import { Table, Button, Badge, Loading, Modal } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types/auth.types'

interface PendingApprovalsTableProps {
  tenantId: string
  onApprovalChange: () => void
}

export function PendingApprovalsTable({ tenantId, onApprovalChange }: PendingApprovalsTableProps) {
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const supabase = createClient()

  const loadPendingUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      console.log('🕐 승인 대기 사용자 목록 로드 중...', tenantId)
      
      const response = await fetch(`/api/tenant-admin/members?tenantId=${tenantId}&status=pending`)
      
      if (!response.ok) {
        throw new Error('승인 대기 사용자 조회 실패')
      }
      
      const result = await response.json()
      
      console.log('✅ 승인 대기 사용자 조회 성공:', result.members?.length || 0, '명')
      setPendingUsers(result.members || [])

    } catch (error) {
      console.error('❌ 승인 대기 사용자 조회 실패:', error)
      setPendingUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    if (tenantId) {
      loadPendingUsers()
    }
  }, [tenantId, loadPendingUsers])

  const handleApproveUser = async (userId: string, approved: boolean) => {
    setActionLoading(userId)
    try {
      console.log(`🔄 사용자 ${approved ? '승인' : '거부'} 처리 시작:`, userId)

      // 승인/거부 API 호출
      const response = await fetch('/api/tenant-admin/approve-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: approved ? 'approve' : 'reject',
          tenantId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ 승인 처리 API 실패:', result.error)
        alert(result.error || '승인 처리에 실패했습니다.')
        return
      }

      console.log('✅ 사용자 승인 처리 성공:', approved ? '승인' : '거부')

      // 로컬 상태에서 제거
      setPendingUsers(prev => prev.filter(user => user.id !== userId))
      
      // 상위 컴포넌트에 변경 알림
      onApprovalChange()

      // 성공 메시지
      alert(result.message)

    } catch (error) {
      console.error('❌ 사용자 승인 처리 예외:', error)
      alert('승인 처리 중 오류가 발생했습니다.')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'instructor':
        return <Badge variant="info">강사</Badge>
      case 'staff':
        return <Badge variant="success">스태프</Badge>
      case 'admin':
        return <Badge variant="warning">관리자</Badge>
      default:
        return <Badge variant="secondary">{role}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loading />
      </div>
    )
  }

  if (pendingUsers.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">✅</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          승인 대기 중인 회원이 없습니다
        </h3>
        <p className="text-gray-600 mb-4">
          새로운 가입 신청이 있으면 여기에 표시됩니다
        </p>
        <Button onClick={loadPendingUsers} variant="outline">
          새로고침
        </Button>
      </div>
    )
  }

  const columns = [
    {
      key: 'user_info',
      header: '신청자 정보',
      render: (value: unknown, user: UserProfile) => {
        if (!user) return <div>-</div>;
        return (
          <div>
            <div className="font-medium text-gray-900">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
            {user.phone && (
              <div className="text-sm text-gray-500">{user.phone}</div>
            )}
          </div>
        );
      }
    },
    {
      key: 'role',
      header: '희망 역할',
      render: (value: unknown, user: UserProfile) => {
        if (!user) return <div>-</div>;
        return getRoleBadge(user.role || 'viewer');
      }
    },
    {
      key: 'created_at',
      header: '신청 일시',
      render: (value: unknown, user: UserProfile) => {
        if (!user) return <div>-</div>;
        return (
          <div className="text-sm text-gray-500">
            {user.created_at ? formatDate(user.created_at) : '없음'}
          </div>
        );
      }
    },
    {
      key: 'details',
      header: '상세 정보',
      render: (value: unknown, user: UserProfile) => {
        if (!user || !user.id) return <div>-</div>;
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedUser(user)
              setShowDetailModal(true)
            }}
          >
            자세히 보기
          </Button>
        );
      }
    },
    {
      key: 'actions',
      header: '승인 처리',
      render: (value: unknown, user: UserProfile) => {
        if (!user || !user.id) return <div>-</div>;
        return (
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => handleApproveUser(user.id, false)}
              disabled={actionLoading === user.id}
              loading={actionLoading === user.id}
            >
              거부
            </Button>
            
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleApproveUser(user.id, true)}
              disabled={actionLoading === user.id}
              loading={actionLoading === user.id}
            >
              승인
            </Button>
          </div>
        );
      }
    }
  ]

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            총 {pendingUsers.length}명의 승인 대기
          </div>
          <Button
            variant="outline"
            onClick={loadPendingUsers}
            disabled={isLoading}
          >
            🔄 새로고침
          </Button>
        </div>

        <Table
          columns={columns}
          data={pendingUsers}
          keyField="id"
        />
      </div>

      {/* 상세 정보 모달 */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="신청자 상세 정보"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">이름</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">이메일</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">전화번호</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.phone || '-'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">희망 역할</label>
                <p className="mt-1">{getRoleBadge(selectedUser.role || 'viewer')}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">신청 일시</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.created_at ? formatDate(selectedUser.created_at) : '없음'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">학원</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedUser.tenants?.name} (#{selectedUser.tenants?.tenant_code})
                </p>
              </div>
            </div>

            {/* 추가 정보가 있다면 표시 */}
            {(selectedUser as UserProfile & { bio?: string })?.bio && (
              <div>
                <label className="block text-sm font-medium text-gray-700">자기소개</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {(selectedUser as UserProfile & { bio?: string })?.bio}
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowDetailModal(false)}
              >
                닫기
              </Button>
              
              <Button
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => {
                  handleApproveUser(selectedUser.id, false)
                  setShowDetailModal(false)
                }}
                disabled={actionLoading === selectedUser.id}
              >
                거부
              </Button>
              
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  handleApproveUser(selectedUser.id, true)
                  setShowDetailModal(false)
                }}
                disabled={actionLoading === selectedUser.id}
              >
                승인
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}