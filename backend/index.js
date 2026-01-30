const express = require("express");
const cors = require("cors");
const { scrapeMakerWorld } = require("./scraper");

const app = express();
const port = 3001;

app.use(
  cors({
    origin: "*", // Temporär: Alle erlauben
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ],
  }),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "3D-Printing Backend läuft!",
  });
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
