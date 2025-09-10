/**
 * @file /api/instructors/dashboard-stats/route.ts
 * @description 강사 대시보드 통계 API
 * @module T-V2-012
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/api/utils';

export async function GET(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      try {
        // 1. 사용자의 테넌트 확인
        const { data: userMembership, error: membershipError } = await supabase
          .from('tenant_memberships')
          .select('tenant_id')
          .eq('user_id', userProfile!.id)
          .single();

        if (membershipError || !userMembership || !userMembership.tenant_id) {
          return NextResponse.json(
            { error: 'No tenant membership found' },
            { status: 403 }
          );
        }

        // 2. 강사 목록 조회 (기본 통계)
        const { data: instructors, error: instructorsError } = await supabase
          .from('tenant_memberships')
          .select('id, status, hire_date, staff_info')
          .eq('tenant_id', userMembership.tenant_id)
          .in('status', ['active', 'inactive', 'pending']);

        if (instructorsError) {
          console.error('Instructors query error:', instructorsError);
          return NextResponse.json(
            { error: 'Failed to fetch instructor statistics' },
            { status: 500 }
          );
        }

        // 3. 통계 계산
        const total = instructors?.length || 0;
        const active = instructors?.filter(i => i.status === 'active').length || 0;
        const inactive = instructors?.filter(i => i.status === 'inactive').length || 0;
        const pending = instructors?.filter(i => i.status === 'pending').length || 0;

        // 4. 고용 유형별 통계
        const employmentStats = instructors?.reduce((acc, instructor) => {
          const staffInfo = instructor.staff_info as any;
          const employmentType = staffInfo?.employment_type || '미정';
          acc[employmentType] = (acc[employmentType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        // 5. 부서별 통계
        const departmentStats = instructors?.reduce((acc, instructor) => {
          const staffInfo = instructor.staff_info as any;
          const department = staffInfo?.department || '미정';
          acc[department] = (acc[department] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        // 6. 최근 채용 통계 (이번 달)
        const currentMonth = new Date().toISOString().slice(0, 7);
        const recentHires = instructors?.filter(i => 
          i.hire_date && i.hire_date.startsWith(currentMonth)
        ).length || 0;

        // 7. 응답 반환
        return NextResponse.json({
          total,
          active,
          inactive,
          pending,
          employmentStats,
          departmentStats,
          recentHires,
          month: currentMonth
        });

      } catch (error) {
        console.error('Instructor dashboard stats error:', error);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    },
    { requireAuth: true }
  );
}