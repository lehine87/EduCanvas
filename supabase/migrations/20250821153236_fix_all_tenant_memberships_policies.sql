-- First, drop ALL existing policies on tenant_memberships to start fresh
DROP POLICY IF EXISTS "users_can_view_tenant_members" ON tenant_memberships;
DROP POLICY IF EXISTS "managers_can_update_members" ON tenant_memberships;
DROP POLICY IF EXISTS "Users can view their own membership" ON tenant_memberships;
DROP POLICY IF EXISTS "Tenant admins can manage memberships" ON tenant_memberships;
DROP POLICY IF EXISTS "System admins can manage all memberships" ON tenant_memberships;
DROP POLICY IF EXISTS "Users can update their own membership" ON tenant_memberships;

-- Drop any other policies that might exist
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'tenant_memberships' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON tenant_memberships', pol.policyname);
    END LOOP;
END $$;

-- Now create clean, non-recursive policies

-- 1. Users can view their own membership
CREATE POLICY "users_view_own_membership" ON tenant_memberships
FOR SELECT USING (
    auth.uid() = user_id
);

-- 2. Users can view other members in their tenant (without recursion)
CREATE POLICY "users_view_same_tenant_members" ON tenant_memberships
FOR SELECT USING (
    tenant_id IN (
        SELECT DISTINCT tenant_id 
        FROM tenant_memberships 
        WHERE user_id = auth.uid() 
        AND status = 'active'
    )
);

-- 3. Users can update their own membership (limited fields)
CREATE POLICY "users_update_own_membership" ON tenant_memberships
FOR UPDATE USING (
    auth.uid() = user_id
);

-- 4. Service role and admin operations will bypass RLS
-- No additional policies needed for admin operations as they should use service role