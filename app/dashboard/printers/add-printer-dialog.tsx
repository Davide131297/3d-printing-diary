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
import { PrinterSelector } from "./printer-selector";
import { addPrinter } from "./actions";

export function AddPrinterDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Drucker hinzufügen</DialogTitle>
          <DialogDescription>
            Füge einen neuen Bambu Lab Drucker hinzu.
          </DialogDescription>
        </DialogHeader>
        <form
          action={async (formData) => {
            await addPrinter(formData);
            setOpen(false);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Mein X1C" required />
          </div>

          <div className="space-y-2">
            <Label>Modell wählen</Label>
            <PrinterSelector />
          </div>

          <Button type="submit" className="w-full">
            Drucker speichern
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
