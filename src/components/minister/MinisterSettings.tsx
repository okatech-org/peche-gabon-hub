import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Download,
  AlertTriangle,
  Save,
  Lock,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { toast } from "sonner";

export function MinisterSettings() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  // Profil
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    office: "",
    department: "Ministère des Pêches"
  });

  // Notifications
  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    smsAlerts: false,
    dailyReport: true,
    weeklyReport: true,
    criticalAlertsOnly: false,
    alertTypes: {
      captures: true,
      infractions: true,
      economic: true,
      regulatory: true
    }
  });

  // Seuils d'alerte
  const [alertThresholds, setAlertThresholds] = useState({
    cpueMin: 15,
    captureDropPercent: 20,
    infractionMax: 50,
    exportDropPercent: 15
  });

  // Préférences d'affichage
  const [displayPrefs, setDisplayPrefs] = useState({
    theme: "system",
    language: "fr",
    currency: "XAF",
    dateFormat: "DD/MM/YYYY",
    numberFormat: "fr-FR"
  });

  // Sécurité
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    loginNotifications: true
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Profil mis à jour avec succès");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du profil");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Préférences de notification enregistrées");
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveThresholds = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Seuils d'alerte mis à jour");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (!user?.email) return "MI";
    const parts = user.email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Paramètres</h2>
        <p className="text-sm text-muted-foreground">Gérez vos préférences et configurations</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-2">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="thresholds" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Seuils</span>
          </TabsTrigger>
          <TabsTrigger value="display" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Affichage</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Sécurité</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </TabsTrigger>
        </TabsList>

        {/* Profil */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations Personnelles</CardTitle>
              <CardDescription>Gérez vos informations de profil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Badge variant="secondary">Ministre</Badge>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                    placeholder="Votre prénom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                    placeholder="Votre nom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex gap-2">
                    <Mail className="h-5 w-5 text-muted-foreground mt-2" />
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="flex gap-2">
                    <Phone className="h-5 w-5 text-muted-foreground mt-2" />
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      placeholder="+237 6XX XXX XXX"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="office">Bureau</Label>
                  <div className="flex gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-2" />
                    <Input
                      id="office"
                      value={profileData.office}
                      onChange={(e) => setProfileData({...profileData, office: e.target.value})}
                      placeholder="Emplacement du bureau"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Département</Label>
                  <Input
                    id="department"
                    value={profileData.department}
                    disabled
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Préférences de Notification</CardTitle>
              <CardDescription>Choisissez comment recevoir les alertes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertes par Email</Label>
                    <p className="text-sm text-muted-foreground">Recevoir les notifications par email</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailAlerts}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, emailAlerts: checked})
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertes par SMS</Label>
                    <p className="text-sm text-muted-foreground">Recevoir les alertes critiques par SMS</p>
                  </div>
                  <Switch
                    checked={notificationSettings.smsAlerts}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, smsAlerts: checked})
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Rapport Quotidien</Label>
                    <p className="text-sm text-muted-foreground">Synthèse journalière à 8h00</p>
                  </div>
                  <Switch
                    checked={notificationSettings.dailyReport}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, dailyReport: checked})
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Rapport Hebdomadaire</Label>
                    <p className="text-sm text-muted-foreground">Synthèse hebdomadaire le lundi</p>
                  </div>
                  <Switch
                    checked={notificationSettings.weeklyReport}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, weeklyReport: checked})
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertes Critiques Uniquement</Label>
                    <p className="text-sm text-muted-foreground">Ne recevoir que les alertes importantes</p>
                  </div>
                  <Switch
                    checked={notificationSettings.criticalAlertsOnly}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, criticalAlertsOnly: checked})
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Types d'Alertes</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label className="cursor-pointer">Captures & Production</Label>
                    <Switch
                      checked={notificationSettings.alertTypes.captures}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({
                          ...notificationSettings, 
                          alertTypes: {...notificationSettings.alertTypes, captures: checked}
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label className="cursor-pointer">Infractions</Label>
                    <Switch
                      checked={notificationSettings.alertTypes.infractions}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({
                          ...notificationSettings, 
                          alertTypes: {...notificationSettings.alertTypes, infractions: checked}
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label className="cursor-pointer">Économie</Label>
                    <Switch
                      checked={notificationSettings.alertTypes.economic}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({
                          ...notificationSettings, 
                          alertTypes: {...notificationSettings.alertTypes, economic: checked}
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label className="cursor-pointer">Réglementaire</Label>
                    <Switch
                      checked={notificationSettings.alertTypes.regulatory}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({
                          ...notificationSettings, 
                          alertTypes: {...notificationSettings.alertTypes, regulatory: checked}
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seuils d'Alerte */}
        <TabsContent value="thresholds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seuils d'Alerte Personnalisés</CardTitle>
              <CardDescription>Définissez vos propres seuils de déclenchement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cpueMin">CPUE Minimum (kg/sortie)</Label>
                  <Input
                    id="cpueMin"
                    type="number"
                    value={alertThresholds.cpueMin}
                    onChange={(e) => setAlertThresholds({...alertThresholds, cpueMin: parseFloat(e.target.value)})}
                  />
                  <p className="text-xs text-muted-foreground">Alerte si CPUE descend sous ce seuil</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="captureDropPercent">Chute de Capture (%)</Label>
                  <Input
                    id="captureDropPercent"
                    type="number"
                    value={alertThresholds.captureDropPercent}
                    onChange={(e) => setAlertThresholds({...alertThresholds, captureDropPercent: parseFloat(e.target.value)})}
                  />
                  <p className="text-xs text-muted-foreground">Alerte si baisse supérieure à ce pourcentage</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="infractionMax">Infractions Maximum (par mois)</Label>
                  <Input
                    id="infractionMax"
                    type="number"
                    value={alertThresholds.infractionMax}
                    onChange={(e) => setAlertThresholds({...alertThresholds, infractionMax: parseInt(e.target.value)})}
                  />
                  <p className="text-xs text-muted-foreground">Alerte si dépassement de ce nombre</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exportDropPercent">Chute d'Exportations (%)</Label>
                  <Input
                    id="exportDropPercent"
                    type="number"
                    value={alertThresholds.exportDropPercent}
                    onChange={(e) => setAlertThresholds({...alertThresholds, exportDropPercent: parseFloat(e.target.value)})}
                  />
                  <p className="text-xs text-muted-foreground">Alerte si baisse supérieure à ce pourcentage</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveThresholds} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Affichage */}
        <TabsContent value="display" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Préférences d'Affichage</CardTitle>
              <CardDescription>Personnalisez l'apparence et les formats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">Thème</Label>
                  <Select value={displayPrefs.theme} onValueChange={(value) => setDisplayPrefs({...displayPrefs, theme: value})}>
                    <SelectTrigger id="theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Clair</SelectItem>
                      <SelectItem value="dark">Sombre</SelectItem>
                      <SelectItem value="system">Système</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Langue</Label>
                  <Select value={displayPrefs.language} onValueChange={(value) => setDisplayPrefs({...displayPrefs, language: value})}>
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <Select value={displayPrefs.currency} onValueChange={(value) => setDisplayPrefs({...displayPrefs, currency: value})}>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XAF">XAF (Franc CFA)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Format de Date</Label>
                  <Select value={displayPrefs.dateFormat} onValueChange={(value) => setDisplayPrefs({...displayPrefs, dateFormat: value})}>
                    <SelectTrigger id="dateFormat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">JJ/MM/AAAA</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/JJ/AAAA</SelectItem>
                      <SelectItem value="YYYY-MM-DD">AAAA-MM-JJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberFormat">Format de Nombres</Label>
                  <Select value={displayPrefs.numberFormat} onValueChange={(value) => setDisplayPrefs({...displayPrefs, numberFormat: value})}>
                    <SelectTrigger id="numberFormat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr-FR">1 234,56 (Français)</SelectItem>
                      <SelectItem value="en-US">1,234.56 (Anglais)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sécurité */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sécurité & Confidentialité</CardTitle>
              <CardDescription>Protégez votre compte et vos données</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Authentification à Deux Facteurs</Label>
                    <p className="text-sm text-muted-foreground">Ajoutez une couche de sécurité supplémentaire</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(checked) => 
                      setSecuritySettings({...securitySettings, twoFactorAuth: checked})
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Délai d'Expiration de Session (minutes)</Label>
                  <Select 
                    value={securitySettings.sessionTimeout.toString()} 
                    onValueChange={(value) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(value)})}
                  >
                    <SelectTrigger id="sessionTimeout">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 heure</SelectItem>
                      <SelectItem value="120">2 heures</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications de Connexion</Label>
                    <p className="text-sm text-muted-foreground">Être alerté des nouvelles connexions</p>
                  </div>
                  <Switch
                    checked={securitySettings.loginNotifications}
                    onCheckedChange={(checked) => 
                      setSecuritySettings({...securitySettings, loginNotifications: checked})
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Changer le Mot de Passe</Label>
                <Button variant="outline" className="w-full">
                  <Lock className="h-4 w-4 mr-2" />
                  Modifier le Mot de Passe
                </Button>
              </div>

              <div className="flex justify-end">
                <Button disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres d'Export</CardTitle>
              <CardDescription>Configurez les options d'export de données</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Format d'Export par Défaut</Label>
                  <Select defaultValue="pdf">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Qualité des Graphiques</Label>
                  <Select defaultValue="high">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Inclure les Métadonnées</Label>
                    <p className="text-sm text-muted-foreground">Ajouter date, auteur, etc.</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Filigrane Officiel</Label>
                    <p className="text-sm text-muted-foreground">Ajouter le logo ministériel</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="flex justify-end">
                <Button disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}