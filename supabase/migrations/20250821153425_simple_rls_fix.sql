-- Disable RLS temporarily and create very simple policies
ALTER TABLE tenant_memberships DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "users_view_own_membership" ON tenant_memberships;
DROP POLICY IF EXISTS "users_view_same_tenant_members" ON tenant_memberships;
DROP POLICY IF EXISTS "users_update_own_membership" ON tenant_memberships;

-- Re-enable RLS with very basic policies
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own membership
CREATE POLICY "view_own_membership" ON tenant_memberships
FOR SELECT USING (auth.uid() = user_id);

-- Allow updates to own membership
CREATE POLICY "update_own_membership" ON tenant_memberships
FOR UPDATE USING (auth.uid() = user_id);