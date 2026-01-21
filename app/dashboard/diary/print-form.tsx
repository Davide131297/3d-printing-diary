"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { createPrint, updatePrint } from "./actions";
import { scrapeMakerWorld } from "./scrape";
import Image from "next/image";
import { Printer, Filament, Print } from "@/types/diary";

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
  const [imageUrl, setImageUrl] = useState(""); // Image URL scraping is only for new ones usually, but could be added
  const [isScraping, setIsScraping] = useState(false);
  const [showScrapePrompt, setShowScrapePrompt] = useState(false);

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
    } else {
      setShowScrapePrompt(false);
    }
  };

  const handleScrape = async () => {
    setIsScraping(true);
    try {
      const data = await scrapeMakerWorld(makerworldLink);
      if (data) {
        if (data.title) setTitle(data.title);
        if (data.modelName) setModelName(data.modelName);
        if (data.printTime) setPrintTime(data.printTime.toString());
        if (data.imageUrl) setImageUrl(data.imageUrl);
        setShowScrapePrompt(false);
      }
    } catch (err) {
      console.error("Failed to scrape", err);
    } finally {
      setIsScraping(false);
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
            <span>Modell gefunden! Daten übernehmen?</span>
            <Button
              type="button"
              size="sm"
              onClick={handleScrape}
              disabled={isScraping}
            >
              {isScraping ? "Lade..." : "Ja, abrufen"}
            </Button>
          </div>
        )}
        {imageUrl && (
          <div className="relative mx-auto mt-2 aspect-square w-full max-w-[300px] rounded-md overflow-hidden bg-muted">
            <Image src={imageUrl} alt="Preview" fill className="object-cover" />
            <input type="hidden" name="image_url" value={imageUrl} />
          </div>
        )}
      </div>

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
          defaultValue={initialData?.printer_id}
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

      <Button type="submit" className="w-full">
        {initialData ? "Änderungen speichern" : "Eintrag speichern"}
      </Button>
    </form>
  );
}
