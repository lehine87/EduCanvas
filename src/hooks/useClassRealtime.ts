/**
 * @file useClassRealtime.ts
 * @description 클래스 관리 실시간 동기화 Hook
 * @module T-V2-010 Class Management
 */

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
// import { classQueryKeys } from '@/lib/react-query' // TODO: Export 필요
import { useAuthStore } from '@/store/useAuthStore'
import type { Class } from '@/types/class.types'
import { toast } from 'react-hot-toast'

/**
 * 클래스 실시간 동기화 Hook
 * 
 * 기능:
 * - classes 테이블 실시간 구독
 * - 클래스 생성/수정/삭제 이벤트 처리
 * - React Query 캐시 자동 업데이트
 * - 사용자별 알림 시스템
 */
export function useClassRealtime() {
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()
  const supabase = createClient()
  const channelRef = useRef<any>(null)
  const tenantId = profile?.tenant_id

  useEffect(() => {
    if (!tenantId || !profile) {
      console.log('🔄 [ClassRealtime] 테넌트 ID 또는 프로필 없음, 구독 건너뜀')
      return
    }

    console.log('🚀 [ClassRealtime] 실시간 구독 시작:', { tenantId, userId: profile.id })

    // 기존 채널 정리
    if (channelRef.current) {
      console.log('🧹 [ClassRealtime] 기존 채널 정리')
      supabase.removeChannel(channelRef.current)
    }

    // 새 채널 생성 및 구독
    const channel = supabase
      .channel(`class-changes-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classes',
          filter: `tenant_id=eq.${tenantId}`,
        },
        async (payload) => {
          console.log('📡 [ClassRealtime] 클래스 데이터 변경 감지:', payload)
          
          try {
            await handleClassChange(payload)
          } catch (error) {
            console.error('❌ [ClassRealtime] 실시간 업데이트 처리 오류:', error)
            toast.error('실시간 업데이트 중 오류가 발생했습니다')
          }
        }
      )
      .subscribe((status) => {
        console.log('📊 [ClassRealtime] 구독 상태 변경:', status)
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ [ClassRealtime] 실시간 구독 활성화됨')
          toast.success('실시간 동기화가 활성화되었습니다', { 
            duration: 2000,
            position: 'bottom-left' 
          })
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [ClassRealtime] 구독 오류 발생')
          toast.error('실시간 동기화 연결에 실패했습니다')
        }
      })

    channelRef.current = channel

    /**
     * 클래스 데이터 변경 이벤트 처리
     */
    async function handleClassChange(payload: any) {
      const { eventType, new: newRecord, old: oldRecord } = payload

      switch (eventType) {
        case 'INSERT':
          await handleClassInsert(newRecord)
          break
        case 'UPDATE':
          await handleClassUpdate(newRecord, oldRecord)
          break
        case 'DELETE':
          await handleClassDelete(oldRecord)
          break
        default:
          console.warn('⚠️ [ClassRealtime] 알 수 없는 이벤트 타입:', eventType)
      }
    }

    /**
     * 클래스 생성 이벤트 처리
     */
    async function handleClassInsert(newRecord: any) {
      console.log('➕ [ClassRealtime] 새 클래스 추가:', newRecord.id)

      // 강사 정보를 포함한 완전한 클래스 데이터 조회
      const { data: fullClassData, error } = await supabase
        .from('classes')
        .select(`
          *,
          instructor:tenant_memberships(
            id,
            user:user_profiles(*)
          )
        `)
        .eq('id', newRecord.id)
        .single()

      if (error) {
        console.error('❌ [ClassRealtime] 완전한 클래스 데이터 조회 실패:', error)
        return
      }

      // React Query 캐시 업데이트
      queryClient.setQueryData(['classes', 'lists'], (oldData: any) => {
        if (!oldData) return oldData

        const newClass = fullClassData as Class
        return {
          ...oldData,
          items: [newClass, ...oldData.items],
          pagination: {
            ...oldData.pagination,
            total_count: oldData.pagination.total_count + 1
          }
        }
      })

      // 검색 캐시도 무효화
      queryClient.invalidateQueries({ 
        queryKey: ['classes-search'] 
      })

      // 대시보드 통계 무효화
      queryClient.invalidateQueries({ 
        queryKey: ['classes', 'dashboard-stats'] 
      })

      // 사용자 알림 (자신이 생성한 경우 제외)
      if (newRecord.created_by !== profile.id) {
        const className = fullClassData.name || '새 클래스'
        toast.success(`"${className}" 클래스가 생성되었습니다`, {
          duration: 4000,
          icon: '📚'
        })
      }
    }

    /**
     * 클래스 수정 이벤트 처리
     */
    async function handleClassUpdate(newRecord: any, oldRecord: any) {
      console.log('✏️ [ClassRealtime] 클래스 정보 수정:', newRecord.id)

      // 강사 정보를 포함한 완전한 클래스 데이터 조회
      const { data: fullClassData, error } = await supabase
        .from('classes')
        .select(`
          *,
          instructor:tenant_memberships(
            id,
            user:user_profiles(*)
          )
        `)
        .eq('id', newRecord.id)
        .single()

      if (error) {
        console.error('❌ [ClassRealtime] 완전한 클래스 데이터 조회 실패:', error)
        return
      }

      const updatedClass = fullClassData as Class

      // React Query 캐시 업데이트 - 목록
      queryClient.setQueryData(['classes', 'lists'], (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          items: oldData.items.map((classItem: Class) =>
            classItem.id === newRecord.id ? updatedClass : classItem
          )
        }
      })

      // React Query 캐시 업데이트 - 상세
      queryClient.setQueryData(
        ['classes', 'detail', newRecord.id],
        updatedClass
      )

      // 상태 변경 감지 및 알림
      const statusChanged = oldRecord.status !== newRecord.status
      const nameChanged = oldRecord.name !== newRecord.name
      
      if (statusChanged || nameChanged) {
        const className = updatedClass.name || '클래스'
        let message = `"${className}" 클래스가 수정되었습니다`
        
        if (statusChanged) {
          const statusText = getStatusText(newRecord.status)
          message = `"${className}" 클래스 상태가 "${statusText}"로 변경되었습니다`
        }
        
        toast.success(message, {
          duration: 3000,
          icon: '🔄'
        })
      }

      // 검색 캐시 무효화
      queryClient.invalidateQueries({ 
        queryKey: ['classes-search'] 
      })

      // 대시보드 통계 무효화 (상태 변경 시)
      if (statusChanged) {
        queryClient.invalidateQueries({ 
          queryKey: ['classes', 'dashboard-stats'] 
        })
      }
    }

    /**
     * 클래스 삭제 이벤트 처리
     */
    async function handleClassDelete(oldRecord: any) {
      console.log('🗑️ [ClassRealtime] 클래스 삭제:', oldRecord.id)

      // React Query 캐시 업데이트
      queryClient.setQueryData(['classes', 'lists'], (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          items: oldData.items.filter(
            (classItem: Class) => classItem.id !== oldRecord.id
          ),
          pagination: {
            ...oldData.pagination,
            total_count: Math.max(0, oldData.pagination.total_count - 1)
          }
        }
      })

      // 상세 캐시 제거
      queryClient.removeQueries({
        queryKey: ['classes', 'detail', oldRecord.id]
      })

      // 검색 캐시 무효화
      queryClient.invalidateQueries({ 
        queryKey: ['classes-search'] 
      })

      // 대시보드 통계 무효화
      queryClient.invalidateQueries({ 
        queryKey: ['classes', 'dashboard-stats'] 
      })

      // 삭제 알림
      const className = oldRecord.name || '클래스'
      toast.success(`"${className}" 클래스가 삭제되었습니다`, {
        duration: 3000,
        icon: '🗑️'
      })
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      console.log('🧹 [ClassRealtime] 실시간 구독 정리')
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
    case 'completed': return '완료됨'
    default: return status
  }
}

/**
 * 사용법:
 * 
 * function ClassPage() {
 *   const { isConnected } = useClassRealtime()
 *   
 *   return (
 *     <div>
 *       {isConnected && <RealtimeIndicator />}
 *       <ClassList />
 *     </div>
 *   )
 * }
 */