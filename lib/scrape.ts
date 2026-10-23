// MakerWorld scraping runs server-side (lib/scraper-server.ts via /api/scrape).
// This file only holds the response types and the client call.

export type FilamentWeight = {
  amount: number;
  color: string;
  material?: string;
  usedM?: string;
};

export type PrintProfile = {
  id?: string;
  name: string;
  printTime?: number;
  weight?: number;
  cover?: string;
  isDefault?: boolean;
  filamentWeights?: FilamentWeight[];
};

export type ScrapedData = {
  title?: string;
  modelName?: string;
  imageUrl?: string;
  printTime?: number; // in minutes
  selectedProfileId?: string;
  profiles?: PrintProfile[];
};

export async function scrapeMakerWorld(url: string): Promise<ScrapedData> {
  const res = await fetch("/api/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Fehler beim Laden von ${url}`);
  }

  return res.json();
}
