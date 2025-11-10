import { DailyBriefingPanel } from "@/components/minister/DailyBriefingPanel";

export default function DailyBriefing() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Briefings Quotidiens</h1>
        <p className="text-muted-foreground mt-2">
          Rapports vocaux intelligents générés automatiquement par iAsted chaque matin à 6h
        </p>
      </div>

      <DailyBriefingPanel />
    </div>
  );
}
