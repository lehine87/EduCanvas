const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    'https://hodkqpmukwfrreozwmcy.supabase.co', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZGtxcG11a3dmcnJlb3p3bWN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgyMzQ1MywiZXhwIjoyMDcwMzk5NDUzfQ.EXVHL6BPJ-_NDtcBBH9uWSZPtkIb1_mt9OMRKEnCF_s'
);

async function migrateInstructorsToStaff() {
    try {
        console.log('🔄 Starting instructors → tenant_memberships.staff_info migration...');
        
        // Step 1: Get all instructors data
        const { data: instructors, error: fetchError } = await supabase
            .from('instructors')
            .select('*');
            
        if (fetchError) {
            console.log('❌ Failed to fetch instructors:', fetchError);
            return;
        }
        
        console.log('📊 Instructors to migrate:', instructors.length);
        
        // Step 2: For each instructor, find corresponding tenant_membership and update staff_info
        for (const instructor of instructors) {
            console.log('📝 Processing instructor:', instructor.name);
            console.log('   User ID:', instructor.user_id);
            
            // Find corresponding tenant_membership
            const { data: memberships, error: memberError } = await supabase
                .from('tenant_memberships')
                .select('id, user_id, tenant_id, role_id, staff_info, tenant_roles(name, display_name)')
                .eq('user_id', instructor.user_id);
                
            if (memberError) {
                console.log('   ❌ Error finding membership:', memberError);
                continue;
            }
            
            if (!memberships || memberships.length === 0) {
                console.log('   ❌ No matching tenant_membership found');
                continue;
            }
            
            // Use the first membership (usually there's only one per tenant)
            const membership = memberships[0];
            console.log('   ✅ Found membership:', membership.id);
            console.log('   📋 Current role:', membership.tenant_roles?.display_name || 'N/A');
            
            // Prepare staff_info data
            const staff_info = {
                // Basic info
                name: instructor.name,
                name_english: instructor.name_english,
                phone: instructor.phone,
                email: instructor.email,
                bio: instructor.bio,
                
                // Employment info
                hire_date: instructor.hire_date,
                employment_status: instructor.employment_status,
                employment_type: instructor.employment_type,
                
                // Financial info
                hourly_rate: instructor.hourly_rate,
                salary_policy_id: instructor.salary_policy_id,
                bank_account: instructor.bank_account,
                
                // Additional info
                qualifications: instructor.qualifications,
                specialties: instructor.specialties,
                max_classes: instructor.max_classes,
                teaching_experience_years: instructor.teaching_experience_years,
                
                // Merge with existing staff_info if any
                ...membership.staff_info
            };
            
            console.log('   📋 Staff info keys:', Object.keys(staff_info));
            
            // Update the tenant_membership with staff_info
            const { error: updateError } = await supabase
                .from('tenant_memberships')
                .update({ staff_info })
                .eq('id', membership.id);
                
            if (updateError) {
                console.log('   ❌ Failed to update staff_info:', updateError);
            } else {
                console.log('   ✅ Successfully migrated instructor data to staff_info');
            }
        }
        
        console.log('🎉 Instructors → staff_info migration completed!');
        
        // Step 3: Verification - show migrated data
        console.log('\n📋 Verification - Updated tenant_memberships with staff_info:');
        const { data: updatedMemberships } = await supabase
            .from('tenant_memberships')
            .select(`
                id,
                staff_info,
                tenant_roles(name, display_name),
                user_profiles(name, email)
            `)
            .not('staff_info', 'is', null);
            
        updatedMemberships?.forEach(member => {
            console.log(`   👤 ${member.user_profiles?.name}: ${member.tenant_roles?.display_name}`);
            console.log(`       Staff Info: ${Object.keys(member.staff_info || {}).length} fields`);
        });
        
    } catch (err) {
        console.log('❌ Migration failed:', err.message);
    }
}

migrateInstructorsToStaff();