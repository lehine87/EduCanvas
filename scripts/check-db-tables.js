// Supabase 데이터베이스 테이블 확인 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('🔍 Supabase 데이터베이스 테이블 확인 중...');
  console.log('URL:', supabaseUrl);
  console.log('');

  try {
    // 1. 모든 테이블 목록 확인
    const { data: allTables, error: tablesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name, table_type
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `
    });

    if (tablesError) {
      // RPC가 없다면 직접 쿼리 시도
      console.log('📋 모든 public 테이블 목록:');
      
      // 테이블 존재 확인을 위한 간접적 방법
      const testTables = [
        'tenants', 'tenant_users', 'tenant_roles', 'permissions',
        'students', 'classes', 'instructors', 'course_packages',
        'youtube_videos', 'student_video_progress', 'video_assignments',
        'audit_logs'
      ];

      console.log('\n🔍 중요 테이블 존재 여부 확인:');
      
      for (const tableName of testTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('count(*)')
            .limit(1);
          
          if (error) {
            if (error.code === '42P01') {
              console.log(`❌ ${tableName}: 존재하지 않음`);
            } else {
              console.log(`⚠️  ${tableName}: 오류 - ${error.message}`);
            }
          } else {
            console.log(`✅ ${tableName}: 존재함`);
          }
        } catch (err) {
          console.log(`❌ ${tableName}: 접근 불가 - ${err.message}`);
        }
      }
    } else {
      console.log('📋 모든 public 테이블:');
      allTables.forEach(table => {
        console.log(`  - ${table.table_name} (${table.table_type})`);
      });
    }

    // 2. Auth 스키마 확인
    console.log('\n🔐 Auth 스키마 확인:');
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      console.log('Auth 스키마 접근:', authError ? '❌ 실패' : '✅ 성공');
    } catch (err) {
      console.log('Auth 스키마 접근: ❌ 실패');
    }

    // 3. 특별히 tenant_users 테이블 확인
    console.log('\n🏢 Tenant 관련 테이블 상세 확인:');
    
    const tenantTables = ['tenants', 'tenant_users', 'tenant_roles'];
    for (const tableName of tenantTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message} (코드: ${error.code})`);
        } else {
          console.log(`✅ ${tableName}: 존재하고 접근 가능 (${data.length}개 레코드 확인)`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: 예외 발생 - ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ 전체 에러:', error);
  }
}

console.log('🚀 EduCanvas 데이터베이스 테이블 검사 시작');
console.log('=' .repeat(50));

checkTables().then(() => {
  console.log('\n' + '='.repeat(50));
  console.log('✨ 테이블 검사 완료');
}).catch(error => {
  console.error('\n❌ 검사 중 오류 발생:', error);
  process.exit(1);
});