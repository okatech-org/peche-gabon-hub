import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage, Language } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Save, Languages, Palette, Bell } from "lucide-react";
import { toast } from "sonner";

interface UserPreferences {
  language: Language;
  theme: "light" | "dark";
  email_notifications: boolean;
  push_notifications: boolean;
}

const UserSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    language: language,
    theme: theme,
    email_notifications: true,
    push_notifications: false,
  });

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        const prefs: UserPreferences = {
          language: data.language as Language,
          theme: data.theme as "light" | "dark",
          email_notifications: data.email_notifications,
          push_notifications: data.push_notifications,
        };
        setPreferences(prefs);
        
        // Appliquer les préférences
        setLanguage(prefs.language);
        setTheme(prefs.theme);
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement des préférences:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          language: preferences.language,
          theme: preferences.theme,
          email_notifications: preferences.email_notifications,
          push_notifications: preferences.push_notifications,
        }, {
          onConflict: "user_id",
        });

      if (error) throw error;

      // Appliquer les préférences
      setLanguage(preferences.language);
      setTheme(preferences.theme);

      toast.success("Préférences sauvegardées avec succès");
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde des préférences");
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = (value: string) => {
    setPreferences(prev => ({ ...prev, language: value as Language }));
  };

  const handleThemeChange = (value: string) => {
    setPreferences(prev => ({ ...prev, theme: value as "light" | "dark" }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Paramètres</h1>
            <p className="text-muted-foreground">
              Gérez vos préférences d'application
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Langue */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-primary" />
                <CardTitle>Langue</CardTitle>
              </div>
              <CardDescription>
                Choisissez la langue de l'interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="language">Langue de l'application</Label>
                <Select
                  value={preferences.language}
                  onValueChange={handleLanguageChange}
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">🇫🇷 Français</SelectItem>
                    <SelectItem value="en">🇬🇧 English</SelectItem>
                    <SelectItem value="zh">🇨🇳 中文</SelectItem>
                    <SelectItem value="es">🇪🇸 Español</SelectItem>
                    <SelectItem value="ar">🇸🇦 العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Thème */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <CardTitle>Thème</CardTitle>
              </div>
              <CardDescription>
                Personnalisez l'apparence de l'application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="theme">Mode d'affichage</Label>
                <Select
                  value={preferences.theme}
                  onValueChange={handleThemeChange}
                >
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">☀️ Clair</SelectItem>
                    <SelectItem value="dark">🌙 Sombre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>
                Gérez vos préférences de notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">
                    Notifications par email
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Recevez des notifications importantes par email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={preferences.email_notifications}
                  onCheckedChange={(checked) =>
                    setPreferences(prev => ({ ...prev, email_notifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">
                    Notifications push
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Recevez des notifications en temps réel
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={preferences.push_notifications}
                  onCheckedChange={(checked) =>
                    setPreferences(prev => ({ ...prev, push_notifications: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Bouton de sauvegarde */}
          <div className="flex justify-end">
            <Button
              onClick={savePreferences}
              disabled={saving}
              size="lg"
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Sauvegarder les préférences
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
