'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CogIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { 
  useSalaryPolicies, 
  useCreateSalaryPolicy, 
  useUpdateSalaryPolicy, 
  useDeleteSalaryPolicy,
  createDefaultPolicyByType,
  validateSalaryPolicy
} from '@/hooks/useSalary'
import { formatCurrency } from '@/lib/utils'
import type { SalaryPolicy, SalaryPolicyType } from '@/types/salary.types'

interface SalaryPolicyManagerProps {
  className?: string
}

const POLICY_TYPE_LABELS: Record<SalaryPolicyType, string> = {
  fixed_monthly: '고정 월급제',
  fixed_hourly: '시급제',
  commission: '수수료제',
  tiered_commission: '누진 수수료제',
  student_based: '학생수 기준제',
  hybrid: '혼합형',
  guaranteed_minimum: '최저 보장제'
}

const POLICY_TYPE_DESCRIPTIONS: Record<SalaryPolicyType, string> = {
  fixed_monthly: '매월 고정된 금액을 지급합니다',
  fixed_hourly: '실제 근무 시간에 따라 시급을 지급합니다',
  commission: '매출, 학생수, 시간 기준으로 일정 비율을 지급합니다',
  tiered_commission: '구간별로 다른 수수료율을 적용합니다',
  student_based: '담당 학생수에 따라 급여를 계산합니다',
  hybrid: '기본급과 성과급을 조합한 급여 체계입니다',
  guaranteed_minimum: '최소 보장액을 설정한 수수료제입니다'
}

