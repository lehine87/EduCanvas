// EduCanvas v2.0 Billing System Types
// 복잡한 요금제 및 할인 정책 관리

import type { BaseEntity, Json, BillingType, DiscountType, StudentStatus } from './database';

// ================================================================
// 1. COURSE PACKAGE TYPES (수강권 시스템)
// ================================================================

export interface CoursePackage extends BaseEntity {
  class_id: string;
  name: string;
  billing_type: BillingType;
  base_price: number;
  sessions_count?: number;
  hours_count?: number;
  duration_months?: number;
  duration_days?: number;
  discount_rate: number;
  is_active: boolean;
  auto_renewal: boolean;
  sort_order: number;
}

export interface CoursePackageWithClass extends CoursePackage {
  class?: {
    id: string;
    name: string;
    subject?: string;
    instructor_name?: string;
  };
}

// 수강권 생성/수정을 위한 타입
export interface CreateCoursePackageData {
  class_id: string;
  name: string;
  billing_type: BillingType;
  base_price: number;
  sessions_count?: number;
  hours_count?: number;
  duration_months?: number;
  duration_days?: number;
  discount_rate?: number;
  auto_renewal?: boolean;
  sort_order?: number;
}

export interface UpdateCoursePackageData extends Partial<CreateCoursePackageData> {
  is_active?: boolean;
}

// ================================================================
// 2. DISCOUNT POLICY TYPES (할인 정책 시스템)
// ================================================================

export interface DiscountPolicy extends BaseEntity {
  name: string;
  discount_type: DiscountType;
  conditions?: Json;
  discount_rate?: number;
  discount_amount?: number;
  max_discount_amount?: number;
  valid_from?: string;
  valid_until?: string;
  min_purchase_amount: number;
  applicable_billing_types?: BillingType[];
  is_active: boolean;
}

// 할인 조건 타입들
export interface SiblingDiscountConditions {
  sibling_order: number; // 둘째: 2, 셋째: 3
  same_class_only?: boolean;
}

export interface EarlyPaymentDiscountConditions {
  early_days: number; // 며칠 앞서 결제
  payment_period: 'monthly' | 'quarterly' | 'semi_annually' | 'annually';
}

export interface LoyaltyDiscountConditions {
  min_months: number; // 최소 수강 개월 수
}

export interface VolumeDiscountConditions {
  min_classes: number; // 최소 수강 과목 수
  same_student?: boolean;
}

export interface PromotionDiscountConditions {
  promotion_code?: string;
  new_students_only?: boolean;
}

export interface ScholarshipDiscountConditions {
  scholarship_type: string;
  academic_requirement?: string;
  income_requirement?: string;
}

// 할인 정책 생성을 위한 타입
export interface CreateDiscountPolicyData {
  name: string;
  discount_type: DiscountType;
  conditions?: 
    | SiblingDiscountConditions 
    | EarlyPaymentDiscountConditions 
    | LoyaltyDiscountConditions
    | VolumeDiscountConditions
    | PromotionDiscountConditions
    | ScholarshipDiscountConditions;
  discount_rate?: number;
  discount_amount?: number;
  max_discount_amount?: number;
  valid_from?: string;
  valid_until?: string;
  min_purchase_amount?: number;
  applicable_billing_types?: BillingType[];
}

// ================================================================
// 3. STUDENT ENROLLMENT TYPES (수강권 등록 시스템)
// ================================================================

export interface StudentEnrollment extends BaseEntity {
  student_id: string;
  course_package_id: string;
  enrolled_at: string;
  start_date: string;
  end_date?: string;
  original_price: number;
  final_price: number;
  applied_discounts?: Json;
  total_sessions: number;
  used_sessions: number;
  remaining_sessions: number;
  total_hours: number;
  used_hours: number;
  remaining_hours: number;
  status: StudentStatus;
  auto_renewal: boolean;
  memo?: string;
}

export interface StudentEnrollmentWithRelations extends StudentEnrollment {
  student?: {
    id: string;
    name: string;
    parent_name?: string;
  };
  course_package?: CoursePackage;
  class?: {
    id: string;
    name: string;
    subject?: string;
  };
}

// 수강권 등록을 위한 타입
export interface CreateEnrollmentData {
  student_id: string;
  course_package_id: string;
  start_date: string;
  applied_discount_ids?: string[];
  custom_discounts?: CustomDiscount[];
  auto_renewal?: boolean;
  memo?: string;
}

export interface CustomDiscount {
  name: string;
  discount_type: DiscountType;
  discount_rate?: number;
  discount_amount?: number;
  reason?: string;
}

// ================================================================
// 4. BILLING CALCULATION TYPES (요금 계산 로직)
// ================================================================

export interface BillingCalculationInput {
  course_package: CoursePackage;
  student_id: string;
  discount_policies?: DiscountPolicy[];
  custom_discounts?: CustomDiscount[];
  start_date: string;
}

export interface BillingCalculationResult {
  original_price: number;
  discounts_applied: DiscountApplication[];
  total_discount_amount: number;
  final_price: number;
  calculation_details: BillingCalculationDetails;
}

export interface DiscountApplication {
  discount_id?: string;
  discount_name: string;
  discount_type: DiscountType;
  discount_rate?: number;
  discount_amount: number;
  conditions_met: boolean;
  applied_amount: number;
  reason?: string;
}

