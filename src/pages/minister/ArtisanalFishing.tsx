import ArtisanalFishingStats from "@/components/minister/ArtisanalFishingStats";

export default function ArtisanalFishing() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pêche Artisanale</h2>
        <p className="text-sm text-muted-foreground">Captures, CPUE, licences et conformité</p>
      </div>
      <ArtisanalFishingStats />
    </div>
  );
}