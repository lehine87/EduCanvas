#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminSupabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function addSimpleSamples() {
  console.log('📝 간단한 샘플 데이터 추가 중...\n');

  try {
    // 1. 첫 번째 테넌트 가져오기
    const { data: tenants } = await adminSupabase
      .from('tenants')
      .select('id, name')
      .limit(1);

    if (!tenants || tenants.length === 0) {
      console.log('❌ 테넌트가 없습니다.');
      return;
    }

    const tenant = tenants[0];
    console.log(`🏢 테넌트: ${tenant.name} (${tenant.id})`);
    console.log('');

    // 2. 간단한 학생 데이터 추가 (최소 컬럼만)
    console.log('📚 간단한 학생 데이터 추가...');
    const simpleStudents = [
      { name: '김철수', status: 'active' },
      { name: '이영희', status: 'active' },
      { name: '박민준', status: 'active' }
    ];

    for (const student of simpleStudents) {
      const { error: studentError } = await adminSupabase
        .from('students')
        .upsert({
          tenant_id: tenant.id,
          name: student.name,
          status: student.status
        }, {
          onConflict: 'tenant_id,name'
        });

      if (studentError) {
        console.error(`❌ 학생 ${student.name}:`, studentError.message);
      } else {
        console.log(`✅ 학생 ${student.name} 추가/업데이트 성공`);
      }
    }

    // 3. 간단한 클래스 데이터 추가 (최소 컬럼만)
    console.log('\n🏫 간단한 클래스 데이터 추가...');
    const simpleClasses = [
      { name: '수학반', status: 'active' },
      { name: '영어반', status: 'active' },
      { name: '과학반', status: 'active' }
    ];

    for (const cls of simpleClasses) {
      const { error: classError } = await adminSupabase
        .from('classes')
        .upsert({
          tenant_id: tenant.id,
          name: cls.name,
          status: cls.status
        }, {
          onConflict: 'tenant_id,name'
        });

      if (classError) {
        console.error(`❌ 클래스 ${cls.name}:`, classError.message);
      } else {
        console.log(`✅ 클래스 ${cls.name} 추가/업데이트 성공`);
      }
    }

    // 4. 결과 확인
    console.log('\n📊 최종 데이터 확인...');
    const { data: students, count: studentCount } = await adminSupabase
      .from('students')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenant.id);

    const { data: classes, count: classCount } = await adminSupabase
      .from('classes')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenant.id);

    console.log(`✅ ${tenant.name}:`);
    console.log(`   학생: ${studentCount || 0}명`);
    console.log(`   클래스: ${classCount || 0}개`);
    
    if (students && students.length > 0) {
      console.log('   학생 목록:', students.map(s => s.name).join(', '));
    }
    
    if (classes && classes.length > 0) {
      console.log('   클래스 목록:', classes.map(c => c.name).join(', '));
    }

  } catch (error) {
    console.error('❌ 샘플 데이터 추가 중 오류:', error);
  }
}

if (require.main === module) {
  addSimpleSamples().catch(console.error);
}