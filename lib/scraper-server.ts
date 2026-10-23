/* eslint-disable @typescript-eslint/no-explicit-any */
import puppeteer, { type Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import * as cheerio from "cheerio";
import fs from "fs";
import type { PrintProfile, ScrapedData } from "@/lib/scrape";

// Local dev: use an installed Chrome; on Vercel/Linux: bundled serverless chromium
function findLocalChrome(): string | undefined {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ];
  return candidates.find((p) => p && fs.existsSync(p));
}

async function getBrowser(): Promise<Browser> {
  if (process.env.VERCEL) {
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const executablePath = findLocalChrome();
  if (!executablePath) {
    throw new Error("Kein Chrome gefunden. Setze CHROME_PATH in .env");
  }
  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });
}

// Scrape function
export async function scrapeMakerWorld(url: string): Promise<ScrapedData | null> {
  if (!url.includes("makerworld.com")) {
    return null;
  }

  let browser: Browser | null = null;

  try {
    browser = await getBrowser();
    const page = await browser.newPage();

    // Block unnecessary resources to speed up loading
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const resourceType = req.resourceType();
      if (
        ["image", "stylesheet", "font", "media", "other"].includes(resourceType)
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Set a consistent User-Agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );

    // Make window appear normal size
    await page.setViewport({ width: 1920, height: 1080 });

    // Parse profile ID from URL hash if provided
    const hashMatch = url.match(/profileId-(\d+)/i) || url.match(/#(\d+)/);
    const requestedProfileId = hashMatch ? hashMatch[1] : undefined;

    // Go to the URL
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

    // Try fast extraction from __NEXT_DATA__
    const nextDataResult = await page.evaluate((reqProfileId) => {
      const el = document.getElementById("__NEXT_DATA__");
      if (!el) return null;
      try {
        const json = JSON.parse(el.textContent || "{}");
        const design = json.props?.pageProps?.design;
        if (!design) return null;

        const instances = design.instances || [];
        const profiles = instances.map((inst: any) => {
          const rawFilaments = inst.instanceFilaments || [];
          const filamentWeights = rawFilaments.map((f: any) => {
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
          }).filter((f: any) => f.amount > 0);

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

        let selectedId = reqProfileId && profiles.some((p: any) => p.id === reqProfileId)
          ? reqProfileId
          : undefined;

        if (!selectedId) {
          const def = profiles.find((p: any) => p.isDefault);
          selectedId = def ? def.id : profiles[0]?.id;
        }

        const selectedProfile = profiles.find((p: any) => p.id === selectedId) || profiles[0];
        const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute("content");
        const title = (design.titleTranslated || design.title || "").replace(/\| MakerWorld$/i, "").trim();

        return {
          title,
          modelName: title,
          imageUrl: ogImage || design.coverLandscape || design.coverPortrait || design.coverUrl || selectedProfile?.cover,
          printTime: selectedProfile?.printTime,
          selectedProfileId: selectedId,
          profiles,
        };
      } catch (err) {
        console.warn("Failed to parse __NEXT_DATA__:", err);
        return null;
      }
    }, requestedProfileId);

    if (nextDataResult && nextDataResult.profiles && nextDataResult.profiles.length > 0) {
      return nextDataResult;
    }

    // Expand "Load More" for profiles if it exists (German & English support)
    try {
      const wasClicked = await page.evaluate(() => {
        const textToFind = [
          "Klicken Sie hier, um mehr zu sehen",
          "Click here to view more",
        ];
        // Use document.evaluate to find the element
        const xpath = `//span[${textToFind
          .map((t) => `contains(text(), '${t}')`)
          .join(" or ")}]`;
        const result = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        const node = result.singleNodeValue;
        if (node && node instanceof HTMLElement) {
          node.click();
          return true;
        }
        return false;
      });

      if (wasClicked) {
        // Wait briefly for new content
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (e) {
      console.warn("Error attempting to expand profiles:", e);
    }

    // Get the HTML for static parsing (Image, Title, Initial Time)
    const html = await page.content();
    const $ = cheerio.load(html);

    // 1. Image
    // Try Swiper active slide first
    let imageUrl = $(".swiper-slide-active img").first().attr("src");
    // If not found, try any main gallery image that looks like a model photo
    if (!imageUrl) {
      imageUrl = $(".swiper-slide img").first().attr("src");
    }
    // Fallback: OG Image
    if (!imageUrl) {
      imageUrl = $('meta[property="og:image"]').attr("content");
    }

    // Timer Parse Helper
    const parseTime = (text: string) => {
      const lowerTime = text.toLowerCase();
      if (lowerTime.includes("h")) {
        const hours = parseFloat(lowerTime.replace("h", "").trim());
        if (!isNaN(hours)) {
          return Math.round(hours * 60);
        }
      } else if (lowerTime.includes("m")) {
        const mins = parseFloat(lowerTime.replace("m", "").trim());
        if (!isNaN(mins)) {
          return Math.round(mins);
        }
      }
      return undefined;
    };

    // 2. Initial Print Time (fallback)
    const timeText = $(".time").first().text().trim();
    const printTime = parseTime(timeText);

    // 3. Title/Model Name
    let title = $("h1").first().text().trim();
    if (!title) {
      const ogTitle = $('meta[property="og:title"]').attr("content");
      if (ogTitle) title = ogTitle;
    }
    title = title.replace(/\| MakerWorld$/i, "").trim();

    // 4. Profiles with Filament Weights (Puppeteer Interaction)
    const profiles: PrintProfile[] = [];

    const titleHandles = await page.$$(".config_title");

    for (const titleHandle of titleHandles) {
      try {
        // Get name
        const name = await titleHandle.evaluate(
          (el) => el.textContent?.trim() || "",
        );

        // Hover to trigger popover
        await titleHandle.hover();

        // Wait for popover or check if it appears
        try {
          await page.waitForSelector(
            "#mouse-over-popover, .mouse-over-popover",
            { timeout: 1000, visible: true },
          );
        } catch {}

        // Extract grams from popover
        let filamentWeights: { amount: number; color: string }[] = [];
        const popover = await page.$(
          "#mouse-over-popover, .mouse-over-popover",
        );
        if (popover) {
          const filaments = await popover.evaluate((el) => {
            const filamentRows = Array.from(
              el.querySelectorAll(".mw-css-sbssk2"),
            );
            return filamentRows
              .map((row) => {
                const weightText =
                  row.querySelector(".mw-css-1qxtz39")?.textContent || "";
                const weightMatch = weightText.match(/(\d+(?:\.\d+)?)\s*g/);
                const amount = weightMatch ? parseFloat(weightMatch[1]) : 0;

                // Color extraction from style attribute (background: ...)
                const style = row.getAttribute("style") || "";
                let color = "";
                const bgMatch = style.match(/background:\s*([^;]+)/);
                if (bgMatch) {
                  color = bgMatch[1].trim();
                  // Basic RGB parser to convert "rgb(r, g, b)" to "#RRGGBB"
                  if (color.startsWith("rgb")) {
                    const rgb = color.match(/\d+/g);
                    if (rgb && rgb.length >= 3) {
                      const r = parseInt(rgb[0]);
                      const g = parseInt(rgb[1]);
                      const b = parseInt(rgb[2]);
                      color =
                        "#" +
                        ((1 << 24) + (r << 16) + (g << 8) + b)
                          .toString(16)
                          .slice(1)
                          .toUpperCase();
                    }
                  }
                }

                return { amount, color };
              })
              .filter((f: any) => f.amount > 0);
          });

          filamentWeights = filaments;
        }

        // Get time (we have to do this via puppeteer too since we are iterating handles)
        const timeVal = await titleHandle.evaluate((el) => {
          // Traverse up to find a container
          const container =
            el.closest(".mw-css-1age63q") ||
            el.closest(".mw-css-1j0tc12") ||
            el.closest(".mw-css-bxlu7r");
          if (!container) return "";
          const timeEl = container.querySelector(".time");
          return timeEl ? timeEl.textContent?.trim() : "";
        });

        const pTime = timeVal ? parseTime(timeVal) : undefined;

        if (name) {
          // Avoid duplicates if handles overlap
          if (!profiles.find((p) => p.name === name)) {
            profiles.push({
              name,
              printTime: pTime,
              filamentWeights,
            });
          }
        }

        // Move mouse away to close popover potentially
        await page.mouse.move(0, 0);
      } catch (err) {
        console.warn("Error processing a profile handle", err);
      }
    }

    return {
      title,
      modelName: title,
      imageUrl,
      printTime,
      profiles,
    };
  } catch (error) {
    console.error("Error scraping MakerWorld with Puppeteer:", error);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
