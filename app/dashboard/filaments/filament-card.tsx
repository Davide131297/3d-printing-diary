"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MoreVertical, Pencil, Trash } from "lucide-react";
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
import { Filament } from "@/types/diary";
import { deleteFilament } from "./actions";
import { FilamentForm } from "./filament-form";

interface FilamentCardProps {
  filament: Filament;
  currencySymbol: string;
}

export function FilamentCard({ filament, currencySymbol }: FilamentCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm("Möchtest du dieses Filament wirklich löschen?")) {
      setIsDeleting(true);
      await deleteFilament(filament.id);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card
        className={`flex flex-col ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
      >
        <CardHeader className="relative pr-12">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: filament.color }}
                />
                {filament.name}
              </CardTitle>
              <CardDescription>
                {filament.manufacturer} - {filament.material}
              </CardDescription>
            </div>
          </div>

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
          <div className="flex items-end justify-between">
            <div className="text-2xl font-bold">
              {filament.price.toFixed(2)}{" "}
              {filament.currency === "EUR" ? "€" : "$"}
            </div>
            <div className="text-right">
              <span
                className={`text-sm font-bold ${filament.remaining_g !== undefined && filament.remaining_g < 100 ? "text-red-500" : ""}`}
              >
                {filament.remaining_g?.toFixed(0)}g
              </span>
              <span className="text-xs text-muted-foreground block">
                verbleibend
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  filament.remaining_g !== undefined &&
                  filament.remaining_g < 100
                    ? "bg-red-500"
                    : "bg-primary"
                }`}
                style={{
                  width: `${Math.max(0, Math.min(100, ((filament.remaining_g || 0) / filament.weight_g) * 100))}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground text-right">
              von ursprünglich {filament.weight_g}g
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Filament bearbeiten</DialogTitle>
            <DialogDescription>
              Pass die Details deiner Filamentrolle an.
            </DialogDescription>
          </DialogHeader>
          <FilamentForm
            currencySymbol={currencySymbol}
            initialData={filament}
            onSuccess={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
