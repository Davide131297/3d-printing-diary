"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { addFilament } from "./actions";

interface AddFilamentDialogProps {
  currencySymbol: string;
}

export function AddFilamentDialog({ currencySymbol }: AddFilamentDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Neu
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filament hinzufügen</DialogTitle>
          <DialogDescription>
            Neue Rolle im Inventar erfassen.
          </DialogDescription>
        </DialogHeader>
        <form
          action={async (formData) => {
            await addFilament(formData);
            setOpen(false);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Basic PLA" required />
            </div>
            <div className="space-y-2">
              <Label>Hersteller</Label>
              <ManufacturerCombobox />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Select name="material" required>
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
                <ColorPicker name="color" defaultValue="#000000" />
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
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Gewicht (g)</Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  defaultValue="1000"
                  required
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full">
            Hinzufügen
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
