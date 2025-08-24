-- Phase 1: Extend tenant_memberships table
-- Add job_function column to distinguish between general staff and instructors
ALTER TABLE tenant_memberships 
ADD COLUMN IF NOT EXISTS job_function VARCHAR(20) DEFAULT 'general' CHECK (job_function IN ('general', 'instructor'));

-- Absorb core instructor information into tenant_memberships
ALTER TABLE tenant_memberships 
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS specialization VARCHAR(200),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_account VARCHAR(100),
ADD COLUMN IF NOT EXISTS qualification VARCHAR(200);

-- Add column comments
COMMENT ON COLUMN tenant_memberships.job_function IS 'Job function: general(administrative), instructor(teacher)';
COMMENT ON COLUMN tenant_memberships.hire_date IS 'Hire date';
COMMENT ON COLUMN tenant_memberships.specialization IS 'Specialization area';
COMMENT ON COLUMN tenant_memberships.bio IS 'Biography';
COMMENT ON COLUMN tenant_memberships.emergency_contact IS 'Emergency contact';
COMMENT ON COLUMN tenant_memberships.bank_account IS 'Bank account information';
COMMENT ON COLUMN tenant_memberships.qualification IS 'Qualifications';

-- Phase 2: Create default tenant_roles for each tenant
DO $$
DECLARE
    t RECORD;
BEGIN
    FOR t IN SELECT id FROM tenants
    LOOP
        -- Create system default roles (prevent duplicates)
        INSERT INTO tenant_roles (tenant_id, name, display_name, hierarchy_level, is_system_role)
        VALUES 
            (t.id, 'principal', 'Principal', 10, true),
            (t.id, 'vice_principal', 'Vice Principal', 9, true),
            (t.id, 'team_leader', 'Team Leader', 7, true),
            (t.id, 'team_member', 'Team Member', 1, true)
        ON CONFLICT (tenant_id, name) DO NOTHING;
        
        -- Optional custom roles
        INSERT INTO tenant_roles (tenant_id, name, display_name, hierarchy_level, is_system_role)
        VALUES 
            (t.id, 'director', 'Director', 8, false),
            (t.id, 'senior', 'Senior', 5, false),
            (t.id, 'assistant', 'Assistant', 3, false)
        ON CONFLICT (tenant_id, name) DO NOTHING;
    END LOOP;
END $$;

-- Phase 3: Migrate instructors data to tenant_memberships
UPDATE tenant_memberships tm
SET 
    job_function = 'instructor',
    hire_date = i.hire_date,
    specialization = i.specialization,
    bio = i.bio,
    emergency_contact = i.emergency_contact,
    bank_account = i.bank_account,
    qualification = i.qualification
FROM instructors i
WHERE tm.user_id = i.user_id 
AND tm.tenant_id = i.tenant_id;

-- Phase 4: Update RLS policies for extended access
-- Allow staff managers to view members
CREATE POLICY "staff_managers_can_view_members" ON tenant_memberships
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM tenant_memberships tm
        JOIN tenant_roles tr ON tm.role_id = tr.id
        WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tenant_memberships.tenant_id
        AND tm.status = 'active'
        AND tr.hierarchy_level >= 7
    )
);

-- Allow staff managers to update members
CREATE POLICY "staff_managers_can_update_members" ON tenant_memberships
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM tenant_memberships tm
        JOIN tenant_roles tr ON tm.role_id = tr.id
        WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tenant_memberships.tenant_id
        AND tm.status = 'active'
        AND tr.hierarchy_level >= 7
    )
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_job_function 
ON tenant_memberships(tenant_id, job_function) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_hire_date 
ON tenant_memberships(tenant_id, hire_date) 
WHERE job_function = 'instructor';

-- Update statistics
ANALYZE tenant_memberships;
ANALYZE tenant_roles;