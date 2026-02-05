import { createClient } from "@/utils/supabase/server";
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

interface FilamentData {
  name: string;
  color: string;
  material: string;
  price: number;
  weight_g: number;
}

interface PrintFilamentRelation {
  amount_used_g: number;
  filaments: FilamentData | null;
}

interface PrintData {
  title: string;
  created_at: string;
  print_filaments: PrintFilamentRelation[];
  power_consumption_w?: number;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const apiKey = process.env.GOOGLE_AI_KEY;

    if (!apiKey) throw new Error("API key missing");

    const ai = new GoogleGenAI({ apiKey });

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch data from primary tables
    const { data: printers } = await supabase.from("printers").select("*");
    const { data: filaments } = await supabase.from("filaments").select("*");
    const { data: prints } = await supabase
      .from("prints")
      .select(
        "*, print_filaments(amount_used_g, filaments(name, color, material, price, weight_g))",
      );
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const documentsToInsert = [];

    // 0. Format Profile (Electricity Price)
    if (profile) {
      const content = `User Settings: Electricity Price is ${profile.price_ct_kwh || "unknown"} cents per kWh. Currency is ${profile.currency || "EUR"}.`;
      const embeddingRes = await ai.models.embedContent({
        model: "text-embedding-004",
        contents: content,
      });
      const embedding = embeddingRes.embeddings?.[0]?.values;

      if (embedding) {
        documentsToInsert.push({
          content,
          metadata: { type: "profile", id: profile.id },
          embedding: embedding,
        });
      }
    }

    // 2. Format Printers
    if (printers) {
      for (const printer of printers) {
        const content = `Printer: ${printer.name} (Model: ${printer.model}). Serial: ${printer.serial || "N/A"}. IP: ${printer.ip || "Unknown"}.`;
        const embeddingRes = await ai.models.embedContent({
          model: "text-embedding-004",
          contents: content,
        });
        // Check structure based on earlier lint: embeddingRes.embeddings[0].values
        // If it fails, we might need debugging, but this matches the pattern.
        const embedding = embeddingRes.embeddings?.[0]?.values;

        if (embedding) {
          documentsToInsert.push({
            content,
            metadata: { type: "printer", id: printer.id },
            embedding: embedding,
          });
        }
      }
    }

    // 3. Format Filaments
    if (filaments) {
      for (const filament of filaments) {
        const content = `Filament: ${filament.name}. Manufacturer: ${filament.manufacturer || "Unknown"}. Material: ${filament.material}. Color: ${filament.color}. Weight: ${filament.weight_g}g. Price: ${filament.price} ${filament.currency}.`;
        const embeddingRes = await ai.models.embedContent({
          model: "text-embedding-004",
          contents: content,
        });
        const embedding = embeddingRes.embeddings?.[0]?.values;

        if (embedding) {
          documentsToInsert.push({
            content,
            metadata: { type: "filament", id: filament.id },
            embedding: embedding,
          });
        }
      }
    }

    // 4. Format Prints
    if (prints) {
      for (const print of prints) {
        let usedFilamentsText = "";
        if (print.print_filaments && Array.isArray(print.print_filaments)) {
          usedFilamentsText = print.print_filaments
            .map((pf: PrintFilamentRelation) => {
              const f = pf.filaments;
              if (!f) return "";
              return `${f.name} (${f.color}, ${f.material})`;
            })
            .filter(Boolean)
            .join(", ");
        }

        const content = `Print Job: ${print.title}. Model: ${print.model_name || "Unknown"}. Status: ${print.status}. Used Filaments: ${usedFilamentsText || "None recorded"}. Date: ${new Date(print.created_at).toLocaleDateString()}. Print Time: ${print.print_time_minutes || 0} mins. Notes: ${print.notes || "None"}. MakerWorld Link: ${print.makerworld_link || "None"}.`;
        const embeddingRes = await ai.models.embedContent({
          model: "text-embedding-004",
          contents: content,
        });
        const embedding = embeddingRes.embeddings?.[0]?.values;

        if (embedding) {
          documentsToInsert.push({
            content,
            metadata: { type: "print", id: print.id },
            embedding: embedding,
          });
        }
      }

      // Create a SUMMARY document for the latest prints to help with "last print" queries
      const sortedPrints = [...prints].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      const latestPrints = sortedPrints
        .slice(0, 5)
        .map(
          (p: PrintData) =>
            `- ${p.title} (on ${new Date(p.created_at).toLocaleDateString()})`,
        )
        .join("\n");

      const summaryContent = `Latest Activity Summary:\nThe last 5 prints were:\n${latestPrints}\n\nMost recent print: ${sortedPrints[0]?.title || "None"}.`;

      const summaryEmbeddingRes = await ai.models.embedContent({
        model: "text-embedding-004",
        contents: summaryContent,
      });
      const summaryEmbedding = summaryEmbeddingRes.embeddings?.[0]?.values;

      if (summaryEmbedding) {
        documentsToInsert.push({
          content: summaryContent,
          metadata: { type: "summary", id: "latest-prints-summary" },
          embedding: summaryEmbedding,
        });
      }

      // Calculate Total Costs (Replicating logic from dashboard/diary/page.tsx)
      let totalCosts = 0;
      const currencySymbol = profile?.currency === "EUR" ? "€" : "$";
      const electricityPrice = profile?.price_ct_kwh || 0;

      prints.forEach((print: PrintData) => {
        // Filament Costs
        if (print.print_filaments) {
          print.print_filaments.forEach((pf: PrintFilamentRelation) => {
            const fil = pf.filaments;
            if (fil && fil.weight_g > 0) {
              const costPerGram = fil.price / fil.weight_g;
              totalCosts += costPerGram * pf.amount_used_g;
            }
          });
        }

        // Electricity Costs
        if (print.power_consumption_w && electricityPrice) {
          const kwh = print.power_consumption_w / 1000;
          const electricityCost = kwh * (electricityPrice / 100);
          totalCosts += electricityCost;
        }
      });

      const costSummaryContent = `Financial Summary:\nTotal accumulated 3D printing costs (including filament and electricity): ${totalCosts.toFixed(2)} ${currencySymbol}.\nElectricity price used: ${electricityPrice} cents/kWh.`;

      const costEmbeddingRes = await ai.models.embedContent({
        model: "text-embedding-004",
        contents: costSummaryContent,
      });
      const costEmbedding = costEmbeddingRes.embeddings?.[0]?.values;

      if (costEmbedding) {
        documentsToInsert.push({
          content: costSummaryContent,
          metadata: { type: "summary", id: "total-cost-summary" },
          embedding: costEmbedding,
        });
      }
    }

    // 5. Insert into documents table
    // Delete only this user's documents
    await supabase.from("documents").delete().eq("user_id", user.id);

    if (documentsToInsert.length > 0) {
      // Add user_id to each doc
      const docsWithUser = documentsToInsert.map((doc) => ({
        ...doc,
        user_id: user.id,
      }));

      const { error } = await supabase.from("documents").insert(docsWithUser);
      if (error) throw error;
    }

    return NextResponse.json({
      success: true,
      insertedCount: documentsToInsert.length,
    });
  } catch (error: unknown) {
    console.error("Ingestion error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
