import { getDb } from "./mongodb";
import { Printer, Filament, Print } from "@/types/diary";

export interface DbUser {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  resetToken?: string;
  resetTokenExpires?: string;
}

export interface DbSession {
  token: string;
  userId: string;
  email: string;
  createdAt: string;
  expiresAt: string;
}

export interface DbProfile {
  id: string;
  user_id: string;
  username?: string;
  currency: string;
  price_ct_kwh: number | null;
  updated_at?: string;
}

export interface DbPrinter {
  id: string;
  user_id: string;
  name: string;
  model: string;
  image_url?: string;
  serial?: string;
  ip?: string;
  access_code_encrypted?: string;
  created_at: string;
}

export interface DbFilament {
  id: string;
  user_id: string;
  name: string;
  manufacturer: string;
  material: string;
  color: string;
  price: number;
  currency: string;
  weight_g: number;
  created_at: string;
}

export interface DbPrint {
  id: string;
  user_id: string;
  printer_id: string;
  title: string;
  model_name: string;
  makerworld_link?: string;
  print_time_minutes: number;
  power_consumption_w?: number | null;
  status: string;
  notes?: string;
  image_url?: string;
  auto_captured?: boolean;
  created_at: string;
}

export interface DbPrintFilament {
  id: string;
  print_id: string;
  filament_id: string;
  amount_used_g: number;
}

export interface DbDocument {
  id: string;
  user_id: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding: number[];
}

export interface DbSavedCalculationItem {
  id: string;
  url: string;
  title: string;
  imageUrl?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profiles: any[];
  selectedProfileId: string;
  quantity: number;
}

export interface DbSavedCalculationColor {
  color: string;
  name: string;
  material: string;
  amount: number;
  percentage: number;
}

export interface DbSavedCalculation {
  id: string;
  user_id: string;
  name: string;
  items: DbSavedCalculationItem[];
  total_weight_g: number;
  total_time_mins: number;
  colors: DbSavedCalculationColor[];
  created_at: string;
}

/* ================= PRINTERS ================= */

export async function getPrinters(userId: string): Promise<Printer[]> {
  const db = await getDb();
  const docs = await db
    .collection<DbPrinter>("printers")
    .find({ user_id: userId })
    .sort({ created_at: -1 })
    .toArray();

  return docs.map((doc) => ({
    id: doc.id,
    name: doc.name,
    model: doc.model,
    image_url: doc.image_url,
  }));
}

export async function getPrinterById(
  id: string,
  userId?: string,
): Promise<DbPrinter | null> {
  const db = await getDb();
  const query: { id: string; user_id?: string } = { id };
  if (userId) query.user_id = userId;
  return db.collection<DbPrinter>("printers").findOne(query);
}

