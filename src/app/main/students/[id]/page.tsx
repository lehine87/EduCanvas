'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useStudentsStore } from '@/store/studentsStore'
import { useAuthStore } from '@/store/useAuthStore'
import StudentsPageLayout from '@/components/students/StudentsPageLayout'
import type { Student } from '@/types/student.types'
import { authClient } from '@/lib/auth/authClient'


export default function StudentDetailPage() {
  const params = useParams()
  // ✅ 개선: 지속된 데이터도 함께 사용하여 즉시 렌더링
  const { profile, loading: authLoading, initialized, effectiveProfile } = useAuthStore()
  const { students, loading, actions } = useStudentsStore()
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  
  const studentId = params.id as string
  // ✅ 개선: 실제 프로필 또는 지속된 프로필에서 tenant_id 가져오기
  const tenantId = effectiveProfile?.tenant_id
  
  console.log('🏠 [DYNAMIC-ROUTE] 페이지 렌더링:', { 
    studentId, 
    tenantId, 
    hasProfile: !!profile,
    hasEffectiveProfile: !!effectiveProfile,
    profileState: profile,
    effectiveProfileState: effectiveProfile,
    authLoading,
    initialized
  })

  // ✅ 개선된 학생 정보 로드 (지속 데이터 활용)
  useEffect(() => {
    if (!studentId) return

    // ✅ 개선: 지속된 프로필이 있으면 초기화를 기다리지 않고 즉시 진행
    const shouldWaitForAuth = !effectiveProfile && (!initialized || authLoading)
    if (shouldWaitForAuth) {
      console.log('⏳ 인증 상태 로딩 중:', { 
        initialized, 
        authLoading, 
        hasEffectiveProfile: !!effectiveProfile 
      })
      return
    }
    
    console.log('🔍 학생 정보 로드 시작:', { 
      studentId, 
      tenantId, 
      studentsCount: students.length,
      hasEffectiveProfile: !!effectiveProfile
    })
    
    // 1. 먼저 스토어에서 찾기 (즉시 표시)
    const cachedStudent = students.find(s => s.id === studentId)
    if (cachedStudent) {
      console.log('✅ 캐시된 학생 정보 사용:', cachedStudent.name)
      setSelectedStudent(cachedStudent)
      return // 캐시된 데이터가 있으면 API 호출 생략
    }
    
    // 2. 캐시에 없으면 API 호출
    if (tenantId) {
      const fetchIndividualStudent = async () => {
        try {
          const session = await authClient.getCurrentSession()
          if (!session?.access_token) {
            console.error('❌ 인증 토큰이 없습니다')
            return
          }

          console.log('🌐 개별 학생 API 호출:', studentId)
          const response = await fetch(`/api/students/${studentId}`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            console.log('✅ 개별 학생 정보 로드 성공:', data.data.student?.name)
            setSelectedStudent(data.data.student)
          } else {
            console.error('❌ 개별 학생 정보 로드 실패:', response.status)
          }
        } catch (error) {
          console.error('❌ 개별 학생 정보 로드 에러:', error)
        }
      }
      
      fetchIndividualStudent()
    }
  }, [studentId, tenantId, initialized, authLoading, students, effectiveProfile])

  // 학생 선택 핸들러
  const handleStudentSelect = useCallback((student: Student) => {
    console.log('🔄 학생 선택:', student.name)
    setSelectedStudent(student)
  }, [])

  return (
    <StudentsPageLayout initialSelectedStudent={selectedStudent} />
  )
}