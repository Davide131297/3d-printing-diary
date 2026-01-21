"use client";

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
import { ManufacturerCombobox } from "./manufacturer-combobox";
import { ColorPicker } from "./color-picker";
import { addFilament, editFilament } from "./actions";
import { Filament } from "@/types/diary";

interface FilamentFormProps {
  currencySymbol: string;
  initialData?: Filament;
  onSuccess?: () => void;
}

export function FilamentForm({
  currencySymbol,
  initialData,
  onSuccess,
}: FilamentFormProps) {
  return (
    <form
      action={async (formData) => {
        if (initialData) {
          await editFilament(initialData.id, formData);
        } else {
          await addFilament(formData);
        }
        onSuccess?.();
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Basic PLA"
            defaultValue={initialData?.name}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Hersteller</Label>
          <ManufacturerCombobox defaultValue={initialData?.manufacturer} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="material">Material</Label>
            <Select
              name="material"
              defaultValue={initialData?.material}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLA">PLA</SelectItem>
                <SelectItem value="PETG">PETG</SelectItem>
                <SelectItem value="ABS">ABS</SelectItem>
                <SelectItem value="ASA">ASA</SelectItem>
                <SelectItem value="TPU">TPU</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Farbe</Label>
            <ColorPicker
              name="color"
              defaultValue={initialData?.color || "#000000"}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Preis ({currencySymbol})</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              placeholder="19.99"
              defaultValue={initialData?.price}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight">Gewicht (g)</Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              defaultValue={initialData?.weight_g || "1000"}
              required
            />
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full">
        {initialData ? "Speichern" : "Hinzufügen"}
      </Button>
    </form>
  );
}
