'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  StarIcon,
  UserIcon,
  PlusIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { formatDate } from '@/lib/utils'

interface StaffEvaluationSystemProps {
  staffId?: string
  staffName?: string
  className?: string
}

interface EvaluationFormData {
  membership_id: string
  evaluation_date: string
  content: string
  rating: number
  visibility: 'admin_only' | 'managers'
}

export default function StaffEvaluationSystem({
  staffId,
  staffName,
  className
}: StaffEvaluationSystemProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null)

  // 임시 데이터 (실제로는 API에서 가져와야 함)
  const evaluations = [
    {
      id: '1',
      evaluation_date: '2024-09-01',
      rating: 4,
      content: '성실하고 책임감 있게 업무를 수행하고 있습니다. 학생들과의 소통도 원활하며, 수업 준비도 철저합니다.',
      visibility: 'admin_only',
      evaluator: { user_profiles: { name: '김관리자' } },
      created_at: '2024-09-01T09:00:00Z'
    },
    {
      id: '2',
      evaluation_date: '2024-06-01',
      rating: 5,
      content: '탁월한 교육 능력을 보여주고 있습니다. 학생들의 성적 향상이 눈에 띄며, 동료들과의 협업도 우수합니다.',
      visibility: 'admin_only',
      evaluator: { user_profiles: { name: '이매니저' } },
      created_at: '2024-06-01T14:30:00Z'
    }
  ]

  const averageRating = evaluations.length > 0 
    ? evaluations.reduce((sum, eval) => sum + eval.rating, 0) / evaluations.length
    : 0

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <DocumentTextIcon className="h-6 w-6" />
            직원 평가 시스템
          </h2>
          <p className="text-muted-foreground">
            {staffName ? `${staffName} 직원의 평가 기록` : '직원 평가를 관리합니다'}
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              새 평가 작성
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>직원 평가 작성</DialogTitle>
              <DialogDescription>
                직원의 업무 성과와 태도를 평가해주세요
              </DialogDescription>
            </DialogHeader>
            <EvaluationForm 
              staffId={staffId}
              onSave={() => setIsCreateDialogOpen(false)}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* 평가 현황 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-educanvas-100 dark:bg-educanvas-900 rounded-lg">
                <DocumentTextIcon className="h-5 w-5 text-educanvas-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 평가</p>
                <p className="text-2xl font-bold">{evaluations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-wisdom-100 dark:bg-wisdom-900 rounded-lg">
                <StarIcon className="h-5 w-5 text-wisdom-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">평균 평점</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold text-wisdom-600">
                    {averageRating.toFixed(1)}
                  </p>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIconSolid
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(averageRating)
                            ? 'text-wisdom-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-growth-100 dark:bg-growth-900 rounded-lg">
                <UserIcon className="h-5 w-5 text-growth-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">최근 평가</p>
                <p className="text-lg font-semibold text-growth-600">
                  {evaluations.length > 0 ? formatDate(evaluations[0].evaluation_date) : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">개선 필요</p>
                <p className="text-2xl font-bold text-muted-foreground">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 평가 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>평가 기록</CardTitle>
          <CardDescription>
            시간순으로 정렬된 평가 기록을 확인할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {evaluations.length === 0 ? (
            <div className="text-center py-8">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">아직 평가 기록이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {evaluations.map((evaluation) => (
                <EvaluationCard
                  key={evaluation.id}
                  evaluation={evaluation}
                  onView={setSelectedEvaluation}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 평가 상세 보기 다이얼로그 */}
      {selectedEvaluation && (
        <Dialog open={!!selectedEvaluation} onOpenChange={() => setSelectedEvaluation(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>평가 상세</DialogTitle>
              <DialogDescription>
                {formatDate(selectedEvaluation.evaluation_date)} 평가 내용
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">평점:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIconSolid
                      key={star}
                      className={`h-5 w-5 ${
                        star <= selectedEvaluation.rating
                          ? 'text-wisdom-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 font-medium">{selectedEvaluation.rating}/5</span>
                </div>
              </div>
              
              <div>
                <span className="text-sm text-muted-foreground">평가 내용:</span>
                <p className="mt-2 p-3 bg-muted rounded-lg">{selectedEvaluation.content}</p>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>평가자: {selectedEvaluation.evaluator.user_profiles.name}</span>
                <span>작성일: {formatDate(selectedEvaluation.created_at)}</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedEvaluation(null)}>
                닫기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// 평가 카드 컴포넌트
function EvaluationCard({ 
  evaluation, 
  onView 
}: {
  evaluation: any
  onView: (evaluation: any) => void
}) {
  return (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
         onClick={() => onView(evaluation)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3">
            <Badge variant="outline">
              {formatDate(evaluation.evaluation_date)}
            </Badge>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIconSolid
                  key={star}
                  className={`h-4 w-4 ${
                    star <= evaluation.rating
                      ? 'text-wisdom-500'
                      : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="ml-1 text-sm font-medium">{evaluation.rating}/5</span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {evaluation.content}
          </p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>평가자: {evaluation.evaluator.user_profiles.name}</span>
            <Badge variant="secondary" className="text-xs">
              {evaluation.visibility === 'admin_only' ? '관리자 전용' : '매니저 공개'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}

// 평가 폼 컴포넌트
function EvaluationForm({
  staffId,
  onSave,
  onCancel
}: {
  staffId?: string
  onSave: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<EvaluationFormData>({
    membership_id: staffId || '',
    evaluation_date: new Date().toISOString().split('T')[0],
    content: '',
    rating: 5,
    visibility: 'admin_only'
  })
  const [errors, setErrors] = useState<string[]>([])

  const updateField = (field: keyof EvaluationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors([])
  }

  const handleSave = () => {
    const newErrors: string[] = []
    
    if (!formData.membership_id) newErrors.push('직원을 선택해주세요.')
    if (!formData.evaluation_date) newErrors.push('평가 날짜를 선택해주세요.')
    if (!formData.content.trim()) newErrors.push('평가 내용을 입력해주세요.')
    if (formData.content.length < 10) newErrors.push('평가 내용을 10자 이상 입력해주세요.')
    
    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    // API 호출 로직 (실제 구현 필요)
    console.log('평가 저장:', formData)
    onSave()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="staff">직원 선택 *</Label>
          {staffId ? (
            <div className="p-3 bg-muted rounded-md">
              <span>선택된 직원</span>
            </div>
          ) : (
            <Select value={formData.membership_id} onValueChange={(value) => updateField('membership_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="직원을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff1">김영희 강사</SelectItem>
                <SelectItem value="staff2">박철수 강사</SelectItem>
                <SelectItem value="staff3">이민정 강사</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">평가 날짜 *</Label>
          <Input
            id="date"
            type="date"
            value={formData.evaluation_date}
            onChange={(e) => updateField('evaluation_date', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rating">평점 *</Label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIconSolid
              key={star}
              className={`h-6 w-6 cursor-pointer transition-colors ${
                star <= formData.rating
                  ? 'text-wisdom-500'
                  : 'text-gray-300 hover:text-wisdom-300'
              }`}
              onClick={() => updateField('rating', star)}
            />
          ))}
          <span className="ml-2 text-sm text-muted-foreground">{formData.rating}/5</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">평가 내용 *</Label>
        <Textarea
          id="content"
          placeholder="직원의 업무 성과, 태도, 개선점 등을 구체적으로 작성해주세요..."
          value={formData.content}
          onChange={(e) => updateField('content', e.target.value)}
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          {formData.content.length}/500자 (최소 10자)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="visibility">공개 범위</Label>
        <Select value={formData.visibility} onValueChange={(value) => updateField('visibility', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin_only">관리자 전용</SelectItem>
            <SelectItem value="managers">매니저 공개</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button onClick={handleSave}>
          평가 저장
        </Button>
      </DialogFooter>
    </div>
  )
}