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

async function createTestUsers() {
  console.log('🚀 Creating test users for RLS testing...\n');

  const testUsers = [
    {
      email: 'admin@test.com',
      password: 'admin123456',
      name: 'Test Admin',
      role: 'admin'
    },
    {
      email: 'instructor@test.com', 
      password: 'instructor123456',
      name: 'Test Instructor',
      role: 'instructor'
    },
    {
      email: 'staff@test.com',
      password: 'staff123456', 
      name: 'Test Staff',
      role: 'staff'
    }
  ];

  for (const testUser of testUsers) {
    try {
      console.log(`👤 Creating user: ${testUser.email}`);
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true
      });

      if (authError) {
        console.error(`❌ Error creating auth user ${testUser.email}:`, authError.message);
        continue;
      }

      console.log(`✅ Auth user created: ${authData.user.id}`);

      // Get first tenant
      const { data: tenants, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .limit(1)
        .single();

      if (tenantError) {
        console.error('❌ Error getting tenant:', tenantError.message);
        continue;
      }

      // Get appropriate role
      const { data: roles, error: roleError } = await supabase
        .from('tenant_roles')
        .select('id, hierarchy_level')
        .eq('tenant_id', tenants.id)
        .order('hierarchy_level', { ascending: true });

      if (roleError) {
        console.error('❌ Error getting roles:', roleError.message);
        continue;
      }

      let roleId = roles[0]?.id; // Default to first role (usually owner)
      
      if (testUser.role === 'admin' && roles[1]) {
        roleId = roles[1].id;
      } else if (testUser.role === 'instructor' && roles[2]) {
        roleId = roles[2].id;
      } else if (testUser.role === 'staff' && roles[3]) {
        roleId = roles[3].id;
      }

      // Create tenant_user record
      const { error: tenantUserError } = await supabase
        .from('tenant_users')
        .upsert({
          tenant_id: tenants.id,
          user_id: authData.user.id,
          email: testUser.email,
          name: testUser.name,
          primary_role_id: roleId,
          status: 'active'
        }, {
          onConflict: 'tenant_id,user_id'
        });

      if (tenantUserError) {
        console.error(`❌ Error creating tenant user ${testUser.email}:`, tenantUserError.message);
        continue;
      }

      console.log(`✅ Tenant user created for: ${testUser.email}`);
      console.log(`🔑 Login credentials: ${testUser.email} / ${testUser.password}`);
      console.log('');

    } catch (err) {
      console.error(`❌ Unexpected error for ${testUser.email}:`, err.message);
    }
  }

  console.log('🎉 Test users creation completed!');
  console.log('\n📋 Test Login Credentials:');
  testUsers.forEach(user => {
    console.log(`${user.role.toUpperCase().padEnd(10)} | ${user.email} | ${user.password}`);
  });
  
  console.log('\n🔗 Test at: http://localhost:3000/test-auth');
}

if (require.main === module) {
  createTestUsers().catch(console.error);
}