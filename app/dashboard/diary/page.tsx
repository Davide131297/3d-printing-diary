import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

export default async function DiaryPage() {
  const supabase = await createClient();
  // Fetch prints with printers, ordered by newest first
  const { data: prints } = await supabase
    .from("prints")
    .select(
      `
        *,
        printers (name, model),
        print_filaments (
            amount_used_g,
            filaments (name, color, manufacturer, price, weight_g, currency)
        )
    `,
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Tagebuch</h3>
          <p className="text-sm text-muted-foreground">
            Deine Sammlung gedruckter Modelle.
          </p>
        </div>
        <Link href="/dashboard/diary/new">
          <Button>Neuer Eintrag</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {prints?.map((print: any) => {
          // Calculate costs
          let totalCost = 0;
          let currency = "EUR";

          if (print.print_filaments) {
            print.print_filaments.forEach((pf: any) => {
              const fil = pf.filaments;
              if (fil) {
                const costPerGram = fil.price / fil.weight_g;
                totalCost += costPerGram * pf.amount_used_g;
                currency = fil.currency;
              }
            });
          }

          return (
            <Card key={print.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="line-clamp-1">{print.title}</CardTitle>
                <CardDescription>{print.model_name}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="flex items-center text-sm text-muted-foreground gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(print.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {print.print_time_minutes} min
                  </span>
                </div>

                <div className="text-sm bg-muted/50 p-2 rounded">
                  <p className="font-semibold">
                    {print.printers?.name} ({print.printers?.model})
                  </p>
                  {print.print_filaments?.map((pf: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 mt-1">
                      <div
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: pf.filaments?.color }}
                      />
                      <span>
                        {pf.filaments?.name} - {pf.amount_used_g}g
                      </span>
                    </div>
                  ))}
                </div>

                {print.makerworld_link && (
                  <a
                    href={print.makerworld_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline break-all"
                  >
                    MakerWorld Link
                  </a>
                )}
              </CardContent>
              <CardFooter className="bg-muted/10 mt-auto border-t pt-4">
                <div className="font-medium">
                  Kosten: {totalCost.toFixed(2)}{" "}
                  {currency === "EUR" ? "€" : "$"}
                </div>
              </CardFooter>
            </Card>
          );
        })}

        {prints?.length === 0 && (
          <div className="text-muted-foreground col-span-full text-center py-12">
            Noch keine Einträge. Starte deinen ersten Druck!
          </div>
        )}
      </div>
    </div>
  );
}
