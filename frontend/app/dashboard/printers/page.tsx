import { createClient } from "@/utils/supabase/server";
import { DeletePrinterButton } from "./delete-button";
import { AddPrinterDialog } from "./add-printer-dialog";

import { Card } from "@/components/ui/card";
import Image from "next/image";

export default async function PrintersPage() {
  const supabase = await createClient();

  // Safe fetch for printers
  const { data: printers } = await supabase.from("printers").select("*");

  // Handle empty state explicitly
  const safePrinters = printers || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">Meine Drucker</h3>
          <p className="text-sm text-muted-foreground">
            Verwalte deine 3D Drucker.
          </p>
        </div>
        <AddPrinterDialog />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* List existing printers */}
        {safePrinters.map((printer) => (
          <Card
            key={printer.id}
            className="group overflow-hidden transition-all hover:shadow-lg border-muted/60"
          >
            <div className="relative h-48 w-full bg-secondary/10 dark:bg-secondary/5">
              {printer.image_url ? (
                <div className="relative h-full w-full p-6">
                  <Image
                    src={printer.image_url}
                    alt={printer.model}
                    fill
                    className="object-contain transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Kein Bild
                </div>
              )}
            </div>
            <div className="flex flex-row items-start justify-between p-4 gap-4">
              <div className="space-y-1">
                <h4 className="font-semibold leading-none tracking-tight">
                  {printer.name}
                </h4>
                <p className="text-sm text-muted-foreground">{printer.model}</p>
              </div>
              <DeletePrinterButton id={printer.id} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
