// EduCanvas v2.0 Salary System Types  
// 복잡한 급여 정책 및 계산 시스템

import type { Json } from './database';

// BaseEntity 타입 정의 (공통 엔티티 필드)
interface BaseEntity {
  id: string;
  created_at?: string;
  updated_at?: string;
}

// SalaryPolicyType 타입 정의
type SalaryPolicyType = 'fixed' | 'hourly' | 'performance' | 'commission' | 'combination';

// ================================================================
// 1. SALARY POLICY TYPES (급여 정책 시스템)
// ================================================================

export interface SalaryPolicy extends BaseEntity {
  name: string;
  policy_type: SalaryPolicyType;
  base_amount: number;
  hourly_rate?: number;
  commission_rate?: number;
  minimum_guaranteed: number;
  calculation_basis: 'revenue' | 'students' | 'hours';
  policy_config?: Json;
  description?: string;
  is_active: boolean;
}

// 정책 유형별 설정 타입들
export interface FixedMonthlySalaryConfig {
  monthly_amount: number;
  bonus_criteria?: {
    student_count_threshold?: number;
    revenue_threshold?: number;
    bonus_amount: number;
  };
}

export interface FixedHourlySalaryConfig {
  hourly_rate: number;
  overtime_rate?: number;
  max_hours_per_month?: number;
}

export interface CommissionSalaryConfig {
  commission_rate: number;
  base_amount?: number;
  calculation_basis: 'revenue' | 'net_revenue';
}

export interface TieredCommissionSalaryConfig {
  tiers: SalaryTier[];
  base_amount?: number;
  calculation_basis: 'revenue' | 'students';
}

export interface StudentBasedSalaryConfig {
  student_tiers: Array<{
    min_students: number;
    max_students?: number;
    rate_per_student?: number;
    commission_rate?: number;
  }>;
  calculation_basis: 'per_student' | 'revenue_percentage';
}

export interface HybridSalaryConfig {
  base_amount: number;
  commission_rate: number;
  threshold_amount?: number;
  bonus_criteria?: {
    condition: 'student_count' | 'revenue' | 'retention_rate';
    threshold: number;
    bonus_amount: number;
  }[];
}

export interface GuaranteedMinimumSalaryConfig {
  guaranteed_amount: number;
  calculation_method: SalaryPolicyType;
  method_config: Json;
}

// ================================================================
// 2. SALARY TIER TYPES (누진 구간 시스템)
// ================================================================

export interface SalaryTier extends BaseEntity {
  policy_id: string;
  tier_order: number;
  min_amount: number;
  max_amount?: number;
  commission_rate: number;
}

export interface CreateSalaryTierData {
  policy_id: string;
  tier_order: number;
  min_amount: number;
  max_amount?: number;
  commission_rate: number;
}

// ================================================================
// 3. INSTRUCTOR SALARY POLICY TYPES (강사별 정책 적용)
// ================================================================

export interface InstructorSalaryPolicy extends BaseEntity {
  instructor_id: string;
  salary_policy_id: string;
  custom_base_amount?: number;
  custom_commission_rate?: number;
  custom_minimum_guaranteed?: number;
  custom_config?: Json;
  effective_from: string;
  effective_until?: string;
  is_active: boolean;
}

export interface CreateInstructorSalaryPolicyData {
  instructor_id: string;
  salary_policy_id: string;
  custom_base_amount?: number;
  custom_commission_rate?: number;
  custom_minimum_guaranteed?: number;
  custom_config?: Json;
  effective_from: string;
  effective_until?: string;
}

export interface InstructorSalaryPolicyWithDetails extends InstructorSalaryPolicy {
  instructor?: {
    id: string;
    name: string;
    specialization?: string;
  };
  salary_policy?: SalaryPolicy;
  salary_tiers?: SalaryTier[];
}

// ================================================================
// 4. SALARY CALCULATION TYPES (급여 계산 시스템)
// ================================================================

