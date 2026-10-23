"use server";

import { getCurrentUser } from "@/lib/auth";
import {
  addFilament as insertFilamentDb,
  deleteFilament as deleteFilamentDb,
  updateFilament as updateFilamentDb,
  getProfile,
} from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function addFilament(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return;
  }

  // Get user currency
  const profile = await getProfile(user.id);
  const currency = profile?.currency || "EUR";

  const name = formData.get("name") as string;
  const manufacturer = formData.get("manufacturer") as string;
  const material = formData.get("material") as string;
  const color = formData.get("color") as string; // Hex code
  const price = parseFloat(formData.get("price") as string);
  const weight = parseInt(formData.get("weight") as string, 10);

  try {
    await insertFilamentDb({
      user_id: user.id,
      name,
      manufacturer,
      material,
      color,
      price,
      currency,
      weight_g: weight,
    });
    revalidatePath("/dashboard/filaments");
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Failed to add filament:", error);
  }
}

export async function deleteFilament(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    return;
  }

  try {
    await deleteFilamentDb(id, user.id);
    revalidatePath("/dashboard/filaments");
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Failed to delete filament:", error);
  }
}

export async function editFilament(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return;
  }

  const name = formData.get("name") as string;
  const manufacturer = formData.get("manufacturer") as string;
  const material = formData.get("material") as string;
  const color = formData.get("color") as string;
  const price = parseFloat(formData.get("price") as string);
  const weight = parseInt(formData.get("weight") as string, 10);

  try {
    await updateFilamentDb(id, user.id, {
      name,
      manufacturer,
      material,
      color,
      price,
      weight_g: weight,
    });
    revalidatePath("/dashboard/filaments");
  } catch (error) {
    console.error("Failed to edit filament:", error);
  }
}
