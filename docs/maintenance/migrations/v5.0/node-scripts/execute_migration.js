// Node.js script to execute SQL migration directly
const { createClient } = require('@supabase/supabase-js');

// Read environment variables
const supabaseUrl = 'https://hodkqpmukwfrreozwmcy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZGtxcG11a3dmcnJlb3p3bWN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgyMzQ1MywiZXhwIjoyMDcwMzk5NDUzfQ.EXVHL6BPJ-_NDtcBBH9uWSZPtkIb1_mt9OMRKEnCF_s';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigration() {
    console.log('🚀 Starting classes instructor_id migration...');
    
    try {
        // Step 1: Create backup table
        console.log('📦 Step 1: Creating backup table...');
        const { error: backupError } = await supabase.rpc('exec_sql', {
            query: 'CREATE TABLE IF NOT EXISTS classes_backup_20250825 AS SELECT * FROM classes;'
        });
        
        if (backupError) {
            console.error('❌ Backup failed:', backupError);
            return;
        }
        console.log('✅ Backup completed');
        
        // Step 2: Add new column
        console.log('🔧 Step 2: Adding new column...');
        const { error: columnError } = await supabase.rpc('exec_sql', {
            query: 'ALTER TABLE classes ADD COLUMN IF NOT EXISTS new_instructor_id UUID;'
        });
        
        if (columnError) {
            console.error('❌ Column addition failed:', columnError);
            return;
        }
        console.log('✅ New column added');
        
        // Step 3: Add foreign key constraint
        console.log('🔗 Step 3: Adding foreign key constraint...');
        const { error: fkError } = await supabase.rpc('exec_sql', {
            query: `ALTER TABLE classes 
                   ADD CONSTRAINT classes_new_instructor_id_fkey 
                   FOREIGN KEY (new_instructor_id) REFERENCES tenant_memberships(id)
                   ON DELETE SET NULL;`
        });
        
        if (fkError && !fkError.message.includes('already exists')) {
            console.error('❌ FK constraint failed:', fkError);
            return;
        }
        console.log('✅ Foreign key constraint added');
        
        // Step 4: Migrate data
        console.log('📊 Step 4: Migrating data...');
        const { error: migrateError } = await supabase.rpc('exec_sql', {
            query: `UPDATE classes 
                   SET new_instructor_id = (
                       SELECT tm.id 
                       FROM tenant_memberships tm 
                       JOIN tenant_roles tr ON tm.role_id = tr.id
                       WHERE tm.user_id = classes.instructor_id 
                       AND tr.name IN ('admin', 'instructor')
                       AND tm.tenant_id = classes.tenant_id
                       LIMIT 1
                   )
                   WHERE instructor_id IS NOT NULL;`
        });
        
        if (migrateError) {
            console.error('❌ Data migration failed:', migrateError);
            return;
        }
        console.log('✅ Data migrated');
        
        // Step 5: Verify migration
        console.log('🔍 Step 5: Verifying migration...');
        const { data: verifyData, error: verifyError } = await supabase
            .from('classes')
            .select('id, name, instructor_id, new_instructor_id')
            .not('instructor_id', 'is', null);
            
        if (verifyError) {
            console.error('❌ Verification failed:', verifyError);
            return;
        }
        
        const totalWithInstructor = verifyData.length;
        const successfulMigrations = verifyData.filter(c => c.new_instructor_id !== null).length;
        const failedMigrations = totalWithInstructor - successfulMigrations;
        
        console.log('📋 MIGRATION RESULTS:');
        console.log(`   Total classes with instructor: ${totalWithInstructor}`);
        console.log(`   Successfully migrated: ${successfulMigrations}`);
        console.log(`   Failed migrations: ${failedMigrations}`);
        
        if (failedMigrations === 0) {
            console.log('🎉 ALL CLASSES SUCCESSFULLY MIGRATED!');
            
            // Show details
            console.log('📝 Migration details:');
            for (const cls of verifyData) {
                console.log(`   ${cls.name}: ${cls.instructor_id} → ${cls.new_instructor_id}`);
            }
            
            console.log('\n⚠️  NEXT STEPS (manual):');
            console.log('   1. Drop old constraint: ALTER TABLE classes DROP CONSTRAINT classes_instructor_id_fkey;');
            console.log('   2. Drop old column: ALTER TABLE classes DROP COLUMN instructor_id;');
            console.log('   3. Rename column: ALTER TABLE classes RENAME COLUMN new_instructor_id TO instructor_id;');
            console.log('   4. Add new constraint: ALTER TABLE classes ADD CONSTRAINT classes_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES tenant_memberships(id);');
            
        } else {
            console.log('⚠️  SOME MIGRATIONS FAILED - manual review required');
        }
        
    } catch (error) {
        console.error('💥 Migration failed:', error);
    }
}

executeMigration();