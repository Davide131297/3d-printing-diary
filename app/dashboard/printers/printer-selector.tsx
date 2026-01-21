"use client";

import { useState } from "react";
import Image from "next/image";
import { PRINTER_MODELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function PrinterSelector() {
  const [selectedId, setSelectedId] = useState<string>("");

  return (
    <div className="space-y-4">
      {/* Hidden input for form submission */}
      <input type="hidden" name="model" value={selectedId} required />

      <div className="grid grid-cols-2 gap-4">
        {PRINTER_MODELS.map((model) => {
          const isSelected = selectedId === model.id;

          return (
            <div
              key={model.id}
              onClick={() => setSelectedId(model.id)}
              className={cn(
                "cursor-pointer relative overflow-hidden rounded-xl border-2 transition-all hover:bg-muted/50",
                isSelected
                  ? "border-foreground bg-muted/50"
                  : "border-border/50 bg-background",
              )}
            >
              <div className="aspect-[4/3] relative w-full bg-muted/20">
                {model.image ? (
                  <Image
                    src={model.image}
                    alt={model.name}
                    fill
                    className="object-contain p-4"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground p-4 text-center">
                    Kein Bild
                  </div>
                )}
              </div>
              <div className="p-3 text-center text-sm font-medium border-t border-border/50">
                {model.name}
              </div>

              {isSelected && (
                <div className="absolute top-2 right-2 bg-foreground text-background rounded-full p-0.5">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
