#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Admin client (모든 데이터 확인용)
const adminSupabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// User client (실제 사용자처럼)
const userSupabase = createClient(supabaseUrl, anonKey);

async function debugRLSStepByStep() {
  console.log('🔍 RLS 정책 단계별 디버깅...\n');

  try {
    // 1. 현재 RLS 정책 상태 확인 (Admin 권한)
    console.log('1️⃣ 현재 RLS 정책 상태 확인...');
    const { data: policies, error: policyError } = await adminSupabase.rpc('sql', {
      query: `
        SELECT 
          tablename, 
          policyname, 
          cmd,
          qual,
          with_check
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('tenants', 'tenant_users', 'tenant_roles', 'students', 'classes')
        ORDER BY tablename, policyname;
      `
    });

    if (policyError) {
      console.error('❌ 정책 조회 실패:', policyError.message);
    } else {
      console.log('📋 현재 적용된 RLS 정책들:');
      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`   ${policy.tablename}.${policy.policyname} (${policy.cmd})`);
          if (policy.qual) console.log(`      USING: ${policy.qual.substring(0, 100)}...`);
        });
      } else {
        console.log('   ⚠️  RLS 정책이 없습니다!');
      }
    }
    console.log('');

    // 2. admin@test.com으로 실제 로그인
    console.log('2️⃣ admin@test.com 로그인 테스트...');
    const { data: authData, error: authError } = await userSupabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'admin123456'
    });

    if (authError) {
      console.error('❌ 로그인 실패:', authError.message);
      return;
    }

    console.log('✅ 로그인 성공!');
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}`);
    console.log('');

    // 3. auth.uid() 및 auth.email() 함수 테스트
    console.log('3️⃣ PostgreSQL 함수 테스트...');
    try {
      const { data: funcTest, error: funcError } = await userSupabase.rpc('sql', {
        query: 'SELECT auth.uid() as current_uid, auth.email() as current_email;'
      });

      if (funcError) {
        console.error('❌ 함수 테스트 실패:', funcError.message);
      } else {
        console.log('✅ PostgreSQL 함수 작동:');
        console.log(`   auth.uid(): ${funcTest[0]?.current_uid}`);
        console.log(`   auth.email(): ${funcTest[0]?.current_email}`);
      }
    } catch (err) {
      console.log('⚠️  SQL RPC 함수를 사용할 수 없습니다. 직접 테이블 쿼리로 진행...');
    }
    console.log('');

    // 4. 단계별 테이블 접근 테스트
    console.log('4️⃣ 단계별 테이블 접근 테스트...');
    
    // 4-1. tenant_users (기본)
    console.log('   📋 tenant_users 테이블 접근...');
    const { data: tenantUsers, error: tenantUsersError } = await userSupabase
      .from('tenant_users')
      .select('tenant_id, email, name, status, primary_role_id')
      .eq('status', 'active');

    if (tenantUsersError) {
      console.error('   ❌ tenant_users 접근 실패:', tenantUsersError.message);
      console.error('      Full error:', tenantUsersError);
    } else {
      console.log(`   ✅ tenant_users 접근 성공: ${tenantUsers?.length || 0}개 레코드`);
      tenantUsers?.forEach((tu, i) => {
        console.log(`      ${i + 1}. ${tu.email} → Tenant: ${tu.tenant_id}`);
      });
    }
    console.log('');

    // 4-2. tenants (tenant_users 기반)
    if (tenantUsers && tenantUsers.length > 0) {
      console.log('   🏢 tenants 테이블 접근...');
      const { data: tenants, error: tenantsError } = await userSupabase
        .from('tenants')
        .select('id, name, slug');

      if (tenantsError) {
        console.error('   ❌ tenants 접근 실패:', tenantsError.message);
        console.error('      Full error:', tenantsError);
      } else {
        console.log(`   ✅ tenants 접근 성공: ${tenants?.length || 0}개 레코드`);
        tenants?.forEach((t, i) => {
          console.log(`      ${i + 1}. ${t.name} (${t.slug})`);
        });
      }
      console.log('');

      // 4-3. students (tenant_users 기반)
      console.log('   📚 students 테이블 접근...');
      const { data: students, error: studentsError } = await userSupabase
        .from('students')
        .select('tenant_id, name, status');

      if (studentsError) {
        console.error('   ❌ students 접근 실패:', studentsError.message);
        console.error('      Full error:', studentsError);
      } else {
        console.log(`   ✅ students 접근 성공: ${students?.length || 0}개 레코드`);
        students?.forEach((s, i) => {
          console.log(`      ${i + 1}. ${s.name} (Tenant: ${s.tenant_id})`);
        });
      }
      console.log('');

      // 4-4. classes (tenant_users 기반)
      console.log('   🏫 classes 테이블 접근...');
      const { data: classes, error: classesError } = await userSupabase
        .from('classes')
        .select('tenant_id, name');

      if (classesError) {
        console.error('   ❌ classes 접근 실패:', classesError.message);
        console.error('      Full error:', classesError);
      } else {
        console.log(`   ✅ classes 접근 성공: ${classes?.length || 0}개 레코드`);
        classes?.forEach((c, i) => {
          console.log(`      ${i + 1}. ${c.name} (Tenant: ${c.tenant_id})`);
        });
      }
    }

    // 5. 로그아웃
    await userSupabase.auth.signOut();
    console.log('\n✅ 테스트 완료 및 로그아웃');

    // 6. 종합 진단
    console.log('\n🎯 진단 결과:');
    if (tenantUsersError) {
      console.log('❌ 기본 tenant_users 접근이 실패 → RLS 정책 문제');
      console.log('💡 해결 방법: tenant_users RLS 정책 재검토 필요');
    } else if (tenantUsers && tenantUsers.length === 0) {
      console.log('❌ tenant_users는 접근되지만 레코드가 0개 → 데이터 연결 문제');
      console.log('💡 해결 방법: admin@test.com의 tenant_users 연결 확인');
    } else {
      console.log('✅ 기본 인증 및 데이터 구조는 정상');
      if (tenantsError || studentsError || classesError) {
        console.log('❌ 일부 테이블 RLS 정책에 문제가 있음');
        console.log('💡 해결 방법: 해당 테이블의 RLS 정책 수정 필요');
      }
    }

  } catch (error) {
    console.error('❌ 디버깅 중 예외 발생:', error);
  }
}

if (require.main === module) {
  debugRLSStepByStep().catch(console.error);
}