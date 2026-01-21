"use server";

import * as cheerio from "cheerio";

// Define the scraper response type
export type ScrapedData = {
  title?: string;
  modelName?: string;
  imageUrl?: string;
  printTime?: number; // in minutes
};

// Helper to get browser instance compatible with Vercel and Local
async function getBrowser() {
  if (process.env.VERCEL) {
    // Vercel / Production: Use puppeteer-core + @sparticuz/chromium
    const chromium = await import("@sparticuz/chromium-min").then(
      (mod) => mod.default,
    );
    const puppeteerCore = await import("puppeteer-core").then(
      (mod) => mod.default,
    );

    const executablePath = await chromium.executablePath(
      "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar",
    );

    return puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });
  } else {
    // Local: Use full puppeteer
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

export async function scrapeMakerWorld(
  url: string,
): Promise<ScrapedData | null> {
  if (!url.includes("makerworld.com")) {
    return null;
  }

  let browser = null;

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

    // Get the HTML after JS execution
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

    // 2. Print Time
    const timeText = $(".time").first().text().trim();
    let printTime: number | undefined;

    if (timeText) {
      const lowerTime = timeText.toLowerCase();
      if (lowerTime.includes("h")) {
        const hours = parseFloat(lowerTime.replace("h", "").trim());
        if (!isNaN(hours)) {
          printTime = Math.round(hours * 60);
        }
      } else if (lowerTime.includes("m")) {
        const mins = parseFloat(lowerTime.replace("m", "").trim());
        if (!isNaN(mins)) {
          printTime = Math.round(mins);
        }
      }
    }

    // 3. Title/Model Name
    let title = $("h1").first().text().trim();
    if (!title) {
      const ogTitle = $('meta[property="og:title"]').attr("content");
      if (ogTitle) title = ogTitle;
    }
    title = title.replace(/\| MakerWorld$/i, "").trim();

    return {
      title,
      modelName: title,
      imageUrl,
      printTime,
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
