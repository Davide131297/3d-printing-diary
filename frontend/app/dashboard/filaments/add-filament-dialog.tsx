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
import { FilamentForm } from "./filament-form";

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
        <FilamentForm
          currencySymbol={currencySymbol}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
