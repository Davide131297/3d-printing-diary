import { createClient } from "@/utils/supabase/server";
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GOOGLE_AI_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key missing" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Validate user session
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Generate text embedding for the user's message
    const embeddingResponse = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: message,
    });

    // Check if embeddings.values exists, assuming SDK structure based on lint
    const embedding = embeddingResponse.embeddings?.[0]?.values;

    // 2. Query Supabase for relevant documents

    const { data: documents, error: matchError } = await supabase.rpc(
      "match_documents",
      {
        query_embedding: embedding,
        match_threshold: 0.2, // Lowered threshold for better retrieval
        match_count: 30,
      },
    );

    if (matchError) {
      console.error("Vector search error:", matchError);
      return NextResponse.json(
        { error: "Failed to retrieve context" },
        { status: 500 },
      );
    }

    // 3. Construct prompt with context
    const contextText =
      documents?.map((doc: { content: string }) => doc.content).join("\n\n") ||
      "";

    // --- NEW: Inject Live Stock Data ---
    // Fetch all filaments and their usage to calculate real-time stock
    const { data: allFilaments } = await supabase
      .from("filaments")
      .select(
        "id, name, color, material, weight_g, manufacturer, price, currency",
      );

    const { data: allUsage } = await supabase
      .from("print_filaments")
      .select("filament_id, amount_used_g");

    let stockContext = "Live Filament Stock Info:\n";

    if (allFilaments && allUsage) {
      allFilaments.forEach((fil) => {
        // Calculate total used for this filament
        const usedAmount = allUsage
          .filter((u) => u.filament_id === fil.id)
          .reduce((sum, u) => sum + (u.amount_used_g || 0), 0);

        const remaining = fil.weight_g - usedAmount;
        const status =
          remaining < 0 ? "EMPTY/DEFICIT" : remaining < 50 ? "LOW" : "OK";

        stockContext += `- \`color:${fil.color}\` ${fil.name} (${fil.material}, ${fil.manufacturer}): ${remaining.toFixed(0)}g remaining (Original: ${fil.weight_g}g). Status: ${status}\n`;
      });
    } else {
      stockContext += "Could not load live stock data.\n";
    }

    const fullContext = `${stockContext}\n\nExisting Knowledge Base Context:\n${contextText}`;

    const systemPrompt = `You are a helpful AI assistant for a 3D printing diary.
      Use the following context to answer the user's question.
      If the answer isn't in the context, say so, but try to be helpful based on general knowledge if applicable (clarify if it's general knowledge).
      Keep answers concise and relevant.
      Response in German.
      When listing filaments, YOU MUST INCLUDE the visual color tag exactly as provided in the context (Use the inline code format: \`color:#hex\`).
      Do not replace it with text or remove it. It is required for the UI to show the color.

      Context:
      ${fullContext}
    `;

    // 4. Generate response from Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "user", parts: [{ text: message }] },
      ],
    });

    const text = response.text;

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal processing error" },
      { status: 500 },
    );
  }
}