export interface SalaryCalculation extends BaseEntity {
  instructor_id: string;
  calculation_month: string; // YYYY-MM-01 format
  total_revenue: number;
  total_students: number;
  total_hours: number;
  base_salary: number;
  commission_salary: number;
  bonus_amount: number;
  deduction_amount: number;
  total_calculated: number;
  minimum_guaranteed: number;
  final_salary: number;
  calculation_details?: Json;
  calculated_at: string;
  calculated_by?: string;
  approved_at?: string;
  approved_by?: string;
  status: 'calculated' | 'approved' | 'paid' | 'disputed';
}

export interface SalaryCalculationInput {
  instructor_id: string;
  calculation_month: string;
  total_revenue: number;
  total_students: number;
  total_hours: number;
  class_performances?: ClassPerformanceData[];
  bonuses?: BonusData[];
  deductions?: DeductionData[];
}

export interface SalaryCalculationResult {
  base_salary: number;
  commission_breakdown: CommissionBreakdown[];
  bonus_breakdown: BonusBreakdown[];
  deduction_breakdown: DeductionBreakdown[];
  total_calculated: number;
  minimum_guaranteed: number;
  final_salary: number;
  calculation_steps: SalaryCalculationStep[];
  policy_applied: {
    policy_id: string;
    policy_name: string;
    policy_type: SalaryPolicyType;
  };
}

export interface CommissionBreakdown {
  tier_order?: number;
  min_amount: number;
  max_amount?: number;
  applicable_amount: number;
  commission_rate: number;
  commission_earned: number;
  description: string;
}

export interface BonusBreakdown {
  bonus_type: string;
  criteria_met: boolean;
  bonus_amount: number;
  description: string;
}

export interface DeductionBreakdown {
  deduction_type: string;
  deduction_amount: number;
  description: string;
  is_mandatory: boolean;
}

export interface SalaryCalculationStep {
  step_order: number;
  description: string;
  calculation: string;
  result: number;
}

// ================================================================
// 5. PERFORMANCE DATA TYPES (성과 데이터)
// ================================================================

export interface ClassPerformanceData {
  class_id: string;
  class_name: string;
  student_count: number;
  revenue: number;
  attendance_rate: number;
  retention_rate: number;
}

export interface BonusData {
  bonus_type: string;
  amount: number;
  reason: string;
  is_recurring: boolean;
}

export interface DeductionData {
  deduction_type: string;
  amount: number;
  reason: string;
  is_mandatory: boolean;
}

export interface InstructorPerformanceMetrics {
  instructor_id: string;
  month: string;
  total_classes: number;
  total_students: number;
  total_revenue: number;
  average_class_size: number;
  attendance_rate: number;
  student_retention_rate: number;
  new_student_acquisitions: number;
  student_graduations: number;
}

// ================================================================
// 6. SALARY COMPARISON TYPES (급여 비교 및 분석)
// ================================================================

export interface SalaryComparison {
  instructor_id: string;
  instructor_name: string;
  current_month: {
    calculation_month: string;
    final_salary: number;
    total_revenue: number;
    total_students: number;
  };
  previous_month?: {
    calculation_month: string;
    final_salary: number;
    total_revenue: number;
    total_students: number;
  };
  year_to_date: {
    total_salary: number;
    average_monthly_salary: number;
    total_revenue: number;
    average_students: number;
  };
  growth_metrics: {
    salary_change_percentage: number;
    revenue_change_percentage: number;
    student_change_percentage: number;
  };
}

export interface SalaryBenchmark {
  policy_type: SalaryPolicyType;
  average_salary: number;
  median_salary: number;
  min_salary: number;
  max_salary: number;
  instructor_count: number;
  percentile_25: number;
  percentile_75: number;
}

// ================================================================
// 7. SALARY APPROVAL WORKFLOW (급여 승인 워크플로우)
// ================================================================

export interface SalaryApprovalWorkflow {
  id: string;
  calculation_id: string;
  current_step: number;
  total_steps: number;
  status: 'pending' | 'approved' | 'rejected' | 'revision_needed';
  workflow_steps: SalaryApprovalStep[];
  created_at: string;
  completed_at?: string;
}