export async function addPrinter(
  printer: Omit<DbPrinter, "id" | "created_at">,
): Promise<DbPrinter> {
  const db = await getDb();
  const newPrinter: DbPrinter = {
    ...printer,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  await db.collection<DbPrinter>("printers").insertOne(newPrinter);
  return newPrinter;
}

export async function deletePrinter(
  printerId: string,
  userId: string,
): Promise<void> {
  const db = await getDb();
  await db.collection("printers").deleteOne({ id: printerId, user_id: userId });
}

/* ================= FILAMENTS ================= */

export async function getFilaments(
  userId: string,
): Promise<(Filament & { print_filaments: { amount_used_g: number }[]; remaining_g: number })[]> {
  const db = await getDb();
  const filaments = await db
    .collection<DbFilament>("filaments")
    .find({ user_id: userId })
    .sort({ created_at: -1 })
    .toArray();

  const printFilaments = await db
    .collection<DbPrintFilament>("print_filaments")
    .find({})
    .toArray();

  return filaments.map((f) => {
    const usageForFilament = printFilaments.filter(
      (pf) => pf.filament_id === f.id,
    );
    const used = usageForFilament.reduce(
      (acc, curr) => acc + (curr.amount_used_g || 0),
      0,
    );
    return {
      id: f.id,
      name: f.name,
      manufacturer: f.manufacturer,
      material: f.material,
      color: f.color,
      price: f.price,
      currency: f.currency,
      weight_g: f.weight_g,
      remaining_g: f.weight_g - used,
      print_filaments: usageForFilament.map((pf) => ({
        amount_used_g: pf.amount_used_g,
      })),
    };
  });
}

export async function addFilament(
  filament: Omit<DbFilament, "id" | "created_at">,
): Promise<DbFilament> {
  const db = await getDb();
  const newFilament: DbFilament = {
    ...filament,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  await db.collection<DbFilament>("filaments").insertOne(newFilament);
  return newFilament;
}

export async function updateFilament(
  id: string,
  userId: string,
  update: Partial<DbFilament>,
): Promise<void> {
  const db = await getDb();
  await db
    .collection<DbFilament>("filaments")
    .updateOne({ id, user_id: userId }, { $set: update });
}

export async function deleteFilament(
  id: string,
  userId: string,
): Promise<void> {
  const db = await getDb();
  await db.collection("filaments").deleteOne({ id, user_id: userId });
  await db.collection("print_filaments").deleteMany({ filament_id: id });
}

/* ================= PRINTS & DIARY ================= */

export async function getPrints(userId: string): Promise<Print[]> {
  const db = await getDb();
  const [prints, printers, filaments, printFilaments] = await Promise.all([
    db
      .collection<DbPrint>("prints")
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .toArray(),
    db.collection<DbPrinter>("printers").find({ user_id: userId }).toArray(),
    db.collection<DbFilament>("filaments").find({ user_id: userId }).toArray(),
    db.collection<DbPrintFilament>("print_filaments").find({}).toArray(),
  ]);

  const printerMap = new Map(printers.map((p) => [p.id, p]));
  const filamentMap = new Map(filaments.map((f) => [f.id, f]));

  return prints.map((p) => {
    const printer = printerMap.get(p.printer_id);
    const relatedPf = printFilaments.filter((pf) => pf.print_id === p.id);

    const populatedPf = relatedPf.map((pf) => {
      const f = filamentMap.get(pf.filament_id);
      return {
        amount_used_g: pf.amount_used_g,
        filaments: f
          ? {
              id: f.id,
              name: f.name,
              color: f.color,
              manufacturer: f.manufacturer,
              price: f.price,
              weight_g: f.weight_g,
              currency: f.currency,
              material: f.material,
            }
          : {
              id: pf.filament_id,
              name: "Unbekannt",
              color: "#cccccc",
              manufacturer: "Unbekannt",
              price: 0,
              weight_g: 1000,
              currency: "EUR",
              material: "PLA",
            },
      };
    });

    return {
      id: p.id,
      title: p.title,
      model_name: p.model_name,
      makerworld_link: p.makerworld_link || "",
      printer_id: p.printer_id,
      image_url: p.image_url,
      print_time_minutes: p.print_time_minutes,
      power_consumption_w: p.power_consumption_w ?? undefined,
      created_at: p.created_at,
      auto_captured: p.auto_captured,
      printers: printer
        ? {
            id: printer.id,
            name: printer.name,
            model: printer.model,
          }
        : {
            id: p.printer_id,
            name: "Unbekannter Drucker",
            model: "",
          },
      print_filaments: populatedPf,
    };
  });
}

export async function createPrint(
  printData: Omit<DbPrint, "id" | "created_at">,
  filamentsJson?: string,
): Promise<DbPrint> {
  const db = await getDb();
  const printId = crypto.randomUUID();
  const newPrint: DbPrint = {
    ...printData,
    id: printId,
    created_at: new Date().toISOString(),
  };

  await db.collection<DbPrint>("prints").insertOne(newPrint);

  if (filamentsJson) {
    await linkFilaments(printId, filamentsJson);
  }

  return newPrint;
}

export async function updatePrint(
  printId: string,
  userId: string,
  printData: Partial<DbPrint>,
  filamentsJson?: string,
): Promise<void> {
  const db = await getDb();
  await db
    .collection<DbPrint>("prints")
    .updateOne({ id: printId, user_id: userId }, { $set: printData });

  if (filamentsJson) {
    await linkFilaments(printId, filamentsJson);
  }
}

export async function deletePrint(
  printId: string,
  userId: string,
): Promise<void> {
  const db = await getDb();
  await db.collection("prints").deleteOne({ id: printId, user_id: userId });
  await db.collection("print_filaments").deleteMany({ print_id: printId });
}

export async function linkFilaments(
  printId: string,
  filamentsJson: string,
): Promise<void> {
  if (!filamentsJson) return;

  try {
    const filaments = JSON.parse(filamentsJson) as {
      id: string;
      amount: string;
    }[];

    const db = await getDb();
    await db.collection("print_filaments").deleteMany({ print_id: printId });

    const inserts: DbPrintFilament[] = filaments
      .filter((f) => f.id && f.amount)
      .map((f) => ({
        id: crypto.randomUUID(),
        print_id: printId,
        filament_id: f.id,
        amount_used_g: parseInt(f.amount, 10),
      }));

    if (inserts.length > 0) {
      await db.collection<DbPrintFilament>("print_filaments").insertMany(inserts);
    }
  } catch (e) {
    console.error("Error linking filaments:", e);
  }
}

/* ================= PROFILES & SETTINGS ================= */

export async function getProfile(userId: string): Promise<DbProfile | null> {
  const db = await getDb();
  return db.collection<DbProfile>("profiles").findOne({ user_id: userId });
}

export async function upsertProfile(
  userId: string,
  profile: Partial<DbProfile>,
): Promise<void> {
  const db = await getDb();
  await db.collection<DbProfile>("profiles").updateOne(
    { user_id: userId },
    {
      $set: {
        ...profile,
        user_id: userId,
        id: userId,
        updated_at: new Date().toISOString(),
      },
      $setOnInsert: {
        currency: profile.currency || "EUR",
      },
    },
    { upsert: true },
  );
}

export async function deleteUserAccount(userId: string): Promise<void> {
  const db = await getDb();
  await Promise.all([
    db.collection("users").deleteOne({ id: userId }),
    db.collection("sessions").deleteMany({ userId }),
    db.collection("profiles").deleteMany({ user_id: userId }),
    db.collection("printers").deleteMany({ user_id: userId }),
    db.collection("filaments").deleteMany({ user_id: userId }),
    db.collection("prints").deleteMany({ user_id: userId }),
    db.collection("documents").deleteMany({ user_id: userId }),
  ]);
}

/* ================= DASHBOARD STATS ================= */

export async function getDashboardStats(userId: string) {
  const db = await getDb();
  const [totalPrints, printerCount, filamentCount, recentPrints] =
    await Promise.all([
      db.collection("prints").countDocuments({ user_id: userId }),
      db.collection("printers").countDocuments({ user_id: userId }),
      db.collection("filaments").countDocuments({ user_id: userId }),
      db
        .collection<DbPrint>("prints")
        .find({ user_id: userId })
        .sort({ created_at: -1 })
        .limit(5)
        .toArray(),
    ]);

  return {
    totalPrints,
    printerCount,
    filamentCount,
    recentPrints: recentPrints.map((p) => ({
      id: p.id,
      title: p.title,
      model_name: p.model_name,
      auto_captured: p.auto_captured,
      created_at: p.created_at,
    })),
  };
}

/* ================= VECTOR EMBEDDINGS & DOCUMENTS ================= */

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function searchDocuments(
  userId: string,
  queryEmbedding: number[],
  matchCount = 30,
  matchThreshold = 0.2,
): Promise<{ content: string; similarity: number }[]> {
  const db = await getDb();
  const docs = await db
    .collection<DbDocument>("documents")
    .find({ user_id: userId })
    .toArray();

  const scored = docs
    .map((doc) => ({
      content: doc.content,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding),
    }))
    .filter((doc) => doc.similarity >= matchThreshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, matchCount);

  return scored;
}

export async function ingestUserDocuments(
  userId: string,
  documents: { content: string; metadata: Record<string, unknown>; embedding: number[] }[],
): Promise<number> {
  const db = await getDb();
  await db.collection("documents").deleteMany({ user_id: userId });

  if (documents.length === 0) return 0;

  const docsToInsert: DbDocument[] = documents.map((d) => ({
    id: crypto.randomUUID(),
    user_id: userId,
    content: d.content,
    metadata: d.metadata,
    embedding: d.embedding,
  }));

  await db.collection<DbDocument>("documents").insertMany(docsToInsert);
  return docsToInsert.length;
}

/* ================= SAVED CALCULATIONS ================= */

export async function getSavedCalculations(
  userId: string,
): Promise<DbSavedCalculation[]> {
  const db = await getDb();
  const docs = await db
    .collection<DbSavedCalculation>("saved_calculations")
    .find({ user_id: userId })
    .sort({ created_at: -1 })
    .toArray();

  return docs.map((doc) => ({
    id: doc.id,
    user_id: doc.user_id,
    name: doc.name,
    items: doc.items || [],
    total_weight_g: doc.total_weight_g || 0,
    total_time_mins: doc.total_time_mins || 0,
    colors: doc.colors || [],
    created_at: doc.created_at,
  }));
}

export async function saveCalculation(
  userId: string,
  calc: {
    name?: string;
    items: DbSavedCalculationItem[];
    total_weight_g: number;
    total_time_mins: number;
    colors: DbSavedCalculationColor[];
  },
): Promise<DbSavedCalculation> {
  const db = await getDb();
  const newCalc: DbSavedCalculation = {
    id: crypto.randomUUID(),
    user_id: userId,
    name:
      calc.name?.trim() ||
      `Kalkulation vom ${new Date().toLocaleDateString("de-DE")}`,
    items: calc.items,
    total_weight_g: calc.total_weight_g,
    total_time_mins: calc.total_time_mins,
    colors: calc.colors,
    created_at: new Date().toISOString(),
  };

  await db
    .collection<DbSavedCalculation>("saved_calculations")
    .insertOne(newCalc);
  return newCalc;
}

export async function deleteSavedCalculation(
  userId: string,
  calcId: string,
): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection<DbSavedCalculation>("saved_calculations")
    .deleteOne({ id: calcId, user_id: userId });
  return result.deletedCount > 0;
}
