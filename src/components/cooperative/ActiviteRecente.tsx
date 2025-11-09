import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, UserPlus, Receipt, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Activity {
  id: string;
  type: "paiement" | "inscription" | "taxe" | "validation";
  member: string;
  description: string;
  timestamp: Date;
  status: "success" | "pending" | "error";
  amount?: number;
}

interface ActiviteRecenteProps {
  activities: Activity[];
  loading?: boolean;
}

export const ActiviteRecente = ({ activities, loading }: ActiviteRecenteProps) => {

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "paiement":
        return <DollarSign className="h-4 w-4" />;
      case "inscription":
        return <UserPlus className="h-4 w-4" />;
      case "taxe":
        return <Receipt className="h-4 w-4" />;
      case "validation":
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: Activity["type"]) => {
    switch (type) {
      case "paiement":
        return "text-green-600 dark:text-green-400 bg-green-500/10";
      case "inscription":
        return "text-blue-600 dark:text-blue-400 bg-blue-500/10";
      case "taxe":
        return "text-orange-600 dark:text-orange-400 bg-orange-500/10";
      case "validation":
        return "text-purple-600 dark:text-purple-400 bg-purple-500/10";
    }
  };

  const getStatusBadge = (status: Activity["status"]) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
            Validé
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">
            En attente
          </Badge>
        );
      case "error":
        return (
          <Badge variant="secondary" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
            Erreur
          </Badge>
        );
    }
  };

  return (
    <Card className="border-border/40 bg-gradient-to-br from-card via-card to-card/95">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Activité Récente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune activité récente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/40 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Icon */}
                <div className={`p-2 rounded-lg ${getActivityColor(activity.type)} shrink-0`}>
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{activity.member}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    </div>
                    {getStatusBadge(activity.status)}
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: fr })}
                    </span>
                    {activity.amount && (
                      <span className="text-xs font-medium text-foreground">
                        {activity.amount.toLocaleString()} FCFA
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
