import EconomicStats from "@/components/minister/EconomicStats";

export default function Economy() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Économie de la Pêche</h2>
        <p className="text-sm text-muted-foreground">Exportations, valeur et prix</p>
      </div>
      <EconomicStats />
    </div>
  );
}