"use client";

import { deleteFilament } from "./actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteFilamentButton({ id }: { id: string }) {
  return (
    <Button
      variant="destructive"
      size="icon"
      onClick={async () => await deleteFilament(id)}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
