// tenant_users 테이블 상세 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTenantUsersTable() {
  console.log('🔍 tenant_users 테이블 상세 확인...');
  
  try {
    // 1. 테이블 구조 확인
    console.log('\n📋 테이블 존재 여부:');
    const { data: tableCheck, error: tableError } = await supabase
      .from('tenant_users')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log(`❌ tenant_users: ${tableError.message} (코드: ${tableError.code})`);
      
      // PostgREST 스키마 캐시 문제일 수 있음
      if (tableError.code === 'PGRST205') {
        console.log('\n🔄 PostgREST 스키마 캐시 문제일 수 있습니다.');
        console.log('   테이블은 존재하지만 PostgREST가 인식하지 못하는 상태');
        console.log('   Supabase Dashboard에서 직접 확인이 필요합니다.');
      }
    } else {
      console.log(`✅ tenant_users: 존재하고 접근 가능 (${tableCheck.length}개 레코드)`);
      
      if (tableCheck.length > 0) {
        console.log('📄 첫 번째 레코드 구조:');
        console.log(JSON.stringify(tableCheck[0], null, 2));
      }
    }

    // 2. 다른 테이블들과 비교
    console.log('\n📊 다른 테이블들과 비교:');
    const testTables = ['tenants', 'tenant_roles', 'students', 'classes'];
    
    for (const tableName of testTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: 접근 가능 (${data.length}개 레코드)`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: 예외 - ${err.message}`);
      }
    }

    // 3. SQL 직접 실행해서 테이블 확인 시도
    console.log('\n🔧 SQL을 통한 테이블 존재 확인:');
    
    try {
      // 간단한 SQL 함수 호출로 테이블 존재 여부 확인
      const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            table_name,
            column_name,
            data_type
          FROM information_schema.columns 
          WHERE table_name = 'tenant_users' 
          AND table_schema = 'public'
          ORDER BY ordinal_position
          LIMIT 5;
        `
      });

      if (sqlError) {
        console.log('❌ SQL RPC 실행 실패:', sqlError.message);
      } else {
        console.log('✅ tenant_users 컬럼 정보:');
        sqlResult.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type}`);
        });
      }
    } catch (err) {
      console.log('❌ SQL 실행 실패:', err.message);
    }

  } catch (error) {
    console.error('❌ 전체 에러:', error);
  }
}

console.log('🚀 tenant_users 테이블 상세 검사');
console.log('=' .repeat(50));

checkTenantUsersTable().then(() => {
  console.log('\n' + '='.repeat(50));
  console.log('✨ 상세 검사 완료');
}).catch(error => {
  console.error('\n❌ 검사 중 오류:', error);
});