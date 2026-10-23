import LoginModal from "@/components/auth/login-modal";
import { Printer, Box, Layers, Activity, Calculator } from "lucide-react";
import { LogoutAlert } from "@/components/logout-alert";
import exampleChoosePrinter from "@/assets/images/example-choose-printer.png";
import exampleDiaryCardView from "@/assets/images/example-diary-card-view.png";
import exampleFilamentStorage from "@/assets/images/example-filament-storage.png";
import { ParallaxImage } from "@/components/ui/parallax-image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Home(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const isLoggedOut = searchParams.logged_out === "true";

  return (
    <div className="flex flex-col min-h-screen font-sans">
      {isLoggedOut && <LogoutAlert />}
      {/* Decorative Grid Lines - subtle overlay */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-20"
        aria-hidden="true"
      >
        <div className="absolute top-[20%] left-0 w-full h-px bg-linear-to-r from-transparent via-primary to-transparent" />
        <div className="absolute top-[80%] left-0 w-full h-px bg-linear-to-r from-transparent via-primary to-transparent" />
        <div className="absolute left-[20%] top-0 h-full w-px bg-linear-to-b from-transparent via-primary to-transparent" />
        <div className="absolute left-[80%] top-0 h-full w-px bg-linear-to-b from-transparent via-primary to-transparent" />
      </div>

      <main className="flex-1 flex flex-col items-center p-6 pt-20 relative z-10">
        {/* Main Card / HUD Container */}
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Column: Text & CTA */}
          <div className="space-y-8 text-left animate-in slide-in-from-left-4 fade-in duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-mono uppercase tracking-widest shadow-[0_0_10px_-4px_var(--color-primary)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              System Online
            </div>

            <div className="space-y-2">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-linear-to-br from-white via-white to-white/50">
                3D Druck <br />
                <span className="text-primary">Tagebuch</span>
              </h1>
            </div>

            <p className="text-lg text-muted-foreground font-light max-w-md leading-relaxed border-l-2 border-primary/20 pl-4">
              Das fortschrittlichste System zur Dokumentation und Verwaltung
              deiner additiven Fertigungsprozesse.
              <span className="mt-4 text-sm opacity-50 font-mono text-primary flex gap-4">
                <span>{"// FILAMENT"}</span>
                <span>{"// DRUCKER"}</span>
                <span>{"// PROJEKTE"}</span>
                <span>{"// RECHNER"}</span>
              </span>
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <LoginModal />
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-7 text-base rounded-sm border-white/20 bg-white/5 hover:bg-white/10 hover:border-primary/50 text-foreground transition-all duration-300 backdrop-blur-sm group"
                asChild
              >
                <Link href="/calculator">
                  <Calculator className="mr-2 h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                  <span>Filament-Rechner</span>
                  <span className="ml-2 text-xs text-muted-foreground uppercase tracking-wider font-mono bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded">
                    Ohne Login
                  </span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Column: Visual Tech Display */}
          <div className="relative hidden md:flex aspect-square md:aspect-auto md:h-[500px] items-center justify-center animate-in slide-in-from-right-4 fade-in duration-700 delay-200">
            {/* Abstract Printer Interface */}
            <div className="relative w-full max-w-sm mx-auto border border-white/10 bg-black/40 backdrop-blur-md rounded-xl p-6 flex flex-col gap-4 shadow-2xl ring-1 ring-white/5 transition-transform hover:scale-[1.02] duration-500">
              {/* Header of the "Device" */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
                <div className="text-[10px] font-mono text-muted-foreground/60 tracking-wider">
                  ID: MK4-CORE
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="col-span-2 bg-white/5 rounded-lg p-4 border border-white/5 flex items-center gap-4 group">
                  <div className="p-3 rounded-md bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary/20 transition-colors">
                    <Printer className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
                      Status
                    </div>
                    <div className="font-semibold text-white">Druckt...</div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                  <div className="text-[10px] text-muted-foreground uppercase font-mono mb-2 tracking-wider">
                    Nozzle
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="text-xl font-bold font-mono">215°C</div>
                    <Activity className="h-4 w-4 text-green-500 mb-1" />
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                  <div className="text-[10px] text-muted-foreground uppercase font-mono mb-2 tracking-wider">
                    Bed
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="text-xl font-bold font-mono">60°C</div>
                    <Activity className="h-4 w-4 text-green-500 mb-1" />
                  </div>
                </div>

                <div className="col-span-2 mt-auto p-4 bg-white/5 rounded-lg border border-white/5">
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono mb-2">
                    <span>PRINT_PROGRESS</span>
                    <span className="text-primary">68%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[68%] shadow-[0_0_10px_var(--color-primary)]" />
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>REM: 45m</span>
                    <span>Z: 14.2mm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative floating elements */}
            <div className="absolute -top-6 -right-6 p-3 bg-black/60 border border-primary/30 text-primary rounded-lg backdrop-blur-xl animate-bounce shadow-[0_0_20px_-5px_var(--color-primary)]">
              <Box className="h-6 w-6" />
            </div>
            <div className="absolute -bottom-8 -left-12 p-4 bg-muted/5 border border-white/5 text-muted-foreground rounded-lg backdrop-blur-sm -rotate-6 hover:rotate-0 transition-transform duration-500">
              <Layers className="h-8 w-8 opacity-50" />
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl w-full mt-32 space-y-32 mb-20">
          <div className="text-center space-y-4 mb-24">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-white">
              Deine 3D-Druck Zentrale
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Verwalte dein Hobby professionell. Alles an einem Ort.
            </p>
          </div>

          {/* Feature 1: Printer Management */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
            <div className="md:col-span-2 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-mono uppercase tracking-widest">
                <Printer className="h-4 w-4" />
                <span>Maschinenpark</span>
              </div>
              <h3 className="text-2xl md:text-4xl font-bold text-white">
                Drucker verwalten
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Behalte den Überblick über deinen gesamten Maschinenpark.
              </p>
            </div>
            <div className="md:col-span-3 relative group perspective-1000 w-full overflow-hidden rounded-xl aspect-1806/1614">
              <div className="absolute inset-0 bg-primary/20 blur-3xl -z-10 rounded-full opacity-20 group-hover:opacity-40 transition-opacity" />
              <ParallaxImage
                src={exampleChoosePrinter}
                alt="Drucker Auswahl Interface"
                className="hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>

          {/* Feature 2: Filament Storage */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center md:flex-row-reverse">
            <div className="md:col-span-2 md:order-2 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-mono uppercase tracking-widest">
                <Box className="h-4 w-4" />
                <span>Materiallager</span>
              </div>
              <h3 className="text-2xl md:text-4xl font-bold text-white">
                Filament Lager
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Verwalte deine Filament-Bestände mit Leichtigkeit. Erfasse
                Farben, Materialien, Hersteller und verbleibende Mengen. Nie
                wieder ein Druckabbruch wegen Materialmangel.
              </p>
            </div>
            <div className="md:col-span-3 md:order-1 relative group w-full overflow-hidden rounded-xl aspect-2884/750">
              <div className="absolute inset-0 bg-primary/20 blur-3xl -z-10 rounded-full opacity-20 group-hover:opacity-40 transition-opacity" />
              <ParallaxImage
                src={exampleFilamentStorage}
                alt="Filament Lager Übersicht"
                className="hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>

          {/* Feature 3: Project Diary */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
            <div className="md:col-span-2 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-mono uppercase tracking-widest">
                <Layers className="h-4 w-4" />
                <span>Dokumentation</span>
              </div>
              <h3 className="text-2xl md:text-4xl font-bold text-white">
                Projekt Tagebuch
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Dokumentiere jeden Druck. Lerne aus Fehlern und wechsle
                blitzschnell zwischen Karten- und Tabellenansicht.
              </p>
            </div>
            <div className="md:col-span-3 relative group w-full overflow-hidden rounded-xl aspect-2900/1752">
              <div className="absolute inset-0 bg-primary/20 blur-3xl -z-10 rounded-full opacity-20 group-hover:opacity-40 transition-opacity" />
              <ParallaxImage
                src={exampleDiaryCardView}
                alt="Projekt Tagebuch Kartenansicht"
                className="hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full p-6 text-center text-[10px] text-muted-foreground/40 font-mono tracking-[0.2em] relative z-10">
        <p>3D Print Diary // VERSION 1.0</p>
      </footer>
    </div>
  );
}
