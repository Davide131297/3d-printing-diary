const express = require("express");
const cors = require("cors");
const { scrapeMakerWorld } = require("./scraper");

const app = express();
const port = 3001;

app.use(
  cors({
    origin: [
      "https://3d-printing-diary-v2-git-external-api-davide131297s-projects.vercel.app",
      "https://3d-printing-diary-v2.vercel.app",
      "https://3d-printing-diary-v2-git-external-api-davide131297s-projects.vercel.app/dashboard/diary",
      "http://localhost:3000",
      "https://computers-phi-negotiation-ron.trycloudflare.com", // Dein Tunnel!
    ],
  }),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("MakerWorld Scraper API is running!");
});

app.post("/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    console.log("Scraping URL:", url);
    const data = await scrapeMakerWorld(url);
    if (!data) {
      return res.status(500).json({ error: "Failed to scrape data" });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
