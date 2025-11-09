import { IAstedChat } from "@/components/minister/IAstedChat";

export default function IAsted() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">iAsted - Assistant Vocal</h1>
        <p className="text-muted-foreground">
          Votre assistant vocal intelligent pour l'analyse et la synthèse des données du secteur de la pêche
        </p>
      </div>

      <IAstedChat />
    </div>
  );
}
