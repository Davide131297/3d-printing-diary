import { createClient } from "@/utils/supabase/server";
import { AddPrintDialog } from "./add-print-dialog";
import { PrintList } from "./print-list";
import { Print, Printer, Filament } from "@/types/diary";

export default async function DiaryPage() {
  const supabase = await createClient();

  // Fetch all needed data in parallel-ish
  const { data: printers } = (await supabase.from("printers").select("*")) as {
    data: Printer[] | null;
  };
  const { data: filaments } = (await supabase
    .from("filaments")
    .select("*")) as { data: Filament[] | null };

  // Fetch prints with printers, ordered by newest first
  const { data: prints } = (await supabase
    .from("prints")
    .select(
      `
        *,
        printers (name, model),
        print_filaments (
            amount_used_g,
            filaments (id, name, color, manufacturer, price, weight_g, currency)
        )
    `,
    )
    .order("created_at", { ascending: false })) as { data: Print[] | null };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("currency")
    .eq("id", user?.id)
    .single();

  const userCurrency = profile?.currency || "EUR";
  const currencySymbol = userCurrency === "EUR" ? "€" : "$";

  // Calculate total costs
  let totalCosts = 0;
  prints?.forEach((print) => {
    print.print_filaments?.forEach((pf) => {
      const fil = pf.filaments;
      if (fil) {
        const costPerGram = fil.price / fil.weight_g;
        totalCosts += costPerGram * pf.amount_used_g;
      }
    });
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">Tagebuch</h3>
          <p className="text-sm text-muted-foreground">
            Deine Sammlung gedruckter Modelle.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
            <span className="text-xs text-muted-foreground block uppercase font-bold tracking-wider">
              Gesamtkosten
            </span>
            <span className="text-xl font-bold">
              {totalCosts.toFixed(2)} {currencySymbol}
            </span>
          </div>
          <AddPrintDialog
            printers={printers || []}
            filaments={filaments || []}
          />
        </div>
      </div>

      <PrintList
        prints={prints || []}
        printers={printers || []}
        filaments={filaments || []}
      />
    </div>
  );
}
