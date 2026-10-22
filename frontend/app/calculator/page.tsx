import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getFilamentsWithStock } from "@/lib/filament-stock";
import { FilamentCalculator } from "@/app/dashboard/calculator/filament-calculator";
import LoginModal from "@/components/auth/login-modal";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Filament-Rechner | 3D Druck Tagebuch",
  description:
    "Berechne den Filamentbedarf mehrerer MakerWorld-Modelle – aufgeteilt nach Farbe.",
};

// Public version of the calculator – works without login.
// Logged-in users additionally see their filament stock.
export default async function PublicCalculatorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const filaments = user ? await getFilamentsWithStock(supabase) : [];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 p-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="rounded-lg shadow-md border border-border/50"
            />
            <span className="font-bold tracking-tight text-lg hidden sm:inline">
              3D Druck Tagebuch
            </span>
          </Link>
          {user ? (
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Zum Dashboard
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Startseite
              </Link>
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Filament-Rechner
          </h1>
          <p className="text-sm text-muted-foreground">
            Füge MakerWorld-Links hinzu und sieh, wie viel Filament du insgesamt
            brauchst – aufgeteilt nach Farbe.
          </p>
        </div>

        {!user && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border bg-muted/20 p-4 text-sm">
            <p className="text-muted-foreground">
              Melde dich an, um den Bedarf direkt mit deinem Filament-Lager
              abzugleichen.
            </p>
            <LoginModal />
          </div>
        )}

        <FilamentCalculator filaments={filaments} showStock={!!user} />
      </main>
    </div>
  );
}
