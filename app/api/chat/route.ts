import { getCurrentUser } from "@/lib/auth";
import { searchDocuments, getFilaments } from "@/lib/db";
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

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // 1. Generate text embedding for the user's message
    const embeddingResponse = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: message,
    });

    const embedding = embeddingResponse.embeddings?.[0]?.values;

    // 2. Query MongoDB for relevant documents using vector cosine similarity
    let documents: { content: string }[] = [];
    if (embedding) {
      documents = await searchDocuments(user.id, embedding, 30, 0.2);
    }

    // 3. Construct prompt with context
    const contextText =
      documents?.map((doc) => doc.content).join("\n\n") || "";

    // --- Inject Live Stock Data ---
    const allFilaments = await getFilaments(user.id);
    let stockContext = "Live Filament Stock Info:\n";

    if (allFilaments && allFilaments.length > 0) {
      allFilaments.forEach((fil) => {
        const remaining = fil.remaining_g ?? fil.weight_g;
        const status =
          remaining < 0 ? "EMPTY/DEFICIT" : remaining < 50 ? "LOW" : "OK";

        stockContext += `- \`color:${fil.color}\` ${fil.name} (${fil.material}, ${fil.manufacturer}): ${remaining.toFixed(0)}g remaining (Original: ${fil.weight_g}g). Status: ${status}\n`;
      });
    } else {
      stockContext += "Keine Filamente im Inventar erfasst.\n";
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
