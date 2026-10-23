import { getCurrentUser } from "@/lib/auth";
import { getFilaments, getProfile } from "@/lib/db";
import { AddFilamentDialog } from "./add-filament-dialog";
import { FilamentList } from "./filament-list";
import { redirect } from "next/navigation";

export default async function FilamentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const [filaments, profile] = await Promise.all([
    getFilaments(user.id),
    getProfile(user.id),
  ]);

  const userCurrency = profile?.currency || "EUR";
  const currencySymbol = userCurrency === "EUR" ? "€" : "$";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Mein Filament-Inventar</h3>
          <p className="text-sm text-muted-foreground">
            Verwalte deine Filamentrollen.
          </p>
        </div>
        <AddFilamentDialog currencySymbol={currencySymbol} />
      </div>

      <FilamentList
        filaments={filaments || []}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}
