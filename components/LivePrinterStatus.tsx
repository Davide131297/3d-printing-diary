"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Wifi, WifiOff, Loader2, Gauge, Clock, Package } from "lucide-react";
import Cookies from "js-cookie";
import { type BambuStatus } from "@/lib/bambu";

export function LivePrinterStatus() {
  const [mounted, setMounted] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<BambuStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchStatus = async () => {
    const ip = Cookies.get("bambu_ip");
    const serial = Cookies.get("bambu_serial");
    const accessCode = Cookies.get("bambu_access_code");

    if (!ip || !serial || !accessCode) {
      setError(
        "Keine Drucker-Daten gefunden. Bitte in den Einstellungen konfigurieren.",
      );
      setIsActive(false);
      return;
    }

    try {
      const res = await fetch("/api/printers/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip, serial, accessCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler beim Abrufen");

      setStatus(data.status);
      setError(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Ein unbekannter Fehler ist aufgetreten",
      );
      // We don't necessarily turn off the switch on one error,
      // but let's clear status
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      setIsLoading(true);
      fetchStatus();
      interval = setInterval(fetchStatus, 30000); // Poll every 30s
    } else {
      setStatus(null);
      setError(null);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const hasCredentials = !!Cookies.get("bambu_ip");

  if (!mounted || !hasCredentials) return null;

  return (
    <Card className="border-blue-100 dark:border-blue-900 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 bg-blue-50/50 dark:bg-blue-950/20">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wifi className="h-4 w-4 text-blue-500" />
            Live Drucker Status
          </CardTitle>
          <CardDescription className="text-xs">
            Bambu Lab Echtzeit-Überwachung
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="live-mode"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <Label htmlFor="live-mode" className="text-xs">
            {isActive ? "Aktiv" : "Aus"}
          </Label>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {!isActive ? (
          <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
            <WifiOff className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-xs">Verbindung deaktiviert</p>
          </div>
        ) : isLoading && !status ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="text-xs text-destructive bg-destructive/10 p-2 rounded flex items-center gap-2">
            <WifiOff className="h-3 w-3" />
            {error}
          </div>
        ) : status ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Druck-Status
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  status.printStatus === "PRINTING"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {status.printStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Gauge className="h-3.3 w-3.5" /> Fortschritt
                </div>
                <div className="text-lg font-bold">{status.progress}%</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.3 w-3.5" /> Restzeit
                </div>
                <div className="text-lg font-bold">
                  {status.remainingTimeMinutes} min
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Package className="h-3.5 w-3.5" /> Aktuelles Modell
              </div>
              <div className="text-sm font-medium line-clamp-1">
                {status.modelName || "N/A"}
              </div>
            </div>

            {status.filaments && status.filaments.length > 0 && (
              <div className="pt-2 border-t space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                  AMS Bestückung
                </p>
                <div className="flex gap-2">
                  {status.filaments.map((f, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div
                        className="w-4 h-4 rounded-full border shadow-sm"
                        style={{ backgroundColor: f.color }}
                        title={f.type}
                      />
                      <span className="text-[9px] text-muted-foreground font-medium">
                        {f.slot + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
