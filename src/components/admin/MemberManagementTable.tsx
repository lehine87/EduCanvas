'use client'

import { useState, useEffect } from 'react'
import { Table, Button, Badge, Loading, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types/auth.types'

interface MemberManagementTableProps {
  tenantId: string
  onMemberChange: () => void
}

export function MemberManagementTable({ tenantId, onMemberChange }: MemberManagementTableProps) {
  const [members, setMembers] = useState<UserProfile[]>([])
  const [filteredMembers, setFilteredMembers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (tenantId) {
      loadMembers()
    }
  }, [tenantId])

  useEffect(() => {
    filterMembers()
  }, [members, searchQuery, filterRole, filterStatus])

  const loadMembers = async () => {
    setIsLoading(true)
    try {
      console.log('👥 활성 회원 목록 로드 중...', tenantId)
      
      const response = await fetch(`/api/tenant-admin/members?tenantId=${tenantId}&status=active`)
      
      if (!response.ok) {
        throw new Error('회원 목록 조회 실패')
      }
      
      const result = await response.json()
      
      console.log('✅ 활성 회원 목록 로드 성공:', result.members?.length || 0, '명')
      setMembers(result.members || [])
      
    } catch (error) {
      console.error('❌ 회원 목록 조회 실패:', error)
      setMembers([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterMembers = () => {
    let filtered = members

    // 검색어 필터링
    if (searchQuery) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.phone && member.phone.includes(searchQuery))
      )
    }

    // 역할 필터링
    if (filterRole !== 'all') {
      filtered = filtered.filter(member => member.role === filterRole)
    }

    // 상태 필터링
    if (filterStatus !== 'all') {
      filtered = filtered.filter(member => member.status === filterStatus)
    }

    setFilteredMembers(filtered)
  }

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    setActionLoading(userId)
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      
      console.log('🔄 회원 상태 변경 시작:', { userId, currentStatus, newStatus })

      const response = await fetch('/api/tenant-admin/update-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          updates: { status: newStatus },
          tenantId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ 회원 상태 변경 API 실패:', result.error)
        alert(result.error || '상태 변경에 실패했습니다.')
        return
      }

      console.log('✅ 회원 상태 변경 성공:', result.user)

      // 로컬 상태 업데이트
      setMembers(prev =>
        prev.map(member =>
          member.id === userId 
            ? { ...member, status: newStatus }
            : member
        )
      )

      // 성공 메시지
      alert(result.message)
      onMemberChange()

    } catch (error) {
      console.error('❌ 회원 상태 변경 예외:', error)
      alert('상태 변경 중 오류가 발생했습니다.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleChangeRole = async (userId: string, newRole: string) => {
    setActionLoading(userId)
    try {
      console.log('🔄 회원 역할 변경 시작:', { userId, newRole })

      const response = await fetch('/api/tenant-admin/update-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          updates: { role: newRole },
          tenantId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ 회원 역할 변경 API 실패:', result.error)
        alert(result.error || '역할 변경에 실패했습니다.')
        return
      }

      console.log('✅ 회원 역할 변경 성공:', result.user)

      // 로컬 상태 업데이트
      setMembers(prev =>
        prev.map(member =>
          member.id === userId 
            ? { ...member, role: newRole }
            : member
        )
      )

      // 성공 메시지 (조용히 처리 - select 변경은 사용자가 의도적으로 한 것)
      console.log('📢 역할 변경 완료:', result.message)
      onMemberChange()

    } catch (error) {
      console.error('❌ 회원 역할 변경 예외:', error)
      alert('역할 변경 중 오류가 발생했습니다.')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="warning">관리자</Badge>
      case 'instructor':
        return <Badge variant="info">강사</Badge>
      case 'staff':
        return <Badge variant="success">스태프</Badge>
      case 'viewer':
        return <Badge variant="secondary">뷰어</Badge>
      case 'pending':
        return <Badge variant="warning">대기</Badge>
      default:
        return <Badge variant="secondary">{role}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">활성</Badge>
      case 'inactive':
        return <Badge variant="error">비활성</Badge>
      case 'pending_approval':
        return <Badge variant="warning">승인 대기</Badge>
      case 'rejected':
        return <Badge variant="error">거부됨</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loading />
      </div>
    )
  }

  const columns = [
    {
      key: 'user_info',
      header: '회원 정보',
      render: (value: unknown, member: UserProfile) => (
        <div>
          <div className="font-medium text-gray-900">{member.name}</div>
          <div className="text-sm text-gray-500">{member.email}</div>
          {member.phone && (
            <div className="text-sm text-gray-500">{member.phone}</div>
          )}
        </div>
      )
    },
    {
      key: 'role',
      header: '역할',
      render: (value: unknown, member: UserProfile) => (
        <div className="space-y-2">
          {getRoleBadge(member.role || 'viewer')}
          {member.status === 'active' && (member.role || 'viewer') !== 'admin' && (
            <div className="space-x-1">
              <select
                value={member.role || 'viewer'}
                onChange={(e) => handleChangeRole(member.id, e.target.value)}
                disabled={actionLoading === member.id}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="viewer">뷰어</option>
                <option value="staff">스태프</option>
                <option value="instructor">강사</option>
              </select>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: '상태',
      render: (value: unknown, member: UserProfile) => getStatusBadge(member.status || 'inactive')
    },
    {
      key: 'last_login',
      header: '최근 로그인',
      render: (value: unknown, member: UserProfile) => (
        <div className="text-sm text-gray-500">
          {member.last_login_at ? formatDate(member.last_login_at) : '없음'}
        </div>
      )
    },
    {
      key: 'created_at',
      header: '가입일',
      render: (value: unknown, member: UserProfile) => (
        <div className="text-sm text-gray-500">
          {member.created_at ? formatDate(member.created_at) : '없음'}
        </div>
      )
    },
    {
      key: 'actions',
      header: '작업',
      render: (value: unknown, member: UserProfile) => {
        if (!member || !member.id) return <div>-</div>;
        
        console.log('작업 컬럼 렌더링:', { id: member.id, role: member.role, status: member.status });
        
        return (
          <div className="space-y-1">
            {member.role !== 'admin' ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleToggleStatus(member.id, member.status || 'inactive')}
                disabled={actionLoading === member.id}
                loading={actionLoading === member.id}
              >
                {member.status === 'active' ? '비활성화' : '활성화'}
              </Button>
            ) : (
              <div className="text-sm text-gray-500">관리자</div>
            )}
          </div>
        );
      }
    }
  ]

  return (
    <div className="space-y-4">
      {/* 필터 및 검색 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="이름, 이메일, 전화번호로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">모든 역할</option>
            <option value="admin">관리자</option>
            <option value="instructor">강사</option>
            <option value="staff">스태프</option>
            <option value="viewer">뷰어</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">모든 상태</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
            <option value="pending_approval">승인 대기</option>
          </select>

          <Button
            variant="outline"
            onClick={loadMembers}
            disabled={isLoading}
          >
            🔄
          </Button>
        </div>
      </div>

      {/* 결과 요약 */}
      <div className="text-sm text-gray-600">
        전체 {members.length}명 중 {filteredMembers.length}명 표시
      </div>

      {/* 테이블 */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || filterRole !== 'all' || filterStatus !== 'all' 
              ? '검색 결과가 없습니다' 
              : '등록된 회원이 없습니다'
            }
          </h3>
          <p className="text-gray-600">
            {searchQuery || filterRole !== 'all' || filterStatus !== 'all'
              ? '다른 검색 조건을 시도해보세요'
              : '새로운 회원 가입을 기다리고 있습니다'
            }
          </p>
        </div>
      ) : (
        <Table
          columns={columns}
          data={filteredMembers}
          keyField="id"
        />
      )}
    </div>
  )
}