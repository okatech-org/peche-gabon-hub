import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PublishRegulationDialog from "@/components/minister/PublishRegulationDialog";
import SendNotificationDialog from "@/components/minister/SendNotificationDialog";
import LockZoneDialog from "@/components/minister/LockZoneDialog";

export default function Powers() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pouvoirs Ministériels</h2>
        <p className="text-sm text-muted-foreground">Actions réglementaires et notifications</p>
      </div>
      
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Actions Disponibles</CardTitle>
          <CardDescription>Exercez vos prérogatives ministérielles</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PublishRegulationDialog />
          <SendNotificationDialog />
          <LockZoneDialog />
        </CardContent>
      </Card>
    </div>
  );
}