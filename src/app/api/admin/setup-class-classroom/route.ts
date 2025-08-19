import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * 클래스-교실 연관관계 설정을 위한 관리자 전용 API
 * POST /api/admin/setup-class-classroom
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 클래스-교실 연관관계 설정 API 시작')

    // Service Role로 Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. 테넌트 정보 조회
    const { data: tenant, error: tenantError } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('email', 'hanulsumin@naver.com')
      .limit(1)
      .single()

    if (tenantError) {
      console.error('❌ 테넌트 조회 실패:', tenantError)
      return Response.json({ 
        success: false, 
        error: '테넌트 정보를 찾을 수 없습니다',
        detail: tenantError.message 
      }, { status: 404 })
    }

    const tenantId = tenant.tenant_id

    // 2. 기존 클래스와 교실 정보 조회
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name, default_classroom_id')
      .eq('tenant_id', tenantId)

    const { data: classrooms } = await supabase
      .from('classrooms')
      .select('id, name, capacity')
      .eq('tenant_id', tenantId)

    if (!classes || classes.length === 0) {
      return Response.json({ 
        success: false, 
        error: '클래스 데이터가 없습니다. 먼저 클래스를 생성해주세요.' 
      }, { status: 400 })
    }

    if (!classrooms || classrooms.length === 0) {
      return Response.json({ 
        success: false, 
        error: '교실 데이터가 없습니다. 먼저 교실을 생성해주세요.' 
      }, { status: 400 })
    }

    // 3. 시간대 테이블 확인 및 생성
    const { data: existingTimeSlots } = await supabase
      .from('time_slots')
      .select('id, name')
      .eq('tenant_id', tenantId)

    let timeSlots = existingTimeSlots || []

    if (timeSlots.length === 0) {
      console.log('⏰ 시간대 데이터 생성 중...')
      
      const defaultTimeSlots = [
        { name: '1교시', start_time: '09:00', end_time: '10:30' },
        { name: '2교시', start_time: '10:40', end_time: '12:10' },
        { name: '3교시', start_time: '13:00', end_time: '14:30' },
        { name: '4교시', start_time: '14:40', end_time: '16:10' },
        { name: '5교시', start_time: '16:20', end_time: '17:50' },
        { name: '저녁반', start_time: '19:00', end_time: '21:00' }
      ]

      const { data: insertedTimeSlots, error: timeSlotsError } = await supabase
        .from('time_slots')
        .insert(
          defaultTimeSlots.map(ts => ({
            tenant_id: tenantId,
            ...ts
          }))
        )
        .select('id, name')

      if (timeSlotsError) {
        console.error('❌ 시간대 생성 실패:', timeSlotsError)
        return Response.json({ 
          success: false, 
          error: '시간대 생성 실패',
          detail: timeSlotsError.message 
        }, { status: 500 })
      }

      timeSlots = insertedTimeSlots || []
    }

    // 4. 클래스-교실 기본 연결 설정
    console.log('🏫 클래스-교실 기본 연결 설정 중...')
    
    const updatePromises = []
    for (let i = 0; i < classes.length; i++) {
      const classInfo = classes[i]
      const classroom = classrooms[i % classrooms.length] // 순환하여 배정
      
      // 이미 기본 교실이 설정되어 있다면 스킵
      if (!classInfo.default_classroom_id) {
        updatePromises.push(
          supabase
            .from('classes')
            .update({ default_classroom_id: classroom.id })
            .eq('id', classInfo.id)
        )
      }
    }

    if (updatePromises.length > 0) {
      const updateResults = await Promise.all(updatePromises)
      const failedUpdates = updateResults.filter(result => result.error)
      
      if (failedUpdates.length > 0) {
        console.error('❌ 일부 클래스 기본 교실 설정 실패:', failedUpdates)
      }
    }

    // 5. 요일별 스케줄 확인 및 생성
    const { data: existingSchedules } = await supabase
      .from('class_classroom_schedules')
      .select('id')
      .eq('tenant_id', tenantId)

    let schedulesCreated = 0

    if (!existingSchedules || existingSchedules.length === 0) {
      console.log('📅 요일별 교실 스케줄 생성 중...')
      
      const daysOfWeek = ['monday', 'wednesday', 'friday'] // 월,수,금
      const schedules = []

      for (let i = 0; i < classes.length; i++) {
        const classInfo = classes[i]
        const timeSlot = timeSlots[i % timeSlots.length]
        const classroom = classrooms[i % classrooms.length]
        
        for (const day of daysOfWeek) {
          schedules.push({
            tenant_id: tenantId,
            class_id: classInfo.id,
            classroom_id: classroom.id,
            time_slot_id: timeSlot.id,
            day_of_week: day,
            effective_from: new Date().toISOString().split('T')[0],
            is_recurring: true,
            recurrence_weeks: 1,
            is_active: true,
            notes: `${classInfo.name} 정규 수업`
          })
        }
      }

      if (schedules.length > 0) {
        const { data: insertedSchedules, error: schedulesError } = await supabase
          .from('class_classroom_schedules')
          .insert(schedules)
          .select()

        if (schedulesError) {
          console.error('❌ 스케줄 생성 실패:', schedulesError)
        } else {
          schedulesCreated = insertedSchedules?.length || 0
        }
      }
    }

    // 6. 결과 반환
    const result = {
      tenant_id: tenantId,
      classes_count: classes.length,
      classrooms_count: classrooms.length,
      time_slots_count: timeSlots.length,
      schedules_created: schedulesCreated,
      class_classroom_connections: classes.map((cls, index) => ({
        class_name: cls.name,
        default_classroom: classrooms[index % classrooms.length]?.name || '미배정'
      }))
    }

    console.log('✅ 클래스-교실 연관관계 설정 완료')

    return Response.json({ 
      success: true, 
      message: '클래스-교실 연관관계가 성공적으로 설정되었습니다',
      data: result
    })

  } catch (error) {
    console.error('❌ API 실행 중 오류:', error)
    return Response.json({ 
      success: false, 
      error: 'API 실행 중 오류가 발생했습니다',
      detail: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}