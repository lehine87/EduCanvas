#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Admin client with service role key
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createInitialData() {
  console.log('🚀 기본 데이터 생성 중...\n');

  try {
    // 1. 테넌트 생성
    console.log('1️⃣ 테넌트 생성 중...');
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .upsert({
        name: '테스트 학원',
        slug: 'test-academy',
        contact_email: 'admin@test-academy.com',
        contact_phone: '02-1234-5678',
        address: '서울시 강남구 테헤란로 123',
        settings: {
          timezone: 'Asia/Seoul',
          currency: 'KRW',
          theme: 'blue'
        },
        features: {
          video_lectures: true,
          online_payments: true,
          advanced_reports: true
        },
        limits: {
          max_students: 1000,
          max_instructors: 50,
          storage_gb: 100
        },
        subscription_tier: 'premium',
        subscription_status: 'active',
        is_active: true
      }, {
        onConflict: 'slug'
      })
      .select()
      .single();

    if (tenantError) {
      console.error('❌ 테넌트 생성 실패:', tenantError.message);
      return;
    }

    console.log('✅ 테넌트 생성됨:', tenantData.id);
    const tenantId = tenantData.id;

    // 2. 테넌트 역할 생성
    console.log('2️⃣ 테넌트 역할 생성 중...');
    const roles = [
      { name: 'owner', display_name: 'Owner', hierarchy_level: 1, description: '원장' },
      { name: 'admin', display_name: 'Admin', hierarchy_level: 2, description: '관리자' },
      { name: 'instructor', display_name: 'Instructor', hierarchy_level: 3, description: '강사' },
      { name: 'staff', display_name: 'Staff', hierarchy_level: 4, description: '직원' },
      { name: 'viewer', display_name: 'Viewer', hierarchy_level: 5, description: '조회자' }
    ];

    const rolePromises = roles.map(role => 
      supabase
        .from('tenant_roles')
        .upsert({
          tenant_id: tenantId,
          name: role.name,
          display_name: role.display_name,
          hierarchy_level: role.hierarchy_level,
          description: role.description,
          base_permissions: {
            students: role.hierarchy_level <= 4 ? ['read', 'write'] : ['read'],
            classes: role.hierarchy_level <= 3 ? ['read', 'write'] : ['read'],
            payments: role.hierarchy_level <= 2 ? ['read', 'write', 'delete'] : ['read'],
            settings: role.hierarchy_level <= 2 ? ['read', 'write'] : []
          },
          is_system_role: true,
          is_assignable: true
        }, {
          onConflict: 'tenant_id,name'
        })
        .select()
        .single()
    );

    const roleResults = await Promise.all(rolePromises);
    const createdRoles = roleResults.map(result => result.data).filter(Boolean);
    console.log('✅ 역할 생성됨:', createdRoles.length + '개');

    // 3. 테스트 클래스 생성
    console.log('3️⃣ 테스트 클래스 생성 중...');
    const classes = [
      { name: '수학 기초반', description: '초등 수학 기초 과정' },
      { name: '영어 회화반', description: '영어 회화 중급 과정' },
      { name: '과학 실험반', description: '중등 과학 실험 과정' }
    ];

    const classPromises = classes.map(cls => 
      supabase
        .from('classes')
        .upsert({
          tenant_id: tenantId,
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
        })
        .select()
        .single()
    );

    const classResults = await Promise.all(classPromises);
    const createdClasses = classResults.map(result => result.data).filter(Boolean);
    console.log('✅ 클래스 생성됨:', createdClasses.length + '개');

    // 4. 테스트 학생 생성
    console.log('4️⃣ 테스트 학생 생성 중...');
    const students = [
      { name: '김철수', phone: '010-1234-5678', grade: '초등 5학년' },
      { name: '이영희', phone: '010-2345-6789', grade: '중등 1학년' },
      { name: '박민준', phone: '010-3456-7890', grade: '초등 6학년' },
      { name: '최지연', phone: '010-4567-8901', grade: '중등 2학년' },
      { name: '정수현', phone: '010-5678-9012', grade: '초등 4학년' }
    ];

    const studentPromises = students.map(student => 
      supabase
        .from('students')
        .upsert({
          tenant_id: tenantId,
          name: student.name,
          phone: student.phone,
          grade: student.grade,
          status: 'active',
          enrollment_date: new Date().toISOString(),
          additional_info: {
            parent_name: student.name.replace(/[철수|영희|민준|지연|수현]/, '') + '어머니',
            emergency_contact: student.phone
          }
        }, {
          onConflict: 'tenant_id,name,phone'
        })
        .select()
        .single()
    );

    const studentResults = await Promise.all(studentPromises);
    const createdStudents = studentResults.map(result => result.data).filter(Boolean);
    console.log('✅ 학생 생성됨:', createdStudents.length + '개');

    // 5. 기존 테스트 사용자들을 tenant_users에 연결
    console.log('5️⃣ 테스트 사용자를 테넌트에 연결 중...');
    
    // 기존 auth 사용자들 가져오기
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Auth 사용자 목록 가져오기 실패:', authError.message);
    } else {
      console.log('📋 발견된 auth 사용자:', authUsers.users.length + '명');
      
      for (let i = 0; i < authUsers.users.length && i < createdRoles.length; i++) {
        const user = authUsers.users[i];
        const role = createdRoles[i];
        
        const { error: tenantUserError } = await supabase
          .from('tenant_users')
          .upsert({
            tenant_id: tenantId,
            user_id: user.id,
            email: user.email,
            name: user.email.split('@')[0].replace('.', ' ').toUpperCase(),
            primary_role_id: role.id,
            status: 'active'
          }, {
            onConflict: 'tenant_id,user_id'
          });
        
        if (tenantUserError) {
          console.error(`❌ 테넌트 사용자 연결 실패 (${user.email}):`, tenantUserError.message);
        } else {
          console.log(`✅ 테넌트 사용자 연결됨: ${user.email} -> ${role.name}`);
        }
      }
    }

    // 최종 확인
    console.log('\n🎉 기본 데이터 생성 완료!');
    console.log(`📊 생성된 데이터:`);
    console.log(`   - 테넌트: 1개 (${tenantData.name})`);
    console.log(`   - 역할: ${createdRoles.length}개`);
    console.log(`   - 클래스: ${createdClasses.length}개`);
    console.log(`   - 학생: ${createdStudents.length}개`);
    
    console.log('\n🔗 테스트 페이지: http://localhost:3000/test-auth');
    console.log('🔑 로그인 계정: admin@test.com / admin123456');

  } catch (err) {
    console.error('❌ 예상치 못한 오류:', err);
  }
}

if (require.main === module) {
  createInitialData().catch(console.error);
}