'use client'

import React, { memo, useCallback, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/Loading'
import { StudentSearchSelector, StudentSearchResult } from '@/components/ui/StudentSearchSelector'
import { 
  UserPlusIcon, 
  XMarkIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import { useAuthStore } from '@/store/useAuthStore'
import { toast } from 'sonner'

/**
 * 등록된 학생 정보 타입
 */
export interface EnrolledStudent {
  id: string
  enrollment_id: string
  name: string
  student_number: string
  email?: string | null
  phone?: string | null
  parent_name?: string | null
  parent_phone_1?: string | null
  grade?: string | null
  status: 'active' | 'inactive' | 'graduated' | 'suspended'
  enrollment_status: 'active' | 'completed' | 'expired' | 'cancelled'
  enrollment_date: string
  final_price: number
  package_name?: string | null
}

/**
 * ClassStudentManager Props
 */
export interface ClassStudentManagerProps {
  /** 클래스 ID */
  classId: string
  /** 클래스 이름 */
  className: string
  /** 초기 등록된 학생 목록 */
  initialStudents?: EnrolledStudent[]
  /** 학생 목록 변경 콜백 */
  onStudentsChange?: (students: EnrolledStudent[]) => void
  /** 읽기 전용 모드 */
  readOnly?: boolean
  /** 추가 CSS 클래스 */
  additionalClassName?: string
}

/**
 * ClassStudentManager - 클래스 학생 등록 관리 컴포넌트
 * 
 * 특징:
 * - 클래스에 등록된 학생 목록 표시
 * - 새 학생 검색 및 등록
 * - 학생 등록 해제
 * - 실시간 등록 상태 업데이트
 * - 수강권 패키지 정보 표시
 */
export const ClassStudentManager = memo<ClassStudentManagerProps>(({
  classId,
  className: classNameProp,
  initialStudents = [],
  onStudentsChange,
  readOnly = false,
  additionalClassName
}) => {
  // 상태 관리
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>(initialStudents)
  const [loading, setLoading] = useState(false)
  const [showStudentSelector, setShowStudentSelector] = useState(false)
  const [processingEnrollment, setProcessingEnrollment] = useState<string | null>(null)

  // 인증 정보
  const { profile: userProfile } = useAuthStore()
  const tenantId = userProfile?.tenant_id

  // Supabase 클라이언트
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 등록된 학생 목록 로드
  const loadEnrolledStudents = useCallback(async () => {
    if (!tenantId || !classId) return

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('인증 토큰이 없습니다')
        return
      }

      const response = await fetch(`/api/enrollments?classId=${classId}&tenantId=${tenantId}&includeStudent=true`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('등록된 학생 목록 로드 실패')
      }

      const data = await response.json()
      
      if (data.success && data.data && Array.isArray(data.data.enrollments)) {
        const students: EnrolledStudent[] = data.data.enrollments.map((enrollment: any) => ({
          id: enrollment.student_id,
          enrollment_id: enrollment.id,
          name: enrollment.students?.name || '알 수 없음',
          student_number: enrollment.students?.student_number || '',
          email: enrollment.students?.email,
          phone: enrollment.students?.phone,
          parent_name: enrollment.students?.parent_name,
          parent_phone_1: enrollment.students?.parent_phone_1,
          grade: enrollment.students?.grade,
          status: enrollment.students?.status || 'active',
          enrollment_status: enrollment.status,
          enrollment_date: enrollment.enrollment_date,
          final_price: enrollment.final_price,
          package_name: enrollment.course_packages?.name
        }))

        setEnrolledStudents(students)
        onStudentsChange?.(students)
      } else {
        console.error('등록된 학생 목록 응답 오류:', data)
      }
    } catch (error) {
      console.error('등록된 학생 목록 로드 중 오류:', error)
      toast.error('등록된 학생 목록을 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }, [tenantId, classId, supabase.auth, onStudentsChange])

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    if (classId && tenantId) {
      loadEnrolledStudents()
    }
  }, [classId, tenantId, loadEnrolledStudents])

  // 학생 등록 처리
  const handleStudentsSelected = useCallback(async (selectedStudents: StudentSearchResult[]) => {
    if (!tenantId || !classId || selectedStudents.length === 0) return

    setProcessingEnrollment('bulk')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('인증 토큰이 없습니다')
      }

      // 각 학생에 대해 순차적으로 등록 요청 (position 중복 방지)
      const results = []
      
      for (const student of selectedStudents) {
        try {
          const response = await fetch('/api/enrollments', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              tenantId,
              studentId: student.id,
              classId,
              // 기본 패키지 정보 (실제로는 선택 UI에서 받아야 함)
              packageId: null, // 추후 패키지 선택 기능 추가
              finalPrice: 0,
              notes: `클래스 ${classNameProp}에 등록`
            })
          })

          if (!response.ok) {
            const errorData = await response.json()
            results.push({ 
              status: 'rejected', 
              reason: new Error(errorData.error || `${student.name} 등록 실패`),
              student 
            })
          } else {
            const data = await response.json()
            results.push({ status: 'fulfilled', value: data, student })
          }
        } catch (error) {
          results.push({ 
            status: 'rejected', 
            reason: error,
            student 
          })
        }
      }
      
      let successCount = 0
      let failureCount = 0
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++
        } else {
          failureCount++
          const studentName = selectedStudents[index]?.name || '알 수 없는 학생'
          console.error(`${studentName} 등록 실패:`, result.reason)
        }
      })

      if (successCount > 0) {
        toast.success(`${successCount}명의 학생이 성공적으로 등록되었습니다`)
        // 목록 새로고침
        await loadEnrolledStudents()
      }

      if (failureCount > 0) {
        toast.error(`${failureCount}명의 학생 등록이 실패했습니다`)
      }

    } catch (error) {
      console.error('학생 등록 처리 중 오류:', error)
      toast.error('학생 등록에 실패했습니다')
    } finally {
      setProcessingEnrollment(null)
      setShowStudentSelector(false)
    }
  }, [tenantId, classId, classNameProp, supabase.auth, loadEnrolledStudents])

  // 학생 등록 해제
  const handleUnenrollStudent = useCallback(async (enrollmentId: string, studentName: string) => {
    if (!tenantId || !enrollmentId) return

    if (!confirm(`${studentName} 학생의 등록을 해제하시겠습니까?`)) {
      return
    }

    setProcessingEnrollment(enrollmentId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('인증 토큰이 없습니다')
      }

      const response = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tenantId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '등록 해제 실패')
      }

      toast.success(`${studentName} 학생의 등록이 해제되었습니다`)
      // 목록 새로고침
      await loadEnrolledStudents()

    } catch (error) {
      console.error('학생 등록 해제 중 오류:', error)
      toast.error('등록 해제에 실패했습니다')
    } finally {
      setProcessingEnrollment(null)
    }
  }, [tenantId, supabase.auth, loadEnrolledStudents])

  // 등록 상태 뱃지 색상
  const getEnrollmentStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'completed': return 'secondary'
      case 'expired': return 'destructive'
      case 'cancelled': return 'outline'
      default: return 'outline'
    }
  }

  // 등록 상태 텍스트
  const getEnrollmentStatusText = (status: string) => {
    switch (status) {
      case 'active': return '수강중'
      case 'completed': return '수강완료'
      case 'expired': return '만료'
      case 'cancelled': return '취소'
      default: return status
    }
  }

  // 등록된 학생 ID 목록 (중복 방지용)
  const enrolledStudentIds = enrolledStudents.map(s => s.id)

  return (
    <div className={`space-y-4 ${additionalClassName || ''}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AcademicCapIcon className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">
            등록된 학생 ({enrolledStudents.length}명)
          </h3>
        </div>
        
        {!readOnly && (
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setShowStudentSelector(true)}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <UserPlusIcon className="w-4 h-4" />
            학생 추가
          </Button>
        )}
      </div>

      {/* 학생 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loading size="sm" />
          <span className="ml-2 text-gray-500">등록된 학생을 불러오는 중...</span>
        </div>
      ) : enrolledStudents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <AcademicCapIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">등록된 학생이 없습니다</h4>
          <p className="text-gray-500 mb-4">클래스에 학생을 추가해보세요</p>
          {!readOnly && (
            <Button 
              variant="default"
              onClick={() => setShowStudentSelector(true)}
              className="flex items-center gap-2 mx-auto"
            >
              <UserPlusIcon className="w-4 h-4" />
              첫 번째 학생 추가
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {enrolledStudents.map((student) => (
            <div 
              key={`${student.id}-${student.enrollment_id}`}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900">
                      {student.name}
                    </h4>
                    <Badge variant={getEnrollmentStatusVariant(student.enrollment_status)}>
                      {getEnrollmentStatusText(student.enrollment_status)}
                    </Badge>
                    {student.grade && (
                      <Badge variant="outline">
                        {student.grade}학년
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>학번: {student.student_number}</p>
                    {student.phone && (
                      <p>전화번호: {student.phone}</p>
                    )}
                    {student.parent_name && student.parent_phone_1 && (
                      <p>학부모: {student.parent_name} ({student.parent_phone_1})</p>
                    )}
                    <p>등록일: {new Date(student.enrollment_date).toLocaleDateString()}</p>
                    {student.package_name && (
                      <p>수강권: {student.package_name}</p>
                    )}
                    {student.final_price > 0 && (
                      <p>수강료: {student.final_price.toLocaleString()}원</p>
                    )}
                  </div>
                </div>
                
                {!readOnly && (
                  <div className="ml-4 flex items-center gap-2">
                    {processingEnrollment === student.enrollment_id ? (
                      <Loading size="sm" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnenrollStudent(student.enrollment_id, student.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              {student.enrollment_status === 'expired' && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-sm text-red-700">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  수강권이 만료되었습니다. 갱신이 필요합니다.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 학생 검색 및 선택 Modal */}
      <StudentSearchSelector
        isOpen={showStudentSelector}
        onClose={() => setShowStudentSelector(false)}
        onStudentsSelected={handleStudentsSelected}
        allowMultiple={true}
        excludeStudentIds={enrolledStudentIds}
        filterByStatus="active"
        title="클래스에 학생 추가"
        description={`${classNameProp} 클래스에 등록할 학생을 선택하세요`}
      />

      {/* 대량 등록 처리 중 표시 */}
      {processingEnrollment === 'bulk' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <Loading size="sm" />
            <span>학생들을 등록하고 있습니다...</span>
          </div>
        </div>
      )}
    </div>
  )
})

ClassStudentManager.displayName = 'ClassStudentManager'