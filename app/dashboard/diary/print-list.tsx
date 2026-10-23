"use client";

import { useState } from "react";
import { LayoutGrid, TableProperties } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Print, Printer, Filament } from "@/types/diary";
import { PrintCard } from "./print-card";
import { PrintTable } from "./print-table";

interface PrintListProps {
  prints: Print[];
  printers: Printer[];
  filaments: Filament[];
  electricityPrice: number | null;
}

export function PrintList({
  prints,
  printers,
  filaments,
  electricityPrice,
}: PrintListProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  return (
    <div className="space-y-4">
      <div className="flex justify-end bg-muted/30 p-1 rounded-lg w-fit ml-auto border">
        <Button
          variant={viewMode === "table" ? "secondary" : "ghost"}
          size="sm"
          className="h-8 gap-2"
          onClick={() => setViewMode("table")}
        >
          <TableProperties className="h-4 w-4" />
          <span>Tabelle</span>
        </Button>
        <Button
          variant={viewMode === "grid" ? "secondary" : "ghost"}
          size="sm"
          className="h-8 gap-2"
          onClick={() => setViewMode("grid")}
        >
          <LayoutGrid className="h-4 w-4" />
          <span>Karten</span>
        </Button>
      </div>

      {viewMode === "table" ? (
        <PrintTable
          prints={prints}
          printers={printers}
          filaments={filaments}
          electricityPrice={electricityPrice}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {prints.map((print) => (
            <PrintCard
              key={print.id}
              print={print}
              printers={printers}
              filaments={filaments}
              electricityPrice={electricityPrice}
            />
          ))}
          {prints.length === 0 && (
            <div className="text-muted-foreground col-span-full text-center py-12">
              Noch keine Einträge. Starte deinen ersten Druck!
            </div>
          )}
        </div>
      )}

      {viewMode === "table" && prints.length === 0 && (
        <div className="text-muted-foreground text-center py-12 bg-card rounded-md border">
          Noch keine Einträge. Starte deinen ersten Druck!
        </div>
      )}
    </div>
  );
}
