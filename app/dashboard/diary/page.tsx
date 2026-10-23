import { getCurrentUser } from "@/lib/auth";
import { getPrinters, getFilaments, getPrints, getProfile } from "@/lib/db";
import { AddPrintDialog } from "./add-print-dialog";
import { PrintList } from "./print-list";
import { redirect } from "next/navigation";

export default async function DiaryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  // Fetch all needed data in parallel
  const [printers, filaments, prints, profile] = await Promise.all([
    getPrinters(user.id),
    getFilaments(user.id),
    getPrints(user.id),
    getProfile(user.id),
  ]);

  const userCurrency = profile?.currency || "EUR";
  const electricityPrice = profile?.price_ct_kwh || null;
  const currencySymbol = userCurrency === "EUR" ? "€" : "$";

  // Calculate total costs
  let totalCosts = 0;
  prints?.forEach((print) => {
    print.print_filaments?.forEach((pf) => {
      const fil = pf.filaments;
      if (fil && fil.weight_g > 0) {
        const costPerGram = fil.price / fil.weight_g;
        totalCosts += costPerGram * pf.amount_used_g;
      }
    });

    if (print.power_consumption_w && electricityPrice) {
      const kwh = print.power_consumption_w / 1000;
      const electricityCost = kwh * (electricityPrice / 100);
      totalCosts += electricityCost;
    }
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
        electricityPrice={electricityPrice}
      />
    </div>
  );
}
