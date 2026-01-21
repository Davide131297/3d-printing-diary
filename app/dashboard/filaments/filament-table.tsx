"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import { MoreVertical, Pencil, Trash } from "lucide-react";
import { Filament } from "@/types/diary";
import { useState } from "react";
import { deleteFilament } from "./actions";
import { FilamentForm } from "./filament-form";

interface FilamentTableProps {
  filaments: Filament[];
  currencySymbol: string;
}

export function FilamentTable({
  filaments,
  currencySymbol,
}: FilamentTableProps) {
  const [editingFilament, setEditingFilament] = useState<Filament | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm("Möchtest du dieses Filament wirklich löschen?")) {
      await deleteFilament(id);
    }
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">Farbe</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Hersteller</TableHead>
            <TableHead>Material</TableHead>
            <TableHead>Preis</TableHead>
            <TableHead>Startgewicht</TableHead>
            <TableHead>Verbleibend</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filaments.map((filament) => (
            <TableRow key={filament.id}>
              <TableCell>
                <div
                  className="w-4 h-4 rounded-full border border-white"
                  style={{ backgroundColor: filament.color }}
                />
              </TableCell>
              <TableCell className="font-medium">{filament.name}</TableCell>
              <TableCell>{filament.manufacturer}</TableCell>
              <TableCell>
                <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-medium">
                  {filament.material}
                </span>
              </TableCell>
              <TableCell>
                {filament.price.toFixed(2)}{" "}
                {filament.currency === "EUR" ? "€" : "$"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {filament.weight_g}g
              </TableCell>
              <TableCell className="font-semibold">
                <span
                  className={
                    filament.remaining_g !== undefined &&
                    filament.remaining_g < 100
                      ? "text-red-500"
                      : ""
                  }
                >
                  {filament.remaining_g?.toFixed(0) || "0"}g
                </span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setEditingFilament(filament)}
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Bearbeiten
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(filament.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash className="mr-2 h-4 w-4" /> Löschen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={!!editingFilament}
        onOpenChange={(open) => !open && setEditingFilament(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Filament bearbeiten</DialogTitle>
            <DialogDescription>
              Pass die Details deiner Filamentrolle an.
            </DialogDescription>
          </DialogHeader>
          {editingFilament && (
            <FilamentForm
              currencySymbol={currencySymbol}
              initialData={editingFilament}
              onSuccess={() => setEditingFilament(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
