import type { SupabaseClient } from "@supabase/supabase-js";
import { Filament } from "@/types/diary";

// Loads the user's filaments with the remaining grams per spool.
// Returns an empty list when nobody is logged in (RLS hides all rows).
export async function getFilamentsWithStock(
  supabase: SupabaseClient,
): Promise<Filament[]> {
  const { data } = (await supabase.from("filaments").select(
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

  return (data || []).map((f) => {
    const used =
      f.print_filaments?.reduce((acc, curr) => acc + curr.amount_used_g, 0) ||
      0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { print_filaments, ...rest } = f;
    return { ...rest, remaining_g: (f.weight_g || 0) - used };
  });
}
