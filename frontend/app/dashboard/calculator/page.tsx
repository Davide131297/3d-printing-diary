import { createClient } from "@/utils/supabase/server";
import { getFilamentsWithStock } from "@/lib/filament-stock";
import { FilamentCalculator } from "./filament-calculator";

export default async function CalculatorPage() {
  const supabase = await createClient();
  const filaments = await getFilamentsWithStock(supabase);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">Filament-Rechner</h3>
        <p className="text-sm text-muted-foreground">
          Füge MakerWorld-Links hinzu und sieh, wie viel Filament du insgesamt
          brauchst – aufgeteilt nach Farbe.
        </p>
      </div>
      <FilamentCalculator filaments={filaments} showStock />
    </div>
  );
}
