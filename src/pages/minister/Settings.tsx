import { MinisterSettings } from "@/components/minister/MinisterSettings";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Paramètres</h2>
        <p className="text-sm text-muted-foreground">Configuration et préférences du tableau de bord</p>
      </div>
      <MinisterSettings />
    </div>
  );
}