import { createClient } from "@/utils/supabase/server";
import { AddFilamentDialog } from "./add-filament-dialog";
import { FilamentList } from "./filament-list";
import { Filament } from "@/types/diary";

export default async function FilamentsPage() {
  const supabase = await createClient();
  const { data: filamentsData } = (await supabase
    .from("filaments")
    .select(
      `
      *,
      print_filaments (
        amount_used_g
      )
    `,
    )
    .order("created_at", { ascending: false })) as {
    data:
      | (Filament & { print_filaments: { amount_used_g: number }[] })[]
      | null;
  };

  const filaments: (Filament & { remaining_g: number })[] = (
    filamentsData || []
  ).map((f) => {
    const used =
      f.print_filaments?.reduce(
        (acc: number, curr: { amount_used_g: number }) =>
          acc + curr.amount_used_g,
        0,
      ) || 0;
    return {
      ...f,
      remaining_g: f.weight_g - used,
    };
  });

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
