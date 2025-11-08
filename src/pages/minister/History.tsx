import MinisterHistory from "@/components/minister/MinisterHistory";
import { HistoriqueRecommandations } from "@/components/minister/HistoriqueRecommandations";

export default function History() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Historique & Archives</h2>
        <p className="text-sm text-muted-foreground">Réglementations, notifications et audit</p>
      </div>
      
      <div className="grid gap-6">
        <MinisterHistory />
        <HistoriqueRecommandations />
      </div>
    </div>
  );
}