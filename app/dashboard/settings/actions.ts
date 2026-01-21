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

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    currency: currency,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    // In a real app we might redirect to an error page or use a toast
    console.error("Update error:", error);
    return;
  }

  revalidatePath("/dashboard/settings");
}
