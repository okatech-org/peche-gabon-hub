import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fish, FileText, Activity, Bell, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface PecheurStats {
  capturesMois: number;
  licenceStatut: string;
  cpueMoyen: number;
  notifications: number;
}

export default function PecheurOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PecheurStats>({
    capturesMois: 0,
    licenceStatut: "Non renseigné",
    cpueMoyen: 0,
    notifications: 0,
  });

  useEffect(() => {
    loadPecheurData();
  }, [user]);

  const loadPecheurData = async () => {
    try {
      if (!user) return;

      // Load captures for current month
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const { data: captures } = await supabase
        .from("captures_pa")
        .select("poids_kg, cpue")
        .eq("mois", currentMonth)
        .eq("annee", currentYear);

      const capturesMois = captures?.reduce((sum, c) => sum + (c.poids_kg || 0), 0) || 0;
      
      const cpueValues = captures?.filter(c => c.cpue).map(c => c.cpue) || [];
      const cpueMoyen = cpueValues.length > 0 
        ? cpueValues.reduce((sum, val) => sum + val, 0) / cpueValues.length 
        : 0;

      setStats({
        capturesMois: capturesMois / 1000, // Convert to tonnes
        licenceStatut: "Non renseigné", // TODO: Load from DB
        cpueMoyen: Number(cpueMoyen.toFixed(1)),
        notifications: 0,
      });
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Mes Activités de Pêche</h1>
        <p className="text-sm text-muted-foreground">
          Suivi de vos captures et licences
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Captures Card */}
        <Card className="border-border hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Captures ce Mois
            </CardTitle>
            <Fish className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              {stats.capturesMois.toFixed(0)}kg
            </div>
          </CardContent>
        </Card>

        {/* Licence Card */}
        <Card className="border-border hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Licence
            </CardTitle>
            <FileText className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              {stats.licenceStatut}
            </div>
          </CardContent>
        </Card>

        {/* CPUE Card */}
        <Card className="border-border hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              CPUE Moyen
            </CardTitle>
            <Activity className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              {stats.cpueMoyen}
            </div>
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card className="border-border hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Notifications
            </CardTitle>
            <Bell className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              {stats.notifications}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Rapides */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Actions Rapides</CardTitle>
          <p className="text-sm text-muted-foreground">
            Accédez rapidement aux fonctionnalités principales
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            size="lg"
            className="w-full h-auto py-6 flex-col gap-3"
            onClick={() => navigate("/captures")}
          >
            <Fish className="h-6 w-6" />
            <span className="text-base">Déclarer une Capture</span>
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full h-auto py-6 flex-col gap-3"
            onClick={() => navigate("/mon-compte")}
          >
            <FileText className="h-6 w-6" />
            <span className="text-base">Mon Compte</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
