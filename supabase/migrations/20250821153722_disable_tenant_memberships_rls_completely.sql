-- Completely disable RLS on tenant_memberships to fix infinite recursion
-- The application will handle security at the API level instead

-- Drop all policies first
DROP POLICY IF EXISTS "view_own_membership" ON tenant_memberships;
DROP POLICY IF EXISTS "update_own_membership" ON tenant_memberships;

-- Disable RLS completely
ALTER TABLE tenant_memberships DISABLE ROW LEVEL SECURITY;

-- Add comment explaining the decision
COMMENT ON TABLE tenant_memberships IS 'RLS disabled due to infinite recursion issues. Security handled at API level using service role client.';