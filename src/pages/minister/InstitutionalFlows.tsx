import { RemonteesInstitutionnellesDashboard } from "@/components/minister/RemonteesInstitutionnellesDashboard";

export default function InstitutionalFlows() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Remontées Institutionnelles</h2>
        <p className="text-sm text-muted-foreground">Taxes collectées et répartition aux institutions</p>
      </div>
      <RemonteesInstitutionnellesDashboard />
    </div>
  );
}