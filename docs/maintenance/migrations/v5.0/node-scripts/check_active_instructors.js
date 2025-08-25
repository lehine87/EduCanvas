const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    'https://hodkqpmukwfrreozwmcy.supabase.co', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZGtxcG11a3dmcnJlb3p3bWN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgyMzQ1MywiZXhwIjoyMDcwMzk5NDUzfQ.EXVHL6BPJ-_NDtcBBH9uWSZPtkIb1_mt9OMRKEnCF_s'
);

async function checkActiveInstructors() {
    try {
        console.log('🔍 Checking actual active instructors from classes...');
        
        // Get classes with instructor information
        const { data: classes } = await supabase
            .from('classes')
            .select(`
                id,
                name,
                instructor_id,
                tenant_id,
                tenant_memberships!classes_instructor_id_fkey(
                    id,
                    user_id,
                    staff_info,
                    user_profiles(name, email),
                    tenant_roles(name, display_name)
                )
            `)
            .not('instructor_id', 'is', null);
            
        console.log('📋 Active classes with instructors:');
        classes?.forEach((cls, i) => {
            const instructor = cls.tenant_memberships;
            console.log(`${i + 1}. Class: ${cls.name}`);
            console.log(`   Instructor: ${instructor?.user_profiles?.name || 'N/A'}`);
            console.log(`   Role: ${instructor?.tenant_roles?.display_name || 'N/A'}`);
            console.log(`   Email: ${instructor?.user_profiles?.email || 'N/A'}`);
            console.log(`   Staff Info: ${instructor?.staff_info ? 'Yes' : 'No'}`);
            console.log(`   Membership ID: ${instructor?.id || 'N/A'}`);
            console.log('');
        });
        
        // Check tenant_memberships that could be instructors
        console.log('📋 All tenant_memberships that could be instructors:');
        const { data: potentialInstructors } = await supabase
            .from('tenant_memberships')
            .select(`
                id,
                user_id,
                tenant_id,
                staff_info,
                user_profiles(name, email),
                tenant_roles(name, display_name)
            `)
            .or('tenant_roles.name.eq.admin,tenant_roles.name.eq.instructor');
            
        potentialInstructors?.forEach((instructor, i) => {
            console.log(`${i + 1}. ${instructor.user_profiles?.name || 'N/A'}`);
            console.log(`   Role: ${instructor.tenant_roles?.display_name || 'N/A'}`);
            console.log(`   Email: ${instructor.user_profiles?.email || 'N/A'}`);
            console.log(`   Staff Info: ${instructor.staff_info ? Object.keys(instructor.staff_info).length + ' fields' : 'None'}`);
            console.log(`   Membership ID: ${instructor.id}`);
            console.log('');
        });
        
    } catch (err) {
        console.log('❌ Check failed:', err.message);
    }
}

checkActiveInstructors();