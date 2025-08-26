'use client'

import { useState, useEffect } from 'react'
import { Button, Badge, Loading, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Tenant } from '@/types'

// 시스템 관리자 API에서 반환되는 확장된 테넌트 타입
interface TenantWithUserCount extends Tenant, Record<string, unknown> {
  user_count?: Array<{ count: number }>
}

interface TenantListTableProps {
  tenants: TenantWithUserCount[]
  isLoading: boolean
  onRefresh: () => void
  onTenantsUpdate?: (tenants: TenantWithUserCount[]) => void
}

export function TenantListTable({ tenants: initialTenants, isLoading, onRefresh, onTenantsUpdate }: TenantListTableProps) {
  const [tenants, setTenants] = useState<TenantWithUserCount[]>(initialTenants)
  const [toggleLoadingStates, setToggleLoadingStates] = useState<Set<string>>(new Set())
  
  const supabase = createClient()

  useEffect(() => {
    setTenants(initialTenants)
  }, [initialTenants])


  const handleToggleStatus = async (tenantId: string, currentStatus: boolean) => {
    // 로딩 상태 시작
    setToggleLoadingStates(prev => new Set(prev).add(tenantId))
    
    try {
      console.log(`🔄 테넌트 상태 변경 중: ${currentStatus ? '비활성화' : '활성화'}`)
      
      // 현재 사용자 및 세션 확인
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('❌ 사용자 인증 실패:', userError?.message)
        alert('로그인이 필요합니다. 다시 로그인해주세요.')
        return
      }

      // 세션 토큰이 필요한 경우 추가로 가져오기
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session?.access_token) {
        console.error('❌ 세션 토큰 가져오기 실패:', sessionError?.message)
        alert('인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요.')
        return
      }

      // API 호출로 변경
      const response = await fetch('/api/system-admin/toggle-tenant-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          tenantId,
          isActive: !currentStatus
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ 테넌트 상태 변경 API 실패:', result.error)
        alert(result.error || '학원 상태 변경에 실패했습니다.')
        return
      }

      // 로컬 상태 업데이트
      const updatedTenants = tenants.map(tenant => 
        tenant.id === tenantId 
          ? { ...tenant, is_active: !currentStatus }
          : tenant
      )
      setTenants(updatedTenants)
      
      // 상위 컴포넌트에 업데이트 알림
      if (onTenantsUpdate) {
        onTenantsUpdate(updatedTenants)
      }

      console.log('✅ 테넌트 상태 변경 성공:', result.message)
      
    } catch (error) {
      console.error('❌ 테넌트 상태 변경 예외:', error)
      alert('학원 상태 변경 중 오류가 발생했습니다.')
    } finally {
      // 로딩 상태 종료
      setToggleLoadingStates(prev => {
        const newSet = new Set(prev)
        newSet.delete(tenantId)
        return newSet
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getSubscriptionBadge = (tier: string, status: string) => {
    if (tier === 'trial') {
      return <Badge variant="destructive">체험</Badge>
    }
    if (tier === 'basic') {
      return <Badge variant="outline">베이직</Badge>
    }
    if (tier === 'premium') {
      return <Badge variant="secondary">프리미엄</Badge>
    }
    return <Badge variant="default">{tier}</Badge>
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge variant="secondary">활성</Badge>
      : <Badge variant="destructive">비활성</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loading />
      </div>
    )
  }

  if (tenants.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">🏫</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          생성된 학원이 없습니다
        </h3>
        <p className="text-gray-600 mb-4">
          첫 번째 학원을 생성하여 시작해보세요
        </p>
        <Button onClick={onRefresh} variant="outline">
          새로고침
        </Button>
      </div>
    )
  }


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          총 {tenants.length}개의 학원
        </div>
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              새로고침 중...
            </>
          ) : (
            '🔄 새로고침'
          )}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>학원명</TableHead>
            <TableHead>연락처</TableHead>
            <TableHead>구독</TableHead>
            <TableHead className="text-center">사용자 수</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>생성일</TableHead>
            <TableHead>작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.filter(tenant => tenant && tenant.id).map((tenant) => {
            const userCount = tenant.user_count?.[0]?.count || 0;
            const isToggling = toggleLoadingStates.has(tenant.id);
            
            return (
              <TableRow key={tenant.id}>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">{tenant.name || '이름없음'}</div>
                    <div className="text-sm text-gray-500">#{tenant.tenant_code || '코드없음'}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="text-sm text-gray-900">{tenant.contact_email || '-'}</div>
                    <div className="text-sm text-gray-500">{tenant.contact_phone || '-'}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {getSubscriptionBadge(tenant.subscription_tier || '', tenant.subscription_status || '')}
                    {tenant.trial_ends_at && tenant.subscription_tier === 'trial' && (
                      <div className="text-xs text-gray-500">
                        {formatDate(tenant.trial_ends_at)}까지
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-lg font-medium text-gray-900">
                    {userCount}
                  </span>
                  <div className="text-xs text-gray-500">명</div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(tenant.is_active ?? false)}
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-500">
                    {tenant.created_at ? formatDate(tenant.created_at) : '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(tenant.id, tenant.is_active ?? false)}
                      disabled={isToggling}
                    >
                      {(tenant.is_active ?? false) ? '🔴 비활성화' : '🟢 활성화'}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        console.log(`🔗 테넌트 관리 페이지 열기: ${tenant.name}`);
                        window.open(`/tenant-admin/${tenant.slug}`, '_blank');
                      }}
                    >
                      관리
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  )
}