#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, serviceKey);

async function applyRlsPolicies() {
  try {
    console.log('🚀 Applying RLS policies to Supabase...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'database', 'migrations', 't005-rls-policies-v4.1-fixed.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL file loaded:', sqlPath);
    console.log('📦 SQL content length:', sqlContent.length, 'characters');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: sqlContent
    });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Try alternative approach - split by statements
      console.log('🔄 Trying to execute statements individually...');
      
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (stmt.includes('DO $$') || stmt.includes('END$$')) {
          // Skip complex blocks for now
          console.log(`⏭️  Skipping complex statement ${i + 1}/${statements.length}`);
          continue;
        }
        
        try {
          const { error: stmtError } = await supabase.rpc('execute_sql', {
            sql_query: stmt + ';'
          });
          
          if (stmtError) {
            console.error(`❌ Error in statement ${i + 1}:`, stmtError.message);
            errorCount++;
          } else {
            console.log(`✅ Statement ${i + 1}/${statements.length} executed successfully`);
            successCount++;
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err.message);
          errorCount++;
        }
      }
      
      console.log(`📊 Summary: ${successCount} successful, ${errorCount} errors`);
      
    } else {
      console.log('✅ RLS policies applied successfully!');
      console.log('📄 Result:', data);
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Check if execute_sql function exists
async function checkExecuteSqlFunction() {
  console.log('🔍 Checking if execute_sql function exists...');
  
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_query: 'SELECT 1 as test;'
  });
  
  if (error) {
    console.log('❌ execute_sql function not available:', error.message);
    console.log('📝 Will need to execute SQL manually via Supabase Dashboard');
    return false;
  } else {
    console.log('✅ execute_sql function available');
    return true;
  }
}

async function main() {
  console.log('🏁 Starting RLS policies application...');
  console.log('🔗 Supabase URL:', supabaseUrl);
  
  const canExecute = await checkExecuteSqlFunction();
  
  if (canExecute) {
    await applyRlsPolicies();
  } else {
    console.log('\n📋 Manual execution required:');
    console.log('1. Open Supabase Dashboard SQL Editor');
    console.log('2. Copy contents of: database/migrations/t005-rls-policies-v4.1-fixed.sql');
    console.log('3. Execute the SQL manually');
    console.log('4. Then test at: http://localhost:3000/test-auth');
  }
}

if (require.main === module) {
  main().catch(console.error);
}