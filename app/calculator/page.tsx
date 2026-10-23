import { getCurrentUser } from "@/lib/auth";
import { getFilaments, getSavedCalculations } from "@/lib/db";
import { FilamentCalculator } from "@/app/dashboard/calculator/filament-calculator";
import Image from "next/image";
import Link from "next/link";
import { Calculator } from "lucide-react";

export const metadata = {
  title: "Filament-Rechner – Kostenlos & ohne Login | 3D Druck Tagebuch",
  description:
    "Füge MakerWorld-Links ein und berechne sofort den gesamten Filamentbedarf und die exakte Farbverteilung.",
};

export default async function PublicCalculatorPage() {
  const user = await getCurrentUser();

  const [userFilaments, savedCalculations] = user
    ? await Promise.all([
        getFilaments(user.id),
        getSavedCalculations(user.id),
      ])
    : [[], []];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background relative overflow-x-hidden">
      {/* Decorative Grid Lines */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-20"
        aria-hidden="true"
      >
        <div className="absolute top-[20%] left-0 w-full h-px bg-linear-to-r from-transparent via-primary to-transparent" />
        <div className="absolute top-[80%] left-0 w-full h-px bg-linear-to-r from-transparent via-primary to-transparent" />
        <div className="absolute left-[15%] top-0 h-full w-px bg-linear-to-b from-transparent via-primary to-transparent" />
        <div className="absolute left-[85%] top-0 h-full w-px bg-linear-to-b from-transparent via-primary to-transparent" />
      </div>

      {/* Top Navbar */}
      <header className="border-b border-border/40 backdrop-blur-xl bg-background/60 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.png"
              alt="Logo"
              width={34}
              height={34}
              className="rounded-lg shadow-sm border border-border/50 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-tight tracking-tight">
                3D Druck Tagebuch
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
                Filament-Rechner
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
            >
              Startseite
            </Link>
            {user ? (
              <Link
                href="/dashboard"
                className="text-xs px-3 py-1.5 rounded-md border border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-medium transition-colors"
              >
                Zum Dashboard
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 relative z-10">
        <FilamentCalculator
          userFilaments={userFilaments}
          isLoggedIn={!!user}
          initialSavedCalculations={savedCalculations}
          showHomeLink={false}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6 text-center text-xs text-muted-foreground/60 relative z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>3D Druck Tagebuch • Kostenloser MakerWorld Filament-Rechner</span>
          <Link href="/" className="hover:text-foreground transition-colors">
            Zurück zur Übersicht
          </Link>
        </div>
      </footer>
    </div>
  );
}
