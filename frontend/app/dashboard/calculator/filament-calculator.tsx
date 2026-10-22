"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Minus,
  Plus,
  RotateCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Filament } from "@/types/diary";
import type { ScrapedData } from "@/app/dashboard/diary/scrape";
import { fetchMakerWorldData } from "@/lib/makerworld";

type Entry = {
  key: string;
  url: string;
  status: "loading" | "done" | "error";
  data?: ScrapedData;
  profileIndex: number;
  quantity: number;
};

const STORAGE_KEY = "filament-calculator-entries";

function normalizeHex(color: string): string | null {
  const c = color.trim();
  const long = c.match(/^#?([0-9a-f]{6})/i);
  if (long) return `#${long[1].toUpperCase()}`;
  const short = c.match(/^#?([0-9a-f]{3})$/i);
  if (short) {
    return `#${short[1]
      .split("")
      .map((ch) => ch + ch)
      .join("")
      .toUpperCase()}`;
  }
  const rgb = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) {
    return `#${[rgb[1], rgb[2], rgb[3]]
      .map((v) => parseInt(v).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()}`;
  }
  return null;
}

function colorDistance(a: string, b: string): number {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return Math.sqrt(pa.reduce((acc, v, i) => acc + (v - pb[i]) ** 2, 0));
}

// Colors this close are treated as "the same" spool in your stock
const SIMILAR_COLOR_DISTANCE = 40;

function formatGrams(g: number): string {
  return `${(Math.round(g * 10) / 10).toLocaleString("de-DE")} g`;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

function newKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function FilamentCalculator({
  filaments,
  showStock = false,
}: {
  filaments: Filament[];
  // Only logged-in users have a stock to compare against
  showStock?: boolean;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Restore the list from the last visit (only finished entries)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Entry[];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEntries(parsed.filter((e) => e.status === "done"));
      }
    } catch {
      // Storage not available – start empty
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(entries.filter((e) => e.status === "done")),
      );
    } catch {
      // Ignore storage errors
    }
  }, [entries, hydrated]);

  const updateEntry = (key: string, patch: Partial<Entry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.key === key ? { ...e, ...patch } : e)),
    );
  };

  const loadEntry = async (key: string, url: string) => {
    updateEntry(key, { status: "loading" });
    try {
      const data = await fetchMakerWorldData(url);
      updateEntry(key, { status: "done", data, profileIndex: 0 });
    } catch (error) {
      console.error("Error scraping MakerWorld:", error);
      updateEntry(key, { status: "error" });
    }
  };

  const handleAdd = () => {
    // Allow pasting several links at once (separated by whitespace/newlines)
    const urls = linkInput
      .split(/\s+/)
      .map((u) => u.trim())
      .filter(Boolean);

    if (urls.length === 0) return;

    const invalid = urls.filter((u) => !u.includes("makerworld.com"));
    if (invalid.length > 0) {
      setInputError("Bitte nur MakerWorld-Links einfügen.");
      return;
    }

    setInputError("");
    setLinkInput("");
    const newEntries: Entry[] = urls.map((url) => ({
      key: newKey(),
      url,
      status: "loading",
      profileIndex: 0,
      quantity: 1,
    }));
    setEntries((prev) => [...prev, ...newEntries]);
    // Scrape one after another so the backend isn't flooded with browsers
    (async () => {
      for (const e of newEntries) {
        await loadEntry(e.key, e.url);
      }
    })();
  };

  const removeEntry = (key: string) => {
    setEntries((prev) => prev.filter((e) => e.key !== key));
  };

  // Sum up grams per color over all entries (× quantity)
  const totals = useMemo(() => {
    const byColor = new Map<string, number>();
    let total = 0;
    let time = 0;
    let missingWeights = 0;

    for (const entry of entries) {
      if (entry.status !== "done") continue;
      const profile = entry.data?.profiles?.[entry.profileIndex];
      const weights = profile?.filamentWeights || [];
      if (weights.length === 0) {
        missingWeights++;
        continue;
      }
      for (const w of weights) {
        const color = normalizeHex(w.color) || "Unbekannt";
        const amount = w.amount * entry.quantity;
        byColor.set(color, (byColor.get(color) || 0) + amount);
        total += amount;
      }
      const t = profile?.printTime ?? entry.data?.printTime;
      if (t) time += t * entry.quantity;
    }

    const colors = Array.from(byColor.entries())
      .map(([color, grams]) => {
        let stock: Filament[] = [];
        if (color.startsWith("#")) {
          stock = filaments.filter((f) => {
            const hex = f.color ? normalizeHex(f.color) : null;
            return hex && colorDistance(hex, color) <= SIMILAR_COLOR_DISTANCE;
          });
        }
        const available = stock.reduce(
          (acc, f) => acc + Math.max(0, f.remaining_g ?? f.weight_g ?? 0),
          0,
        );
        return { color, grams, stock, available };
      })
      .sort((a, b) => b.grams - a.grams);

    return { colors, total, time, missingWeights };
  }, [entries, filaments]);

  const loadingCount = entries.filter((e) => e.status === "loading").length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <Card className="p-4 space-y-3">
          <label htmlFor="makerworld-links" className="text-sm font-medium">
            MakerWorld-Link hinzufügen
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="makerworld-links"
              placeholder="https://makerworld.com/de/models/..."
              value={linkInput}
              onChange={(e) => {
                setLinkInput(e.target.value);
                setInputError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
            <Button
              type="button"
              onClick={handleAdd}
              disabled={!linkInput.trim()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Hinzufügen
            </Button>
          </div>
          {inputError && (
            <p className="text-sm text-destructive">{inputError}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Du kannst auch mehrere Links auf einmal einfügen (durch Leerzeichen
            getrennt). Das Abrufen dauert pro Modell einige Sekunden.
          </p>
        </Card>

        {entries.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Noch keine Modelle hinzugefügt.
          </Card>
        )}

        {entries.map((entry) => (
          <EntryCard
            key={entry.key}
            entry={entry}
            onChange={(patch) => updateEntry(entry.key, patch)}
            onRemove={() => removeEntry(entry.key)}
            onRetry={() => loadEntry(entry.key, entry.url)}
          />
        ))}
      </div>

      <div className="lg:sticky lg:top-8 h-fit">
        <Card className="p-4 space-y-4">
          <div>
            <h4 className="font-semibold">Gesamtbedarf</h4>
            <p className="text-3xl font-bold tracking-tight mt-1">
              {formatGrams(totals.total)}
            </p>
            {totals.time > 0 && (
              <p className="text-sm text-muted-foreground">
                Druckzeit ca. {formatTime(totals.time)}
              </p>
            )}
            {loadingCount > 0 && (
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                {loadingCount} Modell(e) werden noch geladen…
              </p>
            )}
          </div>

          {totals.colors.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-muted-foreground">
                Nach Farbe
              </h5>
              <ul className="space-y-2">
                {totals.colors.map((c) => {
                  const enough = c.available >= c.grams;
                  return (
                    <li
                      key={c.color}
                      className="flex items-start gap-3 rounded-md border p-2"
                    >
                      <span
                        className="mt-0.5 h-6 w-6 shrink-0 rounded-full border shadow-sm"
                        style={{
                          background: c.color.startsWith("#")
                            ? c.color
                            : "repeating-linear-gradient(45deg,#ccc,#ccc 3px,#fff 3px,#fff 6px)",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-sm">{c.color}</span>
                          <span className="font-semibold">
                            {formatGrams(c.grams)}
                          </span>
                        </div>
                        {!showStock ? null : c.stock.length > 0 ? (
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            {enough ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-amber-600 shrink-0" />
                            )}
                            <span className="truncate">
                              {c.stock.map((f) => f.name).join(", ")} –{" "}
                              {formatGrams(c.available)} vorrätig
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">
                            Kein passendes Filament im Lager
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {totals.missingWeights > 0 && (
            <p className="text-xs text-amber-600">
              Bei {totals.missingWeights} Modell(en) wurden keine
              Filamentmengen gefunden – sie fehlen in der Summe.
            </p>
          )}

          {entries.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setEntries([])}
            >
              Liste leeren
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}

function EntryCard({
  entry,
  onChange,
  onRemove,
  onRetry,
}: {
  entry: Entry;
  onChange: (patch: Partial<Entry>) => void;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const profiles = entry.data?.profiles || [];
  const profile = profiles[entry.profileIndex];
  const entryGrams =
    (profile?.filamentWeights || []).reduce((acc, w) => acc + w.amount, 0) *
    entry.quantity;

  return (
    <Card className="p-4">
      <div className="flex gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
          {entry.data?.imageUrl && (
            <Image
              src={entry.data.imageUrl}
              alt={entry.data.title || "Modell"}
              fill
              className="object-cover"
            />
          )}
          {entry.status === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium truncate">
                {entry.data?.title ||
                  (entry.status === "loading"
                    ? "Daten werden abgerufen…"
                    : "Modell")}
              </p>
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1 max-w-full"
              >
                <span className="truncate">{entry.url}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              aria-label="Entfernen"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {entry.status === "error" && (
            <Alert variant="destructive">
              <AlertTitle>Abruf fehlgeschlagen</AlertTitle>
              <AlertDescription className="flex flex-wrap items-center gap-2">
                Die Daten konnten nicht geladen werden.
                <Button size="sm" variant="outline" onClick={onRetry}>
                  <RotateCw className="mr-2 h-3 w-3" />
                  Erneut versuchen
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {entry.status === "done" && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              {profiles.length > 0 ? (
                <Select
                  value={String(entry.profileIndex)}
                  onValueChange={(v) => onChange({ profileIndex: Number(v) })}
                >
                  <SelectTrigger className="sm:flex-1 min-w-0">
                    <SelectValue placeholder="Profil wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((p, idx) => (
                      <SelectItem key={idx} value={String(idx)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground sm:flex-1">
                  Keine Druckprofile gefunden
                </p>
              )}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Weniger"
                  disabled={entry.quantity <= 1}
                  onClick={() =>
                    onChange({ quantity: Math.max(1, entry.quantity - 1) })
                  }
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center text-sm tabular-nums">
                  {entry.quantity}×
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Mehr"
                  onClick={() => onChange({ quantity: entry.quantity + 1 })}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {entry.status === "done" && profile && (
            <div className="flex flex-wrap items-center gap-2">
              {(profile.filamentWeights || []).map((w, i) => (
                <Badge key={i} variant="secondary" className="gap-1.5">
                  <span
                    className="h-3 w-3 rounded-full border"
                    style={{ background: normalizeHex(w.color) || "#ccc" }}
                  />
                  {formatGrams(w.amount * entry.quantity)}
                </Badge>
              ))}
              {entryGrams > 0 && (
                <span className="text-xs text-muted-foreground ml-auto">
                  Summe {formatGrams(entryGrams)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
