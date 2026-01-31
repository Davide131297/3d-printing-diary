"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { SupabaseClient } from "@supabase/supabase-js";

async function linkFilaments(
  supabase: SupabaseClient,
  printId: string,
  filamentsJson: string,
) {
  if (!filamentsJson) return;

  try {
    const filaments = JSON.parse(filamentsJson) as {
      id: string;
      amount: string;
    }[];

    // First delete existing links for update
    const { error: delError } = await supabase
      .from("print_filaments")
      .delete()
      .eq("print_id", printId);

    if (delError) {
      console.error("Error deleting old filaments:", delError);
    }

    const filamentInserts = filaments
      .filter((f) => f.id && f.amount)
      .map((f) => ({
        print_id: printId,
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
    console.error("Error parsing/linking filaments JSON", e);
  }
}

export async function createPrint(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const title = formData.get("title") as string;
  const modelName = formData.get("model_name") as string;
  const makerworldLink = formData.get("makerworld_link") as string;
  const printerId = formData.get("printer_id") as string;
  const printTime = parseInt(formData.get("print_time") as string);

  const powerConsumption = formData.get("power_consumption_w")
    ? parseInt(formData.get("power_consumption_w") as string)
    : null;
  const imageUrl = formData.get("image_url") as string;

  const { data: print, error: printError } = await supabase
    .from("prints")
    .insert({
      user_id: user.id,
      title,
      model_name: modelName,
      makerworld_link: makerworldLink,
      printer_id: printerId,
      print_time_minutes: printTime,
      power_consumption_w: powerConsumption,
      image_url: imageUrl,
      status: "completed",
    })
    .select()
    .single();

  if (printError) {
    console.error("Print creation error", printError);
    return;
  }

  await linkFilaments(
    supabase,
    print.id,
    formData.get("filaments_json") as string,
  );

  revalidatePath("/dashboard/diary");
}

export async function updatePrint(printId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const title = formData.get("title") as string;
  const modelName = formData.get("model_name") as string;
  const makerworldLink = formData.get("makerworld_link") as string;
  const printerId = formData.get("printer_id") as string;
  const printTime = parseInt(formData.get("print_time") as string);
  const powerConsumption = formData.get("power_consumption_w")
    ? parseInt(formData.get("power_consumption_w") as string)
    : null;
  const imageUrl = formData.get("image_url") as string;

  const { error: updateError } = await supabase
    .from("prints")
    .update({
      title,
      model_name: modelName,
      makerworld_link: makerworldLink,
      printer_id: printerId,
      image_url: imageUrl,
      print_time_minutes: printTime,
      power_consumption_w: powerConsumption,
    })
    .eq("id", printId)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Print update error", updateError);
    return;
  }

  await linkFilaments(
    supabase,
    printId,
    formData.get("filaments_json") as string,
  );

  revalidatePath("/dashboard/diary");
}

export async function deletePrint(printId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from("prints")
    .delete()
    .eq("id", printId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Print deletion error", error);
    return;
  }

  revalidatePath("/dashboard/diary");
}
