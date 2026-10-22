import type { ScrapedData } from "@/app/dashboard/diary/scrape";

// Calls the scraper backend and returns the extracted MakerWorld data.
// Throws if the backend is unreachable or returns an error.
export async function fetchMakerWorldData(url: string): Promise<ScrapedData> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_BACKEND_TOKEN}`,
  };

  if (backendUrl && !backendUrl.includes("localhost")) {
    headers["ngrok-skip-browser-warning"] = "true";
  }

  const res = await fetch(`${backendUrl}/scrape`, {
    method: "POST",
    headers,
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    throw new Error(`Scrape failed with status ${res.status}`);
  }

  const data = (await res.json()) as ScrapedData | null;
  if (!data) {
    throw new Error("Scrape returned no data");
  }
  return data;
}
