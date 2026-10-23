"use server";

import { getCurrentUser } from "@/lib/auth";
import {
  saveCalculation,
  deleteSavedCalculation,
  getSavedCalculations,
  DbSavedCalculationItem,
  DbSavedCalculationColor,
  DbSavedCalculation,
} from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function saveCalculationAction(data: {
  name?: string;
  items: DbSavedCalculationItem[];
  total_weight_g: number;
  total_time_mins: number;
  colors: DbSavedCalculationColor[];
}): Promise<{ success: boolean; error?: string; calculation?: DbSavedCalculation }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Du musst angemeldet sein, um Kalkulationen zu speichern" };
    }

    if (!data.items || data.items.length === 0) {
      return { success: false, error: "Keine Modelle in der Kalkulation enthalten" };
    }

    const calc = await saveCalculation(user.id, data);
    revalidatePath("/dashboard/calculator");
    revalidatePath("/calculator");
    return { success: true, calculation: calc };
  } catch (error) {
    console.error("Error saving calculation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Fehler beim Speichern",
    };
  }
}

export async function deleteCalculationAction(
  calcId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Nicht autorisiert" };
    }

    const ok = await deleteSavedCalculation(user.id, calcId);
    if (!ok) {
      return { success: false, error: "Kalkulation konnte nicht gelöscht werden" };
    }

    revalidatePath("/dashboard/calculator");
    revalidatePath("/calculator");
    return { success: true };
  } catch (error) {
    console.error("Error deleting calculation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Fehler beim Löschen",
    };
  }
}

export async function getSavedCalculationsAction(): Promise<DbSavedCalculation[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];
    return await getSavedCalculations(user.id);
  } catch (error) {
    console.error("Error fetching calculations:", error);
    return [];
  }
}
