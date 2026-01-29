"use server";

import * as cheerio from "cheerio";

// Define the scraper response type
export type PrintProfile = {
  name: string;
  printTime?: number;
  filamentWeights?: { amount: number; color: string }[];
};

export type ScrapedData = {
  title?: string;
  modelName?: string;
  imageUrl?: string;
  printTime?: number; // in minutes
  profiles?: PrintProfile[];
};

// Helper to get browser instance compatible with Vercel and Local
async function getBrowser() {
  if (process.env.VERCEL) {
    const chromium = await import("@sparticuz/chromium").then(
      (mod) => mod.default,
    );

    const puppeteerCore = await import("puppeteer-core").then(
      (mod) => mod.default,
    );

    // Optional: Load specific font if needed, otherwise default is fine
    // await chromium.font('...');

    return puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  } else {
    const puppeteer = await import("puppeteer").then((mod) => mod.default);
    return puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    });
  }
}

// Helper to extract grams from text

export async function scrapeMakerWorld(
  url: string,
): Promise<ScrapedData | null> {
  if (!url.includes("makerworld.com")) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let browser: any = null;

  try {
    browser = await getBrowser();
    const page = await browser.newPage();

    // Set a consistent User-Agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );

    // Make window appear normal size
    await page.setViewport({ width: 1920, height: 1080 });

    // Go to the URL and wait for network to be idle
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

    // Slight delay to ensure hydration
    await new Promise((r) => setTimeout(r, 2000));

    // Expand "Load More" for profiles if it exists (German & English support)
    try {
      const wasClicked = await page.evaluate(() => {
        const textToFind = [
          "Klicken Sie hier, um mehr zu sehen",
          "Click here to view more",
        ];
        // Use document.evaluate to find the element
        const xpath = `//span[${textToFind.map((t) => `contains(text(), '${t}')`).join(" or ")}]`;
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
        console.log("Found expand profiles button, clicking...");
        // Wait for new profiles to load
        await new Promise((r) => setTimeout(r, 2000));
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

    // Identify profile containers using the class we saw in cheerio
    // We'll maintain the index to match Puppeteer handles
    // Note: The specific class might be tricky if dynamic.
    // Let's use a more robust selector if possible or iterate carefully.
    // The previous cheerio code used .config_title to find them.

    const titleHandles = await page.$$(".config_title");

    for (const titleHandle of titleHandles) {
      try {
        // Get name
        const name = await titleHandle.evaluate(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (el: any) => el.textContent?.trim() || "",
        );

        // Get parent container for time
        // We traverse up to find the container that holds the time
        // Logic: .config_title is inside .mw-css-18c9i04 which is inside .mw-css-1x66f0r which is sibling to .mw-css-dtg2nl (which contains .time)
        // Or we just look for the closest common wrapper.
        // We can just query for .time relative to the handle's container.

        // Let's rely on hovering the titleHandle or its parent to trigger the popover
        await titleHandle.hover();

        // Wait for popover or check if it appears
        // User said id="mouse-over-popover"
        try {
          await page.waitForSelector(
            "#mouse-over-popover, .mouse-over-popover",
            { timeout: 1000, visible: true },
          );
        } catch {
          // Ignore timeout, maybe no popover for this one
        }

        // Extract grams from popover
        let filamentWeights: { amount: number; color: string }[] = [];
        const popover = await page.$(
          "#mouse-over-popover, .mouse-over-popover",
        );
        if (popover) {
          // const html = await popover.evaluate((el) => el.outerHTML);
          // console.log("Popover Found HTML:", html);

          // Improved extraction logic specifically looking for .mw-css-sbssk2 elements
          // which contain both color (bg style or text) and weight
          // Enhanced filament extraction with RGB to Hex conversion
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const filaments = await popover.evaluate((el: any) => {
            const filamentRows = Array.from(
              el.querySelectorAll(".mw-css-sbssk2"),
            );
            return (
              filamentRows
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((row: any) => {
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((f: any) => f.amount > 0)
            );
          });

          filamentWeights = filaments;
        }

        // Get time (we have to do this via puppeteer too since we are iterating handles)
        // Find the time element in the same card.
        // We assume the card containing this title is roughly the parent.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const timeVal = await titleHandle.evaluate((el: any) => {
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
