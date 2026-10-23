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
import { PrintForm } from "./print-form";
import { Printer, Filament } from "@/types/diary";

interface AddPrintDialogProps {
  printers: Printer[];
  filaments: Filament[];
}

export function AddPrintDialog({ printers, filaments }: AddPrintDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Neu
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Neuer Tagebuch-Eintrag</DialogTitle>
          <DialogDescription>
            Dokumentiere einen fertiggestellten Druck.
          </DialogDescription>
        </DialogHeader>
        <PrintForm
          printers={printers}
          filaments={filaments}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
