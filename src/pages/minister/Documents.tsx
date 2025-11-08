import { MinisterialDocumentsPanel } from "@/components/minister/MinisterialDocumentsPanel";

export default function Documents() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Documents Ministériels</h2>
        <p className="text-sm text-muted-foreground">Génération automatique de documents officiels avec IA</p>
      </div>
      <MinisterialDocumentsPanel />
    </div>
  );
}