"use client";

import { useState } from "react";
import { LayoutGrid, TableProperties } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Filament } from "@/types/diary";
import { FilamentCard } from "./filament-card";
import { FilamentTable } from "./filament-table";

interface FilamentListProps {
  filaments: Filament[];
  currencySymbol: string;
}

export function FilamentList({ filaments, currencySymbol }: FilamentListProps) {
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
        <FilamentTable filaments={filaments} currencySymbol={currencySymbol} />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filaments.map((filament) => (
            <FilamentCard
              key={filament.id}
              filament={filament}
              currencySymbol={currencySymbol}
            />
          ))}
          {filaments.length === 0 && (
            <div className="text-muted-foreground col-span-full text-center py-12">
              Noch kein Filament im Inventar.
            </div>
          )}
        </div>
      )}

      {viewMode === "table" && filaments.length === 0 && (
        <div className="text-muted-foreground text-center py-12 bg-card rounded-md border">
          Noch kein Filament im Inventar.
        </div>
      )}
    </div>
  );
}
