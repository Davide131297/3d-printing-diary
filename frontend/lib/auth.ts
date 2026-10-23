import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { getDb } from "./mongodb";
import { DbUser, DbSession } from "./db";

const SESSION_COOKIE_NAME = "session_token";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export interface AuthUser {
  id: string;
  email: string;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return null;

    const db = await getDb();
    const session = await db.collection<DbSession>("sessions").findOne({
      token,
      expiresAt: { $gt: new Date().toISOString() },
    });

    if (!session) return null;

    return {
      id: session.userId,
      email: session.email,
    };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      (error as { digest: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.error("Error in getCurrentUser:", error);
    return null;
  }
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
  const db = await getDb();
  const normalizedEmail = email.trim().toLowerCase();

  const user = await db
    .collection<DbUser>("users")
    .findOne({ email: normalizedEmail });

  if (!user) {
    return { success: false, error: "Ungültige E-Mail oder Passwort" };
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return { success: false, error: "Ungültige E-Mail oder Passwort" };
  }

  // Create session
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();

  await db.collection<DbSession>("sessions").insertOne({
    token,
    userId: user.id,
    email: user.email,
    createdAt: new Date().toISOString(),
    expiresAt,
  });

  // Set HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return {
    success: true,
    user: { id: user.id, email: user.email },
  };
}

export async function registerUser(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
  const db = await getDb();
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await db
    .collection<DbUser>("users")
    .findOne({ email: normalizedEmail });

  if (existingUser) {
    return {
      success: false,
      error: "Ein Benutzer mit dieser E-Mail existiert bereits",
    };
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  const userId = crypto.randomUUID();

  const newUser: DbUser = {
    id: userId,
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  await db.collection<DbUser>("users").insertOne(newUser);

  // Initialize profile
  await db.collection("profiles").insertOne({
    id: userId,
    user_id: userId,
    username: normalizedEmail,
    currency: "EUR",
    price_ct_kwh: null,
    updated_at: new Date().toISOString(),
  });

  // Create active session directly on signup
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();

  await db.collection<DbSession>("sessions").insertOne({
    token,
    userId,
    email: normalizedEmail,
    createdAt: new Date().toISOString(),
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return {
    success: true,
    user: { id: userId, email: normalizedEmail },
  };
}

export async function logoutUser(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      const db = await getDb();
      await db.collection("sessions").deleteOne({ token });
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (error) {
    console.error("Error in logoutUser:", error);
  }
}

export async function updateUserPassword(
  userId: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb();
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    const result = await db
      .collection<DbUser>("users")
      .updateOne({ id: userId }, { $set: { passwordHash } });

    if (result.matchedCount === 0) {
      return { success: false, error: "Benutzer nicht gefunden" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in updateUserPassword:", error);
    return { success: false, error: "Fehler beim Aktualisieren des Passworts" };
  }
}

export async function requestPasswordReset(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb();
    const normalizedEmail = email.trim().toLowerCase();
    const user = await db
      .collection<DbUser>("users")
      .findOne({ email: normalizedEmail });

    if (!user) {
      // Do not disclose whether email exists
      return { success: true };
    }

    const resetToken = crypto.randomUUID();
    const resetTokenExpires = new Date(Date.now() + 3600 * 1000).toISOString();

    await db.collection<DbUser>("users").updateOne(
      { id: user.id },
      {
        $set: {
          resetToken,
          resetTokenExpires,
        },
      },
    );

    return { success: true };
  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    return { success: false, error: "Fehler beim Zurücksetzen des Passworts" };
  }
}
