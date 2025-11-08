import IndustrialFishingStats from "@/components/minister/IndustrialFishingStats";

export default function IndustrialFishing() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pêche Industrielle</h2>
        <p className="text-sm text-muted-foreground">Navires, armements et activité</p>
      </div>
      <IndustrialFishingStats />
    </div>
  );
}