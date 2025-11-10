import { PaiementTaxesGroupees } from "@/components/cooperative/PaiementTaxesGroupees";

export default function PaiementGroupe() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paiement Groupé</h1>
        <p className="text-muted-foreground mt-2">
          Payez les taxes de vos membres en lot et envoyez automatiquement les quittances
        </p>
      </div>
      <PaiementTaxesGroupees />
    </div>
  );
}
