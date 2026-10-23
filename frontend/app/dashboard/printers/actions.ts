"use server";

import { getCurrentUser } from "@/lib/auth";
import { addPrinter as insertPrinterDb, deletePrinter as deletePrinterDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PRINTER_MODELS } from "@/lib/constants";

export async function addPrinter(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return;
  }

  const name = formData.get("name") as string;
  const modelId = formData.get("model") as string;

  const model = PRINTER_MODELS.find((p) => p.id === modelId);
  if (!model) {
    return;
  }

  try {
    await insertPrinterDb({
      user_id: user.id,
      name: name,
      model: model.name,
      image_url: model.image,
    });
    revalidatePath("/dashboard/printers");
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Failed to add printer:", error);
  }
}

export async function deletePrinter(printerId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return;
  }

  try {
    await deletePrinterDb(printerId, user.id);
    revalidatePath("/dashboard/printers");
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Failed to delete printer:", error);
  }
}
