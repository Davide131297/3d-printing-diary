"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const currency = formData.get("currency") as string;
  const priceInput = formData.get("price_ct_kwh") as string;

  let price_ct_kwh = null;
  if (priceInput) {
    // Replace comma with dot for German format support and parse
    price_ct_kwh = parseFloat(priceInput.replace(",", "."));
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    currency: currency,
    price_ct_kwh: price_ct_kwh,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Update error:", error);
    return { success: false, message: "Fehler beim Speichern" };
  }

  revalidatePath("/dashboard/settings");
  return { success: true, message: "Einstellungen gespeichert" };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Nicht authentifiziert" };
  }

  if (user.email === "demo@mail.de") {
    return {
      success: false,
      message: "Der Demo-Account kann nicht gelöscht werden.",
    };
  }

  // Call the RPC function 'delete_user' which must be defined in the database
  // with SECURITY DEFINER to allow self-deletion.
  const { error } = await supabase.rpc("delete_user");

  if (error) {
    console.error("Delete account error:", error);
    return {
      success: false,
      message: "Fehler beim Löschen des Accounts: " + error.message,
    };
  }

  await supabase.auth.signOut();
  return { success: true, message: "Account gelöscht" };
}
