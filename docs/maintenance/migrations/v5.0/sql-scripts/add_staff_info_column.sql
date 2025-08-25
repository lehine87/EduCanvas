-- =====================================================
-- Add staff_info column to tenant_memberships
-- This will store instructor/staff additional information as JSONB
-- =====================================================

-- Add staff_info column as JSONB to store flexible staff data
ALTER TABLE tenant_memberships 
ADD COLUMN staff_info JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN tenant_memberships.staff_info IS 
'Staff additional information stored as JSON: salary, hire_date, qualifications, etc.';

-- Create index for better performance on JSONB queries
CREATE INDEX idx_tenant_memberships_staff_info_gin 
ON tenant_memberships USING GIN (staff_info);

-- Verification
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tenant_memberships' 
AND column_name = 'staff_info';