import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-8 text-center space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl">
          3D Druck Tagebuch
        </h1>
        <p className="text-lg text-muted-foreground max-w-[600px]">
          Dokumentiere deine 3D Drucke, verwalte deine Filamente und behalte den
          Überblick über deine Drucker.
        </p>
      </div>
      <div>
        <Link href="/login">
          <Button size="lg" className="bg-white text-black hover:bg-gray-200">
            Loslegen / Anmelden
          </Button>
        </Link>
      </div>
    </div>
  );
}
