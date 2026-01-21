import { login, signup } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LoginPage(props: {
  searchParams: Promise<{ message: string; error: string }>;
}) {
  const searchParams = await props.searchParams;
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Anmelden / Registrieren</CardTitle>
          <CardDescription>
            Melde dich an, um dein 3D Druck Tagebuch zu verwalten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="m@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input id="password" name="password" type="password" required />
            </div>

            {searchParams?.message && (
              <div className="text-green-500 text-sm">
                {searchParams.message}
              </div>
            )}

            {searchParams?.error && (
              <div className="text-destructive text-sm">
                {searchParams.error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button formAction={login} className="w-full">
                Anmelden
              </Button>
              <Button
                formAction={signup}
                variant="outline"
                className="w-full text-foreground hover:bg-secondary"
              >
                Registrieren
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
