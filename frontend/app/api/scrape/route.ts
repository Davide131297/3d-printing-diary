import { NextResponse } from "next/server";
import { scrapeMakerWorld } from "@/app/dashboard/diary/scrape";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL ist erforderlich" }, { status: 400 });
    }

    if (!url.includes("makerworld.com")) {
      return NextResponse.json(
        { error: "Bitte eine gültige MakerWorld-URL angeben" },
        { status: 400 },
      );
    }

    const data = await scrapeMakerWorld(url);

    if (!data) {
      return NextResponse.json(
        { error: "Modell konnte nicht von MakerWorld geladen werden" },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API /api/scrape error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scraping-Fehler" },
      { status: 500 },
    );
  }
}
