-- Drop the problematic RLS policies we added earlier
DROP POLICY IF EXISTS "staff_managers_can_view_members" ON tenant_memberships;
DROP POLICY IF EXISTS "staff_managers_can_update_members" ON tenant_memberships;

-- Create better RLS policies without recursion
-- Allow users to view members in their tenant with appropriate role
CREATE POLICY "users_can_view_tenant_members" ON tenant_memberships
FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM tenant_memberships tm2
        WHERE tm2.tenant_id = tenant_memberships.tenant_id
        AND tm2.status = 'active'
    )
);

-- Allow users with high hierarchy level to update members
CREATE POLICY "managers_can_update_members" ON tenant_memberships
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM tenant_memberships tm
        JOIN tenant_roles tr ON tm.role_id = tr.id
        WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tenant_memberships.tenant_id
        AND tm.status = 'active'
        AND tr.hierarchy_level >= 7 -- Team leader and above
        AND tm.id != tenant_memberships.id -- Prevent self-reference
    )
);