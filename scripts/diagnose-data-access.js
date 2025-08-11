#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminSupabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function diagnoseDataAccess() {
  console.log('🔍 데이터 접근 진단 중...\n');

  try {
    // 1. admin@test.com 사용자 정보
    console.log('1️⃣ admin@test.com 사용자 정보:');
    const { data: authUsers } = await adminSupabase.auth.admin.listUsers();
    const adminUser = authUsers.users.find(u => u.email === 'admin@test.com');
    
    if (!adminUser) {
      console.log('❌ admin@test.com 사용자를 찾을 수 없습니다.');
      return;
    }
    
    console.log(`✅ 사용자 ID: ${adminUser.id}`);
    console.log(`✅ 이메일: ${adminUser.email}`);
    console.log('');

    // 2. admin@test.com이 속한 테넌트들
    console.log('2️⃣ admin@test.com의 테넌트 멤버십:');
    const { data: userTenants } = await adminSupabase
      .from('tenant_users')
      .select(`
        tenant_id,
        email,
        name,
        status,
        tenant:tenants(id, name, slug),
        role:tenant_roles(name, hierarchy_level)
      `)
      .eq('user_id', adminUser.id);

    if (!userTenants || userTenants.length === 0) {
      console.log('❌ admin@test.com이 어떤 테넌트에도 속해 있지 않습니다!');
      return;
    }

    console.log(`✅ ${userTenants.length}개 테넌트에 속해 있음:`);
    userTenants.forEach((ut, i) => {
      console.log(`   ${i + 1}. ${ut.tenant?.name} (${ut.tenant?.slug})`);
      console.log(`      역할: ${ut.role?.name || 'N/A'} (Level ${ut.role?.hierarchy_level || 'N/A'})`);
      console.log(`      상태: ${ut.status}`);
      console.log(`      테넌트 ID: ${ut.tenant_id}`);
      console.log('');
    });

    // 3. 각 테넌트별 샘플 데이터 확인
    console.log('3️⃣ 각 테넌트별 샘플 데이터 현황:');
    
    for (const ut of userTenants) {
      console.log(`--- ${ut.tenant?.name} (${ut.tenant_id}) ---`);
      
      // Students 데이터
      const { data: students, count: studentCount } = await adminSupabase
        .from('students')
        .select('*', { count: 'exact' })
        .eq('tenant_id', ut.tenant_id);
      
      console.log(`   📚 학생: ${studentCount || 0}명`);
      if (students && students.length > 0) {
        students.slice(0, 2).forEach((student, i) => {
          console.log(`      ${i + 1}. ${student.name} (${student.status})`);
        });
      }

      // Classes 데이터
      const { data: classes, count: classCount } = await adminSupabase
        .from('classes')
        .select('*', { count: 'exact' })
        .eq('tenant_id', ut.tenant_id);
      
      console.log(`   🏫 클래스: ${classCount || 0}개`);
      if (classes && classes.length > 0) {
        classes.slice(0, 2).forEach((cls, i) => {
          console.log(`      ${i + 1}. ${cls.name} (${cls.status || 'N/A'})`);
        });
      }

      console.log('');
    }

    // 4. 전체 데이터 현황 (모든 테넌트)
    console.log('4️⃣ 전체 데이터베이스 현황:');
    
    const { data: allStudents, count: allStudentCount } = await adminSupabase
      .from('students')
      .select('tenant_id', { count: 'exact' });
    
    const { data: allClasses, count: allClassCount } = await adminSupabase
      .from('classes')
      .select('tenant_id', { count: 'exact' });

    console.log(`   📚 전체 학생: ${allStudentCount || 0}명`);
    console.log(`   🏫 전체 클래스: ${allClassCount || 0}개`);

    // 테넌트별 분포
    if (allStudents && allStudents.length > 0) {
      const tenantDistribution = {};
      allStudents.forEach(s => {
        tenantDistribution[s.tenant_id] = (tenantDistribution[s.tenant_id] || 0) + 1;
      });
      
      console.log('   📊 테넌트별 학생 분포:');
      Object.entries(tenantDistribution).forEach(([tenantId, count]) => {
        const tenant = userTenants.find(ut => ut.tenant_id === tenantId);
        console.log(`      ${tenant?.tenant?.name || tenantId}: ${count}명`);
      });
    }
    console.log('');

    // 5. RLS 정책 시뮬레이션 테스트
    console.log('5️⃣ RLS 정책 시뮬레이션:');
    
    for (const ut of userTenants) {
      console.log(`--- ${ut.tenant?.name}에서의 RLS 테스트 ---`);
      
      // 해당 테넌트에 속한 데이터를 RLS 없이 확인
      const { data: expectedStudents } = await adminSupabase
        .from('students')
        .select('*')
        .eq('tenant_id', ut.tenant_id);
      
      const { data: expectedClasses } = await adminSupabase
        .from('classes')
        .select('*')
        .eq('tenant_id', ut.tenant_id);

      console.log(`   예상 결과: 학생 ${expectedStudents?.length || 0}명, 클래스 ${expectedClasses?.length || 0}개`);
      
      if ((expectedStudents?.length || 0) === 0 && (expectedClasses?.length || 0) === 0) {
        console.log(`   ⚠️  이 테넌트에는 샘플 데이터가 없습니다!`);
        console.log(`   💡 샘플 데이터를 ${ut.tenant_id}에 추가해야 합니다.`);
      }
      console.log('');
    }

    // 6. 해결책 제안
    console.log('🔧 해결책:');
    
    const hasDataTenant = userTenants.find(ut => {
      // 이 테넌트에 데이터가 있는지 확인 (이미 위에서 조회함)
      return true; // 일단 모든 테넌트 체크
    });

    if (hasDataTenant) {
      console.log('   1. 현재 사용자가 속한 테넌트에 샘플 데이터 추가');
      console.log('   2. 또는 샘플 데이터가 있는 테넌트에 사용자 추가');
      console.log('');
      console.log('   추천: 현재 사용자의 첫 번째 테넌트에 샘플 데이터 추가');
      console.log(`   타겟 테넌트: ${userTenants[0]?.tenant?.name} (${userTenants[0]?.tenant_id})`);
    }

  } catch (error) {
    console.error('❌ 진단 중 오류:', error);
  }
}

if (require.main === module) {
  diagnoseDataAccess().catch(console.error);
}