const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    'https://hodkqpmukwfrreozwmcy.supabase.co', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZGtxcG11a3dmcnJlb3p3bWN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgyMzQ1MywiZXhwIjoyMDcwMzk5NDUzfQ.EXVHL6BPJ-_NDtcBBH9uWSZPtkIb1_mt9OMRKEnCF_s'
);

async function analyzeInstructorsData() {
    try {
        console.log('🔍 Analyzing instructors data...');
        
        // Get instructors data
        const { data: instructors } = await supabase
            .from('instructors')
            .select('*')
            .limit(3);
            
        console.log('📋 Sample instructors data:');
        instructors?.forEach((instructor, i) => {
            console.log(`${i + 1}. ${instructor.name}`);
            console.log(`   ID: ${instructor.id}`);
            console.log(`   User ID: ${instructor.user_id}`);
            console.log(`   Tenant ID: ${instructor.tenant_id}`);
            console.log(`   Email: ${instructor.email || 'N/A'}`);
            console.log('');
        });
        
        // Get tenant_memberships for comparison
        console.log('📋 Sample tenant_memberships data:');
        const { data: memberships } = await supabase
            .from('tenant_memberships')
            .select(`
                id,
                user_id,
                tenant_id,
                role_id,
                user_profiles(name, email),
                tenant_roles(name, display_name)
            `)
            .limit(3);
            
        memberships?.forEach((member, i) => {
            console.log(`${i + 1}. ${member.user_profiles?.name || 'N/A'}`);
            console.log(`   Membership ID: ${member.id}`);
            console.log(`   User ID: ${member.user_id}`);
            console.log(`   Tenant ID: ${member.tenant_id}`);
            console.log(`   Role: ${member.tenant_roles?.display_name || 'N/A'}`);
            console.log(`   Email: ${member.user_profiles?.email || 'N/A'}`);
            console.log('');
        });
        
        // Try to find matches by name and tenant
        console.log('🔍 Looking for potential matches...');
        for (const instructor of instructors || []) {
            // Find tenant_memberships with similar name pattern
            const { data: matches } = await supabase
                .from('tenant_memberships')
                .select(`
                    id,
                    user_id,
                    tenant_id,
                    user_profiles(name, email),
                    tenant_roles(name, display_name)
                `)
                .eq('tenant_id', instructor.tenant_id);
                
            console.log(`📍 Instructor: ${instructor.name}`);
            console.log(`   Tenant ID: ${instructor.tenant_id}`);
            console.log(`   Potential matches in tenant:`);
            matches?.forEach(match => {
                console.log(`     - ${match.user_profiles?.name} (${match.tenant_roles?.display_name})`);
            });
            console.log('');
        }
        
    } catch (err) {
        console.log('❌ Analysis failed:', err.message);
    }
}

analyzeInstructorsData();