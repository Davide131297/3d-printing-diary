import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import fs from "fs";

// Helper to get browser instance
async function getBrowser() {
  const launchOptions = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
    ],
  };

  // Helper to find system browser on Linux (especially for Raspberry Pi ARM)
  if (process.platform === "linux") {
    const possiblePaths = [
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/usr/bin/google-chrome-stable",
    ];

    for (const path of possiblePaths) {
      if (fs.existsSync(path)) {
        console.log(`Using system browser at: ${path}`);
        launchOptions.executablePath = path;
        break;
      }
    }
  }

  return puppeteer.launch(launchOptions);
}

// Scrape function
export async function scrapeMakerWorld(url) {
  if (!url.includes("makerworld.com")) {
    return null;
  }

  let browser = null;

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

    // Go to the URL
    // networkidle2 is often better for SPAs than domcontentloaded + fixed sleep
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // Reduced delay as we wait for network idle now
    // await new Promise((r) => setTimeout(r, 1000));

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
    const parseTime = (text) => {
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
    const profiles = [];

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
        let filamentWeights = [];
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
              .filter((f) => f.amount > 0);
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
