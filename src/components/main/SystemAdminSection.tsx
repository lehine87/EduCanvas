'use client'

import { useState, useEffect, useCallback } from 'react'
import React from 'react'
import { Button, Card, CardHeader, CardTitle, CardBody } from '@/components/ui'
import { TenantCreateModal } from '@/components/admin/TenantCreateModal'
import { TenantListTable } from '@/components/admin/TenantListTable'
import { ShieldCheckIcon, BuildingOfficeIcon, UsersIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import type { Tenant } from '@/types/auth.types'

// 시스템 관리자 API에서 반환되는 확장된 테넌트 타입
interface TenantWithUserCount extends Tenant, Record<string, unknown> {
  user_count?: Array<{ count: number }>
}

interface SystemAdminSectionProps {
  className?: string
}

/**
 * 시스템 관리 섹션 - system_admin 역할만 표시됨
 * 메인 페이지에서 동적으로 렌더링되는 관리 섹션
 */
export function SystemAdminSection({ className = '' }: SystemAdminSectionProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [tenants, setTenants] = useState<TenantWithUserCount[]>([])
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    pendingApprovals: 0
  })

  const handleCreateTenant = useCallback(() => {
    setShowCreateModal(true)
  }, [])

  const loadTenants = async () => {
    setIsLoadingTenants(true)
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🏢 시스템 관리 섹션 - 테넌트 목록 로드 중...')
      }
      
      // API Route를 통해 서버 사이드에서 데이터 가져오기
      const response = await fetch('/api/system-admin/tenants')
      
      if (!response.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ 시스템 관리 섹션 - API 호출 실패:', response.status)
        }
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ 시스템 관리 섹션 - 테넌트 목록 로드 완료:', {
          tenantCount: data.length,
          sampleTenant: data[0]
        })
      }
      
      setTenants(data)
      
      // 통계 계산
      const totalTenants = data.length
      const activeTenants = data.filter((t: TenantWithUserCount) => t.status === 'active').length
      const totalUsers = data.reduce((sum: number, tenant: TenantWithUserCount) => {
        const userCount = tenant.user_count?.[0]?.count || 0
        return sum + userCount
      }, 0)
      
      setStats({
        totalTenants,
        activeTenants,
        totalUsers,
        pendingApprovals: totalTenants - activeTenants
      })
      
    } catch (error) {
      console.error('시스템 관리 섹션 - 테넌트 목록 로드 실패:', error)
    } finally {
      setIsLoadingTenants(false)
    }
  }

  // 테넌트 생성 완료 후 목록 새로고침
  const handleTenantCreated = useCallback(() => {
    setShowCreateModal(false)
    loadTenants()
  }, [])

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadTenants()
  }, [])

  const statsCards = [
    {
      title: '전체 학원',
      value: stats.totalTenants,
      icon: BuildingOfficeIcon,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: '활성 학원',
      value: stats.activeTenants,
      icon: ChartBarIcon,
      color: 'text-green-600 bg-green-100'
    },
    {
      title: '전체 사용자',
      value: stats.totalUsers,
      icon: UsersIcon,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      title: '승인 대기',
      value: stats.pendingApprovals,
      icon: ShieldCheckIcon,
      color: 'text-orange-600 bg-orange-100'
    }
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 섹션 헤더 */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">시스템 관리</h2>
              <p className="text-sm text-gray-600">전체 시스템 및 학원 관리</p>
            </div>
          </div>
          <Button
            onClick={handleCreateTenant}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            새 학원 생성
          </Button>
        </div>
      </div>

      {/* 시스템 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 테넌트 관리 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BuildingOfficeIcon className="h-5 w-5 text-red-500" />
            <span>학원 관리</span>
          </CardTitle>
        </CardHeader>
        <CardBody>
          <TenantListTable
            tenants={tenants}
            isLoading={isLoadingTenants}
            onRefresh={loadTenants}
          />
        </CardBody>
      </Card>

      {/* 테넌트 생성 모달 */}
      <TenantCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTenantCreated={handleTenantCreated}
      />
    </div>
  )
}