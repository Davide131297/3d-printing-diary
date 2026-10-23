"use server";

import { getCurrentUser, logoutUser } from "@/lib/auth";
import { upsertProfile, deleteUserAccount } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, message: "Nicht authentifiziert" };
  }

  const currency = formData.get("currency") as string;
  const priceInput = formData.get("price_ct_kwh") as string;

  let price_ct_kwh = null;
  if (priceInput) {
    // Replace comma with dot for German format support and parse
    price_ct_kwh = parseFloat(priceInput.replace(",", "."));
  }

  try {
    await upsertProfile(user.id, {
      currency: currency || "EUR",
      price_ct_kwh,
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/filaments");
    revalidatePath("/dashboard/diary");
    return { success: true, message: "Einstellungen gespeichert" };
  } catch (error) {
    console.error("Update error:", error);
    return { success: false, message: "Fehler beim Speichern" };
  }
}

export async function deleteAccount() {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, message: "Nicht authentifiziert" };
  }

  if (user.email === "demo@mail.de") {
    return {
      success: false,
      message: "Der Demo-Account kann nicht gelöscht werden.",
    };
  }

  try {
    await deleteUserAccount(user.id);
    await logoutUser();
    return { success: true, message: "Account gelöscht" };
  } catch (error) {
    console.error("Delete account error:", error);
    const msg = error instanceof Error ? error.message : "Unbekannter Fehler";
    return {
      success: false,
      message: "Fehler beim Löschen des Accounts: " + msg,
    };
  }
}
