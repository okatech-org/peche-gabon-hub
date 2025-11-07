import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Waves, Fish } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Auth = () => {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

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
    setIsLoading(true);
    try {
      await signIn(signInData.email, signInData.password);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signUp(
        signUpData.email,
        signUpData.password,
        signUpData.firstName,
        signUpData.lastName
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
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
      <div className="lg:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-elevated">
          <CardHeader>
            <CardTitle>Bienvenue</CardTitle>
            <CardDescription>
              Connectez-vous ou créez un compte pour accéder à la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={signInData.email}
                      onChange={(e) =>
                        setSignInData({ ...signInData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Mot de passe</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={signInData.password}
                      onChange={(e) =>
                        setSignInData({ ...signInData, password: e.target.value })
                      }
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Connexion..." : "Se connecter"}
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
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, firstName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Nom"
                        value={signUpData.lastName}
                        onChange={(e) =>
                          setSignUpData({ ...signUpData, lastName: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={signUpData.email}
                      onChange={(e) =>
                        setSignUpData({ ...signUpData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Minimum 6 caractères"
                      value={signUpData.password}
                      onChange={(e) =>
                        setSignUpData({ ...signUpData, password: e.target.value })
                      }
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Création..." : "Créer un compte"}
                  </Button>
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
