"use client";

import { deletePrinter } from "./actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeletePrinterButton({ id }: { id: string }) {
  return (
    <Button
      variant="destructive"
      size="icon"
      onClick={async () => await deletePrinter(id)}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
