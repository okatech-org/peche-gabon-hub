import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type UserRole = 'pecheur' | 'agent_collecte' | 'gestionnaire_coop' | 'inspecteur' | 
  'direction_provinciale' | 'direction_centrale' | 'admin' | 'armateur_pi' | 
  'observateur_pi' | 'analyste' | 'ministre' | 'dgpa' | 'anpa' | 'agasa' | 
  'dgmm' | 'oprag' | 'dgddi' | 'anpn' | 'corep' | 'partenaire_international';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: UserRole[];
  loading: boolean;
  hasRole: (role: UserRole) => boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_user_roles', {
        _user_id: userId
      });
      
      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      setRoles([]);
    }
  };

  useEffect(() => {
    // Setup auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoles(session.user.id);
          }, 0);
        } else {
          setRoles([]);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasRole = (role: UserRole) => {
    return roles.includes(role);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success("Connexion réussie");
      
      // Redirection intelligente selon le rôle
      setTimeout(async () => {
        const { data } = await supabase.rpc('get_user_roles', {
          _user_id: (await supabase.auth.getUser()).data.user?.id
        });
        
        const userRoles = data || [];
        if (userRoles.includes('ministre')) {
          navigate("/minister-dashboard");
        } else if (userRoles.includes('dgpa')) {
          navigate("/dgpa-dashboard");
        } else if (userRoles.includes('anpa')) {
          navigate("/anpa-dashboard");
        } else if (userRoles.includes('agasa')) {
          navigate("/agasa-dashboard");
        } else if (userRoles.includes('dgmm')) {
          navigate("/dgmm-dashboard");
        } else if (userRoles.includes('oprag')) {
          navigate("/oprag-dashboard");
        } else if (userRoles.includes('anpn')) {
          navigate("/anpn-dashboard");
        } else if (userRoles.includes('armateur_pi')) {
          navigate("/armeur-dashboard");
        } else if (userRoles.includes('admin')) {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      }, 100);
    } catch (error: any) {
      toast.error(error.message || "Erreur de connexion");
      throw error;
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) throw error;
      
      toast.success("Compte créé avec succès");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création du compte");
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success("Déconnexion réussie");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la déconnexion");
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        roles,
        loading,
        hasRole,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