export interface BillingCalculationDetails {
  base_price: number;
  package_discount_rate: number;
  package_discount_amount: number;
  policy_discounts: DiscountApplication[];
  custom_discounts: DiscountApplication[];
  total_discount_rate: number;
  total_discount_amount: number;
  final_price: number;
  calculation_steps: string[];
}

// ================================================================
// 5. BILLING CYCLE TYPES (청구 주기 관리)
// ================================================================

export interface BillingCycle {
  id: string;
  enrollment_id: string;
  cycle_number: number;
  billing_date: string;
  due_date: string;
  amount: number;
  status: 'upcoming' | 'current' | 'overdue' | 'paid' | 'cancelled';
  payment_id?: string;
  auto_generated: boolean;
  created_at: string;
}

export interface NextBillingInfo {
  next_billing_date: string;
  next_due_date: string;
  next_amount: number;
  billing_type: BillingType;
  auto_renewal: boolean;
}

// ================================================================
// 6. PACKAGE USAGE TRACKING (사용량 추적)
// ================================================================

export interface PackageUsageRecord {
  id: string;
  enrollment_id: string;
  attendance_id?: string;
  usage_date: string;
  usage_type: 'session' | 'hours';
  sessions_used?: number;
  hours_used?: number;
  remaining_sessions?: number;
  remaining_hours?: number;
  notes?: string;
  created_at: string;
}

export interface UsageSummary {
  enrollment_id: string;
  total_sessions: number;
  used_sessions: number;
  remaining_sessions: number;
  total_hours: number;
  used_hours: number;
  remaining_hours: number;
  usage_rate: number; // 사용률 (%)
  estimated_completion_date?: string;
}

// ================================================================
// 7. BILLING STATISTICS (요금제 통계)
// ================================================================

export interface BillingStats {
  total_enrollments: number;
  active_enrollments: number;
  total_revenue: number;
  average_package_price: number;
  most_popular_billing_type: BillingType;
  total_discounts_given: number;
  discount_utilization_rate: number;
}

export interface PackagePerformance {
  package_id: string;
  package_name: string;
  billing_type: BillingType;
  total_enrollments: number;
  total_revenue: number;
  average_price: number;
  completion_rate: number;
  renewal_rate: number;
}

export interface DiscountPerformance {
  discount_id: string;
  discount_name: string;
  discount_type: DiscountType;
  usage_count: number;
  total_discount_amount: number;
  average_discount_amount: number;
  affected_enrollments: number;
}

// ================================================================
// 8. API REQUEST/RESPONSE TYPES
// ================================================================

export interface BillingApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 수강권 목록 조회
export interface GetCoursePackagesRequest {
  class_id?: string;
  billing_type?: BillingType;
  is_active?: boolean;
  include_class?: boolean;
}

export interface GetCoursePackagesResponse extends BillingApiResponse<CoursePackageWithClass[]> {}

// 할인 정책 적용 가능성 체크
export interface CheckDiscountEligibilityRequest {
  student_id: string;
  course_package_id: string;
  discount_policy_ids?: string[];
}

export interface CheckDiscountEligibilityResponse extends BillingApiResponse<{
  eligible_discounts: DiscountPolicy[];
  ineligible_discounts: Array<{
    discount: DiscountPolicy;
    reason: string;
  }>;
  estimated_final_price: number;
}> {}

// 요금 계산
export interface CalculateBillingRequest extends BillingCalculationInput {}

export interface CalculateBillingResponse extends BillingApiResponse<BillingCalculationResult> {}

// 수강권 등록
export interface CreateEnrollmentRequest extends CreateEnrollmentData {}

export interface CreateEnrollmentResponse extends BillingApiResponse<StudentEnrollmentWithRelations> {}

// ================================================================
// 9. UI COMPONENT TYPES (프론트엔드용)
// ================================================================

export interface PackageCardProps {
  package: CoursePackage;
  selected?: boolean;
  onSelect?: (packageId: string) => void;
  showPrice?: boolean;
  showFeatures?: boolean;
}

export interface DiscountBadgeProps {
  discount: DiscountApplication;
  variant?: 'small' | 'medium' | 'large';
}

export interface BillingCalculatorProps {
  coursePackages: CoursePackage[];
  availableDiscounts: DiscountPolicy[];
  onCalculationComplete: (result: BillingCalculationResult) => void;
}

export interface EnrollmentFormData {
  student_id: string;
  course_package_id: string;
  start_date: string;
  selected_discounts: string[];
  custom_discount?: CustomDiscount;
  auto_renewal: boolean;
  memo?: string;
}

// ================================================================
// 10. VALIDATION TYPES (유효성 검사)
// ================================================================

export interface PackageValidationRules {
  name: {
    minLength: number;
    maxLength: number;
    required: boolean;
  };
  base_price: {
    min: number;
    max: number;
    required: boolean;
  };
  sessions_count?: {
    min: number;
    max: number;
  };
  hours_count?: {
    min: number;
    max: number;
  };
  duration_months?: {
    min: number;
    max: number;
  };
}

export interface DiscountValidationRules {
  discount_rate?: {
    min: number;
    max: number;
  };
  discount_amount?: {
    min: number;
    max: number;
  };
  valid_from?: {
    minDate: string;
    maxDate: string;
  };
  valid_until?: {
    minDate: string;
    maxDate: string;
  };
}