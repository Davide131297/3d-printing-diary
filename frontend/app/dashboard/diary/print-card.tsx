"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Clock, MoreVertical, Pencil, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Print, Printer, Filament } from "@/types/diary";
import { deletePrint } from "./actions";
import { PrintForm } from "./print-form";
import Image from "next/image";

interface PrintCardProps {
  print: Print;
  printers: Printer[];
  filaments: Filament[];
  electricityPrice: number | null;
}

export function PrintCard({
  print,
  printers,
  filaments,
  electricityPrice,
}: PrintCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate costs
  let totalCost = 0;
  let currency = "EUR";

  if (print.print_filaments) {
    print.print_filaments.forEach((pf) => {
      const fil = pf.filaments;
      if (fil) {
        const costPerGram = fil.price / fil.weight_g;
        totalCost += costPerGram * pf.amount_used_g;
        currency = fil.currency;
      }
    });
  }

  // Calculate Electricity Cost
  if (print.power_consumption_w && electricityPrice) {
    const kwh = print.power_consumption_w / 1000;
    const electricityCost = kwh * (electricityPrice / 100); // price is in ct/kWh, convert to currency unit (Euro/Dollar)
    totalCost += electricityCost;
  }

  const handleDelete = async () => {
    if (confirm("Möchtest du diesen Eintrag wirklich löschen?")) {
      setIsDeleting(true);
      await deletePrint(print.id);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card
        className={`flex flex-col ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
      >
        <CardHeader className="relative pr-12">
          <CardTitle className="line-clamp-1">{print.title}</CardTitle>
          <CardDescription>{print.model_name}</CardDescription>

          <div className="absolute right-4 top-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" /> Bearbeiten
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" /> Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <div className="flex items-center text-sm text-muted-foreground gap-4">
            <span className="flex items-center gap-1" suppressHydrationWarning>
              <Calendar className="w-4 h-4" />
              {new Date(print.created_at).toLocaleDateString("de-DE")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {print.print_time_minutes} min
            </span>
            {print.power_consumption_w && electricityPrice && (
              <span className="flex items-center gap-1 text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/20">
                ⚡{" "}
                {(
                  (print.power_consumption_w / 1000) *
                  (electricityPrice / 100)
                ).toFixed(2)}{" "}
                {currency === "EUR" ? "€" : "$"}
              </span>
            )}
          </div>

          <div className="text-sm bg-muted/50 p-2 rounded">
            <p className="font-semibold">
              {print.printers?.name} ({print.printers?.model})
            </p>
            {print.print_filaments?.map((pf, i) => (
              <div key={i} className="flex items-center gap-2 mt-1">
                <div
                  className="w-3 h-3 rounded-full border border-white"
                  style={{ backgroundColor: pf.filaments?.color }}
                />
                <span>
                  {pf.filaments?.name} - {pf.amount_used_g}g
                </span>
              </div>
            ))}
          </div>

          {print.image_url && (
            <div className="relative aspect-video w-full overflow-hidden rounded-md border mt-4">
              <Image
                src={print.image_url}
                alt={print.title}
                fill
                className="object-cover transition-all hover:scale-105"
              />
            </div>
          )}

          {print.makerworld_link && (
            <a
              href={print.makerworld_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline break-all mt-2 block"
            >
              MakerWorld Link
            </a>
          )}
        </CardContent>
        <CardFooter className="bg-muted/10 mt-auto border-t pt-4">
          <div className="font-medium">
            Kosten: {totalCost.toFixed(2)} {currency === "EUR" ? "€" : "$"}
          </div>
        </CardFooter>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Eintrag bearbeiten</DialogTitle>
            <DialogDescription>
              Pass die Details deines Drucks an.
            </DialogDescription>
          </DialogHeader>
          <PrintForm
            printers={printers}
            filaments={filaments}
            initialData={print}
            onSuccess={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