export default function SalaryPolicyManager({ className }: SalaryPolicyManagerProps) {
  const [selectedPolicy, setSelectedPolicy] = useState<SalaryPolicy | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // API 훅들
  const { data: policiesData, isLoading } = useSalaryPolicies()
  const createPolicy = useCreateSalaryPolicy()
  const updatePolicy = useUpdateSalaryPolicy()
  const deletePolicy = useDeleteSalaryPolicy()

  const policies = policiesData?.policies || []
  const activePolicies = policies.filter(p => p.is_active)
  const inactivePolicies = policies.filter(p => !p.is_active)

  // 정책 생성 핸들러
  const handleCreatePolicy = async (policyData: Omit<SalaryPolicy, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
    try {
      await createPolicy.mutateAsync(policyData)
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('정책 생성 실패:', error)
    }
  }

  // 정책 수정 핸들러
  const handleUpdatePolicy = async (policyData: Partial<SalaryPolicy>) => {
    if (!selectedPolicy) return

    try {
      await updatePolicy.mutateAsync({ id: selectedPolicy.id, policy: policyData })
      setIsEditDialogOpen(false)
      setSelectedPolicy(null)
    } catch (error) {
      console.error('정책 수정 실패:', error)
    }
  }

  // 정책 삭제 핸들러
  const handleDeletePolicy = async () => {
    if (!selectedPolicy) return

    try {
      await deletePolicy.mutateAsync(selectedPolicy.id)
      setIsDeleteDialogOpen(false)
      setSelectedPolicy(null)
    } catch (error) {
      console.error('정책 삭제 실패:', error)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CogIcon className="h-6 w-6" />
            급여 정책 관리
          </h2>
          <p className="text-muted-foreground">
            다양한 급여 체계를 설정하고 관리합니다
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              새 정책 생성
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>새 급여 정책 생성</DialogTitle>
              <DialogDescription>
                7가지 급여 체계 중 하나를 선택하여 새로운 정책을 생성합니다
              </DialogDescription>
            </DialogHeader>
            <PolicyForm 
              onSave={handleCreatePolicy}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={createPolicy.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* 정책 현황 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-educanvas-100 dark:bg-educanvas-900 rounded-lg">
                <DocumentTextIcon className="h-5 w-5 text-educanvas-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">전체 정책</p>
                <p className="text-2xl font-bold">{policies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-growth-100 dark:bg-growth-900 rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-growth-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">활성 정책</p>
                <p className="text-2xl font-bold text-growth-600">{activePolicies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-wisdom-100 dark:bg-wisdom-900 rounded-lg">
                <CogIcon className="h-5 w-5 text-wisdom-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">정책 타입</p>
                <p className="text-2xl font-bold">{new Set(policies.map(p => p.type)).size}</p>
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
                <p className="text-sm text-muted-foreground">비활성 정책</p>
                <p className="text-2xl font-bold text-muted-foreground">{inactivePolicies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 정책 목록 */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">활성 정책 ({activePolicies.length})</TabsTrigger>
          <TabsTrigger value="inactive">비활성 정책 ({inactivePolicies.length})</TabsTrigger>
          <TabsTrigger value="templates">정책 템플릿</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <PolicyList 
            policies={activePolicies}
            onEdit={(policy) => {
              setSelectedPolicy(policy)
              setIsEditDialogOpen(true)
            }}
            onDelete={(policy) => {
              setSelectedPolicy(policy)
              setIsDeleteDialogOpen(true)
            }}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <PolicyList 
            policies={inactivePolicies}
            onEdit={(policy) => {
              setSelectedPolicy(policy)
              setIsEditDialogOpen(true)
            }}
            onDelete={(policy) => {
              setSelectedPolicy(policy)
              setIsDeleteDialogOpen(true)
            }}
            isLoading={isLoading}
            showInactive
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <PolicyTemplates onCreateFromTemplate={handleCreatePolicy} />
        </TabsContent>
      </Tabs>

      {/* 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>급여 정책 수정</DialogTitle>
            <DialogDescription>
              {selectedPolicy?.name} 정책을 수정합니다
            </DialogDescription>
          </DialogHeader>
          {selectedPolicy && (
            <PolicyForm 
              policy={selectedPolicy}
              onSave={handleUpdatePolicy}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedPolicy(null)
              }}
              isLoading={updatePolicy.isPending}
              isEditing
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정책 삭제 확인</DialogTitle>
            <DialogDescription>
              '{selectedPolicy?.name}' 정책을 삭제하시겠습니까?
              <br />
              <strong>이 작업은 되돌릴 수 없습니다.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedPolicy(null)
              }}
            >
              취소
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeletePolicy}
              disabled={deletePolicy.isPending}
            >
              {deletePolicy.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 정책 목록 컴포넌트
function PolicyList({ 
  policies, 
  onEdit, 
  onDelete, 
  isLoading, 
  showInactive = false 
}: {
  policies: SalaryPolicy[]
  onEdit: (policy: SalaryPolicy) => void
  onDelete: (policy: SalaryPolicy) => void
  isLoading: boolean
  showInactive?: boolean
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (policies.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center text-muted-foreground">
            <DocumentTextIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{showInactive ? '비활성' : '활성'} 정책이 없습니다</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {policies.map((policy) => (
        <Card key={policy.id} className={showInactive ? 'opacity-60' : ''}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{policy.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {POLICY_TYPE_LABELS[policy.type]}
                  </Badge>
                  {policy.is_active ? (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      활성
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs opacity-60">
                      비활성
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(policy)}
                  className="h-8 w-8 p-0"
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(policy)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm">
              {policy.base_amount && (
                <div className="flex justify-between">
                  <span>기본급</span>
                  <span className="font-medium">{formatCurrency(policy.base_amount)}</span>
                </div>
              )}
              {policy.hourly_rate && (
                <div className="flex justify-between">
                  <span>시급</span>
                  <span className="font-medium">{formatCurrency(policy.hourly_rate)}</span>
                </div>
              )}
              {policy.commission_rate && (
                <div className="flex justify-between">
                  <span>수수료율</span>
                  <span className="font-medium">{policy.commission_rate}%</span>
                </div>
              )}
              {policy.student_rate && (
                <div className="flex justify-between">
                  <span>학생당 단가</span>
                  <span className="font-medium">{formatCurrency(policy.student_rate)}</span>
                </div>
              )}
              {policy.minimum_guaranteed && (
                <div className="flex justify-between">
                  <span>최소 보장</span>
                  <span className="font-medium text-growth-600">{formatCurrency(policy.minimum_guaranteed)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// 정책 템플릿 컴포넌트
function PolicyTemplates({ 
  onCreateFromTemplate 
}: { 
  onCreateFromTemplate: (policy: Omit<SalaryPolicy, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => void 
}) {
  const policyTypes: SalaryPolicyType[] = [
    'fixed_monthly', 'fixed_hourly', 'commission', 'tiered_commission',
    'student_based', 'hybrid', 'guaranteed_minimum'
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {policyTypes.map((type) => (
        <Card key={type} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">{POLICY_TYPE_LABELS[type]}</CardTitle>
            <CardDescription>{POLICY_TYPE_DESCRIPTIONS[type]}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                const defaultPolicy = createDefaultPolicyByType(type)
                onCreateFromTemplate(defaultPolicy as any)
              }}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              템플릿으로 생성
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// 정책 폼 컴포넌트
function PolicyForm({ 
  policy, 
  onSave, 
  onCancel, 
  isLoading = false, 
  isEditing = false 
}: {
  policy?: SalaryPolicy
  onSave: (policy: any) => void
  onCancel: () => void
  isLoading?: boolean
  isEditing?: boolean
}) {
  const [formData, setFormData] = useState<Partial<SalaryPolicy>>(
    policy || createDefaultPolicyByType('fixed_monthly')
  )
  const [errors, setErrors] = useState<string[]>([])

  const updateField = (field: keyof SalaryPolicy, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors([])
  }

  const handleSave = () => {
    const validation = validateSalaryPolicy(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    onSave(formData)
  }

  return (
    <div className="space-y-6">
      {/* 기본 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">정책명 *</Label>
          <Input
            id="name"
            value={formData.name || ''}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="급여 정책 이름을 입력하세요"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">정책 타입 *</Label>
          <Select 
            value={formData.type || ''} 
            onValueChange={(value) => updateField('type', value as SalaryPolicyType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="정책 타입을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(POLICY_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 타입별 설정 */}
      {formData.type && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {POLICY_TYPE_LABELS[formData.type]} 설정
            </CardTitle>
            <CardDescription>
              {POLICY_TYPE_DESCRIPTIONS[formData.type]}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PolicyTypeFields 
              type={formData.type}
              data={formData}
              onChange={updateField}
            />
          </CardContent>
        </Card>
      )}

      {/* 활성 상태 */}
      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active ?? true}
          onCheckedChange={(checked) => updateField('is_active', checked)}
        />
        <Label htmlFor="is_active">정책 활성화</Label>
      </div>

      {/* 에러 표시 */}
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

      {/* 버튼 */}
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (isEditing ? '수정 중...' : '생성 중...') : (isEditing ? '수정' : '생성')}
        </Button>
      </DialogFooter>
    </div>
  )
}

// 정책 타입별 필드 컴포넌트
function PolicyTypeFields({ 
  type, 
  data, 
  onChange 
}: {
  type: SalaryPolicyType
  data: Partial<SalaryPolicy>
  onChange: (field: keyof SalaryPolicy, value: any) => void
}) {
  switch (type) {
    case 'fixed_monthly':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="base_amount">기본급 (원) *</Label>
            <Input
              id="base_amount"
              type="number"
              value={data.base_amount || ''}
              onChange={(e) => onChange('base_amount', parseFloat(e.target.value) || 0)}
              placeholder="2500000"
            />
          </div>
        </div>
      )

    case 'fixed_hourly':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hourly_rate">시급 (원) *</Label>
            <Input
              id="hourly_rate"
              type="number"
              value={data.hourly_rate || ''}
              onChange={(e) => onChange('hourly_rate', parseFloat(e.target.value) || 0)}
              placeholder="35000"
            />
          </div>
        </div>
      )

    case 'commission':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="commission_rate">수수료율 (%) *</Label>
              <Input
                id="commission_rate"
                type="number"
                min="0"
                max="100"
                value={data.commission_rate || ''}
                onChange={(e) => onChange('commission_rate', parseFloat(e.target.value) || 0)}
                placeholder="15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission_basis">수수료 기준 *</Label>
              <Select 
                value={data.commission_basis || ''} 
                onValueChange={(value) => onChange('commission_basis', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="기준 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">매출액</SelectItem>
                  <SelectItem value="students">학생수</SelectItem>
                  <SelectItem value="hours">수업시간</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )

    // 다른 타입들도 유사하게 구현...
    default:
      return (
        <Alert>
          <InformationCircleIcon className="h-4 w-4" />
          <AlertDescription>
            {POLICY_TYPE_LABELS[type]} 설정 폼은 준비 중입니다.
          </AlertDescription>
        </Alert>
      )
  }
}