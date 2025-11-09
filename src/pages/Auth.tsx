import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Waves, Fish, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { z } from "zod";

// Schemas de validation
const signInSchema = z.object({
  email: z.string().trim().email({ message: "Email invalide" }),
  password: z.string().min(1, { message: "Mot de passe requis" }),
});

const signUpSchema = z.object({
  email: z.string().trim().email({ message: "Email invalide" }).max(255, { message: "Email trop long" }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }).max(100, { message: "Mot de passe trop long" }),
  firstName: z.string().trim().min(1, { message: "Prénom requis" }).max(100, { message: "Prénom trop long" }),
  lastName: z.string().trim().min(1, { message: "Nom requis" }).max(100, { message: "Nom trop long" }),
});

const Auth = () => {
  const { signIn, signUp, user, roles } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user && roles.length > 0) {
      // Redirection intelligente selon le rôle
      if (roles.includes('super_admin')) {
        navigate("/superadmin-dashboard");
      } else if (roles.includes('ministre')) {
        navigate("/minister-dashboard");
      } else if (roles.includes('dgpa')) {
        navigate("/dgpa-dashboard");
      } else if (roles.includes('anpa')) {
        navigate("/anpa-dashboard");
      } else if (roles.includes('agasa')) {
        navigate("/agasa-dashboard");
      } else if (roles.includes('dgmm')) {
        navigate("/dgmm-dashboard");
      } else if (roles.includes('oprag')) {
        navigate("/oprag-dashboard");
      } else if (roles.includes('anpn')) {
        navigate("/anpn-dashboard");
      } else if (roles.includes('armateur_pi')) {
        navigate("/armeur-dashboard");
      } else if (roles.includes('gestionnaire_coop')) {
        navigate("/cooperative-dashboard");
      } else if (roles.includes('admin')) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, roles, navigate]);

  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });

  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const validated = signInSchema.parse(signInData);
      await signIn(validated.email, validated.password);
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur PÊCHE GABON",
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message || "Erreur de connexion. Vérifiez vos identifiants.");
      } else {
        setError("Erreur de connexion. Vérifiez vos identifiants.");
      }
      toast({
        title: "Erreur de connexion",
        description: "Vérifiez vos identifiants et réessayez.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const validated = signUpSchema.parse(signUpData);
      await signUp(
        validated.email,
        validated.password,
        validated.firstName,
        validated.lastName
      );
      toast({
        title: "Compte créé avec succès",
        description: "Vous pouvez maintenant vous connecter.",
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message || "Erreur lors de la création du compte.");
      } else {
        setError("Erreur lors de la création du compte.");
      }
      toast({
        title: "Erreur d'inscription",
        description: "Impossible de créer le compte. Réessayez.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Back button & Theme toggle */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'accueil
        </Button>
        <ThemeToggle />
      </div>

      {/* Left side - Branding */}
      <div className="lg:w-1/2 bg-gradient-ocean p-8 lg:p-12 flex flex-col justify-center text-white">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Fish className="h-12 w-12" />
            <h1 className="text-4xl font-bold">PÊCHE GABON</h1>
          </div>
          <p className="text-xl mb-8 text-white/90">
            Plateforme Nationale de Gestion des Ressources Halieutiques
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Waves className="h-6 w-6 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Gestion Intégrée</h3>
                <p className="text-white/80 text-sm">
                  Suivi des captures artisanales et industrielles en temps réel
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Waves className="h-6 w-6 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Conformité Réglementaire</h3>
                <p className="text-white/80 text-sm">
                  Licences, paiements et surveillance automatisés
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Waves className="h-6 w-6 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Analytics Avancées</h3>
                <p className="text-white/80 text-sm">
                  Tableaux de bord et exports pour la prise de décision
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md shadow-elevated border-border">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Bienvenue</CardTitle>
            <CardDescription>
              Connectez-vous ou créez un compte pour accéder à la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Tabs defaultValue="signin" className="w-full" onValueChange={() => setError(null)}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="signin">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email professionnel</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={signInData.email}
                      onChange={(e) => {
                        setSignInData({ ...signInData, email: e.target.value });
                        setError(null);
                      }}
                      disabled={isLoading}
                      className="transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password">Mot de passe</Label>
                      <Button
                        type="button"
                        variant="link"
                        className="px-0 text-xs text-muted-foreground hover:text-primary"
                        onClick={() => toast({
                          title: "Récupération de mot de passe",
                          description: "Contactez l'administrateur système pour réinitialiser votre mot de passe.",
                        })}
                      >
                        Mot de passe oublié ?
                      </Button>
                    </div>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={signInData.password}
                      onChange={(e) => {
                        setSignInData({ ...signInData, password: e.target.value });
                        setError(null);
                      }}
                      disabled={isLoading}
                      className="transition-colors"
                    />
                  </div>
                  <Button type="submit" className="w-full shadow-glow" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connexion en cours...
                      </>
                    ) : (
                      "Se connecter"
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Prénom"
                        value={signUpData.firstName}
                        onChange={(e) => {
                          setSignUpData({ ...signUpData, firstName: e.target.value });
                          setError(null);
                        }}
                        disabled={isLoading}
                        maxLength={100}
                        className="transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Nom"
                        value={signUpData.lastName}
                        onChange={(e) => {
                          setSignUpData({ ...signUpData, lastName: e.target.value });
                          setError(null);
                        }}
                        disabled={isLoading}
                        maxLength={100}
                        className="transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email professionnel</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={signUpData.email}
                      onChange={(e) => {
                        setSignUpData({ ...signUpData, email: e.target.value });
                        setError(null);
                      }}
                      disabled={isLoading}
                      maxLength={255}
                      className="transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Minimum 6 caractères"
                      value={signUpData.password}
                      onChange={(e) => {
                        setSignUpData({ ...signUpData, password: e.target.value });
                        setError(null);
                      }}
                      disabled={isLoading}
                      minLength={6}
                      maxLength={100}
                      className="transition-colors"
                    />
                    <p className="text-xs text-muted-foreground">
                      Le mot de passe doit contenir au moins 6 caractères
                    </p>
                  </div>
                  <Button type="submit" className="w-full shadow-glow" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      "Créer un compte"
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    En créant un compte, vous acceptez les conditions d'utilisation 
                    de la plateforme PÊCHE GABON.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
