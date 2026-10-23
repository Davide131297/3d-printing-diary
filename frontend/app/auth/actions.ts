"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  loginUser,
  registerUser,
  logoutUser,
  updateUserPassword,
  requestPasswordReset,
  getCurrentUser,
} from "@/lib/auth";

export async function login(prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Bitte E-Mail und Passwort eingeben" };
  }

  const result = await loginUser(email, password);

  if (!result.success) {
    return { error: result.error || "Could not authenticate user" };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Bitte E-Mail und Passwort eingeben" };
  }

  const result = await registerUser(email, password);

  if (!result.success) {
    return { error: result.error || "Could not authenticate user" };
  }

  revalidatePath("/", "layout");
  return { message: "Erfolgreich registriert, du kannst dich jetzt einloggen" };
}

export async function signout() {
  await logoutUser();
  revalidatePath("/", "layout");
  redirect("/?logged_out=true");
}

export async function updatePassword(prevState: unknown, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Nicht autorisiert" };
  }

  const password = formData.get("password") as string;
  if (!password || password.length < 6) {
    return { error: "Das Passwort muss mindestens 6 Zeichen lang sein" };
  }

  const result = await updateUserPassword(user.id, password);

  if (!result.success) {
    return {
      error: "Fehler beim Aktualisieren des Passworts: " + (result.error || ""),
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function resetPassword(prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Bitte eine E-Mail-Adresse eingeben" };
  }

  const result = await requestPasswordReset(email);

  if (!result.success) {
    return { error: result.error || "Fehler beim Senden der E-Mail" };
  }

  return { message: "E-Mail zum Zurücksetzen des Passworts wurde gesendet." };
}
