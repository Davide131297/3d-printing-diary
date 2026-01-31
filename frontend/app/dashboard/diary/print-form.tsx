"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createPrint, updatePrint } from "./actions";
import Image from "next/image";
import { Printer, Filament, Print } from "@/types/diary";
import { PrintProfile } from "./scrape";
import { cn } from "@/lib/utils";

interface PrintFormProps {
  printers: Printer[];
  filaments: Filament[];
  onSuccess: () => void;
  initialData?: Print;
}

export function PrintForm({
  printers,
  filaments,
  onSuccess,
  initialData,
}: PrintFormProps) {
  const [makerworldLink, setMakerworldLink] = useState(
    initialData?.makerworld_link || "",
  );
  const [title, setTitle] = useState(initialData?.title || "");
  const [modelName, setModelName] = useState(initialData?.model_name || "");
  const [printTime, setPrintTime] = useState(
    initialData?.print_time_minutes?.toString() || "",
  );
  const [powerConsumption, setPowerConsumption] = useState(
    initialData?.power_consumption_w?.toString() || "",
  );
  const [imageUrl, setImageUrl] = useState(""); // Image URL scraping is only for new ones usually, but could be added
  const [isScraping, setIsScraping] = useState(false);
  const [showScrapePrompt, setShowScrapePrompt] = useState(false);
  const [scrapeError, setScrapeError] = useState(false);
  const [availableProfiles, setAvailableProfiles] = useState<PrintProfile[]>(
    [],
  );
  const [selectedProfileName, setSelectedProfileName] = useState("");

  // Dynamic Filament List State
  const [selectedFilaments, setSelectedFilaments] = useState<
    { id: string; amount: string; key: number }[]
  >(
    initialData?.print_filaments?.map((pf, i) => ({
      id: pf.filaments.id,
      amount: pf.amount_used_g.toString(),
      key: i,
    })) || [{ id: "", amount: "", key: Date.now() }],
  );

  // Check for MakerWorld URL
  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setMakerworldLink(url);
    if (url.includes("makerworld.com") && url.length > 20) {
      setShowScrapePrompt(true);
      setScrapeError(false);
    } else {
      setShowScrapePrompt(false);
      setScrapeError(false);
    }
  };

  const handleScrape = async () => {
    setIsScraping(true);
    setScrapeError(false);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (backendUrl && !backendUrl.includes("localhost")) {
        headers["ngrok-skip-browser-warning"] = "true";
      }

      headers["Authorization"] =
        `Bearer ${process.env.NEXT_PUBLIC_BACKEND_TOKEN}`;

      const res = await fetch(`${backendUrl}/scrape`, {
        method: "POST",
        headers,
        body: JSON.stringify({ url: makerworldLink }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (data.title) setTitle(data.title);
          if (data.modelName) setModelName(data.modelName);
          if (data.printTime) setPrintTime(data.printTime.toString());
          if (data.imageUrl) setImageUrl(data.imageUrl);

          if (data.profiles && data.profiles.length > 0) {
            setAvailableProfiles(data.profiles);
          }
          setShowScrapePrompt(false);
        }
      } else {
        setScrapeError(true);
      }
    } catch (error) {
      console.error("Error scraping MakerWorld:", error);
      setScrapeError(true);
    } finally {
      setIsScraping(false);
    }
  };

  const handleProfileSelect = (name: string) => {
    setSelectedProfileName(name);
    const profile = availableProfiles.find((p) => p.name === name);
    if (profile) {
      if (profile.printTime) {
        setPrintTime(profile.printTime.toString());
      }
      if (profile.filamentWeights && profile.filamentWeights.length > 0) {
        // Map weights to rows
        const newRows = profile.filamentWeights.map((fw, i) => {
          // Try to find a matching filament by color (simple check)
          // Scraper returns raw color string (e.g. css value). Database usually has hex.
          // We won't implement complex color matching yet, but we will fix the amount bug.
          const matchingFilament = filaments.find(
            (f) =>
              f.color &&
              fw.color &&
              (f.color.toLowerCase() === fw.color.toLowerCase() ||
                fw.color.includes(f.color)),
          );

          return {
            id: matchingFilament ? matchingFilament.id : "",
            amount: fw.amount.toString(),
            key: Date.now() + i,
          };
        });
        setSelectedFilaments(newRows);
      }
    }
  };

  const addFilamentRow = () => {
    setSelectedFilaments([
      ...selectedFilaments,
      { id: "", amount: "", key: Date.now() },
    ]);
  };

  const removeFilamentRow = (index: number) => {
    if (selectedFilaments.length > 1) {
      const newFilaments = [...selectedFilaments];
      newFilaments.splice(index, 1);
      setSelectedFilaments(newFilaments);
    }
  };

  const updateFilamentRow = (
    index: number,
    field: "id" | "amount",
    value: string,
  ) => {
    const newFilaments = [...selectedFilaments];
    newFilaments[index] = { ...newFilaments[index], [field]: value };
    setSelectedFilaments(newFilaments);
  };

  return (
    <form
      action={async (formData) => {
        formData.set("filaments_json", JSON.stringify(selectedFilaments));
        if (initialData) {
          await updatePrint(initialData.id, formData);
        } else {
          await createPrint(formData);
        }
        onSuccess();
      }}
      className="space-y-6"
    >
      <div className="space-y-2 p-4 border rounded-lg bg-muted/10">
        <Label htmlFor="makerworld_link">MakerWorld Link</Label>
        <div className="flex gap-2">
          <Input
            id="makerworld_link"
            name="makerworld_link"
            placeholder="https://makerworld.com/..."
            value={makerworldLink}
            onChange={handleLinkChange}
          />
        </div>
        {showScrapePrompt && (
          <div className="flex items-center gap-4 bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-sm text-blue-600 dark:text-blue-400 animate-in fade-in slide-in-from-top-1">
            <span>Daten übernehmen?</span>
            <Button
              type="button"
              size="sm"
              onClick={handleScrape}
              disabled={isScraping || scrapeError}
              className={cn(
                isScraping || scrapeError
                  ? "cursor-not-allowed"
                  : "cursor-pointer",
              )}
            >
              {isScraping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Daten werden abgerufen...
                </>
              ) : (
                "Ja, abrufen"
              )}
            </Button>
          </div>
        )}
        {scrapeError && (
          <Alert variant="destructive" className="mt-2">
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>
              Die Funktion ist aktuell deaktiviert. Bitte versuche es später
              noch einmal.
            </AlertDescription>
          </Alert>
        )}
        {imageUrl && (
          <div className="relative mx-auto mt-2 aspect-square w-full max-w-[300px] rounded-md overflow-hidden bg-muted">
            <Image src={imageUrl} alt="Preview" fill className="object-cover" />
            <input type="hidden" name="image_url" value={imageUrl} />
          </div>
        )}
      </div>

      {availableProfiles.length > 0 && (
        <div className="space-y-2 p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <Label
            htmlFor="profile_select"
            className="text-blue-700 dark:text-blue-300"
          >
            Gefundene MakerWorld Profile
          </Label>
          <Select
            value={selectedProfileName}
            onValueChange={handleProfileSelect}
          >
            <SelectTrigger
              id="profile_select"
              className="bg-white dark:bg-slate-950"
            >
              <SelectValue placeholder="Profil wählen..." />
            </SelectTrigger>
            <SelectContent>
              {availableProfiles.map((p, idx) => (
                <SelectItem key={idx} value={p.name}>
                  {p.name}{" "}
                  {p.printTime
                    ? `(${Math.round((p.printTime / 60) * 10) / 10} h)`
                    : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Wähle ein Profil, um die Druckzeit automatisch zu übernehmen.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Titel</Label>
        <Input
          id="title"
          name="title"
          placeholder="z.B. Benchy Boot"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="model_name">Modell Name</Label>
          <Input
            id="model_name"
            name="model_name"
            placeholder="3D Benchy"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="printer_id">Drucker</Label>
        <Select
          name="printer_id"
          defaultValue={
            initialData?.printer_id ||
            (printers.length === 1 ? printers[0].id : undefined)
          }
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Drucker wählen" />
          </SelectTrigger>
          <SelectContent>
            {printers?.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} ({p.model})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3 border p-4 rounded-md bg-muted/20">
        <div className="flex items-center justify-between">
          <Label>Verwendete Filamente</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addFilamentRow}
          >
            <Plus className="mr-2 h-3 w-3" /> Filament
          </Button>
        </div>

        {selectedFilaments.map((row, index) => (
          <div
            key={row.key}
            className="grid grid-cols-[1fr_80px_auto] gap-2 items-end"
          >
            <div className="space-y-1">
              {index === 0 && <Label className="text-xs">Filament</Label>}
              <Select
                value={row.id}
                onValueChange={(val) => updateFilamentRow(index, "id", val)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {filaments?.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: f.color }}
                        />
                        {f.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              {index === 0 && <Label className="text-xs">Menge (g)</Label>}
              <Input
                type="number"
                placeholder="0"
                required
                value={row.amount}
                onChange={(e) =>
                  updateFilamentRow(index, "amount", e.target.value)
                }
              />
            </div>
            <div className="pb-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFilamentRow(index)}
                disabled={selectedFilaments.length === 1}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="print_time">Druckzeit (Minuten)</Label>
          <Input
            id="print_time"
            name="print_time"
            type="number"
            placeholder="60"
            value={printTime}
            onChange={(e) => setPrintTime(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="power_consumption_w">Stromverbrauch (Wh)</Label>
          <Input
            id="power_consumption_w"
            name="power_consumption_w"
            type="number"
            placeholder="z.B. 230"
            value={powerConsumption}
            onChange={(e) => setPowerConsumption(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        {initialData ? "Änderungen speichern" : "Eintrag speichern"}
      </Button>
    </form>
  );
}
