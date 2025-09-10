/**
 * @file /api/instructors/route.ts
 * @description 강사 관리 API - 목록 조회 및 생성
 * @module T-V2-012
 * @security 3-Layer Security (DB RLS + API Middleware + Frontend)
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withApiHandler } from '@/lib/api/utils';
import { Database } from '@/types/supabase';

// ============================================================================
// Type Definitions
// ============================================================================

type TenantMembership = Database['public']['Tables']['tenant_memberships']['Row'];

// 강사 정보 스키마
const InstructorSchema = z.object({
  user_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  role_id: z.string().uuid().optional(),
  staff_info: z.object({
    employee_id: z.string().optional(),
    employment_type: z.enum(['정규직', '계약직', '파트타임']).optional(),
    department: z.string().optional(),
    position: z.string().optional(),
    emergency_contact: z.object({
      name: z.string(),
      relationship: z.string(),
      phone: z.string()
    }).optional(),
    instructor_info: z.object({
      subjects: z.array(z.string()).optional(),
      certifications: z.array(z.string()).optional(),
      specialties: z.array(z.string()).optional(),
      teaching_level: z.enum(['초급', '중급', '고급']).optional(),
      max_classes_per_week: z.number().optional()
    }).optional(),
    salary_info: z.object({
      type: z.string().optional(),
      base_amount: z.number().optional(),
      allowances: z.array(z.any()).optional(),
      deductions: z.array(z.any()).optional(),
      payment_day: z.number().optional(),
      bank_info: z.any().optional()
    }).optional()
  }).optional(),
  hire_date: z.string().optional(),
  bio: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional()
});

// 쿼리 파라미터 스키마
const QuerySchema = z.object({
  page: z.string().nullable().optional().transform(val => val ? parseInt(val) : 1).pipe(z.number().min(1)),
  limit: z.string().nullable().optional().transform(val => val ? parseInt(val) : 20).pipe(z.number().min(1).max(100)),
  search: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  employment_type: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  sort_by: z.string().nullable().optional().transform(val => val && ['name', 'hire_date', 'department'].includes(val) ? val : 'name').pipe(z.enum(['name', 'hire_date', 'department'])),
  sort_order: z.string().nullable().optional().transform(val => val && ['asc', 'desc'].includes(val) ? val : 'asc').pipe(z.enum(['asc', 'desc']))
});

// ============================================================================
// GET: 강사 목록 조회
// ============================================================================

export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      try {
        // 1. 쿼리 파라미터 파싱
        const searchParams = request.nextUrl.searchParams;
        const queryParams = QuerySchema.parse({
          page: searchParams.get('page'),
          limit: searchParams.get('limit'),
          search: searchParams.get('search'),
          status: searchParams.get('status'),
          employment_type: searchParams.get('employment_type'),
          department: searchParams.get('department'),
          sort_by: searchParams.get('sort_by'),
          sort_order: searchParams.get('sort_order')
        });

        const { page, limit, search, status, employment_type, department, sort_by, sort_order } = queryParams;
        const offset = (page - 1) * limit;

        // 2. 사용자의 테넌트 확인
        const { data: userMembership, error: membershipError } = await supabase
          .from('tenant_memberships')
          .select('tenant_id, role_id')
          .eq('user_id', userProfile!.id)
          .single();

        if (membershipError || !userMembership || !userMembership.tenant_id) {
          return NextResponse.json(
            { error: 'No tenant membership found' },
            { status: 403 }
          );
        }

        // 3. 기본 쿼리 빌더 생성
        let query = supabase
          .from('tenant_memberships')
          .select(`
            *,
            user:user_profiles!tenant_memberships_user_id_fkey(
              id,
              email,
              name,
              phone,
              avatar_url,
              created_at
            ),
            role:tenant_roles!tenant_memberships_role_id_fkey(
              id,
              name,
              display_name,
              hierarchy_level
            )
          `)
          .eq('tenant_id', userMembership.tenant_id)
          .not('staff_info->instructor_info', 'is', null);

        // 4. 검색 조건 적용
        if (search) {
          query = query.or(`
            user.name.ilike.%${search}%,
            user.email.ilike.%${search}%,
            staff_info->employee_id.ilike.%${search}%
          `);
        }

        // 5. 필터 조건 적용
        if (status) {
          query = query.eq('status', status);
        }

        if (employment_type) {
          query = query.eq('staff_info->employment_type', employment_type);
        }

        if (department) {
          query = query.eq('staff_info->department', department);
        }

        // 6. 전체 카운트 조회 (페이징용)
        const { count, error: countError } = await supabase
          .from('tenant_memberships')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', userMembership.tenant_id)
          .not('staff_info->instructor_info', 'is', null);

        if (countError) {
          console.error('Count query error:', countError);
        }

        // 7. 정렬 적용 (PostgREST에서는 nested 정렬이 제한되므로 기본 컬럼으로 정렬)
        if (sort_by === 'name') {
          // user.name으로 정렬할 수 없으므로 created_at으로 대체
          query = query.order('created_at', { ascending: sort_order === 'asc' });
        } else if (sort_by === 'hire_date') {
          query = query.order('created_at', { ascending: sort_order === 'asc' });
        } else if (sort_by === 'department') {
          query = query.order('staff_info->department', { ascending: sort_order === 'asc' });
        } else {
          // 기본 정렬: 생성일시
          query = query.order('created_at', { ascending: sort_order === 'asc' });
        }

        // 8. 페이징 적용
        query = query.range(offset, offset + limit - 1);

        // 9. 쿼리 실행
        const { data: instructors, error: fetchError } = await query;

        if (fetchError) {
          console.error('Instructors fetch error:', fetchError);
          return NextResponse.json(
            { error: 'Failed to fetch instructors', details: fetchError.message },
            { status: 500 }
          );
        }

        // 10. 응답 반환
        const totalPages = Math.ceil((count || 0) / limit);
        
        return NextResponse.json({
          instructors: instructors || [],
          pagination: {
            total: count || 0,
            page,
            limit,
            totalPages
          }
        });

      } catch (error) {
        console.error('Instructor API error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json(
          { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        );
      }
    },
    { requireAuth: true }
  );
}

// ============================================================================
// POST: 강사 등록
// ============================================================================

export async function POST(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      try {
        // 1. 사용자의 테넌트 멤버십 및 권한 확인
        const { data: userMembership, error: membershipError } = await supabase
          .from('tenant_memberships')
          .select(`
            tenant_id,
            role_id,
            role:tenant_roles!tenant_memberships_role_id_fkey(
              name,
              hierarchy_level
            )
          `)
          .eq('user_id', userProfile!.id)
          .single();

        if (membershipError || !userMembership || !userMembership.tenant_id) {
          return NextResponse.json(
            { error: 'No tenant membership found' },
            { status: 403 }
          );
        }

        // 2. Admin/Manager 권한 확인
        const role = userMembership.role as any;
        const userRole = role?.name || 'viewer';
        const hasPermission = ['admin', 'manager'].includes(userRole);
        
        if (!hasPermission) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }

        // 3. 요청 본문 파싱 및 검증
        const body = await request.json();
        const validatedData = InstructorSchema.parse(body);

        // 4. 중복 등록 방지 (같은 테넌트에 이미 등록된 사용자인지 확인)
        const { data: existingMembership } = await supabase
          .from('tenant_memberships')
          .select('id')
          .eq('tenant_id', userMembership.tenant_id)
          .eq('user_id', validatedData.user_id)
          .single();

        if (existingMembership) {
          return NextResponse.json(
            { error: 'User already registered in this tenant' },
            { status: 409 }
          );
        }

        // 5. 트랜잭션으로 강사 등록
        const { data: newInstructor, error: insertError } = await supabase
          .from('tenant_memberships')
          .insert({
            user_id: validatedData.user_id,
            tenant_id: userMembership.tenant_id,
            role_id: validatedData.role_id,
            staff_info: validatedData.staff_info,
            hire_date: validatedData.hire_date,
            bio: validatedData.bio,
            qualification: validatedData.qualification,
            specialization: validatedData.specialization,
            status: 'active',
            invited_by: userProfile!.id,
            invited_at: new Date().toISOString(),
            accepted_at: new Date().toISOString()
          })
          .select(`
            *,
            user:user_profiles!tenant_memberships_user_id_fkey(
              id,
              email,
              name,
              phone,
              avatar_url
            ),
            role:tenant_roles!tenant_memberships_role_id_fkey(
              id,
              name,
              display_name
            )
          `)
          .single();

        if (insertError) {
          console.error('Insert error:', insertError);
          return NextResponse.json(
            { error: 'Failed to create instructor' },
            { status: 500 }
          );
        }

        // 급여 정책 기능은 현재 스키마에서 제외
        // TODO: 급여 정책 테이블 추가 후 구현

        // 7. 성공 응답
        return NextResponse.json({
          message: 'Instructor created successfully',
          instructor: newInstructor
        }, { status: 201 });

      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid request data', details: error.issues },
            { status: 400 }
          );
        }
        
        console.error('Instructor creation error:', error);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    },
    { requireAuth: true }
  );
}