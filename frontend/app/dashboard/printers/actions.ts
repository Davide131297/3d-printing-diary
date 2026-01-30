"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { PRINTER_MODELS } from "@/lib/constants";

export async function addPrinter(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const name = formData.get("name") as string;
  const modelId = formData.get("model") as string;

  const model = PRINTER_MODELS.find((p) => p.id === modelId);
  if (!model) {
    return;
  }

  const { error } = await supabase.from("printers").insert({
    user_id: user.id,
    name: name,
    model: model.name,
    image_url: model.image,
  });

  if (error) {
    console.error(error);
    return;
  }

  revalidatePath("/dashboard/printers");
}

export async function deletePrinter(printerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { error } = await supabase
    .from("printers")
    .delete()
    .eq("id", printerId)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    return;
  }

  revalidatePath("/dashboard/printers");
}
