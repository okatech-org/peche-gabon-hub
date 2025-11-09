-- Ajouter le rôle super_admin à l'enum user_role s'il n'existe pas déjà
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'admin',
            'super_admin',
            'ministre',
            'direction_centrale',
            'direction_provinciale',
            'dgpa',
            'anpa',
            'agasa',
            'dgmm',
            'oprag',
            'anpn',
            'corep',
            'pecheur',
            'gestionnaire_coop',
            'armateur_pi',
            'inspecteur',
            'agent_collecte',
            'observateur_pi',
            'analyste'
        );
    ELSE
        -- Si le type existe, vérifier si super_admin y est déjà
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumtypid = 'user_role'::regtype 
            AND enumlabel = 'super_admin'
        ) THEN
            -- Ajouter super_admin à l'enum existant
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
        END IF;
    END IF;
END $$;

-- Créer une fonction helper pour vérifier si un rôle super_admin existe
CREATE OR REPLACE FUNCTION has_super_admin_role(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_roles 
        WHERE user_id = $1 
        AND role = 'super_admin'
    );
END;
$$;