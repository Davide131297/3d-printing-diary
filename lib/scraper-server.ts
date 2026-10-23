/* eslint-disable @typescript-eslint/no-explicit-any */
import * as cheerio from "cheerio";
import type { PrintProfile, ScrapedData } from "@/lib/scrape";

// Reads the model data MakerWorld embeds as JSON in the page HTML
function parseNextData(
  html: string,
  reqProfileId?: string,
): ScrapedData | null {
  const $ = cheerio.load(html);
  const raw = $("#__NEXT_DATA__").text();
  if (!raw) return null;

  try {
    const json = JSON.parse(raw);
    const design = json.props?.pageProps?.design;
    if (!design) return null;

    const instances = design.instances || [];
    const profiles: PrintProfile[] = instances.map((inst: any) => {
      const rawFilaments = inst.instanceFilaments || [];
      const filamentWeights = rawFilaments
        .map((f: any) => {
          let col = f.color || "#CCCCCC";
          if (!col.startsWith("#") && /^[0-9A-Fa-f]{6}$/.test(col)) {
            col = "#" + col;
          }
          return {
            amount: parseFloat(f.usedG) || 0,
            color: col.toUpperCase(),
            material: f.type || "PLA",
            usedM: f.usedM ? String(f.usedM) : undefined,
          };
        })
        .filter((f: any) => f.amount > 0);

      return {
        id: String(inst.id),
        name: inst.titleTranslated || inst.title || `Profil ${inst.id}`,
        printTime: inst.prediction ? Math.round(inst.prediction / 60) : undefined,
        weight: typeof inst.weight === "number" ? inst.weight : undefined,
        cover: inst.cover || undefined,
        isDefault: !!inst.isDefault,
        filamentWeights,
      };
    });

    let selectedId =
      reqProfileId && profiles.some((p) => p.id === reqProfileId)
        ? reqProfileId
        : undefined;
    if (!selectedId) {
      const def = profiles.find((p) => p.isDefault);
      selectedId = def ? def.id : profiles[0]?.id;
    }

    const selectedProfile =
      profiles.find((p) => p.id === selectedId) || profiles[0];
    const ogImage = $('meta[property="og:image"]').attr("content");
    const title = (design.titleTranslated || design.title || "")
      .replace(/\| MakerWorld$/i, "")
      .trim();

    return {
      title,
      modelName: title,
      imageUrl:
        ogImage ||
        design.coverLandscape ||
        design.coverPortrait ||
        design.coverUrl ||
        selectedProfile?.cover,
      printTime: selectedProfile?.printTime,
      selectedProfileId: selectedId,
      profiles,
    };
  } catch (err) {
    console.warn("Failed to parse __NEXT_DATA__:", err);
    return null;
  }
}

function getRequestedProfileId(url: string): string | undefined {
  const hashMatch = url.match(/profileId-(\d+)/i) || url.match(/#(\d+)/);
  return hashMatch ? hashMatch[1] : undefined;
}

// ScrapingBee settings from cheapest to most expensive (credits per success).
// Failed requests are not billed, so we only climb when MakerWorld blocks.
const SCRAPINGBEE_STEPS: {
  credits: number;
  timeoutMs: number;
  params: Record<string, string>;
}[] = [
  { credits: 1, timeoutMs: 12000, params: { render_js: "false" } },
  {
    credits: 10,
    timeoutMs: 18000,
    params: { render_js: "false", premium_proxy: "true" },
  },
  {
    credits: 75,
    timeoutMs: 28000,
    params: { render_js: "true", stealth_proxy: "true", block_resources: "true" },
  },
];

export async function scrapeMakerWorld(url: string): Promise<ScrapedData | null> {
  if (!url.includes("makerworld.com")) {
    return null;
  }
  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  if (!apiKey) {
    throw new Error("SCRAPINGBEE_API_KEY ist nicht gesetzt");
  }

  const requestedProfileId = getRequestedProfileId(url);

  for (const step of SCRAPINGBEE_STEPS) {
    const query = new URLSearchParams({ url, ...step.params });
    try {
      const res = await fetch(`https://app.scrapingbee.com/api/v1/?${query}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(step.timeoutMs),
      });
      const html = await res.text();

      if (res.ok) {
        const data = parseNextData(html, requestedProfileId);
        if (data) {
          console.log(`ScrapingBee succeeded with ${step.credits}-credit setting`);
          return data;
        }
      }

      const title = cheerio.load(html)("title").text();
      console.warn(
        `ScrapingBee ${step.credits}-credit setting failed: status=${res.status} title="${title}"`,
      );
    } catch (err) {
      console.warn(`ScrapingBee ${step.credits}-credit setting errored:`, err);
    }
  }

  return null;
}

