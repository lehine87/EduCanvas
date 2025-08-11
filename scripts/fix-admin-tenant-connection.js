#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminSupabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function fixAdminTenantConnection() {
  console.log('🔧 admin@test.com 테넌트 연결 수정 중...\n');

  try {
    // 1. admin@test.com 사용자 정보
    const { data: authUsers } = await adminSupabase.auth.admin.listUsers();
    const adminUser = authUsers.users.find(u => u.email === 'admin@test.com');
    
    if (!adminUser) {
      console.log('❌ admin@test.com 사용자를 찾을 수 없습니다.');
      return;
    }
    
    console.log('1️⃣ admin@test.com 사용자:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   이메일: ${adminUser.email}`);
    console.log('');

    // 2. 기존 연결 확인 및 정리
    console.log('2️⃣ 기존 tenant_users 연결 확인...');
    const { data: existingConnections } = await adminSupabase
      .from('tenant_users')
      .select('*')
      .eq('user_id', adminUser.id);

    if (existingConnections && existingConnections.length > 0) {
      console.log(`   기존 연결 발견: ${existingConnections.length}개`);
      existingConnections.forEach((conn, i) => {
        console.log(`   ${i + 1}. Tenant: ${conn.tenant_id}, Email: ${conn.email}`);
      });
      
      // 기존 연결 삭제 (깔끔하게 다시 시작)
      const { error: deleteError } = await adminSupabase
        .from('tenant_users')
        .delete()
        .eq('user_id', adminUser.id);
        
      if (deleteError) {
        console.error('❌ 기존 연결 삭제 실패:', deleteError.message);
      } else {
        console.log('✅ 기존 연결 삭제 완료');
      }
    } else {
      console.log('   기존 연결 없음');
    }
    console.log('');

    // 3. 사용 가능한 테넌트와 역할 조회
    console.log('3️⃣ 사용 가능한 테넌트와 역할 조회...');
    const { data: tenants } = await adminSupabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: true });

    const { data: roles } = await adminSupabase
      .from('tenant_roles')
      .select('*')
      .order('tenant_id, hierarchy_level');

    console.log(`   테넌트 수: ${tenants?.length || 0}개`);
    console.log(`   역할 수: ${roles?.length || 0}개`);

    if (!tenants || tenants.length === 0) {
      console.log('❌ 테넌트가 없습니다! 먼저 테넌트를 생성하세요.');
      return;
    }

    // 4. admin@test.com을 모든 테넌트에 Owner 권한으로 연결
    console.log('4️⃣ admin@test.com을 모든 테넌트에 Owner로 연결...');
    
    for (const tenant of tenants) {
      // 이 테넌트의 Owner 역할 찾기
      const ownerRole = roles?.find(r => 
        r.tenant_id === tenant.id && r.hierarchy_level === 1
      );

      if (!ownerRole) {
        console.log(`⚠️  ${tenant.name}에 Owner 역할이 없습니다. 건너뜁니다.`);
        continue;
      }

      // tenant_users에 연결
      const { data: inserted, error: insertError } = await adminSupabase
        .from('tenant_users')
        .insert({
          tenant_id: tenant.id,
          user_id: adminUser.id,
          email: adminUser.email,
          name: 'Admin User',
          primary_role_id: ownerRole.id,
          status: 'active'
        })
        .select()
        .single();

      if (insertError) {
        console.error(`❌ ${tenant.name} 연결 실패:`, insertError.message);
      } else {
        console.log(`✅ ${tenant.name} 연결 성공 (Role: ${ownerRole.name})`);
      }
    }
    console.log('');

    // 5. 샘플 데이터 추가 (첫 번째 테넌트에)
    console.log('5️⃣ 첫 번째 테넌트에 샘플 데이터 추가...');
    const firstTenant = tenants[0];
    
    // 샘플 학생 추가
    const sampleStudents = [
      { name: '김철수', phone: '010-1234-5678', grade: '초등 5학년' },
      { name: '이영희', phone: '010-2345-6789', grade: '중등 1학년' },
      { name: '박민준', phone: '010-3456-7890', grade: '초등 6학년' },
      { name: '최지연', phone: '010-4567-8901', grade: '중등 2학년' },
      { name: '정수현', phone: '010-5678-9012', grade: '초등 4학년' }
    ];

    for (const student of sampleStudents) {
      const { error: studentError } = await adminSupabase
        .from('students')
        .upsert({
          tenant_id: firstTenant.id,
          name: student.name,
          phone: student.phone,
          grade: student.grade,
          status: 'active',
          enrollment_date: new Date().toISOString().split('T')[0],
          additional_info: {
            parent_name: student.name.replace(/[철수|영희|민준|지연|수현]/, '') + '어머니',
            emergency_contact: student.phone
          }
        }, {
          onConflict: 'tenant_id,name,phone'
        });

      if (studentError) {
        console.error(`❌ 학생 ${student.name} 추가 실패:`, studentError.message);
      } else {
        console.log(`✅ 학생 ${student.name} 추가 성공`);
      }
    }

    // 샘플 클래스 추가
    const sampleClasses = [
      { name: '수학 기초반', description: '초등 수학 기초 과정' },
      { name: '영어 회화반', description: '영어 회화 중급 과정' },
      { name: '과학 실험반', description: '중등 과학 실험 과정' }
    ];

    for (const cls of sampleClasses) {
      const { error: classError } = await adminSupabase
        .from('classes')
        .upsert({
          tenant_id: firstTenant.id,
          name: cls.name,
          description: cls.description,
          capacity: 15,
          status: 'active',
          schedule: {
            days: ['월', '수', '금'],
            time: '14:00-16:00'
          }
        }, {
          onConflict: 'tenant_id,name'
        });

      if (classError) {
        console.error(`❌ 클래스 ${cls.name} 추가 실패:`, classError.message);
      } else {
        console.log(`✅ 클래스 ${cls.name} 추가 성공`);
      }
    }
    console.log('');

    // 6. 최종 확인
    console.log('6️⃣ 최종 연결 상태 확인...');
    const { data: finalConnections } = await adminSupabase
      .from('tenant_users')
      .select(`
        tenant_id,
        email,
        name,
        status,
        tenant:tenants(name, slug),
        role:tenant_roles(name, hierarchy_level)
      `)
      .eq('user_id', adminUser.id);

    console.log(`✅ admin@test.com이 ${finalConnections?.length || 0}개 테넌트에 연결됨:`);
    finalConnections?.forEach((conn, i) => {
      console.log(`   ${i + 1}. ${conn.tenant?.name} - ${conn.role?.name} (Level ${conn.role?.hierarchy_level})`);
    });

    // 샘플 데이터 확인
    const { count: studentCount } = await adminSupabase
      .from('students')
      .select('*', { count: 'exact' })
      .eq('tenant_id', firstTenant.id);

    const { count: classCount } = await adminSupabase
      .from('classes')
      .select('*', { count: 'exact' })
      .eq('tenant_id', firstTenant.id);

    console.log('');
    console.log(`📊 ${firstTenant.name} 샘플 데이터:`);
    console.log(`   학생: ${studentCount || 0}명`);
    console.log(`   클래스: ${classCount || 0}개`);
    console.log('');
    
    console.log('🎉 수정 완료!');
    console.log('🚀 이제 http://localhost:3001/test-auth 에서 로그인하여');
    console.log('   RLS 테스트를 실행하면 데이터가 보일 것입니다!');

  } catch (error) {
    console.error('❌ 수정 중 오류:', error);
  }
}

if (require.main === module) {
  fixAdminTenantConnection().catch(console.error);
}