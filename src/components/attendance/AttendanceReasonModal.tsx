'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { X, Clock, LogOut, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DEFAULT_REASON_TEMPLATES } from '@/types/student-attendance.types'
import type { AttendanceReasonModalProps, AttendanceStatus } from '@/types/student-attendance.types'

export function AttendanceReasonModal({
  isOpen,
  studentName,
  status,
  onSubmit,
  onClose
}: AttendanceReasonModalProps) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getStatusText = (status: AttendanceStatus) => {
    switch (status) {
      case 'absent': return { text: '결석', color: 'destructive', icon: <X className="h-4 w-4" /> }
      case 'late': return { text: '지각', color: 'warning', icon: <Clock className="h-4 w-4" /> }
      case 'early_leave': return { text: '조퇴', color: 'secondary', icon: <LogOut className="h-4 w-4" /> }
      default: return { text: '미체크', color: 'outline', icon: null }
    }
  }

  const statusInfo = getStatusText(status)
  const currentTemplates = DEFAULT_REASON_TEMPLATES[status] || []

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit(reason.trim() || undefined)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {statusInfo.icon}
            {statusInfo.text} 사유 입력
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{studentName}</span> 학생의 {statusInfo.text} 사유를 입력해주세요.
            <br />사유를 입력하지 않아도 저장됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 빠른 선택 템플릿 */}
          {currentTemplates.length > 0 && (
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                빠른 선택
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {currentTemplates.map((template) => (
                  <Button
                    key={template}
                    variant="outline"
                    size="sm"
                    onClick={() => setReason(template)}
                    className="justify-start text-xs h-8"
                  >
                    {template}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* 직접 입력 */}
          <div>
            <Label htmlFor="reason" className="text-sm text-muted-foreground mb-2 block">
              직접 입력
            </Label>
            <Textarea
              id="reason"
              placeholder={`${statusInfo.text} 사유를 입력하세요... (선택사항)`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] resize-none"
              maxLength={200}
              autoFocus
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-muted-foreground">
                Enter로 빠른 저장 • Esc로 취소
              </span>
              <span className="text-xs text-muted-foreground">
                {reason.length}/200
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={cn(
              statusInfo.color === 'destructive' && "bg-destructive hover:bg-destructive/90",
              statusInfo.color === 'warning' && "bg-warning hover:bg-warning/90 text-warning-foreground",
              statusInfo.color === 'secondary' && "bg-secondary hover:bg-secondary/90"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                저장중...
              </>
            ) : (
              <>
                {statusInfo.icon}
                <span className="ml-2">{statusInfo.text} 처리</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}