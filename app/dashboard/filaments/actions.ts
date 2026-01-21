"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addFilament(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  // Get user currency
  const { data: profile } = await supabase
    .from("profiles")
    .select("currency")
    .eq("id", user.id)
    .single();
  const currency = profile?.currency || "EUR";

  const name = formData.get("name") as string;
  const manufacturer = formData.get("manufacturer") as string;
  const material = formData.get("material") as string;
  const color = formData.get("color") as string; // Hex code
  const price = parseFloat(formData.get("price") as string);
  const weight = parseInt(formData.get("weight") as string);

  const { error } = await supabase.from("filaments").insert({
    user_id: user.id,
    name,
    manufacturer,
    material,
    color,
    price,
    currency,
    weight_g: weight,
  });

  if (error) {
    console.error(error);
    return;
  }

  revalidatePath("/dashboard/filaments");
}

export async function deleteFilament(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { error } = await supabase
    .from("filaments")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    return;
  }

  revalidatePath("/dashboard/filaments");
}

export async function editFilament(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const name = formData.get("name") as string;
  const manufacturer = formData.get("manufacturer") as string;
  const material = formData.get("material") as string;
  const color = formData.get("color") as string;
  const price = parseFloat(formData.get("price") as string);
  const weight = parseInt(formData.get("weight") as string);

  const { error } = await supabase
    .from("filaments")
    .update({
      name,
      manufacturer,
      material,
      color,
      price,
      weight_g: weight,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    return;
  }

  revalidatePath("/dashboard/filaments");
}
