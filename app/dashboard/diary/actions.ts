"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPrint(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const title = formData.get("title") as string;
  const modelName = formData.get("model_name") as string;
  const makerworldLink = formData.get("makerworld_link") as string;
  const printerId = formData.get("printer_id") as string;
  const printTime = parseInt(formData.get("print_time") as string);

  // Filament handling is tricky with basic FormData forms if dynamic.
  // For MVP, we will assume one filament or handle it via a separate client-side composition if needed.
  // BUT, to keep it simple, we'll start with just the main print details and maybe ONE filament selection for now
  // or use a JSON string field if we do a complex form.
  // Let's rely on standard fields first. We'll handle multiple filaments in a V2 or careful JS.
  // actually, let's use a workaround: The form will likely send 'filament_id' and 'amount'

  // 1. Create Print
  const { data: print, error: printError } = await supabase
    .from("prints")
    .insert({
      user_id: user.id,
      title,
      model_name: modelName,
      makerworld_link: makerworldLink,
      printer_id: printerId,
      print_time_minutes: printTime,

      status: "completed",
    })
    .select()
    .single();

  if (printError) {
    console.error("Print creation error", printError);
    return;
  }

  // 2. Link Filaments
  const filamentsJson = formData.get("filaments_json") as string;
  if (filamentsJson && print) {
    try {
      const filaments = JSON.parse(filamentsJson) as {
        id: string;
        amount: string;
      }[];

      const filamentInserts = filaments
        .filter((f) => f.id && f.amount)
        .map((f) => ({
          print_id: print.id,
          filament_id: f.id,
          amount_used_g: parseInt(f.amount),
        }));

      if (filamentInserts.length > 0) {
        const { error: filError } = await supabase
          .from("print_filaments")
          .insert(filamentInserts);
        if (filError) console.error("Filament link error", filError);
      }
    } catch (e) {
      console.error("Error parsing filaments JSON", e);
    }
  }

  revalidatePath("/dashboard/diary");
  revalidatePath("/dashboard/diary");
}