export interface SalaryApprovalStep {
  step_order: number;
  step_name: string;
  assignee_role: 'manager' | 'hr' | 'finance';
  assignee_user_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  completed_at?: string;
}

// ================================================================
// 8. SALARY STATISTICS (급여 통계)
// ================================================================

export interface SalaryStatistics {
  period: string;
  total_instructors: number;
  total_salary_paid: number;
  average_salary: number;
  median_salary: number;
  salary_by_policy_type: Array<{
    policy_type: SalaryPolicyType;
    instructor_count: number;
    total_salary: number;
    average_salary: number;
  }>;
  top_earners: Array<{
    instructor_id: string;
    instructor_name: string;
    final_salary: number;
    policy_type: SalaryPolicyType;
  }>;
  salary_distribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}

// ================================================================
// 9. API REQUEST/RESPONSE TYPES
// ================================================================

export interface SalaryApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 급여 정책 생성
export interface CreateSalaryPolicyRequest {
  name: string;
  policy_type: SalaryPolicyType;
  base_amount?: number;
  hourly_rate?: number;
  commission_rate?: number;
  minimum_guaranteed?: number;
  calculation_basis?: 'revenue' | 'students' | 'hours';
  policy_config?: Json;
  description?: string;
  tiers?: CreateSalaryTierData[];
}

export interface CreateSalaryPolicyResponse extends SalaryApiResponse<SalaryPolicy> {}

// 급여 계산
export interface CalculateSalaryRequest extends SalaryCalculationInput {}

export interface CalculateSalaryResponse extends SalaryApiResponse<SalaryCalculationResult> {}

// 급여 계산 승인
export interface ApproveSalaryCalculationRequest {
  calculation_ids: string[];
  comments?: string;
}

export interface ApproveSalaryCalculationResponse extends SalaryApiResponse<{
  approved_count: number;
  failed_count: number;
  errors: string[];
}> {}

// 급여 통계 조회
export interface GetSalaryStatisticsRequest {
  period_from: string;
  period_to: string;
  instructor_ids?: string[];
  policy_types?: SalaryPolicyType[];
}

export interface GetSalaryStatisticsResponse extends SalaryApiResponse<SalaryStatistics> {}

// ================================================================
// 10. UI COMPONENT TYPES (프론트엔드용)
// ================================================================

export interface SalaryPolicyCardProps {
  policy: SalaryPolicy;
  selected?: boolean;
  onSelect?: (policyId: string) => void;
  showDetails?: boolean;
  editable?: boolean;
}

export interface SalaryCalculationTableProps {
  calculations: SalaryCalculation[];
  onApprove?: (calculationIds: string[]) => void;
  onReject?: (calculationIds: string[]) => void;
  onViewDetails?: (calculationId: string) => void;
}

export interface TierConfigurationProps {
  tiers: SalaryTier[];
  onTierChange: (tiers: CreateSalaryTierData[]) => void;
  calculationBasis: 'revenue' | 'students';
}

export interface SalaryCalculatorProps {
  instructorId: string;
  month: string;
  onCalculationComplete: (result: SalaryCalculationResult) => void;
}

export interface SalaryDashboardProps {
  instructorId?: string;
  period: {
    from: string;
    to: string;
  };
  showComparison?: boolean;
}

// ================================================================
// 11. VALIDATION TYPES (유효성 검사)
// ================================================================

export interface SalaryPolicyValidationRules {
  name: {
    minLength: number;
    maxLength: number;
    required: boolean;
  };
  base_amount: {
    min: number;
    max: number;
  };
  commission_rate: {
    min: number;
    max: number;
  };
  minimum_guaranteed: {
    min: number;
    max: number;
  };
}

export interface TierValidationRules {
  commission_rate: {
    min: number;
    max: number;
  };
  min_amount: {
    min: number;
  };
  max_amount: {
    min: number;
    must_be_greater_than_min: boolean;
  };
}