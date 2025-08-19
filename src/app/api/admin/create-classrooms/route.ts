import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * classrooms 테이블 생성을 위한 관리자 전용 API
 * POST /api/admin/create-classrooms
 */
export async function POST(_request: NextRequest) {
  try {
    console.log('🚀 classrooms 테이블 생성 API 시작')

    // Service Role로 Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. 먼저 기존 테이블 확인
    const { error: checkError } = await supabase
      .from('classrooms')
      .select('id')
      .limit(1)

    if (!checkError) {
      console.log('✅ classrooms 테이블이 이미 존재합니다')
      return Response.json({ 
        success: true, 
        message: 'classrooms 테이블이 이미 존재합니다' 
      })
    }

    console.log('📝 classrooms 테이블이 없습니다. 샘플 데이터로 확인합니다.')

    // 2. 샘플 테넌트 조회
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

    // 3. 샘플 교실 데이터 생성 시도
    console.log('🎯 샘플 교실 데이터 생성 시도...')
    
    const sampleClassrooms = [
      {
        tenant_id: tenantId,
        name: '수학 1강의실',
        building: '본관',
        floor: 2,
        room_number: '201',
        capacity: 30,
        classroom_type: 'general',
        description: '수학 전용 강의실',
        status: 'available',
        is_bookable: true,
        hourly_rate: 0
      },
      {
        tenant_id: tenantId,
        name: '영어 토론실',
        building: '본관',
        floor: 2,
        room_number: '202',
        capacity: 20,
        classroom_type: 'seminar',
        description: '영어 토론 및 발표 전용실',
        status: 'available',
        is_bookable: true,
        hourly_rate: 0
      },
      {
        tenant_id: tenantId,
        name: '과학 실험실',
        building: '본관',
        floor: 3,
        room_number: '301',
        capacity: 25,
        classroom_type: 'lab',
        description: '물리/화학 실험실',
        status: 'available',
        is_bookable: true,
        hourly_rate: 0
      }
    ]

    const { data: insertedRooms, error: insertError } = await supabase
      .from('classrooms')
      .insert(sampleClassrooms)
      .select()

    if (insertError) {
      console.error('❌ 샘플 데이터 생성 실패:', insertError.message)
      
      // 테이블이 없는 경우의 안내 메시지
      if (insertError.message.includes('table') && insertError.message.includes('does not exist')) {
        return Response.json({ 
          success: false, 
          error: 'classrooms 테이블이 존재하지 않습니다',
          solution: [
            '1. Supabase Dashboard에 로그인하세요',
            '2. SQL Editor에서 add_classrooms_table.sql의 내용을 실행하세요',
            '3. 또는 다음 SQL을 직접 실행하세요:'
          ],
          sql: `
-- ENUM 타입 생성
CREATE TYPE classroom_status AS ENUM ('available', 'occupied', 'maintenance', 'reserved');
CREATE TYPE classroom_type AS ENUM ('general', 'lab', 'seminar', 'lecture_hall', 'study_room');

-- 테이블 생성
CREATE TABLE classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    building VARCHAR(50),
    floor INTEGER DEFAULT 1,
    room_number VARCHAR(20),
    capacity INTEGER NOT NULL,
    area DECIMAL(8,2),
    classroom_type classroom_type DEFAULT 'general',
    facilities JSONB DEFAULT '{}',
    equipment_list TEXT[],
    suitable_subjects TEXT[],
    special_features TEXT[],
    status classroom_status DEFAULT 'available',
    is_bookable BOOLEAN DEFAULT true,
    hourly_rate INTEGER DEFAULT 0,
    description TEXT,
    photo_urls TEXT[],
    qr_code VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_tenant_classroom_name UNIQUE(tenant_id, name),
    CONSTRAINT check_capacity_positive CHECK (capacity > 0),
    CONSTRAINT check_floor_positive CHECK (floor >= 0),
    CONSTRAINT check_hourly_rate_non_negative CHECK (hourly_rate >= 0)
);

-- RLS 정책
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their tenant's classrooms" ON classrooms FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "System admins can access all classrooms" ON classrooms FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'system_admin'));
          `,
          detail: insertError.message 
        }, { status: 400 })
      }

      return Response.json({ 
        success: false, 
        error: '교실 데이터 생성 실패',
        detail: insertError.message 
      }, { status: 500 })
    }

    console.log('✅ 샘플 교실 데이터가 성공적으로 생성되었습니다!')
    console.log(`📊 생성된 교실 수: ${insertedRooms.length}`)

    return Response.json({ 
      success: true, 
      message: '교실 데이터가 성공적으로 생성되었습니다',
      data: {
        created_classrooms: insertedRooms.length,
        classrooms: insertedRooms.map(room => ({
          id: room.id,
          name: room.name,
          building: room.building,
          room_number: room.room_number,
          capacity: room.capacity,
          type: room.classroom_type
        }))
      }
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