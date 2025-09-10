'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import type { Student } from '@/types/student.types'

interface ConflictResolutionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentData: Student
  conflictingData: Partial<Student>
  onResolve: (resolution: 'overwrite' | 'merge' | 'cancel') => void
}

/**
 * 버전 충돌 해결 UI 컴포넌트
 * 
 * 두 사용자가 동시에 같은 학생 데이터를 수정했을 때
 * 어떤 변경사항을 적용할지 선택하는 모달
 */
export function ConflictResolutionModal({
  open,
  onOpenChange,
  currentData,
  conflictingData,
  onResolve
}: ConflictResolutionModalProps) {
  // 변경된 필드 감지
  const getChangedFields = () => {
    const changes: { field: string; label: string; current: any; conflicting: any }[] = []
    
    const fieldLabels: Record<string, string> = {
      name: '이름',
      student_number: '학번',
      email: '이메일',
      phone: '전화번호',
      parent_name_1: '학부모1 이름',
      parent_phone_1: '학부모1 전화번호',
      grade_level: '학년',
      status: '상태',
      notes: '메모'
    }

    Object.keys(conflictingData).forEach(field => {
      if (field in fieldLabels && currentData[field as keyof Student] !== conflictingData[field as keyof Partial<Student>]) {
        changes.push({
          field,
          label: fieldLabels[field],
          current: currentData[field as keyof Student],
          conflicting: conflictingData[field as keyof Partial<Student>]
        })
      }
    })

    return changes
  }

  const changes = getChangedFields()

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'boolean') return value ? '예' : '아니오'
    return String(value)
  }

  const formatTimestamp = (timestamp: string | null): string => {
    if (!timestamp) return '-'
    return new Date(timestamp).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <DialogTitle>데이터 충돌 발생</DialogTitle>
              <DialogDescription>
                다른 사용자가 동시에 이 학생의 정보를 수정했습니다. 
                어떤 변경사항을 적용할지 선택해주세요.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* 학생 기본 정보 */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <UserIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <h3 className="font-medium text-gray-900">{currentData.name}</h3>
                  <p className="text-sm text-gray-500">
                    학번: {currentData.student_number || '-'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <ClockIcon className="w-4 h-4" />
                  마지막 수정: {formatTimestamp(currentData.updated_at)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 충돌된 필드들 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              충돌된 필드 ({changes.length}개)
            </h4>
            
            <div className="space-y-3">
              {changes.map((change, index) => (
                <Card key={change.field} className="border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-orange-700 border-orange-300">
                        {change.label}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">현재 값 (서버)</p>
                        <p className="text-sm font-medium bg-blue-50 p-2 rounded border">
                          {formatValue(change.current)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">변경 요청 값</p>
                        <p className="text-sm font-medium bg-yellow-50 p-2 rounded border">
                          {formatValue(change.conflicting)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* 해결 방법 안내 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">해결 방법</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <strong>현재 값 유지:</strong> 서버의 최신 데이터를 유지하고 내 변경사항을 취소합니다.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <strong>내 변경사항 적용:</strong> 다른 사용자의 변경사항을 덮어쓰고 내 변경사항을 적용합니다.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full mt-2"></div>
                <div>
                  <strong>취소:</strong> 변경사항을 저장하지 않고 다시 수정합니다.
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onResolve('cancel')}
          >
            취소
          </Button>
          <Button
            variant="outline"
            onClick={() => onResolve('merge')}
          >
            현재 값 유지
          </Button>
          <Button
            onClick={() => onResolve('overwrite')}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            내 변경사항 적용
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}