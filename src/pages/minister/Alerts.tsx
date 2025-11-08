import AlertsPanel from "@/components/minister/AlertsPanel";

export default function Alerts() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Alertes & Notifications</h2>
        <p className="text-sm text-muted-foreground">Notifications automatiques et indicateurs critiques</p>
      </div>
      <AlertsPanel />
    </div>
  );
}