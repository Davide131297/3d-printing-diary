"use server";

import { getCurrentUser } from "@/lib/auth";
import {
  createPrint as createPrintDb,
  updatePrint as updatePrintDb,
  deletePrint as deletePrintDb,
} from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createPrint(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const title = formData.get("title") as string;
  const modelName = formData.get("model_name") as string;
  const makerworldLink = formData.get("makerworld_link") as string;
  const printerId = formData.get("printer_id") as string;
  const printTime = parseInt(formData.get("print_time") as string, 10) || 0;

  const powerConsumption = formData.get("power_consumption_w")
    ? parseInt(formData.get("power_consumption_w") as string, 10)
    : null;
  const imageUrl = formData.get("image_url") as string;
  const filamentsJson = formData.get("filaments_json") as string;

  try {
    await createPrintDb(
      {
        user_id: user.id,
        title,
        model_name: modelName,
        makerworld_link: makerworldLink,
        printer_id: printerId,
        print_time_minutes: printTime,
        power_consumption_w: powerConsumption,
        image_url: imageUrl,
        status: "completed",
      },
      filamentsJson,
    );

    revalidatePath("/dashboard/diary");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/filaments");
  } catch (error) {
    console.error("Print creation error", error);
  }
}

export async function updatePrint(printId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const title = formData.get("title") as string;
  const modelName = formData.get("model_name") as string;
  const makerworldLink = formData.get("makerworld_link") as string;
  const printerId = formData.get("printer_id") as string;
  const printTime = parseInt(formData.get("print_time") as string, 10) || 0;
  const powerConsumption = formData.get("power_consumption_w")
    ? parseInt(formData.get("power_consumption_w") as string, 10)
    : null;
  const imageUrl = formData.get("image_url") as string;
  const filamentsJson = formData.get("filaments_json") as string;

  try {
    await updatePrintDb(
      printId,
      user.id,
      {
        title,
        model_name: modelName,
        makerworld_link: makerworldLink,
        printer_id: printerId,
        image_url: imageUrl,
        print_time_minutes: printTime,
        power_consumption_w: powerConsumption,
      },
      filamentsJson,
    );

    revalidatePath("/dashboard/diary");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/filaments");
  } catch (error) {
    console.error("Print update error", error);
  }
}

export async function deletePrint(printId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  try {
    await deletePrintDb(printId, user.id);
    revalidatePath("/dashboard/diary");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/filaments");
  } catch (error) {
    console.error("Print deletion error", error);
  }
}
