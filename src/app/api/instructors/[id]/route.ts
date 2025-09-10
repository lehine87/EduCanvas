/**
 * @file /api/instructors/[id]/route.ts
 * @description 강사 관리 API - 개별 조회/수정/삭제
 * @module T-V2-012
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withApiHandler } from '@/lib/api/utils'

// ============================================================================
// Type Definitions & Validation
// ============================================================================

const UpdateInstructorSchema = z.object({
  staff_info: z.object({
    employee_id: z.string().optional(),
    employment_type: z.enum(['정규직', '계약직', '파트타임']).optional(),
    department: z.string().optional(),
    position: z.string().optional(),
    emergency_contact: z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      relationship: z.string().optional(),
    }).optional(),
    instructor_info: z.object({
      teaching_level: z.enum(['초급', '중급', '고급']).optional(),
      subjects: z.array(z.string()).optional(),
      certifications: z.array(z.string()).optional(),
      specialties: z.array(z.string()).optional(),
      max_classes_per_week: z.number().optional(),
    }).optional(),
  }).optional(),
  status: z.enum(['active', 'inactive', 'pending']).optional(),
  bio: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
})

// ============================================================================
// GET: 강사 상세 조회
// ============================================================================

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const { id: instructorId } = await params

      try {
        // 1. 강사 정보 조회 (tenant_memberships 기반)
        const { data: membership, error: membershipError } = await supabase
          .from('tenant_memberships')
          .select(`
            *,
            user:user_profiles(*)
          `)
          .eq('id', instructorId)
          .single()

        if (membershipError || !membership) {
          return NextResponse.json(
            { error: 'Instructor not found' },
            { status: 404 }
          )
        }

        // 2. 추가 통계 정보 조회
        const today = new Date().toISOString().split('T')[0]
        const currentMonth = new Date().toISOString().slice(0, 7)

        // 담당 수업 수
        const { count: classCount } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true })
          .eq('instructor_id', instructorId)
          .eq('is_active', true)

        // 근태 기록은 현재 스키마에서 제외
        const attendanceRecords: any[] = []

        const response = {
          id: membership.id,
          user_id: membership.user_id,
          tenant_id: membership.tenant_id,
          role_id: membership.role_id,
          status: membership.status,
          staff_info: membership.staff_info,
          hire_date: membership.hire_date,
          bio: membership.bio,
          qualification: membership.qualification,
          specialization: membership.specialization,
          created_at: membership.created_at,
          updated_at: membership.updated_at,
          user: membership.user,
          
          // 통계 정보
          stats: {
            class_count: classCount || 0,
            attendance_count: attendanceRecords?.length || 0,
            work_days_this_month: attendanceRecords?.filter(r => r.check_in)?.length || 0,
          }
        }

        return NextResponse.json(response)

      } catch (error) {
        console.error('Instructor fetch error:', error)
        return NextResponse.json(
          { error: 'Failed to fetch instructor' },
          { status: 500 }
        )
      }
    },
    { requireAuth: true }
  );
}

// ============================================================================
// PUT: 강사 정보 수정
// ============================================================================

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const { id: instructorId } = await params

      try {
        const body = await request.json()
        const validatedData = UpdateInstructorSchema.parse(body)

        // 1. 기존 강사 정보 확인
        const { data: existingMembership, error: fetchError } = await supabase
          .from('tenant_memberships')
          .select('*')
          .eq('id', instructorId)
          .single()

        if (fetchError || !existingMembership) {
          return NextResponse.json(
            { error: 'Instructor not found' },
            { status: 404 }
          )
        }

        // 2. staff_info 병합
        const existingStaffInfo = (existingMembership.staff_info as Record<string, any>) || {}
        const updatedStaffInfo = {
          ...existingStaffInfo,
          ...(validatedData.staff_info || {}),
        }

        // 3. tenant_memberships 업데이트
        const updateData: any = {
          updated_at: new Date().toISOString(),
        }

        if (validatedData.staff_info) {
          updateData.staff_info = updatedStaffInfo
        }

        if (validatedData.status) {
          updateData.status = validatedData.status
        }

        if (validatedData.bio !== undefined) {
          updateData.bio = validatedData.bio
        }

        if (validatedData.qualification !== undefined) {
          updateData.qualification = validatedData.qualification
        }

        if (validatedData.specialization !== undefined) {
          updateData.specialization = validatedData.specialization
        }

        const { data: updatedMembership, error: updateError } = await supabase
          .from('tenant_memberships')
          .update(updateData)
          .eq('id', instructorId)
          .select(`
            *,
            user:user_profiles(*)
          `)
          .single()

        if (updateError) {
          console.error('Instructor update error:', updateError)
          return NextResponse.json(
            { error: 'Failed to update instructor' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          message: 'Instructor updated successfully',
          instructor: updatedMembership,
        })

      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid request data', details: error.issues },
            { status: 400 }
          )
        }

        console.error('Instructor update error:', error)
        return NextResponse.json(
          { error: 'Failed to update instructor' },
          { status: 500 }
        )
      }
    },
    { requireAuth: true }
  );
}

// ============================================================================
// DELETE: 강사 삭제 (비활성화)
// ============================================================================

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(
    request,
    async ({ request, userProfile, supabase }) => {
      const { id: instructorId } = await params

      try {
        // 1. 강사 존재 여부 확인
        const { data: existingMembership, error: fetchError } = await supabase
          .from('tenant_memberships')
          .select('*')
          .eq('id', instructorId)
          .single()

        if (fetchError || !existingMembership) {
          return NextResponse.json(
            { error: 'Instructor not found' },
            { status: 404 }
          )
        }

        // 2. 활성 수업 확인
        const { count: activeClassCount } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true })
          .eq('instructor_id', instructorId)
          .eq('is_active', true)

        if (activeClassCount && activeClassCount > 0) {
          return NextResponse.json(
            { 
              error: 'Cannot delete instructor with active classes',
              details: `Instructor has ${activeClassCount} active classes`
            },
            { status: 409 }
          )
        }

        // 3. 소프트 삭제 (상태를 inactive로 변경)
        const { data: updatedMembership, error: updateError } = await supabase
          .from('tenant_memberships')
          .update({
            status: 'inactive',
            updated_at: new Date().toISOString(),
          })
          .eq('id', instructorId)
          .select()
          .single()

        if (updateError) {
          console.error('Instructor delete error:', updateError)
          return NextResponse.json(
            { error: 'Failed to delete instructor' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          message: 'Instructor deleted successfully',
          instructor: updatedMembership,
        })

      } catch (error) {
        console.error('Instructor delete error:', error)
        return NextResponse.json(
          { error: 'Failed to delete instructor' },
          { status: 500 }
        )
      }
    },
    { requireAuth: true }
  );
}