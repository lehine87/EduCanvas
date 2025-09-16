'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CalculatorIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { useSalaryPolicies, useSalaryPreview, useSaveSalaryCalculation } from '@/hooks/useSalary'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { SalaryCalculationRequest, SalaryCalculationResult, SalaryPolicy } from '@/types/salary.types'

interface SalaryCalculatorDashboardProps {
  instructorId?: string
  instructorName?: string
  className?: string
}

interface CalculatorForm {
  instructor_id: string
  month: string
  policy_id?: string
}

export default function SalaryCalculatorDashboard({
  instructorId,
  instructorName,
  className
}: SalaryCalculatorDashboardProps) {
  const [form, setForm] = useState<CalculatorForm>({
    instructor_id: instructorId || '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    policy_id: undefined
  })
  
  const [calculationResult, setCalculationResult] = useState<SalaryCalculationResult | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  // API 훅들
  const { data: policiesData, isLoading: loadingPolicies } = useSalaryPolicies({ active: true })
  const salaryPreview = useSalaryPreview()
  const saveSalaryCalculation = useSaveSalaryCalculation()

  const policies = policiesData?.policies || []

  // 폼 업데이트
  const updateForm = (field: keyof CalculatorForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors([])
  }

  // 폼 검증
  const validateForm = (): boolean => {
    const newErrors: string[] = []
    
    if (!form.instructor_id) newErrors.push('강사를 선택해주세요.')
    if (!form.month) newErrors.push('계산 월을 선택해주세요.')
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  // 미리보기 계산
  const handlePreviewCalculation = async () => {
    if (!validateForm()) return

    try {
      const request: SalaryCalculationRequest = {
        instructor_id: form.instructor_id,
        month: form.month,
        policy_id: form.policy_id,
        preview_mode: true
      }

      const result = await salaryPreview.mutateAsync(request)
      setCalculationResult(result.calculation)
    } catch (error) {
      console.error('급여 계산 미리보기 실패:', error)
    }
  }

  // 계산 결과 저장
  const handleSaveCalculation = async () => {
    if (!calculationResult || !validateForm()) return

    try {
      const request: SalaryCalculationRequest & { preview_mode: false } = {
        instructor_id: form.instructor_id,
        month: form.month,
        policy_id: form.policy_id,
        preview_mode: false
      }

      await saveSalaryCalculation.mutateAsync(request)
      // 성공 알림 또는 리다이렉트 처리
    } catch (error) {
      console.error('급여 계산 저장 실패:', error)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalculatorIcon className="h-6 w-6" />
            급여 계산기
          </h2>
          <p className="text-muted-foreground">
            강사별 급여를 계산하고 관리합니다
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측: 계산 폼 */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">급여 계산 설정</CardTitle>
              <CardDescription>
                계산할 강사와 기간을 선택하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 강사 선택 */}
              <div className="space-y-2">
                <Label htmlFor="instructor">강사 선택</Label>
                {instructorId ? (
                  <div className="p-3 bg-muted rounded-md">
                    <span className="font-medium">{instructorName || '선택된 강사'}</span>
                  </div>
                ) : (
                  <Select value={form.instructor_id} onValueChange={(value) => updateForm('instructor_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="강사를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instructor1">김영희 강사</SelectItem>
                      <SelectItem value="instructor2">박철수 강사</SelectItem>
                      <SelectItem value="instructor3">이민정 강사</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* 계산 월 선택 */}
              <div className="space-y-2">
                <Label htmlFor="month">계산 월</Label>
                <Input
                  id="month"
                  type="month"
                  value={form.month}
                  onChange={(e) => updateForm('month', e.target.value)}
                />
              </div>

              {/* 급여 정책 선택 */}
              <div className="space-y-2">
                <Label htmlFor="policy">급여 정책 (선택)</Label>
                {loadingPolicies ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={form.policy_id || 'default'} onValueChange={(value) => updateForm('policy_id', value === 'default' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="기본 정책 사용" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">기본 정책 사용</SelectItem>
                      {policies.map((policy) => (
                        <SelectItem key={policy.id} value={policy.id}>
                          {policy.name} ({policy.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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

              {/* 계산 버튼 */}
              <div className="flex gap-2">
                <Button 
                  onClick={handlePreviewCalculation}
                  disabled={salaryPreview.isPending}
                  className="flex-1"
                >
                  {salaryPreview.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      계산 중...
                    </>
                  ) : (
                    <>
                      <CalculatorIcon className="h-4 w-4 mr-2" />
                      미리보기
                    </>
                  )}
                </Button>
                
                {calculationResult && (
                  <Button 
                    onClick={handleSaveCalculation}
                    disabled={saveSalaryCalculation.isPending}
                    variant="default"
                  >
                    {saveSalaryCalculation.isPending ? '저장 중...' : '저장'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 우측: 계산 결과 */}
        <div className="lg:col-span-2">
          {calculationResult ? (
            <SalaryCalculationResult result={calculationResult} />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <CalculatorIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>좌측에서 조건을 선택하고 계산을 실행하세요</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// 급여 계산 결과 컴포넌트
function SalaryCalculationResult({ result }: { result: SalaryCalculationResult }) {
  const policy = result.calculation_details.applied_policy

  return (
    <div className="space-y-4">
      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-educanvas-100 dark:bg-educanvas-900 rounded-lg">
                <CurrencyDollarIcon className="h-5 w-5 text-educanvas-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">실지급액</p>
                <p className="text-2xl font-bold text-educanvas-600">
                  {formatCurrency(result.net_salary)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-growth-100 dark:bg-growth-900 rounded-lg">
                <ChartBarIcon className="h-5 w-5 text-growth-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">기본급</p>
                <p className="text-xl font-semibold text-growth-600">
                  {formatCurrency(result.base_salary)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-wisdom-100 dark:bg-wisdom-900 rounded-lg">
                <UserGroupIcon className="h-5 w-5 text-wisdom-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">수수료</p>
                <p className="text-xl font-semibold text-wisdom-600">
                  {formatCurrency(result.commission_salary)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary rounded-lg">
                <ClockIcon className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 공제</p>
                <p className="text-xl font-semibold text-destructive">
                  -{formatCurrency(result.total_deductions)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 상세 정보 탭 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>급여 계산 상세</CardTitle>
              <CardDescription>
                {result.calculation_month} • {policy.name} ({policy.type})
              </CardDescription>
            </div>
            <Badge variant="secondary">
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              계산 완료
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="breakdown" className="space-y-4">
            <TabsList>
              <TabsTrigger value="breakdown">급여 구성</TabsTrigger>
              <TabsTrigger value="metrics">실적 데이터</TabsTrigger>
              <TabsTrigger value="policy">적용 정책</TabsTrigger>
            </TabsList>

            <TabsContent value="breakdown" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 급여 항목 */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    급여 항목
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>기본급</span>
                      <span className="font-medium">{formatCurrency(result.base_salary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>수수료</span>
                      <span className="font-medium">{formatCurrency(result.commission_salary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>초과 근무 수당</span>
                      <span className="font-medium">{formatCurrency(result.overtime_allowance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>특별 수당</span>
                      <span className="font-medium">{formatCurrency(result.special_allowances)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>총 급여</span>
                      <span>{formatCurrency(result.gross_salary)}</span>
                    </div>
                  </div>
                </div>

                {/* 공제 항목 */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    공제 항목
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>소득세</span>
                      <span className="font-medium text-destructive">-{formatCurrency(result.tax_deduction)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>4대 보험</span>
                      <span className="font-medium text-destructive">-{formatCurrency(result.insurance_deduction)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>기타 공제</span>
                      <span className="font-medium text-destructive">-{formatCurrency(result.other_deductions)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>총 공제</span>
                      <span className="text-destructive">-{formatCurrency(result.total_deductions)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />
              
              <div className="flex justify-between items-center p-4 bg-educanvas-50 dark:bg-educanvas-950 rounded-lg">
                <span className="text-lg font-semibold">실지급액</span>
                <span className="text-2xl font-bold text-educanvas-600">
                  {formatCurrency(result.net_salary)}
                </span>
              </div>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h5 className="font-medium">수업 실적</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>총 매출</span>
                      <span>{formatCurrency(result.calculation_details.metrics.total_revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>담당 학생</span>
                      <span>{result.calculation_details.metrics.total_students}명</span>
                    </div>
                    <div className="flex justify-between">
                      <span>수업 수</span>
                      <span>{result.calculation_details.metrics.total_classes}회</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h5 className="font-medium">근무 시간</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>총 근무</span>
                      <span>{result.calculation_details.metrics.total_hours}시간</span>
                    </div>
                    <div className="flex justify-between">
                      <span>정규 근무</span>
                      <span>{result.calculation_details.metrics.regular_hours}시간</span>
                    </div>
                    <div className="flex justify-between">
                      <span>초과 근무</span>
                      <span>{result.calculation_details.metrics.overtime_hours}시간</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium">기타</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>보너스 대상</span>
                      <span>{result.calculation_details.metrics.bonus_eligible ? '예' : '아니오'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>계산일시</span>
                      <span>{formatDate(result.calculated_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="policy" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{policy.type}</Badge>
                  <h4 className="font-semibold">{policy.name}</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h5 className="font-medium">기본 설정</h5>
                    <div className="space-y-2 text-sm">
                      {policy.base_amount && (
                        <div className="flex justify-between">
                          <span>기본급</span>
                          <span>{formatCurrency(policy.base_amount)}</span>
                        </div>
                      )}
                      {policy.hourly_rate && (
                        <div className="flex justify-between">
                          <span>시급</span>
                          <span>{formatCurrency(policy.hourly_rate)}</span>
                        </div>
                      )}
                      {policy.commission_rate && (
                        <div className="flex justify-between">
                          <span>수수료율</span>
                          <span>{policy.commission_rate}%</span>
                        </div>
                      )}
                      {policy.student_rate && (
                        <div className="flex justify-between">
                          <span>학생당 단가</span>
                          <span>{formatCurrency(policy.student_rate)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-medium">제한 설정</h5>
                    <div className="space-y-2 text-sm">
                      {policy.minimum_guaranteed && (
                        <div className="flex justify-between">
                          <span>최소 보장액</span>
                          <span>{formatCurrency(policy.minimum_guaranteed)}</span>
                        </div>
                      )}
                      {policy.maximum_amount && (
                        <div className="flex justify-between">
                          <span>최대 지급액</span>
                          <span>{formatCurrency(policy.maximum_amount)}</span>
                        </div>
                      )}
                      {policy.performance_threshold && (
                        <div className="flex justify-between">
                          <span>성과 기준치</span>
                          <span>{formatCurrency(policy.performance_threshold)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}