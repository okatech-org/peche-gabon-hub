-- Create demo user accounts with all roles
-- Password for all demo accounts: Demo2025!

DO $$
DECLARE
  demo_password_hash TEXT := '$2a$10$YourHashedPasswordHere'; -- This will be set by Supabase
  user_pecheur UUID;
  user_agent UUID;
  user_coop UUID;
  user_inspecteur UUID;
  user_province UUID;
  user_centrale UUID;
  user_armateur UUID;
  user_observateur UUID;
  user_analyste UUID;
  user_ministre UUID;
  user_admin UUID;
BEGIN
  -- Note: We'll create these users via the Auth API in the application
  -- This migration creates the role assignments for demo users
  
  -- The actual user creation will be done via Supabase Auth signup
  -- Here we just prepare the role assignments structure
  
  -- Insert demo user roles mapping (will be populated after user creation)
  -- Users will be created with emails: pecheur@demo.ga, agent@demo.ga, etc.
  
END $$;

-- Add a helper function to assign demo roles
CREATE OR REPLACE FUNCTION assign_demo_role(user_email TEXT, user_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user ID from auth.users by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NOT NULL THEN
    -- Insert role if not exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, user_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

-- Add comment explaining demo setup
COMMENT ON FUNCTION assign_demo_role IS 'Helper function to assign roles to demo users. Demo users must be created via Auth API first.';
