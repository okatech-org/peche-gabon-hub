import SurveillanceStats from "@/components/minister/SurveillanceStats";

export default function Surveillance() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Surveillance & Contrôle</h2>
        <p className="text-sm text-muted-foreground">Carte interactive, zones restreintes et infractions</p>
      </div>
      <SurveillanceStats />
    </div>
  );
}