'use client'

import { useState, useEffect } from 'react'
import { Table, Button, Badge, Loading } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import type { Tenant } from '@/types/app.types'

interface TenantListTableProps {
  tenants: Tenant[]
  isLoading: boolean
  onRefresh: () => void
  onTenantsUpdate?: (tenants: Tenant[]) => void
}

export function TenantListTable({ tenants: initialTenants, isLoading, onRefresh, onTenantsUpdate }: TenantListTableProps) {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants)
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
      
      const { error } = await supabase
        .from('tenants')
        .update({ is_active: !currentStatus })
        .eq('id', tenantId)

      if (error) {
        console.error('테넌트 상태 변경 실패:', error)
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

      console.log('✅ 테넌트 상태 변경 성공')
      
    } catch (error) {
      console.error('테넌트 상태 변경 예외:', error)
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
      return <Badge variant="warning">체험</Badge>
    }
    if (tier === 'basic') {
      return <Badge variant="info">베이직</Badge>
    }
    if (tier === 'premium') {
      return <Badge variant="success">프리미엄</Badge>
    }
    return <Badge variant="default">{tier}</Badge>
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge variant="success">활성</Badge>
      : <Badge variant="danger">비활성</Badge>
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
          생성된 테넌트가 없습니다
        </h3>
        <p className="text-gray-600 mb-4">
          첫 번째 테넌트를 생성하여 시작해보세요
        </p>
        <Button onClick={onRefresh} variant="outline">
          새로고침
        </Button>
      </div>
    )
  }

  const columns = [
    {
      key: 'name',
      header: '학원명',
      render: (value: unknown, tenant: Tenant) => {
        console.log('Name column render - value:', value, 'tenant:', tenant);
        if (!tenant) return <div>-</div>;
        return (
          <div>
            <div className="font-medium text-gray-900">{tenant.name || '이름없음'}</div>
            <div className="text-sm text-gray-500">#{tenant.tenant_code || '코드없음'}</div>
          </div>
        );
      }
    },
    {
      key: 'contact',
      header: '연락처',
      render: (value: unknown, tenant: Tenant) => {
        if (!tenant) return <div>-</div>;
        return (
          <div>
            <div className="text-sm text-gray-900">{tenant.contact_email || '-'}</div>
            <div className="text-sm text-gray-500">{tenant.contact_phone || '-'}</div>
          </div>
        );
      }
    },
    {
      key: 'subscription',
      header: '구독',
      render: (value: unknown, tenant: Tenant) => {
        if (!tenant) return <div>-</div>;
        return (
          <div className="space-y-1">
            {getSubscriptionBadge(tenant.subscription_tier, tenant.subscription_status)}
            {tenant.trial_ends_at && tenant.subscription_tier === 'trial' && (
              <div className="text-xs text-gray-500">
                {formatDate(tenant.trial_ends_at)}까지
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'users',
      header: '사용자 수',
      render: (value: unknown, tenant: Tenant) => {
        if (!tenant) return <div className="text-center">-</div>;
        return (
          <div className="text-center">
            <span className="text-lg font-medium text-gray-900">
              {tenant.user_count?.[0]?.count || 0}
            </span>
            <div className="text-xs text-gray-500">명</div>
          </div>
        );
      }
    },
    {
      key: 'status',
      header: '상태',
      render: (value: unknown, tenant: Tenant) => {
        if (!tenant) return <div>-</div>;
        return getStatusBadge(tenant.is_active);
      }
    },
    {
      key: 'created_at',
      header: '생성일',
      render: (value: unknown, tenant: Tenant) => {
        if (!tenant || !tenant.created_at) return <div className="text-sm text-gray-500">-</div>;
        return (
          <div className="text-sm text-gray-500">
            {formatDate(tenant.created_at)}
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: '작업',
      render: (value: unknown, tenant: Tenant) => {
        if (!tenant) return <div>-</div>;
        const isToggling = toggleLoadingStates.has(tenant.id);
        return (
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleToggleStatus(tenant.id, tenant.is_active)}
              disabled={isToggling}
              loading={isToggling}
            >
              {tenant.is_active ? '🔴 비활성화' : '🟢 활성화'}
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
        );
      }
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          총 {tenants.length}개의 테넌트
        </div>
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
          loading={isLoading}
        >
          🔄 새로고침
        </Button>
      </div>

      <Table
        columns={columns}
        data={tenants.filter(tenant => tenant && tenant.id)}
        keyField="id"
      />
    </div>
  )
}