import { createClient } from "@/utils/supabase/server";
import { Filament } from "@/types/diary";
import { FilamentCalculator } from "./filament-calculator";

export default async function CalculatorPage() {
  const supabase = await createClient();
  const { data: filamentsData } = (await supabase.from("filaments").select(
    `
      *,
      print_filaments (
        amount_used_g
      )
    `,
  )) as {
    data:
      | (Filament & { print_filaments: { amount_used_g: number }[] })[]
      | null;
  };

  // Remaining stock per spool, so the calculator can show if enough is left
  const filaments: Filament[] = (filamentsData || []).map((f) => {
    const used =
      f.print_filaments?.reduce((acc, curr) => acc + curr.amount_used_g, 0) ||
      0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { print_filaments, ...rest } = f;
    return { ...rest, remaining_g: (f.weight_g || 0) - used };
  });

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">Filament-Rechner</h3>
        <p className="text-sm text-muted-foreground">
          Füge MakerWorld-Links hinzu und sieh, wie viel Filament du insgesamt
          brauchst – aufgeteilt nach Farbe.
        </p>
      </div>
      <FilamentCalculator filaments={filaments} />
    </div>
  );
}
