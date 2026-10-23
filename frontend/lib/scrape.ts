// MakerWorld scraping runs in the backend (backend/scraper.js).
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
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL ist nicht gesetzt");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!backendUrl.includes("localhost")) {
    headers["ngrok-skip-browser-warning"] = "true";
  }

  if (process.env.NEXT_PUBLIC_BACKEND_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.NEXT_PUBLIC_BACKEND_TOKEN}`;
  }

  const res = await fetch(`${backendUrl}/scrape`, {
    method: "POST",
    headers,
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Fehler beim Laden von ${url}`);
  }

  return res.json();
}
