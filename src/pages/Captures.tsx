import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { DeclarerCaptureDialog } from "@/components/captures/DeclarerCaptureDialog";
import { ListeCaptures } from "@/components/captures/ListeCaptures";
import { StatsCaptures } from "@/components/captures/StatsCaptures";
import { PecheurNav } from "@/components/PecheurNav";

const Captures = () => {
  const { hasRole } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  const canDeclare = hasRole('pecheur') || hasRole('agent_collecte') || 
                     hasRole('gestionnaire_coop') || hasRole('admin');

  const isPecheur = hasRole('pecheur');

  return (
    <div className="min-h-screen bg-background">
      {isPecheur && <PecheurNav />}
      
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Captures Artisanales</h1>
              <p className="text-muted-foreground">
                Déclarations et suivi des captures de pêche artisanale
              </p>
            </div>
            {canDeclare && (
              <Button onClick={() => setDialogOpen(true)} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Déclarer une Capture
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="liste" className="space-y-6">
          <TabsList>
            <TabsTrigger value="liste">Liste des Captures</TabsTrigger>
            <TabsTrigger value="stats">Statistiques</TabsTrigger>
          </TabsList>

          <TabsContent value="liste" className="space-y-4">
            <ListeCaptures />
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <StatsCaptures />
          </TabsContent>
        </Tabs>
      </div>

      {canDeclare && (
        <DeclarerCaptureDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
};

export default Captures;
