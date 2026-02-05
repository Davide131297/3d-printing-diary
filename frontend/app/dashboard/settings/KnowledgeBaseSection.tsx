"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Database } from "lucide-react";
import { toast } from "sonner";

export function KnowledgeBaseSection() {
  const [isLoading, setIsLoading] = useState(false);

  const handleIngest = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ingest");
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Aktualisierung fehlgeschlagen");
      toast.success(
        `Wissensdatenbank aktualisiert! ${data.insertedCount} Einträge verarbeitet.`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unbekannter Fehler";
      toast.error(
        "Fehler beim Aktualisieren der Wissensdatenbank: " + errorMessage,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          KI Wissensdatenbank
        </CardTitle>
        <CardDescription>
          Aktualisiere das Wissen der KI mit deinen neuesten Drucken und
          Filamenten.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleIngest} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Aktualisiere...
            </>
          ) : (
            "Wissensdatenbank aktualisieren"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
