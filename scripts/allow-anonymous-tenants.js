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

async function allowAnonymousTenantsAccess() {
  console.log('🔓 테넌트 익명 접근 정책 추가 중...\n');

  try {
    // 임시 익명 접근 정책 추가
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: `
        -- 임시 익명 접근 정책 추가 (테스트용)
        CREATE POLICY IF NOT EXISTS "allow_anonymous_tenant_read" ON tenants
          FOR SELECT 
          TO anon, authenticated
          USING (true);
        
        -- 기존 정책 목록 확인
        SELECT schemaname, tablename, policyname, roles, cmd, qual 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'tenants';
      `
    });

    if (error) {
      console.error('❌ SQL 실행 실패:', error.message);
      
      // 대안: 개별 쿼리로 시도
      console.log('🔄 대안 방법으로 정책 생성 시도...');
      
      const { error: policyError } = await supabase.rpc('create_tenant_policy');
      if (policyError) {
        console.error('❌ 정책 생성 실패:', policyError.message);
        console.log('\n📋 수동 실행이 필요합니다:');
        console.log('Supabase Dashboard > SQL Editor에서 다음을 실행하세요:\n');
        console.log(`CREATE POLICY "allow_anonymous_tenant_read" ON tenants
  FOR SELECT 
  TO anon, authenticated
  USING (true);`);
        return;
      }
    }

    console.log('✅ 익명 접근 정책이 추가되었습니다!');
    console.log('🔗 이제 http://localhost:3000/test-auth 에서 테넌트 목록이 보일 것입니다.');

  } catch (err) {
    console.error('❌ 예상치 못한 오류:', err.message);
  }
}

if (require.main === module) {
  allowAnonymousTenantsAccess().catch(console.error);
}