#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugTenantUserConnection() {
  console.log('🔍 테넌트-사용자 연결 디버깅 중...\n');

  try {
    // 1. Auth 사용자 확인
    console.log('1️⃣ Auth 사용자 목록:');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Auth 사용자 조회 실패:', authError.message);
    } else {
      console.log(`📋 총 ${authUsers.users.length}명의 인증 사용자 발견:`);
      authUsers.users.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.email} (ID: ${user.id})`);
      });
    }
    console.log('');

    // 2. 테넌트 확인
    console.log('2️⃣ 테넌트 목록:');
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('*');
    
    if (tenantError) {
      console.error('❌ 테넌트 조회 실패:', tenantError.message);
    } else if (tenants.length === 0) {
      console.log('❌ 테넌트가 전혀 없습니다!');
    } else {
      console.log(`📋 총 ${tenants.length}개의 테넌트 발견:`);
      tenants.forEach((tenant, i) => {
        console.log(`   ${i + 1}. ${tenant.name} (${tenant.slug}) - ID: ${tenant.id}`);
      });
    }
    console.log('');

    // 3. 테넌트 역할 확인
    console.log('3️⃣ 테넌트 역할 목록:');
    const { data: roles, error: roleError } = await supabase
      .from('tenant_roles')
      .select('*');
    
    if (roleError) {
      console.error('❌ 테넌트 역할 조회 실패:', roleError.message);
    } else if (roles.length === 0) {
      console.log('❌ 테넌트 역할이 전혀 없습니다!');
    } else {
      console.log(`📋 총 ${roles.length}개의 역할 발견:`);
      roles.forEach((role, i) => {
        console.log(`   ${i + 1}. ${role.display_name || role.name} (Level ${role.hierarchy_level}) - Tenant: ${role.tenant_id}`);
      });
    }
    console.log('');

    // 4. 테넌트 사용자 연결 확인
    console.log('4️⃣ 테넌트-사용자 연결 목록:');
    const { data: tenantUsers, error: tenantUserError } = await supabase
      .from('tenant_users')
      .select('*');
    
    if (tenantUserError) {
      console.error('❌ 테넌트 사용자 조회 실패:', tenantUserError.message);
    } else if (tenantUsers.length === 0) {
      console.log('❌ 테넌트-사용자 연결이 전혀 없습니다!');
      console.log('');
      console.log('🔧 문제 해결 방법:');
      console.log('   데이터가 생성되었지만 연결이 안된 상태입니다.');
      console.log('   다시 create-initial-data.js를 실행하거나');
      console.log('   수동으로 테넌트-사용자를 연결해야 합니다.');
    } else {
      console.log(`📋 총 ${tenantUsers.length}개의 테넌트-사용자 연결 발견:`);
      tenantUsers.forEach((tu, i) => {
        console.log(`   ${i + 1}. ${tu.email} → Tenant: ${tu.tenant_id} (Role: ${tu.primary_role_id})`);
      });
    }
    console.log('');

    // 5. admin@test.com 사용자 특별 확인
    console.log('5️⃣ admin@test.com 사용자 특별 확인:');
    
    const adminUser = authUsers.users?.find(u => u.email === 'admin@test.com');
    if (!adminUser) {
      console.log('❌ admin@test.com 사용자가 auth.users에 없습니다!');
    } else {
      console.log(`✅ admin@test.com 사용자 발견: ${adminUser.id}`);
      
      const adminTenantUser = tenantUsers?.find(tu => tu.user_id === adminUser.id);
      if (!adminTenantUser) {
        console.log('❌ admin@test.com이 어떤 테넌트에도 연결되어 있지 않습니다!');
        console.log('');
        console.log('🔧 즉시 수정:');
        
        if (tenants.length > 0 && roles.length > 0) {
          const firstTenant = tenants[0];
          const ownerRole = roles.find(r => r.hierarchy_level === 1) || roles[0];
          
          console.log(`   테넌트 ${firstTenant.name}에 admin@test.com을 연결합니다...`);
          
          const { error: insertError } = await supabase
            .from('tenant_users')
            .insert({
              tenant_id: firstTenant.id,
              user_id: adminUser.id,
              email: adminUser.email,
              name: 'Admin User',
              primary_role_id: ownerRole.id,
              status: 'active'
            });
          
          if (insertError) {
            console.error('❌ 연결 실패:', insertError.message);
          } else {
            console.log('✅ admin@test.com을 테넌트에 성공적으로 연결했습니다!');
          }
        }
      } else {
        console.log(`✅ admin@test.com이 테넌트 ${adminTenantUser.tenant_id}에 연결되어 있습니다!`);
      }
    }

  } catch (error) {
    console.error('❌ 디버깅 중 오류 발생:', error);
  }
}

if (require.main === module) {
  debugTenantUserConnection().catch(console.error);
}