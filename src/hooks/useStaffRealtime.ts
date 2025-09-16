/**
 * @file useStaffRealtime.ts
 * @description 직원 관리 실시간 동기화 Hook
 * @module T-V2-012 Day 4
 */

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { instructorQueryKeys } from '@/lib/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import type { Instructor } from '@/types/staff.types'
import { toast } from 'react-hot-toast'

/**
 * 직원 실시간 동기화 Hook
 * 
 * 기능:
 * - tenant_memberships 테이블 실시간 구독
 * - 직원 생성/수정/삭제 이벤트 처리
 * - React Query 캐시 자동 업데이트
 * - 사용자별 알림 시스템
 */
export function useStaffRealtime() {
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()
  const supabase = createClient()
  const channelRef = useRef<any>(null)
  const tenantId = profile?.tenant_id

  useEffect(() => {
    if (!tenantId || !profile) {
      console.log('🔄 [StaffRealtime] 테넌트 ID 또는 프로필 없음, 구독 건너뜀')
      return
    }

    console.log('🚀 [StaffRealtime] 실시간 구독 시작:', { tenantId, userId: profile.id })

    // 기존 채널 정리
    if (channelRef.current) {
      console.log('🧹 [StaffRealtime] 기존 채널 정리')
      supabase.removeChannel(channelRef.current)
    }

    // 새 채널 생성 및 구독
    const channel = supabase
      .channel(`staff-changes-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tenant_memberships',
          filter: `tenant_id=eq.${tenantId}`,
        },
        async (payload) => {
          console.log('📡 [StaffRealtime] 직원 데이터 변경 감지:', payload)
          
          try {
            await handleStaffChange(payload)
          } catch (error) {
            console.error('❌ [StaffRealtime] 실시간 업데이트 처리 오류:', error)
            toast.error('실시간 업데이트 중 오류가 발생했습니다')
          }
        }
      )
      .subscribe((status) => {
        console.log('📊 [StaffRealtime] 구독 상태 변경:', status)
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ [StaffRealtime] 실시간 구독 활성화됨')
          toast.success('실시간 동기화가 활성화되었습니다', { 
            duration: 2000,
            position: 'bottom-right' 
          })
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [StaffRealtime] 구독 오류 발생')
          toast.error('실시간 동기화 연결에 실패했습니다')
        }
      })

    channelRef.current = channel

    /**
     * 직원 데이터 변경 이벤트 처리
     */
    async function handleStaffChange(payload: any) {
      const { eventType, new: newRecord, old: oldRecord } = payload

      // 직원 관련 데이터만 처리 (staff_info가 있는 경우)
      const isStaffData = newRecord?.staff_info || oldRecord?.staff_info
      if (!isStaffData) {
        console.log('🔍 [StaffRealtime] 직원 데이터가 아님, 건너뜀')
        return
      }

      switch (eventType) {
        case 'INSERT':
          await handleStaffInsert(newRecord)
          break
        case 'UPDATE':
          await handleStaffUpdate(newRecord, oldRecord)
          break
        case 'DELETE':
          await handleStaffDelete(oldRecord)
          break
        default:
          console.warn('⚠️ [StaffRealtime] 알 수 없는 이벤트 타입:', eventType)
      }
    }

    /**
     * 직원 생성 이벤트 처리
     */
    async function handleStaffInsert(newRecord: any) {
      console.log('➕ [StaffRealtime] 새 직원 추가:', newRecord.id)

      // 사용자 정보를 포함한 완전한 직원 데이터 조회 (relationship hint 적용)
      const { data: fullStaffData, error } = await supabase
        .from('tenant_memberships')
        .select(`
          *,
          user_profiles!user_id(*),
          tenant_roles!role_id(*)
        `)
        .eq('id', newRecord.id)
        .single()

      if (error) {
        console.error('❌ [StaffRealtime] 완전한 직원 데이터 조회 실패:', error)
        return
      }

      // 타입 안전성을 위한 데이터 변환
      const transformedStaffData = {
        ...fullStaffData,
        user: fullStaffData.user_profiles,
        role: fullStaffData.tenant_roles
      }

      // React Query 캐시 업데이트
      queryClient.setQueryData(instructorQueryKeys.lists(), (oldData: any) => {
        if (!oldData) return oldData

        const newInstructor = transformedStaffData as unknown as Instructor
        return {
          ...oldData,
          instructors: [newInstructor, ...oldData.instructors],
          pagination: {
            ...oldData.pagination,
            total: oldData.pagination.total + 1
          }
        }
      })

      // 검색 캐시도 무효화
      queryClient.invalidateQueries({
        queryKey: ['instructors-search']
      })

      // 사용자 알림 (자신이 생성한 경우 제외)
      if (newRecord.invited_by !== profile?.id) {
        const staffName = transformedStaffData.user_profiles?.name || '새 직원'
        toast.success(`${staffName}님이 등록되었습니다`, {
          duration: 4000,
          icon: '👋'
        })
      }
    }

    /**
     * 직원 수정 이벤트 처리
     */
    async function handleStaffUpdate(newRecord: any, oldRecord: any) {
      console.log('✏️ [StaffRealtime] 직원 정보 수정:', newRecord.id)

      // 사용자 정보를 포함한 완전한 직원 데이터 조회 (relationship hint 적용)
      const { data: fullStaffData, error } = await supabase
        .from('tenant_memberships')
        .select(`
          *,
          user_profiles!user_id(*),
          tenant_roles!role_id(*)
        `)
        .eq('id', newRecord.id)
        .single()

      if (error) {
        console.error('❌ [StaffRealtime] 완전한 직원 데이터 조회 실패:', error)
        return
      }

      // 타입 안전성을 위한 데이터 변환
      const transformedStaffData = {
        ...fullStaffData,
        user: fullStaffData.user_profiles,
        role: fullStaffData.tenant_roles
      }

      const updatedInstructor = transformedStaffData as unknown as Instructor

      // React Query 캐시 업데이트 - 목록
      queryClient.setQueryData(instructorQueryKeys.lists(), (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          instructors: oldData.instructors.map((instructor: Instructor) =>
            instructor.id === newRecord.id ? updatedInstructor : instructor
          )
        }
      })

      // React Query 캐시 업데이트 - 상세
      queryClient.setQueryData(
        instructorQueryKeys.detail(newRecord.id),
        updatedInstructor
      )

      // 상태 변경 감지 및 알림
      const statusChanged = oldRecord.status !== newRecord.status
      if (statusChanged) {
        const statusText = getStatusText(newRecord.status)
        const staffName = transformedStaffData.user_profiles?.name || '직원'

        toast.success(`${staffName}님의 상태가 "${statusText}"로 변경되었습니다`, {
          duration: 3000,
          icon: '🔄'
        })
      }

      // 검색 캐시 무효화
      queryClient.invalidateQueries({ 
        queryKey: ['instructors-search'] 
      })
    }

    /**
     * 직원 삭제 이벤트 처리
     */
    async function handleStaffDelete(oldRecord: any) {
      console.log('🗑️ [StaffRealtime] 직원 삭제:', oldRecord.id)

      // React Query 캐시 업데이트
      queryClient.setQueryData(instructorQueryKeys.lists(), (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          instructors: oldData.instructors.filter(
            (instructor: Instructor) => instructor.id !== oldRecord.id
          ),
          pagination: {
            ...oldData.pagination,
            total: Math.max(0, oldData.pagination.total - 1)
          }
        }
      })

      // 상세 캐시 제거
      queryClient.removeQueries({
        queryKey: instructorQueryKeys.detail(oldRecord.id)
      })

      // 검색 캐시 무효화
      queryClient.invalidateQueries({ 
        queryKey: ['instructors-search'] 
      })

      // 삭제 알림
      toast.success('직원이 삭제되었습니다', {
        duration: 3000,
        icon: '👋'
      })
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      console.log('🧹 [StaffRealtime] 실시간 구독 정리')
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [tenantId, profile?.id, queryClient, supabase])

  return {
    isConnected: !!channelRef.current,
    tenantId
  }
}

/**
 * 상태 텍스트 변환 헬퍼
 */
function getStatusText(status: string): string {
  switch (status) {
    case 'active': return '활성'
    case 'inactive': return '비활성'
    case 'pending': return '대기중'
    default: return status
  }
}

/**
 * 사용법:
 * 
 * function StaffPage() {
 *   const { isConnected } = useStaffRealtime()
 *   
 *   return (
 *     <div>
 *       {isConnected && <RealtimeIndicator />}
 *       <StaffList />
 *     </div>
 *   )
 * }
 */