import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading, roles } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirection spécifique selon le rôle
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = allowedRoles.some(role => roles.includes(role as any));
    if (!hasAccess) {
      // Rediriger vers le dashboard approprié selon le rôle
      if (roles.includes('ministre' as any)) {
        return <Navigate to="/minister-dashboard" replace />;
      }
      if (roles.includes('dgpa' as any)) {
        return <Navigate to="/dgpa-dashboard" replace />;
      }
      if (roles.includes('anpa' as any)) {
        return <Navigate to="/anpa-dashboard" replace />;
      }
      if (roles.includes('agasa' as any)) {
        return <Navigate to="/agasa-dashboard" replace />;
      }
      if (roles.includes('dgmm' as any)) {
        return <Navigate to="/dgmm-dashboard" replace />;
      }
      if (roles.includes('oprag' as any)) {
        return <Navigate to="/oprag-dashboard" replace />;
      }
      if (roles.includes('anpn' as any)) {
        return <Navigate to="/anpn-dashboard" replace />;
      }
      if (roles.includes('armateur_pi' as any)) {
        return <Navigate to="/armeur-dashboard" replace />;
      }
      if (roles.includes('admin' as any)) {
        return <Navigate to="/admin" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
