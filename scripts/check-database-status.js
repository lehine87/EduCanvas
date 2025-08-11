#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey);

async function checkDatabaseStatus() {
  console.log('🔍 데이터베이스 상태 확인 중...\n');
  
  const tables = [
    { name: 'tenants', description: '테넌트 테이블' },
    { name: 'tenant_roles', description: '테넌트 역할 테이블' },
    { name: 'tenant_users', description: '테넌트 사용자 테이블' },
    { name: 'students', description: '학생 테이블' },
    { name: 'classes', description: '클래스 테이블' }
  ];
  
  for (const table of tables) {
    try {
      console.log(`📋 ${table.description} (${table.name}) 확인 중...`);
      
      const { data, error, count } = await supabase
        .from(table.name)
        .select('*', { count: 'exact' })
        .limit(5);
      
      if (error) {
        console.error(`❌ ${table.name}: ${error.message}`);
        
        // RLS 관련 오류인지 확인
        if (error.message.includes('RLS') || error.message.includes('policy')) {
          console.log(`   🔒 RLS 정책 문제로 보입니다. 정책이 적용되지 않았거나 접근 권한이 없습니다.`);
        }
      } else {
        console.log(`✅ ${table.name}: ${count}개 레코드, ${data?.length || 0}개 조회됨`);
        
        if (data && data.length > 0) {
          console.log(`   📄 첫 번째 레코드:`, JSON.stringify(data[0], null, 2));
        }
      }
      console.log('');
      
    } catch (err) {
      console.error(`❌ ${table.name} 오류:`, err.message);
    }
  }
  
  // 특별히 tenants 테이블 상세 확인
  console.log('🎯 tenants 테이블 특별 확인...');
  try {
    const { data: tenantsData, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name, slug, created_at')
      .order('created_at', { ascending: true });
    
    if (tenantsError) {
      console.error('❌ tenants 조회 실패:', tenantsError.message);
      
      // 공개 테이블로 접근해보기 (RLS 우회)
      console.log('🔓 RLS 없이 직접 접근 시도...');
      // 이것은 실제로는 작동하지 않을 것이지만 에러 메시지로 상황 파악 가능
    } else {
      console.log('✅ tenants 데이터:');
      tenantsData.forEach((tenant, index) => {
        console.log(`   ${index + 1}. ${tenant.name} (${tenant.slug}) - ID: ${tenant.id}`);
      });
    }
  } catch (err) {
    console.error('❌ tenants 접근 실패:', err.message);
  }
}

if (require.main === module) {
  checkDatabaseStatus().catch(console.error);
}