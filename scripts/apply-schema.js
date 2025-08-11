#!/usr/bin/env node

/**
 * EduCanvas Database Schema Migration Script
 * This script applies the v4.1 database schema to the Supabase database.
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Environment variables check
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_KEY)
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function readSchemaFile() {
  const schemaPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250810_v4.1_multitenant_video.sql')
  
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`)
  }
  
  return fs.readFileSync(schemaPath, 'utf-8')
}

async function checkConnection() {
  console.log('🔍 Testing database connection...')
  
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1)
    
    if (error) {
      throw new Error(`Connection failed: ${error.message}`)
    }
    
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    return false
  }
}

async function checkExistingTables() {
  console.log('🔍 Checking existing tables...')
  
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
  
  if (error) {
    throw new Error(`Failed to check tables: ${error.message}`)
  }
  
  const tableNames = tables.map(t => t.table_name)
  console.log(`📊 Found ${tableNames.length} existing tables:`, tableNames.slice(0, 5).join(', ') + (tableNames.length > 5 ? '...' : ''))
  
  return tableNames
}

async function executeSchema(schemaSQL) {
  console.log('🚀 Applying database schema...')
  console.log(`📄 Schema size: ${(schemaSQL.length / 1024).toFixed(1)}KB`)
  
  // Split schema into manageable chunks (avoid giant single queries)
  const statements = schemaSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== '')
  
  console.log(`📝 Executing ${statements.length} SQL statements...`)
  
  let successCount = 0
  let errorCount = 0
  const errors = []
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'
    
    try {
      // Skip comments and empty statements
      if (statement.trim().startsWith('--') || statement.trim() === ';') {
        continue
      }
      
      console.log(`   ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`)
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      
      if (error) {
        errorCount++
        errors.push({ statement: i + 1, error: error.message, sql: statement.substring(0, 100) })
        console.warn(`   ⚠️  Warning: ${error.message}`)
      } else {
        successCount++
      }
      
      // Small delay to avoid overwhelming the database
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
    } catch (err) {
      errorCount++
      errors.push({ statement: i + 1, error: err.message, sql: statement.substring(0, 100) })
      console.error(`   ❌ Error: ${err.message}`)
    }
  }
  
  console.log(`\n📊 Schema application summary:`)
  console.log(`   ✅ Successful: ${successCount}`)
  console.log(`   ⚠️  Warnings/Errors: ${errorCount}`)
  
  if (errors.length > 0) {
    console.log(`\n🔍 Detailed errors (first 5):`)
    errors.slice(0, 5).forEach(err => {
      console.log(`   Statement ${err.statement}: ${err.error}`)
    })
  }
  
  return { successCount, errorCount, errors }
}

async function verifySchema() {
  console.log('🔍 Verifying schema application...')
  
  const expectedTables = [
    'tenants', 'tenant_users', 'tenant_roles', 'permissions',
    'students', 'classes', 'instructors', 'course_packages', 
    'student_enrollments', 'payments', 'attendances',
    'video_lectures', 'student_video_access', 'video_watch_sessions'
  ]
  
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
  
  if (error) {
    throw new Error(`Verification failed: ${error.message}`)
  }
  
  const existingTables = tables.map(t => t.table_name)
  const missingTables = expectedTables.filter(table => !existingTables.includes(table))
  const presentTables = expectedTables.filter(table => existingTables.includes(table))
  
  console.log(`📊 Schema verification:`)
  console.log(`   ✅ Present: ${presentTables.length}/${expectedTables.length} core tables`)
  console.log(`   ❌ Missing: ${missingTables.length} tables`)
  
  if (missingTables.length > 0) {
    console.log(`   Missing tables: ${missingTables.join(', ')}`)
  }
  
  return missingTables.length === 0
}

async function main() {
  console.log('🎯 EduCanvas Database Schema Migration')
  console.log('=====================================\n')
  
  try {
    // Step 1: Check connection
    const connected = await checkConnection()
    if (!connected) {
      process.exit(1)
    }
    
    // Step 2: Check existing state
    await checkExistingTables()
    
    // Step 3: Read schema file
    console.log('📖 Reading schema file...')
    const schemaSQL = await readSchemaFile()
    
    // Step 4: Apply schema
    const result = await executeSchema(schemaSQL)
    
    // Step 5: Verify results
    const verified = await verifySchema()
    
    console.log('\n🎉 Migration completed!')
    console.log(`   Schema verification: ${verified ? '✅ PASSED' : '❌ FAILED'}`)
    
    if (!verified) {
      console.log('\n⚠️  Some tables may be missing. Check the errors above.')
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// Handle environment loading for local execution
if (require.main === module) {
  // Try to load .env.local if available
  try {
    const dotenv = require('dotenv')
    dotenv.config({ path: path.join(__dirname, '..', '.env.local') })
  } catch (e) {
    console.log('Note: dotenv not available, using existing environment variables')
  }
  
  main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

module.exports = { main }