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

async function testRLSWithActualUser() {
  console.log('🔍 실제 사용자 관점에서 RLS 테스트 중...\n');

  try {
    // 1. admin@test.com으로 실제 로그인 시도
    console.log('1️⃣ admin@test.com으로 실제 로그인 시도...');
    
    const { data: authData, error: authError } = await userSupabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'admin123456'
    });

    if (authError) {
      console.error('❌ 로그인 실패:', authError.message);
      return;
    }

    console.log('✅ 로그인 성공!');
    console.log('   사용자 ID:', authData.user.id);
    console.log('   이메일:', authData.user.email);
    console.log('');

    // 2. 로그인한 상태에서 tenant_users 조회 시도
    console.log('2️⃣ 로그인한 상태에서 tenant_users 조회...');
    
    const { data: tenantUsers, error: tenantUserError } = await userSupabase
      .from('tenant_users')
      .select('tenant_id, primary_role_id, permission_overrides, email, name, status')
      .eq('user_id', authData.user.id)
      .eq('status', 'active');

    if (tenantUserError) {
      console.error('❌ tenant_users 조회 실패:', tenantUserError.message);
      console.error('   전체 오류 객체:', tenantUserError);
      
      // RLS 정책 확인
      console.log('\n🔍 현재 RLS 정책 상태 확인 (Admin 권한으로)...');
      const { data: policies } = await adminSupabase
        .rpc('execute_sql', { 
          sql_query: `
            SELECT tablename, policyname, roles, cmd, qual, with_check 
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = 'tenant_users'
            ORDER BY policyname;
          `
        });
      
      console.log('📋 tenant_users 테이블 RLS 정책:');
      if (policies) {
        console.log(policies);
      }
      
    } else {
      console.log('✅ tenant_users 조회 성공!');
      console.log(`   발견된 레코드 수: ${tenantUsers?.length || 0}`);
      
      if (tenantUsers && tenantUsers.length > 0) {
        console.log('📋 사용자의 테넌트 멤버십:');
        tenantUsers.forEach((tu, i) => {
          console.log(`   ${i + 1}. Tenant: ${tu.tenant_id}, Role: ${tu.primary_role_id}, Status: ${tu.status}`);
        });
        
        // 3. 테넌트 정보 조회 시도
        console.log('\n3️⃣ 테넌트 정보 조회 시도...');
        
        for (const tu of tenantUsers) {
          const { data: tenant, error: tenantError } = await userSupabase
            .from('tenants')
            .select('id, name, slug')
            .eq('id', tu.tenant_id)
            .single();
          
          if (tenantError) {
            console.error(`❌ 테넌트 ${tu.tenant_id} 조회 실패:`, tenantError.message);
          } else {
            console.log(`✅ 테넌트 조회 성공: ${tenant.name} (${tenant.slug})`);
          }
        }
      } else {
        console.log('❌ 사용자에게 연결된 테넌트가 없습니다!');
        
        // Admin 권한으로 실제 데이터 확인
        console.log('\n🔍 Admin 권한으로 실제 데이터 확인...');
        const { data: adminCheck } = await adminSupabase
          .from('tenant_users')
          .select('*')
          .eq('user_id', authData.user.id);
          
        console.log(`📋 실제 tenant_users 레코드 수: ${adminCheck?.length || 0}`);
        if (adminCheck) {
          adminCheck.forEach((record, i) => {
            console.log(`   ${i + 1}. ${JSON.stringify(record, null, 2)}`);
          });
        }
      }
    }

    // 4. 로그아웃
    await userSupabase.auth.signOut();
    console.log('\n✅ 테스트 완료 및 로그아웃');

  } catch (error) {
    console.error('❌ 테스트 중 예외 발생:', error);
  }
}

if (require.main === module) {
  testRLSWithActualUser().catch(console.error);
}