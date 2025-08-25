const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    'https://hodkqpmukwfrreozwmcy.supabase.co', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZGtxcG11a3dmcnJlb3p3bWN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgyMzQ1MywiZXhwIjoyMDcwMzk5NDUzfQ.EXVHL6BPJ-_NDtcBBH9uWSZPtkIb1_mt9OMRKEnCF_s'
);

async function migrateData() {
    try {
        console.log('🔄 Starting data migration...');
        
        // Step 1: Get classes that need migration
        const { data: classesToMigrate, error: fetchError } = await supabase
            .from('classes')
            .select('id, name, instructor_id, tenant_id')
            .not('instructor_id', 'is', null);
            
        if (fetchError) {
            console.log('❌ Failed to fetch classes:', fetchError);
            return;
        }
        
        console.log('📊 Classes to migrate:', classesToMigrate.length);
        
        // Step 2: For each class, find the corresponding tenant_membership
        for (const cls of classesToMigrate) {
            console.log('📝 Processing:', cls.name);
            console.log('   Current instructor_id:', cls.instructor_id);
            
            // Find corresponding tenant_membership
            const { data: memberships, error: memberError } = await supabase
                .from('tenant_memberships')
                .select('id, user_id, tenant_id, role_id, tenant_roles(name, display_name)')
                .eq('user_id', cls.instructor_id)
                .eq('tenant_id', cls.tenant_id);
                
            if (memberError) {
                console.log('   ❌ Error finding membership:', memberError);
                continue;
            }
            
            if (!memberships || memberships.length === 0) {
                console.log('   ❌ No matching tenant_membership found');
                continue;
            }
            
            // Filter for admin or instructor roles
            const validMembership = memberships.find(m => 
                m.tenant_roles && (
                    m.tenant_roles.name === 'admin' || 
                    m.tenant_roles.name === 'instructor'
                )
            );
            
            if (!validMembership) {
                console.log('   ❌ No admin/instructor membership found');
                console.log('   📋 Available memberships:', memberships.map(m => ({ 
                    id: m.id, 
                    role: m.tenant_roles ? m.tenant_roles.name : 'no_role' 
                })));
                continue;
            }
            
            console.log('   ✅ Found membership:', validMembership.id);
            console.log('   📋 Role:', validMembership.tenant_roles.display_name);
            
            // Update the class with new_instructor_id
            const { error: updateError } = await supabase
                .from('classes')
                .update({ new_instructor_id: validMembership.id })
                .eq('id', cls.id);
                
            if (updateError) {
                console.log('   ❌ Failed to update:', updateError);
            } else {
                console.log('   ✅ Successfully migrated');
            }
        }
        
        console.log('🎉 Data migration completed!');
        
    } catch (err) {
        console.log('❌ Migration failed:', err.message);
    }
}

migrateData();