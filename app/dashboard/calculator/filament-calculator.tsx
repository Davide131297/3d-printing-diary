"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calculator,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Clock,
  Scale,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ListPlus,
  Check,
  Loader2,
  Bookmark,
  BookmarkCheck,
  FolderOpen,
  ArrowLeft,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Filament } from "@/types/diary";
import { PrintProfile, scrapeMakerWorld } from "@/lib/scrape";
import { DbSavedCalculation } from "@/lib/db";
import { saveCalculationAction, deleteCalculationAction } from "./actions";
import LoginModal from "@/components/auth/login-modal";
import {
  getColorName,
  normalizeHex,
  formatWeight,
  formatPrintTime,
} from "@/lib/color-utils";

export interface CalculatorItem {
  id: string; // client uuid
  url: string;
  title: string;
  imageUrl?: string;
  profiles: PrintProfile[];
  selectedProfileId: string;
  quantity: number;
}

interface FilamentCalculatorProps {
  userFilaments?: Filament[];
  isLoggedIn?: boolean;
  initialSavedCalculations?: DbSavedCalculation[];
  showHomeLink?: boolean;
}

const EXAMPLE_URL =
  "https://makerworld.com/de/models/786166-super-mario-s-star#profileId-723803";

export function FilamentCalculator({
  userFilaments = [],
  isLoggedIn = false,
  initialSavedCalculations = [],
  showHomeLink = false,
}: FilamentCalculatorProps) {
  const [items, setItems] = useState<CalculatorItem[]>([]);
  const [inputUrl, setInputUrl] = useState("");
  const [batchUrls, setBatchUrls] = useState("");
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [copied, setCopied] = useState(false);

  // Saved calculations state
  const [savedCalculations, setSavedCalculations] = useState<DbSavedCalculation[]>(
    initialSavedCalculations,
  );
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [calcName, setCalcName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedListOpen, setSavedListOpen] = useState(false);

  // Add single link
  const handleAddSingle = async (urlToAdd?: string) => {
    const targetUrl = (urlToAdd || inputUrl).trim();
    if (!targetUrl) {
      toast.error("Bitte gib eine MakerWorld-URL ein");
      return;
    }

    if (!targetUrl.includes("makerworld.com")) {
      toast.error("Bitte gib eine gültige MakerWorld-URL an");
      return;
    }

    setIsLoading(true);
    setLoadingText("Analysiere MakerWorld Modell...");

    try {
      const data = await scrapeMakerWorld(targetUrl);
      if (!data || !data.profiles || data.profiles.length === 0) {
        toast.error("Keine Druckprofile für dieses Modell gefunden");
        return;
      }

      // Determine selected profile
      const hashMatch = targetUrl.match(/profileId-(\d+)/i) || targetUrl.match(/#(\d+)/);
      const requestedId = hashMatch ? hashMatch[1] : undefined;

      let selectedId =
        data.selectedProfileId ||
        (requestedId && data.profiles.some((p) => p.id === requestedId)
          ? requestedId
          : undefined);

      if (!selectedId) {
        const def = data.profiles.find((p) => p.isDefault);
        selectedId = def?.id || data.profiles[0]?.id || "0";
      }

      const newItem: CalculatorItem = {
        id: crypto.randomUUID(),
        url: targetUrl,
        title: data.title || "Unbenanntes Modell",
        imageUrl: data.imageUrl,
        profiles: data.profiles,
        selectedProfileId: selectedId,
        quantity: 1,
      };

      setItems((prev) => [...prev, newItem]);
      setInputUrl("");
      toast.success(`"${newItem.title}" hinzugefügt!`);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Laden des Modells",
      );
    } finally {
      setIsLoading(false);
      setLoadingText("");
    }
  };

  // Add multiple links
  const handleAddBatch = async () => {
    const urls = batchUrls
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0 && u.includes("makerworld.com"));

    if (urls.length === 0) {
      toast.error("Keine gültigen MakerWorld-Links gefunden");
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    const newItems: CalculatorItem[] = [];

    for (let i = 0; i < urls.length; i++) {
      const targetUrl = urls[i];
      setLoadingText(`Lade Modell ${i + 1} von ${urls.length}...`);

      try {
        const data = await scrapeMakerWorld(targetUrl);
        if (data && data.profiles && data.profiles.length > 0) {
          const hashMatch = targetUrl.match(/profileId-(\d+)/i) || targetUrl.match(/#(\d+)/);
          const requestedId = hashMatch ? hashMatch[1] : undefined;

          let selectedId =
            data.selectedProfileId ||
            (requestedId && data.profiles.some((p) => p.id === requestedId)
              ? requestedId
              : undefined);

          if (!selectedId) {
            const def = data.profiles.find((p) => p.isDefault);
            selectedId = def?.id || data.profiles[0]?.id || "0";
          }

          newItems.push({
            id: crypto.randomUUID(),
            url: targetUrl,
            title: data.title || `Modell ${i + 1}`,
            imageUrl: data.imageUrl,
            profiles: data.profiles,
            selectedProfileId: selectedId,
            quantity: 1,
          });
          successCount++;
        }
      } catch (err) {
        console.warn(`Fehler bei Link ${targetUrl}:`, err);
      }
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
      setBatchUrls("");
      setIsBatchMode(false);
      toast.success(`${successCount} von ${urls.length} Modellen erfolgreich hinzugefügt!`);
    } else {
      toast.error("Keine Modelle konnten geladen werden");
    }

    setIsLoading(false);
    setLoadingText("");
  };

  // Change profile for an item
  const handleProfileChange = (itemId: string, profileId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, selectedProfileId: profileId } : item,
      ),
    );
  };

  // Change quantity for an item
  const handleQuantityChange = (itemId: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }),
    );
  };

  // Remove single item
  const handleRemoveItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    toast.info("Modell entfernt");
  };

  // Clear all items
  const handleClearAll = () => {
    if (confirm("Möchtest du wirklich alle Modelle aus der Liste löschen?")) {
      setItems([]);
      toast.info("Liste geleert");
    }
  };

  // -------------------------------------------------------------
  // CALCULATIONS
  // -------------------------------------------------------------

  interface AggregatedColor {
    color: string;
    material: string;
    name: string;
    amount: number;
    percentage: number;
    matchedStock?: Filament;
  }

  let totalWeightGrams = 0;
  let totalPrintTimeMinutes = 0;
  let totalObjectsCount = 0;

  const colorMap = new Map<string, { color: string; material: string; amount: number }>();

  items.forEach((item) => {
    const selectedProfile =
      item.profiles.find((p) => p.id === item.selectedProfileId) || item.profiles[0];

    if (!selectedProfile) return;

    totalObjectsCount += item.quantity;
    if (selectedProfile.printTime) {
      totalPrintTimeMinutes += selectedProfile.printTime * item.quantity;
    }

    const weights = selectedProfile.filamentWeights || [];
    weights.forEach((fw) => {
      const normColor = normalizeHex(fw.color);
      const material = fw.material || "PLA";
      const key = `${normColor}_${material.toUpperCase()}`;
      const itemAmount = (fw.amount || 0) * item.quantity;

      totalWeightGrams += itemAmount;

      const existing = colorMap.get(key);
      if (existing) {
        existing.amount += itemAmount;
      } else {
        colorMap.set(key, {
          color: normColor,
          material,
          amount: itemAmount,
        });
      }
    });
  });

  // Calculate percentages and match with inventory
  const aggregatedColors: AggregatedColor[] = Array.from(colorMap.values())
    .map((c) => {
      const percentage = totalWeightGrams > 0 ? (c.amount / totalWeightGrams) * 100 : 0;
      const colorName = getColorName(c.color);

      // Match inventory
      const matched = userFilaments.find((f) => {
        const fColorNorm = normalizeHex(f.color);
        const colorMatch = fColorNorm === c.color;
        const materialMatch =
          !f.material ||
          !c.material ||
          f.material.toLowerCase() === c.material.toLowerCase();
        return colorMatch && materialMatch;
      });

      return {
        color: c.color,
        material: c.material,
        name: colorName,
        amount: Math.round(c.amount * 10) / 10,
        percentage: Math.round(percentage * 10) / 10,
        matchedStock: matched,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Copy Summary text
  const handleCopySummary = async () => {
    if (items.length === 0) return;

    const lines: string[] = [
      `🎨 3D-Druck Filament-Kalkulation`,
      `==================================`,
      `Gesamtgewicht: ${formatWeight(totalWeightGrams)}`,
      `Gesamtdruckzeit: ${formatPrintTime(totalPrintTimeMinutes)}`,
      `Druckobjekte: ${totalObjectsCount} (${items.length} verschiedene Modelle)`,
      ``,
      `📊 Farbverteilung & Bedarf:`,
      ...aggregatedColors.map(
        (c) =>
          ` • ${c.name} (${c.material}, ${c.color}): ${c.amount} g (${c.percentage}%) ~ ${(c.amount / 1000).toFixed(2)} Spulen (1kg)`,
      ),
      ``,
      `📦 Enthaltene Modelle:`,
      ...items.map((item) => {
        const p = item.profiles.find((pr) => pr.id === item.selectedProfileId) || item.profiles[0];
        const pWeight = p?.filamentWeights?.reduce((acc, f) => acc + f.amount, 0) || 0;
        return ` • [${item.quantity}x] ${item.title} (${p?.name || "Standard Profil"}) - ${formatWeight(pWeight * item.quantity)}`;
      }),
    ];

    const text = lines.join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Zusammenfassung in die Zwischenablage kopiert!");
    setTimeout(() => setCopied(false), 2500);
  };

  // Open save dialog or prompt login
  const handleOpenSaveDialog = () => {
    if (!isLoggedIn) {
      setSaveDialogOpen(true);
      return;
    }
    // Default name based on models
    const defaultName =
      items.length === 1
        ? `${items[0].title} (${items[0].quantity}x)`
        : `Kalkulation (${items.length} Modelle) vom ${new Date().toLocaleDateString("de-DE")}`;
    setCalcName(defaultName);
    setSaveDialogOpen(true);
  };

  // Save calculation to DB
  const handleSaveCalculation = async () => {
    if (!calcName.trim()) {
      toast.error("Bitte gib einen Namen für die Kalkulation an");
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveCalculationAction({
        name: calcName.trim(),
        items: items.map((it) => ({
          id: it.id,
          url: it.url,
          title: it.title,
          imageUrl: it.imageUrl,
          profiles: it.profiles,
          selectedProfileId: it.selectedProfileId,
          quantity: it.quantity,
        })),
        total_weight_g: totalWeightGrams,
        total_time_mins: totalPrintTimeMinutes,
        colors: aggregatedColors.map((c) => ({
          color: c.color,
          name: c.name,
          material: c.material,
          amount: c.amount,
          percentage: c.percentage,
        })),
      });

      if (res.success && res.calculation) {
        setSavedCalculations((prev) => [res.calculation!, ...prev]);
        setSaveDialogOpen(false);
        toast.success(`Kalkulation "${res.calculation.name}" gespeichert!`);
      } else {
        toast.error(res.error || "Fehler beim Speichern");
      }
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Speichern der Kalkulation");
    } finally {
      setIsSaving(false);
    }
  };

  // Load a saved calculation
  const handleLoadCalculation = (calc: DbSavedCalculation) => {
    if (items.length > 0) {
      if (!confirm(`Möchtest du "${calc.name}" laden? Die aktuelle Liste wird ersetzt.`)) {
        return;
      }
    }

    const loadedItems: CalculatorItem[] = (calc.items || []).map((it) => ({
      id: it.id || crypto.randomUUID(),
      url: it.url,
      title: it.title,
      imageUrl: it.imageUrl,
      profiles: it.profiles || [],
      selectedProfileId: it.selectedProfileId,
      quantity: it.quantity || 1,
    }));

    setItems(loadedItems);
    setSavedListOpen(false);
    toast.success(`"${calc.name}" geladen!`);
  };

  // Delete a saved calculation
  const handleDeleteSavedCalculation = async (calcId: string, name: string) => {
    if (!confirm(`Möchtest du "${name}" wirklich löschen?`)) return;

    try {
      const res = await deleteCalculationAction(calcId);
      if (res.success) {
        setSavedCalculations((prev) => prev.filter((c) => c.id !== calcId));
        toast.success(`"${name}" gelöscht`);
      } else {
        toast.error(res.error || "Konnte nicht gelöscht werden");
      }
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Löschen");
    }
  };

  return (
    <div className="space-y-8">
      {/* Optional Top Navigation (for standalone public page) */}
      {showHomeLink && (
        <div className="flex items-center justify-between pb-4 border-b border-border/40">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Zurück zur Startseite</span>
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard">Zum Dashboard</Link>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Möchtest du Berechnungen speichern?
                </span>
                <LoginModal />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">Filament-Rechner</h1>
            <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
              <Sparkles className="w-3 h-3" />
              Ohne Login nutzbar
            </Badge>
            {isLoggedIn ? (
              <Badge variant="secondary" className="gap-1 border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                Angemeldet: Speichern aktiv
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 text-muted-foreground">
                Gastmodus
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Füge MakerWorld-Links hinzu, um den gesamten Filamentbedarf und die Farbverteilung
            für deine Druckprojekte präzise zu ermitteln.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Saved Calculations Drawer / Dialog Button */}
          {isLoggedIn && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSavedListOpen(true)}
              className="gap-2"
            >
              <FolderOpen className="w-4 h-4 text-primary" />
              <span>Gespeicherte ({savedCalculations.length})</span>
            </Button>
          )}

          {items.length > 0 && (
            <>
              {/* Save Calculation Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenSaveDialog}
                className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
              >
                <Bookmark className="w-4 h-4" />
                <span>Kalkulation speichern</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySummary}
                className="gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>Kopieren</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Leeren</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Input Section */}
      <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ListPlus className="w-4 h-4 text-primary" />
                MakerWorld Modelle hinzufügen
              </CardTitle>
              <CardDescription className="text-xs">
                Füge einen Link mit oder ohne Profil-ID ein (z.B.{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">#profileId-723803</code>)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isBatchMode ? "ghost" : "secondary"}
                size="sm"
                className="text-xs h-7"
                onClick={() => setIsBatchMode(false)}
              >
                Einzelner Link
              </Button>
              <Button
                variant={isBatchMode ? "secondary" : "ghost"}
                size="sm"
                className="text-xs h-7"
                onClick={() => setIsBatchMode(true)}
              >
                Mehrere Links
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!isBatchMode ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="https://makerworld.com/de/models/..."
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isLoading) {
                      handleAddSingle();
                    }
                  }}
                  disabled={isLoading}
                  className="pr-10"
                />
                {inputUrl && (
                  <button
                    type="button"
                    onClick={() => setInputUrl("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
              <Button
                onClick={() => handleAddSingle()}
                disabled={isLoading || !inputUrl.trim()}
                className="gap-2 shrink-0 min-w-[130px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Lade...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Hinzufügen</span>
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea
                placeholder="Füge mehrere MakerWorld-Links ein (ein Link pro Zeile)...&#10;https://makerworld.com/de/models/...&#10;https://makerworld.com/de/models/..."
                rows={4}
                value={batchUrls}
                onChange={(e) => setBatchUrls(e.target.value)}
                disabled={isLoading}
                className="font-mono text-xs"
              />
              <Button
                onClick={handleAddBatch}
                disabled={isLoading || !batchUrls.trim()}
                className="gap-2 w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{loadingText || "Analysiere Links..."}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Alle Links analysieren & hinzufügen</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Quick Example Button */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              💡 Tipp: Enthält dein Link einen Profil-Hash, wird dieses Profil sofort ausgewählt!
            </span>
            <button
              type="button"
              onClick={() => handleAddSingle(EXAMPLE_URL)}
              disabled={isLoading}
              className="text-primary hover:underline font-medium inline-flex items-center gap-1"
            >
              ⭐ Super Mario Stern Beispiellink laden
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Loading Banner */}
      {isLoading && (
        <Card className="border-primary/30 bg-primary/5 animate-pulse">
          <CardContent className="py-4 flex items-center justify-center gap-3 text-sm text-primary">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{loadingText || "Rufe MakerWorld Daten ab..."}</span>
          </CardContent>
        </Card>
      )}

      {/* When Empty */}
      {items.length === 0 && !isLoading && (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="py-16 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <Calculator className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Noch keine Modelle hinzugefügt</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Füge oben einen oder mehrere MakerWorld-Links ein, um den gesamten Filamentbedarf
                aufgeteilt nach Farben zu berechnen – ganz ohne Login.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddSingle(EXAMPLE_URL)}
                className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
              >
                <span>⭐ Mario-Stern Beispiel ausprobieren</span>
              </Button>
              {isLoggedIn && savedCalculations.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSavedListOpen(true)}
                  className="gap-2"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Gespeicherte Kalkulation laden</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* RESULTS DASHBOARD */}
      {items.length > 0 && (
        <div className="space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Filament */}
            <Card className="bg-gradient-to-br from-card to-card/70 border-border/70 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
              <CardHeader className="p-4 pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider flex items-center justify-between">
                  <span>Gesamtfilament</span>
                  <Scale className="w-4 h-4 text-primary" />
                </CardDescription>
                <CardTitle className="text-2xl md:text-3xl font-extrabold text-foreground">
                  {formatWeight(totalWeightGrams)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-muted-foreground">
                  ≈ {(totalWeightGrams / 1000).toFixed(2)} Spulen (1kg)
                </p>
              </CardContent>
            </Card>

            {/* Total Print Time */}
            <Card className="bg-gradient-to-br from-card to-card/70 border-border/70 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
              <CardHeader className="p-4 pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider flex items-center justify-between">
                  <span>Druckzeit</span>
                  <Clock className="w-4 h-4 text-blue-500" />
                </CardDescription>
                <CardTitle className="text-2xl md:text-3xl font-extrabold text-foreground">
                  {formatPrintTime(totalPrintTimeMinutes)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-muted-foreground">
                  Geschätzte Maschinenlaufzeit
                </p>
              </CardContent>
            </Card>

            {/* Total Objects */}
            <Card className="bg-gradient-to-br from-card to-card/70 border-border/70 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
              <CardHeader className="p-4 pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider flex items-center justify-between">
                  <span>Druckobjekte</span>
                  <Layers className="w-4 h-4 text-amber-500" />
                </CardDescription>
                <CardTitle className="text-2xl md:text-3xl font-extrabold text-foreground">
                  {totalObjectsCount}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-muted-foreground">
                  aus {items.length} Modell{items.length === 1 ? "" : "en"}
                </p>
              </CardContent>
            </Card>

            {/* Total Unique Colors */}
            <Card className="bg-gradient-to-br from-card to-card/70 border-border/70 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
              <CardHeader className="p-4 pb-2">
                <CardDescription className="text-xs font-medium uppercase tracking-wider flex items-center justify-between">
                  <span>Farben</span>
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {aggregatedColors.slice(0, 4).map((c, i) => (
                      <div
                        key={i}
                        className="w-3.5 h-3.5 rounded-full border border-background shadow-sm"
                        style={{ backgroundColor: c.color }}
                      />
                    ))}
                  </div>
                </CardDescription>
                <CardTitle className="text-2xl md:text-3xl font-extrabold text-foreground">
                  {aggregatedColors.length}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-muted-foreground">
                  Verschiedene Filamentfarben
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Segmented Color Bar */}
          {aggregatedColors.length > 0 && (
            <Card className="p-4 border-border/60 shadow-sm bg-card/60 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground uppercase tracking-wider">
                  Farbverteilung im Gesamtdruck
                </span>
                <span className="text-muted-foreground">
                  {aggregatedColors.length} Farbe{aggregatedColors.length === 1 ? "" : "n"}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-4 rounded-full overflow-hidden flex bg-muted/50 border border-border/50 shadow-inner">
                {aggregatedColors.map((c, idx) => (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <div
                        style={{
                          width: `${c.percentage}%`,
                          backgroundColor: c.color,
                        }}
                        className="h-full transition-all duration-300 relative group cursor-pointer hover:opacity-90"
                      />
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="font-semibold">{c.name}</span>
                        <span>
                          {c.amount} g ({c.percentage}%)
                        </span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>

              {/* Mini Legend */}
              <div className="flex flex-wrap gap-3 pt-1">
                {aggregatedColors.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs">
                    <div
                      className="w-2.5 h-2.5 rounded-full border border-border"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-muted-foreground">
                      {c.name}:
                    </span>
                    <span className="font-medium text-foreground">
                      {c.amount} g ({c.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Detailed Color Breakdown Table */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span>Detaillierter Filamentbedarf nach Farbe</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  Gesamt: {formatWeight(totalWeightGrams)}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Aufschlüsselung aller benötigten Filamente mit Materialangabe
                {isLoggedIn ? " und Bestandsabgleich aus deinem Inventar." : "."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="text-left py-2 font-medium">Farbe</th>
                      <th className="text-left py-2 font-medium">Material</th>
                      <th className="text-left py-2 font-medium">Farbcode</th>
                      <th className="text-right py-2 font-medium">Benötigt</th>
                      <th className="text-right py-2 font-medium">Anteil</th>
                      <th className="text-right py-2 font-medium">Spulen (1kg)</th>
                      <th className="text-right py-2 font-medium">Lagerbestand</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {aggregatedColors.map((item, idx) => {
                      const stockGrams = item.matchedStock ? item.matchedStock.weight_g : null;
                      const hasEnoughStock =
                        stockGrams !== null ? stockGrams >= item.amount : null;

                      return (
                        <tr key={idx} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-5 h-5 rounded-full border shadow-sm shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="font-medium">{item.name}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant="outline" className="text-xs font-mono">
                              {item.material}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 text-xs font-mono text-muted-foreground">
                            {item.color}
                          </td>
                          <td className="py-3 pr-4 text-right font-semibold">
                            {item.amount} g
                          </td>
                          <td className="py-3 pr-4 text-right text-muted-foreground">
                            {item.percentage}%
                          </td>
                          <td className="py-3 pr-4 text-right text-xs text-muted-foreground font-mono">
                            ≈ {(item.amount / 1000).toFixed(2)}
                          </td>
                          <td className="py-3 text-right">
                            {isLoggedIn ? (
                              item.matchedStock ? (
                                hasEnoughStock ? (
                                  <Badge
                                    variant="outline"
                                    className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10 gap-1 text-xs"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{stockGrams}g vorrätig</span>
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="border-amber-500/40 text-amber-500 bg-amber-500/10 gap-1 text-xs"
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>
                                      Nur {stockGrams}g (fehlen{" "}
                                      {Math.round(item.amount - (stockGrams || 0))}g)
                                    </span>
                                  </Badge>
                                )
                              ) : (
                                <span className="text-xs text-muted-foreground/60 italic">
                                  Nicht erfasst
                                </span>
                              )
                            ) : (
                              <span className="text-xs text-muted-foreground/50">
                                Mit Login abgleichbar
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Model Items List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">
                  Hinzugefügte Modelle ({items.length})
                </h3>
                <p className="text-xs text-muted-foreground">
                  Passe Stückzahlen und Druckprofile nach Belieben an. Die Berechnung aktualisiert sich sofort.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {items.map((item) => {
                const selectedProfile =
                  item.profiles.find((p) => p.id === item.selectedProfileId) ||
                  item.profiles[0];

                const profileWeight =
                  selectedProfile?.filamentWeights?.reduce((acc, f) => acc + f.amount, 0) || 0;
                const totalItemWeight = profileWeight * item.quantity;
                const totalItemTime = (selectedProfile?.printTime || 0) * item.quantity;

                const displayImage = selectedProfile?.cover || item.imageUrl;

                return (
                  <Card
                    key={item.id}
                    className="overflow-hidden border-border/70 hover:border-border transition-all shadow-sm"
                  >
                    <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Thumbnail & Title */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {displayImage ? (
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-muted border shrink-0">
                            <Image
                              src={displayImage}
                              alt={item.title}
                              fill
                              sizes="(max-width: 768px) 64px, 80px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-muted flex items-center justify-center shrink-0 border">
                            <Layers className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-base truncate max-w-md">
                              {item.title}
                            </h4>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 text-xs"
                              title="Auf MakerWorld ansehen"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>

                          {/* Profile Selector */}
                          <div className="flex items-center gap-2 flex-wrap pt-0.5">
                            <span className="text-xs text-muted-foreground">Profil:</span>
                            <Select
                              value={item.selectedProfileId}
                              onValueChange={(val) => handleProfileChange(item.id, val)}
                            >
                              <SelectTrigger className="h-8 text-xs max-w-[280px]">
                                <SelectValue placeholder="Profil auswählen" />
                              </SelectTrigger>
                              <SelectContent>
                                {item.profiles.map((p) => {
                                  const pWeight =
                                    p.filamentWeights?.reduce((acc, f) => acc + f.amount, 0) ||
                                    p.weight ||
                                    0;
                                  return (
                                    <SelectItem key={p.id || p.name} value={p.id || p.name}>
                                      <span className="font-medium">{p.name}</span>
                                      <span className="text-muted-foreground ml-2 text-xs">
                                        ({formatWeight(pWeight)}
                                        {p.printTime ? ` • ${formatPrintTime(p.printTime)}` : ""})
                                      </span>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Filament pills for this model */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {selectedProfile?.filamentWeights?.map((fw, fIdx) => (
                              <div
                                key={fIdx}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-muted/60 border border-border/50"
                              >
                                <div
                                  className="w-2.5 h-2.5 rounded-full border border-background"
                                  style={{ backgroundColor: fw.color }}
                                />
                                <span className="font-medium">
                                  {Math.round(fw.amount * item.quantity)} g
                                </span>
                                <span className="text-muted-foreground text-[10px]">
                                  {getColorName(fw.color)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Quantity & Summary */}
                      <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-border/40">
                        {/* Quantity Counter */}
                        <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg border border-border/50">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-xs"
                            onClick={() => handleQuantityChange(item.id, -1)}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center font-bold text-sm">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-xs"
                            onClick={() => handleQuantityChange(item.id, 1)}
                          >
                            +
                          </Button>
                        </div>

                        {/* Weight and Time Totals for this item */}
                        <div className="text-right min-w-[100px]">
                          <div className="font-bold text-base text-foreground">
                            {formatWeight(totalItemWeight)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatPrintTime(totalItemTime)}
                          </div>
                        </div>

                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 h-8 w-8"
                          title="Modell entfernen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SAVE CALCULATION DIALOG */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          {isLoggedIn ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-primary" />
                  Kalkulation speichern
                </DialogTitle>
                <DialogDescription>
                  Speichere diese Filament-Berechnung in deinem Profil, um sie später jederzeit wieder aufzurufen.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label htmlFor="calc-name" className="text-xs font-medium">
                    Name der Kalkulation
                  </label>
                  <Input
                    id="calc-name"
                    value={calcName}
                    onChange={(e) => setCalcName(e.target.value)}
                    placeholder="z.B. Mario-Stern Großprojekt"
                  />
                </div>
                <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Enthaltene Modelle:</span>
                    <span className="font-medium">{items.length} ({totalObjectsCount} Objekte)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gesamtgewicht:</span>
                    <span className="font-semibold">{formatWeight(totalWeightGrams)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Farben:</span>
                    <span className="font-medium">{aggregatedColors.length} Farben</span>
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setSaveDialogOpen(false)}
                  disabled={isSaving}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleSaveCalculation}
                  disabled={isSaving || !calcName.trim()}
                  className="gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Speichern...</span>
                    </>
                  ) : (
                    <>
                      <BookmarkCheck className="w-4 h-4" />
                      <span>Speichern</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <LogIn className="w-5 h-5 text-primary" />
                  Anmeldung erforderlich
                </DialogTitle>
                <DialogDescription>
                  Um deine Kalkulationen dauerhaft zu speichern und mit deinem Filament-Inventar abzugleichen,
                  musst du angemeldet sein.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                  <Bookmark className="w-6 h-6" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Erstelle ein kostenloses Konto oder melde dich an, um Kalkulationen zu sichern.
                </p>
                <div className="flex justify-center">
                  <LoginModal />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* SAVED CALCULATIONS LIST DIALOG */}
      <Dialog open={savedListOpen} onOpenChange={setSavedListOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              Gespeicherte Kalkulationen ({savedCalculations.length})
            </DialogTitle>
            <DialogDescription>
              Klicke auf eine Kalkulation, um sie direkt in den Rechner zu laden.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {savedCalculations.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Noch keine gespeicherten Kalkulationen vorhanden.
              </div>
            ) : (
              savedCalculations.map((calc) => (
                <div
                  key={calc.id}
                  className="p-3.5 border rounded-lg hover:border-primary/50 transition-all flex items-center justify-between gap-3 bg-card/60"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <h5 className="font-semibold text-sm truncate">{calc.name}</h5>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{new Date(calc.created_at).toLocaleDateString("de-DE")}</span>
                      <span>•</span>
                      <span>{formatWeight(calc.total_weight_g)}</span>
                      <span>•</span>
                      <span>{calc.items?.length || 0} Modell{(calc.items?.length || 0) === 1 ? "" : "e"}</span>
                    </div>
                    {/* Color dots preview */}
                    <div className="flex items-center gap-1 pt-1">
                      {calc.colors?.slice(0, 6).map((c, cIdx) => (
                        <div
                          key={cIdx}
                          className="w-2.5 h-2.5 rounded-full border border-background shadow-xs"
                          style={{ backgroundColor: c.color }}
                          title={`${c.name} (${c.amount}g)`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleLoadCalculation(calc)}
                      className="text-xs h-8"
                    >
                      Laden
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteSavedCalculation(calc.id, calc.name)}
                      className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                      title="Löschen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
